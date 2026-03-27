import React, { useState, useEffect, useRef } from "react";

export default function RateTable({ rates, currencies, previousRates, activeCycle }) {
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
          // avoid flicker from tiny fluctuations
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

  const isInArb = (from, to) => {
    if (!activeCycle || activeCycle.length < 2) return false;

    for (let i = 0; i < activeCycle.length - 1; i++) {
      if (activeCycle[i] === from && activeCycle[i + 1] === to) return true;
    }
    return activeCycle.at(-1) === from && activeCycle[0] === to;
  };

  const formatRate = (rate) => {
    if (!rate) return "-";
    if (rate >= 1000) return rate.toFixed(2);
    if (rate >= 1) return rate.toFixed(4);
    if (rate >= 0.01) return rate.toFixed(6);
    return rate.toExponential(4);
  };

  return (
    <div className="panel">
      <h2 className="panel-header">Live Exchange Rates</h2>
      <table className="rate-table">
        <thead>
          <tr>
            <th></th>
            {currencies?.map(c => <th key={c}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {currencies?.map(from => (
            <tr key={from}>
              <td>{from}</td>
              {currencies.map(to => {
                const key = `${from}-${to}`;
                const isSelf = from === to;

                return (
                  <td
                    key={to}
                    className={`${isSelf ? "self" : ""} ${changedCells[key] ? "changed" : ""} ${isInArb(from, to) ? "arbitrage-cell" : ""}`}
                  >
                    {isSelf ? "1.0000" : formatRate(rates[from]?.[to])}
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