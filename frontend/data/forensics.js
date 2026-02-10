export const forensicsReports = [
    {
        id: "FRN-202",
        attackType: "DDoS Mitigation",
        startTime: "2026-02-09 10:00:00",
        endTime: "2026-02-09 11:30:00",
        status: "Completed",
        severity: "Critical",
        timeline: [
            { time: "10:00:05", event: "Traffic spike detected on edge router.", icon: "⚠️" },
            { time: "10:05:12", event: "Automated rate limiting engaged.", icon: "🛡️" },
            { time: "10:15:45", event: "Traffic origin identified from cluster of botnets.", icon: "🔍" },
            { time: "11:00:00", event: "Traffic levels normalized.", icon: "✅" },
            { time: "11:30:00", event: "Post-incident report generated.", icon: "📄" }
        ],
        responseAction: "IP blacklisting and traffic scrubbing."
    },
    {
        id: "FRN-105",
        attackType: "Malware Phishing",
        startTime: "2026-02-08 09:15:00",
        endTime: "2026-02-08 14:00:00",
        status: "Archived",
        severity: "High",
        timeline: [
            { time: "09:15:00", event: "Suspicious email delivered to 50 employees.", icon: "📧" },
            { time: "09:45:22", event: "Endpoint alert triggered on Desktop-A4.", icon: "🚨" },
            { time: "10:30:00", event: "System quarantined by security agent.", icon: "🔒" },
            { time: "14:00:00", event: "Manual verification confirmed file cleanup.", icon: "🧹" }
        ],
        responseAction: "System wipe and credential reset."
    }
];
