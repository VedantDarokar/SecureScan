import React, { useState, useEffect } from 'react';
import { Shield, Activity, User, LogOut, ExternalLink, Home as HomeIcon } from 'lucide-react';

export default function Navbar({ backendOnline, user, onLogout, onGoHome }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        scrolled
          ? 'bg-slate-950/95 backdrop-blur-xl border-b border-teal-500/20 shadow-2xl shadow-black/80'
          : 'bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={onGoHome}
          className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group"
          title="Return to Home Page"
        >
          <div className="p-2 sm:p-2.5 bg-gradient-to-br from-teal-500/20 to-emerald-500/10 border border-teal-500/30 rounded-xl text-teal-400 shadow-lg shadow-teal-500/10 group-hover:scale-105 transition">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-300 bg-clip-text text-transparent">
                SecureScan
              </span>
              <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] uppercase font-mono font-semibold tracking-wider rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                v2.0
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 hidden md:block">
              OWASP Top 10 Scanner & AI Patch Engine
            </span>
          </div>
        </div>

        {/* Right Status & Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Home Link */}
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800 transition"
              title="Return to Home Landing Page"
            >
              <HomeIcon className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Home</span>
            </button>
          )}

          {/* Backend Status indicator */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium border bg-slate-900/80 border-slate-800">
            <span
              className={`w-2 h-2 rounded-full ${
                backendOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-rose-500 animate-pulse'
              }`}
            />
            <span className="text-slate-400 text-xs hidden lg:inline">
              API: {backendOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Swagger docs link */}
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="hidden xl:flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800 transition"
          >
            <span>Docs</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>

          {/* User state */}
          {user ? (
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <div className="flex items-center space-x-1.5 text-xs text-slate-300 bg-slate-900 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-800 max-w-[120px] sm:max-w-[200px] md:max-w-none truncate">
                <User className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                <span className="font-medium truncate">{user.email}</span>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
