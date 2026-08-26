// Stub for @assistant-ui/react
import React, { createContext, useContext } from "react";
import type { ReactNode } from "react";

// Basic types
export interface TextMessagePart {
  type: "text";
  text: string;
  parentId?: string;
}

export interface ReasoningMessagePart {
  type: "reasoning";
  text: string;
  parentId?: string;
}

export interface ToolCallMessagePart<TArgs = Record<string, unknown>, TResult = unknown> {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  args: TArgs;
  argsText?: string;
  result?: TResult;
  isError?: boolean;
  parentId?: string;
}

export type MessagePart = TextMessagePart | ReasoningMessagePart | ToolCallMessagePart;

export interface ThreadMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: MessagePart[];
  createdAt: Date;
  metadata: { custom: Record<string, unknown>; [key: string]: unknown };
  attachments?: unknown[];
  runConfig?: { custom?: unknown; [key: string]: unknown };
  status?: { type?: string; [key: string]: unknown };
}

export type Message = ThreadMessage;

export interface Thread {
  id: string;
  messages: readonly ThreadMessage[];
  isRunning: boolean;
  append: (message: AppendMessage) => Promise<void>;
}

export interface Runtime {
  thread: () => Thread;
  append: (message: AppendMessage) => Promise<void>;
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
  parentId?: string | null;
  role: "user" | "assistant";
  content: MessagePart[];
  metadata: { custom: Record<string, unknown>; [key: string]: unknown };
  attachments?: unknown[];
  runConfig?: { custom?: unknown; [key: string]: unknown };
  createdAt?: Date;
  sourceId?: string | null;
}

export type ThreadAssistantMessage = ThreadMessage & { role: "assistant" };
export type ThreadUserMessage = ThreadMessage & { role: "user" };
export type ThreadSystemMessage = ThreadMessage & { role: "system" };


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
export function useExternalStoreRuntime<T>(adapter: ExternalStoreAdapter<T>): Runtime {
  const thread: Thread = {
    id: "parrot-thread",
    messages: adapter.messages,
    isRunning: adapter.isRunning,
    append: async (message) => {
      await adapter.onNew?.(message);
    },
  };

  return {
    thread: () => thread,
    append: thread.append,
    reload: () => void adapter.onReload?.(null),
    cancel: adapter.onCancel || (() => Promise.resolve()),
  };
}

// AssistantRuntimeProvider alias
export const AssistantRuntimeProvider = RuntimeProvider;

// useAui hook
export function useAui() {
  return {
    runtime: useRuntime(),
    thread: () => useThread(),
  };
}

export function useThread() {
  const runtime = useRuntime();
  return runtime.thread();
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
