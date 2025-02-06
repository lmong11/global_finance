import React, { useState } from 'react';
import { Upload, X, Save, AlertCircle, FileSpreadsheet, Camera, Receipt } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTransactionStore } from '../stores/transactionStore';
import { useCompanyContext } from '../contexts/CompanyContext';
import { useAccountStore } from '../stores/accountStore';
import CurrencySelector from './CurrencySelector';
import Papa from 'papaparse';
import { Transaction, TransactionEntry } from '../types/ledger';

interface QuickEntryFormProps {
  onClose: () => void;
}

const QuickEntryForm: React.FC<QuickEntryFormProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { selectedCompany } = useCompanyContext();
  const { createTransaction } = useTransactionStore();
  const { accounts } = useAccountStore();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [manualEntry, setManualEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    accountCode: '',
    amount: '',
    type: 'debit' as 'debit' | 'credit',
    currency: 'USD'
  });

  const validateRow = (row: any, headers: string[]) => {
    const requiredFields = ['Date', 'Description', 'Account Code', 'Debit Amount', 'Credit Amount'];
    const missingFields = requiredFields.filter(field => !headers.includes(field));
    
    if (missingFields.length > 0) {
      throw new Error(t('quickEntry.validation.missingColumns', { columns: missingFields.join(', ') }));
    }

    if (!row['Date']?.match(/^\d{4}-\d{2}-\d{2}$/)) {
      throw new Error(t('quickEntry.validation.invalidDate'));
    }

    const accountCode = row['Account Code'];
    const account = accounts.find(a => a.code === accountCode);
    if (!account) {
      throw new Error(t('quickEntry.validation.invalidAccount', { code: accountCode }));
    }

    const debit = parseFloat(row['Debit Amount'] || '0');
    const credit = parseFloat(row['Credit Amount'] || '0');
    
    if (isNaN(debit) || isNaN(credit)) {
      throw new Error(t('quickEntry.validation.invalidAmount'));
    }
    
    if ((debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
      throw new Error(t('quickEntry.validation.invalidEntry'));
    }
  };

  const processFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const headers = Object.keys(results.data[0] || {});
            results.data.forEach((row: any) => validateRow(row, headers));
            resolve(results.data);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => reject(error)
      });
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith('.csv')) {
      setError(t('quickEntry.validation.invalidFileType'));
      return;
    }

    setFile(uploadedFile);
    setError(null);

    try {
      const data = await processFile(uploadedFile);
      setPreview(data.slice(0, 5));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
      setFile(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCompany || !file) return;

    setIsProcessing(true);
    try {
      const data = await processFile(file);
      
      const transactionGroups = data.reduce((groups: any, row: any) => {
        const key = `${row.Date}_${row.Description}`;
        if (!groups[key]) {
          groups[key] = {
            date: row.Date,
            description: row.Description,
            entries: []
          };
        }
        
        const account = accounts.find(a => a.code === row['Account Code']);
        if (!account) throw new Error(t('quickEntry.validation.invalidAccount', { code: row['Account Code'] }));

        const debit = parseFloat(row['Debit Amount'] || '0');
        const credit = parseFloat(row['Credit Amount'] || '0');
        
        if (debit > 0) {
          groups[key].entries.push({
            accountId: account.id,
            amount: { value: debit.toString(), currency: row.Currency || currency },
            type: 'debit',
            description: row['Entry Description'] || ''
          });
        } else {
          groups[key].entries.push({
            accountId: account.id,
            amount: { value: credit.toString(), currency: row.Currency || currency },
            type: 'credit',
            description: row['Entry Description'] || ''
          });
        }
        
        return groups;
      }, {});

      for (const group of Object.values(transactionGroups)) {
        await createTransaction({
          companyId: selectedCompany.id,
          date: group.date,
          description: group.description,
          entries: group.entries,
          status: 'draft'
        } as Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;

    try {
      const account = accounts.find(a => a.code === manualEntry.accountCode);
      if (!account) {
        setError(t('quickEntry.validation.invalidAccount', { code: manualEntry.accountCode }));
        return;
      }

      const entry: TransactionEntry = {
        accountId: account.id,
        amount: {
          value: manualEntry.amount,
          currency: manualEntry.currency
        },
        type: manualEntry.type,
        description: ''
      };

      const transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
        companyId: selectedCompany.id,
        date: manualEntry.date,
        description: manualEntry.description,
        entries: [entry],
        status: 'draft'
      };

      await createTransaction(transaction);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">{t('quickEntry.title')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Manual Entry Form */}
            <div className="space-y-4">
              <h3 className="font-medium">{t('quickEntry.manual.title')}</h3>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('transactions.form.date')}
                  </label>
                  <input
                    type="date"
                    value={manualEntry.date}
                    onChange={e => setManualEntry(prev => ({ ...prev, date: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('transactions.form.description')}
                  </label>
                  <input
                    type="text"
                    value={manualEntry.description}
                    onChange={e => setManualEntry(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('accounts.code')}
                  </label>
                  <select
                    value={manualEntry.accountCode}
                    onChange={e => setManualEntry(prev => ({ ...prev, accountCode: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="">{t('transactions.form.selectAccount')}</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.code}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('transactions.form.amount')}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={manualEntry.amount}
                      onChange={e => setManualEntry(prev => ({ ...prev, amount: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('transactions.form.type')}
                    </label>
                    <select
                      value={manualEntry.type}
                      onChange={e => setManualEntry(prev => ({ ...prev, type: e.target.value as 'debit' | 'credit' }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    >
                      <option value="debit">{t('transactions.form.debit')}</option>
                      <option value="credit">{t('transactions.form.credit')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <CurrencySelector
                    label={t('transactions.form.currency')}
                    value={manualEntry.currency}
                    onChange={currency => setManualEntry(prev => ({ ...prev, currency }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('quickEntry.manual.attachments')}
                  </label>
                  <div className="mt-1 flex items-center gap-4">
                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                      <Camera size={20} />
                      <span>{t('quickEntry.manual.takePhoto')}</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleAttachmentUpload}
                        className="hidden"
                      />
                    </label>
                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                      <Receipt size={20} />
                      <span>{t('quickEntry.manual.uploadReceipt')}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAttachmentUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm"
                        >
                          <span>{file.name}</span>
                          <button
                            type="button"
                            onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                            className="text-gray-500 hover:text-red-500"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700"
                >
                  <Save size={20} />
                  {t('quickEntry.manual.save')}
                </button>
              </form>
            </div>

            {/* Bulk Upload */}
            <div className="space-y-4">
              <h3 className="font-medium">{t('quickEntry.bulk.title')}</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <FileSpreadsheet size={32} className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    {file ? file.name : t('quickEntry.bulk.dropzone')}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    {t('quickEntry.bulk.csvOnly')}
                  </span>
                </label>
              </div>

              {preview.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">{t('quickEntry.bulk.preview')}</h4>
                  <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500">
                          <th className="pb-2">{t('transactions.form.date')}</th>
                          <th className="pb-2">{t('transactions.form.description')}</th>
                          <th className="pb-2">{t('accounts.code')}</th>
                          <th className="pb-2">{t('transactions.form.amount')}</th>
                          <th className="pb-2">{t('transactions.form.type')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((row, i) => (
                          <tr key={i}>
                            <td className="py-1">{row.Date}</td>
                            <td className="py-1">{row.Description}</td>
                            <td className="py-1">{row['Account Code']}</td>
                            <td className="py-1">
                              {row['Debit Amount'] || row['Credit Amount']}
                            </td>
                            <td className="py-1">
                              {row['Debit Amount'] ? t('transactions.form.debit') : t('transactions.form.credit')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">{t('quickEntry.bulk.format')}</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• {t('quickEntry.bulk.formatDate')}</li>
                  <li>• {t('quickEntry.bulk.formatDescription')}</li>
                  <li>• {t('quickEntry.bulk.formatAccountCode')}</li>
                  <li>• {t('quickEntry.bulk.formatDebit')}</li>
                  <li>• {t('quickEntry.bulk.formatCredit')}</li>
                  <li>• {t('quickEntry.bulk.formatCurrency')}</li>
                </ul>
              </div>

              {file && (
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
                >
                  <Upload size={20} />
                  {isProcessing ? t('quickEntry.bulk.processing') : t('quickEntry.bulk.upload')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickEntryForm;