import React, { useState, useEffect, useRef } from "react";

export default function ArbitragePanel({ opportunities }) {
  const formatPath = (path) => {
    if (!path || path.length === 0) return '';
    return path.join(' -> ');
  };

  const formatPercent = (value) => {
    if (value === undefined || value === null) return '-';
    return `${value >= 0 ? '+' : ''}${value.toFixed(4)}%`;
  };

  if (!opportunities || opportunities.length === 0) {
    return (
      <div className="panel">
        <h2 className="panel-header">Arbitrage Opportunities</h2>
        <div className="no-opportunities">No opportunities detected</div>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2 className="panel-header">Arbitrage Opportunities</h2>
      <ul className="arbitrage-list">
        {opportunities.map((opp, index) => {
          const isProfitable = opp.net_profit_pct > 0;

          return (
            <li key={index} className="arbitrage-item">
              <div className="arbitrage-path">
                {formatPath(opp.path)}
              </div>
              <div className="arbitrage-details">
                <span>
                  Gross: <span className={isProfitable ? 'profit-positive' : ''}>
                    {formatPercent(opp.gross_profit_pct)}
                  </span>
                </span>
                <span>
                  Fees: <span className="profit-negative">
                    -{opp.fee_cost_pct?.toFixed(4)}%
                  </span>
                </span>
                <span>
                  Net: <span className={isProfitable ? 'profit-positive' : 'profit-negative'}>
                    {formatPercent(opp.net_profit_pct)}
                  </span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}