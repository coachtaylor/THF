import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { WhatIs } from "@/components/WhatIs";
import { HowItWorks } from "@/components/HowItWorks";
import { WhyTrustUs } from "@/components/WhyTrustUs";
import { BetaDetails } from "@/components/BetaDetails";
import { ApplicationForm } from "@/components/ApplicationForm";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { faqData } from "@/data/faq";

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqData.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
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
    </>
  );
}
