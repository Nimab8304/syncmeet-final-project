// client/src/components/ui/Modal.js
import React, { useEffect, useCallback } from "react";

export default function Modal({
  open,
  title,
  children,
  onClose,
  footer, // optional React node for actions
  width = 520,
}) {
  const onKeyDown = useCallback((e) => {
    if (e.key === "Escape") onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", onKeyDown);
    // prevent background scroll while modal is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow || "";
    };
  }, [open, onKeyDown]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,          // allows some margin on small screens
        zIndex: 10000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-panel"
        style={{
          // Panel sizing
          width: "100%",
          maxWidth: width,
          maxHeight: "90vh",   // never exceed viewport height
          overflow: "hidden",  // let inner sections manage their own scroll
          // Layout
          display: "flex",
          flexDirection: "column",
          // Visuals
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        {/* Header (fixed) */}
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flex: "0 0 auto",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18 }}>{title}</h3>
          <button
            onClick={onClose}
            className="secondary"
            aria-label="Close"
            style={{ padding: "6px 10px" }}
          >
            ✕
          </button>
        </div>

        {/* Body (scrollable) */}
        <div
          className="modal-body-scroll"
          style={{
            padding: 16,
            overflowY: "auto",
            flex: "1 1 auto",
            minHeight: 0,        // critical for flex children to allow scrolling
          }}
        >
          {children}
        </div>

        {/* Footer (fixed) */}
        {footer && (
          <div
            style={{
              padding: 12,
              borderTop: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              flex: "0 0 auto",
              background: "#fff",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
