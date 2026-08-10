export function parseOnboardingGoalInput(raw: string): {
  title: string;
  description: string | null;
} {
  console.log('[DEBUG] parseOnboardingGoalInput raw:', JSON.stringify(raw));
  const trimmed = raw.trim();
  console.log('[DEBUG] parseOnboardingGoalInput trimmed:', JSON.stringify(trimmed));
  if (!trimmed) {
    return { title: "", description: null };
  }

  const [firstLine, ...restLines] = trimmed.split(/\r?\n/);
  const title = firstLine.trim();
  const description = restLines.join("\n").trim();

  return {
    title,
    description: description.length > 0 ? description : null,
  };
}
