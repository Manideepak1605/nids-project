import os
import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
import pickle
import joblib
import json
import logging
import sys

# Add current directory to path
sys.path.append(os.path.dirname(__file__))

from hybrid_engine import HybridDetectionEngine
from zeroday_module import ZeroDayModule
from adaptive_thresholds import AdaptiveThresholdController

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger("PipelineVerifier")

# --- Configuration ---
BACKEND_DIR = os.path.dirname(__file__)
ASSETS_DIR = os.path.join(BACKEND_DIR, 'assets')
COMBINE_CSV = os.path.join(os.path.dirname(BACKEND_DIR), 'combine.csv')

# Paths
AE_MODEL_PATH = os.path.join(ASSETS_DIR, 'behavior_model.keras')
AE_SCALER_PATH = os.path.join(ASSETS_DIR, 'behavior_scaler.pkl')
AE_FEATURES_PATH = os.path.join(ASSETS_DIR, 'behavior_features.json')
AE_THRESHOLD_PATH = os.path.join(ASSETS_DIR, 'threshold.txt')

BINARY_MODEL_PATH = os.path.join(ASSETS_DIR, 'binary_model_cost_sensitive.pkl')
BINARY_SCALER_PATH = os.path.join(ASSETS_DIR, 'binary_scaler_cost_sensitive.pkl')

MULTICLASS_MODEL_PATH = os.path.join(ASSETS_DIR, 'multiclass_model.pkl')
MULTICLASS_SCALER_PATH = os.path.join(ASSETS_DIR, 'multiclass_scaler.pkl')
ENCODER_PATH = os.path.join(ASSETS_DIR, 'label_encoder.pkl')

def load_system():
    logger.info("Loading 5-Stage NIDS...")
    
    # Stage 1
    ae_model = load_model(AE_MODEL_PATH, compile=False)
    ae_scaler = joblib.load(AE_SCALER_PATH)
    with open(AE_FEATURES_PATH, 'r') as f:
        ae_features = json.load(f)
    with open(AE_THRESHOLD_PATH, 'r') as f:
        ae_threshold = float(f.read().strip())
        
    # Stage 2
    binary_model = joblib.load(BINARY_MODEL_PATH)
    binary_scaler = joblib.load(BINARY_SCALER_PATH)

    # Stage 3
    hybrid_engine = HybridDetectionEngine()

    # Stage 4
    mc_model = joblib.load(MULTICLASS_MODEL_PATH)
    mc_scaler = joblib.load(MULTICLASS_SCALER_PATH)
    le = joblib.load(ENCODER_PATH)
    
    # Stage 5
    zd_module = ZeroDayModule(confidence_threshold=0.7)

    # Adaptive Controller
    at_controller = AdaptiveThresholdController(
        initial_thresholds={"ae_mse": ae_threshold, "multiclass_tau": 0.7},
        min_bounds={"ae_mse": 0.00001, "multiclass_tau": 0.5},
        max_bounds={"ae_mse": 2.0, "multiclass_tau": 0.9},
        alpha=0.01,
        window_size=100
    )
        
    return {
        "ae": (ae_model, ae_scaler, ae_features),
        "binary": (binary_model, binary_scaler),
        "hybrid": hybrid_engine,
        "mc": (mc_model, mc_scaler, le),
        "zeroday": zd_module,
        "adaptive": at_controller
    }

def preprocess(df_row, scaler, feature_names):
    X = df_row.reindex(columns=feature_names, fill_value=0)
    for col in X.columns:
        X[col] = pd.to_numeric(X[col], errors='coerce')
    X.replace([np.inf, -np.inf], np.nan, inplace=True)
    X.fillna(0, inplace=True)
    return scaler.transform(X)

def run_inference(flow_data, assets):
    at_controller = assets["adaptive"]
    current_thresholds = at_controller.get_thresholds()
    
    # Stage 1
    ae_model, ae_scaler, ae_features = assets["ae"]
    X_ae = preprocess(flow_data, ae_scaler, ae_features)
    ae_recon = ae_model.predict(X_ae, verbose=0)
    mse = np.mean(np.power(X_ae - ae_recon, 2))
    
    is_anomaly = mse >= current_thresholds["ae_mse"]

    if not is_anomaly:
        at_controller.add_benign_samples({"ae_mse": mse})
        return {"Status": "Allow", "Classification": "Benign", "MSE": mse, "Source": "AE"}

    # Stage 2
    bin_model, bin_scaler = assets["binary"]
    flow_with_score = flow_data.copy()
    flow_with_score['anomaly_score'] = mse
    X_bin = preprocess(flow_with_score, bin_scaler, bin_model.feature_names_in_)
    ml_bin_pred_val = bin_model.predict(X_bin)[0]
    ml_bin_pred = "ATTACK" if ml_bin_pred_val == 1 else "BENIGN"

    # Stage 3
    hybrid_engine = assets["hybrid"]
    flow_dict = flow_data.iloc[0].to_dict()
    hb_res = hybrid_engine.evaluate(flow_dict, ml_bin_pred)
    signature_hit = (hb_res["decision_source"] == "Signature")
    signature_name = hb_res["attack_type"] if signature_hit else None

    # Stage 4 & 5
    mc_model, mc_scaler, le = assets["mc"]
    zd_module = assets["zeroday"]
    zd_module.tau = current_thresholds["multiclass_tau"]
    
    pred_class = None
    probs = None
    
    if ml_bin_pred == "ATTACK" and not signature_hit:
        X_mc = preprocess(flow_data, mc_scaler, mc_model.feature_names_in_)
        pred_idx = mc_model.predict(X_mc)[0]
        pred_class = le.inverse_transform([pred_idx])[0]
        probs = mc_model.predict_proba(X_mc)[0]

    final_res = zd_module.evaluate(
        anomaly_score=mse,
        binary_attack_decision=ml_bin_pred,
        signature_hit=signature_hit,
        signature_name=signature_name,
        predicted_attack_class=pred_class,
        multiclass_probabilities=probs
    )
    
    return {
        "Status": "BLOCK" if final_res["final_label"] != "BENIGN" else "Allow",
        "Classification": final_res["attack_type"] if final_res["final_label"] != "BENIGN" else "Benign",
        "MSE": mse,
        "Source": final_res["decision_reason"]
    }

def main():
    if not os.path.exists(COMBINE_CSV):
        logger.error(f"File not found: {COMBINE_CSV}")
        return

    assets = load_system()
    
    logger.info(f"Reading {COMBINE_CSV}...")
    # Read a few rows to verify
    df = pd.read_csv(COMBINE_CSV, nrows=50)
    df.columns = df.columns.str.strip()
    
    print("\n" + "="*80)
    print(f"{'Index':<6} | {'Status':<8} | {'Classification':<25} | {'Source':<30}")
    print("-" * 80)
    
    for i in range(len(df)):
        try:
            sample = df.iloc[i:i+1]
            res = run_inference(sample, assets)
            print(f"{i:<6} | {res['Status']:<8} | {res['Classification']:<25} | {res['Source']:<30}")
        except Exception as e:
            print(f"{i:<6} | ERROR    | {str(e)[:25]} | Pipeline Crash")

if __name__ == "__main__":
    main()
