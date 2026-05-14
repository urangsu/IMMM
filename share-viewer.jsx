// share-viewer.jsx — Share Link Viewer Screen

function ShareViewerScreen({ go, T = {}, mobile = false, I = {} }) {
  const [imageUrl, setImageUrl] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const loadSharedImage = () => {
      try {
        // Parse URL parameters
        const params = new URLSearchParams(window.location.search);
        const shareUrl = params.get('share');

        if (!shareUrl) {
          setError('공유 링크가 없습니다');
          setLoading(false);
          return;
        }

        // Validate URL: only http/https allowed
        if (!shareUrl.match(/^https?:\/\//)) {
          setError('유효하지 않은 공유 링크입니다');
          setLoading(false);
          return;
        }

        // Validate URL is not a data URI, blob URL, or javascript protocol
        if (shareUrl.match(/^(data:|blob:|javascript:)/)) {
          setError('안전하지 않은 링크입니다');
          setLoading(false);
          return;
        }

        // Use the URL directly - server should handle CORS
        setImageUrl(shareUrl);
        setError(null);
        setLoading(false);
      } catch (e) {
        console.error('[IMMM] Share viewer load failed:', e);
        setError('이미지를 불러올 수 없습니다');
        setLoading(false);
      }
    };

    loadSharedImage();
  }, []);

  const handleDownload = () => {
    if (!imageUrl) return;

    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `IMMM_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `IMMM_${Date.now()}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'IMMM · Photobooth',
          text: '한 장에 담는 순간들. 나만의 포토부스 IMMM.',
        });
      } else {
        handleDownload();
      }
    } catch (e) {
      console.error('[IMMM] Share failed:', e);
      alert('공유에 실패했습니다');
    }
  };

  const defaultT = {
    bg: '#FCFCFA',
    ink: '#111',
    inkSoft: '#777',
    line: '#e8e8e8',
    pinkDeep: '#D98893',
  };

  const theme = { ...defaultT, ...T };

  if (loading) {
    return (
      <div style={{ height: '100dvh', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: theme.inkSoft, marginBottom: 12 }}>공유 이미지를 불러오는 중...</div>
          <svg width="24" height="24" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }}>
            <circle cx="12" cy="12" r="10" stroke={theme.line} strokeWidth="2" fill="none" />
            <path d="M12 2a10 10 0 0110 10" stroke={theme.ink} strokeWidth="2" fill="none" />
          </svg>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '100dvh', background: theme.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center', color: theme.pinkDeep }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>공유 이미지를 불러올 수 없습니다</div>
          <div style={{ fontSize: 13, color: theme.inkSoft, marginBottom: 24 }}>{error}</div>
          <button onClick={() => window.location.href = '/'} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: theme.ink, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            홈으로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100dvh', background: theme.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, borderBottom: `1px solid ${theme.line}`, padding: mobile ? '12px 16px' : '16px 32px', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: mobile ? 18 : 24, fontWeight: 600, color: theme.ink }}>공유 이미지</div>
        <button onClick={() => window.location.href = '/'} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.inkSoft, fontSize: 12, fontFamily: 'Pretendard,system-ui' }}>
          닫기
        </button>
      </div>

      {/* Image viewer */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: mobile ? 12 : 24 }}>
        {imageUrl && (
          <img
            src={imageUrl}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }}
            alt="Shared IMMM Photo"
          />
        )}
      </div>

      {/* Action buttons */}
      <div style={{ flexShrink: 0, padding: mobile ? '12px 16px calc(var(--sab) + 12px)' : '20px 32px', borderTop: `1px solid ${theme.line}`, background: theme.bg, display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button onClick={handleDownload} style={{ flex: 1, padding: mobile ? '12px 16px' : '14px 20px', borderRadius: 8, border: 'none', background: theme.ink, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          저장하기
        </button>
        <button onClick={handleShare} style={{ flex: 1, padding: mobile ? '12px 16px' : '14px 20px', borderRadius: 8, border: `1.5px solid ${theme.line}`, background: 'transparent', color: theme.ink, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          공유하기
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { ShareViewerScreen });
