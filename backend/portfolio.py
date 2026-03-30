from typing import List, Dict, Optional
from dataclasses import dataclass, field
from datetime import datetime
from threading import Lock

from graph import TRANSACTION_FEE


@dataclass
class Trade:
    timestamp: str
    path: List[str]
    profit_pct: float
    usd_gained: float
    balance_after: float


@dataclass
class PortfolioState:
    current_balance: float
    starting_balance: float
    total_pnl_usd: float
    total_pnl_pct: float
    total_trades: int
    winning_trades: int
    win_rate: float
    recent_trades: List[Trade]


class Portfolio:

    STARTING_BALANCE = 10000.0
    MIN_PROFIT_THRESHOLD = 0.3
    MAX_TRADE_HISTORY = 100

    def __init__(self):
        self.balance: float = self.STARTING_BALANCE
        self.trades: List[Trade] = []
        self.winning_trades: int = 0
        self.total_trades: int = 0
        self.lock = Lock()

    def execute_trade(self, path: List[str], net_profit_pct: float) -> Optional[Trade]:
        with self.lock:
            if net_profit_pct < self.MIN_PROFIT_THRESHOLD:
                return None

            usd_gained = self.balance * (net_profit_pct / 100.0)
            self.balance += usd_gained

            trade = Trade(
                timestamp=datetime.now().strftime("%H:%M:%S"),
                path=path,
                profit_pct=round(net_profit_pct, 4),
                usd_gained=round(usd_gained, 2),
                balance_after=round(self.balance, 2)
            )

            self.total_trades += 1
            if usd_gained > 0:
                self.winning_trades += 1

            self.trades.append(trade)
            if len(self.trades) > self.MAX_TRADE_HISTORY:
                self.trades.pop(0)

            return trade

    def get_state(self) -> PortfolioState:
        with self.lock:
            total_pnl_usd = self.balance - self.STARTING_BALANCE
            total_pnl_pct = (total_pnl_usd / self.STARTING_BALANCE) * 100
            win_rate = (self.winning_trades / self.total_trades * 100) if self.total_trades > 0 else 0.0

            return PortfolioState(
                current_balance=round(self.balance, 2),
                starting_balance=self.STARTING_BALANCE,
                total_pnl_usd=round(total_pnl_usd, 2),
                total_pnl_pct=round(total_pnl_pct, 4),
                total_trades=self.total_trades,
                winning_trades=self.winning_trades,
                win_rate=round(win_rate, 2),
                recent_trades=self.trades[-10:]
            )

    def reset(self) -> None:
        with self.lock:
            self.balance = self.STARTING_BALANCE
            self.trades = []
            self.winning_trades = 0
            self.total_trades = 0


portfolio = Portfolio()


def get_portfolio_state() -> Dict:
    state = portfolio.get_state()
    return {
        "current_balance": state.current_balance,
        "starting_balance": state.starting_balance,
        "total_pnl_usd": state.total_pnl_usd,
        "total_pnl_pct": state.total_pnl_pct,
        "total_trades": state.total_trades,
        "winning_trades": state.winning_trades,
        "win_rate": state.win_rate,
        "recent_trades": [
            {
                "timestamp": t.timestamp,
                "path": t.path,
                "profit_pct": t.profit_pct,
                "usd_gained": t.usd_gained,
                "balance_after": t.balance_after
            }
            for t in state.recent_trades
        ]
    }


def reset_portfolio() -> Dict:
    """
    Reset the portfolio to its initial state.
    Called at the start of each new dashboard session.
    """
    portfolio.reset()
    return {
        "status": "reset",
        "starting_balance": Portfolio.STARTING_BALANCE
    }


def execute_arbitrage_trade(path: List[str], net_profit_pct: float) -> Optional[Dict]:
    trade = portfolio.execute_trade(path, net_profit_pct)
    if not trade:
        return None
    return {
        "timestamp": trade.timestamp,
        "path": trade.path,
        "profit_pct": trade.profit_pct,
        "usd_gained": trade.usd_gained,
        "balance_after": trade.balance_after
    }