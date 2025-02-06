import { create } from 'zustand';
import { Transaction } from '../types/ledger';
import { supabase } from '../lib/supabase';

interface TransactionState {
  transactions: Transaction[];
  selectedTransaction: Transaction | null;
  isLoading: boolean;
  error: string | null;
}

interface TransactionActions {
  fetchTransactions: (companyId: string) => Promise<void>;
  getTransaction: (id: string) => Promise<void>;
  createTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useTransactionStore = create<TransactionState & TransactionActions>((set) => ({
  transactions: [],
  selectedTransaction: null,
  isLoading: false,
  error: null,

  fetchTransactions: async (companyId) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          transaction_entries (*)
        `)
        .eq('company_id', companyId)
        .order('date', { ascending: false });

      if (error) throw error;

      const transactions = data.map(transaction => ({
        id: transaction.id,
        companyId: transaction.company_id,
        date: transaction.date,
        description: transaction.description,
        status: transaction.status,
        entries: transaction.transaction_entries.map((entry: any) => ({
          accountId: entry.account_id,
          amount: {
            value: entry.amount,
            currency: entry.currency
          },
          type: entry.type,
          description: entry.description
        })),
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at,
        createdBy: 'Default User'
      }));

      set({ transactions });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ isLoading: false });
    }
  },

  getTransaction: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          transaction_entries (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      const transaction = {
        id: data.id,
        companyId: data.company_id,
        date: data.date,
        description: data.description,
        status: data.status,
        entries: data.transaction_entries.map((entry: any) => ({
          accountId: entry.account_id,
          amount: {
            value: entry.amount,
            currency: entry.currency
          },
          type: entry.type,
          description: entry.description
        })),
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        createdBy: 'Default User'
      };

      set({ selectedTransaction: transaction });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ isLoading: false });
    }
  },

  createTransaction: async (transaction) => {
    set({ isLoading: true, error: null });
    try {
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          company_id: transaction.companyId,
          date: transaction.date,
          description: transaction.description,
          status: transaction.status,
          created_by: 'Default User'
        }])
        .select()
        .single();

      if (transactionError) throw transactionError;

      const entries = transaction.entries.map(entry => ({
        transaction_id: transactionData.id,
        account_id: entry.accountId,
        amount: entry.amount.value,
        currency: entry.amount.currency,
        type: entry.type,
        description: entry.description
      }));

      const { error: entriesError } = await supabase
        .from('transaction_entries')
        .insert(entries);

      if (entriesError) throw entriesError;

      const newTransaction = {
        id: transactionData.id,
        companyId: transactionData.company_id,
        date: transactionData.date,
        description: transactionData.description,
        status: transactionData.status,
        entries: transaction.entries,
        createdAt: transactionData.created_at,
        updatedAt: transactionData.updated_at,
        createdBy: 'Default User'
      };

      set((state) => ({
        transactions: [newTransaction, ...state.transactions]
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateTransaction: async (id, transaction) => {
    set({ isLoading: true, error: null });
    try {
      const updateData = {
        ...transaction,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedTransaction = {
        id: data.id,
        companyId: data.company_id,
        date: data.date,
        description: data.description,
        status: data.status,
        entries: data.entries || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        createdBy: 'Default User'
      };

      set((state) => ({
        transactions: state.transactions.map((t) => 
          t.id === id ? { ...t, ...updatedTransaction } : t
        ),
        selectedTransaction: updatedTransaction
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ isLoading: false });
    }
  },

  setError: (error) => set({ error })
}));