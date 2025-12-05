"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  variant?: "default" | "hero" | "pink";
  className?: string;
  animate?: boolean;
}

export function GlassCard({
  children,
  variant = "default",
  className = "",
  animate = true,
}: GlassCardProps) {
  const variantStyles = {
    default: "glass-card",
    hero: "glass-card-hero",
    pink: "bg-accent-pink/[0.06] backdrop-blur-[24px] border border-accent-pink/15 rounded-[2rem]",
  };

  if (!animate) {
    return (
      <div className={`${variantStyles[variant]} p-6 md:p-8 ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={`${variantStyles[variant]} p-6 md:p-8 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const }}
    >
      {children}
    </motion.div>
  );
}
