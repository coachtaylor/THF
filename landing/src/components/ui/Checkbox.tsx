"use client";

import { InputHTMLAttributes } from "react";

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export function Checkbox({ label, className = "", ...props }: CheckboxProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <input type="checkbox" className={`checkbox-glass mt-0.5 ${className}`} {...props} />
      <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors leading-relaxed">
        {label}
      </span>
    </label>
  );
}
