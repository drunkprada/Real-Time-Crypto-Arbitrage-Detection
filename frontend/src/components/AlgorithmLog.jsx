import React, { useEffect, useRef } from "react";
export default function AlgorithmLog({ logs }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (!logs || logs.length === 0) {
    return (
      <div className="panel">
        <h2 className="panel-header">Algorithm Log</h2>
        <div className="empty-state">No algorithm runs yet...</div>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2 className="panel-header">Algorithm Log</h2>
      <div className="algorithm-log" ref={scrollRef}>
        {logs.map((log, index) => (
          <div key={index} className="log-entry">
            <span className="log-timestamp">{log.timestamp}</span>
            <span className="log-edges">{log.edges_checked} edges</span>
            {log.cycle_found ? (
              <span className="log-cycle-found">CYCLE FOUND</span>
            ) : (
              <span className="log-cycle-not-found">no cycle</span>
            )}
            {log.relaxed_edges && log.relaxed_edges.length > 0 && (
              <span className="log-relaxed">
                relaxed: {log.relaxed_edges.slice(0, 5).join(', ')}
                {log.relaxed_edges.length > 5 && ` +${log.relaxed_edges.length - 5} more`}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}