import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import { SupabaseAuthProvider, useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import PublicRegistrationPage from '@/pages/PublicRegistrationPage';
import MarketingHomePage from '@/pages/MarketingHomePage';
import DashboardPage from '@/pages/DashboardPage';
import LoginPage from '@/pages/LoginPage';
import { Loader2 } from 'lucide-react';

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
        <title>re:Compute-IT | Reparation, Uppgradering & Återbruk</title>
        <meta
          name="description"
          content="Hållbar elektronikservice i Eskilstuna. Vi reparerar, uppgraderar och återbrukar teknik i ReTuna Återbruksgalleria."
        />
        <meta property="og:title" content="re:Compute-IT | Reparation & Återbruk" />
        <meta
          property="og:description"
          content="Hållbar elektronikservice i Eskilstuna. Vi reparerar, uppgraderar och återbrukar teknik i ReTuna Återbruksgalleria."
        />
        <link rel="icon" type="image/svg+xml" href="https://horizons-cdn.hostinger.com/66ce8f1a-1805-4a09-9f17-041a9f68d79f/f39487d84caba3a65608a9652e97d727.jpg" />
      </Helmet>
      
      <div className="min-h-screen text-gray-800">
        <Routes>
          <Route path="/" element={<MarketingHomePage />} />
          <Route path="/service" element={<PublicRegistrationPage />} />
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
