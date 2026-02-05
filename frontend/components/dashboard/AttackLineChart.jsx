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
        data: [20, 45, 30, 60, 25],
        borderColor: "#38bdf8",
        backgroundColor: "rgba(56,189,248,0.3)",
        tension: 0.4,
        pointRadius: 4,
      },
    ],
  };

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6">
      <h3 className="text-white font-semibold mb-4">
        Attack Trend
      </h3>
      <Line data={data} />
    </div>
  );
}
