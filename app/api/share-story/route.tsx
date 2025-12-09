// app/api/share-story/route.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const c1 = searchParams.get("c1") || "Top match #1";
    const c2 = searchParams.get("c2") || "Top match #2";
    const c3 = searchParams.get("c3") || "Top match #3";

    const s1 = searchParams.get("s1") || "";
    const s2 = searchParams.get("s2") || "";
    const s3 = searchParams.get("s3") || "";

    // Build absolute base URL for the logo
    const { origin } = new URL(req.url);

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#020617",
            padding: 64,
            boxSizing: "border-box",
          }}
        >
          {/* TOP SECTION */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
              marginBottom: 20,
            }}
          >
            {/* Center Logo */}
            <img
              src={`${origin}/logo.png`} // <<<<<< KEY FIX
              alt="Relomatcher Logo"
              style={{
                width: 180,
                height: "auto",
                objectFit: "contain",
                marginBottom: 28,
              }}
            />

            {/* Capsule */}
            <div
              style={{
                padding: "8px 18px",
                borderRadius: 999,
                border: "1px solid #4b5563",
                fontSize: 22,
                textTransform: "uppercase",
                letterSpacing: 6,
                color: "#e5e7eb",
              }}
            >
              Your matches
            </div>
          </div>

          {/* CENTER CARD */}
          <div
            style={{
              flexGrow: 1,
              marginTop: 48,
              marginBottom: 48,
              borderRadius: 32,
              border: "1px solid #374151",
              background:
                "radial-gradient(circle at top, rgba(251,191,36,0.18), transparent 60%), #020617",
              padding: 40,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              gap: 32,
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                fontSize: 40,
                fontWeight: 700,
                color: "#ffffff",
              }}
            >
              Your top 3 country matches
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 18,
                fontSize: 30,
                color: "#e5e7eb",
              }}
            >
              <Row label="#1" name={c1} score={s1} highlight />
              <Row label="#2" name={c2} score={s2} />
              <Row label="#3" name={c3} score={s3} />
            </div>
          </div>

          {/* CTA */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              fontSize: 26,
            }}
          >
            <div style={{ color: "#e5e7eb" }}>
              Take your quiz to find your best country match too!
            </div>
            <div
              style={{
                color: "#fbbf24",
                fontWeight: 600,
              }}
            >
              Take your quiz on www.relomatcher.com
            </div>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1920,
      }
    );
  } catch (e: any) {
    console.error("share-story error:", e);
    return new Response("Failed to generate image", { status: 500 });
  }
}

function Row(props: {
  label: string;
  name: string;
  score: string;
  highlight?: boolean;
}) {
  const { label, name, score, highlight } = props;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 22px",
        borderRadius: 999,
        border: highlight ? "1px solid #fbbf24" : "1px solid #4b5563",
        backgroundColor: highlight ? "rgba(251,191,36,0.06)" : "transparent",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 999,
            backgroundColor: highlight ? "#fbbf24" : "#111827",
            color: highlight ? "#111827" : "#e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 600,
            maxWidth: 580,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </div>
      </div>

      {score ? (
        <div
          style={{
            fontSize: 26,
            color: "#fbbf24",
            fontWeight: 600,
          }}
        >
          {score}/10
        </div>
      ) : null}
    </div>
  );
}
