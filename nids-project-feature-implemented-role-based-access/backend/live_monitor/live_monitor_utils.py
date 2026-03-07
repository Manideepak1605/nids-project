import time
import collections
import numpy as np
import logging
from datetime import datetime

logger = logging.getLogger("NIDSUtils")

class AttackBurstMonitor:
    """
    Robust Attack Burst Detection with Zero-Division and Recovery safety.
    """
    def __init__(self, window_seconds=60, threshold_rate=0.2):
        self.window_seconds = window_seconds
        self.threshold_rate = threshold_rate
        self.history = collections.deque() # (timestamp, is_attack)
        self.is_frozen = False
        self.last_burst_end_time = 0

    def add_flow(self, is_attack):
        now = time.time()
        self.history.append((now, is_attack))
        self._cleanup(now)
        
        total_flows = len(self.history)
        if total_flows == 0:
            rate = 0.0
        else:
            attacks = sum(1 for _, atk in self.history if atk)
            rate = attacks / total_flows
        
        # Burst Logic
        if rate > self.threshold_rate:
            if not self.is_frozen:
                logger.warning(f"[{datetime.now()}] ATTACK BURST: Rate={rate:.2%}. Freezing thresholds.")
                self.is_frozen = True
            self.last_burst_end_time = now
        else:
            # Recovery Condition: Below threshold for a FULL window cycle since last burst detection
            if self.is_frozen and (now - self.last_burst_end_time >= self.window_seconds):
                logger.info(f"[{datetime.now()}] RECOVERY: Burst subsided. Unfreezing thresholds.")
                self.is_frozen = False

    def _cleanup(self, now):
        while self.history and now - self.history[0][0] > self.window_seconds:
            self.history.popleft()

    def should_freeze(self):
        return self.is_frozen

class PerformanceProfiler:
    """
    Optimized Performance Profiler with O(N) Percentile Extraction.
    - Uses numpy.partition for efficient O(N) selection.
    - Bounded window of 1000 flows avoids bottleneck.
    """
    def __init__(self, window_size=1000):
        self.window_size = window_size if window_size > 0 else 1000
        self.metrics = collections.defaultdict(lambda: collections.deque(maxlen=self.window_size))
        
        self.targets = {
            "avg": 20.0,
            "p95": 50.0,
            "max": 100.0
        }

    def record(self, stage, latency_ms):
        if not np.isfinite(latency_ms) or latency_ms < 0:
            return
            
        self.metrics[stage].append(latency_ms)
        
        if stage == "total" and latency_ms > self.targets["max"]:
            logger.warning(f"LATENCY ALERT: Flow processed in {latency_ms:.2f}ms")

    def get_report(self):
        report = {}
        for stage, values in self.metrics.items():
            if not values:
                report[stage] = {"avg": 0.0, "max": 0.0, "p95": 0.0}
                continue
            
            arr = np.array(values)
            n = len(arr)
            
            # Efficient O(N) calculation using numpy.partition instead of full sort
            # Index for 95th percentile
            idx = int(0.95 * (n - 1))
            if n > 0:
                p95 = float(np.partition(arr, idx)[idx]) if n > 1 else float(arr[0])
                avg = float(np.mean(arr))
                m_val = float(np.max(arr))
            else:
                p95 = avg = m_val = 0.0

            report[stage] = {
                "avg": avg,
                "max": m_val,
                "p95": p95
            }
        return report

    def log_summary(self):
        report = self.get_report()
        if "total" in report:
            total = report["total"]
            if total["avg"] > self.targets["avg"] or total["p95"] > self.targets["p95"]:
                logger.warning(f"PERFORMANCE DEGRADATION: Avg={total['avg']:.2f}ms, P95={total['p95']:.2f}ms")
        
        print("\n" + "="*50)
        print(f"{'STAGE':<15} | {'AVG (ms)':<10} | {'P95 (ms)':<10}")
        print("-"*50)
        for stage, s in sorted(report.items()):
            print(f"{stage:<15} | {s['avg']:<10.2f} | {s['p95']:<10.2f}")
        print("="*50 + "\n")
