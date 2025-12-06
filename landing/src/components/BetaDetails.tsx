"use client";

import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { GlassCard } from "./ui/GlassCard";
import { staggerContainer, staggerItem, viewportSettings } from "@/lib/animations";

const benefits = [
  "Personalized daily workouts",
  "Safety tags for exercises and sessions",
  "Simple session feedback and check ins",
  "Direct channel to share ideas, bug reports, and safety concerns",
];

const programSteps = [
  "Limited spots, we review each application",
  "You agree to a short code of conduct and terms",
  "You get early access, and we ask for your feedback a few times per month",
];

export function BetaDetails() {
  return (
    <section id="beta" className="py-16 md:py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportSettings}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
            Founding Athlete Details
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Early access, founding price, and a direct line to shape the app.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-5 md:gap-8">
          {/* What You Get */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportSettings}
            transition={{ duration: 0.6 }}
          >
            <GlassCard animate={false}>
              <h3 className="text-xl font-semibold text-text-primary mb-6">
                What you get right now
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
                    <div className="w-5 h-5 rounded-full bg-accent-blue/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={12} className="text-accent-blue" />
                    </div>
                    <span className="text-text-secondary">{benefit}</span>
                  </motion.li>
                ))}
              </motion.ul>

              <div className="mt-8 pt-6 border-t border-white/[0.08]">
                <h4 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-4">
                  How it works
                </h4>
                <ol className="space-y-3">
                  {programSteps.map((step, index) => (
                    <li key={step} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center flex-shrink-0 text-xs text-text-tertiary mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-sm text-text-tertiary">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </GlassCard>
          </motion.div>

          {/* Pricing Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportSettings}
            transition={{ duration: 0.6 }}
          >
            <GlassCard variant="hero" animate={false} className="relative overflow-hidden">
              {/* Glow Effect */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent-blue/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles size={20} className="text-accent-blue" />
                  <span className="text-sm font-semibold text-accent-blue uppercase tracking-wider">
                    Founding Price
                  </span>
                </div>

                <h3 className="text-2xl font-semibold text-text-primary mb-2">
                  Founding Athlete Plan
                </h3>

                <p className="text-sm text-text-secondary mb-6">
                  No credit card required to apply
                </p>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-5xl md:text-6xl font-bold text-accent-blue">
                    $5
                  </span>
                  <span className="text-xl text-text-secondary">/month</span>
                </div>

                <p className="text-text-secondary text-sm mb-4">
                  or $50/year (save $10)
                </p>

                <p className="text-accent-blue font-medium mb-6">
                  Locked in for life while you stay subscribed
                </p>

                <p className="text-text-secondary mb-8">
                  Payment only required if accepted. Future public pricing will be higher.
                </p>

                <a
                  href="#apply"
                  className="btn-primary w-full text-center block"
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
