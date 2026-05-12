export function openRiskReportPreview(report, article, lens) {
  const generatedDate = new Date().toLocaleDateString('en-GB');
  const generatedTime = new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit'
  });

  const escHtml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  const riskColor = (score) => {
    if (score >= 16) return '#dc2626';
    if (score >= 9)  return '#d97706';
    if (score >= 4)  return '#2563eb';
    return '#059669';
  };

  const riskLabel = (score) => {
    if (score >= 16) return 'CRITICAL';
    if (score >= 9)  return 'HIGH';
    if (score >= 4)  return 'MEDIUM';
    return 'LOW';
  };

  const overallColor = report.overall_risk_level === 'HIGH'
    ? '#dc2626'
    : report.overall_risk_level === 'MEDIUM'
    ? '#d97706' : '#059669';

  const categoryColors = {
    'Market':       { bg: '#eff6ff', border: '#2563eb', text: '#1d4ed8' },
    'Operational':  { bg: '#fff7ed', border: '#d97706', text: '#b45309' },
    'Regulatory':   { bg: '#f0fdf4', border: '#059669', text: '#047857' },
    'Reputational': { bg: '#fdf4ff', border: '#9333ea', text: '#7e22ce' },
  };

  const header = (section, pageNum, totalPages) => `
    <div style="display:flex;justify-content:space-between;
      align-items:center;padding:10px 0;margin-bottom:20px;
      border-bottom:2px solid #0f172a;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="font-family:Arial,sans-serif;font-size:13pt;
          font-weight:900;color:#0f172a;letter-spacing:-0.5px;">
          Supply<span style="color:#06b6d4;">Lens</span>
        </div>
        <div style="font-family:Arial,sans-serif;font-size:7pt;
          font-weight:700;letter-spacing:1px;text-transform:uppercase;
          background:#0f172a;color:#fff;padding:3px 8px;
          border-radius:2px;">DELOITTE-STYLE RISK REPORT</div>
      </div>
      <div style="font-family:Arial,sans-serif;font-size:7.5pt;
        color:#94a3b8;text-align:right;line-height:1.5;">
        ${escHtml(lens)} · ${generatedDate} ${generatedTime}<br>
        Page ${pageNum} of ${totalPages}
      </div>
    </div>`;

  const footer = () => `
    <div style="margin-top:30px;padding-top:8px;
      border-top:1px solid #e2e8f0;
      display:flex;justify-content:space-between;">
      <div style="font-family:Arial,sans-serif;font-size:7pt;
        color:#94a3b8;">
        Confidential · Risk Intelligence · ${generatedDate}
      </div>
      <div style="font-family:Arial,sans-serif;font-size:7pt;
        font-weight:700;color:#0f172a;">
        Supply<span style="color:#06b6d4;">Lens</span>
        × ERM Risk Framework
      </div>
      <div style="font-family:Arial,sans-serif;font-size:7pt;
        color:#94a3b8;">
        AI-generated · Validate before acting
      </div>
    </div>`;

  const sLabel = (text) => `
    <div style="font-family:Arial,sans-serif;font-size:7pt;
      font-weight:700;letter-spacing:1.5px;text-transform:uppercase;
      color:#06b6d4;margin-bottom:10px;">${text}</div>`;

  const divider = () => `
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;">`;

  // Sort risks by risk_score descending
  const sortedRisks = [...(report.risks || [])]
    .sort((a, b) => b.risk_score - a.risk_score);

  const categoryGroups = ['Market', 'Operational', 'Regulatory', 'Reputational'];

  // Risk matrix rows
  const matrixRows = sortedRisks.map(r => {
    const c = categoryColors[r.category] || categoryColors['Market'];
    const rc = riskColor(r.risk_score);
    return `
      <tr>
        <td style="padding:8px 10px;font-size:9pt;color:#0f172a;
          border-bottom:1px solid #f1f5f9;font-weight:600;">
          ${r.id}. ${escHtml(r.title)}</td>
        <td style="padding:8px 10px;font-size:8pt;
          border-bottom:1px solid #f1f5f9;">
          <span style="background:${c.bg};color:${c.text};
            border:1px solid ${c.border};padding:2px 7px;
            border-radius:2px;font-weight:700;font-size:7pt;
            font-family:Arial,sans-serif;">
            ${r.category}</span></td>
        <td style="padding:8px 10px;font-size:9pt;
          text-align:center;border-bottom:1px solid #f1f5f9;
          color:#334155;">${r.probability}/5</td>
        <td style="padding:8px 10px;font-size:9pt;
          text-align:center;border-bottom:1px solid #f1f5f9;
          color:#334155;">${r.impact}/5</td>
        <td style="padding:8px 10px;font-size:9pt;
          text-align:center;border-bottom:1px solid #f1f5f9;">
          <span style="background:${rc}18;color:${rc};
            font-weight:800;padding:3px 10px;border-radius:3px;
            font-family:Arial,sans-serif;font-size:9pt;">
            ${r.risk_score}</span></td>
        <td style="padding:8px 10px;font-size:8pt;
          text-align:center;border-bottom:1px solid #f1f5f9;">
          <span style="color:${rc};font-weight:700;
            font-family:Arial,sans-serif;font-size:7.5pt;">
            ${riskLabel(r.risk_score)}</span></td>
      </tr>`;
  }).join('');

  // Detailed risk cards grouped by category
  const riskDetailPages = categoryGroups.map(cat => {
    const catRisks = sortedRisks.filter(r => r.category === cat);
    if (!catRisks.length) return '';
    const c = categoryColors[cat] || categoryColors['Market'];
    return `
      <div style="page-break-before:always;padding:16mm 20mm 28mm 20mm;
        position:relative;min-height:297mm;">
        ${header(`${cat.toUpperCase()} RISKS`,
          categoryGroups.indexOf(cat) + 3, 7)}
        ${sLabel(`${cat} Risk Analysis — ${lens}`)}
        ${catRisks.map(r => {
          const rc = riskColor(r.risk_score);
          return `
            <div style="border:1px solid #e2e8f0;border-radius:6px;
              padding:14px 16px;margin-bottom:14px;
              border-left:4px solid ${rc};">
              <div style="display:flex;justify-content:space-between;
                align-items:flex-start;margin-bottom:10px;">
                <div style="flex:1;">
                  <div style="font-family:Arial,sans-serif;font-size:10pt;
                    font-weight:700;color:#0f172a;margin-bottom:4px;">
                    ${r.id}. ${escHtml(r.title)}</div>
                  <div style="font-size:9.5pt;color:#475569;
                    line-height:1.6;">
                    ${escHtml(r.description)}</div>
                </div>
                <div style="text-align:center;margin-left:16px;
                  flex-shrink:0;">
                  <div style="font-size:20pt;font-weight:900;
                    color:${rc};font-family:Arial,sans-serif;
                    line-height:1;">${r.risk_score}</div>
                  <div style="font-size:6.5pt;font-weight:700;
                    color:${rc};letter-spacing:0.5px;
                    font-family:Arial,sans-serif;">
                    ${riskLabel(r.risk_score)}</div>
                </div>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;
                gap:10px;margin-bottom:10px;">
                <div style="background:#f8fafc;border-radius:4px;
                  padding:8px 10px;">
                  <div style="font-family:Arial,sans-serif;font-size:6.5pt;
                    font-weight:700;letter-spacing:1px;color:#94a3b8;
                    text-transform:uppercase;margin-bottom:5px;">
                    Probability</div>
                  <div style="font-size:14pt;font-weight:800;
                    color:#0f172a;font-family:Arial,sans-serif;">
                    ${r.probability}/5</div>
                </div>
                <div style="background:#f8fafc;border-radius:4px;
                  padding:8px 10px;">
                  <div style="font-family:Arial,sans-serif;font-size:6.5pt;
                    font-weight:700;letter-spacing:1px;color:#94a3b8;
                    text-transform:uppercase;margin-bottom:5px;">
                    Impact</div>
                  <div style="font-size:14pt;font-weight:800;
                    color:#0f172a;font-family:Arial,sans-serif;">
                    ${r.impact}/5</div>
                </div>
                <div style="background:${rc}10;border-radius:4px;
                  padding:8px 10px;">
                  <div style="font-family:Arial,sans-serif;font-size:6.5pt;
                    font-weight:700;letter-spacing:1px;color:${rc};
                    text-transform:uppercase;margin-bottom:5px;">
                    Risk Score</div>
                  <div style="font-size:14pt;font-weight:800;
                    color:${rc};font-family:Arial,sans-serif;">
                    ${r.risk_score}/25</div>
                </div>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;
                gap:10px;">
                <div>
                  <div style="font-family:Arial,sans-serif;font-size:6.5pt;
                    font-weight:700;letter-spacing:1px;color:#94a3b8;
                    text-transform:uppercase;margin-bottom:5px;">
                    Early Warning Indicators</div>
                  ${(r.early_warning_indicators || []).map(ind => `
                    <div style="display:flex;gap:6px;margin-bottom:4px;
                      align-items:flex-start;">
                      <span style="color:#06b6d4;font-weight:700;
                        flex-shrink:0;margin-top:1px;">→</span>
                      <span style="font-size:8.5pt;color:#475569;
                        line-height:1.5;">${escHtml(ind)}</span>
                    </div>`).join('')}
                </div>
                <div>
                  <div style="font-family:Arial,sans-serif;font-size:6.5pt;
                    font-weight:700;letter-spacing:1px;color:#94a3b8;
                    text-transform:uppercase;margin-bottom:5px;">
                    Mitigation Strategy</div>
                  <div style="font-size:8.5pt;color:#475569;
                    line-height:1.5;margin-bottom:8px;">
                    ${escHtml(r.mitigating_strategy)}</div>
                  <div style="font-family:Arial,sans-serif;font-size:6.5pt;
                    font-weight:700;letter-spacing:1px;color:#94a3b8;
                    text-transform:uppercase;margin-bottom:5px;">
                    Contingency Plan</div>
                  <div style="font-size:8.5pt;color:#475569;
                    line-height:1.5;">
                    ${escHtml(r.contingency_plan)}</div>
                </div>
              </div>
            </div>`;
        }).join('')}
        ${footer()}
      </div>`;
  }).join('');

  // Scenario cards
  const scenarioConfigs = [
    { key: 'best_case',  label: 'BEST CASE',
      color: '#059669', bg: '#f0fdf4', border: '#059669' },
    { key: 'base_case',  label: 'BASE CASE',
      color: '#2563eb', bg: '#eff6ff', border: '#2563eb' },
    { key: 'worst_case', label: 'WORST CASE',
      color: '#dc2626', bg: '#fef2f2', border: '#dc2626' },
    { key: 'black_swan', label: 'BLACK SWAN',
      color: '#0f172a', bg: '#f8fafc', border: '#0f172a' },
  ];

  const scenarioCards = scenarioConfigs.map(sc => {
    const s = report.scenarios?.[sc.key];
    if (!s) return '';
    return `
      <div style="border:1px solid ${sc.border};border-radius:6px;
        padding:16px;margin-bottom:14px;background:${sc.bg};">
        <div style="display:flex;justify-content:space-between;
          align-items:center;margin-bottom:10px;">
          <div>
            <span style="font-family:Arial,sans-serif;font-size:7pt;
              font-weight:700;letter-spacing:1px;color:${sc.color};
              background:${sc.color}18;padding:2px 8px;
              border-radius:2px;margin-right:8px;">
              ${sc.label}</span>
            <span style="font-size:10.5pt;font-weight:700;
              color:#0f172a;">${escHtml(s.title)}</span>
          </div>
          <span style="font-family:Arial,sans-serif;font-size:8pt;
            color:#64748b;background:#fff;padding:3px 10px;
            border-radius:3px;border:1px solid #e2e8f0;">
            ${escHtml(s.timeline)}</span>
        </div>
        <div style="font-size:9.5pt;color:#334155;line-height:1.6;
          margin-bottom:10px;">
          ${escHtml(s.description)}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div style="background:#fff;border-radius:4px;
            padding:10px 12px;border:1px solid #e2e8f0;">
            <div style="font-family:Arial,sans-serif;font-size:6.5pt;
              font-weight:700;letter-spacing:1px;color:#94a3b8;
              text-transform:uppercase;margin-bottom:5px;">
              Revenue Impact</div>
            <div style="font-size:9pt;color:#0f172a;font-weight:600;
              line-height:1.5;">
              ${escHtml(s.revenue_impact)}</div>
          </div>
          <div style="background:#fff;border-radius:4px;
            padding:10px 12px;border:1px solid #e2e8f0;">
            <div style="font-family:Arial,sans-serif;font-size:6.5pt;
              font-weight:700;letter-spacing:1px;color:#94a3b8;
              text-transform:uppercase;margin-bottom:5px;">
              Strategic Response</div>
            <div style="font-size:9pt;color:#0f172a;line-height:1.5;">
              ${escHtml(s.strategic_response)}</div>
          </div>
        </div>
      </div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>SupplyLens Risk Report</title>
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
  @media print {
    @page { margin: 0; size: A4; }
    body { -webkit-print-color-adjust: exact; }
  }
  .print-btn {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #06b6d4;
    color: #fff;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: Arial, sans-serif;
    z-index: 9999;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }
  .print-btn:hover { opacity: 0.85; }
  @media print { .print-btn { display: none; } }
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 16mm 20mm 28mm 20mm;
    position: relative;
    background: #fff;
    page-break-after: always;
  }
  .page:last-child { page-break-after: avoid; }
</style>
</head>
<body>

<button class="print-btn" onclick="window.print()">
  ⬇ Save as PDF
</button>

<!-- PAGE 1: EXECUTIVE SUMMARY + RISK MATRIX -->
<div class="page">
  ${header('EXECUTIVE RISK REPORT', 1, 7)}

  <!-- Title block -->
  <div style="margin-bottom:16px;">
    <div style="font-size:7pt;font-weight:700;letter-spacing:1.5px;
      text-transform:uppercase;color:#06b6d4;margin-bottom:6px;">
      AI-Powered Risk Analysis</div>
    <div style="font-size:17pt;font-weight:900;color:#0f172a;
      line-height:1.2;margin-bottom:8px;letter-spacing:-0.3px;">
      ${escHtml(article.title)}</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;
      align-items:center;">
      <span style="font-size:8pt;font-weight:700;padding:3px 10px;
        border-radius:2px;background:#f0f9ff;color:#06b6d4;
        border:1px solid #bae6fd;">${escHtml(lens)}</span>
      <span style="font-size:8pt;color:#64748b;">
        Generated ${generatedDate} ${generatedTime}</span>
      <span style="font-size:8pt;font-weight:700;
        padding:3px 10px;border-radius:2px;
        background:${overallColor}18;
        color:${overallColor};
        border:1px solid ${overallColor}40;">
        ${report.overall_risk_level} RISK ·
        ${report.overall_risk_score}/10</span>
    </div>
  </div>

  ${divider()}
  ${sLabel('Executive Summary')}

  <div style="background:#f8fafc;border-left:4px solid #06b6d4;
    border-radius:0 6px 6px 0;padding:14px 16px;margin-bottom:16px;">
    <div style="font-size:10pt;color:#334155;line-height:1.7;">
      ${escHtml(report.executive_summary)}</div>
  </div>

  ${divider()}
  ${sLabel('Prioritized Risk Matrix — 15 Risks')}

  <table style="width:100%;border-collapse:collapse;
    font-family:Arial,sans-serif;">
    <thead>
      <tr style="border-bottom:2px solid #0f172a;">
        <th style="font-size:7pt;font-weight:700;letter-spacing:1px;
          text-transform:uppercase;color:#94a3b8;padding:7px 10px;
          text-align:left;">Risk</th>
        <th style="font-size:7pt;font-weight:700;letter-spacing:1px;
          text-transform:uppercase;color:#94a3b8;padding:7px 10px;
          text-align:left;">Category</th>
        <th style="font-size:7pt;font-weight:700;letter-spacing:1px;
          text-transform:uppercase;color:#94a3b8;padding:7px 10px;
          text-align:center;">Prob.</th>
        <th style="font-size:7pt;font-weight:700;letter-spacing:1px;
          text-transform:uppercase;color:#94a3b8;padding:7px 10px;
          text-align:center;">Impact</th>
        <th style="font-size:7pt;font-weight:700;letter-spacing:1px;
          text-transform:uppercase;color:#94a3b8;padding:7px 10px;
          text-align:center;">Score</th>
        <th style="font-size:7pt;font-weight:700;letter-spacing:1px;
          text-transform:uppercase;color:#94a3b8;padding:7px 10px;
          text-align:center;">Level</th>
      </tr>
    </thead>
    <tbody>${matrixRows}</tbody>
  </table>

  ${footer()}
</div>

<!-- PAGE 2: SCENARIO PLANNING -->
<div class="page">
  ${header('SCENARIO PLANNING', 2, 7)}
  ${sLabel(`Four Scenarios — ${lens} Perspective`)}
  ${scenarioCards}
  ${footer()}
</div>

<!-- PAGES 3-6: RISK DETAILS BY CATEGORY -->
${riskDetailPages}

<!-- PAGE 7: DISCLAIMER -->
<div class="page">
  ${header('DISCLAIMER & METHODOLOGY', 7, 7)}

  ${sLabel('Report Methodology')}
  <div style="font-size:9.5pt;color:#334155;line-height:1.7;
    margin-bottom:16px;">
    This risk report was generated using the SupplyLens AI engine
    powered by Anthropic Claude, following an Enterprise Risk
    Management (ERM) framework. Risk identification covers four
    categories: Market, Operational, Regulatory, and Reputational.
    Each risk is scored using a 5×5 probability-impact matrix
    (maximum score: 25). Scenarios follow standard scenario planning
    methodology used in strategic consulting engagements.
  </div>

  ${divider()}
  ${sLabel('Risk Score Legend')}

  <div style="display:grid;grid-template-columns:repeat(4,1fr);
    gap:10px;margin-bottom:16px;">
    ${[
      { range: '1-3',   label: 'LOW',      color: '#059669' },
      { range: '4-8',   label: 'MEDIUM',   color: '#2563eb' },
      { range: '9-15',  label: 'HIGH',     color: '#d97706' },
      { range: '16-25', label: 'CRITICAL', color: '#dc2626' },
    ].map(l => `
      <div style="border:1px solid ${l.color};border-radius:6px;
        padding:12px;text-align:center;background:${l.color}10;">
        <div style="font-size:14pt;font-weight:800;color:${l.color};
          font-family:Arial,sans-serif;">${l.range}</div>
        <div style="font-size:7pt;font-weight:700;color:${l.color};
          letter-spacing:1px;font-family:Arial,sans-serif;">
          ${l.label}</div>
      </div>`).join('')}
  </div>

  ${divider()}
  ${sLabel('Data Sources')}
  <div style="font-size:8.5pt;color:#94a3b8;line-height:1.7;">
    <strong style="color:#334155;">Article:</strong>
    ${escHtml(article.link || 'N/A')}<br>
    <strong style="color:#334155;">Market data:</strong>
    Yahoo Finance (live at time of generation)<br>
    <strong style="color:#334155;">AI engine:</strong>
    SupplyLens × Anthropic Claude (claude-sonnet-4-20250514)<br>
    <strong style="color:#334155;">Framework:</strong>
    Enterprise Risk Management (ERM) framework<br><br>
    <em>This report is AI-generated and intended for informational
    purposes only. Risk assessments are based on publicly available
    article content and live market data at time of generation.
    All findings should be validated by qualified risk management
    professionals before informing business decisions. SupplyLens
    and Anthropic accept no liability for decisions made based on
    this report.</em>
  </div>

  ${footer()}
</div>

</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    alert('Please allow popups to view the risk report.');
    return;
  }
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
