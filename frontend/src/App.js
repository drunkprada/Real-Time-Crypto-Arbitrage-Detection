import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function RateTable({ rates, currencies, previousRates, activeCycle }) {
  const [changedCells, setChangedCells] = useState({});
  const timeoutRefs = useRef({});

  useEffect(() => {
    if (!rates || !previousRates || !currencies) return;

    const newChanges = {};

    currencies.forEach(from => {
      currencies.forEach(to => {
        if (from === to) return;

        const currentRate = rates[from]?.[to];
        const prevRate = previousRates[from]?.[to];

        if (currentRate !== undefined && prevRate !== undefined) {
          if (Math.abs(currentRate - prevRate) > 0.0000001) {
            const key = `${from}-${to}`;
            newChanges[key] = true;

            if (timeoutRefs.current[key]) {
              clearTimeout(timeoutRefs.current[key]);
            }

            timeoutRefs.current[key] = setTimeout(() => {
              setChangedCells(prev => {
                const updated = { ...prev };
                delete updated[key];
                return updated;
              });
            }, 400);
          }
        }
      });
    });

    if (Object.keys(newChanges).length > 0) {
      setChangedCells(prev => ({ ...prev, ...newChanges }));
    }
  }, [rates, previousRates, currencies]);

  useEffect(() => {
    return () => {
      Object.values(timeoutRefs.current).forEach(clearTimeout);
    };
  }, []);

  const isInArbitrageCycle = (from, to) => {
    if (!activeCycle || activeCycle.length < 2) return false;

    for (let i = 0; i < activeCycle.length - 1; i++) {
      if (activeCycle[i] === from && activeCycle[i + 1] === to) {
        return true;
      }
    }
    if (activeCycle[activeCycle.length - 1] === from && activeCycle[0] === to) {
      return true;
    }
    return false;
  };

  const formatRate = (rate) => {
    if (rate === undefined || rate === null) return '-';
    if (rate >= 1000) return rate.toFixed(2);
    if (rate >= 1) return rate.toFixed(4);
    if (rate >= 0.01) return rate.toFixed(6);
    return rate.toExponential(4);
  };

  if (!rates || !currencies) {
    return (
      <div className="panel">
        <h2 className="panel-header">Live Exchange Rates</h2>
        <div className="empty-state">Waiting for data...</div>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2 className="panel-header">Live Exchange Rates</h2>
      <table className="rate-table">
        <thead>
          <tr>
            <th></th>
            {currencies.map(currency => (
              <th key={currency}>{currency}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currencies.map(from => (
            <tr key={from}>
              <td>{from}</td>
              {currencies.map(to => {
                const key = `${from}-${to}`;
                const rate = rates[from]?.[to];
                const isChanged = changedCells[key];
                const isSelf = from === to;
                const isArbitrage = isInArbitrageCycle(from, to);

                let className = '';
                if (isSelf) className = 'self';
                else if (isChanged) className = 'changed';
                if (isArbitrage) className += ' arbitrage-cell';

                return (
                  <td key={to} className={className.trim()}>
                    {isSelf ? '1.0000' : formatRate(rate)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ArbitragePanel({ opportunities }) {
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

function AlgorithmLog({ logs }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (!logs || logs.length === 0) {
    return (
      <div className="panel">
        <h2 className="panel-header">Algorithm Log</h2>
        <div className="empty-state">No algorithm runs yet...</div>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2 className="panel-header">Algorithm Log</h2>
      <div className="algorithm-log" ref={scrollRef}>
        {logs.map((log, index) => (
          <div key={index} className="log-entry">
            <span className="log-timestamp">{log.timestamp}</span>
            <span className="log-edges">{log.edges_checked} edges</span>
            {log.cycle_found ? (
              <span className="log-cycle-found">CYCLE FOUND</span>
            ) : (
              <span className="log-cycle-not-found">no cycle</span>
            )}
            {log.relaxed_edges && log.relaxed_edges.length > 0 && (
              <span className="log-relaxed">
                relaxed: {log.relaxed_edges.slice(0, 5).join(', ')}
                {log.relaxed_edges.length > 5 && ` +${log.relaxed_edges.length - 5} more`}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

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
    return path.join('->');
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

function App() {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);
  const [previousRates, setPreviousRates] = useState({});
  const wsRef = useRef(null);

  useEffect(() => {
    const connectWebSocket = () => {
      // Dynamically use the current hostname so this works perfectly on local networks or simple port forwards
      const host = window.location.hostname;
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${wsProtocol}//${host}:8000/ws/live`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
      };

      ws.onmessage = (event) => {
        const newData = JSON.parse(event.data);

        // Store previous rates for change detection
        setData(prevData => {
          if (prevData?.rates) {
            setPreviousRates(prevData.rates);
          }
          return newData;
        });
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Cryptocurrency Arbitrage Detection</h1>
        <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? 'Live' : 'Disconnected'}
        </div>
      </header>

      <main className="dashboard">
        <div className="dashboard-columns">
          <div className="dashboard-column left-column">
            <RateTable
              rates={data?.rates}
              currencies={data?.currencies}
              previousRates={previousRates}
              activeCycle={data?.arbitrage?.active_cycle || []}
            />
            <AlgorithmLog
              logs={data?.algorithm_log || []}
            />
          </div>
          <div className="dashboard-column right-column">
            <ArbitragePanel
              opportunities={data?.arbitrage?.opportunities || []}
            />
            <PortfolioTracker
              portfolio={data?.portfolio}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
