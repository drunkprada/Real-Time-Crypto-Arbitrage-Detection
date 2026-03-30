import random
import time
from typing import Dict

CURRENCIES = ["BTC", "ETH", "USDT", "BNB", "XRP", "SOL"]

BASE_PRICES_USD = {
    "BTC": 65000.0,
    "ETH": 3500.0,
    "USDT": 1.0,
    "BNB": 580.0,
    "XRP": 0.60,
    "SOL": 150.0,
}


class PriceFeed:

    def __init__(self):
        self.prices_usd: Dict[str, float] = BASE_PRICES_USD.copy()
        self.last_arbitrage_time: float = time.time()
        self.next_arbitrage_interval: float = random.uniform(15.0, 20.0)
        self.active_arbitrage: Dict[str, float] = {}
        self.arbitrage_cycle: list = []

    def _apply_random_fluctuation(self) -> None:
        for currency in CURRENCIES:
            fluctuation = random.uniform(-0.0001, 0.0001) if currency == "USDT" \
                else random.uniform(-0.0005, 0.0005)
            self.prices_usd[currency] *= (1 + fluctuation)

    def _should_inject_arbitrage(self) -> bool:
        return time.time() - self.last_arbitrage_time >= self.next_arbitrage_interval

    def _inject_arbitrage(self) -> None:
        other = [c for c in CURRENCIES if c != "USDT"]
        selected = random.sample(other, 2)
        self.arbitrage_cycle = ["USDT"] + selected
        self.active_arbitrage = {
            self.arbitrage_cycle[1]: random.uniform(1.005, 1.015)
        }
        self.last_arbitrage_time = time.time()
        self.next_arbitrage_interval = random.uniform(15.0, 20.0)

    def _clear_arbitrage(self) -> None:
        if self.active_arbitrage and time.time() - self.last_arbitrage_time > random.uniform(3.0, 5.0):
            self.active_arbitrage = {}
            self.arbitrage_cycle = []

    def get_exchange_rate(self, from_currency: str, to_currency: str) -> float:
        if from_currency == to_currency:
            return 1.0

        from_price = self.prices_usd[from_currency]
        to_price = self.prices_usd[to_currency]

        if from_currency in self.active_arbitrage:
            from_price *= self.active_arbitrage[from_currency]
        if to_currency in self.active_arbitrage:
            to_price /= self.active_arbitrage[to_currency]

        return from_price / to_price

    def get_all_rates(self) -> Dict[str, Dict[str, float]]:
        self._apply_random_fluctuation()

        if self._should_inject_arbitrage():
            self._inject_arbitrage()
        self._clear_arbitrage()

        return {
            from_curr: {
                to_curr: self.get_exchange_rate(from_curr, to_curr)
                for to_curr in CURRENCIES
            }
            for from_curr in CURRENCIES
        }

    def get_arbitrage_cycle(self) -> list:
        return self.arbitrage_cycle.copy()


price_feed = PriceFeed()


def get_rates() -> Dict[str, Dict[str, float]]:
    return price_feed.get_all_rates()


def get_active_arbitrage_cycle() -> list:
    return price_feed.get_arbitrage_cycle()