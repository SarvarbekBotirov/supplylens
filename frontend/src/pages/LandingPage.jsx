import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCommodities } from '../services/api';

export default function LandingPage() {
  const navigate = useNavigate();
  const [commodities, setCommodities] = useState([]);
  const tickerRef = useRef(null);

  useEffect(() => {
    fetchCommodities()
      .then(setCommodities)
      .catch(() => setCommodities([]));
  }, []);

  const tickerItems = commodities.length > 0 ? commodities : [
    { name: 'Oil', price: 98, change: 2.66 },
    { name: 'Brent', price: 106, change: 2.88 },
    { name: 'Gold', price: 4492, change: -2.47 },
    { name: 'Natural Gas', price: 3.21, change: -0.84 },
    { name: 'Copper', price: 4.12, change: 1.35 },
    { name: 'Silver', price: 31.5, change: 0.72 },
    { name: 'Wheat', price: 589, change: -1.12 },
    { name: 'Corn', price: 441, change: 0.45 },
  ];

  const doubledTicker = [...tickerItems, ...tickerItems];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Inter', sans-serif;
          color: #1a2b4a;
          background: #fff;
        }

        /* NAVBAR */
        .navbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 48px;
          height: 68px;
          background: #fff;
          border-bottom: 1px solid #e8edf4;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .navbar-brand {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }

        .navbar-logo {
          font-size: 1.35rem;
          font-weight: 800;
          color: #1a2b4a;
          letter-spacing: -0.5px;
        }

        .navbar-tagline {
          font-size: 0.8rem;
          font-weight: 500;
          color: #6b7fa3;
          letter-spacing: 0.02em;
        }

        .btn-dashboard {
          background: #1a2b4a;
          color: #fff;
          border: none;
          padding: 10px 22px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }

        .btn-dashboard:hover {
          background: #243d6b;
          transform: translateY(-1px);
        }

        /* HERO */
        .hero {
          background: linear-gradient(135deg, #f0f4fb 0%, #e8eef8 50%, #f4f7fc 100%);
          padding: 96px 48px 80px;
          text-align: center;
        }

        .hero-badge {
          display: inline-block;
          background: #dde8f8;
          color: #1a4fa0;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 5px 14px;
          border-radius: 20px;
          margin-bottom: 28px;
        }

        .hero h1 {
          font-size: clamp(2rem, 5vw, 3.4rem);
          font-weight: 800;
          color: #1a2b4a;
          line-height: 1.15;
          letter-spacing: -1px;
          max-width: 780px;
          margin: 0 auto 24px;
        }

        .hero p {
          font-size: 1.1rem;
          font-weight: 400;
          color: #4a5e82;
          line-height: 1.7;
          max-width: 600px;
          margin: 0 auto 40px;
        }

        .hero-buttons {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-primary {
          background: #1a2b4a;
          color: #fff;
          border: none;
          padding: 14px 32px;
          border-radius: 9px;
          font-size: 1rem;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 14px rgba(26, 43, 74, 0.25);
        }

        .btn-primary:hover {
          background: #243d6b;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(26, 43, 74, 0.32);
        }

        .btn-outline {
          background: transparent;
          color: #1a2b4a;
          border: 2px solid #b8c8e0;
          padding: 13px 30px;
          border-radius: 9px;
          font-size: 1rem;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s, transform 0.15s;
        }

        .btn-outline:hover {
          border-color: #1a2b4a;
          background: rgba(26, 43, 74, 0.04);
          transform: translateY(-2px);
        }

        /* TICKER */
        .ticker-wrapper {
          background: #1a2b4a;
          padding: 12px 0;
          overflow: hidden;
          position: relative;
        }

        .ticker-wrapper::before,
        .ticker-wrapper::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          width: 80px;
          z-index: 2;
          pointer-events: none;
        }

        .ticker-wrapper::before {
          left: 0;
          background: linear-gradient(to right, #1a2b4a, transparent);
        }

        .ticker-wrapper::after {
          right: 0;
          background: linear-gradient(to left, #1a2b4a, transparent);
        }

        .ticker-track {
          display: flex;
          gap: 0;
          animation: scroll-ticker 40s linear infinite;
          width: max-content;
        }

        .ticker-track:hover {
          animation-play-state: paused;
        }

        @keyframes scroll-ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .ticker-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 28px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #c8d8f0;
          white-space: nowrap;
          border-right: 1px solid rgba(255,255,255,0.1);
        }

        .ticker-name {
          color: #fff;
        }

        .ticker-price {
          color: #c8d8f0;
        }

        .ticker-change.positive { color: #4ade80; }
        .ticker-change.negative { color: #f87171; }

        /* FEATURES */
        .features {
          padding: 88px 48px;
          background: #fff;
        }

        .section-label {
          text-align: center;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #1a4fa0;
          margin-bottom: 12px;
        }

        .section-title {
          text-align: center;
          font-size: clamp(1.5rem, 3vw, 2.1rem);
          font-weight: 800;
          color: #1a2b4a;
          letter-spacing: -0.5px;
          margin-bottom: 56px;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          max-width: 1100px;
          margin: 0 auto;
        }

        .card {
          background: #f7f9fc;
          border: 1px solid #e4ecf5;
          border-radius: 16px;
          padding: 36px 32px;
          transition: box-shadow 0.2s, transform 0.2s;
        }

        .card:hover {
          box-shadow: 0 8px 32px rgba(26, 43, 74, 0.1);
          transform: translateY(-4px);
        }

        .card-icon {
          font-size: 2rem;
          margin-bottom: 18px;
        }

        .card h3 {
          font-size: 1.05rem;
          font-weight: 700;
          color: #1a2b4a;
          margin-bottom: 10px;
        }

        .card p {
          font-size: 0.9rem;
          color: #5a6e8c;
          line-height: 1.65;
        }

        /* HOW IT WORKS */
        .how-it-works {
          background: linear-gradient(135deg, #f0f4fb 0%, #e8eef8 100%);
          padding: 88px 48px;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 32px;
          max-width: 900px;
          margin: 0 auto;
          position: relative;
        }

        .step {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 14px;
        }

        .step-number {
          width: 48px;
          height: 48px;
          background: #1a2b4a;
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          font-weight: 800;
          flex-shrink: 0;
        }

        .step h3 {
          font-size: 1rem;
          font-weight: 700;
          color: #1a2b4a;
        }

        .step p {
          font-size: 0.875rem;
          color: #4a5e82;
          line-height: 1.65;
        }

        @media (max-width: 640px) {
          .navbar { padding: 0 20px; }
          .navbar-tagline { display: none; }
          .hero { padding: 64px 24px 56px; }
          .features, .how-it-works { padding: 64px 24px; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="navbar-brand">
          <span className="navbar-logo">SupplyLens</span>
          <span className="navbar-tagline">Supply Chain Intelligence</span>
        </div>
        <button className="btn-dashboard" onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </button>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-badge">AI-Powered Supply Chain Analysis</div>
        <h1>See Through Every Supply Chain Disruption</h1>
        <p>
          Real-time news analysis powered by live market data and AI — giving supply chain
          professionals the intelligence they need to act fast.
        </p>
        <div className="hero-buttons">
          <button className="btn-primary" onClick={() => navigate('/dashboard')}>
            Start Analyzing →
          </button>
          <button className="btn-outline" onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}>
            How it works
          </button>
        </div>
      </section>

      {/* LIVE MARKET TICKER */}
      <div className="ticker-wrapper">
        <div className="ticker-track" ref={tickerRef}>
          {doubledTicker.map((item, i) => {
            const change = typeof item.change === 'number' ? item.change : parseFloat(item.change);
            const positive = change >= 0;
            return (
              <div className="ticker-item" key={i}>
                <span className="ticker-name">{item.name}</span>
                <span className="ticker-price">
                  ${typeof item.price === 'number' ? item.price.toLocaleString() : item.price}
                </span>
                <span className={`ticker-change ${positive ? 'positive' : 'negative'}`}>
                  {positive ? '▲' : '▼'}{Math.abs(change).toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* FEATURE CARDS */}
      <section className="features">
        <p className="section-label">Why SupplyLens</p>
        <h2 className="section-title">Built for Supply Chain Professionals</h2>
        <div className="cards-grid">
          <div className="card">
            <div className="card-icon">🔍</div>
            <h3>Live Intelligence</h3>
            <p>Fresh news from Reuters, NYT, Supply Chain Dive analyzed through a supply chain lens in real time.</p>
          </div>
          <div className="card">
            <div className="card-icon">📊</div>
            <h3>Market-Grounded</h3>
            <p>Every insight backed by live oil prices, commodity data, and GDP indicators from 8 major economies.</p>
          </div>
          <div className="card">
            <div className="card-icon">⚡</div>
            <h3>Action Ready</h3>
            <p>Industry-specific action plans tailored to your sector — not generic advice.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works" id="how-it-works">
        <p className="section-label">Getting Started</p>
        <h2 className="section-title">How It Works</h2>
        <div className="steps-grid">
          <div className="step">
            <div className="step-number">1</div>
            <div>
              <h3>Select your industry</h3>
              <p>Choose from automotive, pharma, retail, energy, and more. SupplyLens tailors every alert to your sector.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div>
              <h3>Browse live disruption alerts</h3>
              <p>See AI-analyzed news ranked by impact severity, grounded in real-time commodity and economic data.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div>
              <h3>Act on precise recommendations</h3>
              <p>Get concrete, industry-specific action steps so your team can respond before disruptions reach your supply chain.</p>
            </div>
          </div>
        </div>
      </section>

      <footer style={{
        textAlign: 'center',
        padding: '24px',
        borderTop: '1px solid #e2e8f0',
        color: '#64748b',
        fontSize: '14px',
        marginTop: '60px'
      }}>
        SupplyLens © 2026 — Built for supply chain professionals
      </footer>
    </>
  );
}
