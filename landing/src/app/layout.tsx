import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://transhealthfitness.com"),
  alternates: {
    canonical: "/",
  },
  title: "Trans Health & Fitness | A fitness app that actually understands trans bodies",
  description:
    "Trans Health & Fitness gives you workouts that respect chest binding, HRT, and gender-affirming surgeries. Join the Founding Athlete Beta.",
  keywords: [
    // Core brand
    "trans health & fitness",
    "transgender workout",
    "binding safe workout",
    "HRT fitness",
    "trans athlete",
    "gender affirming fitness",
    "non-binary workout",
    // Product keywords
    "trans fitness app",
    "transgender fitness app",
    "LGBTQ fitness app",
    "queer workout app",
    "inclusive fitness app",
    // Audience keywords
    "ftm fitness",
    "ftm workout",
    "mtf fitness",
    "mtf workout",
    "transmasculine fitness",
    "transfeminine fitness",
    // Feature keywords
    "post top surgery workout",
    "post surgery exercise",
    "binding exercise safety",
    "trans bodybuilding",
    "transgender strength training",
    // Long-tail keywords
    "workout app for trans people",
    "exercise after gender affirming surgery",
    "HRT workout program",
    "trans-friendly fitness program",
  ],
  authors: [{ name: "Trans Health & Fitness" }],
  creator: "Trans Health & Fitness",
  publisher: "Trans Health & Fitness",
  category: "Health & Fitness",
  openGraph: {
    title: "Trans Health & Fitness | A fitness app that actually understands trans bodies",
    description:
      "Trans Health & Fitness gives you workouts that respect chest binding, HRT, and gender-affirming surgeries. Join the Founding Athlete Beta.",
    type: "website",
    locale: "en_US",
    siteName: "Trans Health & Fitness",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trans Health & Fitness | A fitness app that actually understands trans bodies",
    description:
      "Trans Health & Fitness gives you workouts that respect chest binding, HRT, and gender-affirming surgeries. Join the Founding Athlete Beta.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://transhealthfitness.com/#organization",
      name: "Trans Health & Fitness",
      url: "https://transhealthfitness.com",
      description:
        "A fitness app built specifically for transgender and non-binary athletes",
    },
    {
      "@type": "WebSite",
      "@id": "https://transhealthfitness.com/#website",
      url: "https://transhealthfitness.com",
      name: "Trans Health & Fitness",
      publisher: { "@id": "https://transhealthfitness.com/#organization" },
    },
    {
      "@type": "SoftwareApplication",
      name: "Trans Health & Fitness",
      applicationCategory: "HealthApplication",
      operatingSystem: "iOS, Android",
      offers: {
        "@type": "Offer",
        price: "5.00",
        priceCurrency: "USD",
        priceValidUntil: "2025-12-31",
      },
      description:
        "Workout app that respects chest binding, HRT, and gender-affirming surgeries",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-RXX4F5BSPX"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-RXX4F5BSPX');
          `}
        </Script>
      </head>
      <body className={`${poppins.variable} font-sans antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
