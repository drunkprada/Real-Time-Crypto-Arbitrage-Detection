"""
graph.py - Currency Exchange Graph Builder

This module constructs a directed weighted graph from exchange rates.
The key transformation is using -log(rate) as edge weights, which converts
the multiplicative problem of finding profitable cycles into an additive
problem that Bellman-Ford can solve.

Mathematical Foundation:
------------------------
If we have rates r1, r2, r3 along a cycle, the total return is:
    return = r1 * r2 * r3

For arbitrage, we need return > 1, which means:
    r1 * r2 * r3 > 1

Taking -log of both sides:
    -log(r1) - log(r2) - log(r3) < 0

So a NEGATIVE sum of -log(rate) weights indicates arbitrage!
This is exactly what Bellman-Ford's negative cycle detection finds.

The 0.001 fee per edge (0.1% per trade) is added to make the algorithm
only detect arbitrage opportunities that are profitable after fees.
"""

import math
from typing import Dict, List, Tuple

# Transaction fee per hop (0.1% = 0.001)
TRANSACTION_FEE = 0.001


class CurrencyGraph:
    """
    Represents the currency exchange network as a weighted directed graph.

    Nodes: Currencies (BTC, ETH, USDT, etc.)
    Edges: Exchange rates between currencies
    Weights: -log(rate) + fee (transformed for Bellman-Ford)
    """

    def __init__(self):
        # Adjacency list: {from_node: [(to_node, weight, raw_rate), ...]}
        self.adjacency_list: Dict[str, List[Tuple[str, float, float]]] = {}

        # List of all nodes (currencies)
        self.nodes: List[str] = []

        # List of all edges for Bellman-Ford iteration
        # Each edge: (from_node, to_node, weight, raw_rate)
        self.edges: List[Tuple[str, str, float, float]] = []

    def build_from_rates(self, rates: Dict[str, Dict[str, float]]) -> None:
        """
        Construct the graph from a rate matrix.

        Args:
            rates: Dict of form {from_currency: {to_currency: rate}}
                   where rate is how many units of to_currency you get
                   for 1 unit of from_currency

        The weight transformation:
            weight = -log(rate) + TRANSACTION_FEE

        Why this works:
        - If rate > 1: -log(rate) < 0 (favorable exchange)
        - If rate < 1: -log(rate) > 0 (unfavorable exchange)
        - The fee penalizes each hop, filtering out marginal opportunities
        """
        # Reset graph state
        self.adjacency_list = {}
        self.edges = []
        self.nodes = list(rates.keys())

        # Initialize adjacency list for each node
        for node in self.nodes:
            self.adjacency_list[node] = []

        # Build edges from rate matrix
        for from_currency, to_rates in rates.items():
            for to_currency, rate in to_rates.items():
                # Skip self-loops (same currency)
                if from_currency == to_currency:
                    continue

                # Transform rate to edge weight
                # Using natural log (ln) for the transformation
                if rate <= 0:
                    # Invalid rate, use infinity to effectively remove edge
                    weight = float('inf')
                else:
                    weight = -math.log(rate) + TRANSACTION_FEE

                # Add to adjacency list (for graph traversal)
                self.adjacency_list[from_currency].append(
                    (to_currency, weight, rate)
                )

                # Add to edge list (for Bellman-Ford)
                self.edges.append(
                    (from_currency, to_currency, weight, rate)
                )

    def get_nodes(self) -> List[str]:
        """Return list of all currency nodes."""
        return self.nodes.copy()

    def get_edges(self) -> List[Tuple[str, str, float, float]]:
        """
        Return list of all edges.
        Each edge is (from_node, to_node, weight, raw_rate)
        """
        return self.edges.copy()

    def get_neighbors(self, node: str) -> List[Tuple[str, float, float]]:
        """
        Get all neighbors of a node with edge weights.
        Returns: [(neighbor, weight, raw_rate), ...]
        """
        return self.adjacency_list.get(node, [])

    def get_edge_weight(self, from_node: str, to_node: str) -> float:
        """Get the weight of a specific edge."""
        for neighbor, weight, _ in self.adjacency_list.get(from_node, []):
            if neighbor == to_node:
                return weight
        return float('inf')

    def get_raw_rate(self, from_node: str, to_node: str) -> float:
        """Get the raw exchange rate for an edge."""
        for neighbor, _, rate in self.adjacency_list.get(from_node, []):
            if neighbor == to_node:
                return rate
        return 0.0


def build_graph(rates: Dict[str, Dict[str, float]]) -> CurrencyGraph:
    """
    Convenience function to build a graph from rates.

    Args:
        rates: Exchange rate matrix

    Returns:
        CurrencyGraph instance ready for Bellman-Ford
    """
    graph = CurrencyGraph()
    graph.build_from_rates(rates)
    return graph
