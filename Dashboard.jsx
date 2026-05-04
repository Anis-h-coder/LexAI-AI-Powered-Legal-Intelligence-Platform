import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText, MessageSquare, FilePlus, GitCompare,
  BookOpen, TrendingUp, Clock, AlertTriangle,
  CheckCircle, ChevronRight, Upload, Zap
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../lib/supabase";

// ── Animations ──
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ── Quick Action Cards ──
const QUICK_ACTIONS = [
  { icon: FileText,      label: "Analyze Contract",    desc: "Upload & get AI risk analysis",   path: "/analyzer",   color: "#C9A84C" },
  { icon: MessageSquare, label: "Ask a Document",       desc: "Q&A on any legal document",       path: "/qa",         color: "#60A5FA" },
  { icon: FilePlus,      label: "Generate Contract",    desc: "Create NDAs, agreements & more",  path: "/generator",  color: "#4ADE80" },
  { icon: GitCompare,    label: "Compare Clauses",      desc: "Diff two contract versions",      path: "/comparator", color: "#F472B6" },
  { icon: BookOpen,      label: "Translate Jargon",     desc: "Plain-English legal explanations",path: "/translator", color: "#A78BFA" },
];

// ── Mock Recent Activity ──
const MOCK_RECENT = [
  { id: 1, name: "Freelance_Agreement_2025.pdf", type: "Analysis",   risk: "Medium", date: "2h ago",   status: "complete" },
  { id: 2, name: "NDA_ClientX_Final.pdf",        type: "Q&A",        risk: "Low",    date: "Yesterday", status: "complete" },
  { id: 3, name: "Employment_Contract_Draft.pdf", type: "Analysis",   risk: "High",   date: "2 days ago",status: "complete" },
  { id: 4, name: "SaaS_Terms_of_Service.pdf",    type: "Comparison", risk: "Low",    date: "3 days ago",status: "complete" },
];

const RISK_COLORS = {
  Low:    { bg: "rgba(74,222,128,0.1)",  text: "#4ADE80",  border: "rgba(74,222,128,0.2)"  },
  Medium: { bg: "rgba(251,191,36,0.1)",  text: "#FBBF24",  border: "rgba(251,191,36,0.2)"  },
  High:   { bg: "rgba(239,68,68,0.1)",   text: "#F87171",  border: "rgba(239,68,68,0.2)"   },
};

