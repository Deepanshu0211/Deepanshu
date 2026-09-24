import { ImageResponse } from "next/og";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        background: "#f9f9f6",
        color: "#232622",
        fontSize: 125,
        fontStyle: "italic",
        fontWeight: 800,
        letterSpacing: -16,
      }}
    >
      dy
      <span style={{ fontSize: 60, color: "#2448f5", letterSpacing: 0 }}>
        ·
      </span>
    </div>,
    size,
  );
}
