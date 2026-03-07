import pandas as pd
import numpy as np
import logging

# Configure basic logging for the hybrid engine
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("HybridDetectionEngine")

class SignatureRule:
    """Base class for all deterministic signature rules."""
    def __init__(self, name):
        self.name = name

    def check(self, flow_features):
        """
        Evaluates the rule against flow features.
        Returns: (hit: bool, rule_name: str)
        """
        raise NotImplementedError("Subclasses must implement check()")

class SSHBruteForceRule(SignatureRule):
    """Detects suspicious SSH connection patterns (Port 22)."""
    def __init__(self):
        super().__init__("SSH Brute Force")

    def check(self, flow_features):
        # Deterministic check: Port 22, low packet volume, characteristic of auth attempts
        dest_port = flow_features.get('Destination Port', 0)
        total_fwd_pkts = flow_features.get('Total Fwd Packets', 0)
        flow_duration = flow_features.get('Flow Duration', 0)
        
        hit = (dest_port == 22) and (total_fwd_pkts > 0 and total_fwd_pkts < 15) and (flow_duration > 0 and flow_duration < 5000)
        return hit, self.name

class PortScanRule(SignatureRule):
    """Detects rapid, minimal-packet port probes."""
    def __init__(self):
        super().__init__("Port Scan")

    def check(self, flow_features):
        # Deterministic check: Extremely short duration, minimal packets (SYN scan style)
        flow_duration = flow_features.get('Flow Duration', 0)
        total_pkts = flow_features.get('Total Fwd Packets', 0) + flow_features.get('Total Backward Packets', 0)
        
        hit = (flow_duration < 1000) and (total_pkts > 0 and total_pkts <= 3)
        return hit, self.name

class DoSRateRule(SignatureRule):
    """Detects volume-based DoS patterns."""
    def __init__(self):
        super().__init__("DoS (Rate-based)")

    def check(self, flow_features):
        # Deterministic check: High packet rate or byte rate
        flow_pkts_s = flow_features.get('Flow Packets/s', 0)
        flow_bytes_s = flow_features.get('Flow Bytes/s', 0)
        
        # High thresholds for conservative signature detection
        hit = (flow_pkts_s > 50000) or (flow_bytes_s > 1000000)
        return hit, self.name

class HybridDetectionEngine:
    """
    Standalone module to fuse Machine Learning decisions with Signature-based rules.
    Logic: Signature hits override ML.
    """
    def __init__(self):
        self.rules = [
            SSHBruteForceRule(),
            PortScanRule(),
            DoSRateRule()
        ]
        logger.info("Hybrid Detection Engine initialized with %d signatures.", len(self.rules))

    def evaluate(self, flow_features, ml_binary_prediction, ml_predicted_attack_type=None, ml_probability=None):
        """
        Parameters:
        - flow_features: dict containing flow attributes
        - ml_binary_prediction: "BENIGN" or "ATTACK"
        - ml_predicted_attack_type: (optional) String from multiclass stage
        - ml_probability: (optional) Float confidence
        
        Returns: Dict containing final_decision, decision_source, attack_type, and explanation.
        """
        
        # 1. Check Signatures first (Override Logic)
        for rule in self.rules:
            hit, rule_name = rule.check(flow_features)
            if hit:
                return {
                    "final_decision": "ATTACK",
                    "decision_source": "Signature",
                    "attack_type": rule_name,
                    "explanation": f"Signature hit triggered: {rule_name}. (ML suggested: {ml_binary_prediction})"
                }
        
        # 2. Fallback to ML Decision
        if ml_binary_prediction == "ATTACK":
            return {
                "final_decision": "ATTACK",
                "decision_source": "ML",
                "attack_type": ml_predicted_attack_type if ml_predicted_attack_type else "ML-Unknown",
                "explanation": f"ML detected attack with probability {ml_probability if ml_probability else 'N/A'}."
            }
        
        # 3. Default to Benign
        return {
            "final_decision": "BENIGN",
            "decision_source": "None",
            "attack_type": "N/A",
            "explanation": "No signatures hit and ML predicts Benign."
        }

if __name__ == "__main__":
    # Internal module demo
    engine = HybridDetectionEngine()
    
    # Example: Pseudo-Signature match
    sample_feat = {'Destination Port': 22, 'Total Fwd Packets': 5, 'Flow Duration': 2000}
    res = engine.evaluate(sample_feat, "BENIGN")
    print("\n[Demo - Signature Override]")
    print(res)
    
    # Example: ML only match
    sample_feat_ml = {'Destination Port': 80, 'Total Fwd Packets': 100, 'Flow Duration': 100000}
    res_ml = engine.evaluate(sample_feat_ml, "ATTACK", "DDoS")
    print("\n[Demo - ML Only]")
    print(res_ml)
