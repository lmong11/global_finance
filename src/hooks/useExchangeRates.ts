import { useEffect, useCallback } from 'react';
import { useCurrencyStore } from '../stores/currencyStore';
import { fetchExchangeRates } from '../services/exchangeRates';

export function useExchangeRates() {
  const {
    baseCurrency,
    availableCurrencies,
    providers,
    updateFrequency,
    lastUpdate,
    updateExchangeRates,
  } = useCurrencyStore();

  const shouldUpdate = useCallback(() => {
    if (!lastUpdate) return true;

    const now = Date.now();
    const timeSinceUpdate = now - lastUpdate;

    switch (updateFrequency) {
      case 'realtime':
        return timeSinceUpdate > 5 * 60 * 1000; // 5 minutes
      case 'daily':
        return timeSinceUpdate > 24 * 60 * 60 * 1000; // 24 hours
      case 'weekly':
        return timeSinceUpdate > 7 * 24 * 60 * 60 * 1000; // 7 days
      case 'monthly':
        return timeSinceUpdate > 30 * 24 * 60 * 60 * 1000; // 30 days
      default:
        return false;
    }
  }, [lastUpdate, updateFrequency]);

  useEffect(() => {
    const updateRates = async () => {
      if (!shouldUpdate() || providers.length === 0) return;

      const targetCurrencies = availableCurrencies
        .filter((c) => c.active && c.code !== baseCurrency.code)
        .map((c) => c.code);

      if (targetCurrencies.length === 0) return;

      // Try providers in order of priority
      const sortedProviders = [...providers].sort((a, b) => a.priority - b.priority);

      for (const provider of sortedProviders) {
        try {
          const rates = await fetchExchangeRates(
            provider,
            baseCurrency.code,
            targetCurrencies
          );
          updateExchangeRates(rates);
          break;
        } catch (error) {
          console.error(`Failed to fetch rates from ${provider.name}, trying next provider...`);
          continue;
        }
      }
    };

    updateRates();
  }, [
    baseCurrency,
    availableCurrencies,
    providers,
    updateFrequency,
    shouldUpdate,
    updateExchangeRates,
  ]);
}