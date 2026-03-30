import React, { useEffect, useRef } from "react";

export default function AlgorithmLog({ logs }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  return (
    <div className="panel">
      <div className="panel-header">
        Algorithm Log
        <span className="panel-tag">Bellman-Ford · O(V·E)</span>
      </div>

      {!logs?.length ? (
        <div className="empty-state">No runs yet…</div>
      ) : (
        <div className="algorithm-log" ref={scrollRef}>
          {logs.map((log, i) => (
            <div key={i} className="log-entry">
              <span className="log-timestamp">{log.timestamp}</span>
              <span className="log-edges">{log.edges_checked}e</span>
              {log.cycle_found
                ? <span className="log-cycle-found">◆ NEGATIVE CYCLE</span>
                : <span className="log-cycle-not-found">stable</span>
              }
              {log.relaxed_edges?.length > 0 && (
                <span className="log-relaxed">
                  {log.relaxed_edges.slice(0, 3).join(" · ")}
                  {log.relaxed_edges.length > 3 && ` +${log.relaxed_edges.length - 3}`}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}