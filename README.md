# 🛡️ Sentinel-NIDS: Advanced Network Intrusion Detection System

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)](https://www.tensorflow.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

Sentinel-NIDS is a state-of-the-art, full-stack cybersecurity platform designed to monitor, detect, and analyze network intrusion attempts in real-time. By leveraging deep learning architectures and high-fidelity visualizations, it provides security administrators with actionable intelligence and forensic depth.

---

## ✨ Core Features

| Feature | Description |
| :--- | :--- |
| **🚀 Real-Time Traffic Hub** | Live network capture and instant classification of incoming packets. |
| **🧠 Neural Detection Engine** | Multi-stage pipeline using Autoencoders and Classifiers (FastAPI-powered). |
| **🔍 Explainable AI (XAI)** | Transparent reasoning for every detection, highlighting critical features. |
| **📜 Forensic Timeline** | High-fidelity vertical timelines for high-severity incident investigation. |
| **🏗️ Captured Analysis** | Ability to upload and analyze historical network datasets (CSV/PCAP). |
| **🛡️ Sentinel Protocols** | Integrated RBAC simulations and administrative security governance. |

---

## 🏗️ Project Architecture

```mermaid
graph TD
    A[Network Interface] -->|Packet Sniffing| B[Python Backend]
    B -->|Preprocessing| C[ML Pipeline]
    C -->|Classification| D[FastAPI WebSocket]
    D -->|Real-time Stream| E[Next.js Dashboard]
    E -->|User Interaction| F[Security Admin]
    B -->|XAI Reasoning| E
```

### Module Breakdown
- **`/frontend`**: Next.js 15+ dashboard featuring Framer Motion animations and Chart.js analytics.
- **`/backend`**: High-performance Python server implementing the NIDS three-stage pipeline.
- **`/live_nids_hotspot`**: Specialized scripts for sniffing and capturing hotspot traffic.

---

## 🚦 Quick Start

### 1. Prerequisites
- Node.js 20+
- Python 3.10+
- `pip` and `npm`

### 2. Backend Initialization
```bash
cd backend
pip install -r requirements.txt
python main.py
```
*Server runs on: [http://localhost:8000](http://localhost:8000)*

### 3. Frontend Initialization
```bash
cd frontend
npm install
npm run dev
```
*Dashboard runs on: [http://localhost:3000](http://localhost:3000)*

---

## 🧪 Advanced Tools (Backend)
The system includes specialized utility scripts for research and debugging:
- `generate_sample.py`: Creates mock network traffic for testing.
- `inspect_models.py`: Analyzes the layer weights and performance of the trained neural networks.
- `nids_three_stage_pipeline.py`: The core logic for the integrated detection flow.
- `get_features.py`: Extracts critical features from raw network packets.

---

## 🛡️ License & Ethics
This project is for **academic and research purposes only**. It demonstrates the effectiveness of hybrid ML architectures in network security. Ensure appropriate permissions before monitoring any network that is not your own.

**Built with ❤️ by the Sentinel Team · 2026**
