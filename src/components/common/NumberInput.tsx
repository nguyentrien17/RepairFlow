import React from 'react';

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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(0);
      return;
    }
    let parsed = parseFloat(raw);
    if (isNaN(parsed)) parsed = 0;
    // Strictly prevent negative numbers if min >= 0
    if (min !== undefined && parsed < min) parsed = min;
    if (max !== undefined && parsed > max) parsed = max;
    onChange(parsed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Strictly prohibit '-' so users can never type negative numbers
    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  };

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
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={`w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-all ${
          unit ? 'pr-12' : ''
        } ${className}`}
      />
      {unit && (
        <span className="absolute right-3 text-xs font-medium text-slate-400 pointer-events-none">
          {unit}
        </span>
      )}
    </div>
  );
};
