import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

export default function ProfitChart({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="panel">
        <h2 className="panel-header">Profit Over Time</h2>
        <div className="empty-state">No data yet...</div>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2 className="panel-header">Profit Over Time</h2>

      <div style={{ width: "100%", height: 250 }}>
        <ResponsiveContainer>
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="time" />
            <YAxis />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="pnl"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}