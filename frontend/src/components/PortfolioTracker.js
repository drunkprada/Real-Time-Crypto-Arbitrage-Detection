import React from 'react';

function PortfolioTracker({ portfolio }) {
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value) => {
    if (value === undefined || value === null) return '0.00%';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatPath = (path) => {
    if (!path || path.length === 0) return '';
    return path.join('\u2192');
  };

  if (!portfolio) {
    return (
      <div className="panel">
        <h2 className="panel-header">Portfolio Tracker</h2>
        <div className="empty-state">Waiting for data...</div>
      </div>
    );
  }

  const isPnlPositive = portfolio.total_pnl_usd >= 0;

  return (
    <div className="panel">
      <h2 className="panel-header">Portfolio Tracker</h2>

      <div className="portfolio-balance">
        {formatCurrency(portfolio.current_balance)}
      </div>

      <div className={`portfolio-pnl ${isPnlPositive ? 'profit-positive' : 'profit-negative'}`}>
        {formatCurrency(portfolio.total_pnl_usd)} ({formatPercent(portfolio.total_pnl_pct)})
      </div>

      <div className="portfolio-stats">
        <div className="stat-item">
          <span className="stat-value">{portfolio.total_trades}</span> trades
        </div>
        <div className="stat-item">
          <span className="stat-value">{portfolio.win_rate}%</span> win rate
        </div>
        <div className="stat-item">
          <span className="stat-value">{portfolio.winning_trades}</span> wins
        </div>
      </div>

      {portfolio.recent_trades && portfolio.recent_trades.length > 0 && (
        <div className="trades-section">
          <div className="trades-title">Recent Trades</div>
          <div className="trades-scroll-container" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <table className="trades-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Path</th>
                  <th>P/L</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.recent_trades.slice().reverse().map((trade, index) => (
                  <tr key={index}>
                    <td>{trade.timestamp}</td>
                    <td>{formatPath(trade.path)}</td>
                    <td className={trade.usd_gained >= 0 ? 'profit' : 'loss'}>
                      {trade.usd_gained >= 0 ? '+' : ''}{formatCurrency(trade.usd_gained)}
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

export default PortfolioTracker;
