import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { FileText, ShieldAlert, Clock, BarChart3, Send, Link, DollarSign, ShieldCheck, Sparkles, Activity } from 'lucide-react';

// Coordinates setup for Payzor AI Autonomous Revenue Recovery Control Center
const LAYOUT = {
  center: [0, 0, 0],
  
  // Left: Ingesting Receivables & Risk Intelligence (x = -4.5)
  left: [
    {
      id: 'l1',
      name: 'Invoices & Ledgers',
      category: 'Ingest',
      label: 'Overdue aging & terms',
      pos: [-4.5, 1.5, 0],
      icon: <FileText size={12} style={{ color: '#D4AF37' }} />,
      color: '#D4AF37'
    },
    {
      id: 'l2',
      name: 'Risk Signals',
      category: 'AI Scoring',
      label: 'Multi-factor risk tiers',
      pos: [-4.5, 0.5, 0.2],
      icon: <ShieldAlert size={12} style={{ color: '#E5C158' }} />,
      color: '#E5C158'
    },
    {
      id: 'l3',
      name: 'Payment Behavior',
      category: 'Telemetry',
      label: 'DSO & delay analytics',
      pos: [-4.5, -0.5, -0.2],
      icon: <Clock size={12} style={{ color: '#F3E5AB' }} />,
      color: '#F3E5AB'
    },
    {
      id: 'l4',
      name: 'Credit Exposure',
      category: 'Portfolio',
      label: 'Limit & balance monitor',
      pos: [-4.5, -1.5, 0],
      icon: <BarChart3 size={12} style={{ color: '#C5A059' }} />,
      color: '#C5A059'
    }
  ],

  // Right: Autonomous Dunning Actions & Recovery Yield (x = 4.5)
  right: [
    {
      id: 'r1',
      name: 'Dunning Dispatch',
      category: 'Action',
      label: 'WhatsApp & Email routing',
      pos: [4.5, 1.6, 0],
      icon: <Send size={12} style={{ color: '#D4AF37' }} />,
      color: '#D4AF37'
    },
    {
      id: 'r2',
      name: 'Settlement Link',
      category: 'Razorpay Pay',
      label: 'Dynamic quick-settle token',
      pos: [4.5, 0.8, -0.1],
      icon: <Link size={12} style={{ color: '#E5C158' }} />,
      color: '#E5C158'
    },
    {
      id: 'r3',
      name: 'Promise-to-Pay',
      category: 'Commitment',
      label: 'Automated PTP schedule',
      pos: [4.5, 0, 0.1],
      icon: <Sparkles size={12} style={{ color: '#F59E0B' }} />,
      color: '#F59E0B'
    },
    {
      id: 'r4',
      name: '+₹3,42,000 Recovered',
      category: 'Capital Yield',
      label: 'Autonomous recovered dues',
      pos: [4.5, -0.8, 0],
      icon: <DollarSign size={12} style={{ color: '#10B981' }} />,
      color: '#10B981'
    },
    {
      id: 'r5',
      name: 'RBI Guardrails',
      category: 'Compliance',
      label: 'Safety caps & cooldowns',
      pos: [4.5, -1.6, -0.1],
      icon: <ShieldCheck size={12} style={{ color: '#D4AF37' }} />,
      color: '#D4AF37'
    }
  ]
};

