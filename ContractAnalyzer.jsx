import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, X, AlertTriangle, CheckCircle,
  Info, ChevronDown, ChevronUp, Zap, Download,
  Shield, Clock, Eye, RefreshCw
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

// ── Helpers ──────────────────────────────────────────────────
const RISK_CONFIG = {
  High:   { color: "#F87171", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)",   icon: AlertTriangle },
  Medium: { color: "#FBBF24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.2)",  icon: Info },
  Low:    { color: "#4ADE80", bg: "rgba(74,222,128,0.08)",  border: "rgba(74,222,128,0.2)",  icon: CheckCircle },
};

const SYSTEM_PROMPT = `You are LexAI, an expert legal contract analyzer. Analyze the provided contract text and return a structured JSON response ONLY — no markdown, no explanation outside the JSON.

Return this exact structure:
{
  "summary": "2-3 sentence plain-English overview of what this contract is about",
  "overall_risk": "Low" | "Medium" | "High",
  "risk_score": number between 1-100,
  "parties": ["Party 1 name", "Party 2 name"],
  "contract_type": "e.g. NDA, Employment Agreement, Freelance Contract",
  "key_dates": [
    { "label": "Effective Date", "value": "date or N/A" },
    { "label": "Expiration Date", "value": "date or N/A" }
  ],
  "key_clauses": [
    {
      "title": "Clause name",
      "content": "Brief explanation of what this clause says",
      "risk": "Low" | "Medium" | "High",
      "flag": "Optional short warning if risky, else null"
    }
  ],
  "red_flags": ["List of concerning items found"],
  "obligations": {
    "party1": ["Obligation 1", "Obligation 2"],
    "party2": ["Obligation 1", "Obligation 2"]
  },
  "recommendations": ["Actionable suggestion 1", "Actionable suggestion 2"]
}`;

