"use client";

import { useEffect } from "react";

const REVEAL_SELECTOR = [
  "main section:not(.sticky)",
  "main article",
  "main aside",
  "main .grid > div",
  "main .grid > a",
  "footer > div",
].join(", ");

export default function ScrollReveal() {
  useEffect(() => {
    if (typeof window === "undefined" || typeof Element.prototype.animate !== "function") {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const animated = new WeakSet<Element>();
    const pendingStagger = new WeakMap<Element, number>();

    const animateIn = (el: Element, delayMs = 0) => {
      try {
        el.animate(
          [
            { opacity: 0, transform: "translate3d(0, 20px, 0)" },
            { opacity: 1, transform: "translate3d(0, 0, 0)" },
          ],
          {
            duration: 1600,
            delay: delayMs,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "both",
          }
        );
      } catch {
        // Ignore if element is detached
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = pendingStagger.get(entry.target) ?? 0;
            animateIn(entry.target, delay);
            io.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -24px 0px",
      }
    );

    const registerElements = () => {
      const elements = document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR);
      elements.forEach((el, index) => {
        if (animated.has(el)) return;

        const computedPosition = window.getComputedStyle(el).position;
        if (computedPosition === "sticky" || computedPosition === "fixed") {
          return;
        }

        animated.add(el);

        let delay = (index % 3) * 40;
        if (el.parentElement?.classList.contains("grid")) {
          const siblings = Array.from(el.parentElement.children);
          const siblingIndex = siblings.indexOf(el);
          if (siblingIndex >= 0) {
            delay = (siblingIndex % 6) * 60;
          }
        }
        pendingStagger.set(el, delay);

        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
          animateIn(el, delay);
        } else {
          io.observe(el);
        }
      });
    };

    // Wait until after hydration frame before observing
    const timerId = window.setTimeout(() => {
      registerElements();
    }, 60);

    const mo = new MutationObserver(() => {
      registerElements();
    });

    mo.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      window.clearTimeout(timerId);
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
