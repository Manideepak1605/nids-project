"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { apiService } from "@/services/api";

// --- Dummy Data Generator ---
function generateDummyTimeSeriesPoint(timestamp) {
    return {
        time: timestamp,
        benign: Math.floor(Math.random() * 120) + 60,
        attack: Math.floor(Math.random() * 30) + 2,
    };
}

function generateInitialTimeSeries() {
    const now = Date.now();
    return Array.from({ length: 20 }, (_, i) => {
        const t = new Date(now - (19 - i) * 5000);
        return generateDummyTimeSeriesPoint(
            t.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })
        );
    });
}

const DUMMY_KPI = {
    totalTraffic: 48320,
    totalAttacks: 1274,
    attackRate: 2.6,
    highSeverity: 38,
    uniqueIPs: 216,
    systemStatus: "ONLINE",
};

const DUMMY_ATTACK_DIST = [
    { name: "DoS / DDoS", value: 41, color: "#ef4444" },
    { name: "Brute Force", value: 23, color: "#f97316" },
    { name: "Port Scan", value: 19, color: "#eab308" },
    { name: "Web Attack", value: 11, color: "#8b5cf6" },
    { name: "Stealth Anomaly", value: 6, color: "#06b6d4" },
];

const DUMMY_RECENT_ALERTS = [
    { id: 1, timestamp: "19:01:33", src_ip: "192.168.1.104", dst_ip: "10.0.0.5", label: "DoS Hulk", severity: "CRITICAL", fusion_score: 0.971 },
    { id: 2, timestamp: "18:59:12", src_ip: "45.33.32.156", dst_ip: "192.168.1.1", label: "Port Scan", severity: "HIGH", fusion_score: 0.834 },
    { id: 3, timestamp: "18:57:04", src_ip: "172.16.0.88", dst_ip: "10.0.0.12", label: "Brute Force SSH", severity: "HIGH", fusion_score: 0.801 },
    { id: 4, timestamp: "18:55:49", src_ip: "10.10.1.22", dst_ip: "192.168.1.200", label: "Web Attack XSS", severity: "MEDIUM", fusion_score: 0.652 },
    { id: 5, timestamp: "18:53:21", src_ip: "203.0.113.42", dst_ip: "10.0.0.1", label: "Stealth Anomaly", severity: "MEDIUM", fusion_score: 0.611 },
];

// --- Custom Hook ---
export function useLiveData() {
    const [kpi, setKpi] = useState(DUMMY_KPI);
    const [timeSeries, setTimeSeries] = useState(generateInitialTimeSeries);
    const [attackDist, setAttackDist] = useState(DUMMY_ATTACK_DIST);
    const [recentAlerts, setRecentAlerts] = useState(DUMMY_RECENT_ALERTS);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [hasNewAttack, setHasNewAttack] = useState(false);
    const [isConnected, setIsConnected] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            // Parallel fetch of all stats to reduce waterfall delay
            const [statsRes, trafficRes, distRes] = await Promise.allSettled([
                apiService.getStats(),
                apiService.getLiveTraffic(),
                apiService.getAttackDistribution()
            ]);

            const allSuccessful = statsRes.status === "fulfilled" &&
                trafficRes.status === "fulfilled" &&
                distRes.status === "fulfilled";

            if (allSuccessful) {
                const statsData = statsRes.value;
                const trafficData = trafficRes.value;
                const distData = distRes.value;
                // 1) Update KPIs
                setKpi({
                    totalTraffic: statsData.totalTraffic || 0,
                    totalAttacks: statsData.totalAttacks || 0,
                    attackRate: statsData.attackRate || 0,
                    highSeverity: statsData.highSeverity || 0,
                    uniqueIPs: statsData.uniqueIPs || 0,
                    systemStatus: statsData.systemStatus || "Healthy",
                });

                // 2) Update Attack Distribution (Pie Chart mapping)
                if (Array.isArray(distData)) {
                    const colorMap = {
                        "DoS": "#ef4444", "DoS / DDoS": "#ef4444",
                        "Brute Force": "#f97316", "Brute Force SSH": "#f97316",
                        "Port Scan": "#eab308",
                        "Web Attack": "#8b5cf6", "Web Attack XSS": "#8b5cf6",
                        "Stealth Anomaly": "#06b6d4",
                    };
                    setAttackDist(
                        distData.map(item => ({
                            name: item.type,
                            value: item.count,
                            color: colorMap[item.type] || "#6b7280"
                        }))
                    );
                }

                // 3) Update Time Series (Line Chart)
                if (Array.isArray(trafficData) && trafficData.length > 0) {
                    setTimeSeries(trafficData);
                }

                setIsConnected(true);
            } else {
                // If any promise rejected, treat as degraded/disconnected state
                setIsConnected(false);
            }
        } catch (err) {
            console.error("Failed to fetch dashboard telemetry:", err);
            setIsConnected(false);
        } finally {
            setIsLoading(false);
        }



        // Flash attack indicator occasionally
        if (Math.random() > 0.55) {
            setHasNewAttack(true);
            setTimeout(() => setHasNewAttack(false), 1200);
        }

        setLastUpdated(new Date());
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const formattedLastUpdated = useMemo(() =>
        lastUpdated.toLocaleTimeString("en-US", { hour12: false }),
        [lastUpdated]
    );

    return { kpi, timeSeries, attackDist, recentAlerts, lastUpdated: formattedLastUpdated, hasNewAttack, isConnected, isLoading };
}
