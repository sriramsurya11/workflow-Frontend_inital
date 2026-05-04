import { useState } from "react";
import "./index.css";
import { ThemeProvider } from "./context/ThemeContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import WorkflowDetailPage from "./pages/WorkflowDetailPage";
import AdminPage from "./pages/AdminPage";
import Layout from "./components/Layout";
import { ToastContainer } from "./components/Toast";

export default function App() {
  const [user, setUser] = useState(() => sessionStorage.getItem("wf_user"));
  const [page, setPage] = useState("dashboard");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(null);

  // const handleLogin = (username) => setUser(username);
  const [role, setRole] = useState(() => sessionStorage.getItem("wf_role"));

  const handleLogin = (username, role) => {
    setUser(username);
    setRole(role);
  };

  // const handleLogout = () => {
  //   sessionStorage.removeItem("wf_user");
  //   setUser(null);
  //   setPage("dashboard");
  //   setSelectedWorkflowId(null);
  // };
  const handleLogout = () => {
    sessionStorage.removeItem("wf_user");
    sessionStorage.removeItem("wf_token");
    sessionStorage.removeItem("wf_role");
    setUser(null);
    setRole(null);
    setPage("dashboard");
    setSelectedWorkflowId(null);
  };

  const handleSelectWorkflow = (id) => {
    setSelectedWorkflowId(id);
    setPage("workflow-detail");
  };

  const handleBack = () => {
    setSelectedWorkflowId(null);
    setPage("dashboard");
  };

  return (
    <ThemeProvider>
      {!user ? (
        <>
          <LoginPage onLogin={handleLogin} />
          <ToastContainer />
        </>
      ) : (
        <>
          <Layout
            page={page === "workflow-detail" ? "workflows" : page}
            onNav={setPage}
            user={user}
            role={role}
            onLogout={handleLogout}>
            {page === "dashboard" && <DashboardPage onSelectWorkflow={handleSelectWorkflow} />}
            {page === "workflows" && <DashboardPage onSelectWorkflow={handleSelectWorkflow} />}
            {page === "workflow-detail" && selectedWorkflowId && (
              <WorkflowDetailPage workflowId={selectedWorkflowId} onBack={handleBack} />
            )}
            {/* {page === "admin" && <AdminPage />} */}
            {page === "admin" && role === "ADMIN" && <AdminPage />}
              {page === "admin" && role !== "ADMIN" && (
                <div style={{ padding: "60px 40px", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--danger)", letterSpacing: 2, marginBottom: 16 }}>// ACCESS DENIED</div>
                  <div style={{ fontFamily: "var(--sans)", fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Unauthorized</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)" }}>You don't have permission to access this page.</div>
                </div>
              )}
          </Layout>
          <ToastContainer />
        </>
      )}
    </ThemeProvider>
  );
}
