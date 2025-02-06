import React, { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CurrencySelector from './CurrencySelector';
import { useCurrencyStore } from '../stores/currencyStore';

interface TransactionFilters {
  dateRange: [Date | null, Date | null];
  status: string[];
  minAmount?: string;
  maxAmount?: string;
  currency: string;
}

interface TransactionFiltersProps {
  filters: TransactionFilters;
  onFilterChange: (filters: TransactionFilters) => void;
}

const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  filters,
  onFilterChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { baseCurrency } = useCurrencyStore();
  const { t } = useTranslation();

  const handleStatusToggle = (status: string) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    onFilterChange({ ...filters, status: newStatuses });
  };

  const handleDateChange = (index: 0 | 1, date: string) => {
    const newDateRange = [...filters.dateRange] as [Date | null, Date | null];
    newDateRange[index] = date ? new Date(date) : null;
    onFilterChange({ ...filters, dateRange: newDateRange });
  };

  const clearFilters = () => {
    onFilterChange({
      dateRange: [null, null],
      status: [],
      currency: baseCurrency.code
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50"
      >
        <Filter size={20} />
        {t('transactions.filters.title')}
        {(filters.status.length > 0 || filters.dateRange[0] || filters.dateRange[1] || filters.minAmount || filters.maxAmount) && (
          <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
            {t('transactions.filters.active')}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">{t('transactions.filters.title')}</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {t('transactions.filters.clearAll')}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('transactions.filters.dateRange')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filters.dateRange[0]?.toISOString().split('T')[0] || ''}
                    onChange={(e) => handleDateChange(0, e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder={t('transactions.filters.startDate')}
                  />
                  <input
                    type="date"
                    value={filters.dateRange[1]?.toISOString().split('T')[0] || ''}
                    onChange={(e) => handleDateChange(1, e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder={t('transactions.filters.endDate')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('transactions.filters.status')}
                </label>
                <div className="space-y-2">
                  {['draft', 'pending', 'approved', 'rejected'].map((status) => (
                    <label
                      key={status}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={filters.status.includes(status)}
                        onChange={() => handleStatusToggle(status)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="capitalize">{t(`approval.status.${status}`)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('transactions.filters.amountRange')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder={t('transactions.filters.min')}
                    value={filters.minAmount || ''}
                    onChange={(e) => onFilterChange({
                      ...filters,
                      minAmount: e.target.value
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    placeholder={t('transactions.filters.max')}
                    value={filters.maxAmount || ''}
                    onChange={(e) => onFilterChange({
                      ...filters,
                      maxAmount: e.target.value
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <CurrencySelector
                  label={t('transactions.filters.currency')}
                  value={filters.currency}
                  onChange={(currency) => onFilterChange({
                    ...filters,
                    currency
                  })}
                />
                <p className="mt-1 text-sm text-gray-500">
                  {t('transactions.filters.currencyNote')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionFilters;