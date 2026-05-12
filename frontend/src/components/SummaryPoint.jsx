import { useState } from 'react';

function SummaryPoint({ point, quote, index }) {
  const [quoteOpen, setQuoteOpen] = useState(false);
  const hasQuote = quote && quote !== 'No direct quote available';
  return (
    <div style={{
      padding: '12px 0',
      borderBottom: '1px solid #1e1e2e'
    }}>
      <div style={{
        display: 'flex', gap: '10px',
        alignItems: 'flex-start',
        marginBottom: hasQuote ? '8px' : '0'
      }}>
        <span style={{
          color: '#06b6d4', fontWeight: '700',
          minWidth: '18px', fontSize: '13px'
        }}>{index + 1}</span>
        <span style={{
          color: '#e8e8f0', fontSize: '13px',
          lineHeight: '1.6', flex: 1
        }}>{point}</span>
        {hasQuote && (
          <button
            onClick={() => setQuoteOpen(!quoteOpen)}
            style={{
              background: quoteOpen
                ? 'rgba(6,182,212,0.15)'
                : 'transparent',
              border: '1px solid rgba(6,182,212,0.3)',
              color: '#06b6d4',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '10px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.15s',
            }}
          >
            {quoteOpen ? 'Hide source' : 'View source →'}
          </button>
        )}
      </div>
      {hasQuote && quoteOpen && (
        <div style={{
          marginLeft: '28px',
          background: 'rgba(6,182,212,0.05)',
          border: '1px solid rgba(6,182,212,0.15)',
          borderLeft: '3px solid #06b6d4',
          borderRadius: '0 6px 6px 0',
          padding: '10px 14px',
        }}>
          <div style={{
            fontSize: '10px', fontWeight: '700',
            color: '#06b6d4', letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '6px',
            fontFamily: 'Inter, sans-serif',
          }}>
            Source Quote
          </div>
          <div style={{
            fontSize: '12px',
            color: '#a0a0b8',
            lineHeight: '1.65',
            fontStyle: 'italic',
          }}>
            "{quote}"
          </div>
        </div>
      )}
    </div>
  );
}

export default SummaryPoint;
