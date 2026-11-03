import React, { useState, useEffect, useRef } from 'react';
import { formatNumberDots, parseRawNumber, numberToVietnameseWords } from '../../utils/numberToWords';
import { AlertCircle, Check } from 'lucide-react';

export interface CurrencyInputProps {
  value: number | '';
  onChange: (val: number) => void;
  max?: number;
  min?: number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  name?: string;
  suffix?: string;
  showInWords?: boolean;
  quickMaxButtonLabel?: string;
  quickPresets?: number[];
  autoFocus?: boolean;
  customError?: string;
  onBlur?: () => void;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  max,
  min = 0,
  placeholder = '0',
  disabled = false,
  required = false,
  className = '',
  id,
  name,
  suffix = 'đ',
  showInWords = true,
  quickMaxButtonLabel,
  quickPresets,
  autoFocus = false,
  customError,
  onBlur,
}) => {
  // Local display text state (e.g. "850.000")
  const [displayValue, setDisplayValue] = useState<string>(() =>
    value !== '' && value !== undefined && value !== null ? formatNumberDots(value) : ''
  );
  const [isFocused, setIsFocused] = useState(false);

  // Sync when prop value changes externally
  useEffect(() => {
    if (value === '' || value === undefined || value === null) {
      setDisplayValue('');
    } else {
      const formatted = formatNumberDots(value);
      setDisplayValue(formatted);
    }
  }, [value]);

  const numValue = typeof value === 'number' ? value : 0;
  const isOverMax = max !== undefined && numValue > max;
  const isUnderMin = min !== undefined && numValue < min;
  const hasError = isOverMax || isUnderMin || Boolean(customError);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    // Extract numbers only
    const digitsOnly = rawInput.replace(/[^\d]/g, '');

    if (!digitsOnly) {
      setDisplayValue('');
      onChange(0);
      return;
    }

    const parsedNum = Math.max(0, parseInt(digitsOnly, 10));
    setDisplayValue(formatNumberDots(parsedNum));
    onChange(parsedNum);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Strictly prevent typing minus '-', 'e', '+', '.' (we format automatically)
    if (['-', '+', 'e', 'E'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleApplyMax = () => {
    if (max !== undefined && max >= 0) {
      onChange(max);
      setDisplayValue(formatNumberDots(max));
    }
  };

  const handleApplyPreset = (preset: number) => {
    const target = max !== undefined ? Math.min(preset, max) : preset;
    onChange(target);
    setDisplayValue(formatNumberDots(target));
  };

  return (
    <div className="w-full space-y-1.5">
      <div className="relative flex items-center">
        <input
          type="text"
          inputMode="numeric"
          id={id}
          name={name}
          disabled={disabled}
          required={required}
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            if (onBlur) onBlur();
          }}
          className={`w-full px-3.5 py-2.5 bg-white border rounded-xl font-bold text-slate-900 transition-all text-sm pr-12 focus:outline-hidden ${
            disabled
              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
              : hasError
              ? 'border-rose-400 bg-rose-50/30 text-rose-950 focus:ring-2 focus:ring-rose-200'
              : isFocused
              ? 'border-indigo-500 ring-2 ring-indigo-100'
              : 'border-slate-300 hover:border-slate-400'
          } ${className}`}
        />

        {/* Currency Suffix Badge */}
        <div className="absolute right-3 pointer-events-none flex items-center">
          <span
            className={`text-xs font-bold px-1.5 py-0.5 rounded ${
              hasError
                ? 'text-rose-600 bg-rose-100'
                : 'text-slate-500 bg-slate-100'
            }`}
          >
            {suffix}
          </span>
        </div>
      </div>

      {/* Validation Message */}
      {isOverMax && max !== undefined && (
        <div className="flex items-center justify-between text-xs text-rose-600 font-semibold bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
            <span>
              Vượt quá số tiền tối đa cho phép ({formatNumberDots(max)} {suffix})
            </span>
          </div>
          <button
            type="button"
            onClick={handleApplyMax}
            className="text-[11px] underline hover:text-rose-800 font-bold ml-2 cursor-pointer"
          >
            Lấy đúng số tối đa
          </button>
        </div>
      )}

      {customError && !isOverMax && (
        <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{customError}</span>
        </p>
      )}

      {/* Quick Max / Presets Buttons */}
      {(quickMaxButtonLabel || (quickPresets && quickPresets.length > 0)) && !disabled && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {quickMaxButtonLabel && max !== undefined && max > 0 && (
            <button
              type="button"
              onClick={handleApplyMax}
              className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                numValue === max
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
              }`}
            >
              ✓ {quickMaxButtonLabel}: {formatNumberDots(max)} {suffix}
            </button>
          )}

          {quickPresets &&
            quickPresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border transition-all cursor-pointer ${
                  numValue === preset
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                {formatNumberDots(preset)}
              </button>
            ))}
        </div>
      )}

      {/* Number in Vietnamese Words Preview */}
      {showInWords && numValue > 0 && !isOverMax && (
        <p className="text-[11px] text-slate-500 italic pl-1 flex items-center gap-1">
          <span className="text-slate-400 not-italic font-medium">Bằng chữ:</span>
          <span className="text-slate-700 font-medium">{numberToVietnameseWords(numValue)}</span>
        </p>
      )}
    </div>
  );
};
