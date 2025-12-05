"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { GlassCard } from "./ui/GlassCard";
import { viewportSettings } from "@/lib/animations";

const criteria = [
  "Trans masc, trans femme, non-binary, or questioning",
  "Using a binder, on HRT, post-op, or planning surgery",
  "Tired of generic \"summer shred\" apps that ignore your reality",
  "Willing to give honest feedback in exchange for a lower founding price",
];

export function WhoItsFor() {
  return (
    <section className="py-24 md:py-32">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={viewportSettings}
          transition={{ duration: 0.6 }}
        >
          <GlassCard variant="hero" animate={false}>
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-6">
              The Founding Athlete program is for you if you are:
            </h2>

            <ul className="space-y-4 mb-8">
              {criteria.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent-blue/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={14} className="text-accent-blue" />
                  </div>
                  <span className="text-text-secondary leading-relaxed">
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <div className="pt-6 border-t border-white/[0.08]">
              <p className="text-text-tertiary italic">
                This is a quiet, invite-only program. We are prioritizing safety,
                respect, and good faith members over growth.
              </p>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}
