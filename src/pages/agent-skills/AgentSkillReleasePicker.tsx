import type { CompanySkillVersion } from "../../lib/paperclip-shared/src";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Radix Select does not accept an empty value, so this represents the live default. */
export const RELEASE_DEFAULT_VALUE = "default";

const DEFAULT_LABEL = "Default - current (recommended)";

export function formatReleaseDate(value: CompanySkillVersion["releasedAt"]): string | null {
  if (!value) return null;
  const raw = typeof value === "string" ? value : value.toISOString();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function releaseName(release: CompanySkillVersion): string {
  return release.releaseName ?? release.label ?? release.releaseId ?? "Release";
}

export function releaseOptionLabel(release: CompanySkillVersion): string {
  const name = releaseName(release);
  const date = formatReleaseDate(release.releasedAt);
  return date ? `${name} - released ${date}` : name;
}

export function releaseShortLabel(release: CompanySkillVersion): string {
  return releaseName(release).split(" - ")[0]!.trim();
}

export interface AgentSkillReleasePickerProps {
  releases: CompanySkillVersion[];
  value: string | null;
  disabled?: boolean;
  onChange: (versionId: string | null) => void;
}

export function AgentSkillReleasePicker({
  releases,
  value,
  disabled = false,
  onChange,
}: AgentSkillReleasePickerProps) {
  const selected = value ? releases.find((release) => release.id === value) ?? null : null;
  const triggerLabel = selected ? releaseName(selected) : DEFAULT_LABEL;

  return (
    <Select
      value={value ?? RELEASE_DEFAULT_VALUE}
      disabled={disabled}
      onValueChange={(next) => onChange(next === RELEASE_DEFAULT_VALUE ? null : next)}
    >
      <SelectTrigger size="sm" className="w-full max-w-64 sm:w-64" aria-label="Skill release">
        <SelectValue placeholder={DEFAULT_LABEL}>{triggerLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end" className="max-w-80">
        <SelectItem value={RELEASE_DEFAULT_VALUE}>{DEFAULT_LABEL}</SelectItem>
        {releases.map((release) => (
          <SelectItem key={release.id} value={release.id}>
            <span className="flex items-center gap-2">
              <span className="truncate">{releaseOptionLabel(release)}</span>
              <Badge variant="secondary" className="shrink-0 text-xs">
                Beta
              </Badge>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
