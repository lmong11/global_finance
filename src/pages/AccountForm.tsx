import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAccountStore } from '../stores/accountStore';
import { useCompanyContext } from '../contexts/CompanyContext';
import { Account } from '../types/ledger';

const AccountForm: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { selectedCompany } = useCompanyContext();
  const { createAccount, accounts, isLoading, error } = useAccountStore();
  const [formData, setFormData] = useState<Partial<Account>>({
    code: '',
    name: '',
    type: 'asset',
    parent: undefined
  });

  if (!selectedCompany) {
    return (
      <div className="p-8 text-center text-gray-500">
        {t('transactions.noCompany.message')}
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;

    try {
      await createAccount({
        ...formData,
        companyId: selectedCompany.id,
      } as Omit<Account, 'id' | 'createdAt' | 'updatedAt'>);
      navigate('/accounts');
    } catch (err) {
      console.error('Failed to create account:', err);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">{t('accounts.new')}</h1>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/accounts')}
            className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50"
          >
            <X size={20} />
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={20} />
            {isLoading ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('accounts.code')}
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 1000"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              {t('quickEntry.validation.invalidAccount', { code: '' }).split(':')[0]}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('accounts.name')}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Cash"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('accounts.type')}
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="asset">{t('accounts.types.asset')}</option>
              <option value="liability">{t('accounts.types.liability')}</option>
              <option value="equity">{t('accounts.types.equity')}</option>
              <option value="revenue">{t('accounts.types.revenue')}</option>
              <option value="expense">{t('accounts.types.expense')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('accounts.parent')}
            </label>
            <select
              value={formData.parent || ''}
              onChange={(e) => handleChange('parent', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{t('transactions.form.selectAccount')}</option>
              {accounts
                .filter(account => account.type === formData.type)
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              {t('transactions.form.optional')}
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AccountForm;