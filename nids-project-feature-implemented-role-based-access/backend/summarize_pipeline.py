import os
import pandas as pd
import numpy as np
from tensorflow.keras.models import load_model
import joblib
import json
import sys

# Suppress TF warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

sys.path.append(os.path.dirname(__file__))
from verify_pipeline import load_system, run_inference

def main():
    assets = load_system()
    COMBINE_CSV = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'combine.csv')
    df = pd.read_csv(COMBINE_CSV, nrows=100)
    df.columns = df.columns.str.strip()
    
    counts = {"BLOCK": 0, "Allow": 0, "ERROR": 0}
    attack_types = {}
    
    for i in range(len(df)):
        try:
            sample = df.iloc[i:i+1]
            res = run_inference(sample, assets)
            counts[res["Status"]] += 1
            if res["Status"] == "BLOCK":
                atype = res["Classification"]
                attack_types[atype] = attack_types.get(atype, 0) + 1
        except Exception:
            counts["ERROR"] += 1
            
    print("\nVerification Summary (Top 100 flows):")
    print(f"Total Blocked: {counts['BLOCK']}")
    print(f"Total Allowed: {counts['Allow']}")
    print(f"Total Errors:  {counts['ERROR']}")
    print("\nDetected Attack Types:")
    for atype, count in attack_types.items():
        print(f" - {atype}: {count}")

if __name__ == "__main__":
    main()
