import React, { useState, useEffect, useRef } from 'react';
import RateTable from './components/RateTable';
import ArbitragePanel from './components/ArbitragePanel';
import AlgorithmLog from './components/AlgorithmLog';
import PortfolioTracker from './components/PortfolioTracker';
import './App.css';

function App() {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);
  const [previousRates, setPreviousRates] = useState({});
  const wsRef = useRef(null);

  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket('ws://localhost:8000/ws/live');
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
        <div className="panel-grid">
          <RateTable
            rates={data?.rates}
            currencies={data?.currencies}
            previousRates={previousRates}
            activeCycle={data?.arbitrage?.active_cycle || []}
          />
          <ArbitragePanel
            opportunities={data?.arbitrage?.opportunities || []}
          />
          <AlgorithmLog
            logs={data?.algorithm_log || []}
          />
          <PortfolioTracker
            portfolio={data?.portfolio}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
