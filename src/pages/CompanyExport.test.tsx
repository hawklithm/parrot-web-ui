import { describe, it, expect } from "vitest";
import * as mod from "./CompanyExport";

describe("CompanyExport", () => {
  it("exports CompanyExport component", () => {
    expect(mod.CompanyExport).toBeDefined();
    expect(typeof mod.CompanyExport).toBe("function");
  });
});
