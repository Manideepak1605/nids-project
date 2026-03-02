"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";

export function useDashboardStats() {
    const [data, setData] = useState({
        totalTraffic: 0,
        totalAttacks: 0,
        attackRate: 0,
        highSeverity: 0,
        uniqueIPs: 0,
        systemStatus: "Healthy",
        lastUpdated: ""
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const retryCountRef = useRef(0);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_BASE_URL || "http://localhost:5000/api";

    const fetchStats = useCallback(async (isRetry = false) => {
        try {
            if (isRetry) setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/stats`, { timeout: 3000 });

            const stats = res.data;
            const now = new Date();

            setData(prev => ({
                totalTraffic: stats.totalTraffic ?? prev.totalTraffic,
                totalAttacks: stats.totalAttacks ?? prev.totalAttacks,
                attackRate: stats.attackRate ?? prev.attackRate,
                highSeverity: stats.highSeverity ?? prev.highSeverity,
                uniqueIPs: stats.uniqueIPs ?? prev.uniqueIPs,
                systemStatus: stats.systemStatus ?? "Healthy",
                lastUpdated: now.toLocaleTimeString("en-US", { hour12: false })
            }));

            setError(null);
            retryCountRef.current = 0;
            if (isRetry && loading) {
                setLoading(false);
            }
        } catch (err) {
            console.error("Failed to fetch dashboard stats", err);
            setData(prev => ({
                ...prev,
                systemStatus: "Critical"
            }));
            setError("Disconnected");
        } finally {
            if (retryCountRef.current === 0) {
                setLoading(false); // only finish initial loading if we aren't retrying behind the scenes
            }
            retryCountRef.current += 1;
        }
    }, [API_BASE_URL, loading]);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(() => fetchStats(false), 5000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    const handleRetry = useCallback(() => {
        fetchStats(true);
    }, [fetchStats]);

    // Memoize return values
    const memoizedValue = useMemo(() => ({
        data,
        loading,
        error,
        handleRetry
    }), [data, loading, error, handleRetry]);

    return memoizedValue;
}
