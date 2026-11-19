// iOS Safari helpers for Web Audio.
//
// 1. Web Audio output is silenced by the iPhone ringer (mute) switch, while an
//    HTML <audio> element is not. Looping a silent <audio> element, started from
//    a user gesture, moves the page onto the "playback" audio session so Web
//    Audio is audible with the switch on silent. navigator.audioSession does the
//    same on newer iOS versions.
// 2. iOS can leave an AudioContext in an "interrupted" state (phone call, lock
//    screen, tab switch) that code checking only for "suspended" never recovers
//    from. We resume any context that is not running on the next touch.

type AnyContext = AudioContext & { state: AudioContextState | "interrupted" };

const contexts = new Set<AnyContext>();
let silentEl: HTMLAudioElement | null = null;
let listenersInstalled = false;

function makeSilentWavUrl(): string {
  const sampleRate = 8000;
  const samples = 800; // 0.1 s of silence, looped
  const buf = new ArrayBuffer(44 + samples);
  const v = new DataView(buf);
  const w = (o: number, s: string) =>
    [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF");
  v.setUint32(4, 36 + samples, true);
  w(8, "WAVEfmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate, true);
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true);
  w(36, "data");
  v.setUint32(40, samples, true);
  new Uint8Array(buf, 44).fill(128); // 8-bit silence
  return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
}

function resumeAll(): void {
  contexts.forEach((ctx) => {
    if (ctx.state !== "running" && ctx.state !== "closed") {
      void ctx.resume().catch(() => undefined);
    }
  });
  if (silentEl && silentEl.paused) {
    void silentEl.play().catch(() => undefined);
  }
}

function installListeners(): void {
  if (listenersInstalled || typeof document === "undefined") return;
  listenersInstalled = true;
  for (const type of ["pointerdown", "touchend", "click", "keydown"]) {
    document.addEventListener(type, resumeAll, { passive: true, capture: true });
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") resumeAll();
  });
  window.addEventListener("pageshow", resumeAll);
}

/** Call from inside a user gesture (tap) every time audio is unlocked. */
export function unlockIosAudioSession(): void {
  if (typeof window === "undefined") return;
  installListeners();
  try {
    const session = (navigator as unknown as { audioSession?: { type: string } })
      .audioSession;
    if (session) session.type = "playback";
  } catch {
    // Not supported
  }
  try {
    if (!silentEl) {
      silentEl = document.createElement("audio");
      silentEl.src = makeSilentWavUrl();
      silentEl.loop = true;
      silentEl.setAttribute("playsinline", "");
      silentEl.setAttribute("x-webkit-airplay", "deny");
      silentEl.preload = "auto";
      silentEl.style.display = "none";
      silentEl.setAttribute("aria-hidden", "true");
      document.body.appendChild(silentEl);
    }
    if (silentEl.paused) void silentEl.play().catch(() => undefined);
  } catch {
    // Autoplay blocked or unsupported; Web Audio still works with the switch on ring
  }
}

/** Register a context so it is resumed after iOS interruptions. */
export function trackContext(ctx: AudioContext): void {
  contexts.add(ctx as AnyContext);
  installListeners();
}

/** Play one silent sample; some iOS versions only unlock output after a sound starts. */
export function primeContext(ctx: AudioContext): void {
  try {
    const src = ctx.createBufferSource();
    src.buffer = ctx.createBuffer(1, 1, 22050);
    src.connect(ctx.destination);
    src.start(0);
  } catch {
    // Ignore
  }
}
