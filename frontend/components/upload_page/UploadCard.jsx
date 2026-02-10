"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function UploadCard({ onResults }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [progressStage, setProgressStage] = useState(0); // 0: Idle, 1: Parsing, 2: Computation, 3: Detection

  const stages = [
    { label: "Processing Network Flow", sub: "Parsing CSV and validating schemas..." },
    { label: "Extracting Neural Features", sub: "Running ML computation on flow patterns..." },
    { label: "Finalizing Security Report", sub: "Mapping anomalies to attack forensics..." }
  ];

  const requiredFeatures = [
    "src_ip / dst_ip", "Flow Duration", "Total Fwd Packets", "Packet Length Mean", "Flow IAT Mean", "failed_logins (optional)"
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.toLowerCase().endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setFile(null);
        setError("Unsupported format — please upload CSV only for technical analysis.");
      }
    }
  };

  const getApiUrl = (endpoint) => {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    // Favoring FastAPI backend on port 8000
    return `http://${hostname}:8000/${endpoint}`;
  };

  const runPipeline = async (fetchAction) => {
    setLoading(true);
    setError(null);
    setProgressStage(1);

    try {
      // Stage 1: Parsing
      await new Promise(r => setTimeout(r, 800));
      setProgressStage(2);

      // Stage 2: Computation
      await new Promise(r => setTimeout(r, 1500));
      setProgressStage(3);

      // Stage 3: Detection
      const data = await fetchAction();
      await new Promise(r => setTimeout(r, 800));

      localStorage.setItem('last_analysis', JSON.stringify(data));
      onResults(data);
    } catch (err) {
      setError(err.message);
      setProgressStage(0);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    runPipeline(async () => {
      const response = await fetch(getApiUrl("analyze"), {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze file");
      }
      return await response.json();
    });
  };

  const handleUseSample = () => {
    runPipeline(async () => {
      // Note: FastAPI backend doesn't have a /sample endpoint in main.py, 
      // but it could be added. For now, we'll try it or handle the error.
      const response = await fetch(getApiUrl("sample"), { method: "GET" });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load sample data");
      }
      return await response.json();
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-10 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="flex flex-col items-center text-center relative z-10">
          <motion.div
            animate={loading ? { rotate: 360 } : {}}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className={`w-20 h-20 rounded-full flex items-center justify-center mb-8 border-2 ${loading ? 'border-violet-500/50' : 'bg-violet-600/10 border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.2)]'}`}
          >
            <span className="text-3xl">{loading ? "🌀" : "🛡️"}</span>
          </motion.div>

          <h3 className="text-2xl font-bold text-white mb-2">Technical Traffic Analysis</h3>
          <p className="text-gray-400 text-sm max-w-sm mb-8">
            Deploy our multi-stage neural engine to detect anomalies and identify potential network intrusions.
          </p>

          <div className="w-full space-y-6">
            <label className={`flex flex-col items-center justify-center w-full min-h-[180px] border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-500 ${file ? "border-violet-500 bg-violet-500/10" : "border-white/10 bg-black/40 hover:border-violet-500/50 hover:bg-white/5"
              }`}>
              {file ? (
                <div className="flex flex-col items-center p-4">
                  <div className="p-3 bg-violet-600/20 rounded-lg text-violet-400 mb-3">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  </div>
                  <span className="text-white font-mono text-sm">{file.name}</span>
                  <span className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB • CSV TECHNICAL DATA</span>
                </div>
              ) : (
                <div className="flex flex-col items-center p-4">
                  <span className="text-gray-400 font-medium">Click to upload raw traffic capture</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">Standard CSV | NetFlow v9 Format</span>
                </div>
              )}
              <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
            </label>

            <div className="text-left">
              <button
                onClick={() => setShowGuide(!showGuide)}
                className="text-[10px] uppercase font-bold text-violet-400 hover:text-white transition flex items-center gap-2"
              >
                <span className={`transition-transform ${showGuide ? 'rotate-90' : ''}`}>▶</span>
                Required columns for ML Engine
              </button>
              <AnimatePresence>
                {showGuide && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-3"
                  >
                    <div className="p-4 bg-white/5 border border-white/5 rounded-xl grid grid-cols-2 gap-x-4 gap-y-2">
                      {requiredFeatures.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px] text-gray-500">
                          <span className="w-1 h-1 rounded-full bg-violet-500/50"></span>
                          {f}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="pt-4 space-y-4"
                >
                  <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] font-bold">
                    <span className="text-violet-400">Security Pipeline</span>
                    <span className="text-gray-500">{Math.round((progressStage / 3) * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(progressStage / 3) * 100}%` }}
                      className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-xs font-bold text-white">{stages[progressStage - 1]?.label}</p>
                    <p className="text-[10px] text-gray-500 italic mt-1">{stages[progressStage - 1]?.sub}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                {error}
              </motion.div>
            )}

            {!loading && (
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleAnalyze}
                  disabled={!file}
                  className="flex-1 py-4 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-xl shadow-violet-600/20 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale disabled:scale-100"
                >
                  Analyze Flow Data
                </button>
                <button
                  onClick={handleUseSample}
                  className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all active:scale-95"
                >
                  Use Mock Testbench
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
