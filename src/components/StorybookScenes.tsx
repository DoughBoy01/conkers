import React, { useState } from "react";
import { Play, RotateCcw, Swords } from "lucide-react";
import {
  getActiveCaption,
  getChapterAtTime,
  ILLUSTRATION_ASSETS,
  type SubtitleMode,
  TOTAL_FILM_DURATION,
} from "../data/storyboard.ts";
import { ConkerIllustration } from "./ConkerIllustration.tsx";
import { StorybookHand } from "./StorybookHand.tsx";

interface StorybookScenesProps {
  currentTime: number;
  isPlaying: boolean;
  hasStarted: boolean;
  subtitleMode: SubtitleMode;
  onStartFilm: () => void;
  onReplayFilm: () => void;
  onEnterFinale: () => void;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function easeOutCubic(x: number): number {
  const t = clamp01(x);
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(x: number): number {
  const t = clamp01(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutBounce(x: number): number {
  const t = clamp01(x);
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) {
    const u = t - 1.5 / d1;
    return n1 * u * u + 0.75;
  }
  if (t < 2.5 / d1) {
    const u = t - 2.25 / d1;
    return n1 * u * u + 0.9375;
  }
  const u = t - 2.625 / d1;
  return n1 * u * u + 0.984375;
}

export const StorybookScenes: React.FC<StorybookScenesProps> = ({
  currentTime,
  isPlaying,
  hasStarted,
  subtitleMode,
  onStartFilm,
  onReplayFilm,
  onEnterFinale,
}) => {
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const chapter = getChapterAtTime(currentTime);
  const caption = subtitleMode !== "off" ? getActiveCaption(currentTime) : null;
  const isFinished = hasStarted && !isPlaying && currentTime >= TOTAL_FILM_DURATION - 0.05;

  const markError = (key: string) => {
    setImgErrors((prev) => ({ ...prev, [key]: true }));
  };

  // Determine backdrop opacities for seamless crossfades (11s, 21s)
  const woodlandOpacity =
    currentTime < 10.4
      ? 1
      : currentTime < 11.4
        ? 1 - (currentTime - 10.4)
        : 0;
  const workbenchOpacity =
    currentTime >= 10.4 && currentTime < 21.4
      ? currentTime < 11.4
        ? currentTime - 10.4
        : currentTime > 20.4
          ? 1 - (currentTime - 20.4)
          : 1
      : 0;
  const villageOpacity =
    currentTime >= 20.4
      ? currentTime < 21.4
        ? currentTime - 20.4
        : 1
      : 0;

  // Show poster overlay only before user starts watching
  const showTitlePoster = !hasStarted && currentTime === 0;

  const captionBox = (
          <div className="max-w-2xl rounded-lg bg-ink/90 px-4 py-2.5 md:px-5 text-center shadow-md backdrop-blur-xs">
            {subtitleMode !== "dz" && (
              <p className="text-sm md:text-base font-medium leading-snug text-vellum">
                {caption?.en}
              </p>
            )}
            {subtitleMode !== "en" && (
              <p
                lang="dz"
                style={{ fontFamily: "var(--font-dzongkha)" }}
                className={`text-sm md:text-base font-medium leading-relaxed text-parchment/95 ${
                  subtitleMode === "both"
                    ? "mt-1.5 border-t border-vellum/15 pt-1.5"
                    : ""
                }`}
              >
                {caption?.dz}
              </p>
            )}
          </div>
  );

  const posterCopy = (
    <>
            <p className="text-xs font-medium tracking-wide text-chestnut">
              An English Autumn Tradition · 0:54 Animated Explainer
            </p>
            <h2 className="mt-1 md:mt-2 max-w-md font-display text-2xl md:text-5xl font-semibold tracking-tight text-ink">
              How to Play Conkers
            </h2>
            <p className="mt-2 md:mt-3 max-w-md text-sm md:text-base leading-relaxed text-bark">
              Follow the journey of a humble horse chestnut from autumn tree to
              playground champion—then test your swing in the backyard finale.
            </p>
            <div className="mt-4 md:mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onStartFilm}
                className="inline-flex items-center gap-2.5 rounded-lg bg-chestnut px-5 py-2.5 text-sm font-semibold text-vellum shadow-sm transition-colors hover:bg-chestnut-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chestnut cursor-pointer whitespace-nowrap shrink-0"
              >
                <Play className="h-4 w-4 fill-current" />
                Play Short Film
              </button>
              <button
                type="button"
                onClick={onEnterFinale}
                className="inline-flex items-center gap-2 rounded-lg border border-ink/20 bg-vellum/90 px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-parchment focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink cursor-pointer whitespace-nowrap shrink-0"
              >
                <Swords className="h-4 w-4" />
                Play Game
              </button>
            </div>
    </>
  );

  const finishBanner = (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-ink/15 bg-vellum/96 px-5 py-3.5 shadow-lg backdrop-blur-xs">
            <div className="text-left">
              <p className="font-mono text-xs font-medium text-oakmoss">
                Film Complete
              </p>
              <p className="font-display text-base font-semibold text-ink">
                Ready to try a match at arm&apos;s length?
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onEnterFinale}
                className="inline-flex items-center gap-2 rounded-lg bg-chestnut px-4 py-2 text-xs font-semibold text-vellum transition-colors hover:bg-chestnut-deep cursor-pointer whitespace-nowrap shrink-0"
              >
                <Swords className="h-3.5 w-3.5" />
                Play Game
              </button>
              <button
                type="button"
                onClick={onReplayFilm}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink/20 bg-parchment px-3.5 py-2 text-xs font-medium text-ink transition-colors hover:bg-vellum cursor-pointer whitespace-nowrap shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Replay
              </button>
            </div>
          </div>
  );

  return (
    <div className="relative w-full md:aspect-video overflow-hidden rounded-xl border border-ink/15 bg-parchment shadow-sm select-none">
     {/* Stage: 16:9 on every screen size. Text overlays sit on it from md up; on phones they move to the panel below. */}
     <div className="relative aspect-video overflow-hidden md:absolute md:inset-0">
      {/* Fallback textured paper canvas */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 35%, #FAF8F2 0%, #EFECE4 72%, #E3DDD0 100%)",
        }}
      />

      {/* Watercolor Backdrops with zero-broken-image fallbacks */}
      {!imgErrors.woodland && woodlandOpacity > 0 && (
        <img
          src={ILLUSTRATION_ASSETS.woodland}
          alt="English horse chestnut lane in autumn watercolor"
          referrerPolicy="no-referrer"
          onError={() => markError("woodland")}
          style={{ opacity: woodlandOpacity * 0.94 }}
          className="absolute inset-0 h-full w-full object-cover pointer-events-none"
        />
      )}

      {!imgErrors.workbench && workbenchOpacity > 0 && (
        <img
          src={ILLUSTRATION_ASSETS.workbench}
          alt="Oak cottage garden workbench watercolor"
          referrerPolicy="no-referrer"
          onError={() => markError("workbench")}
          style={{ opacity: workbenchOpacity * 0.95 }}
          className="absolute inset-0 h-full w-full object-cover pointer-events-none"
        />
      )}

      {!imgErrors.village && villageOpacity > 0 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: villageOpacity }}
        >
          <img
            src={ILLUSTRATION_ASSETS.villageGreen}
            alt="English village green in October watercolor"
            referrerPolicy="no-referrer"
            onError={() => markError("village")}
            className="h-full w-full object-cover object-top scale-[1.06]"
          />
          {/* Soft parchment sky wash so animated hands & strings read cleanly */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 84% 66% at 50% 42%, rgba(247, 246, 242, 0.92) 0%, rgba(247, 246, 242, 0.78) 58%, rgba(247, 246, 242, 0.15) 100%)",
            }}
          />
        </div>
      )}

      {/* Subtle archival inner frame border */}
      <div className="absolute inset-2.5 rounded-lg border border-ink/10 pointer-events-none z-10" />

      {/* Live 60fps Animated SVG Stage */}
      <svg
        viewBox="0 0 960 540"
        className="absolute inset-0 h-full w-full z-10 pointer-events-none"
        aria-label={`Animated scene: ${chapter.title}`}
      >
        <defs>
          <filter id="ink-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="4"
              floodColor="#1C1917"
              floodOpacity="0.16"
            />
          </filter>
        </defs>

        {/* CHAPTER 1: THE AUTUMN HARVEST (0s - 11s) */}
        {currentTime < 11.2 && (
          <SceneHarvest t={currentTime} opacity={woodlandOpacity} />
        )}

        {/* CHAPTER 2: HOLE & KNOT (11s - 21s) */}
        {currentTime >= 10.6 && currentTime < 21.2 && (
          <SceneHoleAndKnot t={currentTime} opacity={workbenchOpacity} />
        )}

        {/* CHAPTER 3: HOLD STILL & SWING (21s - 32s) */}
        {currentTime >= 20.6 && currentTime < 32.3 && (
          <SceneHoldStillAndSwing t={currentTime} />
        )}

        {/* CHAPTER 4: SWAP & STRIKE (32s - 42s) */}
        {currentTime >= 31.8 && currentTime < 42.2 && (
          <SceneSwapTurns t={currentTime} />
        )}

        {/* CHAPTER 5: ONE-ER, TWO-ER (42s - 54s) */}
        {currentTime >= 41.8 && <SceneVictorCount t={currentTime} />}
      </svg>

      {/* Chapter Title Pill-Free Top-Left Storybook Header */}
      {!showTitlePoster && (
        <div className="absolute top-2 left-2 md:top-5 md:left-6 z-20 flex items-center gap-1.5 md:gap-2.5 rounded-md bg-vellum/90 px-2 py-1 md:px-3 md:py-1.5 border border-ink/12 backdrop-blur-xs">
          <span className="font-mono text-[11px] md:text-xs font-medium text-chestnut tabular-nums">
            {chapter.index} / 05
          </span>
          <span className="text-bark/50" aria-hidden="true">
            ·
          </span>
          <span className="text-[11px] md:text-xs font-medium tracking-wide text-ink">
            {chapter.title}
          </span>
        </div>
      )}

      {/* Opening Title Poster Overlay: image everywhere, text overlay from md up */}
      {showTitlePoster && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-vellum">
          {!imgErrors.poster && (
            <img
              src={ILLUSTRATION_ASSETS.poster}
              alt="Two glossy brown conkers on knotted twine beside a spiky green husk"
              referrerPolicy="no-referrer"
              onError={() => markError("poster")}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div
            className="absolute inset-0 hidden md:block"
            style={{
              background:
                "linear-gradient(90deg, rgba(247,246,242,0.92) 0%, rgba(247,246,242,0.72) 48%, rgba(247,246,242,0.22) 100%)",
            }}
          />
          <div className="relative z-10 hidden md:flex w-full max-w-4xl flex-col items-start px-12">
            {posterCopy}
          </div>
        </div>
      )}

      {/* End-of-film banner over the stage from md up */}
      {isFinished && (
        <div className="absolute inset-x-6 bottom-5 z-30 hidden md:flex justify-center">
          {finishBanner}
        </div>
      )}
     </div>

     {/* Phone panel: subtitles, title text and end banner sit below the stage, not on it */}
     <div className="md:hidden flex min-h-[7.5rem] items-center justify-center bg-vellum px-3 py-3">
      {showTitlePoster ? (
        <div className="flex w-full flex-col items-start">{posterCopy}</div>
      ) : isFinished ? (
        <div className="w-full">{finishBanner}</div>
      ) : caption ? (
        <div className="w-full">{captionBox}</div>
      ) : null}
     </div>

     {/* Subtitles over the stage from md up */}
     {!showTitlePoster && !isFinished && caption && (
      <div className="absolute inset-x-6 bottom-5 z-20 hidden md:flex justify-center pointer-events-none">
       {captionBox}
      </div>
     )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Scene 1: The Autumn Harvest (0s - 10s)                                     */
/* -------------------------------------------------------------------------- */
const SceneHarvest: React.FC<{ t: number; opacity: number }> = ({
  t,
  opacity,
}) => {
  const leaves = [
    { x0: 140, y0: 40, speed: 34, amp: 24, phase: 0.2, scale: 0.9 },
    { x0: 360, y0: -20, speed: 29, amp: 32, phase: 1.7, scale: 0.75 },
    { x0: 590, y0: 10, speed: 38, amp: 28, phase: 2.9, scale: 1.0 },
    { x0: 780, y0: -40, speed: 31, amp: 22, phase: 4.1, scale: 0.8 },
  ];

  // Three spiky husks falling & splitting open
  const drops = [
    { start: 1.1, x: 310, targetY: 418, conkerOffsetX: 34 },
    { start: 2.6, x: 485, targetY: 428, conkerOffsetX: -28 },
    { start: 4.0, x: 645, targetY: 412, conkerOffsetX: 38 },
  ];

  return (
    <g opacity={opacity}>
      {/* Drifting hand-inked autumn chestnut leaves */}
      {leaves.map((leaf, i) => {
        const y = ((leaf.y0 + t * leaf.speed) % 520) - 20;
        const x = leaf.x0 + Math.sin(t * 1.8 + leaf.phase) * leaf.amp;
        const rot = Math.sin(t * 2.1 + leaf.phase) * 28;
        return (
          <g
            key={i}
            transform={`translate(${x}, ${y}) rotate(${rot}) scale(${leaf.scale})`}
            opacity={0.88}
          >
            <path
              d="M 0 0 C -14 -8 -22 -24 -12 -34 C -2 -28 2 -14 0 0 Z"
              fill="#C26A27"
              stroke="#1C1917"
              strokeWidth="1.2"
            />
            <path
              d="M 0 0 C 12 -10 22 -24 14 -34 C 4 -28 -2 -14 0 0 Z"
              fill="#D48434"
              stroke="#1C1917"
              strokeWidth="1.2"
            />
            <path
              d="M 0 0 C -4 -16 -6 -36 0 -46 C 6 -36 4 -16 0 0 Z"
              fill="#B2581E"
              stroke="#1C1917"
              strokeWidth="1.2"
            />
          </g>
        );
      })}

      {/* Falling spiky green husks splitting to reveal shiny conkers */}
      {drops.map((d, idx) => {
        const fallElapsed = t - d.start;
        if (fallElapsed < -0.5) {
          // Hanging quietly on canopy twig before drop
          const sway = Math.sin(t * 2.4 + idx) * 4;
          return (
            <g key={idx} transform={`translate(${d.x + sway}, 92)`}>
              <SpikyHusk split={0} rotation={sway} />
            </g>
          );
        }

        const fallDur = 1.15;
        const fallP = clamp01(fallElapsed / fallDur);
        const y = 92 + easeOutBounce(fallP) * (d.targetY - 92);
        const splitP = easeOutCubic((fallElapsed - 1.2) / 0.9);
        const rollP = easeOutCubic((fallElapsed - 1.55) / 1.4);

        const conkerX = d.x + rollP * d.conkerOffsetX;
        const conkerY = d.targetY + 8 - Math.sin(rollP * Math.PI) * 14;
        const conkerRot = rollP * (d.conkerOffsetX > 0 ? 52 : -48);

        return (
          <g key={idx}>
            {/* Shadow on mossy grass */}
            <ellipse
              cx={d.x}
              cy={d.targetY + 26}
              rx={28 * clamp01(fallP * 1.4)}
              ry={7}
              fill="#1C1917"
              opacity={0.18 * fallP}
            />
            <g transform={`translate(${d.x}, ${y})`}>
              <SpikyHusk split={splitP} rotation={fallP * 25 * (idx % 2 ? 1 : -1)} />
            </g>
            {splitP > 0.15 && (
              <g filter="url(#ink-shadow)">
                <ConkerIllustration
                  cx={conkerX}
                  cy={conkerY}
                  radius={26 * clamp01(splitP * 1.6)}
                  rotation={conkerRot}
                  idPrefix={`harvest-${idx}`}
                />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};

const SpikyHusk: React.FC<{ split: number; rotation: number }> = ({
  split,
  rotation,
}) => {
  const spread = split * 16;
  return (
    <g transform={`rotate(${rotation})`}>
      {/* Left half of spiky husk */}
      <g transform={`translate(${-spread}, ${split * 4}) rotate(${-split * 28})`}>
        <path
          d="M 0 -24 C -20 -22 -28 -6 -24 12 C -18 24 -4 26 0 24 Z"
          fill="#6C8B42"
          stroke="#1C1917"
          strokeWidth="1.7"
        />
        <path
          d="M -16 -18 L -24 -26 M -24 -4 L -33 -6 M -22 10 L -30 16 M -8 -22 L -11 -31"
          stroke="#1C1917"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </g>
      {/* Right half of spiky husk */}
      <g transform={`translate(${spread}, ${split * 4}) rotate(${split * 28})`}>
        <path
          d="M 0 -24 C 20 -22 28 -6 24 12 C 18 24 4 26 0 24 Z"
          fill="#7D9C4F"
          stroke="#1C1917"
          strokeWidth="1.7"
        />
        <path
          d="M 16 -18 L 24 -26 M 24 -4 L 33 -6 M 22 10 L 30 16 M 8 -22 L 11 -31"
          stroke="#1C1917"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </g>
    </g>
  );
};

/* -------------------------------------------------------------------------- */
/* Scene 2: Hole & Knot (11s - 21s)                                           */
/* -------------------------------------------------------------------------- */
const SceneHoleAndKnot: React.FC<{ t: number; opacity: number }> = ({
  t,
  opacity,
}) => {
  const localT = t - 11; // 0 to 10s

  // Phase A (0 - 4.4s): Brass & wooden gimlet drills down through center
  const drillEnter = easeOutCubic(localT / 0.9);
  const drillRetract = easeInOutCubic((localT - 3.6) / 0.9);
  const drillProgress = easeInOutCubic((localT - 1.0) / 2.2);
  const gimletTipY = 205 + drillProgress * 145 - drillRetract * 220;
  const gimletOpacity = clamp01(drillEnter) * (1 - drillRetract);
  const spinWiggle =
    localT > 0.9 && localT < 3.6 ? Math.sin(localT * 22) * 14 : 0;

  // Phase B (4.4 - 9.0s): Golden twine threads up through bore and ties knot
  const threadP = easeInOutCubic((localT - 4.3) / 1.8);
  const knotCinchP = easeOutCubic((localT - 6.3) / 1.4);
  const liftP = easeInOutCubic((localT - 7.4) / 1.2);

  const conkerY = 318 - liftP * 42;
  const stringTopY = 318 - threadP * 260;

  return (
    <g opacity={opacity}>
      {/* Soft linen cloth pad on oak workbench */}
      <ellipse
        cx={480}
        cy={388}
        rx={128}
        ry={24}
        fill="#E9E3D3"
        stroke="#1C1917"
        strokeWidth="1.4"
        opacity={1 - liftP * 0.6}
      />

      {/* Twine string passing through the center */}
      {localT > 4.2 && (
        <g>
          {/* Upper length of twine */}
          <line
            x1={480}
            y1={conkerY}
            x2={480}
            y2={Math.min(conkerY, stringTopY)}
            stroke="#C7A770"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
          <line
            x1={480}
            y1={conkerY}
            x2={480}
            y2={Math.min(conkerY, stringTopY)}
            stroke="#1C1917"
            strokeWidth="1.5"
            strokeDasharray="6 4"
            opacity={0.55}
          />
        </g>
      )}

      {/* Hero Conker on workbench */}
      <g filter="url(#ink-shadow)">
        <ConkerIllustration
          cx={480}
          cy={conkerY}
          radius={64}
          showBoreHole={localT > 0.9}
          boreDepth={drillProgress}
          idPrefix="workbench-hero"
        />
      </g>

      {/* Bottom tail + Figure-eight stopper knot cinching tight */}
      {localT > 4.2 && (
        <g transform={`translate(480, ${conkerY + 62})`}>
          {/* Loose hanging tail */}
          <path
            d={`M 0 0 Q ${12 - knotCinchP * 10} ${28 - knotCinchP * 12} ${4 - knotCinchP * 2} ${48 - knotCinchP * 18}`}
            fill="none"
            stroke="#C7A770"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
          <path
            d={`M 0 0 Q ${12 - knotCinchP * 10} ${28 - knotCinchP * 12} ${4 - knotCinchP * 2} ${48 - knotCinchP * 18}`}
            fill="none"
            stroke="#1C1917"
            strokeWidth="1.4"
          />

          {/* Stopper knot loop tightening at the base */}
          <g
            transform={`translate(0, ${18 - knotCinchP * 14}) scale(${1.35 - knotCinchP * 0.35})`}
            opacity={clamp01((localT - 5.2) / 0.8)}
          >
            <ellipse
              cx={0}
              cy={0}
              rx={11}
              ry={7}
              fill="#D4B782"
              stroke="#1C1917"
              strokeWidth="1.8"
            />
            <path
              d="M -7 -2 Q 0 5 7 -2"
              fill="none"
              stroke="#1C1917"
              strokeWidth="1.4"
            />
          </g>
        </g>
      )}

      {/* Brass & Hardwood Gimlet boring the hole */}
      {gimletOpacity > 0.02 && (
        <g
          transform={`translate(480, ${gimletTipY})`}
          opacity={gimletOpacity}
        >
          {/* Steel screw shaft */}
          <rect
            x={-2.5}
            y={-110}
            width={5}
            height={110}
            fill="#9CA3AF"
            stroke="#1C1917"
            strokeWidth="1.4"
          />
          {/* Spiral flutes */}
          {[-25, -45, -65, -85].map((sy, i) => (
            <line
              key={i}
              x1={-3}
              y1={sy}
              x2={3}
              y2={sy - 7}
              stroke="#1C1917"
              strokeWidth="1.3"
            />
          ))}
          {/* Brass collar */}
          <rect
            x={-7}
            y={-122}
            width={14}
            height={14}
            rx={2}
            fill="#D9A441"
            stroke="#1C1917"
            strokeWidth="1.6"
          />
          {/* T-bar wooden handle */}
          <g transform={`translate(0, -128) scale(${Math.cos((spinWiggle * Math.PI) / 180) * 0.35 + 0.75}, 1)`}>
            <rect
              x={-48}
              y={-9}
              width={96}
              height={18}
              rx={9}
              fill="#8B5A2B"
              stroke="#1C1917"
              strokeWidth="1.8"
            />
          </g>

          {/* Tiny wood shavings puffing out during drilling */}
          {localT > 1.3 && localT < 3.4 && (
            <g transform={`translate(0, ${255 - gimletTipY})`}>
              {[-18, -8, 12, 22].map((sx, idx) => {
                const puff = ((localT * 2.5 + idx * 0.3) % 1);
                return (
                  <circle
                    key={idx}
                    cx={sx * (0.6 + puff)}
                    cy={-puff * 22}
                    r={2.5}
                    fill="#E5D5BA"
                    stroke="#1C1917"
                    strokeWidth="0.9"
                    opacity={1 - puff}
                  />
                );
              })}
            </g>
          )}
        </g>
      )}
    </g>
  );
};

/* -------------------------------------------------------------------------- */
/* Scene 3: Hold Still & Swing (21s - 32s)                                    */
/* Consistent Stage Stance: Left grip (360,124), Right grip (560,124), L=220  */
/* -------------------------------------------------------------------------- */
const SceneHoldStillAndSwing: React.FC<{ t: number }> = ({ t }) => {
  const localT = t - 21; // 0 to 11s
  const enterP = easeOutCubic(localT / 1.0);

  // Opponent holds rock-steady at (360, 124) -> conker rests at (360, 344)
  const impactT = 6.35; // 25.35s
  const recoilTime = localT - impactT;
  const oppAngle =
    recoilTime > 0
      ? -Math.sin(recoilTime * 9.5) * Math.exp(-recoilTime * 1.6) * 40
      : Math.sin(localT * 1.4) * 0.9;

  // Attacker (Right) dynamically cocks arm back, drives forward, and whips string into (420, 342)
  let handX = 560;
  let handY = 124;
  let wristTilt = 0;
  let chalAngle = 4;
  let trails: number[] = [];

  if (localT >= 2.1 && localT < 5.25) {
    // Wind-up: hand pulls back & slightly high, wrist cocks back, conker arcs up behind
    const p = easeInOutCubic((localT - 2.1) / 3.15);
    handX = 560 + p * 86; // -> 646
    handY = 124 + Math.sin(p * Math.PI) * 26 - p * 10; // slight drop then lift to 114
    wristTilt = -p * 24;
    chalAngle = 4 + p * 80; // -> +84 deg (dramatic high backswing!)
  } else if (localT >= 5.25 && localT < impactT) {
    // Strike whip: hand drives forward first (whip lag!), conker accelerates into impact
    const p = clamp01((localT - 5.25) / (impactT - 5.25));
    const handDrive = easeOutCubic(p);
    const whip = p * p * (0.4 + 0.6 * p); // fast acceleration into impact!
    handX = 646 - handDrive * 141; // 646 -> 505
    handY = 114 + handDrive * 24; // 114 -> 138
    wristTilt = -24 + handDrive * 42; // -24 -> +18 deg forward wrist snap
    chalAngle = 84 - whip * 106.7; // +84 -> -22.7 deg (conker center = (420, 341))
    trails = [chalAngle + 14, chalAngle + 28, chalAngle + 44];
  } else if (localT >= impactT) {
    // Rebound & return to ready stance
    const post = localT - impactT;
    const settle = easeOutCubic(post / 1.4);
    handX = 505 + settle * 55;
    handY = 138 - settle * 14;
    wristTilt = 18 * (1 - settle);
    // Elastic bounce-back right, then damped pendulum swing
    chalAngle =
      -22.7 +
      easeOutCubic(post / 0.35) * 38 -
      easeOutCubic((post - 0.35) / 1.5) * 15.3 +
      Math.sin(post * 5.2) * Math.exp(-post * 1.9) * 14;
    if (post < 0.25) {
      trails = [chalAngle + 10, chalAngle + 22];
    }
  }

  const impactFlash =
    recoilTime >= 0 && recoilTime < 0.45 ? 1 - recoilTime / 0.45 : 0;

  return (
    <g opacity={enterP}>
      {/* Left Hand (Opponent — Holds Still at Arm's Length) */}
      <StorybookHand
        anchorX={360}
        anchorY={124}
        side="left"
        cuffColor="#2E5A36"
        stringLength={220}
        angleDeg={oppAngle}
        conkerId="scene3-opp"
        label="Holds Still"
        labelOpacity={localT > 1.0 && localT < 5.1 ? 1 : 0}
      />

      {/* Right Hand (Challenger — Dynamic Arm + Wrist Whip) */}
      <StorybookHand
        anchorX={handX}
        anchorY={handY}
        side="right"
        cuffColor="#8B3A1E"
        stringLength={220}
        angleDeg={chalAngle}
        wristTiltDeg={wristTilt}
        trailAngles={trails}
        conkerId="scene3-chal"
      />

      {/* Impact Starburst centered at exact rim-to-rim contact (390, 342) */}
      {impactFlash > 0 && (
        <g transform="translate(390, 342)" opacity={impactFlash}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1={Math.cos((deg * Math.PI) / 180) * 16}
              y1={Math.sin((deg * Math.PI) / 180) * 16}
              x2={
                Math.cos((deg * Math.PI) / 180) * (34 + (1 - impactFlash) * 28)
              }
              y2={
                Math.sin((deg * Math.PI) / 180) * (34 + (1 - impactFlash) * 28)
              }
              stroke="#1C1917"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          ))}
          <text
            x={0}
            y={-44 - (1 - impactFlash) * 12}
            textAnchor="middle"
            fill="#8B3A1E"
            fontFamily="Fraunces, Georgia, serif"
            fontWeight="700"
            fontSize="24"
          >
            CLACK!
          </text>
        </g>
      )}
    </g>
  );
};

/* -------------------------------------------------------------------------- */
/* Scene 4: Swap & Strike (32s - 42s)                                         */
/* Same Stance: Left grip (360,124) swings into Right grip (560,124)          */
/* -------------------------------------------------------------------------- */
const SceneSwapTurns: React.FC<{ t: number }> = ({ t }) => {
  const localT = t - 32; // 0 to 10s

  const impactT = 5.75; // 35.75s
  const recoilTime = localT - impactT;

  let leftHandX = 360;
  let leftHandY = 124;
  let leftWristTilt = 0;
  let leftAngle = -4;
  let trails: number[] = [];

  if (localT >= 1.7 && localT < 4.7) {
    const p = easeInOutCubic((localT - 1.7) / 3.0);
    leftHandX = 360 - p * 84; // 360 -> 276
    leftHandY = 124 + Math.sin(p * Math.PI) * 24 - p * 10; // -> 114
    leftWristTilt = -p * 24; // mirrored left hand cocks back cleanly
    leftAngle = -4 - p * 80; // -> -84 deg
  } else if (localT >= 4.7 && localT < impactT) {
    const p = clamp01((localT - 4.7) / (impactT - 4.7));
    const handDrive = easeOutCubic(p);
    const whip = p * p * (0.4 + 0.6 * p);
    leftHandX = 276 + handDrive * 139; // 276 -> 415
    leftHandY = 114 + handDrive * 24; // 114 -> 138
    leftWristTilt = -24 + handDrive * 42;
    leftAngle = -84 + whip * 106.7; // -84 -> +22.7 deg (conker center = (500, 341))
    trails = [leftAngle - 14, leftAngle - 28, leftAngle - 44];
  } else if (localT >= impactT) {
    const post = localT - impactT;
    const settle = easeOutCubic(post / 1.3);
    leftHandX = 415 - settle * 55;
    leftHandY = 138 - settle * 14;
    leftWristTilt = 18 * (1 - settle);
    leftAngle =
      22.7 -
      easeOutCubic(post / 0.35) * 34 +
      easeOutCubic((post - 0.35) / 1.4) * 11.3 +
      Math.sin(post * 5) * Math.exp(-post * 2) * 10;
    if (post < 0.25) {
      trails = [leftAngle - 10, leftAngle - 22];
    }
  }

  // Right conker holds still at (560, 344), then kicks RIGHT (+x) on impact
  const rightAngle =
    recoilTime > 0
      ? Math.sin(recoilTime * 9.5) * Math.exp(-recoilTime * 1.7) * 36
      : Math.sin(localT * 1.3) * 0.9;

  const impactFlash =
    recoilTime >= 0 && recoilTime < 0.45 ? 1 - recoilTime / 0.45 : 0;

  return (
    <g>
      {localT < 2.2 && (
        <g
          transform="translate(460, 66)"
          opacity={localT < 1.6 ? clamp01(localT * 2) : 1 - (localT - 1.6) / 0.6}
        >
          <text
            x={0}
            y={0}
            textAnchor="middle"
            fill="#1C1917"
            fontFamily="Fraunces, Georgia, serif"
            fontSize="20"
            fontWeight="600"
          >
            Swap Turns
          </text>
          <path
            d="M -68 12 Q 0 22 68 12"
            fill="none"
            stroke="#8B3A1E"
            strokeWidth="1.8"
            strokeDasharray="4 4"
          />
        </g>
      )}

      {/* Left Hand now swinging */}
      <StorybookHand
        anchorX={leftHandX}
        anchorY={leftHandY}
        side="left"
        cuffColor="#2E5A36"
        stringLength={220}
        angleDeg={leftAngle}
        wristTiltDeg={leftWristTilt}
        trailAngles={trails}
        conkerId="scene4-left"
        cracks={1}
      />

      {/* Right Hand now holding still */}
      <StorybookHand
        anchorX={560}
        anchorY={124}
        side="right"
        cuffColor="#8B3A1E"
        stringLength={220}
        angleDeg={rightAngle}
        conkerId="scene4-right"
        cracks={1}
        label="Your Turn to Hold Still"
        labelOpacity={localT > 1.0 && localT < 4.6 ? 1 : 0}
      />

      {/* Impact burst at exact contact (530, 342) */}
      {impactFlash > 0 && (
        <g transform="translate(530, 342)" opacity={impactFlash}>
          {[20, 75, 130, 200, 255, 315].map((deg) => (
            <line
              key={deg}
              x1={Math.cos((deg * Math.PI) / 180) * 16}
              y1={Math.sin((deg * Math.PI) / 180) * 16}
              x2={
                Math.cos((deg * Math.PI) / 180) * (32 + (1 - impactFlash) * 24)
              }
              y2={
                Math.sin((deg * Math.PI) / 180) * (32 + (1 - impactFlash) * 24)
              }
              stroke="#1C1917"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          ))}
        </g>
      )}
    </g>
  );
};

/* -------------------------------------------------------------------------- */
/* Scene 5: One-er, Two-er (42s - 54s)                                        */
/* -------------------------------------------------------------------------- */
const SceneVictorCount: React.FC<{ t: number }> = ({ t }) => {
  const localT = t - 42; // 0 to 12s
  const strikeT = 2.35; // 44.35s
  const shatterT = 3.6; // 45.6s

  let rightHandX = 560;
  let rightHandY = 124;
  let rightWristTilt = 0;
  let rightAngle = 4;
  let trails: number[] = [];

  if (localT < 1.45) {
    const p = easeInOutCubic(localT / 1.45);
    rightHandX = 560 + p * 92; // -> 652
    rightHandY = 124 - p * 12; // -> 112
    rightWristTilt = -p * 26;
    rightAngle = 4 + p * 84; // -> +88 deg mighty windup
  } else if (localT < strikeT) {
    const p = clamp01((localT - 1.45) / (strikeT - 1.45));
    const handDrive = easeOutCubic(p);
    const whip = p * p * (0.35 + 0.65 * p);
    rightHandX = 652 - handDrive * 147; // -> 505
    rightHandY = 112 + handDrive * 26; // -> 138
    rightWristTilt = -26 + handDrive * 46;
    rightAngle = 88 - whip * 110.7; // -> -22.7 deg dead-on hit at (420, 341)
    trails = [rightAngle + 15, rightAngle + 30, rightAngle + 46];
  } else if (localT < 4.3) {
    const post = localT - strikeT;
    const settle = easeOutCubic(post / 1.3);
    rightHandX = 505 + settle * 55;
    rightHandY = 138 - settle * 14;
    rightWristTilt = 20 * (1 - settle);
    rightAngle =
      -22.7 +
      easeOutCubic(post / 0.4) * 32 -
      easeOutCubic((post - 0.4) / 1.2) * 9.3;
    if (post < 0.25) {
      trails = [rightAngle + 10, rightAngle + 22];
    }
  } else {
    // Winning conker glides smoothly to center stage (480, 320)
    const centerP = easeInOutCubic((localT - 4.3) / 1.2);
    rightHandX = 560 - centerP * 80;
    rightHandY = 124 - centerP * 24;
    rightAngle = Math.sin((localT - 4.3) * 2.2) * 2;
  }

  const isHit = localT >= strikeT;
  const isShattered = localT >= shatterT;
  const shatterP = clamp01((localT - shatterT) / 1.2);

  // Left conker kicks violently LEFT on impact before splitting apart
  const loserRecoil = isHit
    ? -easeOutCubic((localT - strikeT) / 0.25) * 26 +
      Math.sin((localT - strikeT) * 16) * 6
    : 0;

  const tallyCount = localT >= 7.9 ? 3 : localT >= 6.4 ? 2 : 1;
  const tallyName =
    tallyCount === 1 ? "One-er" : tallyCount === 2 ? "Two-er" : "Three-er";

  return (
    <g>
      {/* Left Conker (breaks and shatters!) */}
      {!isShattered ? (
        <StorybookHand
          anchorX={360}
          anchorY={124}
          side="left"
          cuffColor="#2E5A36"
          stringLength={220}
          angleDeg={loserRecoil}
          conkerId="scene5-loser"
          cracks={isHit ? 4 : 2}
        />
      ) : (
        <g opacity={1 - shatterP}>
          <line
            x1={360}
            y1={124}
            x2={330}
            y2={330}
            stroke="#C7A770"
            strokeWidth="3.5"
          />
          <g
            transform={`translate(${330 - shatterP * 85}, ${344 + shatterP * shatterP * 170}) rotate(${-shatterP * 115})`}
          >
            <path
              d="M 0 -28 C -24 -26 -30 0 -22 24 C -12 30 0 28 2 22 L -4 0 Z"
              fill="#6D2610"
              stroke="#1C1917"
              strokeWidth="2"
            />
          </g>
          <g
            transform={`translate(${330 + shatterP * 75}, ${344 + shatterP * shatterP * 185}) rotate(${shatterP * 135})`}
          >
            <path
              d="M 0 -28 C 24 -26 30 0 22 24 C 12 30 0 28 -2 22 L 4 0 Z"
              fill="#7C2D12"
              stroke="#1C1917"
              strokeWidth="2"
            />
          </g>
        </g>
      )}

      {/* Impact Starburst at decisive blow */}
      {isHit && localT - strikeT < 0.4 && (
        <g
          transform="translate(390, 342)"
          opacity={1 - (localT - strikeT) / 0.4}
        >
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1={Math.cos((deg * Math.PI) / 180) * 18}
              y1={Math.sin((deg * Math.PI) / 180) * 18}
              x2={Math.cos((deg * Math.PI) / 180) * 56}
              y2={Math.sin((deg * Math.PI) / 180) * 56}
              stroke="#1C1917"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ))}
        </g>
      )}

      {/* Winning Right Conker */}
      <StorybookHand
        anchorX={rightHandX}
        anchorY={rightHandY}
        side="right"
        cuffColor="#8B3A1E"
        stringLength={220}
        angleDeg={rightAngle}
        wristTiltDeg={rightWristTilt}
        trailAngles={trails}
        conkerId="scene5-winner"
        cracks={1}
      />

      {/* Heraldic Storybook Rank Ribbon */}
      {localT > 4.9 && (
        <g
          transform={`translate(480, 386)`}
          opacity={easeOutCubic((localT - 4.9) / 0.5)}
        >
          <rect
            x={-136}
            y={-28}
            width={272}
            height={58}
            rx={10}
            fill="#F7F6F2"
            stroke="#1C1917"
            strokeWidth="1.8"
          />
          <text
            x={0}
            y={-4}
            textAnchor="middle"
            fill="#8B3A1E"
            fontFamily="IBM Plex Mono, monospace"
            fontSize="13"
            fontWeight="600"
          >
            {tallyCount}-ER · WINNER&apos;S TALLY
          </text>
          <text
            x={0}
            y={20}
            textAnchor="middle"
            fill="#1C1917"
            fontFamily="Fraunces, Georgia, serif"
            fontSize="22"
            fontWeight="700"
          >
            &ldquo;{tallyName}&rdquo;
          </text>
        </g>
      )}
    </g>
  );
};


