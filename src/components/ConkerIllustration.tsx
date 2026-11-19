import React from "react";

interface ConkerIllustrationProps {
  cx?: number;
  cy?: number;
  radius?: number;
  cracks?: number; // 0 to 4
  rotation?: number;
  variant?: "mahogany" | "chestnut" | "aged";
  showBoreHole?: boolean;
  boreDepth?: number; // 0 to 1
  idPrefix?: string;
}

export const ConkerIllustration: React.FC<ConkerIllustrationProps> = ({
  cx = 0,
  cy = 0,
  radius = 44,
  cracks = 0,
  rotation = 0,
  variant = "mahogany",
  showBoreHole = false,
  boreDepth = 0,
  idPrefix = "conker",
}) => {
  const palette =
    variant === "chestnut"
      ? { hi: "#B4532A", mid: "#7C2D12", deep: "#3F1508" }
      : variant === "aged"
        ? { hi: "#9A4A28", mid: "#5C2410", deep: "#2B1007" }
        : { hi: "#A64422", mid: "#6D2610", deep: "#361106" };

  const gradId = `${idPrefix}-grad-${variant}`;
  const hilumGradId = `${idPrefix}-hilum`;

  return (
    <g transform={`translate(${cx}, ${cy}) rotate(${rotation})`}>
      <defs>
        <radialGradient id={gradId} cx="34%" cy="28%" r="72%">
          <stop offset="0%" stopColor={palette.hi} />
          <stop offset="55%" stopColor={palette.mid} />
          <stop offset="100%" stopColor={palette.deep} />
        </radialGradient>
        <radialGradient id={hilumGradId} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#EFE5D5" />
          <stop offset="75%" stopColor="#D6C4AA" />
          <stop offset="100%" stopColor="#A99276" />
        </radialGradient>
      </defs>

      {/* Slightly asymmetrical organic chestnut silhouette */}
      <path
        d={`
          M 0 ${-radius * 0.94}
          C ${radius * 0.62} ${-radius * 0.92}, ${radius * 1.04} ${-radius * 0.42}, ${radius * 1.02} ${radius * 0.14}
          C ${radius * 0.98} ${radius * 0.72}, ${radius * 0.56} ${radius * 0.98}, 0 ${radius * 0.98}
          C ${-radius * 0.56} ${radius * 0.98}, ${-radius * 0.98} ${radius * 0.72}, ${-radius * 1.02} ${radius * 0.14}
          C ${-radius * 1.04} ${-radius * 0.42}, ${-radius * 0.62} ${-radius * 0.92}, 0 ${-radius * 0.94}
          Z
        `}
        fill={`url(#${gradId})`}
        stroke="#1C1917"
        strokeWidth={Math.max(1.8, radius * 0.055)}
        strokeLinejoin="round"
      />

      {/* Matte cream hilum patch near bottom */}
      <ellipse
        cx={0}
        cy={radius * 0.68}
        rx={radius * 0.56}
        ry={radius * 0.23}
        fill={`url(#${hilumGradId})`}
        stroke="#1C1917"
        strokeWidth={Math.max(1.1, radius * 0.032)}
        opacity={0.95}
      />

      {/* Pen-and-ink contour shading strokes along lower right */}
      <path
        d={`M ${radius * 0.45} ${radius * 0.35} Q ${radius * 0.74} ${radius * 0.15} ${radius * 0.76} ${-radius * 0.22}`}
        fill="none"
        stroke="#1C1917"
        strokeWidth={Math.max(0.9, radius * 0.024)}
        strokeLinecap="round"
        opacity={0.45}
      />
      <path
        d={`M ${radius * 0.56} ${radius * 0.46} Q ${radius * 0.85} ${radius * 0.22} ${radius * 0.85} ${-radius * 0.08}`}
        fill="none"
        stroke="#1C1917"
        strokeWidth={Math.max(0.8, radius * 0.02)}
        strokeLinecap="round"
        opacity={0.38}
      />

      {/* Glossy storybook specular glint */}
      <ellipse
        cx={-radius * 0.34}
        cy={-radius * 0.36}
        rx={radius * 0.24}
        ry={radius * 0.12}
        transform={`rotate(-28 ${-radius * 0.34} ${-radius * 0.36})`}
        fill="#FFFBF5"
        opacity={0.72}
      />
      <circle
        cx={-radius * 0.12}
        cy={-radius * 0.52}
        r={radius * 0.06}
        fill="#FFFBF5"
        opacity={0.55}
      />

      {/* Bore hole channel if being drilled / threaded */}
      {showBoreHole && (
        <g>
          <ellipse
            cx={0}
            cy={-radius * 0.91}
            rx={radius * 0.11}
            ry={radius * 0.055}
            fill="#2B140A"
            stroke="#1C1917"
            strokeWidth={1.2}
          />
          {boreDepth > 0 && (
            <line
              x1={0}
              y1={-radius * 0.9}
              x2={0}
              y2={-radius * 0.9 + boreDepth * radius * 1.84}
              stroke="#241108"
              strokeWidth={radius * 0.14}
              strokeLinecap="round"
              opacity={0.62}
            />
          )}
        </g>
      )}

      {/* Progressive ink fracture lines */}
      {cracks >= 1 && (
        <path
          d={`M ${-radius * 0.08} ${-radius * 0.42} L ${radius * 0.14} ${-radius * 0.12} L ${-radius * 0.05} ${radius * 0.18}`}
          fill="none"
          stroke="#1C1917"
          strokeWidth={Math.max(1.5, radius * 0.045)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {cracks >= 2 && (
        <path
          d={`M ${radius * 0.14} ${-radius * 0.12} L ${radius * 0.52} ${radius * 0.06} L ${radius * 0.68} ${radius * 0.26}`}
          fill="none"
          stroke="#1C1917"
          strokeWidth={Math.max(1.4, radius * 0.04)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {cracks >= 3 && (
        <path
          d={`M ${-radius * 0.05} ${radius * 0.18} L ${-radius * 0.48} ${radius * 0.34} L ${-radius * 0.65} ${radius * 0.18}`}
          fill="none"
          stroke="#1C1917"
          strokeWidth={Math.max(1.4, radius * 0.04)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {cracks >= 4 && (
        <path
          d={`M ${-radius * 0.05} ${radius * 0.18} L ${radius * 0.12} ${radius * 0.62} M ${radius * 0.02} ${-radius * 0.85} L ${-radius * 0.12} ${-radius * 0.44}`}
          fill="none"
          stroke="#EFE5D5"
          strokeWidth={Math.max(1.6, radius * 0.042)}
          strokeLinecap="round"
          opacity={0.85}
        />
      )}
    </g>
  );
};
