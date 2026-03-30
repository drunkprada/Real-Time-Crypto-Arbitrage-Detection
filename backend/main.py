"""
main.py - FastAPI Application for Real-Time Cryptocurrency Arbitrage Detection

This is the main entry point for the backend API. It provides:
- REST endpoints for fetching rates, arbitrage data, and portfolio state
- WebSocket endpoint for real-time updates every 3 seconds
- CORS configuration for the React frontend

Run with: uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

import asyncio
import json
from typing import List
from datetime import datetime

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from price_feed import get_rates, get_active_arbitrage_cycle, CURRENCIES
from graph import build_graph
from bellman_ford import find_arbitrage, get_algorithm_history, ArbitrageOpportunity
from portfolio import get_portfolio_state, execute_arbitrage_trade, reset_portfolio


# =============================================================================
# FASTAPI APP CONFIGURATION
# =============================================================================

app = FastAPI(
    title="Crypto Arbitrage Detection API",
    description="Real-time cryptocurrency arbitrage detection using Bellman-Ford algorithm",
    version="1.0.0"
)

# CORS configuration for React frontend on localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# WEBSOCKET CONNECTION MANAGER
# =============================================================================

class ConnectionManager:
    """
    Manages WebSocket connections for real-time updates.

    Handles:
    - Adding new client connections
    - Removing disconnected clients
    - Broadcasting updates to all connected clients
    """

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        """Remove a disconnected client."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        """Send data to all connected clients."""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception:
                disconnected.append(connection)

        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn)


manager = ConnectionManager()


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_system_state() -> dict:
    """
    Get the complete system state including rates, arbitrage, and portfolio.

    This function:
    1. Fetches current exchange rates
    2. Builds the currency graph
    3. Runs Bellman-Ford to detect arbitrage
    4. Executes trades if profitable
    5. Returns everything in a single payload
    """
    # Get current rates
    rates = get_rates()

    # Build graph from rates
    graph = build_graph(rates)

    # Run Bellman-Ford algorithm
    opportunities, log = find_arbitrage(graph)

    # Execute trades for profitable opportunities
    for opp in opportunities:
        if opp.net_profit_pct > 0:
            execute_arbitrage_trade(opp.path, opp.net_profit_pct)

    # Get the currencies that are part of active arbitrage
    active_arbitrage_currencies = get_active_arbitrage_cycle()

    # Format opportunities for JSON
    formatted_opportunities = [
        {
            "path": opp.path,
            "gross_profit_pct": opp.gross_profit_pct,
            "fee_cost_pct": opp.fee_cost_pct,
            "net_profit_pct": opp.net_profit_pct,
            "rates_used": opp.rates_used
        }
        for opp in opportunities
    ]

    # Format algorithm log
    algorithm_log = get_algorithm_history()

    return {
        "timestamp": datetime.now().isoformat(),
        "rates": rates,
        "currencies": CURRENCIES,
        "arbitrage": {
            "opportunities": formatted_opportunities,
            "active_cycle": active_arbitrage_currencies
        },
        "algorithm_log": algorithm_log,
        "portfolio": get_portfolio_state()
    }


# =============================================================================
# REST API ENDPOINTS
# =============================================================================

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "running",
        "message": "Crypto Arbitrage Detection API",
        "version": "1.0.0"
    }


@app.get("/api/rates")
async def get_current_rates():
    """
    Get the current exchange rate matrix.

    Returns:
        Dict with all currency pairs and their exchange rates
    """
    rates = get_rates()
    return {
        "timestamp": datetime.now().isoformat(),
        "currencies": CURRENCIES,
        "rates": rates
    }


@app.get("/api/arbitrage")
async def get_arbitrage_opportunities():
    """
    Get currently detected arbitrage opportunities.

    Returns:
        List of arbitrage cycles with profit calculations
    """
    rates = get_rates()
    graph = build_graph(rates)
    opportunities, log = find_arbitrage(graph)

    return {
        "timestamp": datetime.now().isoformat(),
        "opportunities": [
            {
                "path": opp.path,
                "gross_profit_pct": opp.gross_profit_pct,
                "fee_cost_pct": opp.fee_cost_pct,
                "net_profit_pct": opp.net_profit_pct,
                "rates_used": opp.rates_used
            }
            for opp in opportunities
        ],
        "algorithm_log": {
            "edges_checked": log.edges_checked,
            "cycle_found": log.cycle_found,
            "relaxed_edges": log.relaxed_edges
        }
    }


@app.get("/api/portfolio")
async def get_portfolio():
    """
    Get the current portfolio state.

    Returns:
        Portfolio metrics including balance, P&L, and recent trades
    """
    return get_portfolio_state()


@app.post("/api/portfolio/reset")
async def reset_portfolio_endpoint():
    """
    Reset the portfolio to its initial $10,000 state.
    Called by the frontend at the start of each new session.
    """
    return reset_portfolio()


@app.get("/api/history")
async def get_history():
    """
    Get the algorithm execution history.

    Returns:
        List of recent Bellman-Ford algorithm runs
    """
    return {
        "algorithm_log": get_algorithm_history()
    }


# =============================================================================
# WEBSOCKET ENDPOINT
# =============================================================================

@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time updates.

    Sends a complete state update every 3 seconds containing:
    - Current exchange rates
    - Detected arbitrage opportunities
    - Portfolio state
    - Algorithm execution log
    """
    await manager.connect(websocket)

    try:
        while True:
            # Get complete system state
            state = get_system_state()

            # Send to this client
            await websocket.send_json(state)

            # Wait 3 seconds before next update
            await asyncio.sleep(3)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)


# =============================================================================
# STARTUP EVENT
# =============================================================================

@app.on_event("startup")
async def startup_event():
    """
    Called when the FastAPI application starts.
    """
    print("=" * 60)
    print("Crypto Arbitrage Detection System")
    print("=" * 60)
    print(f"Currencies: {', '.join(CURRENCIES)}")
    print("WebSocket: ws://localhost:8000/ws/live")
    print("API Docs: http://localhost:8000/docs")
    print("=" * 60)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
