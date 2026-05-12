import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchNews, analyzeUrl, analyzeArticleWithLens, refreshNews, generateRiskReport } from '../services/api';
import { exportArticlePDF } from '../services/pdfExport';
import { openRiskReportPreview } from '../services/riskReportPDF';
import { fetchCommodities } from '../services/api';
import { checkSupplierRisk } from '../services/api';
import ImpactDiagram from '../components/ImpactDiagram';
import GeoImpactMap from '../components/GeoImpactMap';
import SupplierMonitor from '../components/SupplierMonitor';
import SummaryPoint from '../components/SummaryPoint';
import RiskOverlay from '../components/RiskOverlay';
import '../styles/dashboard.css';
import { LENS_OPTIONS, TAG_DOT, TAG_BADGE_DARK, RISK_STAGES, ANALYZER_STAGES } from '../constants/dashboard';
import { getSourceName, getArticleAge, calculateRiskScore } from '../utils/articleHelpers';


function Dashboard() {
  const navigate = useNavigate();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLens, setSelectedLens] = useState('General');
  const [lensLoading, setLensLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState(null);
  const [hoveredArticle, setHoveredArticle] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [commodities, setCommodities] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [analyzerMode, setAnalyzerMode] = useState(false);
  const [analyzerStage, setAnalyzerStage] = useState(0);
  const [analyzerResult, setAnalyzerResult] = useState(null);
  const [analyzerProgress, setAnalyzerProgress] = useState(0);
  const [analyzerLoading, setAnalyzerLoading] = useState(false);
  const [riskReportLoading, setRiskReportLoading] = useState(false);
  const [riskReportStage, setRiskReportStage] = useState(0);
  const [showRiskOverlay, setShowRiskOverlay] = useState(false);


  useEffect(() => {
    if (news.length > 0) setRiskData(calculateRiskScore(news));
  }, [news]);

  useEffect(() => {
    const loadNews = async () => {
      try {
        setLoading(true);
        const data = await fetchNews();
        setNews(data.data || []);
      } catch (err) {
        setError('Failed to load news. Make sure backend is running on port 3000.');
      } finally {
        setLoading(false);
      }
    };
    loadNews();
  }, []);

  useEffect(() => {
    fetchCommodities().then(setCommodities).catch(() => setCommodities([]));
  }, []);


  const handleAnalyzeUrl = async (lensOverride, silent = false) => {
    const lensToUse = lensOverride || selectedLens;
    if (!urlInput.trim()) return;

    if (silent) {
      setAnalyzerLoading(true);
      setAnalyzerResult(null);
      try {
        const response = await analyzeUrl(urlInput.trim(), lensToUse);
        setAnalyzerResult(response.data);
      } catch (err) {
        console.error('Re-analyze failed:', err);
      } finally {
        setAnalyzerLoading(false);
      }
      return;
    }

    setUrlLoading(true);
    setAnalyzerMode(true);
    setAnalyzerStage(0);
    setAnalyzerProgress(0);
    setAnalyzerResult(null);

    let stage = 0;
    const advanceStage = () => {
      stage++;
      if (stage < ANALYZER_STAGES.length) {
        setAnalyzerStage(stage);
        setAnalyzerProgress(0);
      }
    };
    const t1 = setTimeout(advanceStage, 2000);
    const t2 = setTimeout(advanceStage, 10000);
    const progressInterval = setInterval(() => {
      setAnalyzerProgress(prev => Math.min(prev + 2, 95));
    }, 200);

    try {
      const response = await analyzeUrl(urlInput.trim(), lensToUse);
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(progressInterval);
      setAnalyzerProgress(100);
      setAnalyzerStage(2);
      setTimeout(() => {
        setAnalyzerResult(response.data);
        setUrlLoading(false);
      }, 600);
    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(progressInterval);
      setAnalyzerMode(false);
      setUrlLoading(false);
    }
  };

  const handleLensChange = async (lens) => {
    setSelectedLens(lens);
    if (!selectedArticle) return;
    setLensLoading(true);
    try {
      const result = await analyzeArticleWithLens(selectedArticle, lens);
      if (result?.data) setSelectedArticle(result.data);
    } catch (err) {
      console.error('Lens change failed:', err);
    } finally {
      setLensLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await refreshNews();
      if (response?.data) {
        setNews(response.data);
        setSelectedArticle(null);
      }
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRiskReport = async (articleToUse) => {
    const art = articleToUse || selectedArticle;
    if (!art) return;

    setShowRiskOverlay(true);
    setRiskReportStage(0);
    setRiskReportLoading(true);

    const intervals = RISK_STAGES.map((_, i) =>
      setTimeout(() => setRiskReportStage(i), i * 3000)
    );

    try {
      const response = await generateRiskReport(art, selectedLens);
      intervals.forEach(clearTimeout);

      if (response?.success && response?.data) {
        setShowRiskOverlay(false);
        setRiskReportLoading(false);
        openRiskReportPreview(response.data, art, selectedLens);
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (err) {
      intervals.forEach(clearTimeout);
      setShowRiskOverlay(false);
      setRiskReportLoading(false);
      console.error('Risk report failed:', err);
      alert('Failed to generate risk report. Please try again.');
    }
  };

  const handleArticleSelect = (article) => {
    setSelectedLens('General');
    setSelectedArticle(article);
  };

  const tagDot   = (tag) => TAG_DOT[tag]        || TAG_DOT.default;
  const tagBadge = (tag) => TAG_BADGE_DARK[tag]  || TAG_BADGE_DARK.default;
  const isActive = (article) => selectedArticle?.title === article.title;
  const activeArticle = analyzerMode && analyzerResult ? analyzerResult : selectedArticle;


  /* ── derived stats for empty state ── */
  const validNews    = news.filter(a => a.sc_relevance_score > 0);
  const avgRelevance = validNews.length
    ? (validNews.reduce((s, a) => s + a.sc_relevance_score, 0) / validNews.length).toFixed(1)
    : '—';
  const highRiskCount = news.filter(a => a.sc_relevance_score >= 4).length;
  const topDisruptions = [...news]
    .filter(a => a.sc_relevance_score >= 4)
    .sort((a, b) => b.sc_relevance_score - a.sc_relevance_score)
    .slice(0, 3);

  const SHOWN_COMMODITIES = ['WTI Oil', 'Brent', 'Brent Crude', 'Gold', 'Copper', 'Wheat', 'Corn', 'Natural Gas'];
  const displayCommodities = commodities.length > 0
    ? commodities.filter(c => SHOWN_COMMODITIES.some(n => c.name?.includes(n))).slice(0, 6)
    : [];

  return (
    <>


      {/* NAVBAR */}
      <nav className="db-nav">
        <div className="db-nav-left">
          <span className="db-nav-logo">SupplyLens</span>
          <span className="db-nav-badge">Beta</span>
        </div>
        <button className="db-home-btn" onClick={() => navigate('/')}>← Home</button>
      </nav>

      {/* URL ANALYZER BAR */}
      <div className="db-url-bar">
        <span className="db-url-icon">🔗</span>
        <input
          className="db-url-input"
          type="text"
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAnalyzeUrl()}
          placeholder="Paste any news URL and press Enter..."
        />
        <button className="db-url-btn" onClick={() => handleAnalyzeUrl()} disabled={urlLoading}>
          {urlLoading ? 'Analyzing...' : 'Analyze →'}
        </button>
        {urlError && <span className="db-url-err">{urlError}</span>}
      </div>

      {/* RISK BANNER */}
      {riskData && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '20px',
          padding: '10px 24px', backgroundColor: '#13131f',
          borderBottom: '1px solid #1e1e2e',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '10px',
              backgroundColor: riskData.color + '18',
              border: `2px solid ${riskData.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', fontWeight: '800', color: riskData.color,
            }}>{riskData.score}</div>
            <div>
              <div style={{ fontSize: '10px', color: '#6b6b8a', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Supply Chain Risk
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: riskData.color }}>
                {riskData.level} RISK
              </div>
            </div>
          </div>

          <div style={{ width: '1px', height: '36px', backgroundColor: '#1e1e2e' }} />

          <div style={{ display: 'flex', gap: '8px', flex: 1, flexWrap: 'wrap' }}>
            {riskData.topRisks.map((r, i) => (
              <div key={i} style={{
                padding: '3px 10px', borderRadius: '99px',
                backgroundColor: '#0d0d14', border: '1px solid #1e1e2e',
                fontSize: '11px', color: '#6b6b8a',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <span style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  backgroundColor: r.score >= 5 ? '#ef4444' : '#f59e0b', flexShrink: 0,
                }} />
                {r.title.length > 45 ? r.title.substring(0, 45) + '...' : r.title}
              </div>
            ))}
          </div>

          <div style={{ fontSize: '11px', color: '#6b6b8a', whiteSpace: 'nowrap' }}>
            Based on {news.filter(a => a.sc_relevance_score > 0).length} articles
          </div>
        </div>
      )}

      {/* MAIN LAYOUT */}
      <div className="db-body">

        {/* LEFT PANEL */}
        <div className="db-left">
          <div className="db-left-header">
            <span className="db-left-title">Live Feed</span>
            <div className="db-left-right">
              <span className="db-left-count">
                {loading ? '...' : `${news.length} articles`}
              </span>
              <button
                className="db-refresh-btn"
                onClick={handleRefresh}
                disabled={refreshing}
                title="Refresh feed"
              >
                {refreshing ? (
                  <span style={{
                    display: 'inline-block', width: '12px', height: '12px',
                    border: '2px solid #1e1e2e', borderTop: '2px solid #06b6d4',
                    borderRadius: '50%', animation: 'spin 1s linear infinite',
                  }} />
                ) : '🔄'}
              </button>
            </div>
          </div>

          {loading && (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <div style={{
                width: '28px', height: '28px',
                border: '3px solid #1e1e2e', borderTop: '3px solid #06b6d4',
                borderRadius: '50%', animation: 'spin 1s linear infinite',
                margin: '0 auto 12px',
              }} />
              <p style={{ fontSize: '13px', color: '#6b6b8a', margin: '0 0 4px' }}>Analyzing live news...</p>
              <p style={{ fontSize: '11px', color: '#6b6b8a', opacity: 0.6, margin: 0 }}>First load takes ~10 seconds</p>
            </div>
          )}

          {error && <div className="db-error">{error}</div>}

          {!loading && news
            .filter(a => a.tag !== 'Unknown' && a.sc_relevance_score > 0)
            .map((article, index) => {
            const dot    = tagDot(article.tag);
            const active = isActive(article);
            const pct    = ((article.sc_relevance_score || 0) / 5) * 100;
            return (
              <div
                key={index}
                className={`db-card ${active ? 'db-card-active' : ''}`}
                onClick={() => handleArticleSelect(article)}
                onMouseEnter={() => setHoveredArticle(index)}
                onMouseLeave={() => setHoveredArticle(null)}
              >
                <div className="db-card-top">
                  <span className="db-tag-dot" style={{ background: dot }} />
                  <span className="db-tag-label" style={{ color: dot }}>{article.tag}</span>
                </div>
                <p className="db-card-title">{article.title}</p>
                <p className="db-card-meta">
                  {getSourceName(article.link)}
                  {article.pubDate
                    ? ' · ' + new Date(article.pubDate).toLocaleDateString('en-GB', { timeZone: 'UTC' })
                    : ''}
                </p>
                <div className="db-progress-wrap">
                  <div className="db-progress-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT PANEL */}
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#0d0d14', display: 'flex', justifyContent: 'center' }}>
          {!selectedArticle ? (
            /* ── MORNING BRIEFING EMPTY STATE ── */
            <div style={{
              width: '100%',
              maxWidth: '960px',
              padding: '32px 32px',
              animation: 'fadeUp 0.5s ease forwards'
            }}>
              <style>{`
                @keyframes fadeUp {
                  from { opacity: 0; transform: translateY(16px); }
                  to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse {
                  0%, 100% { opacity: 1; }
                  50%       { opacity: 0.4; }
                }
                @keyframes slideIn {
                  from { opacity: 0; transform: translateX(-12px); }
                  to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes countUp {
                  from { opacity: 0; transform: translateY(8px); }
                  to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes shimmer {
                  0%   { background-position: -200% center; }
                  100% { background-position: 200% center; }
                }
                @keyframes borderPulse {
                  0%, 100% { border-color: rgba(239,68,68,0.3); }
                  50%       { border-color: rgba(239,68,68,0.8); }
                }
                .threat-card {
                  cursor: pointer;
                  transition: all 0.2s ease;
                  border: 1px solid #1e1e2e;
                }
                .threat-card:hover {
                  border-color: #06b6d4 !important;
                  transform: translateY(-2px);
                  box-shadow: 0 8px 32px rgba(6,182,212,0.1);
                }
                .signal-row {
                  transition: all 0.15s ease;
                  cursor: default;
                }
                .signal-row:hover {
                  background: rgba(6,182,212,0.05) !important;
                }
                .cta-article:hover {
                  border-color: #06b6d4 !important;
                  transform: translateX(4px);
                }
                .cta-article {
                  transition: all 0.2s ease;
                }
              `}</style>

              {/* ── ROW 1: THREAT LEVEL BANNER ── */}
              {riskData && (
                <div style={{
                  background: '#13131f',
                  border: riskData.level === 'HIGH'
                    ? '1px solid rgba(239,68,68,0.4)'
                    : '1px solid #1e1e2e',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  animation: riskData.level === 'HIGH'
                    ? 'borderPulse 2s ease infinite'
                    : 'none',
                  animationDelay: '1s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {/* Big risk score */}
                    <div style={{
                      width: '64px', height: '64px',
                      borderRadius: '12px',
                      background: `${riskData.color}15`,
                      border: `2px solid ${riskData.color}`,
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      animation: riskData.level === 'HIGH'
                        ? 'pulse 2s ease-in-out infinite' : 'none',
                    }}>
                      <span style={{
                        fontSize: '20px', fontWeight: '900',
                        color: riskData.color, lineHeight: '1',
                        fontFamily: 'Inter, sans-serif',
                      }}>
                        {riskData.score}
                      </span>
                      <span style={{
                        fontSize: '7px', fontWeight: '700',
                        color: riskData.color, letterSpacing: '0.5px',
                      }}>
                        /10
                      </span>
                    </div>

                    <div>
                      <div style={{
                        fontSize: '10px', fontWeight: '700',
                        color: '#6b6b8a', letterSpacing: '1.5px',
                        textTransform: 'uppercase', marginBottom: '4px',
                      }}>
                        Today's Threat Level
                      </div>
                      <div style={{
                        fontSize: '22px', fontWeight: '800',
                        color: riskData.color, letterSpacing: '-0.3px',
                      }}>
                        {riskData.level} RISK
                      </div>
                      <div style={{
                        fontSize: '11px', color: '#6b6b8a', marginTop: '2px',
                      }}>
                        Based on {news.filter(a => a.sc_relevance_score > 0).length} analyzed articles
                        · {new Date().toLocaleDateString('en-GB', {
                          weekday: 'long', day: 'numeric', month: 'long'
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Top 3 risk pills */}
                  <div style={{
                    display: 'flex', flexDirection: 'column',
                    gap: '6px', maxWidth: '420px',
                  }}>
                    {riskData.topRisks.map((r, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '6px 12px',
                        background: '#0d0d14',
                        border: '1px solid #1e1e2e',
                        borderRadius: '6px',
                        animation: `slideIn 0.4s ease ${0.2 + i * 0.1}s both`,
                      }}>
                        <span style={{
                          width: '5px', height: '5px', borderRadius: '50%',
                          background: r.score >= 5 ? '#ef4444' : '#f59e0b',
                          flexShrink: 0,
                        }} />
                        <span style={{
                          fontSize: '11px', color: '#a0a0b8',
                          whiteSpace: 'nowrap', overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {r.title.length > 52
                            ? r.title.substring(0, 52) + '...'
                            : r.title}
                        </span>
                        <span style={{
                          fontSize: '10px', fontWeight: '700',
                          color: r.score >= 5 ? '#ef4444' : '#f59e0b',
                          marginLeft: 'auto', flexShrink: 0,
                        }}>
                          {r.score}/5
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {loading && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '60vh',
                  gap: '32px',
                }}>
                  {/* Terminal-style loading */}
                  <div style={{
                    background: '#13131f',
                    border: '1px solid #1e1e2e',
                    borderRadius: '12px',
                    padding: '32px 48px',
                    textAlign: 'center',
                    minWidth: '400px',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      marginBottom: '24px',
                    }}>
                      <div style={{
                        width: '10px', height: '10px',
                        borderRadius: '50%',
                        background: '#06b6d4',
                        animation: 'pulse 1s ease-in-out infinite',
                      }} />
                      <span style={{
                        fontSize: '11px', fontWeight: '700',
                        color: '#06b6d4', letterSpacing: '2px',
                        textTransform: 'uppercase',
                      }}>
                        Intelligence Feed Initializing
                      </span>
                    </div>

                    {/* Progress steps */}
                    {[
                      { label: 'Connecting to live news sources', done: true },
                      { label: 'Fetching commodity prices', done: commodities.length > 0 },
                      { label: 'Running AI supply chain analysis', done: false },
                    ].map((step, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 0',
                        borderBottom: i < 2
                          ? '1px solid #1e1e2e' : 'none',
                        animation: `slideIn 0.4s ease ${i * 0.15}s both`,
                      }}>
                        <span style={{
                          fontSize: '12px',
                          color: step.done ? '#10b981' : '#06b6d4',
                        }}>
                          {step.done ? '✓' : '›'}
                        </span>
                        <span style={{
                          fontSize: '12px',
                          color: step.done ? '#6b6b8a' : '#e8e8f0',
                          fontFamily: 'Inter, sans-serif',
                        }}>
                          {step.label}
                        </span>
                        {!step.done && (
                          <span style={{
                            marginLeft: 'auto',
                            width: '14px', height: '14px',
                            border: '2px solid #1e1e2e',
                            borderTop: '2px solid #06b6d4',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            flexShrink: 0,
                          }} />
                        )}
                      </div>
                    ))}

                    <div style={{
                      marginTop: '20px',
                      fontSize: '11px',
                      color: '#6b6b8a',
                      lineHeight: '1.6',
                    }}>
                      First load takes ~10 seconds<br/>
                      Subsequent loads served from cache
                    </div>
                  </div>
                </div>
              )}


              {/* ── ROW 2: TOP DISRUPTION + MARKET SIGNALS ── */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 320px',
                gap: '16px',
                marginBottom: '20px',
              }}>

                {/* Top disruption card */}
                {topDisruptions[0] && (() => {
                  const a = topDisruptions[0];
                  const dot = tagDot(a.tag);
                  return (
                    <div
                      className="threat-card"
                      style={{
                        background: '#13131f',
                        borderRadius: '12px',
                        padding: '22px 24px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '180px',
                      }}
                      onClick={() => handleArticleSelect(a)}
                    >
                      <div>
                        <div style={{
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '12px',
                        }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                          }}>
                            <span style={{
                              width: '7px', height: '7px',
                              borderRadius: '50%', background: dot,
                              animation: 'pulse 1.5s ease-in-out infinite',
                            }} />
                            <span style={{
                              fontSize: '9px', fontWeight: '700',
                              color: dot, letterSpacing: '1.5px',
                              textTransform: 'uppercase',
                            }}>
                              Top Disruption Right Now
                            </span>
                          </div>
                          <span style={{
                            fontSize: '10px', fontWeight: '700',
                            color: a.sc_relevance_score >= 4
                              ? '#ef4444' : '#f59e0b',
                            background: a.sc_relevance_score >= 4
                              ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                            padding: '3px 10px', borderRadius: '4px',
                          }}>
                            {a.sc_relevance_score}/5 RISK
                          </span>
                        </div>

                        <div style={{
                          fontSize: '17px', fontWeight: '700',
                          color: '#e8e8f0', lineHeight: '1.35',
                          marginBottom: '12px', letterSpacing: '-0.2px',
                        }}>
                          {a.title}
                        </div>

                        {a.article_summary && (
                          <div style={{
                            fontSize: '12px', color: '#6b6b8a',
                            lineHeight: '1.6',
                          }}>
                            {a.article_summary.length > 120
                              ? a.article_summary.substring(0, 120) + '...'
                              : a.article_summary}
                          </div>
                        )}
                      </div>

                      <div style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '16px',
                        paddingTop: '12px',
                        borderTop: '1px solid #1e1e2e',
                      }}>
                        <span style={{
                          fontSize: '11px', color: '#6b6b8a',
                        }}>
                          {getSourceName(a.link)} · {a.pubDate
                            ? new Date(a.pubDate).toLocaleDateString('en-GB',
                              { timeZone: 'UTC' })
                            : ''}
                        </span>
                        <span style={{
                          fontSize: '11px', fontWeight: '600',
                          color: '#06b6d4',
                        }}>
                          Click to analyze →
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Market signals panel */}
                <div style={{
                  background: '#13131f',
                  border: '1px solid #1e1e2e',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  <div style={{
                    fontSize: '9px', fontWeight: '700',
                    color: '#6b6b8a', letterSpacing: '1.5px',
                    textTransform: 'uppercase', marginBottom: '14px',
                  }}>
                    Market Signals
                  </div>

                  {displayCommodities.length === 0 ? (
                    <div style={{
                      fontSize: '12px', color: '#6b6b8a',
                      textAlign: 'center', padding: '20px 0',
                      lineHeight: '1.6',
                    }}>
                      Loading market data...
                    </div>
                  ) : (
                    displayCommodities.slice(0, 5).map((c, i) => {
                      const chg = typeof c.change === 'number'
                        ? c.change : parseFloat(c.change);
                      const up = chg >= 0;
                      const absChg = Math.abs(chg);
                      const isSignificant = absChg >= 2;
                      return (
                        <div
                          key={i}
                          className="signal-row"
                          style={{
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 8px',
                            borderRadius: '6px',
                            marginBottom: '4px',
                            animation: `slideIn 0.4s ease ${i * 0.08}s both`,
                          }}
                        >
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                          }}>
                            {isSignificant && (
                              <span style={{
                                width: '5px', height: '5px',
                                borderRadius: '50%',
                                background: up ? '#10b981' : '#ef4444',
                                animation: 'pulse 1s ease-in-out infinite',
                                flexShrink: 0,
                              }} />
                            )}
                            {!isSignificant && (
                              <span style={{
                                width: '5px', height: '5px',
                                borderRadius: '50%',
                                background: '#1e1e2e',
                                flexShrink: 0,
                              }} />
                            )}
                            <span style={{
                              fontSize: '11px', color: '#a0a0b8',
                              fontWeight: isSignificant ? '600' : '400',
                            }}>
                              {c.name}
                            </span>
                          </div>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                          }}>
                            <span style={{
                              fontSize: '11px', fontWeight: '700',
                              color: '#e8e8f0',
                            }}>
                              ${typeof c.price === 'number'
                                ? c.price.toLocaleString() : c.price}
                            </span>
                            <span style={{
                              fontSize: '10px', fontWeight: '700',
                              color: up ? '#10b981' : '#ef4444',
                              minWidth: '52px', textAlign: 'right',
                            }}>
                              {up ? '▲' : '▼'} {absChg.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}

                  <div style={{
                    marginTop: 'auto',
                    paddingTop: '12px',
                    borderTop: '1px solid #1e1e2e',
                    fontSize: '9px', color: '#6b6b8a',
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}>
                    <span style={{
                      width: '4px', height: '4px', borderRadius: '50%',
                      background: '#10b981',
                      animation: 'pulse 1.5s ease-in-out infinite',
                      display: 'inline-block',
                    }} />
                    Live · Yahoo Finance ·
                    {new Date().toLocaleTimeString('en-GB', {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>

              {/* ── ROW 3: OTHER ARTICLES ── */}
              {topDisruptions.length > 1 && (
                <div style={{
                  background: '#13131f',
                  border: '1px solid #1e1e2e',
                  borderRadius: '12px',
                  padding: '16px 20px',
                }}>
                  <div style={{
                    fontSize: '9px', fontWeight: '700',
                    color: '#6b6b8a', letterSpacing: '1.5px',
                    textTransform: 'uppercase', marginBottom: '12px',
                  }}>
                    Also Monitoring
                  </div>
                  {topDisruptions.slice(1).map((a, i) => {
                    const dot = tagDot(a.tag);
                    return (
                      <div
                        key={i}
                        className="cta-article"
                        onClick={() => handleArticleSelect(a)}
                        style={{
                          display: 'flex', alignItems: 'center',
                          gap: '12px', padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid transparent',
                          marginBottom: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{
                          width: '6px', height: '6px',
                          borderRadius: '50%', background: dot,
                          flexShrink: 0,
                        }} />
                        <span style={{
                          fontSize: '13px', color: '#e8e8f0',
                          flex: 1, lineHeight: '1.4',
                        }}>
                          {a.title}
                        </span>
                        <span style={{
                          fontSize: '10px', fontWeight: '700',
                          color: dot, flexShrink: 0,
                        }}>
                          {a.tag}
                        </span>
                        <span style={{
                          fontSize: '10px', color: '#6b6b8a',
                          flexShrink: 0,
                        }}>
                          {a.sc_relevance_score}/5
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── LOADING STATE ── */}
              {loading && (
                <div style={{
                  textAlign: 'center', padding: '80px 0',
                }}>
                  <div style={{
                    width: '32px', height: '32px',
                    border: '3px solid #1e1e2e',
                    borderTop: '3px solid #06b6d4',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 16px',
                  }} />
                  <div style={{
                    fontSize: '13px', color: '#6b6b8a',
                    marginBottom: '4px',
                  }}>
                    Analyzing live supply chain news...
                  </div>
                  <div style={{
                    fontSize: '11px', color: '#6b6b8a', opacity: 0.6,
                  }}>
                    First load takes ~10 seconds
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* ── ARTICLE VIEW ── */
            <div style={{ width: '100%', maxWidth: '960px', padding: '24px 32px' }}>
              <div style={{ minHeight: '100%', paddingBottom: '60px' }}>

              <h2 className="db-article-title">{selectedArticle.title}</h2>

              <div className="db-meta-row">
                <span
                  className="db-tag-pill"
                  style={{
                    background: tagBadge(selectedArticle.tag).bg,
                    color: tagBadge(selectedArticle.tag).color,
                  }}
                >
                  {selectedArticle.tag}
                </span>
                <span className="db-relevance-pill">
                  Relevance {selectedArticle.sc_relevance_score}/5
                </span>
                {selectedArticle.source?.name && (
                  <span className="db-source-text">{selectedArticle.source.name}</span>
                )}
                {selectedArticle.geo_impact && (
                  <button className="db-map-btn" onClick={() => setShowMap(true)}>
                    🗺️ Map
                  </button>
                )}
                <button
                  className="db-map-btn"
                  style={{ background: '#1e1e2e', color: '#e8e8f0', marginLeft: '4px' }}
                  onClick={() => {
                    console.log('Commodities at export:', commodities);
                    exportArticlePDF(
                      selectedArticle,
                      selectedLens,
                      Array.isArray(commodities) ? commodities : []
                    );
                  }}
                >
                  ⬇ Export PDF
                </button>
                <button
                  className="db-map-btn"
                  style={{
                    background: '#7c3aed',
                    color: '#fff',
                    marginLeft: '4px'
                  }}
                  onClick={() => handleRiskReport(selectedArticle)}
                  disabled={riskReportLoading}
                >
                  {riskReportLoading ? '⏳ Generating...' : '⚠️ Risk Report'}
                </button>
              </div>

              {/* Age warning */}
              {getArticleAge(selectedArticle.pubDate) && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  color: '#f59e0b',
                  marginBottom: '12px'
                }}>
                  ⚠️ Dated intel — {getArticleAge(selectedArticle.pubDate)}d old. Verify before acting.
                </div>
              )}

              {/* Lens selector */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', backgroundColor: '#13131f',
                borderRadius: '12px', marginBottom: '16px',
                border: '1px solid #1e1e2e',
              }}>
                <span style={{ fontSize: '12px', color: '#6b6b8a', fontWeight: '500', whiteSpace: 'nowrap' }}>
                  👤 Viewing as:
                </span>
                <select
                  value={selectedLens}
                  onChange={e => handleLensChange(e.target.value)}
                  disabled={lensLoading}
                  style={{
                    padding: '5px 10px', borderRadius: '6px',
                    border: '1px solid #1e1e2e', fontSize: '13px',
                    color: '#e8e8f0', backgroundColor: '#0d0d14',
                    cursor: 'pointer', fontWeight: '500',
                    opacity: lensLoading ? 0.6 : 1, outline: 'none',
                  }}
                >
                  {LENS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {lensLoading && (
                  <span style={{ fontSize: '12px', color: '#06b6d4' }}>Re-analyzing...</span>
                )}
              </div>

              {/* Article Summary */}
              {selectedArticle.article_summary && (
                <div style={{
                  background: '#13131f',
                  border: '1px solid #1e1e2e',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    letterSpacing: '0.1em',
                    color: '#6b6b8a',
                    marginBottom: '12px'
                  }}>
                    📰 ARTICLE SUMMARY
                  </div>
                  <p style={{
                    color: '#a0a0b8',
                    fontSize: '13px',
                    lineHeight: '1.7',
                    margin: 0
                  }}>
                    {selectedArticle.article_summary}
                  </p>
                  <a
                    href={selectedArticle.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#06b6d4',
                      fontSize: '12px',
                      marginTop: '10px',
                      display: 'inline-block'
                    }}
                  >
                    Read full article →
                  </a>
                </div>
              )}

              {/* Supply Chain Summary */}
              <div className="db-detail-card">
                <div className="db-card-heading">📋 Supply Chain Summary</div>
                {selectedArticle.summary?.map((point, i) => (
                  <SummaryPoint
                    key={i}
                    point={point}
                    quote={selectedArticle.source_quotes?.[i]}
                    index={i}
                  />
                ))}
              </div>

              {/* Ripple Effect */}
              <div style={{
                backgroundColor: '#13131f',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #1e1e2e',
                marginBottom: '16px',
                maxHeight: '420px',
                overflowY: 'auto'
              }}>
                <div className="db-card-heading">🕸️ Ripple Effect</div>
                <ImpactDiagram ripple={selectedArticle.ripple} />
              </div>

              {/* Action Plan */}
              <div className="db-detail-card">
                <div className="db-card-heading">⚡ Action Plan</div>
                {selectedArticle.recommended_actions?.map((action, i) => (
                  <div
                    key={i}
                    className={`db-action-row ${i === 0 ? 'db-action-now' : i === 1 ? 'db-action-30d' : 'db-action-long'}`}
                  >
                    <span
                      className="db-action-badge"
                      style={{ background: i === 0 ? '#ef4444' : i === 1 ? '#f59e0b' : '#10b981' }}
                    >
                      {i === 0 ? 'NOW' : i === 1 ? '30D' : 'LONG'}
                    </span>
                    <p className="db-action-text">{action}</p>
                  </div>
                ))}
              </div>

              {selectedArticle.insights?.length > 0 && (
                <div style={{
                  background: '#13131f',
                  border: '1px solid #1e1e2e',
                  borderRadius: '8px',
                  padding: '20px',
                  marginTop: '16px'
                }}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    letterSpacing: '0.1em',
                    color: '#6b6b8a',
                    marginBottom: '16px'
                  }}>
                    💡 INDUSTRY INSIGHTS
                  </div>
                  {selectedArticle.insights.map((insight, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px 0',
                      borderBottom: i < selectedArticle.insights.length - 1
                        ? '1px solid #1e1e2e' : 'none'
                    }}>
                      <div style={{
                        color: '#06b6d4',
                        fontWeight: '700',
                        fontSize: '13px',
                        minWidth: '20px'
                      }}>
                        {i + 1}
                      </div>
                      <div style={{
                        color: '#e8e8f0',
                        fontSize: '13px',
                        lineHeight: '1.6'
                      }}>
                        {insight}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              </div>
            </div>
          )}
        </div>
      </div>

      {/* GEO MAP OVERLAY */}
      {showMap && activeArticle?.geo_impact && (
        <GeoImpactMap
          geoImpact={activeArticle.geo_impact}
          onClose={() => setShowMap(false)}
        />
      )}

      {/* ANALYZER OVERLAY */}
      {analyzerMode && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: '#0d0d14', zIndex: 1000,
          display: 'flex', flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            padding: '20px 32px', borderBottom: '1px solid #1e1e2e',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#06b6d4', fontWeight: '700', fontSize: '16px' }}>SupplyLens</span>
              <span style={{ color: '#6b6b8a', fontSize: '13px' }}>/ Custom Analysis</span>
            </div>
            {analyzerResult && (
              <button onClick={() => { setAnalyzerMode(false); setAnalyzerResult(null); setUrlInput(''); }} style={{
                background: 'transparent', border: '1px solid #1e1e2e',
                color: '#e8e8f0', cursor: 'pointer',
                padding: '8px 16px', borderRadius: '6px', fontSize: '13px'
              }}>
                ← Back to Feed
              </button>
            )}
          </div>

          {/* Loading state */}
          {!analyzerResult && (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '40px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                  {ANALYZER_STAGES[analyzerStage]?.icon}
                </div>
                <div style={{ color: '#e8e8f0', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                  {ANALYZER_STAGES[analyzerStage]?.label}
                </div>
                <div style={{ color: '#6b6b8a', fontSize: '13px' }}>
                  Analyzing for {selectedLens} perspective
                </div>
              </div>
              <div style={{ width: '320px' }}>
                <div style={{ background: '#1e1e2e', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', background: '#06b6d4',
                    width: `${analyzerProgress}%`,
                    transition: 'width 0.2s ease', borderRadius: '4px'
                  }} />
                </div>
                <div style={{ color: '#6b6b8a', fontSize: '11px', marginTop: '8px', textAlign: 'center' }}>
                  Stage {analyzerStage + 1} of {ANALYZER_STAGES.length}
                </div>
              </div>
            </div>
          )}

          {/* Result state */}
          {(analyzerResult || analyzerLoading) && (
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '100%', maxWidth: '960px', padding: '32px' }}>

              {analyzerLoading && (
                <div style={{ textAlign: 'center', padding: '60px', color: '#6b6b8a', fontSize: '14px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '12px' }}>⚡</div>
                  Re-analyzing for {selectedLens}...
                </div>
              )}

              {!analyzerLoading && analyzerResult && (<div>
                <h2 className="db-article-title">{analyzerResult.title}</h2>
                <div className="db-meta-row">
                  <span className="db-tag-pill" style={{
                    background: tagBadge(analyzerResult.tag).bg,
                    color: tagBadge(analyzerResult.tag).color,
                  }}>{analyzerResult.tag}</span>
                  <span className="db-relevance-pill">Relevance {analyzerResult.sc_relevance_score}/5</span>
                  {analyzerResult.geo_impact && (
                    <button className="db-map-btn" onClick={() => setShowMap(true)}>🗺️ Map</button>
                  )}
                  <button
                    className="db-map-btn"
                    style={{ background: '#1e1e2e', color: '#e8e8f0', marginLeft: '4px' }}
                    onClick={() => {
                      console.log('Commodities at export:', commodities);
                      exportArticlePDF(
                        analyzerResult,
                        selectedLens,
                        Array.isArray(commodities) ? commodities : []
                      );
                    }}
                  >
                    ⬇ Export PDF
                  </button>
                  <button
                    className="db-map-btn"
                    style={{
                      background: '#7c3aed',
                      color: '#fff',
                      marginLeft: '4px'
                    }}
                    onClick={() => handleRiskReport(analyzerResult)}
                    disabled={riskReportLoading}
                  >
                    {riskReportLoading ? '⏳ Generating...' : '⚠️ Risk Report'}
                  </button>
                </div>

                <div style={{
                  background: '#13131f', border: '1px solid #1e1e2e', borderRadius: '8px',
                  padding: '16px 20px', marginBottom: '16px',
                  display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                  <span style={{ color: '#6b6b8a', fontSize: '13px' }}>👤 Viewing as:</span>
                  <select
                    value={selectedLens}
                    onChange={(e) => {
                      setSelectedLens(e.target.value);
                      handleAnalyzeUrl(e.target.value, true);
                    }}
                    style={{
                      background: '#0d0d14', border: '1px solid #1e1e2e',
                      color: '#e8e8f0', padding: '6px 12px',
                      borderRadius: '6px', fontSize: '13px', cursor: 'pointer'
                    }}
                  >
                    <option value="General">👤 General Analyst</option>
                    <option value="Automotive">🚗 Automotive</option>
                    <option value="Semiconductors">💾 Semiconductors</option>
                    <option value="Electronics">📱 Electronics</option>
                    <option value="Energy">⚡ Energy</option>
                    <option value="Food & Agriculture">🌾 Food & Agriculture</option>
                    <option value="Pharma">💊 Pharma</option>
                    <option value="Retail">🛒 Retail</option>
                    <option value="Procurement">✏️ Procurement</option>
                  </select>
                </div>

                {analyzerResult.article_summary && (
                  <div style={{ background: '#13131f', border: '1px solid #1e1e2e', borderRadius: '8px', padding: '20px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.1em', color: '#6b6b8a', marginBottom: '12px' }}>
                      📰 ARTICLE SUMMARY
                    </div>
                    <p style={{ color: '#a0a0b8', fontSize: '13px', lineHeight: '1.7', margin: 0 }}>
                      {analyzerResult.article_summary}
                    </p>
                    <a href={analyzerResult.link} target="_blank" rel="noopener noreferrer"
                      style={{ color: '#06b6d4', fontSize: '12px', marginTop: '10px', display: 'inline-block' }}>
                      Read full article →
                    </a>
                  </div>
                )}

                <div className="db-detail-card">
                  <div className="db-card-heading">📋 Supply Chain Summary</div>
                  {analyzerResult.summary?.map((point, i) => (
                    <SummaryPoint
                      key={i}
                      point={point}
                      quote={analyzerResult.source_quotes?.[i]}
                      index={i}
                    />
                  ))}
                </div>

                <div style={{ backgroundColor: '#13131f', borderRadius: '12px', padding: '20px', border: '1px solid #1e1e2e', marginBottom: '16px', maxHeight: '420px', overflowY: 'auto' }}>
                  <div className="db-card-heading">🕸️ Ripple Effect</div>
                  <ImpactDiagram ripple={analyzerResult.ripple} />
                </div>

                <div className="db-detail-card">
                  <div className="db-card-heading">⚡ Action Plan</div>
                  {analyzerResult.recommended_actions?.map((action, i) => (
                    <div key={i} className={`db-action-row ${i === 0 ? 'db-action-now' : i === 1 ? 'db-action-30d' : 'db-action-long'}`}>
                      <span className="db-action-badge" style={{ background: i === 0 ? '#ef4444' : i === 1 ? '#f59e0b' : '#10b981' }}>
                        {i === 0 ? 'NOW' : i === 1 ? '30D' : 'LONG'}
                      </span>
                      <p className="db-action-text">{action}</p>
                    </div>
                  ))}
                </div>

                {analyzerResult.insights?.length > 0 && (
                  <div style={{ background: '#13131f', border: '1px solid #1e1e2e', borderRadius: '8px', padding: '20px', marginTop: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.1em', color: '#6b6b8a', marginBottom: '16px' }}>
                      💡 INDUSTRY INSIGHTS
                    </div>
                    {analyzerResult.insights.map((insight, i) => (
                      <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: i < analyzerResult.insights.length - 1 ? '1px solid #1e1e2e' : 'none' }}>
                        <div style={{ color: '#06b6d4', fontWeight: '700', fontSize: '13px', minWidth: '20px' }}>{i + 1}</div>
                        <div style={{ color: '#e8e8f0', fontSize: '13px', lineHeight: '1.6' }}>{insight}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )}

            </div>
          </div>
        )}
      </div>
    )}
      <RiskOverlay
        show={showRiskOverlay}
        stage={riskReportStage}
        stages={RISK_STAGES}
      />
    </>
  );
}

export default Dashboard;
