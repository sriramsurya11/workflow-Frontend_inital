import { useState, useEffect } from "react";
import { getWorkflows, createWorkflow, deleteWorkflow, updateWorkflow } from "../api";
import { toast } from "../components/Toast";

function StatCard({ label, value, color }) {
  return (
    <div className="card card-clipped fade-up" style={{ textAlign: "center", flex: 1 }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", letterSpacing: 2, marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "var(--sans)", fontSize: 32, fontWeight: 800, color: color || "var(--text)" }}>{value}</div>
    </div>
  );
}

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
        {initial && (
          <div style={{ marginBottom: 20 }}>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="DRAFT">DRAFT</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>
        )}
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

export default function DashboardPage({ onSelectWorkflow }) {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const load = async () => {
    try { setWorkflows(await getWorkflows()); }
    catch { toast("Failed to load workflows", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (form) => {
    await createWorkflow(form);
    toast("Workflow created!", "success");
    load();
  };

  const handleEdit = async (form) => {
    await updateWorkflow(editTarget.id, form);
    toast("Workflow updated!", "success");
    load();
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Delete this workflow?")) return;
    try { await deleteWorkflow(id); toast("Deleted", "success"); load(); }
    catch { toast("Delete failed", "error"); }
  };

  const filtered = workflows.filter(w => {
    const matchSearch = w.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || w.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    total: workflows.length,
    active: workflows.filter(w => w.status === "ACTIVE").length,
    draft: workflows.filter(w => w.status === "DRAFT").length,
    archived: workflows.filter(w => w.status === "ARCHIVED").length,
  };

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: 2, marginBottom: 6 }}>// OVERVIEW</div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <h1 style={{ fontFamily: "var(--sans)", fontSize: 32, fontWeight: 800 }}>Dashboard</h1>
          <button className="btn btn-primary" onClick={() => { setEditTarget(null); setShowModal(true); }}>+ NEW WORKFLOW</button>
        </div>
      </div>

      {/* Stats */}
      <div className="fade-up delay-1" style={{ display: "flex", gap: 16, marginBottom: 32 }}>
        <StatCard label="TOTAL" value={counts.total} color="var(--text)" />
        <StatCard label="ACTIVE" value={counts.active} color="var(--accent3)" />
        <StatCard label="DRAFT" value={counts.draft} color="var(--muted)" />
        <StatCard label="ARCHIVED" value={counts.archived} color="var(--danger)" />
      </div>

      {/* Filters */}
      <div className="fade-up delay-2" style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <input className="input" style={{ width: 240 }} placeholder="Search workflows..." value={search} onChange={e => setSearch(e.target.value)} />
        {["ALL", "DRAFT", "ACTIVE", "ARCHIVED"].map(s => (
          <button key={s} className={`btn btn-sm ${filterStatus === s ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilterStatus(s)}>{s}</button>
        ))}
      </div>

      {/* Workflow list */}
      {loading ? (
        <div style={{ fontFamily: "var(--mono)", color: "var(--muted)", letterSpacing: 1, padding: 40 }}>// LOADING...</div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">⬡</div>
          <div>NO WORKFLOWS FOUND</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {filtered.map((wf, i) => (
            <div key={wf.id}
              className={`card card-clipped fade-up`}
              style={{ cursor: "pointer", transition: "all 0.2s", animationDelay: `${i * 0.04}s` }}
              onClick={() => onSelectWorkflow(wf.id)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.background = "var(--surface2)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--surface)"; }}>

              {/* Top accent line */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: wf.status === "ACTIVE" ? "linear-gradient(90deg, var(--accent3), transparent)" : wf.status === "ARCHIVED" ? "linear-gradient(90deg, var(--danger), transparent)" : "linear-gradient(90deg, var(--muted), transparent)" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ fontFamily: "var(--sans)", fontSize: 16, fontWeight: 700, flex: 1, marginRight: 12 }}>{wf.name}</div>
                <span className={`badge badge-${wf.status?.toLowerCase()}`}>{wf.status}</span>
              </div>

              <div style={{ fontFamily: "var(--body)", fontSize: 13, color: "var(--muted)", marginBottom: 20, lineHeight: 1.5 }}>{wf.description}</div>

              <div style={{ display: "flex", gap: 8, alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 16, marginTop: "auto" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", letterSpacing: 1, flex: 1 }}>
                  ID: #{wf.id} &nbsp;·&nbsp; {wf.createdAt || "—"}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); setEditTarget(wf); setShowModal(true); }}>EDIT</button>
                <button className="btn btn-danger btn-sm" onClick={e => handleDelete(wf.id, e)}>DEL</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <WorkflowModal
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSave={editTarget ? handleEdit : handleCreate}
          initial={editTarget}
        />
      )}
    </div>
  );
}
