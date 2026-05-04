import { useState } from "react";
import { useTheme } from "../context/ThemeContext";

// const NAV = [
//   { key: "dashboard", label: "Dashboard", icon: "▦" },
//   { key: "workflows", label: "Workflows", icon: "⬡" },
//   { key: "admin", label: "Admin", icon: "⚙" },
// ];
const NAV = (role) => [
  { key: "dashboard", label: "Dashboard", icon: "▦" },
  { key: "workflows", label: "Workflows", icon: "⬡" },
  ...(role === "ADMIN" ? [{ key: "admin", label: "Admin", icon: "⚙" }] : []),
];

export default function Layout({ page, onNav, user, role, onLogout, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", position: "relative" }}>
      <div className="grid-bg" />
      <aside style={{
        width: collapsed ? 56 : 220, flexShrink: 0,
        background: "var(--surface)", borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column", position: "relative", zIndex: 10,
        transition: "width 0.25s cubic-bezier(0.22,1,0.36,1)"
      }}>
        {/* Logo */}
        <div style={{ padding: collapsed ? "20px 10px" : "20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
          <div style={{
            width: 30, height: 30, flexShrink: 0,
            background: "linear-gradient(135deg, var(--accent2), var(--accent))",
            clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--mono)", fontSize: 11, color: "#fff", fontWeight: "bold"
          }}>W</div>
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: 2, whiteSpace: "nowrap" }}>WORKFLOWOS</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 8, color: "var(--muted)", letterSpacing: 1, whiteSpace: "nowrap" }}>ORCHESTRATION</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 8px" }}>
          {NAV(role).map(item => (
            <button key={item.key} onClick={() => onNav(item.key)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px",
                background: page === item.key ? "rgba(0,85,255,0.1)" : "transparent",
                border: page === item.key ? "1px solid rgba(0,85,255,0.25)" : "1px solid transparent",
                color: page === item.key ? "var(--accent)" : "var(--muted)",
                fontFamily: "var(--mono)", fontSize: 11, letterSpacing: 1,
                cursor: "pointer", marginBottom: 4, textAlign: "left",
                transition: "all 0.15s", overflow: "hidden",
              }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ borderTop: "1px solid var(--border)", padding: "12px 8px" }}>

          {/* Theme toggle */}
          <div style={{ padding: "8px 12px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
            {!collapsed && (
              <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", letterSpacing: 1, flex: 1 }}>
                {theme === "dark" ? "🌙 DARK" : "☀️ LIGHT"}
              </span>
            )}
            <button onClick={toggleTheme} title="Toggle theme"
              style={{
                width: 44, height: 24, borderRadius: 12,
                background: theme === "dark" ? "var(--accent2)" : "var(--border2)",
                border: "none", cursor: "pointer", position: "relative",
                transition: "background 0.3s ease", flexShrink: 0
              }}>
              <span style={{
                position: "absolute", width: 18, height: 18, borderRadius: "50%",
                background: "#fff", top: 3,
                left: theme === "dark" ? 23 : 3,
                transition: "left 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10
              }}>
                {theme === "dark" ? "🌙" : "☀️"}
              </span>
            </button>
          </div>

          {/* User info */}
          {!collapsed && (
            <div style={{ padding: "8px 12px", marginBottom: 8, fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", letterSpacing: 1 }}>
              <div style={{ color: "var(--accent3)", marginBottom: 2 }}>● ONLINE</div>
              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user}</div>
            </div>
          )}

          {/* Logout */}
          <button onClick={onLogout}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "8px 12px", background: "transparent",
              border: "1px solid transparent", color: "var(--danger)",
              fontFamily: "var(--mono)", fontSize: 10, letterSpacing: 1,
              cursor: "pointer", transition: "all 0.15s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(220,38,38,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <span style={{ flexShrink: 0 }}>⏻</span>
            {!collapsed && <span>LOGOUT</span>}
          </button>

          {/* Collapse */}
          <button onClick={() => setCollapsed(c => !c)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
              padding: "8px", background: "transparent",
              border: "1px solid var(--border)", color: "var(--muted)",
              fontFamily: "var(--mono)", fontSize: 11, cursor: "pointer", marginTop: 4,
              transition: "all 0.15s"
            }}>
            {collapsed ? "▶" : "◀"}
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: "auto", position: "relative", zIndex: 5 }}>
        {children}
      </main>
    </div>
  );
}
