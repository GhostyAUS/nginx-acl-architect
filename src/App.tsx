
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import IpAcls from './pages/IpAcls';
import UrlAcls from './pages/UrlAcls';
import CombinedAcls from './pages/CombinedAcls';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import AppLayout from './components/layout/AppLayout';
import { Toaster } from './components/ui/sonner';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/ip-acls" element={<AppLayout><IpAcls /></AppLayout>} />
        <Route path="/url-acls" element={<AppLayout><UrlAcls /></AppLayout>} />
        <Route path="/combined-acls" element={<AppLayout><CombinedAcls /></AppLayout>} />
        <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
};

export default App;
