import React, { useEffect, useRef } from "react";

export default function AlgorithmLog({ logs }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  return (
    <div className="panel panel-log">
      <div className="panel-header">
        Algorithm Log
        <span className="panel-tag neutral">Bellman-Ford · O(V×E)</span>
      </div>

      {(!logs || logs.length === 0) ? (
        <div className="empty-state">No algorithm runs yet…</div>
      ) : (
        <div className="algorithm-log" ref={scrollRef}>
          {logs.map((log, i) => (
            <div key={i} className="log-entry">
              <span className="log-timestamp">{log.timestamp}</span>
              <span className="log-edges">{log.edges_checked} edges</span>

              {log.cycle_found
                ? <span className="log-cycle-found">● CYCLE FOUND</span>
                : <span className="log-cycle-not-found">no cycle</span>
              }

              {log.relaxed_edges?.length > 0 && (
                <span className="log-relaxed">
                  relaxed: {log.relaxed_edges.slice(0, 4).join(", ")}
                  {log.relaxed_edges.length > 4 && ` +${log.relaxed_edges.length - 4}`}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}