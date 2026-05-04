import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Scale, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const { error: authError } = await signIn(form.email, form.password);
      if (authError) {
        setError(authError.message || "Invalid email or password.");
      } else {
        toast.success("Welcome back!");
        navigate("/dashboard");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0A0A0F",
      display: "flex", fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* ── Left Panel ── */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "60px 40px", position: "relative",
      }}>
        {/* Background glow */}
        <div style={{
          position: "absolute", top: "30%", left: "40%",
          width: 400, height: 400,
          background: "radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <motion.div
          initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          style={{ width: "100%", maxWidth: 420, position: "relative" }}
        >
          {/* Logo */}
          <motion.div variants={fadeUp} custom={0}
            style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48, cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: "linear-gradient(135deg, #C9A84C, #8B6914)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Scale size={18} color="#0A0A0F" strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#F5F5F0" }}>
              Lex<span style={{ color: "#C9A84C" }}>AI</span>
            </span>
          </motion.div>

          {/* Heading */}
          <motion.div variants={fadeUp} custom={1} style={{ marginBottom: 36 }}>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 36, fontWeight: 700, color: "#F5F5F0",
              letterSpacing: "-0.5px", marginBottom: 8,
            }}>Welcome back</h1>
            <p style={{ color: "#6B7280", fontSize: 16 }}>
              Don't have an account?{" "}
              <Link to="/signup" style={{ color: "#C9A84C", textDecoration: "none", fontWeight: 500 }}>
                Sign up free
              </Link>
            </p>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              style={{
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 10, padding: "12px 16px", marginBottom: 20,
                display: "flex", alignItems: "center", gap: 10, color: "#FCA5A5", fontSize: 14,
              }}
            >
              <AlertCircle size={16} color="#FCA5A5" /> {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Email */}
            <motion.div variants={fadeUp} custom={2}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#9CA3AF", marginBottom: 8, letterSpacing: "0.3px" }}>
                EMAIL ADDRESS
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={16} color="#4B5563" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  name="email" type="email" value={form.email}
                  onChange={handleChange} placeholder="you@example.com"
                  style={{
                    width: "100%", padding: "14px 16px 14px 44px",
                    background: "#12121A", border: "1px solid #1E1E2E",
                    borderRadius: 10, color: "#F5F5F0", fontSize: 15,
                    outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.5)"}
                  onBlur={e => e.target.style.borderColor = "#1E1E2E"}
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div variants={fadeUp} custom={3}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.3px" }}>PASSWORD</label>
                <a href="#" style={{ fontSize: 13, color: "#C9A84C", textDecoration: "none" }}>Forgot password?</a>
              </div>
              <div style={{ position: "relative" }}>
                <Lock size={16} color="#4B5563" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  name="password" type={showPass ? "text" : "password"}
                  value={form.password} onChange={handleChange}
                  placeholder="••••••••"
                  style={{
                    width: "100%", padding: "14px 44px 14px 44px",
                    background: "#12121A", border: "1px solid #1E1E2E",
                    borderRadius: 10, color: "#F5F5F0", fontSize: 15,
                    outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.5)"}
                  onBlur={e => e.target.style.borderColor = "#1E1E2E"}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#4B5563", padding: 0 }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </motion.div>

            {/* Submit */}
            <motion.div variants={fadeUp} custom={4} style={{ marginTop: 8 }}>
              <button type="submit" disabled={loading}
                style={{
                  width: "100%", padding: "15px",
                  background: loading ? "rgba(201,168,76,0.4)" : "linear-gradient(135deg, #C9A84C, #A8891E)",
                  border: "none", borderRadius: 10, color: "#0A0A0F",
                  fontSize: 16, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.88"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
              >
                {loading ? (
                  <div style={{ width: 20, height: 20, border: "2px solid #0A0A0F", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                ) : (
                  <> Sign In <ArrowRight size={18} /> </>
                )}
              </button>
            </motion.div>
          </form>

          {/* Divider */}
          <motion.div variants={fadeUp} custom={5}
            style={{ display: "flex", alignItems: "center", gap: 16, margin: "28px 0" }}
          >
            <div style={{ flex: 1, height: 1, background: "#1E1E2E" }} />
            <span style={{ color: "#4B5563", fontSize: 13 }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: "#1E1E2E" }} />
          </motion.div>

          {/* Google OAuth placeholder */}
          <motion.div variants={fadeUp} custom={6}>
            <button
              style={{
                width: "100%", padding: "14px",
                background: "#12121A", border: "1px solid #1E1E2E",
                borderRadius: 10, color: "#F5F5F0", fontSize: 15, fontWeight: 500,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                transition: "border-color 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#1E1E2E"}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                <path fill="#FBBC05" d="M4.5 10.48A4.8 4.8 0 0 1 4.5 7.52V5.45H1.83a8 8 0 0 0 0 7.1z"/>
                <path fill="#EA4335" d="M8.98 3.58c1.32 0 2.5.45 3.44 1.35l2.54-2.54A8 8 0 0 0 1.83 5.45L4.5 7.52A4.8 4.8 0 0 1 8.98 3.58z"/>
              </svg>
              Continue with Google
            </button>
          </motion.div>
        </motion.div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          input::placeholder { color: #374151; }
        `}</style>
      </div>

      {/* ── Right Panel ── */}
      <div style={{
        width: 480, background: "linear-gradient(135deg, rgba(201,168,76,0.06), rgba(201,168,76,0.02))",
        borderLeft: "1px solid #1E1E2E",
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "60px 48px",
      }} className="right-panel">
        <div style={{ marginBottom: 48 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28,
          }}>
            <Scale size={26} color="#C9A84C" />
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: "#F5F5F0", marginBottom: 14, letterSpacing: "-0.3px" }}>
            Legal clarity, <br />powered by AI
          </h2>
          <p style={{ color: "#6B7280", fontSize: 16, lineHeight: 1.7 }}>
            Analyze contracts, understand legal jargon, and generate agreements — all in seconds with LexAI.
          </p>
        </div>

        {/* Feature list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {[
            { icon: "📄", title: "Instant Contract Analysis", desc: "Upload any PDF and get a full risk breakdown." },
            { icon: "💬", title: "Ask Your Documents", desc: "Query contracts in plain English with RAG-powered Q&A." },
            { icon: "⚡", title: "Generate in Seconds", desc: "Create professional contracts from a simple form." },
          ].map((item) => (
            <div key={item.title} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}>{item.icon}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: "#F5F5F0", marginBottom: 3 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quote */}
        <div style={{
          marginTop: 48, padding: "24px", borderRadius: 12,
          background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.1)",
        }}>
          <p style={{ color: "#9CA3AF", fontSize: 14, lineHeight: 1.7, fontStyle: "italic", marginBottom: 16 }}>
            "LexAI caught a non-compete clause in my freelance contract that would have locked me out of my industry for 2 years."
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #C9A84C, #8B6914)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#0A0A0F" }}>JK</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#F5F5F0" }}>James K.</div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>Freelance Developer</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .right-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}