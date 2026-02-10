import time
from scapy.all import IP, TCP, UDP
from typing import Dict, Optional

class RawPacket:
    """A simplified container for packet data to decouple from Scapy objects if needed."""
    def __init__(self, scapy_pkt):
        self.timestamp = scapy_pkt.time
        self.size = len(scapy_pkt)
        
        if IP in scapy_pkt:
            self.src_ip = scapy_pkt[IP].src
            self.dst_ip = scapy_pkt[IP].dst
            self.proto = scapy_pkt.proto
        else:
            self.src_ip = None
            self.dst_ip = None
            self.proto = None

        if TCP in scapy_pkt:
            self.src_port = scapy_pkt[TCP].sport
            self.dst_port = scapy_pkt[TCP].dport
            self.flags = scapy_pkt[TCP].flags
            self.window = scapy_pkt[TCP].window
            self.header_len = scapy_pkt[TCP].dataofs * 4
        elif UDP in scapy_pkt:
            self.src_port = scapy_pkt[UDP].sport
            self.dst_port = scapy_pkt[UDP].dport
            self.flags = 0
            self.window = 0
            self.header_len = 8 # UDP header is 8 bytes
        else:
            self.src_port = 0
            self.dst_port = 0
            self.flags = 0
            self.window = 0
            self.header_len = 0

class FlowBuilder:
    def __init__(self, feature_extractor):
        self.feature_extractor = feature_extractor
        self.active_flows = {} # Key -> Flow object
        self.last_cleanup = time.time()
        self.flow_timeout = 60 # Seconds to consider a flow "done"

    def add_packet(self, scapy_pkt):
        if not IP in scapy_pkt:
            return None

        packet = RawPacket(scapy_pkt)
        if not packet.src_ip:
            return None

        # 5-tuple: (src, dst, sport, dport, proto)
        proto_str = self._get_proto_name(packet.proto)
        
        # We need to identify direction. 
        # Standard approach: sort IPs/ports if we don't know who started first, 
        # BUT for a Hotspot, we usually care about the source IP being either the laptop or the phone.
        
        flow_key = (packet.src_ip, packet.dst_ip, packet.src_port, packet.dst_port, proto_str)
        rev_key = (packet.dst_ip, packet.src_ip, packet.dst_port, packet.src_port, proto_str)

        # Update existing flow or create new
        if flow_key in self.active_flows:
            return self.active_flows[flow_key].update(packet, is_fwd=True)
        elif rev_key in self.active_flows:
            return self.active_flows[rev_key].update(packet, is_fwd=False)
        else:
            # Create new flow using the FeatureExtractor's Flow class
            new_flow = self.feature_extractor.create_flow(
                packet.src_ip, packet.dst_ip, packet.src_port, packet.dst_port, proto_str
            )
            self.active_flows[flow_key] = new_flow
            return new_flow.update(packet, is_fwd=True)

    def _get_proto_name(self, proto_num):
        if proto_num == 6: return "TCP"
        if proto_num == 17: return "UDP"
        return str(proto_num)

    def cleanup_old_flows(self):
        """Removes flows that haven't seen packets for a while."""
        current_time = time.time()
        if current_time - self.last_cleanup < 10:
            return

        to_remove = []
        for key, flow in self.active_flows.items():
            if current_time - flow.last_seen > self.flow_timeout:
                to_remove.append(key)
        
        for key in to_remove:
            del self.active_flows[key]
        
        self.last_cleanup = current_time
