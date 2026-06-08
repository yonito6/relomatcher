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
    expect(e.regimeApplied).not.toMatch(/Micro-entrepreneur/);
    expect(e.effectiveRate).toBeGreaterThan(0.3);
  });

  it("does NOT apply France micro when income alone exceeds the cap", () => {
    expect(estimateTax(FR, 300_000, "freelancer").regimeApplied).not.toMatch(/Micro-entrepreneur/);
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

describe("Western Europe majors (rich model)", () => {
  it("UK taxes a mid earner via real bands, not the legacy curve", () => {
    const GB = taxProfileFor("GB")!;
    const e = estimateTax(GB, 75_000, "employed");
    // 20% to $63.8k + 40% above + 8% NI capped → ~30% effective.
    expect(e.effectiveRate).toBeGreaterThan(0.25);
    expect(e.effectiveRate).toBeLessThan(0.35);
  });

  it("UK freelancer pays income tax + lighter Class 4 NI", () => {
    const GB = taxProfileFor("GB")!;
    const e = estimateTax(GB, 50_000, "freelancer");
    expect(e.regimeApplied).toMatch(/General rules/);
  });

  it("Ireland hits the 40% band early for a high earner", () => {
    const IE = taxProfileFor("IE")!;
    const e = estimateTax(IE, 120_000, "employed");
    expect(e.effectiveRate).toBeGreaterThan(0.3);
  });

  it("France micro-entrepreneur goods regime applies for a small ecommerce seller", () => {
    const FR = taxProfileFor("FR")!;
    const e = estimateTax(FR, 40_000, "ecommerce", 50_000);
    expect(e.regimeApplied).toMatch(/Micro-entrepreneur goods/);
  });

  it("France micro is lost when ecommerce turnover exceeds the goods cap", () => {
    const FR = taxProfileFor("FR")!;
    const e = estimateTax(FR, 200_000, "ecommerce", 960_000);
    expect(e.regimeApplied).not.toMatch(/Micro-entrepreneur/);
  });

  it("France services freelancer uses the services micro (higher URSSAF)", () => {
    const FR = taxProfileFor("FR")!;
    const e = estimateTax(FR, 50_000, "freelancer", 55_000);
    expect(e.regimeApplied).toMatch(/Micro-entrepreneur services/);
  });

  it("Germany trends toward the 42% band for a high earner", () => {
    const DE = taxProfileFor("DE")!;
    const e = estimateTax(DE, 150_000, "employed");
    expect(e.effectiveRate).toBeGreaterThan(0.3);
    expect(e.effectiveRate).toBeLessThan(0.5);
  });

  it("Netherlands 30% ruling beats general rules for a high-earning employee", () => {
    const NL = taxProfileFor("NL")!;
    const e = estimateTax(NL, 200_000, "employed");
    expect(e.regimeApplied).toMatch(/30% ruling/);
    expect(e.effectiveRate).toBeLessThan(0.4);
  });

  it("Netherlands self-employed does NOT get the 30% ruling", () => {
    const NL = taxProfileFor("NL")!;
    const e = estimateTax(NL, 200_000, "freelancer");
    expect(e.regimeApplied).not.toMatch(/30% ruling/);
  });
});

describe("Western Europe rest (rich model)", () => {
  it("Switzerland stays comparatively low for a mid earner (moderate canton)", () => {
    const CH = taxProfileFor("CH")!;
    const e = estimateTax(CH, 100_000, "employed");
    expect(e.effectiveRate).toBeLessThan(0.3);
  });

  it("Austria climbs toward the 48% band for a high earner", () => {
    const AT = taxProfileFor("AT")!;
    const e = estimateTax(AT, 150_000, "employed");
    expect(e.effectiveRate).toBeGreaterThan(0.35);
    expect(e.effectiveRate).toBeLessThan(0.55);
  });

  it("Belgium is among the heaviest in the EU for a high earner", () => {
    const BE = taxProfileFor("BE")!;
    const e = estimateTax(BE, 150_000, "employed");
    expect(e.effectiveRate).toBeGreaterThan(0.4);
  });

  it("Luxembourg taxes a mid earner via real bands, not the legacy curve", () => {
    const LU = taxProfileFor("LU")!;
    const e = estimateTax(LU, 80_000, "freelancer");
    expect(e.regimeApplied).toMatch(/General rules/);
    expect(e.effectiveRate).toBeGreaterThan(0.2);
  });
});

describe("Nordics (rich model)", () => {
  it("Denmark lands in the mid-40s%+ for a high earner with top tax", () => {
    const DK = taxProfileFor("DK")!;
    const e = estimateTax(DK, 150_000, "employed");
    expect(e.effectiveRate).toBeGreaterThan(0.42);
  });

  it("Sweden crosses the 20% state-tax threshold for a high earner", () => {
    const SE = taxProfileFor("SE")!;
    const e = estimateTax(SE, 120_000, "employed");
    expect(e.effectiveRate).toBeGreaterThan(0.38);
  });

  it("Sweden self-employed carries heavier egenavgifter than an employee", () => {
    const SE = taxProfileFor("SE")!;
    const emp = estimateTax(SE, 50_000, "employed").effectiveRate;
    const self = estimateTax(SE, 50_000, "freelancer").effectiveRate;
    expect(self).toBeGreaterThan(emp);
  });

  it("Norway trends toward its ~47% top marginal for a high earner", () => {
    const NO = taxProfileFor("NO")!;
    const e = estimateTax(NO, 150_000, "employed");
    expect(e.effectiveRate).toBeGreaterThan(0.35);
    expect(e.effectiveRate).toBeLessThan(0.48);
  });

  it("Finland self-employed YEL pushes the rate above an employee's", () => {
    const FI = taxProfileFor("FI")!;
    const self = estimateTax(FI, 80_000, "freelancer").effectiveRate;
    const emp = estimateTax(FI, 80_000, "employed").effectiveRate;
    expect(self).toBeGreaterThan(emp);
  });
});

describe("territorial / foreign-exempt (rich model)", () => {
  it("Panama keeps ~100% for a remote earner with foreign-source income", () => {
    const PA = taxProfileFor("PA")!;
    const e = estimateTax(PA, 120_000, "freelancer");
    expect(e.regimeApplied).toMatch(/Territorial/);
    expect(e.netPercent).toBe(100);
  });

  it("Panama taxes a LOCAL employee on the progressive scale", () => {
    const PA = taxProfileFor("PA")!;
    const e = estimateTax(PA, 80_000, "employed");
    expect(e.effectiveRate).toBeGreaterThan(0.1);
  });

  it("Malaysia exempts foreign-sourced ecommerce income but taxes a local job", () => {
    const MY = taxProfileFor("MY")!;
    expect(estimateTax(MY, 100_000, "ecommerce", 300_000).netPercent).toBe(100);
    expect(estimateTax(MY, 100_000, "employed").effectiveRate).toBeGreaterThan(0.1);
  });

  it("Costa Rica is 0% on foreign income, taxed locally", () => {
    const CR = taxProfileFor("CR")!;
    expect(estimateTax(CR, 90_000, "freelancer").netPercent).toBe(100);
    expect(estimateTax(CR, 90_000, "employed").effectiveRate).toBeGreaterThan(0.1);
  });

  it("Uruguay new-resident holiday keeps foreign income at ~100%", () => {
    const UY = taxProfileFor("UY")!;
    const e = estimateTax(UY, 120_000, "investor");
    expect(e.regimeApplied).toMatch(/tax holiday/);
    expect(e.netPercent).toBe(100);
  });

  it("Thailand keeps offshore-kept foreign income but taxes remitted/local pay", () => {
    const TH = taxProfileFor("TH")!;
    expect(estimateTax(TH, 100_000, "freelancer").netPercent).toBe(100);
    expect(estimateTax(TH, 100_000, "employed").effectiveRate).toBeGreaterThan(0.1);
  });

  it("Indonesia does NOT broadly exempt foreign income (worldwide taxed)", () => {
    const ID = taxProfileFor("ID")!;
    const e = estimateTax(ID, 100_000, "freelancer");
    expect(e.netPercent).toBeLessThan(100);
    expect(e.effectiveRate).toBeGreaterThan(0.15);
  });

  it("Mauritius exempts unremitted foreign income, low flat tax locally", () => {
    const MU = taxProfileFor("MU")!;
    expect(estimateTax(MU, 100_000, "ecommerce", 200_000).netPercent).toBe(100);
    expect(estimateTax(MU, 100_000, "employed").effectiveRate).toBeLessThan(0.2);
  });
});

describe("CEE (rich model)", () => {
  const CZ = taxProfileFor("CZ")!;
  const HU = taxProfileFor("HU")!;
  const SK = taxProfileFor("SK")!;
  const SI = taxProfileFor("SI")!;
  const LT = taxProfileFor("LT")!;
  const LV = taxProfileFor("LV")!;

  it("CZ: small freelancer uses paušální flat tax", () => {
    const e = estimateTax(CZ, 50_000, "freelancer", 60_000);
    expect(e.regimeApplied).toMatch(/Paušální/);
    expect(e.effectiveRate).toBeLessThan(0.2);
  });
  it("CZ: high-revenue freelancer falls back to OSVČ 60/40 (beats general rules)", () => {
    const e = estimateTax(CZ, 150_000, "freelancer", 200_000);
    expect(e.regimeApplied).toMatch(/OSVČ/);
    expect(e.effectiveRate).toBeLessThan(0.2);
  });
  it("CZ: employee pays 15% + 11% social", () => {
    const e = estimateTax(CZ, 50_000, "employed");
    expect(e.effectiveRate).toBeGreaterThan(0.24);
    expect(e.effectiveRate).toBeLessThan(0.28);
  });

  it("HU: freelancer uses KATA flat (very low)", () => {
    const e = estimateTax(HU, 50_000, "freelancer", 60_000);
    expect(e.regimeApplied).toMatch(/KATA/);
    expect(e.effectiveRate).toBeLessThan(0.1);
  });
  it("HU: ecommerce is NOT KATA-eligible → general rules", () => {
    const e = estimateTax(HU, 50_000, "ecommerce");
    expect(e.regimeApplied).toMatch(/General rules/);
    expect(e.effectiveRate).toBeGreaterThan(0.3);
  });

  it("SK: freelancer uses 60% flat-expense lump-sum", () => {
    const e = estimateTax(SK, 50_000, "freelancer", 60_000);
    expect(e.regimeApplied).toMatch(/flat-expense/);
    expect(e.effectiveRate).toBeLessThan(estimateTax(SK, 50_000, "employed").effectiveRate + 0.05);
  });

  it("SI: freelancer uses normiranci lump-sum (beats general rules)", () => {
    const general = progressiveTax(SI.brackets!, 50_000) + 50_000 * 0.38;
    const e = estimateTax(SI, 50_000, "freelancer", 60_000);
    expect(e.regimeApplied).toMatch(/Normiranci/);
    expect(e.taxAmount).toBeLessThan(general);
  });

  it("LT: freelancer uses individual-activity regime", () => {
    const e = estimateTax(LT, 50_000, "freelancer", 60_000);
    expect(e.regimeApplied).toMatch(/Individual activity/);
    expect(e.effectiveRate).toBeLessThan(0.25);
  });

  it("LV: no attractive regime → general rules for freelancer", () => {
    const e = estimateTax(LV, 50_000, "freelancer");
    expect(e.regimeApplied).toMatch(/General rules/);
  });
  it("LV: employee pays 25.5% + ~10.5% social", () => {
    const e = estimateTax(LV, 50_000, "employed");
    expect(e.effectiveRate).toBeGreaterThan(0.33);
    expect(e.effectiveRate).toBeLessThan(0.4);
  });
});

describe("Gulf & microstates (rich model)", () => {
  const SA = taxProfileFor("SA")!;
  const QA = taxProfileFor("QA")!;
  const BH = taxProfileFor("BH")!;
  const MC = taxProfileFor("MC")!;
  const AD = taxProfileFor("AD")!;
  const LI = taxProfileFor("LI")!;

  it("zero-PIT Gulf/Monaco keep 100% across activities", () => {
    for (const p of [SA, QA, BH, MC]) {
      expect(estimateTax(p, 200_000, "employed").netPercent).toBe(100);
      expect(estimateTax(p, 200_000, "ecommerce", 500_000).netPercent).toBe(100);
      expect(estimateTax(p, 200_000, "freelancer").effectiveRate).toBe(0);
    }
  });

  it("Andorra: income under €24k pays only social (no income tax)", () => {
    const e = estimateTax(AD, 20_000, "employed");
    expect(e.effectiveRate).toBeLessThan(0.07);
  });
  it("Andorra: 10% top income tax + 6.5% social → mid-teens effective", () => {
    const e = estimateTax(AD, 100_000, "employed");
    expect(e.effectiveRate).toBeGreaterThan(0.1);
    expect(e.effectiveRate).toBeLessThan(0.15);
  });
  it("Andorra: self-employed pays fixed CASS quota (~$7.3k)", () => {
    const e = estimateTax(AD, 100_000, "freelancer");
    expect(e.taxAmount).toBeGreaterThan(estimateTax(AD, 100_000, "employed").taxAmount);
  });

  it("Liechtenstein: combined national+municipal stays mid-teens at $100k", () => {
    const e = estimateTax(LI, 100_000, "employed");
    expect(e.effectiveRate).toBeGreaterThan(0.1);
    expect(e.effectiveRate).toBeLessThan(0.2);
  });
});

describe("Balkans & CEE rest (rich model)", () => {
  const RS = taxProfileFor("RS")!;
  const ME = taxProfileFor("ME")!;
  const AL = taxProfileFor("AL")!;
  const MK = taxProfileFor("MK")!;
  const MD = taxProfileFor("MD")!;
  const UA = taxProfileFor("UA")!;
  const TR = taxProfileFor("TR")!;

  it("Serbia: small freelancer uses fixed paušalac (very low)", () => {
    const e = estimateTax(RS, 50_000, "freelancer", 50_000);
    expect(e.regimeApplied).toMatch(/paušalac/);
    expect(e.effectiveRate).toBeLessThan(0.15);
  });

  it("Montenegro: 9%/15% income tax stays low for employees", () => {
    const e = estimateTax(ME, 50_000, "employed");
    expect(e.effectiveRate).toBeLessThan(0.3);
  });

  it("Albania: small-business freelancer pays 0% income tax (to 2029)", () => {
    const e = estimateTax(AL, 80_000, "freelancer", 100_000);
    expect(e.regimeApplied).toMatch(/Small-business/);
    const e2 = estimateTax(AL, 80_000, "employed");
    expect(e2.taxAmount).toBeGreaterThan(e.taxAmount);
  });

  it("Moldova: IT Park 7%-of-turnover beats general 12%", () => {
    const e = estimateTax(MD, 80_000, "freelancer", 100_000);
    expect(e.regimeApplied).toMatch(/IT Park/);
    expect(e.effectiveRate).toBeLessThan(0.12);
  });

  it("Ukraine: Group 3 5%-of-turnover is the freelancer optimum", () => {
    const e = estimateTax(UA, 80_000, "freelancer", 100_000);
    expect(e.regimeApplied).toMatch(/Group 3/);
    expect(e.effectiveRate).toBeLessThan(0.1);
  });
  it("Ukraine: salaried pays 18% PIT + 5% military levy", () => {
    const e = estimateTax(UA, 50_000, "employed");
    expect(e.effectiveRate).toBeGreaterThan(0.22);
    expect(e.effectiveRate).toBeLessThan(0.24);
  });

  it("Turkey: service-export exemption beats the 40% scale for freelancers", () => {
    const e = estimateTax(TR, 200_000, "freelancer", 250_000);
    const general = estimateTax(TR, 200_000, "employed");
    expect(e.regimeApplied).toMatch(/Service-export/);
    expect(e.taxAmount).toBeLessThan(general.taxAmount);
  });

  it("North Macedonia: flat 10% income tax but notable social", () => {
    const e = estimateTax(MK, 50_000, "employed");
    expect(e.effectiveRate).toBeGreaterThan(0.1);
  });
});

describe("Asia-Pacific developed (rich model)", () => {
  const SG = taxProfileFor("SG")!;
  const HK = taxProfileFor("HK")!;
  const TW = taxProfileFor("TW")!;
  const JP = taxProfileFor("JP")!;
  const KR = taxProfileFor("KR")!;
  const AU = taxProfileFor("AU")!;
  const NZ = taxProfileFor("NZ")!;

  it("Singapore: low graduated rate, no CPF for foreigners", () => {
    const e = estimateTax(SG, 100_000, "employed");
    expect(e.effectiveRate).toBeLessThan(0.12);
  });

  it("Hong Kong: salaries tax effectively capped at 15%", () => {
    const e = estimateTax(HK, 300_000, "employed");
    expect(e.effectiveRate).toBeLessThan(0.16);
  });
  it("Hong Kong: foreign-sourced income is territorial 0%", () => {
    expect(estimateTax(HK, 150_000, "freelancer", 200_000).netPercent).toBe(100);
  });

  it("Taiwan: foreign income below AMT threshold is 0%, local salary taxed", () => {
    expect(estimateTax(TW, 100_000, "freelancer", 150_000).netPercent).toBe(100);
    expect(estimateTax(TW, 100_000, "employed").effectiveRate).toBeGreaterThan(0.1);
  });

  it("Japan: combined national+local reaches the 40s% at high income", () => {
    const e = estimateTax(JP, 150_000, "employed");
    expect(e.effectiveRate).toBeGreaterThan(0.3);
  });

  it("Korea: combined surtax pushes high earners past 35%", () => {
    const e = estimateTax(KR, 150_000, "employed");
    expect(e.effectiveRate).toBeGreaterThan(0.3);
  });

  it("Australia: tax-free threshold then progressive to mid-30s%", () => {
    const e = estimateTax(AU, 100_000, "employed");
    expect(e.effectiveRate).toBeGreaterThan(0.2);
    expect(e.effectiveRate).toBeLessThan(0.35);
  });

  it("New Zealand: no payroll social tax keeps effective moderate", () => {
    const e = estimateTax(NZ, 100_000, "employed");
    expect(e.effectiveRate).toBeGreaterThan(0.2);
    expect(e.effectiveRate).toBeLessThan(0.33);
  });
});

describe("Americas & rest-Asia (rich model)", () => {
  const US = taxProfileFor("US")!;
  const CA = taxProfileFor("CA")!;
  const MX = taxProfileFor("MX")!;
  const BR = taxProfileFor("BR")!;
  const AR = taxProfileFor("AR")!;
  const CL = taxProfileFor("CL")!;
  const CO = taxProfileFor("CO")!;
  const EC = taxProfileFor("EC")!;
  const VN = taxProfileFor("VN")!;
  const PH = taxProfileFor("PH")!;
  const IN = taxProfileFor("IN")!;

  it("US: federal brackets + FICA land a high earner in the mid-20s%", () => {
    const e = estimateTax(US, 200_000, "employed");
    expect(e.effectiveRate).toBeGreaterThan(0.2);
    expect(e.effectiveRate).toBeLessThan(0.3);
  });

  it("Canada (federal+Ontario): six figures hits low-30s%", () => {
    const e = estimateTax(CA, 100_000, "employed");
    expect(e.effectiveRate).toBeGreaterThan(0.25);
    expect(e.effectiveRate).toBeLessThan(0.4);
  });

  it("Mexico: RESICO charges ~2% of revenue for small e-commerce", () => {
    const e = estimateTax(MX, 50_000, "ecommerce", 50_000);
    expect(e.regimeApplied).toMatch(/RESICO/i);
    expect(e.effectiveRate).toBeLessThan(0.03);
  });

  it("Brazil: progressive PIT + capped INSS reaches high-20s%", () => {
    const e = estimateTax(BR, 60_000, "employed");
    expect(e.effectiveRate).toBeGreaterThan(0.2);
    expect(e.effectiveRate).toBeLessThan(0.32);
  });

  it("Argentina: Monotributo keeps a small freelancer near zero income tax", () => {
    const e = estimateTax(AR, 40_000, "freelancer", 40_000);
    expect(e.regimeApplied).toMatch(/Monotributo/i);
    expect(e.netPercent).toBeGreaterThan(90);
  });

  it("Chile: progressive PIT + capped pension lands low-20s%", () => {
    const e = estimateTax(CL, 60_000, "employed");
    expect(e.effectiveRate).toBeGreaterThan(0.15);
    expect(e.effectiveRate).toBeLessThan(0.3);
  });

  it("Colombia: progressive PIT reaches ~30% for six figures", () => {
    const e = estimateTax(CO, 60_000, "employed");
    expect(e.effectiveRate).toBeGreaterThan(0.2);
    expect(e.effectiveRate).toBeLessThan(0.4);
  });

  it("Ecuador: USD economy, progressive PIT + IESS in the high-teens%", () => {
    const e = estimateTax(EC, 40_000, "employed");
    expect(e.effectiveRate).toBeGreaterThan(0.1);
    expect(e.effectiveRate).toBeLessThan(0.28);
  });

  it("Vietnam: business-individual 5% beats steep general brackets", () => {
    const e = estimateTax(VN, 30_000, "freelancer", 30_000);
    expect(e.regimeApplied).toMatch(/5%|Business/i);
    expect(e.effectiveRate).toBeCloseTo(0.05, 2);
  });

  it("Philippines: 8% flat on gross beats progressive for small self-employed", () => {
    const e = estimateTax(PH, 40_000, "ecommerce", 40_000);
    expect(e.regimeApplied).toMatch(/8%/);
    expect(e.effectiveRate).toBeCloseTo(0.08, 2);
  });

  it("India: presumptive 44ADA (15% of receipts) beats slabs for a freelancer", () => {
    const e = estimateTax(IN, 50_000, "freelancer", 50_000);
    expect(e.regimeApplied).toMatch(/44ADA/i);
    expect(e.effectiveRate).toBeCloseTo(0.15, 2);
  });
});

describe("Iceland, Israel & emerging markets (rich model)", () => {
  const IS = taxProfileFor("IS")!;
  const HR = taxProfileFor("HR")!;
  const IL = taxProfileFor("IL")!;
  const MA = taxProfileFor("MA")!;
  const AM = taxProfileFor("AM")!;
  const KZ = taxProfileFor("KZ")!;
  const ZA = taxProfileFor("ZA")!;

  it("Iceland: three-band tax + pension lands mid-30s%", () => {
    const e = estimateTax(IS, 100_000, "employed");
    expect(e.effectiveRate).toBeGreaterThan(0.3);
    expect(e.effectiveRate).toBeLessThan(0.45);
  });

  it("Croatia: heavy pension makes employees ~40%+", () => {
    const e = estimateTax(HR, 80_000, "employed");
    expect(e.effectiveRate).toBeGreaterThan(0.3);
    expect(e.effectiveRate).toBeLessThan(0.5);
  });
  it("Croatia: paušalni obrt lump-sum beats general rules for a small freelancer", () => {
    const e = estimateTax(HR, 40_000, "freelancer", 40_000);
    expect(e.regimeApplied).toMatch(/Pau[sš]alni/i);
    expect(e.effectiveRate).toBeLessThan(0.2);
  });

  it("Israel: progressive + Bituach Leumi reaches mid-30s% for six figures", () => {
    const e = estimateTax(IL, 100_000, "employed");
    expect(e.effectiveRate).toBeGreaterThan(0.3);
    expect(e.effectiveRate).toBeLessThan(0.45);
  });
  it("Israel: new-immigrant (Oleh) foreign income is exempt → keeps 100%", () => {
    expect(estimateTax(IL, 80_000, "freelancer", 80_000).netPercent).toBe(100);
  });

  it("Morocco: auto-entrepreneur turnover tax is tiny for small earners", () => {
    const e = estimateTax(MA, 18_000, "freelancer", 18_000);
    expect(e.regimeApplied).toMatch(/Auto-entrepreneur/i);
    expect(e.effectiveRate).toBeLessThan(0.08);
  });

  it("Armenia: micro-business turnover exemption keeps a small freelancer at 100%", () => {
    const e = estimateTax(AM, 40_000, "freelancer", 40_000);
    expect(e.regimeApplied).toMatch(/Micro-business/i);
    expect(e.netPercent).toBe(100);
  });
  it("Armenia: salaried flat 20% + pension ≈ 25%", () => {
    const e = estimateTax(AM, 50_000, "employed");
    expect(e.effectiveRate).toBeCloseTo(0.25, 1);
  });

  it("Kazakhstan: simplified 3%-of-turnover beats the flat 10%", () => {
    const e = estimateTax(KZ, 80_000, "freelancer", 80_000);
    expect(e.regimeApplied).toMatch(/Simplified|3%/i);
    expect(e.effectiveRate).toBeCloseTo(0.03, 2);
  });
  it("Kazakhstan: salaried flat 10% + OPV ≈ 20%", () => {
    const e = estimateTax(KZ, 60_000, "employed");
    expect(e.effectiveRate).toBeCloseTo(0.2, 1);
  });

  it("South Africa: progressive 18–45% + UIF reaches ~30% for six figures", () => {
    const e = estimateTax(ZA, 60_000, "employed");
    expect(e.effectiveRate).toBeGreaterThan(0.2);
    expect(e.effectiveRate).toBeLessThan(0.4);
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
