// app/premium/success/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ReportPayload = {
  profile: any;
  topMatches: any[];
};

export default function PremiumSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const [status, setStatus] = useState<
    "idle" | "generating" | "ready" | "error" | "missing"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function generateAndDownload() {
    try {
      setStatus("generating");
      setErrorMessage(null);

      if (typeof window === "undefined") return;

      const stored = window.sessionStorage.getItem(
        "relomatcherReportPayload"
      );

      if (!stored) {
        setStatus("missing");
        setErrorMessage(
          "We couldn't find your answers. Please run the matcher again to regenerate your report."
        );
        return;
      }

      const payload: ReportPayload = JSON.parse(stored);

      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to generate report");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "relomatcher-relocation-report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setStatus("ready");
    } catch (err) {
      console.error("Report generation error:", err);
      setStatus("error");
      setErrorMessage(
        "Something went wrong while generating your report. Please try again."
      );
    }
  }

  // Auto-generate once when page loads
  useEffect(() => {
    generateAndDownload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sessionId = searchParams.session_id;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-2 text-center">
          Payment successful 🎉
        </h1>
        <p className="text-gray-600 text-center mb-4">
          Thanks for supporting the Relocation Matcher!
          <br />
          Your premium report is being generated now.
        </p>

        {status === "generating" && (
          <p className="text-sm text-gray-600 text-center mb-3">
            Generating your personalized PDF… this usually takes just a few
            seconds.
          </p>
        )}

        {(status === "ready" || status === "error" || status === "missing") && (
          <button
            onClick={generateAndDownload}
            className="block w-full text-center rounded-xl bg-black text-white py-3 font-semibold shadow-md hover:opacity-90 mb-3"
          >
            {status === "ready"
              ? "Download your report again"
              : "Try generating your report again"}
          </button>
        )}

        {errorMessage && (
          <p className="text-xs text-red-500 text-center mb-2">
            {errorMessage}
          </p>
        )}

        <p className="text-xs text-gray-500 text-center mb-2">
          If the download doesn&apos;t start automatically, click the button
          above.
        </p>

        <Link
          href="/"
          className="block text-center text-sm text-blue-600 hover:underline"
        >
          Back to the matcher
        </Link>

        {sessionId && (
          <p className="mt-4 text-[11px] text-gray-400 text-center">
            Stripe session: {sessionId}
          </p>
        )}
      </div>
    </div>
  );
}
