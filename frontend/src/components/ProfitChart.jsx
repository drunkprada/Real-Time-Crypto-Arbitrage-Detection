import React from "react";
import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  const pos = val >= 0;
  return (
    <div style={{
      background: "#1a1c20",
      border: "1px solid #2a2d35",
      borderRadius: 5,
      padding: "6px 10px",
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 10,
      lineHeight: 1.6,
    }}>
      <div style={{ color: "#484d57", marginBottom: 2 }}>{label}</div>
      <div style={{ color: pos ? "#00d4aa" : "#ff4d6a", fontWeight: 600 }}>
        {pos ? "+" : ""}${val.toFixed(2)}
      </div>
    </div>
  );
};

export default function ProfitChart({ history }) {
  const latest = history.at(-1)?.pnl ?? 0;
  const isPos  = latest >= 0;
  const tag    = `${isPos ? "+" : ""}$${latest.toFixed(2)}`;

  if (!history || history.length === 0) {
    return (
      <div className="panel panel-chart">
        <div className="panel-header">
          Profit Over Time
          <span className="panel-tag neutral">Awaiting data</span>
        </div>
        <div className="empty-state">No data yet…</div>
      </div>
    );
  }

  return (
    <div className="panel panel-chart">
      <div className="panel-header">
        Profit Over Time
        <span className={`panel-tag ${isPos ? "accent" : "danger"}`}>{tag}</span>
      </div>
      <div className="profit-chart-inner">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history} margin={{ top: 4, right: 2, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={isPos ? "#00d4aa" : "#ff4d6a"} stopOpacity={0.18} />
                <stop offset="95%" stopColor={isPos ? "#00d4aa" : "#ff4d6a"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 8.5, fill: "#484d57", fontFamily: "'IBM Plex Mono', monospace" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 8.5, fill: "#484d57", fontFamily: "'IBM Plex Mono', monospace" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `$${v}`}
            />
            <ReferenceLine y={0} stroke="#2a2d35" strokeDasharray="3 3" />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="pnl"
              stroke={isPos ? "#00d4aa" : "#ff4d6a"}
              strokeWidth={1.5}
              fill="url(#pnlGrad)"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0, fill: isPos ? "#00d4aa" : "#ff4d6a" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}