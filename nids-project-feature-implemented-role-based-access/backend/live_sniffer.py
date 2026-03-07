import pandas as pd
import numpy as np
from nfstream import NFStreamer
import threading
import logging
import time

logger = logging.getLogger(__name__)

class LiveNIDSSniffer:
    def __init__(self, interface, callback, active_timeout=1, idle_timeout=1):
        """
        Initializes the Live NIDS Sniffer.
        :param interface: Network interface to sniff on (e.g., "Ethernet", "Wi-Fi").
        :param callback: Function to call with the featurized flow for inference.
        :param active_timeout: NFStream active timeout in seconds.
        :param idle_timeout: NFStream idle timeout in seconds.
        """
        self.interface = interface
        self.callback = callback
        self.active_timeout = active_timeout
        self.idle_timeout = idle_timeout
        self.running = False
        self.thread = None
        self.streamer = None

    def _map_nfstream_to_cicids(self, flow):
        """
        Maps NFStream flow object to the 78 features expected by the NIDS models.
        """
        
        # Helper to safely get attributes from the flow object
        def g(attr, default=0):
            return getattr(flow, attr, default)

        # Convert ms to microseconds for consistency with CICIDS
        flow_duration = g("bidirectional_duration_ms") * 1000
        
        data = {
            "Flow Duration": flow_duration,
            "Total Fwd Packets": g("src2dst_packets"),
            "Total Backward Packets": g("dst2src_packets"),
            "Total Length of Fwd Packets": g("src2dst_bytes"),
            "Total Length of Bwd Packets": g("dst2src_bytes"),
            "Fwd Packet Length Max": g("src2dst_max_ps"),
            "Fwd Packet Length Min": g("src2dst_min_ps"),
            "Fwd Packet Length Mean": g("src2dst_mean_ps"),
            "Fwd Packet Length Std": g("src2dst_stddev_ps"),
            "Bwd Packet Length Max": g("dst2src_max_ps"),
            "Bwd Packet Length Min": g("dst2src_min_ps"),
            "Bwd Packet Length Mean": g("dst2src_mean_ps"),
            "Bwd Packet Length Std": g("dst2src_stddev_ps"),
            
            # Rate metrics
            "Flow Bytes/s": (g("bidirectional_bytes") / (g("bidirectional_duration_ms") / 1000.0)) if g("bidirectional_duration_ms") > 0 else 0,
            "Flow Packets/s": (g("bidirectional_packets") / (g("bidirectional_duration_ms") / 1000.0)) if g("bidirectional_duration_ms") > 0 else 0,
            
            # IAT metrics
            "Flow IAT Mean": g("bidirectional_mean_piat_ms") * 1000,
            "Flow IAT Std": g("bidirectional_stddev_piat_ms") * 1000,
            "Flow IAT Max": g("bidirectional_max_piat_ms") * 1000,
            "Flow IAT Min": g("bidirectional_min_piat_ms") * 1000,
            
            "Fwd IAT Total": g("src2dst_duration_ms") * 1000,
            "Fwd IAT Mean": g("src2dst_mean_piat_ms") * 1000,
            "Fwd IAT Std": g("src2dst_stddev_piat_ms") * 1000,
            "Fwd IAT Max": g("src2dst_max_piat_ms") * 1000,
            "Fwd IAT Min": g("src2dst_min_piat_ms") * 1000,
            
            "Bwd IAT Total": g("dst2src_duration_ms") * 1000,
            "Bwd IAT Mean": g("dst2src_mean_piat_ms") * 1000,
            "Bwd IAT Std": g("dst2src_stddev_piat_ms") * 1000,
            "Bwd IAT Max": g("dst2src_max_piat_ms") * 1000,
            "Bwd IAT Min": g("dst2src_min_piat_ms") * 1000,
            
            # Flags
            "Fwd PSH Flags": 1 if g("src2dst_psh_packets") > 0 else 0,
            "Bwd PSH Flags": 1 if g("dst2src_psh_packets") > 0 else 0,
            "Fwd URG Flags": 1 if g("src2dst_urg_packets") > 0 else 0,
            "Bwd URG Flags": 1 if g("dst2src_urg_packets") > 0 else 0,
            
            # Header lengths
            "Fwd Header Length": g("src2dst_header_bytes"),
            "Bwd Header Length": g("dst2src_header_bytes"),
            
            "Fwd Packets/s": (g("src2dst_packets") / (g("src2dst_duration_ms") / 1000.0)) if g("src2dst_duration_ms") > 0 else 0,
            "Bwd Packets/s": (g("dst2src_packets") / (g("dst2src_duration_ms") / 1000.0)) if g("dst2src_duration_ms") > 0 else 0,
            
            "Min Packet Length": g("bidirectional_min_ps"),
            "Max Packet Length": g("bidirectional_max_ps"),
            "Packet Length Mean": g("bidirectional_mean_ps"),
            "Packet Length Std": g("bidirectional_stddev_ps"),
            "Packet Length Variance": g("bidirectional_stddev_ps")**2,
            
            # Flag counts
            "FIN Flag Count": g("src2dst_fin_packets") + g("dst2src_fin_packets"),
            "SYN Flag Count": g("src2dst_syn_packets") + g("dst2src_syn_packets"),
            "RST Flag Count": g("src2dst_rst_packets") + g("dst2src_rst_packets"),
            "PSH Flag Count": g("src2dst_psh_packets") + g("dst2src_psh_packets"),
            "ACK Flag Count": g("bidirectional_packets"), 
            "URG Flag Count": g("src2dst_urg_packets") + g("dst2src_urg_packets"),
            "CWE Flag Count": 0, 
            "ECE Flag Count": 0, 
            
            "Down/Up Ratio": (g("dst2src_packets") / g("src2dst_packets")) if g("src2dst_packets") > 0 else 0,
            "Average Packet Size": g("bidirectional_mean_ps"),
            "Avg Fwd Segment Size": g("src2dst_mean_ps"),
            "Avg Bwd Segment Size": g("dst2src_mean_ps"),
            
            "Fwd Header Length.1": g("src2dst_header_bytes"),
            "Fwd Avg Bytes/Bulk": 0,
            "Fwd Avg Packets/Bulk": 0,
            "Fwd Avg Bulk Rate": 0,
            "Bwd Avg Bytes/Bulk": 0,
            "Bwd Avg Packets/Bulk": 0,
            "Bwd Avg Bulk Rate": 0,
            
            "Subflow Fwd Packets": g("src2dst_packets"),
            "Subflow Fwd Bytes": g("src2dst_bytes"),
            "Subflow Bwd Packets": g("dst2src_packets"),
            "Subflow Bwd Bytes": g("dst2src_bytes"),
            
            "Init_Win_bytes_forward": 0,
            "Init_Win_bytes_backward": 0,
            "act_data_pkt_fwd": g("src2dst_packets"),
            "min_seg_size_forward": 20,
            
            "Active Mean": g("bidirectional_duration_ms"),
            "Active Std": 0,
            "Active Max": g("bidirectional_duration_ms"),
            "Active Min": g("bidirectional_duration_ms"),
            "Idle Mean": 0,
            "Idle Std": 0,
            "Idle Max": 0,
            "Idle Min": 0
        }
        
        # Ensure all columns exist as expected by behavior_features.json
        return pd.DataFrame([data])

    def _sniff_loop(self):
        logger.info(f"Starting NFStreamer on {self.interface}...")
        try:
            # NFStreamer provides an iterator that yields flow records as they are completed
            # We use a short timeout for live detection responsiveness
            self.streamer = NFStreamer(
                source=self.interface,
                promiscuous_mode=True,
                active_timeout=self.active_timeout,
                idle_timeout=self.idle_timeout
            )
            
            for flow in self.streamer:
                if not self.running:
                    break
                
                try:
                    # Skip non-IP flows (e.g., ARP, STP) as our model expects IP/TCP/UDP features
                    if not getattr(flow, "src_ip", None) or not getattr(flow, "dst_ip", None):
                        continue

                    # Transform to CICIDS and call callback
                    df_flow = self._map_nfstream_to_cicids(flow)
                    
                    # Attach flow-specific metadata for debugging
                    flow_info = {
                        "src_ip": flow.src_ip,
                        "dst_ip": flow.dst_ip,
                        "src_port": flow.src_port,
                        "dst_port": flow.dst_port,
                        "protocol": flow.protocol
                    }
                    self.callback(df_flow, flow_info)
                except Exception as flow_err:
                    logger.error(f"Error processing individual flow: {str(flow_err)}")
                    continue
                
        except Exception as e:
            logger.error(f"Fatal error in sniffing loop: {str(e)}")
        finally:
            self.running = False
            logger.info("Sniffer loop terminated.")

    def start(self):
        if self.running:
            return False
            
        self.running = True
        self.thread = threading.Thread(target=self._sniff_loop, daemon=True)
        self.thread.start()
        return True

    def stop(self):
        self.running = False
        # Note: NFStream streamer might take a moment to exit the current batch
        if self.thread:
            # We don't join to avoid blocking the main server thread, 
            # as it's a daemon thread anyway.
            pass
        return True

if __name__ == "__main__":
    # Test block
    logging.basicConfig(level=logging.INFO)
    from scapy.all import get_working_ifaces
    
    # Try to find a valid interface
    ifaces = [i.name for i in get_working_ifaces()]
    print(f"Detected interfaces: {ifaces}")
    
    if ifaces:
        target = ifaces[0]
        print(f"Testing on {target}...")
        
        def test_callback(df, info):
            print(f"Flow: {info['src_ip']}:{info['src_port']} -> {info['dst_ip']}:{info['dst_port']} | Packets: {df['Total Fwd Packets'].iloc[0]}")

        sniffer = LiveNIDSSniffer(target, test_callback)
        sniffer.start()
        print("Sniffing for 10 seconds...")
        time.sleep(10)
        sniffer.stop()
        print("Done.")
