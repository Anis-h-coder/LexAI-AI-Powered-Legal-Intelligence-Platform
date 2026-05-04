import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale, LayoutDashboard, FileText, MessageSquare,
  FilePlus, GitCompare, BookOpen, Settings,
  LogOut, ChevronLeft, ChevronRight, User
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: FileText,        label: "Contract Analyzer", path: "/analyzer" },
  { icon: MessageSquare,   label: "Document Q&A",      path: "/qa" },
  { icon: FilePlus,        label: "Contract Generator",path: "/generator" },
  { icon: GitCompare,      label: "Clause Comparator", path: "/comparator" },
  { icon: BookOpen,        label: "Jargon Translator",  path: "/translator" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const initials = user?.email?.slice(0, 2).toUpperCase() || "U";

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={{
        height: "100vh", background: "#0D0D14",
        borderRight: "1px solid #1E1E2E",
        display: "flex", flexDirection: "column",
        overflow: "hidden", flexShrink: 0, position: "relative",
      }}
    >
      {/* ── Logo ── */}
      <div style={{
        height: 64, display: "flex", alignItems: "center",
        padding: collapsed ? "0 18px" : "0 20px",
        borderBottom: "1px solid #1E1E2E", gap: 10, flexShrink: 0,
        justifyContent: collapsed ? "center" : "flex-start",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: "linear-gradient(135deg, #C9A84C, #8B6914)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Scale size={16} color="#0A0A0F" strokeWidth={2.5} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}
              style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#F5F5F0", whiteSpace: "nowrap" }}
            >
              Lex<span style={{ color: "#C9A84C" }}>AI</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ── Nav Items ── */}
      <nav style={{ flex: 1, padding: "16px 10px", display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" }}>
        {/* Section Label */}
        <AnimatePresence>
          {!collapsed && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ fontSize: 11, fontWeight: 600, color: "#374151", letterSpacing: "1.5px", textTransform: "uppercase", padding: "4px 10px 8px" }}
            >Tools</motion.p>
          )}
        </AnimatePresence>

        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : ""}
              style={{
                display: "flex", alignItems: "center",
                gap: collapsed ? 0 : 12,
                padding: collapsed ? "10px" : "10px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                borderRadius: 10, border: "none", cursor: "pointer",
                background: active ? "rgba(201,168,76,0.1)" : "transparent",
                color: active ? "#C9A84C" : "#6B7280",
                transition: "all 0.2s", width: "100%",
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#F5F5F0"; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; } }}
            >
              <item.icon size={18} strokeWidth={active ? 2.5 : 1.8} style={{ flexShrink: 0 }} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.15 }}
                    style={{ fontSize: 14, fontWeight: active ? 600 : 400, whiteSpace: "nowrap" }}
                  >{item.label}</motion.span>
                )}
              </AnimatePresence>
              {/* Active indicator */}
              {active && (
                <motion.div layoutId="activeBar"
                  style={{
                    position: "absolute", right: 0, width: 3, height: 28,
                    background: "#C9A84C", borderRadius: "2px 0 0 2px",
                  }}
                />
              )}
            </button>
          );
        })}

        {/* Divider */}
        <div style={{ height: 1, background: "#1E1E2E", margin: "12px 4px" }} />

        {/* Settings */}
        <button
          onClick={() => navigate("/settings")}
          title={collapsed ? "Settings" : ""}
          style={{
            display: "flex", alignItems: "center",
            gap: collapsed ? 0 : 12,
            padding: collapsed ? "10px" : "10px 12px",
            justifyContent: collapsed ? "center" : "flex-start",
            borderRadius: 10, border: "none", cursor: "pointer",
            background: "transparent", color: "#6B7280",
            transition: "all 0.2s", width: "100%",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#F5F5F0"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; }}
        >
          <Settings size={18} strokeWidth={1.8} style={{ flexShrink: 0 }} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ fontSize: 14, whiteSpace: "nowrap" }}>Settings</motion.span>
            )}
          </AnimatePresence>
        </button>
      </nav>

      {/* ── User Profile ── */}
      <div style={{
        borderTop: "1px solid #1E1E2E", padding: collapsed ? "14px 10px" : "14px 16px",
        display: "flex", alignItems: "center",
        gap: collapsed ? 0 : 10, justifyContent: collapsed ? "center" : "flex-start",
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #C9A84C, #8B6914)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700, color: "#0A0A0F",
        }}>{initials}</div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#F5F5F0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.email?.split("@")[0]}
              </div>
              <div style={{ fontSize: 11, color: "#4B5563", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.email}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {!collapsed && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleSignOut} title="Sign out"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#4B5563", padding: 4, borderRadius: 6, flexShrink: 0, transition: "color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#EF4444"}
              onMouseLeave={e => e.currentTarget.style.color = "#4B5563"}
            >
              <LogOut size={15} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Collapse Toggle ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: "absolute", top: 20, right: -12, width: 24, height: 24,
          borderRadius: "50%", background: "#1E1E2E", border: "1px solid #2D2D3E",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "#6B7280", zIndex: 10,
          transition: "all 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "#C9A84C"; e.currentTarget.style.color = "#0A0A0F"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "#1E1E2E"; e.currentTarget.style.color = "#6B7280"; }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
}