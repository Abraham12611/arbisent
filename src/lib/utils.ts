import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as currency
 */
export const formatPrice = (num: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Format a number with appropriate suffixes (K, M, B, T)
 */
export const formatNumber = (num: number): string => {
  if (num === null || num === undefined || isNaN(num)) return '$0';
  
  const absNum = Math.abs(num);
  if (absNum >= 1e12) {
    return `$${(num / 1e12).toFixed(2)}T`;
  }
  if (absNum >= 1e9) {
    return `$${(num / 1e9).toFixed(2)}B`;
  }
  if (absNum >= 1e6) {
    return `$${(num / 1e6).toFixed(2)}M`;
  }
  if (absNum >= 1e3) {
    return `$${(num / 1e3).toFixed(2)}K`;
  }
  return `$${num.toFixed(2)}`;
};
