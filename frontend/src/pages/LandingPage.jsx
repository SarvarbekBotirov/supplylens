import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchHeadlines } from '../services/api';

const FALLBACK_HEADLINES = [
  { title: 'Strait of Hormuz blocked — 300 vessels rerouted',
    tag: 'Disruption', score: 5 },
  { title: 'TSMC halts production amid regional tensions',
    tag: 'Trade', score: 5 },
  { title: 'Red Sea closure forces 14-day shipping delays',
    tag: 'Shipping', score: 4 },
  { title: 'Rare earth export controls threaten chip supply',
    tag: 'Trade', score: 4 },
  { title: 'Global freight rates surge 40% on port congestion',
    tag: 'Disruption', score: 5 },
];

const TAG_COLORS = {
  Disruption: '#ef4444',
  Trade:      '#f59e0b',
  Shipping:   '#06b6d4',
  Technology: '#3b82f6',
  Economy:    '#8b5cf6',
  Politics:   '#ec4899',
  default:    '#6b6b8a',
};

function LandingPage() {
  const navigate = useNavigate();
  const [headlines, setHeadlines] = useState(FALLBACK_HEADLINES);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchHeadlines()
      .then(res => {
        if (res?.data?.length >= 3) {
          setHeadlines(res.data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setActiveIndex(i => (i + 1) % headlines.length);
        setFading(false);
      }, 400);
    }, 3500);
    return () => clearInterval(interval);
  }, [headlines]);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  const current = headlines[activeIndex];
  const tagColor = TAG_COLORS[current?.tag] || TAG_COLORS.default;
  const riskLabel = (score) => {
    if (score >= 5) return 'CRITICAL';
    if (score >= 4) return 'HIGH';
    if (score >= 3) return 'MEDIUM';
    return 'LOW';
  };
  const riskColor = (score) => {
    if (score >= 5) return '#ef4444';
    if (score >= 4) return '#f59e0b';
    return '#06b6d4';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d0d14',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
      overflow: 'hidden',
      padding: '40px 24px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @keyframes gridMove {
          from { transform: translateY(0); }
          to   { transform: translateY(40px); }
        }
        @keyframes scanLine {
          0%   { top: -2px; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }

        .hero-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(6,182,212,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6,182,212,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          animation: gridMove 8s linear infinite;
          pointer-events: none;
        }

        .scan-line {
          position: absolute;
          left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg,
            transparent,
            rgba(6,182,212,0.3),
            transparent);
          animation: scanLine 6s ease-in-out infinite;
          pointer-events: none;
        }

        .corner {
          position: absolute;
          width: 20px; height: 20px;
          border-color: rgba(6,182,212,0.3);
          border-style: solid;
        }
        .corner-tl { top: 20px; left: 20px;
          border-width: 2px 0 0 2px; }
        .corner-tr { top: 20px; right: 20px;
          border-width: 2px 2px 0 0; }
        .corner-bl { bottom: 20px; left: 20px;
          border-width: 0 0 2px 2px; }
        .corner-br { bottom: 20px; right: 20px;
          border-width: 0 2px 2px 0; }

        .status-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #06b6d4;
          animation: pulse 1.5s ease-in-out infinite;
        }

        .headline-card {
          transition: opacity 0.4s ease, transform 0.4s ease;
        }
        .headline-card.fading {
          opacity: 0;
          transform: translateY(-8px);
        }

        .cta-btn {
          background: #06b6d4;
          color: #0d0d14;
          border: none;
          padding: 16px 40px;
          border-radius: 6px;
          font-size: 15px;
          font-weight: 800;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          letter-spacing: 0.3px;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .cta-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0);
          transition: background 0.2s;
        }
        .cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(6,182,212,0.35);
        }
        .cta-btn:active { transform: translateY(0); }

        .dot-nav button {
          width: 6px; height: 6px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          padding: 0;
        }

        .fade-up-1 {
          opacity: ${loaded ? 1 : 0};
          animation: ${loaded ? 'fadeUp 0.6s ease forwards' : 'none'};
        }
        .fade-up-2 {
          opacity: ${loaded ? 1 : 0};
          animation: ${loaded ? 'fadeUp 0.6s ease 0.15s forwards' : 'none'};
        }
        .fade-up-3 {
          opacity: ${loaded ? 1 : 0};
          animation: ${loaded ? 'fadeUp 0.6s ease 0.3s forwards' : 'none'};
        }
        .fade-up-4 {
          opacity: ${loaded ? 1 : 0};
          animation: ${loaded ? 'fadeUp 0.6s ease 0.45s forwards' : 'none'};
        }
      `}</style>

      {/* Background grid */}
      <div className="hero-grid" />
      <div className="scan-line" />

      {/* Corner brackets */}
      <div className="corner corner-tl" />
      <div className="corner corner-tr" />
      <div className="corner corner-bl" />
      <div className="corner corner-br" />

      {/* Top status bar */}
      <div className="fade-up-1" style={{
        position: 'absolute', top: '32px',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <div className="status-dot" />
        <span style={{
          fontSize: '11px', fontWeight: '600',
          color: '#06b6d4', letterSpacing: '1.5px',
          textTransform: 'uppercase',
        }}>
          Live Intelligence Feed Active
        </span>
      </div>

      {/* Main content */}
      <div style={{
        maxWidth: '720px', width: '100%',
        textAlign: 'center', zIndex: 1,
      }}>

        {/* Logo */}
        <div className="fade-up-1" style={{
          marginBottom: '40px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: '10px',
        }}>
          <span style={{
            fontSize: '22px', fontWeight: '900',
            color: '#e8e8f0', letterSpacing: '-0.5px',
          }}>
            Supply<span style={{ color: '#06b6d4' }}>Lens</span>
          </span>
          <span style={{
            fontSize: '9px', fontWeight: '700',
            background: '#06b6d4', color: '#0d0d14',
            padding: '3px 7px', borderRadius: '3px',
            letterSpacing: '0.5px',
          }}>BETA</span>
        </div>

        {/* Live headline card */}
        <div className="fade-up-2" style={{ marginBottom: '48px' }}>

          {/* Label */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '8px',
            marginBottom: '20px',
          }}>
            <div style={{
              height: '1px', width: '40px',
              background: 'rgba(107,107,138,0.4)',
            }} />
            <span style={{
              fontSize: '10px', fontWeight: '700',
              color: '#6b6b8a', letterSpacing: '2px',
              textTransform: 'uppercase',
            }}>
              Now Analyzing
            </span>
            <div style={{
              height: '1px', width: '40px',
              background: 'rgba(107,107,138,0.4)',
            }} />
          </div>

          {/* Headline display */}
          <div
            className={`headline-card ${fading ? 'fading' : ''}`}
            style={{
              background: 'rgba(19,19,31,0.8)',
              border: '1px solid rgba(30,30,46,0.8)',
              borderRadius: '12px',
              padding: '28px 32px',
              backdropFilter: 'blur(8px)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top accent line */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              height: '2px',
              background: `linear-gradient(90deg,
                transparent, ${tagColor}, transparent)`,
            }} />

            {/* Tag + Risk score row */}
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
            }}>
              <span style={{
                fontSize: '9px', fontWeight: '700',
                color: tagColor,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                background: `${tagColor}15`,
                padding: '3px 10px',
                borderRadius: '3px',
                border: `1px solid ${tagColor}30`,
              }}>
                {current?.tag || 'Analysis'}
              </span>
              <span style={{
                fontSize: '9px', fontWeight: '700',
                color: riskColor(current?.score),
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}>
                ● {riskLabel(current?.score)} RISK
              </span>
            </div>

            {/* Headline text */}
            <div style={{
              fontSize: '20px', fontWeight: '700',
              color: '#e8e8f0', lineHeight: '1.35',
              letterSpacing: '-0.3px',
              marginBottom: current?.summary ? '14px' : '0',
            }}>
              {current?.title}
            </div>

            {/* Summary if available */}
            {current?.summary && (
              <div style={{
                fontSize: '12px', color: '#6b6b8a',
                lineHeight: '1.6',
                borderTop: '1px solid #1e1e2e',
                paddingTop: '12px',
                marginTop: '4px',
              }}>
                {current.summary.length > 140
                  ? current.summary.substring(0, 140) + '...'
                  : current.summary}
              </div>
            )}
          </div>

          {/* Dot navigation */}
          <div className="dot-nav" style={{
            display: 'flex', justifyContent: 'center',
            gap: '6px', marginTop: '16px',
          }}>
            {headlines.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setFading(true);
                  setTimeout(() => {
                    setActiveIndex(i);
                    setFading(false);
                  }, 400);
                }}
                style={{
                  background: i === activeIndex
                    ? '#06b6d4' : 'rgba(107,107,138,0.3)',
                  width: i === activeIndex ? '20px' : '6px',
                  borderRadius: '3px',
                }}
              />
            ))}
          </div>
        </div>

        {/* Tagline */}
        <div className="fade-up-3" style={{ marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '42px', fontWeight: '900',
            color: '#e8e8f0', lineHeight: '1.15',
            letterSpacing: '-1px', marginBottom: '16px',
          }}>
            Stop Reacting.<br />
            <span style={{ color: '#06b6d4' }}>
              Start Anticipating.
            </span>
          </h1>
          <p style={{
            fontSize: '15px', color: '#6b6b8a',
            lineHeight: '1.7', maxWidth: '480px',
            margin: '0 auto',
          }}>
            A procurement risk intelligence system that converts
            global news and commodity signals into
            supplier-risk actions.
          </p>
        </div>

        {/* CTA */}
        <div className="fade-up-4">
          <button
            className="cta-btn"
            onClick={() => navigate('/dashboard')}
          >
            Open Intelligence Feed →
          </button>
          <div style={{
            marginTop: '16px', fontSize: '11px',
            color: '#6b6b8a', letterSpacing: '0.5px',
          }}>
            No signup required · Free to use
          </div>
        </div>

      </div>

      {/* Bottom bar */}
      <div style={{
        position: 'absolute', bottom: '24px',
        display: 'flex', alignItems: 'center', gap: '24px',
      }}>
        {['10+ Live Sources', 'Source-Grounded Analysis',
          'Supplier Risk Actions'].map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <span style={{
              width: '4px', height: '4px',
              borderRadius: '50%', background: '#06b6d4',
              display: 'inline-block',
            }} />
            <span style={{
              fontSize: '10px', color: '#6b6b8a',
              fontWeight: '500', letterSpacing: '0.5px',
            }}>
              {item}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}

export default LandingPage;
