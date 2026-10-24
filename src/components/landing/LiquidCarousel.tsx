import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Check, ShieldCheck, FileSearch, UserCheck } from 'lucide-react';
import { CAROUSEL_SLIDES } from '../../data/demoData';

export const LiquidCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const totalSlides = CAROUSEL_SLIDES.length;

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  }, [totalSlides]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  }, [totalSlides]);

  // Global arrow keys when carousel section is hovered or focused
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';
      if (isInput) return;

      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    const threshold = 40;
    if (diff > threshold) {
      handleNext();
    } else if (diff < -threshold) {
      handlePrev();
    }
    touchStartXRef.current = null;
  };

  const getSlideIcon = (index: number) => {
    switch (index) {
      case 0:
        return <ShieldCheck size={16} color="var(--accent-lime)" />;
      case 1:
        return <FileSearch size={16} color="var(--accent-amber)" />;
      case 2:
      default:
        return <UserCheck size={16} color="var(--accent-violet)" />;
    }
  };

  return (
    <section
      id="product"
      style={{
        padding: '96px 0',
        position: 'relative',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(9, 11, 16, 0.70)'
      }}
    >
      <div className="container" style={{ position: 'relative' }}>
        {/* Ambient liquid light glow behind the carousel */}
        <div
          className="animate-liquid-drift-a"
          style={{
            position: 'absolute',
            top: '20%',
            right: '5%',
            width: '420px',
            height: '420px',
            borderRadius: '50%',
            background:
              currentIndex === 0
                ? 'radial-gradient(circle, rgba(157, 140, 255, 0.16) 0%, transparent 70%)'
                : currentIndex === 1
                ? 'radial-gradient(circle, rgba(214, 255, 112, 0.16) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(94, 158, 255, 0.16) 0%, transparent 70%)',
            filter: 'blur(75px)',
            pointerEvents: 'none',
            zIndex: 0,
            transition: 'background 800ms ease'
          }}
        />

        {/* Section Header */}
        <div style={{ maxWidth: '680px', marginBottom: '36px', position: 'relative', zIndex: 1 }}>
          <div className="glass-pill glass-pill-accent" style={{ marginBottom: '14px' }}>
            <span>THE GOVERNANCE ARCHITECTURE</span>
          </div>
          <h2
            style={{
              fontSize: 'clamp(30px, 4.2vw, 44px)',
              fontWeight: 800,
              letterSpacing: '-0.035em',
              marginBottom: '14px',
              color: 'var(--text-primary)'
            }}
          >
            Liquid Control: Three Core Guardrails
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.6 }}>
            BrandGuard unifies guidelines ingestion, sentence-level forensic evidence checks, and sovereign human approvals into a cohesive, zero-drift engine.
          </p>
        </div>

        {/* Top Capability Selector Tabs */}
        <div
          role="tablist"
          aria-label="Capabilities"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '24px',
            position: 'relative',
            zIndex: 1
          }}
        >
          {CAROUSEL_SLIDES.map((slide, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={slide.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`carousel-slide-${slide.id}`}
                onClick={() => setCurrentIndex(idx)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 20px',
                  borderRadius: 'var(--radius-full)',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(214, 255, 112, 0.15) 0%, rgba(214, 255, 112, 0.05) 100%)'
                    : 'rgba(255, 255, 255, 0.035)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--accent-lime-border)' : 'rgba(255, 255, 255, 0.1)',
                  borderTopColor: isActive ? 'rgba(214, 255, 112, 0.5)' : 'rgba(255, 255, 255, 0.18)',
                  boxShadow: isActive ? '0 0 16px rgba(214, 255, 112, 0.18)' : 'none',
                  color: isActive ? 'var(--accent-lime)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '13px',
                  transition: 'all var(--transition-fast)',
                  cursor: 'pointer'
                }}
                className="carousel-tab-btn"
              >
                {getSlideIcon(idx)}
                <span>{slide.title}</span>
              </button>
            );
          })}
        </div>

        {/* Carousel Viewport Container (Floating Optical Glass) */}
        <div
          className="carousel-viewport liquid-glass-elevated glass-specular glass-edge-sheen"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            position: 'relative',
            zIndex: 1,
            background: 'linear-gradient(145deg, rgba(18, 24, 38, 0.48) 0%, rgba(9, 12, 19, 0.62) 100%)',
            backdropFilter: 'blur(28px) saturate(185%)',
            WebkitBackdropFilter: 'blur(28px) saturate(185%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderTopColor: 'rgba(255, 255, 255, 0.28)',
            borderBottomColor: 'rgba(255, 255, 255, 0.06)'
          }}
        >
          {/* Sliding Flex Track */}
          <div
            className="carousel-track"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
              position: 'relative',
              zIndex: 2
            }}
          >
            {CAROUSEL_SLIDES.map((slide) => (
              <div
                key={slide.id}
                id={`carousel-slide-${slide.id}`}
                className="carousel-slide"
                style={{
                  padding: 'clamp(28px, 4.5vw, 48px)',
                  boxSizing: 'border-box'
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '40px',
                    alignItems: 'center'
                  }}
                >
                  {/* Left Column: Descriptive Content */}
                  <div>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        color: 'var(--accent-lime)',
                        marginBottom: '10px'
                      }}
                    >
                      <span>{slide.badge}</span>
                    </div>

                    <h3
                      style={{
                        fontSize: 'clamp(24px, 3.2vw, 34px)',
                        fontWeight: 800,
                        letterSpacing: '-0.025em',
                        color: 'var(--text-primary)',
                        marginBottom: '8px'
                      }}
                    >
                      {slide.title}
                    </h3>

                    <p
                      style={{
                        fontSize: '16px',
                        color: 'var(--accent-lime)',
                        fontWeight: 500,
                        marginBottom: '16px'
                      }}
                    >
                      {slide.tagline}
                    </p>

                    <p
                      style={{
                        fontSize: '15px',
                        lineHeight: 1.6,
                        color: 'var(--text-secondary)',
                        marginBottom: '24px'
                      }}
                    >
                      {slide.description}
                    </p>

                    {/* Feature Check Bullets */}
                    <ul
                      style={{
                        listStyle: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      {slide.keyPoints.map((point, pIdx) => (
                        <li
                          key={pIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            fontSize: '14px',
                            color: 'var(--text-primary)'
                          }}
                        >
                          <div
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              background: 'var(--accent-lime-dim)',
                              border: '1px solid var(--accent-lime-border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              marginTop: '2px'
                            }}
                          >
                            <Check size={11} color="var(--accent-lime)" strokeWidth={3} />
                          </div>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right Column: Visual Telemetry Card (Layered Optical Glass Sheet) */}
                  <div>
                    <div
                      className="glass-sheet-neutral glass-specular"
                      style={{
                        padding: '24px',
                        borderRadius: 'var(--radius-lg)',
                        background: 'linear-gradient(135deg, rgba(16, 21, 33, 0.52) 0%, rgba(9, 12, 19, 0.65) 100%)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderTopColor: 'rgba(255, 255, 255, 0.24)',
                        boxShadow: 'var(--glass-inner-specular), 0 16px 36px -8px rgba(0, 0, 0, 0.5)'
                      }}
                    >
                      {/* Sub-card header */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingBottom: '14px',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                          marginBottom: '18px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: 'var(--accent-lime)',
                              boxShadow: '0 0 10px var(--accent-lime)'
                            }}
                          />
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {slide.mockCard.title}
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {slide.mockCard.status}
                        </span>
                      </div>

                      {/* Highlight Pill & Statement */}
                      <div
                        style={{
                          padding: '16px',
                          borderRadius: 'var(--radius-md)',
                          background: 'rgba(214, 255, 112, 0.05)',
                          border: '1px solid var(--accent-lime-border)',
                          borderTopColor: 'rgba(214, 255, 112, 0.45)',
                          marginBottom: '20px'
                        }}
                      >
                        <div
                          style={{
                            fontSize: '11px',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--accent-lime)',
                            textTransform: 'uppercase',
                            marginBottom: '6px'
                          }}
                        >
                          {slide.mockCard.pill}
                        </div>
                        <div
                          style={{
                            fontSize: '14px',
                            color: 'var(--text-primary)',
                            fontWeight: 500
                          }}
                        >
                          {slide.mockCard.highlight}
                        </div>
                      </div>

                      {/* Micro Stats Grid */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '12px'
                        }}
                      >
                        {slide.mockCard.stats.map((stat, sIdx) => (
                          <div
                            key={sIdx}
                            style={{
                              padding: '10px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid rgba(255, 255, 255, 0.06)',
                              borderTopColor: 'rgba(255, 255, 255, 0.12)'
                            }}
                          >
                            <div
                              style={{
                                fontSize: '11px',
                                color: 'var(--text-tertiary)',
                                marginBottom: '4px'
                              }}
                            >
                              {stat.label}
                            </div>
                            <div
                              style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                fontFamily: 'var(--font-mono)'
                              }}
                            >
                              {stat.val}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel Bottom Navigation Controls & Indicators Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '22px',
            padding: '0 4px',
            position: 'relative',
            zIndex: 1
          }}
        >
          {/* Clickable Slide Indicator Pills */}
          <div
            role="tablist"
            aria-label="Carousel slide selection"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {CAROUSEL_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                role="tab"
                aria-selected={idx === currentIndex}
                aria-label={`Slide ${idx + 1} of ${totalSlides}: ${slide.title}`}
                onClick={() => setCurrentIndex(idx)}
                style={{
                  height: '8px',
                  width: idx === currentIndex ? '36px' : '12px',
                  borderRadius: '4px',
                  background:
                    idx === currentIndex
                      ? 'var(--accent-lime)'
                      : 'rgba(255, 255, 255, 0.18)',
                  boxShadow:
                    idx === currentIndex ? '0 0 10px rgba(214, 255, 112, 0.4)' : 'none',
                  transition: 'all var(--transition-normal)',
                  cursor: 'pointer'
                }}
                className="carousel-indicator-btn"
              />
            ))}
            <span
              style={{
                marginLeft: '10px',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-tertiary)'
              }}
            >
              0{currentIndex + 1} / 0{totalSlides}
            </span>
          </div>

          {/* Prev / Next Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handlePrev}
              aria-label="Previous slide"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderTopColor: 'rgba(255, 255, 255, 0.25)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all var(--transition-fast)'
              }}
              className="carousel-nav-btn"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next slide"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderTopColor: 'rgba(255, 255, 255, 0.25)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all var(--transition-fast)'
              }}
              className="carousel-nav-btn"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .carousel-tab-btn:hover {
          color: var(--text-primary) !important;
          border-color: rgba(255, 255, 255, 0.25) !important;
        }
        .carousel-nav-btn:hover {
          background: rgba(255, 255, 255, 0.12) !important;
          border-color: rgba(255, 255, 255, 0.3) !important;
          transform: translateY(-1px);
        }
        .carousel-nav-btn:active {
          transform: translateY(0);
        }
        .carousel-indicator-btn:hover {
          background: rgba(255, 255, 255, 0.4) !important;
        }
      `}</style>
    </section>
  );
};
