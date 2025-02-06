import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, AlertCircle, Calendar } from 'lucide-react';
import { useTransactionStore } from '../stores/transactionStore';
import { useCompanyContext } from '../contexts/CompanyContext';
import { useTranslation } from 'react-i18next';
import MultiCurrencyReport from '../components/MultiCurrencyReport';
import FinancialCharts from '../components/FinancialCharts';
import CurrencyRateManager from '../components/CurrencyRateManager';
import { useAuth } from '../hooks/useAuth';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { selectedCompany } = useCompanyContext();
  const { transactions, fetchTransactions } = useTransactionStore();
  const { userRoles } = useAuth();
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (selectedCompany) {
      fetchTransactions(selectedCompany.id);
    }
  }, [selectedCompany, fetchTransactions]);

  const isBoss = userRoles.includes('Boss');

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">{t('dashboard.title')}</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-gray-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-gray-500">{t('common.to')}</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          {/* Financial Charts */}
          <FinancialCharts
            transactions={transactions}
            startDate={dateRange.start}
            endDate={dateRange.end}
          />

          {/* Multi-Currency Report */}
          <MultiCurrencyReport
            transactions={transactions}
            startDate={dateRange.start}
            endDate={dateRange.end}
          />
        </div>

        <div className="space-y-6">
          {/* Exchange Rate Manager (Only for Boss) */}
          {isBoss && <CurrencyRateManager />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;