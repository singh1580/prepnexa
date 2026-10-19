"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type HeroSlide = {
  src: string;
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
  { src: "/images/heroes/home-knowledge-orbit.webp", label: "Knowledge orbit" },
  { src: "/images/heroes/home-knowledge-city.webp", label: "Knowledge city" },
  { src: "/images/heroes/home-path-progress.webp", label: "Path to progress" },
  { src: "/images/heroes/home-precision-engine.webp", label: "Precision learning engine" },
] as const;

const STUDENT_SLIDES = [
  { src: "/images/heroes/student-learning-ecosystem.webp", label: "Connected learning ecosystem" },
  { src: "/images/heroes/student-exam-studio.webp", label: "Digital exam studio" },
  { src: "/images/heroes/student-adaptive-console.webp", label: "Adaptive learning console" },
  { src: "/images/heroes/student-learning-momentum.webp", label: "Learning momentum" },
] as const;

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={direction === "left" ? "m15 18-6-6 6-6" : "m9 6 6 6-6 6"}/></svg>;
}

function PauseIcon({ paused }: { paused: boolean }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paused ? <path d="m9 7 8 5-8 5z"/> : <><path d="M9 7v10M15 7v10"/></>}</svg>;
}

function HeroCarousel({ ariaLabel, className, intervalMs, sizes, slides }: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [interactionPaused, setInteractionPaused] = useState(false);
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
    if (userPaused || interactionPaused || reducedMotion || !pageVisible) return;
    const timer = window.setInterval(showNext, intervalMs);
    return () => window.clearInterval(timer);
  }, [interactionPaused, intervalMs, pageVisible, reducedMotion, showNext, userPaused]);

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
    onMouseEnter={() => setInteractionPaused(true)}
    onMouseLeave={() => setInteractionPaused(false)}
    onFocusCapture={() => setInteractionPaused(true)}
    onBlurCapture={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setInteractionPaused(false);
    }}
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
        <Image
          src={slide.src}
          alt=""
          fill
          priority={index === 0}
          loading={index === 0 ? "eager" : "lazy"}
          sizes={sizes}
        />
      </div>)}
    </div>

    <div className="hero-carousel-controls">
      <button type="button" className="hero-carousel-arrow" onClick={showPrevious} aria-label="Show previous image"><ArrowIcon direction="left"/></button>
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
      <button
        type="button"
        className="hero-carousel-toggle"
        onClick={() => setUserPaused((paused) => !paused)}
        aria-label={userPaused ? "Play automatic images" : "Pause automatic images"}
        aria-pressed={userPaused}
      ><PauseIcon paused={userPaused}/></button>
    </div>
    <span className="sr-only">Image {activeIndex + 1} of {slides.length}: {slides[activeIndex].label}</span>
  </div>;
}

export function HomeHeroCarousel() {
  return <HeroCarousel ariaLabel="Prepstore learning highlights" className="home-hero-carousel" intervalMs={7000} sizes="100vw" slides={HOME_SLIDES}/>;
}

export function StudentHeroCarousel() {
  return <HeroCarousel ariaLabel="Prepstore student learning highlights" className="student-hero-carousel" intervalMs={8000} sizes="(max-width: 800px) 100vw, 75vw" slides={STUDENT_SLIDES}/>;
}
