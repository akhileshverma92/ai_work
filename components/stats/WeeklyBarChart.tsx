"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { formatHoursClock } from "@/lib/timeUtils";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export function WeeklyBarChart({
  days,
  rangeLabel,
}: {
  days: { label: string; hours: number }[];
  rangeLabel: string;
}) {
  const barColors = [
    "#ed1607",
    "#f57115",
    "#14532D",
    "#3b82f6",
    "#8b5cf6",
    "#a855f7",
    "#0e7490",
  ];

  const data = {
    labels: days.map((d) => d.label),
    datasets: [
      {
        label: "Hours worked",
        data: days.map((d) => Number(d.hours.toFixed(2))),
        backgroundColor: days.map((_, i) => barColors[i % barColors.length]),
        borderRadius: 6,
        borderSkipped: false as const,
      },
    ],
  };
  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => formatHoursClock(ctx.parsed.y ?? 0),
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: "#6B6B6B",
          font: { size: 10, weight: 700 },
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: "#6B6B6B",
          callback: (value) => `${value}h`,
        },
      },
    },
  };

  return (
    <div className="mb-6 border-[1.5px] border-[#1A1A1A] bg-white p-4">
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <p className="font-dm text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]">
          Weekly view
        </p>
        <p className="font-dm text-[10px] text-[#1A1A1A]/60">{rangeLabel}</p>
      </div>
      <div className="h-[190px]">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
