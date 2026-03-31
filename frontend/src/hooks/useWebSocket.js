import { useEffect, useRef, useState } from "react";

export default function useWebSocket() {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const wsRef = useRef(null);
  const retryRef = useRef(0);

  const getWSUrl = () => {
    if (window.location.hostname === "localhost") {
      return "ws://localhost:8000/ws/live";
    }
    return "wss://crypto-arbitrage-detection-uhl3.onrender.com/ws/live";
  };

  const getAPIUrl = () => {
    return "https://crypto-arbitrage-detection-uhl3.onrender.com/api/rates";
  };

  useEffect(() => {
    let isMounted = true;

    const fetchFallback = async () => {
      try {
        const res = await fetch(getAPIUrl());
        const json = await res.json();
        if (isMounted) {
          console.log("Using REST fallback");
          setData(json);
          setLoading(false);
        }
      } catch (err) {
        console.error("Fallback failed:", err);
      }
    };

    const connect = () => {
      const url = getWSUrl();
      console.log("Connecting to WS:", url);

      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("✅ WS connected");
          retryRef.current = 0;
          if (isMounted) {
            setConnected(true);
            setLoading(false);
          }
        };

        ws.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (isMounted) setData(parsed);
          } catch (e) {
            console.warn("⚠️ Invalid WS data (likely HTML):", event.data);
          }
        };

        ws.onclose = () => {
          console.log("❌ WS closed");

          if (isMounted) setConnected(false);

          retryRef.current += 1;

          const delay = Math.min(1000 * 2 ** retryRef.current, 10000);

          console.log(`Retrying in ${delay / 1000}s...`);

          setTimeout(() => {
            connect();
          }, delay);

          if (retryRef.current >= 2) {
            fetchFallback();
          }
        };

        ws.onerror = (err) => {
          console.error("WS error:", err);
          ws.close();
        };

      } catch (err) {
        console.error("WS init failed:", err);
      }
    };

    setTimeout(connect, 1500);

    return () => {
      isMounted = false;
      wsRef.current?.close();
    };
  }, []);

  return { data, connected, loading };
}