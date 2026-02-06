import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import { SupabaseAuthProvider, useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import PublicRegistrationPage from '@/pages/PublicRegistrationPage';
import DashboardPage from '@/pages/DashboardPage';
import LoginPage from '@/pages/LoginPage';
import { Loader2 } from 'lucide-react';
import pkg from '../package.json';

const APP_VERSION = import.meta.env.VITE_APP_VERSION || pkg.version || '0.0.0';

function ProtectedRoute({ children }) {
  const { session, loading } = useSupabaseAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}


function AppContent() {
  return (
    <>
      <Helmet>
        <title>re:Compute-IT - Service & Reparation</title>
        <meta name="description" content="Professionellt serviceregister för hantering av serviceärenden hos re:Compute-IT. Registrera enheter, kontaktuppgifter och felbeskrivningar enkelt och säkert." />
        <meta property="og:title" content="re:Compute-IT - Service & Reparation" />
        <meta property="og:description" content="Professionellt serviceregister för hantering av serviceärenden hos re:Compute-IT." />
        <link rel="icon" type="image/svg+xml" href="https://horizons-cdn.hostinger.com/66ce8f1a-1805-4a09-9f17-041a9f68d79f/f39487d84caba3a65608a9652e97d727.jpg" />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 text-gray-800">
        <Routes>
          <Route path="/" element={<PublicRegistrationPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
        <div className="fixed bottom-3 right-4 text-[11px] text-gray-500 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-2.5 py-1 shadow-sm">
          v{APP_VERSION}
        </div>
        <Toaster />
      </div>
    </>
  );
}

function App() {
  return (
    <SupabaseAuthProvider>
      <AppContent />
    </SupabaseAuthProvider>
  );
}

export default App;
