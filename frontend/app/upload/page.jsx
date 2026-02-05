"use client";
import { useState } from "react";
import UploadCard from "@/components/upload_page/UploadCard";
import DatasetInfo from "@/components/upload_page/DatasetInfo";
import ResultsSection from "@/components/upload_page/ResultsSection";

export default function UploadPage() {
  const [results, setResults] = useState(null);

  const handleResults = (data) => {
    setResults(data);
    // Smooth scroll to results
    setTimeout(() => {
      document.getElementById("results-view")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-[#0b0b14] to-black text-gray-200 px-6 pb-20">

      {/* Header */}
      <section className="max-w-7xl mx-auto pt-20 pb-12 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-white">
          Upload <span className="text-violet-400">Network Traffic</span>
        </h1>
        <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
          Upload network traffic data to analyze and detect potential intrusions
          using our three-stage intelligent machine learning model.
        </p>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Card */}
        <div className="lg:col-span-2">
          <UploadCard onResults={handleResults} />
        </div>

        {/* Dataset Info */}
        <div>
          <DatasetInfo />
        </div>
      </section>

      {/* Results Section */}
      <div id="results-view" className="max-w-7xl mx-auto">
        <ResultsSection results={results} />
      </div>
    </main>
  );
}
