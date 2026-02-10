"use client";
import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { xaiEvents } from '@/data/xai';

export default function XAIPage() {
    const searchParams = useSearchParams();
    const eventIdParam = searchParams.get('event');

    const [events, setEvents] = useState(xaiEvents);
    const [selectedEvent, setSelectedEvent] = useState(xaiEvents[0]);

    React.useEffect(() => {
        const saved = localStorage.getItem('last_analysis');
        let currentEvents = xaiEvents;

        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.results && data.results.length > 0) {
                    currentEvents = data.results.map(res => ({
                        id: res.id,
                        attackType: res.Classification,
                        confidence: res.Confidence,
                        timestamp: res.timestamp,
                        description: res.Status === "BLOCK"
                            ? `Security threat identified: ${res.Classification}. Multi-stage model verification successful.`
                            : `Traffic analysis: ${res.Classification}. Flow patterns match expected baseline.`,
                        features: res.contributions && res.contributions.length > 0
                            ? res.contributions
                            : [{ name: "Flow Statistics", contribution: 100, icon: "🛡️" }]
                    }));
                }
            } catch (e) {
                console.error("Error parsing analysis data", e);
            }
        }

        setEvents(currentEvents);

        // Handle selection logic
        if (eventIdParam) {
            const found = currentEvents.find(e => e.id === eventIdParam);
            if (found) {
                setSelectedEvent(found);
            } else {
                // If ID not found in current source (Live or Mock), default to first available
                setSelectedEvent(currentEvents[0]);
            }
        } else {
            // No param, sync report with the top item of the current data source
            setSelectedEvent(currentEvents[0]);
        }
    }, [eventIdParam]);

    // Human-readable mapping for technical network features
    const featureMapping = {
        'Flow Duration': 'Flow Life-span (Time from start to end)',
        'Total Fwd Packets': 'Outgoing Packet Volume',
        'Total Backward Packets': 'Incoming Packet Volume',
        'Fwd Packet Length Max': 'Burst Traffic (Large outbound payloads)',
        'Bwd Packet Length Max': 'Burst Response (Large inbound payloads)',
        'Flow IAT Mean': 'Average Packet Interval (Speed of flow)',
        'Flow Packets/s': 'Packet Frequency (Requests per second)',
        'Init_Win_bytes_forward': 'TCP Handshake Size (Connection setup)',
        'Init_Win_bytes_backward': 'TCP Response Size',
        'Fwd Header Length': 'Overhead Ratio (Internal routing data)',
        'ACT_DATA_PKT_FWD': 'Active Data Chunks (Payload density)',
        'Min Packet Length': 'Minimum packet size observed in the flow',
        'Fwd Packet Length Min': 'Smallest packet sent by the requester',
        'Bwd Packet Length Min': 'Smallest packet received in response',
        'Bwd Packet Length Mean': 'Average size of incoming response packets',
        'Packet Length Min': 'Smallest packet size detected in this flow',
        'Packet Length Max': 'Largest packet size detected in this flow',
    };

    const getHumanName = (name) => featureMapping[name] || name;

    const getTechnicalInsight = (event) => {
        if (!event.features || event.features.length === 0) return "General traffic anomaly detected.";

        const top = event.features[0].name;
        if (top.includes('Duration') || top.includes('IAT')) {
            return `The high deviation in timing (${top}) suggests a sustained connection attempt, often seen in slow-rate DoS or persistent credential brute-forcing.`;
        }
        if (top.includes('Length') || top.includes('Packets') || top.includes('Volume')) {
            return `The unusual volume of data observed in "${top}" indicates a protocol violation or a potential data exfiltration attempt.`;
        }
        return `Anomalous behavior centered around "${top}" deviates from the established behavioral baseline.`;
    };

    const getRecommendation = (event) => {
        if (event.attackType === 'Benign') return "No action required. Traffic matches safety protocols.";
        return "Immediate isolation of the source IP is recommended. Update firewall rules to filter traffic matching these specific flow characteristics.";
    };

    const getConfidenceColor = (score) => {
        if (score < 0.5) return "text-amber-500";
        if (score >= 0.8) return "text-fuchsia-500";
        return "text-violet-500";
    };

    const getConfidenceStroke = (score) => {
        if (score < 0.5) return "#f59e0b";
        if (score >= 0.8) return "#d946ef";
        return "#8b5cf6";
    };

    return (
        <div className="min-h-screen bg-black text-gray-200 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-white mb-2">Explainable AI <span className="text-violet-500">(XAI)</span></h1>
                    <p className="text-gray-400">Deep analysis and feature contribution breakdown for detected security events.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Event List */}
                    <div className="lg:col-span-1 space-y-4">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_10px_#8b5cf6]"></span>
                            Detected Events
                        </h2>
                        {events.slice(0, 10).map((event) => (
                            <motion.div
                                key={event.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedEvent(event)}
                                className={`p-5 rounded-xl border cursor-pointer transition-all duration-300 ${selectedEvent.id === event.id
                                    ? 'bg-violet-900/20 border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.1)]'
                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-mono text-violet-400">{event.id}</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${event.attackType === 'Benign' ? 'bg-green-500/10 text-green-400' : 'bg-violet-500/10 text-violet-300'
                                        }`}>
                                        {event.attackType}
                                    </span>
                                </div>
                                <h3 className="text-white font-medium mb-1 truncate">{event.attackType} {event.attackType === 'Benign' ? 'Flow' : 'Attempt'}</h3>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span>{event.timestamp.split(' ')[1]}</span>
                                    <span className="flex items-center gap-1">
                                        <span className={`w-1.5 h-1.5 rounded-full ${event.confidence > 0.8 ? 'bg-green-500' : event.confidence < 0.5 ? 'bg-amber-500' : 'bg-yellow-500'}`}></span>
                                        {Math.round(event.confidence * 100)}% Conf.
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Explanation Panel */}
                    <div className="lg:col-span-2">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedEvent.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm"
                            >
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-1">Analysis Report: {selectedEvent.id}</h2>
                                        <p className="text-violet-400 font-mono text-sm uppercase tracking-widest">{selectedEvent.attackType}</p>
                                    </div>
                                    <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-lg border border-white/5">
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">Confidence Score</p>
                                            <p className={`text-xl font-bold ${getConfidenceColor(selectedEvent.confidence)}`}>{(selectedEvent.confidence * 100).toFixed(1)}%</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-full border-4 border-white/5 flex items-center justify-center relative">
                                            <svg className="w-full h-full -rotate-90">
                                                <motion.circle
                                                    initial={{ strokeDashoffset: 2 * Math.PI * 20 }}
                                                    animate={{ strokeDashoffset: 2 * Math.PI * 20 * (1 - selectedEvent.confidence) }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    cx="24"
                                                    cy="24"
                                                    r="20"
                                                    fill="none"
                                                    stroke={getConfidenceStroke(selectedEvent.confidence)}
                                                    strokeWidth="4"
                                                    strokeDasharray={2 * Math.PI * 20}
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-8 p-4 bg-violet-500/5 border-l-4 border-violet-500 rounded-r-lg">
                                    <p className="text-sm text-gray-300 italic">
                                        "This event was flagged primarily due to abnormal {selectedEvent.features[0].name.toLowerCase()} patterns and traffic volume inconsistency."
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Technical Breakdown</h3>
                                        <div className="p-5 rounded-xl bg-black/30 border border-white/5">
                                            <p className="text-gray-300 text-sm leading-relaxed">
                                                {getTechnicalInsight(selectedEvent)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Security Conclusion</h3>
                                        <div className="p-5 rounded-xl bg-violet-600/10 border border-violet-500/30">
                                            <p className="text-sm text-violet-200">
                                                {getRecommendation(selectedEvent)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Contributing Features (Anomaly Explanation)</h3>
                                    <div className="space-y-6">
                                        {selectedEvent.features.map((feature, idx) => (
                                            <div key={idx} className="space-y-2 group relative">
                                                <div className="flex justify-between items-center text-sm">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xl">{feature.icon}</span>
                                                            <span className="text-white font-medium group-hover:text-violet-400 transition-colors cursor-help">
                                                                {feature.name}
                                                                {/* Hover Tooltip */}
                                                                <div className="absolute left-0 -top-10 hidden group-hover:block bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow-xl border border-white/10 z-50 whitespace-nowrap">
                                                                    {getHumanName(feature.name)}
                                                                </div>
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-gray-500 pl-8">{getHumanName(feature.name)}</span>
                                                    </div>
                                                    <span className="text-violet-400 font-bold">{feature.contribution}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${feature.contribution}%` }}
                                                        transition={{ duration: 1, delay: idx * 0.1 }}
                                                        className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
