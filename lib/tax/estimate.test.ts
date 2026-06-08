import { describe, it, expect } from "vitest";
import { estimateTax, rateAtIncome, progressiveTax, socialCharge } from "@/lib/tax/estimate";
import { taxProfileFor, TAX_PROFILES } from "@/lib/tax/data";
import type { TaxProfile } from "@/lib/tax/types";

// A non-migrated (legacy curve) sample with a self-employed regime.
const sample: TaxProfile = {
  employed: { low: 0.1, mid: 0.2, high: 0.3 },
  selfEmployed: { low: 0.15, mid: 0.25, high: 0.35 },
  remoteRegime: { rate: 0.01, label: "1% test regime", appliesTo: ["self_employed"] },
  vat: 20,
  notes: "test",
  confidence: "high",
};

// A legacy sample with NO regime, to test pure curve selection.
const plain: TaxProfile = {
  employed: { low: 0.1, mid: 0.2, high: 0.3 },
  selfEmployed: { low: 0.15, mid: 0.25, high: 0.35 },
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
    expect(rateAtIncome(sample.employed, 52_500)).toBeCloseTo(0.15);
    expect(rateAtIncome(sample.employed, 10_000)).toBeCloseTo(0.1);
    expect(rateAtIncome(sample.employed, 500_000)).toBeCloseTo(0.3);
  });
});

describe("progressiveTax", () => {
  it("applies marginal brackets across slices", () => {
    const brackets = [
      { upTo: 10_000, rate: 0 },
      { upTo: 50_000, rate: 0.2 },
      { upTo: Infinity, rate: 0.4 },
    ];
    expect(progressiveTax(brackets, 5_000)).toBe(0);
    expect(progressiveTax(brackets, 30_000)).toBe(4_000); // 20k @ 20%
    expect(progressiveTax(brackets, 100_000)).toBe(8_000 + 20_000); // 40k@20 + 50k@40
  });
});

describe("socialCharge", () => {
  it("honors rate, floor, ceiling and income cap", () => {
    expect(socialCharge({ rate: 0.1 }, 50_000)).toBe(5_000);
    expect(socialCharge({ rate: 0.1, minAnnual: 6_000 }, 50_000)).toBe(6_000);
    expect(socialCharge({ rate: 0.1, maxAnnual: 3_000 }, 50_000)).toBe(3_000);
    expect(socialCharge({ rate: 0.1, capIncome: 20_000 }, 50_000)).toBe(2_000);
    expect(socialCharge(undefined, 50_000)).toBe(0);
  });
});

describe("estimateTax (legacy curve fallback)", () => {
  it("employed uses the employed curve", () => {
    const e = estimateTax(plain, 75_000, "employed");
    expect(e.effectiveRate).toBeCloseTo(0.2);
    expect(e.taxAmount).toBe(15_000);
    expect(e.netAmount).toBe(60_000);
    expect(e.netPercent).toBe(80);
    expect(e.regimeApplied).toBeNull();
  });

  it("freelancer uses the higher self-employed curve when no regime beats it", () => {
    const e = estimateTax(plain, 75_000, "freelancer");
    expect(e.effectiveRate).toBeCloseTo(0.25);
  });

  it("a self-employed regime is chosen when it keeps more money", () => {
    const e = estimateTax(sample, 75_000, "freelancer");
    expect(e.regimeApplied).toBe("1% test regime");
    expect(e.effectiveRate).toBeCloseTo(0.01);
    expect(e.netPercent).toBe(99);
  });

  it("always carries an honest disclaimer", () => {
    expect(estimateTax(sample, 50_000, "employed").disclaimer).toMatch(/not tax/i);
  });

  it("zero-tax countries (e.g. UAE) keep ~100%", () => {
    const ae = taxProfileFor("AE")!;
    expect(estimateTax(ae, 90_000, "employed").netPercent).toBe(100);
  });
});

describe("regime eligibility ceilings (legacy)", () => {
  const FR = taxProfileFor("FR")!;

  it("applies France micro for a small freelancer under the cap", () => {
    expect(estimateTax(FR, 60_000, "freelancer").regimeApplied).toMatch(/Micro-entrepreneur/);
  });

  it("does NOT apply France micro when revenue exceeds the cap (the $960k bug)", () => {
    const e = estimateTax(FR, 200_000, "freelancer", 960_000);
    expect(e.regimeApplied).toBeNull();
    expect(e.effectiveRate).toBeGreaterThan(0.3);
  });

  it("does NOT apply France micro when income alone exceeds the cap", () => {
    expect(estimateTax(FR, 300_000, "freelancer").regimeApplied).toBeNull();
  });
});

describe("Poland verified rich model", () => {
  const PL = taxProfileFor("PL")!;

  it("picks the 3% goods ryczałt for a high-margin ecommerce seller", () => {
    // $300k profit on $960k revenue → ryczałt 3% of revenue ($28.8k) + ZUS beats
    // 19% flat on profit ($57k+). Keeps the most money in the seller's pocket.
    const e = estimateTax(PL, 300_000, "ecommerce", 960_000);
    expect(e.regimeApplied).toMatch(/Ryczałt 3%/);
    expect(e.effectiveRate).toBeLessThan(0.2); // ~12.6% on profit
  });

  it("falls back to 19% flat when ecommerce revenue exceeds the €2M ryczałt cap", () => {
    const e = estimateTax(PL, 300_000, "ecommerce", 3_000_000);
    expect(e.regimeApplied).toMatch(/19% flat/);
  });

  it("never returns a free lunch — small ecommerce still pays the fixed ZUS floor", () => {
    // $20k profit, $25k revenue: 3% of revenue is tiny, but ZUS+health floor (~$9k)
    // dominates, so the effective rate is high, not ~3%.
    const e = estimateTax(PL, 20_000, "ecommerce", 25_000);
    expect(e.effectiveRate).toBeGreaterThan(0.3);
  });
});

