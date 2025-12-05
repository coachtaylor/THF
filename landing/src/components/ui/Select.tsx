"use client";

import { SelectHTMLAttributes } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  optional?: boolean;
}

export function Select({
  label,
  options,
  error,
  optional = false,
  className = "",
  ...props
}: SelectProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-secondary">
        {label}
        {optional && (
          <span className="ml-1 text-text-tertiary text-xs">(optional)</span>
        )}
      </label>
      <select
        className={`input-glass appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.5rem] bg-[right_0.75rem_center] bg-no-repeat pr-10 ${error ? "border-error focus:border-error" : ""} ${className}`}
        {...props}
      >
        <option value="" className="bg-background-card">
          Select an option...
        </option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="bg-background-card"
          >
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
