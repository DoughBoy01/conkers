import { useCallback, useEffect, useRef, useState } from "react";
import { foleyEngine } from "./audio/foleyEngine.ts";
import {
  narrationManager,
  type NarrationState,
} from "./audio/narrationManager.ts";
import { FilmTransportBar } from "./components/FilmTransportBar.tsx";
import { PlayableFinale } from "./components/PlayableFinale.tsx";
import { RulesStrip } from "./components/RulesStrip.tsx";
import { StageErrorBoundary } from "./components/StageErrorBoundary.tsx";
import { StorybookScenes } from "./components/StorybookScenes.tsx";
import {
  FOLEY_CUES,
  getChapterAtTime,
  type SubtitleMode,
  TOTAL_FILM_DURATION,
} from "./data/storyboard.ts";

export default function App() {
  const [activeMode, setActiveMode] = useState<"film" | "finale">("film");
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [narrationEnabled, setNarrationEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [subtitleMode, setSubtitleMode] = useState<SubtitleMode>("both");
  const [narrationState, setNarrationState] = useState<NarrationState>({
    status: "idle",
    errorMessage: null,
  });

  const currentTimeRef = useRef(0);
  const lastFrameRef = useRef<number | null>(null);
  const firedCuesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribe = narrationManager.subscribe(setNarrationState);
    void narrationManager.preloadAll();
    return unsubscribe;
  }, []);

  useEffect(() => {
    foleyEngine.setEnabled(sfxEnabled);
  }, [sfxEnabled]);

  useEffect(() => {
    narrationManager.setEnabled(narrationEnabled);
  }, [narrationEnabled]);

  useEffect(() => {
    narrationManager.setPlaybackRate(playbackRate);
  }, [playbackRate]);

  // Pre-seed fired cues whenever seeking manually so past cues don't replay
  const markPriorCuesFired = useCallback((time: number) => {
    const next = new Set<string>();
    for (const cue of FOLEY_CUES) {
      if (cue.time < time) {
        next.add(cue.id);
      }
    }
    firedCuesRef.current = next;
  }, []);

  // Main 60fps timeline loop
  useEffect(() => {
    if (!isPlaying || activeMode !== "film") {
      lastFrameRef.current = null;
      return;
    }

    let rafId: number;
    const step = (ts: number) => {
      if (lastFrameRef.current === null) {
        lastFrameRef.current = ts;
      }
      const dt = Math.min(0.1, (ts - lastFrameRef.current) / 1000);
      lastFrameRef.current = ts;

      const prevTime = currentTimeRef.current;
      const nextTime = Math.min(
        TOTAL_FILM_DURATION,
        prevTime + dt * playbackRate
      );
      currentTimeRef.current = nextTime;
      setCurrentTime(nextTime);

      // Trigger any foley cues crossed during this frame
      for (const cue of FOLEY_CUES) {
        if (
          cue.time >= prevTime &&
          cue.time <= nextTime &&
          !firedCuesRef.current.has(cue.id)
        ) {
          firedCuesRef.current.add(cue.id);
          foleyEngine.trigger(cue.type, cue.intensity);
        }
      }

      const chapter = getChapterAtTime(nextTime);
      void narrationManager.syncToChapter(
        chapter.id,
        nextTime - chapter.start,
        true
      );

      if (nextTime >= TOTAL_FILM_DURATION) {
        setIsPlaying(false);
        return;
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, activeMode, playbackRate]);

  // Pause narration when user pauses mid-film or enters Finale (not when reaching natural end)
  useEffect(() => {
    if (
      activeMode !== "film" ||
      (!isPlaying && currentTimeRef.current < TOTAL_FILM_DURATION - 0.05)
    ) {
      narrationManager.pause();
    }
  }, [isPlaying, activeMode]);

  const handleStartFilm = useCallback(() => {
    foleyEngine.unlock();
    narrationManager.unlock();
    void narrationManager.preloadAll();
    setActiveMode("film");
    setHasStarted(true);
    if (currentTimeRef.current >= TOTAL_FILM_DURATION - 0.1) {
      currentTimeRef.current = 0;
      setCurrentTime(0);
      firedCuesRef.current.clear();
    }
    setIsPlaying(true);
  }, []);

  const handleTogglePlay = useCallback(() => {
    foleyEngine.unlock();
    narrationManager.unlock();
    if (!hasStarted) {
      handleStartFilm();
      return;
    }
    if (currentTimeRef.current >= TOTAL_FILM_DURATION - 0.1) {
      currentTimeRef.current = 0;
      setCurrentTime(0);
      firedCuesRef.current.clear();
      setIsPlaying(true);
      return;
    }
    setIsPlaying((prev) => !prev);
  }, [hasStarted, handleStartFilm]);

  const handleSeek = useCallback(
    (targetTime: number) => {
      narrationManager.unlock();
      const clamped = Math.max(0, Math.min(TOTAL_FILM_DURATION, targetTime));
      currentTimeRef.current = clamped;
      setCurrentTime(clamped);
      setHasStarted(true);
      markPriorCuesFired(clamped);
      const chapter = getChapterAtTime(clamped);
      narrationManager.seekWithinChapter(
        chapter.id,
        clamped - chapter.start,
        isPlaying
      );
    },
    [isPlaying, markPriorCuesFired]
  );

  const handleJumpChapter = useCallback(
    (startTime: number) => {
      foleyEngine.unlock();
      narrationManager.unlock();
      void narrationManager.preloadAll();
      setActiveMode("film");
      setHasStarted(true);
      currentTimeRef.current = startTime;
      setCurrentTime(startTime);
      markPriorCuesFired(startTime);
      setIsPlaying(true);
      const chapter = getChapterAtTime(startTime);
      narrationManager.seekWithinChapter(chapter.id, 0, true);
    },
    [markPriorCuesFired]
  );

  const handleRestart = useCallback(() => {
    foleyEngine.unlock();
    narrationManager.unlock();
    void narrationManager.preloadAll();
    setActiveMode("film");
    setHasStarted(true);
    currentTimeRef.current = 0;
    setCurrentTime(0);
    firedCuesRef.current.clear();
    narrationManager.stop();
    setIsPlaying(true);
  }, []);

  const handleSetMode = useCallback((mode: "film" | "finale") => {
    foleyEngine.unlock();
    if (mode === "finale") {
      setIsPlaying(false);
      narrationManager.pause();
    }
    setActiveMode(mode);
  }, []);

  const activeChapter = getChapterAtTime(currentTime);

  return (
    <div className="min-h-screen bg-vellum text-ink flex flex-col">
      {/* Clean 3-Zone Top Bar Contract */}
      <header className="border-b border-ink/10 bg-vellum">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-8 px-6 py-4">
          <a
            href="#stage"
            className="font-display text-xl font-bold tracking-tight text-ink whitespace-nowrap shrink-0"
          >
            Conkers
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-bark">
            <a
              href="#stage"
              onClick={() => handleSetMode("film")}
              className="hover:text-ink hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Watch Film
            </a>
            <a
              href="#rules"
              className="hover:text-ink hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              The Rules
            </a>
            <a
              href="#ranks"
              className="hover:text-ink hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Rank Tally
            </a>
          </nav>

          <button
            type="button"
            onClick={() =>
              handleSetMode(activeMode === "finale" ? "film" : "finale")
            }
            className="rounded-lg bg-chestnut px-4 py-2 text-xs font-semibold text-vellum transition-colors hover:bg-chestnut-deep cursor-pointer whitespace-nowrap shrink-0"
          >
            {activeMode === "finale" ? "Return to Film" : "Play Finale"}
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main id="stage" className="mx-auto w-full max-w-5xl flex-1 px-6 py-8 md:py-10">
        {/* Concise Editorial Intro */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-bark">
              English Folklore · Animated Short &amp; Interactive Duel
            </p>
            <h1 className="mt-1 font-display text-3xl md:text-4xl font-semibold tracking-tight text-ink">
              The Autumn Game of Conkers
            </h1>
          </div>
          <p className="font-mono text-xs text-bark tabular-nums whitespace-nowrap">
            {activeMode === "finale"
              ? "Interactive Mode · Village Green"
              : `${activeChapter.index}. ${activeChapter.title}`}
          </p>
        </div>

        {/* Dominant 16:9 Theater Stage */}
        <StageErrorBoundary
          resetKey={activeMode}
          onReset={() => handleSetMode("film")}
        >
          {activeMode === "film" ? (
            <StorybookScenes
              currentTime={currentTime}
              isPlaying={isPlaying}
              hasStarted={hasStarted}
              subtitleMode={subtitleMode}
              onStartFilm={handleStartFilm}
              onReplayFilm={handleRestart}
              onEnterFinale={() => handleSetMode("finale")}
            />
          ) : (
            <PlayableFinale onBackToFilm={() => handleSetMode("film")} />
          )}
        </StageErrorBoundary>

        {/* Scrubber & Audio Transport Controls */}
        <FilmTransportBar
          currentTime={currentTime}
          isPlaying={isPlaying}
          playbackRate={playbackRate}
          narrationEnabled={narrationEnabled}
          sfxEnabled={sfxEnabled}
          subtitleMode={subtitleMode}
          narrationState={narrationState}
          activeMode={activeMode}
          onTogglePlay={handleTogglePlay}
          onSeek={handleSeek}
          onJumpChapter={handleJumpChapter}
          onRestart={handleRestart}
          onChangeRate={setPlaybackRate}
          onToggleNarration={() => setNarrationEnabled((v) => !v)}
          onToggleSfx={() => setSfxEnabled((v) => !v)}
          onChangeSubtitleMode={setSubtitleMode}
          onSetMode={handleSetMode}
        />

        {/* Illustrated Rules & Rank Ladder Reference */}
        <RulesStrip
          activeChapterId={activeChapter.id}
          onJumpToChapter={handleJumpChapter}
        />
      </main>

      <footer className="mt-16 border-t border-ink/10 py-6 text-center text-xs text-bark">
        Conkers: An Illustrated Guide · Horse Chestnut Folklore from England
      </footer>
    </div>
  );
}
