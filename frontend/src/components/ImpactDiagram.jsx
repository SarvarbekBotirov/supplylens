import { useState } from 'react';

function ImpactDiagram({ ripple }) {
  const [selectedNode, setSelectedNode] = useState(null);

  if (!ripple) return (
    <div style={{ padding: '20px', color: '#94a3b8', textAlign: 'center' }}>
      No ripple data available
    </div>
  );

  const nH = 38, gap = 10;
  const C = { trigger: '#1a2b4a', risk: '#ef4444', opportunity: '#22c55e' };
  let nodes = '', lines = '';

  function getNodeWidth(label) {
    return Math.max(120, (label || '').length * 8 + 32);
  }

  const tW = getNodeWidth(ripple.trigger);
  const tx = (700 - tW) / 2, ty = 16;
  nodes += `<rect x="${tx}" y="${ty}" width="${tW}" height="${nH}" rx="6" fill="${C.trigger}" fill-opacity="0.15" stroke="${C.trigger}" stroke-width="1.2"/>
  <text x="${tx + tW/2}" y="${ty + nH/2}" text-anchor="middle" dominant-baseline="central" fill="${C.trigger}" font-size="11" font-weight="600" font-family="Inter,sans-serif">${(ripple.trigger||'').slice(0,20)}</text>`;

  // parentNodes: array of { x, w } from the previous row (or trigger)
  function drawRow(items, y, parentNodes) {
    const total = items.reduce((sum, n) => sum + getNodeWidth(n.label), 0) + (items.length - 1) * gap;
    const sx = (700 - total) / 2;
    let currentX = sx;
    const nodeInfos = items.map((n) => {
      const x = currentX;
      const w = getNodeWidth(n.label);
      currentX += w + gap;
      return { x, w };
    });
    items.forEach((n, i) => {
      const { x: nx, w: nW } = nodeInfos[i];
      const color = n.type === 'risk' ? C.risk : C.opportunity;
      const parent = parentNodes[Math.min(i, parentNodes.length - 1)];
      const px = parent.x + parent.w / 2;
      lines += `<line x1="${px}" y1="${y-nH}" x2="${nx+nW/2}" y2="${y}" stroke="${color}" stroke-width="0.8" stroke-opacity="0.4" marker-end="url(#arr)"/>`;
      nodes += `<rect x="${nx}" y="${y}" width="${nW}" height="${nH}" rx="5" fill="${color}" fill-opacity="0.1" stroke="${color}" stroke-width="0.8"/>
      <text x="${nx+nW/2}" y="${y+nH/2}" text-anchor="middle" dominant-baseline="central" fill="${color}" font-size="10" font-weight="500" font-family="Inter,sans-serif">${(n.label||'').slice(0,16)}</text>`;
    });
    return nodeInfos;
  }

  const foP = drawRow((ripple.first_order||[]).slice(0,3), 110, [{ x: tx, w: tW }]);
  const soP = drawRow((ripple.second_order||[]).slice(0,3), 206, foP);
  drawRow((ripple.third_order||[]).slice(0,2), 302, soP);

  const allNodes = [
    ...(ripple.first_order||[]).map(n => ({...n, row:'1st'})),
    ...(ripple.second_order||[]).map(n => ({...n, row:'2nd'})),
    ...(ripple.third_order||[]).map(n => ({...n, row:'3rd'}))
  ];

  const leg = [{c:C.trigger,l:'Trigger'},{c:C.risk,l:'Risk'},{c:C.opportunity,l:'Opportunity'}]
    .map((l,i) => `<rect x="${20+i*150}" y="358" width="8" height="8" rx="2" fill="${l.c}" opacity="0.8"/><text x="${20+i*150+13}" y="366" fill="#64748b" font-size="10" font-family="Inter,sans-serif">${l.l}</text>`).join('');

  return (
    <div>
      <svg width="100%" viewBox="0 0 750 385" style={{display:'block'}}>
        <defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>
        <g dangerouslySetInnerHTML={{__html: lines + nodes + leg}}/>
      </svg>

      <div style={{display:'flex', flexWrap:'wrap', gap:'6px', marginTop:'12px'}}>
        {allNodes.map((n, i) => (
          <button key={i} onClick={() => setSelectedNode(selectedNode?.label === n.label ? null : n)}
            style={{
              padding: '3px 10px', borderRadius: '99px', border: `1px solid ${n.type === 'risk' ? '#fecaca' : '#bbf7d0'}`,
              backgroundColor: selectedNode?.label === n.label ? (n.type === 'risk' ? '#fef2f2' : '#f0fdf4') : 'white',
              color: n.type === 'risk' ? '#ef4444' : '#22c55e',
              fontSize: '11px', cursor: 'pointer', fontWeight: '500'
            }}>
            {n.label}
          </button>
        ))}
      </div>

      {selectedNode && (
        <div style={{
          marginTop: '12px',
          padding: '12px 16px',
          backgroundColor: selectedNode.type === 'risk' ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${selectedNode.type === 'risk' ? '#fecaca' : '#bbf7d0'}`,
          borderRadius: '8px',
          fontSize: '13px',
          color: '#374151',
          lineHeight: '1.6'
        }}>
          <span style={{
            fontWeight: '600',
            color: selectedNode.type === 'risk' ? '#ef4444' : '#22c55e',
            marginRight: '8px'
          }}>
            {selectedNode.row} order · {selectedNode.label}
          </span>
          {selectedNode.detail}
        </div>
      )}
    </div>
  );
}

export default ImpactDiagram;
