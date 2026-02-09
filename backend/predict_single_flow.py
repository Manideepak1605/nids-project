import pandas as pd
import joblib
import os
import numpy as np
from pipeline import preprocess_chunk

# Configuration
TEST_DATA_PATH = 'combine_test.csv'
MODEL_PATH = 'nids_model.pkl'
SCALER_PATH = 'nids_scaler.pkl'

def predict_single():
    print("Loading artifacts...")
    if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH):
        print("Model or Scaler not found.")
        return

    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    
    # 1. Load Data
    print(f"Loading data from {TEST_DATA_PATH}...")
    df = pd.read_csv(TEST_DATA_PATH)
    
    # 1.5 Clean Columns immediately
    df.columns = df.columns.str.strip()
    
    # 2. Pick One Random Row
    random_row = df.sample(n=1, random_state=None) # Random selection each run
    print("\nSelected Flow Data (Raw):")
    print(random_row.to_string())
    
    # 3. Extract Ground Truth
    # Now 'Label' should be accessible if it exists
    if 'Label' not in random_row.columns:
        print(f"Error: 'Label' column not found. Available columns: {random_row.columns.tolist()}")
        return

    actual_label_str = random_row['Label'].values[0]
    actual_label = 0 if str(actual_label_str).strip().upper() == 'BENIGN' else 1
    actual_class = "BENIGN" if actual_label == 0 else "MALICIOUS"
    
    # 4. Preprocess
    # preprocess_chunk handles dropping label/cols and encoding
    # We pass the single row dataframe
    X_processed, _ = preprocess_chunk(random_row.copy())
    
    # 5. Scale
    X_scaled = scaler.transform(X_processed)
    
    # 6. Predict
    prediction = model.predict(X_scaled)[0]
    probability = model.predict_proba(X_scaled)[0][1] # Prob of class 1 (Attack)
    
    predicted_class = "BENIGN" if prediction == 0 else "MALICIOUS"
    
    # 7. Output Results
    output_lines = []
    output_lines.append("="*40)
    output_lines.append("PREDICTION RESULT")
    output_lines.append("="*40)
    output_lines.append(f"Actual Label:    {actual_label_str} ({actual_class})")
    output_lines.append(f"Predicted Label: {predicted_class}")
    output_lines.append(f"Attack Probability: {probability:.4f}")
    output_lines.append("-" * 40)
    
    if actual_label == prediction:
        output_lines.append("VERIFICATION: CORRECT ✅")
        output_lines.append("The model correctly identified the traffic type.")
    else:
        output_lines.append("VERIFICATION: WRONG ❌")
        output_lines.append("The model failed to identify the traffic type.")
        
    output_text = "\n".join(output_lines)
    print(output_text)
    
    with open("prediction_result.txt", "w", encoding="utf-8") as f:
        f.write(output_text)

if __name__ == "__main__":
    predict_single()
