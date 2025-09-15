import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
} from "recharts";

export default function BurndownChart({ burndownData, initiative }) {
  const data = useMemo(() => burndownData || [], [burndownData]);

  // Escala Y consistente para las barras (horas)
  const yMaxHours = useMemo(() => {
    let max = 0;
    for (const d of data) {
      const stacked =
        (Number(d.CompletedHours) || 0) +
        (Number(d.RemainingHours) || 0) +
        (Number(d.DelayHours) || 0);
      max = Math.max(max, stacked, Number(d.CapacityHoursUntilDue) || 0);
    }
    return Math.ceil(max * 1.1); // +10% de aire
  }, [data]);

  // Escala Y para días
  const yMaxDays = useMemo(() => {
    let max = 0;
    for (const d of data) {
      max = Math.max(max, Number(d.CapacityDaysUntilDue) || 0);
    }
    return Math.ceil(max * 1.1);
  }, [data]);

  if (data.length === 0) return null;

    return (
      <div className="card bg-white text-dark mt-4">
      <div className="card-body">
        <h5 className="card-title mb-4">
          Avance por HU — {initiative || "General"}
        </h5>
        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="Title" />

            {/* Eje izquierdo: horas */}
            <YAxis
              yAxisId="left"
              orientation="left"
              domain={[0, yMaxHours]}
              allowDecimals={false}
              label={{ value: "Horas", angle: -90, position: "insideLeft" }}
            />

            {/* Eje derecho: días */}
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, yMaxDays]}
              allowDecimals={false}
              label={{ value: "Días", angle: -90, position: "insideRight" }}
            />

          <Tooltip
  formatter={(value, name, props) => {
    if (name.includes("Retraso")) {
      const delayDays = props.payload.DelayDays || 0;
      return [`${value} hrs (${delayDays} días)`, name];
    }
    if (name.includes("días")) return [`${value} días`, name];
    return [`${value} hrs`, name];
  }}
  labelFormatter={(label) => `HU: ${label}`}
/>

            <Legend />

            {/* Barras apiladas en horas */}
            <Bar
              yAxisId="left"
              dataKey="CompletedHours"
              stackId="a"
              fill="#198754"
              name="Completado (hrs)"
            />
            <Bar
              yAxisId="left"
              dataKey="RemainingHours"
              stackId="a"
              fill="#fd7e14"
              name="Restante (hrs)"
            />
            <Bar
              yAxisId="left"
              dataKey="DelayHours"
              stackId="a"
              fill="#dc3545"
              name="Retraso (hrs)"
            />

            {/* Línea azul: capacidad planeada en días */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="CapacityDaysUntilDue"
              stroke="#0d6efd"
              strokeWidth={3}
              strokeDasharray="6 4"
              dot={false}
              name="Capacidad planeada (días)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
