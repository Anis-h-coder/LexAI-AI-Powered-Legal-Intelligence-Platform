import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, Send, Bot, User,
  Sparkles, ChevronRight, RefreshCw, Copy, Check
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import toast from "react-hot-toast";

// ── Constants ────────────────────────────────────────────────
const SYSTEM_PROMPT = (docText) => `You are LexAI, an expert legal document assistant. You have been given a legal document to analyze. Answer questions about it clearly and concisely.

IMPORTANT RULES:
- Only answer based on what's in the document
- If the answer isn't in the document, say so clearly
- Use plain English, avoid legal jargon unless quoting directly
- Be precise and cite relevant sections when possible
- Keep answers focused and well-structured
- DO NOT use markdown formatting like ** or ## in your response — use plain text only

DOCUMENT CONTENT:
---
${docText.slice(0, 8000)}
---`;

const SUGGESTED_QUESTIONS = [
  "What are the main obligations of each party?",
  "Are there any non-compete or non-solicitation clauses?",
  "What happens if either party breaches this contract?",
  "What is the termination process?",
  "Are there any automatic renewal clauses?",
  "What jurisdiction governs this agreement?",
  "What are the payment terms?",
  "Is there a limitation of liability clause?",
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ── Markdown-aware text renderer ─────────────────────────────
function RichText({ content }) {
  const lines = content.split("\n");
  return (
    <div style={{ fontSize: 14, lineHeight: 1.75, color: "#F5F5F0" }}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} style={{ height: 8 }} />;

        // Parse inline **bold** within a line
        const parseInline = (text) => {
          const parts = text.split(/(\*\*[^*]+\*\*)/g);
          return parts.map((part, j) =>
            /^\*\*[^*]+\*\*$/.test(part)
              ? <strong key={j} style={{ color: "#F5F5F0", fontWeight: 700 }}>{part.slice(2, -2)}</strong>
              : <span key={j}>{part}</span>
          );
        };

        // Numbered list items: "1.", "2.", "1.1"
        if (/^\d+(\.\d+)?[\.\s]/.test(trimmed)) {
          return (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6, alignItems: "flex-start" }}>
              <span style={{ color: "#C9A84C", fontWeight: 700, flexShrink: 0, minWidth: 20, fontSize: 13 }}>
                {trimmed.match(/^\d+(\.\d+)?/)?.[0]}.
              </span>
              <span style={{ color: "#D1D5DB" }}>
                {parseInline(trimmed.replace(/^\d+(\.\d+)?[\.\s]+/, ""))}
              </span>
            </div>
          );
        }

        // Bullet items: "- " or "• "
        if (/^[-•]\s/.test(trimmed)) {
          return (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6, alignItems: "flex-start" }}>
              <span style={{ color: "#C9A84C", flexShrink: 0 }}>•</span>
              <span style={{ color: "#D1D5DB" }}>{parseInline(trimmed.replace(/^[-•]\s+/, ""))}</span>
            </div>
          );
        }

        // Section-like lines ending with ":" — treat as sub-heading
        if (trimmed.endsWith(":") && trimmed.length < 60) {
          return (
            <div key={i} style={{ fontWeight: 700, color: "#C9A84C", fontSize: 13, marginTop: 14, marginBottom: 4 }}>
              {trimmed}
            </div>
          );
        }

        // Normal paragraph
        return (
          <div key={i} style={{ marginBottom: 6, color: "#D1D5DB" }}>
            {parseInline(trimmed)}
          </div>
        );
      })}
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────────
function MessageBubble({ msg, index }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.03 }}
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        gap: 10, alignItems: "flex-start",
        marginBottom: 20,
      }}
    >
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #C9A84C, #8B6914)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Bot size={16} color="#0A0A0F" />
        </div>
      )}

      <div style={{ maxWidth: "74%", display: "flex", flexDirection: "column", gap: 4, alignItems: isUser ? "flex-end" : "flex-start" }}>
        <div style={{
          padding: "12px 16px",
          background: isUser
            ? "linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.1))"
            : "#12121A",
          border: isUser
            ? "1px solid rgba(201,168,76,0.25)"
            : "1px solid #1E1E2E",
          borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
        }}>
          {isUser
            ? <span style={{ color: "#F5F5F0", fontSize: 14, lineHeight: 1.75 }}>{msg.content}</span>
            : <RichText content={msg.content} />
          }
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#374151" }}>
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {!isUser && (
            <button onClick={handleCopy}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#4B5563", padding: 2, display: "flex", alignItems: "center", gap: 4, fontSize: 11, transition: "color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#C9A84C"}
              onMouseLeave={e => e.currentTarget.style.color = "#4B5563"}
            >
              {copied ? <Check size={11} color="#4ADE80" /> : <Copy size={11} />}
              {copied ? "Copied" : "Copy"}
            </button>
          )}
        </div>
      </div>

      {isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
          background: "#1E1E2E", border: "1px solid #2D2D3E",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <User size={15} color="#6B7280" />
        </div>
      )}
    </motion.div>
  );
}

