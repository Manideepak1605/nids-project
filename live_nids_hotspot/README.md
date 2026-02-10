# Live Traffic NIDS - Mobile Hotspot Monitoring

This module allows you to capture and analyze real-time traffic from devices connected to your laptop's mobile hotspot.

## Files Description
- **live_monitor.py**: The main entry point. Orchestrates sniffing and alerting.
- **packet_sniffer.py**: Detects the hotspot interface and sniffs raw packets.
- **flow_builder.py**: Groups packets into 5-tuple flows.
- **feature_extractor.py**: Extracts 70+ network features (CIC-IDS style) from flows.

## Prerequisites
1. **Npcap**: Ensure Npcap is installed on Windows.
2. **Python Dependencies**:
   ```bash
   pip install scapy pandas
   ```

## Instructions to Run

1. **Enable Mobile Hotspot** on your Windows laptop.
2. **Connect a device** (e.g., phone or VM) to the hotspot.
3. **Open Terminal** (Powershell or CMD) as **Administrator**.
4. **Navigate** to the project directory:
   ```bash
   cd c:\Users\Rishith\OneDrive\Documents\Intrusion_1\live_nids_hotspot\
   ```
5. **Run the monitor**:
   ```bash
   python live_monitor.py
   ```
   *(Note: On Windows, use `python`. On Linux, use `sudo python live_monitor.py`)*

## Features Monitored
The system extracts 70+ features including:
- Flow Duration, IAT (Inter-Arrival Time) statistics.
- Packet length statistics (Fwd/Bwd).
- TCP Flag counts (SYN, ACK, RST, etc.).
- Flow rates (Flow Bytes/s, Flow Packets/s).

## Alerts
The system currently prints alerts for:
- **Port Scanning**: Multiple destination ports from one source.
- **DDoS Activity**: Exceptionally high packet rates.
- **Brute Force**: High volume of small packets on ports 22, 3389, etc.
