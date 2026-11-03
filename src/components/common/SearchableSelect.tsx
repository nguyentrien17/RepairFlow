import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SearchableOption {
  value: string | number;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string | number;
  onChange: (value: any) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  isClearable?: boolean;
  className?: string;
  emptyMessage?: string;
}

// Helper to remove Vietnamese diacritics for smart case/accent-insensitive search
export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  // Combine with normalize
  str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return str;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = '-- Chọn hoặc tìm kiếm --',
  searchPlaceholder = 'Nhập từ khóa tìm nhanh...',
  label,
  required = false,
  disabled = false,
  isClearable = false,
  className = '',
  emptyMessage = 'Không tìm thấy kết quả phù hợp',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Selected option
  const selectedOption = useMemo(() => {
    return options.find((opt) => String(opt.value) === String(value));
  }, [options, value]);

  // Filter options with diacritics-insensitive search
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const cleanQuery = removeVietnameseTones(searchQuery.trim());
    return options.filter((opt) => {
      const matchLabel = removeVietnameseTones(opt.label).includes(cleanQuery);
      const matchSublabel = opt.sublabel
        ? removeVietnameseTones(opt.sublabel).includes(cleanQuery)
        : false;
      const matchBadge = opt.badge
        ? removeVietnameseTones(opt.badge).includes(cleanQuery)
        : false;
      return matchLabel || matchSublabel || matchBadge;
    });
  }, [options, searchQuery]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = filteredOptions[highlightedIndex];
      if (current && !current.disabled) {
        onChange(current.value);
        setIsOpen(false);
        setSearchQuery('');
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleSelect = (opt: SearchableOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <div
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full min-h-[40px] px-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium cursor-pointer flex items-center justify-between gap-2 transition-all select-none ${
          disabled
            ? 'opacity-60 cursor-not-allowed bg-slate-100 border-slate-200'
            : isOpen
            ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/10 shadow-xs'
            : 'border-slate-300 hover:border-slate-400 hover:bg-white'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden text-left flex-1">
          {selectedOption ? (
            <div className="flex items-center gap-2 truncate w-full">
              <span className="font-semibold text-slate-800 truncate">
                {selectedOption.label}
              </span>
              {selectedOption.sublabel && (
                <span className="text-slate-400 text-[11px] truncate shrink-0">
                  {selectedOption.sublabel}
                </span>
              )}
              {selectedOption.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                    selectedOption.badgeColor || 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}
                >
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {isClearable && selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
              title="Xóa lựa chọn"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-indigo-600' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Quick Search Input */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div
            ref={listRef}
            className="max-h-60 overflow-y-auto p-1 divide-y divide-slate-50 text-xs"
          >
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-slate-400 flex flex-col items-center gap-1.5">
                <Search className="w-5 h-5 text-slate-300" />
                <span>{emptyMessage}</span>
                <span className="text-[10px] text-slate-400">
                  Thử tìm kiếm theo tên, mã hoặc số điện thoại
                </span>
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={String(opt.value)}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3 py-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                      opt.disabled
                        ? 'opacity-40 cursor-not-allowed bg-slate-50'
                        : isSelected
                        ? 'bg-indigo-50/80 text-indigo-900 font-semibold'
                        : isHighlighted
                        ? 'bg-slate-100/90 text-slate-900'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{opt.label}</span>
                        {opt.badge && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                              opt.badgeColor || 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {opt.sublabel && (
                        <span className="text-[11px] text-slate-400 truncate mt-0.5">
                          {opt.sublabel}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Footer hint */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Tìm kiếm không dấu tiếng Việt</span>
            <span>{filteredOptions.length} lựa chọn</span>
          </div>
        </div>
      )}
    </div>
  );
};
