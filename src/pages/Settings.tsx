import React, { useState } from 'react';
import { Save, AlertCircle, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrencyStore } from '../stores/currencyStore';
import CurrencySelector from '../components/CurrencySelector';
import LanguageSelector from '../components/LanguageSelector';
import { Currency, ExchangeRateUpdateFrequency } from '../types/currency';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    baseCurrency,
    availableCurrencies,
    updateFrequency,
    setBaseCurrency,
    setUpdateFrequency,
    addCurrency,
    removeCurrency
  } = useCurrencyStore();

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleBaseCurrencyChange = (code: string) => {
    const currency = availableCurrencies.find(c => c.code === code);
    if (currency) {
      setBaseCurrency(currency);
      setSuccess(t('common.success'));
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleSave = () => {
    try {
      setSuccess(t('common.success'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">{t('settings.title')}</h1>
        <div className="flex gap-3">
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 hover:bg-red-700"
          >
            <LogOut size={20} />
            {t('settings.account.logout')}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Save size={20} />
            {t('common.save')}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      <div className="space-y-6">
        {/* Language Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-medium mb-4">{t('settings.language')}</h2>
          <LanguageSelector />
        </div>

        {/* Currency Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-medium mb-4">{t('settings.currencies.title')}</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('settings.currencies.base')}
              </label>
              <CurrencySelector
                value={baseCurrency.code}
                onChange={handleBaseCurrencyChange}
                className="w-full max-w-xs"
                showInactive={true}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('settings.currencies.update')}
              </label>
              <select
                value={updateFrequency}
                onChange={(e) => setUpdateFrequency(e.target.value as ExchangeRateUpdateFrequency)}
                className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="realtime">Real-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Interface Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-medium mb-4">{t('settings.interface.title')}</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('settings.interface.dateFormat')}
              </label>
              <select
                className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                defaultValue="MM/dd/yyyy"
              >
                <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                <option value="yyyy-MM-dd">YYYY-MM-DD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('settings.interface.numberFormat')}
              </label>
              <select
                className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                defaultValue="en-US"
              >
                <option value="en-US">1,234.56</option>
                <option value="zh-CN">1,234.56</option>
              </select>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-medium mb-4">{t('settings.account.title')}</h2>
          
          <div className="space-y-4">
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-red-600 font-medium mb-2">{t('settings.account.dangerZone')}</h3>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 hover:bg-red-700"
              >
                <LogOut size={20} />
                {t('settings.account.logout')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;