import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "BotCheck - How visible is your site to AI?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "12px",
              background: "#141414",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "16px",
              fontSize: "28px",
              fontWeight: "bold",
              color: "#fff",
            }}
          >
            <span style={{ color: "#fff" }}>B</span>
            <span style={{ color: "#3b82f6" }}>C</span>
          </div>
          <span
            style={{
              fontSize: "36px",
              fontWeight: "bold",
              color: "#ededed",
            }}
          >
            BotCheck
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: "56px",
            fontWeight: "bold",
            color: "#ededed",
            textAlign: "center",
            lineHeight: 1.2,
            marginBottom: "24px",
            letterSpacing: "-0.03em",
            display: "flex",
          }}
        >
          How&nbsp;<span style={{ color: "#3b82f6" }}>visible</span>&nbsp;is your site to AI?
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "24px",
            color: "#a1a1a1",
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: 1.5,
          }}
        >
          Check which AI crawlers are allowed or blocked on your site. No login. No tracking. Free to use.
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            fontSize: "18px",
            color: "#666",
          }}
        >
          botcheck.app
        </div>
      </div>
    ),
    { ...size }
  );
}
