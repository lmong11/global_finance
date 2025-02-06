import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, X, AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TransactionEntry } from '../types/ledger';
import CurrencySelector from '../components/CurrencySelector';
import { useCurrencyStore } from '../stores/currencyStore';
import { useTransactionStore } from '../stores/transactionStore';
import { useAccountStore } from '../stores/accountStore';
import { useCompanyContext } from '../contexts/CompanyContext';
import { CurrencyAmount } from '../components/CurrencyAmount';
import Decimal from 'decimal.js';

interface EntryForm extends Omit<TransactionEntry, 'amount'> {
  amount: string;
  currency: string;
}

const TransactionForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedCompany } = useCompanyContext();
  const { baseCurrency, convertAmount } = useCurrencyStore();
  const { createTransaction, error: transactionError, isLoading } = useTransactionStore();
  const { accounts, fetchAccounts, error: accountError } = useAccountStore();
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [displayCurrency, setDisplayCurrency] = useState(baseCurrency.code);
  const [entries, setEntries] = useState<EntryForm[]>([
    {
      accountId: '',
      amount: '',
      currency: baseCurrency.code,
      type: 'debit',
      description: ''
    },
    {
      accountId: '',
      amount: '',
      currency: baseCurrency.code,
      type: 'credit',
      description: ''
    }
  ]);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCompany) {
      fetchAccounts(selectedCompany.id);
    }
  }, [selectedCompany, fetchAccounts]);

  const validateDoubleEntry = () => {
    const convertedEntries = entries.map(entry => ({
      ...entry,
      convertedAmount: new Decimal(convertAmount(entry.amount || '0', entry.currency, displayCurrency))
    }));

    const debits = convertedEntries
      .filter(entry => entry.type === 'debit')
      .reduce((sum, entry) => sum.plus(entry.convertedAmount), new Decimal(0));
    
    const credits = convertedEntries
      .filter(entry => entry.type === 'credit')
      .reduce((sum, entry) => sum.plus(entry.convertedAmount), new Decimal(0));

    return {
      isBalanced: debits.equals(credits),
      difference: debits.minus(credits).abs().toString(),
      total: debits.toString()
    };
  };

  const validateEntries = () => {
    const hasEmptyFields = entries.some(entry => 
      !entry.accountId || !entry.amount || parseFloat(entry.amount) <= 0
    );
    
    if (hasEmptyFields) {
      setValidationError(t('transactions.validation.emptyFields'));
      return false;
    }

    const { isBalanced } = validateDoubleEntry();
    if (!isBalanced) {
      setValidationError(t('transactions.validation.unbalanced'));
      return false;
    }

    setValidationError(null);
    return true;
  };

  const addEntry = () => {
    setEntries([...entries, {
      accountId: '',
      amount: '',
      currency: baseCurrency.code,
      type: 'debit',
      description: ''
    }]);
  };

  const removeEntry = (index: number) => {
    if (entries.length > 2) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  const updateEntry = (index: number, field: keyof EntryForm, value: string) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setEntries(newEntries);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEntries()) {
      return;
    }

    if (!selectedCompany) {
      setValidationError(t('transactions.validation.noCompany'));
      return;
    }

    try {
      await createTransaction({
        companyId: selectedCompany.id,
        date,
        description,
        entries: entries.map(entry => ({
          accountId: entry.accountId,
          amount: {
            value: entry.amount,
            currency: entry.currency
          },
          type: entry.type,
          description: entry.description
        })),
        status: 'draft'
      });

      navigate('/transactions');
    } catch (err) {
      console.error('Failed to create transaction:', err);
      setValidationError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  const { isBalanced, difference, total } = validateDoubleEntry();

  if (!selectedCompany) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-yellow-600" size={24} />
          <div>
            <h3 className="font-medium text-yellow-800">{t('transactions.noCompany.title')}</h3>
            <p className="text-yellow-700">
              {t('transactions.noCompany.message')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const error = validationError || transactionError || accountError;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">{t('transactions.new')}</h1>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/transactions')}
            className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50"
          >
            <X size={20} />
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !isBalanced}
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

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="grid grid-cols-2 gap-6 flex-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('transactions.form.date')}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('transactions.form.description')}
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('transactions.form.descriptionPlaceholder')}
                required
              />
            </div>
          </div>
          <div className="ml-6">
            <CurrencySelector
              label={t('transactions.form.displayCurrency')}
              value={displayCurrency}
              onChange={setDisplayCurrency}
              className="w-64"
            />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">{t('transactions.form.entries')}</h2>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-gray-500">{t('transactions.form.total')}: </span>
                <CurrencyAmount
                  amount={{ value: total, currency: displayCurrency }}
                  className="font-medium"
                />
              </div>
              {!isBalanced && (
                <div className="text-sm text-red-600">
                  <span>{t('transactions.form.difference')}: </span>
                  <CurrencyAmount
                    amount={{ value: difference, currency: displayCurrency }}
                    className="font-medium"
                  />
                </div>
              )}
              <button
                type="button"
                onClick={addEntry}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg flex items-center gap-1.5 hover:bg-gray-50"
              >
                <Plus size={16} />
                {t('transactions.form.addEntry')}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {entries.map((entry, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-start">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('transactions.form.type')}
                  </label>
                  <select
                    value={entry.type}
                    onChange={(e) => updateEntry(index, 'type', e.target.value as 'debit' | 'credit')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="debit">{t('transactions.form.debit')}</option>
                    <option value="credit">{t('transactions.form.credit')}</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('transactions.form.account')}
                  </label>
                  <select
                    value={entry.accountId}
                    onChange={(e) => updateEntry(index, 'accountId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">{t('transactions.form.selectAccount')}</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('transactions.form.amount')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={entry.amount}
                      onChange={(e) => updateEntry(index, 'amount', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    {entry.currency !== displayCurrency && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <RefreshCw size={16} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  {entry.amount && entry.currency !== displayCurrency && (
                    <div className="mt-1 text-sm text-gray-500">
                      <CurrencyAmount
                        amount={{
                          value: convertAmount(entry.amount, entry.currency, displayCurrency),
                          currency: displayCurrency
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="col-span-2">
                  <CurrencySelector
                    label={t('transactions.form.currency')}
                    value={entry.currency}
                    onChange={(currency) => updateEntry(index, 'currency', currency)}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('transactions.form.entryDescription')}
                  </label>
                  <input
                    type="text"
                    value={entry.description || ''}
                    onChange={(e) => updateEntry(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('transactions.form.optional')}
                  />
                </div>
                <div className="col-span-1 pt-7">
                  {entries.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeEntry(index)}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;