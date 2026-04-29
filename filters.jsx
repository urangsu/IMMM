// filters.jsx — CSS filter presets + placeholder portraits

const FILTERS = {
  original:  { name:'No Filter',    ko:'노 필터',   css:'brightness(1.01) contrast(0.99)' },
  porcelain: { name:'Window Light', ko:'자연광',    css:'brightness(1.07) contrast(0.94) saturate(0.96)' },
  smooth:    { name:'Cream Skin',   ko:'크림 스킨', css:'brightness(1.10) contrast(0.90) saturate(0.96) blur(0.45px)' },
  blush:     { name:'First Love',   ko:'첫사랑',    css:'brightness(1.08) contrast(0.93) saturate(1.03)', overlay:'blush' },
  purikura:  { name:'Purikura',     ko:'프리쿠라',  css:'brightness(1.12) contrast(0.92) saturate(0.98) blur(0.35px)', overlay:'purikura' },
  grain:     { name:'Soft Film',    ko:'소프트 필름', css:'sepia(0.10) contrast(1.02) saturate(0.92) brightness(1.02)' },
  bw:        { name:'BW',           ko:'흑백',      css:'grayscale(1) contrast(1.15) brightness(1.05)' },
};

// Filter overlay — decorative layer rendered on top of video/photo
function FilterOverlay({ filter, style={} }) {
  const type = FILTERS[filter]?.overlay;
  if (!type) return null;

  if (type === 'glitter') return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden', ...style }}>
      {/* animated sparkle dots */}
      {[...Array(18)].map((_,i) => {
        const x = (i * 37 + 11) % 97;
        const y = (i * 53 + 7) % 97;
        const s = 0.4 + (i % 5) * 0.22;
        const delay = (i * 0.18) % 1.5;
        const hue = (i * 25) % 360;
        return (
          <div key={i} style={{
            position:'absolute', left:`${x}%`, top:`${y}%`,
            width:6*s, height:6*s,
            borderRadius:'50%',
            background:`hsl(${hue},75%,78%)`,
            boxShadow:`0 0 ${8*s}px ${4*s}px hsla(${hue},75%,78%,0.7)`,
            animation:`glitterPulse 1.2s ${delay}s ease-in-out infinite alternate`,
            opacity:0.85,
          }}/>
        );
      })}
      <style>{`@keyframes glitterPulse { from{opacity:0.3;transform:scale(0.7)} to{opacity:1;transform:scale(1.3)} }`}</style>
    </div>
  );

  if (type === 'purikura') return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden', ...style }}>
      {/* soft white vignette + eye-zone brightening ring */}
      <div style={{ position:'absolute', inset:0,
        background:'radial-gradient(ellipse 70% 50% at 50% 38%, transparent 30%, rgba(255,255,255,0.22) 100%)',
      }}/>
      {/* star corner accents */}
      {[{top:'6%',left:'5%'},{top:'6%',right:'5%'},{bottom:'6%',left:'5%'},{bottom:'6%',right:'5%'}].map((pos,i)=>(
        <div key={i} style={{ position:'absolute', ...pos, opacity:0.7 }}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M8 0l1.5 6.5L16 8l-6.5 1.5L8 16l-1.5-6.5L0 8l6.5-1.5z" fill="#fff"/>
          </svg>
        </div>
      ))}
    </div>
  );

  if (type === 'blush') return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden', ...style }}>
      {/* left cheek blush */}
      <div style={{
        position:'absolute', left:'10%', top:'41%',
        width:'36%', height:'24%',
        borderRadius:'50%',
        background:'radial-gradient(ellipse, rgba(255,100,100,0.55) 0%, transparent 75%)',
        filter:'blur(2.5px)',
      }}/>
      {/* right cheek blush */}
      <div style={{
        position:'absolute', right:'10%', top:'41%',
        width:'36%', height:'24%',
        borderRadius:'50%',
        background:'radial-gradient(ellipse, rgba(255,100,100,0.55) 0%, transparent 75%)',
        filter:'blur(2.5px)',
      }}/>
      {/* tiny heart accent */}
      <div style={{ position:'absolute', top:'8%', right:'8%', fontSize:12, opacity:0.8 }}>♡</div>
      <div style={{ position:'absolute', top:'12%', left:'10%', fontSize:10, opacity:0.65 }}>♡</div>
    </div>
  );

  return null;
}

// Placeholder portrait — gradient face silhouette
function PlaceholderPortrait({ seed=0, filter='original', children }) {
  const palettes = [
    ['#FFD8CC','#F4A3AE','#8E5B6B'],
    ['#F4E4D4','#E8B89A','#A66D55'],
    ['#FFE8D6','#F0B59C','#754C3B'],
    ['#F8DACB','#D89A8A','#6B3E35'],
    ['#FFE4D9','#E8A596','#7E4E45'],
    ['#F1CBBD','#C98B82','#5C362F'],
  ];
  const p = palettes[seed % palettes.length];
  const f = FILTERS[filter]?.css || 'none';
  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden', background:p[0], filter:f }}>
      {/* background */}
      <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 50% 30%, ${p[0]}, ${p[1]})` }}/>
      {/* shoulders */}
      <div style={{ position:'absolute', bottom:0, left:'-10%', right:'-10%', height:'55%',
        background: `radial-gradient(ellipse at 50% 100%, ${p[2]} 0%, ${p[2]} 40%, transparent 70%)` }}/>
      {/* head */}
      <div style={{ position:'absolute', left:'50%', top:'32%', transform:'translate(-50%,-50%)',
        width:'48%', aspectRatio:'0.82', borderRadius:'48% 48% 46% 46%',
        background:`radial-gradient(ellipse at 40% 35%, ${p[1]} 0%, ${p[2]} 90%)`,
        boxShadow: `inset -8px -12px 20px rgba(0,0,0,0.15)`,
      }}/>
      {/* hair */}
      <div style={{ position:'absolute', left:'50%', top:'18%', transform:'translateX(-50%)',
        width:'56%', height:'28%', borderRadius:'50% 50% 30% 30%',
        background:`linear-gradient(180deg, #2a1a18 0%, #3a2220 100%)`,
      }}/>
      {children}
    </div>
  );
}

// Stickers preview strip inside a tile
function StickerLayer({ stickers=[] }) {
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
      {stickers.map((s,i) => (
        <div key={i} style={{ position:'absolute', left:`${s.x}%`, top:`${s.y}%`, transform:`translate(-50%,-50%) rotate(${s.rot||0}deg) scale(${s.scale||1})`, transformOrigin:'center' }}>
          {renderSticker(s.data, s.scaleInner||0.6)}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { FILTERS, PlaceholderPortrait, StickerLayer });
