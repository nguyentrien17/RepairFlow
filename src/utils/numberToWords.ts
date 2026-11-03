/**
 * Utility to convert numbers into Vietnamese words (Doc so thanh chu)
 * Used in payment receipts, invoices, and currency inputs for clarity.
 */

const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

function readThreeDigits(threeDigits: number, isHighestGroup: boolean): string {
  const hundreds = Math.floor(threeDigits / 100);
  const remainder = threeDigits % 100;
  const tens = Math.floor(remainder / 10);
  const units = remainder % 10;

  if (threeDigits === 0) return '';

  let res = '';

  // Hundreds
  if (!isHighestGroup || hundreds > 0) {
    res += `${DIGITS[hundreds]} trăm `;
  }

  // Tens
  if (tens === 0) {
    if (units > 0 && (!isHighestGroup || hundreds > 0)) {
      res += 'lẻ ';
    }
  } else if (tens === 1) {
    res += 'mười ';
  } else {
    res += `${DIGITS[tens]} mươi `;
  }

  // Units
  if (units === 1) {
    if (tens > 1) {
      res += 'mốt';
    } else {
      res += DIGITS[1];
    }
  } else if (units === 4) {
    if (tens > 1) {
      res += 'tư';
    } else {
      res += DIGITS[4];
    }
  } else if (units === 5) {
    if (tens > 0) {
      res += 'lăm';
    } else {
      res += DIGITS[5];
    }
  } else if (units > 0) {
    res += DIGITS[units];
  }

  return res.trim();
}

export function numberToVietnameseWords(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '';
  const num = Math.floor(Math.abs(amount));
  if (num === 0) return 'Không đồng';

  const GROUPS = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  let currentNum = num;
  let groupIndex = 0;
  const parts: string[] = [];

  while (currentNum > 0) {
    const threeDigits = currentNum % 1000;
    const isHighest = Math.floor(currentNum / 1000) === 0;

    if (threeDigits > 0) {
      const words = readThreeDigits(threeDigits, isHighest);
      const groupName = GROUPS[groupIndex];
      parts.unshift(`${words} ${groupName}`.trim());
    }

    currentNum = Math.floor(currentNum / 1000);
    groupIndex++;
  }

  const result = parts.join(' ').replace(/\s+/g, ' ').trim();
  if (!result) return 'Không đồng';

  // Capitalize first letter and append 'đồng'
  return result.charAt(0).toUpperCase() + result.slice(1) + ' đồng';
}

/**
 * Format raw number with Vietnamese dot thousands separator (e.g. 1000000 -> "1.000.000")
 */
export function formatNumberDots(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const cleanNumber = typeof value === 'string' ? parseRawNumber(value) : value;
  if (isNaN(cleanNumber)) return '';
  return new Intl.NumberFormat('vi-VN').format(cleanNumber);
}

/**
 * Parse string with dots or commas into a positive integer
 */
export function parseRawNumber(str: string | number): number {
  if (typeof str === 'number') return Math.max(0, isNaN(str) ? 0 : str);
  if (!str) return 0;
  // Remove all non-digits
  const cleaned = str.replace(/[^\d]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}
