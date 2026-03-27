import React, { useState, useEffect } from "react";
import "./App.css";

import RateTable from "./components/RateTable";
import ArbitragePanel from "./components/ArbitragePanel";
import AlgorithmLog from "./components/AlgorithmLog";
import PortfolioTracker from "./components/PortfolioTracker";
import useWebSocket from "./hooks/useWebSocket";

function App() {
  const [previousRates, setPreviousRates] = useState({});

  const host = window.location.hostname;
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${host}:8000/ws/live`;

  const { data, connected } = useWebSocket(wsUrl);

  // track previous rates manually
  useEffect(() => {
    if (data?.rates) {
      setPreviousRates(prev => data.rates);
    }
  }, [data]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Cryptocurrency Arbitrage Detection</h1>
        <div className={`connection-status ${connected ? "connected" : "disconnected"}`}>
          {connected ? "Live" : "Disconnected"}
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
            <AlgorithmLog logs={data?.algorithm_log || []} />
          </div>

          <div className="dashboard-column right-column">
            <ArbitragePanel opportunities={data?.arbitrage?.opportunities || []} />
            <PortfolioTracker portfolio={data?.portfolio} />
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;