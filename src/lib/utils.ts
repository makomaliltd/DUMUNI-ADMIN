import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type CurrencyCode = 'FCFA' | 'USD' | 'EUR' | 'CNY';

const currencyLocales: Record<CurrencyCode, string> = {
  FCFA: 'fr-FR',
  USD: 'en-US',
  EUR: 'fr-FR',
  CNY: 'zh-CN',
};

const currencySuffixes: Record<CurrencyCode, string> = {
  FCFA: ' FCFA',
  USD: '$',
  EUR: '€',
  CNY: '¥',
};

/**
 * Format a numeric amount as FCFA by default.
 * Matches the project's default Cameroonian / West-African CFA Franc context.
 * For CNY/USD/EUR the symbol is placed as a prefix when traditional.
 */
export function formatCurrency(
  value: number | string | null | undefined,
  currency: CurrencyCode = 'FCFA',
  decimals: number = currency === 'FCFA' ? 0 : 2,
): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) num = 0;
  const formatted = num.toLocaleString(currencyLocales[currency] ?? 'fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  if (currency === 'FCFA') return formatted + currencySuffixes.FCFA;
  if (currency === 'CNY') return `¥${formatted}`;
  if (currency === 'USD') return `$${formatted}`;
  if (currency === 'EUR') return `${formatted}€`;
  return formatted;
}

/** Alias so existing Finance.tsx usage stays consistent */
export function formatFCFA(n: number): string {
  return formatCurrency(n, 'FCFA', 0);
}
