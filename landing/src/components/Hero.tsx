"use client";

import { motion } from "framer-motion";
import { GlassButton } from "./ui/GlassButton";
import { heroStagger, heroItem } from "@/lib/animations";
import Image from "next/image";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
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

      {/* Accent glow */}
      <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-accent-blue/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-accent-pink/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-16 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Text Content */}
          <motion.div
            variants={heroStagger}
            initial="initial"
            animate="animate"
            className="text-left"
          >
            {/* Headline */}
            <motion.h1
              variants={heroItem}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary leading-[1.1] tracking-tight mb-6"
            >
              Fitness that finally{" "}
              <span className="text-gradient">understands</span>{" "}
              your body
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={heroItem}
              className="text-lg md:text-xl text-text-secondary max-w-xl leading-relaxed mb-8"
            >
              Workouts that respect chest binding, HRT, and gender-affirming
              surgeries. Train hard without fighting your body or your gender.
            </motion.p>

            {/* CTA */}
            <motion.div
              variants={heroItem}
              className="flex flex-col sm:flex-row items-start gap-4 mb-10"
            >
              <GlassButton href="#apply" variant="primary" size="large">
                Join the Founding Athletes
              </GlassButton>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              variants={heroItem}
              className="flex items-center gap-4"
            >
              {/* Avatar stack */}
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-blue/30 to-accent-pink/30 border-2 border-background flex items-center justify-center"
                  >
                    <span className="text-xs font-medium text-text-secondary">
                      {["J", "A", "K", "M"][i - 1]}
                    </span>
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <span className="text-text-primary font-semibold">Spots filling fast</span>
                <span className="text-text-tertiary"> — limited founding access</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative flex justify-center lg:justify-end"
          >
            {/* Phone Frame - tilted left with perspective */}
            <div className="relative phone-mockup-enhanced" style={{ perspective: "1000px" }}>
              {/* Multi-layer glow effect behind phone */}
              <div className="absolute inset-0 bg-accent-blue/25 blur-[80px] rounded-[60px] scale-110" />
              <div className="absolute inset-0 bg-accent-pink/15 blur-[60px] rounded-[60px] scale-95 translate-y-4" />

              {/* Phone container with shadow stack */}
              <div className="relative w-[220px] md:w-[250px] lg:w-[280px] phone-mockup phone-tilted phone-shadow-stack">
                {/* Edge glow highlight */}
                <div className="phone-edge-glow" />

                {/* Phone bezel */}
                <div className="relative bg-[#1a1a1a] rounded-[50px] p-3 shadow-2xl border border-white/10">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-[#1a1a1a] rounded-b-2xl z-20" />

                  {/* Screen container */}
                  <div className="relative rounded-[40px] overflow-hidden bg-background aspect-[9/19.5]">
                    {/* App Screenshot */}
                    <Image
                      src="/app-mockup.png"
                      alt="TransFitness app showing workout session"
                      fill
                      className="object-cover object-top"
                      priority
                    />
                    {/* Glass reflection overlay */}
                    <div className="phone-reflection" />
                  </div>
                </div>

                {/* Side button */}
                <div className="absolute right-[-3px] top-32 w-[3px] h-12 bg-[#2a2a2a] rounded-l-sm" />
                <div className="absolute right-[-3px] top-48 w-[3px] h-8 bg-[#2a2a2a] rounded-l-sm" />

                {/* Left buttons */}
                <div className="absolute left-[-3px] top-28 w-[3px] h-8 bg-[#2a2a2a] rounded-r-sm" />
                <div className="absolute left-[-3px] top-40 w-[3px] h-16 bg-[#2a2a2a] rounded-r-sm" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
