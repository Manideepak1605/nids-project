import asyncio
import argparse
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from capture import MockCapture, RealCapture
from features import FeatureExtractor
from detection import DetectionEngine
from mitigation import MitigationEngine

class NIDSManager:
    def __init__(self, mode="MOCK"):
        self.mode = mode
        self.extractor = FeatureExtractor()
        self.detector = DetectionEngine(mode=mode)
        self.mitigator = MitigationEngine(mode=mode)
        self.active_connections: list[WebSocket] = []
        self.loop = asyncio.get_event_loop()
        
        if mode == "MOCK":
            self.capture = MockCapture(self.process_packet)
        else:
            self.capture = RealCapture(self.process_packet)

    def process_packet(self, packet):
        # 1. Feature Extraction
        features = self.extractor.process_packet(packet)
        
        # 2. Detection
        detection_result = self.detector.analyze(features)
        
        # 3. Mitigation
        if detection_result["is_malicious"]:
            self.mitigator.mitigate(detection_result)
        
        # 4. Notify Dashboard (Thread-safe broadcast)
        if self.active_connections:
            asyncio.run_coroutine_threadsafe(
                self.broadcast_event(detection_result), 
                self.loop
            )

    async def broadcast_event(self, event):
        countries = ["USA", "China", "Russia", "Germany", "Brazil", "India", "Japan", "UK", "France", "Canada"]
        cities = {
            "USA": ["New York", "San Francisco", "Chicago"],
            "China": ["Beijing", "Shanghai", "Shenzhen"],
            "Russia": ["Moscow", "St. Petersburg", "Novosibirsk"],
            "Germany": ["Berlin", "Munich", "Frankfurt"],
            "Brazil": ["Sao Paulo", "Rio de Janeiro", "Brasilia"],
            "India": ["Mumbai", "Delhi", "Bangalore"],
            "Japan": ["Tokyo", "Osaka", "Kyoto"],
            "UK": ["London", "Manchester", "Birmingham"],
            "France": ["Paris", "Lyon", "Marseille"],
            "Canada": ["Toronto", "Vancouver", "Montreal"]
        }
        
        country = random.choice(countries)
        city = random.choice(cities[country])

        # Base format for standard dashboard compatibility
        formatted_event = {
            "id": f"evt_{int(self.loop.time() * 1000)}",
            "timestamp": event["metadata"]["timestamp"],
            "source_ip": event["metadata"]["source_ip"],
            "destination_ip": event["metadata"]["dest_ip"],
            "attack_type": event["attack_type"],
            "severity": event["severity"],
            "protocol": event["metadata"]["protocol"],
            "port": event["metadata"].get("Destination Port", 0),
            "country": country,
            "city": city,
            "status": "Blocked" if event["is_malicious"] else "Allowed",
            "flow_duration": event["metadata"].get("Flow Duration", 0),
            "total_fwd_packets": event["metadata"].get("Total Fwd Packets", 0),
            "total_bwd_packets": event["metadata"].get("Total Backward Packets", 0),
            "flow_bytes_s": event["metadata"].get("Flow Bytes/s", 0),
            "flow_packets_s": event["metadata"].get("Flow Packets/s", 0),
            "label": event["attack_type"],
            "features": event["metadata"],
            "blocked_ips": list(self.mitigator.blocked_ips)
        }
        
        message = json.dumps(formatted_event)
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                disconnected.append(connection)
        
        for conn in disconnected:
            if conn in self.active_connections:
                self.active_connections.remove(conn)

    def start(self):
        print(f"[*] Starting NIDS in {self.mode} mode...")
        self.capture.start()

    def stop(self):
        print("[*] Stopping NIDS...")
        self.capture.stop()
        self.mitigator.unblock_all()

# Global manager instance
manager = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global manager
    manager = NIDSManager(mode="MOCK")
    manager.start()
    yield
    if manager:
        manager.stop()

app = FastAPI(title="NIDS Backend", lifespan=lifespan)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    manager.active_connections.append(websocket)
    try:
        while True:
            await websocket.receive_text() # Keep alive
    except WebSocketDisconnect:
        if websocket in manager.active_connections:
            manager.active_connections.remove(websocket)

@app.get("/status")
def get_status():
    return {
        "mode": manager.mode,
        "active_connections": len(manager.active_connections),
        "blocked_ips": list(manager.mitigator.blocked_ips)
    }

@app.post("/mode/{new_mode}")
def set_mode(new_mode: str):
    global manager
    if new_mode.upper() not in ["MOCK", "REAL"]:
        return {"error": "Invalid mode"}
    
    manager.stop()
    manager = NIDSManager(mode=new_mode.upper())
    manager.start()
    return {"status": "success", "mode": manager.mode}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
