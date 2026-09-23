import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function SeverityChart({ critical = 0, high = 0, medium = 0, low = 0 }) {
  const total = critical + high + medium + low;

  const data = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [
      {
        data: total > 0 ? [critical, high, medium, low] : [0, 0, 0, 1], // fallback if empty
        backgroundColor: [
          '#ef4444', // Critical red
          '#f97316', // High orange
          '#eab308', // Medium yellow
          '#3b82f6', // Low blue
        ],
        borderColor: '#0f172a',
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#94a3b8',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
      },
    },
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
          Severity Breakdown
        </span>
        <span className="text-xs font-medium text-slate-400">
          Total: <strong className="text-white">{total}</strong>
        </span>
      </div>

      <div className="relative h-40 flex items-center justify-center my-auto">
        <Doughnut data={data} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-white">{total}</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Alerts</span>
        </div>
      </div>

      {/* Custom Legend */}
      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span className="text-slate-400">Critical:</span>
          <span className="font-semibold text-white ml-auto">{critical}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
          <span className="text-slate-400">High:</span>
          <span className="font-semibold text-white ml-auto">{high}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-slate-400">Medium:</span>
          <span className="font-semibold text-white ml-auto">{medium}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="text-slate-400">Low:</span>
          <span className="font-semibold text-white ml-auto">{low}</span>
        </div>
      </div>
    </div>
  );
}
