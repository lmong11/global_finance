export interface Company {
  id: string;
  name: string;
  code: string;
  taxId?: string;
  currency: string;
  fiscalYearEnd: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface FiscalPeriod {
  id: string;
  companyId: string;
  startDate: string;
  endDate: string;
  isClosed: boolean;
  closedAt?: string;
}