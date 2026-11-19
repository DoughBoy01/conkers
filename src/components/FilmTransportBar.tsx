import React, { useRef } from "react";
import {
  Captions,
  Pause,
  Play,
  RotateCcw,
  Swords,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { NarrationState } from "../audio/narrationManager.ts";
import {
  getChapterAtTime,
  STORY_CHAPTERS,
  type SubtitleMode,
  TOTAL_FILM_DURATION,
} from "../data/storyboard.ts";

interface FilmTransportBarProps {
  currentTime: number;
  isPlaying: boolean;
  playbackRate: number;
  narrationEnabled: boolean;
  sfxEnabled: boolean;
  subtitleMode: SubtitleMode;
  narrationState: NarrationState;
  activeMode: "film" | "finale";
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onJumpChapter: (startTime: number) => void;
  onRestart: () => void;
  onChangeRate: (rate: number) => void;
  onToggleNarration: () => void;
  onToggleSfx: () => void;
  onChangeSubtitleMode: (mode: SubtitleMode) => void;
  onSetMode: (mode: "film" | "finale") => void;
}

function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
}

export const FilmTransportBar: React.FC<FilmTransportBarProps> = ({
  currentTime,
  isPlaying,
  playbackRate,
  narrationEnabled,
  sfxEnabled,
  subtitleMode,
  narrationState,
  activeMode,
  onTogglePlay,
  onSeek,
  onJumpChapter,
  onRestart,
  onChangeRate,
  onToggleNarration,
  onToggleSfx,
  onChangeSubtitleMode,
  onSetMode,
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const activeChapter = getChapterAtTime(currentTime);
  const progressPct = Math.min(100, (currentTime / TOTAL_FILM_DURATION) * 100);

  const handleTrackPointer = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onSeek(ratio * TOTAL_FILM_DURATION);
  };

  return (
    <div className="mt-4 rounded-xl border border-ink/12 bg-parchment/70 p-4">
      {/* Chapter Scrubber Row */}
      <div className="flex flex-col gap-2.5">
        {/* Chapter Quick-Select Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-vellum p-1 border border-ink/10">
            {STORY_CHAPTERS.map((ch) => {
              const isCurrent =
                activeMode === "film" && activeChapter.id === ch.id;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => onJumpChapter(ch.start)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isCurrent
                      ? "bg-chestnut text-vellum shadow-xs"
                      : "text-bark hover:text-ink hover:bg-parchment/70"
                  }`}
                >
                  <span className="font-mono mr-1 opacity-80">{ch.index}</span>
                  {ch.shortLabel}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() =>
                onSetMode(activeMode === "finale" ? "film" : "finale")
              }
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeMode === "finale"
                  ? "bg-oakmoss text-vellum shadow-xs"
                  : "text-oakmoss hover:bg-parchment/70"
              }`}
            >
              <Swords className="h-3.5 w-3.5" />
              Play Game
            </button>
          </div>

          {/* Honest Narration Loading / Error State */}
          {narrationEnabled && narrationState.status === "loading" && (
            <span className="text-xs text-bark whitespace-nowrap">
              Preparing voiceover...
            </span>
          )}
          {narrationEnabled &&
            narrationState.status === "error" &&
            narrationState.errorMessage && (
              <span
                className="text-xs text-chestnut max-w-xs truncate"
                title={narrationState.errorMessage}
              >
                Voiceover unavailable — playing captions &amp; SFX
              </span>
            )}
        </div>

        {/* Continuous Timeline Scrubber Track */}
        {activeMode === "film" && (
          <div
            ref={trackRef}
            role="slider"
            tabIndex={0}
            aria-label="Film timeline scrubber"
            aria-valuemin={0}
            aria-valuemax={TOTAL_FILM_DURATION}
            aria-valuenow={Math.round(currentTime)}
            onPointerDown={(e) => {
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {
                // Ignore synthetic or unsupported pointer capture
              }
              handleTrackPointer(e.clientX);
            }}
            onPointerMove={(e) => {
              if (e.buttons === 1) handleTrackPointer(e.clientX);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") {
                e.preventDefault();
                onSeek(Math.min(TOTAL_FILM_DURATION, currentTime + 2));
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                onSeek(Math.max(0, currentTime - 2));
              }
            }}
            className="relative h-6 flex items-center cursor-pointer group focus-visible:outline-2 focus-visible:outline-chestnut rounded"
          >
            <div className="relative h-2 w-full rounded-full bg-ink/12 overflow-hidden">
              <div
                className="h-full bg-chestnut transition-[width] duration-75"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Chapter Divider Ticks */}
            {STORY_CHAPTERS.slice(1).map((ch) => (
              <div
                key={ch.id}
                aria-hidden="true"
                className="absolute top-1.5 bottom-1.5 w-0.5 bg-vellum/90 pointer-events-none"
                style={{ left: `${(ch.start / TOTAL_FILM_DURATION) * 100}%` }}
              />
            ))}

            {/* Scrubber Thumb */}
            <div
              className="absolute h-4 w-4 -ml-2 rounded-full border-2 border-vellum bg-chestnut shadow-xs transition-transform group-hover:scale-110 pointer-events-none"
              style={{ left: `${progressPct}%` }}
            />
          </div>
        )}
      </div>

      {/* Transport Actions Row */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-ink/10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (activeMode === "finale") {
                onSetMode("film");
              } else {
                onTogglePlay();
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-vellum transition-colors hover:bg-ink/85 cursor-pointer whitespace-nowrap shrink-0"
          >
            {activeMode === "film" && isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                {activeMode === "finale" ? "Watch Film" : "Play"}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onRestart}
            aria-label="Restart film"
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink/15 bg-vellum px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-parchment cursor-pointer whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restart
          </button>

          <span className="ml-1 font-mono text-xs font-medium text-bark tabular-nums whitespace-nowrap">
            {formatTime(currentTime)} / {formatTime(TOTAL_FILM_DURATION)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleNarration}
            aria-pressed={narrationEnabled}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              narrationEnabled
                ? "border-ink/20 bg-vellum text-ink"
                : "border-transparent bg-transparent text-bark hover:bg-vellum/60"
            }`}
          >
            {narrationEnabled ? (
              <Volume2 className="h-3.5 w-3.5 text-chestnut" />
            ) : (
              <VolumeX className="h-3.5 w-3.5" />
            )}
            Narration
          </button>

          <button
            type="button"
            onClick={onToggleSfx}
            aria-pressed={sfxEnabled}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              sfxEnabled
                ? "border-ink/20 bg-vellum text-ink"
                : "border-transparent bg-transparent text-bark hover:bg-vellum/60"
            }`}
          >
            SFX {sfxEnabled ? "On" : "Off"}
          </button>

          <div
            className="flex items-center rounded-lg border border-ink/12 bg-vellum p-0.5"
            role="group"
            aria-label="Subtitle language"
          >
            <span className="inline-flex items-center gap-1 px-2 text-xs text-bark">
              <Captions className="h-3.5 w-3.5" />
            </span>
            {(
              [
                { id: "both", label: "EN + རྫོང་ཁ" },
                { id: "en", label: "EN" },
                { id: "dz", label: "རྫོང་ཁ" },
                { id: "off", label: "Off" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeSubtitleMode(opt.id)}
                aria-pressed={subtitleMode === opt.id}
                style={
                  opt.id === "both" || opt.id === "dz"
                    ? { fontFamily: "var(--font-dzongkha), var(--font-sans)" }
                    : undefined
                }
                className={`rounded-md px-2 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  subtitleMode === opt.id
                    ? "bg-chestnut text-vellum"
                    : "text-bark hover:text-ink"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center rounded-lg border border-ink/12 bg-vellum p-0.5">
            {[0.75, 1, 1.25].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => onChangeRate(rate)}
                className={`rounded-md px-2 py-1 font-mono text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  playbackRate === rate
                    ? "bg-ink text-vellum"
                    : "text-bark hover:text-ink"
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
