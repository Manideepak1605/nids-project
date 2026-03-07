import pickle
import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model

ASSETS_DIR = 'assets'

def inspect():
    print("--- Inspecting Stage 1: Autoencoder ---")
    try:
        # Using compile=False to bypass Keras 3 compatibility issues with legacy models
        ae_model = load_model(os.path.join(ASSETS_DIR, 'autoencoder_model.keras'), compile=False)
    except Exception as e:
        print(f"Standard load failed, trying safe_mode=False: {e}")
        ae_model = load_model(os.path.join(ASSETS_DIR, 'autoencoder_model.keras'), safe_mode=False, compile=False)
        
    with open(os.path.join(ASSETS_DIR, 'scaler.pkl'), 'rb') as f:
        ae_scaler = pickle.load(f)
    with open(os.path.join(ASSETS_DIR, 'threshold.txt'), 'r') as f:
        ae_threshold = float(f.read().strip())
    
    print(f"AE Input Shape: {ae_model.input_shape}")
    if hasattr(ae_scaler, 'feature_names_in_'):
        print(f"AE Scaler Features ({len(ae_scaler.feature_names_in_)}): {ae_scaler.feature_names_in_.tolist()[:5]}...")
    else:
        print("AE Scaler has no feature_names_in_")
    print(f"AE Threshold: {ae_threshold}")

    print("\n--- Inspecting Stage 2: Binary Classifier ---")
    with open(os.path.join(ASSETS_DIR, 'binary_model.pkl'), 'rb') as f:
        binary_model = pickle.load(f)
    with open(os.path.join(ASSETS_DIR, 'binary_scaler.pkl'), 'rb') as f:
        binary_scaler = pickle.load(f)
    
    if hasattr(binary_scaler, 'feature_names_in_'):
        print(f"Binary Scaler Features ({len(binary_scaler.feature_names_in_)}): {binary_scaler.feature_names_in_.tolist()[:5]}...")
    else:
        print("Binary Scaler has no feature_names_in_")

    print("\n--- Inspecting Stage 3: Multi-class Classifier ---")
    with open(os.path.join(ASSETS_DIR, 'multiclass_model.pkl'), 'rb') as f:
        mc_model = pickle.load(f)
    with open(os.path.join(ASSETS_DIR, 'multiclass_scaler.pkl'), 'rb') as f:
        mc_scaler = pickle.load(f)
    with open(os.path.join(ASSETS_DIR, 'label_encoder.pkl'), 'rb') as f:
        le = pickle.load(f)
    
    if hasattr(mc_scaler, 'feature_names_in_'):
        print(f"MC Scaler Features ({len(mc_scaler.feature_names_in_)}): {mc_scaler.feature_names_in_.tolist()[:5]}...")
    else:
        print("MC Scaler has no feature_names_in_")
    print(f"MC Classes: {le.classes_}")

if __name__ == "__main__":
    inspect()
