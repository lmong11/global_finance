export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
  source: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  active: boolean;
}

export interface Amount {
  value: string;
  currency: string;
}

export interface ExchangeRateProvider {
  name: string;
  priority: number;
  baseUrl: string;
  apiKey?: string;
}

export type ExchangeRateUpdateFrequency = 'realtime' | 'daily' | 'weekly' | 'monthly';