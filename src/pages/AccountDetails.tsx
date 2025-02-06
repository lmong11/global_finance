import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { useAccountStore } from '../stores/accountStore';
import { useTransactionStore } from '../stores/transactionStore';
import { useCompanyContext } from '../contexts/CompanyContext';
import MultiCurrencyReport from '../components/MultiCurrencyReport';
import FinancialCharts from '../components/FinancialCharts';

const AccountDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedCompany } = useCompanyContext();
  const { getAccount, selectedAccount, isLoading, error } = useAccountStore();
  const { transactions, fetchTransactions } = useTransactionStore();
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (id) {
      getAccount(id);
    }
  }, [id, getAccount]);

  useEffect(() => {
    if (selectedCompany) {
      fetchTransactions(selectedCompany.id);
    }
  }, [selectedCompany, fetchTransactions]);

  // Filter transactions for this account
  const accountTransactions = transactions.filter(transaction =>
    transaction.entries.some(entry => entry.accountId === id)
  );

  if (isLoading) {
    return <div className="p-8 text-center">Loading account details...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!selectedAccount) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
          Account not found
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/accounts')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-semibold">
            {selectedAccount.name}
          </h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            <code className="bg-gray-100 px-2 py-0.5 rounded">
              {selectedAccount.code}
            </code>
            <span>•</span>
            <span className="capitalize">{selectedAccount.type}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Financial Charts */}
          <FinancialCharts
            transactions={accountTransactions}
            startDate={dateRange.start}
            endDate={dateRange.end}
          />
        </div>

        <div className="space-y-6">
          {/* Date Range Selector */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-medium mb-4">Report Period</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <div className="flex items-center gap-2">
                  <Calendar size={20} className="text-gray-400" />
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <div className="flex items-center gap-2">
                  <Calendar size={20} className="text-gray-400" />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Multi-Currency Report */}
          <MultiCurrencyReport
            transactions={accountTransactions}
            startDate={dateRange.start}
            endDate={dateRange.end}
          />
        </div>
      </div>
    </div>
  );
};

export default AccountDetails;