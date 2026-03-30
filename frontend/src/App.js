import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// ─── Rate Table ──────────────────────────────────────────────────────────────

function RateTable({ rates, currencies, previousRates, activeCycle }) {
  const [changedCells, setChangedCells] = useState({});
  const [upCells,      setUpCells]      = useState({});
  const timeoutRefs = useRef({});

  useEffect(() => {
    if (!rates || !previousRates || !currencies) return;
    const chg = {}, ups = {};
    currencies.forEach(from => {
      currencies.forEach(to => {
        if (from === to) return;
        const cur  = rates[from]?.[to];
        const prev = previousRates[from]?.[to];
        if (cur !== undefined && prev !== undefined && Math.abs(cur - prev) > 0.0000001) {
          const k = `${from}-${to}`;
          chg[k] = true;
          if (cur > prev) ups[k] = true;
          if (timeoutRefs.current[k]) clearTimeout(timeoutRefs.current[k]);
          timeoutRefs.current[k] = setTimeout(() => {
            setChangedCells(p => { const u = { ...p }; delete u[k]; return u; });
            setUpCells(p      => { const u = { ...p }; delete u[k]; return u; });
          }, 900);
        }
      });
    });
    if (Object.keys(chg).length) {
      setChangedCells(p => ({ ...p, ...chg }));
      setUpCells(p      => ({ ...p, ...ups }));
    }
  }, [rates, previousRates, currencies]);

  useEffect(() => () => Object.values(timeoutRefs.current).forEach(clearTimeout), []);

  // Returns position index in the arbitrage cycle, or -1 if not part of it.
  // Used to stagger the traveling-wave animation via CSS --step variable.
  const getCycleStep = (from, to) => {
    if (!activeCycle || activeCycle.length < 2) return -1;
    for (let i = 0; i < activeCycle.length - 1; i++) {
      if (activeCycle[i] === from && activeCycle[i + 1] === to) return i;
    }
    if (activeCycle[activeCycle.length - 1] === from && activeCycle[0] === to)
      return activeCycle.length - 1;
    return -1;
  };

  const fmt = (r) => {
    if (r == null)   return '—';
    if (r >= 1000)   return r.toFixed(2);
    if (r >= 1)      return r.toFixed(4);
    if (r >= 0.01)   return r.toFixed(6);
    return r.toExponential(3);
  };

  if (!rates || !currencies) return (
    <div className="panel panel-rates">
      <div className="panel-head">
        <span className="panel-label">EXCHANGE RATES</span>
      </div>
      <div className="empty-state">Awaiting feed…</div>
    </div>
  );

  return (
    <div className="panel panel-rates">
      <div className="panel-head">
        <span className="panel-label">EXCHANGE RATES</span>
        <span className="panel-sub">{currencies.length}×{currencies.length} matrix</span>
      </div>
      <div className="rate-scroll">
        <table className="rtable">
          <thead>
            <tr>
              <th></th>
              {currencies.map(c => <th key={c}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {currencies.map(from => (
              <tr key={from}>
                <td className="rh">{from}</td>
                {currencies.map(to => {
                  const k    = `${from}-${to}`;
                  const self = from === to;
                  const step = getCycleStep(from, to);
                  const arb  = step >= 0;
                  const cls  = self ? 'cs'
                    : arb ? 'ca'
                    : changedCells[k] ? (upCells[k] ? 'cu' : 'cd')
                    : '';
                  return (
                    <td key={to} className={cls}
                      style={arb ? { '--step': step } : undefined}>
                      {self ? '1.0000' : fmt(rates[from]?.[to])}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Arbitrage Panel ─────────────────────────────────────────────────────────

function ArbitragePanel({ opportunities }) {
  const pct = (v) => v == null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(4)}%`;

  return (
    <div className="panel panel-arb">
      <div className="panel-head">
        <span className="panel-label">ARB SIGNALS</span>
        <span className={`panel-sub ${opportunities?.length ? 'accent' : ''}`}>
          {opportunities?.length ? `${opportunities.length} cycle${opportunities.length > 1 ? 's' : ''}` : 'Bellman-Ford'}
        </span>
      </div>
      <div className="arb-scroll">
        {!opportunities?.length
          ? <div className="empty-state">No cycles detected</div>
          : opportunities.map((opp, i) => {
              const ok = opp.net_profit_pct > 0;
              return (
                <div key={i} className={`arb-card ${ok ? 'ok' : 'bad'}`}>
                  <div className="chain">
                    {opp.path.map((coin, idx) => (
                      <React.Fragment key={idx}>
                        <span className="node">{coin}</span>
                        {idx < opp.path.length - 1 && <span className="edge">→</span>}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="arb-row">
                    <div className="arb-col">
                      <span className="ak">GROSS</span>
                      <span className="av">{pct(opp.gross_profit_pct)}</span>
                    </div>
                    <div className="arb-col">
                      <span className="ak">FEES</span>
                      <span className="av dim">−{opp.fee_cost_pct?.toFixed(4)}%</span>
                    </div>
                    <div className="arb-col">
                      <span className="ak">NET</span>
                      <span className={`av ${ok ? 'g' : 'r'}`}>{pct(opp.net_profit_pct)}</span>
                    </div>
                  </div>
                </div>
              );
            })
        }
      </div>
    </div>
  );
}

// ─── Algorithm Log ───────────────────────────────────────────────────────────

function AlgorithmLog({ logs }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [logs]);

  return (
    <div className="panel panel-algo">
      <div className="panel-head">
        <span className="panel-label">ALGORITHM LOG</span>
        <span className="panel-sub">{logs?.length ?? 0} runs</span>
      </div>
      <div className="algo-log" ref={ref}>
        {!logs?.length
          ? <div className="empty-state">No runs yet…</div>
          : logs.map((log, i) => (
              <div key={i} className="log-row">
                <span className="lts">{log.timestamp}</span>
                <span className="le">{log.edges_checked}e</span>
                {log.cycle_found
                  ? <span className="lbadge lhit">● CYCLE</span>
                  : <span className="lbadge lmiss">○</span>
                }
                {log.relaxed_edges?.length > 0 && (
                  <span className="lr">
                    {log.relaxed_edges.slice(0, 4).join(' ')}
                    {log.relaxed_edges.length > 4 && ` +${log.relaxed_edges.length - 4}`}
                  </span>
                )}
              </div>
            ))
        }
      </div>
    </div>
  );
}

// ─── Portfolio ───────────────────────────────────────────────────────────────

function PortfolioTracker({ portfolio }) {
  const usd = (v) => v == null ? '$0.00'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
  const pct = (v) => v == null ? '0.00%' : `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;

  return (
    <div className="panel panel-port">
      <div className="panel-head">
        <span className="panel-label">PORTFOLIO</span>
        <span className="panel-sub">sim $10k</span>
      </div>
      {!portfolio
        ? <div className="empty-state">Awaiting data…</div>
        : <>
            <div className="p-balance">{usd(portfolio.current_balance)}</div>
            <div className={`p-pnl ${portfolio.total_pnl_usd >= 0 ? 'g' : 'r'}`}>
              {usd(portfolio.total_pnl_usd)}&ensp;/&ensp;{pct(portfolio.total_pnl_pct)}
            </div>

            <div className="p-kpis">
              <div className="kpi">
                <span className="kv">{portfolio.total_trades}</span>
                <span className="kk">TRADES</span>
              </div>
              <div className="kd" />
              <div className="kpi">
                <span className="kv">{portfolio.win_rate}%</span>
                <span className="kk">WIN RATE</span>
              </div>
              <div className="kd" />
              <div className="kpi">
                <span className="kv">{portfolio.winning_trades}</span>
                <span className="kk">WINS</span>
              </div>
            </div>

            {portfolio.recent_trades?.length > 0 && (
              <>
                <div className="t-hd">EXECUTIONS</div>
                <div className="t-list">
                  {portfolio.recent_trades.slice().reverse().map((t, i) => {
                    const ts = t.timestamp?.includes('T')
                      ? t.timestamp.split('T')[1]?.slice(0, 8)
                      : t.timestamp;
                    return (
                      <div key={i} className="t-row">
                        <span className="tt">{ts}</span>
                        <span className="tp">{t.path?.join('→')}</span>
                        <span className={`tpnl ${t.usd_gained >= 0 ? 'g' : 'r'}`}>
                          {t.usd_gained >= 0 ? '+' : ''}{usd(t.usd_gained)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
      }
    </div>
  );
}

// ─── App Root ────────────────────────────────────────────────────────────────

function App() {
  const [data,      setData]      = useState(null);
  const [connected, setConnected] = useState(false);
  const [prevRates, setPrevRates] = useState({});
  const [ticks,     setTicks]     = useState(0);
  const wsRef = useRef(null);

  useEffect(() => {
    const connect = () => {
      const host  = window.location.hostname;
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws    = new WebSocket(`${proto}//${host}:8000/ws/live`);
      wsRef.current = ws;
      ws.onopen = () => {
        // Reset portfolio at the start of every new session
        fetch(`http://${host}:8000/api/portfolio/reset`, { method: 'POST' })
          .catch(() => {}); // silently ignore if backend not ready
        setConnected(true);
      };
      ws.onmessage = (e) => {
        const next = JSON.parse(e.data);
        setData(prev => { if (prev?.rates) setPrevRates(prev.rates); return next; });
        setTicks(n => n + 1);
      };
      ws.onclose = () => { setConnected(false); setTimeout(connect, 3000); };
      ws.onerror = () => ws.close();
    };
    connect();
    return () => wsRef.current?.close();
  }, []);

  const currencies = data?.currencies || [];
  const now = data?.timestamp
    ? new Date(data.timestamp).toLocaleTimeString('en-US', { hour12: false })
    : '--:--:--';

  return (
    <div className="app">
      <header className="hdr">
        <div className="hdr-amber-bar" />
        <div className="hdr-inner">
          <div className="hdr-l">
            <span className="hdr-mark">◈</span>
            <div>
              <h1 className="hdr-title">CRYPTO ARBITRAGE</h1>
              <p className="hdr-sub">Real-Time Bellman-Ford Detection System</p>
            </div>
          </div>
          <div className="hdr-r">
            <div className="hdr-ticks">
              <span className="tick-n">{ticks}</span>
              <span className="tick-k">TICKS</span>
            </div>
            <div className="hdr-sep" />
            <div className={`hdr-status ${connected ? 'on' : 'off'}`}>
              <span className="sdot" />
              <span>{connected ? 'LIVE' : 'OFFLINE'}</span>
            </div>
            <div className="hdr-sep" />
            <div className="hdr-clock">{now}</div>
          </div>
        </div>
        <div className="hdr-rule" />
      </header>

      <main className="mgrid">
        <RateTable
          rates={data?.rates}
          currencies={currencies}
          previousRates={prevRates}
          activeCycle={data?.arbitrage?.active_cycle || []}
        />
        <AlgorithmLog logs={data?.algorithm_log || []} />
        <ArbitragePanel opportunities={data?.arbitrage?.opportunities || []} />
        <PortfolioTracker portfolio={data?.portfolio} />
      </main>
    </div>
  );
}

export default App;
