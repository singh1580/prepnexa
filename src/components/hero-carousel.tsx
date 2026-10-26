"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type HeroSlide = {
  src: string;
  responsiveSrc?: string;
  desktopSrc?: string;
  label: string;
};

type HeroCarouselProps = {
  ariaLabel: string;
  intervalMs: number;
  sizes: string;
  slides: readonly HeroSlide[];
  variant: "home" | "student";
};

const HOME_SLIDES = [
  {
    src: "/images/heroes/home-knowledge-orbit.webp",
    responsiveSrc: "/images/heroes/home-knowledge-orbit-responsive.webp",
    label: "Knowledge orbit",
  },
  {
    src: "/images/heroes/home-knowledge-city.webp",
    responsiveSrc: "/images/heroes/home-knowledge-city-responsive.webp",
    label: "Knowledge city",
  },
  {
    src: "/images/heroes/home-path-progress.webp",
    responsiveSrc: "/images/heroes/home-path-progress-responsive.webp",
    label: "Path to progress",
  },
  {
    src: "/images/heroes/home-precision-engine.webp",
    responsiveSrc: "/images/heroes/home-precision-engine-responsive.webp",
    label: "Precision learning engine",
  },
] as const;

const STUDENT_SLIDES = [
  {
    src: "/images/heroes/student-learning-ecosystem.webp",
    desktopSrc: "/images/heroes/student-learning-ecosystem-desktop.webp",
    label: "Connected learning ecosystem",
  },
  {
    src: "/images/heroes/student-exam-studio.webp",
    desktopSrc: "/images/heroes/student-exam-studio-desktop.webp",
    label: "Digital exam studio",
  },
  {
    src: "/images/heroes/student-adaptive-console.webp",
    desktopSrc: "/images/heroes/student-adaptive-console-desktop.webp",
    label: "Adaptive learning console",
  },
  {
    src: "/images/heroes/student-learning-momentum.webp",
    desktopSrc: "/images/heroes/student-learning-momentum-desktop.webp",
    label: "Learning momentum",
  },
] as const;

function HeroCarousel({
  ariaLabel,
  intervalMs,
  sizes,
  slides,
  variant,
}: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const pointerStartX = useRef<number | null>(null);

  const showPrevious = useCallback(() => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const showNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const updateVisibility = () =>
      setPageVisible(document.visibilityState === "visible");
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () =>
      document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    if (reducedMotion || !pageVisible) return;
    const timer = window.setInterval(showNext, intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, pageVisible, reducedMotion, showNext]);

  function slidePosition(index: number) {
    const distance = (index - activeIndex + slides.length) % slides.length;
    if (distance === 0) return "is-active";
    if (distance === 1) return "is-next";
    if (distance === slides.length - 1) return "is-previous";
    return "is-far";
  }

  function slideClass(index: number) {
    const position = slidePosition(index);
    const base =
      "absolute inset-0 opacity-0 invisible will-change-[opacity,transform] transition-[opacity,transform,visibility] duration-[720ms] ease-[cubic-bezier(.22,.61,.36,1)] motion-reduce:transition-none";
    if (position === "is-active")
      return `${base} visible translate-x-0 scale-100 opacity-100 [transition-delay:0s]`;
    if (position === "is-previous")
      return `${base} -translate-x-[4%] scale-[1.015] [transition-delay:0s,0s,.9s]`;
    return `${base} translate-x-[4%] scale-[1.015] [transition-delay:0s,0s,.9s]`;
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (pointerStartX.current === null) return;
    const distance = event.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(distance) < 42) return;
    if (distance > 0) showPrevious();
    else showNext();
  }

  return (
    <div
      className={`absolute inset-0 overflow-hidden [touch-action:pan-y] ${variant === "home" ? "home-hero-carousel" : "student-hero-carousel"}`}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      onPointerDown={(event) => {
        pointerStartX.current = event.clientX;
      }}
      onPointerCancel={() => {
        pointerStartX.current = null;
      }}
      onPointerUp={handlePointerUp}
    >
      <div className="absolute inset-0 overflow-hidden">
        {slides.map((slide, index) => (
          <div
            className={slideClass(index)}
            key={slide.src}
            aria-hidden={index !== activeIndex}
          >
            <picture className="absolute inset-0 block">
              {"desktopSrc" in slide && slide.desktopSrc ? (
                <source media="(min-width: 900px)" srcSet={slide.desktopSrc} />
              ) : null}
              {"responsiveSrc" in slide && slide.responsiveSrc ? (
                <source
                  media="(max-width: 899px)"
                  srcSet={slide.responsiveSrc}
                />
              ) : null}
              <Image
                className="pointer-events-none object-cover object-right select-none"
                src={slide.src}
                alt=""
                fill
                fetchPriority={index === 0 ? "high" : "auto"}
                loading={index === 0 ? "eager" : "lazy"}
                sizes={sizes}
                unoptimized
              />
            </picture>
          </div>
        ))}
      </div>

      <div
        className={`absolute z-[4] flex items-center gap-[0.72rem] ${variant === "home" ? "bottom-[6.25rem] left-[clamp(1rem,7vw,7.2rem)] max-[560px]:bottom-[3.75rem] max-[560px]:left-4" : "bottom-[0.9rem] left-[2.2rem] max-[560px]:bottom-3 max-[560px]:left-[0.85rem]"}`}
      >
        <div
          className="flex items-center gap-[0.32rem] px-[0.12rem]"
          role="group"
          aria-label="Choose an image"
        >
          {slides.map((slide, index) => (
            <button
              type="button"
              key={slide.src}
              className={`h-[0.42rem] appearance-none rounded-full border-0 p-0 transition-[width,background-color] duration-[250ms] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-prep-orange ${index === activeIndex ? "w-[1.18rem] bg-prep-orange" : "w-[0.42rem] bg-[#b8b4af]"}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Show image ${index + 1}: ${slide.label}`}
              aria-current={index === activeIndex ? "true" : undefined}
            />
          ))}
        </div>
        <span
          className="max-w-48 overflow-hidden text-[0.7rem] leading-none font-[780] text-ellipsis whitespace-nowrap text-[#3b3f43]"
          aria-live="polite"
        >
          {slides[activeIndex].label}
        </span>
      </div>
      <span className="sr-only">
        Image {activeIndex + 1} of {slides.length}: {slides[activeIndex].label}
      </span>
    </div>
  );
}

export function HomeHeroCarousel() {
  return (
    <HeroCarousel
      ariaLabel="Prepstore learning highlights"
      intervalMs={7000}
      sizes="100vw"
      slides={HOME_SLIDES}
      variant="home"
    />
  );
}

export function StudentHeroCarousel() {
  return (
    <HeroCarousel
      ariaLabel="Prepstore student learning highlights"
      intervalMs={8000}
      sizes="(max-width: 899px) 100vw, calc(100vw - 240px)"
      slides={STUDENT_SLIDES}
      variant="student"
    />
  );
}
