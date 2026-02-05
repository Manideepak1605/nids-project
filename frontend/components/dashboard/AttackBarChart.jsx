"use client";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function AttackBarChart({ attackTypes = {} }) {
  const labels = Object.keys(attackTypes);
  const counts = Object.values(attackTypes);

  // If no data, show a placeholder label
  const displayLabels = labels.length > 0 ? labels : ["No Attacks"];
  const displayCounts = counts.length > 0 ? counts : [0];

  const data = {
    labels: displayLabels,
    datasets: [
      {
        label: 'Number of Occurrences',
        data: displayCounts,
        backgroundColor: [
          "#ef4444", "#f59e0b", "#38bdf8", "#a855f7", "#ec4899", "#14b8a6"
        ],
        borderRadius: 8,
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
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "#94a3b8",
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#94a3b8",
        }
      }
    }
  };

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6 flex flex-col h-[380px]">
      <h3 className="text-white font-semibold mb-4">
        Attack Breakdown
      </h3>
      <div className="flex-1 min-h-0">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
