export function exportArticlePDF(article, lens = 'General', commodities = []) {
  const date = article.pubDate
    ? new Date(article.pubDate).toLocaleDateString('en-GB', { timeZone: 'UTC' })
    : new Date().toLocaleDateString('en-GB');
  const generatedDate = new Date().toLocaleDateString('en-GB');
  const generatedTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const riskColor = (score) => {
    if (score >= 4) return '#dc2626';
    if (score >= 3) return '#d97706';
    return '#059669';
  };
  const riskLabel = (score) => {
    if (score >= 4) return 'HIGH';
    if (score >= 3) return 'MEDIUM';
    return 'LOW';
  };
  const score = article.sc_relevance_score || 0;
  const color = riskColor(score);

  const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  const rippleHTML = () => {
    if (!article.ripple) return '<p style="color:#94a3b8;font-size:9pt;">No ripple data available.</p>';
    const r = article.ripple;
    const col = (title, items) => `
      <div style="flex:1;min-width:0;">
        <div style="font-family:Arial,sans-serif;font-size:6.5pt;font-weight:700;
          letter-spacing:1.2px;text-transform:uppercase;color:#94a3b8;
          text-align:center;margin-bottom:8px;">${title}</div>
        ${(items || []).map(n => `
          <div style="border:1px solid #e2e8f0;
            border-left:3px solid ${n.type === 'opportunity' ? '#059669' : '#dc2626'};
            border-radius:0 4px 4px 0;padding:7px 8px;margin-bottom:6px;
            background:#fafafa;">
            <div style="font-family:Arial,sans-serif;font-size:7.5pt;
              font-weight:700;color:#0f172a;margin-bottom:3px;">
              ${escapeHtml(n.label)}</div>
            <div style="font-size:7pt;color:#64748b;line-height:1.4;">
              ${escapeHtml(n.detail)}</div>
          </div>`).join('')}
      </div>`;

    return `
      <div style="display:flex;gap:8px;align-items:flex-start;">
        <div style="flex:1;min-width:0;">
          <div style="font-family:Arial,sans-serif;font-size:6.5pt;font-weight:700;
            letter-spacing:1.2px;text-transform:uppercase;color:#94a3b8;
            text-align:center;margin-bottom:8px;">TRIGGER</div>
          <div style="background:#0f172a;border-radius:4px;padding:10px 8px;text-align:center;">
            <div style="font-family:Arial,sans-serif;font-size:8pt;font-weight:700;
              color:#06b6d4;line-height:1.3;">${escapeHtml(r.trigger)}</div>
          </div>
        </div>
        <div style="color:#cbd5e1;font-size:14pt;padding:0 2px;margin-top:24px;flex-shrink:0;">→</div>
        ${col('1ST ORDER', r.first_order)}
        <div style="color:#cbd5e1;font-size:14pt;padding:0 2px;margin-top:24px;flex-shrink:0;">→</div>
        ${col('2ND ORDER', r.second_order)}
        <div style="color:#cbd5e1;font-size:14pt;padding:0 2px;margin-top:24px;flex-shrink:0;">→</div>
        ${col('3RD ORDER', r.third_order)}
      </div>`;
  };

  const geoHTML = () => {
    const g = article.geo_impact;
    if (!g) return '<p style="color:#94a3b8;font-size:9pt;">No geographic data available.</p>';
    const box = (label, value, valueColor) => value?.length ? `
      <div style="border:1px solid #e2e8f0;border-radius:6px;
        padding:12px 14px;background:#fafafa;">
        <div style="font-family:Arial,sans-serif;font-size:6.5pt;font-weight:700;
          letter-spacing:1.2px;text-transform:uppercase;color:#94a3b8;
          margin-bottom:6px;">${label}</div>
        <div style="font-size:10pt;font-weight:600;color:${valueColor || '#0f172a'};">
          ${Array.isArray(value) ? value.join(', ') : value}</div>
      </div>` : '';
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        ${box('Epicenter', g.epicenter, '#0f172a')}
        ${box('High Risk Countries', g.high_risk_countries, '#dc2626')}
        ${box('Secondary Exposure', g.secondary_impact, '#d97706')}
        ${g.affected_ports?.length ? box('Affected Ports', g.affected_ports.map(p => p.name), '#0f172a') : ''}
      </div>`;
  };

  const commodityRowsHTML = () => {
    if (!commodities || commodities.length === 0)
      return `<tr><td colspan="4" style="color:#94a3b8;font-size:9pt;
        padding:12px 10px;">Market data unavailable</td></tr>`;
    return commodities.map(c => {
      const chg = parseFloat(c.change);
      const up = chg >= 0;
      return `<tr>
        <td style="padding:9px 10px;font-size:9.5pt;color:#334155;
          border-bottom:1px solid #f1f5f9;font-family:Arial,sans-serif;">
          ${escapeHtml(c.name)}</td>
        <td style="padding:9px 10px;font-size:9.5pt;font-weight:700;
          color:#0f172a;border-bottom:1px solid #f1f5f9;
          font-family:Arial,sans-serif;">
          $${Number(c.price).toLocaleString()}</td>
        <td style="padding:9px 10px;font-size:9.5pt;font-weight:700;
          color:${up ? '#059669' : '#dc2626'};border-bottom:1px solid #f1f5f9;
          font-family:Arial,sans-serif;">
          ${up ? '▲' : '▼'} ${Math.abs(chg).toFixed(2)}%</td>
        <td style="padding:9px 10px;font-size:8pt;color:#94a3b8;
          border-bottom:1px solid #f1f5f9;
          font-family:Arial,sans-serif;">${escapeHtml(c.unit)}</td>
      </tr>`;
    }).join('');
  };

  const header = (section) => `
    <div style="display:flex;justify-content:space-between;align-items:center;
      padding:10px 0;margin-bottom:20px;
      border-bottom:2px solid #0f172a;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="font-family:Arial,sans-serif;font-size:13pt;font-weight:900;
          color:#0f172a;letter-spacing:-0.5px;">
          Supply<span style="color:#06b6d4;">Lens</span></div>
        <div style="font-family:Arial,sans-serif;font-size:7pt;font-weight:700;
          letter-spacing:1px;text-transform:uppercase;
          background:#0f172a;color:#fff;
          padding:3px 8px;border-radius:2px;">${section}</div>
      </div>
      <div style="font-family:Arial,sans-serif;font-size:7.5pt;
        color:#94a3b8;text-align:right;line-height:1.5;">
        ${escapeHtml(article.title?.substring(0, 55))}...<br>
        ${lens} · ${generatedDate} ${generatedTime}
      </div>
    </div>`;

  const footer = (page, total) => `
    <div style="position:absolute;bottom:14mm;left:20mm;right:20mm;
      display:flex;justify-content:space-between;align-items:center;
      border-top:1px solid #e2e8f0;padding-top:6px;">
      <div style="font-family:Arial,sans-serif;font-size:7pt;color:#94a3b8;">
        Confidential · Procurement Intelligence · ${generatedDate}</div>
      <div style="font-family:Arial,sans-serif;font-size:7pt;
        font-weight:700;color:#0f172a;">
        Supply<span style="color:#06b6d4;">Lens</span></div>
      <div style="font-family:Arial,sans-serif;font-size:7pt;color:#94a3b8;">
        Page ${page} of ${total}</div>
    </div>`;

  const sectionLabel = (text) => `
    <div style="font-family:Arial,sans-serif;font-size:7pt;font-weight:700;
      letter-spacing:1.5px;text-transform:uppercase;color:#06b6d4;
      margin-bottom:10px;">${text}</div>`;

  const divider = () => `
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;">`;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>SupplyLens Procurement Brief</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: Arial, sans-serif;
    background: #fff;
    color: #0f172a;
    font-size: 10pt;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    max-height: 297mm;
    padding: 16mm 20mm 28mm 20mm;
    position: relative;
    background: #fff;
    overflow: hidden;
    display: block;
  }
  @media screen {
    .page {
      margin: 0 auto 0 auto;
      box-shadow: none;
      border-bottom: 1px solid #e2e8f0;
    }
  }
  @media print {
    html, body {
      width: 210mm;
      height: auto;
      margin: 0;
      padding: 0;
    }
    .page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      page-break-after: always;
      page-break-inside: avoid;
      overflow: hidden;
      display: block;
      margin: 0;
      padding: 16mm 20mm 28mm 20mm;
    }
    .page:last-child {
      page-break-after: avoid;
    }
    @page {
      size: A4;
      margin: 0;
    }
  }
