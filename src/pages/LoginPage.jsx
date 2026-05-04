import { useState, useEffect } from "react";
import { login, register } from "../api";

export default function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  useEffect(() => {
    const tick = () => setTime(new Date().toTimeString().slice(0, 8));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const handleRegister = async () => {
    if (!form.username || !form.password) {
      setError("// all fields required");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const result = await register(form.username, form.password);
      if (result === "User registered successfully") {
        setSuccess("// account created — you can now login");
        setIsRegister(false);
        setForm({ username: "", password: "" });
      } else {
        setError("// registration failed");
      }
    } catch (e) {
      if (e.message.includes("409")) {
        setError("// username already taken");
      } else {
        setError("// server unreachable");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.username || !form.password) {
      setError("// all fields required");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // const result = await login(form.username, form.password);
      // if (result && typeof result === "string" && result.startsWith("ey")) {
      //   sessionStorage.setItem("wf_user", form.username);
      //   sessionStorage.setItem("wf_token", result); // ✅ save JWT
      //   onLogin(form.username);
      // }
      const result = await login(form.username, form.password);
      if (result && result.token) {
        sessionStorage.setItem("wf_user", form.username);
        sessionStorage.setItem("wf_token", result.token);
        sessionStorage.setItem("wf_role", result.role);
        onLogin(form.username, result.role);
      }
       
      else {
        setError("// invalid credentials — access denied");
      }
    } catch (e) {
      if (e.message.includes("401")) {
        setError("// invalid credentials — access denied");
      } else {
        setError("// server unreachable — check backend");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <div className="grid-bg" />
      <div style={{ position: "fixed", width: 500, height: 500, borderRadius: "50%", background: "var(--accent2)", top: -150, left: -150, filter: "blur(100px)", opacity: 0.15, pointerEvents: "none" }} />
      <div style={{ position: "fixed", width: 400, height: 400, borderRadius: "50%", background: "var(--accent)", bottom: -100, right: -100, filter: "blur(100px)", opacity: 0.1, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 10, width: 420 }} className="fade-up">
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          padding: "48px 44px", position: "relative",
          clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))"
        }}>
          <div style={{ position: "absolute", top: 0, left: 32, right: 32, height: 2, background: "linear-gradient(90deg, transparent, var(--accent), var(--accent2), transparent)" }} />
          <div style={{ position: "absolute", top: 12, left: 12, width: 8, height: 8, borderTop: "1px solid var(--accent)", borderLeft: "1px solid var(--accent)" }} />
          <div style={{ position: "absolute", bottom: 12, right: 12, width: 8, height: 8, borderBottom: "1px solid var(--accent)", borderRight: "1px solid var(--accent)" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
            <div style={{
              width: 38, height: 38, background: "linear-gradient(135deg, var(--accent2), var(--accent))",
              clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--mono)", fontSize: 13, color: "#04070f", fontWeight: "bold"
            }}>W</div>
            <div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: 2 }}>WORKFLOWOS</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--muted)", letterSpacing: 1 }}>ORCHESTRATION PLATFORM</div>
            </div>
          </div>

          <div style={{ fontFamily: "var(--sans)", fontSize: 28, fontWeight: 800, lineHeight: 1.1, marginBottom: 6, background: "linear-gradient(135deg, var(--text) 60%, var(--accent))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {isRegister ? "CREATE\nACCOUNT" : "SYSTEM\nACCESS"}
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", letterSpacing: 1, marginBottom: 36 }}>
            {isRegister ? "// register new account →" : "// authenticate to continue →"}
          </div>

          {error && (
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--danger)", background: "rgba(255,61,90,0.06)", borderLeft: "2px solid var(--danger)", padding: "10px 14px", marginBottom: 20, letterSpacing: 1 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent3)", background: "rgba(0,255,157,0.06)", borderLeft: "2px solid var(--accent3)", padding: "10px 14px", marginBottom: 20, letterSpacing: 1 }}>
              {success}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label className="label">User_ID</label>
            <input
              className="input" type="text" placeholder="enter username"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && (isRegister ? handleRegister() : handleSubmit())}
              autoComplete="username"
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label className="label">Access_Key</label>
            <input
              className="input" type="password" placeholder="enter password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && (isRegister ? handleRegister() : handleSubmit())}
              autoComplete="current-password"
            />
          </div>

          <button className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={isRegister ? handleRegister : handleSubmit}
            disabled={loading}>
            {loading ? "PROCESSING..." : isRegister ? "REGISTER →" : "AUTHENTICATE →"}
          </button>

          <div style={{ marginTop: 20, textAlign: "center", fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", letterSpacing: 1 }}>
            {isRegister ? (
              <>Already have an account?{" "}
                <span onClick={() => { setIsRegister(false); setError(""); setSuccess(""); }}
                  style={{ color: "var(--accent)", cursor: "pointer" }}>LOGIN</span>
              </>
            ) : (
              <>No account?{" "}
                <span onClick={() => { setIsRegister(true); setError(""); setSuccess(""); }}
                  style={{ color: "var(--accent)", cursor: "pointer" }}>REGISTER</span>
              </>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 12, fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", letterSpacing: 1 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent3)", display: "inline-block" }} />
            SYS ONLINE
          </span>
          <span>v1.0.0</span>
          <span style={{ marginLeft: "auto" }}>{time} UTC</span>
        </div>
      </div>
    </div>
  );
}