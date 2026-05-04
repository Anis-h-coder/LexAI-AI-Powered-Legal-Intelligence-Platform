import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Zap, RefreshCw, Copy, Check,
  ChevronDown, ChevronUp, ArrowRight,
  Lightbulb, AlertCircle, Volume2
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { askGroq } from "../../lib/groq";
import toast from "react-hot-toast";

// ── Constants ─────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are LexAI, an expert legal language simplifier. Translate legal text into plain English that anyone can understand. Return ONLY a JSON object — no markdown, no extra text.

Return this exact structure:
{
  "plain_summary": "A clear 2-3 sentence plain English summary of what this text means overall",
  "complexity_score": number 1-10 (10 = extremely complex),
  "reading_level": "e.g. Grade 8, College Level, Legal Expert",
  "terms": [
    {
      "term": "The legal term or phrase",
      "definition": "Simple plain-English definition (1-2 sentences)",
      "example": "A real-world example of how this applies",
      "severity": "Info" | "Warning" | "Critical"
    }
  ],
  "key_points": ["Plain English key point 1", "Plain English key point 2"],
  "watch_out_for": ["Potential concern 1", "Potential concern 2"],
  "bottom_line": "One sentence: what does this actually mean for you?"
}`;

const EXAMPLES = [
  {
    label: "Indemnification Clause",
    text: `The Indemnifying Party shall defend, indemnify, and hold harmless the Indemnified Party and its officers, directors, employees, agents, and successors from and against any and all losses, damages, liabilities, deficiencies, claims, actions, judgments, settlements, interest, awards, penalties, fines, costs, or expenses of whatever kind, including reasonable attorneys' fees, that are incurred by the Indemnified Party arising out of or relating to any breach or non-fulfillment of any representation, warranty, covenant, or agreement under this Agreement.`,
  },
  {
    label: "Limitation of Liability",
    text: `IN NO EVENT SHALL EITHER PARTY BE LIABLE TO THE OTHER FOR ANY INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, LOSS OF DATA, LOSS OF GOODWILL, SERVICE INTERRUPTION, COMPUTER DAMAGE, SYSTEM FAILURE, OR THE COST OF SUBSTITUTE SERVICES, ARISING OUT OF OR IN CONNECTION WITH THIS AGREEMENT, HOWEVER CAUSED, AND WHETHER ARISING IN CONTRACT, TORT, NEGLIGENCE, STRICT LIABILITY, OR OTHERWISE.`,
  },
  {
    label: "Non-Compete Clause",
    text: `During the Term and for a period of twenty-four (24) months following the termination or expiration of this Agreement, the Employee shall not, directly or indirectly, engage in, own, manage, operate, control, be employed by, provide services to, participate in, or be connected with any business or enterprise that competes with the Company's Business within the Restricted Territory.`,
  },
  {
    label: "Force Majeure",
    text: `Neither party shall be held liable or responsible to the other party nor be deemed to have defaulted under or breached this Agreement for failure or delay in fulfilling or performing any term of this Agreement when such failure or delay is caused by or results from acts beyond the impacted party's reasonable control, including, without limitation, acts of God, flood, fire, earthquake, civil unrest, acts of terror, strikes or labor disputes.`,
  },
];

