import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)",
          borderRadius: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="110" height="110" viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
          <path
            d="M12 2L22 8.5V15.5L12 22L2 15.5V8.5L12 2Z"
            stroke="url(#g)"
            strokeWidth="1.5"
            fill="none"
          />
          <circle cx="12" cy="12" r="3" fill="url(#g)" opacity="0.35" />
          <path d="M12 5V19" stroke="url(#g)" strokeWidth="0.6" opacity="0.25" />
          <path d="M5 8.5L19 15.5" stroke="url(#g)" strokeWidth="0.6" opacity="0.25" />
          <path d="M19 8.5L5 15.5" stroke="url(#g)" strokeWidth="0.6" opacity="0.25" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
