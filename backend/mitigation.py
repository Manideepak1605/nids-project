import subprocess
import os

class MitigationEngine:
    def __init__(self, mode="MOCK"):
        self.mode = mode
        self.blocked_ips = set()

    def mitigate(self, detection_result: dict):
        if not detection_result.get("is_malicious"):
            return

        ip_to_block = detection_result["metadata"]["source_ip"]
        if ip_to_block in self.blocked_ips:
            return

        print(f"[*] Mitigating {detection_result['attack_type']} from {ip_to_block}...")

        if self.mode == "MOCK":
            self._mock_block(ip_to_block)
        else:
            self._real_block(ip_to_block)

    def _mock_block(self, ip: str):
        print(f"[MOCK] Rule added: BLOCK IP {ip}")
        self.blocked_ips.add(ip)

    def _real_block(self, ip: str):
        try:
            # Requires root privileges
            cmd = ["iptables", "-A", "INPUT", "-s", ip, "-j", "DROP"]
            subprocess.run(cmd, check=True)
            print(f"[REAL] iptables rule added: BLOCK IP {ip}")
            self.blocked_ips.add(ip)
        except Exception as e:
            print(f"[ERROR] Failed to block IP {ip} in Real mode: {e}")

    def unblock_all(self):
        if self.mode == "REAL":
            for ip in self.blocked_ips:
                try:
                    cmd = ["iptables", "-D", "INPUT", "-s", ip, "-j", "DROP"]
                    subprocess.run(cmd, check=True)
                except:
                    pass
        self.blocked_ips.clear()
