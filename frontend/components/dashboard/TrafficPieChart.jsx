"use client";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function TrafficPieChart({ normal = 0, attack = 0 }) {
  const data = {
    labels: ["Normal", "Attack"],
    datasets: [
      {
        data: [normal, attack],
        backgroundColor: ["#22c55e", "#ef4444"],
        hoverBackgroundColor: ["#4ade80", "#f87171"],
        borderWidth: 0,
        borderColor: "transparent"
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          usePointStyle: true,
          padding: 20
        }
      }
    },
    maintainAspectRatio: false
  };

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6 flex flex-col items-center">
      <h3 className="text-white font-semibold mb-4 w-full">
        Traffic Distribution
      </h3>
      <div className="h-64 w-full">
        <Pie data={data} options={options} />
      </div>
    </div>
  );
}
