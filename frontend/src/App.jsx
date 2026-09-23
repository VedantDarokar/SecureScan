import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import { getMe, logoutUser, checkHealth } from './services/api';
import { Shield, Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(false);
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'auth' | 'dashboard'
  const [authInitialMode, setAuthInitialMode] = useState('signin'); // 'signin' | 'register'

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      const health = await checkHealth();
      setBackendOnline(health.status === 'healthy');
    } catch (e) {
      setBackendOnline(false);
    }

    const token = localStorage.getItem('securescan_token') || localStorage.getItem('secscan_token');
    if (token) {
      try {
        const userData = await getMe();
        setUser(userData);
      } catch (err) {
        logoutUser();
        setUser(null);
      }
    }
    setLoading(false);
  };

  const handleOpenAuth = (mode = 'signin') => {
    setAuthInitialMode(mode);
    setCurrentView('auth');
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setCurrentView('home');
  };

  const handleGoToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleGoHome = () => {
    setCurrentView('home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 animate-pulse">
          <Shield className="w-8 h-8" />
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
          <span>Initializing SecureScan Platform...</span>
        </div>
      </div>
    );
  }

  // 1. Auth View (Sign In / Register / Continue with Google)
  if (currentView === 'auth') {
    return (
      <Auth
        onAuthSuccess={handleAuthSuccess}
        backendOnline={backendOnline}
        initialMode={authInitialMode}
        onBackToHome={handleGoHome}
      />
    );
  }

  // 2. Dashboard View (Active Authenticated Services)
  if (currentView === 'dashboard') {
    if (!user) {
      // If user tries to access dashboard without session, route to Auth
      return (
        <Auth
          onAuthSuccess={handleAuthSuccess}
          backendOnline={backendOnline}
          initialMode="signin"
          onBackToHome={handleGoHome}
        />
      );
    }
    return (
      <Dashboard
        user={user}
        onLogout={handleLogout}
        onGoHome={handleGoHome}
      />
    );
  }

  // 3. Root Landing Page: Home Page (Default for all visitors)
  return (
    <Home
      user={user}
      onOpenAuth={handleOpenAuth}
      onGoToDashboard={handleGoToDashboard}
    />
  );
}
