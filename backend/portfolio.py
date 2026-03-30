"""
portfolio.py - Simulated Trading Portfolio Manager

This module simulates executing arbitrage trades and tracks portfolio performance.
It provides a realistic simulation of how an arbitrage trading bot would perform,
including tracking profits, losses, and overall performance metrics.

=============================================================================
ACADEMIC OVERVIEW: ARBITRAGE TRADING SIMULATION
=============================================================================

In real-world arbitrage trading, a bot would:
1. Detect an arbitrage opportunity (via Bellman-Ford)
2. Execute trades rapidly before the opportunity disappears
3. Track profits and losses over time

This simulation models this process with the following assumptions:
- Starting capital: $10,000 USDT
- Minimum profit threshold: 0.3% (after fees) to trigger a trade
- All trades execute instantly (no slippage in simulation)
- Trade size: Full balance (in reality, liquidity limits this)

IMPORTANT CONSIDERATIONS FOR REAL TRADING:
-------------------------------------------
- Slippage: Large orders move the market against you
- Latency: Opportunities disappear in milliseconds
- Liquidity: Not all trades can execute at the displayed price
- Exchange fees: May vary from our 0.1% simulation

=============================================================================
"""

from typing import List, Dict, Optional
from dataclasses import dataclass, field
from datetime import datetime
from threading import Lock

from graph import TRANSACTION_FEE


@dataclass
class Trade:
    """
    Represents a single executed arbitrage trade.

    Attributes:
        timestamp: When the trade was executed
        path: The trading path (e.g., ["USDT", "BTC", "ETH", "USDT"])
        profit_pct: Net profit percentage of the trade
        usd_gained: Actual USD profit (or loss if negative)
        balance_after: Portfolio balance after this trade
    """
    timestamp: str
    path: List[str]
    profit_pct: float
    usd_gained: float
    balance_after: float


@dataclass
class PortfolioState:
    """
    Complete state of the trading portfolio.

    This dataclass provides a snapshot of portfolio performance
    that can be serialized and sent to the frontend.
    """
    # Current balance in USDT
    current_balance: float

    # Starting balance for P&L calculation
    starting_balance: float

    # Total profit/loss in USD
    total_pnl_usd: float

    # Total profit/loss as percentage
    total_pnl_pct: float

    # Total number of trades executed
    total_trades: int

    # Number of profitable trades
    winning_trades: int

    # Win rate as percentage (winning_trades / total_trades)
    win_rate: float

    # Last N trades for display
    recent_trades: List[Trade]


