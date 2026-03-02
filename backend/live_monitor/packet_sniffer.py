import logging
from scapy.all import AsyncSniffer, IP, TCP, UDP

logger = logging.getLogger(__name__)

class LivePacketSniffer:
    """
    Asynchronous packet sniffer using Scapy.
    Captures IP traffic and passes it to a processing callback.
    """
    def __init__(self, interface, callback, bpf_filter="ip"):
        self.interface = interface
        self.callback = callback
        self.bpf_filter = bpf_filter
        self.sniffer = None
        self.total_packets = 0

    def _packet_callback(self, packet):
        """Internal callback for scapy to pass packets to flow manager."""
        try:
            if IP in packet:
                self.total_packets += 1
                self.callback(packet)
        except Exception as e:
            logger.error(f"Error in packet callback: {e}")

    def start(self):
        """Starts the asynchronous sniffer."""
        if self.sniffer and self.sniffer.running:
            logger.warning("Sniffer is already running.")
            return False

        logger.info(f"Starting AsyncSniffer on interface: {self.interface} with filter: '{self.bpf_filter}'")
        self.sniffer = AsyncSniffer(
            iface=self.interface,
            filter=self.bpf_filter,
            prn=self._packet_callback,
            store=False
        )
        self.sniffer.start()
        return True

    def stop(self):
        """Stops the asynchronous sniffer."""
        if self.sniffer and self.sniffer.running:
            logger.info("Stopping AsyncSniffer...")
            self.sniffer.stop()
            logger.info("Sniffer stopped.")
            return True
        return False

    def is_running(self):
        return self.sniffer.running if self.sniffer else False
