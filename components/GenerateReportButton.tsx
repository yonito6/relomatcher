// components/GenerateReportButton.tsx
"use client";

import { useState } from "react";
import type { QuizData } from "@/lib/types";

type CountryMatch = {
  code: string;
  name: string;
  // the actual objects passed in can have more fields (totalScore, breakdown, etc.)
};

type GenerateReportButtonProps = {
  profile: QuizData | null;
  topMatches: CountryMatch[];
};

export function GenerateReportButton({
  profile,
  topMatches,
}: GenerateReportButtonProps) {
  const [loading, setLoading] = useState(false);

  const disabled =
    !profile || !topMatches || topMatches.length === 0 || loading;

  async function handleClick() {
    if (disabled) return;

    try {
      setLoading(true);

      // 1) Save the data needed to generate the report AFTER payment
      if (typeof window !== "undefined") {
        const payload = {
          profile,
          topMatches,
        };
        window.sessionStorage.setItem(
          "relomatcherReportPayload",
          JSON.stringify(payload)
        );
      }

      // 2) Create Stripe Checkout Session
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // ignore JSON parse errors, we'll handle below
      }

      if (!res.ok) {
        const serverError =
          data?.error || "Failed to create checkout session on the server.";
        throw new Error(serverError);
      }

      if (!data || !data.url) {
        throw new Error("No checkout URL returned from the server.");
      }

      // 3) Redirect user to Stripe payment page
      window.location.href = data.url;
    } catch (err: any) {
      console.error("Stripe checkout error:", err);
      alert(
        err?.message ||
          "Something went wrong while redirecting to payment. Please try again."
      );
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`mt-1 inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-[11px] font-semibold shadow-sm transition ${
        disabled
          ? "bg-slate-300 text-slate-500 cursor-not-allowed"
          : "bg-slate-900 text-white hover:bg-slate-800"
      }`}
    >
      <span className="mr-2 text-sm">🔒</span>
      <span className="flex flex-col items-start leading-tight">
        <span>
          Get my premium relocation PDF{" "}
          <span className="ml-1 text-[10px] align-middle">
            <span className="line-through mr-1 opacity-80">$59.99</span>
            <span className="text-emerald-300 font-semibold">$29.99</span>
          </span>
        </span>
        <span className="text-[9px] font-normal opacity-80">
          One-time payment · secure Stripe checkout
        </span>
      </span>
      {loading && (
        <span className="ml-2 text-[10px] opacity-80">
          Redirecting to payment…
        </span>
      )}
    </button>
  );
}
