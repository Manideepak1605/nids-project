from nfstream import NFStreamer
import logging
import time

interface = "\\Device\\NPF_{042D21DD-D606-427F-A5E0-D3992048BF82}"
print(f"Testing on actual interface: {interface}")

try:
    streamer = NFStreamer(source=interface, idle_timeout=1)
    print("Wait for some traffic (20s)...")
    count = 0
    start_time = time.time()
    for flow in streamer:
        count += 1
        print(f"\n--- Flow {count} ---")
        print(f"Type: {type(flow)}")
        attrs = dir(flow)
        matching = [a for a in attrs if "max_ps" in a or "max_packet" in a]
        print(f"Matching attributes: {matching}")
        
        # Print all public attributes for the first flow
        if count == 1:
            print("All non-private attributes:")
            for a in sorted(attrs):
                if not a.startswith("_"):
                    try:
                        val = getattr(flow, a)
                        print(f"  {a}: {val}")
                    except:
                        pass
        
        if count >= 2 or (time.time() - start_time > 20):
            break
    if count == 0:
        print("No traffic captured.")
except Exception as e:
    print(f"Error: {e}")
