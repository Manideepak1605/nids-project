from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
import pickle
import os
import io
import logging
import json
import datetime

# --- Setup Logging ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler("debug.log", encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

STATS_FILE = "stats.json"

def load_stats():
    defaults = {
        "total_analyzed": 0,
        "allowed": 0,
        "blocked": 0,
        "attack_types": {},
        "risk_level": "LOW",
        "last_updated": None
    }
    if os.path.exists(STATS_FILE):
        try:
            with open(STATS_FILE, "r") as f:
                loaded = json.load(f)
                return {**defaults, **loaded}
        except:
            return defaults
    return defaults

def save_stats(stats):
    with open(STATS_FILE, "w") as f:
        json.dump(stats, f, indent=2)

def update_global_stats(new_results):
    stats = load_stats()
    
    # helper for type safety
    def get_int(d, key, fallback=0):
        v = d.get(key)
        return int(v) if isinstance(v, (int, float)) else fallback

    total_analyzed = get_int(stats, "total_analyzed")
    blocked = get_int(stats, "blocked")
    allowed = get_int(stats, "allowed")
    
    attack_map = stats.get("attack_types")
    if not isinstance(attack_map, dict):
        attack_map = {}
        
    total_analyzed += len(new_results)
    
    for res in new_results:
        status = res.get("Status", "Allow")
        if status == "BLOCK":
            blocked += 1
            attack_type = str(res.get("Classification", "Unknown"))
            current_attack_count = attack_map.get(attack_type, 0)
            attack_map[attack_type] = (int(current_attack_count) if isinstance(current_attack_count, (int, float)) else 0) + 1
        else:
            allowed += 1
            
    # Simple risk level logic
    risk_level = "LOW"
    if total_analyzed > 0:
        attack_ratio = blocked / total_analyzed
        if attack_ratio > 0.2: risk_level = "CRITICAL"
        elif attack_ratio > 0.1: risk_level = "HIGH"
        elif attack_ratio > 0.05: risk_level = "MEDIUM"
        
    stats["total_analyzed"] = total_analyzed
    stats["blocked"] = blocked
    stats["allowed"] = allowed
    stats["attack_types"] = attack_map
    stats["risk_level"] = risk_level
    stats["last_updated"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    save_stats(stats)

app = Flask(__name__)
CORS(app)

# --- Configuration ---
ASSETS_DIR = os.path.join(os.path.dirname(__file__), 'assets')

AE_MODEL_PATH = os.path.join(ASSETS_DIR, 'autoencoder_model.keras')
AE_SCALER_PATH = os.path.join(ASSETS_DIR, 'scaler.pkl')
AE_THRESHOLD_PATH = os.path.join(ASSETS_DIR, 'threshold.txt')

BINARY_MODEL_PATH = os.path.join(ASSETS_DIR, 'binary_model.pkl')
BINARY_SCALER_PATH = os.path.join(ASSETS_DIR, 'binary_scaler.pkl')

MULTICLASS_MODEL_PATH = os.path.join(ASSETS_DIR, 'multiclass_model.pkl')
MULTICLASS_SCALER_PATH = os.path.join(ASSETS_DIR, 'multiclass_scaler.pkl')
ENCODER_PATH = os.path.join(ASSETS_DIR, 'label_encoder.pkl')

# --- Global Models ---
AE_ASSETS = None
BINARY_ASSETS = None
MC_ASSETS = None

def load_nids_complete_system():
    logger.info("Loading Stage 1: Autoencoder...")
    try:
        # Try loading with compile=False to bypass quantization_config errors in Keras 3
        ae_model = load_model(AE_MODEL_PATH, compile=False)
    except Exception as e:
        logger.warning(f"Standard load failed, trying safe_mode=False: {e}")
        ae_model = load_model(AE_MODEL_PATH, safe_mode=False, compile=False)
        
    with open(AE_SCALER_PATH, 'rb') as f:
        ae_scaler = pickle.load(f)
    with open(AE_THRESHOLD_PATH, 'r') as f:
        ae_threshold = float(f.read().strip())
        
    logger.info("Loading Stage 2: Binary Classifier...")
    with open(BINARY_MODEL_PATH, 'rb') as f:
        binary_model = pickle.load(f)
    with open(BINARY_SCALER_PATH, 'rb') as f:
        binary_scaler = pickle.load(f)

    logger.info("Loading Stage 3: Multi-class Classifier...")
    with open(MULTICLASS_MODEL_PATH, 'rb') as f:
        mc_model = pickle.load(f)
    with open(MULTICLASS_SCALER_PATH, 'rb') as f:
        mc_scaler = pickle.load(f)
    with open(ENCODER_PATH, 'rb') as f:
        le = pickle.load(f)
        
    return (ae_model, ae_scaler, ae_threshold), (binary_model, binary_scaler), (mc_model, mc_scaler, le)

def preprocess_flow(df_row, scaler, feature_names=None):
    if isinstance(df_row, pd.Series):
        df_row = df_row.to_frame().T
    
    # Normalize input columns
    df_row.columns = df_row.columns.str.strip()
    
    # If we have expected feature names, strictly align
    if feature_names is not None:
        aligned_data = {}
        for col in feature_names:
            if col in df_row.columns:
                aligned_data[col] = df_row[col].values[0]
            else:
                aligned_data[col] = 0
                logger.warning(f"Feature missing in upload: {col}")
        
        df_row = pd.DataFrame([aligned_data])
    
    # Clean data - convert all to numeric, errors to NaN
    for col in df_row.columns:
        df_row[col] = pd.to_numeric(df_row[col], errors='coerce')
        
    df_row = df_row.select_dtypes(include=[np.number])
    df_row.replace([np.inf, -np.inf], np.nan, inplace=True)
    df_row.fillna(0, inplace=True)
    
    return scaler.transform(df_row)

def nids_full_inference(flow_data, ae_assets, binary_assets, mc_assets):
    # 1. Anomaly Detection
    X_ae = preprocess_flow(flow_data.copy(), ae_assets[1], getattr(ae_assets[1], 'feature_names_in_', None))
    ae_pred = ae_assets[0].predict(X_ae, verbose=0)
    
    # Calculate Reconstruction Error (MSE)
    diff = X_ae - ae_pred
    mse = np.mean(np.power(diff, 2))
    
    # Threshold check
    is_anomaly = mse >= ae_assets[2]
    
    logger.info(f"Inference - MSE: {mse:.10f}, Threshold: {ae_assets[2]:.10f}, Anomaly: {is_anomaly}")
    
    if not is_anomaly:
        return {
            "id": f"EVT-{np.random.randint(1000, 9999)}",
            "Status": "Allow", 
            "Classification": "Benign", 
            "MSE": float(mse), 
            "Confidence": 1.0,
            "contributions": [],
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    
    # 2. Binary Refinement
    X_bin = preprocess_flow(flow_data.copy(), binary_assets[1], binary_assets[0].feature_names_in_)
    is_attack = binary_assets[0].predict(X_bin)[0]
    
    logger.info(f"Anomaly Detected! Binary Refinement Result: {'Attack' if is_attack == 1 else 'Benign'}")
    
    if is_attack == 0:
        return {
            "id": f"EVT-{np.random.randint(1000, 9999)}",
            "Status": "Allow", 
            "Classification": "Benign (Anomaly but Not Attack)", 
            "MSE": float(mse), 
            "Confidence": 0.85,
            "contributions": [],
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    
    # Multi-class Categorization
    X_mc = preprocess_flow(flow_data.copy(), mc_assets[1], mc_assets[0].feature_names_in_)
    attack_idx = mc_assets[0].predict(X_mc)[0]
    attack_name = mc_assets[2].inverse_transform([attack_idx])[0]
    
    # Confidence calculation
    proba = mc_assets[0].predict_proba(X_mc)
    confidence = np.max(proba)
    
    # --- XAI: Calculate Feature Contributions ---
    # We use the reconstruction error from the Autoencoder as a proxy for feature importance
    # The features with the highest error are those that deviate most from "normal"
    feature_errors = np.abs(X_ae - ae_pred)[0]
    total_error = np.sum(feature_errors)
    
    contributions = []
    if total_error > 0:
        # Get feature names from the scaler if available
        feature_names = getattr(ae_assets[1], 'feature_names_in_', [f"Feature {i}" for i in range(len(feature_errors))])
        
        # Prepare error list for sorting
        error_list = []
        for i, val in enumerate(feature_errors):
            try:
                error_list.append((int(i), float(val)))
            except:
                continue
            
        # Sort and take top 4
        error_list.sort(key=lambda x: x[1], reverse=True)
        top_features = error_list[:4]
        
        icons = ["📊", "⚡", "🔍", "🛡️"]
        for i, pair in enumerate(top_features):
            idx, err = pair
            f_idx = int(idx)
            
            # Safe feature name retrieval
            fname = "Unknown"
            if hasattr(feature_names, '__getitem__'):
                try:
                    fname = str(feature_names[f_idx])
                except:
                    fname = f"Feature {f_idx}"
            else:
                fname = f"Feature {f_idx}"

            contributions.append({
                "name": fname,
                "contribution": int((err / total_error) * 100) if total_error > 0 else 0,
                "icon": icons[i % len(icons)]
            })
    
    logger.info(f"FINAL RESULT: BLOCK - {attack_name} (Confidence: {confidence:.2f})")
    
    return {
        "id": f"EVT-{np.random.randint(1000, 9999)}", # Generate a mock ID for UI
        "Status": "BLOCK",
        "Classification": str(attack_name),
        "MSE": float(mse),
        "Confidence": float(confidence),
        "contributions": contributions,
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ready" if AE_ASSETS else "loading"})

@app.route('/analyze', methods=['POST'])
def analyze():
    if not AE_ASSETS:
        return jsonify({"error": "Models not loaded"}), 503
    
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    try:
        # Read a few rows to analyze (limit for demo purposes or handle full file)
        df = pd.read_csv(io.StringIO(file.read().decode('utf-8')))
        df.columns = df.columns.str.strip()
        logger.info(f"Uploaded columns: {df.columns.tolist()}")
        
        if 'Label' in df.columns:
            logger.info(f"Unique labels in upload: {df['Label'].unique().tolist()}")
        else:
            logger.info("No 'Label' column found in upload.")
        
        results = []
        # For performance, we limit to 100 samples
        max_samples = min(len(df), 100)
        
        for i in range(max_samples):
            sample = df.iloc[i:i+1]
            res = nids_full_inference(sample, AE_ASSETS, BINARY_ASSETS, MC_ASSETS)
            res['index'] = i
            # Add some flow info for the UI
            res['flow_id'] = str(sample.index[0])
            results.append(res)
            
        # Update persistence
        update_global_stats(results)
            
        return jsonify({
            "summary": {
                "total": len(results),
                "blocked": len([r for r in results if r['Status'] == 'BLOCK']),
                "allowed": len([r for r in results if r['Status'] == 'Allow'])
            },
            "results": results
        })
        
    except Exception as e:
        logger.error(f"Error in analyze: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/sample', methods=['GET'])
def analyze_sample():
    try:
        sample_path = 'sample_network_traffic.csv'
        if not os.path.exists(sample_path):
            return jsonify({"error": "Sample file not found. Please upload manually once."}), 404
            
        df = pd.read_csv(sample_path)
        results = []
        # Analyze first 5 rows of sample
        max_samples = min(len(df), 5)
        for i in range(max_samples):
            sample = df.iloc[i:i+1]
            res = nids_full_inference(sample, AE_ASSETS, BINARY_ASSETS, MC_ASSETS)
            res['index'] = i
            results.append(res)
            
        update_global_stats(results)
        return jsonify({
            "summary": {
                "total": len(results),
                "blocked": len([r for r in results if r['Status'] == 'BLOCK']),
                "allowed": len([r for r in results if r['Status'] == 'Allow'])
            },
            "results": results
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/stats', methods=['GET'])
def get_stats():
    return jsonify(load_stats())

if __name__ == "__main__":
    AE_ASSETS, BINARY_ASSETS, MC_ASSETS = load_nids_complete_system()
    # Bind to 0.0.0.0 to allow access from other interfaces/IPs
    app.run(host='0.0.0.0', port=5000, debug=True)
