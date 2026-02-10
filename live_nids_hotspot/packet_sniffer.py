import scapy.all as scapy
from scapy.arch.windows import get_windows_if_list
import threading
import queue
import time
import sys

class PacketSniffer:
    def __init__(self, callback_queue: queue.Queue, interface_index: int = None):
        self.callback_queue = callback_queue
        self.stop_event = threading.Event()
        
        if interface_index is not None:
            self.interface = self._get_interface_by_index(interface_index)
        else:
            self.interface = self._detect_hotspot_interface()

    def _get_interface_by_index(self, index):
        try:
            interfaces = get_windows_if_list()
            if 0 <= index < len(interfaces):
                iface = interfaces[index]
                print(f"[+] Using selected interface: {iface['description']}")
                return iface['name']
        except Exception as e:
            print(f"[-] Error selecting interface: {e}")
        return None

    def _detect_hotspot_interface(self):
        """
        Detects the Microsoft Wi-Fi Direct Virtual Adapter used for Hotspot.
        """
        try:
            interfaces = get_windows_if_list()
            hotspot_candidate = None
            
            # Print list for visibility
            print("[*] Detecting available network interfaces...")
            for i, iface in enumerate(interfaces):
                name = iface.get('name', '')
                desc = iface.get('description', '')
                # Prioritize Npcap version of Wi-Fi Direct Virtual Adapter
                if "wi-fi direct virtual adapter" in desc.lower() and "npcap" in desc.lower():
                    hotspot_candidate = name
            
            # If no Npcap-specific one, just try any Wi-Fi Direct
            if not hotspot_candidate:
                for iface in interfaces:
                    if "wi-fi direct virtual adapter" in iface.get('description', '').lower():
                        hotspot_candidate = iface['name']
                        break

            if hotspot_candidate:
                print(f"[+] Found Hotspot Interface: {hotspot_candidate}")
                return hotspot_candidate
            
            print("[!] Hotspot interface not found automatically. Please provide an index.")
            return None
        except Exception as e:
            print(f"[-] Error detecting interfaces: {e}")
            return None

    def _packet_handler(self, packet):
        if self.stop_event.is_set():
            return True # Stops sniffing
        
        # Put raw scapy packet into queue for processing
        self.callback_queue.put(packet)

    def start_sniffing(self):
        if not self.interface:
            print("[-] No interface selected. Exiting sniffer.")
            return

        print(f"[*] Starting sniffer on {self.interface}...")
        
        # Run scapy sniff in a separate thread so it doesn't block the UI/Monitor
        self.sniffer_thread = threading.Thread(target=self._run_sniff, daemon=True)
        self.sniffer_thread.start()

    def _run_sniff(self):
        try:
            # store=0 prevents memory leaks during long runs
            scapy.sniff(iface=self.interface, prn=self._packet_handler, store=0)
        except Exception as e:
            print(f"[-] Sniffer error: {e}")

    def stop(self):
        self.stop_event.set()
        print("[*] Stopping sniffer...")

if __name__ == "__main__":
    # Test standalone
    q = queue.Queue()
    sniffer = PacketSniffer(q)
    if sniffer.interface:
        sniffer.start_sniffing()
        try:
            while True:
                if not q.empty():
                    pkt = q.get()
                    print(f"Captured: {pkt.summary()}")
                time.sleep(0.1)
        except KeyboardInterrupt:
            sniffer.stop()
    else:
        print("[-] Please specify an interface manually in PacketSniffer.")
