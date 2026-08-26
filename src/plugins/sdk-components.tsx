import * as React from "react";

type PluginBridge = {
  react?: { createElement?: typeof React.createElement };
  sdkUi?: Record<string, unknown> | null;
};

function renderSdkUiComponent<TProps>(name: string, props: TProps) {
  const bridge = (globalThis as typeof globalThis & { __paperclipPluginBridge__?: PluginBridge })
    .__paperclipPluginBridge__;
  const component = bridge?.sdkUi?.[name];
  if (component === undefined) {
    throw new Error(
      `Paperclip plugin UI runtime is not initialized for "${name}". Ensure the host loaded the plugin bridge before rendering this UI module.`,
    );
  }
  if (typeof bridge?.react?.createElement === "function") {
    return bridge.react.createElement(component as React.ElementType, props as object);
  }
  if (typeof component === "function") return (component as (props: TProps) => React.ReactNode)(props);
  throw new Error(`Paperclip plugin UI component "${name}" is not callable`);
}

export interface FileTreeNode {
  name: string;
  path: string;
  kind: "file" | "dir";
  children: FileTreeNode[];
}

export interface FileTreeProps {
  nodes: FileTreeNode[];
  expandedPaths?: readonly string[] | ReadonlySet<string>;
  selectedFile?: string;
  onToggleDir?: (path: string) => void;
  onSelectFile?: (path: string) => void;
  [key: string]: unknown;
}

export const FileTree = (props: FileTreeProps) => renderSdkUiComponent("FileTree", props);
export const MarkdownBlock = (props: { content: string; enableWikiLinks?: boolean; wikiLinkRoot?: string; [key: string]: unknown }) =>
  renderSdkUiComponent("MarkdownBlock", props);
export const MarkdownEditor = (props: { value: string; onChange?: (value: string) => void; [key: string]: unknown }) =>
  renderSdkUiComponent("MarkdownEditor", props);
export const ManagedRoutinesList = (props: { routines: Array<{ title: string; [key: string]: unknown }>; [key: string]: unknown }) =>
  renderSdkUiComponent("ManagedRoutinesList", props);
