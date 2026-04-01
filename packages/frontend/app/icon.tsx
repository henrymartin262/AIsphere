import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #e0e7ff",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
          {/* Hexagon outline */}
          <path
            d="M12 2L22 8.5V15.5L12 22L2 15.5V8.5L12 2Z"
            stroke="url(#g)"
            strokeWidth="1.5"
            fill="none"
          />
          {/* Center dot */}
          <circle cx="12" cy="12" r="3" fill="url(#g)" opacity="0.35" />
          {/* Cross lines */}
          <path d="M12 5V19" stroke="url(#g)" strokeWidth="0.6" opacity="0.25" />
          <path d="M5 8.5L19 15.5" stroke="url(#g)" strokeWidth="0.6" opacity="0.25" />
          <path d="M19 8.5L5 15.5" stroke="url(#g)" strokeWidth="0.6" opacity="0.25" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
