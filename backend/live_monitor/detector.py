import os
import logging
import sys

# Ensure backend root is in path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from nids_pipeline import NIDSPipeline

logger = logging.getLogger(__name__)

class NIDSDetector:
    """
    Live Monitor wrapper for NIDSPipeline.
    Ensures no duplicated logic between live and offline environments.
    """
    def __init__(self, assets_dir):
        self.pipeline = NIDSPipeline(assets_dir)

    def predict(self, feature_df):
        """
        Runs the full refined 5-stage inference.
        Returns: {label: str, confidence: float, severity: str, ...}
        """
        try:
            # feature_df is guaranteed to be a row from feature_extractor
            return self.pipeline.predict_live(feature_df)
        except Exception as e:
            logger.error(f"Inference error in NIDSPipeline: {e}")
            return {
                "label": "Error", 
                "confidence": 0.0, 
                "severity": "LOW",
                "signature_hit": False,
                "behavior_flag": False,
                "zero_day_flag": False
            }
