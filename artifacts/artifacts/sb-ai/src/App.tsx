import { type FormEvent, useEffect, useRef, useState } from "react";
import { useSendChatMessage } from "@workspace/api-client-react";
import {
  ArrowUp,
  Check,
  Copy,
  Menu,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const STORAGE_KEY = "sb-ai-conversation";
const LEGACY_WELCOME_MESSAGE =
  "Hi, I’m SB.ai. Ask me anything, brainstorm an idea, or give me something to work through.";

function getStoredMessages(): ChatMessage[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as ChatMessage[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (message) =>
        message &&
        typeof message === "object" &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim() &&
        message.content !== LEGACY_WELCOME_MESSAGE,
    );
  } catch {
    return [];
  }
}

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>(getStoredMessages);
  const [input, setInput] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendMessage = useSendChatMessage();

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sendMessage.isPending]);

  const startNewChat = () => {
    setMessages([]);
    setInput("");
    setSidebarOpen(false);
    window.localStorage.removeItem(STORAGE_KEY);
    window.setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const submitMessage = async (event?: FormEvent) => {
    event?.preventDefault();
    const content = input.trim();
    if (!content || sendMessage.isPending) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content },
    ];
    setMessages(nextMessages);
    setInput("");

    try {
      const result = await sendMessage.mutateAsync({ data: { messages: nextMessages } });
      setMessages((current) => [...current, result.message]);
    } catch {
      // The error state below is rendered from the mutation object so the
      // conversation remains intact and the user can retry naturally.
    }
  };

  const copyMessage = async (content: string, index: number) => {
    await navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    window.setTimeout(() => setCopiedIndex(null), 1600);
  };

  return (
    <main className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <button
            className="icon-button mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <button className="new-chat-button" onClick={startNewChat}>
          <Plus size={18} />
          <span>New conversation</span>
        </button>

        <div className="sidebar-section">
          <div className="section-label">Workspace</div>
          <div className="quiet-row">Current conversation</div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <section className="chat-panel">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={19} />
          </button>
          <div className="topbar-actions">
            <button className="clear-button" onClick={startNewChat}>
              <Trash2 size={15} />
              <span>Clear</span>
            </button>
          </div>
        </header>

        <div className="conversation-scroll">
          <div className="conversation-content">
            {messages.length === 0 && (
              <div className="empty-state">
                <h1>Hello! I am SB.ai.</h1>
              </div>
            )}

            <div className="message-list">
              {messages.map((message, index) => (
                <article
                  className={`message-row ${message.role === "user" ? "message-user" : "message-assistant"}`}
                  key={`${message.role}-${index}`}
                >
                  <div className="avatar" aria-hidden="true">
                    {message.role === "assistant" ? (
                      <Sparkles size={15} />
                    ) : (
                      <span>you</span>
                    )}
                  </div>
                  <div className="message-body">
                    <div className="message-meta">
                      <span>{message.role === "assistant" ? "SB.ai" : "You"}</span>
                      {message.role === "assistant" && (
                        <span className="message-tag">assistant</span>
                      )}
                    </div>
                    <p>{message.content}</p>
                    {message.role === "assistant" && (
                      <button
                        className="copy-button"
                        onClick={() => copyMessage(message.content, index)}
                        aria-label="Copy response"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check size={13} /> Copied
                          </>
                        ) : (
                          <>
                            <Copy size={13} /> Copy
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </article>
              ))}

              {sendMessage.isPending && (
                <article className="message-row message-assistant">
                  <div className="avatar" aria-hidden="true">
                    <Sparkles size={15} />
                  </div>
                  <div className="message-body">
                    <div className="message-meta">
                      <span>SB.ai</span>
                      <span className="message-tag">thinking</span>
                    </div>
                    <div className="thinking-indicator">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </article>
              )}

              {sendMessage.isError && (
                <div className="error-banner" role="alert">
                  <div>
                    <strong>SB.ai couldn’t respond.</strong>
                    <span>Check your connection and try sending again.</span>
                  </div>
                  <button onClick={() => sendMessage.reset()}>Dismiss</button>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
        </div>

        <div className="composer-wrap">
          <form className="composer" onSubmit={submitMessage}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void submitMessage();
                }
              }}
              placeholder="Message SB.ai..."
              rows={1}
              aria-label="Message SB.ai"
            />
            <button
              className="send-button"
              type="submit"
              disabled={!input.trim() || sendMessage.isPending}
              aria-label="Send message"
            >
              <ArrowUp size={18} strokeWidth={2.5} />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default App;