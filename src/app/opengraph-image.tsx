import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const alt = "PerformanceOS · AI Diet Coach & Photo Food Logging";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const bgPath = path.join(process.cwd(), "public/images/illus/og-base.png");
  let bgBase64 = "";
  try {
    const bgData = fs.readFileSync(bgPath);
    bgBase64 = `data:image/png;base64,${bgData.toString("base64")}`;
  } catch {
    // Fallback if read fails
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: "#0C0C0D",
          backgroundImage: bgBase64 ? `url(${bgBase64})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: "80px",
          color: "#F5F5F4",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: "22px",
            letterSpacing: "4px",
            color: "#FF5533",
            textTransform: "uppercase",
            marginBottom: "20px",
            fontWeight: 700,
          }}
        >
          Nutrition · Training · Focus · Money
        </div>
        <div
          style={{
            fontSize: "64px",
            fontWeight: 800,
            lineHeight: 1.15,
            maxWidth: "750px",
            color: "#F5F5F4",
          }}
        >
          Snap your meal. Your coach does the math.
        </div>
        <div
          style={{
            fontSize: "26px",
            color: "#A1A1AA",
            marginTop: "24px",
            maxWidth: "680px",
            lineHeight: 1.4,
          }}
        >
          Adaptive calorie targets from your weight trend. Built for Indian meals.
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
