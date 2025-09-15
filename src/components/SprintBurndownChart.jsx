import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { businessDaysBetween } from "../utils/timeCalculations";

function addBusinessDays(start, days) {
  const date = new Date(start);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) {
      added++;
    }
  }
  return date;
}

function CustomTooltip({ active, payload, label, sprintName }) {
  if (!active || !payload || !payload.length) return null;

  const baseline = payload[0].payload.baseline;
  const projected = payload[0].payload.projected;
  const worked = payload[0].payload.worked;
  let status = null;
  if (baseline != null && projected != null) {
    const diff = projected - baseline;
    if (diff > 0) status = `⚠️ Delay: +${diff.toFixed(1)}h`;
    else if (diff < 0) status = `Ahead: ${diff.toFixed(1)}h`;
    else status = "On track";
  }

  return (
    <div className="bg-white border p-2">
      <p className="mb-1">Date: {label}</p>
      {sprintName && <p className="mb-1">Sprint: {sprintName}</p>}
      {payload.map((entry) => (
        <p key={entry.dataKey} className="mb-1" style={{ color: entry.color }}>
          {entry.name}: {entry.value}h
        </p>
      ))}
      {worked != null && (
        <p className="mb-1">Worked: {worked}h</p>
      )}
      {status && <p className="fw-bold mb-0">{status}</p>}
    </div>
  );
}

export default function SprintBurndownChart({
  tasks,
  sprintDays,
  sprintName,
  initialBaseline,
}) {
  const { points, delay, breakingPoint } = useMemo(() => {
    if (!tasks || tasks.length === 0)
      return { points: [], delay: 0, breakingPoint: null };

    const parsed = tasks.map((t) => ({
      start: t["Start Date"] ? new Date(t["Start Date"]) : new Date(),
      due: t["Due Date"] ? new Date(t["Due Date"]) : new Date(),
      original: Number(t["Original Estimate"]) || 0,
      completed: Number(t["Completed Work"]) || 0,
    }));

    const startDate = parsed.reduce(
      (min, t) => (t.start < min ? t.start : min),
      parsed[0].start
    );
    const dueDate = parsed.reduce(
      (max, t) => (t.due > max ? t.due : max),
      parsed[0].due
    );
    const totalOriginal = parsed.reduce((sum, t) => sum + t.original, 0);
    const totalCompleted = parsed.reduce((sum, t) => sum + t.completed, 0);
    const fallbackTotal = Math.max(
      1,
      businessDaysBetween(startDate, dueDate) - 1
    );
    const totalDays = sprintDays || fallbackTotal;
    const today = new Date();
    const daysElapsed = Math.max(
      0,
      businessDaysBetween(startDate, today) - 1
    );
    const burnRate = daysElapsed > 0 ? totalCompleted / daysElapsed : 0;
    const baselineTotal =
      initialBaseline ?? totalOriginal; /* Baseline can be fetched from backend */
    const remaining = Math.max(totalOriginal - totalCompleted, 0);
    const velocity = burnRate > 0 ? burnRate : totalOriginal / totalDays; // fallback linear regression
    const projectedDays = Math.ceil(remaining / velocity);
    const projectedTotalDays = daysElapsed + projectedDays;
    const maxDays = Math.max(totalDays, projectedTotalDays, daysElapsed);

    const pts = [];
    let breakingIndex = null;
    let prevProjected = totalOriginal;
    for (let i = 0; i <= maxDays; i++) {
      const date = addBusinessDays(startDate, i);
      const baseline =
        i <= totalDays
          ? baselineTotal - (baselineTotal / totalDays) * i
          : null;
      const projected = Math.max(totalOriginal - velocity * i, 0);
      const worked = Math.max(prevProjected - projected, 0);
      prevProjected = projected;
      if (
        breakingIndex === null &&
        projected != null &&
        baseline != null &&
        projected > baseline
      ) {
        breakingIndex = i;
      }
      pts.push({
        day: date.toLocaleDateString(),
        projected,
        baseline,
        worked,
      });
    }

    const delayDays = Math.max(0, projectedTotalDays - totalDays);
    const breakingPoint = breakingIndex !== null ? pts[breakingIndex] : null;
    return { points: pts, delay: delayDays, breakingPoint };
  }, [tasks, sprintDays, initialBaseline]);

  if (!points.length) return null;

  return (
    <div className="card bg-white text-dark mt-4">
      <div className="card-body">
        <h5 className="card-title mb-4">Burndown Chart</h5>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={points}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis allowDecimals={false} />
            <Tooltip content={<CustomTooltip sprintName={sprintName} />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="projected"
              stroke="#dc3545"
              name="Projected"
            />
            <Line
              type="monotone"
              dataKey="baseline"
              stroke="#198754"
              name="Baseline"
            />
            {breakingPoint && (
              <ReferenceDot
                x={breakingPoint.day}
                y={breakingPoint.projected}
                r={6}
                fill="#ffc107"
                stroke="#dc3545"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
        {delay > 0 && (
          <p className="text-danger fw-bold mt-2">
            Projected Delay: {delay} day(s)
          </p>
        )}
      </div>
    </div>
  );
}

