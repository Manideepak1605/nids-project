import numpy as np

class ZeroDayModule:
    """
    Standalone Zero-Day Detection Module for NIDS.
    Categorizes attacks as KNOWN_ATTACK or ZERO_DAY_ANOMALY based on 
    signature matches and multiclass confidence scores.
    """
    
    def __init__(self, confidence_threshold=0.7):
        """
        Initialize the module.
        :param confidence_threshold: tau (τ) - Confidence threshold for known attack classification.
        """
        self.tau = confidence_threshold

    def evaluate(self, 
                 anomaly_score, 
                 binary_attack_decision, 
                 signature_hit, 
                 signature_name=None,
                 predicted_attack_class=None, 
                 multiclass_probabilities=None):
        """
        Executes the zero-day decision logic EXACTLY as specified.
        
        :param anomaly_score: MSE from AE (Stage 1)
        :param binary_attack_decision: 'BENIGN' or 'ATTACK' (Stage 2)
        :param signature_hit: Boolean from Signature Engine (Stage 3)
        :param signature_name: Name of the signature rule that hit (if any)
        :param predicted_attack_class: Class name from Multiclass Classifier (Stage 4)
        :param multiclass_probabilities: Probabilities from Multiclass Classifier (Stage 4)
        
        :return: dict with final_label, attack_type, decision_reason, confidence_score, anomaly_score
        """
        
        results = {
            "final_label": "BENIGN",
            "attack_type": "N/A",
            "decision_reason": "None",
            "confidence_score": 0.0,
            "anomaly_score": anomaly_score
        }

        # 1. Base Case: Binary Benign
        # NOTE: We no longer immediately return here. 
        # If MSE is high but Binary says Benign, it might be a Zero-Day.
        # We proceed to check if it qualifies under other conditions.
        
        # 2. Case: Signature Hit (Overrides ML classification)
        if signature_hit:
            results["final_label"] = "KNOWN_ATTACK"
            results["attack_type"] = signature_name if signature_name else "Signature-Match"
            results["decision_reason"] = "Signature"
            return results

        # 3. Case: Binary Refined decision
        if binary_attack_decision == "ATTACK":
            # Calculate confidence from probabilities if provided
            confidence = 0.0
            if multiclass_probabilities is not None:
                if isinstance(multiclass_probabilities, (list, np.ndarray)):
                    confidence = np.max(multiclass_probabilities)
                elif isinstance(multiclass_probabilities, dict):
                    confidence = max(multiclass_probabilities.values())
            
            # Zero-Day Logic Hierarchy
            if confidence >= self.tau:
                results["final_label"] = "KNOWN_ATTACK"
                results["attack_type"] = predicted_attack_class if predicted_attack_class else "ML-Categorized"
                results["decision_reason"] = "ML (High Confidence)"
                results["confidence_score"] = confidence
            else:
                results["final_label"] = "ZERO_DAY_ANOMALY"
                results["attack_type"] = "Unknown"
                results["decision_reason"] = "Unknown (Low Confidence)"
                results["confidence_score"] = confidence
            
            return results

        # 4. Case: Binary says Benign but Stage 1 flagged as Anomaly
        # (This is reached because we know anomaly_score > threshold)
        results["final_label"] = "BENIGN"
        results["attack_type"] = "Benign"
        results["decision_reason"] = "Probable Benign (Anomalous but ML-Benign)"
        results["confidence_score"] = 0.5 # Default middle ground
        
        return results

if __name__ == "__main__":
    # Basic usage demo
    module = ZeroDayModule(confidence_threshold=0.7)
    
    # Example: Zero-Day Scenario
    print("Demo: Zero-Day Scenario")
    res = module.evaluate(
        anomaly_score=0.85, 
        binary_attack_decision="ATTACK", 
        signature_hit=False, 
        predicted_attack_class="DoS", 
        multiclass_probabilities=[0.4, 0.3, 0.3] # Max 0.4 < 0.7
    )
    print(res)
