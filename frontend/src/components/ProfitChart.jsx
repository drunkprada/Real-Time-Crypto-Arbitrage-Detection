import React from "react";
import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine
} from "recharts";

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const v   = payload[0].value;
  const pos = v >= 0;
  return (
    <div style={{
      background: "#f2efe8",
      border: "1px solid rgba(15,14,12,0.35)",
      padding: "5px 10px",
      fontFamily: "'Geist Mono', monospace",
      fontSize: 10,
      lineHeight: 1.6,
      color: "#3a3830",
    }}>
      <div style={{ color: "#b8b2a4", marginBottom: 1 }}>{label}</div>
      <div style={{ color: pos ? "#1a6b3c" : "#c8402a", fontWeight: 500 }}>
        {pos ? "+" : ""}${v.toFixed(2)}
      </div>
    </div>
  );
};

export default function ProfitChart({ history }) {
  const latest = history.at(-1)?.pnl ?? 0;
  const isPos  = latest >= 0;

  if (!history?.length) {
    return (
      <div className="panel">
        <div className="panel-header">
          P&L Over Time
          <span className="panel-tag">No data</span>
        </div>
        <div className="empty-state">Awaiting trades…</div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-header">
        P&L Over Time
        <span className={`panel-tag ${isPos ? "go" : "signal"}`}>
          {isPos ? "+" : ""}${latest.toFixed(2)}
        </span>
      </div>
      <div className="profit-chart-inner">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="pnlFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={isPos ? "#1a6b3c" : "#c8402a"} stopOpacity={0.12} />
                <stop offset="100%" stopColor={isPos ? "#1a6b3c" : "#c8402a"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="2 4"
              stroke="rgba(15,14,12,0.07)"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 8, fill: "#b8b2a4", fontFamily: "'Geist Mono', monospace" }}
              tickLine={false}
              axisLine={{ stroke: "rgba(15,14,12,0.15)" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 8, fill: "#b8b2a4", fontFamily: "'Geist Mono', monospace" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `$${v}`}
            />
            <ReferenceLine y={0} stroke="rgba(15,14,12,0.2)" strokeDasharray="4 4" />
            <Tooltip content={<Tip />} />
            <Area
              type="monotone"
              dataKey="pnl"
              stroke={isPos ? "#1a6b3c" : "#c8402a"}
              strokeWidth={1.5}
              fill="url(#pnlFill)"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0, fill: isPos ? "#1a6b3c" : "#c8402a" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}