// ── Stat Card ──
function StatCard({ icon: Icon, label, value, sub, color, index }) {
  return (
    <motion.div variants={fadeUp} custom={index}
      style={{
        background: "#12121A", border: "1px solid #1E1E2E",
        borderRadius: 14, padding: "24px",
        display: "flex", flexDirection: "column", gap: 12,
        transition: "border-color 0.25s, transform 0.25s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.25)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#1E1E2E"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          background: `${color}18`, border: `1px solid ${color}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={20} color={color} />
        </div>
        <span style={{ fontSize: 11, color: "#4ADE80", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 100, padding: "3px 10px", fontWeight: 600 }}>
          ↑ {sub}
        </span>
      </div>
      <div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: "#F5F5F0", letterSpacing: "-0.5px" }}>{value}</div>
        <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{label}</div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loading,   setLoading]   = useState(true);

  const firstName = user?.email?.split("@")[0] || "there";
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Fetch from Supabase (falls back to mock if table doesn't exist yet)
  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const { data, error } = await supabase
          .from("contracts")
          .select("*")
          .eq("user_id", user?.id)
          .order("created_at", { ascending: false })
          .limit(5);
        if (!error && data?.length) setContracts(data);
        else setContracts(MOCK_RECENT);
      } catch {
        setContracts(MOCK_RECENT);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchContracts();
    else { setContracts(MOCK_RECENT); setLoading(false); }
  }, [user]);

  const STATS = [
    { icon: FileText,     label: "Contracts Analyzed", value: "12",  sub: "3 this week",  color: "#C9A84C" },
    { icon: AlertTriangle,label: "Risks Detected",     value: "28",  sub: "5 high risk",  color: "#F87171" },
    { icon: CheckCircle,  label: "Clauses Reviewed",   value: "147", sub: "since signup", color: "#4ADE80" },
    { icon: Clock,        label: "Hours Saved",        value: "9.4", sub: "vs manual",    color: "#60A5FA" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0A0A0F", fontFamily: "'DM Sans', sans-serif", overflow: "hidden" }}>
      <Sidebar />

      {/* ── Main Content ── */}
      <main style={{ flex: 1, overflowY: "auto", padding: "0" }}>

        {/* Top bar */}
        <div style={{
          height: 64, borderBottom: "1px solid #1E1E2E",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 32px", background: "#0A0A0F", position: "sticky", top: 0, zIndex: 10,
        }}>
          <div>
            <span style={{ fontSize: 13, color: "#6B7280" }}>Dashboard</span>
          </div>
          <button
            onClick={() => navigate("/analyzer")}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "linear-gradient(135deg, #C9A84C, #A8891E)",
              border: "none", color: "#0A0A0F", fontSize: 13, fontWeight: 700,
              cursor: "pointer", padding: "9px 18px", borderRadius: 8,
              transition: "opacity 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            <Upload size={14} /> Analyze Contract
          </button>
        </div>

        <div style={{ padding: "36px 32px", maxWidth: 1100 }}>

          {/* ── Greeting ── */}
          <motion.div initial="hidden" animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          >
            <motion.div variants={fadeUp} custom={0} style={{ marginBottom: 36 }}>
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 30, fontWeight: 700, color: "#F5F5F0",
                letterSpacing: "-0.5px", marginBottom: 6,
              }}>
                {greeting}, <span style={{ color: "#C9A84C" }}>{firstName}</span> 👋
              </h1>
              <p style={{ color: "#6B7280", fontSize: 15 }}>Here's an overview of your legal activity.</p>
            </motion.div>

            {/* ── Stat Cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 40 }}>
              {STATS.map((s, i) => <StatCard key={s.label} {...s} index={i} />)}
            </div>

            {/* ── Quick Actions ── */}
            <motion.div variants={fadeUp} custom={4} style={{ marginBottom: 40 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#F5F5F0" }}>
                  Quick Actions
                </h2>
                <span style={{ fontSize: 12, color: "#C9A84C", display: "flex", alignItems: "center", gap: 4 }}>
                  <Zap size={12} fill="#C9A84C" /> AI-powered
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                {QUICK_ACTIONS.map((action, i) => (
                  <motion.button key={action.path} variants={fadeUp} custom={5 + i}
                    onClick={() => navigate(action.path)}
                    style={{
                      background: "#12121A", border: "1px solid #1E1E2E",
                      borderRadius: 12, padding: "18px 16px", cursor: "pointer",
                      display: "flex", flexDirection: "column", gap: 10,
                      textAlign: "left", transition: "all 0.2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${action.color}40`; e.currentTarget.style.background = `${action.color}06`; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#1E1E2E"; e.currentTarget.style.background = "#12121A"; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 9,
                      background: `${action.color}15`, border: `1px solid ${action.color}25`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <action.icon size={17} color={action.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#F5F5F0", marginBottom: 3 }}>{action.label}</div>
                      <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.4 }}>{action.desc}</div>
                    </div>
                    <ChevronRight size={14} color={action.color} style={{ alignSelf: "flex-end" }} />
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* ── Recent Activity ── */}
            <motion.div variants={fadeUp} custom={10}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#F5F5F0" }}>
                  Recent Activity
                </h2>
                <button
                  style={{ background: "none", border: "none", color: "#C9A84C", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  View all <ChevronRight size={14} />
                </button>
              </div>

              <div style={{ background: "#12121A", border: "1px solid #1E1E2E", borderRadius: 14, overflow: "hidden" }}>
                {/* Table Header */}
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 120px 100px 100px",
                  padding: "12px 20px", borderBottom: "1px solid #1E1E2E",
                  fontSize: 11, fontWeight: 600, color: "#4B5563", letterSpacing: "0.8px", textTransform: "uppercase",
                }}>
                  <span>Document</span>
                  <span>Type</span>
                  <span>Risk</span>
                  <span>Date</span>
                </div>

                {/* Table Rows */}
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <div key={i} style={{ padding: "16px 20px", borderBottom: i < 3 ? "1px solid #1A1A26" : "none", display: "flex", gap: 16, alignItems: "center" }}>
                      <div style={{ flex: 1, height: 14, background: "#1E1E2E", borderRadius: 4, animation: "pulse 1.5s infinite" }} />
                      <div style={{ width: 80, height: 14, background: "#1E1E2E", borderRadius: 4 }} />
                      <div style={{ width: 60, height: 14, background: "#1E1E2E", borderRadius: 4 }} />
                      <div style={{ width: 80, height: 14, background: "#1E1E2E", borderRadius: 4 }} />
                    </div>
                  ))
                ) : (
                  contracts.map((c, i) => {
                    const risk = c.risk_level || c.risk || "Low";
                    const rc = RISK_COLORS[risk] || RISK_COLORS.Low;
                    return (
                      <motion.div key={c.id}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        style={{
                          display: "grid", gridTemplateColumns: "1fr 120px 100px 100px",
                          padding: "15px 20px",
                          borderBottom: i < contracts.length - 1 ? "1px solid #1A1A26" : "none",
                          transition: "background 0.2s", cursor: "pointer",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        {/* Name */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                            background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <FileText size={14} color="#C9A84C" />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 500, color: "#D1D5DB", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {c.file_name || c.name}
                          </span>
                        </div>
                        {/* Type */}
                        <span style={{ fontSize: 13, color: "#6B7280", display: "flex", alignItems: "center" }}>
                          {c.analysis_type || c.type || "Analysis"}
                        </span>
                        {/* Risk */}
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, letterSpacing: "0.5px",
                            background: rc.bg, color: rc.text, border: `1px solid ${rc.border}`,
                            borderRadius: 100, padding: "3px 10px",
                          }}>{risk}</span>
                        </div>
                        {/* Date */}
                        <span style={{ fontSize: 13, color: "#6B7280", display: "flex", alignItems: "center" }}>
                          {c.created_at ? new Date(c.created_at).toLocaleDateString() : c.date}
                        </span>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>

            {/* ── Tip Banner ── */}
            <motion.div variants={fadeUp} custom={11}
              style={{
                marginTop: 32, padding: "20px 24px", borderRadius: 12,
                background: "linear-gradient(135deg, rgba(201,168,76,0.07), rgba(201,168,76,0.02))",
                border: "1px solid rgba(201,168,76,0.15)",
                display: "flex", alignItems: "center", gap: 16,
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <TrendingUp size={18} color="#C9A84C" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#F5F5F0", marginBottom: 3 }}>💡 Pro tip</div>
                <div style={{ fontSize: 13, color: "#6B7280" }}>Use the Clause Comparator before signing any amended contract — it catches changes that are easy to miss.</div>
              </div>
              <button
                onClick={() => navigate("/comparator")}
                style={{
                  background: "none", border: "1px solid rgba(201,168,76,0.3)", color: "#C9A84C",
                  fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "8px 16px", borderRadius: 8,
                  whiteSpace: "nowrap", transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,76,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
              >
                Try it →
              </button>
            </motion.div>

          </motion.div>
        </div>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1E1E2E; border-radius: 3px; }
      `}</style>
    </div>
  );
}