"use client";
import { useState } from "react";

export default function UploadCard({ onResults }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze file");
      }

      const data = await response.json();
      onResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-10 shadow-xl shadow-violet-600/10 hover:shadow-violet-600/20 transition">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-violet-600/20 flex items-center justify-center mb-6">
          <span className="text-violet-400 text-2xl">{loading ? "⏳" : "⬆"}</span>
        </div>

        <h3 className="text-xl font-semibold text-white">
          Upload Network Traffic File
        </h3>

        <p className="mt-2 text-gray-400 text-sm max-w-sm">
          Upload a CSV file containing network traffic data to analyze for
          potential intrusions.
        </p>

        {/* Upload Area */}
        <div className="mt-6 w-full">
          <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition bg-black/30 ${file ? "border-violet-500 bg-violet-500/5" : "border-violet-500/30 hover:border-violet-500/60"
            }`}>
            <span className="text-gray-400">
              {file ? file.name : "Click to upload or drag & drop"}
            </span>
            <span className="text-xs text-gray-500 mt-1">
              CSV files only
            </span>
            <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
          </label>
        </div>

        {error && (
          <p className="mt-4 text-red-400 text-sm">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="mt-8 flex gap-4 flex-wrap justify-center">
          <button
            onClick={handleAnalyze}
            disabled={loading || !file}
            className={`px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-lg shadow-violet-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? "Analyzing..." : "Analyze Traffic"}
          </button>

          <button className="px-8 py-3 rounded-xl border border-violet-500/40 text-violet-300 hover:bg-violet-500/10 backdrop-blur transition">
            Use Sample Dataset
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Your data is processed securely and never stored permanently.
        </p>
      </div>
    </div>
  );
}
