import { describe, it, expect } from "vitest";
import { OPENNESS, EU_EEA_CODES } from "@/lib/feasibility/openness";
import { COUNTRIES } from "@/lib/countriesDb";

describe("OPENNESS", () => {
  it("every country code in the DB has an OPENNESS entry", () => {
    for (const c of COUNTRIES) {
      expect(OPENNESS).toHaveProperty(c.code);
    }
  });

  it("PT openness === 2 (nomad-friendly anchor)", () => {
    expect(OPENNESS.PT).toBe(2);
  });

  it("AE openness === 0 (restrictive anchor)", () => {
    expect(OPENNESS.AE).toBe(0);
  });
});

describe("EU_EEA_CODES", () => {
  it("includes PT", () => {
    expect(EU_EEA_CODES.has("PT")).toBe(true);
  });

  it("does not include AE", () => {
    expect(EU_EEA_CODES.has("AE")).toBe(false);
  });
});
