import math
from typing import Dict, List, Tuple

TRANSACTION_FEE = 0.001


class CurrencyGraph:

    def __init__(self):
        self.adjacency_list: Dict[str, List[Tuple[str, float, float]]] = {}
        self.nodes: List[str] = []
        self.edges: List[Tuple[str, str, float, float]] = []

    def build_from_rates(self, rates: Dict[str, Dict[str, float]]) -> None:
        self.adjacency_list = {}
        self.edges = []
        self.nodes = list(rates.keys())

        for node in self.nodes:
            self.adjacency_list[node] = []

        for from_currency, to_rates in rates.items():
            for to_currency, rate in to_rates.items():
                if from_currency == to_currency:
                    continue

                weight = float('inf') if rate <= 0 else -math.log(rate) + TRANSACTION_FEE

                self.adjacency_list[from_currency].append((to_currency, weight, rate))
                self.edges.append((from_currency, to_currency, weight, rate))

    def get_nodes(self) -> List[str]:
        return self.nodes.copy()

    def get_edges(self) -> List[Tuple[str, str, float, float]]:
        return self.edges.copy()

    def get_neighbors(self, node: str) -> List[Tuple[str, float, float]]:
        return self.adjacency_list.get(node, [])

    def get_edge_weight(self, from_node: str, to_node: str) -> float:
        for neighbor, weight, _ in self.adjacency_list.get(from_node, []):
            if neighbor == to_node:
                return weight
        return float('inf')

    def get_raw_rate(self, from_node: str, to_node: str) -> float:
        for neighbor, _, rate in self.adjacency_list.get(from_node, []):
            if neighbor == to_node:
                return rate
        return 0.0


def build_graph(rates: Dict[str, Dict[str, float]]) -> CurrencyGraph:
    graph = CurrencyGraph()
    graph.build_from_rates(rates)
    return graph