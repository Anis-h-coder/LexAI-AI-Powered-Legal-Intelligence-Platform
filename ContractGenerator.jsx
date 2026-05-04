import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FilePlus, ChevronRight, ChevronLeft, Zap,
  Download, Copy, Check, RefreshCw, FileText,
  User, Building, Calendar, DollarSign,
  Shield, AlertCircle, Sparkles
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import toast from "react-hot-toast";

// ── Constants ─────────────────────────────────────────────────
const CONTRACT_TYPES = [
  { id: "nda",         label: "Non-Disclosure Agreement",  icon: "🔒", desc: "Protect confidential information between parties" },
  { id: "freelance",   label: "Freelance Agreement",        icon: "💼", desc: "Define scope, payment and IP ownership for freelancers" },
  { id: "employment",  label: "Employment Contract",        icon: "👔", desc: "Formal agreement between employer and employee" },
  { id: "saas",        label: "SaaS Terms of Service",      icon: "☁️", desc: "Terms governing use of a software product" },
  { id: "partnership", label: "Partnership Agreement",      icon: "🤝", desc: "Define roles, profits and responsibilities for partners" },
  { id: "rental",      label: "Rental Agreement",           icon: "🏠", desc: "Property rental terms between landlord and tenant" },
];

const SYSTEM_PROMPT = (type, fields) => `You are LexAI, a professional contract drafting AI. Generate a complete, professional ${type} based on these details:

${Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join("\n")}

Requirements:
- Write a complete, legally-structured contract
- Include all standard clauses for this contract type
- Use professional legal language but keep it readable
- Include proper sections with numbered clauses
- Add placeholder brackets like [SIGNATURE] and [DATE] where needed
- Make it comprehensive — at least 600 words
- DO NOT use markdown formatting like ** or ## — use plain text with UPPERCASE section headings only

Return ONLY the contract text, no explanations or preamble.`;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ── Groq helper (inline) ──────────────────────────────────────
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
      max_tokens: 3000,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || `Groq error ${res.status}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

// ── Clean markdown artifacts from contract text ───────────────
function cleanContractText(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")   // remove **bold**
    .replace(/\*(.+?)\*/g, "$1")        // remove *italic*
    .replace(/^#{1,6}\s+/gm, "")        // remove # headings
    .replace(/^---+$/gm, "")            // remove horizontal rules
    .trim();
}

// ── Render contract with styled sections ─────────────────────
function ContractRenderer({ text }) {
  const lines = text.split("\n");
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.85, color: "#D1D5DB" }}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} style={{ height: 12 }} />;

        // Section headings: ALL CAPS lines
        const isHeading = trimmed === trimmed.toUpperCase() && trimmed.length > 3 && /[A-Z]/.test(trimmed);
        if (isHeading) {
          return (
            <div key={i} style={{
              fontSize: 13, fontWeight: 700, color: "#C9A84C",
              letterSpacing: "1px", marginTop: 24, marginBottom: 8,
              paddingBottom: 6, borderBottom: "1px solid rgba(201,168,76,0.15)",
            }}>
              {trimmed}
            </div>
          );
        }

        // Numbered clauses like "1.1", "2.", "3.2"
        const isClause = /^\d+(\.\d+)?[\s.]/.test(trimmed);
        if (isClause) {
          return (
            <div key={i} style={{
              color: "#E5E7EB", marginBottom: 10, paddingLeft: 12,
              borderLeft: "2px solid #1E1E2E",
            }}>
              {trimmed}
            </div>
          );
        }

        // Placeholder highlight [BRACKETS]
        const hasBracket = /\[.+?\]/.test(trimmed);
        if (hasBracket) {
          const parts = trimmed.split(/(\[.+?\])/g);
          return (
            <div key={i} style={{ marginBottom: 8 }}>
              {parts.map((part, j) =>
                /^\[.+?\]$/.test(part) ? (
                  <span key={j} style={{
                    background: "rgba(201,168,76,0.12)", color: "#C9A84C",
                    border: "1px solid rgba(201,168,76,0.25)",
                    borderRadius: 4, padding: "1px 6px", fontSize: 13, fontWeight: 600,
                  }}>{part}</span>
                ) : (
                  <span key={j}>{part}</span>
                )
              )}
            </div>
          );
        }

        return <div key={i} style={{ marginBottom: 8 }}>{trimmed}</div>;
      })}
    </div>
  );
}

// ── Field configs per contract type ──────────────────────────
const FIELD_CONFIGS = {
  nda: [
    { key: "party1_name",    label: "Disclosing Party Name",  icon: User,        type: "text",     placeholder: "Acme Corp or John Smith" },
    { key: "party2_name",    label: "Receiving Party Name",   icon: User,        type: "text",     placeholder: "Jane Doe or XYZ Ltd" },
    { key: "purpose",        label: "Purpose of Disclosure",  icon: FileText,    type: "text",     placeholder: "Evaluating a potential business partnership" },
    { key: "duration",       label: "Confidentiality Period", icon: Calendar,    type: "text",     placeholder: "2 years" },
    { key: "governing_law",  label: "Governing Law (State)",  icon: Shield,      type: "text",     placeholder: "California" },
    { key: "effective_date", label: "Effective Date",         icon: Calendar,    type: "date",     placeholder: "" },
  ],
  freelance: [
    { key: "client_name",    label: "Client Name",            icon: Building,    type: "text",     placeholder: "Acme Corp" },
    { key: "freelancer_name",label: "Freelancer Name",        icon: User,        type: "text",     placeholder: "John Doe" },
    { key: "project_scope",  label: "Project Scope",          icon: FileText,    type: "textarea", placeholder: "Design and develop a React web application..." },
    { key: "payment_amount", label: "Total Payment ($)",      icon: DollarSign,  type: "text",     placeholder: "5000" },
    { key: "payment_terms",  label: "Payment Terms",          icon: DollarSign,  type: "text",     placeholder: "50% upfront, 50% on delivery" },
    { key: "deadline",       label: "Project Deadline",       icon: Calendar,    type: "date",     placeholder: "" },
    { key: "governing_law",  label: "Governing Law (State)",  icon: Shield,      type: "text",     placeholder: "New York" },
  ],
  employment: [
    { key: "employer_name",  label: "Employer Name",          icon: Building,    type: "text",     placeholder: "Acme Corp" },
    { key: "employee_name",  label: "Employee Name",          icon: User,        type: "text",     placeholder: "Jane Smith" },
    { key: "job_title",      label: "Job Title",              icon: User,        type: "text",     placeholder: "Senior Software Engineer" },
    { key: "salary",         label: "Annual Salary ($)",      icon: DollarSign,  type: "text",     placeholder: "85000" },
    { key: "start_date",     label: "Start Date",             icon: Calendar,    type: "date",     placeholder: "" },
    { key: "work_location",  label: "Work Location",          icon: Building,    type: "text",     placeholder: "San Francisco, CA / Remote" },
    { key: "notice_period",  label: "Notice Period",          icon: Calendar,    type: "text",     placeholder: "30 days" },
    { key: "governing_law",  label: "Governing Law (State)",  icon: Shield,      type: "text",     placeholder: "California" },
  ],
  saas: [
    { key: "company_name",   label: "Company Name",           icon: Building,    type: "text",     placeholder: "Acme SaaS Inc." },
    { key: "product_name",   label: "Product Name",           icon: FileText,    type: "text",     placeholder: "MyApp" },
    { key: "website",        label: "Website URL",            icon: FileText,    type: "text",     placeholder: "https://myapp.com" },
    { key: "pricing_model",  label: "Pricing Model",          icon: DollarSign,  type: "text",     placeholder: "Monthly subscription at $29/month" },
    { key: "data_policy",    label: "Data Policy Summary",    icon: Shield,      type: "textarea", placeholder: "We collect usage data and email for account management..." },
    { key: "governing_law",  label: "Governing Law (State)",  icon: Shield,      type: "text",     placeholder: "Delaware" },
  ],
  partnership: [
    { key: "partner1_name",  label: "Partner 1 Name",         icon: User,        type: "text",     placeholder: "Alice Johnson" },
    { key: "partner2_name",  label: "Partner 2 Name",         icon: User,        type: "text",     placeholder: "Bob Williams" },
    { key: "business_name",  label: "Business Name",          icon: Building,    type: "text",     placeholder: "Johnson & Williams LLC" },
    { key: "business_type",  label: "Type of Business",       icon: FileText,    type: "text",     placeholder: "Software consultancy" },
    { key: "profit_split",   label: "Profit Split",           icon: DollarSign,  type: "text",     placeholder: "50/50 equal split" },
    { key: "governing_law",  label: "Governing Law (State)",  icon: Shield,      type: "text",     placeholder: "Texas" },
  ],
  rental: [
    { key: "landlord_name",   label: "Landlord Name",         icon: User,        type: "text",     placeholder: "John Landlord" },
    { key: "tenant_name",     label: "Tenant Name",           icon: User,        type: "text",     placeholder: "Jane Tenant" },
    { key: "property_address",label: "Property Address",      icon: Building,    type: "text",     placeholder: "123 Main St, Austin, TX 78701" },
    { key: "monthly_rent",    label: "Monthly Rent ($)",      icon: DollarSign,  type: "text",     placeholder: "2000" },
    { key: "lease_start",     label: "Lease Start Date",      icon: Calendar,    type: "date",     placeholder: "" },
    { key: "lease_duration",  label: "Lease Duration",        icon: Calendar,    type: "text",     placeholder: "12 months" },
    { key: "security_deposit",label: "Security Deposit ($)",  icon: DollarSign,  type: "text",     placeholder: "4000" },
    { key: "governing_law",   label: "Governing Law (State)", icon: Shield,      type: "text",     placeholder: "Texas" },
  ],
};

// ── Step Indicator ────────────────────────────────────────────
function StepIndicator({ current, total }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {Array(total).fill(0).map((_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: i < current ? "linear-gradient(135deg, #C9A84C, #A8891E)"
              : i === current ? "rgba(201,168,76,0.15)" : "#12121A",
            border: i === current ? "1px solid rgba(201,168,76,0.5)"
              : i < current ? "none" : "1px solid #1E1E2E",
            fontSize: 12, fontWeight: 700,
            color: i < current ? "#0A0A0F" : i === current ? "#C9A84C" : "#4B5563",
            transition: "all 0.3s",
          }}>
            {i < current ? <Check size={12} strokeWidth={3} /> : i + 1}
          </div>
          {i < total - 1 && (
            <div style={{ width: 32, height: 2, borderRadius: 1, background: i < current ? "#C9A84C" : "#1E1E2E", transition: "background 0.3s" }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Input Field ───────────────────────────────────────────────
function FormField({ field, value, onChange }) {
  const Icon = field.icon;
  const base = {
    width: "100%", background: "#0D0D14",
    border: "1px solid #1E1E2E", borderRadius: 10,
    color: "#F5F5F0", fontSize: 14, outline: "none",
    fontFamily: "'DM Sans', sans-serif", transition: "border-color 0.2s",
    boxSizing: "border-box",
  };
  return (
    <div>
      <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: "#9CA3AF", marginBottom: 8, letterSpacing: "0.3px" }}>
        <Icon size={13} color="#6B7280" /> {field.label.toUpperCase()}
      </label>
      {field.type === "textarea" ? (
        <textarea value={value} onChange={e => onChange(field.key, e.target.value)}
          placeholder={field.placeholder} rows={3}
          style={{ ...base, padding: "12px 14px", resize: "vertical", lineHeight: 1.6 }}
          onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.5)"}
          onBlur={e => e.target.style.borderColor = "#1E1E2E"}
        />
      ) : (
        <input type={field.type} value={value} onChange={e => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          style={{ ...base, padding: "12px 14px" }}
          onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.5)"}
          onBlur={e => e.target.style.borderColor = "#1E1E2E"}
        />
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function ContractGenerator() {
  const [step,         setStep]         = useState(0);
  const [contractType, setContractType] = useState(null);
  const [fields,       setFields]       = useState({});
  const [contract,     setContract]     = useState("");
  const [loading,      setLoading]      = useState(false);
  const [copied,       setCopied]       = useState(false);

  const handleFieldChange = (key, val) => setFields(prev => ({ ...prev, [key]: val }));

  const handleGenerate = async () => {
    const cfg = FIELD_CONFIGS[contractType.id] || [];
    const missing = cfg.filter(f => f.type !== "textarea" && !fields[f.key]?.trim());
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.map(f => f.label).join(", ")}`);
      return;
    }
    setLoading(true);
    try {
      const raw    = await callGroq(
        SYSTEM_PROMPT(contractType.label, fields),
        `Generate a complete ${contractType.label} with the provided details.`
      );
      const cleaned = cleanContractText(raw);
      setContract(cleaned);
      setStep(2);
      toast.success("Contract generated!");
    } catch (err) {
      console.error(err);
      toast.error(`Generation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(contract);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard!");
  };

  const handleDownload = () => {
    const blob = new Blob([contract], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `${contractType.id}-agreement.txt`;
    a.click();
    toast.success("Contract downloaded!");
  };

  const handleReset = () => {
    setStep(0); setContractType(null);
    setFields({}); setContract("");
  };

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
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "#F5F5F0" }}>Contract Generator</h1>
            <p style={{ fontSize: 12, color: "#6B7280" }}>Generate professional contracts in seconds with AI</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <StepIndicator current={step} total={3} />
            {step > 0 && (
              <button onClick={handleReset}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px solid #1E1E2E", color: "#9CA3AF", fontSize: 13, cursor: "pointer", padding: "8px 14px", borderRadius: 8 }}>
                <RefreshCw size={13} /> Start Over
              </button>
            )}
          </div>
        </div>

        <div style={{ padding: "36px 32px", maxWidth: 900, margin: "0 auto" }}>
          <AnimatePresence mode="wait">

            {/* ── STEP 0: Choose Contract Type ── */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }}>
                <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}>
                  <motion.div variants={fadeUp} custom={0} style={{ marginBottom: 36 }}>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: "#F5F5F0", marginBottom: 8 }}>
                      What type of contract do you need?
                    </h2>
                    <p style={{ color: "#6B7280", fontSize: 15 }}>Select a template to get started. All contracts are generated fresh using AI.</p>
                  </motion.div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
                    {CONTRACT_TYPES.map((type, i) => (
                      <motion.button key={type.id} variants={fadeUp} custom={i + 1}
                        onClick={() => { setContractType(type); setFields({}); setStep(1); }}
                        style={{
                          background: "#12121A", border: "1px solid #1E1E2E",
                          borderRadius: 14, padding: "22px 20px",
                          cursor: "pointer", textAlign: "left",
                          display: "flex", flexDirection: "column", gap: 10,
                          transition: "all 0.22s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.35)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.background = "rgba(201,168,76,0.04)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#1E1E2E"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.background = "#12121A"; }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <span style={{ fontSize: 28 }}>{type.icon}</span>
                          <ChevronRight size={16} color="#4B5563" />
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: "#F5F5F0", marginBottom: 5 }}>{type.label}</div>
                          <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>{type.desc}</div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* ── STEP 1: Fill Form ── */}
            {step === 1 && contractType && (
              <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
                  <button onClick={() => setStep(0)}
                    style={{ background: "none", border: "1px solid #1E1E2E", color: "#9CA3AF", cursor: "pointer", width: 36, height: 36, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#C9A84C"; e.currentTarget.style.color = "#C9A84C"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#1E1E2E"; e.currentTarget.style.color = "#9CA3AF"; }}
                  ><ChevronLeft size={16} /></button>
                  <div>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#F5F5F0" }}>
                      {contractType.icon} {contractType.label}
                    </h2>
                    <p style={{ fontSize: 13, color: "#6B7280" }}>Fill in the details below to generate your contract</p>
                  </div>
                </div>

                <div style={{ background: "#12121A", border: "1px solid #1E1E2E", borderRadius: 16, padding: "28px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
                    {(FIELD_CONFIGS[contractType.id] || []).map((field) => (
                      <div key={field.key} style={field.type === "textarea" ? { gridColumn: "1 / -1" } : {}}>
                        <FormField field={field} value={fields[field.key] || ""} onChange={handleFieldChange} />
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 24, padding: "14px 16px", background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 10, display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <AlertCircle size={15} color="#FBBF24" style={{ marginTop: 1, flexShrink: 0 }} />
                    <p style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.6 }}>
                      AI-generated contracts are a starting point. Always have a qualified attorney review before signing any legal agreement.
                    </p>
                  </div>

                  <button onClick={handleGenerate} disabled={loading}
                    style={{
                      width: "100%", marginTop: 24, padding: "16px",
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
                        Generating Contract...
                      </>
                    ) : (
                      <><Sparkles size={18} /> Generate {contractType.label}</>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: View Contract ── */}
            {step === 2 && contract && (
              <motion.div key="step2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <button onClick={() => setStep(1)}
                      style={{ background: "none", border: "1px solid #1E1E2E", color: "#9CA3AF", cursor: "pointer", width: 36, height: 36, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ChevronLeft size={16} />
                    </button>
                    <div>
                      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#F5F5F0" }}>
                        Your Contract is Ready
                      </h2>
                      <p style={{ fontSize: 13, color: "#6B7280" }}>{contractType?.label} · Generated with AI</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={handleCopy}
                      style={{
                        display: "flex", alignItems: "center", gap: 7,
                        background: "none", border: "1px solid rgba(201,168,76,0.3)",
                        color: "#C9A84C", fontSize: 14, fontWeight: 600,
                        cursor: "pointer", padding: "10px 18px", borderRadius: 9, transition: "all 0.2s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(201,168,76,0.06)"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      {copied ? <Check size={15} color="#4ADE80" /> : <Copy size={15} />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                    <button onClick={handleDownload}
                      style={{
                        display: "flex", alignItems: "center", gap: 7,
                        background: "linear-gradient(135deg, #C9A84C, #A8891E)",
                        border: "none", color: "#0A0A0F",
                        fontSize: 14, fontWeight: 700, cursor: "pointer",
                        padding: "10px 18px", borderRadius: 9, transition: "opacity 0.2s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                    >
                      <Download size={15} /> Download .txt
                    </button>
                  </div>
                </div>

                {/* Success Banner */}
                <div style={{
                  background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.2)",
                  borderRadius: 12, padding: "14px 18px", marginBottom: 20,
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(74,222,128,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Zap size={16} color="#4ADE80" fill="#4ADE80" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#4ADE80" }}>Contract generated successfully</div>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>Review carefully and consult an attorney before use. Fill in all <span style={{ color: "#C9A84C" }}>[PLACEHOLDER]</span> fields.</div>
                  </div>
                </div>

                {/* Contract Display */}
                <div style={{ background: "#12121A", border: "1px solid #1E1E2E", borderRadius: 16, overflow: "hidden" }}>
                  {/* Toolbar */}
                  <div style={{ padding: "12px 20px", borderBottom: "1px solid #1E1E2E", display: "flex", alignItems: "center", gap: 10 }}>
                    <FilePlus size={14} color="#C9A84C" />
                    <span style={{ fontSize: 13, color: "#9CA3AF" }}>{contractType?.label}</span>
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "#4B5563" }}>
                      ~{Math.ceil(contract.split(" ").length / 200)} min read · {contract.split(" ").length} words
                    </span>
                  </div>

                  {/* Rendered contract */}
                  <div style={{ padding: "28px 32px", maxHeight: 560, overflowY: "auto" }}>
                    <ContractRenderer text={contract} />
                  </div>
                </div>

                {/* Regenerate */}
                <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
                  <button onClick={handleGenerate} disabled={loading}
                    style={{
                      display: "flex", alignItems: "center", gap: 7,
                      background: "none", border: "1px solid #1E1E2E",
                      color: "#9CA3AF", fontSize: 13, cursor: loading ? "not-allowed" : "pointer",
                      padding: "10px 20px", borderRadius: 9, transition: "all 0.2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#C9A84C"; e.currentTarget.style.color = "#C9A84C"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#1E1E2E"; e.currentTarget.style.color = "#9CA3AF"; }}
                  >
                    {loading
                      ? <><div style={{ width: 14, height: 14, border: "2px solid #6B7280", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Regenerating...</>
                      : <><RefreshCw size={13} /> Regenerate Contract</>
                    }
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: #374151; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1E1E2E; border-radius: 4px; }
      `}</style>
    </div>
  );
}