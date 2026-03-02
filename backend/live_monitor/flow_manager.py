import time
import logging
import threading
from collections import OrderedDict
from scapy.all import IP, TCP, UDP

logger = logging.getLogger(__name__)

class FlowManager:
    """
    Manages in-memory flow table with timeout-based expiration and memory safety.
    Indexed by 5-tuple: (src_ip, dst_ip, src_port, dst_port, protocol)
    """
    def __init__(self, expiry_callback, timeout=5.0, max_flows=10000):
        self.flows = OrderedDict() # Used for LRU eviction
        self.expiry_callback = expiry_callback
        self.timeout = timeout
        self.max_flows = max_flows
        self.lock = threading.Lock()
        
        # Cleanup thread
        self.running = True
        self.cleanup_thread = threading.Thread(target=self._cleanup_loop, daemon=True)
        self.cleanup_thread.start()

    def process_packet(self, pkt):
        """Updates flow table with a new packet."""
        if not IP in pkt:
            return

        ip_layer = pkt[IP]
        proto = ip_layer.proto
        
        src_ip = ip_layer.src
        dst_ip = ip_layer.dst
        
        src_port = 0
        dst_port = 0
        
        if TCP in pkt:
            src_port = pkt[TCP].sport
            dst_port = pkt[TCP].dport
        elif UDP in pkt:
            src_port = pkt[UDP].sport
            dst_port = pkt[UDP].dport
        else:
            return # Only TCP/UDP for now as per NIDS requirements

        # 5-tuple key (Bi-directional mapping can be added if needed)
        # For CICIDS-style flows, we usually treat them as uni-directional or map to a canonical flow key
        flow_key = tuple(sorted([(src_ip, src_port), (dst_ip, dst_port)])) + (proto,)
        
        with self.lock:
            if flow_key not in self.flows:
                if len(self.flows) >= self.max_flows:
                    self._evict_oldest()
                
                self.flows[flow_key] = {
                    'packets': [],
                    'start_time': pkt.time,
                    'last_seen': pkt.time,
                    'metadata': {
                        'src_ip': src_ip,
                        'dst_ip': dst_ip,
                        'src_port': src_port,
                        'dst_port': dst_port,
                        'proto': proto
                    }
                }
            
            self.flows[flow_key]['packets'].append(pkt)
            self.flows[flow_key]['last_seen'] = pkt.time
            # Move to end to maintain LRU order
            self.flows.move_to_end(flow_key)

    def _evict_oldest(self):
        """Removes the oldest flow from the table."""
        key, flow_data = self.flows.popitem(last=False)
        logger.debug(f"Evicting flow {key} due to memory limit.")
        self.expiry_callback(flow_data)

    def _cleanup_loop(self):
        """Periodically checks for expired flows."""
        while self.running:
            time.sleep(1.0)
            now = time.time()
            expired_flows = []

            # Phase 1: Collect expired flow data while holding lock (fast)
            with self.lock:
                for key, data in list(self.flows.items()):
                    if now - data['last_seen'] > self.timeout:
                        expired_flows.append(self.flows.pop(key))

            # Phase 2: Run inference OUTSIDE the lock (slow — 89ms+ per flow)
            for flow_data in expired_flows:
                self.expiry_callback(flow_data)

    def shutdown(self):
        self.running = False
        # Drain remaining flows outside the lock to avoid inference blocking shutdown
        with self.lock:
            remaining = [self.flows.pop(key) for key in list(self.flows.keys())]
        for flow_data in remaining:
            self.expiry_callback(flow_data)
