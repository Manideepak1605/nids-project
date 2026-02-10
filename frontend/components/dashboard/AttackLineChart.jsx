"use client";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip
);

export default function AttackLineChart() {
  const data = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    datasets: [
      {
        label: "Detected Attacks",
        data: [20, 45, 30, 60, 25],
        borderColor: "#8b5cf6",
        backgroundColor: "rgba(139,92,246,0.3)",
        tension: 0.4,
        pointRadius: 4,
      },
    ],
  };

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6">
      <h3 className="text-white font-semibold mb-1">
        Attack Trend
      </h3>
      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-4">Historical analysis of intrusion attempts</p>
      {data.datasets[0].data.length > 0 ? (
        <Line data={data} />
      ) : (
        <div className="h-40 flex items-center justify-center border border-white/5 rounded-xl bg-black/20 italic text-gray-600 text-xs">
          No attack data available for this timeframe
        </div>
      )}
    </div>
  );
}
