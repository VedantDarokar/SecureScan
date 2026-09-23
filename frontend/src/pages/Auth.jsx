import React, { useState, useEffect, useRef } from 'react';
import { Shield, Lock, Mail, User, ArrowRight, Loader2, AlertCircle, Info, ArrowLeft } from 'lucide-react';
import { loginUser, registerUser, loginWithGoogle, getMe, getAuthConfig } from '../services/api';

export default function Auth({ onAuthSuccess, backendOnline, initialMode = 'signin', onBackToHome }) {
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');
  const googleBtnRef = useRef(null);

  useEffect(() => {
    loadGcpConfig();
  }, []);

  const loadGcpConfig = async () => {
    try {
      const cfg = await getAuthConfig();
      if (cfg?.google_client_id) {
        setGoogleClientId(cfg.google_client_id);
        initGoogleIdentityServices(cfg.google_client_id);
      }
    } catch (e) {
      console.log('Auth config check:', e);
    }
  };

  const initGoogleIdentityServices = (clientId) => {
    if (window.google?.accounts?.id && googleBtnRef.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
        });

        // Render official Google button
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_black',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: '100%',
          logo_alignment: 'left',
        });
      } catch (err) {
        console.error('GIS render error:', err);
      }
    } else {
      // Retry in 500ms if script is still loading
      setTimeout(() => initGoogleIdentityServices(clientId), 500);
    }
  };

  const handleGoogleCredentialResponse = async (response) => {
    if (!response?.credential) return;
    setLoading(true);
    setError('');
    try {
      // Send verified Google JWT credential to backend
      await loginWithGoogle({ credential: response.credential });
      const userData = await getMe();
      onAuthSuccess(userData);
    } catch (err) {
      setError(err.response?.data?.detail || 'GCP OAuth verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      if (isRegister) {
        await registerUser(email, password, fullName);
        await loginUser(email, password);
      } else {
        await loginUser(email, password);
      }
      const userData = await getMe();
      onAuthSuccess(userData);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Authentication failed. Please check credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleManualGoogleClick = async () => {
    if (googleClientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
      return;
    }

    // Fallback if client ID is not yet configured in backend .env
    const enteredEmail = prompt(
      'GCP Client ID is currently empty in .env.\nEnter Google email to test sign in:',
      'developer@gmail.com'
    );
    if (!enteredEmail) return;

    setLoading(true);
    try {
      const namePart = enteredEmail.split('@')[0];
      await loginWithGoogle({
        email: enteredEmail,
        full_name: namePart.charAt(0).toUpperCase() + namePart.slice(1)
      });
      const userData = await getMe();
      onAuthSuccess(userData);
    } catch (err) {
      setError(err.response?.data?.detail || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 selection:bg-teal-500/30 selection:text-teal-200">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Back to Home Button */}
        {onBackToHome && (
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-teal-300 transition group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition" />
            <span>Back to Home</span>
          </button>
        )}

        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-gradient-to-br from-teal-500/20 to-emerald-500/10 border border-teal-500/30 rounded-2xl text-teal-400 shadow-xl shadow-teal-500/10 mb-2">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            SecureScan Platform
          </h1>
          <p className="text-xs text-slate-400">
            Automated Web Vulnerability Scanner & AI-Powered Remediation
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-slate-950/80">
          {/* Tabs */}
          <div className="flex border-b border-slate-800 mb-6 pb-2">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold transition border-b-2 -mb-2.5 ${
                !isRegister
                  ? 'border-teal-400 text-teal-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold transition border-b-2 -mb-2.5 ${
                isRegister
                  ? 'border-teal-400 text-teal-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              New User? Register
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 flex items-center space-x-2 text-rose-400 text-xs bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign In Container */}
          <div className="space-y-3">
            {/* Google Identity Services Container */}
            <div ref={googleBtnRef} className="w-full flex justify-center overflow-hidden" />

            {/* Custom Google Styled Button (Shown if GIS button not rendered) */}
            {(!googleClientId || !window.google) && (
              <button
                type="button"
                onClick={handleManualGoogleClick}
                disabled={loading}
                className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-800/80 border border-slate-700/80 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-3 shadow-sm hover:border-slate-600 disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            )}

            {!googleClientId && (
              <p className="text-[11px] text-slate-500 text-center flex items-center justify-center space-x-1">
                <Info className="w-3 h-3 text-slate-500" />
                <span>To link your GCP project, add <code>GOOGLE_CLIENT_ID</code> in <code>.env</code></span>
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase font-mono">
              <span className="bg-slate-900 px-3 text-slate-500">Or use email</span>
            </div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-xs transition"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-xs transition font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-xs transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>{isRegister ? 'Create Account & Access' : 'Sign In to Dashboard'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500 space-y-1">
          <p>GCP OAuth 2.0 &bull; JWT Stateless Sessions &bull; MongoDB Atlas</p>
        </div>
      </div>
    </div>
  );
}
