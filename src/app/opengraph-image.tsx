import { ImageResponse } from "next/og";
export const alt = "Deepanshu Yadav — Frontend and full-stack developer.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#f9f9f6",
        color: "#232622",
        display: "flex",
        flexDirection: "column",
        padding: "62px 75px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 20,
        }}
      >
        <span>DEEPANSHU YADAV</span>
        <span style={{ color: "#2448f5" }}>DEVELOPER / CURIOUS HUMAN</span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 100,
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: -6,
          marginTop: 70,
        }}
      >
        <span>DEEPANSHU</span>
        <span>
          YADAV<span style={{ color: "#2448f5" }}>.</span>
        </span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          borderTop: "1px solid #cfd6c5",
          paddingTop: 30,
          marginTop: 55,
          fontSize: 20,
        }}
      >
        <span>Frontend & Full-Stack Developer</span>
        <span>JUST ME, MAKING THINGS. ↗</span>
      </div>
    </div>,
    size,
  );
}
