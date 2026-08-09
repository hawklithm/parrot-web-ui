// Stub UI exports for Claude adapter
export interface ParsedStdoutLine {
  type: string;
  content?: string;
}

export function parseClaudeStdoutLine(line: string): ParsedStdoutLine | null {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

export function buildClaudeLocalConfig(config: Record<string, unknown>) {
  return {
    type: 'claude_local',
    ...config,
  };
}
