import React from 'react';
import { useCurrencyStore } from '../stores/currencyStore';
import { Amount } from '../types/currency';
import Decimal from 'decimal.js';

interface CurrencyAmountProps {
  amount: Amount;
  displayCurrency?: string;
  showOriginal?: boolean;
  className?: string;
}

export const CurrencyAmount: React.FC<CurrencyAmountProps> = ({
  amount,
  displayCurrency,
  showOriginal = false,
  className = ''
}) => {
  const { convertAmount, availableCurrencies } = useCurrencyStore();
  
  const formatAmount = (value: string, currency: string) => {
    const currencyInfo = availableCurrencies.find(c => c.code === currency);
    if (!currencyInfo) return `${currency} ${value}`;
    
    const formatted = new Decimal(value).toFixed(currencyInfo.decimals);
    return `${currencyInfo.symbol}${formatted}`;
  };

  const displayAmount = displayCurrency && displayCurrency !== amount.currency
    ? convertAmount(amount.value, amount.currency, displayCurrency)
    : amount.value;

  const displayCurrencyCode = displayCurrency || amount.currency;

  return (
    <span className={className}>
      {formatAmount(displayAmount, displayCurrencyCode)}
      {showOriginal && displayCurrency && displayCurrency !== amount.currency && (
        <span className="text-gray-500 text-sm ml-1">
          ({formatAmount(amount.value, amount.currency)})
        </span>
      )}
    </span>
  );
};