// Continuous golden energy particles flowing Left ➔ Center Hub, and Center Hub ➔ Right
function FlowParticles({ speedFactor }) {
  const particles = useMemo(() => {
    const list = [];
    const countPerPath = 3;

    // Paths: Left ➔ Center Hub
    LAYOUT.left.forEach((l) => {
      const pStart = new THREE.Vector3(...l.pos);
      const pEnd = new THREE.Vector3(...LAYOUT.center);
      const cp = new THREE.Vector3(
        (pStart.x + pEnd.x) / 2,
        (pStart.y + pEnd.y) / 2 + 0.2,
        (pStart.z + pEnd.z) / 2 + 0.1
      );
      const curve = new THREE.QuadraticBezierCurve3(pStart, cp, pEnd);

      for (let i = 0; i < countPerPath; i++) {
        list.push({
          curve,
          delay: i / countPerPath,
          speed: 0.18,
          color: l.color,
          size: 0.048
        });
      }
    });

    // Paths: Center Hub ➔ Right
    LAYOUT.right.forEach((r) => {
      const pStart = new THREE.Vector3(...LAYOUT.center);
      const pEnd = new THREE.Vector3(...r.pos);
      const cp = new THREE.Vector3(
        (pStart.x + pEnd.x) / 2,
        (pStart.y + pEnd.y) / 2 - 0.2,
        (pStart.z + pEnd.z) / 2 + 0.1
      );
      const curve = new THREE.QuadraticBezierCurve3(pStart, cp, pEnd);

      for (let i = 0; i < countPerPath; i++) {
        list.push({
          curve,
          delay: i / countPerPath,
          speed: 0.2,
          color: r.color,
          size: 0.052
        });
      }
    });

    return list;
  }, []);

  return (
    <>
      {particles.map((p, i) => (
        <SingleParticle key={i} particle={p} speedFactor={speedFactor} />
      ))}
    </>
  );
}

function SingleParticle({ particle, speedFactor }) {
  const ref = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const t = ((time * particle.speed * speedFactor + particle.delay) % 1);
    
    if (ref.current) {
      const pos = particle.curve.getPointAt(t);
      ref.current.position.copy(pos);
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[particle.size, 10, 10]} />
      <meshStandardMaterial 
        color={particle.color} 
        emissive={particle.color} 
        emissiveIntensity={0.8}
        roughness={0.2}
        metalness={0.8} 
      />
    </mesh>
  );
}

// Background golden conduits
function ConnectionPipelines() {
  const lines = useMemo(() => {
    const list = [];
    
    // Left ➔ Center Hub
    LAYOUT.left.forEach((l) => {
      const pStart = new THREE.Vector3(...l.pos);
      const pEnd = new THREE.Vector3(...LAYOUT.center);
      const cp = new THREE.Vector3(
        (pStart.x + pEnd.x) / 2,
        (pStart.y + pEnd.y) / 2 + 0.2,
        (pStart.z + pEnd.z) / 2 + 0.1
      );
      const curve = new THREE.QuadraticBezierCurve3(pStart, cp, pEnd);
      list.push({ points: curve.getPoints(30), color: 'rgba(212, 175, 55, 0.25)' });
    });

    // Center Hub ➔ Right
    LAYOUT.right.forEach((r, idx) => {
      const pStart = new THREE.Vector3(...LAYOUT.center);
      const pEnd = new THREE.Vector3(...r.pos);
      const cp = new THREE.Vector3(
        (pStart.x + pEnd.x) / 2,
        (pStart.y + pEnd.y) / 2 - 0.2,
        (pStart.z + pEnd.z) / 2 + 0.1
      );
      const curve = new THREE.QuadraticBezierCurve3(pStart, cp, pEnd);
      const color = idx === 3 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(212, 175, 55, 0.25)';
      list.push({ points: curve.getPoints(30), color });
    });

    return list;
  }, []);

  return (
    <>
      {lines.map((item, idx) => {
        const geom = new THREE.BufferGeometry().setFromPoints(item.points);
        return (
          <line key={idx}>
            <primitive object={geom} attach="geometry" />
            <lineBasicMaterial color={item.color} linewidth={1} transparent opacity={0.4} />
          </line>
        );
      })}
    </>
  );
}

