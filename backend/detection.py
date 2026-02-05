import random
from typing import Dict, List

class DetectionEngine:
    def __init__(self, mode="MOCK"):
        self.mode = mode
        self.rules = [
            {"type": "DDoS", "packet_threshold": 100, "description": "High packet rate detected"},
            {"type": "Brute Force", "port": 22, "packet_threshold": 50, "description": "SSH Brute force attempt"},
            {"type": "SQL Injection", "payload_pattern": "SELECT", "description": "SQL keyword in payload"}
        ]

    def analyze(self, flow_features: Dict) -> Dict:
        if self.mode == "MOCK":
            return self._rule_based_check(flow_features)
        else:
            return self._ml_based_check(flow_features)

    def _rule_based_check(self, flow: Dict) -> Dict:
        # Advanced logic using the 70+ feature set
        is_malicious = False
        attack_type = "Normal"
        description = "Traffic appears normal"

        # 1. DDoS Detection (Packet rate + Flow duration)
        if flow.get("Flow Packets/s", 0) > 1000 and flow.get("Flow Duration", 0) > 1000:
            is_malicious = True
            attack_type = "DDoS"
            description = "High flow packet rate and duration detected"
        
        # 2. Port Scan / Scanning (Flag patterns + Port)
        elif flow.get("SYN Flag Count", 0) > 20 and flow.get("ACK Flag Count", 0) < 5:
            is_malicious = True
            attack_type = "Scanning"
            description = "SYN flood / port scanning pattern identified"
        
        # 3. Brute Force (Specific port + Packet count)
        elif flow.get("Destination Port") in [22, 3389] and flow.get("Total Fwd Packets", 0) > 50:
            is_malicious = True
            attack_type = "Brute Force"
            description = "Multiple connection attempts to sensitive ports"
            
        # 4. Infiltration (Anomaly in Header length / Payload ratio)
        elif flow.get("Fwd Header Length", 0) > 5000 and flow.get("Total Length of Fwd Packets", 0) < 1000:
            is_malicious = True
            attack_type = "Infiltration"
            description = "Anomalously high header-to-payload ratio"

        # Random injection for mock variety
        if not is_malicious and random.random() > 0.98:
            is_malicious = True
            attack_type = random.choice(["SQL Injection", "Malware"])
            description = f"Heuristic match for {attack_type} pattern"

        return {
            "is_malicious": is_malicious,
            "attack_type": attack_type,
            "description": description,
            "severity": "High" if is_malicious else "Low",
            "metadata": flow
        }

    def _ml_based_check(self, flow: Dict) -> Dict:
        # Placeholder for real ML model integration
        # For now, falls back to rules until model is plugged in
        return self._rule_based_check(flow)
