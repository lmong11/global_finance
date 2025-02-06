import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Currency, ExchangeRate, ExchangeRateProvider, ExchangeRateUpdateFrequency } from '../types/currency';
import Decimal from 'decimal.js';

interface CurrencyState {
  baseCurrency: Currency;
  availableCurrencies: Currency[];
  exchangeRates: ExchangeRate[];
  providers: ExchangeRateProvider[];
  updateFrequency: ExchangeRateUpdateFrequency;
  lastUpdate: number | null;
}

interface CurrencyActions {
  setBaseCurrency: (currency: Currency) => void;
  updateExchangeRates: (rates: ExchangeRate[]) => void;
  addCurrency: (currency: Currency) => void;
  removeCurrency: (code: string) => void;
  convertAmount: (amount: string, from: string, to: string) => string;
  getHistoricalRate: (from: string, to: string, date: Date) => ExchangeRate | null;
  addProvider: (provider: ExchangeRateProvider) => void;
  removeProvider: (name: string) => void;
  setUpdateFrequency: (frequency: ExchangeRateUpdateFrequency) => void;
}

const defaultCurrencies: Currency[] = [
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    decimals: 2,
    active: true,
  },
  {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    decimals: 2,
    active: true,
  },
  {
    code: 'HKD',
    name: 'Hong Kong Dollar',
    symbol: 'HK$',
    decimals: 2,
    active: true,
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    decimals: 2,
    active: true,
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    decimals: 2,
    active: true,
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    decimals: 0,
    active: true,
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    decimals: 2,
    active: true,
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    decimals: 2,
    active: true,
  },
  {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'Fr',
    decimals: 2,
    active: true,
  },
  {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    decimals: 2,
    active: true,
  },
  {
    code: 'NZD',
    name: 'New Zealand Dollar',
    symbol: 'NZ$',
    decimals: 2,
    active: true,
  },
  {
    code: 'KRW',
    name: 'South Korean Won',
    symbol: '₩',
    decimals: 0,
    active: true,
  }
];

console.log('Default currencies:', {
  count: defaultCurrencies.length,
  currencies: defaultCurrencies.map(c => ({ code: c.code, active: c.active }))
});

function generateAllExchangeRates(): ExchangeRate[] {
  const rates: ExchangeRate[] = [];
  const timestamp = Date.now();

  // Base rates against USD
  const usdRates: Record<string, number> = {
    CNY: 7.2,
    HKD: 7.8,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 148.5,
    AUD: 1.52,
    CAD: 1.35,
    CHF: 0.88,
    SGD: 1.34,
    NZD: 1.64,
    KRW: 1320.0
  };

  // Generate USD to other currencies
  Object.entries(usdRates).forEach(([currency, rate]) => {
    rates.push({
      from: 'USD',
      to: currency,
      rate,
      timestamp,
      source: 'default'
    });
    
    // Also add the inverse rate
    rates.push({
      from: currency,
      to: 'USD',
      rate: 1 / rate,
      timestamp,
      source: 'default'
    });
  });

  // Generate cross rates between all currencies
  defaultCurrencies.forEach(fromCurrency => {
    defaultCurrencies.forEach(toCurrency => {
      if (fromCurrency.code !== toCurrency.code && 
          fromCurrency.code !== 'USD' && 
          toCurrency.code !== 'USD') {
        // Calculate cross rate through USD
        const throughUSD = usdRates[fromCurrency.code] && usdRates[toCurrency.code]
          ? usdRates[toCurrency.code] / usdRates[fromCurrency.code]
          : null;

        if (throughUSD !== null) {
          rates.push({
            from: fromCurrency.code,
            to: toCurrency.code,
            rate: throughUSD,
            timestamp,
            source: 'default'
          });
        }
      }
    });
  });

  return rates;
}

export const useCurrencyStore = create<CurrencyState & CurrencyActions>()(
  persist(
    (set, get) => {
      console.log('Initializing currency store...');
      
      return {
        baseCurrency: defaultCurrencies[0], // USD as base currency
        availableCurrencies: defaultCurrencies,
        exchangeRates: generateAllExchangeRates(),
        providers: [],
        updateFrequency: 'daily',
        lastUpdate: null,

        setBaseCurrency: (currency) => {
          console.log('Setting base currency:', currency);
          set({ baseCurrency: currency });
        },
        
        updateExchangeRates: (rates) => set({ 
          exchangeRates: rates,
          lastUpdate: Date.now()
        }),

        addCurrency: (currency) => {
          console.log('Adding currency:', currency);
          set((state) => ({
            availableCurrencies: [...state.availableCurrencies, currency],
          }));
        },

        removeCurrency: (code) => {
          console.log('Removing currency:', code);
          set((state) => ({
            availableCurrencies: state.availableCurrencies.map(currency =>
              currency.code === code ? { ...currency, active: false } : currency
            ),
          }));
        },

        convertAmount: (amount, from, to) => {
          if (from === to) return amount;
          
          const state = get();
          const rate = state.exchangeRates.find(r => r.from === from && r.to === to);
          
          if (rate) {
            return new Decimal(amount).times(rate.rate).toString();
          }
          
          const inverseRate = state.exchangeRates.find(r => r.from === to && r.to === from);
          if (inverseRate) {
            return new Decimal(amount).dividedBy(inverseRate.rate).toString();
          }
          
          // Try conversion through USD
          const toUsdRate = state.exchangeRates.find(r => r.from === from && r.to === 'USD');
          const fromUsdRate = state.exchangeRates.find(r => r.from === 'USD' && r.to === to);
          
          if (toUsdRate && fromUsdRate) {
            const usdAmount = new Decimal(amount).times(toUsdRate.rate);
            return usdAmount.times(fromUsdRate.rate).toString();
          }
          
          return amount;
        },

        getHistoricalRate: (from, to, date) => {
          const state = get();
          const targetDate = date.getTime();
          return state.exchangeRates.find(
            (rate) =>
              rate.from === from &&
              rate.to === to &&
              rate.timestamp <= targetDate
          );
        },

        addProvider: (provider) => set((state) => ({
          providers: [...state.providers, provider],
        })),

        removeProvider: (name) => set((state) => ({
          providers: state.providers.filter((p) => p.name !== name),
        })),

        setUpdateFrequency: (frequency) => set({ updateFrequency: frequency }),
      };
    },
    {
      name: 'currency-store',
      partialize: (state) => ({
        baseCurrency: state.baseCurrency,
        availableCurrencies: state.availableCurrencies,
        providers: state.providers,
        updateFrequency: state.updateFrequency,
      }),
    }
  )
);