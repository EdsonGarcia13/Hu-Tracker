// src/components/StatusSelect.jsx
import React from "react";

export default function StatusSelect({
  value = "ToDo",
  onChange,
  size = "sm",
  className = "",
  disabled = false,
}) {
  // Colores del propio <select>, SIN badge adicional
  const tone =
    value === "Done"
      ? "status-select--done"
      : value === "In Progress"
      ? "status-select--inprogress"
      : "status-select--todo";

  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`form-select form-select-${size} fw-semibold ${tone} ${className}`}
      style={{ minWidth: 120 }}
    >
      <option value="ToDo">ToDo</option>
      <option value="In Progress">In Progress</option>
      <option value="Done">Done</option>
    </select>
  );
}
