import { describe, it, expect } from "vitest";
import { FACTORS, ratingWeight } from "@/lib/factors";

describe("factors", () => {
  it("has 11 factors with the agreed headline 5 present", () => {
    const ids = FACTORS.map((f) => f.id);
    expect(FACTORS).toHaveLength(11);
    for (const id of ["weather","safety","lgbt","language","jobs","publicTransport"]) {
      expect(ids).toContain(id);
    }
  });
  it("classifies safety/lgbt/healthcare as filters", () => {
    const role = (id: string) => FACTORS.find((f) => f.id === id)!.role;
    expect(role("safety")).toBe("filter");
    expect(role("lgbt")).toBe("filter");
    expect(role("healthcare")).toBe("filter");
    expect(role("weather")).toBe("differentiator");
  });
  it("maps ratings to weights (dont_care=0)", () => {
    expect(ratingWeight("dont_care")).toBe(0);
    expect(ratingWeight("nice")).toBe(1);
    expect(ratingWeight("important")).toBe(2.5);
    expect(ratingWeight("must")).toBe(4);
  });
});
