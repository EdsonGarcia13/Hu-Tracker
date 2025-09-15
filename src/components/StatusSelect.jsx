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
      ? "bg-green-600 text-white"
      : value === "In Progress"
      ? "bg-yellow-400 text-slate-800"
      : "bg-slate-600 text-white";

  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`rounded px-2 py-1 text-xs font-semibold ${tone} ${className}`}
      style={{ minWidth: 120 }}
    >
      <option value="ToDo">ToDo</option>
      <option value="In Progress">In Progress</option>
      <option value="Done">Done</option>
    </select>
  );
}
