import { useEffect, useRef } from 'react';

function GeoImpactMap({ geoImpact, onClose }) {
  const mapRef         = useRef(null);
  const mapInstanceRef = useRef(null);

  const epicenter       = geoImpact?.epicenter            || [];
  const highRisk        = geoImpact?.high_risk_countries  || [];
  const secondary       = geoImpact?.secondary_impact     || [];
  const ports           = geoImpact?.affected_ports       || [];
  const routes          = geoImpact?.disrupted_routes     || [];

  useEffect(() => {
    if (!geoImpact || mapInstanceRef.current) return;
    const L = window.L;
    if (!L) return;

    const map = L.map(mapRef.current, { center: [20, 0], zoom: 2, zoomControl: true });
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    const allAffectedCountries = [...epicenter, ...highRisk, ...secondary];

    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
      .then(r => r.json())
      .then(data => {
        L.geoJSON(data, {
          style: feature => {
            const name = feature.properties?.ADMIN || feature.properties?.name || '';
            if (!name) return { fillOpacity: 0, color: 'transparent', weight: 0 };
            if (epicenter.some(c => name.toLowerCase().includes(c.toLowerCase())))
              return { fillColor: '#ef4444', fillOpacity: 0.5, color: '#ef4444', weight: 1 };
            if (highRisk.some(c => name.toLowerCase().includes(c.toLowerCase())))
              return { fillColor: '#f97316', fillOpacity: 0.35, color: '#f97316', weight: 1 };
            if (secondary.some(c => name.toLowerCase().includes(c.toLowerCase())))
              return { fillColor: '#eab308', fillOpacity: 0.2, color: '#eab308', weight: 0.5 };
            return { fillOpacity: 0, color: 'transparent', weight: 0 };
          },
          onEachFeature: (feature, layer) => {
            const name = feature.properties?.ADMIN || feature.properties?.name || '';
            if (!name) return;
            let riskLevel = null;
            if (epicenter.some(c => name.toLowerCase().includes(c.toLowerCase())))  riskLevel = 'Epicenter';
            else if (highRisk.some(c => name.toLowerCase().includes(c.toLowerCase()))) riskLevel = 'High Risk';
            else if (secondary.some(c => name.toLowerCase().includes(c.toLowerCase()))) riskLevel = 'Secondary Impact';
            if (riskLevel) {
              layer.bindPopup(
                `<div style="font-family:Inter,sans-serif;font-size:13px;line-height:1.5">
                   <strong style="color:#0a0a0a">${name}</strong><br/>
                   <span style="color:#6b7280">${riskLevel}</span>
                 </div>`,
                { closeButton: false, offset: [0, -4] }
              );
              layer.on('click', () => layer.openPopup());
            }
          },
        }).addTo(map);
      });

    // Port markers — circles
    const portIcon = L.divIcon({
      html: '<div style="width:10px;height:10px;background:#3b82f6;border-radius:50%;border:2px solid #ffffff;box-shadow:0 0 4px rgba(59,130,246,0.6)"></div>',
      className: '',
      iconAnchor: [5, 5],
    });

    ports.forEach(port => {
      L.marker([port.lat, port.lng], { icon: portIcon })
        .bindPopup(
          `<div style="font-family:Inter,sans-serif;font-size:13px;line-height:1.5">
             <strong style="color:#0a0a0a">🚢 ${port.name}</strong><br/>
             <span style="color:#6b7280">${port.country}</span>
           </div>`,
          { closeButton: false, offset: [0, -4] }
        )
        .addTo(map);
    });

    // Disrupted routes
    routes.forEach(route => {
      L.polyline(
        [[route.from.lat, route.from.lng], [route.to.lat, route.to.lng]],
        { color: '#ef4444', weight: 2, dashArray: '6,6', opacity: 0.7 }
      )
        .bindPopup(
          `<div style="font-family:Inter,sans-serif;font-size:13px"><strong>⚠️ ${route.name}</strong></div>`,
          { closeButton: false }
        )
        .addTo(map);
    });

    // Fit bounds
    const allPoints = [
      ...ports.map(p => [p.lat, p.lng]),
      ...routes.flatMap(r => [[r.from.lat, r.from.lng], [r.to.lat, r.to.lng]]),
    ];
    if (allPoints.length > 0) map.fitBounds(allPoints, { padding: [40, 40] });

    // Legend
    const Legend = L.control({ position: 'bottomleft' });
    Legend.onAdd = () => {
      const div = L.DomUtil.create('div');
      div.innerHTML = `
        <div style="
          background:rgba(10,10,10,0.82);backdrop-filter:blur(4px);
          color:#ffffff;padding:8px 12px;border-radius:8px;
          font-family:Inter,sans-serif;font-size:11px;line-height:1.8;
          border:1px solid rgba(255,255,255,0.1);
        ">
          <div>🔴 Epicenter</div>
          <div>🟠 High Risk</div>
          <div>🟡 Secondary</div>
          <div>🔵 Port</div>
        </div>`;
      return div;
    };
    Legend.addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [geoImpact]);

  /* ── helpers ─────────────────────────────────────────── */
  const Section = ({ label, color, items, renderItem }) => {
    if (!items || items.length === 0) return null;
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.6px', color, marginBottom: 6,
        }}>
          {label}
        </div>
        {items.map((item, i) => renderItem(item, i))}
      </div>
    );
  };

  const Item = ({ dot, text, sub }) => (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 7,
      padding: '4px 0', borderBottom: '1px solid #f9fafb',
    }}>
      <span style={{ fontSize: 10, lineHeight: '18px', flexShrink: 0 }}>{dot}</span>
      <span style={{ fontSize: 12, color: '#374151', lineHeight: '1.45' }}>
        {text}
        {sub && <span style={{ color: '#9ca3af' }}> · {sub}</span>}
      </span>
    </div>
  );

  /* ── render ──────────────────────────────────────────── */
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: '90vw', height: '82vh',
        backgroundColor: '#ffffff', borderRadius: 12,
        overflow: 'hidden', display: 'flex', flexDirection: 'row',
        boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
      }}>

        {/* ── SIDE PANEL ── */}
        <div style={{
          width: 280, minWidth: 280, borderRight: '1px solid #e5e7eb',
          overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column',
          background: '#ffffff',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 10,
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0a0a0a' }}>
              🗺️ Impact Analysis
            </span>
            <button
              onClick={onClose}
              style={{
                background: 'transparent', border: '1px solid #e5e7eb',
                borderRadius: 6, cursor: 'pointer', padding: '3px 8px',
                fontSize: 13, color: '#6b7280', lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          {/* Summary bar */}
          <div style={{
            fontSize: 11, color: '#6b7280',
            background: '#f9fafb', borderRadius: 6,
            padding: '6px 10px', marginBottom: 14,
            border: '1px solid #e5e7eb',
          }}>
            ⚠️ {ports.length} port{ports.length !== 1 ? 's' : ''} ·{' '}
            {routes.length} route{routes.length !== 1 ? 's' : ''} ·{' '}
            {epicenter.length + highRisk.length + secondary.length} countr{epicenter.length + highRisk.length + secondary.length !== 1 ? 'ies' : 'y'}
          </div>

          {/* Epicenter */}
          <Section label="Epicenter" color="#ef4444" items={epicenter}
            renderItem={(c, i) => <Item key={i} dot="🔴" text={c} />}
          />

          {/* High Risk */}
          <Section label="High Risk" color="#f97316" items={highRisk}
            renderItem={(c, i) => <Item key={i} dot="🟠" text={c} />}
          />

          {/* Secondary Impact */}
          <Section label="Secondary Impact" color="#eab308" items={secondary}
            renderItem={(c, i) => <Item key={i} dot="🟡" text={c} />}
          />

          {/* Affected Ports */}
          <Section label="Affected Ports" color="#3b82f6" items={ports}
            renderItem={(p, i) => <Item key={i} dot="🔵" text={p.name} sub={p.country} />}
          />

          {/* Disrupted Routes */}
          <Section label="Disrupted Routes" color="#ef4444" items={routes}
            renderItem={(r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 7,
                padding: '4px 0', borderBottom: '1px solid #f9fafb',
              }}>
                <span style={{ fontSize: 11, color: '#ef4444', lineHeight: '18px', flexShrink: 0 }}>─ ─</span>
                <span style={{ fontSize: 12, color: '#374151', lineHeight: '1.45' }}>{r.name}</span>
              </div>
            )}
          />
        </div>

        {/* ── MAP ── */}
        <div ref={mapRef} style={{ flex: 1 }} />
      </div>
    </div>
  );
}

export default GeoImpactMap;
