import { describe, it, expect } from "vitest";
import { passportBucket } from "@/lib/feasibility/passport";

describe("passportBucket", () => {
  it("EU member -> eu_eea", () => expect(passportBucket("Germany")).toBe("eu_eea"));
  it("US -> strong", () => expect(passportBucket("United States")).toBe("strong"));
  it("unknown -> mid", () => expect(passportBucket("Atlantis")).toBe("mid"));
});
