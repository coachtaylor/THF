"use client";

import { motion } from "framer-motion";
import { BookOpen, ShieldCheck, Users } from "lucide-react";
import { staggerContainer, staggerItem, viewportSettings } from "@/lib/animations";

const pillars = [
  {
    icon: BookOpen,
    iconColor: "text-accent-blue",
    gradient: "from-accent-blue/20 to-accent-blue/5",
    borderGlow: "group-hover:shadow-[0_0_30px_rgba(91,206,250,0.3)]",
    title: "Evidence-informed programming",
    description:
      "We study guidelines and research from sports medicine, endocrinology, and physical therapy to understand how HRT, surgery, and binding affect training. That knowledge shapes how we set intensity, rest, progressions, and exercise selection.",
  },
  {
    icon: ShieldCheck,
    iconColor: "text-accent-pink",
    gradient: "from-accent-pink/20 to-accent-pink/5",
    borderGlow: "group-hover:shadow-[0_0_30px_rgba(245,169,184,0.3)]",
    title: "Safety filters built into the system",
    description:
      "Our workouts are generated through a safety engine that checks for red flags like heavy overhead work while binding, too-aggressive loading early in post-op recovery, or exercise volumes that don't match your experience level.",
  },
  {
    icon: Users,
    iconColor: "text-accent-blue",
    gradient: "from-accent-blue/15 via-accent-pink/10 to-transparent",
    borderGlow: "group-hover:shadow-[0_0_30px_rgba(91,206,250,0.2),0_0_30px_rgba(245,169,184,0.2)]",
    title: "Lived experience as a requirement, not an afterthought",
    description:
      "Research is essential, but it doesn't capture everything. That's why we actively collect feedback from trans and non-binary athletes and coaches. When something feels off, dysphoria-spiking, or just unrealistic, we adjust. The app learns with you, not just about you.",
  },
];

export function WhyTrustUs() {
  return (
    <section id="research" className="py-16 md:py-24 lg:py-32 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportSettings}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 md:mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
            Rooted in research, shaped by lived experience
          </h2>
          <p className="text-lg text-text-secondary max-w-3xl mx-auto leading-relaxed">
            Trans Health & Fitness gives you workouts that respect chest binding, HRT, and gender
            affirming surgeries, so you can train hard without fighting your body or your
            gender. Every program is powered by evidence informed training rules grounded
            in reliable research on trans health and recovery.
          </p>
        </motion.div>

        <motion.ul
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportSettings}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-12 max-w-4xl mx-auto"
        >
          {[
            { text: "Exercise and cardiovascular safety", color: "blue" },
            { text: "Hormone therapy and training capacity", color: "pink" },
            { text: "Post-operative recovery timelines and restrictions", color: "blue" },
            { text: "Pain, fatigue, and injury risk in LGBTQ+ populations", color: "pink" },
          ].map((item, index) => (
            <motion.li
              key={index}
              className="group relative"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              {/* Glow effect on hover */}
              <div
                className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl ${
                  item.color === "blue" ? "bg-accent-blue/20" : "bg-accent-pink/20"
                }`}
              />

              {/* Card content */}
              <div
                className="relative flex items-center justify-center text-center p-3 md:p-5 rounded-xl md:rounded-2xl text-text-secondary text-sm h-full min-h-[80px] md:min-h-[100px]"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 24px rgba(0,0,0,0.2)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {/* Top accent line */}
                <div
                  className={`absolute top-0 left-1/2 -translate-x-1/2 w-12 h-[2px] rounded-full ${
                    item.color === "blue" ? "bg-accent-blue/50" : "bg-accent-pink/50"
                  }`}
                />

                <span className="group-hover:text-text-primary transition-colors duration-300">
                  {item.text}
                </span>
              </div>
            </motion.li>
          ))}
        </motion.ul>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportSettings}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-base md:text-lg text-text-secondary max-w-3xl mx-auto text-center mb-10 md:mb-16 leading-relaxed"
        >
          We combine that foundation with real-world feedback from trans and non-binary
          athletes to make sure the app feels as good in your body as it looks on paper.
        </motion.p>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={viewportSettings}
          className="grid md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12"
        >
          {pillars.map((pillar, index) => (
            <motion.div key={pillar.title} variants={staggerItem} className="group">
              {/* Outer card container with glow effect */}
              <div
                className={`relative h-full rounded-[2rem] p-[1px] transition-all duration-500 ${pillar.borderGlow}`}
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)",
                }}
              >
                {/* Inner card */}
                <div className="relative h-full rounded-[2rem] bg-background-card/80 backdrop-blur-xl overflow-hidden">
                  {/* Gradient background orb */}
                  <div
                    className={`absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br ${pillar.gradient} blur-3xl opacity-60 group-hover:opacity-80 transition-opacity duration-500`}
                  />

                  {/* Decorative dots pattern */}
                  <div className="absolute top-6 right-6 grid grid-cols-3 gap-1 opacity-30">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-white/40" />
                    ))}
                  </div>

                  {/* Content container */}
                  <div className="relative p-5 md:p-8">
                    {/* Icon container */}
                    <div
                      className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6`}
                      style={{
                        background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)",
                        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.1), 0 4px 20px rgba(0,0,0,0.3)",
                      }}
                    >
                      <pillar.icon className={`w-6 h-6 md:w-7 md:h-7 ${pillar.iconColor}`} />
                    </div>

                    {/* Title with subtle highlight */}
                    <h3 className="text-xl font-semibold text-text-primary mb-3 relative">
                      {pillar.title}
                      <span className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-gradient-to-b from-accent-blue to-accent-pink opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </h3>

                    {/* Description */}
                    <p className="text-text-secondary leading-relaxed text-[15px]">
                      {pillar.description}
                    </p>

                    {/* Bottom decorative line */}
                    <div className="absolute bottom-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportSettings}
          transition={{ duration: 0.5 }}
          className="text-sm text-text-muted text-center max-w-2xl mx-auto"
        >
          Trans Health & Fitness uses research to guide safer training decisions, but it does not
          replace medical advice. Always follow the recommendations of your doctor or
          surgical team.
        </motion.p>
      </div>
    </section>
  );
}
