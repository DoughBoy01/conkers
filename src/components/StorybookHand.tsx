import React from "react";
import { ConkerIllustration } from "./ConkerIllustration.tsx";

export interface StorybookHandProps {
  anchorX: number;
  anchorY: number;
  side: "left" | "right";
  cuffColor: string;
  stringLength: number;
  angleDeg: number;
  conkerId: string;
  cracks?: number;
  wristTiltDeg?: number;
  trailAngles?: number[];
  label?: string;
  labelOpacity?: number;
  filterId?: string;
}

/**
 * Hand-inked British storybook arm, ribbed jumper cuff, articulated wrist/hand,
 * curled fingers, thumb-and-index pinch, optional motion-blur speed trails,
 * and pendulum string + conker.
 * (anchorX, anchorY) is the live pinch grip point where the string hangs.
 */
export const StorybookHand: React.FC<StorybookHandProps> = ({
  anchorX,
  anchorY,
  side,
  cuffColor,
  stringLength,
  angleDeg,
  conkerId,
  cracks = 0,
  wristTiltDeg = 0,
  trailAngles = [],
  label,
  labelOpacity = 0,
  filterId = "ink-shadow",
}) => {
  const mirror = side === "left" ? 1 : -1;
  const rad = (angleDeg * Math.PI) / 180;
  const bobX = Math.sin(rad) * stringLength;
  const bobY = Math.cos(rad) * stringLength;

  return (
    <g>
      {/* Dynamic Ink Speed Arc Trails behind fast-swinging conker */}
      {trailAngles.length > 0 && (
        <g transform={`translate(${anchorX}, ${anchorY})`}>
          {trailAngles.map((tAngle, idx) => {
            const tRad = (tAngle * Math.PI) / 180;
            const tx = Math.sin(tRad) * stringLength;
            const ty = Math.cos(tRad) * stringLength;
            const arcRadius = stringLength;
            const largeArc = Math.abs(angleDeg - tAngle) > 180 ? 1 : 0;
            const sweep = angleDeg > tAngle ? 0 : 1;
            const alpha = ((idx + 1) / (trailAngles.length + 1)) * 0.42;

            return (
              <g key={idx} opacity={alpha}>
                <path
                  d={`M ${tx} ${ty} A ${arcRadius} ${arcRadius} 0 ${largeArc} ${sweep} ${bobX} ${bobY}`}
                  fill="none"
                  stroke="#8B3A1E"
                  strokeWidth={2.2 - idx * 0.35}
                  strokeLinecap="round"
                  strokeDasharray="10 6"
                />
                <circle
                  cx={tx}
                  cy={ty}
                  r={22}
                  fill="#8B3A1E"
                  opacity={0.14}
                />
              </g>
            );
          })}
        </g>
      )}

      {/* String & Hanging Conker */}
      <g transform={`translate(${anchorX}, ${anchorY})`}>
        {/* Small twine loop pinched above fingers */}
        <path
          d="M -4 -8 C -4 -18 5 -18 5 -7"
          fill="none"
          stroke="#C7A770"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <line
          x1={0}
          y1={0}
          x2={bobX}
          y2={bobY}
          stroke="#C7A770"
          strokeWidth="3.8"
          strokeLinecap="round"
        />
        <line
          x1={0}
          y1={0}
          x2={bobX}
          y2={bobY}
          stroke="#1C1917"
          strokeWidth="1.1"
          strokeDasharray="5 4"
          opacity={0.42}
        />

        <g transform={`translate(${bobX}, ${bobY}) rotate(${-angleDeg})`}>
          <g filter={`url(#${filterId})`}>
            <ConkerIllustration
              cx={0}
              cy={0}
              radius={30}
              cracks={cracks}
              idPrefix={conkerId}
            />
          </g>
          {/* Stopper knot */}
          <circle
            cx={0}
            cy={32}
            r={5.5}
            fill="#D4B782"
            stroke="#1C1917"
            strokeWidth="1.5"
          />
        </g>
      </g>

      {/* Anatomical Arm & Articulated Wrist/Hand pinching string at (anchorX, anchorY) */}
      <g
        transform={`translate(${anchorX}, ${anchorY}) scale(${mirror}, 1) rotate(${wristTiltDeg})`}
      >
        {/* Angled wool jumper sleeve entering naturally from side-below */}
        <path
          d="M -480 82 C -340 62, -200 38, -98 16 L -102 -18 C -205 -4, -345 14, -480 28 Z"
          fill={cuffColor}
          stroke="#1C1917"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Sleeve fabric fold lines */}
        <path
          d="M -185 18 Q -150 14 -118 8 M -240 28 Q -205 22 -175 20"
          fill="none"
          stroke="#1C1917"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity={0.35}
        />

        {/* Ribbed wool cuff */}
        <g transform="translate(-98, 0) rotate(-6)">
          <rect
            x={-16}
            y={-19}
            width={26}
            height={38}
            rx={6}
            fill="#EDE8DC"
            stroke="#1C1917"
            strokeWidth="1.9"
          />
          {[-10, -3, 4, 11].map((yPos) => (
            <line
              key={yPos}
              x1={-13}
              y1={yPos}
              x2={7}
              y2={yPos}
              stroke="#1C1917"
              strokeWidth="1.1"
              opacity={0.38}
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* Wrist & Heel of Hand */}
        <path
          d="M -86 -12 C -68 -14, -52 -16, -34 -16 C -20 -16, -8 -10, -2 -3 C 4 4, -2 18, -18 22 C -36 26, -64 22, -86 15 Z"
          fill="#F5D3BE"
          stroke="#1C1917"
          strokeWidth="1.9"
          strokeLinejoin="round"
        />

        {/* Curled Pinky, Ring, and Middle Fingers tucked under the palm */}
        <path
          d="M -32 16 C -24 24, -14 25, -10 19 C -7 14, -14 9, -24 10"
          fill="#EFC4AC"
          stroke="#1C1917"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M -24 9 C -14 19, -2 20, 2 13 C 5 7, -4 2, -16 4"
          fill="#F2CCB6"
          stroke="#1C1917"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M -18 1 C -6 12, 7 13, 10 5 C 12 -1, 2 -5, -12 -3"
          fill="#F5D3BE"
          stroke="#1C1917"
          strokeWidth="1.7"
          strokeLinecap="round"
        />

        {/* Index Finger arching over top to pinch the twine */}
        <path
          d="M -42 -15 C -24 -22, -4 -22, 6 -11 C 11 -5, 9 2, 1 3 C -6 4, -12 -2, -18 -5"
          fill="#F7D8C5"
          stroke="#1C1917"
          strokeWidth="1.85"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M -16 -15 Q -12 -12 -13 -8"
          fill="none"
          stroke="#1C1917"
          strokeWidth="1.1"
          opacity={0.4}
          strokeLinecap="round"
        />

        {/* Thumb pressing cleanly onto the front side of the string */}
        <path
          d="M -56 -2 C -42 -10, -24 -11, -9 -6 C -1 -3, 2 3, -5 6 C -15 10, -34 10, -50 7"
          fill="#FADFD0"
          stroke="#1C1917"
          strokeWidth="1.85"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M -8 -4 C -3 -4, -1 -1, -3 2 C -6 3, -9 1, -8 -4 Z"
          fill="#FFF4EC"
          stroke="#1C1917"
          strokeWidth="1.1"
          opacity={0.8}
        />
      </g>

      {/* Optional contextual label */}
      {label && labelOpacity > 0 && (
        <g
          transform={`translate(${anchorX}, ${anchorY - 38})`}
          opacity={labelOpacity}
        >
          <text
            x={0}
            y={0}
            textAnchor="middle"
            fill="#2E5A36"
            fontFamily="Plus Jakarta Sans, sans-serif"
            fontSize="13"
            fontWeight="600"
          >
            {label}
          </text>
        </g>
      )}
    </g>
  );
};