</style>
</head>
<body>

<!-- PAGE 1: PROCUREMENT INTELLIGENCE BRIEF -->
<div class="page">
  ${header('PROCUREMENT BRIEF')}

  <!-- Title -->
  <div style="margin-bottom:16px;">
    <div style="font-size:18pt;font-weight:900;color:#0f172a;
      line-height:1.2;margin-bottom:10px;letter-spacing:-0.3px;">
      ${escapeHtml(article.title)}</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
      <span style="font-size:8pt;font-weight:700;padding:3px 10px;
        border-radius:2px;background:#f0f9ff;color:#06b6d4;
        border:1px solid #bae6fd;">${escapeHtml(article.tag || 'Analysis')}</span>
      <span style="font-size:8pt;color:#64748b;">
        ${date} · ${escapeHtml(article.source?.name || '')}</span>
      <span style="font-size:8pt;color:#64748b;">Lens: ${lens}</span>
    </div>
  </div>

  <!-- Risk indicator -->
  <div style="display:flex;gap:12px;margin-bottom:18px;">
    <div style="border:2px solid ${color};border-radius:6px;
      padding:12px 20px;text-align:center;min-width:90px;">
      <div style="font-size:26pt;font-weight:900;color:${color};
        line-height:1;font-family:Arial,sans-serif;">
        ${score}/5</div>
      <div style="font-size:7pt;font-weight:700;letter-spacing:1px;
        text-transform:uppercase;color:${color};margin-top:3px;">
        ${riskLabel(score)} RISK</div>
    </div>
    <div style="border:1px solid #e2e8f0;border-radius:6px;
      padding:12px 16px;flex:1;background:#fafafa;">
      <div style="font-family:Arial,sans-serif;font-size:7pt;
        font-weight:700;letter-spacing:1.2px;text-transform:uppercase;
        color:#94a3b8;margin-bottom:6px;">SITUATION</div>
      <div style="font-size:10pt;color:#334155;line-height:1.6;">
        ${escapeHtml(article.article_summary || 'No summary available.')}</div>
    </div>
  </div>

  ${divider()}
  ${sectionLabel('Procurement Impact')}

  <div style="margin-bottom:4px;">
    ${(article.summary || []).map((point, i) => {
      const quote = article.source_quotes?.[i];
      const hasQuote = quote && quote !== 'No direct quote available';
      return `
        <div style="display:flex;gap:12px;padding:10px 0;
          border-bottom:1px solid #f1f5f9;
          flex-direction:column;">
          <div style="display:flex;gap:12px;
            align-items:flex-start;">
            <div style="width:22px;height:22px;
              background:#0f172a;color:#06b6d4;
              border-radius:50%;font-size:8pt;
              font-weight:700;display:flex;
              align-items:center;justify-content:center;
              flex-shrink:0;margin-top:1px;">
              ${i + 1}</div>
            <div style="font-size:10pt;color:#334155;
              line-height:1.6;flex:1;">
              ${escapeHtml(point)}</div>
          </div>
          ${hasQuote ? `
            <div style="margin-left:34px;
              background:#f0f9ff;
              border-left:3px solid #06b6d4;
              border-radius:0 4px 4px 0;
              padding:8px 12px;">
              <div style="font-family:Arial,sans-serif;
                font-size:6.5pt;font-weight:700;
                letter-spacing:1px;color:#06b6d4;
                text-transform:uppercase;
                margin-bottom:4px;">Source</div>
              <div style="font-size:8.5pt;
                color:#0369a1;font-style:italic;
                line-height:1.5;">
                "${escapeHtml(quote)}"</div>
            </div>` : ''}
        </div>`;
    }).join('')}
  </div>

  ${divider()}
  ${sectionLabel('Immediate Action Required')}

  ${article.recommended_actions?.[0] ? `
    <div style="background:#fef2f2;border-left:4px solid #dc2626;
      border-radius:0 6px 6px 0;padding:14px 16px;">
      <div style="font-family:Arial,sans-serif;font-size:7pt;font-weight:700;
        letter-spacing:1px;text-transform:uppercase;color:#dc2626;
        margin-bottom:6px;">THIS WEEK</div>
      <div style="font-size:10.5pt;color:#0f172a;font-weight:600;
        line-height:1.6;">
        ${escapeHtml(article.recommended_actions[0])}</div>
    </div>` : ''}

  ${footer(1, 4)}
