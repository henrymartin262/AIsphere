"use client";

interface SoulSignatureProps {
  signature: string; // bytes32 hex string, e.g. "0xabc123..."
  size?: number;     // SVG size, default 120
  className?: string;
}

export function SoulSignature({ signature, size = 120, className = "" }: SoulSignatureProps) {
  // Parse hash byte segments into pattern parameters
  const hex = signature.replace("0x", "").padEnd(64, "0");

  // Extract color and shape parameters from different positions in the hash
  const r1 = parseInt(hex.slice(0, 2), 16);   // primary hue 0-255
  const r2 = parseInt(hex.slice(2, 4), 16);   // secondary hue
  const r3 = parseInt(hex.slice(4, 6), 16);   // shape rotation
  const r4 = parseInt(hex.slice(6, 8), 16);   // inner circle radius ratio
  const r5 = parseInt(hex.slice(8, 10), 16);  // polygon sides (5-8)
  const r6 = parseInt(hex.slice(10, 12), 16); // second layer rotation
  const r7 = parseInt(hex.slice(12, 14), 16); // point count variation
  const r8 = parseInt(hex.slice(14, 16), 16); // opacity variation

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.42;
  const innerR = size * 0.18 + (r4 / 255) * size * 0.12;
  const midR = (outerR + innerR) / 2;

  // Primary HSL colors
  const hue1 = Math.floor((r1 / 255) * 360);
  const hue2 = (hue1 + 120 + Math.floor((r2 / 255) * 120)) % 360;
  const hue3 = (hue1 + 240) % 360;
  const sat = 65 + Math.floor((r3 / 255) * 25);  // 65-90%
  const lit = 55 + Math.floor((r8 / 255) * 15);  // 55-70%

  const color1 = `hsl(${hue1}, ${sat}%, ${lit}%)`;
  const color2 = `hsl(${hue2}, ${sat}%, ${lit}%)`;
  const color3 = `hsl(${hue3}, ${sat - 10}%, ${lit + 5}%)`;

  // Generate polygon vertices (outer layer)
  const sides = 5 + (r5 % 4);  // 5-8 sides
  const rotation1 = (r3 / 255) * 360;
  const rotation2 = rotation1 + 45 + (r6 / 255) * 90;

  function polygonPoints(
    pcx: number,
    pcy: number,
    r: number,
    n: number,
    rot: number
  ): string {
    const pts: string[] = [];
    for (let i = 0; i < n; i++) {
      const angle = (rot + (360 / n) * i) * (Math.PI / 180);
      pts.push(
        `${(pcx + r * Math.cos(angle)).toFixed(2)},${(pcy + r * Math.sin(angle)).toFixed(2)}`
      );
    }
    return pts.join(" ");
  }

  // Inner star (alternating outer/inner radius for each vertex)
  function starPoints(
    pcx: number,
    pcy: number,
    oR: number,
    iR: number,
    n: number,
    rot: number
  ): string {
    const pts: string[] = [];
    for (let i = 0; i < n * 2; i++) {
      const angle = (rot + (360 / (n * 2)) * i) * (Math.PI / 180);
      const r = i % 2 === 0 ? oR : iR;
      pts.push(
        `${(pcx + r * Math.cos(angle)).toFixed(2)},${(pcy + r * Math.sin(angle)).toFixed(2)}`
      );
    }
    return pts.join(" ");
  }

  const gradId = `soul-${hex.slice(0, 8)}`;
  const innerSides = 3 + (r7 % 3);  // 3-5 sides inner layer

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ borderRadius: "50%" }}
    >
      <defs>
        <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color3} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color1} stopOpacity="0.05" />
        </radialGradient>
      </defs>

      {/* Background circle */}
      <circle cx={cx} cy={cy} r={outerR * 1.1} fill={`url(#${gradId})`} />

      {/* Outer polygon */}
      <polygon
        points={polygonPoints(cx, cy, outerR, sides, rotation1)}
        fill="none"
        stroke={color1}
        strokeWidth="1.5"
        strokeOpacity="0.8"
      />

      {/* Mid star layer */}
      <polygon
        points={starPoints(cx, cy, midR, midR * 0.55, sides, rotation2)}
        fill={color2}
        fillOpacity="0.15"
        stroke={color2}
        strokeWidth="1"
        strokeOpacity="0.6"
      />

      {/* Inner small polygon */}
      <polygon
        points={polygonPoints(cx, cy, innerR, innerSides, rotation1 + 30)}
        fill={color1}
        fillOpacity="0.25"
        stroke={color1}
        strokeWidth="1"
        strokeOpacity="0.9"
      />

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={size * 0.03} fill={color1} fillOpacity="0.9" />

      {/* Lines from center to outer vertices */}
      {Array.from({ length: sides }).map((_, i) => {
        const angle = ((rotation1 + (360 / sides) * i) * Math.PI) / 180;
        const x2 = (cx + outerR * Math.cos(angle)).toFixed(2);
        const y2 = (cy + outerR * Math.sin(angle)).toFixed(2);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x2}
            y2={y2}
            stroke={color3}
            strokeWidth="0.5"
            strokeOpacity="0.3"
          />
        );
      })}
    </svg>
  );
}