// ── Groq helper (inline, uses correct model) ─────────────────
async function callGroq(systemPrompt, userMessage) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userMessage  },
      ],
      temperature: 0.4,
      max_tokens: 2048,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || `Groq API error ${res.status}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

// ── Sub-components ────────────────────────────────────────────
function RiskBadge({ level, size = "sm" }) {
  const cfg = RISK_CONFIG[level] || RISK_CONFIG.Low;
  const Icon = cfg.icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      borderRadius: 100, padding: size === "lg" ? "6px 14px" : "3px 10px",
      fontSize: size === "lg" ? 14 : 11, fontWeight: 700, letterSpacing: "0.3px",
    }}>
      <Icon size={size === "lg" ? 14 : 11} strokeWidth={2.5} /> {level} Risk
    </span>
  );
}

function ClauseCard({ clause, index }) {
  const [open, setOpen] = useState(false);
  const cfg = RISK_CONFIG[clause.risk] || RISK_CONFIG.Low;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      style={{
        background: "#0D0D14", border: `1px solid ${open ? cfg.border : "#1E1E2E"}`,
        borderRadius: 10, overflow: "hidden", transition: "border-color 0.2s",
      }}
    >
      <button onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px", background: "none", border: "none", cursor: "pointer", gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#F5F5F0", textAlign: "left" }}>{clause.title}</span>
          {clause.flag && (
            <span style={{
              fontSize: 11, background: "rgba(239,68,68,0.1)", color: "#F87171",
              border: "1px solid rgba(239,68,68,0.2)", borderRadius: 100, padding: "2px 8px", whiteSpace: "nowrap",
            }}>⚠ {clause.flag}</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <RiskBadge level={clause.risk} />
          {open ? <ChevronUp size={15} color="#6B7280" /> : <ChevronDown size={15} color="#6B7280" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
          >
            <div style={{
              padding: "14px 18px 16px", borderTop: "1px solid #1A1A26",
              fontSize: 14, color: "#9CA3AF", lineHeight: 1.7,
            }}>
              {clause.content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ScoreRing({ score }) {
  const cfg = score >= 70 ? RISK_CONFIG.High : score >= 40 ? RISK_CONFIG.Medium : RISK_CONFIG.Low;
  const radius = 42, circ = 2 * Math.PI * radius;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: 110, height: 110, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="110" height="110" style={{ transform: "rotate(-90deg)", position: "absolute" }}>
        <circle cx="55" cy="55" r={radius} fill="none" stroke="#1E1E2E" strokeWidth="8" />
        <circle cx="55" cy="55" r={radius} fill="none" stroke={cfg.color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: cfg.color }}>{score}</div>
        <div style={{ fontSize: 10, color: "#6B7280", marginTop: -2 }}>Risk Score</div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function ContractAnalyzer() {
  const { user } = useAuth();
  const [file,     setFile]     = useState(null);
  const [text,     setText]     = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [tab,      setTab]      = useState("overview");

  // ── Dropzone ──
  const onDrop = useCallback((accepted) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setAnalysis(null);
    const reader = new FileReader();
    reader.onload = (e) => setText(e.target.result);
    reader.readAsText(f);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  // ── Analyze ──
  const handleAnalyze = async () => {
    const content = text.trim() || "Sample NDA contract: This Non-Disclosure Agreement is made between Acme Corp and John Doe. Duration: 2 years. Penalties for breach: $50,000. Non-compete clause: 18 months within 50 miles. Governing law: California.";
    setLoading(true);
    setTab("overview");
    try {
      const raw     = await callGroq(SYSTEM_PROMPT, `Analyze this contract:\n\n${content.slice(0, 6000)}`);
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const result  = JSON.parse(cleaned);
      setAnalysis(result);

      if (user?.id) {
        await supabase.from("contracts").insert({
          user_id:       user.id,
          file_name:     file?.name || "Pasted Contract",
          analysis_type: "Analysis",
          risk_level:    result.overall_risk,
          summary:       result.summary,
        });
      }
      toast.success("Analysis complete!");
    } catch (err) {
      console.error("Analysis error:", err);
      toast.error(`Analysis failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { setFile(null); setText(""); setAnalysis(null); };

  const TABS = ["overview", "clauses", "obligations", "recommendations"];

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
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "#F5F5F0" }}>Contract Analyzer</h1>
            <p style={{ fontSize: 12, color: "#6B7280" }}>Upload a contract and get instant AI-powered analysis</p>
          </div>
          {analysis && (
            <button onClick={handleReset}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px solid #1E1E2E", color: "#9CA3AF", fontSize: 13, cursor: "pointer", padding: "8px 14px", borderRadius: 8 }}>
              <RefreshCw size={13} /> New Analysis
            </button>
          )}
        </div>

        <div style={{ padding: "32px", maxWidth: 1050 }}>
          <AnimatePresence mode="wait">

            {/* ── UPLOAD STATE ── */}
            {!analysis && (
              <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                {/* Dropzone */}
                <div {...getRootProps()} style={{
                  border: `2px dashed ${isDragActive ? "#C9A84C" : file ? "rgba(201,168,76,0.4)" : "#1E1E2E"}`,
                  borderRadius: 16, padding: "56px 40px", textAlign: "center", cursor: "pointer",
                  background: isDragActive ? "rgba(201,168,76,0.04)" : file ? "rgba(201,168,76,0.02)" : "#12121A",
                  transition: "all 0.25s", marginBottom: 20,
                }}>
                  <input {...getInputProps()} />
                  {file ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <FileText size={26} color="#C9A84C" />
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, color: "#F5F5F0", fontSize: 16 }}>{file.name}</p>
                        <p style={{ color: "#6B7280", fontSize: 13, marginTop: 4 }}>{(file.size / 1024).toFixed(1)} KB · Ready to analyze</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleReset(); }}
                        style={{ background: "none", border: "1px solid #1E1E2E", color: "#6B7280", cursor: "pointer", padding: "6px 14px", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                        <X size={12} /> Remove
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 60, height: 60, borderRadius: 16, background: "#1A1A26", border: "1px solid #1E1E2E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Upload size={26} color={isDragActive ? "#C9A84C" : "#4B5563"} />
                      </div>
                      <div>
                        <p style={{ fontSize: 17, fontWeight: 600, color: isDragActive ? "#C9A84C" : "#F5F5F0", marginBottom: 6 }}>
                          {isDragActive ? "Drop your contract here" : "Drop your contract or click to browse"}
                        </p>
                        <p style={{ fontSize: 13, color: "#6B7280" }}>Supports PDF, DOCX, TXT · Max 5MB</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Paste text option */}
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ flex: 1, height: 1, background: "#1E1E2E", display: "inline-block" }} />
                    or paste contract text directly
                    <span style={{ flex: 1, height: 1, background: "#1E1E2E", display: "inline-block" }} />
                  </p>
                  <textarea
                    value={text} onChange={e => setText(e.target.value)}
                    placeholder="Paste your contract text here..."
                    rows={6}
                    style={{
                      width: "100%", padding: "14px 16px",
                      background: "#12121A", border: "1px solid #1E1E2E",
                      borderRadius: 12, color: "#F5F5F0", fontSize: 14,
                      resize: "vertical", outline: "none", boxSizing: "border-box",
                      fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6,
                      transition: "border-color 0.2s",
                    }}
                    onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.4)"}
                    onBlur={e => e.target.style.borderColor = "#1E1E2E"}
                  />
                </div>

                {/* Analyze Button */}
                <button onClick={handleAnalyze} disabled={loading}
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
                      Analyzing with AI...
                    </>
                  ) : (
                    <><Zap size={18} fill="#0A0A0F" /> Analyze Contract</>
                  )}
                </button>

                <p style={{ textAlign: "center", fontSize: 12, color: "#374151", marginTop: 14 }}>
                  🔒 Your documents are processed securely and never stored without permission.
                </p>
              </motion.div>
            )}

            {/* ── ANALYSIS RESULTS ── */}
            {analysis && (
              <motion.div key="results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

                {/* Summary Card */}
                <div style={{
                  background: "#12121A", border: "1px solid rgba(201,168,76,0.2)",
                  borderRadius: 16, padding: "28px", marginBottom: 24,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                        <FileText size={18} color="#C9A84C" />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#C9A84C", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                          {analysis.contract_type}
                        </span>
                      </div>
                      <p style={{ fontSize: 15, color: "#D1D5DB", lineHeight: 1.7, marginBottom: 18 }}>{analysis.summary}</p>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <RiskBadge level={analysis.overall_risk} size="lg" />
                        {analysis.parties?.map(p => (
                          <span key={p} style={{ fontSize: 12, background: "#1A1A26", border: "1px solid #2D2D3E", color: "#9CA3AF", borderRadius: 100, padding: "4px 12px" }}>{p}</span>
                        ))}
                      </div>
                    </div>
                    <ScoreRing score={analysis.risk_score} />
                  </div>

                  {analysis.key_dates?.length > 0 && (
                    <div style={{ display: "flex", gap: 16, marginTop: 20, flexWrap: "wrap" }}>
                      {analysis.key_dates.map(d => (
                        <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 8, background: "#0D0D14", border: "1px solid #1E1E2E", borderRadius: 8, padding: "8px 14px" }}>
                          <Clock size={13} color="#6B7280" />
                          <span style={{ fontSize: 12, color: "#6B7280" }}>{d.label}:</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#D1D5DB" }}>{d.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Red Flags */}
                {analysis.red_flags?.length > 0 && (
                  <div style={{
                    background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: 12, padding: "18px 20px", marginBottom: 24,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <AlertTriangle size={16} color="#F87171" />
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#F87171" }}>Red Flags Detected</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {analysis.red_flags.map((flag, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <span style={{ color: "#F87171", fontSize: 16, marginTop: -1 }}>•</span>
                          <span style={{ fontSize: 14, color: "#FCA5A5", lineHeight: 1.6 }}>{flag}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tabs */}
                <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#12121A", border: "1px solid #1E1E2E", borderRadius: 10, padding: 4 }}>
                  {TABS.map(t => (
                    <button key={t} onClick={() => setTab(t)}
                      style={{
                        flex: 1, padding: "9px", borderRadius: 7, border: "none", cursor: "pointer",
                        background: tab === t ? "rgba(201,168,76,0.12)" : "transparent",
                        color: tab === t ? "#C9A84C" : "#6B7280",
                        fontSize: 13, fontWeight: tab === t ? 600 : 400,
                        textTransform: "capitalize", transition: "all 0.2s",
                      }}
                    >{t}</button>
                  ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  {tab === "clauses" && (
                    <motion.div key="clauses" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {analysis.key_clauses?.map((clause, i) => <ClauseCard key={i} clause={clause} index={i} />)}
                      </div>
                    </motion.div>
                  )}

                  {tab === "overview" && (
                    <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                        {[
                          { icon: Shield,        color: "#C9A84C", label: "Contract Type", value: analysis.contract_type },
                          { icon: Eye,           color: "#60A5FA", label: "Overall Risk",   value: analysis.overall_risk },
                          { icon: FileText,      color: "#4ADE80", label: "Clauses Found",  value: `${analysis.key_clauses?.length || 0} clauses` },
                          { icon: AlertTriangle, color: "#F87171", label: "Red Flags",      value: `${analysis.red_flags?.length || 0} found` },
                        ].map((item) => (
                          <div key={item.label} style={{ background: "#12121A", border: "1px solid #1E1E2E", borderRadius: 12, padding: "20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: 9, background: `${item.color}15`, border: `1px solid ${item.color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <item.icon size={16} color={item.color} />
                              </div>
                              <span style={{ fontSize: 12, color: "#6B7280" }}>{item.label}</span>
                            </div>
                            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#F5F5F0" }}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {tab === "obligations" && (
                    <motion.div key="obligations" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        {Object.entries(analysis.obligations || {}).map(([party, items], pi) => (
                          <div key={party} style={{ background: "#12121A", border: "1px solid #1E1E2E", borderRadius: 12, padding: "20px" }}>
                            <h3 style={{ fontSize: 13, fontWeight: 700, color: pi === 0 ? "#C9A84C" : "#60A5FA", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              {analysis.parties?.[pi] || `Party ${pi + 1}`}
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                              {items?.map((item, i) => (
                                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                  <CheckCircle size={14} color="#4ADE80" style={{ marginTop: 2, flexShrink: 0 }} />
                                  <span style={{ fontSize: 13, color: "#D1D5DB", lineHeight: 1.6 }}>{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {tab === "recommendations" && (
                    <motion.div key="recommendations" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {analysis.recommendations?.map((rec, i) => (
                          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                            style={{ background: "#12121A", border: "1px solid #1E1E2E", borderRadius: 12, padding: "18px 20px", display: "flex", gap: 14 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12, fontWeight: 700, color: "#C9A84C" }}>
                              {i + 1}
                            </div>
                            <p style={{ fontSize: 14, color: "#D1D5DB", lineHeight: 1.7 }}>{rec}</p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Export Button */}
                <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: "application/json" });
                      const url  = URL.createObjectURL(blob);
                      const a    = document.createElement("a");
                      a.href = url; a.download = "lexai-analysis.json"; a.click();
                      toast.success("Analysis downloaded!");
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
                    <Download size={15} /> Export Analysis
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
      `}</style>
    </div>
  );
}