const SEVERITY_CONFIG = {
  Info:     { color: "#60A5FA", bg: "rgba(96,165,250,0.08)",  border: "rgba(96,165,250,0.2)",  icon: "ℹ️" },
  Warning:  { color: "#FBBF24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.2)",  icon: "⚠️" },
  Critical: { color: "#F87171", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)",   icon: "🚨" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.42, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ── Term Card ─────────────────────────────────────────────────
function TermCard({ term, index }) {
  const [open, setOpen] = useState(false);
  const cfg = SEVERITY_CONFIG[term.severity] || SEVERITY_CONFIG.Info;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      style={{
        background: "#0D0D14",
        border: `1px solid ${open ? cfg.border : "#1E1E2E"}`,
        borderRadius: 10, overflow: "hidden", transition: "border-color 0.25s",
      }}
    >
      <button onClick={() => setOpen(!open)}
        style={{
          width: "100%", padding: "13px 16px", background: "none",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 12,
        }}
      >
        <span style={{ fontSize: 16, flexShrink: 0 }}>{cfg.icon}</span>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#F5F5F0", textAlign: "left" }}>
          {term.term}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700,
          background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
          borderRadius: 100, padding: "2px 9px", flexShrink: 0,
        }}>{term.severity}</span>
        {open ? <ChevronUp size={14} color="#6B7280" /> : <ChevronDown size={14} color="#6B7280" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div style={{ padding: "0 16px 16px", borderTop: "1px solid #1A1A26" }}>
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Definition */}
                <div style={{ padding: "12px 14px", background: "#12121A", border: "1px solid #1E1E2E", borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.5px", marginBottom: 5 }}>PLAIN ENGLISH</div>
                  <p style={{ fontSize: 13, color: "#D1D5DB", lineHeight: 1.65 }}>{term.definition}</p>
                </div>
                {/* Example */}
                <div style={{ padding: "12px 14px", background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.1)", borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#C9A84C", letterSpacing: "0.5px", marginBottom: 5 }}>REAL-WORLD EXAMPLE</div>
                  <p style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.65 }}>{term.example}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Complexity Meter ──────────────────────────────────────────
