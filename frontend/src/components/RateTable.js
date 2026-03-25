import React, { useState, useEffect, useRef } from 'react';

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

            // Clear existing timeout
            if (timeoutRefs.current[key]) {
              clearTimeout(timeoutRefs.current[key]);
            }

            // Set timeout to clear the flash
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

  // Clean up timeouts on unmount
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
    // Check wrap-around
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

export default RateTable;
