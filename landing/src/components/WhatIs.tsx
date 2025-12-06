"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Heart, Shield, Dumbbell, Sparkles, Brain } from "lucide-react";
import { viewportSettings } from "@/lib/animations";
import Image from "next/image";

const features = [
  {
    icon: Shield,
    title: "Chest binding safety",
    description: "Workouts that adapt when you're binding, reducing risky movements",
    color: "blue" as const,
  },
  {
    icon: Sparkles,
    title: "HRT-aware training",
    description: "Programs that respect your body's changes on hormones",
    color: "pink" as const,
  },
  {
    icon: Heart,
    title: "Surgical recovery",
    description: "Gentle progressions designed around healing timelines",
    color: "blue" as const,
  },
  {
    icon: Dumbbell,
    title: "Affirming goals",
    description: "Build the body you want, on your own terms",
    color: "pink" as const,
  },
  {
    icon: Brain,
    title: "Dysphoria-aware",
    description: "Exercise selection that respects your comfort",
    color: "blue" as const,
  },
];

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) {
  const Icon = feature.icon;
  const isBlue = feature.color === "blue";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportSettings}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={`group relative p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] ${
        isBlue
          ? "bg-gradient-to-br from-accent-blue/[0.08] to-transparent border border-accent-blue/10 hover:border-accent-blue/25"
          : "bg-gradient-to-br from-accent-pink/[0.08] to-transparent border border-accent-pink/10 hover:border-accent-pink/25"
      }`}
    >
      {/* Hover glow */}
      <div
        className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
          isBlue ? "bg-accent-blue/5" : "bg-accent-pink/5"
        }`}
      />

      <div className="relative">
        {/* Icon */}
        <div
          className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 transition-all duration-300 group-hover:scale-110 ${
            isBlue
              ? "bg-accent-blue/15 text-accent-blue"
              : "bg-accent-pink/15 text-accent-pink"
          }`}
        >
          <Icon size={24} />
        </div>

        {/* Text */}
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          {feature.title}
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
}

export function WhatIs() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Parallax transforms for different elements
  const phoneY = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const phoneRotate = useTransform(scrollYProgress, [0, 0.5, 1], [5, 0, -5]);
  const orbBlueX = useTransform(scrollYProgress, [0, 1], [-50, 50]);
  const orbPinkX = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const orbBlueY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const orbPinkY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  return (
    <section id="features" ref={sectionRef} className="py-24 md:py-32 relative overflow-hidden">
      {/* Background elements with scroll parallax */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating orbs with scroll-based movement */}
        <motion.div
          className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-accent-blue/5 blur-[100px]"
          style={{ x: orbBlueX, y: orbBlueY }}
        />
        <motion.div
          className="absolute bottom-20 right-[10%] w-96 h-96 rounded-full bg-accent-pink/5 blur-[120px]"
          style={{ x: orbPinkX, y: orbPinkY }}
        />

        {/* Subtle radial gradient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-accent-blue/[0.03] via-transparent to-transparent rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative">
        {/* Section Header - Centered */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportSettings}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-6">
            What is{" "}
            <span className="relative inline-block">
              <span className="text-gradient">Trans Health & Fitness</span>
              <motion.span
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-accent-blue via-accent-pink to-accent-blue rounded-full"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={viewportSettings}
                transition={{ duration: 0.8, delay: 0.5 }}
              />
            </span>
            ?
          </h2>

          <p className="text-lg md:text-xl text-text-secondary leading-relaxed max-w-2xl mx-auto">
            A training app built for{" "}
            <span className="text-text-primary font-medium">
              transgender and non-binary athletes
            </span>
            . Your workouts are personalized around the things most fitness apps
            completely ignore.
          </p>
        </motion.div>

        {/* Main Content - Bento-style grid */}
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Phone Mockup with scroll parallax */}
          <motion.div
            initial={{ opacity: 0, x: -50, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={viewportSettings}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="lg:col-span-5 flex items-center justify-center lg:sticky lg:top-32 lg:self-start"
          >
            {/* Phone Frame with scroll-driven motion */}
            <motion.div
              className="relative phone-mockup-enhanced"
              style={{
                perspective: "1000px",
                y: phoneY,
                rotateZ: phoneRotate,
              }}
            >
              {/* Multi-layer glow effect */}
              <div className="absolute inset-0 bg-accent-pink/20 blur-[80px] rounded-[60px] scale-110" />
              <div className="absolute inset-0 bg-accent-blue/10 blur-[60px] rounded-[60px] scale-95 translate-y-4" />

              {/* Phone container */}
              <div className="relative w-[240px] md:w-[280px] lg:w-[300px] phone-mockup phone-tilted-right phone-shadow-stack">
                {/* Edge glow */}
                <div className="phone-edge-glow" />

                {/* Phone bezel */}
                <div className="relative bg-[#1a1a1a] rounded-[50px] p-3 shadow-2xl border border-white/10">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-[#1a1a1a] rounded-b-2xl z-20" />

                  {/* Screen container */}
                  <div className="relative rounded-[40px] overflow-hidden bg-background aspect-[9/19.5]">
                    {/* App Screenshot */}
                    <Image
                      src="/hrt.png"
                      alt="TransFitness app showing HRT tracking"
                      fill
                      className="object-cover object-top"
                    />
                    {/* Glass reflection */}
                    <div className="phone-reflection" />
                  </div>
                </div>

                {/* Side buttons */}
                <div className="absolute right-[-3px] top-32 w-[3px] h-12 bg-[#2a2a2a] rounded-l-sm" />
                <div className="absolute right-[-3px] top-48 w-[3px] h-8 bg-[#2a2a2a] rounded-l-sm" />
                <div className="absolute left-[-3px] top-28 w-[3px] h-8 bg-[#2a2a2a] rounded-r-sm" />
                <div className="absolute left-[-3px] top-40 w-[3px] h-16 bg-[#2a2a2a] rounded-r-sm" />
              </div>
            </motion.div>
          </motion.div>

          {/* Feature Cards Grid - Right side */}
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4 md:gap-5 content-start">
            {/* First row - 2 cards */}
            <FeatureCard feature={features[0]} index={0} />
            <FeatureCard feature={features[1]} index={1} />

            {/* Second row - 2 cards */}
            <FeatureCard feature={features[2]} index={2} />
            <FeatureCard feature={features[3]} index={3} />

            {/* Third row - 1 card spans, tagline card */}
            <FeatureCard feature={features[4]} index={4} />

            {/* Tagline card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportSettings}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="relative p-6 rounded-2xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 flex flex-col justify-center"
            >
              <p className="text-xl md:text-2xl font-semibold text-gradient mb-2">
                Structure. Safety. Support.
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">
                Without having to explain your identity every time you want to
                work out.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
