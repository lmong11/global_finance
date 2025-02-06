import React, { useEffect, useState } from 'react';
import { Plus, Filter, Download, Search, ChevronDown, Upload, FileSpreadsheet, FileJson } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTransactionStore } from '../stores/transactionStore';
import { useCompanyContext } from '../contexts/CompanyContext';
import { useCurrencyStore } from '../stores/currencyStore';
import { CurrencyAmount } from '../components/CurrencyAmount';
import CurrencySelector from '../components/CurrencySelector';
import QuickEntryForm from '../components/QuickEntryForm';
import ApprovalWorkflow from '../components/ApprovalWorkflow';
import TransactionFilters from '../components/TransactionFilters';
import { exportTransactions } from '../utils/exportTransactions';

const Transactions: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { selectedCompany } = useCompanyContext();
  const { transactions, fetchTransactions, updateTransaction, isLoading, error } = useTransactionStore();
  const { baseCurrency } = useCurrencyStore();
  const [displayCurrency, setDisplayCurrency] = useState(baseCurrency.code);
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    dateRange: [null, null] as [Date | null, Date | null],
    status: [] as string[],
    minAmount: '',
    maxAmount: '',
    currency: baseCurrency.code
  });

  useEffect(() => {
    if (selectedCompany) {
      fetchTransactions(selectedCompany.id);
    }
  }, [fetchTransactions, selectedCompany]);

  const handleApprove = async (transactionId: string) => {
    await updateTransaction(transactionId, { status: 'approved' });
    setSelectedTransactionId(null);
  };

  const handleReject = async (transactionId: string, comment: string) => {
    await updateTransaction(transactionId, { status: 'rejected', comment });
    setSelectedTransactionId(null);
  };

  const handleExport = (format: 'csv' | 'json') => {
    exportTransactions(filteredTransactions, format);
    setShowExportMenu(false);
  };

  const filteredTransactions = transactions.filter(transaction => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!transaction.description.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Date range filter
    if (filters.dateRange[0] && new Date(transaction.date) < filters.dateRange[0]) {
      return false;
    }
    if (filters.dateRange[1] && new Date(transaction.date) > filters.dateRange[1]) {
      return false;
    }

    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(transaction.status)) {
      return false;
    }

    // Amount range filter in selected currency
    if (filters.minAmount || filters.maxAmount) {
      const total = transaction.entries.reduce((sum, entry) => {
        const amount = parseFloat(entry.amount.value);
        return entry.type === 'debit' ? sum + amount : sum;
      }, 0);

      if (filters.minAmount && total < parseFloat(filters.minAmount)) {
        return false;
      }
      if (filters.maxAmount && total > parseFloat(filters.maxAmount)) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">{t('transactions.title')}</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowQuickEntry(true)}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-50"
          >
            <Upload size={20} />
            {t('quickEntry.title')}
          </button>
          <button
            onClick={() => navigate('/transactions/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={20} />
            {t('transactions.new')}
          </button>
          <TransactionFilters
            filters={filters}
            onFilterChange={setFilters}
          />
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50"
            >
              <Download size={20} />
              {t('reports.actions.export')}
              <ChevronDown size={16} className={`transform transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                >
                  <FileSpreadsheet size={16} />
                  Export as CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                >
                  <FileJson size={16} />
                  Export as JSON
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-4">
        <div className="xl:col-span-3">
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <div className="flex gap-4 items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('common.search')}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="w-48">
                  <CurrencySelector
                    value={displayCurrency}
                    onChange={setDisplayCurrency}
                    label={t('transactions.form.displayCurrency')}
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('reports.columns.date')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('reports.columns.description')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('transactions.form.debit')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('transactions.form.credit')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('approval.status.pendingApproval')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('approval.approvedBy', { user: '', date: '' })}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        {t('common.loading')}
                      </td>
                    </tr>
                  ) : filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        {t('accounts.empty')}
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((transaction) => {
                      const debitEntries = transaction.entries.filter(e => e.type === 'debit');
                      const creditEntries = transaction.entries.filter(e => e.type === 'credit');

                      return (
                        <tr
                          key={transaction.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedTransactionId(transaction.id)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {format(new Date(transaction.date), 'MMM d, yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {debitEntries.map((entry, i) => (
                              <div key={i}>
                                <CurrencyAmount
                                  amount={entry.amount}
                                  displayCurrency={displayCurrency}
                                  showOriginal
                                />
                              </div>
                            ))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {creditEntries.map((entry, i) => (
                              <div key={i}>
                                <CurrencyAmount
                                  amount={entry.amount}
                                  displayCurrency={displayCurrency}
                                  showOriginal
                                />
                              </div>
                            ))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              transaction.status === 'approved' 
                                ? 'bg-green-100 text-green-800'
                                : transaction.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : transaction.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {t(`approval.status.${transaction.status}`)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.createdBy}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {selectedTransactionId && (
          <div className="xl:col-span-1">
            <ApprovalWorkflow
              transaction={transactions.find(t => t.id === selectedTransactionId)!}
              onApprove={() => handleApprove(selectedTransactionId)}
              onReject={(comment) => handleReject(selectedTransactionId, comment)}
            />
          </div>
        )}
      </div>

      {showQuickEntry && (
        <QuickEntryForm onClose={() => setShowQuickEntry(false)} />
      )}
    </div>
  );
};

export default Transactions;