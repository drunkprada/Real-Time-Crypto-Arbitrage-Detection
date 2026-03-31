# Real-Time Cryptocurrency Arbitrage Detection

A full-stack academic project demonstrating real-time cryptocurrency arbitrage detection using the **Bellman-Ford algorithm**. The system simulates live exchange rates, detects profitable trading cycles, and tracks portfolio performance.

## Live Demo
Frontend: https://real-time-crypto-arbitrage-detectio-two.vercel.app  
Backend: https://crypto-arbitrage-detection-uhl3.onrender.com

## Architecture

![System Design Architecture](system%20design.jpeg)

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

### ⚡ Prerequisites

Before you begin, ensure you have the following installed on your system:
- **Python 3.8+**
- **Node.js 16+**
- **npm** or **yarn**

### 🟣 Backend Setup (FastAPI)

1. Open a terminal and navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a pristine virtual environment (highly recommended):
```bash
# Create virtual environment
python -m venv venv

# Activate on Windows:
.\venv\Scripts\activate

# Activate on macOS/Linux:
source venv/bin/activate
```

3. Install the required Python packages:
```bash
pip install -r requirements.txt
```

4. Boot up the real-time simulation server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
*(The WebSocket feed will now be broadcasting on `ws://localhost:8000/ws/live`)*

### 🟢 Frontend Setup (React)

1. Open a **new** terminal window and navigate to the frontend directory:
```bash
cd frontend
```

2. Install the necessary node modules:
```bash
npm install
```

3. Start the stunning UI dashboard:
```bash
npm run dev
# or
npm start
```
*(The dashboard will automatically open in your browser at `http://localhost:3000`)*

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
