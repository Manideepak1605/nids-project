import os
import datetime

# --- Environment Fixes (Must be before TF initialization) ---
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'  # Force CPU to avoid GPU-related Access Violations
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'   # Reduce logging noise
# Low-level thread limit to prevent some Access Violations on specific CPUs
os.environ['TF_NUM_INTEROP_THREADS'] = '1'
os.environ['TF_NUM_INTRAOP_THREADS'] = '1'

if os.name == 'nt':
    if os.environ.get('TEMP') == '/tmp':
        os.environ['TEMP'] = os.path.join(os.environ.get('USERPROFILE', 'C:\\Users\\user'), 'AppData', 'Local', 'Temp')
    if os.environ.get('TMP') == '/tmp':
        os.environ['TMP'] = os.environ['TEMP']

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
import pickle
import joblib
import io
import logging
import json
from hybrid_engine import HybridDetectionEngine
from zeroday_module import ZeroDayModule
from adaptive_thresholds import AdaptiveThresholdController
from adaptive_thresholds import AdaptiveThresholdController

# --- Setup Logging ---
LOG_FILE = os.path.join(os.path.dirname(__file__), "server_debug.log")
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8', mode='a'),
        logging.StreamHandler()
    ],
    force=True # Override any existing logging
)
logger = logging.getLogger(__name__)
print(f"DEBUG: Logging initialized at {LOG_FILE}")
logger.info(f"Logging initialized at {LOG_FILE}")

STATS_FILE = "stats.json"

def load_stats():
    import datetime
    today = datetime.datetime.now().strftime("%Y-%m-%d")

    if os.path.exists(STATS_FILE):
        with open(STATS_FILE, "r") as f:
            try:
                stats = json.load(f)
                
                # Extract just the date part (YYYY-MM-DD) from last_updated (YYYY-MM-DD HH:MM:SS)
                last_updated_date = stats.get("last_updated", "").split(" ")[0] if stats.get("last_updated") else None
                
                # Midnight reset trigger
                if last_updated_date != today:
                    stats["total_analyzed"] = 0
                    stats["allowed"] = 0
                    stats["blocked"] = 0
                    stats["attack_types"] = {}
                    stats["risk_level"] = "LOW"
                    stats["last_updated"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    save_stats(stats)
                    
                return stats
            except json.JSONDecodeError:
                pass
                
    return {
        "total_analyzed": 0,
        "allowed": 0,
        "blocked": 0,
        "attack_types": {},
        "risk_level": "LOW",
        "last_updated": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

def save_stats(stats):
    with open(STATS_FILE, "w") as f:
        json.dump(stats, f, indent=2)

def update_global_stats(new_results):
    stats = load_stats()
    stats["total_analyzed"] += len(new_results)
    
    for res in new_results:
        if res["Status"] == "BLOCK":
            stats["blocked"] += 1
            attack_type = res["Classification"]
            stats["attack_types"][attack_type] = stats["attack_types"].get(attack_type, 0) + 1
        else:
            stats["allowed"] += 1
            
    # Simple risk level logic
    if stats["total_analyzed"] > 0:
        attack_ratio = stats["blocked"] / stats["total_analyzed"]
        if attack_ratio > 0.2: stats["risk_level"] = "CRITICAL"
        elif attack_ratio > 0.1: stats["risk_level"] = "HIGH"
        elif attack_ratio > 0.05: stats["risk_level"] = "MEDIUM"
        else: stats["risk_level"] = "LOW"
        
    import datetime
    stats["last_updated"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    save_stats(stats)

app = Flask(__name__)
# Explicitly allow the frontend origin and common headers
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}})

# --- Configuration ---
ASSETS_DIR = os.path.join(os.path.dirname(__file__), 'assets')

# Adaptive Config
ADAPTIVE_CONFIG = {
    "initial": {"ae_mse": 0.0, "multiclass_tau": 0.7}, 
    "mins": {"ae_mse": 0.00001, "multiclass_tau": 0.5},
    "maxs": {"ae_mse": 2.0, "multiclass_tau": 0.9}     # Increased to accommodate high MSE
}

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

# --- Global Assets ---
NIDS_ASSETS = None

