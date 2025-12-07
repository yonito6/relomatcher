// app/api/share-story/route.ts
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export const size = {
  width: 1080,
  height: 1920,
};

export const contentType = "image/png";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const c1 = searchParams.get("c1") || "Your top match";
  const c2 = searchParams.get("c2") || "";
  const c3 = searchParams.get("c3") || "";

  const s1 = searchParams.get("s1") || "";
  const s2 = searchParams.get("s2") || "";
  const s3 = searchParams.get("s3") || "";

  return new ImageResponse(
    (
      <div
        style={{
          width: size.width,
          height: size.height,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 72px 72px 72px",
          background:
            "radial-gradient(circle at top, #4f46e5 0, #020617 45%, #020617 100%)",
          color: "white",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 70,
                height: 70,
                borderRadius: 24,
                background:
                  "radial-gradient(circle at 30% 30%, #fbbf24, #0f172a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 34,
                boxShadow: "0 18px 36px rgba(0,0,0,0.6)",
              }}
            >
              🌍
            </div>
            <div>
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 700,
                  letterSpacing: 0.06,
                }}
              >
                Relomatcher
              </div>
              <div
                style={{
                  fontSize: 18,
                  color: "#cbd5f5",
                }}
              >
                Find your best country match
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: 4,
              padding: "8px 16px",
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.8)",
              color: "#e5e7eb",
            }}
          >
            My results
          </div>
        </div>

        {/* CENTER CONTENT */}
        <div
          style={{
            flex: 1,
            marginTop: 40,
            marginBottom: 40,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            gap: 28,
          }}
        >
          {/* Title + subtitle */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              maxWidth: 800,
            }}
          >
            <div
              style={{
                fontSize: 22,
                textTransform: "uppercase",
                letterSpacing: 5,
                color: "#a5b4fc",
              }}
            >
              My top 3 country matches
            </div>
            <div
              style={{
                fontSize: 48,
                fontWeight: 800,
                lineHeight: 1.1,
              }}
            >
              Based on my answers about taxes, lifestyle, climate and LGBTQ+
              safety.
            </div>
          </div>

          {/* Cards list */}
          <div
            style={{
              marginTop: 32,
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            {renderStoryCountryCard(1, c1, s1)}
            {c2 ? renderStoryCountryCard(2, c2, s2) : null}
            {c3 ? renderStoryCountryCard(3, c3, s3) : null}
          </div>
        </div>

        {/* FOOTER / CTA */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              fontSize: 18,
              color: "#9ca3af",
            }}
          >
            Want to see your own top 3?
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            Take your quiz on
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: "#fef08a",
              textShadow: "0 4px 18px rgba(0,0,0,0.5)",
            }}
          >
            www.relomatcher.com
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 16,
              maxWidth: 640,
              color: "#9ca3af",
              lineHeight: 1.6,
            }}
          >
            Your matches are calculated with a custom scoring engine and refined
            with AI. Screenshot this story and share it — then invite your
            friends to compare their top 3.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

// Helper: vertical story card with MATCHED stamp
function renderStoryCountryCard(rank: number, country: string, score: string) {
  const scoreText = score ? `${score}/10` : "";

  const isFirst = rank === 1;

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 28,
        padding: "20px 22px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: isFirst
          ? "linear-gradient(135deg, rgba(251,191,36,0.18), rgba(15,23,42,0.98))"
          : "linear-gradient(135deg, rgba(148,163,184,0.22), rgba(15,23,42,0.98))",
        border: isFirst
          ? "1.5px solid rgba(251,191,36,0.9)"
          : "1.5px solid rgba(148,163,184,0.85)",
        boxShadow: "0 22px 40px rgba(15,23,42,0.85)",
      }}
    >
      {/* Rank & name */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 999,
            border: "1.5px solid rgba(148,163,184,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            fontWeight: 800,
            background: "rgba(15,23,42,0.8)",
          }}
        >
          {rank}
        </div>
        <div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            {country}
          </div>
          {scoreText && (
            <div
              style={{
                marginTop: 4,
                fontSize: 16,
                color: "#e5e7eb",
              }}
            >
              Match score:{" "}
              <span style={{ fontWeight: 700, color: "#fde68a" }}>
                {scoreText}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* MATCHED stamp */}
      <div
        style={{
          borderRadius: 999,
          border: "2px solid rgba(74,222,128,0.9)",
          padding: "6px 18px",
          fontSize: 14,
          fontWeight: 900,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: "#bbf7d0",
          transform: "rotate(-7deg)",
          boxShadow: "0 8px 22px rgba(22,163,74,0.55)",
          background:
            "linear-gradient(135deg, rgba(22,163,74,0.55), rgba(15,23,42,0.95))",
        }}
      >
        MATCHED
      </div>
    </div>
  );
}
