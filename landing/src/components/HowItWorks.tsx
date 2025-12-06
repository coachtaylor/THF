"use client";

import { motion } from "framer-motion";
import { User, ShieldCheck, MessageSquare } from "lucide-react";
import { staggerContainer, staggerItem, viewportSettings } from "@/lib/animations";

const steps = [
  {
    number: "01",
    icon: User,
    iconColor: "text-accent-blue",
    gradient: "from-accent-blue/25 via-accent-blue/10 to-transparent",
    glowColor: "group-hover:shadow-[0_0_40px_rgba(91,206,250,0.25)]",
    title: "Tell us about your body and your journey",
    description:
      "Onboarding asks about pronouns, identity, HRT status, binder use, surgery status, and training experience, in plain language and on your terms.",
  },
  {
    number: "02",
    icon: ShieldCheck,
    iconColor: "text-accent-pink",
    gradient: "from-accent-pink/25 via-accent-pink/10 to-transparent",
    glowColor: "group-hover:shadow-[0_0_40px_rgba(245,169,184,0.25)]",
    title: "Get a workout that respects what you told us",
    description:
      "Your session adapts to binder days, energy swings on HRT, and post-op stages. Exercises are tagged with safety badges, for example binder friendly, post-top safe, or lower dysphoria focus.",
  },
  {
    number: "03",
    icon: MessageSquare,
    iconColor: "text-accent-blue",
    gradient: "from-accent-blue/20 via-accent-pink/15 to-transparent",
    glowColor: "group-hover:shadow-[0_0_40px_rgba(91,206,250,0.2),0_0_40px_rgba(245,169,184,0.15)]",
    title: "Give fast feedback, so it learns with you",
    description:
      "After each workout, you tap a simple check in, too easy, about right, or too hard, plus whether it felt gender affirming or dysphoria triggering. That feedback shapes how we evolve the app.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 lg:py-32 bg-background-secondary/50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-accent-blue/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-pink/5 rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportSettings}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
            How it works
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
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
          {steps.map((step, index) => (
            <motion.div key={step.number} variants={staggerItem} className="group">
              {/* Card wrapper with gradient border */}
              <div
                className={`relative h-full rounded-[2rem] p-[1px] transition-all duration-500 ${step.glowColor}`}
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 100%)",
                }}
              >
                {/* Inner card */}
                <div className="relative h-full rounded-[2rem] bg-background-card/90 backdrop-blur-xl overflow-hidden">
                  {/* Gradient orb background */}
                  <div
                    className={`absolute -top-16 -left-16 w-56 h-56 rounded-full bg-gradient-to-br ${step.gradient} blur-3xl opacity-70 group-hover:opacity-100 transition-opacity duration-500`}
                  />

                  {/* Hexagon pattern decoration (inspired by bento pro) */}
                  <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <path
                        d="M24 4L42 14V34L24 44L6 34V14L24 4Z"
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-white/30"
                      />
                      <path
                        d="M24 12L36 18V30L24 36L12 30V18L24 12Z"
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-white/20"
                      />
                    </svg>
                  </div>

                  {/* Content */}
                  <div className="relative p-5 md:p-8">
                    {/* Number and Icon row */}
                    <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                      {/* Large number with gradient */}
                      <span
                        className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent"
                        style={{
                          backgroundImage: index === 1
                            ? "linear-gradient(180deg, rgba(245,169,184,0.4) 0%, rgba(245,169,184,0.1) 100%)"
                            : "linear-gradient(180deg, rgba(91,206,250,0.4) 0%, rgba(91,206,250,0.1) 100%)",
                        }}
                      >
                        {step.number}
                      </span>

                      {/* Icon container */}
                      <div
                        className="w-11 h-11 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center"
                        style={{
                          background: "linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)",
                          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15), 0 8px 24px rgba(0,0,0,0.3)",
                        }}
                      >
                        <step.icon className={`w-5 h-5 md:w-[26px] md:h-[26px] ${step.iconColor}`} />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-semibold text-text-primary mb-3 leading-tight">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-text-secondary leading-relaxed text-[15px]">
                      {step.description}
                    </p>

                    {/* Bottom accent line */}
                    <div
                      className="absolute bottom-0 left-8 right-8 h-[1px]"
                      style={{
                        background: index === 1
                          ? "linear-gradient(90deg, transparent 0%, rgba(245,169,184,0.3) 50%, transparent 100%)"
                          : "linear-gradient(90deg, transparent 0%, rgba(91,206,250,0.3) 50%, transparent 100%)",
                      }}
                    />
                  </div>

                  {/* Corner glow on hover */}
                  <div
                    className={`absolute -bottom-20 -right-20 w-40 h-40 rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-500 blur-2xl ${
                      index === 1 ? "bg-accent-pink/30" : "bg-accent-blue/30"
                    }`}
                  />
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
