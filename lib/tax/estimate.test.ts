import { describe, it, expect } from "vitest";
import { estimateTax, rateAtIncome } from "@/lib/tax/estimate";
import { taxProfileFor, TAX_PROFILES } from "@/lib/tax/data";
import type { TaxProfile } from "@/lib/tax/types";

const sample: TaxProfile = {
  employed: { low: 0.1, mid: 0.2, high: 0.3 },
  selfEmployed: { low: 0.15, mid: 0.25, high: 0.35 },
  remoteRegime: { rate: 0.01, label: "1% test regime", appliesTo: ["remote_foreign"] },
  vat: 20,
  notes: "test",
  confidence: "high",
};

describe("rateAtIncome", () => {
  it("returns anchor values at the anchor incomes", () => {
    expect(rateAtIncome(sample.employed, 30_000)).toBeCloseTo(0.1);
    expect(rateAtIncome(sample.employed, 75_000)).toBeCloseTo(0.2);
    expect(rateAtIncome(sample.employed, 150_000)).toBeCloseTo(0.3);
  });
  it("interpolates between anchors and flat-extrapolates outside", () => {
    expect(rateAtIncome(sample.employed, 52_500)).toBeCloseTo(0.15); // midpoint low-mid
    expect(rateAtIncome(sample.employed, 10_000)).toBeCloseTo(0.1); // below low
    expect(rateAtIncome(sample.employed, 500_000)).toBeCloseTo(0.3); // above high
  });
});

describe("estimateTax", () => {
  it("employed uses the employed curve", () => {
    const e = estimateTax(sample, 75_000, "employed");
    expect(e.effectiveRate).toBeCloseTo(0.2);
    expect(e.taxAmount).toBe(15_000);
    expect(e.netAmount).toBe(60_000);
    expect(e.netPercent).toBe(80);
    expect(e.regimeApplied).toBeNull();
  });

  it("self-employed uses the higher self-employed curve", () => {
    const e = estimateTax(sample, 75_000, "self_employed");
    expect(e.effectiveRate).toBeCloseTo(0.25);
  });

  it("remote_foreign applies a beating special regime", () => {
    const e = estimateTax(sample, 75_000, "remote_foreign");
    expect(e.regimeApplied).toBe("1% test regime");
    expect(e.effectiveRate).toBeCloseTo(0.01);
    expect(e.netPercent).toBe(99);
  });

  it("always carries an honest disclaimer", () => {
    expect(estimateTax(sample, 50_000, "employed").disclaimer).toMatch(/not tax/i);
  });

  it("zero-tax countries (e.g. UAE) keep ~100%", () => {
    const ae = taxProfileFor("AE")!;
    const e = estimateTax(ae, 90_000, "employed");
    expect(e.netPercent).toBe(100);
  });
});

describe("regime eligibility ceilings", () => {
  const FR = taxProfileFor("FR")!;
  const PL = taxProfileFor("PL")!;

  it("applies the France micro regime for a small self-employed earner under the cap", () => {
    const e = estimateTax(FR, 60_000, "self_employed");
    expect(e.regimeApplied).toMatch(/Micro-entrepreneur/);
  });

  it("does NOT apply France micro when revenue exceeds the cap (the $960k bug)", () => {
    // Ecommerce store ~$80k/mo = ~$960k/yr revenue → French micro (turnover cap
    // ~€203k) is unavailable; must fall back to the normal self-employed curve.
    const e = estimateTax(FR, 200_000, "self_employed", 960_000);
    expect(e.regimeApplied).toBeNull();
    expect(e.effectiveRate).toBeGreaterThan(0.3);
  });

  it("does NOT apply France micro when income alone exceeds the cap (no revenue given)", () => {
    const e = estimateTax(FR, 300_000, "self_employed");
    expect(e.regimeApplied).toBeNull();
  });

  it("keeps Poland's lump-sum regime available at high revenue (cap ~€2M)", () => {
    const e = estimateTax(PL, 200_000, "self_employed", 960_000);
    expect(e.regimeApplied).toMatch(/ryczałt/);
  });

  it("falls back to income as the turnover proxy when no revenue is supplied", () => {
    const profile: TaxProfile = {
      employed: { low: 0.3, mid: 0.35, high: 0.4 },
      selfEmployed: { low: 0.3, mid: 0.35, high: 0.4 },
      remoteRegime: { rate: 0.05, label: "Flat 5%", appliesTo: ["self_employed"], maxAnnualRevenue: 100_000 },
      vat: 20,
      notes: "test",
      confidence: "low",
    };
    expect(estimateTax(profile, 50_000, "self_employed").regimeApplied).toBe("Flat 5%");
    expect(estimateTax(profile, 150_000, "self_employed").regimeApplied).toBeNull();
  });
});

describe("TAX_PROFILES coverage", () => {
  it("has a profile for every confidence-tagged country and valid rates", () => {
    for (const [code, p] of Object.entries(TAX_PROFILES)) {
      expect(code).toMatch(/^[A-Z]{2}$/);
      for (const curve of [p.employed, p.selfEmployed]) {
        for (const v of [curve.low, curve.mid, curve.high]) {
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThan(0.75);
        }
      }
    }
  });
});
