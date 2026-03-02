from scapy.all import get_working_ifaces
import json

ifaces = []
for i in get_working_ifaces():
    iface_data = {
        "str": str(i),
        "name": getattr(i, "name", "NA"),
        "description": getattr(i, "description", "NA"),
        "guid": getattr(i, "guid", "NA"),
        "pcap_name": getattr(i, "pcap_name", "NA"),
        "network_name": getattr(i, "network_name", "NA"),
        "ifaceid": getattr(i, "ifaceid", "NA")
    }
    ifaces.append(iface_data)

with open("iface_details.json", "w") as f:
    json.dump(ifaces, f, indent=4)

print(f"Dumped {len(ifaces)} interfaces to iface_details.json")
