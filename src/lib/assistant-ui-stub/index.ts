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
