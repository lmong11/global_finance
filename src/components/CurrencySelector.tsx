import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useCurrencyStore } from '../stores/currencyStore';

interface CurrencySelectorProps {
  value: string;
  onChange: (currency: string) => void;
  className?: string;
  showInactive?: boolean;
  label?: string;
  required?: boolean;
  excludeCurrency?: string;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  value,
  onChange,
  className = '',
  showInactive = false,
  label,
  required = false,
  excludeCurrency
}) => {
  const { availableCurrencies } = useCurrencyStore();
  
  console.log('CurrencySelector props:', {
    value,
    showInactive,
    excludeCurrency,
    availableCurrenciesCount: availableCurrencies.length
  });

  // Get all currencies, including inactive ones if showInactive is true
  const currencies = showInactive
    ? availableCurrencies
    : availableCurrencies.filter((c) => c.active);

  console.log('Filtered currencies:', {
    showInactive,
    beforeFilter: availableCurrencies.length,
    afterFilter: currencies.length,
    activeCount: availableCurrencies.filter(c => c.active).length,
    currencies: currencies.map(c => c.code)
  });

  // Filter out the excluded currency if specified
  const filteredCurrencies = excludeCurrency
    ? currencies.filter(c => c.code !== excludeCurrency)
    : currencies;

  // Sort currencies by code for consistent display
  const sortedCurrencies = [...filteredCurrencies].sort((a, b) => 
    a.code.localeCompare(b.code)
  );

  console.log('Final sorted currencies:', {
    excludeCurrency,
    count: sortedCurrencies.length,
    currencies: sortedCurrencies.map(c => c.code)
  });

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none w-full px-4 py-2 bg-white border border-gray-300 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required={required}
        >
          {!value && (
            <option value="">
              {label || 'Select currency'}
            </option>
          )}
          {sortedCurrencies.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.code} - {currency.symbol} - {currency.name}
            </option>
          ))}
        </select>
        <ChevronDown
          size={20}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      </div>
    </div>
  );
};

export default CurrencySelector;