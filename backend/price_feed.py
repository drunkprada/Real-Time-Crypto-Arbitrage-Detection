"""
price_feed.py - Simulated Cryptocurrency Exchange Rate Feed

This module simulates real-time exchange rates between 6 cryptocurrencies.
Rates update every 3 seconds with small random fluctuations, and every
15-20 seconds an arbitrage opportunity is deliberately introduced.
"""

import random
import time
from typing import Dict

# The 6 currencies we're tracking
CURRENCIES = ["BTC", "ETH", "USDT", "BNB", "XRP", "SOL"]

# Base prices in USD (approximate real-world values for realism)
BASE_PRICES_USD = {
    "BTC": 65000.0,
    "ETH": 3500.0,
    "USDT": 1.0,
    "BNB": 580.0,
    "XRP": 0.60,
    "SOL": 150.0,
}


class PriceFeed:
    """
    Simulates a live cryptocurrency price feed with periodic arbitrage windows.
    """

    def __init__(self):
        # Current prices in USD (will fluctuate around base)
        self.prices_usd: Dict[str, float] = BASE_PRICES_USD.copy()

        # Timestamp of last arbitrage injection
        self.last_arbitrage_time: float = time.time()

        # Random interval until next arbitrage (15-20 seconds)
        self.next_arbitrage_interval: float = random.uniform(15.0, 20.0)

        # Currently active arbitrage distortion (if any)
        self.active_arbitrage: Dict[str, float] = {}

        # Track which currencies are in the arbitrage cycle
        self.arbitrage_cycle: list = []

    def _apply_random_fluctuation(self) -> None:
        """
        Apply small random price changes to simulate market movement.
        Fluctuations are typically 0.01% to 0.05% per update.
        """
        for currency in CURRENCIES:
            if currency == "USDT":
                # USDT is a stablecoin, barely moves
                fluctuation = random.uniform(-0.0001, 0.0001)
            else:
                # Other cryptos fluctuate more
                fluctuation = random.uniform(-0.0005, 0.0005)

            self.prices_usd[currency] *= (1 + fluctuation)

    def _should_inject_arbitrage(self) -> bool:
        """
        Check if it's time to inject an arbitrage opportunity.
        Returns True every 15-20 seconds.
        """
        elapsed = time.time() - self.last_arbitrage_time
        return elapsed >= self.next_arbitrage_interval

    def _inject_arbitrage(self) -> None:
        """
        Deliberately create a price imbalance across 3 currencies
        to generate a detectable arbitrage opportunity.

        The imbalance is 0.5% - 1.5%, which after the 0.1% fee per hop
        (3 hops = 0.3% total fees) still leaves profit.
        """
        # Pick 3 currencies for the arbitrage cycle (always include USDT for clarity)
        other_currencies = [c for c in CURRENCIES if c != "USDT"]
        selected = random.sample(other_currencies, 2)
        self.arbitrage_cycle = ["USDT"] + selected  # e.g., ["USDT", "BTC", "ETH"]

        # Create imbalance: boost the middle currency's apparent value
        # This creates: USDT -> A is cheap, A -> B is cheap, B -> USDT is favorable
        imbalance_factor = random.uniform(1.005, 1.015)  # 0.5% to 1.5% profit potential

        self.active_arbitrage = {
            self.arbitrage_cycle[1]: imbalance_factor  # Boost middle currency
        }

        # Reset timer for next arbitrage
        self.last_arbitrage_time = time.time()
        self.next_arbitrage_interval = random.uniform(15.0, 20.0)

    def _clear_arbitrage(self) -> None:
        """
        Clear the arbitrage distortion after a few seconds.
        Arbitrage windows last 3-5 seconds.
        """
        elapsed = time.time() - self.last_arbitrage_time
        if elapsed > random.uniform(3.0, 5.0) and self.active_arbitrage:
            self.active_arbitrage = {}
            self.arbitrage_cycle = []

    def get_exchange_rate(self, from_currency: str, to_currency: str) -> float:
        """
        Get the exchange rate from one currency to another.

        Rate = price_of_from / price_of_to
        (How many units of to_currency you get for 1 unit of from_currency)
        """
        if from_currency == to_currency:
            return 1.0

        from_price = self.prices_usd[from_currency]
        to_price = self.prices_usd[to_currency]

        # Apply arbitrage distortion if active
        if from_currency in self.active_arbitrage:
            from_price *= self.active_arbitrage[from_currency]
        if to_currency in self.active_arbitrage:
            to_price /= self.active_arbitrage[to_currency]

        return from_price / to_price

    def get_all_rates(self) -> Dict[str, Dict[str, float]]:
        """
        Get the full rate matrix for all currency pairs.

        Returns:
            Dict of form {from_currency: {to_currency: rate}}
        """
        # Update prices with random fluctuations
        self._apply_random_fluctuation()

        # Check if we should inject or clear arbitrage
        if self._should_inject_arbitrage():
            self._inject_arbitrage()
        self._clear_arbitrage()

        # Build the complete rate matrix
        rates: Dict[str, Dict[str, float]] = {}

        for from_curr in CURRENCIES:
            rates[from_curr] = {}
            for to_curr in CURRENCIES:
                rates[from_curr][to_curr] = self.get_exchange_rate(from_curr, to_curr)

        return rates

    def get_arbitrage_cycle(self) -> list:
        """
        Return the currently active arbitrage cycle (if any).
        Useful for debugging/visualization.
        """
        return self.arbitrage_cycle.copy()


# Global instance for the application
price_feed = PriceFeed()


def get_rates() -> Dict[str, Dict[str, float]]:
    """
    Convenience function to get current rates from the global price feed.
    """
    return price_feed.get_all_rates()


def get_active_arbitrage_cycle() -> list:
    """
    Convenience function to get the active arbitrage cycle.
    """
    return price_feed.get_arbitrage_cycle()