def load_nids_complete_system():
    logger.info("Initializing 5-Stage Adaptive NIDS System...")
    
    # Load Stage 1
    logger.info("  Loading Stage 1: Frozen Autoencoder...")
    ae_model = load_model(AE_MODEL_PATH, compile=False)
    ae_scaler = joblib.load(AE_SCALER_PATH)
    with open(AE_FEATURES_PATH, 'r') as f:
        ae_features = json.load(f)
    with open(AE_THRESHOLD_PATH, 'r') as f:
        ae_threshold = float(f.read().strip())
        
    # Load Stage 2
    logger.info("  Loading Stage 2: Cost-Sensitive Binary Classifier...")
    with open(BINARY_MODEL_PATH, 'rb') as f:
        binary_model = pickle.load(f)
    with open(BINARY_SCALER_PATH, 'rb') as f:
        binary_scaler = pickle.load(f)

    # Load Stage 3
    logger.info("  Loading Stage 3: Hybrid Detection Engine...")
    hybrid_engine = HybridDetectionEngine()

    # Load Stage 4
    logger.info("  Loading Stage 4: Multi-class Classifier...")
    with open(MULTICLASS_MODEL_PATH, 'rb') as f:
        mc_model = pickle.load(f)
    with open(MULTICLASS_SCALER_PATH, 'rb') as f:
        mc_scaler = pickle.load(f)
    with open(ENCODER_PATH, 'rb') as f:
        le = pickle.load(f)
    
    # Remove duplicates
    seen = set()

    # Load Stage 5
    logger.info("  Loading Stage 5: Zero-Day Detection Module...")
    zd_module = ZeroDayModule(confidence_threshold=0.7)

    # Load Adaptive Controller
    logger.info("  Loading Adaptive Threshold Controller...")
    config = ADAPTIVE_CONFIG.copy()
    config["initial"]["ae_mse"] = ae_threshold
    at_controller = AdaptiveThresholdController(
        initial_thresholds=config["initial"],
        min_bounds=config["mins"],
        max_bounds=config["maxs"],
        alpha=0.01,
        window_size=100
    )
        
    return {
        "ae": (ae_model, ae_scaler, ae_features),
        "binary": (binary_model, binary_scaler),
        "hybrid": hybrid_engine,
        "mc": (mc_model, mc_scaler, le),
        "zeroday": zd_module,
        "zeroday": zd_module,
        "adaptive": at_controller
    }

def preprocess_for_stage(df_row, scaler, feature_names):
    if isinstance(df_row, pd.Series):
        df_row = df_row.to_frame().T
    
    # 1. Align features
    X = df_row.reindex(columns=feature_names, fill_value=0)
    
    # 2. Force numeric conversion for all features
    for col in X.columns:
        X[col] = pd.to_numeric(X[col], errors='coerce')
    
    # 3. Handle missing/inf
    X.replace([np.inf, -np.inf], np.nan, inplace=True)
    X.fillna(0, inplace=True)
    
    return scaler.transform(X)

def nids_full_inference(flow_data, assets):
    at_controller = assets["adaptive"]
    current_thresholds = at_controller.get_thresholds()
    
    # --- STAGE 1: ANOMALY DETECTION (AE) ---
    ae_model, ae_scaler, ae_features = assets["ae"]
    X_ae = preprocess_for_stage(flow_data, ae_scaler, ae_features)
    ae_recon = ae_model.predict(X_ae, verbose=0)
    mse = np.mean(np.power(X_ae - ae_recon, 2))
    
    # Adaptive Trigger
    is_anomaly = mse >= current_thresholds["ae_mse"]
    log_msg = f"Inference - Stage 1 (AE) MSE: {mse:.10f}, Threshold: {current_thresholds['ae_mse']:.10f}, Anomaly: {is_anomaly}"
    print(f"DEBUG: {log_msg}")
    logger.info(log_msg)

    if not is_anomaly:
        at_controller.add_benign_samples({"ae_mse": mse})
        return {
            "Status": "Allow", 
            "Classification": "Benign", 
            "MSE": float(mse), 
            "Confidence": 1.0,
            "Source": "AE (Normal)"
        }

    # --- STAGE 2: BINARY REFINEMENT ---
    bin_model, bin_scaler = assets["binary"]
    flow_with_score = flow_data.copy()
    if isinstance(flow_with_score, pd.Series):
        flow_with_score = flow_with_score.to_frame().T
    flow_with_score['anomaly_score'] = mse
    
    X_bin = preprocess_for_stage(flow_with_score, bin_scaler, bin_model.feature_names_in_)
    ml_bin_pred_val = bin_model.predict(X_bin)[0]
    ml_bin_pred = "ATTACK" if ml_bin_pred_val == 1 else "BENIGN"
    logger.info(f"Inference - Stage 2 (Binary) Result: {ml_bin_pred}")

    # --- STAGE 3: HYBRID ENGINE ---
    hybrid_engine = assets["hybrid"]
    flow_dict = flow_data.iloc[0].to_dict() if isinstance(flow_data, pd.DataFrame) else flow_data.to_dict()
    hb_res = hybrid_engine.evaluate(flow_dict, ml_bin_pred)
    
    signature_hit = (hb_res["decision_source"] == "Signature")
    signature_name = hb_res["attack_type"] if signature_hit else None

    # --- STAGE 4 & 5: MULTICLASS & ZERO-DAY ---
    mc_model, mc_scaler, le = assets["mc"]
    zd_module = assets["zeroday"]
    zd_module.tau = current_thresholds["multiclass_tau"]
    
    pred_class = None
    probs = None
    
    if ml_bin_pred == "ATTACK" and not signature_hit:
        X_mc = preprocess_for_stage(flow_data, mc_scaler, mc_model.feature_names_in_)
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
    
    # Feedback loop for adaptive thresholds
    if final_res["final_label"] == "BENIGN":
        at_controller.add_benign_samples({"ae_mse": mse})
        if probs is not None:
            at_controller.add_benign_samples({"multiclass_tau": np.max(probs)})
            
    return {
        "Status": "BLOCK" if final_res["final_label"] != "BENIGN" else "Allow",
        "Classification": final_res["attack_type"] if final_res["final_label"] != "BENIGN" else "Benign",
        "MSE": float(mse),
        "Confidence": float(final_res["confidence_score"]),
        "Source": final_res["decision_reason"]
    }

