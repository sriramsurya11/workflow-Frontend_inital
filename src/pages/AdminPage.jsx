import { useState, useEffect } from "react";
import {
  getWorkflows, deleteWorkflow, updateWorkflow, createWorkflow,
  getWorkflowRuns, getTaskRuns
} from "../api";
import { toast } from "../components/Toast";

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }) {
  return (
    <div className="card card-clipped fade-up" style={{ flex: 1, minWidth: 140, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color || "var(--accent)"}, transparent)` }} />
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", letterSpacing: 2, marginBottom: 10 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "var(--sans)", fontSize: 36, fontWeight: 800, color: color || "var(--text)", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 22, opacity: 0.18 }}>{icon}</div>
      </div>
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <div className="modal-title" style={{ marginBottom: 12 }}>CONFIRM ACTION</div>
        <div style={{ fontFamily: "var(--body)", fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>{message}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>CANCEL</button>
          <button className="btn btn-danger btn-sm" onClick={onConfirm}>CONFIRM</button>
        </div>
      </div>
    </div>
  );
}

// ─── Workflow Edit Modal ──────────────────────────────────────────────────────
function WorkflowModal({ onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || { name: "", description: "", status: "DRAFT" });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.description) { toast("Fill all fields", "error"); return; }
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch { toast("Failed to save", "error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">{initial ? "EDIT WORKFLOW" : "NEW WORKFLOW"}</div>
        <div style={{ marginBottom: 16 }}>
          <label className="label">Name</label>
          <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Workflow name" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="label">Description</label>
          <textarea className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe this workflow..." rows={3} style={{ resize: "vertical" }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="DRAFT">DRAFT</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>CANCEL</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? "SAVING..." : "SAVE"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Overview Section ─────────────────────────────────────────────────────────
function OverviewSection({ workflows }) {
  const counts = {
    total: workflows.length,
    active: workflows.filter(w => w.status === "ACTIVE").length,
    draft: workflows.filter(w => w.status === "DRAFT").length,
    archived: workflows.filter(w => w.status === "ARCHIVED").length,
  };

  return (
    <div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: 2, marginBottom: 6 }}>// SYSTEM OVERVIEW</div>
      <h2 style={{ fontFamily: "var(--sans)", fontSize: 26, fontWeight: 800, marginBottom: 28 }}>Admin Overview</h2>

      {/* Stat Cards */}
      <div style={{ display: "flex", gap: 16, marginBottom: 36, flexWrap: "wrap" }}>
        <StatCard label="TOTAL WORKFLOWS" value={counts.total} color="var(--accent)" icon="⬡" />
        <StatCard label="ACTIVE" value={counts.active} color="var(--accent3)" icon="▶" />
        <StatCard label="DRAFT" value={counts.draft} color="var(--muted)" icon="✎" />
        <StatCard label="ARCHIVED" value={counts.archived} color="var(--danger)" icon="⊘" />
      </div>

      {/* Recent Workflows Table */}
      <div className="card card-clipped fade-up">
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", letterSpacing: 2, marginBottom: 16 }}>// RECENT WORKFLOWS</div>
        {workflows.length === 0 ? (
          <div style={{ fontFamily: "var(--mono)", color: "var(--muted)", fontSize: 12, padding: "20px 0" }}>// NO DATA</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["ID", "NAME", "STATUS", "CREATED"].map(h => (
                  <th key={h} style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", letterSpacing: 2, textAlign: "left", padding: "8px 12px", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workflows.slice(0, 8).map((wf, i) => (
                <tr key={wf.id} style={{ borderBottom: "1px solid var(--border)", opacity: 0, animation: `fadeUp 0.3s ease forwards ${i * 0.05}s` }}>
                  <td style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", padding: "10px 12px" }}>#{wf.id}</td>
                  <td style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 600, padding: "10px 12px" }}>{wf.name}</td>
                  <td style={{ padding: "10px 12px" }}><span className={`badge badge-${wf.status?.toLowerCase()}`}>{wf.status}</span></td>
                  <td style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", padding: "10px 12px" }}>{wf.createdAt || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Workflows Section ────────────────────────────────────────────────────────
function WorkflowsSection({ workflows, onRefresh }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [editTarget, setEditTarget] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = workflows.filter(w => {
    const matchSearch = w.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || w.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleEdit = async (form) => {
    await updateWorkflow(editTarget.id, form);
    toast("Workflow updated!", "success");
    onRefresh();
  };

  const handleCreate = async (form) => {
    await createWorkflow(form);
    toast("Workflow created!", "success");
    onRefresh();
  };

  const handleDelete = async (id) => {
    try {
      const { deleteWorkflow: del } = await import("../api");
      await del(id);
      toast("Deleted!", "success");
      onRefresh();
    } catch {
      toast("Delete failed", "error");
    }
    setConfirmDelete(null);
  };

  return (
    <div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: 2, marginBottom: 6 }}>// WORKFLOW MANAGEMENT</div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24 }}>
        <h2 style={{ fontFamily: "var(--sans)", fontSize: 26, fontWeight: 800 }}>Workflows</h2>
        <button className="btn btn-primary btn-sm" onClick={() => { setEditTarget(null); setShowModal(true); }}>+ NEW</button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input className="input" style={{ width: 220 }} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        {["ALL", "DRAFT", "ACTIVE", "ARCHIVED"].map(s => (
          <button key={s} className={`btn btn-sm ${filterStatus === s ? "btn-primary" : "btn-ghost"}`} onClick={() => setFilterStatus(s)}>{s}</button>
        ))}
      </div>

      {/* Table */}
      <div className="card card-clipped">
        {filtered.length === 0 ? (
          <div style={{ fontFamily: "var(--mono)", color: "var(--muted)", fontSize: 12, padding: "20px 0" }}>// NO WORKFLOWS FOUND</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["ID", "NAME", "DESCRIPTION", "STATUS", "CREATED", "ACTIONS"].map(h => (
                  <th key={h} style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", letterSpacing: 2, textAlign: "left", padding: "8px 12px", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((wf, i) => (
                <tr key={wf.id} style={{ borderBottom: "1px solid var(--border)", opacity: 0, animation: `fadeUp 0.3s ease forwards ${i * 0.04}s` }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", padding: "10px 12px" }}>#{wf.id}</td>
                  <td style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 600, padding: "10px 12px", maxWidth: 180 }}>{wf.name}</td>
                  <td style={{ fontFamily: "var(--body)", fontSize: 12, color: "var(--muted)", padding: "10px 12px", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{wf.description}</td>
                  <td style={{ padding: "10px 12px" }}><span className={`badge badge-${wf.status?.toLowerCase()}`}>{wf.status}</span></td>
                  <td style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", padding: "10px 12px" }}>{wf.createdAt || "—"}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" style={{ fontSize: 10, padding: "4px 8px" }}
                        onClick={() => { setEditTarget(wf); setShowModal(true); }}>EDIT</button>
                      <button className="btn btn-danger btn-sm" style={{ fontSize: 10, padding: "4px 8px" }}
                        onClick={() => setConfirmDelete(wf.id)}>DEL</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <WorkflowModal
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSave={editTarget ? handleEdit : handleCreate}
          initial={editTarget}
        />
      )}
      {confirmDelete && (
        <ConfirmModal
          message="Are you sure you want to delete this workflow? This action cannot be undone."
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

// ─── Runs Section ─────────────────────────────────────────────────────────────
function RunsSection({ workflows }) {
  const [selectedWfId, setSelectedWfId] = useState("");
  const [runs, setRuns] = useState([]);
  const [taskRuns, setTaskRuns] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const loadRuns = async (wfId) => {
    if (!wfId) return;
    setLoadingRuns(true);
    setRuns([]);
    setTaskRuns([]);
    setSelectedRunId(null);
    try { setRuns(await getWorkflowRuns(wfId)); }
    catch { toast("Failed to load runs", "error"); }
    finally { setLoadingRuns(false); }
  };

  const loadTaskRuns = async (runId) => {
    setLoadingTasks(true);
    setSelectedRunId(runId);
    try { setTaskRuns(await getTaskRuns(runId)); }
    catch { toast("Failed to load task runs", "error"); }
    finally { setLoadingTasks(false); }
  };

  const statusColor = (s) => {
    if (s === "COMPLETED") return "var(--accent3)";
    if (s === "FAILED") return "var(--danger)";
    if (s === "RUNNING") return "var(--accent)";
    if (s === "WAITING") return "#f5a623";
    return "var(--muted)";
  };

  return (
    <div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: 2, marginBottom: 6 }}>// EXECUTION MONITOR</div>
      <h2 style={{ fontFamily: "var(--sans)", fontSize: 26, fontWeight: 800, marginBottom: 24 }}>Workflow Runs</h2>

      {/* Workflow selector */}
      <div style={{ marginBottom: 20 }}>
        <label className="label">Select Workflow</label>
        <select className="input" style={{ maxWidth: 320 }} value={selectedWfId}
          onChange={e => { setSelectedWfId(e.target.value); loadRuns(e.target.value); }}>
          <option value="">-- choose a workflow --</option>
          {workflows.map(wf => (
            <option key={wf.id} value={wf.id}>{wf.name} (#{wf.id})</option>
          ))}
        </select>
      </div>

      {/* Runs list */}
      {loadingRuns ? (
        <div style={{ fontFamily: "var(--mono)", color: "var(--muted)", fontSize: 12 }}>// LOADING RUNS...</div>
      ) : runs.length > 0 && (
        <div className="card card-clipped fade-up" style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", letterSpacing: 2, marginBottom: 14 }}>// RUNS — click to inspect task runs</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["RUN ID", "STATUS", "STARTED", "ENDED"].map(h => (
                  <th key={h} style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", letterSpacing: 2, textAlign: "left", padding: "8px 12px", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runs.map((run, i) => (
                <tr key={run.workflowRunId}
                  style={{ borderBottom: "1px solid var(--border)", cursor: "pointer", background: selectedRunId === run.workflowRunId ? "var(--surface2)" : "transparent", opacity: 0, animation: `fadeUp 0.3s ease forwards ${i * 0.04}s` }}
                  onClick={() => loadTaskRuns(run.workflowRunId)}
                  onMouseEnter={e => { if (selectedRunId !== run.workflowRunId) e.currentTarget.style.background = "var(--surface2)"; }}
                  onMouseLeave={e => { if (selectedRunId !== run.workflowRunId) e.currentTarget.style.background = "transparent"; }}>
                  <td style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", padding: "10px 12px" }}>#{run.workflowRunId}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: statusColor(run.status), background: `${statusColor(run.status)}18`, border: `1px solid ${statusColor(run.status)}44`, padding: "3px 8px", letterSpacing: 1 }}>{run.status}</span>
                  </td>
                  <td style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", padding: "10px 12px" }}>{run.startedAt ? new Date(run.startedAt).toLocaleString() : "—"}</td>
                  <td style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", padding: "10px 12px" }}>{run.endedAt ? new Date(run.endedAt).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Runs */}
      {loadingTasks ? (
        <div style={{ fontFamily: "var(--mono)", color: "var(--muted)", fontSize: 12 }}>// LOADING TASK RUNS...</div>
      ) : taskRuns.length > 0 && (
        <div className="card card-clipped fade-up">
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", letterSpacing: 2, marginBottom: 14 }}>// TASK RUNS FOR RUN #{selectedRunId}</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["TASK", "TYPE", "STATUS", "STARTED", "ENDED"].map(h => (
                  <th key={h} style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", letterSpacing: 2, textAlign: "left", padding: "8px 12px", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {taskRuns.map((tr, i) => (
                <tr key={tr.taskRunId} style={{ borderBottom: "1px solid var(--border)", opacity: 0, animation: `fadeUp 0.3s ease forwards ${i * 0.04}s` }}>
                  <td style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 600, padding: "10px 12px" }}>{tr.taskName}</td>
                  <td style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", padding: "10px 12px" }}>#{tr.taskId}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: statusColor(tr.status), background: `${statusColor(tr.status)}18`, border: `1px solid ${statusColor(tr.status)}44`, padding: "3px 8px", letterSpacing: 1 }}>{tr.status}</span>
                  </td>
                  <td style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", padding: "10px 12px" }}>{tr.startedAt ? new Date(tr.startedAt).toLocaleString() : "—"}</td>
                  <td style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", padding: "10px 12px" }}>{tr.endedAt ? new Date(tr.endedAt).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!selectedWfId && (
        <div className="empty">
          <div className="empty-icon">⬡</div>
          <div>SELECT A WORKFLOW TO VIEW RUNS</div>
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const [section, setSection] = useState("overview");
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadWorkflows = async () => {
    try { setWorkflows(await getWorkflows()); }
    catch { toast("Failed to load workflows", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadWorkflows(); }, []);

  const navItems = [
    { key: "overview", label: "OVERVIEW", icon: "⬡" },
    { key: "workflows", label: "WORKFLOWS", icon: "◈" },
    { key: "runs", label: "RUNS", icon: "▶" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 60px)" }}>
      {/* Sidebar */}
      <div style={{
        width: 200, minWidth: 200, borderRight: "1px solid var(--border)",
        padding: "32px 0", background: "var(--surface)",
        display: "flex", flexDirection: "column", gap: 4
      }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--muted)", letterSpacing: 3, padding: "0 20px", marginBottom: 16 }}>// ADMIN PANEL</div>
        {navItems.map(item => (
          <button key={item.key}
            onClick={() => setSection(item.key)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 20px", background: section === item.key ? "var(--surface2)" : "transparent",
              border: "none", borderLeft: section === item.key ? "2px solid var(--accent)" : "2px solid transparent",
              color: section === item.key ? "var(--text)" : "var(--muted)",
              fontFamily: "var(--mono)", fontSize: 11, letterSpacing: 1.5,
              cursor: "pointer", textAlign: "left", width: "100%", transition: "all 0.15s"
            }}
            onMouseEnter={e => { if (section !== item.key) e.currentTarget.style.color = "var(--text)"; }}
            onMouseLeave={e => { if (section !== item.key) e.currentTarget.style.color = "var(--muted)"; }}>
            <span style={{ fontSize: 13 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "32px 40px", overflowY: "auto" }}>
        {loading ? (
          <div style={{ fontFamily: "var(--mono)", color: "var(--muted)", letterSpacing: 1, padding: 40 }}>// LOADING...</div>
        ) : (
          <>
            {section === "overview" && <OverviewSection workflows={workflows} />}
            {section === "workflows" && <WorkflowsSection workflows={workflows} onRefresh={loadWorkflows} />}
            {section === "runs" && <RunsSection workflows={workflows} />}
          </>
        )}
      </div>
    </div>
  );
}
