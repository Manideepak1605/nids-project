from scapy.all import get_working_ifaces, conf
import json

data = {
    "working": [],
    "all": []
}

try:
    for i in get_working_ifaces():
        data["working"].append({
            "name": i.name,
            "desc": i.description,
            "guid": getattr(i, "guid", "N/A")
        })
except Exception as e:
    data["working_error"] = str(e)

try:
    for i in conf.ifaces.values():
        data["all"].append({
            "name": i.name,
            "desc": i.description,
            "guid": getattr(i, "guid", "N/A")
        })
except Exception as e:
    data["all_error"] = str(e)

with open("iface_diag.json", "w") as f:
    json.dump(data, f, indent=4)
