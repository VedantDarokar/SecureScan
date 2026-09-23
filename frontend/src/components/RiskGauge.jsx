import React from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

export default function RiskGauge({ score = 0 }) {
  // Score is between 0.0 and 10.0
  const normalized = Math.min(10, Math.max(0, score));

  // Determine color and severity label
  let color = '#10b981'; // Green
  let label = 'Low Risk';
  let badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

  if (normalized >= 8.5) {
    color = '#ef4444'; // Red
    label = 'Critical Risk';
    badgeBg = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  } else if (normalized >= 6.0) {
    color = '#f97316'; // Orange
    label = 'High Risk';
    badgeBg = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
  } else if (normalized >= 3.5) {
    color = '#eab308'; // Yellow
    label = 'Medium Risk';
    badgeBg = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  } else if (normalized === 0) {
    label = 'Clean / Secure';
  }

  // SVG Gauge calculations (semi-circle)
  const radius = 60;
  const circumference = Math.PI * radius; // Half circle
  const strokeDashoffset = circumference - (normalized / 10) * circumference;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
      <div className="absolute top-4 left-4 text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
        Quantified Risk Score
      </div>

      <div className="relative mt-4 flex items-center justify-center">
        <svg width="160" height="95" className="overflow-visible">
          {/* Background Track */}
          <path
            d="M 20 90 A 60 60 0 0 1 140 90"
            fill="none"
            stroke="#1e293b"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Dynamic Score Path */}
          <path
            d="M 20 90 A 60 60 0 0 1 140 90"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Score Value */}
        <div className="absolute bottom-1 flex flex-col items-center">
          <span className="text-3xl font-extrabold text-white tracking-tight">
            {normalized.toFixed(1)}
          </span>
          <span className="text-[11px] text-slate-500 font-mono -mt-1">/ 10.0</span>
        </div>
      </div>

      {/* Label Badge */}
      <div className={`mt-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badgeBg}`}>
        {normalized >= 6.0 ? (
          <ShieldAlert className="w-3.5 h-3.5" />
        ) : (
          <ShieldCheck className="w-3.5 h-3.5" />
        )}
        <span>{label}</span>
      </div>
      <p className="text-[11px] text-slate-500 mt-2">
        CVSS-aligned weighted composite calculation
      </p>
    </div>
  );
}
