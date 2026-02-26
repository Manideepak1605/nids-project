"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { forensicsReports as mockForensics } from '@/data/forensics';

export default function ForensicsPage() {
    const [reports, setReports] = useState(mockForensics);
    const [expandedId, setExpandedId] = useState(mockForensics[0].id);

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'Critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'High': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'Medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-white/10';
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0 }
    };

    useEffect(() => {
        const saved = localStorage.getItem('last_analysis');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.results && data.results.length > 0) {
                    const blockEvents = data.results.filter(r => r.Status === "BLOCK");

                    // Create a "Live Case" from the last upload
                    const liveCase = {
                        id: `CASE-${Math.floor(Math.random() * 9000) + 1000}`,
                        attackType: blockEvents.length > 0 ? blockEvents[0].Classification : "General Analysis",
                        startTime: data.results[0].timestamp,
                        endTime: data.results[data.results.length - 1].timestamp,
                        status: "Completed",
                        severity: blockEvents.length > 0 ? "Critical" : "Medium",
                        responseAction: blockEvents.length > 0
                            ? `Automated block of ${blockEvents.length} malicious flows. IP source flagged for deep inspection.`
                            : "All flows verified as benign. Baseline monitoring remains active.",
                        timeline: [
                            { time: data.results[0].timestamp.split(' ')[1], event: "CSV Batch Upload Received", icon: "📥" },
                            { time: data.results[Math.floor(data.results.length / 2)].timestamp.split(' ')[1], event: `${data.results.length} Flows Scanned`, icon: "🔍" },
                            {
                                time: data.results[data.results.length - 1].timestamp.split(' ')[1],
                                event: blockEvents.length > 0 ? "Threats Neutralized" : "Analysis Finished",
                                icon: blockEvents.length > 0 ? "🛑" : "✅"
                            }
                        ]
                    };

                    setReports([liveCase, ...mockForensics]);
                    setExpandedId(liveCase.id);
                }
            } catch (e) {
                console.error("Error parsing forensics data", e);
            }
        }
    }, []);

    const handleExportCSV = (report) => {
        // Find if this is the live analysis based on timestamp or something unique
        const saved = localStorage.getItem('last_analysis');
        let dataToExport = [];

        if (saved && report.status === "Completed") {
            const parsed = JSON.parse(saved);
            dataToExport = parsed.results || [];
        }

        if (dataToExport.length === 0) {
            alert("No raw data available for this report export.");
            return;
        }

        const headers = Object.keys(dataToExport[0]).join(",");
        const rows = dataToExport.map(row =>
            Object.values(row).map(val => `"${val}"`).join(",")
        ).join("\n");

        const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `NIDS_Export_${report.id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-black text-gray-200 p-8 print:p-0">
            <div className="max-w-7xl mx-auto print:max-w-none">
                <header className="mb-10 print:hidden">
                    <h1 className="text-3xl font-bold text-white mb-2">Attack <span className="text-violet-500">Forensics</span></h1>
                    <p className="text-gray-400">Post-incident analysis and sequential event mapping.</p>
                </header>

                <div className="space-y-6">
                    {reports.map((report) => (
                        <div
                            key={report.id}
                            className={`bg-white/5 border rounded-2xl overflow-hidden transition-all duration-300 print:border-none print:shadow-none print:bg-white print:text-black ${expandedId === report.id ? 'border-violet-500 shadow-[0_0_30px_rgba(139,92,246,0.1)]' : 'border-white/10'
                                } ${expandedId !== report.id ? 'print:hidden' : ''}`}
                        >
                            {/* Report Header */}
                            <div
                                onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                                className="p-6 cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/[0.02] transition-colors print:cursor-default print:border-b-2 print:border-gray-200"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 print:hidden">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xl font-bold text-white print:text-black">{report.attackType}</h3>
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${getSeverityColor(report.severity)} print:hidden`}>
                                                {report.severity}
                                            </span>
                                        </div>
                                        <p className="text-xs text-violet-400 font-mono">CASE ID: {report.id}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Duration</p>
                                        <p className="text-sm text-gray-300 italic print:text-gray-800">{report.startTime.split(' ')[1]} - {report.endTime.split(' ')[1]}</p>
                                    </div>
                                    <div className="flex items-center gap-3 print:hidden">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${report.status === 'Completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-500/10 text-gray-400 border border-white/10'
                                            }`}>
                                            {report.status}
                                        </span>
                                        <svg
                                            className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${expandedId === report.id ? 'rotate-180' : ''}`}
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Report Body */}
                            <AnimatePresence>
                                {expandedId === report.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-8 border-t border-white/10 bg-black/40 grid grid-cols-1 lg:grid-cols-3 gap-12 print:bg-white print:text-black">
                                            {/* Timeline Section */}
                                            <div className="lg:col-span-2">
                                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-8 print:text-gray-600">Event Timeline</h4>
                                                <div className="relative ml-4">
                                                    <motion.div
                                                        initial={{ scaleY: 0 }}
                                                        animate={{ scaleY: 1 }}
                                                        transition={{ duration: 1, ease: "easeInOut" }}
                                                        className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-violet-500/50 via-violet-500/20 to-transparent print:bg-gray-300 origin-top"
                                                    />
                                                    <motion.div
                                                        variants={containerVariants}
                                                        initial="hidden"
                                                        animate="show"
                                                        className="space-y-10"
                                                    >
                                                        {report.timeline.map((item, idx) => (
                                                            <motion.div
                                                                key={idx}
                                                                variants={itemVariants}
                                                                className="relative pl-10"
                                                            >
                                                                {/* Timeline Marker */}
                                                                <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-violet-600 shadow-[0_0_10px_rgba(139,92,246,0.8)] border border-white/20 print:bg-black print:shadow-none"></div>

                                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                                                                    <span className="text-xs font-mono text-violet-400 print:text-violet-600">{item.time}</span>
                                                                    <span className="hidden sm:inline text-gray-700">•</span>
                                                                    <span className="text-white font-medium flex items-center gap-2 print:text-black">
                                                                        <span className="print:hidden">{item.icon}</span>
                                                                        {item.event}
                                                                    </span>
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </motion.div>
                                                </div>
                                            </div>

                                            {/* Summary & Actions */}
                                            <div className="lg:col-span-1 space-y-8">
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 print:text-gray-600">Response Action</h4>
                                                    <div className="p-5 rounded-xl bg-violet-900/10 border border-violet-500/20 italic text-gray-300 text-sm leading-relaxed print:bg-gray-100 print:text-black print:border-gray-200">
                                                        "{report.responseAction}"
                                                    </div>
                                                </div>

                                                <div className="space-y-4 print:hidden">
                                                    <Link
                                                        href="/xai"
                                                        className="w-full py-3 rounded-xl bg-violet-600 text-white text-sm font-bold flex items-center justify-center gap-3 hover:bg-violet-700 transition shadow-[0_4px_15px_rgba(139,92,246,0.3)]"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                                        View Detection Explanation (XAI)
                                                    </Link>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleExportCSV(report); }}
                                                        className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold flex items-center justify-center gap-3 hover:bg-white/10 transition"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                                        Export CSV Log
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleExportPDF(); }}
                                                        className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold flex items-center justify-center gap-3 hover:bg-white/10 transition"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                        Full PDF Summary
                                                    </button>
                                                </div>

                                                <div className="pt-6 border-t border-white/5">
                                                    <p className="text-[10px] text-gray-600 font-medium">REPORT GENERATED AT</p>
                                                    <p className="text-xs text-gray-500">{report.endTime}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
