import type { ComponentProps } from "react";
import { IssueChatThread } from "./IssueChatThread";

/**
 * Stable Paperclip-compatible task chat boundary.
 *
 * The task detail page owns all data loading and composer actions. Keeping the
 * exact IssueChatThread prop contract here lets the default renderer evolve to
 * the richer transcript view without changing that seam. Parrot reuses its
 * mature issue thread renderer while the boundary is introduced.
 */
export type TaskChatThreadProps = ComponentProps<typeof IssueChatThread>;

export function TaskChatThread(props: TaskChatThreadProps) {
  return (
    <div data-task-chat-thread="true">
      <IssueChatThread {...props} />
    </div>
  );
}
