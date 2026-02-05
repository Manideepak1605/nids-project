import random
import time
import threading
from typing import Callable, Optional
try:
    from scapy.all import sniff, IP, TCP, UDP
except ImportError:
    sniff = None

class Packet:
    def __init__(self, source_ip: str, dest_ip: str, protocol: str, size: int, 
                 src_port: int = 0, dst_port: int = 0, flags: int = 0, 
                 window: int = 0, header_len: int = 0, payload: str = ""):
        self.source_ip = source_ip
        self.dest_ip = dest_ip
        self.protocol = protocol
        self.size = size
        self.src_port = src_port
        self.dst_port = dst_port
        self.flags = flags
        self.window = window
        self.header_len = header_len
        self.payload = payload
        self.timestamp = time.time()

class BaseCapture:
    def __init__(self, callback: Callable[[Packet], None]):
        self.callback = callback
        self.running = False
        self.thread: Optional[threading.Thread] = None

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self._run)
        self.thread.daemon = True
        self.thread.start()

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=1)

    def _run(self):
        raise NotImplementedError

class MockCapture(BaseCapture):
    def _run(self):
        protocols = ["TCP", "UDP", "ICMP", "HTTP"]
        while self.running:
            p = Packet(
                source_ip=f"{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}",
                dest_ip="192.168.1.10",
                protocol=random.choice(protocols),
                size=random.randint(40, 1500),
                src_port=random.randint(1024, 65535),
                dst_port=80,
                flags=random.randint(0, 255) if random.random() > 0.5 else 0,
                window=random.randint(1024, 65535)
            )
            self.callback(p)
            time.sleep(random.uniform(0.1, 1.0))

class RealCapture(BaseCapture):
    def _run(self):
        if sniff is None:
            print("Scapy not found. RealCapture disabled.")
            return

        def process_packet(pkt):
            if IP in pkt:
                proto = "OTHER"
                src_port, dst_port, flags, window, header_len = 0, 0, 0, 0, 0
                
                if TCP in pkt:
                    proto = "TCP"
                    src_port = pkt[TCP].sport
                    dst_port = pkt[TCP].dport
                    flags = int(pkt[TCP].flags)
                    window = pkt[TCP].window
                    header_len = pkt[TCP].dataofs * 4 # Offset in 32-bit words
                elif UDP in pkt:
                    proto = "UDP"
                    src_port = pkt[UDP].sport
                    dst_port = pkt[UDP].dport
                    header_len = 8
                
                p = Packet(
                    source_ip=pkt[IP].src,
                    dest_ip=pkt[IP].dst,
                    protocol=proto,
                    size=len(pkt),
                    src_port=src_port,
                    dst_port=dst_port,
                    flags=flags,
                    window=window,
                    header_len=header_len
                )
                self.callback(p)

        sniff(prn=process_packet, store=0, stop_filter=lambda x: not self.running)
