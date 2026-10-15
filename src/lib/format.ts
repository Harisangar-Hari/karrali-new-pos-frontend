import Decimal from 'decimal.js';
import dayjs from 'dayjs';

const LKR = new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Backend returns money as strings ("1250.0000"). Never convert through
 * Number before formatting — Decimal preserves precision.
 */
export function formatMoney(
  value: string | number | Decimal | null | undefined,
): string {
  if (value === null || value === undefined || value === '') return '—';
  try {
    return LKR.format(new Decimal(value).toNumber());
  } catch {
    return '—';
  }
}

export function formatQty(
  value: string | number | Decimal | null | undefined,
  decimals = 2,
): string {
  if (value === null || value === undefined || value === '') return '—';
  try {
    return new Decimal(value).toFixed(decimals);
  } catch {
    return '—';
  }
}

export function formatDate(
  value: string | Date | null | undefined,
  fmt = 'DD MMM YYYY',
): string {
  if (!value) return '—';
  const d = dayjs(value);
  return d.isValid() ? d.format(fmt) : '—';
}

export function formatDateTime(value: string | Date | null | undefined): string {
  return formatDate(value, 'DD MMM YYYY HH:mm');
}

export function formatTime(value: string | Date | null | undefined): string {
  return formatDate(value, 'HH:mm');
}

export function formatRelative(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = dayjs(value);
  if (!d.isValid()) return '—';
  const now = dayjs();
  const diffMin = now.diff(d, 'minute');
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = now.diff(d, 'hour');
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = now.diff(d, 'day');
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.format('DD MMM YYYY');
}