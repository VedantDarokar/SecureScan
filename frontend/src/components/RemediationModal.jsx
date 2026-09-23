import React, { useState } from 'react';
import { X, Sparkles, Copy, Check, FileCode, ShieldCheck, ArrowRight } from 'lucide-react';

export default function RemediationModal({ isOpen, onClose, vulnerability, remediation, onGenerateAI, isGenerating }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !vulnerability) return null;

  const handleCopy = () => {
    if (remediation?.patch_code) {
      navigator.clipboard.writeText(remediation.patch_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/40">
          <div className="pr-2">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/30">
                AI Security Remediation
              </span>
              <span className="text-xs text-slate-500 font-mono">
                CWE-{vulnerability.cwe_id || 'N/A'}
              </span>
            </div>
            <h3 className="text-base sm:text-xl font-bold text-white mt-1">
              {vulnerability.alert_title}
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-mono break-all">
              Target URL: {vulnerability.url || 'Site root'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm flex-1">
          {/* If remediation exists */}
          {remediation ? (
            <>
              {/* Plain-English Explanation */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center space-x-1.5 font-mono">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span>Plain-English Vulnerability Breakdown</span>
                </h4>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-slate-300 leading-relaxed space-y-2 text-sm">
                  {remediation.plain_explanation.split('\n\n').map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
                </div>
              </div>

              {/* Exact Code Patch */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center space-x-1.5 font-mono">
                    <FileCode className="w-4 h-4 text-teal-400" />
                    <span>Ready-to-Apply Patch ({remediation.patch_language || 'code'})</span>
                  </h4>
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 transition"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                  <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed select-all">
                    <code>{remediation.patch_code}</code>
                  </pre>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center space-y-4">
              <div className="p-3 w-fit mx-auto rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="text-lg font-bold text-white">Generate Context-Aware AI Patch</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Gemini API analyzes this specific finding and generates an executive summary and production-ready code patch.
                </p>
              </div>
              <button
                onClick={() => onGenerateAI(vulnerability.id)}
                disabled={isGenerating}
                className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-semibold rounded-xl text-sm transition shadow-lg shadow-teal-500/20 inline-flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGenerating ? 'Analyzing with Gemini...' : 'Generate AI Remediation'}</span>
              </button>
            </div>
          )}

          {/* Original Scanner Evidence & Solution */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Raw Scanner Context
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/60">
                <span className="text-slate-500 block mb-1 font-mono">Description:</span>
                <span className="text-slate-300">{vulnerability.description || 'No description provided.'}</span>
              </div>
              <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/60">
                <span className="text-slate-500 block mb-1 font-mono">OWASP Solution Guideline:</span>
                <span className="text-slate-300">{vulnerability.solution || 'Follow standard secure configuration practices.'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
          <span>SecureScan Engine &bull; Google Gemini AI</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
