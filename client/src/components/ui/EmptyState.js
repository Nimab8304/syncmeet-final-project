import React from "react";
import emptyCalendar from "../../assets/empty-calendar.svg";

export default function EmptyState({
  title,
  description,
  action,
  image = emptyCalendar, // default illustration
  hideImage = false,     // allow hiding the visual if desired
}) {
  return (
    <div className="empty">
      {!hideImage && image && (
        <div style={{ marginBottom: 14 }}>
          <img
            src={image}
            alt=""
            aria-hidden="true"
            style={{ width: "100%", maxWidth: 420, height: "auto" }}
          />
        </div>
      )}
      <h3 style={{ marginBottom: 6 }}>{title}</h3>
      {description && (
        <p style={{ marginBottom: 14, color: "#6b7280" }}>{description}</p>
      )}
      {action?.label && (
        <button onClick={action.onClick} className="secondary">
          {action.label}
        </button>
      )}
    </div>
  );
}