</div>

<!-- PAGE 2: SUPPLY BASE EXPOSURE -->
<div class="page">
  ${header('SUPPLY BASE EXPOSURE')}

  ${sectionLabel('Geographic Risk Map')}
  ${geoHTML()}

  ${divider()}
  ${sectionLabel('Ripple Effect — Supplier Tier Impact')}
  ${rippleHTML()}

  ${footer(2, 4)}
</div>

<!-- PAGE 3: PROCUREMENT ACTION PLAN -->
<div class="page">
  ${header('ACTION PLAN')}

  ${sectionLabel(`Recommended Actions — ${lens}`)}

  <div style="margin-bottom:16px;">
    ${(article.recommended_actions || []).map((action, i) => {
      const configs = [
        { label: 'THIS WEEK', bg: '#fef2f2', border: '#dc2626', badge: '#dc2626' },
        { label: '30 DAYS',   bg: '#fffbeb', border: '#d97706', badge: '#d97706' },
        { label: 'STRATEGIC', bg: '#f0fdf4', border: '#059669', badge: '#059669' },
      ];
      const c = configs[i] || configs[2];
      return `
        <div style="display:flex;gap:12px;padding:13px 16px;
          border-radius:4px;margin-bottom:10px;
          background:${c.bg};border-left:4px solid ${c.border};
          align-items:flex-start;">
          <span style="font-size:7pt;font-weight:800;padding:3px 8px;
            border-radius:3px;color:#fff;white-space:nowrap;
            font-family:Arial,sans-serif;letter-spacing:0.5px;
            background:${c.badge};margin-top:2px;">${c.label}</span>
          <div style="font-size:10pt;color:#334155;line-height:1.6;">
            ${escapeHtml(action)}</div>
        </div>`;
    }).join('')}
  </div>

  ${article.insights?.length > 0 ? `
    ${divider()}
    ${sectionLabel(`Category Intelligence — ${lens}`)}
    ${article.insights.map((insight, i) => `
      <div style="display:flex;gap:12px;padding:10px 0;
        border-bottom:1px solid #f1f5f9;align-items:flex-start;">
        <div style="font-size:11pt;font-weight:700;color:#06b6d4;
          flex-shrink:0;width:18px;font-family:Arial,sans-serif;">
          ${i + 1}</div>
        <div style="font-size:10pt;color:#334155;line-height:1.6;">
          ${escapeHtml(insight)}</div>
      </div>`).join('')}` : ''}

  ${footer(3, 4)}
