import { describe, it, expect } from "vitest";
import * as mod from "./CompanyImport";

describe("CompanyImport", () => {
  it("exports CompanyImport component", () => {
    expect(mod.CompanyImport).toBeDefined();
    expect(typeof mod.CompanyImport).toBe("function");
  });
});
