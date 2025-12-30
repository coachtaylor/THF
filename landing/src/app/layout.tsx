import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trans Health & Fitness | A fitness app that actually understands trans bodies",
  description:
    "Trans Health & Fitness gives you workouts that respect chest binding, HRT, and gender-affirming surgeries. Join the Founding Athlete Beta.",
  keywords: [
    "trans health & fitness",
    "transgender workout",
    "binding safe workout",
    "HRT fitness",
    "trans athlete",
    "gender affirming fitness",
    "non-binary workout",
  ],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${poppins.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
