import React, { createContext, useContext, useState, useEffect } from 'react';
import { Company } from '../types/company';
import { supabase } from '../lib/supabase';

interface CompanyContextType {
  defaultCompany: Company | null;
  selectedCompany: Company | null;
  isLoading: boolean;
  error: string | null;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [defaultCompany, setDefaultCompany] = useState<Company | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDefaultCompany = async () => {
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', '123e4567-e89b-12d3-a456-426614174000')
          .single();

        if (error) throw error;

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

        setDefaultCompany(company);
        setSelectedCompany(company); // Also set as selected company
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch default company');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDefaultCompany();
  }, []);

  return (
    <CompanyContext.Provider value={{ defaultCompany, selectedCompany, isLoading, error }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompanyContext() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompanyContext must be used within a CompanyProvider');
  }
  return context;
}