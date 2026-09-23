import React from 'react';
import { Sparkles, ExternalLink, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function FindingsTable({ vulnerabilities = [], onOpenRemediation, onRemediateAll, isRemediatingAll }) {
  const getSeverityBadge = (severity) => {
    const sev = (severity || 'low').toLowerCase();
    if (sev === 'critical') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          Critical
        </span>
      );
    } else if (sev === 'high') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
          High
        </span>
      );
    } else if (sev === 'medium') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          Medium
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          Low
        </span>
      );
    }
  };

  if (!vulnerabilities || vulnerabilities.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">No Vulnerabilities Detected</h3>
        <p className="text-sm text-slate-400 mt-1">
          The scanned application passed active OWASP Top 10 checks and security header audits.
        </p>
      </div>
    );
  }

  const remediatedCount = vulnerabilities.filter((v) => v.remediation).length;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-6 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
            <span>Detected Vulnerabilities ({vulnerabilities.length})</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any vulnerability to view its AI plain-English breakdown and code patch.
          </p>
        </div>

        <button
          onClick={onRemediateAll}
          disabled={isRemediatingAll}
          className="inline-flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-teal-500/20 to-emerald-500/20 hover:from-teal-500/30 hover:to-emerald-500/30 text-teal-300 border border-teal-500/40 rounded-xl text-xs font-semibold transition disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-teal-400 flex-shrink-0" />
          <span className="truncate">
            {isRemediatingAll
              ? 'Analyzing with Gemini...'
              : `AI Remediate All (${remediatedCount}/${vulnerabilities.length} Patched)`}
          </span>
        </button>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950/60 text-slate-400 text-xs font-mono uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-3 sm:px-6">Severity</th>
              <th className="py-3 px-3 sm:px-6">Alert / Vulnerability</th>
              <th className="py-3 px-3 sm:px-6 hidden md:table-cell">Affected Component</th>
              <th className="py-3 px-3 sm:px-6">AI Remediation</th>
              <th className="py-3 px-3 sm:px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300 font-sans">
            {vulnerabilities.map((vuln) => (
              <tr
                key={vuln.id}
                onClick={() => onOpenRemediation(vuln)}
                className="hover:bg-slate-800/40 cursor-pointer transition group"
              >
                <td className="py-4 px-6 whitespace-nowrap">
                  {getSeverityBadge(vuln.severity)}
                </td>
                <td className="py-4 px-6 font-medium text-white max-w-xs sm:max-w-md truncate">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-100 group-hover:text-teal-300 transition">
                      {vuln.alert_title}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      CWE-{vuln.cwe_id || 'N/A'} {vuln.param ? `• Param: ${vuln.param}` : ''}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6 text-xs text-slate-400 max-w-xs truncate hidden md:table-cell font-mono">
                  {vuln.url || 'Base Domain'}
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  {vuln.remediation ? (
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Patch Ready</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-xs text-slate-500">
                      <span>Not generated</span>
                    </span>
                  )}
                </td>
                <td className="py-4 px-6 text-right whitespace-nowrap">
                  <span className="inline-flex items-center text-xs font-semibold text-teal-400 group-hover:translate-x-1 transition">
                    <span>View Fix</span>
                    <ChevronRight className="w-4 h-4 ml-0.5" />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