function ComplexityMeter({ score }) {
  const color = score >= 8 ? "#F87171" : score >= 5 ? "#FBBF24" : "#4ADE80";
  const label = score >= 8 ? "Very Complex" : score >= 5 ? "Moderate" : "Readable";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#6B7280" }}>Complexity</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{score}/10 · {label}</span>
      </div>
      <div style={{ height: 6, background: "#1E1E2E", borderRadius: 3, overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(score / 10) * 100}%` }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.3 }}
          style={{ height: "100%", background: color, borderRadius: 3 }}
        />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function JargonTranslator() {
  const [input,   setInput]   = useState("");
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied,  setCopied]  = useState(false);
  const [tab,     setTab]     = useState("terms");

  const handleTranslate = async () => {
    if (!input.trim()) { toast.error("Please paste some legal text first."); return; }
    setLoading(true);
    setResult(null);
    try {
      const raw = await askGroq(SYSTEM_PROMPT, `Translate this legal text:\n\n${input.slice(0, 5000)}`);
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed  = JSON.parse(cleaned);
      setResult(parsed);
      setTab("terms");
      toast.success("Translation complete!");
    } catch (err) {
      console.error(err);
      toast.error("Translation failed. Check your Groq API key.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const text = [
      `PLAIN SUMMARY\n${result.plain_summary}`,
      `\nKEY POINTS\n${result.key_points?.join("\n")}`,
      `\nWATCH OUT FOR\n${result.watch_out_for?.join("\n")}`,
      `\nBOTTOM LINE\n${result.bottom_line}`,
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard!");
  };

  const handleReset = () => { setInput(""); setResult(null); };

  const TABS = ["terms", "key points", "watch out"];

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0A0A0F", fontFamily: "'DM Sans', sans-serif", overflow: "hidden" }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: "auto" }}>

        {/* Top Bar */}
        <div style={{
          height: 64, borderBottom: "1px solid #1E1E2E",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 32px", position: "sticky", top: 0, background: "#0A0A0F", zIndex: 10,
        }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "#F5F5F0" }}>Jargon Translator</h1>
            <p style={{ fontSize: 12, color: "#6B7280" }}>Turn dense legal language into plain English instantly</p>
          </div>
          {result && (
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleCopy}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px solid rgba(201,168,76,0.3)", color: "#C9A84C", fontSize: 13, cursor: "pointer", padding: "8px 14px", borderRadius: 8 }}>
                {copied ? <Check size={13} color="#4ADE80" /> : <Copy size={13} />}
                {copied ? "Copied!" : "Copy"}
              </button>
              <button onClick={handleReset}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px solid #1E1E2E", color: "#9CA3AF", fontSize: 13, cursor: "pointer", padding: "8px 14px", borderRadius: 8 }}>
                <RefreshCw size={13} /> New Text
              </button>
            </div>
          )}
        </div>

        <div style={{ padding: "32px", maxWidth: 1050, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: result ? "1fr 1fr" : "1fr", gap: 24 }}>

            {/* ── LEFT: Input ── */}
            <motion.div layout transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
              <motion.div
                initial="hidden" animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
              >
                {/* Header */}
                <motion.div variants={fadeUp} custom={0} style={{ marginBottom: 16 }}>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#F5F5F0", marginBottom: 4 }}>
                    Paste Legal Text
                  </h2>
                  <p style={{ fontSize: 13, color: "#6B7280" }}>Any clause, paragraph, or full document section</p>
                </motion.div>

                {/* Textarea */}
                <motion.div variants={fadeUp} custom={1}>
                  <textarea
                    value={input} onChange={e => setInput(e.target.value)}
                    placeholder="Paste your legal text here...&#10;&#10;Example: 'The Indemnifying Party shall defend, indemnify, and hold harmless...'"
                    rows={result ? 12 : 10}
                    style={{
                      width: "100%", padding: "16px",
                      background: "#12121A", border: "1px solid #1E1E2E",
                      borderRadius: 12, color: "#F5F5F0", fontSize: 14,
                      resize: "vertical", outline: "none", lineHeight: 1.7,
                      fontFamily: "'DM Sans', sans-serif", transition: "border-color 0.2s",
                      boxSizing: "border-box",
                    }}
                    onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.4)"}
                    onBlur={e => e.target.style.borderColor = "#1E1E2E"}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: "#4B5563" }}>
                      {input.split(" ").filter(Boolean).length} words
                    </span>
                    {input && (
                      <button onClick={() => setInput("")}
                        style={{ background: "none", border: "none", color: "#4B5563", fontSize: 12, cursor: "pointer" }}
                        onMouseEnter={e => e.target.style.color = "#F87171"}
                        onMouseLeave={e => e.target.style.color = "#4B5563"}
                      >Clear</button>
                    )}
                  </div>
                </motion.div>

                {/* Example Clauses */}
                {!result && (
                  <motion.div variants={fadeUp} custom={2} style={{ marginTop: 20, marginBottom: 20 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#4B5563", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 10 }}>
                      Try an example
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {EXAMPLES.map((ex) => (
                        <button key={ex.label} onClick={() => setInput(ex.text)}
                          style={{
                            background: "#12121A", border: "1px solid #1E1E2E",
                            borderRadius: 9, padding: "10px 14px", cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 10,
                            transition: "all 0.2s", textAlign: "left",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; e.currentTarget.style.background = "rgba(201,168,76,0.03)"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = "#1E1E2E"; e.currentTarget.style.background = "#12121A"; }}
                        >
                          <BookOpen size={13} color="#C9A84C" />
                          <span style={{ fontSize: 13, color: "#9CA3AF" }}>{ex.label}</span>
                          <ArrowRight size={12} color="#4B5563" style={{ marginLeft: "auto" }} />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Translate Button */}
                <motion.div variants={fadeUp} custom={3}>
                  <button onClick={handleTranslate} disabled={loading}
                    style={{
                      width: "100%", padding: "15px",
                      background: loading ? "rgba(201,168,76,0.3)" : "linear-gradient(135deg, #C9A84C, #A8891E)",
                      border: "none", borderRadius: 11, color: "#0A0A0F",
                      fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                      boxShadow: "0 4px 20px rgba(201,168,76,0.2)", transition: "opacity 0.2s",
                      marginTop: result ? 16 : 0,
                    }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.88"; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                  >
                    {loading ? (
                      <>
                        <div style={{ width: 18, height: 18, border: "2px solid #0A0A0F", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                        Translating...
                      </>
                    ) : (
                      <><Zap size={16} fill="#0A0A0F" /> Translate to Plain English</>
                    )}
                  </button>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* ── RIGHT: Results ── */}
            <AnimatePresence>
              {result && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* Bottom Line Banner */}
                  <div style={{
                    background: "linear-gradient(135deg, rgba(201,168,76,0.1), rgba(201,168,76,0.04))",
                    border: "1px solid rgba(201,168,76,0.25)",
                    borderRadius: 12, padding: "16px 18px", marginBottom: 18,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#C9A84C", letterSpacing: "1px", marginBottom: 7 }}>🎯 BOTTOM LINE</div>
                    <p style={{ fontSize: 14, color: "#F5F5F0", lineHeight: 1.65, fontWeight: 500 }}>{result.bottom_line}</p>
                  </div>

                  {/* Plain Summary + Meta */}
                  <div style={{ background: "#12121A", border: "1px solid #1E1E2E", borderRadius: 12, padding: "18px", marginBottom: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.5px", marginBottom: 8 }}>PLAIN ENGLISH SUMMARY</div>
                    <p style={{ fontSize: 14, color: "#D1D5DB", lineHeight: 1.7, marginBottom: 16 }}>{result.plain_summary}</p>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <ComplexityMeter score={result.complexity_score} />
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Volume2 size={13} color="#6B7280" />
                        <span style={{ fontSize: 12, color: "#6B7280" }}>Reading level:</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#D1D5DB" }}>{result.reading_level}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "#12121A", border: "1px solid #1E1E2E", borderRadius: 10, padding: 4 }}>
                    {TABS.map(t => (
                      <button key={t} onClick={() => setTab(t)}
                        style={{
                          flex: 1, padding: "8px 4px", borderRadius: 7, border: "none", cursor: "pointer",
                          background: tab === t ? "rgba(201,168,76,0.12)" : "transparent",
                          color: tab === t ? "#C9A84C" : "#6B7280",
                          fontSize: 12, fontWeight: tab === t ? 600 : 400,
                          textTransform: "capitalize", transition: "all 0.2s", whiteSpace: "nowrap",
                        }}
                      >
                        {t === "key points" ? "Key Points" : t === "watch out" ? "⚠️ Watch Out" : "Legal Terms"}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {/* Terms Tab */}
                    {tab === "terms" && (
                      <motion.div key="terms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                          <span style={{ fontSize: 12, color: "#6B7280" }}>{result.terms?.length} legal terms detected</span>
                          <div style={{ display: "flex", gap: 8 }}>
                            {["Info", "Warning", "Critical"].map(s => (
                              <span key={s} style={{ fontSize: 10, color: SEVERITY_CONFIG[s].color, background: SEVERITY_CONFIG[s].bg, border: `1px solid ${SEVERITY_CONFIG[s].border}`, borderRadius: 100, padding: "2px 8px", fontWeight: 600 }}>{s}</span>
                            ))}
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {result.terms?.map((term, i) => <TermCard key={i} term={term} index={i} />)}
                        </div>
                      </motion.div>
                    )}

                    {/* Key Points Tab */}
                    {tab === "key points" && (
                      <motion.div key="keypoints" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {result.key_points?.map((point, i) => (
                            <motion.div key={i}
                              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.06 }}
                              style={{ background: "#12121A", border: "1px solid #1E1E2E", borderRadius: 10, padding: "15px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}
                            >
                              <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12, fontWeight: 700, color: "#C9A84C" }}>
                                {i + 1}
                              </div>
                              <p style={{ fontSize: 14, color: "#D1D5DB", lineHeight: 1.65 }}>{point}</p>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Watch Out Tab */}
                    {tab === "watch out" && (
                      <motion.div key="watchout" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div style={{ marginBottom: 14, padding: "12px 16px", background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 10, display: "flex", gap: 10, alignItems: "center" }}>
                          <AlertCircle size={15} color="#FBBF24" />
                          <span style={{ fontSize: 13, color: "#9CA3AF" }}>These are potential concerns you should be aware of before agreeing to this text.</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {result.watch_out_for?.map((item, i) => (
                            <motion.div key={i}
                              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.06 }}
                              style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 10, padding: "15px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}
                            >
                              <div style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚠️</div>
                              <p style={{ fontSize: 14, color: "#FCA5A5", lineHeight: 1.65 }}>{item}</p>
                            </motion.div>
                          ))}
                        </div>

                        {/* Disclaimer */}
                        <div style={{ marginTop: 20, padding: "14px 16px", background: "#12121A", border: "1px solid #1E1E2E", borderRadius: 10, display: "flex", gap: 10 }}>
                          <Lightbulb size={15} color="#C9A84C" style={{ flexShrink: 0, marginTop: 2 }} />
                          <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65 }}>
                            This is an AI interpretation for informational purposes only. Consult a qualified attorney before making any legal decisions based on this translation.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        textarea::placeholder { color: #374151; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1E1E2E; border-radius: 4px; }
      `}</style>
    </div>
  );
}