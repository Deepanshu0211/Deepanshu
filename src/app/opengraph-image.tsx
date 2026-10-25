import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Deepanshu Yadav — Between worlds. Creative developer and full-stack engineer.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const image = await readFile(join(process.cwd(), "public/images/digital-relic-social.png"));
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", background: "#eee9df", color: "#482c22", display: "flex", flexDirection: "column", padding: "50px 64px", position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20 }}><span>DEEPANSHU YADAV</span><span>PORTFOLIO / 2026</span></div>
      <div style={{ display: "flex", flexDirection: "column", fontSize: 100, lineHeight: .95, letterSpacing: -6, marginTop: 92 }}><span>Between</span><span style={{ fontStyle: "italic" }}>worlds.</span></div>
      {/* A local asset keeps social previews independent of external image hosts. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`data:image/png;base64,${image.toString("base64")}`} alt="" width={510} height={510} style={{ position: "absolute", right: 45, top: 65 }} />
      <div style={{ display: "flex", flexDirection: "column", fontSize: 19, marginTop: "auto", borderTop: "1px solid #bdb4a7", paddingTop: 24, gap: 10 }}><span>CREATIVE DEVELOPER & FULL-STACK ENGINEER</span><span style={{ fontSize: 15 }}>WEB / MOBILE / DESKTOP — BASED IN INDIA</span></div>
    </div>, size,
  );
}

