import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Transaction } from '../types/ledger';
import { useCurrencyStore } from '../stores/currencyStore';
import { useAccountStore } from '../stores/accountStore';

interface FinancialChartsProps {
  transactions: Transaction[];
  startDate: string;
  endDate: string;
}

const COLORS = ['#10B981', '#EF4444', '#3B82F6', '#F59E0B', '#6366F1'];

const FinancialCharts: React.FC<FinancialChartsProps> = ({
  transactions,
  startDate,
  endDate
}) => {
  const { t } = useTranslation();
  const { baseCurrency, convertAmount } = useCurrencyStore();
  const { accounts } = useAccountStore();

  // Prepare data for charts
  const dailyData = React.useMemo(() => {
    const dateRange = eachDayOfInterval({
      start: parseISO(startDate),
      end: parseISO(endDate)
    });

    return dateRange.map(date => {
      const dayTransactions = transactions.filter(t => 
        t.date === format(date, 'yyyy-MM-dd')
      );

      // Calculate income (only credit entries from revenue accounts)
      const income = dayTransactions.reduce((sum, t) => 
        sum + t.entries
          .filter(e => e.type === 'credit' && accounts.find(a => a.id === e.accountId)?.type === 'revenue')
          .reduce((entrySum, e) => 
            entrySum + parseFloat(convertAmount(e.amount.value, e.amount.currency, baseCurrency.code))
          , 0)
      , 0);

      // Calculate expenses (only debit entries from expense accounts)
      const expense = dayTransactions.reduce((sum, t) => 
        sum + t.entries
          .filter(e => e.type === 'debit' && accounts.find(a => a.id === e.accountId)?.type === 'expense')
          .reduce((entrySum, e) => 
            entrySum + parseFloat(convertAmount(e.amount.value, e.amount.currency, baseCurrency.code))
          , 0)
      , 0);

      return {
        date: format(date, 'MMM dd'),
        income,
        expense,
        profit: income - expense
      };
    });
  }, [transactions, startDate, endDate, baseCurrency.code, convertAmount, accounts]);

  // Calculate currency distribution
  const currencyDistribution = React.useMemo(() => {
    const distribution = new Map<string, number>();

    transactions.forEach(transaction => {
      transaction.entries.forEach(entry => {
        const amount = parseFloat(convertAmount(
          entry.amount.value,
          entry.amount.currency,
          baseCurrency.code
        ));

        const current = distribution.get(entry.amount.currency) || 0;
        distribution.set(entry.amount.currency, current + Math.abs(amount));
      });
    });

    return Array.from(distribution.entries()).map(([currency, amount]) => ({
      currency,
      amount
    }));
  }, [transactions, baseCurrency.code, convertAmount]);

  // Calculate monthly trends
  const monthlyTrends = React.useMemo(() => {
    const start = startOfMonth(parseISO(startDate));
    const end = endOfMonth(parseISO(endDate));
    const months = eachDayOfInterval({ start, end })
      .filter(date => date.getDate() === 1)
      .map(date => format(date, 'yyyy-MM'));

    return months.map(month => {
      const monthTransactions = transactions.filter(t => 
        t.date.startsWith(month)
      );

      // Calculate income (only credit entries from revenue accounts)
      const income = monthTransactions.reduce((sum, t) => 
        sum + t.entries
          .filter(e => e.type === 'credit' && accounts.find(a => a.id === e.accountId)?.type === 'revenue')
          .reduce((entrySum, e) => 
            entrySum + parseFloat(convertAmount(e.amount.value, e.amount.currency, baseCurrency.code))
          , 0)
      , 0);

      // Calculate expenses (only debit entries from expense accounts)
      const expense = monthTransactions.reduce((sum, t) => 
        sum + t.entries
          .filter(e => e.type === 'debit' && accounts.find(a => a.id === e.accountId)?.type === 'expense')
          .reduce((entrySum, e) => 
            entrySum + parseFloat(convertAmount(e.amount.value, e.amount.currency, baseCurrency.code))
          , 0)
      , 0);

      return {
        month: format(parseISO(`${month}-01`), 'MMM yyyy'),
        income,
        expense,
        profit: income - expense
      };
    });
  }, [transactions, startDate, endDate, baseCurrency.code, convertAmount, accounts]);

  return (
    <div className="space-y-8">
      {/* Daily Cash Flow */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-medium mb-4">{t('dashboard.charts.dailyCashFlow')}</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="income"
                stackId="1"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.3}
                name={t('reports.totals.income')}
              />
              <Area
                type="monotone"
                dataKey="expense"
                stackId="2"
                stroke="#EF4444"
                fill="#EF4444"
                fillOpacity={0.3}
                name={t('reports.totals.expenses')}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-medium mb-4">{t('dashboard.charts.monthlyTrends')}</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#10B981"
                name={t('reports.totals.income')}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="expense"
                stroke="#EF4444"
                name={t('reports.totals.expenses')}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#3B82F6"
                name={t('reports.totals.profit')}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Currency Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4">{t('dashboard.charts.currencyDistribution')}</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currencyDistribution}
                  dataKey="amount"
                  nameKey="currency"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ currency, percent }) => 
                    `${currency} (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {currencyDistribution.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income vs Expense Comparison */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4">{t('dashboard.charts.incomeExpense')}</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" name={t('reports.totals.income')} fill="#10B981" />
                <Bar dataKey="expense" name={t('reports.totals.expenses')} fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialCharts;