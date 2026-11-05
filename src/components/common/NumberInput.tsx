import React, { useState, useEffect } from 'react';

export interface NumberInputProps {
  value: number | '';
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number | string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  unit?: string;
  id?: string;
  name?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  placeholder = '0',
  disabled = false,
  required = false,
  className = '',
  unit,
  id,
  name,
}) => {
  const [localStr, setLocalStr] = useState<string>(
    value === '' || value === undefined ? '' : String(value)
  );

  useEffect(() => {
    if (value === '' || value === undefined) {
      setLocalStr('');
    } else {
      const num = Number(localStr);
      if (isNaN(num) || num !== value) {
        setLocalStr(String(value));
      }
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalStr(raw);

    if (raw === '') {
      onChange(min !== undefined ? min : 0);
      return;
    }

    let parsed = parseFloat(raw);
    if (isNaN(parsed)) parsed = min !== undefined ? min : 0;
    if (min !== undefined && parsed < min) parsed = min;
    if (max !== undefined && parsed > max) parsed = max;

    onChange(parsed);
  };

  const handleBlur = () => {
    if (localStr === '' || isNaN(parseFloat(localStr))) {
      const defaultVal = min !== undefined ? min : 0;
      setLocalStr(String(defaultVal));
      onChange(defaultVal);
    } else {
      let parsed = parseFloat(localStr);
      if (min !== undefined && parsed < min) parsed = min;
      if (max !== undefined && parsed > max) parsed = max;
      setLocalStr(String(parsed));
      onChange(parsed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  };

  const rightPadding = unit
    ? unit.length <= 2
      ? 'pr-6'
      : unit.length <= 4
      ? 'pr-9'
      : 'pr-12'
    : '';

  return (
    <div className="relative flex items-center w-full">
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        id={id}
        name={name}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        value={localStr}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-all ${rightPadding} ${className}`}
      />
      {unit && (
        <span className="absolute right-2 text-[11px] font-medium text-slate-400 pointer-events-none select-none">
          {unit}
        </span>
      )}
    </div>
  );
};
