import numpy as np
import collections
import logging

logger = logging.getLogger("AdaptiveThresholdController")

class AdaptiveThresholdController:
    """
    Stabilized Adaptive Threshold Controller.
    
    Safety:
    - Immutable baseline anchoring.
    - Strict ±15% Drift Cap.
    - Numerical stability guards for NaN/Inf.
    """
    
    def __init__(self, 
                 initial_thresholds, 
                 min_bounds, 
                 max_bounds, 
                 window_size=100, 
                 alpha=0.01, 
                 drift_cap=0.15):
        # Immutable anchoring
        self.baselines = {name: float(val) for name, val in initial_thresholds.items() if np.isfinite(val)}
        self.thresholds = self.baselines.copy()
        self.min_bounds = min_bounds
        self.max_bounds = max_bounds
        self.window_size = window_size
        self.alpha = alpha
        self.drift_cap = drift_cap
        
        self.buffers = {name: collections.deque(maxlen=window_size) for name in self.baselines}
        self.is_frozen = False

    def set_freeze(self, should_freeze):
        self.is_frozen = should_freeze

    def add_benign_samples(self, samples_dict, confidence=1.0):
        if self.is_frozen or confidence < 0.9:
            return

        for name, scores in samples_dict.items():
            if name not in self.buffers:
                continue
            
            if not isinstance(scores, (list, np.ndarray)):
                scores = [scores]
                
            for score in scores:
                if not np.isfinite(score) or score < 0:
                    continue
                # reject outliers > 2x max bound
                if score > self.max_bounds[name] * 2.0:
                    continue
                self.buffers[name].append(score)
            
            if len(self.buffers[name]) >= self.window_size:
                self._adapt_threshold(name)

    def _adapt_threshold(self, name):
        # 1. 99th percentile candidate
        buf_list = list(self.buffers[name])
        candidate = np.percentile(buf_list, 99)
        
        # 2. EMA Update
        old_val = self.thresholds[name]
        new_val = (1 - self.alpha) * old_val + self.alpha * candidate
        
        # 3. Drift Cap Anchor (±15% of Baseline)
        base = self.baselines[name]
        lower_limit = base * (1.0 - self.drift_cap)
        upper_limit = base * (1.0 + self.drift_cap)
        
        # 4. Final Numerical Clamp
        final_val = max(self.min_bounds[name], lower_limit, 
                        min(self.max_bounds[name], upper_limit, new_val))
        
        if not np.isfinite(final_val):
            logger.error(f"Adapted threshold for {name} is non-finite. Keeping {old_val}.")
            return

        if abs(final_val - old_val) > 1e-9:
            self.thresholds[name] = final_val
            drift_pct = (final_val / base - 1) * 100
            logger.info(f"Threshold '{name}' -> {final_val:.6f} ({drift_pct:+.2f}% from baseline)")

    def get_thresholds(self):
        return self.thresholds
