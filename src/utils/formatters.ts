import { MONTH_NAMES, MONTH_NAMES_SHORT } from './constants';

export const formatCurrency = (value: number | undefined | null): string => {
  const numericValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
};

export const formatPercent = (value: number | undefined | null, decimals = 1): string => {
  const numericValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  return `${numericValue.toFixed(decimals).replace('.', ',')}%`;
};

export const formatCompactCurrency = (value: number): string => {
  if (Math.abs(value) >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(1).replace('.', ',')}k`;
  }
  return formatCurrency(value);
};

export const parseMonthId = (monthId: string): { year: number; month: number; label: string; shortLabel: string } => {
  const [yearStr, monthStr] = monthId.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const label = `${MONTH_NAMES[month - 1]} / ${year}`;
  const shortLabel = `${MONTH_NAMES_SHORT[month - 1]}/${String(year).slice(2)}`;
  return { year, month, label, shortLabel };
};

export const createMonthId = (year: number, month: number): string => {
  return `${year}-${String(month).padStart(2, '0')}`;
};

export const formatDateBR = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export const getTodayDateInputString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
