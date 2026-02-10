export const alertsData = [
    {
        id: "ALR-001",
        timestamp: "2026-02-09 18:45:12",
        sourceIp: "192.168.1.105",
        attackType: "SQL Injection",
        severity: "Critical",
        description: "Unauthorized SQL commands detected in application layer headers.",
        status: "New"
    },
    {
        id: "ALR-002",
        timestamp: "2026-02-09 18:30:05",
        sourceIp: "45.12.33.19",
        attackType: "SSH Brute Force",
        severity: "High",
        description: "Sustained high-frequency login failures on port 22.",
        status: "Investigating"
    },
    {
        id: "ALR-003",
        timestamp: "2026-02-09 18:15:22",
        sourceIp: "10.0.0.42",
        attackType: "Port Scanning",
        severity: "Medium",
        description: "Reconnaissance activity scanning internal network segments.",
        status: "Closed"
    },
    {
        id: "ALR-004",
        timestamp: "2026-02-09 17:55:10",
        sourceIp: "172.16.254.1",
        attackType: "Large File Transfer",
        severity: "Low",
        description: "Significant data egress detected from file server.",
        status: "New"
    }
];
