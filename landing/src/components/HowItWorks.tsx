"use client";

import { motion } from "framer-motion";
import { User, ShieldCheck, MessageSquare } from "lucide-react";
import { staggerContainer, staggerItem, viewportSettings } from "@/lib/animations";

const steps = [
  {
    number: "01",
    icon: User,
    title: "Tell us about your body and your journey",
    description:
      "Onboarding asks about pronouns, identity, HRT status, binder use, surgery status, and training experience, in plain language and on your terms.",
  },
  {
    number: "02",
    icon: ShieldCheck,
    title: "Get a workout that respects what you told us",
    description:
      "Your session adapts to binder days, energy swings on HRT, and post-op stages. Exercises are tagged with safety badges, for example binder friendly, post-top safe, or lower dysphoria focus.",
  },
  {
    number: "03",
    icon: MessageSquare,
    title: "Give fast feedback, so it learns with you",
    description:
      "After each workout, you tap a simple check in, too easy, about right, or too hard, plus whether it felt gender affirming or dysphoria triggering. That feedback shapes how we evolve the app.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="min-h-[calc(100vh-5rem)] flex items-center py-16 md:py-20 bg-background-secondary/50 relative overflow-hidden">
      {/* Background decorative element */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-accent-primary/[0.04] rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto px-5 md:px-6 relative w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportSettings}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
            How it works
          </h2>
          <p className="text-base md:text-lg text-text-secondary max-w-[720px] mx-auto leading-[1.6] md:leading-[1.7]">
            Three simple steps to workouts that actually work for you.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={viewportSettings}
          className="grid md:grid-cols-3 gap-4 md:gap-6"
        >
          {steps.map((step) => (
            <motion.div key={step.number} variants={staggerItem} className="group">
              <div className="relative h-full rounded-2xl bg-background-elevated border border-border-subtle overflow-hidden transition-all duration-300 group-hover:border-accent-primary/30 group-hover:-translate-y-0.5">
                {/* Subtle accent orb */}
                <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-accent-primary/15 blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-500" />

                {/* Content */}
                <div className="relative p-6 md:p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-3xl md:text-4xl font-bold text-accent-primary/80">
                      {step.number}
                    </span>
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-accent-primary-muted flex items-center justify-center">
                      <step.icon className="w-5 h-5 md:w-6 md:h-6 text-accent-primary" />
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-text-primary mb-3 leading-tight">
                    {step.title}
                  </h3>

                  <p className="text-sm text-text-secondary leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Connecting line decoration (subtle) */}
        <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 w-2/3 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent -z-10" />
      </div>
    </section>
  );
}
