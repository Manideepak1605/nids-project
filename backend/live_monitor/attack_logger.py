import os
import csv
import logging
import threading
from datetime import datetime

logger = logging.getLogger(__name__)

class AttackLogger:
    """
    Thread-safe archival of complete feature vectors for detected attacks.
    Saves metadata + the 78-feature vector to a CSV.
    """
    def __init__(self, log_path="attack_feature_log.csv"):
        self.log_path = log_path
        self.lock = threading.Lock()
        self._init_log()

    def _init_log(self):
        """Ensures the log file exists and has a header."""
        if not os.path.exists(self.log_path):
            logger.info(f"Initializing new attack log: {self.log_path}")
            # Header will be written on the first write once we have the feature names

    def log_attack(self, metadata, feature_df, label, confidence):
        """
        Appends an attack entry to the CSV.
        metadata: {timestamp, src_ip, dst_ip, ...}
        feature_df: pandas DataFrame with 78 columns
        """
        with self.lock:
            file_exists = os.path.exists(self.log_path)
            
            try:
                with open(self.log_path, mode='a', newline='') as f:
                    # Prepare meta-columns
                    meta_data = {
                        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "src_ip": metadata['src_ip'],
                        "dst_ip": metadata['dst_ip'],
                        "predicted_label": label,
                        "confidence": f"{confidence:.4f}",
                        "severity": metadata.get('severity', 'HIGH'),
                        "signature_hit": metadata.get('signature_hit', False),
                        "behavior_flag": metadata.get('behavior_flag', False),
                        "zero_day_flag": metadata.get('zero_day_flag', False)
                    }
                    
                    # Merge with feature vector
                    row_dict = meta_data.copy()
                    row_dict.update(feature_df.iloc[0].to_dict())
                    
                    writer = csv.DictWriter(f, fieldnames=row_dict.keys())
                    
                    if not file_exists or os.path.getsize(self.log_path) == 0:
                        writer.writeheader()
                    
                    writer.writerow(row_dict)
                    logger.info(f"Archived attack feature vector for {label} from {metadata['src_ip']}")
                    
            except Exception as e:
                logger.error(f"Failed to log attack: {e}")
