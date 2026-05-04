import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText, Shield, Zap, Search, GitCompare,
  BookOpen, ChevronRight, Check, Star, Menu, X, Scale
} from "lucide-react";

// ── Animations ──────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

// ── Data ─────────────────────────────────────────────────────
const NAV_LINKS = ["Features", "How It Works", "Pricing", "FAQ"];

const FEATURES = [
  {
    icon: FileText,
    title: "Contract Analyzer",
    desc: "Upload any contract and get instant AI-powered analysis. Key clauses, risks, obligations — all extracted in seconds.",
    tag: "Most Used",
  },
  {
    icon: Search,
    title: "Document Q&A",
    desc: "Ask questions about your legal documents in plain English. Our RAG system answers using only your document's content.",
    tag: null,
  },
  {
    icon: Zap,
    title: "Contract Generator",
    desc: "Generate professional contracts from scratch. NDAs, freelance agreements, rental contracts — ready in minutes.",
    tag: "New",
  },
  {
    icon: GitCompare,
    title: "Clause Comparator",
    desc: "Compare two contract versions side by side. AI highlights differences and scores risk for each version.",
    tag: null,
  },
  {
    icon: BookOpen,
    title: "Jargon Translator",
    desc: "Paste any legal text and get a plain-English breakdown. Understand what you're signing before you sign it.",
    tag: null,
  },
  {
    icon: Shield,
    title: "Risk Detection",
    desc: "AI flags unusual, unfair, or risky clauses automatically. Never miss a problematic term buried in the fine print.",
    tag: null,
  },
];

const STEPS = [
  { num: "01", title: "Upload or Paste", desc: "Drop your contract PDF or paste text directly into LexAI." },
  { num: "02", title: "AI Analysis", desc: "Groq-powered LLM reads, understands, and processes your document instantly." },
  { num: "03", title: "Get Insights", desc: "Receive structured summaries, risk scores, clause breakdowns & plain-English explanations." },
];

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    sub: "Forever free",
    features: ["5 contract analyses/month", "Document Q&A", "Jargon Translator", "Basic risk detection"],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$29",
    sub: "per month",
    features: ["Unlimited analyses", "Contract Generator", "Clause Comparator", "Advanced risk scoring", "PDF export", "Priority support"],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    sub: "contact us",
    features: ["Everything in Pro", "Team workspaces", "API access", "Custom integrations", "Dedicated support", "SLA guarantee"],
    cta: "Contact Sales",
    highlight: false,
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    role: "Startup Founder",
    text: "LexAI saved me $3,000 in legal fees on my first SaaS contracts. The risk detection caught clauses I would have completely missed.",
    stars: 5,
  },
  {
    name: "Marcus Williams",
    role: "Freelance Designer",
    text: "I used to be terrified of client contracts. Now I just drop them into LexAI and actually understand what I'm agreeing to.",
    stars: 5,
  },
  {
    name: "Priya Sharma",
    role: "Legal Consultant",
    text: "I use LexAI to speed up my initial document review by 70%. The AI analysis is impressively accurate for a first pass.",
    stars: 5,
  },
];

const FAQS = [
  {
    q: "Is my data secure?",
    a: "Yes. Documents are encrypted in transit and at rest. We never train on your data and you can delete your documents anytime.",
  },
  {
    q: "What file formats are supported?",
    a: "We support PDF, DOCX, and plain text. Most legal documents come in these formats.",
  },
  {
    q: "Is this a replacement for a lawyer?",
    a: "No. LexAI is a tool to help you understand legal documents faster. Always consult a qualified attorney for legal advice.",
  },
  {
    q: "How accurate is the AI analysis?",
    a: "LexAI uses Llama 3 70B via Groq for fast, high-quality analysis. It's highly accurate for clause extraction and summarization but should be verified by a professional.",
  },
];

