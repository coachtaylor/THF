"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle, AlertCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { GlassCard } from "./ui/GlassCard";
import { GlassButton } from "./ui/GlassButton";
import { GlassInput, GlassTextarea } from "./ui/GlassInput";
import { Checkbox } from "./ui/Checkbox";
import { Select } from "./ui/Select";
import { viewportSettings } from "@/lib/animations";
import { submitBetaApplication, type BetaApplication } from "@/lib/supabase";

const selfDescriptionOptions = [
  { value: "trans_masc", label: "Trans masc" },
  { value: "trans_femme", label: "Trans femme" },
  { value: "non_binary", label: "Non-binary" },
  { value: "questioning", label: "Questioning" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const steps = [
  {
    number: 1,
    label: "About You",
    title: "Let's start with the basics",
    description: "Just a few details so we know how to reach you.",
  },
  {
    number: 2,
    label: "Your Journey",
    title: "Where you are right now",
    description: "This helps us tailor the experience. Skip anything you'd rather not share.",
  },
  {
    number: 3,
    label: "Almost There",
    title: "One last thing",
    description: "Tell us what you're hoping for, then submit.",
  },
];

type FormStatus = "idle" | "loading" | "success" | "error";

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
  }),
};

const slideTransition = {
  duration: 0.3,
  ease: [0.25, 0.1, 0.25, 1] as const,
};

function ProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <div
      className="mb-8"
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={steps.length}
      aria-label={`Application step ${currentStep} of ${steps.length}`}
    >
      {/* Step indicators */}
      <div className="flex items-center">
        {steps.map((step, i) => (
          <div key={step.number} className="flex items-center flex-1 last:flex-none">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-colors duration-300 ${
                currentStep >= step.number
                  ? "bg-accent-primary text-[#111111]"
                  : "bg-white/10 text-text-tertiary"
              }`}
            >
              {step.number}
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-[2px] mx-3 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    currentStep > step.number ? "bg-accent-primary w-full" : "bg-accent-primary w-0"
                  }`}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Step labels */}
      <div className="hidden sm:flex items-center justify-between mt-3 px-1">
        {steps.map((step) => (
          <span
            key={step.number}
            className={`text-xs transition-colors duration-300 ${
              currentStep >= step.number
                ? "text-text-primary font-medium"
                : "text-text-tertiary"
            }`}
          >
            {step.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ApplicationForm() {
  const [formData, setFormData] = useState({
    name: "",
    pronouns: "",
    email: "",
    socialHandle: "",
    selfDescription: "",
    statusHrt: false,
    statusBinding: false,
    statusPreSurgery: false,
    statusPostSurgery: false,
    statusNone: false,
    helpWith: "",
    interestedInBeta: false,
    agreesToGuidelines: false,
  });
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const canAdvanceStep1 = formData.name.trim() !== "" && formData.email.trim() !== "";

  const goNext = useCallback(() => {
    if (currentStep < 3) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep]);

  const goBack = useCallback(() => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const application: BetaApplication = {
      name: formData.name,
      pronouns: formData.pronouns || undefined,
      email: formData.email,
      social_handle: formData.socialHandle || undefined,
      self_description: formData.selfDescription || undefined,
      status_hrt: formData.statusHrt,
      status_binding: formData.statusBinding,
      status_pre_surgery: formData.statusPreSurgery,
      status_post_surgery: formData.statusPostSurgery,
      status_none: formData.statusNone,
      help_with: formData.helpWith || undefined,
      interested_in_beta: formData.interestedInBeta,
      agrees_to_guidelines: formData.agreesToGuidelines,
    };

    const result = await submitBetaApplication(application);

    if (result.success) {
      setStatus("success");
      setTimeout(() => {
        document.getElementById("apply")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    } else {
      setStatus("error");
      setErrorMessage(result.error || "Something went wrong. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <section id="apply" className="py-16 md:py-24 bg-background-secondary/50">
        <div className="max-w-2xl mx-auto px-5 md:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <GlassCard variant="hero" className="text-center" role="status" aria-live="polite">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} className="text-success" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Application Received
              </h2>
              <p className="text-text-secondary mb-2">
                Thank you for applying to the Founding Athlete program.
              </p>
              <p className="text-text-tertiary text-sm">
                We read every application by hand and will be in touch soon.
              </p>
            </GlassCard>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="apply" className="py-16 md:py-24 bg-background-secondary/50">
      <div className="max-w-2xl mx-auto px-5 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportSettings}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
            Apply to join the Founding Athlete Beta
          </h2>
          <p className="text-base md:text-lg text-text-secondary leading-[1.6] md:leading-[1.7]">
            Fill out the form below and we&apos;ll review your application.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportSettings}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <GlassCard animate={false}>
            <ProgressBar currentStep={currentStep} />

            <form onSubmit={handleSubmit}>
              <div className="relative">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                  {/* Step 1: About You */}
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={slideTransition}
                    >
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-text-primary mb-1">
                          {steps[0].title}
                        </h3>
                        <p className="text-sm text-text-tertiary">{steps[0].description}</p>
                      </div>

                      <div className="space-y-5">
                        <div className="grid md:grid-cols-2 gap-5">
                          <GlassInput
                            label="Name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Your name"
                            required
                          />
                          <GlassInput
                            label="Pronouns"
                            name="pronouns"
                            value={formData.pronouns}
                            onChange={handleInputChange}
                            placeholder="e.g., he/him, they/them"
                            optional
                          />
                        </div>

                        <GlassInput
                          label="Email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Your Journey */}
                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={slideTransition}
                    >
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-text-primary mb-1">
                          {steps[1].title}
                        </h3>
                        <p className="text-sm text-text-tertiary">{steps[1].description}</p>
                      </div>

                      <div className="space-y-6">
                        <Select
                          label="How do you currently describe yourself?"
                          name="selfDescription"
                          value={formData.selfDescription}
                          onChange={handleInputChange}
                          options={selfDescriptionOptions}
                          optional
                        />

                        <div>
                          <div className="flex items-baseline justify-between mb-3">
                            <label className="text-sm font-medium text-text-secondary">
                              Are you currently:
                            </label>
                            <span className="text-text-tertiary text-xs">
                              Select all that apply
                            </span>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-3">
                            <Checkbox
                              label="On HRT"
                              name="statusHrt"
                              checked={formData.statusHrt}
                              onChange={handleInputChange}
                            />
                            <Checkbox
                              label="Binding"
                              name="statusBinding"
                              checked={formData.statusBinding}
                              onChange={handleInputChange}
                            />
                            <Checkbox
                              label="Pre gender-affirming surgery"
                              name="statusPreSurgery"
                              checked={formData.statusPreSurgery}
                              onChange={handleInputChange}
                            />
                            <Checkbox
                              label="Post gender-affirming surgery"
                              name="statusPostSurgery"
                              checked={formData.statusPostSurgery}
                              onChange={handleInputChange}
                            />
                            <Checkbox
                              label="None of the above"
                              name="statusNone"
                              checked={formData.statusNone}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Almost There */}
                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={slideTransition}
                    >
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-text-primary mb-1">
                          {steps[2].title}
                        </h3>
                        <p className="text-sm text-text-tertiary">{steps[2].description}</p>
                      </div>

                      <div className="space-y-6">
                        <GlassTextarea
                          label="What do you most want this app to help you with?"
                          name="helpWith"
                          value={formData.helpWith}
                          onChange={handleInputChange}
                          placeholder="Tell us about your fitness goals and what you're hoping Trans Health & Fitness can help with..."
                          optional
                        />

                        <div className="space-y-3">
                          <Checkbox
                            label="I am interested in early beta access"
                            name="interestedInBeta"
                            checked={formData.interestedInBeta}
                            onChange={handleInputChange}
                          />
                          <Checkbox
                            label={
                              <>
                                I agree to respect other testers and follow the{" "}
                                <a
                                  href="/community-guidelines"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-accent-primary hover:underline focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2 rounded-sm"
                                >
                                  community guidelines
                                </a>
                              </>
                            }
                            name="agreesToGuidelines"
                            checked={formData.agreesToGuidelines}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div role="alert" aria-live="polite">
                          {status === "error" && (
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-error/10 border border-error/20">
                              <AlertCircle size={20} className="text-error flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-error">{errorMessage}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Navigation buttons */}
              <div className="mt-8 pt-6 border-t border-white/[0.06] space-y-3">
                {currentStep < 3 && (
                  <GlassButton
                    type="button"
                    variant="primary"
                    onClick={goNext}
                    disabled={currentStep === 1 && !canAdvanceStep1}
                    className="w-full min-h-[52px] justify-center"
                  >
                    Continue
                    <ChevronRight size={18} />
                  </GlassButton>
                )}

                {currentStep === 3 && (
                  <GlassButton
                    type="submit"
                    variant="primary"
                    disabled={
                      status === "loading" ||
                      !formData.name ||
                      !formData.email ||
                      !formData.agreesToGuidelines
                    }
                    className="w-full min-h-[52px] justify-center"
                    icon={<Send size={18} />}
                  >
                    {status === "loading" ? "Submitting..." : "Submit Application"}
                  </GlassButton>
                )}

                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={goBack}
                    className="w-full flex items-center justify-center gap-1.5 text-sm text-text-tertiary hover:text-text-secondary transition-colors py-2 focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2 rounded-md"
                  >
                    <ChevronLeft size={16} />
                    Back
                  </button>
                )}
              </div>

              <p className="text-xs text-text-tertiary text-center mt-6 max-w-md mx-auto leading-[1.6]">
                We read every application by hand. This is about building something safe and sustainable for our community, not chasing download numbers.
              </p>
            </form>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}
