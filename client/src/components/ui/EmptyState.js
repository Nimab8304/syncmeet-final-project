// client/src/components/ui/EmptyState.js
import React from "react";

export default function EmptyState({ title, description, action }) {
  return (
    <div className="empty">
      <h3 style={{ marginBottom: 6 }}>{title}</h3>
      {description && <p style={{ marginBottom: 14, color: "#6b7280" }}>{description}</p>}
      {action?.label && (
        <button onClick={action.onClick} className="secondary">
          {action.label}
        </button>
      )}
    </div>
  );
}
