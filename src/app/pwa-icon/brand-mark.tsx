import { ImageResponse } from "next/og";

/** The app mark as a PNG at any size, for home-screen icons. Colours match tokens.css (fern, paper, sun). */
export function brandMark(size: number, padded = false) {
  const inset = padded ? size * 0.12 : 0;
  const mark = size - inset * 2;
  return new ImageResponse(
    (
      <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", background: "#1f6344" }}>
        <svg width={mark} height={mark} viewBox="0 0 64 64">
          <path d="M17 47c9.6 0 9.1-11.5 17.3-17.3S42.1 12.3 51.7 12.3" fill="none" stroke="#f4f1e9" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="17" cy="47" r="5.3" fill="#f4f1e9" />
          <circle cx="34.3" cy="29.7" r="4.2" fill="#e7a032" />
          <circle cx="47" cy="17" r="5.8" fill="none" stroke="#f4f1e9" strokeWidth="4" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
