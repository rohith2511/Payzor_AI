import React from 'react';
import { Cpu, Database, Send, Server, Terminal, Code2, ArrowDown } from 'lucide-react';

const NODES = [
  {
    title: 'React 19 Frontend',
    subtitle: 'Vite Single Page App',
    desc: 'Three.js 3D telemetry, charts, and state',
    icon: <Code2 size={16} />,
    color: '#D4AF37'
  },
  {
    title: 'FastAPI 2.0 Core',
    subtitle: 'Python Async Engine',
    desc: 'REST API, security & recovery routes',
    icon: <Server size={16} />,
    color: '#E5C158'
  },
  {
    title: 'PostgreSQL / SQLite',
    subtitle: 'SQLAlchemy 2.0 Engine',
    desc: 'Debtor ledgers, PTPs & immutable audit logs',
    icon: <Database size={16} />,
    color: '#F8FAFC'
  },
  {
    title: 'Groq Qwen 27B AI',
    subtitle: 'Financial Reasoning Tier',
    desc: 'Risk analysis, dunning copy & diagnosis',
    icon: <Cpu size={16} />,
    color: '#D4AF37'
  },
  {
    title: 'Recovery Dispatch',
    subtitle: 'Multi-Channel Engine',
    desc: 'WhatsApp, SMS, Email & Razorpay sync',
    icon: <Send size={16} />,
    color: '#10B981'
  }
];

export default function Architecture() {
  return (
    <section id="architecture" style={{
      padding: 'clamp(4.5rem, 8vw, 7.5rem) 0',
      backgroundColor: '#0D0E12',
      borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      
      {/* Background Glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'clamp(300px, 45vw, 600px)',
        height: 'clamp(300px, 45vw, 600px)',
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.05) 0%, rgba(13, 14, 18, 0) 70%)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      <div className="container-custom" style={{ position: 'relative', zIndex: 1 }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem, 5vw, 4.5rem)' }}>
          <p style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            color: 'var(--gold-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '0.5rem'
          }}>
            SYSTEM ARCHITECTURE
          </p>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
            fontWeight: 800,
            color: '#F8FAFC',
            fontFamily: 'var(--font-family-title)',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            maxWidth: '680px',
            margin: '0 auto'
          }}>
            Engineered for Scale. Built for Autonomous Recovery.
          </h2>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: 'clamp(0.88rem, 2vw, 1rem)',
            maxWidth: '540px',
            margin: '0.75rem auto 0',
            lineHeight: 1.5
          }}>
            An enterprise-grade full-stack architecture optimized for asynchronous recovery dispatch, real-time risk scoring, and verified financial state mutation.
          </p>
        </div>

        {/* Architecture Flow Nodes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          width: '100%'
        }}>
          {NODES.map((node, index) => (
            <div 
              key={index}
              style={{
                background: '#121318',
                border: '1px solid rgba(212, 175, 55, 0.18)',
                borderRadius: 'var(--border-radius-lg)',
                padding: '1.75rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
                transition: 'transform 0.25s ease, border-color 0.25s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.18)';
              }}
            >
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                color: node.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {node.icon}
              </div>

              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--gold-champagne)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {node.subtitle}
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F8FAFC', marginTop: '0.2rem', marginBottom: '0.35rem' }}>
                  {node.title}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.4, margin: 0 }}>
                  {node.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
