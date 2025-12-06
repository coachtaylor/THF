"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle, AlertCircle } from "lucide-react";
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

type FormStatus = "idle" | "loading" | "success" | "error";

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
      // Scroll to the success message
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
      <section id="apply" className="py-24 md:py-32 bg-background-secondary/50">
        <div className="max-w-2xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <GlassCard variant="hero" className="text-center">
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
    <section id="apply" className="py-24 md:py-32 bg-background-secondary/50">
      <div className="max-w-2xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportSettings}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
            Apply to join the Founding Athlete Beta
          </h2>
          <p className="text-lg text-text-secondary">
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
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
                  placeholder="e.g., he/him, she/her, they/them"
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

              <GlassInput
                label="Social Media Handle"
                name="socialHandle"
                value={formData.socialHandle}
                onChange={handleInputChange}
                placeholder="@yourhandle"
                optional
              />

              <Select
                label="How do you currently describe yourself?"
                name="selfDescription"
                value={formData.selfDescription}
                onChange={handleInputChange}
                options={selfDescriptionOptions}
                optional
              />

              <div className="space-y-3">
                <label className="block text-sm font-medium text-text-secondary">
                  Are you currently:
                  <span className="ml-1 text-text-tertiary text-xs">
                    (select all that apply)
                  </span>
                </label>
                <div className="space-y-3">
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

              <GlassTextarea
                label="What do you most want this app to help you with?"
                name="helpWith"
                value={formData.helpWith}
                onChange={handleInputChange}
                placeholder="Tell us about your fitness goals and what you're hoping Trans Health & Fitness can help with..."
                optional
              />

              <div className="pt-4 border-t border-white/[0.08] space-y-4">
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
                        className="text-accent-blue hover:underline"
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

              {status === "error" && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-error/10 border border-error/20">
                  <AlertCircle size={20} className="text-error flex-shrink-0" />
                  <p className="text-sm text-error">{errorMessage}</p>
                </div>
              )}

              <GlassButton
                type="submit"
                variant="primary"
                disabled={
                  status === "loading" ||
                  !formData.name ||
                  !formData.email ||
                  !formData.agreesToGuidelines
                }
                className="w-full"
                icon={<Send size={18} />}
              >
                {status === "loading" ? "Submitting..." : "Submit Application"}
              </GlassButton>

              <p className="text-sm text-text-tertiary text-center">
                We read every application by hand. This is about building
                something safe and sustainable for our community, not chasing
                download numbers.
              </p>
            </form>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}