// Slow luxury camera drift
function SceneEffects() {
  const { camera } = useThree();
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    camera.position.x = Math.sin(time * 0.04) * 0.12;
    camera.position.y = Math.cos(time * 0.03) * 0.08 + 0.15;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// Payzor AI Hub concentric golden holographic rings
function AIEngineHub({ hovered, setHovered }) {
  const groupRef = useRef();
  const ring1 = useRef();
  const ring2 = useRef();
  const ring3 = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const speed = hovered ? 2.5 : 1.0;

    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.04 * speed;
    }
    
    if (ring1.current) {
      ring1.current.rotation.z = time * 0.45 * speed;
      ring1.current.rotation.x = time * 0.1;
    }
    if (ring2.current) {
      ring2.current.rotation.z = -time * 0.3 * speed;
      ring2.current.rotation.y = time * 0.15;
    }
    if (ring3.current) {
      ring3.current.rotation.z = time * 0.2 * speed;
      ring3.current.rotation.x = -time * 0.08;
    }
  });

  return (
    <group 
      position={LAYOUT.center} 
      ref={groupRef}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Central Metallic Gold Core sphere node */}
      <mesh>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial 
          color={hovered ? '#FFD700' : '#D4AF37'} 
          emissive="#D4AF37"
          emissiveIntensity={hovered ? 1.2 : 0.6}
          roughness={0.15}
          metalness={0.9}
        />
      </mesh>

      {/* Ring 1 - Metallic Gold */}
      <mesh ref={ring1}>
        <ringGeometry args={[1.35, 1.38, 64]} />
        <meshBasicMaterial color="#D4AF37" side={THREE.DoubleSide} transparent opacity={0.4} wireframe />
      </mesh>

      {/* Ring 2 - Champagne Glow */}
      <mesh ref={ring2}>
        <ringGeometry args={[1.65, 1.68, 64]} />
        <meshBasicMaterial color="#F3E5AB" side={THREE.DoubleSide} transparent opacity={0.25} />
      </mesh>

      {/* Ring 3 - Polished Brass Outer Orbit */}
      <mesh ref={ring3}>
        <ringGeometry args={[2.0, 2.03, 64]} />
        <meshBasicMaterial color="#C5A059" side={THREE.DoubleSide} transparent opacity={0.18} wireframe />
      </mesh>
    </group>
  );
}

