import React, { useState } from 'react';
import { BarChart, FileText, Download, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CurrencyAmount } from './CurrencyAmount';
import CurrencySelector from './CurrencySelector';
import { useCurrencyStore } from '../stores/currencyStore';
import { Transaction } from '../types/ledger';
import { format } from 'date-fns';
import { useAccountStore } from '../stores/accountStore';

interface MultiCurrencyReportProps {
  transactions: Transaction[];
  startDate: string;
  endDate: string;
}

const MultiCurrencyReport: React.FC<MultiCurrencyReportProps> = ({
  transactions,
  startDate,
  endDate
}) => {
  const { t } = useTranslation();
  const { baseCurrency, availableCurrencies, convertAmount } = useCurrencyStore();
  const { accounts } = useAccountStore();
  const [displayCurrency, setDisplayCurrency] = useState(baseCurrency.code);

  const calculateCurrencyTotals = () => {
    const totals = new Map<string, { income: number; expense: number }>();

    transactions.forEach(transaction => {
      transaction.entries.forEach(entry => {
        const currency = entry.amount.currency;
        if (!totals.has(currency)) {
          totals.set(currency, { income: 0, expense: 0 });
        }

        const amount = parseFloat(entry.amount.value);
        const currencyTotals = totals.get(currency)!;
        const account = accounts.find(a => a.id === entry.accountId);
        
        if (account) {
          if (account.type === 'revenue' && entry.type === 'credit') {
            currencyTotals.income += amount;
          } else if (account.type === 'expense' && entry.type === 'debit') {
            currencyTotals.expense += amount;
          }
        }
      });
    });

    return totals;
  };

  const currencyTotals = calculateCurrencyTotals();
  
  const consolidatedTotals = {
    income: 0,
    expense: 0,
    profit: 0
  };

  currencyTotals.forEach((totals, currency) => {
    consolidatedTotals.income += parseFloat(convertAmount(
      totals.income.toString(),
      currency,
      displayCurrency
    ));
    consolidatedTotals.expense += parseFloat(convertAmount(
      totals.expense.toString(),
      currency,
      displayCurrency
    ));
  });

  consolidatedTotals.profit = consolidatedTotals.income - consolidatedTotals.expense;

  const downloadReport = () => {
    const reportData = {
      period: {
        start: startDate,
        end: endDate
      },
      displayCurrency,
      consolidatedTotals,
      currencyBreakdown: Object.fromEntries(currencyTotals),
      exchangeRates: Array.from(currencyTotals.keys()).map(currency => ({
        from: currency,
        to: displayCurrency,
        rate: parseFloat(convertAmount('1', currency, displayCurrency))
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `multi-currency-report-${startDate}-${endDate}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">{t('reports.multiCurrency.title')}</h2>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            <Calendar size={16} />
            <span>{format(new Date(startDate), 'MMM d, yyyy')} - {format(new Date(endDate), 'MMM d, yyyy')}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <CurrencySelector
            value={displayCurrency}
            onChange={setDisplayCurrency}
            className="w-48"
          />
          <button
            onClick={downloadReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Download size={20} />
            {t('reports.actions.export')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-green-700">{t('reports.totals.income')}</h3>
            <FileText size={20} className="text-green-500" />
          </div>
          <CurrencyAmount
            amount={{ value: consolidatedTotals.income.toString(), currency: displayCurrency }}
            className="text-2xl font-semibold text-green-700"
          />
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-red-700">{t('reports.totals.expenses')}</h3>
            <FileText size={20} className="text-red-500" />
          </div>
          <CurrencyAmount
            amount={{ value: consolidatedTotals.expense.toString(), currency: displayCurrency }}
            className="text-2xl font-semibold text-red-700"
          />
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-700">{t('reports.totals.profit')}</h3>
            <BarChart size={20} className="text-blue-500" />
          </div>
          <CurrencyAmount
            amount={{ value: consolidatedTotals.profit.toString(), currency: displayCurrency }}
            className="text-2xl font-semibold text-blue-700"
          />
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">{t('reports.multiCurrency.breakdown')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from(currencyTotals.entries()).map(([currency, totals]) => (
            <div key={currency} className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">{currency}</h4>
                <span className="text-sm text-gray-500">
                  1 {currency} = {parseFloat(convertAmount('1', currency, displayCurrency)).toFixed(6)} {displayCurrency}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('reports.totals.income')}:</span>
                  <CurrencyAmount
                    amount={{ value: totals.income.toString(), currency }}
                    showOriginal
                    displayCurrency={displayCurrency}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('reports.totals.expenses')}:</span>
                  <CurrencyAmount
                    amount={{ value: totals.expense.toString(), currency }}
                    showOriginal
                    displayCurrency={displayCurrency}
                  />
                </div>
                <div className="flex justify-between text-sm font-medium pt-2 border-t border-gray-200">
                  <span>{t('reports.totals.net')}:</span>
                  <CurrencyAmount
                    amount={{ value: (totals.income - totals.expense).toString(), currency }}
                    showOriginal
                    displayCurrency={displayCurrency}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('reports.columns.date')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('reports.columns.description')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('reports.columns.originalAmount')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('reports.columns.convertedAmount')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('reports.columns.type')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              transaction.entries.map((entry, entryIndex) => {
                const account = accounts.find(a => a.id === entry.accountId);
                let type = entry.type;
                if (account) {
                  if (account.type === 'revenue') {
                    type = entry.type === 'credit' ? 'income' : 'expense';
                  } else if (account.type === 'expense') {
                    type = entry.type === 'debit' ? 'expense' : 'income';
                  }
                }
                
                return (
                  <tr key={`${transaction.id}-${entryIndex}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(transaction.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <CurrencyAmount amount={entry.amount} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <CurrencyAmount
                        amount={entry.amount}
                        displayCurrency={displayCurrency}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        type === 'income'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {t(`reports.totals.${type}`)}
                      </span>
                    </td>
                  </tr>
                );
              })
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MultiCurrencyReport;