import React, { useState, useEffect } from "react";
import "./App.css";

import RateTable        from "./components/RateTable";
import ArbitragePanel   from "./components/ArbitragePanel";
import AlgorithmLog     from "./components/AlgorithmLog";
import PortfolioTracker from "./components/PortfolioTracker";
import ProfitChart      from "./components/ProfitChart";
import useWebSocket     from "./hooks/useWebSocket";

function useClock() {
  const [time, setTime] = useState(new Date().toLocaleTimeString("en-GB"));

  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString("en-GB"));
    }, 1000);

    return () => clearInterval(id);
  }, []);

  return time;
}

export default function App() {
  const [previousRates, setPreviousRates] = useState({});
  const [profitHistory, setProfitHistory] = useState([]);

  const time = useClock();

  // ✅ NEW HOOK (no URL needed now)
  const { data, connected, loading } = useWebSocket();

  // track previous rates
  useEffect(() => {
    if (data?.rates) {
      setPreviousRates(data.rates);
    }
  }, [data]);

  // track pnl history
  useEffect(() => {
    if (data?.portfolio?.total_pnl_usd === undefined) return;

    const label = new Date().toLocaleTimeString("en-GB");

    setProfitHistory(prev =>
      [
        ...prev,
        {
          time: label,
          pnl: parseFloat(data.portfolio.total_pnl_usd.toFixed(2)),
        },
      ].slice(-80)
    );
  }, [data?.portfolio?.total_pnl_usd]);

  // 🔥 LOADING SCREEN (important for Render cold start)
  if (loading) {
    return (
      <div className="app" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <h1 style={{ color: "white" }}>
          Connecting to live data...
        </h1>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          Crypto Arbitrage
          <span className="header-ticker">
            Bellman-Ford · 6 assets · 30 pairs
          </span>
        </h1>

        <div className="header-right">
          <span className="header-time">{time}</span>

          <div className={`connection-status ${connected ? "connected" : "disconnected"}`}>
            {connected ? "Live Feed" : "Reconnecting..."}
          </div>
        </div>
      </header>

      <main className="dashboard">
        <div className="dashboard-columns">

          {/* LEFT SIDE */}
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

          {/* RIGHT SIDE */}
          <div className="right-column">
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