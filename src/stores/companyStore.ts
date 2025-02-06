import { create } from 'zustand';
import { Company } from '../types/company';
import { supabase } from '../lib/supabase';

interface CompanyState {
  companies: Company[];
  selectedCompany: Company | null;
  isLoading: boolean;
  error: string | null;
}

interface CompanyActions {
  fetchCompanies: () => Promise<void>;
  getCompany: (id: string) => Promise<void>;
  createCompany: (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCompany: (id: string, company: Partial<Company>) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useCompanyStore = create<CompanyState & CompanyActions>((set, get) => ({
  companies: [],
  selectedCompany: null,
  isLoading: false,
  error: null,

  fetchCompanies: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (error) throw error;
      
      // Transform the data to match our frontend model
      const companies = data.map(company => ({
        id: company.id,
        name: company.name,
        code: company.code,
        taxId: company.tax_id,
        currency: company.currency,
        fiscalYearEnd: company.fiscal_year_end,
        address: company.address,
        status: company.status,
        createdAt: company.created_at,
        updatedAt: company.updated_at
      }));
      
      set({ companies });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ isLoading: false });
    }
  },

  getCompany: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Transform the data to match our frontend model
      const company = {
        id: data.id,
        name: data.name,
        code: data.code,
        taxId: data.tax_id,
        currency: data.currency,
        fiscalYearEnd: data.fiscal_year_end,
        address: data.address,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
      
      set({ selectedCompany: company });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ isLoading: false });
    }
  },

  createCompany: async (company) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('companies')
        .insert([{
          name: company.name,
          code: company.code,
          tax_id: company.taxId,
          currency: company.currency,
          fiscal_year_end: company.fiscalYearEnd,
          status: company.status,
          address: company.address
        }])
        .select()
        .single();

      if (error) throw error;

      // Transform the data to match our frontend model
      const newCompany = {
        id: data.id,
        name: data.name,
        code: data.code,
        taxId: data.tax_id,
        currency: data.currency,
        fiscalYearEnd: data.fiscal_year_end,
        address: data.address,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      set((state) => ({
        companies: [...state.companies, newCompany]
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
      throw error; // Re-throw to handle in the component
    } finally {
      set({ isLoading: false });
    }
  },

  updateCompany: async (id, company) => {
    set({ isLoading: true, error: null });
    try {
      const updateData: any = {
        name: company.name,
        code: company.code,
        tax_id: company.taxId,
        currency: company.currency,
        fiscal_year_end: company.fiscalYearEnd,
        status: company.status,
        address: company.address
      };

      const { data, error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Transform the data to match our frontend model
      const updatedCompany = {
        id: data.id,
        name: data.name,
        code: data.code,
        taxId: data.tax_id,
        currency: data.currency,
        fiscalYearEnd: data.fiscal_year_end,
        address: data.address,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      set((state) => ({
        companies: state.companies.map((c) => 
          c.id === id ? updatedCompany : c
        ),
        selectedCompany: updatedCompany
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
      throw error; // Re-throw to handle in the component
    } finally {
      set({ isLoading: false });
    }
  },

  setError: (error) => set({ error })
}));