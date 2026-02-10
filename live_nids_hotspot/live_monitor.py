import queue
import time
import json
from packet_sniffer import PacketSniffer
from flow_builder import FlowBuilder
from feature_extractor import FeatureExtractor
from collections import defaultdict

class LiveMonitor:
    def __init__(self, interface_index: int = None):
        self.packet_queue = queue.Queue()
        self.feature_extractor = FeatureExtractor()
        self.flow_builder = FlowBuilder(self.feature_extractor)
        self.sniffer = PacketSniffer(self.packet_queue, interface_index=interface_index)
        
        # Threat detection state
        self.ip_port_history = defaultdict(set) # src_ip -> set(dst_ports)
        self.alert_counts = defaultdict(int)
        
    def start(self):
        print("="*50)
        print("   LIVE TRAFFIC NIDS MONITOR (HOTSPOT MODE)")
        print("="*50)
        
        if not self.sniffer.interface:
            print("[-] Error: No hotspot interface detected.")
            print("    Please ensure Mobile Hotspot is ON.")
            return

        self.sniffer.start_sniffing()
        
        try:
            print("[*] Monitoring traffic... (Press Ctrl+C to stop)")
            while True:
                # Process all packets in queue
                while not self.packet_queue.empty():
                    scapy_pkt = self.packet_queue.get()
                    try:
                        flow = self.flow_builder.add_packet(scapy_pkt)
                        
                        if flow:
                            features = flow.get_feature_vector()
                            # Displaying feature vector for live analysis
                            print(json.dumps(features, indent=2))
                            self._check_threats(flow, features)
                    except Exception as e:
                        print(f"[-] Error processing packet: {e}")

                self.flow_builder.cleanup_old_flows()
                time.sleep(0.1)
                
        except KeyboardInterrupt:
            print("\n[*] Stopping monitor (User interrupted)...")
        except Exception as e:
            print(f"\n[!] CRITICAL ERROR in main loop: {e}")
            import traceback
            traceback.print_exc()
        finally:
            self.sniffer.stop()

    def _check_threats(self, flow, features):
        src_ip = flow.src_ip
        dst_port = flow.dst_port
        pps = features.get("Flow Packets/s", 0)
        dur = features.get("Flow Duration", 0) / 1000000 # to seconds
        
        # 1. Port Scanning Detection
        self.ip_port_history[src_ip].add(dst_port)
        if len(self.ip_port_history[src_ip]) > 20: 
            print(f"[!] ALERT: Port Scanning detected from {src_ip} ({len(self.ip_port_history[src_ip])} ports)")
            self.ip_port_history[src_ip].clear() # Reset after alert

        # 2. DDoS-like behavior (High PPS)
        if pps > 500 and features.get("Total Fwd Packets", 0) > 100:
            print(f"[!] ALERT: DDoS-like activity from {src_ip} (PPS: {pps:.2f})")

        # 3. Brute Force heuristic (many small TCP packets on sensitive ports)
        if dst_port in [22, 3389, 445] and features.get("Total Fwd Packets", 0) > 50:
            # Check if average packet size is small
            avg_size = features.get("Average Packet Size", 0)
            if avg_size < 100:
                print(f"[!] ALERT: Potential Brute Force on port {dst_port} from {src_ip}")

if __name__ == "__main__":
    import sys
    
    # Check for manual interface index in command line
    interface_idx = None
    if len(sys.argv) > 1:
        try:
            interface_idx = int(sys.argv[1])
            print(f"[*] Command line override: Using interface index {interface_idx}")
        except ValueError:
            print(f"[-] Invalid interface index: {sys.argv[1]}. Using auto-detection.")

    monitor = LiveMonitor(interface_index=interface_idx)
    monitor.start()
