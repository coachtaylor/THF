"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-accent-primary-muted border border-accent-primary/30 text-accent-primary backdrop-blur-sm transition-all duration-300 hover:bg-accent-primary/30 hover:scale-110 focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2"
    >
      <ArrowUp size={20} />
    </button>
  );
}
