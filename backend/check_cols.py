import pickle
import os

ASSETS_DIR = 'assets'
with open(os.path.join(ASSETS_DIR, 'scaler.pkl'), 'rb') as f:
    ae_scaler = pickle.load(f)

if hasattr(ae_scaler, 'feature_names_in_'):
    features = ae_scaler.feature_names_in_.tolist()
    print("Features Count:", len(features))
    print("First 10:", features[:10])
    print("Last 10:", features[-10:])
else:
    print("No features found")
