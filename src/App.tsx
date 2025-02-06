import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DollarSign, FileText, BookOpen, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CompanyProvider } from './contexts/CompanyContext';
import { supabase } from './lib/supabase';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import TransactionForm from './pages/TransactionForm';
import Accounts from './pages/Accounts';
import AccountForm from './pages/AccountForm';
import AccountDetails from './pages/AccountDetails';
import SettingsPage from './pages/Settings';
import Auth from './pages/Auth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  const menuItems = [
    { icon: <DollarSign size={20} />, label: 'dashboard.title', path: '/' },
    { icon: <FileText size={20} />, label: 'transactions.title', path: '/transactions' },
    { icon: <BookOpen size={20} />, label: 'accounts.title', path: '/accounts' },
    { icon: <Settings size={20} />, label: 'settings.title', path: '/settings' }
  ];

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <CompanyProvider>
        <div className="flex h-screen bg-gray-50">
          <Sidebar menuItems={menuItems} />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/transactions/new" element={<TransactionForm />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/accounts/new" element={<AccountForm />} />
              <Route path="/accounts/:id" element={<AccountDetails />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </CompanyProvider>
    </Router>
  );
}

export default App;