"use client";

export default function ResultsSection({ results }) {
    if (!results) return null;

    return (
        <div className="mt-12 w-full animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Analysis Results</h2>
                <div className="flex gap-4">
                    <div className="px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                        <span className="font-bold">{results.summary.allowed}</span> Benign
                    </div>
                    <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        <span className="font-bold">{results.summary.blocked}</span> Blocked
                    </div>
                </div>
            </div>

            <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-gray-400 text-sm uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Flow ID</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Classification</th>
                                <th className="px-6 py-4 font-semibold">MSE (Anomaly)</th>
                                <th className="px-6 py-4 font-semibold">Confidence</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {results.results.map((res) => (
                                <tr
                                    key={res.index}
                                    className="hover:bg-white/5 transition-colors group"
                                >
                                    <td className="px-6 py-4 text-gray-300 font-mono text-sm">
                                        #{res.flow_id}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${res.Status === "BLOCK"
                                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                                : "bg-green-500/20 text-green-400 border border-green-500/30"
                                            }`}>
                                            {res.Status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-white font-medium">{res.Classification}</span>
                                            {res.Status === "BLOCK" && (
                                                <span className="text-xs text-red-400/60 uppercase tracking-tighter">Threat Detected</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 font-mono text-sm">
                                        {res.MSE.toFixed(6)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${res.Status === 'BLOCK' ? 'bg-red-500' : 'bg-green-500'}`}
                                                    style={{ width: `${res.Confidence * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-gray-400">{(res.Confidence * 100).toFixed(1)}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <p className="mt-4 text-center text-gray-500 text-sm">
                Showing top {results.results.length} results from the analyzed dataset.
            </p>
        </div>
    );
}
