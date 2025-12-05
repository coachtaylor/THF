"use client";

import { motion } from "framer-motion";
import { GlassButton } from "./ui/GlassButton";
import { heroStagger, heroItem } from "@/lib/animations";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Opacity */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/hero.png')",
          opacity: 0.35,
        }}
      />

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-background/50" />

      {/* Content */}
      <motion.div
        variants={heroStagger}
        initial="initial"
        animate="animate"
        className="relative z-10 max-w-4xl mx-auto px-6 text-center pt-24 pb-16"
      >
        {/* Headline */}
        <motion.h1
          variants={heroItem}
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary leading-tight tracking-tight mb-6"
        >
          A fitness app that actually{" "}
          <span className="text-gradient">understands trans bodies</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={heroItem}
          className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Trans Health & Fitness gives you workouts that respect chest binding, HRT, and
          gender-affirming surgeries, so you can train hard without fighting
          your body or your gender.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={heroItem}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <GlassButton href="#apply" variant="primary" size="large">
            Join the Founding Athlete
          </GlassButton>
        </motion.div>

        {/* Trust Note */}
        <motion.p
          variants={heroItem}
          className="mt-12 text-sm text-text-tertiary"
        >
          Built for trans and non-binary athletes. Limited spots available.
        </motion.p>
      </motion.div>

    </section>
  );
}
