import { useState, useEffect } from "react";
import {
  getWorkflow, getTasks, getDependencies, createTask, deleteTask, updateTask,
  addDependency, deleteDependency, validateWorkflow, getExecutionOrder,
  executeWorkflow, getWorkflowRuns, getWorkflowRun, getTaskRuns, getWaitingTasks, completeManualTask
} from "../api";
import { toast } from "../components/Toast";

// ─── Task Modal ───────────────────────────────────────────────────────────────
function TaskModal({ onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || { name: "", description: "", estimatedDuration: "", taskType: "AUTOMATED" });
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    if (!form.name || !form.description) { toast("Fill all fields", "error"); return; }
    setSaving(true);
    try { await onSave({ ...form, estimatedDuration: Number(form.estimatedDuration) || null }); onClose(); }
    catch { toast("Failed to save task", "error"); }
    finally { setSaving(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">{initial ? "EDIT TASK" : "NEW TASK"}</div>
        <div style={{ marginBottom: 14 }}>
          <label className="label">Name</label>
          <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Task name" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label className="label">Description</label>
          <textarea className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Task description..." rows={2} style={{ resize: "vertical" }} />
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <label className="label">Type</label>
            <select className="input" value={form.taskType} onChange={e => setForm(f => ({ ...f, taskType: e.target.value }))}>
              <option value="AUTOMATED">AUTOMATED</option>
              <option value="MANUAL">MANUAL</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label className="label">Est. Duration (ms×100)</label>
            <input className="input" type="number" value={form.estimatedDuration} onChange={e => setForm(f => ({ ...f, estimatedDuration: e.target.value }))} placeholder="e.g. 10" />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>CANCEL</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? "SAVING..." : "SAVE"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Dependency Modal ─────────────────────────────────────────────────────────
function DepModal({ onClose, onSave, tasks }) {
  const [src, setSrc] = useState("");
  const [tgt, setTgt] = useState("");
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    if (!src || !tgt || src === tgt) { toast("Select valid source & target", "error"); return; }
    setSaving(true);
    try { await onSave(Number(src), Number(tgt)); onClose(); }
    catch (e) { toast(e.message || "Failed", "error"); }
    finally { setSaving(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">ADD DEPENDENCY</div>
        <div style={{ marginBottom: 14 }}>
          <label className="label">Source Task (runs first)</label>
          <select className="input" value={src} onChange={e => setSrc(e.target.value)}>
            <option value="">-- select task --</option>
            {tasks.map(t => <option key={t.id} value={t.id}>#{t.id} — {t.name}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label className="label">Target Task (runs after)</label>
          <select className="input" value={tgt} onChange={e => setTgt(e.target.value)}>
            <option value="">-- select task --</option>
            {tasks.map(t => <option key={t.id} value={t.id}>#{t.id} — {t.name}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>CANCEL</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? "SAVING..." : "ADD"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────
function Tab({ label, active, onClick, badge }) {
  return (
    <button onClick={onClick} style={{
      padding: "10px 20px", background: active ? "rgba(0,200,255,0.1)" : "transparent",
      border: "none", borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
      color: active ? "var(--accent)" : "var(--muted)", fontFamily: "var(--mono)",
      fontSize: 11, letterSpacing: 1.5, cursor: "pointer", transition: "all 0.15s",
      display: "flex", alignItems: "center", gap: 8
    }}>
      {label}
      {badge != null && <span style={{ background: "var(--accent)", color: "#04070f", borderRadius: 10, padding: "1px 7px", fontSize: 9 }}>{badge}</span>}
    </button>
  );
}

// ─── Run Monitor ──────────────────────────────────────────────────────────────
function RunMonitor({ runId, workflowId, onRefreshRuns }) {
  const [run, setRun] = useState(null);
  const [taskRuns, setTaskRuns] = useState([]);
  const [waiting, setWaiting] = useState([]);
  const [completing, setCompleting] = useState(null);

  const loadRun = async () => {
    try {
      const [r, tr, wt] = await Promise.all([
        getWorkflowRun(runId), getTaskRuns(runId), getWaitingTasks(runId)
      ]);
      setRun(r); setTaskRuns(tr); setWaiting(wt);
    } catch { toast("Failed to load run data", "error"); }
  };

  useEffect(() => {
    loadRun();
    const interval = setInterval(() => {
      if (run?.status === "RUNNING" || run?.status === "WAITING") loadRun();
    }, 3000);
    return () => clearInterval(interval);
  }, [runId, run?.status]);

  const handleComplete = async (taskRunId) => {
    setCompleting(taskRunId);
    try {
      await completeManualTask(taskRunId);
      toast("Task completed! Workflow resuming...", "success");
      setTimeout(loadRun, 500);
      onRefreshRuns?.();
    } catch { toast("Failed to complete task", "error"); }
    finally { setCompleting(null); }
  };

  const statusColor = (s) => {
    if (!s) return "var(--muted)";
    const m = { COMPLETED: "var(--accent3)", FAILED: "var(--danger)", RUNNING: "var(--accent)", WAITING_FOR_USER: "var(--warn)", PENDING: "var(--muted)", READY: "#6699ff" };
    return m[s] || "var(--muted)";
  };

  if (!run) return <div style={{ fontFamily: "var(--mono)", color: "var(--muted)", padding: 20 }}>// LOADING RUN...</div>;

  return (
    <div style={{ background: "var(--surface2)", border: "1px solid var(--border2)", padding: 20, marginBottom: 20 }}>
      {/* Run header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>RUN #{run.workflowRunId}</div>
        <span className={`badge badge-${run.status?.toLowerCase()}`}>{run.status}</span>
        {run.status === "RUNNING" && <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)" }}>● LIVE</span>}
        <div style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>
          Started: {run.startedAt ? new Date(run.startedAt).toLocaleTimeString() : "—"}
        </div>
      </div>

      {/* Waiting tasks alert */}
      {waiting.length > 0 && (
        <div style={{ background: "rgba(255,184,0,0.08)", border: "1px solid rgba(255,184,0,0.3)", padding: 16, marginBottom: 16 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--warn)", marginBottom: 12, letterSpacing: 1 }}>
            ⚠ WAITING FOR MANUAL APPROVAL ({waiting.length})
          </div>
          {waiting.map(wt => (
            <div key={wt.taskRunId} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text)", flex: 1 }}>
                #{wt.taskRunId} — {wt.taskName}
              </span>
              <button className="btn btn-success btn-sm"
                onClick={() => handleComplete(wt.taskRunId)}
                disabled={completing === wt.taskRunId}>
                {completing === wt.taskRunId ? "COMPLETING..." : "✓ COMPLETE"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Task runs */}
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", letterSpacing: 2, marginBottom: 12 }}>TASK RUNS</div>
      {taskRuns.length === 0
        ? <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>No task runs yet.</div>
        : taskRuns.map(tr => (
          <div key={tr.taskRunId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor(tr.status), flexShrink: 0 }} />
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, flex: 1 }}>{tr.taskName}</div>
            <span className={`badge badge-${tr.status?.toLowerCase().replace("_for_user", "").replace("waiting", "waiting")}`} style={{ fontSize: 9 }}>{tr.status}</span>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", minWidth: 80, textAlign: "right" }}>
              {tr.startedAt ? new Date(tr.startedAt).toLocaleTimeString() : "—"}
            </div>
          </div>
        ))
      }
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function WorkflowDetailPage({ workflowId, onBack }) {
  const [workflow, setWorkflow] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [deps, setDeps] = useState([]);
  const [runs, setRuns] = useState([]);
  const [tab, setTab] = useState("tasks");
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDepModal, setShowDepModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [validation, setValidation] = useState(null);
  const [execOrder, setExecOrder] = useState(null);
  const [activeRunId, setActiveRunId] = useState(null);
  const [executing, setExecuting] = useState(false);

  const loadAll = async () => {
    try {
      const [wf, ts, ds, rs] = await Promise.all([
        getWorkflow(workflowId), getTasks(workflowId),
        getDependencies(workflowId), getWorkflowRuns(workflowId)
      ]);
      setWorkflow(wf); setTasks(ts); setDeps(ds); setRuns(rs);
    } catch { toast("Failed to load workflow", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, [workflowId]);

  const handleCreateTask = async (form) => {
    await createTask(workflowId, form);
    toast("Task created!", "success");
    const ts = await getTasks(workflowId); setTasks(ts);
  };

  const handleUpdateTask = async (form) => {
    await updateTask(workflowId, editTask.id, form);
    toast("Task updated!", "success");
    const ts = await getTasks(workflowId); setTasks(ts);
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm("Delete this task?")) return;
    try { await deleteTask(workflowId, taskId); toast("Task deleted", "success"); const ts = await getTasks(workflowId); setTasks(ts); }
    catch { toast("Delete failed", "error"); }
  };

  const handleAddDep = async (src, tgt) => {
    await addDependency(workflowId, src, tgt);
    toast("Dependency added!", "success");
    const ds = await getDependencies(workflowId); setDeps(ds);
  };

  const handleDeleteDep = async (depId) => {
    try { await deleteDependency(workflowId, depId); toast("Dependency removed", "success"); const ds = await getDependencies(workflowId); setDeps(ds); }
    catch { toast("Delete failed", "error"); }
  };

  const handleValidate = async () => {
    try { const v = await validateWorkflow(workflowId); setValidation(v); setTab("graph"); }
    catch { toast("Validation error", "error"); }
  };

  const handleExecOrder = async () => {
    try { const o = await getExecutionOrder(workflowId); setExecOrder(o); setTab("graph"); }
    catch { toast("Error fetching order", "error"); }
  };

  const handleExecute = async () => {
    setExecuting(true);
    try {
      const run = await executeWorkflow(workflowId);
      toast("Workflow started!", "success");
      setActiveRunId(run.id);
      setTab("runs");
      const rs = await getWorkflowRuns(workflowId); setRuns(rs);
    } catch { toast("Execution failed", "error"); }
    finally { setExecuting(false); }
  };

  const taskMap = Object.fromEntries(tasks.map(t => [t.id, t]));

  if (loading) return <div style={{ padding: 40, fontFamily: "var(--mono)", color: "var(--muted)" }}>// LOADING...</div>;

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Back + Header */}
      <div className="fade-up" style={{ marginBottom: 28 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 11, letterSpacing: 1, cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          ← BACK TO DASHBOARD
        </button>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: 2, marginBottom: 4 }}>// WORKFLOW #{workflowId}</div>
            <h1 style={{ fontFamily: "var(--sans)", fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{workflow?.name}</h1>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>{workflow?.description}</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span className={`badge badge-${workflow?.status?.toLowerCase()}`}>{workflow?.status}</span>
            <button className="btn btn-ghost btn-sm" onClick={handleValidate}>VALIDATE</button>
            <button className="btn btn-ghost btn-sm" onClick={handleExecOrder}>EXEC ORDER</button>
            <button className="btn btn-primary" onClick={handleExecute} disabled={executing}>
              {executing ? "STARTING..." : "▶ EXECUTE"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="fade-up delay-1" style={{ borderBottom: "1px solid var(--border)", display: "flex", marginBottom: 24 }}>
        <Tab label="TASKS" active={tab === "tasks"} onClick={() => setTab("tasks")} badge={tasks.length} />
        <Tab label="DEPENDENCIES" active={tab === "deps"} onClick={() => setTab("deps")} badge={deps.length} />
        <Tab label="GRAPH / VALIDATE" active={tab === "graph"} onClick={() => setTab("graph")} />
        <Tab label="RUN HISTORY" active={tab === "runs"} onClick={() => setTab("runs")} badge={runs.length} />
      </div>

      {/* ── TASKS TAB ─────────────────────────────────────────────── */}
      {tab === "tasks" && (
        <div className="fade-up">
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button className="btn btn-primary btn-sm" onClick={() => { setEditTask(null); setShowTaskModal(true); }}>+ ADD TASK</button>
          </div>
          {tasks.length === 0 ? (
            <div className="empty"><div className="empty-icon">⬡</div><div>NO TASKS YET — ADD YOUR FIRST TASK</div></div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {tasks.map((task, i) => (
                <div key={task.id} className="card card-clipped fade-up" style={{ animationDelay: `${i * 0.04}s`, display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", minWidth: 32 }}>#{task.id}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "var(--sans)", fontWeight: 600, marginBottom: 2 }}>{task.name}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{task.description}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                      <span className={`badge badge-${task.TaskType?.toLowerCase()}`}>{task.TaskType}</span>
                      {task.estimatedDuration && <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>~{task.estimatedDuration * 100}ms</span>}
                      {task.incomingDependencyIds?.length > 0 && <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>deps: [{task.incomingDependencyIds.join(", ")}]</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditTask(task); setShowTaskModal(true); }}>EDIT</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTask(task.id)}>DEL</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── DEPENDENCIES TAB ──────────────────────────────────────── */}
      {tab === "deps" && (
        <div className="fade-up">
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowDepModal(true)}>+ ADD DEPENDENCY</button>
          </div>
          {deps.length === 0 ? (
            <div className="empty"><div className="empty-icon">→</div><div>NO DEPENDENCIES YET</div></div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {deps.map((dep, i) => {
                const src = taskMap[dep.sourceTask];
                const tgt = taskMap[dep.targetTask];
                return (
                  <div key={dep.id} className="card fade-up" style={{ display: "flex", alignItems: "center", gap: 16, animationDelay: `${i * 0.04}s` }}>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, fontFamily: "var(--mono)", fontSize: 12 }}>
                      <div style={{ background: "rgba(0,85,255,0.1)", border: "1px solid rgba(0,85,255,0.3)", padding: "4px 12px", color: "#6699ff" }}>
                        #{dep.sourceTask} {src ? `— ${src.name}` : ""}
                      </div>
                      <span style={{ color: "var(--accent)", fontSize: 16 }}>→</span>
                      <div style={{ background: "rgba(0,255,157,0.08)", border: "1px solid rgba(0,255,157,0.25)", padding: "4px 12px", color: "var(--accent3)" }}>
                        #{dep.targetTask} {tgt ? `— ${tgt.name}` : ""}
                      </div>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteDep(dep.id)}>REMOVE</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── GRAPH / VALIDATE TAB ─────────────────────────────────── */}
      {tab === "graph" && (
        <div className="fade-up">
          {validation && (
            <div style={{ background: validation.valid ? "rgba(0,255,157,0.06)" : "rgba(255,61,90,0.06)", border: `1px solid ${validation.valid ? "rgba(0,255,157,0.3)" : "rgba(255,61,90,0.3)"}`, padding: 20, marginBottom: 20 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: validation.valid ? "var(--accent3)" : "var(--danger)", letterSpacing: 1, marginBottom: 6 }}>
                {validation.valid ? "✓ VALIDATION PASSED" : "✗ VALIDATION FAILED"}
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>{validation.message}</div>
            </div>
          )}
          {execOrder && (
            <div style={{ background: "rgba(0,200,255,0.05)", border: "1px solid rgba(0,200,255,0.2)", padding: 20, marginBottom: 20 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: 1, marginBottom: 16 }}>// EXECUTION ORDER</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                {execOrder.orderedTaskIds?.map((taskId, idx) => {
                  const t = taskMap[taskId];
                  return (
                    <div key={taskId} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ background: "var(--surface2)", border: "1px solid var(--border2)", padding: "8px 16px", fontFamily: "var(--mono)", fontSize: 11 }}>
                        <div style={{ color: "var(--accent)", fontSize: 9, letterSpacing: 1, marginBottom: 2 }}>STEP {idx + 1}</div>
                        <div style={{ color: "var(--text)" }}>#{taskId} {t ? `— ${t.name}` : ""}</div>
                        {t && <span className={`badge badge-${t.TaskType?.toLowerCase()}`} style={{ marginTop: 4, fontSize: 9 }}>{t.TaskType}</span>}
                      </div>
                      {idx < execOrder.orderedTaskIds.length - 1 && <span style={{ color: "var(--accent)", fontSize: 18 }}>→</span>}
                    </div>
                  );
                })}
              </div>
              {execOrder.message && <div style={{ marginTop: 16, fontSize: 12, color: "var(--muted)", fontFamily: "var(--mono)" }}>{execOrder.message}</div>}
            </div>
          )}
          {!validation && !execOrder && (
            <div className="empty">
              <div className="empty-icon">◈</div>
              <div>USE VALIDATE OR EXEC ORDER BUTTONS ABOVE</div>
            </div>
          )}
          {/* Simple DAG visualization */}
          {tasks.length > 0 && (
            <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", padding: 24 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", letterSpacing: 2, marginBottom: 16 }}>DAG OVERVIEW</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {tasks.map(task => (
                  <div key={task.id} style={{
                    background: task.TaskType === "MANUAL" ? "rgba(255,184,0,0.08)" : "rgba(0,85,255,0.08)",
                    border: `1px solid ${task.TaskType === "MANUAL" ? "rgba(255,184,0,0.3)" : "rgba(0,85,255,0.3)"}`,
                    padding: "10px 16px", fontFamily: "var(--mono)", fontSize: 11
                  }}>
                    <div style={{ color: "var(--muted)", fontSize: 9, letterSpacing: 1 }}>#{task.id}</div>
                    <div style={{ color: "var(--text)", marginBottom: 4 }}>{task.name}</div>
                    <span className={`badge badge-${task.TaskType?.toLowerCase()}`} style={{ fontSize: 9 }}>{task.TaskType}</span>
                    {task.outgoingDependencyIds?.length > 0 && (
                      <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 4 }}>→ [{task.outgoingDependencyIds.join(", ")}]</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── RUNS TAB ──────────────────────────────────────────────── */}
      {tab === "runs" && (
        <div className="fade-up">
          {activeRunId && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: 2, marginBottom: 12 }}>// ACTIVE RUN</div>
              <RunMonitor runId={activeRunId} workflowId={workflowId} onRefreshRuns={loadAll} />
            </div>
          )}
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", letterSpacing: 2, marginBottom: 12 }}>// RUN HISTORY</div>
          {runs.length === 0 ? (
            <div className="empty"><div className="empty-icon">▶</div><div>NO RUNS YET — EXECUTE THE WORKFLOW FIRST</div></div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {runs.map((run, i) => (
                <div key={run.workflowRunId}
                  className="card fade-up"
                  style={{ display: "flex", alignItems: "center", gap: 16, cursor: "pointer", animationDelay: `${i * 0.04}s`, transition: "all 0.15s" }}
                  onClick={() => setActiveRunId(run.workflowRunId)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border2)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", minWidth: 60 }}>RUN #{run.workflowRunId}</div>
                  <span className={`badge badge-${run.status?.toLowerCase()}`}>{run.status}</span>
                  <div style={{ flex: 1 }} />
                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>
                    {run.startedAt ? new Date(run.startedAt).toLocaleString() : "—"}
                  </div>
                  {activeRunId === run.workflowRunId && <span style={{ color: "var(--accent)", fontFamily: "var(--mono)", fontSize: 10 }}>● VIEWING</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showTaskModal && (
        <TaskModal
          onClose={() => { setShowTaskModal(false); setEditTask(null); }}
          onSave={editTask ? handleUpdateTask : handleCreateTask}
          initial={editTask ? { name: editTask.name, description: editTask.description, estimatedDuration: editTask.estimatedDuration || "", taskType: editTask.TaskType } : null}
        />
      )}
      {showDepModal && (
        <DepModal onClose={() => setShowDepModal(false)} onSave={handleAddDep} tasks={tasks} />
      )}
    </div>
  );
}
