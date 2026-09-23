import React, { useState } from 'react';
import { Globe, Play, Loader2, Sparkles, AlertCircle } from 'lucide-react';

export default function ScanForm({ onStartScan, isScanning }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please enter a target URL (e.g., https://ginandjuice.shop or http://example.com)');
      return;
    }
    setError('');
    onStartScan(url.trim());
  };

  const handleQuickFill = (target) => {
    setUrl(target);
    setError('');
  };

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-xl shadow-slate-950/50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>Initiate Vulnerability Audit</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Automates endpoint discovery, tests OWASP Top 10 vulnerabilities, and scores risk.
          </p>
        </div>

        {/* Preset quick test buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-mono">Quick Test:</span>
          <button
            type="button"
            onClick={() => handleQuickFill('http://testphp.vulnweb.com')}
            className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-teal-400 border border-slate-700/60 transition"
          >
            vulnweb.com (Demo)
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('https://example.com')}
            className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition"
          >
            example.com
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative flex flex-col sm:block">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-slate-500">
              <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-teal-500/80" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isScanning}
              placeholder="https://your-target-application.com"
              className="w-full pl-10 sm:pl-12 pr-4 sm:pr-36 py-3 sm:py-3.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-xs sm:text-sm font-mono transition shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={isScanning}
            className="mt-2.5 sm:mt-0 sm:absolute sm:right-2 sm:top-2 sm:bottom-2 px-5 sm:px-6 py-3 sm:py-0 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-semibold rounded-lg text-xs sm:text-sm transition flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-teal-500/20"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Start Scan</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-rose-400 text-xs mt-2 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </form>
    </div>
  );
}
