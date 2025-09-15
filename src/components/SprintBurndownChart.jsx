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

export default function SprintBurndownChart({ tasks, sprintDays }) {
  const { points, delay } = useMemo(() => {
    if (!tasks || tasks.length === 0) return { points: [], delay: 0 };

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
    const remaining = Math.max(totalOriginal - totalCompleted, 0);
    const projectedDays = burnRate > 0 ? Math.ceil(remaining / burnRate) : 0;
    const projectedTotalDays = daysElapsed + projectedDays;
    const maxDays = Math.max(totalDays, projectedTotalDays, daysElapsed);

    const pts = [];
    for (let i = 0; i <= maxDays; i++) {
      const date = addBusinessDays(startDate, i);
      const ideal =
        i <= totalDays
          ? totalOriginal - (totalOriginal / totalDays) * i
          : null;
      const projected =
        burnRate > 0 ? Math.max(totalOriginal - burnRate * i, 0) : null;
      pts.push({ day: date.toLocaleDateString(), ideal, projected });
    }

    const delayDays = Math.max(0, projectedTotalDays - totalDays);
    return { points: pts, delay: delayDays };
  }, [tasks, sprintDays]);

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
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="ideal" stroke="#0d6efd" name="Ideal Burndown" />
            <Line type="monotone" dataKey="projected" stroke="#dc3545" name="Projected Burndown" />
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

