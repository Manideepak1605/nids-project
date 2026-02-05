import time
import math
import statistics
from collections import defaultdict
from typing import Dict, List, Optional

class Flow:
    def __init__(self, source_ip: str, dest_ip: str, src_port: int, dst_port: int, protocol: str):
        self.source_ip = source_ip
        self.dest_ip = dest_ip
        self.src_port = src_port
        self.dst_port = dst_port
        self.protocol = protocol
        
        self.start_time = time.time()
        self.last_seen = time.time()
        
        self.fwd_packets: List[float] = []
        self.bwd_packets: List[float] = []
        self.fwd_iat: List[float] = []
        self.bwd_iat: List[float] = []
        self.flow_iat: List[float] = []
        
        self.last_fwd_time: Optional[float] = None
        self.last_bwd_time: Optional[float] = None
        
        self.fwd_header_len = 0
        self.bwd_header_len = 0
        
        self.flags = {
            "FIN": 0, "SYN": 0, "RST": 0, "PSH": 0, "ACK": 0, "URG": 0, "CWE": 0, "ECE": 0
        }
        
        self.fwd_psh_flags = 0
        self.bwd_psh_flags = 0
        self.fwd_urg_flags = 0
        self.bwd_urg_flags = 0
        
        self.init_win_fwd = 0
        self.init_win_bwd = 0
        self.act_data_pkt_fwd = 0
        self.min_seg_size_fwd = 0
        
        # For Active/Idle calculation
        self.active_start = self.start_time
        self.active_times = []
        self.idle_times = []

    def update(self, packet, is_fwd: bool):
        current_time = packet.timestamp
        pkt_size = packet.size
        
        # IAT calculation
        iat = current_time - self.last_seen
        self.flow_iat.append(iat)
        
        if is_fwd:
            if self.last_fwd_time:
                self.fwd_iat.append(current_time - self.last_fwd_time)
            self.last_fwd_time = current_time
            self.fwd_packets.append(pkt_size)
            self.fwd_header_len += packet.header_len
            if packet.flags & 0x08: self.fwd_psh_flags += 1 # PSH
            if packet.flags & 0x20: self.fwd_urg_flags += 1 # URG
            if len(self.fwd_packets) == 1:
                self.init_win_fwd = packet.window
                self.min_seg_size_fwd = packet.header_len
            if pkt_size > 0: self.act_data_pkt_fwd += 1
        else:
            if self.last_bwd_time:
                self.bwd_iat.append(current_time - self.last_bwd_time)
            self.last_bwd_time = current_time
            self.bwd_packets.append(pkt_size)
            self.bwd_header_len += packet.header_len
            if packet.flags & 0x08: self.bwd_psh_flags += 1
            if packet.flags & 0x20: self.bwd_urg_flags += 1
            if len(self.bwd_packets) == 1:
                self.init_win_bwd = packet.window

        # Flags update (using standard TCP flag mapping)
        if packet.protocol == "TCP":
            f = packet.flags
            if f & 0x01: self.flags["FIN"] += 1
            if f & 0x02: self.flags["SYN"] += 1
            if f & 0x04: self.flags["RST"] += 1
            if f & 0x08: self.flags["PSH"] += 1
            if f & 0x10: self.flags["ACK"] += 1
            if f & 0x20: self.flags["URG"] += 1
            if f & 0x40: self.flags["ECE"] += 1
            if f & 0x80: self.flags["CWE"] += 1

        # Idle/Active logic (simplified)
        if iat > 1.0: # 1 second idle threshold
            self.idle_times.append(iat)
            self.active_times.append(self.last_seen - self.active_start)
            self.active_start = current_time
            
        self.last_seen = current_time

    def _get_stats(self, data: List[float]):
        if not data: return 0, 0, 0, 0, 0
        return max(data), min(data), statistics.mean(data), statistics.stdev(data) if len(data) > 1 else 0, statistics.variance(data) if len(data) > 1 else 0

    def get_features(self):
        duration = self.last_seen - self.start_time
        f_max, f_min, f_mean, f_std, _ = self._get_stats(self.fwd_packets)
        b_max, b_min, b_mean, b_std, _ = self._get_stats(self.bwd_packets)
        all_pkts = self.fwd_packets + self.bwd_packets
        p_max, p_min, p_mean, p_std, p_var = self._get_stats(all_pkts)
        
        flow_iat_max, flow_iat_min, flow_iat_mean, flow_iat_std, _ = self._get_stats(self.flow_iat)
        f_iat_max, f_iat_min, f_iat_mean, f_iat_std, _ = self._get_stats(self.fwd_iat)
        b_iat_max, b_iat_min, b_iat_mean, b_iat_std, _ = self._get_stats(self.bwd_iat)

        active_max, active_min, active_mean, active_std, _ = self._get_stats(self.active_times)
        idle_max, idle_min, idle_mean, idle_std, _ = self._get_stats(self.idle_times)

        total_fwd_len = sum(self.fwd_packets)
        total_bwd_len = sum(self.bwd_packets)

        return {
            "Destination Port": self.dst_port,
            "Flow Duration": int(duration * 1000000), # microseconds
            "Total Fwd Packets": len(self.fwd_packets),
            "Total Backward Packets": len(self.bwd_packets),
            "Total Length of Fwd Packets": total_fwd_len,
            "Total Length of Bwd Packets": total_bwd_len,
            "Fwd Packet Length Max": f_max,
            "Fwd Packet Length Min": f_min,
            "Fwd Packet Length Mean": f_mean,
            "Fwd Packet Length Std": f_std,
            "Bwd Packet Length Max": b_max,
            "Bwd Packet Length Min": b_min,
            "Bwd Packet Length Mean": b_mean,
            "Bwd Packet Length Std": b_std,
            "Flow Bytes/s": (total_fwd_len + total_bwd_len) / duration if duration > 0 else 0,
            "Flow Packets/s": len(all_pkts) / duration if duration > 0 else 0,
            "Flow IAT Mean": flow_iat_mean,
            "Flow IAT Std": flow_iat_std,
            "Flow IAT Max": flow_iat_max,
            "Flow IAT Min": flow_iat_min,
            "Fwd IAT Total": sum(self.fwd_iat),
            "Fwd IAT Mean": f_iat_mean,
            "Fwd IAT Std": f_iat_std,
            "Fwd IAT Max": f_iat_max,
            "Fwd IAT Min": f_iat_min,
            "Bwd IAT Total": sum(self.bwd_iat),
            "Bwd IAT Mean": b_iat_mean,
            "Bwd IAT Std": b_iat_std,
            "Bwd IAT Max": b_iat_max,
            "Bwd IAT Min": b_iat_min,
            "Fwd PSH Flags": self.fwd_psh_flags,
            "Bwd PSH Flags": self.bwd_psh_flags,
            "Fwd URG Flags": self.fwd_urg_flags,
            "Bwd URG Flags": self.bwd_urg_flags,
            "Fwd Header Length": self.fwd_header_len,
            "Bwd Header Length": self.bwd_header_len,
            "Fwd Packets/s": len(self.fwd_packets) / duration if duration > 0 else 0,
            "Bwd Packets/s": len(self.bwd_packets) / duration if duration > 0 else 0,
            "Packet Length Min": p_min,
            "Packet Length Max": p_max,
            "Packet Length Mean": p_mean,
            "Packet Length Std": p_std,
            "Packet Length Variance": p_var,
            "FIN Flag Count": self.flags["FIN"],
            "SYN Flag Count": self.flags["SYN"],
            "RST Flag Count": self.flags["RST"],
            "PSH Flag Count": self.flags["PSH"],
            "ACK Flag Count": self.flags["ACK"],
            "URG Flag Count": self.flags["URG"],
            "CWE Flag Count": self.flags["CWE"],
            "ECE Flag Count": self.flags["ECE"],
            "Down/Up Ratio": len(self.bwd_packets) / len(self.fwd_packets) if len(self.fwd_packets) > 0 else 0,
            "Average Packet Size": sum(all_pkts) / len(all_pkts) if all_pkts else 0,
            "Avg Fwd Segment Size": f_mean,
            "Avg Bwd Segment Size": b_mean,
            "Fwd Avg Bytes/Bulk": 0, # Bulk features require more complex logic
            "Fwd Avg Packets/Bulk": 0,
            "Fwd Avg Bulk Rate": 0,
            "Bwd Avg Bytes/Bulk": 0,
            "Bwd Avg Packets/Bulk": 0,
            "Bwd Avg Bulk Rate": 0,
            "Subflow Fwd Packets": len(self.fwd_packets), # Simplified
            "Subflow Fwd Bytes": total_fwd_len,
            "Subflow Bwd Packets": len(self.bwd_packets),
            "Subflow Bwd Bytes": total_bwd_len,
            "Init_Win_bytes_forward": self.init_win_fwd,
            "Init_Win_bytes_backward": self.init_win_bwd,
            "act_data_pkt_fwd": self.act_data_pkt_fwd,
            "min_seg_size_forward": self.min_seg_size_fwd,
            "Active Mean": active_mean,
            "Active Std": active_std,
            "Active Max": active_max,
            "Active Min": active_min,
            "Idle Mean": idle_mean,
            "Idle Std": idle_std,
            "Idle Max": idle_max,
            "Idle Min": idle_min,
            # Metadata for internal use
            "source_ip": self.source_ip,
            "dest_ip": self.dest_ip,
            "protocol": self.protocol,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(self.last_seen))
        }

class FeatureExtractor:
    def __init__(self):
        self.flows: Dict[str, Flow] = {}

    def process_packet(self, packet) -> Dict:
        # Full 5-tuple + Protocol
        flow_key = f"{packet.source_ip}-{packet.dest_ip}-{packet.src_port}-{packet.dst_port}-{packet.protocol}"
        rev_key = f"{packet.dest_ip}-{packet.source_ip}-{packet.dst_port}-{packet.src_port}-{packet.protocol}"

        if flow_key in self.flows:
            flow = self.flows[flow_key]
            flow.update(packet, is_fwd=True)
        elif rev_key in self.flows:
            flow = self.flows[rev_key]
            flow.update(packet, is_fwd=False)
        else:
            flow = Flow(packet.source_ip, packet.dest_ip, packet.src_port, packet.dst_port, packet.protocol)
            flow.update(packet, is_fwd=True)
            self.flows[flow_key] = flow

        return flow.get_features()
