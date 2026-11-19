import { STORY_CHAPTERS, type ChapterId } from "../data/storyboard.ts";

export type NarrationStatus = "idle" | "loading" | "ready" | "error";

export interface NarrationState {
  status: NarrationStatus;
  errorMessage: string | null;
}

class NarrationManager {
  private ctx: AudioContext | null = null;
  private rawCache = new Map<ChapterId, ArrayBuffer>();
  private bufferCache = new Map<ChapterId, AudioBuffer>();
  private loadingPromises = new Map<ChapterId, Promise<ArrayBuffer>>();
  private activeSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private activeChapterId: ChapterId | null = null;
  private enabled = true;
  private playbackRate = 1;
  private status: NarrationStatus = "idle";
  private errorMessage: string | null = null;
  private listeners = new Set<(state: NarrationState) => void>();
  private syncToken = 0;

  public subscribe(listener: (state: NarrationState) => void): () => void {
    this.listeners.add(listener);
    listener({ status: this.status, errorMessage: this.errorMessage });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    const snapshot: NarrationState = {
      status: this.status,
      errorMessage: this.errorMessage,
    };
    this.listeners.forEach((fn) => fn(snapshot));
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.value = this.enabled ? 1 : 0;
        this.gainNode.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") {
        void this.ctx.resume().catch(() => undefined);
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public unlock(): void {
    this.ensureContext();
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(enabled ? 1 : 0, this.ctx.currentTime);
    }
    if (!enabled) {
      this.pause();
    }
  }

  public setPlaybackRate(rate: number): void {
    this.playbackRate = rate;
    if (this.activeSource && this.ctx) {
      this.activeSource.playbackRate.setValueAtTime(rate, this.ctx.currentTime);
    }
  }

  public async preloadAll(): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      await this.fetchRawAudio("harvest");
      for (const chapter of STORY_CHAPTERS) {
        if (chapter.id !== "harvest") {
          void this.fetchRawAudio(chapter.id).catch(() => undefined);
        }
      }
    } catch {
      // Status propagated via listeners
    }
  }

  private async fetchRawAudio(chapterId: ChapterId): Promise<ArrayBuffer> {
    const cached = this.rawCache.get(chapterId);
    if (cached) return cached;

    const pending = this.loadingPromises.get(chapterId);
    if (pending) return pending;

    this.status = "loading";
    this.errorMessage = null;
    this.emit();

    const task = (async () => {
      try {
        const res = await fetch(
          `/api/narration?chapterId=${encodeURIComponent(chapterId)}`
        );
        if (!res.ok) {
          let detail = "Voiceover narration unavailable.";
          try {
            const payload = (await res.json()) as { error?: string };
            if (payload.error) detail = payload.error;
          } catch {
            // Keep default message
          }
          throw new Error(detail);
        }

        const arrayBuf = await res.arrayBuffer();
        this.rawCache.set(chapterId, arrayBuf);
        this.status = "ready";
        this.errorMessage = null;
        this.emit();
        return arrayBuf;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to load narration.";
        this.status = "error";
        this.errorMessage = msg;
        this.emit();
        throw err;
      } finally {
        this.loadingPromises.delete(chapterId);
      }
    })();

    this.loadingPromises.set(chapterId, task);
    return task;
  }

  private async getDecodedBuffer(chapterId: ChapterId): Promise<AudioBuffer> {
    const cached = this.bufferCache.get(chapterId);
    if (cached) return cached;

    const raw = await this.fetchRawAudio(chapterId);
    const ctx = this.ensureContext();
    if (!ctx) {
      throw new Error("Web Audio is unavailable in this browser.");
    }
    const decoded = await ctx.decodeAudioData(raw.slice(0));
    this.bufferCache.set(chapterId, decoded);
    return decoded;
  }

  private stopActiveSource(): void {
    if (this.activeSource) {
      try {
        this.activeSource.onended = null;
        this.activeSource.stop();
        this.activeSource.disconnect();
      } catch {
        // Already stopped
      }
      this.activeSource = null;
    }
  }

  private startBuffer(
    chapterId: ChapterId,
    buffer: AudioBuffer,
    offsetSec: number
  ): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.gainNode) return;

    this.stopActiveSource();
    const safeOffset = Number.isFinite(offsetSec) ? Math.max(0, offsetSec) : 0;
    if (safeOffset >= buffer.duration - 0.15) return;

    try {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.playbackRate.value = this.playbackRate;
      src.connect(this.gainNode);
      src.onended = () => {
        if (this.activeSource === src) {
          this.activeSource = null;
        }
      };
      src.start(0, safeOffset);
      this.activeSource = src;
      this.activeChapterId = chapterId;
    } catch {
      this.activeSource = null;
    }
  }

  public async syncToChapter(
    chapterId: ChapterId,
    chapterElapsedSec: number,
    isPlaying: boolean
  ): Promise<void> {
    if (!this.enabled || !isPlaying) {
      this.pause();
      return;
    }

    if (this.activeChapterId === chapterId && this.activeSource) {
      return;
    }

    // Do not replay a chapter whose audio already finished naturally
    if (
      this.activeChapterId === chapterId &&
      !this.activeSource &&
      chapterElapsedSec > 0.6
    ) {
      return;
    }

    const token = ++this.syncToken;
    this.activeChapterId = chapterId;

    try {
      const buffer = await this.getDecodedBuffer(chapterId);
      if (
        token !== this.syncToken ||
        this.activeChapterId !== chapterId ||
        !this.enabled
      ) {
        return;
      }
      this.startBuffer(chapterId, buffer, chapterElapsedSec);
    } catch {
      // Status propagated via listeners
    }
  }

  public seekWithinChapter(
    chapterId: ChapterId,
    chapterElapsedSec: number,
    isPlaying: boolean
  ): void {
    this.syncToken++;
    this.activeChapterId = chapterId;
    this.stopActiveSource();
    if (!isPlaying || !this.enabled) return;

    const cached = this.bufferCache.get(chapterId);
    if (cached) {
      this.startBuffer(chapterId, cached, chapterElapsedSec);
    } else {
      void this.syncToChapter(chapterId, chapterElapsedSec, true);
    }
  }

  public pause(): void {
    this.syncToken++;
    this.stopActiveSource();
    this.activeChapterId = null;
  }

  public stop(): void {
    this.syncToken++;
    this.stopActiveSource();
    this.activeChapterId = null;
  }
}

export const narrationManager = new NarrationManager();