describe("verified-core countries (rich model)", () => {
  it("UAE keeps ~100% for a small ecommerce seller under the AED 3M relief cap", () => {
    const AE = taxProfileFor("AE")!;
    const e = estimateTax(AE, 50_000, "ecommerce", 200_000);
    expect(e.netPercent).toBe(100); // 0% — under both the AED 375k threshold and the relief cap
  });

  it("UAE applies 9% corporate on the slice above ~$101k once relief is lost", () => {
    const AE = taxProfileFor("AE")!;
    // $960k revenue exceeds AED 3M → relief lost → 9% on ($300k-$101k).
    const e = estimateTax(AE, 300_000, "ecommerce", 960_000);
    expect(e.regimeApplied).toMatch(/General rules/); // 9% corporate, not the relief
    expect(e.effectiveRate).toBeGreaterThan(0.04);
    expect(e.effectiveRate).toBeLessThan(0.08);
  });

  it("Georgia gives 1% turnover to a small entrepreneur under ₾500k", () => {
    const GE = taxProfileFor("GE")!;
    const e = estimateTax(GE, 50_000, "freelancer", 120_000);
    expect(e.regimeApplied).toMatch(/1% of turnover/);
  });

  it("Georgia loses small-business status above the cap → 20% flat on profit", () => {
    const GE = taxProfileFor("GE")!;
    const e = estimateTax(GE, 300_000, "ecommerce", 960_000);
    expect(e.regimeApplied).toMatch(/General rules/);
    expect(e.effectiveRate).toBeCloseTo(0.2, 1);
  });

  it("Bulgaria trends toward ~10% for a high earner thanks to the social cap", () => {
    const BG = taxProfileFor("BG")!;
    const e = estimateTax(BG, 300_000, "ecommerce", 400_000);
    expect(e.effectiveRate).toBeGreaterThan(0.1);
    expect(e.effectiveRate).toBeLessThan(0.15);
  });

  it("Romania micro-company applies under €100k turnover but not above", () => {
    const RO = taxProfileFor("RO")!;
    expect(estimateTax(RO, 50_000, "ecommerce", 80_000).regimeApplied).toMatch(/Micro-company/);
    expect(estimateTax(RO, 300_000, "ecommerce", 960_000).regimeApplied).toMatch(/General rules/);
  });

  it("Cyprus non-dom company structure beats the progressive scale for an owner", () => {
    const CY = taxProfileFor("CY")!;
    const e = estimateTax(CY, 300_000, "ecommerce", 600_000);
    expect(e.regimeApplied).toMatch(/Non-dom/);
    expect(e.effectiveRate).toBeLessThan(0.2);
  });
});

describe("verified-core batch 3 (rich model)", () => {
  it("Italy forfettario applies to a small ecommerce seller but not above €85k", () => {
    const IT = taxProfileFor("IT")!;
    expect(estimateTax(IT, 40_000, "ecommerce", 70_000).regimeApplied).toMatch(/forfettario/);
    expect(estimateTax(IT, 300_000, "ecommerce", 960_000).regimeApplied).not.toMatch(/forfettario/);
  });

  it("Spain Beckham helps employees but NOT ecommerce self-employed", () => {
    const ES = taxProfileFor("ES")!;
    expect(estimateTax(ES, 300_000, "employed").regimeApplied).toMatch(/Beckham/);
    expect(estimateTax(ES, 300_000, "ecommerce", 600_000).regimeApplied).not.toMatch(/Beckham/);
  });

  it("Estonia OÜ distribution route gives a 22% flat for a business owner", () => {
    const EE = taxProfileFor("EE")!;
    const e = estimateTax(EE, 300_000, "ecommerce", 600_000);
    expect(e.regimeApplied).toMatch(/OÜ/);
    expect(e.effectiveRate).toBeCloseTo(0.22, 1);
  });

  it("Malta non-dom keeps most income when foreign profit stays offshore", () => {
    const MT = taxProfileFor("MT")!;
    const e = estimateTax(MT, 300_000, "ecommerce", 600_000);
    expect(e.regimeApplied).toMatch(/Non-dom/);
    expect(e.effectiveRate).toBeLessThan(0.05); // €5k min tax on $300k
  });

  it("Portugal IFICI helps a freelancer but NOT an ecommerce-goods seller", () => {
    const PT = taxProfileFor("PT")!;
    expect(estimateTax(PT, 200_000, "freelancer").regimeApplied).toMatch(/IFICI/);
    expect(estimateTax(PT, 200_000, "ecommerce", 400_000).regimeApplied).not.toMatch(/IFICI/);
  });
});

describe("TAX_PROFILES coverage", () => {
  it("has a profile for every country with valid legacy rates", () => {
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