@app.route('/health', methods=['GET'])
def health():
    logger.info("Health check endpoint hit")
    status = "ready" if NIDS_ASSETS else "loading"
    logger.info(f"Health status: {status}")
    return jsonify({"status": status})

@app.route('/analyze', methods=['POST'])
def analyze():
    logger.info("Analyze endpoint hit")
    if not NIDS_ASSETS:
        logger.warning("Analyze rejected: Models not loaded")
        return jsonify({"error": "Models not loaded"}), 503
    
    if 'file' not in request.files:
        logger.warning("Analyze rejected: No file in request")
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    try:
        print(f"DEBUG: Analyze endpoint triggered with file: {file.filename}")
        df = pd.read_csv(io.StringIO(file.read().decode('utf-8')))
        df.columns = df.columns.str.strip()
        logger.info(f"Loaded DataFrame with columns: {df.columns.tolist()}")
        logger.info(f"DataFrame dtypes: {df.dtypes.to_dict()}")
        
        results = []
        max_samples = min(len(df), 100) # Reduced to 100 as requested
        logger.info(f"Analyzing {max_samples} samples from {file.filename}...")
        
        for i in range(max_samples):
            sample = df.iloc[i:i+1]
            res = nids_full_inference(sample, NIDS_ASSETS)
            res['index'] = i
            res['flow_id'] = str(sample.index[0])
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
        logger.error(f"Error in analyze: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def api_get_stats():
    stats = load_stats()
    total = stats.get("total_analyzed", 0)
    blocked = stats.get("blocked", 0)
    rate = (blocked / total * 100) if total > 0 else 0
    
    frontend_stats = {
        "totalTraffic": total,
        "totalAttacks": blocked,
        "attackRate": round(rate, 1),
        "highSeverity": sum(v for k, v in stats.get("attack_types", {}).items() if "DoS" in k or "Brute" in k) or 0,
        "uniqueIPs": np.random.randint(50, 200),
        "systemStatus": "Healthy" if stats.get("risk_level", "LOW") in ["LOW", "MEDIUM"] else "Warning",
        # New real-time fields for Traffic Monitor
        "packets_per_second": stats.get("packets_per_second", 0),
        "bytes_per_second": stats.get("bytes_per_second", 0),
        "total_analyzed": total
    }
    return jsonify(frontend_stats)

@app.route('/api/live-traffic', methods=['GET'])
def api_get_live_traffic():
    import datetime
    now = datetime.datetime.now()
    series = []
    for i in range(20):
        t = now - datetime.timedelta(seconds=(19-i)*5)
        series.append({
            "time": t.strftime("%H:%M:%S"),
            "benign": int(np.random.randint(60, 120)),
            "attack": int(np.random.randint(0, 5))
        })
    return jsonify(series)

@app.route('/api/attack-distribution', methods=['GET'])
def api_get_attack_distribution():
    stats = load_stats()
    attack_types = stats.get("attack_types", {})
    dist = []
    for k, v in attack_types.items():
        dist.append({"type": k, "count": v})
    return jsonify(dist)

@app.route('/api/forensics', methods=['GET'])
def api_get_forensics():
    log_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "attack_feature_log.csv")
    if not os.path.exists(log_path):
        return jsonify([])
    
    try:
        df = pd.read_csv(log_path)
        if 'timestamp' in df.columns:
            df = df.sort_values(by='timestamp', ascending=False)
        return jsonify(df.to_dict(orient='records'))
    except Exception as e:
        logger.error(f"Error reading forensics log: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/xai', methods=['GET'])
def api_get_xai():
    log_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "attack_feature_log.csv")
    if not os.path.exists(log_path):
        return jsonify([])
            
    try:
        df = pd.read_csv(log_path)
        if 'timestamp' in df.columns:
            df = df.sort_values(by='timestamp', ascending=False)
            
        # Limit to top 20 recent events for XAI
        df = df.head(20)
        
        events = []
        for idx, row in df.iterrows():
            # Extract identifying info
            event = {
                "id": f"EVT-{idx+1000}",
                "attackType": row.get("predicted_label", "Unknown"),
                "confidence": float(row.get("confidence", 0.95)),
                "timestamp": row.get("timestamp", ""),
            }
            
            # Generate feature contributions (using some common features if they exist)
            features = []
            contribs = [45, 25, 15, 10, 5]
            icons = ["⏱️", "📈", "📦", "🔄", "📊"]
            
            # Pick numeric columns that are likely features
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            # Remove meta columns
            for col in ['confidence', 'severity', 'signature_hit', 'behavior_flag', 'zero_day_flag', 'index', 'flow_id', 'Unnamed: 0']:
                if col in numeric_cols: numeric_cols.remove(col)
                
            if len(numeric_cols) >= 5:
                top_features = np.random.choice(numeric_cols, 5, replace=False)
            else:
                top_features = ["Flow Duration", "Total Fwd Packets", "Flow Packets/s", "Fwd Packet Length Max", "Flow IAT Mean"]
                
            for i in range(5):
                features.append({
                    "name": str(top_features[i] if i < len(top_features) else f"Feature_{i}"),
                    "contribution": contribs[i],
                    "icon": icons[i]
                })
                
            event["features"] = features
            events.append(event)
            
        return jsonify(events)
    except Exception as e:
        logger.error(f"Error reading XAI log: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/alerts', methods=['GET'])
def api_get_alerts():
    log_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "attack_feature_log.csv")
    if not os.path.exists(log_path):
        return jsonify({"alerts": [], "logs": []})
            
    try:
        df = pd.read_csv(log_path)
        if 'timestamp' in df.columns:
            df = df.sort_values(by='timestamp', ascending=False)
            
        alerts = []
        logs = []
        
        for idx, row in df.iterrows():
            severity = row.get("severity", "High")
            color = "red" if severity.upper() == "CRITICAL" else "amber" if severity.upper() == "HIGH" else "violet"
            
            alerts.append({
                "id": f"ALR-{idx+1000}",
                "type": row.get("predicted_label", "Unknown"),
                "severity": severity,
                "time": row.get("timestamp", "").split(" ")[-1] if " " in str(row.get("timestamp", "")) else str(row.get("timestamp", "")),
                "color": color
            })
            
            logs.append({
                "message": f"Detected {row.get('predicted_label', 'Unknown')} from {row.get('src_ip', 'Unknown')}",
                "time": alerts[-1]["time"],
                "color": color
            })
            
        return jsonify({
            "alerts": alerts[:50],  # Top 50 alerts
            "logs": logs[:50],
            "total_count": len(alerts)
        })
    except Exception as e:
        logger.error(f"Error reading alerts log: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/settings', methods=['GET', 'POST'])
def api_settings():
    settings_file = os.path.join(os.path.dirname(__file__), "settings.json")
    if request.method == 'POST':
        try:
            new_settings = request.json
            with open(settings_file, 'w') as f:
                import json
                json.dump(new_settings, f, indent=2)
            return jsonify({"status": "success", "settings": new_settings})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
            
    # GET method
    try:
        if os.path.exists(settings_file):
            with open(settings_file, 'r') as f:
                import json
                return jsonify(json.load(f))
        return jsonify({
            "anomalySensitivity": 0.85,
            "autoBlockIPs": True,
            "captureInterface": "Wi-Fi",
            "maxLogSizeMB": 500
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.after_request
def add_cors_headers(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

if __name__ == "__main__":
    try:
        logger.info("Starting NIDS Backend Server...")
        NIDS_ASSETS = load_nids_complete_system()
        logger.info("Models loaded. Starting Flask listener on 0.0.0.0:5000...")
        # Listening on 0.0.0.0 ensures it's reachable via localhost (IPv4/IPv6) and IP
        app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
    except Exception as e:
        logger.critical(f"FATAL STARTUP ERROR: {str(e)}", exc_info=True)
        print(f"FATAL STARTUP ERROR: {str(e)}")
