export const LENS_OPTIONS = [
  { value: 'General',            label: '👤 General Analyst' },
  { value: 'Automotive',         label: '🚗 Automotive Manager' },
  { value: 'Semiconductors',     label: '💾 Semiconductor Analyst' },
  { value: 'Energy',             label: '⚡ Energy Procurement' },
  { value: 'Electronics',        label: '📱 Electronics Buyer' },
  { value: 'Retail',             label: '🛍️ Retail Buyer' },
  { value: 'Pharma',             label: '💊 Pharma Supply Chain' },
  { value: 'Food & Agriculture', label: '🌾 Food & Agriculture' },
  { value: 'Procurement',        label: '🔧 Procurement Manager' },
];

export const TAG_DOT = {
  Disruption: '#ef4444',
  Trade:      '#f59e0b',
  Technology: '#3b82f6',
  Economy:    '#8b5cf6',
  default:    '#6b6b8a',
};

export const TAG_BADGE_DARK = {
  Disruption: { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
  Trade:      { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
  Technology: { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6' },
  Economy:    { bg: 'rgba(139,92,246,0.12)',  color: '#8b5cf6' },
  default:    { bg: 'rgba(107,107,138,0.12)', color: '#6b6b8a' },
};

export const RISK_STAGES = [
  { icon: '🔍', label: 'Reading article content...' },
  { icon: '⚠️', label: 'Identifying 15 risk factors...' },
  { icon: '📊', label: 'Scoring probability and impact...' },
  { icon: '🎯', label: 'Building scenario plans...' },
  { icon: '📋', label: 'Formatting executive report...' },
];

export const ANALYZER_STAGES = [
  { icon: '🔍', label: 'Fetching article content...', duration: 2000 },
  { icon: '⚡', label: 'Running AI supply chain analysis...', duration: 8000 },
  { icon: '🌍', label: 'Mapping geographic impact...', duration: 2000 },
];
