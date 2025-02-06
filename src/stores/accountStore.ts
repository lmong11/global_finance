import { create } from 'zustand';
import { Account } from '../types/ledger';
import { supabase } from '../lib/supabase';

interface AccountState {
  accounts: Account[];
  selectedAccount: Account | null;
  isLoading: boolean;
  error: string | null;
}

interface AccountActions {
  fetchAccounts: (companyId: string) => Promise<void>;
  getAccount: (id: string) => Promise<void>;
  createAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAccount: (id: string, account: Partial<Account>) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useAccountStore = create<AccountState & AccountActions>((set) => ({
  accounts: [],
  selectedAccount: null,
  isLoading: false,
  error: null,

  fetchAccounts: async (companyId) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('company_id', companyId)
        .order('code');

      if (error) throw error;

      // Transform the data to match our frontend model
      const accounts = data.map(account => ({
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        parent: account.parent_id,
        companyId: account.company_id
      }));

      set({ accounts });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ isLoading: false });
    }
  },

  getAccount: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Transform the data to match our frontend model
      const account = {
        id: data.id,
        code: data.code,
        name: data.name,
        type: data.type,
        parent: data.parent_id,
        companyId: data.company_id
      };

      set({ selectedAccount: account });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ isLoading: false });
    }
  },

  createAccount: async (account) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert([{
          code: account.code,
          name: account.name,
          type: account.type,
          parent_id: account.parent || null,
          company_id: account.companyId
        }])
        .select()
        .single();

      if (error) throw error;

      // Transform the data to match our frontend model
      const newAccount = {
        id: data.id,
        code: data.code,
        name: data.name,
        type: data.type,
        parent: data.parent_id,
        companyId: data.company_id
      };

      set((state) => ({
        accounts: [...state.accounts, newAccount]
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateAccount: async (id, account) => {
    set({ isLoading: true, error: null });
    try {
      const updateData: any = {
        code: account.code,
        name: account.name,
        type: account.type,
        parent_id: account.parent || null,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('accounts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Transform the data to match our frontend model
      const updatedAccount = {
        id: data.id,
        code: data.code,
        name: data.name,
        type: data.type,
        parent: data.parent_id,
        companyId: data.company_id
      };

      set((state) => ({
        accounts: state.accounts.map((a) => 
          a.id === id ? updatedAccount : a
        ),
        selectedAccount: updatedAccount
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ isLoading: false });
    }
  },

  setError: (error) => set({ error })
}));