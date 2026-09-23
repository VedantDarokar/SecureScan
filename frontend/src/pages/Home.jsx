import React, { useState, useEffect } from 'react';
import {
  Shield,
  Sparkles,
  ArrowRight,
  Terminal,
  Activity,
  FileCode,
  CheckCircle2,
  FileDown,
  Lock,
  ChevronRight,
  Zap,
  Layers,
  Database,
  Eye,
  Check,
  Play,
  Menu,
  X
} from 'lucide-react';

export default function Home({ user, onOpenAuth, onGoToDashboard }) {
  const [activeTab, setActiveTab] = useState('patch');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200">
      {/* Ambient background glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-teal-500/10 via-emerald-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/3 -right-60 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Sticky Navigation Header */}
      <nav
        className={`sticky top-0 z-50 w-full transition-all duration-200 ${
          scrolled || mobileMenuOpen
            ? 'bg-slate-950/95 backdrop-blur-xl border-b border-teal-500/20 shadow-2xl shadow-black/80'
            : 'bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div
            className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              closeMenu();
            }}
          >
            <div className="p-2 bg-gradient-to-br from-teal-500/20 to-emerald-500/10 border border-teal-500/30 rounded-xl text-teal-400 shadow-lg shadow-teal-500/10">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-300 bg-clip-text text-transparent">
                SecureScan
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 block font-mono">
                Autonomous AppSec Platform
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8 text-xs font-medium text-slate-400">
            <a href="#features" className="hover:text-teal-300 transition">Features</a>
            <a href="#how-it-works" className="hover:text-teal-300 transition">How It Works</a>
            <a href="#demo" className="hover:text-teal-300 transition">Interactive Demo</a>
            <a href="#architecture" className="hover:text-teal-300 transition">Architecture</a>
          </div>

          {/* Desktop Auth Controls */}
          <div className="hidden sm:flex items-center space-x-2 sm:space-x-3">
            {user ? (
              <button
                onClick={onGoToDashboard}
                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition shadow-md shadow-teal-500/20 flex items-center space-x-1.5"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth('signin')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition shadow-md shadow-teal-500/20 flex items-center space-x-1"
                >
                  <span>Get Started</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {/* Mobile & Tablet Hamburger Toggle */}
          <div className="flex md:hidden items-center space-x-2">
            {user && (
              <button
                onClick={onGoToDashboard}
                className="sm:hidden px-3 py-1.5 bg-teal-500 text-slate-950 font-bold rounded-lg text-xs"
              >
                Dashboard
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800 transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-teal-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800/80 bg-slate-950/98 px-6 py-6 space-y-4 shadow-2xl backdrop-blur-2xl animate-fadeIn">
            <div className="flex flex-col space-y-3 text-sm font-medium text-slate-300">
              <a
                href="#features"
                onClick={closeMenu}
                className="py-2 hover:text-teal-300 border-b border-slate-900 transition flex items-center justify-between"
              >
                <span>Features</span>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </a>
              <a
                href="#how-it-works"
                onClick={closeMenu}
                className="py-2 hover:text-teal-300 border-b border-slate-900 transition flex items-center justify-between"
              >
                <span>How It Works</span>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </a>
              <a
                href="#demo"
                onClick={closeMenu}
                className="py-2 hover:text-teal-300 border-b border-slate-900 transition flex items-center justify-between"
              >
                <span>Interactive Demo</span>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </a>
              <a
                href="#architecture"
                onClick={closeMenu}
                className="py-2 hover:text-teal-300 transition flex items-center justify-between"
              >
                <span>Architecture</span>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </a>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-2.5">
              {user ? (
                <button
                  onClick={() => {
                    closeMenu();
                    onGoToDashboard();
                  }}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2"
                >
                  <span>Go to Scanner Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      closeMenu();
                      onOpenAuth('signin');
                    }}
                    className="w-full py-2.5 border border-slate-800 hover:bg-slate-900 text-slate-200 font-semibold rounded-xl text-sm transition text-center"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      closeMenu();
                      onOpenAuth('register');
                    }}
                    className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-1.5"
                  >
                    <span>Get Started Free</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-12 sm:pt-20 sm:pb-16 md:pt-28 md:pb-24 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center space-x-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[11px] sm:text-xs font-medium mb-6 sm:mb-8 backdrop-blur-md animate-fadeIn">
          <Sparkles className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
          <span>Next-Gen OWASP Top 10 Web Vulnerability Scanner & AI Remediation</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.15]">
          Detect Web Flaws Fast.{' '}
          <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Patch Code Instantly with AI.
          </span>
        </h1>

        <p className="mt-5 sm:mt-6 text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl leading-relaxed px-2">
          SecureScan automates crawling, tests for OWASP Top 10 vulnerabilities via OWASP ZAP,
          quantifies risk with a 1.0–10.0 score, and generates ready-to-deploy code patches using Google Gemini.
        </p>

        {/* CTA Buttons */}
        <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto px-4 sm:px-0">
          <button
            onClick={() => (user ? onGoToDashboard() : onOpenAuth('register'))}
            className="w-full sm:w-auto px-7 sm:px-8 py-3.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-400 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold rounded-2xl text-sm transition shadow-xl shadow-teal-500/25 flex items-center justify-center space-x-2"
          >
            <span>{user ? 'Open Scanner Dashboard' : 'Start Auditing for Free'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href="#demo"
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-2xl text-sm font-semibold transition flex items-center justify-center space-x-2"
          >
            <Play className="w-4 h-4 fill-slate-300" />
            <span>View Interactive Demo</span>
          </a>
        </div>

        {/* Trust Stats Bar */}
        <div className="mt-12 sm:mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-8 border-t border-slate-800/80 w-full max-w-4xl text-left">
          <div className="space-y-1">
            <span className="text-xl sm:text-2xl font-extrabold text-white font-mono">OWASP Top 10</span>
            <p className="text-[11px] sm:text-xs text-slate-500">SQLi, XSS, CSRF & Misconfigs</p>
          </div>
          <div className="space-y-1">
            <span className="text-xl sm:text-2xl font-extrabold text-teal-400 font-mono">1.0 – 10.0</span>
            <p className="text-[11px] sm:text-xs text-slate-500">Quantified CVSS Risk Metric</p>
          </div>
          <div className="space-y-1">
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono">Gemini AI</span>
            <p className="text-[11px] sm:text-xs text-slate-500">Contextual Code Patches</p>
          </div>
          <div className="space-y-1">
            <span className="text-xl sm:text-2xl font-extrabold text-cyan-400 font-mono">Atlas NoSQL</span>
            <p className="text-[11px] sm:text-xs text-slate-500">Secure Cloud Persistence</p>
          </div>
        </div>
      </section>

      {/* Interactive Live Demo Preview Card */}
      <section id="demo" className="py-10 sm:py-12 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <div className="text-center mb-6 sm:mb-8 space-y-2">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-teal-400">
            Interactive Product Preview
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            See How SecureScan Transforms Vulnerability Triage
          </h2>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-6 md:p-8 backdrop-blur-xl shadow-2xl shadow-slate-950/80">
          {/* Mock URL Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pb-5 sm:pb-6 border-b border-slate-800/80">
            <div className="flex items-center space-x-2.5 sm:space-x-3 w-full sm:w-auto">
              <span className="flex space-x-1.5 flex-shrink-0">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500/80" />
              </span>
              <div className="px-3 sm:px-4 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 flex items-center space-x-2 w-full sm:w-80 truncate">
                <Lock className="w-3 h-3 text-teal-400 flex-shrink-0" />
                <span className="text-teal-300">target:</span>
                <span className="truncate">https://ginandjuice.shop</span>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                Risk Score: 7.8 / 10.0
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                AI Patches Ready
              </span>
            </div>
          </div>

          {/* Interactive Inspection Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
            {/* Left Column: Discovered Vulnerability */}
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-mono uppercase text-slate-400 font-semibold block">
                Flagged Vulnerability Finding
              </span>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    High Severity
                  </span>
                  <span className="text-xs text-slate-500 font-mono">CWE-89</span>
                </div>
                <h4 className="font-bold text-white text-sm">SQL Injection (Blind / Error Based)</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  OWASP ZAP active scan detected SQL command execution vulnerability via the query parameter <code className="text-teal-300">category</code>.
                </p>
                <div className="text-[11px] font-mono text-slate-500 p-2 bg-slate-900 rounded border border-slate-800 truncate">
                  Evidence: ' OR '1'='1' --
                </div>
              </div>

              {/* Security Headers Summary */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400 font-semibold block">Missing Defensive Headers</span>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Content Security Policy (CSP)</span>
                  <span className="text-amber-400 font-mono">Missing</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Anti-Clickjacking (X-Frame-Options)</span>
                  <span className="text-amber-400 font-mono">Missing</span>
                </div>
              </div>
            </div>

            {/* Right Column: AI Remediation Code Diff */}
            <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-mono uppercase text-teal-400 font-semibold flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    <span>Gemini AI Contextual Remediation</span>
                  </span>
                  <div className="flex space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] w-fit">
                    <button
                      onClick={() => setActiveTab('patch')}
                      className={`px-2.5 py-1 rounded-md transition ${activeTab === 'patch' ? 'bg-teal-500/20 text-teal-300 font-semibold' : 'text-slate-400 hover:text-white'}`}
                    >
                      Code Patch
                    </button>
                    <button
                      onClick={() => setActiveTab('explanation')}
                      className={`px-2.5 py-1 rounded-md transition ${activeTab === 'explanation' ? 'bg-teal-500/20 text-teal-300 font-semibold' : 'text-slate-400 hover:text-white'}`}
                    >
                      Plain Explanation
                    </button>
                  </div>
                </div>

                {activeTab === 'patch' ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs">
                    <div className="p-3 bg-slate-900/80 border-b border-slate-800 text-slate-400 flex items-center justify-between text-[11px]">
                      <span>Remediation &bull; Python / SQLAlchemy</span>
                      <span className="text-emerald-400 flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>OWASP Compliant</span>
                      </span>
                    </div>
                    <pre className="p-3 sm:p-4 text-emerald-300 leading-relaxed overflow-x-auto select-all text-[11px] sm:text-xs">
                      <code>{`# VULNERABLE CODE:
# query = f"SELECT * FROM products WHERE cat = '{category}'"

# SECURE FIX (Parameterized Query):
from sqlalchemy.orm import Session
from app.db.models import Product

def get_products_securely(db: Session, category: str):
    # Parameterized query immune to SQL injection
    return db.query(Product).filter(Product.category == category).all()`}</code>
                    </pre>
                  </div>
                ) : (
                  <div className="p-4 sm:p-5 rounded-2xl border border-slate-800 bg-slate-950 text-xs text-slate-300 leading-relaxed space-y-3">
                    <p>
                      <strong>What is this flaw?</strong> An attacker is able to append structured SQL syntax into the <code className="text-teal-300">category</code> parameter. Because the input was concatenated directly into database queries, the database interpreted user input as executable SQL logic.
                    </p>
                    <p>
                      <strong>Why this fix works:</strong> By utilizing prepared statements with SQLAlchemy ORM parameterization, the database treats the incoming user string as literal text data rather than executable code instructions, permanently neutralizing SQL injection vectors.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                <span>Output conforms to LangChain structured JSON schema</span>
                <button
                  onClick={() => (user ? onGoToDashboard() : onOpenAuth('signin'))}
                  className="text-teal-400 hover:text-teal-300 font-semibold flex items-center space-x-1"
                >
                  <span>Test in live dashboard &rarr;</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid - Tablet (sm:grid-cols-2) & Desktop (lg:grid-cols-3) */}
      <section id="features" className="py-16 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12 sm:mb-16">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-teal-400">
            Engine Capabilities
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
            Built for Modern Security Engineering
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Everything your team needs to test, prioritize, and remediate web vulnerabilities before attackers exploit them.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-teal-500/40 transition group">
            <div className="p-3 w-fit rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 mb-6 group-hover:scale-110 transition">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-2">Automated OWASP ZAP Scanning</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deep spider crawling maps internal application endpoints and forms, running automated injection attacks for SQLi, XSS, and security header oversights.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition group">
            <div className="p-3 w-fit rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-6 group-hover:scale-110 transition">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-2">AI Remediation via Gemini</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Context-aware prompt pipelines convert complex alert outputs into plain-English executive explanations and copy-paste code patches.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition group">
            <div className="p-3 w-fit rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-6 group-hover:scale-110 transition">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-2">Quantified 1.0–10.0 Risk Score</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              CVSS-aligned weighted composite calculation normalizes multiple severities (Critical, High, Med, Low) into a single quantifiable risk metric.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition group">
            <div className="p-3 w-fit rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-6 group-hover:scale-110 transition">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-2">MongoDB Atlas Cloud Storage</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Atomic document-oriented NoSQL persistence stores scans, findings, and patches securely in MongoDB Atlas with complete history tracking.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition group">
            <div className="p-3 w-fit rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-6 group-hover:scale-110 transition">
              <FileDown className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-2">Executive PDF Security Reports</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              1-click downloadable PDF reports formatted with executive summaries, CVSS score tables, and itemized code patches ready for compliance audit.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-rose-500/40 transition group">
            <div className="p-3 w-fit rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-6 group-hover:scale-110 transition">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-2">GCP OAuth 2.0 Security</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Google Cloud Platform OAuth 2.0 sign-in and stateless JWT session management keep web services protected and access strictly regulated.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full border-t border-slate-800/80">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12 sm:mb-16">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-teal-400">
            Streamlined Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
            Three Steps to Full Remediation
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 relative">
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-4">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-teal-400">01</span>
            <h3 className="text-base sm:text-lg font-bold text-white">Provide Target URL</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sign in with your Google or email account and input any web application URL. The crawler immediately maps routes, forms, and headers.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-4">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400">02</span>
            <h3 className="text-base sm:text-lg font-bold text-white">Automated Audit & Scoring</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The engine runs active and passive tests against OWASP Top 10 vulnerabilities, calculating a normalized 1.0–10.0 risk score.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-4 sm:col-span-2 lg:col-span-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-400">03</span>
            <h3 className="text-base sm:text-lg font-bold text-white">Apply AI Patches & Export</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              View plain-English explanations and copy ready-to-deploy code diffs. Download the executive PDF assessment for stakeholder review.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-5xl mx-auto w-full">
        <div className="p-6 sm:p-10 md:p-14 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 border border-teal-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="inline-flex p-3 rounded-2xl bg-teal-500/10 text-teal-400 mb-2 border border-teal-500/20">
            <Shield className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
            Ready to Audit and Harden Your Web Services?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Join developers and security analysts using SecureScan to eliminate vulnerabilities before they reach production.
          </p>
          <div className="pt-2">
            <button
              onClick={() => (user ? onGoToDashboard() : onOpenAuth('register'))}
              className="px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold rounded-2xl text-xs sm:text-sm transition shadow-xl shadow-teal-500/30 inline-flex items-center space-x-2"
            >
              <span>{user ? 'Open Dashboard' : 'Create Free Account & Scan'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 px-4 sm:px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-teal-400" />
            <span className="font-semibold text-slate-300">SecureScan</span>
            <span>&bull; Final Year Cybersecurity & AI Engineering</span>
          </div>
          <div className="flex items-center space-x-4 sm:space-x-6 text-slate-400 text-[11px] sm:text-xs">
            <span>FastAPI &bull; React &bull; MongoDB Atlas &bull; OWASP ZAP &bull; Gemini AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
