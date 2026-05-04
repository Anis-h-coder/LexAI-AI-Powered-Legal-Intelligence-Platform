import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, X, Send, Bot, User,
  Minimize2, Maximize2, RotateCcw, Copy, Check,
  Sparkles, ChevronRight
} from "lucide-react";

// ── Page Context Map ──────────────────────────────────────────
const PAGE_CONTEXT = {
  "/dashboard":  "The user is on the Dashboard page, which shows their contract activity stats, quick action cards for all tools, and recent contract history.",
  "/analyzer":   "The user is on the Contract Analyzer page, where they can upload or paste a contract to get AI-powered risk analysis, clause breakdown, red flags, obligations and recommendations.",
  "/qa":         "The user is on the Document Q&A page, where they can upload a legal document and ask questions about it in plain English using a chat interface.",
  "/generator":  "The user is on the Contract Generator page, where they can select a contract type (NDA, Freelance, Employment, SaaS, Partnership, Rental) and fill a form to generate a professional contract.",
  "/comparator": "The user is on the Clause Comparator page, where they can paste two contract versions and get an AI diff analysis showing changes, risk scores, and a recommendation on which version is better.",
  "/translator": "The user is on the Jargon Translator page, where they can paste legal text and get a plain English translation with term definitions, key points, and warnings.",
  "/":           "The user is on the Landing page of LexAI.",
};

const QUICK_PROMPTS = [
  { label: "How do I analyze a contract?",       icon: "📄" },
  { label: "What is an indemnification clause?",  icon: "⚖️" },
  { label: "How does Document Q&A work?",         icon: "💬" },
  { label: "What contracts can I generate?",      icon: "✍️" },
  { label: "How do I compare two contracts?",     icon: "🔀" },
  { label: "Is this chatbot free to use?",        icon: "💰" },
];

const SYSTEM_PROMPT = (pageContext) => `You are LexAI Assistant, a friendly and knowledgeable AI legal helper built into the LexAI platform. You have three roles:

1. GENERAL LEGAL Q&A: Answer legal questions in plain, easy-to-understand English. Always clarify you are not a lawyer and cannot give legal advice — only information.

2. CONTEXT-AWARE HELPER: ${pageContext} Use this context to give relevant, specific help about what the user sees on screen.

3. FEATURE GUIDE: Help users understand and use LexAI's features:
   - Contract Analyzer: Upload/paste contracts for AI risk analysis
   - Document Q&A: Chat with any legal document
   - Contract Generator: Generate NDAs, freelance agreements, employment contracts, SaaS ToS, partnership and rental agreements
   - Clause Comparator: Compare two contract versions side by side
   - Jargon Translator: Translate legal language to plain English

TONE: Friendly, concise, helpful. Use short paragraphs. Use emojis sparingly. Always end legal answers with a note that this is informational, not legal advice.

IMPORTANT: Keep responses focused and under 200 words unless the user asks for detail.`;

