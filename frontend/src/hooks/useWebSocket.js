import { useEffect, useRef, useState } from "react";

export default function useWebSocket(url) {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onmessage = (event) => {
        setData(JSON.parse(event.data));
      };

      ws.onclose = () => {
        setConnected(false);
        setTimeout(connect, 3000); // retry
      };

      ws.onerror = () => ws.close();
    };

    connect();

    return () => wsRef.current?.close();
  }, [url]);

  return { data, connected };
}