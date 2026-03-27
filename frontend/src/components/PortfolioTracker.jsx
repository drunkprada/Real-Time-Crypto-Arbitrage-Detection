import React from "react";

export default function PortfolioTracker({ portfolio }) {
  const fmtUSD = v =>
    v === undefined || v === null
      ? "$0.00"
      : new Intl.NumberFormat("en-US", {
          style: "currency", currency: "USD",
          minimumFractionDigits: 2, maximumFractionDigits: 2,
        }).format(v);

  const fmtPct = v =>
    v === undefined || v === null
      ? "0.00%"
      : `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

  const fmtPath = path =>
    !path?.length ? "—" : path.join(" → ");

  if (!portfolio) {
    return (
      <div className="panel panel-portfolio">
        <div className="panel-header">
          Portfolio Tracker
          <span className="panel-tag neutral">Connecting…</span>
        </div>
        <div className="empty-state">Waiting for data…</div>
      </div>
    );
  }

  const isPnlPos = portfolio.total_pnl_usd >= 0;

  return (
    <div className="panel panel-portfolio">
      <div className="panel-header">
        Portfolio Tracker
        <span className={`panel-tag ${isPnlPos ? "accent" : "danger"}`}>
          {fmtPct(portfolio.total_pnl_pct)}
        </span>
      </div>

      {/* Balance */}
      <div className="portfolio-balance">
        {fmtUSD(portfolio.current_balance)}
      </div>

      {/* P&L pill */}
      <div className={`portfolio-pnl ${isPnlPos ? "profit-positive" : "profit-negative"}`}>
        {fmtUSD(portfolio.total_pnl_usd)}&nbsp;&nbsp;{fmtPct(portfolio.total_pnl_pct)}
      </div>

      {/* Stats grid */}
      <div className="portfolio-stats">
        <div className="stat-item">
          <span className="stat-label">Trades</span>
          <span className="stat-value">{portfolio.total_trades ?? 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Win Rate</span>
          <span className="stat-value">{portfolio.win_rate ?? 0}%</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Wins</span>
          <span className="stat-value">{portfolio.winning_trades ?? 0}</span>
        </div>
      </div>

      {/* Recent trades */}
      {portfolio.recent_trades?.length > 0 && (
        <div className="trades-section">
          <div className="trades-title">Recent Trades</div>
          <div className="trades-scroll-container">
            <table className="trades-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Path</th>
                  <th style={{ textAlign: "right" }}>P / L</th>
                </tr>
              </thead>
              <tbody>
                {[...portfolio.recent_trades].reverse().map((trade, i) => (
                  <tr key={i}>
                    <td style={{ color: "var(--t3)", whiteSpace: "nowrap" }}>
                      {trade.timestamp}
                    </td>
                    <td style={{ color: "var(--t2)", fontSize: 10 }}>
                      {fmtPath(trade.path)}
                    </td>
                    <td className={trade.usd_gained >= 0 ? "profit" : "loss"}>
                      {trade.usd_gained >= 0 ? "+" : ""}
                      {fmtUSD(trade.usd_gained)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}