export default function HeroScene() {
  const [aiHovered, setAiHovered] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  const speedFactor = aiHovered ? 2.5 : 1.0;

  // Unified Obsidian Glass Card Styles
  const cardStyle = (id, hoverColor = '#D4AF37', width = '148px') => {
    const isHovered = hoveredCard === id;
    return {
      backgroundColor: 'rgba(18, 19, 24, 0.94)',
      border: isHovered ? `1px solid ${hoverColor}` : '1px solid rgba(212, 175, 55, 0.22)',
      borderRadius: '10px',
      padding: '0.75rem 0.95rem',
      boxShadow: isHovered ? `0 0 20px ${hoverColor}40` : '0 4px 20px rgba(0, 0, 0, 0.7)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem',
      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      cursor: 'pointer',
      transform: isHovered ? 'scale(1.06) translateY(-2px)' : 'scale(1)',
      width,
      fontFamily: 'var(--font-family-body)',
      pointerEvents: 'auto',
      userSelect: 'none',
      boxSizing: 'border-box',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)'
    };
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 5.0], fov: 52 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 5, 5]} intensity={1.8} color="#FFF5D6" />
        <pointLight position={[0, 0, 2]} intensity={1.5} color="#D4AF37" distance={8} />
        
        {/* Conduits & Flowing Golden Particles */}
        <ConnectionPipelines />
        <FlowParticles speedFactor={speedFactor} />
        
        {/* Core Hub concentric processing rings */}
        <AIEngineHub hovered={aiHovered} setHovered={setAiHovered} />

        {/* 1. CENTRAL ENGINE PANEL: PAYZOR AI RECOVERY HUB */}
        <FloatingGroup initialPos={LAYOUT.center} offsetTime={0}>
          <Html distanceFactor={8.5} center>
            <div 
              style={{
                ...cardStyle('center', '#D4AF37', '216px'),
                backgroundColor: 'rgba(14, 15, 20, 0.96)',
                border: aiHovered ? '1px solid #FFD700' : '1px solid rgba(212, 175, 55, 0.35)',
                boxShadow: aiHovered ? '0 0 30px rgba(212, 175, 55, 0.45)' : '0 8px 32px rgba(0, 0, 0, 0.85)',
                transform: aiHovered ? 'scale(1.05) translateY(-3px)' : 'none',
                gap: '0.55rem',
                padding: '1.05rem'
              }}
              onMouseEnter={() => setAiHovered(true)}
              onMouseLeave={() => setAiHovered(false)}
            >
              {/* Hub Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', paddingBottom: '0.45rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Activity size={13} style={{ color: '#D4AF37' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F8FAFC', fontFamily: 'var(--font-family-title)', letterSpacing: '0.04em' }}>
                    PAYZOR AI HUB
                  </span>
                </div>
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#D4AF37',
                  display: 'inline-block',
                  boxShadow: '0 0 8px #FFD700',
                  animation: 'pulse-subtle 1.8s infinite'
                }} />
              </div>

              {/* Hub Metrics */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.62rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>Recovery Confidence</span>
                  <strong style={{ color: '#D4AF37' }}>99.2%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>Monitored Receivables</span>
                  <strong style={{ color: '#F8FAFC' }}>₹14.8M+</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>Decision Velocity</span>
                  <strong style={{ color: '#F8FAFC' }}>4,850/sec</strong>
                </div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.08) 100%)',
                color: '#E5C158',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                fontSize: '0.55rem',
                fontWeight: 800,
                textAlign: 'center',
                padding: '0.22rem',
                borderRadius: '5px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}>
                Autonomous Engine Active
              </div>
            </div>
          </Html>
        </FloatingGroup>

        {/* 2. LEFT INPUT CARDS (Ingest) */}
        {LAYOUT.left.map((c, idx) => (
          <FloatingGroup key={c.id} initialPos={c.pos} offsetTime={idx * 1.5}>
            <Html distanceFactor={8.5} center>
              <div 
                style={cardStyle(c.id, c.color)}
                onMouseEnter={() => setHoveredCard(c.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div style={cardHeaderLabelStyle}>
                  {c.icon} <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.category}</span>
                </div>
                <div style={cardMetricTitleStyle}>{c.name}</div>
                <div style={cardSubtextStyle}>{c.label}</div>
              </div>
            </Html>
          </FloatingGroup>
        ))}

        {/* 3. RIGHT OUTPUT CARDS (Decisions) */}
        {LAYOUT.right.map((c, idx) => (
          <FloatingGroup key={c.id} initialPos={c.pos} offsetTime={idx * 1.5 + 2}>
            <Html distanceFactor={8.5} center>
              <div 
                style={cardStyle(c.id, c.color)}
                onMouseEnter={() => setHoveredCard(c.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div style={{ ...cardHeaderLabelStyle, color: c.color === '#10B981' ? '#34D399' : '#C5A059' }}>
                  {c.icon} <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.category}</span>
                </div>
                <div style={{ ...cardMetricTitleStyle, color: c.color === '#10B981' ? '#34D399' : '#F8FAFC' }}>
                  {c.name}
                </div>
                <div style={cardSubtextStyle}>{c.label}</div>
              </div>
            </Html>
          </FloatingGroup>
        ))}

        <SceneEffects />
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>

      {/* Visual Pipeline Stage Labels */}
      <div style={{
        position: 'absolute',
        bottom: '0.75rem',
        left: '5%',
        right: '5%',
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr 1.2fr',
        textAlign: 'center',
        fontSize: '0.62rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: '#94A3B8',
        pointerEvents: 'none',
        borderTop: '1px solid rgba(212, 175, 55, 0.15)',
        paddingTop: '0.6rem'
      }}>
        <div>Receivables & Risk Ingest</div>
        <div style={{ color: '#D4AF37' }}>Payzor AI Recovery Core</div>
        <div>Autonomous Dunning & Recoveries</div>
      </div>
    </div>
  );
}

// Float drift wrap
function FloatingGroup({ children, initialPos, offsetTime }) {
  const ref = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime() + offsetTime;
    if (ref.current) {
      ref.current.position.y = initialPos[1] + Math.sin(time * 0.8) * 0.05;
      ref.current.position.x = initialPos[0] + Math.cos(time * 0.6) * 0.03;
    }
  });

  return (
    <group ref={ref} position={initialPos}>
      {children}
    </group>
  );
}

const cardHeaderLabelStyle = {
  fontSize: '0.55rem',
  fontWeight: 700,
  color: '#94A3B8',
  display: 'flex',
  alignItems: 'center',
  gap: '0.3rem',
  lineHeight: 1
};

const cardMetricTitleStyle = {
  fontSize: '0.98rem',
  fontWeight: 700,
  color: '#F8FAFC',
  fontFamily: 'var(--font-family-title)',
  lineHeight: 1.2,
  marginTop: '0.2rem',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const cardSubtextStyle = {
  fontSize: '0.62rem',
  color: '#94A3B8',
  lineHeight: 1.2,
  marginTop: '0.05rem',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};
