import React from 'react';
import { Button } from '@/components/ui/button';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { ServiceRegister } from '@/components/ServiceRegister';
import { LogOut, PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import pkg from '../../package.json';

const APP_VERSION = import.meta.env.VITE_APP_VERSION || pkg.version || '0.0.0';

const Header = ({ onSignOut, user }) => (
  <header className="bg-white shadow-md sticky top-0 z-50">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-20">
        <div className="flex-shrink-0">
          <Link to="/dashboard" className="flex items-center">
            <img className="h-10 w-auto" src="https://horizons-cdn.hostinger.com/66ce8f1a-1805-4a09-9f17-041a9f68d79f/f39487d84caba3a65608a9652e97d727.jpg" alt="re:Compute-IT Logo" />
          </Link>
        </div>
        <div className="flex items-center gap-4">
           {user && <p className="text-gray-500 text-sm hidden sm:block">Inloggad som {user.email}</p>}
          <span className="text-[11px] text-gray-500 bg-white/80 border border-gray-200 rounded-full px-2 py-0.5 hidden sm:inline-flex">
            v{APP_VERSION}
          </span>
          <Button onClick={onSignOut} variant="outline" className="text-gray-600 hover:bg-gray-100 border-gray-300 gap-2">
            <LogOut size={16} /> Logga ut
          </Button>
        </div>
      </div>
    </div>
  </header>
);

export default function DashboardPage() {
  const { signOut, user } = useSupabaseAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onSignOut={signOut} user={user} />
      <main className="container mx-auto p-4 md:p-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Personalvy
            </h1>
            <p className="mt-2 text-gray-600">Här kan du se och hantera alla inlämnade ärenden.</p>
          </div>
          <Link to="/">
            <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
              <PlusCircle size={18} />
              Registrera nytt ärende
            </Button>
          </Link>
        </motion.div>

        <ServiceRegister />
      </main>
    </div>
  );
}
