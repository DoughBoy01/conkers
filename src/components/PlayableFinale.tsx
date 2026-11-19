import React, { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw, Shield, Swords, Trophy } from "lucide-react";
import { foleyEngine } from "../audio/foleyEngine.ts";
import {
  formatConkerRank,
  ILLUSTRATION_ASSETS,
} from "../data/storyboard.ts";
import { StorybookHand } from "./StorybookHand.tsx";

interface PlayableFinaleProps {
  onBackToFilm: () => void;
}

type MatchPhase =
  | "player_idle"
  | "player_charging"
  | "player_swinging"
  | "opponent_winding"
  | "round_won"
  | "round_lost";

const LEFT_REST_X = 360;
const RIGHT_REST_X = 560;
const REST_Y = 124;
const STRING_LEN = 220;

export const PlayableFinale: React.FC<PlayableFinaleProps> = ({
  onBackToFilm,
}) => {
  const [imgError, setImgError] = useState(false);
  const [phase, setPhase] = useState<MatchPhase>("player_idle");
  const [power, setPower] = useState(0);
  const [playerHP, setPlayerHP] = useState(100);
  const [oppHP, setOppHP] = useState(100);
  const [wins, setWins] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [statusLine, setStatusLine] = useState(
    "Hold Aim & Swing to pull back your arm and conker, then release in the green sweet spot."
  );

  const [playerHand, setPlayerHand] = useState({
    x: RIGHT_REST_X,
    y: REST_Y,
    tilt: 0,
    angle: 3,
    trails: [] as number[],
  });
  const [oppHand, setOppHand] = useState({
    x: LEFT_REST_X,
    y: REST_Y,
    tilt: 0,
    angle: 0,
    trails: [] as number[],
  });
  const [impactFlash, setImpactFlash] = useState<{
    x: number;
    y: number;
    text: string;
    opacity: number;
  } | null>(null);

  const phaseRef = useRef<MatchPhase>("player_idle");
  const chargeDirRef = useRef<1 | -1>(1);
  const powerRef = useRef(0);
  const playerHPRef = useRef(100);
  const oppHPRef = useRef(100);
  const winsRef = useRef(0);
  const bestStreakRef = useRef(0);
  const actionRafRef = useRef<number | null>(null);
  const chimeTimeoutRef = useRef<number | null>(null);

  const updatePhase = useCallback((next: MatchPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const stopActionAnim = useCallback(() => {
    if (actionRafRef.current !== null) {
      cancelAnimationFrame(actionRafRef.current);
      actionRafRef.current = null;
    }
    if (chimeTimeoutRef.current !== null) {
      window.clearTimeout(chimeTimeoutRef.current);
      chimeTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopActionAnim();
  }, [stopActionAnim]);

  // Gentle breeze idle sway (isolated local RAF handle)
  useEffect(() => {
    if (phase !== "player_idle") return;
    let idleRaf = 0;
    let start: number | null = null;
    const tick = (ts: number) => {
      if (start === null) start = ts;
      const elapsed = (ts - start) / 1000;
      setOppHand({
        x: LEFT_REST_X,
        y: REST_Y,
        tilt: 0,
        angle: Math.sin(elapsed * 1.9) * 2.5,
        trails: [],
      });
      setPlayerHand({
        x: RIGHT_REST_X,
        y: REST_Y,
        tilt: 0,
        angle: Math.sin(elapsed * 1.5 + 1) * 2.0,
        trails: [],
      });
      idleRaf = requestAnimationFrame(tick);
    };
    idleRaf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(idleRaf);
  }, [phase]);

  // Dynamic wind-up charge loop (isolated local RAF handle so it never cancels swing RAF)
  useEffect(() => {
    if (phase !== "player_charging") return;
    let chargeRaf = 0;
    let lastTs: number | null = null;
    const tick = (ts: number) => {
      if (lastTs === null) lastTs = ts;
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;

      let next = powerRef.current + chargeDirRef.current * dt * 110;
      if (next >= 100) {
        next = 100;
        chargeDirRef.current = -1;
      } else if (next <= 8) {
        next = 8;
        chargeDirRef.current = 1;
      }
      powerRef.current = next;
      setPower(next);

      const p = next / 100;
      setPlayerHand({
        x: RIGHT_REST_X + p * 90,
        y: REST_Y - p * 12,
        tilt: -p * 26,
        angle: 4 + p * 84,
        trails: [],
      });
      setOppHand({
        x: LEFT_REST_X,
        y: REST_Y,
        tilt: 0,
        angle: Math.sin(ts * 0.002) * 2.4,
        trails: [],
      });
      chargeRaf = requestAnimationFrame(tick);
    };
    chargeRaf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(chargeRaf);
  }, [phase]);

  const runOpponentTurn = useCallback(() => {
    stopActionAnim();
    updatePhase("opponent_winding");
    setStatusLine("Swap turns! Hold your conker steady at arm's length...");

    const windStart = performance.now();
    const windDur = 980;
    const strikeDur = 340;
    const totalDur = windDur + strikeDur + 900;
    let impactTriggered = false;
    let whooshTriggered = false;

    const oppPower = 54 + Math.random() * 34;
    const isMiss = Math.random() < 0.18;
    const targetStrikeAngle = isMiss ? 8 : 22.7;

    const tick = (now: number) => {
      if (phaseRef.current !== "opponent_winding") return;

      const elapsed = now - windStart;
      if (elapsed < windDur) {
        const p = elapsed / windDur;
        const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        setOppHand({
          x: LEFT_REST_X - eased * 84,
          y: REST_Y - eased * 10,
          tilt: -eased * 24,
          angle: -(4 + eased * 80),
          trails: [],
        });
        setPlayerHand({
          x: RIGHT_REST_X,
          y: REST_Y,
          tilt: 0,
          angle: Math.sin(elapsed * 0.003) * 1.1,
          trails: [],
        });
      } else if (elapsed < windDur + strikeDur) {
        if (!whooshTriggered) {
          whooshTriggered = true;
          foleyEngine.trigger("whoosh", 0.8);
        }
        const p = (elapsed - windDur) / strikeDur;
        const handDrive = 1 - Math.pow(1 - p, 3);
        const whip = p * p * (0.35 + 0.65 * p);
        const currentAngle = -84 + whip * (84 + targetStrikeAngle);

        setOppHand({
          x: LEFT_REST_X - 84 + handDrive * (isMiss ? 115 : 139),
          y: REST_Y - 10 + handDrive * 24,
          tilt: -24 + handDrive * 42,
          angle: currentAngle,
          trails: [currentAngle - 14, currentAngle - 28, currentAngle - 42],
        });
      } else {
        if (!impactTriggered) {
          impactTriggered = true;
          if (isMiss) {
            setStatusLine("The opponent swung short and missed! Your turn.");
            setImpactFlash({
              x: 470,
              y: 295,
              text: "MISS!",
              opacity: 1,
            });
          } else {
            const dmg = Math.round(16 + (oppPower / 100) * 18);
            const nextHP = Math.max(0, playerHPRef.current - dmg);
            playerHPRef.current = nextHP;
            setPlayerHP(nextHP);

            if (nextHP <= 0) {
              foleyEngine.trigger("shatter", 1);
              updatePhase("round_lost");
              setStatusLine(
                "Crack! Your conker broke first. Grab a fresh autumn conker to try again."
              );
              setImpactFlash({
                x: 530,
                y: 342,
                text: "CRACK!",
                opacity: 1,
              });
              setOppHand({
                x: LEFT_REST_X,
                y: REST_Y,
                tilt: 0,
                angle: 0,
                trails: [],
              });
              return;
            } else {
              foleyEngine.trigger("clack", 0.9);
              setStatusLine(
                `Clack! Your conker took a knock (${nextHP}% intact). Your swing!`
              );
              setImpactFlash({
                x: 530,
                y: 342,
                text: "CLACK!",
                opacity: 1,
              });
            }
          }
        }

        const post = (elapsed - windDur - strikeDur) / 1000;
        const settle = Math.min(1, post / 0.85);
        const easeSettle = 1 - Math.pow(1 - settle, 3);

        setOppHand({
          x: LEFT_REST_X + (isMiss ? 31 : 55) * (1 - easeSettle),
          y: REST_Y + 14 * (1 - easeSettle),
          tilt: 18 * (1 - easeSettle),
          angle:
            targetStrikeAngle * (1 - easeSettle) -
            Math.sin(post * 6) * Math.exp(-post * 2.5) * 14,
          trails: [],
        });

        if (!isMiss) {
          setPlayerHand({
            x: RIGHT_REST_X,
            y: REST_Y,
            tilt: 0,
            angle: Math.sin(post * 10) * Math.exp(-post * 1.8) * 34,
            trails: [],
          });
        }

        setImpactFlash((prev) =>
          prev ? { ...prev, opacity: Math.max(0, 1 - post * 2.1) } : null
        );
      }

      if (elapsed < totalDur) {
        actionRafRef.current = requestAnimationFrame(tick);
      } else {
        actionRafRef.current = null;
        setImpactFlash(null);
        if (playerHPRef.current > 0) {
          updatePhase("player_idle");
        }
      }
    };

    actionRafRef.current = requestAnimationFrame(tick);
  }, [stopActionAnim, updatePhase]);

  const releaseSwing = useCallback(() => {
    if (phaseRef.current !== "player_charging") return;
    stopActionAnim();
    updatePhase("player_swinging");

    const releasePower = Math.max(12, powerRef.current);
    const pStart = releasePower / 100;
    const startHandX = RIGHT_REST_X + pStart * 90;
    const startHandY = REST_Y - pStart * 12;
    const startTilt = -pStart * 26;
    const startAngle = 4 + pStart * 84;

    const isSweetSpot = releasePower >= 62 && releasePower <= 88;
    const isShortMiss = releasePower < 26;
    const isOverMiss = releasePower > 95;
    const isMiss = isShortMiss || isOverMiss;

    const endHandX = isShortMiss ? 535 : isOverMiss ? 485 : 505;
    const endAngle = isShortMiss ? -6 : isOverMiss ? -38 : -22.7;

    const swingStart = performance.now();
    const swingDur = 310;
    const settleDur = 850;
    let impactTriggered = false;

    foleyEngine.trigger("whoosh", 0.85);

    const tick = (now: number) => {
      if (phaseRef.current !== "player_swinging") return;

      const elapsed = now - swingStart;
      if (elapsed < swingDur) {
        const p = elapsed / swingDur;
        const handDrive = 1 - Math.pow(1 - p, 3);
        const whip = p * p * (0.35 + 0.65 * p);
        const currentAngle = startAngle + whip * (endAngle - startAngle);

        setPlayerHand({
          x: startHandX + handDrive * (endHandX - startHandX),
          y: startHandY + handDrive * (REST_Y + 14 - startHandY),
          tilt: startTilt + handDrive * (18 - startTilt),
          angle: currentAngle,
          trails: [currentAngle + 14, currentAngle + 28, currentAngle + 42],
        });
      } else {
        if (!impactTriggered) {
          impactTriggered = true;
          if (isMiss) {
            setStatusLine(
              isShortMiss
                ? "Too gentle—you swung short! Swapping turns..."
                : "Too wild—your swing flew high past theirs! Swapping turns..."
            );
            setImpactFlash({
              x: 425,
              y: isOverMiss ? 265 : 315,
              text: "MISS!",
              opacity: 1,
            });
          } else {
            const dmg = isSweetSpot
              ? 38
              : Math.round(18 + (releasePower / 100) * 16);
            const nextOppHP = Math.max(0, oppHPRef.current - dmg);
            oppHPRef.current = nextOppHP;
            setOppHP(nextOppHP);

            if (nextOppHP <= 0) {
              foleyEngine.trigger("shatter", 1);
              chimeTimeoutRef.current = window.setTimeout(
                () => foleyEngine.trigger("chime", 0.9),
                260
              );
              const nextWins = winsRef.current + 1;
              winsRef.current = nextWins;
              const nextBest = Math.max(bestStreakRef.current, nextWins);
              bestStreakRef.current = nextBest;

              setWins(nextWins);
              setBestStreak(nextBest);
              setStatusLine(
                `Shattered! Your conker is now a "${formatConkerRank(nextWins)}"!`
              );
              updatePhase("round_won");
              setImpactFlash({
                x: 390,
                y: 342,
                text: "SMASH!",
                opacity: 1,
              });
              setPlayerHand({
                x: RIGHT_REST_X,
                y: REST_Y,
                tilt: 0,
                angle: 0,
                trails: [],
              });
              return;
            } else {
              foleyEngine.trigger(isSweetSpot ? "crack" : "clack", 0.95);
              setStatusLine(
                isSweetSpot
                  ? `Direct hit! Heavy crack on opponent's conker (${nextOppHP}% intact).`
                  : `Solid clack! (${nextOppHP}% intact). Swapping turns...`
              );
              setImpactFlash({
                x: 390,
                y: 342,
                text: isSweetSpot ? "CRACK!" : "CLACK!",
                opacity: 1,
              });
            }
          }
        }

        const post = (elapsed - swingDur) / 1000;
        const settle = Math.min(1, post / 0.8);
        const easeSettle = 1 - Math.pow(1 - settle, 3);

        setPlayerHand({
          x: endHandX + (RIGHT_REST_X - endHandX) * easeSettle,
          y: REST_Y + 14 * (1 - easeSettle),
          tilt: 18 * (1 - easeSettle),
          angle:
            endAngle * (1 - easeSettle) +
            Math.sin(post * 6) * Math.exp(-post * 2.3) * 16,
          trails: [],
        });

        if (!isMiss) {
          setOppHand({
            x: LEFT_REST_X,
            y: REST_Y,
            tilt: 0,
            angle:
              -Math.sin(post * 9.5) *
              Math.exp(-post * 1.6) *
              (releasePower * 0.42),
            trails: [],
          });
        }

        setImpactFlash((prev) =>
          prev ? { ...prev, opacity: Math.max(0, 1 - post * 2.1) } : null
        );
      }

      if (elapsed < swingDur + settleDur) {
        actionRafRef.current = requestAnimationFrame(tick);
      } else {
        actionRafRef.current = null;
        setImpactFlash(null);
        setPower(0);
        powerRef.current = 0;
        if (oppHPRef.current > 0) {
          runOpponentTurn();
        }
      }
    };

    actionRafRef.current = requestAnimationFrame(tick);
  }, [runOpponentTurn, stopActionAnim, updatePhase]);

  const startCharge = useCallback(() => {
    if (phaseRef.current !== "player_idle") return;
    foleyEngine.unlock();
    powerRef.current = 12;
    chargeDirRef.current = 1;
    setPower(12);
    updatePhase("player_charging");
  }, [updatePhase]);

  // Global pointer release while charging so dragging off the button never locks state
  useEffect(() => {
    if (phase !== "player_charging") return;
    const handleGlobalUp = () => {
      releaseSwing();
    };
    window.addEventListener("pointerup", handleGlobalUp);
    window.addEventListener("pointercancel", handleGlobalUp);
    return () => {
      window.removeEventListener("pointerup", handleGlobalUp);
      window.removeEventListener("pointercancel", handleGlobalUp);
    };
  }, [phase, releaseSwing]);

  const nextChallenger = useCallback(() => {
    stopActionAnim();
    oppHPRef.current = 100;
    setOppHP(100);
    setPlayerHand({
      x: RIGHT_REST_X,
      y: REST_Y,
      tilt: 0,
      angle: 3,
      trails: [],
    });
    setOppHand({
      x: LEFT_REST_X,
      y: REST_Y,
      tilt: 0,
      angle: 0,
      trails: [],
    });
    setImpactFlash(null);
    updatePhase("player_idle");
    setStatusLine(
      "A fresh challenger steps up! Hold Aim & Swing to defend your title."
    );
  }, [stopActionAnim, updatePhase]);

  const resetMatch = useCallback(() => {
    stopActionAnim();
    playerHPRef.current = 100;
    oppHPRef.current = 100;
    winsRef.current = 0;
    setPlayerHP(100);
    setOppHP(100);
    setWins(0);
    setPower(0);
    powerRef.current = 0;
    setPlayerHand({
      x: RIGHT_REST_X,
      y: REST_Y,
      tilt: 0,
      angle: 3,
      trails: [],
    });
    setOppHand({
      x: LEFT_REST_X,
      y: REST_Y,
      tilt: 0,
      angle: 0,
      trails: [],
    });
    setImpactFlash(null);
    updatePhase("player_idle");
    setStatusLine(
      "Fresh autumn conker strung and knotted. Hold Aim & Swing, then release in the green sweet spot."
    );
  }, [stopActionAnim, updatePhase]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "BUTTON" || tag === "A") return;
        e.preventDefault();
        startCharge();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "BUTTON" || tag === "A") return;
        e.preventDefault();
        releaseSwing();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [startCharge, releaseSwing]);

  const playerCracks =
    playerHP <= 25 ? 4 : playerHP <= 50 ? 3 : playerHP <= 75 ? 2 : playerHP < 100 ? 1 : 0;
  const oppCracks =
    oppHP <= 25 ? 4 : oppHP <= 50 ? 3 : oppHP <= 75 ? 2 : oppHP < 100 ? 1 : 0;

  return (
    <div className="relative w-full aspect-video overflow-hidden rounded-xl border border-ink/15 bg-parchment shadow-sm select-none">
      {/* Village Green Watercolor Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 35%, #FAF8F2 0%, #EFECE4 72%, #E3DDD0 100%)",
        }}
      />
      {!imgError && (
        <div className="absolute inset-0 pointer-events-none">
          <img
            src={ILLUSTRATION_ASSETS.villageGreen}
            alt="English village green backyard conkers arena"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover object-top scale-[1.06]"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 84% 66% at 50% 42%, rgba(247, 246, 242, 0.93) 0%, rgba(247, 246, 242, 0.78) 58%, rgba(247, 246, 242, 0.18) 100%)",
            }}
          />
        </div>
      )}

      <div className="absolute inset-2.5 rounded-lg border border-ink/10 pointer-events-none z-10" />

      {/* Top HUD */}
      <div className="absolute top-4 inset-x-5 z-20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 rounded-md border border-ink/12 bg-vellum/92 px-3 py-1.5 backdrop-blur-xs">
          <Trophy className="h-3.5 w-3.5 text-chestnut" />
          <span className="font-mono text-xs font-semibold text-ink tabular-nums">
            {formatConkerRank(wins)}
          </span>
          <span className="text-bark/50" aria-hidden="true">
            ·
          </span>
          <span className="font-mono text-xs text-bark tabular-nums">
            Best: {bestStreak}-er
          </span>
        </div>

        <div className="flex items-center gap-4 rounded-md border border-ink/12 bg-vellum/92 px-3.5 py-1.5 backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-oakmoss" />
            <span className="text-xs font-medium text-ink">Opponent</span>
            <span className="font-mono text-xs font-semibold text-oakmoss tabular-nums">
              {oppHP}%
            </span>
          </div>
          <span className="text-bark/40" aria-hidden="true">
            |
          </span>
          <div className="flex items-center gap-2">
            <Swords className="h-3.5 w-3.5 text-chestnut" />
            <span className="text-xs font-medium text-ink">Yours</span>
            <span className="font-mono text-xs font-semibold text-chestnut tabular-nums">
              {playerHP}%
            </span>
          </div>
        </div>
      </div>

      {/* Live Pendulum SVG Stage */}
      <svg
        viewBox="0 0 960 540"
        className="absolute inset-0 h-full w-full z-10 pointer-events-none"
      >
        <defs>
          <filter id="finale-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="4"
              floodColor="#1C1917"
              floodOpacity="0.16"
            />
          </filter>
        </defs>

        {/* Opponent Conker (Left) */}
        {oppHP > 0 ? (
          <StorybookHand
            anchorX={oppHand.x}
            anchorY={oppHand.y}
            side="left"
            cuffColor="#2E5A36"
            stringLength={STRING_LEN}
            angleDeg={oppHand.angle}
            wristTiltDeg={oppHand.tilt}
            trailAngles={oppHand.trails}
            conkerId="finale-opp"
            cracks={oppCracks}
            filterId="finale-shadow"
          />
        ) : (
          <g>
            <line
              x1={LEFT_REST_X}
              y1={REST_Y}
              x2={LEFT_REST_X}
              y2={326}
              stroke="#C7A770"
              strokeWidth="3.5"
            />
            <text
              x={LEFT_REST_X}
              y={356}
              textAnchor="middle"
              fill="#57534E"
              fontFamily="Fraunces, Georgia, serif"
              fontSize="16"
              fontWeight="600"
            >
              Shattered
            </text>
          </g>
        )}

        {/* Player Conker (Right) */}
        {playerHP > 0 ? (
          <StorybookHand
            anchorX={playerHand.x}
            anchorY={playerHand.y}
            side="right"
            cuffColor="#8B3A1E"
            stringLength={STRING_LEN}
            angleDeg={playerHand.angle}
            wristTiltDeg={playerHand.tilt}
            trailAngles={playerHand.trails}
            conkerId="finale-player"
            cracks={playerCracks}
            filterId="finale-shadow"
          />
        ) : (
          <g>
            <line
              x1={RIGHT_REST_X}
              y1={REST_Y}
              x2={RIGHT_REST_X}
              y2={326}
              stroke="#C7A770"
              strokeWidth="3.5"
            />
            <text
              x={RIGHT_REST_X}
              y={356}
              textAnchor="middle"
              fill="#57534E"
              fontFamily="Fraunces, Georgia, serif"
              fontSize="16"
              fontWeight="600"
            >
              Broken
            </text>
          </g>
        )}

        {/* Impact Callout */}
        {impactFlash && impactFlash.opacity > 0 && (
          <g
            transform={`translate(${impactFlash.x}, ${impactFlash.y})`}
            opacity={impactFlash.opacity}
          >
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <line
                key={deg}
                x1={Math.cos((deg * Math.PI) / 180) * 14}
                y1={Math.sin((deg * Math.PI) / 180) * 14}
                x2={Math.cos((deg * Math.PI) / 180) * 42}
                y2={Math.sin((deg * Math.PI) / 180) * 42}
                stroke="#1C1917"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            ))}
            <text
              x={0}
              y={-40}
              textAnchor="middle"
              fill="#8B3A1E"
              fontFamily="Fraunces, Georgia, serif"
              fontWeight="700"
              fontSize="26"
            >
              {impactFlash.text}
            </text>
          </g>
        )}
      </svg>

      {/* Bottom Interactive Swing Control Deck */}
      <div className="absolute inset-x-5 bottom-4 z-20 flex flex-col items-center gap-2.5">
        <div className="rounded-lg bg-ink/86 px-4 py-1.5 text-center backdrop-blur-xs">
          <p className="text-xs md:text-sm font-medium text-vellum">
            {statusLine}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 rounded-xl border border-ink/15 bg-vellum/95 px-4 py-2.5 shadow-sm backdrop-blur-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-medium text-bark whitespace-nowrap">
              Swing Arc
            </span>
            <div className="relative h-3 w-36 md:w-44 overflow-hidden rounded-full border border-ink/20 bg-parchment">
              <div
                className="absolute inset-y-0 bg-oakmoss/28 border-x border-oakmoss/50"
                style={{ left: "62%", width: "26%" }}
              />
              <div
                className="h-full bg-chestnut transition-[width] duration-75"
                style={{ width: `${power}%` }}
              />
            </div>
            <span className="w-9 font-mono text-xs font-medium text-ink tabular-nums">
              {Math.round(power)}%
            </span>
          </div>

          {phase === "round_won" ? (
            <button
              type="button"
              onClick={nextChallenger}
              className="inline-flex items-center gap-2 rounded-lg bg-oakmoss px-4 py-2 text-xs md:text-sm font-semibold text-vellum transition-colors hover:opacity-90 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Swords className="h-4 w-4" />
              Face Next Challenger
            </button>
          ) : phase === "round_lost" ? (
            <button
              type="button"
              onClick={resetMatch}
              className="inline-flex items-center gap-2 rounded-lg bg-chestnut px-4 py-2 text-xs md:text-sm font-semibold text-vellum transition-colors hover:bg-chestnut-deep cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-4 w-4" />
              Grab Fresh Conker
            </button>
          ) : (
            <button
              type="button"
              onPointerDown={startCharge}
              onPointerUp={releaseSwing}
              disabled={phase !== "player_idle" && phase !== "player_charging"}
              className="inline-flex items-center gap-2 rounded-lg bg-chestnut px-4 py-2 text-xs md:text-sm font-semibold text-vellum transition-colors hover:bg-chestnut-deep disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap shrink-0"
            >
              <Swords className="h-4 w-4" />
              {phase === "player_charging"
                ? "Release to Swing!"
                : phase === "player_swinging" || phase === "opponent_winding"
                  ? "Hold Steady..."
                  : "Hold to Aim & Swing"}
            </button>
          )}

          <button
            type="button"
            onClick={onBackToFilm}
            className="rounded-lg border border-ink/18 bg-parchment px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-vellum cursor-pointer whitespace-nowrap shrink-0"
          >
            Back to Film
          </button>
        </div>
      </div>
    </div>
  );
};
