"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ShieldCheck, Users, ChevronDown } from "lucide-react";
import { viewportSettings } from "@/lib/animations";

const pillars = [
  {
    icon: BookOpen,
    iconColor: "text-accent-blue",
    title: "Evidence-informed programming",
    description:
      "We study sports medicine, endocrinology, and physical therapy research to understand how HRT, surgery, and binding affect training — then shape intensity, rest, and exercise selection accordingly.",
  },
  {
    icon: ShieldCheck,
    iconColor: "text-accent-pink",
    title: "Safety filters built into the system",
    description:
      "A safety engine checks every workout for red flags: heavy overhead work while binding, aggressive loading in post-op recovery, or volumes that don't match your experience level.",
  },
  {
    icon: Users,
    iconColor: "text-accent-blue",
    title: "Lived experience as a requirement, not an afterthought",
    description:
      "We collect feedback from trans and non-binary athletes and coaches. When something feels off or dysphoria-spiking, we adjust. The app learns with you, not just about you.",
  },
];

function AccordionItem({
  pillar,
  isOpen,
  onToggle,
}: {
  pillar: (typeof pillars)[number];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const Icon = pillar.icon;

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-5 flex items-center gap-4 text-left"
      >
        <Icon className={`w-5 h-5 flex-shrink-0 ${pillar.iconColor}`} />
        <span className="text-lg font-medium text-text-primary flex-1">
          {pillar.title}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex-shrink-0"
        >
          <ChevronDown size={20} className="text-text-tertiary" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="px-6 pb-5 pt-0 pl-[3.75rem]">
              <p className="text-text-secondary leading-relaxed">
                {pillar.description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function WhyTrustUs() {
  const [openTitle, setOpenTitle] = useState<string>(pillars[0].title);

  return (
    <section id="research" className="py-16 md:py-24 bg-background">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportSettings}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
            Rooted in research, shaped by lived experience
          </h2>
          <p className="text-base md:text-lg text-text-secondary max-w-[720px] mx-auto leading-[1.6] md:leading-[1.7]">
            Every workout is shaped by peer-reviewed research and real feedback from trans and non-binary athletes.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportSettings}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-3 mb-10 md:mb-14"
        >
          {pillars.map((pillar) => (
            <AccordionItem
              key={pillar.title}
              pillar={pillar}
              isOpen={openTitle === pillar.title}
              onToggle={() =>
                setOpenTitle(openTitle === pillar.title ? "" : pillar.title)
              }
            />
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportSettings}
          transition={{ duration: 0.5 }}
          className="text-xs text-text-muted text-center max-w-2xl mx-auto italic"
        >
          Trans Health & Fitness uses research to guide safer training decisions, but it does not
          replace medical advice. Always follow the recommendations of your doctor or
          surgical team.
        </motion.p>
      </div>
    </section>
  );
}
