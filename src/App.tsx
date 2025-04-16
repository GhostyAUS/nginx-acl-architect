
import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './pages/Dashboard';
import IpAcls from './pages/IpAcls';
import UrlAcls from './pages/UrlAcls';
import CombinedAcls from './pages/CombinedAcls';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import AppLayout from './components/layout/AppLayout';
import { Toaster } from './components/ui/sonner';

type ValidRoute = 'dashboard' | 'ip-acls' | 'url-acls' | 'combined-acls' | 'settings';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');

  useEffect(() => {
    // Simple hash change handler
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'dashboard';
      setCurrentPage(hash);
    };

    // Set initial page based on hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Simple route mapping
  const getPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'ip-acls':
        return <IpAcls />;
      case 'url-acls':
        return <UrlAcls />;
      case 'combined-acls':
        return <CombinedAcls />;
      case 'settings':
        return <Settings />;
      default:
        return <NotFound />;
    }
  };

  return (
    <div className="app">
      <AppLayout>
        {getPage()}
      </AppLayout>
      <Toaster />
    </div>
  );
};

export default App;