// ── Typing Indicator ──────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 20 }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #C9A84C, #8B6914)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Bot size={16} color="#0A0A0F" />
      </div>
      <div style={{ padding: "14px 18px", background: "#12121A", border: "1px solid #1E1E2E", borderRadius: "4px 16px 16px 16px", display: "flex", gap: 5, alignItems: "center" }}>
        {[0, 1, 2].map(i => (
          <motion.div key={i}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            style={{ width: 7, height: 7, borderRadius: "50%", background: "#C9A84C" }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function DocumentQA() {
  const [docText,     setDocText]     = useState("");
  const [docName,     setDocName]     = useState("");
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState("");
  const [typing,      setTyping]      = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const pasteRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // ── File Upload ──
  const onDrop = useCallback((accepted) => {
    const f = accepted[0];
    if (!f) return;
    setDocName(f.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setDocText(e.target.result);
      setMessages([{
        role: "assistant",
        content: `Document loaded: ${f.name}\n\nI'm ready to answer your questions about this document. What would you like to know?`,
        timestamp: Date.now(),
      }]);
      setChatHistory([]);
    };
    reader.readAsText(f);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "text/plain": [".txt"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] },
    maxFiles: 1, maxSize: 5 * 1024 * 1024,
  });

  // ── Send Message ──
  const sendMessage = async (question) => {
    const q = question || input.trim();
    if (!q || !docText || typing) return;
    if (!question) setInput("");

    const userMsg = { role: "user", content: q, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setTyping(true);

    const updatedHistory = [...chatHistory, { role: "user", content: q }];

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
            { role: "system", content: SYSTEM_PROMPT(docText) },
            ...updatedHistory,
          ],
          temperature: 0.4,
          max_tokens: 1024,
        }),
      });

      const data = await res.json();
      const answer = data.choices?.[0]?.message?.content || "Sorry, I couldn't process that. Please try again.";

      setTyping(false);
      const assistantMsg = { role: "assistant", content: answer, timestamp: Date.now() };
      setMessages(prev => [...prev, assistantMsg]);
      // ✅ No duplication — set from updatedHistory
      setChatHistory([...updatedHistory, { role: "assistant", content: answer }]);
    } catch {
      setTyping(false);
      toast.error("Failed to get response. Check your API key.");
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again.", timestamp: Date.now() }]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleReset = () => {
    setDocText(""); setDocName(""); setMessages([]);
    setChatHistory([]); setInput("");
  };

  const handleLoadPaste = () => {
    const val = pasteRef.current?.value.trim();
    if (!val) { toast.error("Please paste some text first."); return; }
    setDocText(val);
    setDocName("Pasted Document");
    setMessages([{ role: "assistant", content: "Document loaded! I'm ready to answer your questions. What would you like to know?", timestamp: Date.now() }]);
  };

  // ── No Document State ──
  if (!docText) {
    return (
      <div style={{ display: "flex", height: "100vh", background: "#0A0A0F", fontFamily: "'DM Sans', sans-serif", overflow: "hidden" }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ height: 64, borderBottom: "1px solid #1E1E2E", display: "flex", alignItems: "center", padding: "0 32px", position: "sticky", top: 0, background: "#0A0A0F", zIndex: 10 }}>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "#F5F5F0" }}>Document Q&A</h1>
              <p style={{ fontSize: 12, color: "#6B7280" }}>Ask questions about any legal document</p>
            </div>
          </div>

          <div style={{ padding: "60px 32px", maxWidth: 700, margin: "0 auto" }}>
            <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}>

              <motion.div variants={fadeUp} custom={0} style={{ textAlign: "center", marginBottom: 48 }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <Sparkles size={28} color="#C9A84C" />
                </div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: "#F5F5F0", marginBottom: 10 }}>
                  Ask Your Document Anything
                </h2>
                <p style={{ color: "#6B7280", fontSize: 15, lineHeight: 1.7 }}>
                  Upload a contract or legal document and have a conversation with it. Get precise answers based only on your document's content.
                </p>
              </motion.div>

              <motion.div variants={fadeUp} custom={1}
                {...getRootProps()}
                style={{
                  border: `2px dashed ${isDragActive ? "#C9A84C" : "#1E1E2E"}`,
                  borderRadius: 16, padding: "52px 40px", textAlign: "center",
                  cursor: "pointer", background: isDragActive ? "rgba(201,168,76,0.04)" : "#12121A",
                  transition: "all 0.25s", marginBottom: 32,
                }}
              >
                <input {...getInputProps()} />
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: "#1A1A26", border: "1px solid #1E1E2E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Upload size={24} color={isDragActive ? "#C9A84C" : "#4B5563"} />
                  </div>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 600, color: isDragActive ? "#C9A84C" : "#F5F5F0", marginBottom: 6 }}>
                      {isDragActive ? "Drop to load document" : "Upload your legal document"}
                    </p>
                    <p style={{ fontSize: 13, color: "#6B7280" }}>PDF, DOCX, TXT · Max 5MB</p>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeUp} custom={2}>
                <p style={{ fontSize: 13, color: "#4B5563", marginBottom: 12, textAlign: "center" }}>— or paste your document text —</p>
                <textarea
                  ref={pasteRef}
                  placeholder="Paste contract text here, then click Load Document..."
                  rows={5}
                  style={{
                    width: "100%", padding: "14px 16px",
                    background: "#12121A", border: "1px solid #1E1E2E",
                    borderRadius: 12, color: "#F5F5F0", fontSize: 14,
                    resize: "vertical", outline: "none", boxSizing: "border-box",
                    fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, transition: "border-color 0.2s",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.4)"}
                  onBlur={e => e.target.style.borderColor = "#1E1E2E"}
                />
                <button
                  onClick={handleLoadPaste}
                  style={{
                    marginTop: 12, width: "100%", padding: "14px",
                    background: "linear-gradient(135deg, #C9A84C, #A8891E)",
                    border: "none", borderRadius: 10, color: "#0A0A0F",
                    fontSize: 15, fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  <Sparkles size={16} /> Load Document & Start Chatting
                </button>
              </motion.div>

              <motion.div variants={fadeUp} custom={3} style={{ marginTop: 40, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { icon: "🔍", title: "Precise answers",    desc: "AI only uses your document" },
                  { icon: "💬", title: "Full conversation",  desc: "Ask follow-up questions" },
                  { icon: "📌", title: "Section references", desc: "AI cites relevant parts" },
                  { icon: "🔒", title: "Private & secure",   desc: "Data never stored" },
                ].map(item => (
                  <div key={item.title} style={{ background: "#12121A", border: "1px solid #1E1E2E", borderRadius: 10, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#F5F5F0" }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  // ── Chat State ──
  return (
    <div style={{ display: "flex", height: "100vh", background: "#0A0A0F", fontFamily: "'DM Sans', sans-serif", overflow: "hidden" }}>
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top Bar */}
        <div style={{
          height: 64, borderBottom: "1px solid #1E1E2E", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px", background: "#0A0A0F",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={16} color="#C9A84C" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#F5F5F0" }}>{docName}</div>
              <div style={{ fontSize: 11, color: "#4ADE80", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", display: "inline-block" }} />
                Document loaded · Ready to answer
              </div>
            </div>
          </div>
          <button onClick={handleReset}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px solid #1E1E2E", color: "#9CA3AF", fontSize: 13, cursor: "pointer", padding: "8px 14px", borderRadius: 8, transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#C9A84C"; e.currentTarget.style.color = "#C9A84C"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#1E1E2E"; e.currentTarget.style.color = "#9CA3AF"; }}
          >
            <RefreshCw size={13} /> New Document
          </button>
        </div>

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} index={i} />)}
            {typing && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Suggested Questions Panel */}
          <div style={{
            width: 240, borderLeft: "1px solid #1E1E2E",
            padding: "20px 16px", overflowY: "auto", flexShrink: 0,
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 4 }}>
              Suggested Questions
            </p>
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button key={i} onClick={() => { if (!typing) sendMessage(q); }}
                style={{
                  background: "#12121A", border: "1px solid #1E1E2E",
                  borderRadius: 9, padding: "10px 12px", cursor: "pointer",
                  color: "#9CA3AF", fontSize: 12, textAlign: "left", lineHeight: 1.5,
                  display: "flex", alignItems: "flex-start", gap: 8,
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; e.currentTarget.style.color = "#F5F5F0"; e.currentTarget.style.background = "rgba(201,168,76,0.04)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#1E1E2E"; e.currentTarget.style.color = "#9CA3AF"; e.currentTarget.style.background = "#12121A"; }}
              >
                <ChevronRight size={12} color="#C9A84C" style={{ marginTop: 2, flexShrink: 0 }} />
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div style={{ borderTop: "1px solid #1E1E2E", padding: "16px 24px", background: "#0A0A0F", flexShrink: 0 }}>
          <div style={{
            display: "flex", gap: 10, alignItems: "flex-end",
            background: "#12121A", border: "1px solid #1E1E2E",
            borderRadius: 14, padding: "8px 8px 8px 16px",
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
              placeholder="Ask anything about your document..."
              rows={1}
              style={{
                flex: 1, background: "none", border: "none", outline: "none",
                color: "#F5F5F0", fontSize: 14, lineHeight: 1.6, resize: "none",
                fontFamily: "'DM Sans', sans-serif", padding: "6px 0",
                maxHeight: 120, overflowY: "auto",
              }}
              onInput={e => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || typing}
              style={{
                width: 40, height: 40, borderRadius: 10, border: "none", flexShrink: 0,
                background: input.trim() && !typing ? "linear-gradient(135deg, #C9A84C, #A8891E)" : "#1E1E2E",
                cursor: input.trim() && !typing ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}
            >
              <Send size={16} color={input.trim() && !typing ? "#0A0A0F" : "#374151"} />
            </button>
          </div>
          <p style={{ fontSize: 11, color: "#374151", marginTop: 8, textAlign: "center" }}>
            Press Enter to send · Shift+Enter for new line · Answers based only on your document
          </p>
        </div>
      </div>

      <style>{`
        textarea::placeholder { color: #374151; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1E1E2E; border-radius: 4px; }
      `}</style>
    </div>
  );
}