// ── Typing Dots ───────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #C9A84C, #8B6914)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Bot size={13} color="#0A0A0F" />
      </div>
      <div style={{ padding: "10px 14px", background: "#1A1A26", border: "1px solid #2D2D3E", borderRadius: "4px 12px 12px 12px", display: "flex", gap: 4, alignItems: "center" }}>
        {[0, 1, 2].map(i => (
          <motion.div key={i}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
            style={{ width: 6, height: 6, borderRadius: "50%", background: "#C9A84C" }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────────
function Bubble({ msg }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      style={{ display: "flex", flexDirection: isUser ? "row-reverse" : "row", gap: 8, marginBottom: 12, alignItems: "flex-start" }}
    >
      {/* Avatar */}
      <div style={{
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        background: isUser ? "#1E1E2E" : "linear-gradient(135deg, #C9A84C, #8B6914)",
        border: isUser ? "1px solid #2D2D3E" : "none",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {isUser ? <User size={13} color="#6B7280" /> : <Bot size={13} color="#0A0A0F" />}
      </div>

      <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", gap: 3, alignItems: isUser ? "flex-end" : "flex-start" }}>
        <div style={{
          padding: "10px 13px",
          background: isUser ? "rgba(201,168,76,0.14)" : "#1A1A26",
          border: isUser ? "1px solid rgba(201,168,76,0.22)" : "1px solid #2D2D3E",
          borderRadius: isUser ? "12px 3px 12px 12px" : "3px 12px 12px 12px",
          color: "#F5F5F0", fontSize: 13, lineHeight: 1.65,
          whiteSpace: "pre-wrap", wordBreak: "break-word",
        }}>
          {msg.content}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, color: "#374151" }}>
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {!isUser && (
            <button onClick={handleCopy}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#374151", fontSize: 10, display: "flex", alignItems: "center", gap: 3, padding: 0, transition: "color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#C9A84C"}
              onMouseLeave={e => e.currentTarget.style.color = "#374151"}
            >
              {copied ? <Check size={9} color="#4ADE80" /> : <Copy size={9} />}
              {copied ? "Copied" : "Copy"}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Chatbot Component ────────────────────────────────────
export default function ChatBot() {
  const location = useLocation();
  const [open,       setOpen]       = useState(false);
  const [expanded,   setExpanded]   = useState(false);
  const [messages,   setMessages]   = useState([
    {
      role: "assistant",
      content: "👋 Hi! I'm the LexAI Assistant.\n\nI can help you with legal questions, guide you through LexAI's features, or explain anything you see on screen.\n\nWhat can I help you with?",
      timestamp: Date.now(),
    },
  ]);
  const [input,      setInput]      = useState("");
  const [typing,     setTyping]     = useState(false);
  const [history,    setHistory]    = useState([]);
  const [unread,     setUnread]     = useState(0);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  // Page context
  const pageCtx = PAGE_CONTEXT[location.pathname] || "The user is using the LexAI platform.";

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setUnread(0);
    }
  }, [open]);

  // ── Send Message ──
const sendMessage = async (text) => {
  const q = text || input.trim();
  if (!q || typing) return;
  setInput("");

  const userMsg = { role: "user", content: q, timestamp: Date.now() };
  setMessages(prev => [...prev, userMsg]);
  setTyping(true);

  // ✅ Don't include the new user message twice
  const updatedHistory = [...history, { role: "user", content: q }];

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT(pageCtx) },
          ...updatedHistory,
        ],
        temperature: 0.6,
        max_tokens: 512,
      }),
    });

    const data = await res.json();
    console.log("Groq response:", data); // remove after fix confirmed

    const answer = data.choices?.[0]?.message?.content 
      || "Sorry, I couldn't process that. Please try again.";

    setTyping(false);
    const botMsg = { role: "assistant", content: answer, timestamp: Date.now() };
    setMessages(prev => [...prev, botMsg]);

    // ✅ Set history from updatedHistory + assistant reply (no duplication)
    setHistory([...updatedHistory, { role: "assistant", content: answer }]);

    if (!open) setUnread(prev => prev + 1);

  } catch (err) {
    console.error("Fetch error:", err);
    setTyping(false);
    setMessages(prev => [...prev, {
      role: "assistant",
      content: "⚠️ Something went wrong. Please check your connection and try again.",
      timestamp: Date.now(),
    }]);
  }
};

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleReset = () => {
    setMessages([{
      role: "assistant",
      content: "👋 Chat cleared! How can I help you?",
      timestamp: Date.now(),
    }]);
    setHistory([]);
  };

  // ── Dimensions ──
  const W = expanded ? 480 : 360;
  const H = expanded ? 620 : 500;

  // Don't show on landing/login/signup
  const hidden = ["/", "/login", "/signup"].includes(location.pathname);
  if (hidden) return null;

  return (
    <>
      {/* ── Chat Window ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chatwindow"
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "fixed", bottom: 90, right: 24, zIndex: 1000,
              width: W, height: H,
              background: "#0D0D14",
              border: "1px solid #1E1E2E",
              borderRadius: 20,
              display: "flex", flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.08)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {/* ── Header ── */}
            <div style={{
              padding: "14px 16px",
              background: "linear-gradient(135deg, rgba(201,168,76,0.1), rgba(201,168,76,0.04))",
              borderBottom: "1px solid #1E1E2E",
              display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
            }}>
              {/* Bot avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "linear-gradient(135deg, #C9A84C, #8B6914)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Bot size={18} color="#0A0A0F" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#F5F5F0" }}>LexAI Assistant</div>
                <div style={{ fontSize: 11, color: "#4ADE80", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", display: "inline-block" }} />
                  Online · Powered by Groq
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={handleReset} title="Clear chat"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#4B5563", padding: 6, borderRadius: 7, transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#F5F5F0"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#4B5563"; }}
                >
                  <RotateCcw size={14} />
                </button>
                <button onClick={() => setExpanded(!expanded)} title={expanded ? "Minimize" : "Expand"}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#4B5563", padding: 6, borderRadius: 7, transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#F5F5F0"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#4B5563"; }}
                >
                  {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button onClick={() => setOpen(false)} title="Close"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#4B5563", padding: 6, borderRadius: 7, transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#F87171"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#4B5563"; }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* ── Context Badge ── */}
            <div style={{
              padding: "7px 14px", background: "rgba(201,168,76,0.04)",
              borderBottom: "1px solid #1A1A26",
              fontSize: 11, color: "#6B7280",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <Sparkles size={10} color="#C9A84C" />
              Context: <span style={{ color: "#C9A84C", fontWeight: 600 }}>
                {location.pathname === "/dashboard" ? "Dashboard"
                  : location.pathname === "/analyzer" ? "Contract Analyzer"
                  : location.pathname === "/qa" ? "Document Q&A"
                  : location.pathname === "/generator" ? "Contract Generator"
                  : location.pathname === "/comparator" ? "Clause Comparator"
                  : location.pathname === "/translator" ? "Jargon Translator"
                  : "LexAI"}
              </span>
              — I know what you're working on
            </div>

            {/* ── Messages ── */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px" }}>
              {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
              {typing && <TypingDots />}
              <div ref={bottomRef} />
            </div>

            {/* ── Quick Prompts (only show if just 1 message) ── */}
            {messages.length === 1 && (
              <div style={{ padding: "0 14px 10px", display: "flex", flexDirection: "column", gap: 5 }}>
                <p style={{ fontSize: 11, color: "#4B5563", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 2 }}>Quick questions</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                  {QUICK_PROMPTS.map((p) => (
                    <button key={p.label} onClick={() => sendMessage(p.label)}
                      style={{
                        background: "#12121A", border: "1px solid #1E1E2E",
                        borderRadius: 8, padding: "7px 10px",
                        cursor: "pointer", textAlign: "left",
                        fontSize: 11, color: "#9CA3AF", lineHeight: 1.4,
                        display: "flex", alignItems: "flex-start", gap: 6,
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; e.currentTarget.style.color = "#F5F5F0"; e.currentTarget.style.background = "rgba(201,168,76,0.04)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#1E1E2E"; e.currentTarget.style.color = "#9CA3AF"; e.currentTarget.style.background = "#12121A"; }}
                    >
                      <span>{p.icon}</span> {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Input ── */}
            <div style={{ padding: "10px 12px", borderTop: "1px solid #1E1E2E", flexShrink: 0 }}>
              <div style={{
                display: "flex", gap: 8, alignItems: "flex-end",
                background: "#12121A", border: "1px solid #1E1E2E",
                borderRadius: 12, padding: "8px 8px 8px 12px",
                transition: "border-color 0.2s",
              }}
                onFocusCapture={e => e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)"}
                onBlurCapture={e => e.currentTarget.style.borderColor = "#1E1E2E"}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything legal..."
                  rows={1}
                  style={{
                    flex: 1, background: "none", border: "none", outline: "none",
                    color: "#F5F5F0", fontSize: 13, lineHeight: 1.5,
                    resize: "none", fontFamily: "'DM Sans', sans-serif",
                    padding: "4px 0", maxHeight: 80, overflowY: "auto",
                  }}
                  onInput={e => {
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px";
                  }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || typing}
                  style={{
                    width: 32, height: 32, borderRadius: 8, border: "none", flexShrink: 0,
                    background: input.trim() && !typing ? "linear-gradient(135deg, #C9A84C, #A8891E)" : "#1E1E2E",
                    cursor: input.trim() && !typing ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s",
                  }}
                >
                  <Send size={13} color={input.trim() && !typing ? "#0A0A0F" : "#374151"} />
                </button>
              </div>
              <p style={{ fontSize: 10, color: "#2D2D3E", textAlign: "center", marginTop: 6 }}>
                Not legal advice · Enter to send
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Bubble Button ── */}
      <motion.button
        onClick={() => { setOpen(!open); setUnread(0); }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 1001,
          width: 56, height: 56, borderRadius: "50%", border: "none",
          background: open
            ? "#1A1A26"
            : "linear-gradient(135deg, #C9A84C, #8B6914)",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: open
            ? "0 4px 20px rgba(0,0,0,0.4)"
            : "0 8px 32px rgba(201,168,76,0.4)",
          transition: "background 0.3s, box-shadow 0.3s",
        }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close"
              initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}
            >
              <X size={22} color="#F5F5F0" />
            </motion.div>
          ) : (
            <motion.div key="open"
              initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}
            >
              <MessageCircle size={24} color="#0A0A0F" fill="#0A0A0F" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Unread Badge ── */}
      <AnimatePresence>
        {unread > 0 && !open && (
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            style={{
              position: "fixed", bottom: 68, right: 20, zIndex: 1002,
              width: 20, height: 20, borderRadius: "50%",
              background: "#F87171", border: "2px solid #0A0A0F",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 800, color: "#fff",
            }}
          >
            {unread}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        textarea::placeholder { color: #2D2D3E; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #1E1E2E; border-radius: 3px; }
      `}</style>
    </>
  );
}