import numpy as np
import logging

logger = logging.getLogger("ZeroDayModule")

class ZeroDayModule:
    """
    Precision Zero-Day Module with Mathematically Consistent Entropy.
    
    Refinements:
    - Consistent Log2 base for Shannon entropy and normalization.
    - Strict [0, 1] normalization with validation assertions.
    - Standardized fusion score clamping.
    """
    
    def __init__(self, confidence_threshold=0.7, weights=None):
        self.tau = confidence_threshold
        
        # Auto-normalize weights so sum(weights) = 1
        raw_weights = weights or {
            "w_ae": 0.4,
            "w_entropy": 0.4,
            "w_bin": 0.2
        }
        
        # Weight validation
        for k, v in raw_weights.items():
            if v < 0 or not np.isfinite(v):
                logger.warning(f"Invalid weight detected for {k}: {v}. Resetting to 0.")
                raw_weights[k] = 0.0
                
        total = sum(raw_weights.values())
        if total <= 1e-9:
            logger.error("Sum of weights is zero or negligible. Defaulting to equal distribution.")
            self.weights = {k: 1.0/len(raw_weights) for k in raw_weights}
        else:
            self.weights = {k: v/total for k, v in raw_weights.items()}

    def _calculate_stabilized_entropy(self, probs):
        """
        Refined Shannon Entropy with Consistent Log Base (Log2).
        H_norm = (-Σ p_i * log2(p_i)) / log2(N)
        
        Guarantees:
        - p=[1, 0, 0] -> H_norm = 0.0
        - p=[1/N, ..., 1/N] -> H_norm = 1.0
        """
        if probs is None or len(probs) == 0:
            return 1.0
            
        probs = np.array(probs, dtype=np.float64)
        n_classes = len(probs)
        
        # 1. Epsilon Stabilization: p_i = max(p_i, 1e-12)
        eps = 1e-12
        probs_stable = np.maximum(probs, eps)
        
        # Re-normalize to ensure sum = 1 after epsilon
        probs_sum = np.sum(probs_stable)
        if probs_sum > 0:
            probs_stable /= probs_sum
        else:
            return 1.0 # Should not happen with eps
        
        # 2. Entropy Calculation (Base 2)
        # Using np.log2 for mathematical consistency with normalization base
        h = -np.sum(probs_stable * np.log2(probs_stable))
        
        # 3. Normalization logic (Base 2)
        h_max = np.log2(n_classes) if n_classes > 1 else 1.0
        h_norm = h / h_max
        
        # 4. Strict Clamping & Finite Check
        if not np.isfinite(h_norm):
            logger.error("Entropy calculation resulted in non-finite value. Defaulting to 1.0.")
            return 1.0
            
        final_h = float(max(0.0, min(1.0, h_norm)))
        
        # Assertion for research-grade verification
        assert 0.0 <= final_h <= 1.0, f"Entropy normalization error: {final_h} outside [0,1]"
        
        return final_h

    def calculate_fusion_score(self, mse, bin_prob, mc_probs, normalized_ae_max=2.0):
        """
        Z = min(max(w1*AE + w2*H + w3*U_bin, 0.0), 1.0)
        """
        # 1. AE Signal
        s_ae = max(0.0, min(mse / normalized_ae_max, 1.0))
        
        # 2. Entropy Signal (Consistent Log2)
        s_h = self._calculate_stabilized_entropy(mc_probs)
        
        # 3. Binary Uncertainty: U_binary = 1 - |p - 0.5| * 2
        s_bin = 1.0 - abs(bin_prob - 0.5) * 2
        s_bin = max(0.0, min(1.0, s_bin))

        # 4. Composite Fusion
        z_raw = (
            self.weights["w_ae"] * s_ae +
            self.weights["w_entropy"] * s_h +
            self.weights["w_bin"] * s_bin
        )
        
        # 5. Strict Clamping
        z_final = max(0.0, min(1.0, z_raw))
        if not np.isfinite(z_final):
            logger.error(f"Fusion Z-score non-finite: {z_raw}. Clamping to 0.5.")
            z_final = 0.5

        return z_final, {"s_ae": s_ae, "s_h": s_h, "s_bin": s_bin}

    def evaluate(self, 
                 anomaly_score, 
                 binary_attack_decision, 
                 signature_hit, 
                 signature_name=None,
                 predicted_attack_class=None, 
                 multiclass_probabilities=None,
                 binary_attack_prob=0.0):
        
        results = {
            "final_label": "BENIGN",
            "attack_type": "N/A",
            "decision_reason": "None",
            "confidence_score": 0.0,
            "fusion_score": 0.0,
            "fusion_breakdown": {},
            "entropy": 0.0
        }

        if signature_hit:
            results.update({
                "final_label": "SIGNATURE_HIT",
                "attack_type": signature_name or "Signature-Match",
                "decision_reason": "Deterministic Signature",
                "confidence_score": 1.0
            })
            return results

        # Fusion Stability Logic
        z_score, breakdown = self.calculate_fusion_score(
            anomaly_score, 
            binary_attack_prob, 
            multiclass_probabilities
        )
        results["fusion_score"] = z_score
        results["fusion_breakdown"] = breakdown
        results["entropy"] = breakdown["s_h"]

        # Prediction Logic
        if binary_attack_decision == "ATTACK":
            mc_conf = np.max(multiclass_probabilities) if multiclass_probabilities is not None else 0.0
            
            if z_score > 0.65 or mc_conf < self.tau:
                results.update({
                    "final_label": "ZERO_DAY_ANOMALY",
                    "attack_type": "Zero-Day Anomaly",
                    "decision_reason": f"High Fusion Score (Z={z_score:.3f})",
                    "confidence_score": mc_conf
                })
            else:
                results.update({
                    "final_label": "KNOWN_ATTACK",
                    "attack_type": predicted_attack_class or "ML-Categorized",
                    "decision_reason": "High-Confidence ML",
                    "confidence_score": mc_conf
                })
            return results

        # Escalation Logic
        if z_score > 0.55:
            results.update({
                "final_label": "SUSPICIOUS_ESCALATION",
                "attack_type": "Stealth Anomaly",
                "decision_reason": f"Heuristic Fusion Escalated (Z={z_score:.3f})",
                "confidence_score": 0.5
            })
            return results

        return results
