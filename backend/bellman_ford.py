from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime
import math

from graph import CurrencyGraph, TRANSACTION_FEE


@dataclass
class ArbitrageOpportunity:
    path: List[str]
    gross_profit_pct: float
    fee_cost_pct: float
    net_profit_pct: float
    rates_used: List[float]


@dataclass
class BellmanFordLog:
    timestamp: str
    edges_checked: int
    cycle_found: bool
    relaxed_edges: List[str]


class BellmanFordDetector:

    def __init__(self):
        self.run_history: List[BellmanFordLog] = []
        self.max_history = 20

    def detect_arbitrage(self, graph: CurrencyGraph) -> Tuple[List[ArbitrageOpportunity], BellmanFordLog]:
        nodes = graph.get_nodes()
        edges = graph.get_edges()

        if not nodes or not edges:
            log = BellmanFordLog(
                timestamp=datetime.now().strftime("%H:%M:%S"),
                edges_checked=0,
                cycle_found=False,
                relaxed_edges=[]
            )
            return [], log

        all_opportunities: List[ArbitrageOpportunity] = []
        total_edges_checked = 0
        all_relaxed_edges: List[str] = []
        cycle_found = False

        source = nodes[0]
        distance: Dict[str, float] = {node: float('inf') for node in nodes}
        distance[source] = 0.0
        predecessor: Dict[str, Optional[str]] = {node: None for node in nodes}

        for iteration in range(len(nodes) - 1):
            relaxation_occurred = False
            for from_node, to_node, weight, _ in edges:
                total_edges_checked += 1
                if distance[from_node] + weight < distance[to_node]:
                    distance[to_node] = distance[from_node] + weight
                    predecessor[to_node] = from_node
                    relaxation_occurred = True
                    if iteration < 2:
                        all_relaxed_edges.append(f"{from_node}->{to_node}")
            if not relaxation_occurred:
                break

        negative_cycle_nodes: List[str] = []

        for from_node, to_node, weight, _ in edges:
            total_edges_checked += 1
            if distance[from_node] + weight < distance[to_node]:
                cycle_found = True
                all_relaxed_edges.append(f"{from_node}->{to_node}*")
                cycle = self._extract_cycle(to_node, predecessor, nodes)
                if cycle and len(cycle) >= 3:
                    negative_cycle_nodes = cycle
                    break

        if negative_cycle_nodes:
            opportunity = self._calculate_profit(negative_cycle_nodes, graph)
            if opportunity and opportunity.net_profit_pct > 0:
                all_opportunities.append(opportunity)

        log = BellmanFordLog(
            timestamp=datetime.now().strftime("%H:%M:%S"),
            edges_checked=total_edges_checked,
            cycle_found=cycle_found,
            relaxed_edges=all_relaxed_edges[:10]
        )

        self.run_history.append(log)
        if len(self.run_history) > self.max_history:
            self.run_history.pop(0)

        return all_opportunities, log

    def _extract_cycle(self, start_node: str, predecessor: Dict[str, Optional[str]], all_nodes: List[str]) -> List[str]:
        current = start_node
        for _ in range(len(all_nodes)):
            if predecessor[current]:
                current = predecessor[current]
            else:
                return []

        cycle_start = current
        cycle = [cycle_start]
        current = predecessor[cycle_start]
        max_steps = len(all_nodes) + 1
        steps = 0

        while current != cycle_start and steps < max_steps:
            if current is None:
                return []
            cycle.append(current)
            current = predecessor[current]
            steps += 1

        if steps >= max_steps:
            return []

        cycle.append(cycle_start)
        cycle.reverse()
        return cycle

    def _calculate_profit(self, cycle: List[str], graph: CurrencyGraph) -> Optional[ArbitrageOpportunity]:
        if len(cycle) < 3:
            return None

        total_return = 1.0
        rates_used = []

        for i in range(len(cycle) - 1):
            rate = graph.get_raw_rate(cycle[i], cycle[i + 1])
            if rate <= 0:
                return None
            total_return *= rate
            rates_used.append(rate)

        gross_profit_pct = (total_return - 1.0) * 100
        fee_cost_pct = TRANSACTION_FEE * (len(cycle) - 1) * 100
        net_profit_pct = gross_profit_pct - fee_cost_pct

        return ArbitrageOpportunity(
            path=cycle,
            gross_profit_pct=round(gross_profit_pct, 4),
            fee_cost_pct=round(fee_cost_pct, 4),
            net_profit_pct=round(net_profit_pct, 4),
            rates_used=rates_used
        )

    def get_run_history(self) -> List[Dict]:
        return [
            {
                "timestamp": log.timestamp,
                "edges_checked": log.edges_checked,
                "cycle_found": log.cycle_found,
                "relaxed_edges": log.relaxed_edges
            }
            for log in self.run_history
        ]


detector = BellmanFordDetector()


def find_arbitrage(graph: CurrencyGraph) -> Tuple[List[ArbitrageOpportunity], BellmanFordLog]:
    return detector.detect_arbitrage(graph)


def get_algorithm_history() -> List[Dict]:
    return detector.get_run_history()