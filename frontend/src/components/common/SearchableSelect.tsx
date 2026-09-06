import React from 'react';
import { Select, SelectOption } from './Select';

export type { SelectOption };

export interface SearchableSelectProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder,
  error,
  helperText,
  required,
  disabled,
  className = '',
}) => {
  return (
    <Select
      label={label}
      options={options}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      error={error}
      helperText={helperText}
      required={required}
      disabled={disabled}
      className={className}
      searchable={true}
    />
  );
};

