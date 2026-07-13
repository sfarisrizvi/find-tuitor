'use client';

import React from 'react';

export default function ComingSoon() {
  const usps = [
    "PAKISTAN'S BIGGEST TUITION HUB",
    "VERIFIED TUTORS FROM ACROSS PAKISTAN",
    "15-MINUTE FREE DEMO SESSIONS",
    "CONNECT WITH TOP 1% HOME & ONLINE EDUCATORS",
    "NO HIDDEN ACADEMY COMMISSIONS",
    "EXAM-FOCUSED PREPARATION (O/A LEVELS, MATRIC, FSC)",
    "DIRECT TUTOR-PARENT COMMUNICATION"
  ];

  // Join them with stars and ample space (non-breaking spaces)
  const marqueeText = usps.join("        ★        ");

  return (
    <div className="coming-soon-container">
      <style>{`
        .coming-soon-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: #FFFFFF;
          color: var(--brand-teal-deep);
          font-family: 'Outfit', sans-serif;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 40px 20px;
          box-sizing: border-box;
          z-index: 99999;
          user-select: none;
        }

        /* Top Small Heading */
        .top-heading {
          font-size: clamp(11px, 1.5vw, 14px);
          font-weight: 600;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--brand-teal-deep);
          text-align: center;
          margin-top: 20px;
          z-index: 10;
        }

        /* Center Content Wrap */
        .center-wrap {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-grow: 1;
        }

        /* Big "COMING SOON" text */
        .giant-text-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          line-height: 0.85;
          text-align: center;
          z-index: 2;
        }

        .coming-soon-container .giant-word {
          font-size: clamp(2.5rem, 14vw, 10rem);
          font-weight: 900;
          color: var(--brand-teal-deep);
          margin: 0;
          letter-spacing: -0.02em;
          text-transform: uppercase;
        }

        /* Side Vertical Background Texts */
        .side-text-left, .side-text-right {
          position: absolute;
          font-size: clamp(3rem, 10vw, 8rem);
          font-weight: 900;
          color: var(--hairline); /* Very subtle light gray contrast to white background */
          letter-spacing: 0.1em;
          text-transform: uppercase;
          pointer-events: none;
          z-index: 1;
        }

        .side-text-left {
          left: 5%;
          transform: rotate(-90deg);
          transform-origin: center left;
        }

        .side-text-right {
          right: 5%;
          transform: rotate(90deg);
          transform-origin: center right;
        }

        /* Crossed Scrolling Ribbons */
        .ribbon {
          position: absolute;
          width: 150vw;
          left: -25vw;
          height: clamp(45px, 5.5vw, 65px);
          background-color: var(--brand-green);
          color: var(--brand-teal-deep);
          display: flex;
          align-items: center;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0, 30, 43, 0.15);
          border-top: 2px solid var(--brand-teal-deep);
          border-bottom: 2px solid var(--brand-teal-deep);
        }

        .ribbon-1 {
          transform: rotate(-6deg);
          z-index: 4;
        }

        .ribbon-2 {
          transform: rotate(6deg);
          background-color: var(--brand-green-mid);
          z-index: 5;
        }

        /* Marquee Animation - Slower Speeds */
        .marquee-track {
          display: flex;
          white-space: nowrap;
          align-items: center;
          font-size: clamp(12px, 1.5vw, 20px);
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .scroll-left {
          animation: marquee-left 45s linear infinite;
        }

        .scroll-right {
          animation: marquee-right 45s linear infinite;
        }

        @keyframes marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes marquee-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }

        /* Bottom Text */
        .bottom-heading {
          font-size: clamp(10px, 1.3vw, 13px);
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--brand-teal-deep);
          text-align: center;
          margin-bottom: 20px;
          z-index: 10;
        }

        /* Media queries for smaller screens to adjust layout */
        @media (max-width: 768px) {
          .side-text-left, .side-text-right {
            opacity: 0.15;
          }
          .coming-soon-container {
            padding: 30px 15px;
          }
          .side-text-left {
            left: 2%;
          }
          .side-text-right {
            right: 2%;
          }
        }

        @media (max-width: 480px) {
          /* Hide vertical background text on small screens to prevent overlay clutter */
          .side-text-left, .side-text-right {
            display: none;
          }
          .coming-soon-container {
            padding: 24px 12px;
          }
          .ribbon {
            height: 44px;
          }
          .coming-soon-container .giant-word {
            font-size: clamp(4.5rem, 18vw, 6.5rem) !important;
            line-height: 1.0 !important;
            display: block !important;
            width: 100% !important;
            text-align: center !important;
          }
          .giant-text-container {
            gap: 8px;
          }
        }

      `}</style>

      {/* Top Small Heading */}
      <div className="top-heading">Pakistan Biggest Tution Hub</div>

      {/* Center Layout */}
      <div className="center-wrap">
        {/* Left Vertical text */}
        <div className="side-text-left">COMING</div>

        {/* Right Vertical text */}
        <div className="side-text-right">SOON</div>

        {/* Central Bold Giant Words */}
        <div className="giant-text-container">
          <h1 className="giant-word">COMING</h1>
          <h1 className="giant-word">SOON</h1>
        </div>

        {/* Ribbon 1: Rotated -6deg scrolling Left */}
        <div className="ribbon ribbon-1">
          <div className="marquee-track scroll-left">
            <span>{marqueeText}        ★        </span>
            <span>{marqueeText}        ★        </span>
          </div>
        </div>

        {/* Ribbon 2: Rotated 6deg scrolling Right */}
        <div className="ribbon ribbon-2">
          <div className="marquee-track scroll-right">
            <span>{marqueeText}        ★        </span>
            <span>{marqueeText}        ★        </span>
          </div>
        </div>
      </div>

      {/* Bottom Small Heading */}
      <div className="bottom-heading">STAY WITH US FOR MORE UPDATES</div>
    </div>
  );
}
