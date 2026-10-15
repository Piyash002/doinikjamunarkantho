export const BANGLA_NUMBERS_MAP: Record<string, string> = {
  0: '০',
  1: '১',
  2: '২',
  3: '৩',
  4: '৪',
  5: '৫',
  6: '৬',
  7: '৭',
  8: '৮',
  9: '৯',
};

/**
 * Converts numbers or strings of digits into Bengali numerals.
 * Optionally adds English-style thousands separators (commas) converted to Bengali.
 * e.g., 2100 -> "২,১০০"
 */
export function toBanglaNumber(value: number | string | null | undefined, formatCommas = true): string {
  if (value === undefined || value === null || value === '') return '০';
  const num = Number(value);
  if (isNaN(num)) {
    return String(value)
      .split('')
      .map((char) => BANGLA_NUMBERS_MAP[char] ?? char)
      .join('');
  }

  const str = formatCommas ? num.toLocaleString('en-US') : String(num);
  return str
    .split('')
    .map((char) => BANGLA_NUMBERS_MAP[char] ?? char)
    .join('');
}

/**
 * Formats a Date/string into Bengali long date in Asia/Dhaka timezone.
 * e.g., "১৫ অক্টোবর, ২০২৬"
 */
export function formatBanglaDate(value?: Date | string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Dhaka',
  });
}

/**
 * Formats a Date/string into Bengali 12-hour time in Asia/Dhaka timezone.
 * e.g., "০১:২৫ AM"
 */
export function formatBanglaTime(value?: Date | string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('bn-BD', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Dhaka',
  });
}

/**
 * Formats a Date/string into full Bengali date and time.
 * e.g., "১৫ অক্টোবর, ২০২৬, ০১:২৫ AM"
 */
export function formatBanglaDateTime(value?: Date | string | null): string {
  if (!value) return '';
  const dateStr = formatBanglaDate(value);
  const timeStr = formatBanglaTime(value);
  if (!dateStr) return '';
  return timeStr ? `${dateStr}, ${timeStr}` : dateStr;
}

/**
 * Formats relative time in Bengali.
 * e.g., "৭ ঘণ্টা আগে", "১০ মিনিট আগে", "৩ দিন আগে"
 */
export function formatRelativeTime(dateValue?: string | Date | null): string {
  if (!dateValue) return 'এইমাত্র';
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return 'এইমাত্র';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60000));
  const hours = Math.max(0, Math.round(diffMs / 3600000));
  const days = Math.max(0, Math.round(diffMs / 86400000));

  if (minutes < 60) return `${toBanglaNumber(minutes || 1, false)} মিনিট আগে`;
  if (hours < 24) return `${toBanglaNumber(hours, false)} ঘণ্টা আগে`;
  if (days < 7) return `${toBanglaNumber(days, false)} দিন আগে`;

  return formatBanglaDate(date);
}
