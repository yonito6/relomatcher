import { describe, it, expect } from "vitest";
import { feasibilityTier } from "@/lib/feasibility/tier";

const PT = { code: "PT", name: "Portugal" } as any;
const AE = { code: "AE", name: "United Arab Emirates" } as any;

describe("feasibilityTier", () => {
  it("EU passport into EU = easy via freedom of movement", () => {
    const t = feasibilityTier({ passportCountry: "Germany" } as any, PT);
    expect(t.tier).toBe("easy");
    expect(t.reason).toMatch(/freedom of movement/i);
  });
  it("declared eu_eea rights also = easy into EU", () => {
    const t = feasibilityTier({ mobilityRights: "eu_eea" } as any, PT);
    expect(t.tier).toBe("easy");
  });
  it("mid passport into a closed country = hard/very hard", () => {
    const t = feasibilityTier({ passportCountry: "Atlantis" } as any, AE);
    expect(["hard","very_hard"]).toContain(t.tier);
  });
});
