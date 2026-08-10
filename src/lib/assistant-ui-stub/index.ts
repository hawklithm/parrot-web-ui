// Stub for @assistant-ui/react
import React, { createContext, useContext } from "react";
import type { ReactNode } from "react";

// Basic types
export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: Date;
}

export interface Thread {
  id: string;
  messages: Message[];
}

export interface Runtime {
  thread: Thread;
  append: (message: Partial<Message>) => void;
  reload: () => void;
  cancel: () => void;
}

// External Store types
export interface ExternalStoreAdapter<T = unknown> {
  isRunning: boolean;
  messages: readonly ThreadMessage[];
  onNew?: (message: AppendMessage) => Promise<void>;
  onEdit?: (message: AppendMessage) => Promise<void>;
  onReload?: (parentId: string | null) => Promise<void>;
  onCancel?: () => Promise<void>;
  convertMessage?: (message: T) => ThreadMessage;
}

export interface AppendMessage {
  parentId: string | null;
  role: "user" | "assistant";
  content: Array<{ type: string; text?: string; [key: string]: unknown }>;
}

export interface TextMessagePart {
  type: "text";
  text: string;
}

export interface ToolCallMessagePart {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown;
}

export interface ReasoningMessagePart {
  type: "reasoning";
  reasoning: string;
}

export type ThreadAssistantMessage = Message & { role: "assistant" };
export type ThreadUserMessage = Message & { role: "user" };
export type ThreadSystemMessage = Message & { role: "system" };


// Context
const RuntimeContext = createContext<Runtime | null>(null);

// Hooks
export function useRuntime() {
  const runtime = useContext(RuntimeContext);
  if (!runtime) {
    throw new Error("useRuntime must be used within RuntimeProvider");
  }
  return runtime;
}

// External Store Runtime Hook
export function useExternalStoreRuntime(adapter: ExternalStoreAdapter): Runtime {
  return {
    thread: {
      messages: adapter.messages as Message[],
      isRunning: adapter.isRunning,
    },
    send: async (message: AppendMessage) => {
      if (adapter.onNew) {
        await adapter.onNew(message);
      }
    },
    cancel: adapter.onCancel || (() => Promise.resolve()),
  };
}

// AssistantRuntimeProvider alias
export const AssistantRuntimeProvider = RuntimeProvider;

// useAui hook
export function useAui() {
  return {
    runtime: useRuntime(),
    thread: useThread(),
  };
}

export function useThread() {
  const runtime = useRuntime();
  return runtime.thread;
}

export function useMessages() {
  const thread = useThread();
  return thread.messages;
}

// Components
export function RuntimeProvider({ 
  children, 
  runtime 
}: { 
  children: ReactNode; 
  runtime: Runtime;
}) {
  return React.createElement(
    RuntimeContext.Provider,
    { value: runtime },
    children
  );
}

export function Thread({ children }: { children: ReactNode }) {
  return React.createElement("div", { className: "thread" }, children);
}

 function ThreadMessages({ children }: { children: ReactNode }) {
  return React.createElement("div", { className: "thread-messages" }, children);
}

export function ThreadMessage({ children }: { children: ReactNode }) {
  return React.createElement("div", { className: "thread-message" }, children);
}

export function MessageContent({ children }: { children: ReactNode }) {
  return React.createElement("div", { className: "message-content" }, children);
}

export function Composer({ children }: { children: ReactNode }) {
  return React.createElement("div", { className: "composer" }, children);
}

export function ComposerInput() {
  return React.createElement("input", { 
    className: "composer-input", 
    placeholder: "Type a message..." 
  });
}

export function ComposerSend({ children }: { children: ReactNode }) {
  return React.createElement("button", { className: "composer-send" }, children);
}

// Default export
export default {
  RuntimeProvider,
  Thread,
  ThreadMessages,
  ThreadMessage,
  MessageContent,
  Composer,
  ComposerInput,
  ComposerSend,
  useRuntime,
  useThread,
  useMessages,
};
