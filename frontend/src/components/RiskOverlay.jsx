function RiskOverlay({ show, stage, stages }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0,
      right: 0, bottom: 0,
      background: 'rgba(13,13,20,0.95)',
      zIndex: 2000,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '32px'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '52px', marginBottom: '16px' }}>
          {stages[stage]?.icon}
        </div>
        <div style={{
          color: '#e8e8f0', fontSize: '18px',
          fontWeight: '600', marginBottom: '8px',
          fontFamily: 'Inter, sans-serif'
        }}>
          {stages[stage]?.label}
        </div>
        <div style={{ color: '#6b6b8a', fontSize: '13px' }}>
          Generating ERM-style risk report...
        </div>
      </div>
      <div style={{ width: '280px' }}>
        <div style={{
          background: '#1e1e2e', borderRadius: '4px',
          height: '4px', overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            background: '#7c3aed',
            width: `${((stage + 1) / stages.length) * 100}%`,
            transition: 'width 0.8s ease',
            borderRadius: '4px'
          }} />
        </div>
        <div style={{
          color: '#6b6b8a', fontSize: '11px',
          marginTop: '8px', textAlign: 'center',
          fontFamily: 'Inter, sans-serif'
        }}>
          Step {stage + 1} of {stages.length}
        </div>
      </div>
      <div style={{
        color: '#6b6b8a', fontSize: '11px',
        fontFamily: 'Inter, sans-serif'
      }}>
        This may take 15-25 seconds
      </div>
    </div>
  );
}

export default RiskOverlay;
