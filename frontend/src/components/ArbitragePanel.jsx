import React from "react";

export default function ArbitragePanel({ opportunities }) {
  const fmtPct = v =>
    v == null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(4)}%`;

  return (
    <div className="panel">
      <div className="panel-header">
        Arbitrage
        <span className={`panel-tag ${opportunities?.length ? "signal" : ""}`}>
          {opportunities?.length ? `${opportunities.length} active` : "scanning"}
        </span>
      </div>

      {!opportunities?.length ? (
        <div className="no-opportunities">
          No cycles detected
          <span>Running continuously</span>
        </div>
      ) : (
        <ul className="arbitrage-list">
          {opportunities.map((opp, i) => {
            const pos = opp.net_profit_pct > 0;
            return (
              <li key={i} className="arbitrage-item">
                <div className="arbitrage-path">
                  {opp.path?.join("  →  ")}
                </div>
                <div className="arbitrage-details">
                  <span>
                    <strong>Gross</strong>
                    <span className={pos ? "profit-positive" : ""}>
                      {fmtPct(opp.gross_profit_pct)}
                    </span>
                  </span>
                  <span>
                    <strong>Fees</strong>
                    <span className="profit-negative">
                      -{opp.fee_cost_pct?.toFixed(4)}%
                    </span>
                  </span>
                  <span>
                    <strong>Net</strong>
                    <span className={pos ? "profit-positive" : "profit-negative"}>
                      {fmtPct(opp.net_profit_pct)}
                    </span>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}