import pickle
import os

ASSETS_DIR = 'assets'

def check_scaler(filename):
    path = os.path.join(ASSETS_DIR, filename)
    if not os.path.exists(path):
        print(f"{filename} not found")
        return
    with open(path, 'rb') as f:
        s = pickle.load(f)
    print(f"--- {filename} ---")
    if hasattr(s, 'feature_names_in_'):
        print(f"Features count: {len(s.feature_names_in_)}")
        print(f"First 10: {s.feature_names_in_.tolist()[:10]}")
    else:
        print("No feature_names_in_")

check_scaler('scaler.pkl')
check_scaler('binary_scaler.pkl')
check_scaler('multiclass_scaler.pkl')
