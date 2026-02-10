# NIDS Project

Network Intrusion Detection System
# Network Intrusion Detection System (NIDS)

An intelligent, full-stack cybersecurity platform designed to detect, analyze, and visualize network intrusion attempts using deep learning.

## 🚀 Overview

This system combines a **TensorFlow-powered AI backend** with a **high-fidelity Next.js dashboard**. It provides real-time detection, explainable AI (XAI) reasoning, and detailed attack forensics.

---

## 🏗️ Project Structure

- **/frontend**: Next.js (React) dashboard with interactive visualizations.
- **/backend**: Python (Flask) server running Autoencoders and Classifiers.

---

## ✨ Key Modules

1. **Neural Detection Engine**: Uses Deep Learning to identify anomalies and specific attack types (DDoS, Probe, etc.).
2. **Explainable AI (XAI)**: Provides human-readable reasoning and feature importance for every detection.
3. **Attack Forensics**: Vertical timeline visualizations and evidence reports for high-severity incidents.
4. **Security Governance**: Role-Based Access Control (RBAC) simulations and administrative audit logs.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js, Framer Motion, Chart.js, Tailwind CSS.
- **Backend**: Python, TensorFlow, Flask, Scikit-Learn.
- **Datasets**: Validated against NSL-KDD and CICIDS 2017 research datasets.

---

## 🚦 How to Run

### 1. Start the Backend
```bash
cd backend
pip install -r requirements.txt
python server.py
```
*Port: http://localhost:5000*

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
*Port: http://localhost:3000*

---

## 🛡️ Academic Research Note
This project is an academic cybersecurity demonstration. It is designed to work with NetFlow-based CSV data captures and demonstrates the effectiveness of hybrid ML architectures in intrusion detection.

---

**Built by the NIDS Team · 2026**
