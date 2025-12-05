import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { WhatIs } from "@/components/WhatIs";
import { HowItWorks } from "@/components/HowItWorks";
import { WhyTrustUs } from "@/components/WhyTrustUs";
import { BetaDetails } from "@/components/BetaDetails";
import { ApplicationForm } from "@/components/ApplicationForm";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <WhatIs />
      <WhyTrustUs />
      <HowItWorks />
      <BetaDetails />
      <ApplicationForm />
      <FAQ />
      <Footer />
    </main>
  );
}
