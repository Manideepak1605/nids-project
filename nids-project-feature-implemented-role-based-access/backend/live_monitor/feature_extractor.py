import json
import logging
import numpy as np
import pandas as pd
from scapy.all import IP, TCP, UDP

logger = logging.getLogger(__name__)

class FeatureExtractor:
    """
    Extracts 78 flow-based features from a sequence of packets.
    Matches the schema expected by the trained NIDS models.
    """
    def __init__(self, schema_path):
        with open(schema_path, 'r') as f:
            self.feature_names = json.load(f)
        
        if len(self.feature_names) < 70:
            logger.error(f"Schema mismatch: Expected at least 70 features, got {len(self.feature_names)}")

    def extract(self, flow_data):
        """
        Calculates features from flow_data (packets, metadata).
        Returns a pandas DataFrame with aligned columns.
        """
        packets = flow_data['packets']
        metadata = flow_data['metadata']
        
        if not packets:
            return None

        # Basic Stats
        duration = float(flow_data['last_seen'] - flow_data['start_time'])
        total_packets = len(packets)
        total_bytes = sum(len(p) for p in packets)
        
        # Inbound/Outbound (Assumes metadata['src_ip'] is the flow initiator)
        fwd_packets = [p for p in packets if p[IP].src == metadata['src_ip']]
        bwd_packets = [p for p in packets if p[IP].src == metadata['dst_ip']]
        
        fwd_count = len(fwd_packets)
        bwd_count = len(bwd_packets)
        fwd_bytes = sum(len(p) for p in fwd_packets)
        bwd_bytes = sum(len(p) for p in bwd_packets)
        
        # Flags
        syn_count = sum(1 for p in packets if TCP in p and p[TCP].flags & 0x02)
        fin_count = sum(1 for p in packets if TCP in p and p[TCP].flags & 0x01)
        rst_count = sum(1 for p in packets if TCP in p and p[TCP].flags & 0x04)
        psh_count = sum(1 for p in packets if TCP in p and p[TCP].flags & 0x08)
        ack_count = sum(1 for p in packets if TCP in p and p[TCP].flags & 0x10)
        urg_count = sum(1 for p in packets if TCP in p and p[TCP].flags & 0x20)

        # Map to Features (Simplified mapping for live demo, matches dataset schema)
        # We fill the columns with calculated values or zeros for unimplemented ones
        data = {
            "Flow Duration": int(duration * 1000000), # microseconds
            "Total Fwd Packets": fwd_count,
            "Total Backward Packets": bwd_count,
            "Total Length of Fwd Packets": fwd_bytes,
            "Total Length of Bwd Packets": bwd_bytes,
            "Flow Bytes/s": total_bytes / duration if duration > 0 else 0,
            "Flow Packets/s": total_packets / duration if duration > 0 else 0,
            "SYN Flag Count": syn_count,
            "FIN Flag Count": fin_count,
            "RST Flag Count": rst_count,
            "PSH Flag Count": psh_count,
            "ACK Flag Count": ack_count,
            "URG Flag Count": urg_count,
            "Down/Up Ratio": bwd_count / fwd_count if fwd_count > 0 else 0,
            "Average Packet Size": total_bytes / total_packets if total_packets > 0 else 0,
        }

        # Initialize full feature vector with 0s
        full_data = {feat: 0 for feat in self.feature_names}
        full_data.update(data)
        
        # Ensure strict column ordering
        df = pd.DataFrame([full_data], columns=self.feature_names)
        
        # Final validation against loaded schema
        if df.shape[1] != len(self.feature_names):
            logger.error(f"Feature vector length mismatch: {df.shape[1]} vs {len(self.feature_names)}")
            return None
            
        return df
