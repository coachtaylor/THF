"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  optional?: boolean;
}

interface GlassTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  optional?: boolean;
}

export function GlassInput({
  label,
  error,
  optional = false,
  className = "",
  ...props
}: GlassInputProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-secondary">
        {label}
        {optional && (
          <span className="ml-1 text-text-tertiary text-xs">(optional)</span>
        )}
      </label>
      <input
        className={`input-glass ${error ? "border-error focus:border-error" : ""} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}

export function GlassTextarea({
  label,
  error,
  optional = false,
  className = "",
  ...props
}: GlassTextareaProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-secondary">
        {label}
        {optional && (
          <span className="ml-1 text-text-tertiary text-xs">(optional)</span>
        )}
      </label>
      <textarea
        className={`input-glass min-h-[120px] resize-none ${error ? "border-error focus:border-error" : ""} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
