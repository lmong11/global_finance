import { ExchangeRate, ExchangeRateProvider } from '../types/currency';

export async function fetchExchangeRates(
  provider: ExchangeRateProvider,
  baseCurrency: string,
  targetCurrencies: string[]
): Promise<ExchangeRate[]> {
  try {
    const response = await fetch(
      `${provider.baseUrl}?base=${baseCurrency}&symbols=${targetCurrencies.join(',')}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const timestamp = Date.now();
    
    return Object.entries(data.rates).map(([currency, rate]) => ({
      from: baseCurrency,
      to: currency,
      rate: Number(rate),
      timestamp,
      source: provider.name,
    }));
  } catch (error) {
    console.error(`Error fetching exchange rates from ${provider.name}:`, error);
    throw error;
  }
}

export async function fetchHistoricalRates(
  provider: ExchangeRateProvider,
  date: Date,
  baseCurrency: string,
  targetCurrencies: string[]
): Promise<ExchangeRate[]> {
  const dateStr = date.toISOString().split('T')[0];
  
  try {
    const response = await fetch(
      `${provider.baseUrl}/historical/${dateStr}?base=${baseCurrency}&symbols=${targetCurrencies.join(',')}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const timestamp = new Date(dateStr).getTime();
    
    return Object.entries(data.rates).map(([currency, rate]) => ({
      from: baseCurrency,
      to: currency,
      rate: Number(rate),
      timestamp,
      source: provider.name,
    }));
  } catch (error) {
    console.error(`Error fetching historical rates from ${provider.name}:`, error);
    throw error;
  }
}