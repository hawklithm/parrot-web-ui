import type { CompanySkillVersion } from "../../lib/paperclip-shared/src";
import { describe, expect, it } from "vitest";
import {
  formatReleaseDate,
  releaseName,
  releaseOptionLabel,
  releaseShortLabel,
} from "./AgentSkillReleasePicker";

function makeRelease(overrides: Partial<CompanySkillVersion> = {}): CompanySkillVersion {
  return {
    id: "version-7",
    companyId: "company-1",
    companySkillId: "skill-1",
    revisionNumber: 7,
    label: "V7 - Roster champion",
    releaseId: "v7-roster",
    releaseName: "V7 - Roster champion",
    releasedAt: "2026-07-21",
    fileInventory: [],
    authorAgentId: null,
    authorUserId: null,
    createdAt: new Date("2026-07-21T00:00:00Z"),
    ...overrides,
  };
}

describe("AgentSkillReleasePicker helpers", () => {
  it("keeps plain release dates stable and formats timestamps locally", () => {
    expect(formatReleaseDate("2026-07-21")).toBe("2026-07-21");
    const localNoon = new Date(2026, 6, 15, 12, 0, 0, 0);
    expect(formatReleaseDate(localNoon.toISOString())).toBe("2026-07-15");
    expect(formatReleaseDate("invalid-date")).toBeNull();
  });

  it("builds full and compact labels with graceful fallbacks", () => {
    const release = makeRelease();
    expect(releaseName(release)).toBe("V7 - Roster champion");
    expect(releaseOptionLabel(release)).toBe("V7 - Roster champion - released 2026-07-21");
    expect(releaseShortLabel(release)).toBe("V7");
    expect(releaseName(makeRelease({ releaseName: null, label: null, releaseId: "raw-id" }))).toBe(
      "raw-id",
    );
  });
});
