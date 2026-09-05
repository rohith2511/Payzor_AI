import React, { useEffect, useState, useRef } from 'react';

// Viewport-aware counter hook
function AnimatedCounter({ end, duration = 2000, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0);
  const elementRef = useRef(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      const easeOutQuad = (t) => t * (2 - t);
      const currentVal = Math.floor(easeOutQuad(progress) * end);
      
      setCount(currentVal);
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };

    window.requestAnimationFrame(step);
  }, [hasStarted, end, duration]);

  return (
    <span ref={elementRef} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

export default function TrustMetrics() {
  return (
    <section id="metrics" style={{
      padding: 'clamp(4rem, 8vw, 7rem) 0',
      backgroundColor: '#0A0A0B',
      borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
      position: 'relative'
    }}>
      <div className="container-custom">
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem, 5vw, 4rem)' }}>
          <p style={{
            fontSize: '0.8rem',
            fontWeight: 800,
            color: 'var(--gold-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '0.75rem'
          }}>
            ENTERPRISE RECOVERY BENCHMARKS
          </p>
          <h2 style={{
            fontSize: 'clamp(1.5rem, 3.5vw, 2.35rem)',
            fontWeight: 800,
            color: '#F8FAFC',
            fontFamily: 'var(--font-family-title)',
            lineHeight: 1.25
          }}>
            Trusted by Enterprise Distributors & B2B Finance Teams
          </h2>
        </div>

        {/* Enterprise Brand Logo Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: 'clamp(1.5rem, 3vw, 3rem)',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.75,
          marginBottom: 'clamp(3rem, 6vw, 5rem)'
        }}>
          {logos.map((logo, index) => (
            <div key={index} style={{
              display: 'flex',
              justifyContent: 'center',
              filter: 'brightness(0.8) sepia(1) hue-rotate(5deg) saturate(2)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(1.2) drop-shadow(0 0 8px rgba(212, 175, 55, 0.5))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(0.8) sepia(1) hue-rotate(5deg) saturate(2)';
            }}
            >
              {logo.svg}
            </div>
          ))}
        </div>

        {/* Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
          gap: 'clamp(1.25rem, 2.5vw, 2rem)',
          textAlign: 'center'
        }}>
          {/* Card 1 */}
          <div className="metric-card" style={metricCardStyle}>
            <div style={{
              fontSize: 'clamp(2.25rem, 5vw, 3.25rem)',
              fontWeight: 800,
              fontFamily: 'var(--font-family-title)',
              color: 'var(--gold-primary)',
              lineHeight: 1,
              marginBottom: '0.5rem',
              textShadow: '0 0 20px rgba(212, 175, 55, 0.25)'
            }}>
              <AnimatedCounter end={100} suffix="+" />
            </div>
            <div style={metricLabelStyle}>Debtor Portfolios Audited</div>
            <p style={metricSubStyle}>Full-spectrum trade credit & overdue aging risk assessments.</p>
          </div>

          {/* Card 2 */}
          <div className="metric-card" style={metricCardStyle}>
            <div style={{
              fontSize: 'clamp(2.25rem, 5vw, 3.25rem)',
              fontWeight: 800,
              fontFamily: 'var(--font-family-title)',
              color: '#34D399',
              lineHeight: 1,
              marginBottom: '0.5rem',
              textShadow: '0 0 20px rgba(16, 185, 129, 0.25)'
            }}>
              <AnimatedCounter end={78} suffix="%" />
            </div>
            <div style={metricLabelStyle}>Average Dues Recovery Yield</div>
            <p style={metricSubStyle}>Collected through autonomous multi-channel dunning & settlement links.</p>
          </div>

          {/* Card 3 */}
          <div className="metric-card" style={metricCardStyle}>
            <div style={{
              fontSize: 'clamp(2.25rem, 5vw, 3.25rem)',
              fontWeight: 800,
              fontFamily: 'var(--font-family-title)',
              color: 'var(--gold-hover)',
              lineHeight: 1,
              marginBottom: '0.5rem',
              textShadow: '0 0 20px rgba(212, 175, 55, 0.25)'
            }}>
              <AnimatedCounter end={22} suffix="%" />
            </div>
            <div style={metricLabelStyle}>Reduction in Days Sales Outstanding</div>
            <p style={metricSubStyle}>AI timing windows and dynamic settlement offers accelerate clearance.</p>
          </div>

          {/* Card 4 */}
          <div className="metric-card" style={metricCardStyle}>
            <div style={{
              fontSize: 'clamp(2.25rem, 5vw, 3.25rem)',
              fontWeight: 800,
              fontFamily: 'var(--font-family-title)',
              color: 'var(--gold-primary)',
              lineHeight: 1,
              marginBottom: '0.5rem',
              textShadow: '0 0 20px rgba(212, 175, 55, 0.25)'
            }}>
              <AnimatedCounter end={148} suffix="L+" prefix="₹" />
            </div>
            <div style={metricLabelStyle}>Receivables Monitored</div>
            <p style={metricSubStyle}>Continuous real-time portfolio liquidity tracking and protection.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

const metricCardStyle = {
  background: '#121318',
  padding: '2.5rem 2rem',
  borderRadius: 'var(--border-radius-lg)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
  border: '1px solid rgba(212, 175, 55, 0.18)',
  transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
  cursor: 'default'
};

const metricLabelStyle = {
  fontSize: '1.05rem',
  fontWeight: 700,
  color: '#F8FAFC',
  marginBottom: '0.5rem'
};

const metricSubStyle = {
  fontSize: '0.85rem',
  color: '#94A3B8',
  lineHeight: 1.4
};

// SVG brand logo data
const logos = [
  {
    name: 'VALENTINE',
    svg: (
      <svg width="120" height="35" viewBox="0 0 120 35" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="25" fill="#D4AF37" fontFamily="Georgia, serif" fontSize="20" fontWeight="bold" letterSpacing="0.1em">VALENTINE</text>
      </svg>
    )
  },
  {
    name: 'MODERN LOGISTICS',
    svg: (
      <svg width="120" height="35" viewBox="0 0 120 35" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="25" fill="#D4AF37" fontFamily="Helvetica, Arial, sans-serif" fontSize="16" fontWeight="800" letterSpacing="0.15em">M O D E R N</text>
      </svg>
    )
  },
  {
    name: 'E L I X I R',
    svg: (
      <svg width="120" height="35" viewBox="0 0 120 35" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="25" fill="#D4AF37" fontFamily="Cinzel, serif, Times New Roman" fontSize="19" fontWeight="300" letterSpacing="0.2em">ELIXIR</text>
      </svg>
    )
  },
  {
    name: 'AURUM CAPITAL',
    svg: (
      <svg width="120" height="35" viewBox="0 0 120 35" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="25" fill="#D4AF37" fontFamily="Impact, sans-serif" fontSize="22" fontWeight="500" letterSpacing="0.05em">A U R U M</text>
      </svg>
    )
  },
  {
    name: 'V O G U E',
    svg: (
      <svg width="120" height="35" viewBox="0 0 120 35" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="10" y="25" fill="#D4AF37" fontFamily="Didot, Bodoni MT, serif" fontSize="24" fontWeight="bold" fontStyle="italic" letterSpacing="0.1em">VOGUE</text>
      </svg>
    )
  }
];
