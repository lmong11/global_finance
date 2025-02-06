export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parent?: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  entries: TransactionEntry[];
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  approvals?: TransactionApproval[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionEntry {
  accountId: string;
  amount: Amount;
  type: 'debit' | 'credit';
  description?: string;
}

export interface TransactionApproval {
  id: string;
  transactionId: string;
  userId: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  createdAt: string;
  updatedAt: string;
}