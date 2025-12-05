"use client";

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Heart, Shield, Dumbbell, Sparkles, Brain } from "lucide-react";
import { viewportSettings } from "@/lib/animations";
import { useRef } from "react";

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
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), {
    stiffness: 300,
    damping: 30,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const Icon = feature.icon;
  const isBlue = feature.color === "blue";

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={viewportSettings}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative"
    >
      {/* Glow effect on hover */}
      <div
        className={`absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl ${
          isBlue
            ? "bg-gradient-to-br from-accent-blue/40 to-accent-blue/10"
            : "bg-gradient-to-br from-accent-pink/40 to-accent-pink/10"
        }`}
      />

      <div
        className={`relative h-full p-6 rounded-2xl border backdrop-blur-xl transition-all duration-300 ${
          isBlue
            ? "bg-accent-blue/[0.03] border-accent-blue/10 hover:border-accent-blue/30"
            : "bg-accent-pink/[0.03] border-accent-pink/10 hover:border-accent-pink/30"
        }`}
        style={{ transform: "translateZ(20px)" }}
      >
        {/* Icon with animated background */}
        <div className="relative mb-4">
          <motion.div
            className={`absolute inset-0 rounded-xl blur-lg ${
              isBlue ? "bg-accent-blue/20" : "bg-accent-pink/20"
            }`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse",
              delay: index * 0.2,
            }}
          />
          <div
            className={`relative w-12 h-12 rounded-xl flex items-center justify-center ${
              isBlue
                ? "bg-accent-blue/10 border border-accent-blue/20"
                : "bg-accent-pink/10 border border-accent-pink/20"
            }`}
          >
            <Icon
              size={24}
              className={isBlue ? "text-accent-blue" : "text-accent-pink"}
            />
          </div>
        </div>

        <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-gradient transition-all duration-300">
          {feature.title}
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          {feature.description}
        </p>

        {/* Corner accent */}
        <div
          className={`absolute top-0 right-0 w-20 h-20 rounded-tr-2xl opacity-30 ${
            isBlue
              ? "bg-gradient-to-bl from-accent-blue/20 to-transparent"
              : "bg-gradient-to-bl from-accent-pink/20 to-transparent"
          }`}
        />
      </div>
    </motion.div>
  );
}

export function WhatIs() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating orbs */}
        <motion.div
          className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-accent-blue/5 blur-[100px]"
          animate={{
            y: [0, 50, 0],
            x: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-[10%] w-96 h-96 rounded-full bg-accent-pink/5 blur-[120px]"
          animate={{
            y: [0, -60, 0],
            x: [0, -40, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(91, 206, 250, 0.5) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(91, 206, 250, 0.5) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-6 relative">
        {/* Header section with animated accent */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportSettings}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6"
          >
            What is{" "}
            <span className="relative">
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
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportSettings}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed"
          >
            A training app built for{" "}
            <span className="text-text-primary font-medium">
              transgender and non-binary athletes
            </span>
            . Your workouts are personalized around the things most fitness apps
            completely ignore.
          </motion.p>
        </div>

        {/* Feature cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.slice(0, 3).map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>

        {/* Bottom two cards centered */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-16">
          {features.slice(3).map((feature, index) => (
            <FeatureCard
              key={feature.title}
              feature={feature}
              index={index + 3}
            />
          ))}
        </div>

        {/* Bottom CTA / tagline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportSettings}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent-blue/5 to-transparent rounded-3xl" />
          <div className="relative text-center py-10 px-6">
            <motion.div
              className="inline-block"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <p className="text-xl md:text-2xl text-text-primary font-medium mb-2">
                Structure. Safety. Support.
              </p>
              <p className="text-text-secondary">
                Without having to explain your identity every time you want to
                work out.
              </p>
            </motion.div>

            {/* Decorative elements */}
            <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-px h-16 bg-gradient-to-b from-transparent via-accent-blue/30 to-transparent hidden md:block" />
            <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-px h-16 bg-gradient-to-b from-transparent via-accent-pink/30 to-transparent hidden md:block" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
