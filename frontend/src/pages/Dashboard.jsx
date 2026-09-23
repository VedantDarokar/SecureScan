import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import ScanForm from '../components/ScanForm';
import RiskGauge from '../components/RiskGauge';
import SeverityChart from '../components/SeverityChart';
import FindingsTable from '../components/FindingsTable';
import RemediationModal from '../components/RemediationModal';
import {
  checkHealth,
  startScan,
  getScanDetails,
  getScansList,
  remediateAllFindings,
  remediateSingleFinding,
  downloadScanReport,
} from '../services/api';
import {
  ShieldAlert,
  Clock,
  ExternalLink,
  RefreshCw,
  Sparkles,
  History,
  AlertTriangle,
  CheckCircle2,
  FileDown,
} from 'lucide-react';

export default function Dashboard({ user, onLogout, onGoHome }) {
  const [backendOnline, setBackendOnline] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [currentScan, setCurrentScan] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [selectedVuln, setSelectedVuln] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isRemediatingAll, setIsRemediatingAll] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const pollIntervalRef = useRef(null);

  // Initial health check and load history
  useEffect(() => {
    loadHealthAndHistory();
    const interval = setInterval(loadHealthAndHistory, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadHealthAndHistory = async () => {
    try {
      const health = await checkHealth();
      setBackendOnline(health.status === 'healthy');
      const list = await getScansList();
      setScanHistory(list || []);

      // If we don't have an active scan displayed yet, show the most recent one if available
      if (!currentScan && list && list.length > 0) {
        const latestDetails = await getScanDetails(list[0].id);
        setCurrentScan(latestDetails);
      }
    } catch (err) {
      setBackendOnline(false);
    }
  };

  // Poll scan status until completion
  const startPollingScan = (scanId) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const details = await getScanDetails(scanId);
        setCurrentScan(details);
        setScanProgress(details.progress || 0);

        if (details.status === 'COMPLETED' || details.status === 'FAILED') {
          clearInterval(pollIntervalRef.current);
          setIsScanning(false);
          // Reload history list
          const list = await getScansList();
          setScanHistory(list || []);

          // Automatically trigger AI remediation on completion so results are ready
          if (details.status === 'COMPLETED' && details.vulnerabilities?.length > 0) {
            handleRemediateAll(details.id);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);
  };

  const handleStartScan = async (targetUrl) => {
    try {
      setIsScanning(true);
      setScanProgress(10);
      const newScan = await startScan(targetUrl);
      setCurrentScan(newScan);
      startPollingScan(newScan.id);
    } catch (err) {
      alert('Failed to launch scan. Ensure backend is running.');
      setIsScanning(false);
    }
  };

  const handleSelectHistoryScan = async (scanId) => {
    try {
      const details = await getScanDetails(scanId);
      setCurrentScan(details);
    } catch (err) {
      console.error('Error fetching scan history item:', err);
    }
  };

  const handleOpenRemediation = (vuln) => {
    setSelectedVuln(vuln);
    setIsModalOpen(true);
  };

  const handleGenerateSingleAI = async (vulnId) => {
    try {
      setIsGeneratingAI(true);
      const updatedRem = await remediateSingleFinding(vulnId);
      // Update local vulnerability remediation
      if (currentScan) {
        const updatedVulns = currentScan.vulnerabilities.map((v) =>
          v.id === vulnId ? { ...v, remediation: updatedRem } : v
        );
        setCurrentScan({ ...currentScan, vulnerabilities: updatedVulns });
        if (selectedVuln && selectedVuln.id === vulnId) {
          setSelectedVuln({ ...selectedVuln, remediation: updatedRem });
        }
      }
    } catch (err) {
      alert('AI remediation error: check Gemini API key or backend logs.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleRemediateAll = async (scanId = null) => {
    const idToUse = scanId || currentScan?.id;
    if (!idToUse) return;

    try {
      setIsRemediatingAll(true);
      const updatedScan = await remediateAllFindings(idToUse);
      setCurrentScan(updatedScan);
      if (selectedVuln) {
        const refreshed = updatedScan.vulnerabilities?.find((v) => v.id === selectedVuln.id);
        if (refreshed) setSelectedVuln(refreshed);
      }
    } catch (err) {
      console.error('Error remediating all findings:', err);
    } finally {
      setIsRemediatingAll(false);
    }
  };

  const handleDownloadReport = (scanId) => {
    downloadScanReport(scanId);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200">
      <Navbar backendOnline={backendOnline} user={user} onLogout={onLogout} onGoHome={onGoHome} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Hero / Scan Input */}
        <section>
          <ScanForm onStartScan={handleStartScan} isScanning={isScanning} />
        </section>

        {/* Live Scan Progress Bar */}
        {isScanning && (
          <div className="bg-slate-900/80 border border-teal-500/30 rounded-2xl p-4 sm:p-6 shadow-xl shadow-teal-500/5 animate-pulse">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm mb-2 font-mono gap-1">
              <span className="text-teal-400 font-semibold flex items-center space-x-2 truncate">
                <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
                <span className="truncate">Auditing Target Website: {currentScan?.target_url}</span>
              </span>
              <span className="text-slate-400">{scanProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-400 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-2">
              Executing target crawl, passive security header checks, and OWASP ZAP active injection testing...
            </p>
          </div>
        )}

        {/* Active Scan Results View */}
        {currentScan && (
          <section className="space-y-6">
            {/* Meta bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Target:
                </span>
                <span className="text-sm font-bold text-white font-mono break-all sm:break-normal">{currentScan.target_url}</span>
                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    currentScan.status === 'COMPLETED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : currentScan.status === 'RUNNING'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {currentScan.status}
                </span>
              </div>
              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 sm:gap-4">
                <span>Scan ID: #{currentScan.id}</span>
                <span>Date: {new Date(currentScan.created_at).toLocaleString()}</span>
              </div>
            </div>

            {/* Metrics Row: Risk Score Gauge + Severity Doughnut + Summary Stat */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <RiskGauge score={currentScan.risk_score || 0} />
              <SeverityChart
                critical={currentScan.critical_count || 0}
                high={currentScan.high_count || 0}
                medium={currentScan.medium_count || 0}
                low={currentScan.low_count || 0}
              />
              {/* Executive Summary Card */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                    Audit Highlights
                  </span>
                  <div className="mt-3 space-y-3 text-xs">
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Total Vulnerabilities</span>
                      <span className="font-bold text-white text-sm">
                        {currentScan.total_vulnerabilities || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">AI Patches Ready</span>
                      <span className="font-semibold text-emerald-400">
                        {currentScan.vulnerabilities?.filter((v) => v.remediation).length || 0} /{' '}
                        {currentScan.total_vulnerabilities || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Scanning Engine</span>
                      <span className="text-slate-300 font-mono">OWASP ZAP + Crawler</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleRemediateAll()}
                    disabled={isRemediatingAll || currentScan.vulnerabilities?.length === 0}
                    className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-semibold rounded-xl text-xs transition shadow-md shadow-teal-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>
                      {isRemediatingAll ? 'Generating AI Patches...' : 'AI Patch All'}
                    </span>
                  </button>

                  <button
                    onClick={() => handleDownloadReport(currentScan.id)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 font-semibold rounded-xl text-xs transition flex items-center justify-center space-x-1.5 shadow-sm"
                    title="Download Comprehensive PDF Security Report"
                  >
                    <FileDown className="w-4 h-4 text-teal-400" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Findings Table */}
            <FindingsTable
              vulnerabilities={currentScan.vulnerabilities || []}
              onOpenRemediation={handleOpenRemediation}
              onRemediateAll={() => handleRemediateAll()}
              isRemediatingAll={isRemediatingAll}
            />
          </section>
        )}

        {/* Scan History Drawer */}
        {scanHistory.length > 0 && (
          <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center space-x-2 mb-4">
              <History className="w-4 h-4 text-teal-400" />
              <span>Previous Scans History</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {scanHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectHistoryScan(item.id)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    currentScan?.id === item.id
                      ? 'bg-slate-800/80 border-teal-500/50 shadow-md shadow-teal-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <span className="text-xs font-semibold text-white truncate block font-mono">
                      {item.target_url}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {new Date(item.created_at).toLocaleDateString()} &bull; Risk:{' '}
                      <strong className="text-teal-400">{item.risk_score}</strong>
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-slate-400">{item.total_vulnerabilities} findings</span>
                    <span className="text-teal-400 font-medium">Load &rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* AI Remediation Modal */}
      <RemediationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        vulnerability={selectedVuln}
        remediation={selectedVuln?.remediation}
        onGenerateAI={handleGenerateSingleAI}
        isGenerating={isGeneratingAI}
      />

      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        SecureScan &bull; Final Year Cybersecurity & AI Engineering Project
      </footer>
    </div>
  );
}