</div>

<!-- PAGE 4: MARKET INTELLIGENCE -->
<div class="page">
  ${header('MARKET INTELLIGENCE')}

  ${article.market_signal ? `
    ${sectionLabel('Market Signal')}
    <div style="background:#f0f9ff;border:1px solid #bae6fd;
      border-left:4px solid #06b6d4;border-radius:0 6px 6px 0;
      padding:14px 16px;margin-bottom:16px;">
      <div style="font-size:10.5pt;color:#0369a1;
        line-height:1.7;font-style:italic;">
        ${escapeHtml(article.market_signal)}</div>
    </div>
    ${divider()}` : ''}

  ${sectionLabel('Live Commodity Prices at Time of Analysis')}

  <table style="width:100%;border-collapse:collapse;
    font-family:Arial,sans-serif;margin-bottom:16px;">
    <thead>
      <tr style="border-bottom:2px solid #0f172a;">
        <th style="font-size:7pt;font-weight:700;letter-spacing:1px;
          text-transform:uppercase;color:#94a3b8;padding:8px 10px;
          text-align:left;">Commodity</th>
        <th style="font-size:7pt;font-weight:700;letter-spacing:1px;
          text-transform:uppercase;color:#94a3b8;padding:8px 10px;
          text-align:left;">Price</th>
        <th style="font-size:7pt;font-weight:700;letter-spacing:1px;
          text-transform:uppercase;color:#94a3b8;padding:8px 10px;
          text-align:left;">Today</th>
        <th style="font-size:7pt;font-weight:700;letter-spacing:1px;
          text-transform:uppercase;color:#94a3b8;padding:8px 10px;
          text-align:left;">Unit</th>
      </tr>
    </thead>
    <tbody>
      ${commodityRowsHTML()}
    </tbody>
  </table>

  ${divider()}
  ${sectionLabel('Source & Disclaimer')}

  <div style="font-size:8.5pt;color:#94a3b8;line-height:1.7;">
    <strong style="color:#334155;">Article:</strong>
    ${escapeHtml(article.link || 'N/A')}<br>
    <strong style="color:#334155;">Market data:</strong>
    Yahoo Finance — live at time of report generation (${generatedDate} ${generatedTime})<br>
    <strong style="color:#334155;">Analysis engine:</strong>
    SupplyLens AI (Anthropic Claude)<br><br>
    <em>This report is AI-generated procurement intelligence intended for
    informational purposes only. All supply chain implications and recommended
    actions should be validated by qualified procurement professionals
    before acting. SupplyLens does not guarantee the accuracy of third-party
    market data or news sources.</em>
  </div>

  ${footer(4, 4)}
</div>

</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    alert('Please allow popups for this site to export PDF.');
    return;
  }
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 10000);
}
