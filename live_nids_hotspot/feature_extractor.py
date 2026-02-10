import statistics
import time
from typing import List, Dict, Optional

class Flow:
    def __init__(self, src_ip: str, dst_ip: str, src_port: int, dst_port: int, protocol: str):
        self.src_ip = src_ip
        self.dst_ip = dst_ip
        self.src_port = src_port
        self.dst_port = dst_port
        self.protocol = protocol
        
        self.start_time = time.time()
        self.last_seen = time.time()
        
        self.fwd_packets_len: List[float] = []
        self.bwd_packets_len: List[float] = []
        
        self.fwd_iat: List[float] = []
        self.bwd_iat: List[float] = []
        self.flow_iat: List[float] = []
        
        self.last_fwd_time: Optional[float] = None
        self.last_bwd_time: Optional[float] = None
        
        self.fwd_header_len = 0
        self.bwd_header_len = 0
        
        self.flags_count = {
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
        
        # Idle/Active calculation
        self.active_start = self.start_time
        self.active_times = []
        self.idle_times = []

    def update(self, packet, is_fwd: bool):
        current_time = packet.timestamp
        pkt_size = packet.size
        
        # IAT calculation
        iat = current_time - self.last_seen
        if len(self.fwd_packets_len) + len(self.bwd_packets_len) > 0:
            self.flow_iat.append(iat)
        
        if is_fwd:
            if self.last_fwd_time:
                self.fwd_iat.append(current_time - self.last_fwd_time)
            self.last_fwd_time = current_time
            self.fwd_packets_len.append(pkt_size)
            self.fwd_header_len += packet.header_len
            # Flags check (simplified from packet.flags which is a scapy Flags object or int)
            # Scapy TCP flags: F=0x01, S=0x02, R=0x04, P=0x08, A=0x10, U=0x20, E=0x40, C=0x80
            if packet.flags & 0x08: self.fwd_psh_flags += 1
            if packet.flags & 0x20: self.fwd_urg_flags += 1
            if len(self.fwd_packets_len) == 1:
                self.init_win_fwd = packet.window
                self.min_seg_size_fwd = packet.header_len
            if pkt_size > 0: self.act_data_pkt_fwd += 1
        else:
            if self.last_bwd_time:
                self.bwd_iat.append(current_time - self.last_bwd_time)
            self.last_bwd_time = current_time
            self.bwd_packets_len.append(pkt_size)
            self.bwd_header_len += packet.header_len
            if packet.flags & 0x08: self.bwd_psh_flags += 1
            if packet.flags & 0x20: self.bwd_urg_flags += 1
            if len(self.bwd_packets_len) == 1:
                self.init_win_bwd = packet.window

        # Global Flags update
        if packet.proto == 6: # TCP
            f = packet.flags
            if f & 0x01: self.flags_count["FIN"] += 1
            if f & 0x02: self.flags_count["SYN"] += 1
            if f & 0x04: self.flags_count["RST"] += 1
            if f & 0x08: self.flags_count["PSH"] += 1
            if f & 0x10: self.flags_count["ACK"] += 1
            if f & 0x20: self.flags_count["URG"] += 1
            if f & 0x40: self.flags_count["ECE"] += 1
            if f & 0x80: self.flags_count["CWE"] += 1

        # Idle/Active logic
        if iat > 1.0: # 1 second threshold
            self.idle_times.append(iat)
            self.active_times.append(self.last_seen - self.active_start)
            self.active_start = current_time
            
        self.last_seen = current_time
        return self # Return self to allow chain update or immediate feature extraction

    def _get_stats(self, data: List[float]):
        if not data: return 0, 0, 0, 0, 0
        m_max = max(data)
        m_min = min(data)
        m_mean = statistics.mean(data)
        m_std = statistics.stdev(data) if len(data) > 1 else 0
        m_var = statistics.variance(data) if len(data) > 1 else 0
        return m_max, m_min, m_mean, m_std, m_var

    def get_feature_vector(self):
        duration = (self.last_seen - self.start_time)
        duration_us = int(duration * 1000000)
        
        f_max, f_min, f_mean, f_std, _ = self._get_stats(self.fwd_packets_len)
        b_max, b_min, b_mean, b_std, _ = self._get_stats(self.bwd_packets_len)
        
        all_pkts_len = self.fwd_packets_len + self.bwd_packets_len
        p_max, p_min, p_mean, p_std, p_var = self._get_stats(all_pkts_len)
        
        flow_iat_max, flow_iat_min, flow_iat_mean, flow_iat_std, _ = self._get_stats(self.flow_iat)
        f_iat_max, f_iat_min, f_iat_mean, f_iat_std, _ = self._get_stats(self.fwd_iat)
        b_iat_max, b_iat_min, b_iat_mean, b_iat_std, _ = self._get_stats(self.bwd_iat)

        active_max, active_min, active_mean, active_std, _ = self._get_stats(self.active_times)
        idle_max, idle_min, idle_mean, idle_std, _ = self._get_stats(self.idle_times)

        num_fwd = len(self.fwd_packets_len)
        num_bwd = len(self.bwd_packets_len)
        total_fwd_len = sum(self.fwd_packets_len)
        total_bwd_len = sum(self.bwd_packets_len)

        return {
            "Destination Port": self.dst_port,
            "Flow Duration": duration_us,
            "Total Fwd Packets": num_fwd,
            "Total Backward Packets": num_bwd,
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
            "Flow Packets/s": (num_fwd + num_bwd) / duration if duration > 0 else 0,
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
            "Fwd Packets/s": num_fwd / duration if duration > 0 else 0,
            "Bwd Packets/s": num_bwd / duration if duration > 0 else 0,
            "Min Packet Length": p_min,
            "Max Packet Length": p_max,
            "Packet Length Mean": p_mean,
            "Packet Length Std": p_std,
            "Packet Length Variance": p_var,
            "FIN Flag Count": self.flags_count["FIN"],
            "SYN Flag Count": self.flags_count["SYN"],
            "RST Flag Count": self.flags_count["RST"],
            "PSH Flag Count": self.flags_count["PSH"],
            "ACK Flag Count": self.flags_count["ACK"],
            "URG Flag Count": self.flags_count["URG"],
            "CWE Flag Count": self.flags_count["CWE"],
            "ECE Flag Count": self.flags_count["ECE"],
            "Down/Up Ratio": num_bwd / num_fwd if num_fwd > 0 else 0,
            "Average Packet Size": sum(all_pkts_len) / len(all_pkts_len) if all_pkts_len else 0,
            "Avg Fwd Segment Size": f_mean,
            "Avg Bwd Segment Size": b_mean,
            "Fwd Avg Bytes/Bulk": 0,
            "Fwd Avg Packets/Bulk": 0,
            "Fwd Avg Bulk Rate": 0,
            "Bwd Avg Bytes/Bulk": 0,
            "Bwd Avg Packets/Bulk": 0,
            "Bwd Avg Bulk Rate": 0,
            "Subflow Fwd Packets": num_fwd,
            "Subflow Fwd Bytes": total_fwd_len,
            "Subflow Bwd Packets": num_bwd,
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
            "Idle Min": idle_min
        }

class FeatureExtractor:
    def create_flow(self, src_ip, dst_ip, src_port, dst_port, protocol):
        return Flow(src_ip, dst_ip, src_port, dst_port, protocol)
