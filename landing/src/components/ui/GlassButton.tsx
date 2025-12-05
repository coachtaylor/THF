"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { buttonHover, buttonTap } from "@/lib/animations";

interface GlassButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "default" | "large";
  onClick?: () => void;
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
}

export function GlassButton({
  children,
  variant = "primary",
  size = "default",
  onClick,
  href,
  type = "button",
  disabled = false,
  className = "",
  icon,
}: GlassButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost:
      "bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5 px-4 py-2 rounded-xl",
  };

  const sizeStyles = {
    default: "text-base",
    large: "text-lg px-8 py-4",
  };

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  if (href) {
    return (
      <motion.a
        href={href}
        className={combinedClassName}
        whileHover={buttonHover}
        whileTap={buttonTap}
      >
        {icon}
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedClassName}
      whileHover={disabled ? {} : buttonHover}
      whileTap={disabled ? {} : buttonTap}
    >
      {icon}
      {children}
    </motion.button>
  );
}