// ── Sub-components ────────────────────────────────────────────
function Navbar({ navigate }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 2rem",
        background: scrolled ? "rgba(10,10,15,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(201,168,76,0.12)" : "none",
        transition: "all 0.4s ease",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 72,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: "linear-gradient(135deg, #C9A84C, #8B6914)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Scale size={18} color="#0A0A0F" strokeWidth={2.5} />
        </div>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#F5F5F0", letterSpacing: "-0.3px" }}>
          Lex<span style={{ color: "#C9A84C" }}>AI</span>
        </span>
      </div>

      {/* Desktop Links */}
      <div style={{ display: "flex", gap: 36, alignItems: "center" }} className="desktop-nav">
        {NAV_LINKS.map((l) => (
          <a key={l} href={`#${l.toLowerCase().replace(" ", "-")}`}
            style={{ color: "#9CA3AF", fontSize: 14, fontWeight: 500, textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={e => e.target.style.color = "#C9A84C"}
            onMouseLeave={e => e.target.style.color = "#9CA3AF"}
          >{l}</a>
        ))}
      </div>

      {/* CTA */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button onClick={() => navigate("/login")}
          style={{ background: "none", border: "none", color: "#9CA3AF", fontSize: 14, fontWeight: 500, cursor: "pointer", padding: "8px 16px" }}
          onMouseEnter={e => e.target.style.color = "#F5F5F0"}
          onMouseLeave={e => e.target.style.color = "#9CA3AF"}
        >Log in</button>
        <button onClick={() => navigate("/signup")}
          style={{
            background: "linear-gradient(135deg, #C9A84C, #A8891E)",
            border: "none", color: "#0A0A0F", fontSize: 14, fontWeight: 700,
            cursor: "pointer", padding: "10px 22px", borderRadius: 8,
            transition: "opacity 0.2s",
          }}
          onMouseEnter={e => e.target.style.opacity = 0.85}
          onMouseLeave={e => e.target.style.opacity = 1}
        >Get Started</button>
        <button onClick={() => setOpen(!open)} style={{ display: "none", background: "none", border: "none", color: "#F5F5F0", cursor: "pointer" }} className="menu-btn">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}

function GoldDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "0 auto 48px", maxWidth: 200 }}>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, #C9A84C)" }} />
      <Scale size={14} color="#C9A84C" />
      <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, #C9A84C)" }} />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div style={{ background: "#0A0A0F",
        color: "#F5F5F0",
        fontFamily: "'DM Sans', sans-serif",
        minHeight: "100vh",
        paddingTop: "80px", }}>
      <Navbar navigate={navigate} />

      {/* ── HERO ── */}
      <section style={{
        position: "relative",   // ✅ ADD THIS
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-start",
  padding: "40px 2rem 80px",
  textAlign: "center",
      }}>
        {/* Background glow */}
        <div style={{
          position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
          width: 600, height: 600,
          background: "radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }} />
        {/* Grid pattern */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.03,
          backgroundImage: "linear-gradient(#C9A84C 1px, transparent 1px), linear-gradient(90deg, #C9A84C 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          pointerEvents: "none",
          zIndex: 0,
        }} />

        <motion.div variants={stagger} initial="hidden" animate="show" style={{ position: "relative", maxWidth: 860 }}>
          {/* Badge */}
          <motion.div variants={fadeUp} custom={0}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)",
              borderRadius: 100, padding: "6px 18px", fontSize: 13, color: "#C9A84C",
              fontWeight: 500, marginBottom: 32, letterSpacing: "0.5px",
            }}>
              <Zap size={12} fill="#C9A84C" /> Powered by Groq + Llama 3 · Lightning Fast AI
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={fadeUp} custom={1} style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(42px, 7vw, 82px)",
            fontWeight: 700, lineHeight: 1.1,
            marginBottom: 28, letterSpacing: "-2px",
          }}>
            Legal Intelligence,{" "}
            <span style={{
              background: "linear-gradient(135deg, #C9A84C, #E8C97A)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Without the Complexity
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p variants={fadeUp} custom={2} style={{
            fontSize: "clamp(16px, 2vw, 20px)", color: "#9CA3AF",
            maxWidth: 600, margin: "0 auto 44px", lineHeight: 1.7, fontWeight: 400,
          }}>
            Analyze contracts, ask legal questions, generate agreements, and understand legal jargon — all powered by AI. Built for founders, freelancers & professionals.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeUp} custom={3} style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/signup")}
              style={{
                background: "linear-gradient(135deg, #C9A84C, #A8891E)",
                border: "none", color: "#0A0A0F",
                fontSize: 16, fontWeight: 700, cursor: "pointer",
                padding: "16px 36px", borderRadius: 10,
                display: "flex", alignItems: "center", gap: 10,
                boxShadow: "0 8px 32px rgba(201,168,76,0.25)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(201,168,76,0.35)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(201,168,76,0.25)"; }}
            >
              Start for Free <ChevronRight size={18} />
            </button>
            <button onClick={() => navigate("/login")}
              style={{
                background: "none",
                border: "1px solid rgba(201,168,76,0.3)",
                color: "#F5F5F0", fontSize: 16, fontWeight: 500,
                cursor: "pointer", padding: "16px 36px", borderRadius: 10,
                transition: "border-color 0.2s, background 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#C9A84C"; e.currentTarget.style.background = "rgba(201,168,76,0.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; e.currentTarget.style.background = "none"; }}
            >
              View Demo
            </button>
          </motion.div>

          {/* Social proof */}
          <motion.div variants={fadeUp} custom={4} style={{ marginTop: 56, display: "flex", alignItems: "center", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
            {[["2,400+", "Contracts Analyzed"], ["98%", "Accuracy Rate"], ["70%", "Time Saved"]].map(([val, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: "#C9A84C" }}>{val}</div>
                <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "100px 2rem", maxWidth: 1200, margin: "0 auto" }}>
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
          <motion.div variants={fadeUp} style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ color: "#C9A84C", fontSize: 13, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>Everything You Need</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 700, letterSpacing: "-1px", marginBottom: 16 }}>
              Six Powerful AI Tools
            </h2>
            <p style={{ color: "#6B7280", fontSize: 18, maxWidth: 480, margin: "0 auto" }}>One platform to handle every aspect of legal document intelligence.</p>
          </motion.div>

          <GoldDivider />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24 }}>
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} custom={i}
                style={{
                  background: "#12121A", border: "1px solid #1E1E2E",
                  borderRadius: 16, padding: "32px", position: "relative",
                  transition: "border-color 0.3s, transform 0.3s",
                  cursor: "default",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#1E1E2E"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {f.tag && (
                  <span style={{
                    position: "absolute", top: 20, right: 20,
                    background: f.tag === "New" ? "rgba(201,168,76,0.15)" : "rgba(99,102,241,0.15)",
                    color: f.tag === "New" ? "#C9A84C" : "#818CF8",
                    fontSize: 11, fontWeight: 700, letterSpacing: "1px",
                    padding: "4px 10px", borderRadius: 100, textTransform: "uppercase",
                  }}>{f.tag}</span>
                )}
                <div style={{
                  width: 48, height: 48, borderRadius: 12, marginBottom: 20,
                  background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <f.icon size={22} color="#C9A84C" />
                </div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ color: "#6B7280", fontSize: 15, lineHeight: 1.65 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: "100px 2rem", background: "rgba(201,168,76,0.02)", borderTop: "1px solid #1E1E2E", borderBottom: "1px solid #1E1E2E" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} style={{ textAlign: "center", marginBottom: 72 }}>
              <p style={{ color: "#C9A84C", fontSize: 13, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>Simple Process</p>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 700, letterSpacing: "-1px" }}>
                How LexAI Works
              </h2>
            </motion.div>
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {STEPS.map((s, i) => (
                <motion.div key={s.num} variants={fadeUp} custom={i}
                  style={{ display: "flex", gap: 32, alignItems: "flex-start" }}
                >
                  <div style={{
                    minWidth: 72, height: 72, borderRadius: 16,
                    background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#C9A84C",
                  }}>{s.num}</div>
                  <div style={{ paddingTop: 12 }}>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, marginBottom: 8 }}>{s.title}</h3>
                    <p style={{ color: "#6B7280", fontSize: 16, lineHeight: 1.65 }}>{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: "100px 2rem", maxWidth: 1200, margin: "0 auto" }}>
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp} style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ color: "#C9A84C", fontSize: 13, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>Loved By Users</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 700, letterSpacing: "-1px" }}>
              What People Are Saying
            </h2>
          </motion.div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} variants={fadeUp} custom={i}
                style={{ background: "#12121A", border: "1px solid #1E1E2E", borderRadius: 16, padding: 32 }}
              >
                <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
                  {Array(t.stars).fill(0).map((_, j) => <Star key={j} size={14} fill="#C9A84C" color="#C9A84C" />)}
                </div>
                <p style={{ color: "#D1D5DB", fontSize: 15, lineHeight: 1.7, marginBottom: 24, fontStyle: "italic" }}>"{t.text}"</p>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{t.name}</div>
                  <div style={{ color: "#6B7280", fontSize: 13 }}>{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: "100px 2rem", background: "rgba(201,168,76,0.02)", borderTop: "1px solid #1E1E2E", borderBottom: "1px solid #1E1E2E" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} style={{ textAlign: "center", marginBottom: 64 }}>
              <p style={{ color: "#C9A84C", fontSize: 13, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>Pricing</p>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 700, letterSpacing: "-1px", marginBottom: 16 }}>
                Simple, Transparent Pricing
              </h2>
              <p style={{ color: "#6B7280", fontSize: 18 }}>Start free. Upgrade when you need more.</p>
            </motion.div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
              {PLANS.map((p, i) => (
                <motion.div key={p.name} variants={fadeUp} custom={i}
                  style={{
                    background: p.highlight ? "linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.03))" : "#12121A",
                    border: p.highlight ? "1px solid rgba(201,168,76,0.4)" : "1px solid #1E1E2E",
                    borderRadius: 16, padding: "36px 32px",
                    position: "relative", transform: p.highlight ? "scale(1.03)" : "scale(1)",
                    boxShadow: p.highlight ? "0 0 60px rgba(201,168,76,0.08)" : "none",
                  }}
                >
                  {p.highlight && (
                    <div style={{
                      position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                      background: "linear-gradient(135deg, #C9A84C, #A8891E)",
                      color: "#0A0A0F", fontSize: 11, fontWeight: 800,
                      padding: "5px 20px", borderRadius: 100, letterSpacing: "1px", textTransform: "uppercase",
                    }}>Most Popular</div>
                  )}
                  <div style={{ marginBottom: 28 }}>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{p.name}</h3>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, fontWeight: 700, color: p.highlight ? "#C9A84C" : "#F5F5F0" }}>{p.price}</span>
                      <span style={{ color: "#6B7280", fontSize: 14 }}>{p.sub}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                    {p.features.map((f) => (
                      <div key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: "50%",
                          background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <Check size={11} color="#C9A84C" strokeWidth={3} />
                        </div>
                        <span style={{ fontSize: 14, color: "#D1D5DB" }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => navigate("/signup")}
                    style={{
                      width: "100%", padding: "14px", borderRadius: 10, fontSize: 15, fontWeight: 700,
                      cursor: "pointer", transition: "all 0.2s",
                      background: p.highlight ? "linear-gradient(135deg, #C9A84C, #A8891E)" : "none",
                      border: p.highlight ? "none" : "1px solid rgba(201,168,76,0.3)",
                      color: p.highlight ? "#0A0A0F" : "#C9A84C",
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                  >{p.cta}</button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: "100px 2rem", maxWidth: 760, margin: "0 auto" }}>
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp} style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ color: "#C9A84C", fontSize: 13, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>FAQ</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700, letterSpacing: "-1px" }}>
              Frequently Asked Questions
            </h2>
          </motion.div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FAQS.map((f, i) => (
              <motion.div key={f.q} variants={fadeUp} custom={i}
                style={{ background: "#12121A", border: "1px solid #1E1E2E", borderRadius: 12, overflow: "hidden" }}
              >
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: "100%", background: "none", border: "none", color: "#F5F5F0",
                    padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center",
                    cursor: "pointer", fontSize: 16, fontWeight: 500, textAlign: "left",
                  }}
                >
                  {f.q}
                  <ChevronRight size={18} color="#C9A84C" style={{ transform: openFaq === i ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.3s" }} />
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 24px 20px", color: "#6B7280", fontSize: 15, lineHeight: 1.7 }}>{f.a}</div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ padding: "80px 2rem", maxWidth: 900, margin: "0 auto 60px", textAlign: "center" }}>
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
          style={{
            background: "linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.03))",
            border: "1px solid rgba(201,168,76,0.2)", borderRadius: 24,
            padding: "72px 48px",
            boxShadow: "0 0 80px rgba(201,168,76,0.06)",
          }}
        >
          <motion.h2 variants={fadeUp} style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 700, letterSpacing: "-1px", marginBottom: 16 }}>
            Ready to Understand Your Contracts?
          </motion.h2>
          <motion.p variants={fadeUp} style={{ color: "#6B7280", fontSize: 18, marginBottom: 40, maxWidth: 480, margin: "0 auto 40px" }}>
            Join thousands of professionals using LexAI to navigate legal documents with confidence.
          </motion.p>
          <motion.button variants={fadeUp} onClick={() => navigate("/signup")}
            style={{
              background: "linear-gradient(135deg, #C9A84C, #A8891E)",
              border: "none", color: "#0A0A0F", fontSize: 17, fontWeight: 700,
              cursor: "pointer", padding: "18px 48px", borderRadius: 10,
              display: "inline-flex", alignItems: "center", gap: 10,
              boxShadow: "0 8px 32px rgba(201,168,76,0.3)",
              transition: "transform 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            Get Started for Free <ChevronRight size={18} />
          </motion.button>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid #1E1E2E", padding: "40px 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg, #C9A84C, #8B6914)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Scale size={14} color="#0A0A0F" />
          </div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700 }}>
            Lex<span style={{ color: "#C9A84C" }}>AI</span>
          </span>
        </div>
        <p style={{ color: "#374151", fontSize: 13 }}>© 2025 LexAI. Not a law firm. AI output is not legal advice.</p>
        <div style={{ display: "flex", gap: 24 }}>
          {["Privacy", "Terms", "Contact"].map(l => (
            <a key={l} href="#" style={{ color: "#6B7280", fontSize: 13, textDecoration: "none" }}
              onMouseEnter={e => e.target.style.color = "#C9A84C"}
              onMouseLeave={e => e.target.style.color = "#6B7280"}
            >{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}