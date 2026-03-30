import React from "react";

export default function PortfolioTracker({ portfolio }) {
  const fmtUSD = v =>
    v == null ? "$0.00"
    : new Intl.NumberFormat("en-US", {
        style: "currency", currency: "USD",
        minimumFractionDigits: 2, maximumFractionDigits: 2,
      }).format(v);

  const fmtPct = v =>
    v == null ? "0.00%" : `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

  if (!portfolio) {
    return (
      <div className="panel">
        <div className="panel-header">Portfolio</div>
        <div className="empty-state">Awaiting data…</div>
      </div>
    );
  }

  const pos = portfolio.total_pnl_usd >= 0;

  return (
    <div className="panel">
      <div className="panel-header">
        Portfolio
        <span className={`panel-tag ${pos ? "go" : "signal"}`}>
          {fmtPct(portfolio.total_pnl_pct)}
        </span>
      </div>

      <div className="portfolio-balance">
        {fmtUSD(portfolio.current_balance)}
      </div>

      <div className={`portfolio-pnl ${pos ? "profit-positive" : "profit-negative"}`}>
        {fmtUSD(portfolio.total_pnl_usd)} &nbsp; {fmtPct(portfolio.total_pnl_pct)}
      </div>

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
                    <td style={{ color: "var(--ink-4)", whiteSpace: "nowrap" }}>
                      {trade.timestamp}
                    </td>
                    <td style={{ color: "var(--ink-3)", fontSize: 9 }}>
                      {trade.path?.join(" → ")}
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