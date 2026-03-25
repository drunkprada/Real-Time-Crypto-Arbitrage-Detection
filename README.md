# Real-Time Cryptocurrency Arbitrage Detection

A full-stack academic project demonstrating real-time cryptocurrency arbitrage detection using the **Bellman-Ford algorithm**. The system simulates live exchange rates, detects profitable trading cycles, and tracks portfolio performance.

## Architecture

![System Design Architecture](system%20design.jpg)

## How It Works

### The Math Behind Arbitrage Detection

Currency arbitrage exists when you can trade through a cycle of currencies and end up with more than you started:

```
If: rate(A→B) × rate(B→C) × rate(C→A) > 1
Then: Arbitrage opportunity exists!
```

By transforming rates using `-log(rate)`, we convert this multiplicative problem into an additive one:

```
-log(r1) + -log(r2) + -log(r3) < 0  →  Negative cycle = Arbitrage!
```

The **Bellman-Ford algorithm** can detect negative cycles in O(V×E) time, making it perfect for this application.

## Project Structure

```
├── backend/
│   ├── main.py           # FastAPI app with REST & WebSocket endpoints
│   ├── price_feed.py     # Simulated exchange rate generator
│   ├── graph.py          # Currency graph with -log weight transformation
│   ├── bellman_ford.py   # Arbitrage detection algorithm (heavily commented)
│   ├── portfolio.py      # Trade simulation & tracking (heavily commented)
│   └── requirements.txt  # Python dependencies
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js        # Main React component
│   │   ├── App.css       # Styling
│   │   ├── index.js      # Entry point
│   │   └── components/
│   │       ├── RateTable.js        # Live exchange rate matrix
│   │       ├── ArbitragePanel.js   # Detected opportunities
│   │       ├── AlgorithmLog.js     # Bellman-Ford execution log
│   │       └── PortfolioTracker.js # Portfolio performance
│   └── package.json
│
└── README.md
```

## Setup & Running

### Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- REST API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- WebSocket: ws://localhost:8000/ws/live

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The frontend will open at http://localhost:3000

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rates` | GET | Current exchange rate matrix |
| `/api/arbitrage` | GET | Detected arbitrage opportunities |
| `/api/portfolio` | GET | Portfolio state and trade history |
| `/api/history` | GET | Bellman-Ford algorithm run history |
| `/ws/live` | WebSocket | Real-time updates (every 3 seconds) |

## Dashboard Panels

1. **Live Rate Table** - Real-time exchange rates with change highlighting
2. **Arbitrage Opportunities** - Detected cycles with profit calculations
3. **Algorithm Log** - Bellman-Ford execution details (monospace)
4. **Portfolio Tracker** - Balance, P&L, and recent trades

## Configuration

Key parameters can be adjusted in the backend files:

| File | Parameter | Default | Description |
|------|-----------|---------|-------------|
| `graph.py` | `TRANSACTION_FEE` | 0.001 (0.1%) | Fee per trade hop |
| `portfolio.py` | `STARTING_BALANCE` | $10,000 | Initial portfolio value |
| `portfolio.py` | `MIN_PROFIT_THRESHOLD` | 0.3% | Minimum profit to execute trade |
| `price_feed.py` | Arbitrage interval | 15-20s | Time between arbitrage windows |

## Currencies Tracked

- BTC (Bitcoin)
- ETH (Ethereum)
- USDT (Tether)
- BNB (Binance Coin)
- XRP (Ripple)
- SOL (Solana)

## Academic Notes

The `bellman_ford.py` and `portfolio.py` files contain extensive inline comments explaining:

- Algorithm steps and complexity analysis
- Mathematical foundations of arbitrage detection
- Edge case handling
- Real-world trading considerations

These are suitable for academic reports and presentations.

## License

MIT License - Feel free to use for educational purposes.
