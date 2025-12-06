"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 border-t border-white/[0.08]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-text-primary">
              Trans Health & <span className="text-accent-blue">Fitness</span>
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm">
            <a
              href="/resources"
              className="text-text-tertiary hover:text-text-secondary transition-colors"
            >
              Resources
            </a>
            <a
              href="/privacy"
              className="text-text-tertiary hover:text-text-secondary transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              className="text-text-tertiary hover:text-text-secondary transition-colors"
            >
              Terms of Service
            </a>
            <a
              href="mailto:taylor@transhealthfitness.com"
              className="text-text-tertiary hover:text-text-secondary transition-colors"
            >
              Contact
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/[0.05] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-text-tertiary">
            &copy; {currentYear} Trans Health & Fitness. All rights reserved.
          </p>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center gap-1 text-sm text-text-tertiary"
          >
            Built with <Heart size={14} className="text-accent-pink" /> for the
            trans community
          </motion.p>
        </div>
      </div>
    </footer>
  );
}
