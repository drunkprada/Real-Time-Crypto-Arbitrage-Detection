"""
bellman_ford.py - Bellman-Ford Algorithm for Arbitrage Detection

This module implements the Bellman-Ford algorithm to detect arbitrage
opportunities in cryptocurrency markets. The algorithm finds negative
weight cycles in a graph, which correspond to profitable trading loops.

=============================================================================
ACADEMIC OVERVIEW: THE BELLMAN-FORD ALGORITHM
=============================================================================

The Bellman-Ford algorithm solves the single-source shortest path problem
for graphs that may contain negative weight edges. Unlike Dijkstra's
algorithm, it can handle negative weights and detect negative cycles.

Time Complexity: O(V * E) where V = vertices, E = edges
Space Complexity: O(V) for the distance and predecessor arrays

KEY INSIGHT FOR ARBITRAGE:
--------------------------
In currency arbitrage, we transform exchange rates using -log(rate).
This converts the multiplicative problem (rate1 * rate2 * rate3 > 1?)
into an additive problem that Bellman-Ford can solve:

    If rate1 * rate2 * rate3 > 1  (profitable cycle)
    Then -log(rate1) - log(rate2) - log(rate3) < 0  (negative cycle)

So finding a NEGATIVE CYCLE = finding an ARBITRAGE OPPORTUNITY!

=============================================================================
ALGORITHM STEPS
=============================================================================

1. INITIALIZATION:
   - Set distance to source = 0
   - Set distance to all other vertices = infinity
   - Initialize predecessor array for path reconstruction

2. RELAXATION (V-1 iterations):
   - For each edge (u, v) with weight w:
     - If distance[u] + w < distance[v]:
       - Update distance[v] = distance[u] + w
       - Set predecessor[v] = u
   - After V-1 iterations, shortest paths are found (if no negative cycles)

3. NEGATIVE CYCLE DETECTION (Nth iteration):
   - Run one more relaxation pass
   - If ANY edge can still be relaxed, a negative cycle exists
   - The edge that relaxes is part of or reachable from the cycle

4. CYCLE EXTRACTION:
   - From the detected edge, trace back through predecessors
   - Continue until we revisit a node (completing the cycle)

=============================================================================
"""

from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime
import math

from graph import CurrencyGraph, TRANSACTION_FEE


@dataclass
class ArbitrageOpportunity:
    """
    Represents a detected arbitrage opportunity.

    Attributes:
        path: List of currencies in the cycle (e.g., ["USDT", "BTC", "ETH", "USDT"])
        gross_profit_pct: Profit percentage before fees
        fee_cost_pct: Total fees for all hops
        net_profit_pct: Profit after fees (this is what matters!)
        rates_used: The exchange rates along the path
    """
    path: List[str]
    gross_profit_pct: float
    fee_cost_pct: float
    net_profit_pct: float
    rates_used: List[float]


@dataclass
class BellmanFordLog:
    """
    Log entry for one Bellman-Ford execution.
    Used for the algorithm visualization panel.
    """
    timestamp: str
    edges_checked: int
    cycle_found: bool
    relaxed_edges: List[str]  # Edges that triggered relaxation in format "A->B"


