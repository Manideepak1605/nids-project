export const xaiEvents = [
  {
    id: "EVT-8821",
    attackType: "Brute Force",
    confidence: 0.98,
    timestamp: "2026-02-09 14:22:10",
    description: "Multiple failed login attempts detected from a single source IP targeting the administrative portal.",
    features: [
      { name: "Login Failures", contribution: 45, icon: "🔑" },
      { name: "Request Velocity", contribution: 30, icon: "⚡" },
      { name: "User Agent Variety", contribution: 15, icon: "🌐" },
      { name: "Source IP Reputation", contribution: 10, icon: "🛡️" }
    ]
  },
  {
    id: "EVT-9932",
    attackType: "DDoS",
    confidence: 0.94,
    timestamp: "2026-02-09 15:05:45",
    description: "Unusual spike in UDP traffic volumetric data, potentially aiming to saturate network bandwidth.",
    features: [
      { name: "Packet Rate", contribution: 55, icon: "📦" },
      { name: "Byte Count", contribution: 25, icon: "📊" },
      { name: "Flow Duration", contribution: 10, icon: "⏳" },
      { name: "Source Port Entropy", contribution: 10, icon: "🎲" }
    ]
  },
  {
    id: "EVT-7743",
    attackType: "Port Scan",
    confidence: 0.89,
    timestamp: "2026-02-09 16:12:30",
    description: "Sequential connection attempts across a wide range of ports detected from an external host.",
    features: [
      { name: "Port Coverage", contribution: 50, icon: "🔌" },
      { name: "SYN/ACK Ratio", contribution: 20, icon: "🔄" },
      { name: "ICMP Responses", contribution: 20, icon: "📣" },
      { name: "Time Interval", contribution: 10, icon: "⏱️" }
    ]
  }
];
