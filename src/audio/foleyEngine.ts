import type { FoleyCueType } from "../data/storyboard.ts";
import { primeContext, trackContext, unlockIosAudioSession } from "./iosAudio.ts";

class FoleyEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;

  private ensureContext(): AudioContext | null {
    if (!this.enabled || typeof window === "undefined") return null;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
        trackContext(this.ctx);
        primeContext(this.ctx);
      }
      if (this.ctx.state !== "running") {
        void this.ctx.resume().catch(() => undefined);
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public unlock(): void {
    unlockIosAudioSession();
    this.ensureContext();
  }

  public trigger(type: FoleyCueType, intensity = 0.85): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const safeIntensity = Math.max(
      0.05,
      Math.min(1.5, Number.isFinite(intensity) ? intensity : 0.85)
    );

    try {
      switch (type) {
        case "breeze":
          this.playBreeze(ctx, safeIntensity);
          break;
        case "thud":
          this.playThud(ctx, safeIntensity);
          break;
        case "bore":
          this.playBore(ctx, safeIntensity);
          break;
        case "thread":
          this.playThread(ctx, safeIntensity);
          break;
        case "whoosh":
          this.playWhoosh(ctx, safeIntensity);
          break;
        case "clack":
          this.playClack(ctx, safeIntensity);
          break;
        case "crack":
          this.playCrack(ctx, safeIntensity);
          break;
        case "shatter":
          this.playShatter(ctx, safeIntensity);
          break;
        case "chime":
          this.playChime(ctx, safeIntensity);
          break;
      }
    } catch {
      // Ignore Web Audio errors on restricted devices
    }
  }

  private createNoiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * durationSec);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.05 * white) / 1.05;
      data[i] = lastOut * 2.8;
    }
    return buffer;
  }

  private playBreeze(ctx: AudioContext, intensity: number): void {
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.createNoiseBuffer(ctx, 1.8);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(520, now);
    filter.frequency.exponentialRampToValueAtTime(920, now + 0.9);
    filter.frequency.exponentialRampToValueAtTime(400, now + 1.8);
    filter.Q.value = 1.4;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.11 * intensity, now + 0.45);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(now);
    src.stop(now + 1.82);
  }

  private playThud(ctx: AudioContext, intensity: number): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.14);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18 * intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  private playBore(ctx: AudioContext, intensity: number): void {
    const now = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const t = now + i * 0.24;
      const src = ctx.createBufferSource();
      src.buffer = this.createNoiseBuffer(ctx, 0.18);

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(950 + i * 180, t);
      filter.Q.value = 3.2;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.12 * intensity, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.17);

      src.connect(filter).connect(gain).connect(ctx.destination);
      src.start(t);
      src.stop(t + 0.18);
    }
  }

  private playThread(ctx: AudioContext, intensity: number): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.11);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08 * intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  private playWhoosh(ctx: AudioContext, intensity: number): void {
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.createNoiseBuffer(ctx, 0.36);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(280, now);
    filter.frequency.exponentialRampToValueAtTime(1600, now + 0.18);
    filter.frequency.exponentialRampToValueAtTime(420, now + 0.35);
    filter.Q.value = 1.6;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.15 * intensity, now + 0.14);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(now);
    src.stop(now + 0.37);
  }

  private playClack(ctx: AudioContext, intensity: number): void {
    const now = ctx.currentTime;

    // Dual woody resonant knock (chestnut shell timbre)
    const freqs = [880, 1420];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx === 0 ? "triangle" : "sine";
      osc.frequency.setValueAtTime(f * (0.96 + Math.random() * 0.08), now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.45, now + 0.065);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime((idx === 0 ? 0.32 : 0.2) * intensity, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.075);
    });

    // Crisp transient click
    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(ctx, 0.03);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1200;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.22 * intensity, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    noise.connect(hp).connect(ng).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.03);
  }

  private playCrack(ctx: AudioContext, intensity: number): void {
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.createNoiseBuffer(ctx, 0.14);

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(2400, now);
    bp.Q.value = 1.8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.32 * intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    src.connect(bp).connect(gain).connect(ctx.destination);
    src.start(now);
    src.stop(now + 0.13);
  }

  private playShatter(ctx: AudioContext, intensity: number): void {
    this.playCrack(ctx, intensity);
    const now = ctx.currentTime;
    [0.06, 0.14, 0.23].forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(720 - idx * 140, now + offset);
      osc.frequency.exponentialRampToValueAtTime(240, now + offset + 0.07);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.14 * intensity, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.075);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.08);
    });
  }

  private playChime(ctx: AudioContext, intensity: number): void {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.07;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.11 * intensity, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.55);

      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.56);
    });
  }
}

export const foleyEngine = new FoleyEngine();
