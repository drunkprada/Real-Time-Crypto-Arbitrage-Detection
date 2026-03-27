import React, { useState, useEffect } from "react";
import "./App.css";

import RateTable      from "./components/RateTable";
import ArbitragePanel from "./components/ArbitragePanel";
import AlgorithmLog   from "./components/AlgorithmLog";
import PortfolioTracker from "./components/PortfolioTracker";
import ProfitChart    from "./components/ProfitChart";
import useWebSocket   from "./hooks/useWebSocket";

function App() {
  const [previousRates, setPreviousRates] = useState({});
  const [profitHistory, setProfitHistory]  = useState([]);

  const host     = window.location.hostname;
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl    = `${protocol}//${host}:8000/ws/live`;

  const { data, connected } = useWebSocket(wsUrl);

  useEffect(() => {
    if (data?.rates) setPreviousRates(data.rates);
  }, [data]);

  useEffect(() => {
    if (data?.portfolio?.total_pnl_usd === undefined) return;
    const now = new Date();
    const label = now.toLocaleTimeString("en-GB");
    setProfitHistory(prev => {
      const next = [...prev, {
        time: label,
        pnl: parseFloat(data.portfolio.total_pnl_usd.toFixed(2))
      }];
      return next.slice(-80);
    });
  }, [data?.portfolio?.total_pnl_usd]);

  const now = new Date().toLocaleTimeString("en-GB");

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <span className="header-dot" />
          Cryptocurrency Arbitrage Detection
        </h1>
        <div className="header-right">
          <span className="header-meta">BF · O(V×E) · 6 assets · 30 pairs</span>
          <div className={`connection-status ${connected ? "connected" : "disconnected"}`}>
            {connected ? "Live" : "Offline"}
          </div>
        </div>
      </header>

      <main className="dashboard">
        <div className="dashboard-columns">

          <div className="left-column">
            <RateTable
              rates={data?.rates}
              currencies={data?.currencies}
              previousRates={previousRates}
              activeCycle={data?.arbitrage?.active_cycle || []}
            />
            <AlgorithmLog logs={data?.algorithm_log || []} />
            <ProfitChart history={profitHistory} />
          </div>

          <div className="right-column">
            <ArbitragePanel opportunities={data?.arbitrage?.opportunities || []} />
            <PortfolioTracker portfolio={data?.portfolio} />
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;