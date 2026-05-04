import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Scale, Mail, Lock, Eye, EyeOff, User, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One number", test: (p) => /[0-9]/.test(p) },
];

export default function Signup() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const validate = () => {
    if (!form.name.trim()) return "Please enter your name.";
    if (!form.email) return "Please enter your email.";
    if (!form.password) return "Please enter a password.";
    if (form.password.length < 8) return "Password must be at least 8 characters.";
    if (form.password !== form.confirm) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      const { error: authError } = await signUp(form.email, form.password);
      if (authError) {
        setError(authError.message || "Could not create account. Please try again.");
      } else {
        setSuccess(true);
        toast.success("Account created! Check your email to confirm.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success State ──
  if (success) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0A0A0F",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif", padding: "40px 20px",
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            textAlign: "center", maxWidth: 460,
            background: "#12121A", border: "1px solid rgba(201,168,76,0.2)",
            borderRadius: 20, padding: "60px 48px",
          }}
        >
          <div style={{
            width: 72, height: 72, borderRadius: "50%", margin: "0 auto 28px",
            background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <CheckCircle size={32} color="#C9A84C" />
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700, color: "#F5F5F0", marginBottom: 12 }}>
            Check your email
          </h2>
          <p style={{ color: "#6B7280", fontSize: 16, lineHeight: 1.7, marginBottom: 36 }}>
            We sent a confirmation link to <strong style={{ color: "#C9A84C" }}>{form.email}</strong>. Click it to activate your LexAI account.
          </p>
          <button onClick={() => navigate("/login")}
            style={{
              background: "linear-gradient(135deg, #C9A84C, #A8891E)",
              border: "none", color: "#0A0A0F", fontSize: 16, fontWeight: 700,
              cursor: "pointer", padding: "14px 36px", borderRadius: 10,
            }}
          >Go to Login</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0A0A0F",
      display: "flex", fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* ── Left decorative panel ── */}
      <div style={{
        width: 460,
        background: "linear-gradient(160deg, rgba(201,168,76,0.07) 0%, rgba(10,10,15,1) 60%)",
        borderRight: "1px solid #1E1E2E",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "60px 48px",
      }} className="left-panel">
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => navigate("/")}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #C9A84C, #8B6914)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Scale size={18} color="#0A0A0F" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#F5F5F0" }}>
            Lex<span style={{ color: "#C9A84C" }}>AI</span>
          </span>
        </div>

        {/* Center content */}
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, fontWeight: 700, color: "#F5F5F0", lineHeight: 1.25, marginBottom: 20, letterSpacing: "-0.5px" }}>
            Your AI Legal<br />
            <span style={{ background: "linear-gradient(135deg, #C9A84C, #E8C97A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Intelligence Hub
            </span>
          </h2>
          <p style={{ color: "#6B7280", fontSize: 16, lineHeight: 1.7, marginBottom: 40 }}>
            Join thousands of professionals who use LexAI to understand contracts, reduce legal risk, and move faster.
          </p>

          {/* Stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              { val: "Free forever", label: "Starter plan — no credit card needed" },
              { val: "2 min setup", label: "Start analyzing contracts immediately" },
              { val: "SOC 2 ready", label: "Enterprise-grade document security" },
            ].map((s) => (
              <div key={s.val} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <CheckCircle size={18} color="#C9A84C" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#F5F5F0" }}>{s.val}</div>
                  <div style={{ fontSize: 13, color: "#6B7280" }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <p style={{ color: "#374151", fontSize: 12, lineHeight: 1.6 }}>
          © 2025 LexAI · Not a law firm · AI output is not legal advice
        </p>
      </div>

      {/* ── Right: Form ── */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "60px 40px", position: "relative",
      }}>
        <div style={{
          position: "absolute", bottom: "20%", right: "20%",
          width: 320, height: 320,
          background: "radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <motion.div
          initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          style={{ width: "100%", maxWidth: 420, position: "relative" }}
        >
          {/* Heading */}
          <motion.div variants={fadeUp} custom={0} style={{ marginBottom: 36 }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, fontWeight: 700, color: "#F5F5F0", letterSpacing: "-0.5px", marginBottom: 8 }}>
              Create your account
            </h1>
            <p style={{ color: "#6B7280", fontSize: 16 }}>
              Already have one?{" "}
              <Link to="/login" style={{ color: "#C9A84C", textDecoration: "none", fontWeight: 500 }}>Sign in</Link>
            </p>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              style={{
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 10, padding: "12px 16px", marginBottom: 20,
                display: "flex", alignItems: "center", gap: 10, color: "#FCA5A5", fontSize: 14,
              }}
            >
              <AlertCircle size={16} color="#FCA5A5" /> {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Full Name */}
            <motion.div variants={fadeUp} custom={1}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#9CA3AF", marginBottom: 8, letterSpacing: "0.3px" }}>FULL NAME</label>
              <div style={{ position: "relative" }}>
                <User size={16} color="#4B5563" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
                <input name="name" type="text" value={form.name} onChange={handleChange}
                  placeholder="Jane Smith"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.5)"}
                  onBlur={e => e.target.style.borderColor = "#1E1E2E"}
                />
              </div>
            </motion.div>

            {/* Email */}
            <motion.div variants={fadeUp} custom={2}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#9CA3AF", marginBottom: 8, letterSpacing: "0.3px" }}>EMAIL ADDRESS</label>
              <div style={{ position: "relative" }}>
                <Mail size={16} color="#4B5563" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="you@example.com"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.5)"}
                  onBlur={e => e.target.style.borderColor = "#1E1E2E"}
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div variants={fadeUp} custom={3}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#9CA3AF", marginBottom: 8, letterSpacing: "0.3px" }}>PASSWORD</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} color="#4B5563" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
                <input name="password" type={showPass ? "text" : "password"} value={form.password} onChange={handleChange}
                  placeholder="Create a strong password"
                  style={{ ...inputStyle, paddingRight: 44 }}
                  onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.5)"}
                  onBlur={e => e.target.style.borderColor = "#1E1E2E"}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#4B5563", padding: 0 }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password strength indicators */}
              {form.password && (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  {PASSWORD_RULES.map((rule) => {
                    const passed = rule.test(form.password);
                    return (
                      <div key={rule.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: "50%",
                          background: passed ? "rgba(74,222,128,0.15)" : "rgba(75,85,99,0.3)",
                          border: `1px solid ${passed ? "rgba(74,222,128,0.4)" : "#374151"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0, transition: "all 0.3s",
                        }}>
                          {passed && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80" }} />}
                        </div>
                        <span style={{ fontSize: 12, color: passed ? "#4ADE80" : "#6B7280", transition: "color 0.3s" }}>{rule.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Confirm Password */}
            <motion.div variants={fadeUp} custom={4}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#9CA3AF", marginBottom: 8, letterSpacing: "0.3px" }}>CONFIRM PASSWORD</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} color="#4B5563" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
                <input name="confirm" type={showConfirm ? "text" : "password"} value={form.confirm} onChange={handleChange}
                  placeholder="Repeat your password"
                  style={{
                    ...inputStyle, paddingRight: 44,
                    borderColor: form.confirm && form.confirm !== form.password ? "rgba(239,68,68,0.4)" : "#1E1E2E",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.5)"}
                  onBlur={e => e.target.style.borderColor = form.confirm && form.confirm !== form.password ? "rgba(239,68,68,0.4)" : "#1E1E2E"}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#4B5563", padding: 0 }}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.confirm && form.password !== form.confirm && (
                <p style={{ fontSize: 12, color: "#FCA5A5", marginTop: 6 }}>Passwords don't match</p>
              )}
            </motion.div>

            {/* Terms */}
            <motion.div variants={fadeUp} custom={5}>
              <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
                By signing up, you agree to our{" "}
                <a href="#" style={{ color: "#C9A84C", textDecoration: "none" }}>Terms of Service</a>
                {" "}and{" "}
                <a href="#" style={{ color: "#C9A84C", textDecoration: "none" }}>Privacy Policy</a>.
              </p>
            </motion.div>

            {/* Submit */}
            <motion.div variants={fadeUp} custom={6} style={{ marginTop: 4 }}>
              <button type="submit" disabled={loading}
                style={{
                  width: "100%", padding: "15px",
                  background: loading ? "rgba(201,168,76,0.4)" : "linear-gradient(135deg, #C9A84C, #A8891E)",
                  border: "none", borderRadius: 10, color: "#0A0A0F",
                  fontSize: 16, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  transition: "opacity 0.2s",
                  boxShadow: "0 4px 20px rgba(201,168,76,0.2)",
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.88"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
              >
                {loading ? (
                  <div style={{ width: 20, height: 20, border: "2px solid #0A0A0F", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                ) : (
                  <> Create Account <ArrowRight size={18} /> </>
                )}
              </button>
            </motion.div>
          </form>
        </motion.div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          input::placeholder { color: #374151; }
          @media (max-width: 900px) {
            .left-panel { display: none !important; }
          }
        `}</style>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "14px 16px 14px 44px",
  background: "#12121A",
  border: "1px solid #1E1E2E",
  borderRadius: 10,
  color: "#F5F5F0",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
};