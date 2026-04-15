"use client";

import { motion } from "framer-motion";
import { Shield, Activity, Heart, Users } from "lucide-react";
import { GlassCard } from "./ui/GlassCard";
import { staggerContainer, staggerItem, viewportSettings } from "@/lib/animations";

const features = [
  {
    icon: Shield,
    iconColor: "text-accent-blue",
    bgColor: "bg-accent-blue/10",
    title: "Binder aware workouts",
    description:
      "We adjust exercise selection, load, and rest on days you are binding, and clearly label binder friendly exercises.",
  },
  {
    icon: Activity,
    iconColor: "text-accent-pink",
    bgColor: "bg-accent-pink/10",
    title: "HRT and post-op aware programming",
    description:
      "Workouts respond to where you are in your journey, for example more conservative load early after surgery, realistic expectations for strength and fatigue.",
  },
  {
    icon: Heart,
    iconColor: "text-accent-blue",
    bgColor: "bg-accent-blue/10",
    title: "Affirming by design, not as an afterthought",
    description:
      "Chosen name and pronouns everywhere, flexible language for body parts, workout options that lower dysphoria rather than spike it.",
  },
  {
    icon: Users,
    iconColor: "text-accent-pink",
    bgColor: "bg-accent-pink/10",
    title: "Built by someone who actually cares",
    description:
      "This is not a random investor idea, it comes from lived experience in sports and the trans community, translated into a product built for us.",
  },
];

export function Differentiators() {
  return (
    <section id="features" className="py-16 md:py-24 bg-background-secondary/50">
      <div className="max-w-6xl mx-auto px-5 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportSettings}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
            What makes Trans Health & Fitness different
          </h2>
          <p className="text-base md:text-lg text-text-secondary max-w-[720px] mx-auto leading-[1.6] md:leading-[1.7]">
            Built from the ground up for trans and non-binary bodies.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={viewportSettings}
          className="grid md:grid-cols-2 gap-4 md:gap-6"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={staggerItem}>
              <GlassCard className="h-full" animate={false}>
                <div
                  className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-5`}
                >
                  <feature.icon size={24} className={feature.iconColor} />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
