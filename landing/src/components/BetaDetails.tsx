"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { GlassCard } from "./ui/GlassCard";
import { staggerContainer, staggerItem, viewportSettings } from "@/lib/animations";

const benefits = [
  "Early access before public launch",
  "Lifetime founding price when we exit beta",
  "A direct line to founders for feedback and bug reports",
  "Hand-reviewed application — limited spots",
];

export function BetaDetails() {
  return (
    <section id="beta" className="min-h-[calc(100vh-5rem)] flex items-center py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-5 md:px-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportSettings}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
            Founding Athlete Details
          </h2>
          <p className="text-base md:text-lg text-text-secondary max-w-[720px] mx-auto leading-[1.6] md:leading-[1.7]">
            Early access, founding price, and a direct line to shape the app.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-5 md:gap-8 items-stretch">
          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportSettings}
            transition={{ duration: 0.6 }}
            className="h-full"
          >
            <GlassCard animate={false} className="h-full">
              <h3 className="text-xl font-semibold text-text-primary mb-6">
                What founding athletes get
              </h3>
              <motion.ul
                variants={staggerContainer}
                initial="initial"
                whileInView="animate"
                viewport={viewportSettings}
                className="space-y-4"
              >
                {benefits.map((benefit) => (
                  <motion.li
                    key={benefit}
                    variants={staggerItem}
                    className="flex items-start gap-3"
                  >
                    <div className="w-5 h-5 rounded-full bg-accent-primary-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={12} className="text-accent-primary" />
                    </div>
                    <span className="text-text-secondary">{benefit}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </GlassCard>
          </motion.div>

          {/* Pricing */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportSettings}
            transition={{ duration: 0.6 }}
            className="h-full"
          >
            <GlassCard variant="hero" animate={false} className="relative overflow-hidden h-full flex flex-col">
              <div className="absolute -top-24 -right-24 w-72 h-72 bg-accent-primary/10 rounded-full blur-[120px] pointer-events-none" />

              <div className="relative flex flex-col flex-1">
                <h3 className="text-xl font-semibold text-text-primary mb-6">
                  Pricing
                </h3>

                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-4xl font-bold text-accent-primary leading-none">
                    Free
                  </span>
                  <span className="text-base text-text-secondary">while in beta</span>
                </div>

                <p className="text-text-secondary leading-[1.6]">
                  <span className="text-text-primary font-medium">$5/month</span> or <span className="text-text-primary font-medium">$50/year</span> — locked in for life when we exit beta.
                </p>

                <div className="my-6 border-t border-white/5" />

                <p className="text-text-tertiary text-sm mb-6">
                  No credit card required to apply.
                </p>

                <a
                  href="#apply"
                  className="btn-primary w-full text-center block mt-auto"
                >
                  Apply to Join
                </a>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
