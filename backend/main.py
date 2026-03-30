import asyncio
from typing import List
from datetime import datetime

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from price_feed import get_rates, get_active_arbitrage_cycle, CURRENCIES
from graph import build_graph
from bellman_ford import find_arbitrage, get_algorithm_history
from portfolio import get_portfolio_state, execute_arbitrage_trade


app = FastAPI(title="Crypto Arbitrage Detection API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ConnectionManager:

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn)


manager = ConnectionManager()


def get_system_state() -> dict:
    rates = get_rates()
    graph = build_graph(rates)
    opportunities, log = find_arbitrage(graph)

    for opp in opportunities:
        if opp.net_profit_pct > 0:
            execute_arbitrage_trade(opp.path, opp.net_profit_pct)

    return {
        "timestamp": datetime.now().isoformat(),
        "rates": rates,
        "currencies": CURRENCIES,
        "arbitrage": {
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
            "active_cycle": get_active_arbitrage_cycle()
        },
        "algorithm_log": get_algorithm_history(),
        "portfolio": get_portfolio_state()
    }


@app.get("/")
async def root():
    return {"status": "running", "version": "1.0.0"}


@app.get("/api/rates")
async def get_current_rates():
    return {
        "timestamp": datetime.now().isoformat(),
        "currencies": CURRENCIES,
        "rates": get_rates()
    }


@app.get("/api/arbitrage")
async def get_arbitrage_opportunities():
    rates = get_rates()
    opportunities, log = find_arbitrage(build_graph(rates))
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
    return get_portfolio_state()


@app.get("/api/history")
async def get_history():
    return {"algorithm_log": get_algorithm_history()}


@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.send_json(get_system_state())
            await asyncio.sleep(3)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)


@app.on_event("startup")
async def startup_event():
    print(f"Starting — currencies: {', '.join(CURRENCIES)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)