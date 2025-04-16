
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

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');

  useEffect(() => {
    // Handle hash changes
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

  // Render the appropriate page based on the hash
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <AppLayout><Dashboard /></AppLayout>;
      case 'ip-acls':
        return <AppLayout><IpAcls /></AppLayout>;
      case 'url-acls':
        return <AppLayout><UrlAcls /></AppLayout>;
      case 'combined-acls':
        return <AppLayout><CombinedAcls /></AppLayout>;
      case 'settings':
        return <AppLayout><Settings /></AppLayout>;
      default:
        return <NotFound />;
    }
  };

  return (
    <div className="app">
      {renderPage()}
      <Toaster />
    </div>
  );
};

export default App;
