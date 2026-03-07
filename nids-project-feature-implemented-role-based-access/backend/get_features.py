import pickle
import os

ASSETS_DIR = 'assets'
with open(os.path.join(ASSETS_DIR, 'scaler.pkl'), 'rb') as f:
    ae_scaler = pickle.load(f)

if hasattr(ae_scaler, 'feature_names_in_'):
    print(",".join(ae_scaler.feature_names_in_.tolist()))
else:
    print("No features found")
