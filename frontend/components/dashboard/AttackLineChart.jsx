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
        borderColor: "#8b5cf6",
        backgroundColor: "rgba(139,92,246,0.3)",
        label: "Detected Attacks",
        tension: 0.4,
        pointRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(255, 255, 255, 0.05)",
        },
        ticks: {
          color: "#64748b",
          font: { size: 10 }
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#64748b",
          font: { size: 10 }
        }
      }
    }
  };

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6 flex flex-col h-[380px]">
      <div className="mb-4">
        <h3 className="text-white font-semibold">
          Attack Trend
        </h3>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Historical analysis of intrusion attempts</p>
      </div>
      <div className="flex-1 min-h-0">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
