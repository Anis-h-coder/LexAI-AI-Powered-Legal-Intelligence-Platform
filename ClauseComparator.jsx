import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitCompare, Zap, RefreshCw, AlertTriangle,
  CheckCircle, Info, ArrowRight, Download,
  TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { askGroq } from "../../lib/groq";
import toast from "react-hot-toast";

// ── Constants ─────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are LexAI, an expert legal contract comparison AI. Compare two contract versions and return ONLY a JSON object — no markdown, no explanation outside the JSON.

Return this exact structure:
{
  "summary": "2-3 sentence overview of the key differences between the two versions",
  "version1_risk": "Low" | "Medium" | "High",
  "version2_risk": "Low" | "Medium" | "High",
  "version1_score": number 1-100,
  "version2_score": number 1-100,
  "version1_label": "short label e.g. Original Draft",
  "version2_label": "short label e.g. Revised Version",
  "recommendation": "Version 1" | "Version 2" | "Neither",
  "recommendation_reason": "1-2 sentences why you recommend this version",
  "changes": [
    {
      "category": "category name e.g. Payment Terms, Liability, Termination",
      "change_type": "added" | "removed" | "modified" | "unchanged",
      "severity": "Low" | "Medium" | "High",
      "version1_text": "What version 1 says about this (or null if not present)",
      "version2_text": "What version 2 says about this (or null if not present)",
      "impact": "Plain English explanation of what this change means for you",
      "favors": "Party 1" | "Party 2" | "Neutral"
    }
  ],
  "version1_pros": ["Pro 1", "Pro 2"],
  "version1_cons": ["Con 1", "Con 2"],
  "version2_pros": ["Pro 1", "Pro 2"],
  "version2_cons": ["Con 1", "Con 2"]
}`;

const CHANGE_CONFIG = {
  added:     { color: "#4ADE80", bg: "rgba(74,222,128,0.08)",  border: "rgba(74,222,128,0.2)",  icon: TrendingUp,   label: "Added"    },
  removed:   { color: "#F87171", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)",   icon: TrendingDown, label: "Removed"  },
  modified:  { color: "#FBBF24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.2)",  icon: Info,         label: "Modified" },
  unchanged: { color: "#6B7280", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.2)", icon: Minus,        label: "Same"     },
};

const RISK_COLORS = {
  Low:    { color: "#4ADE80", bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.25)"  },
  Medium: { color: "#FBBF24", bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.25)"  },
  High:   { color: "#F87171", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)"   },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.42, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ── Sub-components ────────────────────────────────────────────
function RiskBadge({ level }) {
  const cfg = RISK_COLORS[level] || RISK_COLORS.Low;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      borderRadius: 100, padding: "4px 12px",
    }}>{level} Risk</span>
  );
}

function ScoreBar({ score, color }) {
  return (
    <div style={{ width: "100%", height: 6, background: "#1E1E2E", borderRadius: 3, overflow: "hidden" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
        style={{ height: "100%", background: color, borderRadius: 3 }}
      />
    </div>
  );
}

function ChangeCard({ change, index }) {
  const [open, setOpen] = useState(false);
  const cfg = CHANGE_CONFIG[change.change_type] || CHANGE_CONFIG.unchanged;
  const sev = RISK_COLORS[change.severity] || RISK_COLORS.Low;
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{
        background: "#0D0D14",
        border: `1px solid ${open ? cfg.border : "#1E1E2E"}`,
        borderRadius: 12, overflow: "hidden", transition: "border-color 0.25s",
      }}
    >
      <button onClick={() => setOpen(!open)}
        style={{
          width: "100%", padding: "14px 18px", background: "none", border: "none",
          cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
        }}
      >
        {/* Change type icon */}
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: cfg.bg, border: `1px solid ${cfg.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={15} color={cfg.color} />
        </div>

        {/* Category */}
        <span style={{ fontSize: 14, fontWeight: 600, color: "#F5F5F0", flex: 1, textAlign: "left" }}>
          {change.category}
        </span>

        {/* Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.3px",
            background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
            borderRadius: 100, padding: "2px 9px",
          }}>{cfg.label}</span>
          <span style={{
            fontSize: 11, fontWeight: 600,
            background: sev.bg, color: sev.color, border: `1px solid ${sev.border}`,
            borderRadius: 100, padding: "2px 9px",
          }}>{change.severity}</span>
          <span style={{ fontSize: 11, color: "#4B5563", background: "#12121A", border: "1px solid #1E1E2E", borderRadius: 100, padding: "2px 9px" }}>
            Favors {change.favors}
          </span>
          {open ? <ChevronUp size={14} color="#6B7280" /> : <ChevronDown size={14} color="#6B7280" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
          >
            <div style={{ padding: "0 18px 18px", borderTop: "1px solid #1A1A26" }}>
              {/* Impact */}
              <div style={{ marginTop: 14, padding: "12px 14px", background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#C9A84C", letterSpacing: "0.5px", marginBottom: 5 }}>💡 IMPACT</div>
                <p style={{ fontSize: 13, color: "#D1D5DB", lineHeight: 1.65 }}>{change.impact}</p>
              </div>

              {/* Side-by-side text */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                {[
                  { label: "Version 1", text: change.version1_text, color: "#60A5FA" },
                  { label: "Version 2", text: change.version2_text, color: "#C9A84C" },
                ].map(side => (
                  <div key={side.label} style={{ background: "#12121A", border: "1px solid #1E1E2E", borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: side.color, marginBottom: 6, letterSpacing: "0.5px" }}>{side.label.toUpperCase()}</div>
                    <p style={{ fontSize: 13, color: side.text ? "#9CA3AF" : "#374151", lineHeight: 1.6, fontStyle: side.text ? "normal" : "italic" }}>
                      {side.text || "Not present in this version"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ProConList({ items, type }) {
  const isPos = type === "pro";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items?.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
          <div style={{
            width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 1,
            background: isPos ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {isPos
              ? <CheckCircle size={11} color="#4ADE80" />
              : <AlertTriangle size={10} color="#F87171" />
            }
          </div>
          <span style={{ fontSize: 13, color: "#D1D5DB", lineHeight: 1.6 }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

// ── Text Input Panel ──────────────────────────────────────────
function ContractInput({ label, value, onChange, color }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.5px", textTransform: "uppercase" }}>{label}</span>
      </div>
      <textarea
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={`Paste ${label.toLowerCase()} text here...`}
        style={{
          flex: 1, minHeight: 280, padding: "14px 16px",
          background: "#12121A",
          border: `1px solid ${value ? color + "40" : "#1E1E2E"}`,
          borderRadius: 12, color: "#F5F5F0", fontSize: 13,
          resize: "none", outline: "none", lineHeight: 1.7,
          fontFamily: "'DM Sans', sans-serif", transition: "border-color 0.2s",
          boxSizing: "border-box", width: "100%",
        }}
        onFocus={e => e.target.style.borderColor = color + "60"}
        onBlur={e => e.target.style.borderColor = value ? color + "40" : "#1E1E2E"}
      />
      <div style={{ display: "flex", justify: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#4B5563" }}>
          {value ? `${value.split(" ").filter(Boolean).length} words` : "No text entered"}
        </span>
        {value && (
          <button onClick={() => onChange("")}
            style={{ background: "none", border: "none", color: "#4B5563", fontSize: 12, cursor: "pointer", padding: "2px 6px" }}
            onMouseEnter={e => e.target.style.color = "#F87171"}
            onMouseLeave={e => e.target.style.color = "#4B5563"}
          >Clear</button>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function ClauseComparator() {
  const [v1,       setV1]       = useState("");
  const [v2,       setV2]       = useState("");
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [activeTab,setActiveTab]= useState("changes");

  const handleCompare = async () => {
    if (!v1.trim() || !v2.trim()) {
      toast.error("Please paste both contract versions to compare.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const raw = await askGroq(
        SYSTEM_PROMPT,
        `Compare these two contract versions:\n\nVERSION 1:\n${v1.slice(0, 4000)}\n\nVERSION 2:\n${v2.slice(0, 4000)}`
      );
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed  = JSON.parse(cleaned);
      setResult(parsed);
      setActiveTab("changes");
      toast.success("Comparison complete!");
    } catch (err) {
      console.error(err);
      toast.error("Comparison failed. Check your Groq API key.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { setV1(""); setV2(""); setResult(null); };

  const TABS = ["changes", "side-by-side", "recommendation"];

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
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "#F5F5F0" }}>Clause Comparator</h1>
            <p style={{ fontSize: 12, color: "#6B7280" }}>Compare two contract versions and spot every difference</p>
          </div>
          {result && (
            <button onClick={handleReset}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px solid #1E1E2E", color: "#9CA3AF", fontSize: 13, cursor: "pointer", padding: "8px 14px", borderRadius: 8 }}>
              <RefreshCw size={13} /> New Comparison
            </button>
          )}
        </div>

        <div style={{ padding: "32px", maxWidth: 1100, margin: "0 auto" }}>
          <AnimatePresence mode="wait">

            {/* ── INPUT STATE ── */}
            {!result && (
              <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div
                  initial="hidden" animate="show"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
                >
                  <motion.div variants={fadeUp} custom={0} style={{ marginBottom: 28 }}>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#F5F5F0", marginBottom: 6 }}>
                      Paste Both Contract Versions
                    </h2>
                    <p style={{ color: "#6B7280", fontSize: 14 }}>AI will compare every clause and explain what changed, what was added or removed, and which version is better for you.</p>
                  </motion.div>

                  {/* Input panels */}
                  <motion.div variants={fadeUp} custom={1}
                    style={{ display: "flex", gap: 20, marginBottom: 24, alignItems: "stretch" }}
                  >
                    <ContractInput label="Version 1" value={v1} onChange={setV1} color="#60A5FA" />
                    {/* Arrow divider */}
                    <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: "50%",
                        background: "#12121A", border: "1px solid #1E1E2E",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <ArrowRight size={16} color="#4B5563" />
                      </div>
                    </div>
                    <ContractInput label="Version 2" value={v2} onChange={setV2} color="#C9A84C" />
                  </motion.div>

                  {/* Tips */}
                  <motion.div variants={fadeUp} custom={2}
                    style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}
                  >
                    {[
                      { icon: "🔍", text: "Spots added, removed & modified clauses" },
                      { icon: "⚖️", text: "Shows which version favors which party" },
                      { icon: "📊", text: "Risk scores both versions" },
                      { icon: "✅", text: "Recommends the better version for you" },
                    ].map(tip => (
                      <div key={tip.text} style={{ background: "#12121A", border: "1px solid #1E1E2E", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={{ fontSize: 18 }}>{tip.icon}</span>
                        <span style={{ fontSize: 13, color: "#6B7280" }}>{tip.text}</span>
                      </div>
                    ))}
                  </motion.div>

                  {/* Compare Button */}
                  <motion.div variants={fadeUp} custom={3}>
                    <button onClick={handleCompare} disabled={loading}
                      style={{
                        width: "100%", padding: "16px",
                        background: loading ? "rgba(201,168,76,0.3)" : "linear-gradient(135deg, #C9A84C, #A8891E)",
                        border: "none", borderRadius: 12, color: "#0A0A0F",
                        fontSize: 16, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                        boxShadow: "0 4px 24px rgba(201,168,76,0.2)", transition: "opacity 0.2s",
                      }}
                      onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.88"; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                    >
                      {loading ? (
                        <>
                          <div style={{ width: 20, height: 20, border: "2px solid #0A0A0F", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                          Comparing contracts...
                        </>
                      ) : (
                        <><GitCompare size={18} /> Compare Contracts</>
                      )}
                    </button>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {/* ── RESULTS STATE ── */}
            {result && (
              <motion.div key="results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>

                {/* Summary Card */}
                <div style={{ background: "#12121A", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 16, padding: "24px 28px", marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#C9A84C", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 10 }}>AI SUMMARY</div>
                  <p style={{ fontSize: 15, color: "#D1D5DB", lineHeight: 1.7, marginBottom: 20 }}>{result.summary}</p>

                  {/* Version score cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {[
                      { label: result.version1_label || "Version 1", risk: result.version1_risk, score: result.version1_score, color: "#60A5FA" },
                      { label: result.version2_label || "Version 2", risk: result.version2_risk, score: result.version2_score, color: "#C9A84C" },
                    ].map((v, i) => (
                      <div key={i} style={{
                        background: "#0D0D14", border: `1px solid ${v.color}25`,
                        borderRadius: 12, padding: "18px 20px",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: v.color }} />
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#F5F5F0" }}>{v.label}</span>
                          </div>
                          <RiskBadge level={v.risk} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <span style={{ fontSize: 12, color: "#6B7280" }}>Risk Score</span>
                          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: v.color }}>{v.score}</span>
                        </div>
                        <ScoreBar score={v.score} color={v.color} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#12121A", border: "1px solid #1E1E2E", borderRadius: 10, padding: 4 }}>
                  {TABS.map(t => (
                    <button key={t} onClick={() => setActiveTab(t)}
                      style={{
                        flex: 1, padding: "9px 6px", borderRadius: 7, border: "none", cursor: "pointer",
                        background: activeTab === t ? "rgba(201,168,76,0.12)" : "transparent",
                        color: activeTab === t ? "#C9A84C" : "#6B7280",
                        fontSize: 13, fontWeight: activeTab === t ? 600 : 400,
                        textTransform: "capitalize", transition: "all 0.2s",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t === "side-by-side" ? "Side by Side" : t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">

                  {/* ── Changes Tab ── */}
                  {activeTab === "changes" && (
                    <motion.div key="changes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {/* Change type legend */}
                      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
                        {Object.entries(CHANGE_CONFIG).map(([type, cfg]) => (
                          <div key={type} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: cfg.color }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color }} />
                            {cfg.label}
                          </div>
                        ))}
                        <span style={{ fontSize: 12, color: "#4B5563", marginLeft: "auto" }}>
                          {result.changes?.length} changes detected
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {result.changes?.map((change, i) => <ChangeCard key={i} change={change} index={i} />)}
                      </div>
                    </motion.div>
                  )}

                  {/* ── Side by Side Tab ── */}
                  {activeTab === "side-by-side" && (
                    <motion.div key="sidebyside" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        {[
                          { label: result.version1_label || "Version 1", pros: result.version1_pros, cons: result.version1_cons, color: "#60A5FA", risk: result.version1_risk, score: result.version1_score },
                          { label: result.version2_label || "Version 2", pros: result.version2_pros, cons: result.version2_cons, color: "#C9A84C", risk: result.version2_risk, score: result.version2_score },
                        ].map((v) => (
                          <div key={v.label} style={{ background: "#12121A", border: `1px solid ${v.color}25`, borderRadius: 14, padding: "22px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid #1E1E2E" }}>
                              <div style={{ width: 12, height: 12, borderRadius: "50%", background: v.color }} />
                              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: "#F5F5F0" }}>{v.label}</span>
                              <RiskBadge level={v.risk} />
                            </div>
                            <div style={{ marginBottom: 18 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "#4ADE80", letterSpacing: "0.5px", marginBottom: 10 }}>✅ PROS</div>
                              <ProConList items={v.pros} type="pro" />
                            </div>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "#F87171", letterSpacing: "0.5px", marginBottom: 10 }}>⚠️ CONS</div>
                              <ProConList items={v.cons} type="con" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* ── Recommendation Tab ── */}
                  {activeTab === "recommendation" && (
                    <motion.div key="recommendation" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <div style={{
                        background: "linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.02))",
                        border: "1px solid rgba(201,168,76,0.25)", borderRadius: 16,
                        padding: "36px", textAlign: "center", marginBottom: 24,
                      }}>
                        <div style={{ fontSize: 40, marginBottom: 16 }}>
                          {result.recommendation === "Version 1" ? "🔵" : result.recommendation === "Version 2" ? "🟡" : "⚖️"}
                        </div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: "#F5F5F0", marginBottom: 12 }}>
                          We recommend <span style={{ color: "#C9A84C" }}>{result.recommendation}</span>
                        </div>
                        <p style={{ fontSize: 15, color: "#9CA3AF", lineHeight: 1.7, maxWidth: 540, margin: "0 auto 24px" }}>
                          {result.recommendation_reason}
                        </p>
                        <div style={{
                          display: "inline-flex", alignItems: "center", gap: 8,
                          background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)",
                          borderRadius: 100, padding: "8px 20px", fontSize: 13, color: "#9CA3AF",
                        }}>
                          <AlertTriangle size={13} color="#FBBF24" />
                          Always consult an attorney before signing
                        </div>
                      </div>

                      {/* Quick stats */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
                        {[
                          { label: "Total Changes", value: result.changes?.length || 0, color: "#C9A84C" },
                          { label: "High Severity", value: result.changes?.filter(c => c.severity === "High").length || 0, color: "#F87171" },
                          { label: "Added Clauses", value: result.changes?.filter(c => c.change_type === "added").length || 0, color: "#4ADE80" },
                          { label: "Removed Clauses", value: result.changes?.filter(c => c.change_type === "removed").length || 0, color: "#F87171" },
                        ].map(stat => (
                          <div key={stat.label} style={{ background: "#12121A", border: "1px solid #1E1E2E", borderRadius: 12, padding: "18px", textAlign: "center" }}>
                            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Export */}
                <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
                      const a = document.createElement("a");
                      a.href = URL.createObjectURL(blob);
                      a.download = "lexai-comparison.json"; a.click();
                      toast.success("Comparison exported!");
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      background: "none", border: "1px solid rgba(201,168,76,0.3)",
                      color: "#C9A84C", fontSize: 14, fontWeight: 600,
                      cursor: "pointer", padding: "10px 20px", borderRadius: 9,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(201,168,76,0.06)"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                  >
                    <Download size={15} /> Export Comparison
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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