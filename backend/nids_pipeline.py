import os
import joblib
import logging
import json
import time
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import load_model
from hybrid_engine import HybridDetectionEngine
from zeroday_module import ZeroDayModule
from adaptive_thresholds import AdaptiveThresholdController
from live_monitor.live_monitor_utils import AttackBurstMonitor, PerformanceProfiler

logger = logging.getLogger("NIDSPipeline")

class NIDSPipeline:
    """
    High-Precision Research-Grade NIDS Inference Engine.
    
    Refinements:
    - Stabilized Shannon Entropy
    - Formal Binary Uncertainty (1 - |p-0.5|*2)
    - Burst-Cycle Recovery Logic
    - Latency Target Enforcement
    """

    def __init__(self, assets_dir):
        self.assets_dir = assets_dir
        self._load_all_stages()
        
        # High-Precision Control logic
        self.burst_monitor = AttackBurstMonitor(window_seconds=60, threshold_rate=0.20)
        self.profiler = PerformanceProfiler(window_size=100)
        
        # Formal Severity Mapping
        self.severity_map = {
            "SIGNATURE_HIT": "CRITICAL",
            "KNOWN_ATTACK": "HIGH",
            "ZERO_DAY_ANOMALY": "HIGH",
            "SUSPICIOUS_ESCALATION": "MEDIUM",
            "BENIGN": "LOW"
        }

    def _load_all_stages(self):
        logger.info("Initializing High-Precision NIDS Pipeline...")
        try:
            self.hybrid_engine = HybridDetectionEngine()
            
            # Load Assets
            self.binary_model = joblib.load(os.path.join(self.assets_dir, 'binary_model_cost_sensitive.pkl'))
            self.binary_scaler = joblib.load(os.path.join(self.assets_dir, 'binary_scaler_cost_sensitive.pkl'))
            
            self.ae_model = load_model(os.path.join(self.assets_dir, 'behavior_model.keras'), compile=False)
            self.ae_scaler = joblib.load(os.path.join(self.assets_dir, 'behavior_scaler.pkl'))
            with open(os.path.join(self.assets_dir, 'behavior_features.json'), 'r') as f:
                self.ae_features = json.load(f)
            with open(os.path.join(self.assets_dir, 'threshold.txt'), 'r') as f:
                self.ae_initial_threshold = float(f.read().strip())

            self.mc_model = joblib.load(os.path.join(self.assets_dir, 'multiclass_model.pkl'))
            self.mc_scaler = joblib.load(os.path.join(self.assets_dir, 'multiclass_scaler.pkl'))
            self.label_encoder = joblib.load(os.path.join(self.assets_dir, 'label_encoder.pkl'))

            # Setup Deciders
            self.zeroday_module = ZeroDayModule(confidence_threshold=0.7)
            self.at_controller = AdaptiveThresholdController(
                initial_thresholds={"ae_mse": self.ae_initial_threshold, "multiclass_tau": 0.7},
                min_bounds={"ae_mse": 1e-8, "multiclass_tau": 0.5},
                max_bounds={"ae_mse": 2.0, "multiclass_tau": 0.9}
            )
            logger.info("NIDSPipeline: Research-grade setup complete.")
        except Exception as e:
            logger.error(f"NIDSPipeline initialization failed: {e}")
            raise

    def _preprocess(self, df_row, scaler, feature_names):
        if isinstance(df_row, pd.Series):
            df_row = df_row.to_frame().T
        # Strict numeric enforcement for numerical stability
        X = df_row.reindex(columns=feature_names, fill_value=0)
        X = X.apply(pd.to_numeric, errors='coerce').fillna(0)
        X.replace([np.inf, -np.inf], 0, inplace=True)
        return scaler.transform(X)

    def predict_live(self, feature_vector):
        start_flow = time.perf_counter()
        
        results = {
            "label": "Normal",
            "confidence": 1.0,
            "severity": "LOW",
            "signature_hit": False,
            "behavior_flag": False,
            "zero_day_flag": False,
            "mse": 0.0,
            "fusion_score": 0.0,
            "entropy": 0.0,
            "stage_times": {}
        }

        # Handle various input formats
        if isinstance(feature_vector, dict):
            df_row = pd.DataFrame([feature_vector])
        else:
            df_row = feature_vector

        # --- STAGE 1: SIGNATURES ---
        t1 = time.perf_counter()
        flow_dict = df_row.iloc[0].to_dict()
        sig_res = self.hybrid_engine.evaluate(flow_dict, "BENIGN")
        self.profiler.record("signature", (time.perf_counter() - t1) * 1000)

        if sig_res["decision_source"] == "Signature":
            results.update({
                "label": sig_res["attack_type"],
                "signature_hit": True,
                "severity": self.severity_map["SIGNATURE_HIT"]
            })
            self._finalize_flow_metrics(results, start_flow)
            return results

        # --- STAGE 2: BINARY (Probability for Fusion) ---
        t2 = time.perf_counter()
        X_bin = self._preprocess(df_row, self.binary_scaler, self.binary_model.feature_names_in_)
        if hasattr(self.binary_model, 'predict_proba'):
            bin_probs = self.binary_model.predict_proba(X_bin)[0]
        else:
            # Fallback for models without proba
            pred = self.binary_model.predict(X_bin)[0]
            bin_probs = [0.0, 1.0] if pred == 1 else [1.0, 0.0]
            
        bin_attack_prob = float(bin_probs[1])
        bin_label = "ATTACK" if bin_attack_prob > 0.5 else "BENIGN"
        self.profiler.record("binary", (time.perf_counter() - t2) * 1000)

        # --- STAGE 3: AUTOENCODER ---
        t3 = time.perf_counter()
        thr = self.at_controller.get_thresholds()
        X_ae = self._preprocess(df_row, self.ae_scaler, self.ae_features)
        ae_recon = self.ae_model.predict(X_ae, verbose=0)
        mse = float(np.mean(np.power(X_ae - ae_recon, 2)))
        is_ae_anomaly = mse >= thr["ae_mse"]
        results.update({"mse": mse, "behavior_flag": is_ae_anomaly})
        self.profiler.record("autoencoder", (time.perf_counter() - t3) * 1000)

        # Optimization: Quick exit if high confidence Benign
        if bin_label == "BENIGN" and not is_ae_anomaly:
            self._process_feedback(mse, 1.0 - bin_attack_prob, is_atk=False)
            self._finalize_flow_metrics(results, start_flow)
            return results

        # --- STAGE 4: MULTICLASS ---
        t4 = time.perf_counter()
        X_mc = self._preprocess(df_row, self.mc_scaler, self.mc_model.feature_names_in_)
        mc_probs = self.mc_model.predict_proba(X_mc)[0]
        mc_idx = np.argmax(mc_probs)
        pred_class = self.label_encoder.inverse_transform([mc_idx])[0]
        self.profiler.record("multiclass", (time.perf_counter() - t4) * 1000)

        # --- STAGE 5: ZERO-DAY (Normalized Fusion) ---
        t5 = time.perf_counter()
        zd = self.zeroday_module.evaluate(
            anomaly_score=mse,
            binary_attack_decision=bin_label,
            signature_hit=False,
            predicted_attack_class=pred_class,
            multiclass_probabilities=mc_probs,
            binary_attack_prob=bin_attack_prob
        )
        self.profiler.record("zero_day", (time.perf_counter() - t5) * 1000)

        # --- STAGE 6: FINALIZATION & SAFETY ---
        final_label = zd["final_label"]
        results.update({
            "label": zd["attack_type"] if final_label != "BENIGN" else "Normal",
            "confidence": zd["confidence_score"],
            "severity": self.severity_map.get(final_label, "LOW"),
            "zero_day_flag": final_label == "ZERO_DAY_ANOMALY",
            "fusion_score": zd["fusion_score"],
            "entropy": zd["entropy"]
        })

        # Feedback & Burst Control
        is_atk = final_label not in ["BENIGN", "NORMAL"]
        self._process_feedback(mse, 1.0 - bin_attack_prob, is_atk)

        self._finalize_flow_metrics(results, start_flow)
        return results

    def _process_feedback(self, mse, ben_conf, is_atk):
        # 1. Update Burst Monitor
        self.burst_monitor.add_flow(is_atk)
        # 2. Sync Controller Freeze state
        self.at_controller.set_freeze(self.burst_monitor.should_freeze())
        # 3. Add samples if not attack
        if not is_atk:
            self.at_controller.add_benign_samples({"ae_mse": mse}, confidence=ben_conf)

    def _finalize_flow_metrics(self, results, start_time):
        total_ms = (time.perf_counter() - start_time) * 1000
        self.profiler.record("total", total_ms)
        # Include current window timings for monitoring
        results["stage_times"] = {k: float(v[-1]) for k, v in self.profiler.metrics.items() if v}
        
        # Periodic report
        if len(self.profiler.metrics["total"]) % 100 == 0:
            self.profiler.log_summary()

    def get_performance_stats(self):
        return self.profiler.get_report()