class BellmanFordDetector:
    """
    Implements Bellman-Ford algorithm for cryptocurrency arbitrage detection.

    This class maintains state for logging and provides detailed information
    about each algorithm run for educational/debugging purposes.
    """

    def __init__(self):
        # Store the last N algorithm runs for the log panel
        self.run_history: List[BellmanFordLog] = []
        self.max_history = 20

    def detect_arbitrage(
        self,
        graph: CurrencyGraph
    ) -> Tuple[List[ArbitrageOpportunity], BellmanFordLog]:
        """
        Run Bellman-Ford algorithm to detect arbitrage opportunities.

        Args:
            graph: CurrencyGraph instance with transformed edge weights

        Returns:
            Tuple of (list of opportunities found, log entry for this run)
        """
        nodes = graph.get_nodes()
        edges = graph.get_edges()

        if not nodes or not edges:
            # Empty graph - no opportunities possible
            log = BellmanFordLog(
                timestamp=datetime.now().strftime("%H:%M:%S"),
                edges_checked=0,
                cycle_found=False,
                relaxed_edges=[]
            )
            return [], log

        # =====================================================================
        # STEP 1: INITIALIZATION
        # =====================================================================
        # We'll run Bellman-Ford from each node as source to find all cycles.
        # In practice, running from one node is often sufficient, but running
        # from all nodes guarantees we find all negative cycles.

        all_opportunities: List[ArbitrageOpportunity] = []
        total_edges_checked = 0
        all_relaxed_edges: List[str] = []
        cycle_found = False

        # For efficiency, we'll run from just the first node
        # (sufficient for connected graphs, which currency graphs are)
        source = nodes[0]

        # Distance array: distance[node] = shortest path distance from source
        # Initialize all distances to infinity except source (which is 0)
        distance: Dict[str, float] = {node: float('inf') for node in nodes}
        distance[source] = 0.0

        # Predecessor array: predecessor[node] = previous node in shortest path
        # Used to reconstruct the path when we find a cycle
        predecessor: Dict[str, Optional[str]] = {node: None for node in nodes}

        # =====================================================================
        # STEP 2: RELAXATION PHASE (V-1 iterations)
        # =====================================================================
        # The key insight: after k iterations, we have found the shortest paths
        # that use at most k edges. After V-1 iterations, we have found ALL
        # shortest paths (since a simple path has at most V-1 edges).

        num_vertices = len(nodes)

        for iteration in range(num_vertices - 1):
            # Flag to check if any relaxation occurred this iteration
            # If no relaxation occurs, we can terminate early (optimization)
            relaxation_occurred = False

            # Try to relax each edge
            for from_node, to_node, weight, _ in edges:
                total_edges_checked += 1

                # RELAXATION CHECK:
                # If going through from_node gives a shorter path to to_node,
                # update the distance and predecessor
                if distance[from_node] + weight < distance[to_node]:
                    # =========================================================
                    # RELAXATION: We found a shorter path!
                    # =========================================================
                    distance[to_node] = distance[from_node] + weight
                    predecessor[to_node] = from_node
                    relaxation_occurred = True

                    # Log this relaxation (for first few iterations only)
                    if iteration < 2:
                        all_relaxed_edges.append(f"{from_node}->{to_node}")

            # Early termination: if no relaxation, graph has converged
            if not relaxation_occurred:
                break

        # =====================================================================
        # STEP 3: NEGATIVE CYCLE DETECTION (The Nth iteration)
        # =====================================================================
        # After V-1 iterations, all shortest paths are found IF there are no
        # negative cycles. If we can STILL relax an edge, it means we can keep
        # reducing the distance indefinitely -> NEGATIVE CYCLE EXISTS!

        negative_cycle_nodes: List[str] = []

        for from_node, to_node, weight, _ in edges:
            total_edges_checked += 1

            # If we can still relax, we've found a negative cycle!
            if distance[from_node] + weight < distance[to_node]:
                # =========================================================
                # NEGATIVE CYCLE DETECTED!
                # =========================================================
                # The edge (from_node -> to_node) is part of or leads to
                # a negative cycle. We need to trace back to find it.
                cycle_found = True
                all_relaxed_edges.append(f"{from_node}->{to_node}*")  # * marks cycle edge

                # Extract the cycle starting from to_node
                cycle = self._extract_cycle(to_node, predecessor, nodes)

                if cycle and len(cycle) >= 3:  # Valid cycle has at least 3 nodes
                    negative_cycle_nodes = cycle
                    break

        # =====================================================================
        # STEP 4: CALCULATE ARBITRAGE PROFIT
        # =====================================================================
        # If we found a negative cycle, calculate the actual profit

        if negative_cycle_nodes:
            opportunity = self._calculate_profit(negative_cycle_nodes, graph)
            if opportunity and opportunity.net_profit_pct > 0:
                all_opportunities.append(opportunity)

        # Create log entry for this run
        log = BellmanFordLog(
            timestamp=datetime.now().strftime("%H:%M:%S"),
            edges_checked=total_edges_checked,
            cycle_found=cycle_found,
            relaxed_edges=all_relaxed_edges[:10]  # Limit to 10 for display
        )

        # Store in history
        self.run_history.append(log)
        if len(self.run_history) > self.max_history:
            self.run_history.pop(0)

        return all_opportunities, log

    def _extract_cycle(
        self,
        start_node: str,
        predecessor: Dict[str, Optional[str]],
        all_nodes: List[str]
    ) -> List[str]:
        """
        Extract the negative cycle from the predecessor array.

        Algorithm:
        1. Starting from the detected node, follow predecessors backward
        2. Keep going until we revisit a node (the cycle start)
        3. Then trace from that node back to itself to get the cycle

        Args:
            start_node: Node where negative cycle was detected
            predecessor: Predecessor array from Bellman-Ford
            all_nodes: List of all nodes for safety check

        Returns:
            List of nodes forming the cycle (first and last are the same)
        """
        # First, walk back enough steps to ensure we're IN the cycle
        # (the detected node might just lead to the cycle, not be in it)
        current = start_node
        for _ in range(len(all_nodes)):
            if predecessor[current]:
                current = predecessor[current]
            else:
                return []  # No valid cycle

        # Now we're definitely in the cycle. Find where it starts.
        cycle_start = current

        # Trace the cycle
        cycle = [cycle_start]
        current = predecessor[cycle_start]

        # Safety counter to prevent infinite loops
        max_steps = len(all_nodes) + 1
        steps = 0

        while current != cycle_start and steps < max_steps:
            if current is None:
                return []
            cycle.append(current)
            current = predecessor[current]
            steps += 1

        if steps >= max_steps:
            return []  # Something went wrong

        # Add the start node again to complete the cycle
        cycle.append(cycle_start)

        # Reverse to get the cycle in forward direction
        cycle.reverse()

        return cycle

    def _calculate_profit(
        self,
        cycle: List[str],
        graph: CurrencyGraph
    ) -> Optional[ArbitrageOpportunity]:
        """
        Calculate the actual profit percentage for an arbitrage cycle.

        Given a cycle [A, B, C, A], we calculate:
        - Gross profit: rate(A->B) * rate(B->C) * rate(C->A) - 1
        - Fee cost: TRANSACTION_FEE * number_of_hops
        - Net profit: Gross profit - Fee cost

        Args:
            cycle: List of currencies forming the cycle
            graph: The currency graph with raw rates

        Returns:
            ArbitrageOpportunity if profitable, None otherwise
        """
        if len(cycle) < 3:
            return None

        # Calculate total return by following the cycle
        total_return = 1.0
        rates_used = []

        for i in range(len(cycle) - 1):
            from_currency = cycle[i]
            to_currency = cycle[i + 1]
            rate = graph.get_raw_rate(from_currency, to_currency)

            if rate <= 0:
                return None  # Invalid rate in cycle

            total_return *= rate
            rates_used.append(rate)

        # Calculate profit percentages
        # Gross profit: how much we'd make ignoring fees
        gross_profit_pct = (total_return - 1.0) * 100

        # Fee cost: 0.1% per hop
        num_hops = len(cycle) - 1
        fee_cost_pct = TRANSACTION_FEE * num_hops * 100

        # Net profit: gross minus fees
        net_profit_pct = gross_profit_pct - fee_cost_pct

        return ArbitrageOpportunity(
            path=cycle,
            gross_profit_pct=round(gross_profit_pct, 4),
            fee_cost_pct=round(fee_cost_pct, 4),
            net_profit_pct=round(net_profit_pct, 4),
            rates_used=rates_used
        )

    def get_run_history(self) -> List[Dict]:
        """
        Get the history of algorithm runs for the log panel.

        Returns:
            List of log entries as dictionaries
        """
        return [
            {
                "timestamp": log.timestamp,
                "edges_checked": log.edges_checked,
                "cycle_found": log.cycle_found,
                "relaxed_edges": log.relaxed_edges
            }
            for log in self.run_history
        ]


# Global detector instance
detector = BellmanFordDetector()


def find_arbitrage(
    graph: CurrencyGraph
) -> Tuple[List[ArbitrageOpportunity], BellmanFordLog]:
    """
    Convenience function to run arbitrage detection.

    Args:
        graph: CurrencyGraph instance

    Returns:
        Tuple of (opportunities, log_entry)
    """
    return detector.detect_arbitrage(graph)


def get_algorithm_history() -> List[Dict]:
    """
    Get the history of Bellman-Ford runs.
    """
    return detector.get_run_history()
