"use client";

import { Instagram, Mail } from "lucide-react";

function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

const links = [
  { label: "Resources", href: "/resources" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Community Guidelines", href: "/community-guidelines" },
];

const socials = [
  { label: "Email us", href: "mailto:taylor@transhealthfitness.com", icon: Mail },
  { label: "Instagram", href: "#", icon: Instagram },
  { label: "TikTok", href: "#", icon: TikTokIcon },
];

export function Footer() {
  return (
    <footer className="bg-[#0a0a0a] pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-5 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
          {/* Column 1: Brand */}
          <div>
            <span className="text-lg font-bold text-text-primary block mb-3">
              Trans Health & <span className="text-accent-blue">Fitness</span>
            </span>
            <p className="text-sm text-text-tertiary leading-relaxed max-w-xs">
              Fitness programming built for trans and non-binary bodies. Train
              hard without fighting your gender.
            </p>
          </div>

          {/* Column 2: Links */}
          <div>
            <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
              Links
            </h4>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-text-tertiary hover:text-text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Connect */}
          <div>
            <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
              Connect
            </h4>
            <ul className="space-y-2">
              {socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    className="inline-flex items-center gap-2 text-sm text-text-tertiary hover:text-text-primary transition-colors"
                  >
                    <social.icon size={18} />
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/[0.08]">
          <p className="text-sm text-text-tertiary text-center">
            &copy; 2026 Trans Health & Fitness. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
