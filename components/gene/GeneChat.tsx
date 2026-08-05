"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ChatComposer } from "@/components/gene/ChatComposer";
import { ChatMessage } from "@/components/gene/ChatMessage";
import { SuggestedQuestions } from "@/components/gene/SuggestedQuestions";
import { GeneChatError, sendGeneChat } from "@/lib/gene-client";
import { isRefusalAnswer } from "@/lib/gene-constants";
import {
  createMessageId,
  dedupeSources,
  type AssistantCompleteMessage,
  type ChatMessage as ChatMessageType,
} from "@/lib/gene-ui-types";

const WELCOME_CONTENT =
  "Hi, I'm Gene. I can answer questions about Akash's professional experience, projects, skills, education, and academic work.";

function createWelcomeMessage(): AssistantCompleteMessage {
  return {
    id: "welcome",
    role: "assistant",
    content: WELCOME_CONTENT,
    status: "complete",
    sources: [],
    isWelcome: true,
  };
}

function createInitialMessages(): ChatMessageType[] {
  return [createWelcomeMessage()];
}

const SCROLL_NEAR_BOTTOM_THRESHOLD = 120;

/**
 * Gene chat interface. Conversation state lives in React only (no persistence).
 * Each question is grounded independently by the backend.
 *
 * The component is self-contained so it can later be embedded elsewhere in the
 * portfolio without changes.
 */
export function GeneChat() {
  const [messages, setMessages] = useState<ChatMessageType[]>(
    createInitialMessages,
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef(true);

  const hasConversation = messages.some((message) => message.role === "user");

  const runRequest = useCallback(
    async (question: string, assistantId: string) => {
      setIsLoading(true);
      // Ensure the target assistant message shows the loading state (covers the
      // retry path where the message currently holds an error).
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? {
                id: assistantId,
                role: "assistant",
                content: "",
                status: "loading",
                sources: [],
              }
            : message,
        ),
      );

      try {
        // Public UI intentionally sends only `message`; the backend performs
        // automatic intent routing, rate limiting, and access control. The
        // browser never calls OpenAI directly and never selects the model.
        const response = await sendGeneChat(question);
        const refusal = isRefusalAnswer(response.answer);

        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? {
                  id: assistantId,
                  role: "assistant",
                  content: response.answer,
                  status: "complete",
                  sources: refusal ? [] : dedupeSources(response.sources),
                  isRefusal: refusal,
                }
              : message,
          ),
        );
      } catch (error) {
        // Only a client-safe message is retained; raw errors are never shown.
        const errorMessage =
          error instanceof GeneChatError ? error.userMessage : undefined;
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? {
                  id: assistantId,
                  role: "assistant",
                  content: "",
                  status: "error",
                  sources: [],
                  failedQuestion: question,
                  errorMessage,
                }
              : message,
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const submitQuestion = useCallback(
    (raw: string) => {
      const question = raw.trim();
      if (question.length === 0 || isLoading) {
        return;
      }

      const userId = createMessageId();
      const assistantId = createMessageId();

      setMessages((prev) => [
        ...prev,
        { id: userId, role: "user", content: question, status: "complete" },
        {
          id: assistantId,
          role: "assistant",
          content: "",
          status: "loading",
          sources: [],
        },
      ]);
      setInput("");
      isNearBottomRef.current = true;
      void runRequest(question, assistantId);
    },
    [isLoading, runRequest],
  );

  const retry = useCallback(
    (assistantId: string, failedQuestion: string) => {
      if (isLoading) {
        return;
      }
      isNearBottomRef.current = true;
      void runRequest(failedQuestion, assistantId);
    },
    [isLoading, runRequest],
  );

  const newChat = useCallback(() => {
    if (isLoading || !hasConversation) {
      return;
    }
    setMessages(createInitialMessages());
    setInput("");
    isNearBottomRef.current = true;
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [isLoading, hasConversation]);

  const handleScroll = useCallback(() => {
    const element = scrollContainerRef.current;
    if (!element) {
      return;
    }
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    isNearBottomRef.current =
      distanceFromBottom < SCROLL_NEAR_BOTTOM_THRESHOLD;
  }, []);

  // Auto-scroll to the newest message, unless the user has scrolled up.
  useEffect(() => {
    if (!isNearBottomRef.current) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages]);

  // Restore focus to the composer once a request settles.
  useEffect(() => {
    if (!isLoading) {
      textareaRef.current?.focus();
    }
  }, [isLoading]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-end">
        <button
          type="button"
          onClick={newChat}
          disabled={!hasConversation || isLoading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          New chat
        </button>
      </div>

      <div className="flex h-[68vh] min-h-120 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/60 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          role="log"
          aria-live="polite"
          aria-busy={isLoading}
          aria-label="Conversation with Gene"
          className="flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 sm:px-5"
        >
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isLoading={isLoading}
                onRetry={retry}
              />
            ))}

            {!hasConversation ? (
              <div className="mt-1">
                <SuggestedQuestions
                  onSelect={submitQuestion}
                  disabled={isLoading}
                />
              </div>
            ) : null}

            <div ref={bottomRef} />
          </div>
        </div>

        <div className="border-t border-zinc-200 bg-white px-3 py-3 sm:px-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mx-auto max-w-2xl">
            {/*
              POST /api/gene/chat is gated by the GENE_PUBLIC_ENABLED server
              flag and protected by IP rate limiting. 429/503 responses surface
              here as user-safe messages; the browser never sees internal
              details.
            */}
            <ChatComposer
              value={input}
              onChange={setInput}
              onSubmit={() => submitQuestion(input)}
              isLoading={isLoading}
              textareaRef={textareaRef}
            />
            <p className="mt-2 text-center text-xs text-zinc-400 dark:text-zinc-500">
              Each question is answered independently from verified portfolio
              data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
