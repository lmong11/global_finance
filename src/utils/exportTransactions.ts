import { Transaction } from '../types/ledger';
import Papa from 'papaparse';

export function exportTransactions(transactions: Transaction[], format: 'csv' | 'json' = 'csv') {
  const data = transactions.flatMap(transaction => 
    transaction.entries.map(entry => ({
      Date: transaction.date,
      Description: transaction.description,
      Status: transaction.status,
      Account: entry.accountId,
      Type: entry.type,
      Amount: entry.amount.value,
      Currency: entry.amount.currency,
      'Entry Description': entry.description || ''
    }))
  );

  if (format === 'json') {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    downloadFile(blob, 'transactions.json');
  } else {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, 'transactions.csv');
  }
}

function downloadFile(blob: Blob, filename: string) {
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}