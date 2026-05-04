// app.jsx — IMMM photobooth prototype core

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ═══════════════════════════════════════════════════════════════
// Design tokens
// ═══════════════════════════════════════════════════════════════
const TOKENS = {
  A: { // Monochrome Editorial (Life Plus inspired)
    bg: '#FFFFFF',
    bgAlt: '#F5F5F5',
    card: '#FFFFFF',
    ink: '#0A0A0A',
    inkSoft: '#888888',
    line: 'rgba(10,10,10,0.1)',
    pink: '#E8E8E8',
    pinkDeep: '#0A0A0A',
    accent: '#0A0A0A',
  },
  B: { // Monochrome with subtle warm
    bg: '#FAFAF8',
    bgAlt: '#F0EFED',
    card: '#FFFFFF',
    ink: '#0A0A0A',
    inkSoft: '#888888',
    line: 'rgba(10,10,10,0.09)',
    pink: '#E0DDD9',
    pinkDeep: '#0A0A0A',
    accent: '#0A0A0A',
  },
};

// ═══════════════════════════════════════════════════════════════
// Tiny icon set — 1.5px stroke, rounded caps
// ═══════════════════════════════════════════════════════════════
const I = {
  camera: (s=20,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"/><circle cx="12" cy="13" r="3.5"/></svg>,
  sparkle: (s=20,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg>,
  grid: (s=20,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  strip: (s=20,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="5" rx="1"/><rect x="8" y="9" width="8" height="5" rx="1"/><rect x="8" y="16" width="8" height="5" rx="1"/></svg>,
  heart: (s=20,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z"/></svg>,
  download: (s=20,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v12m0 0-4-4m4 4 4-4M4 19h16"/></svg>,
  share: (s=20,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0-12-4 4m4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>,
  arrowR: (s=16,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m0 0-5-5m5 5-5 5"/></svg>,
  arrowL: (s=16,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5m0 0 5 5m-5-5 5-5"/></svg>,
  check: (s=20,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>,
  x: (s=20,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6 6 18"/></svg>,
  lock: (s=20,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>,
  sound: (s=20,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M17 9a4 4 0 0 1 0 6"/></svg>,
  refresh: (s=18,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8m0-5v5h-5M21 12a9 9 0 0 1-15 6.7L3 16m0 5v-5h5"/></svg>,
  flip: (s=18,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a9 9 0 0 0-15-3L3 8m0-5v5h5M3 16a9 9 0 0 0 15 3l3-3m0 5v-5h-5"/></svg>,
  timer: (s=18,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 3h6"/></svg>,
  stickerIcon: (s=18,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5l-3 3h-2a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2l3-3V5a2 2 0 0 0-2-2Z"/></svg>,
  filter: (s=18,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="10" r="5"/><circle cx="16" cy="14" r="5"/></svg>,
};

function getShotCountForLayout(layout) {
  const getShotCount = window.getShotCountForFrameSafe || window.getShotCountForFrame || (typeof getShotCountForFrame === 'function' ? getShotCountForFrame : null);
  if (getShotCount) return getShotCount(layout);
  if (layout === 'polaroid') return 1;
  if (layout === 'trip') return 3;
  return 4;
}

// ═══════════════════════════════════════════════════════════════
// Sticker assets — SVG primitives (starbursts + speech bubbles)
// ═══════════════════════════════════════════════════════════════
function Starburst({ text, fill='#FFEB3B', stroke='#111', textColor='#E53935', fontSize=11, rotate=0, w=90, h=70 }) {
  // 16-point starburst path
  const cx = w/2, cy = h/2, rO = Math.min(w,h)/2 - 2, rI = rO * 0.74;
  const pts = [];
  const N = 14;
  for (let i = 0; i < N*2; i++) {
    const r = i % 2 === 0 ? rO : rI;
    const a = (i / (N*2)) * Math.PI * 2 - Math.PI/2;
    pts.push(`${cx + Math.cos(a)*r},${cy + Math.sin(a)*r}`);
  }
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ transform: `rotate(${rotate}deg)` }}>
      <polygon points={pts.join(' ')} fill={fill} stroke={stroke} strokeWidth="2" strokeLinejoin="round"/>
      <text x={cx} y={cy+fontSize*0.36} textAnchor="middle" fontSize={fontSize} fontWeight="900"
        fill={textColor} stroke={stroke} strokeWidth="0.7" paintOrder="stroke"
        style={{ fontFamily: 'Pretendard, system-ui', letterSpacing: -0.3 }}>{text}</text>
    </svg>
  );
}

function CloudBubble({ text, fill='#fff', stroke='#111', textColor='#E53935', fontSize=11, w=100, h=60 }) {
  // wavy cloud/speech bubble
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={`M 10 ${h/2} Q 4 ${h*0.3} 14 ${h*0.25} Q 18 8 ${w*0.35} 12 Q ${w/2} 4 ${w*0.65} 10 Q ${w*0.85} 8 ${w-14} ${h*0.3} Q ${w-2} ${h/2} ${w-12} ${h*0.75} Q ${w*0.85} ${h-6} ${w*0.65} ${h-10} Q ${w/2} ${h-2} ${w*0.35} ${h-8} Q ${w*0.15} ${h-6} ${w*0.1} ${h*0.75} Z`}
        fill={fill} stroke={stroke} strokeWidth="2" strokeLinejoin="round"/>
      <text x={w/2} y={h/2+fontSize*0.36} textAnchor="middle" fontSize={fontSize} fontWeight="800"
        fill={textColor} style={{ fontFamily: 'Pretendard, system-ui', letterSpacing: -0.3 }}>{text}</text>
    </svg>
  );
}

function MiniSticker({ kind, ...p }) {
  if (kind === 'heart') return <svg width={p.w||40} height={p.h||40} viewBox="0 0 40 40"><path d="M20 35s-13-8-13-18a7 7 0 0 1 13-4 7 7 0 0 1 13 4c0 10-13 18-13 18Z" fill={p.fill||'#FF6B88'} stroke="#111" strokeWidth="2"/></svg>;
  if (kind === 'star') return <svg width={p.w||40} height={p.h||40} viewBox="0 0 40 40"><path d="M20 4l4.5 10 11 1-8.5 7.5 2.5 11L20 27l-9.5 6.5 2.5-11L4.5 15l11-1L20 4Z" fill={p.fill||'#FFEB3B'} stroke="#111" strokeWidth="2" strokeLinejoin="round"/></svg>;
  if (kind === 'dot') return <svg width={p.w||18} height={p.h||18} viewBox="0 0 18 18"><circle cx="9" cy="9" r="7" fill={p.fill||'#D98893'}/></svg>;
  if (kind === 'sparkle') return <svg width={p.w||30} height={p.h||30} viewBox="0 0 30 30"><path d="M15 3v10M15 17v10M3 15h10M17 15h10" stroke={p.fill||'#111'} strokeWidth="2" strokeLinecap="round"/></svg>;
  return null;
}

const RETRO_STICKERS = [
  { id:'s1', type:'burst', text:'다 같이!', fill:'#FFEB3B', tc:'#E53935' },
  { id:'s2', type:'burst', text:'흥!', fill:'#FF6B88', tc:'#fff', fs:16 },
  { id:'s3', type:'cloud', text:'우하하', fill:'#FFF59D', tc:'#1B5E20' },
  { id:'s4', type:'burst', text:'백 년!', fill:'#FFEB3B', tc:'#E53935' },
  { id:'s5', type:'burst', text:'만 년!', fill:'#FFEB3B', tc:'#0277BD' },
  { id:'s6', type:'cloud', text:'꿀맛', fill:'#FFF59D', tc:'#E53935' },
  { id:'s7', type:'cloud', text:'오늘은 축제다!', fill:'#fff', tc:'#111', w:120 },
  { id:'s8', type:'cloud', text:'영원히 사랑해!', fill:'#fff', tc:'#D81B60', w:130 },
  { id:'s9', type:'burst', text:'딸꾹', fill:'#81D4FA', tc:'#fff' },
  { id:'s10', type:'cloud', text:'혼미', fill:'#FFF59D', tc:'#E53935', w:70 },
  { id:'s11', type:'burst', text:'뚱보\n야식~♥', fill:'#FFEB3B', tc:'#E53935', fs:10 },
  { id:'s12', type:'cloud', text:'왜 이래요?', fill:'#fff', tc:'#D81B60', w:105 },
];

const MINIMAL_STICKERS = [
  { id:'m1', type:'mini', kind:'heart', fill:'#D98893' },
  { id:'m2', type:'mini', kind:'heart', fill:'#F4C8CC' },
  { id:'m3', type:'mini', kind:'star', fill:'#FFE8A3' },
  { id:'m4', type:'mini', kind:'sparkle', fill:'#1A1A1F' },
  { id:'m5', type:'mini', kind:'dot', fill:'#D98893' },
  { id:'m6', type:'text', text:'my fav', font:'Caveat', size:28, color:'#D98893' },
  { id:'m7', type:'text', text:'2026', font:'Caveat', size:26, color:'#1A1A1F' },
  { id:'m8', type:'text', text:'immm ♡', font:'Caveat', size:24, color:'#D98893' },
  { id:'m9', type:'text', text:'best day', font:'Caveat', size:26, color:'#1A1A1F' },
  { id:'m10', type:'mini', kind:'star', fill:'#D98893' },
];

function renderSticker(s, size=1) {
  if (s.type === 'burst') return <Starburst text={s.text} fill={s.fill} textColor={s.tc} fontSize={(s.fs||11)*size} w={(s.w||90)*size} h={(s.h||70)*size} rotate={s.rot||0}/>;
  if (s.type === 'cloud') return <CloudBubble text={s.text} fill={s.fill} textColor={s.tc} fontSize={(s.fs||11)*size} w={(s.w||100)*size} h={(s.h||60)*size}/>;
  if (s.type === 'mini') return <MiniSticker kind={s.kind} fill={s.fill} w={40*size} h={40*size}/>;
  if (s.type === 'text') return <span style={{ fontFamily: s.font, fontSize: s.size*size, color: s.color, fontWeight: 400, whiteSpace:'nowrap', textShadow:'0 1px 0 rgba(255,255,255,0.8)' }}>{s.text}</span>;
  return null;
}

Object.assign(window, { TOKENS, I, Starburst, CloudBubble, MiniSticker, RETRO_STICKERS, MINIMAL_STICKERS, renderSticker, getShotCountForLayout });
