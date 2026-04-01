import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchNews, fetchNewsByIndustry } from '../services/api';
import ImpactDiagram from '../components/ImpactDiagram';

const INDUSTRIES = ['All', 'Automotive', 'Electronics', 'Retail', 'Energy', 'Food & Agriculture', 'Pharma'];

function Dashboard() {
  const navigate = useNavigate();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState(null);

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

  const handleIndustrySelect = async (ind) => {
    setSelectedIndustry(ind);
    setSelectedArticle(null);
    setLoading(true);
    try {
      const data = ind === 'All'
        ? await fetchNews()
        : await fetchNewsByIndustry(ind);
      setNews(data.data || []);
    } catch(err) {
      setError('Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Navbar */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: '60px', backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100
      }}>
        <span style={{ fontSize: '18px', fontWeight: '700', color: '#1a2b4a' }}>SupplyLens</span>
        <button onClick={() => navigate('/')} style={{
          padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: '8px',
          background: 'white', cursor: 'pointer', fontSize: '13px', color: '#64748b'
        }}>← Home</button>
      </nav>

      {/* Industry Selector */}
      <div style={{
        padding: '16px 32px', backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '8px', flexWrap: 'wrap'
      }}>
        {INDUSTRIES.map(ind => (
          <button key={ind} onClick={() => handleIndustrySelect(ind)} style={{
            padding: '6px 16px', borderRadius: '99px', border: '1px solid #e2e8f0',
            cursor: 'pointer', fontSize: '13px', fontWeight: '500',
            backgroundColor: selectedIndustry === ind ? '#1a2b4a' : 'white',
            color: selectedIndustry === ind ? 'white' : '#64748b',
            transition: 'all 0.15s'
          }}>{ind}</button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', height: 'calc(100vh - 120px)' }}>
        
        {/* Left — News Feed */}
        <div style={{
          width: '380px', minWidth: '380px', backgroundColor: 'white',
          borderRight: '1px solid #e2e8f0', overflowY: 'auto'
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1a2b4a' }}>
              Live Disruption Feed
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
              {loading ? 'Loading...' : `${news.length} articles analyzed`}
            </p>
          </div>

          {loading && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              <p>Fetching and analyzing news...</p>
              <p style={{ fontSize: '12px' }}>This takes ~15 seconds on first load</p>
            </div>
          )}

          {error && (
            <div style={{ padding: '20px', color: '#ef4444', fontSize: '13px' }}>{error}</div>
          )}

          {!loading && news.map((article, index) => (
            <div key={index} onClick={() => setSelectedArticle(article)} style={{
              padding: '16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
              backgroundColor: selectedArticle?.title === article.title ? '#eff6ff' : 'white',
              borderLeft: selectedArticle?.title === article.title ? '3px solid #1a2b4a' : '3px solid transparent',
              transition: 'all 0.15s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{
                  fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px',
                  color: article.tag === 'Disruption' ? '#ef4444' :
                         article.tag === 'Trade' ? '#f59e0b' :
                         article.tag === 'Technology' ? '#3b82f6' :
                         article.tag === 'Economy' ? '#8b5cf6' : '#64748b'
                }}>{article.tag}</span>
                <span style={{
                  fontSize: '11px', fontWeight: '600',
                  color: article.sc_relevance_score >= 4 ? '#ef4444' :
                         article.sc_relevance_score >= 3 ? '#f59e0b' : '#64748b'
                }}>{'★'.repeat(article.sc_relevance_score)}</span>
              </div>
              <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: '600', color: '#1a2b4a', lineHeight: '1.4' }}>
                {article.title}
              </p>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                {article.source?.name || 'News'} · {article.pubDate ? new Date(article.pubDate).toLocaleDateString('en-GB', { timeZone: 'UTC' }) : ''}
              </p>
            </div>
          ))}
        </div>

        {/* Right — Article Detail */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          {!selectedArticle ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%', gap: '12px', color: '#94a3b8'
            }}>
              <div style={{ fontSize: '48px' }}>🔍</div>
              <h3 style={{ margin: 0, color: '#64748b' }}>Select an article</h3>
              <p style={{ margin: 0, fontSize: '14px' }}>Click any news item to see the full supply chain analysis</p>
            </div>
          ) : (
            <div style={{ maxWidth: '800px' }}>
              
              {/* Article header */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '700',
                    backgroundColor: selectedArticle.tag === 'Disruption' ? '#fef2f2' : '#eff6ff',
                    color: selectedArticle.tag === 'Disruption' ? '#ef4444' : '#3b82f6'
                  }}>{selectedArticle.tag}</span>
                  <span style={{
                    padding: '4px 10px', borderRadius: '99px', fontSize: '11px',
                    backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0'
                  }}>Relevance: {selectedArticle.sc_relevance_score}/5</span>
                </div>
                <h2 style={{ margin: '0 0 8px', fontSize: '22px', color: '#1a2b4a', lineHeight: '1.3' }}>
                  {selectedArticle.title}
                </h2>
                <a href={selectedArticle.link} target="_blank" rel="noreferrer"
                  style={{ fontSize: '12px', color: '#3b82f6' }}>Read full article →</a>
              </div>

              {/* Summary */}
              <div style={{
                backgroundColor: 'white', borderRadius: '12px', padding: '24px',
                border: '1px solid #e2e8f0', marginBottom: '16px'
              }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#1a2b4a' }}>
                  📋 Supply Chain Summary
                </h3>
                {selectedArticle.summary?.map((point, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <span style={{
                      width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#eff6ff',
                      color: '#3b82f6', fontSize: '11px', fontWeight: '700', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px'
                    }}>{i + 1}</span>
                    <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>{point}</p>
                  </div>
                ))}
              </div>

              {/* Ripple Effect */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                marginBottom: '16px'
              }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#1a2b4a' }}>
                  🕸️ Supply Chain Ripple Effect
                </h3>
                <ImpactDiagram ripple={selectedArticle.ripple} />
              </div>

              {/* Action Plan */}
              <div style={{
                backgroundColor: 'white', borderRadius: '12px', padding: '24px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#1a2b4a' }}>
                  ⚡ Recommended Actions
                </h3>
                {selectedArticle.recommended_actions?.map((action, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: '12px', padding: '12px',
                    backgroundColor: i === 0 ? '#fef2f2' : i === 1 ? '#fffbeb' : '#f0fdf4',
                    borderRadius: '8px', marginBottom: '8px', alignItems: 'flex-start'
                  }}>
                    <span style={{
                      fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px',
                      backgroundColor: i === 0 ? '#ef4444' : i === 1 ? '#f59e0b' : '#22c55e',
                      color: 'white', flexShrink: 0, marginTop: '2px'
                    }}>{i === 0 ? 'NOW' : i === 1 ? '30D' : 'LONG'}</span>
                    <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>{action}</p>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;