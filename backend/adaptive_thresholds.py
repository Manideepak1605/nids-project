import numpy as np
import collections
import time

class AdaptiveThresholdController:
    """
    Standalone Adaptive Threshold Controller for NIDS.
    Dynamically adjusts system thresholds based on recent benign traffic behavior.
    """
    
    def __init__(self, 
                 initial_thresholds, 
                 min_bounds, 
                 max_bounds, 
                 window_size=100, 
                 alpha=0.01, 
                 cooldown_samples=50,
                 percentile=99):
        """
        :param initial_thresholds: Dict of {name: value} for starting thresholds.
        :param min_bounds: Dict of {name: min_value} for absolute minimums.
        :param max_bounds: Dict of {name: max_value} for absolute maximums.
        :param window_size: Number of samples to keep in the benign score buffer.
        :param alpha: Adaptation rate (0.0 < alpha < 1.0).
        :param cooldown_samples: Minimum samples between updates per threshold.
        :param percentile: Percentile to use for candidate threshold calculation.
        """
        self.thresholds = initial_thresholds.copy()
        self.min_bounds = min_bounds
        self.max_bounds = max_bounds
        self.window_size = window_size
        self.alpha = alpha
        self.cooldown_samples = cooldown_samples
        self.percentile = percentile
        
        # Buffers and counters
        self.buffers = {name: collections.deque(maxlen=window_size) for name in initial_thresholds}
        self.update_counters = {name: 0 for name in initial_thresholds}
        self.last_update_msg = "Initialized"

    def add_benign_samples(self, samples_dict):
        """
        Add recent benign scores to the buffers and trigger adaptation if ready.
        :param samples_dict: Dict of {threshold_name: [list of scores]} or {name: single_score}
        """
        for name, scores in samples_dict.items():
            if name not in self.buffers:
                continue
            
            if not isinstance(scores, list):
                scores = [scores]
                
            for score in scores:
                # Basic outlier filter: Ignore values far beyond max bound
                if score > self.max_bounds[name] * 1.5:
                    continue
                
                self.buffers[name].append(score)
                self.update_counters[name] += 1
                
                # Check for update trigger
                if (len(self.buffers[name]) >= self.window_size and 
                    self.update_counters[name] >= self.cooldown_samples):
                    self._adapt_threshold(name)

    def _adapt_threshold(self, name):
        """Perform statistical adaptation for a specific threshold."""
        # 1. Compute candidate threshold from buffer percentile
        candidate = np.percentile(list(self.buffers[name]), self.percentile)
        
        # 2. Gradual Update (EMA)
        old_val = self.thresholds[name]
        new_val = (1 - self.alpha) * old_val + self.alpha * candidate
        
        # 3. Clamp to bounds
        new_val = max(self.min_bounds[name], min(self.max_bounds[name], new_val))
        
        # 4. Update and reset counter
        if abs(new_val - old_val) > 1e-6:
            self.thresholds[name] = new_val
            direction = "increased" if new_val > old_val else "decreased"
            self.last_update_msg = f"Threshold '{name}' {direction} to {new_val:.6f} based on {self.percentile}th percentile."
            # print(f"[AdaptiveController] {self.last_update_msg}") # Logging
        
        self.update_counters[name] = 0

    def get_thresholds(self):
        """Return the current set of thresholds."""
        return self.thresholds

    def get_status(self):
        """Return status and log of last update."""
        return {
            "current_thresholds": self.thresholds,
            "last_log": self.last_update_msg,
            "buffer_fill": {name: len(buf) for name, buf in self.buffers.items()}
        }

if __name__ == "__main__":
    # Test instantiation
    initial = {"ae_mse": 0.1, "multiclass_tau": 0.7}
    mins = {"ae_mse": 0.05, "multiclass_tau": 0.5}
    maxs = {"ae_mse": 0.5, "multiclass_tau": 0.9}
    
    controller = AdaptiveThresholdController(initial, mins, maxs, alpha=0.1)
    print("AdaptiveThresholdController initialized.")
    print(controller.get_thresholds())
