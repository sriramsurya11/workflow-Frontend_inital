import { useState, useCallback } from "react";

let _setToast = null;

export function toast(msg, type = "info") {
  if (_setToast) _setToast({ msg, type, id: Date.now() });
}

export function ToastContainer() {
  const [t, setT] = useState(null);
  _setToast = (toast) => {
    setT(toast);
    setTimeout(() => setT(null), 3000);
  };
  if (!t) return null;
  return (
    <div className={`toast toast-${t.type}`} style={{ zIndex: 9999 }}>
      {t.type === "success" ? "✓ " : t.type === "error" ? "✗ " : "◈ "}
      {t.msg}
    </div>
  );
}
