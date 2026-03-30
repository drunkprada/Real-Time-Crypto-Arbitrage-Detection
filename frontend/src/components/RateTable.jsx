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
        const cur  = rates[from]?.[to];
        const prev = previousRates[from]?.[to];
        if (cur !== undefined && prev !== undefined && Math.abs(cur - prev) > 0.0000001) {
          const key = `${from}-${to}`;
          newChanges[key] = true;
          if (timeoutRefs.current[key]) clearTimeout(timeoutRefs.current[key]);
          timeoutRefs.current[key] = setTimeout(() => {
            setChangedCells(p => { const u = { ...p }; delete u[key]; return u; });
          }, 800);
        }
      });
    });
    if (Object.keys(newChanges).length > 0)
      setChangedCells(p => ({ ...p, ...newChanges }));
  }, [rates, previousRates, currencies]);

  useEffect(() => () => Object.values(timeoutRefs.current).forEach(clearTimeout), []);

  const isInArb = (from, to) => {
    if (!activeCycle || activeCycle.length < 2) return false;
    for (let i = 0; i < activeCycle.length - 1; i++)
      if (activeCycle[i] === from && activeCycle[i + 1] === to) return true;
    return activeCycle.at(-1) === from && activeCycle[0] === to;
  };

  const formatRate = rate => {
    if (!rate) return "—";
    if (rate >= 10000) return rate.toFixed(0);
    if (rate >= 1000)  return rate.toFixed(1);
    if (rate >= 1)     return rate.toFixed(4);
    if (rate >= 0.001) return rate.toFixed(6);
    return rate.toExponential(3);
  };

  if (!currencies || !rates) {
    return (
      <div className="panel">
        <div className="panel-header">Live Exchange Rates</div>
        <div className="empty-state">Awaiting feed…</div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-header">
        Live Exchange Rates
        <span className="panel-tag">
          {currencies.length} × {currencies.length} matrix
        </span>
      </div>
      <div className="rate-table-container">
        <table className="rate-table">
          <thead>
            <tr>
              <th>From \ To</th>
              {currencies.map(c => <th key={c}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {currencies.map(from => (
              <tr key={from}>
                <td>{from}</td>
                {currencies.map(to => {
                  const isSelf  = from === to;
                  const key     = `${from}-${to}`;
                  const inArb   = !isSelf && isInArb(from, to);
                  const changed = !isSelf && changedCells[key];
                  const cls     = [
                    isSelf  ? "self"           : "",
                    changed ? "changed"         : "",
                    inArb   ? "arbitrage-cell"  : "",
                  ].filter(Boolean).join(" ");
                  return (
                    <td key={to} className={cls}>
                      {isSelf ? "1.0000" : formatRate(rates[from]?.[to])}
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