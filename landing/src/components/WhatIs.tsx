"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Heart, Shield, Dumbbell, Sparkles, Brain } from "lucide-react";
import { viewportSettings } from "@/lib/animations";

const features = [
  {
    icon: Shield,
    title: "Chest binding safety",
    description: "Workouts that adapt when you're binding, reducing risky movements",
  },
  {
    icon: Sparkles,
    title: "HRT-aware training",
    description: "Programs that respect your body's changes on hormones",
  },
  {
    icon: Heart,
    title: "Surgical recovery",
    description: "Gentle progressions designed around healing timelines",
  },
  {
    icon: Dumbbell,
    title: "Affirming goals",
    description: "Build the body you want, on your own terms",
  },
  {
    icon: Brain,
    title: "Dysphoria-aware",
    description: "Exercise selection that respects your comfort",
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportSettings}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className="group relative p-5 md:p-6 rounded-2xl bg-background-elevated border border-border-subtle transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-primary/30"
    >
      <div className="relative">
        <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl mb-4 bg-accent-primary-muted text-accent-primary transition-transform duration-300 group-hover:scale-110">
          <Icon className="w-5 h-5 md:w-6 md:h-6" />
        </div>
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

  const orbBlueX = useTransform(scrollYProgress, [0, 1], [-50, 50]);
  const orbPinkX = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const orbBlueY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const orbPinkY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  return (
    <section
      id="features"
      ref={sectionRef}
      className="min-h-[calc(100vh-5rem)] flex items-center py-16 md:py-20 relative overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-accent-primary/5 blur-[100px]"
          style={{ x: orbBlueX, y: orbBlueY }}
        />
        <motion.div
          className="absolute bottom-20 right-[10%] w-96 h-96 rounded-full bg-accent-primary/5 blur-[120px]"
          style={{ x: orbPinkX, y: orbPinkY }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-5 md:px-6 relative w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportSettings}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
            What is{" "}
            <span className="relative inline-block">
              <span className="text-accent-primary">Trans Health & Fitness?</span>
              <motion.span
                className="absolute -bottom-2 left-0 right-0 h-[2px] bg-accent-primary/60 rounded-full origin-left"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={viewportSettings}
                transition={{ duration: 0.8, delay: 0.5 }}
              />
            </span>
          </h2>

          <p className="text-base md:text-lg text-text-secondary leading-[1.6] md:leading-[1.7] max-w-[720px] mx-auto">
            A training app built for{" "}
            <span className="text-text-primary font-medium">
              transgender and non-binary athletes
            </span>
            . Your workouts are personalized around the things most fitness apps
            completely ignore.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportSettings}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="relative p-5 md:p-6 rounded-2xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 flex flex-col justify-center"
          >
            <p className="text-lg md:text-xl font-semibold text-accent-primary mb-2">
              Structure. Safety. Support.
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">
              Without having to explain your identity every time you work out.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
