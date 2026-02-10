from scapy.arch.windows import get_windows_if_list

def show_interfaces():
    print("="*80)
    print(f"{'Index':<7} | {'Name':<35} | {'Description'}")
    print("-" * 80)
    
    try:
        interfaces = get_windows_if_list()
        for i, iface in enumerate(interfaces):
            # We use i as the index for your 'python live_monitor.py X' command
            name = iface.get('name', 'Unknown')
            desc = iface.get('description', 'No Description')
            print(f"[{i:<5}] | {name:<35} | {desc}")
            
    except Exception as e:
        print(f"Error retrieving interfaces: {e}")
    
    print("="*80)
    print("\n[TIP] Look for 'Wi-Fi Direct Virtual Adapter' for your Hotspot.")

if __name__ == "__main__":
    show_interfaces()