class Portfolio:
    """
    Manages simulated arbitrage trading portfolio.

    This class tracks:
    - Current balance (starts at $10,000)
    - Trade history
    - Performance metrics (P&L, win rate, etc.)

    Thread Safety:
    --------------
    Uses a lock to ensure thread-safe updates, as the portfolio
    may be accessed by multiple WebSocket connections simultaneously.
    """

    # =========================================================================
    # CONFIGURATION CONSTANTS
    # =========================================================================

    # Starting balance in USDT
    STARTING_BALANCE = 10000.0

    # Minimum profit percentage to trigger a trade
    # This filters out marginal opportunities that might not be real
    MIN_PROFIT_THRESHOLD = 0.3  # 0.3%

    # Maximum number of recent trades to keep in memory
    MAX_TRADE_HISTORY = 100

    def __init__(self):
        """
        Initialize portfolio with starting balance.
        """
        # Current balance in USDT
        self.balance: float = self.STARTING_BALANCE

        # Complete trade history
        self.trades: List[Trade] = []

        # Performance counters
        self.winning_trades: int = 0
        self.total_trades: int = 0

        # Thread lock for concurrent access
        self.lock = Lock()

    def execute_trade(
        self,
        path: List[str],
        net_profit_pct: float
    ) -> Optional[Trade]:
        """
        Execute an arbitrage trade if it meets the profit threshold.

        This method simulates what happens when we detect an arbitrage
        opportunity and decide to trade on it:

        1. Check if profit exceeds our minimum threshold
        2. Calculate the USD profit based on current balance
        3. Update the balance
        4. Record the trade

        Args:
            path: The arbitrage path (e.g., ["USDT", "BTC", "ETH", "USDT"])
            net_profit_pct: Net profit percentage after fees

        Returns:
            Trade object if executed, None if skipped

        Example:
            If balance = $10,000 and net_profit_pct = 0.5%
            Then usd_gained = $10,000 * 0.005 = $50
            New balance = $10,050
        """
        with self.lock:
            # ================================================================
            # STEP 1: Validate trade opportunity
            # ================================================================
            # Skip trades that don't meet our minimum profit threshold.
            # This is important because:
            # - Very small profits might not survive execution slippage
            # - Transaction costs might vary slightly
            # - We want to be conservative in our trading decisions

            if net_profit_pct < self.MIN_PROFIT_THRESHOLD:
                return None

            # Skip if we've recently traded (prevent over-trading)
            # In a real system, we'd also check if the same opportunity
            # is still available before trading

            # ================================================================
            # STEP 2: Calculate trade profit
            # ================================================================
            # Convert percentage profit to actual USD gained
            # The formula: usd_gained = balance * (profit_pct / 100)

            profit_decimal = net_profit_pct / 100.0
            usd_gained = self.balance * profit_decimal

            # ================================================================
            # STEP 3: Update balance
            # ================================================================
            # Add the profit to our balance
            # In a real system, this would happen after the trade settles

            self.balance += usd_gained

            # ================================================================
            # STEP 4: Record the trade
            # ================================================================
            # Create a trade record for history and analytics

            trade = Trade(
                timestamp=datetime.now().strftime("%H:%M:%S"),
                path=path,
                profit_pct=round(net_profit_pct, 4),
                usd_gained=round(usd_gained, 2),
                balance_after=round(self.balance, 2)
            )

            # Update counters
            self.total_trades += 1
            if usd_gained > 0:
                self.winning_trades += 1

            # Add to history (keeping only recent trades to save memory)
            self.trades.append(trade)
            if len(self.trades) > self.MAX_TRADE_HISTORY:
                self.trades.pop(0)

            return trade

    def get_state(self) -> PortfolioState:
        """
        Get the current portfolio state.

        This method calculates all performance metrics and returns
        a complete snapshot of the portfolio that can be sent to
        the frontend dashboard.

        Returns:
            PortfolioState with all current metrics
        """
        with self.lock:
            # ================================================================
            # Calculate P&L (Profit and Loss)
            # ================================================================
            # Total P&L in USD
            total_pnl_usd = self.balance - self.STARTING_BALANCE

            # Total P&L as percentage
            total_pnl_pct = (total_pnl_usd / self.STARTING_BALANCE) * 100

            # ================================================================
            # Calculate Win Rate
            # ================================================================
            # Win rate = percentage of trades that were profitable
            # Handle division by zero for when no trades have been made

            if self.total_trades > 0:
                win_rate = (self.winning_trades / self.total_trades) * 100
            else:
                win_rate = 0.0

            # ================================================================
            # Get Recent Trades
            # ================================================================
            # Return the last 10 trades for the dashboard display

            recent_trades = self.trades[-10:]

            return PortfolioState(
                current_balance=round(self.balance, 2),
                starting_balance=self.STARTING_BALANCE,
                total_pnl_usd=round(total_pnl_usd, 2),
                total_pnl_pct=round(total_pnl_pct, 4),
                total_trades=self.total_trades,
                winning_trades=self.winning_trades,
                win_rate=round(win_rate, 2),
                recent_trades=recent_trades
            )

    def reset(self) -> None:
        """
        Reset portfolio to initial state.

        Useful for testing or starting a new simulation session.
        """
        with self.lock:
            self.balance = self.STARTING_BALANCE
            self.trades = []
            self.winning_trades = 0
            self.total_trades = 0


# ============================================================================
# GLOBAL PORTFOLIO INSTANCE
# ============================================================================
# Single portfolio instance shared across the application.
# This ensures consistent state across all API endpoints and WebSockets.

portfolio = Portfolio()


def get_portfolio_state() -> Dict:
    """
    Get portfolio state as a dictionary for JSON serialization.

    Returns:
        Dictionary with all portfolio metrics
    """
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
    """
    Execute a trade and return the result as a dictionary.

    Args:
        path: Arbitrage path
        net_profit_pct: Net profit percentage

    Returns:
        Trade dictionary if executed, None otherwise
    """
    trade = portfolio.execute_trade(path, net_profit_pct)

    if trade:
        return {
            "timestamp": trade.timestamp,
            "path": trade.path,
            "profit_pct": trade.profit_pct,
            "usd_gained": trade.usd_gained,
            "balance_after": trade.balance_after
        }

    return None
