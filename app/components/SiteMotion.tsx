"use client";

import { useEffect } from "react";

/** Progressive enhancement: content remains visible if JS or motion is unavailable. */
export function SiteMotion() {
  useEffect(() => {
    if (
      !window.matchMedia("(min-width: 821px) and (hover: hover) and (prefers-reduced-motion: no-preference)").matches ||
      !window.IntersectionObserver
    ) return;

    const sections = [...document.querySelectorAll<HTMLElement>("[data-scroll-reveal]")];
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.remove("reveal-pending");
        observer.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    for (const section of sections) {
      if (section.getBoundingClientRect().top > window.innerHeight * 0.92) {
        section.classList.add("reveal-pending");
        observer.observe(section);
      }
    }
    return () => {
      observer.disconnect();
      for (const section of sections) section.classList.remove("reveal-pending");
    };
  }, []);

  return null;
}
