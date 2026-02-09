import pickle
import os

ASSETS_DIR = 'assets'
with open(os.path.join(ASSETS_DIR, 'scaler.pkl'), 'rb') as f:
    ae_scaler = pickle.load(f)

if hasattr(ae_scaler, 'feature_names_in_'):
    cols = ae_scaler.feature_names_in_.tolist()
    # Write header and a dummy normal row
    with open('sample_network_traffic.csv', 'w') as f:
        f.write(",".join(cols) + "\n")
        # All zeros row (should be benign usually)
        f.write(",".join(["0"] * len(cols)) + "\n")
        # A row with some values (source of bot capture usually has low volume, many small packets)
        # We can just put some random numbers for testing
        f.write(",".join(["100"] * len(cols)) + "\n")
    print("Created sample_network_traffic.csv")
else:
    print("No features found")
