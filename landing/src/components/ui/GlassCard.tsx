"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  variant?: "default" | "hero" | "pink";
  className?: string;
  animate?: boolean;
  role?: string;
  "aria-live"?: "off" | "polite" | "assertive";
}

export function GlassCard({
  children,
  variant = "default",
  className = "",
  animate = true,
  role,
  "aria-live": ariaLive,
}: GlassCardProps) {
  const variantStyles = {
    default: "glass-card",
    hero: "glass-card-hero",
    pink: "bg-accent-primary-muted backdrop-blur-[20px] border border-accent-primary/20 rounded-2xl",
  };

  if (!animate) {
    return (
      <div
        className={`${variantStyles[variant]} p-5 md:p-6 lg:p-8 ${className}`}
        role={role}
        aria-live={ariaLive}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={`${variantStyles[variant]} p-5 md:p-6 lg:p-8 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const }}
      role={role}
      aria-live={ariaLive}
    >
      {children}
    </motion.div>
  );
}
