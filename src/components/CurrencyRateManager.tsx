import React, { useState } from 'react';
import { RefreshCw, Plus, Save, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrencyStore } from '../stores/currencyStore';
import CurrencySelector from './CurrencySelector';

const CurrencyRateManager: React.FC = () => {
  const { t } = useTranslation();
  const { 
    availableCurrencies, 
    baseCurrency,
    exchangeRates,
    updateExchangeRates
  } = useCurrencyStore();

  const [newRate, setNewRate] = useState({
    from: '',
    to: '',
    rate: ''
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRate.from || !newRate.to || !newRate.rate) {
      setError(t('settings.currencies.errors.fillAllFields'));
      return;
    }

    const rate = parseFloat(newRate.rate);
    if (isNaN(rate) || rate <= 0) {
      setError(t('settings.currencies.errors.invalidRate'));
      return;
    }

    const timestamp = Date.now();
    updateExchangeRates([
      ...exchangeRates,
      {
        from: newRate.from,
        to: newRate.to,
        rate,
        timestamp,
        source: 'manual'
      }
    ]);

    setNewRate({
      from: '',
      to: '',
      rate: ''
    });
    setError(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium">{t('settings.currencies.exchangeRates')}</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <RefreshCw size={16} />
          <span>{t('settings.currencies.lastUpdated')}: {new Date().toLocaleString()}</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('settings.currencies.fromCurrency')}
            </label>
            <CurrencySelector
              value={newRate.from}
              onChange={(currency) => setNewRate(prev => ({ ...prev, from: currency }))}
              showInactive={true}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('settings.currencies.toCurrency')}
            </label>
            <CurrencySelector
              value={newRate.to}
              onChange={(currency) => setNewRate(prev => ({ ...prev, to: currency }))}
              showInactive={true}
              excludeCurrency={newRate.from}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('settings.currencies.rate')}
            </label>
            <input
              type="number"
              step="0.000001"
              min="0"
              value={newRate.rate}
              onChange={(e) => setNewRate(prev => ({ ...prev, rate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('settings.currencies.ratePlaceholder')}
              required
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700"
            >
              <Plus size={20} />
              {t('settings.currencies.addRate')}
            </button>
          </div>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('settings.currencies.columns.from')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('settings.currencies.columns.to')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('settings.currencies.columns.rate')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('settings.currencies.columns.lastUpdated')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('settings.currencies.columns.source')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {exchangeRates.map((rate, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {rate.from}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {rate.to}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {rate.rate.toFixed(6)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(rate.timestamp).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {t(`settings.currencies.sources.${rate.source}`)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CurrencyRateManager;