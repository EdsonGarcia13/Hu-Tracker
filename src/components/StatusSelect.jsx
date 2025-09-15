// src/components/StatusSelect.jsx
import React from "react";

export default function StatusSelect({
  value = "ToDo",
  onChange,
  className = "",
  disabled = false,
}) {
  const tone =
    value === "Done"
      ? "text-bg-success"
      : value === "In Progress"
      ? "text-bg-warning"
      : "text-bg-secondary";

  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`${className} form-select form-select-sm ${tone}`}
      style={{ minWidth: 120 }}
    >
      <option value="ToDo">ToDo</option>
      <option value="In Progress">In Progress</option>
      <option value="Done">Done</option>
    </select>
  );
}
