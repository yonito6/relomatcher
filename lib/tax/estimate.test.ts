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
