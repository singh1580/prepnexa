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
  className: string;
  intervalMs: number;
  sizes: string;
  slides: readonly HeroSlide[];
};

const HOME_SLIDES = [
  { src: "/images/heroes/home-knowledge-orbit.webp", responsiveSrc: "/images/heroes/home-knowledge-orbit-responsive.webp", label: "Knowledge orbit" },
  { src: "/images/heroes/home-knowledge-city.webp", responsiveSrc: "/images/heroes/home-knowledge-city-responsive.webp", label: "Knowledge city" },
  { src: "/images/heroes/home-path-progress.webp", responsiveSrc: "/images/heroes/home-path-progress-responsive.webp", label: "Path to progress" },
  { src: "/images/heroes/home-precision-engine.webp", responsiveSrc: "/images/heroes/home-precision-engine-responsive.webp", label: "Precision learning engine" },
] as const;

const STUDENT_SLIDES = [
  { src: "/images/heroes/student-learning-ecosystem.webp", desktopSrc: "/images/heroes/student-learning-ecosystem-desktop.webp", label: "Connected learning ecosystem" },
  { src: "/images/heroes/student-exam-studio.webp", desktopSrc: "/images/heroes/student-exam-studio-desktop.webp", label: "Digital exam studio" },
  { src: "/images/heroes/student-adaptive-console.webp", desktopSrc: "/images/heroes/student-adaptive-console-desktop.webp", label: "Adaptive learning console" },
  { src: "/images/heroes/student-learning-momentum.webp", desktopSrc: "/images/heroes/student-learning-momentum-desktop.webp", label: "Learning momentum" },
] as const;

function HeroCarousel({ ariaLabel, className, intervalMs, sizes, slides }: HeroCarouselProps) {
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
    const updateVisibility = () => setPageVisible(document.visibilityState === "visible");
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
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

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (pointerStartX.current === null) return;
    const distance = event.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(distance) < 42) return;
    if (distance > 0) showPrevious(); else showNext();
  }

  return <div
    className={`hero-carousel ${className}`}
    role="region"
    aria-roledescription="carousel"
    aria-label={ariaLabel}
    onPointerDown={(event) => { pointerStartX.current = event.clientX; }}
    onPointerCancel={() => { pointerStartX.current = null; }}
    onPointerUp={handlePointerUp}
  >
    <div className="hero-carousel-track">
      {slides.map((slide, index) => <div
        className={`hero-carousel-slide ${slidePosition(index)}`}
        key={slide.src}
        aria-hidden={index !== activeIndex}
      >
        <picture className="hero-carousel-picture">
          {"desktopSrc" in slide && slide.desktopSrc ? (
            <source media="(min-width: 900px)" srcSet={slide.desktopSrc} />
          ) : null}
          {"responsiveSrc" in slide && slide.responsiveSrc ? (
            <source media="(max-width: 899px)" srcSet={slide.responsiveSrc} />
          ) : null}
          <Image
            src={slide.src}
            alt=""
            fill
            fetchPriority={index === 0 ? "high" : "auto"}
            loading={index === 0 ? "eager" : "lazy"}
            sizes={sizes}
            unoptimized
          />
        </picture>
      </div>)}
    </div>

    <div className="hero-carousel-controls has-dot-controls">
      <div className="hero-carousel-dots" role="group" aria-label="Choose an image">
        {slides.map((slide, index) => <button
          type="button"
          key={slide.src}
          className={index === activeIndex ? "is-active" : undefined}
          onClick={() => setActiveIndex(index)}
          aria-label={`Show image ${index + 1}: ${slide.label}`}
          aria-current={index === activeIndex ? "true" : undefined}
        />)}
      </div>
      <span className="hero-carousel-label" aria-live="polite">{slides[activeIndex].label}</span>
    </div>
    <span className="sr-only">Image {activeIndex + 1} of {slides.length}: {slides[activeIndex].label}</span>
  </div>;
}

export function HomeHeroCarousel() {
  return <HeroCarousel ariaLabel="Prepstore learning highlights" className="home-hero-carousel" intervalMs={7000} sizes="100vw" slides={HOME_SLIDES}/>;
}

export function StudentHeroCarousel() {
  return <HeroCarousel ariaLabel="Prepstore student learning highlights" className="student-hero-carousel" intervalMs={8000} sizes="(max-width: 800px) 100vw, calc(100vw - 240px)" slides={STUDENT_SLIDES}/>;
}
