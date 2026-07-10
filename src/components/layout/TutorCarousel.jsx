'use client';
import React, { useState, useEffect } from 'react';

const TUTOR_SLIDES = [
  {
    image: '/tutors-images/304.jpg',
    name: 'Dr. Kamran Bashir',
    subject: 'Physics & Calculus Expert',
    heading: 'Inspiring Academic Excellence',
    quote: 'My goal is to simplify complex sciences and help students achieve top grades in their board examinations.'
  },
  {
    image: '/tutors-images/1783.jpg',
    name: 'Prof. Faisal Mahmood',
    subject: 'O/A-Levels Chemistry Specialist',
    heading: 'Unlocking Student Potential',
    quote: 'I design customized learning journeys that build conceptual clarity and scientific inquiry in young minds.'
  },
  {
    image: '/tutors-images/3335.jpg',
    name: 'Muhammad Ali',
    subject: 'Computer Science & Programming',
    heading: 'Building Next-Gen Innovators',
    quote: "Teaching logic and coding isn't just about syntax; it's about giving students the tools to build the future."
  },
  {
    image: '/tutors-images/56752.jpg',
    name: 'Haris Zain',
    subject: 'English Literature & SAT Prep',
    heading: 'Empowering Eloquent Voices',
    quote: 'Critical reading and writing are key life skills. I help students express themselves confidently and score high.'
  },
  {
    image: '/tutors-images/2147805628.jpg',
    name: 'Prof. Salman Shah',
    subject: 'Biology & Pre-Medical Coach',
    heading: 'Nurturing Future Doctors',
    quote: 'With focused conceptual frameworks and interactive learning, we turn biological complexities into intuitive knowledge.'
  }
];

export function TutorCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % TUTOR_SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      padding: '24px 24px 24px 0',
      height: '100%',
      boxSizing: 'border-box',
      position: 'relative',
      display: 'block',
    }} className="nav-links">
      <div style={{
        borderRadius: '24px',
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#000',
      }}>
        {/* Images */}
        {TUTOR_SLIDES.map((slide, idx) => (
          <img
            key={slide.image}
            src={slide.image}
            alt={slide.name}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: idx === currentSlide ? 0.75 : 0,
              transition: 'opacity 1s ease-in-out',
              zIndex: 1,
            }}
          />
        ))}

        {/* Dark Overlay to help readability */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 100%, rgba(0,0,0,0.7) 0%)',
          zIndex: 2,
          pointerEvents: 'none',
        }} />

        {/* Testimonial Glassmorphic Box */}
        <div style={{
          position: 'absolute',
          bottom: '32px',
          left: '24px',
          right: '24px',
          zIndex: 3,
          background: 'rgba(0, 33, 73, 0.34)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '20px',
          padding: '28px',
          color: '#fff',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
        }}>
          {/* Carousel Content */}
          {TUTOR_SLIDES.map((slide, idx) => (
            <div
              key={slide.name}
              style={{
                display: idx === currentSlide ? 'block' : 'none',
                opacity: idx === currentSlide ? 1 : 0,
                transition: 'opacity 0.5s ease-in-out',
              }}
            >
              {/* Heading */}
              <h3 style={{
                fontSize: '22px',
                color: 'var(--brand-green)',
                fontWeight: 700,
                margin: '0 0 8px 0',
                lineHeight: '1.3',
              }}>
                {slide.heading}
              </h3>
              
              {/* Quote */}
              <p style={{
                fontSize: '13.5px',
                lineHeight: '1.6',
                color: 'rgba(255,255,255,0.9)',
                margin: '0 0 16px 0',
                fontStyle: 'italic',
              }}>
                &ldquo;{slide.quote}&rdquo;
              </p>

              {/* Tutor Info */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '14.5px', fontWeight: 700 }}>{slide.name}</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{slide.subject}</span>
              </div>
            </div>
          ))}
          
          {/* Slider Dots Indicator */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '16px' }}>
            {TUTOR_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                style={{
                  width: idx === currentSlide ? '16px' : '6px',
                  height: '6px',
                  borderRadius: '999px',
                  backgroundColor: idx === currentSlide ? '#fff' : 'rgba(255,255,255,0.4)',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
