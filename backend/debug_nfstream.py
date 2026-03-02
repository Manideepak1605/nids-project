from nfstream import NFStreamer
import logging

try:
    streamer = NFStreamer(source="\\Device\\NPF_Loopback", idle_timeout=1)
    print("Testing flows on Loopback...")
    count = 0
    for flow in streamer:
        count += 1
        print(f"Flow {count}: {flow}")
        print(f"Keys available: {list(flow.keys()) if hasattr(flow, 'keys') else 'No keys'}")
        # Try accessing the failing attribute
        try:
            val = flow.src2dst_max_ps
            print(f"src2dst_max_ps: {val}")
        except AttributeError as e:
            print(f"AttributeError for src2dst_max_ps on Flow {count}: {e}")
        
        if count >= 3:
            break
except Exception as e:
    print(f"Error: {e}")
