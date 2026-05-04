const BASE = "/api";

// ✅ Get token from session
const getToken = () => sessionStorage.getItem("wf_token");

// ✅ Auth headers helper
const authHeaders = (extra = {}) => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra,
});

const handle = async (res) => {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
};

// AUTH (no token needed)
export const register = (username, password) =>
  fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  }).then(handle);

export const login = (username, password) =>
  fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  }).then(handle);

// WORKFLOWS ✅ token attached
export const getWorkflows = () =>
  fetch(`${BASE}/workflows`, { headers: authHeaders() }).then(handle);
export const getWorkflow = (id) =>
  fetch(`${BASE}/workflows/${id}`, { headers: authHeaders() }).then(handle);
export const createWorkflow = (data) =>
  fetch(`${BASE}/workflows`, {
    method: "POST", headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handle);
export const updateWorkflow = (id, data) =>
  fetch(`${BASE}/workflows/${id}`, {
    method: "PATCH", headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handle);
export const deleteWorkflow = (id) =>
  fetch(`${BASE}/workflows/${id}`, {
    method: "DELETE", headers: authHeaders()
  }).then(handle);
export const validateWorkflow = (id) =>
  fetch(`${BASE}/workflows/${id}/validate`, { headers: authHeaders() }).then(handle);
export const getExecutionOrder = (id) =>
  fetch(`${BASE}/workflows/${id}/execution-order`, { headers: authHeaders() }).then(handle);
export const executeWorkflow = (id) =>
  fetch(`${BASE}/workflows/${id}/execute`, {
    method: "POST", headers: authHeaders()
  }).then(handle);

// TASKS ✅ token attached
export const getTasks = (workflowId) =>
  fetch(`${BASE}/workflows/${workflowId}/tasks`, { headers: authHeaders() }).then(handle);
export const createTask = (workflowId, data) =>
  fetch(`${BASE}/workflows/${workflowId}/tasks`, {
    method: "POST", headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handle);
export const updateTask = (workflowId, taskId, data) =>
  fetch(`${BASE}/workflows/${workflowId}/tasks/${taskId}`, {
    method: "PATCH", headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handle);
export const deleteTask = (workflowId, taskId) =>
  fetch(`${BASE}/workflows/${workflowId}/tasks/${taskId}`, {
    method: "DELETE", headers: authHeaders()
  }).then(handle);

// DEPENDENCIES ✅ token attached
export const getDependencies = (workflowId) =>
  fetch(`${BASE}/workflows/${workflowId}/dependencies`, { headers: authHeaders() }).then(handle);
export const addDependency = (workflowId, sourceTaskId, targetTaskId) =>
  fetch(`${BASE}/workflows/${workflowId}/dependencies`, {
    method: "POST", headers: authHeaders(),
    body: JSON.stringify({ sourceTaskId, targetTaskId }),
  }).then(handle);
export const deleteDependency = (workflowId, dependencyId) =>
  fetch(`${BASE}/workflows/${workflowId}/dependencies/${dependencyId}`, {
    method: "DELETE", headers: authHeaders()
  }).then(handle);

// WORKFLOW RUNS ✅ token attached
export const getWorkflowRun = (runId) =>
  fetch(`${BASE}/workflow-runs/${runId}`, { headers: authHeaders() }).then(handle);
export const getWorkflowRuns = (workflowId) =>
  fetch(`${BASE}/workflow-runs/${workflowId}/runs`, { headers: authHeaders() }).then(handle);
export const getTaskRuns = (runId) =>
  fetch(`${BASE}/workflow-runs/${runId}/task-runs`, { headers: authHeaders() }).then(handle);
export const getWaitingTasks = (runId) =>
  fetch(`${BASE}/workflow-runs/${runId}/waiting-task`, { headers: authHeaders() }).then(handle);

// TASK RUNS ✅ token attached
export const completeManualTask = (taskRunId) =>
  fetch(`${BASE}/task-runs/${taskRunId}/complete`, {
    method: "PATCH", headers: authHeaders()
  }).then(handle);