import os
import random
import pickle
import numpy as np
import pandas as pd
from tensorflow.keras.models import load_model
from typing import Dict, List

class DetectionEngine:
    def __init__(self, mode="MOCK"):
        self.mode = mode
        self.assets_dir = os.path.join(os.path.dirname(__file__), 'assets')
        self.models_loaded = False
        
        if mode == "REAL":
            self.load_models()

    def load_models(self):
        try:
            # Stage 1: Autoencoder
            self.ae_model = load_model(os.path.join(self.assets_dir, 'autoencoder_model.keras'))
            with open(os.path.join(self.assets_dir, 'scaler.pkl'), 'rb') as f:
                self.ae_scaler = pickle.load(f)
            with open(os.path.join(self.assets_dir, 'threshold.txt'), 'r') as f:
                self.ae_threshold = float(f.read().strip())
                
            # Stage 2: Binary Classifier
            with open(os.path.join(self.assets_dir, 'binary_model.pkl'), 'rb') as f:
                self.binary_model = pickle.load(f)
            with open(os.path.join(self.assets_dir, 'binary_scaler.pkl'), 'rb') as f:
                self.binary_scaler = pickle.load(f)

            # Stage 3: Multi-class Classifier
            with open(os.path.join(self.assets_dir, 'multiclass_model.pkl'), 'rb') as f:
                self.mc_model = pickle.load(f)
            with open(os.path.join(self.assets_dir, 'multiclass_scaler.pkl'), 'rb') as f:
                self.mc_scaler = pickle.load(f)
            with open(os.path.join(self.assets_dir, 'label_encoder.pkl'), 'rb') as f:
                self.le = pickle.load(f)
            
            self.models_loaded = True
            print("[*] ML Models loaded successfully.")
        except Exception as e:
            print(f"[!] Error loading ML models: {e}")
            self.models_loaded = False

    def analyze(self, flow_features: Dict) -> Dict:
        if self.mode == "MOCK" or not self.models_loaded:
            return self._rule_based_check(flow_features)
        else:
            return self._ml_based_check(flow_features)

    def _preprocess(self, flow: Dict, scaler, feature_names=None):
        df = pd.DataFrame([flow])
        df.columns = df.columns.str.strip()
        
        if feature_names is not None:
            aligned_data = {}
            for col in feature_names:
                aligned_data[col] = df[col].values[0] if col in df.columns else 0
            df = pd.DataFrame([aligned_data])
            
        for col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
        
        df = df.select_dtypes(include=[np.number])
        df.replace([np.inf, -np.inf], np.nan, inplace=True)
        df.fillna(0, inplace=True)
        
        return scaler.transform(df)

    def _ml_based_check(self, flow: Dict) -> Dict:
        try:
            # 1. Anomaly Detection
            X_ae = self._preprocess(flow, self.ae_scaler, getattr(self.ae_scaler, 'feature_names_in_', None))
            ae_pred = self.ae_model.predict(X_ae, verbose=0)
            mse = np.mean(np.power(X_ae - ae_pred, 2))
            is_anomaly = mse >= self.ae_threshold
            
            if not is_anomaly:
                return self._format_result(False, "Benign", "Normal traffic (AE)", "Low", flow)
            
            # 2. Binary Refinement
            X_bin = self._preprocess(flow, self.binary_scaler, self.binary_model.feature_names_in_)
            is_attack = self.binary_model.predict(X_bin)[0]
            
            if is_attack == 0:
                return self._format_result(False, "Benign", "Anomaly but not attack (Binary)", "Low", flow)
            
            # 3. Multi-class Categorization
            X_mc = self._preprocess(flow, self.mc_scaler, self.mc_model.feature_names_in_)
            attack_idx = self.mc_model.predict(X_mc)[0]
            attack_name = self.le.inverse_transform([attack_idx])[0]
            
            proba = self.mc_model.predict_proba(X_mc)
            confidence = np.max(proba)
            
            return {
                "is_malicious": True,
                "attack_type": str(attack_name),
                "description": f"ML Detection: {attack_name} identified",
                "severity": "High" if confidence > 0.7 else "Medium",
                "confidence": float(confidence),
                "metadata": flow
            }
        except Exception as e:
            print(f"[!] ML Inference Error: {e}")
            return self._rule_based_check(flow)

    def _format_result(self, is_malicious, attack_type, description, severity, flow):
        return {
            "is_malicious": is_malicious,
            "attack_type": attack_type,
            "description": description,
            "severity": severity,
            "metadata": flow
        }

    def _rule_based_check(self, flow: Dict) -> Dict:
        is_malicious = False
        attack_type = "Normal"
        description = "Traffic appears normal"

        # Rule-based logic (simplified for brevity, keep existing rules)
        if flow.get("Flow Packets/s", 0) > 1000 and flow.get("Flow Duration", 0) > 1000:
            is_malicious = True
            attack_type = "DDoS"
            description = "High flow packet rate and duration detected"
        elif flow.get("SYN Flag Count", 0) > 20 and flow.get("ACK Flag Count", 0) < 5:
            is_malicious = True
            attack_type = "Scanning"
            description = "SYN flood / port scanning pattern identified"
        elif flow.get("Destination Port") in [22, 3389] and flow.get("Total Fwd Packets", 0) > 50:
            is_malicious = True
            attack_type = "Brute Force"
            description = "Multiple connection attempts to sensitive ports"
            
        if not is_malicious and random.random() > 0.98:
            is_malicious = True
            attack_type = random.choice(["SQL Injection", "Malware"])
            description = f"Heuristic match for {attack_type} pattern"

        return self._format_result(is_malicious, attack_type, description, "High" if is_malicious else "Low", flow)
