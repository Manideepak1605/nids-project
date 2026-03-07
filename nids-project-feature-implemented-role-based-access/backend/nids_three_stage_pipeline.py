import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
import pickle
import os

# Configuration
ASSETS_DIR = 'assets'
AE_MODEL_PATH = os.path.join(ASSETS_DIR, 'autoencoder_model.keras')
AE_SCALER_PATH = os.path.join(ASSETS_DIR, 'scaler.pkl')
AE_THRESHOLD_PATH = os.path.join(ASSETS_DIR, 'threshold.txt')

BINARY_MODEL_PATH = os.path.join(ASSETS_DIR, 'binary_model.pkl')
BINARY_SCALER_PATH = os.path.join(ASSETS_DIR, 'binary_scaler.pkl')

MULTICLASS_MODEL_PATH = os.path.join(ASSETS_DIR, 'multiclass_model.pkl')
MULTICLASS_SCALER_PATH = os.path.join(ASSETS_DIR, 'multiclass_scaler.pkl')
ENCODER_PATH = os.path.join(ASSETS_DIR, 'label_encoder.pkl')

def load_nids_complete_system():
    print("Loading Stage 1: Autoencoder...")
    try:
        ae_model = load_model(AE_MODEL_PATH, compile=False)
    except Exception as e:
        print(f"Standard load failed, trying safe_mode=False: {e}")
        ae_model = load_model(AE_MODEL_PATH, safe_mode=False, compile=False)
    with open(AE_SCALER_PATH, 'rb') as f:
        ae_scaler = pickle.load(f)
    with open(AE_THRESHOLD_PATH, 'r') as f:
        ae_threshold = float(f.read().strip())
        
    print("Loading Stage 2: Binary Classifier...")
    with open(BINARY_MODEL_PATH, 'rb') as f:
        binary_model = pickle.load(f)
    with open(BINARY_SCALER_PATH, 'rb') as f:
        binary_scaler = pickle.load(f)

    print("Loading Stage 3: Multi-class Classifier...")
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
    if feature_names is not None:
        for col in feature_names:
            if col not in df_row.columns:
                df_row[col] = 0
        df_row = df_row[feature_names]
    df_row = df_row.select_dtypes(include=[np.number])
    df_row.replace([np.inf, -np.inf], np.nan, inplace=True)
    df_row.fillna(0, inplace=True)
    return scaler.transform(df_row)

def nids_full_inference(flow_data, ae_assets, binary_assets, mc_assets):
    # 1. Anomaly Detection
    X_ae = preprocess_flow(flow_data, ae_assets[1], getattr(ae_assets[1], 'feature_names_in_', None))
    ae_pred = ae_assets[0].predict(X_ae, verbose=0)
    mse = np.mean(np.power(X_ae - ae_pred, 2))
    
    if mse < ae_assets[2]:
        return {"Status": "Allow", "Classification": "Benign", "MSE": mse}
    
    # 2. Binary Refinement
    X_bin = preprocess_flow(flow_data, binary_assets[1], binary_assets[0].feature_names_in_)
    is_attack = binary_assets[0].predict(X_bin)[0]
    
    if is_attack == 0:
        return {"Status": "Allow", "Classification": "Benign (FP Recovery)", "MSE": mse}
    
    # 3. Multi-class Categorization
    X_mc = preprocess_flow(flow_data, mc_assets[1], mc_assets[0].feature_names_in_)
    attack_idx = mc_assets[0].predict(X_mc)[0]
    attack_name = mc_assets[2].inverse_transform([attack_idx])[0]
    confidence = np.max(mc_assets[0].predict_proba(X_mc))
    
    return {
        "Status": "BLOCK",
        "Classification": attack_name,
        "MSE": mse,
        "Confidence": confidence
    }

def main():
    assets = load_nids_complete_system()
    
    # Simulation: Try to read samples, fallback to synthetic data
    if os.path.exists('combine.csv'):
        print("Using combine.csv for simulation...")
        df = pd.read_csv('combine.csv', nrows=20).sample(10)
        df.columns = df.columns.str.strip()
    else:
        print("combine.csv not found, generating synthetic samples for verification...")
        # Get feature names from any of the scalers
        feature_names = getattr(assets[1][1], 'feature_names_in_', None)
        if feature_names is None:
            feature_names = [f"Feature_{i}" for i in range(77)]
            
        # Generate 5 random samples
        data = np.random.rand(5, len(feature_names))
        df = pd.DataFrame(data, columns=feature_names)
    
    print("\n" + "="*50)
    print(f"{'Sample':<8} | {'Status':<8} | {'Type':<18} | {'MSE':<8}")
    print("-" * 50)
    
    for i in range(len(df)):
        sample = df.iloc[i:i+1]
        result = nids_full_inference(sample, *assets)
        print(f"#{i:<7} | {result['Status']:<8} | {result['Classification']:<18} | {result['MSE']:.5f}")

if __name__ == "__main__":
    main()
