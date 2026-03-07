import os
import argparse
import logging
import signal
import sys
import time
import asyncio
import threading
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from packet_sniffer import LivePacketSniffer
from flow_manager import FlowManager
from feature_extractor import FeatureExtractor
from detector import NIDSDetector
from attack_logger import AttackLogger

# --- Setup Logging ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("NIDS-Live")

class NIDSLiveMonitor:
    """
    Production-Grade Live NIDS Monitor with Bounded Queues and Lifecycle Management.
    """
    def __init__(self, interface, assets_dir):
        self.interface = interface
        self.assets_dir = assets_dir
        
        # 1. Security Guard (Environment Based)
        self.auth_token = os.getenv("NIDS_WS_TOKEN", "nids_secure_access_2026")
        if not os.getenv("NIDS_WS_TOKEN"):
            logger.warning("NIDS_WS_TOKEN not set in environment. Falling back to default (Insecure for production).")
        
        # 1. Initialize Core Components
        log_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "attack_feature_log.csv")
        self.logger = AttackLogger(log_path=log_file)
        self.detector = NIDSDetector(assets_dir)
        schema_path = os.path.join(os.path.dirname(__file__), "feature_schema.json")
        self.extractor = FeatureExtractor(schema_path)
        self.flow_manager = FlowManager(expiry_callback=self._on_flow_expired)
        self.sniffer = LivePacketSniffer(interface, callback=self.flow_manager.process_packet)
        
        # 2. WebSocket & Async Support
        self.app = FastAPI(title="NIDS Live Gateway")
        self.active_websockets = set()
        self.alert_queue = None  # Created in startup_event to bind to running loop
        self.is_running = False
        self.broadcast_task = None
        self.loop = None  # Will be set during startup to the REAL running loop
        
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_methods=["*"],
            allow_headers=["*"],
        )
        self.local_attacks = 0
        self.local_attack_types = {}
        self._setup_lifecycle()
        self._setup_routes()

    def _setup_lifecycle(self):
        @self.app.on_event("startup")
        async def startup_event():
            # Capture the REAL running loop so sniffer thread can safely cross into it
            self.loop = asyncio.get_running_loop()
            # Create queue HERE so it's bound to this loop (Python 3.10+ requirement)
            self.alert_queue = asyncio.Queue(maxsize=1000)
            logger.info("SYSTEM STARTUP: Initializing Sniffer and Broadcaster...")
            self.is_running = True

            # Start Sniffer in background thread
            if not self.sniffer.start():
                logger.error("Failed to start sniffer. Network traffic will not be analyzed.")
            
            # Start Broadcaster coroutine as a named task
            self.broadcast_task = asyncio.create_task(self._broadcast_loop())
            self.stats_task = asyncio.create_task(self._update_stats_json_loop())

        @self.app.on_event("shutdown")
        async def shutdown_event():
            logger.info("SYSTEM SHUTDOWN: Cleaning up threads and connections...")
            self.is_running = False
            
            # 1. Stop Sniffer and Pipeline
            self.sniffer.stop()
            self.flow_manager.shutdown()
            
            # 2. Graceful Broadcaster Termination
            if self.broadcast_task:
                logger.info("Cancelling broadcaster task...")
                try:
                    await self.alert_queue.put(None) # Sentinel to break loop
                    self.broadcast_task.cancel()
                    if hasattr(self, 'stats_task'):
                        self.stats_task.cancel()
                    await asyncio.wait_for(self.broadcast_task, timeout=2.0)
                except (asyncio.CancelledError, asyncio.TimeoutError):
                    pass
            
            # 3. Close all active WebSockets
            for ws in list(self.active_websockets):
                try:
                    await ws.close(code=1001, reason="Server Shutdown")
                except Exception:
                    pass
            
            self.active_websockets.clear()
            logger.info("Shutdown complete. Goodbye.")

    def _setup_routes(self):
        @self.app.get("/health")
        async def health():
            return {"status": "ok", "sniffer": self.is_running, "clients": len(self.active_websockets)}

        @self.app.websocket("/ws/alerts")
        async def websocket_endpoint(websocket: WebSocket, token: str = None):
            # 1. Auth Guard: Must accept() before we can close() per WS protocol
            if token != self.auth_token:
                logger.warning(f"AUTH_FAILURE: Unauthorized WS connection attempt. Token: '{token}'")
                await websocket.accept()
                await websocket.close(code=4003)
                return

            await websocket.accept()
            self.active_websockets.add(websocket)
            logger.info(f"UI Client authorized and connected. Pool size: {len(self.active_websockets)}")
            
            try:
                while True:
                    await websocket.receive_text() # Heartbeat/Keepalive
            except WebSocketDisconnect:
                if websocket in self.active_websockets:
                    self.active_websockets.remove(websocket)
                logger.info(f"Client disconnected. Pool size: {len(self.active_websockets)}")
            except Exception as e:
                if websocket in self.active_websockets:
                    self.active_websockets.remove(websocket)
                logger.warning(f"WS client connection error: {e}")

    async def _broadcast_loop(self):
        """Bounded Broadcaster with 200ms Batching & Isolation."""
        try:
            while self.is_running:
                # 1. Wait for first alert
                first_alert = await self.alert_queue.get()
                if first_alert is None: break
                
                # 2. Sequential collection (200ms window)
                batch = [first_alert]
                start_time = time.time()
                while time.time() - start_time < 0.2:
                    try:
                        next_alert = self.alert_queue.get_nowait()
                        if next_alert is None: break
                        batch.append(next_alert)
                        if len(batch) >= 100: break # Hard limit
                    except asyncio.QueueEmpty:
                        await asyncio.sleep(0.02)
                
                # 3. Safe Broadcast to all clients
                current_clients = list(self.active_websockets)
                for ws in current_clients:
                    try:
                        await ws.send_json(batch)
                    except Exception as e:
                        logger.warning(f"Broadcaster: Client send failed, removing. Error: {e}")
                        if ws in self.active_websockets:
                            self.active_websockets.remove(ws)
                
                for _ in range(len(batch)):
                    self.alert_queue.task_done()
        except asyncio.CancelledError:
            logger.info("Broadcaster task gracefully cancelled.")
        except Exception as e:
            logger.error(f"Broadcaster encountered fatal error: {e}")

    async def _update_stats_json_loop(self):
        """Periodically flushes live packet counts and attacks to global stats.json."""
        stats_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "stats.json")
        last_packets = 0
        last_attacks = 0
        last_attack_types = {}
        import json
        
        while self.is_running:
            await asyncio.sleep(5.0)
            try:
                current_packets = getattr(self.sniffer, 'total_packets', 0)
                current_attacks = self.local_attacks
                
                delta_pkts = current_packets - last_packets
                delta_attacks = current_attacks - last_attacks
                
                # Real-time stats
                pps = delta_pkts / 5.0
                bps = delta_pkts * 1500 / 5.0 # Estimate
                
                if (delta_pkts >= 0 or delta_attacks >= 0) and os.path.exists(stats_file):
                    with open(stats_file, 'r') as f:
                        try:
                            stats = json.load(f)
                        except json.JSONDecodeError:
                            stats = {}
                            
                    stats["packets_per_second"] = pps
                    stats["bytes_per_second"] = bps
                    stats["total_analyzed"] = stats.get("total_analyzed", 0) + delta_pkts # Keep packets for total traffic
                    stats["blocked"] = stats.get("blocked", 0) + delta_attacks
                    
                    if "attack_types" not in stats:
                        stats["attack_types"] = {}
                        
                    for atype, count in self.local_attack_types.items():
                        delta_atype = count - last_attack_types.get(atype, 0)
                        if delta_atype > 0:
                            stats["attack_types"][atype] = stats["attack_types"].get(atype, 0) + delta_atype
                            last_attack_types[atype] = count
                    
                    # Compute Risk Level
                    if stats.get("total_analyzed", 0) > 0:
                        ratio = stats["blocked"] / stats["total_analyzed"]
                        if ratio > 0.2: stats["risk_level"] = "CRITICAL"
                        elif ratio > 0.1: stats["risk_level"] = "HIGH"
                        elif ratio > 0.05: stats["risk_level"] = "MEDIUM"
                        else: stats["risk_level"] = "LOW"
                    
                    stats["last_updated"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    
                    with open(stats_file, 'w') as f:
                        json.dump(stats, f, indent=2)
                        
                    last_packets = current_packets
                    last_attacks = current_attacks
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.debug(f"Failed to update global stats.json: {e}")

    def _safe_enqueue_on_loop(self, payload):
        """Strictly loop-safe method to handle queue drops and arrivals."""
        try:
            if self.alert_queue.full():
                # Explicitly drop oldest to maintain real-time fidelity
                try:
                    dropped = self.alert_queue.get_nowait()
                    logger.warning(f"ALERT_QUEUE_OVERFLOW: Dropping oldest alert ({dropped.get('label')}) to maintain stability.")
                except asyncio.QueueEmpty:
                    pass
            
            self.alert_queue.put_nowait(payload)
        except Exception as e:
            logger.debug(f"Queue push failed: {e}")

    def _on_flow_expired(self, flow_data):
        """Thread-safe detection callback from FlowManager."""
        try:
            features_df = self.extractor.extract(flow_data)
            if features_df is None: return

            result = self.detector.predict(features_df)
            label = result['label']
            
            if label != "Normal" and label != "Error":
                # 1. Terminal/Log Alert
                self._handle_attack(flow_data['metadata'], features_df, label, result['confidence'], result)
                
                # 2. Optimized UI Payload
                payload = {
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "src_ip": flow_data['metadata']['src_ip'],
                    "src_port": flow_data['metadata']['src_port'],
                    "dst_ip": flow_data['metadata']['dst_ip'],
                    "dst_port": flow_data['metadata']['dst_port'],
                    "label": label,
                    "severity": result.get('severity', 'HIGH'),
                    "fusion_score": float(result.get('fusion_score', 0)),
                    "entropy": float(result.get('entropy', 0)),
                    "latency": float(result.get('stage_times', {}).get('total', 0))
                }
                
                # 3. Safe cross-thread enqueue using the REAL running loop
                if self.loop and self.loop.is_running():
                    self.loop.call_soon_threadsafe(self._safe_enqueue_on_loop, payload)
                else:
                    logger.warning("Event loop not available for enqueue. Alert dropped.")

        except Exception as e:
            logger.error(f"Inference crash prevented: {e}")

    def _handle_attack(self, metadata, features_df, label, confidence, result):
        """Standard terminal alert logic."""
        self.local_attacks += 1
        self.local_attack_types[label] = self.local_attack_types.get(label, 0) + 1
        
        # PERSIST TO LOG FILE (Forensics/XAI)
        self.logger.log_attack(metadata, features_df, label, confidence)
        
        src_ip = metadata['src_ip']
        st = result.get('stage_times', {})
        print(f"\n[ALERT] {label} detected from {src_ip} | Z={result.get('fusion_score', 0):.3f} | {st.get('total', 0):.2f}ms")

    def run(self):
        """Entry point for the production server."""
        logger.info(f"Starting Production NIDS Gateway on Interface: {self.interface}")
        uvicorn.run(
            self.app,
            host="0.0.0.0",
            port=8000,
            ws="websockets",   # Explicitly bypass auto-detection (fixes Windows issue)
            log_level="warning",
        )

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Advanced NIDS Live Monitor")
    parser.add_argument("--interface", required=True, help="Network interface to sniff on")
    parser.add_argument("--assets", default="../assets", help="Path to ML assets directory")
    args = parser.parse_args()
    
    if not os.path.exists(args.assets):
        print(f"Error: Assets directory '{args.assets}' not found.")
        sys.exit(1)

    monitor = NIDSLiveMonitor(args.interface, args.assets)
    monitor.run()
