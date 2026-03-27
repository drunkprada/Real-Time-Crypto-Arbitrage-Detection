import React from "react";

export default function ArbitragePanel({ opportunities }) {
  const formatPath    = path => path?.join(" → ") ?? "";
  const formatPercent = v => v === undefined || v === null
    ? "—"
    : `${v >= 0 ? "+" : ""}${v.toFixed(4)}%`;

  return (
    <div className="panel panel-arb">
      <div className="panel-header">
        Arbitrage Opportunities
        <span className={`panel-tag ${opportunities?.length ? "danger" : "neutral"}`}>
          {opportunities?.length
            ? `${opportunities.length} found`
            : "scanning"}
        </span>
      </div>

      {!opportunities || opportunities.length === 0 ? (
        <div className="no-opportunities">
          No profitable cycles detected
          <span>Bellman-Ford scanning every tick</span>
        </div>
      ) : (
        <ul className="arbitrage-list">
          {opportunities.map((opp, i) => {
            const pos = opp.net_profit_pct > 0;
            return (
              <li key={i} className="arbitrage-item">
                <div className="arbitrage-path">{formatPath(opp.path)}</div>
                <div className="arbitrage-details">
                  <span>
                    <strong>Gross</strong>
                    <span className={pos ? "profit-positive" : ""}>
                      {formatPercent(opp.gross_profit_pct)}
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
                      {formatPercent(opp.net_profit_pct)}
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