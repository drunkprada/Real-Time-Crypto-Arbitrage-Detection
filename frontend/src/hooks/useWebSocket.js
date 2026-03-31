import { useEffect, useRef, useState } from "react";

export default function useWebSocket() {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    const getWebSocketURL = () => {
      // local dev
      if (window.location.hostname === "localhost") {
        return "ws://localhost:8000/ws/live";
      }

      // production (Render)
      return "wss://your-app.onrender.com/ws/live"; // 👈 CHANGE THIS
    };

    const connect = () => {
      const ws = new WebSocket(getWebSocketURL());
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WS connected");
        setConnected(true);
      };

      ws.onmessage = (event) => {
        setData(JSON.parse(event.data));
      };

      ws.onclose = () => {
        console.log("WS disconnected, retrying...");
        setConnected(false);
        setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error("WS error:", err);
        ws.close();
      };
    };

    connect();

    return () => wsRef.current?.close();
  }, []);

  return { data, connected };
}import { useEffect, useRef, useState } from "react";

export default function useWebSocket() {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    const getWebSocketURL = () => {
      // local dev
      if (window.location.hostname === "localhost") {
        return "ws://localhost:8000/ws/live";
      }

      // production (Render)
      return "wss://crypto-arbitrage-detection-uhl3.onrender.com/ws/live";
    };

    const connect = () => {
      const ws = new WebSocket(getWebSocketURL());
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WS connected");
        setConnected(true);
      };

      ws.onmessage = (event) => {
        setData(JSON.parse(event.data));
      };

      ws.onclose = () => {
        console.log("WS disconnected, retrying...");
        setConnected(false);
        setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error("WS error:", err);
        ws.close();
      };
    };

    connect();

    return () => wsRef.current?.close();
  }, []);

  return { data, connected };
}