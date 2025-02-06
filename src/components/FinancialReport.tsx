import React, { useState } from 'react';
import { BarChart, FileText, Download } from 'lucide-react';
import { CurrencyAmount } from './CurrencyAmount';
import CurrencySelector from './CurrencySelector';
import { useCurrencyStore } from '../stores/currencyStore';
import { Transaction } from '../types/ledger';

interface FinancialReportProps {
  transactions: Transaction[];
  startDate: string;
  endDate: string;
}

const FinancialReport: React.FC<FinancialReportProps> = ({
  transactions,
  startDate,
  endDate
}) => {
  const { baseCurrency } = useCurrencyStore();
  const [displayCurrency, setDisplayCurrency] = useState(baseCurrency.code);

  const calculateTotals = () => {
    const totals = {
      income: 0,
      expense: 0,
      profit: 0
    };

    transactions.forEach(transaction => {
      transaction.entries.forEach(entry => {
        const amount = parseFloat(entry.amount.value);
        if (entry.type === 'credit') {
          totals.income += amount;
        } else {
          totals.expense += amount;
        }
      });
    });

    totals.profit = totals.income - totals.expense;
    return totals;
  };

  const totals = calculateTotals();

  const downloadReport = () => {
    const reportData = {
      period: `${startDate} to ${endDate}`,
      currency: displayCurrency,
      totals,
      transactions: transactions.map(t => ({
        date: t.date,
        description: t.description,
        entries: t.entries.map(e => ({
          type: e.type,
          amount: e.amount,
          accountId: e.accountId
        }))
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${startDate}-${endDate}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Financial Report</h2>
          <p className="text-sm text-gray-500">
            {startDate} to {endDate}
          </p>
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
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-green-700">Total Income</h3>
            <FileText size={20} className="text-green-500" />
          </div>
          <CurrencyAmount
            amount={{ value: totals.income.toString(), currency: displayCurrency }}
            className="text-2xl font-semibold text-green-700"
          />
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-red-700">Total Expenses</h3>
            <FileText size={20} className="text-red-500" />
          </div>
          <CurrencyAmount
            amount={{ value: totals.expense.toString(), currency: displayCurrency }}
            className="text-2xl font-semibold text-red-700"
          />
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-700">Net Profit</h3>
            <BarChart size={20} className="text-blue-500" />
          </div>
          <CurrencyAmount
            amount={{ value: totals.profit.toString(), currency: displayCurrency }}
            className="text-2xl font-semibold text-blue-700"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Income</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expense</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => {
              const income = transaction.entries
                .filter(e => e.type === 'credit')
                .reduce((sum, e) => sum + parseFloat(e.amount.value), 0);
              
              const expense = transaction.entries
                .filter(e => e.type === 'debit')
                .reduce((sum, e) => sum + parseFloat(e.amount.value), 0);

              return (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    {income > 0 && (
                      <CurrencyAmount
                        amount={{ value: income.toString(), currency: displayCurrency }}
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    {expense > 0 && (
                      <CurrencyAmount
                        amount={{ value: expense.toString(), currency: displayCurrency }}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinancialReport;