// result-gallery.jsx — Local Result Gallery & Share Viewer Screens

function ResultGalleryScreen({ go, T = {}, mobile = false, I = {} }) {
  const [records, setRecords] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState(null);
  const [error, setError] = React.useState(null);

  const loadGallery = async () => {
    try {
      setLoading(true);
      setError(null);
      const Store = window.IMMMResultAssetStore;
      if (!Store || typeof Store.listResultAssetRecordsFromDb !== 'function') {
        setError('갤러리 기능을 사용할 수 없습니다');
        return;
      }

      const loaded = await Store.listResultAssetRecordsFromDb(null, 100);
      setRecords(loaded || []);
    } catch (e) {
      console.error('[IMMM] Gallery load failed:', e);
      setError(e.message || '갤러리를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadGallery();
  }, []);

  const handleDelete = async (assetRecordId, blobId) => {
    if (!confirm('이 사진을 삭제하시겠어요?')) return;

    try {
      const Store = window.IMMMResultAssetStore;
      if (Store && typeof Store.deleteResultAssetFromDb === 'function') {
        await Store.deleteResultAssetFromDb(assetRecordId, blobId);
        setRecords(records.filter(r => r.assetRecordId !== assetRecordId));
      }
    } catch (e) {
      console.error('[IMMM] Delete failed:', e);
      alert('삭제에 실패했습니다');
    }
  };

  const handleOpen = async (assetRecordId, blobId) => {
    if (!blobId) return;

    try {
      const Store = window.IMMMResultAssetStore;
      if (Store && typeof Store.loadResultAssetBlobFromDb === 'function') {
        const blob = await Store.loadResultAssetBlobFromDb(blobId);
        if (blob) {
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
          setTimeout(() => URL.revokeObjectURL(url), 30000);
        }
      }
    } catch (e) {
      console.error('[IMMM] Open failed:', e);
      alert('사진을 열 수 없습니다');
    }
  };

  const handleShare = async (record) => {
    try {
      const Store = window.IMMMResultAssetStore;
      if (!Store || !record.blobId) return;

      const blob = await Store.loadResultAssetBlobFromDb(record.blobId);
      if (!blob) return;

      const file = new File([blob], `IMMM_${Date.now()}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'IMMM · Photobooth',
          text: '한 장에 담는 순간들. 나만의 포토부스 IMMM.',
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `IMMM_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 15000);
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
      <div style={{ height: '100%', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: theme.inkSoft, marginBottom: 12 }}>갤러리를 불러오는 중...</div>
          <svg width="24" height="24" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }}>
            <circle cx="12" cy="12" r="10" stroke={theme.line} strokeWidth="2" fill="none" />
            <path d="M12 2a10 10 0 0110 10" stroke={theme.ink} strokeWidth="2" fill="none" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', background: theme.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, borderBottom: `1px solid ${theme.line}`, padding: mobile ? '12px 16px' : '16px 56px', background: theme.bg }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0, fontFamily: '"Plus Jakarta Sans",system-ui', fontSize: mobile ? 24 : 32, fontWeight: 500 }}>
            My Gallery
          </h1>
          <button onClick={() => go('landing')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.inkSoft, fontSize: 12, fontFamily: 'Pretendard,system-ui' }}>
            New Session
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: mobile ? '16px' : '32px 56px' }}>
        {error ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: theme.pinkDeep }}>
            <div style={{ fontSize: 14, marginBottom: 16 }}>{error}</div>
            <button onClick={loadGallery} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: theme.ink, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              다시 시도
            </button>
          </div>
        ) : records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: theme.inkSoft }}>
            <div style={{ fontSize: 14 }}>저장된 사진이 없습니다.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 16 }}>
            {records.map((record) => (
              <div key={record.assetRecordId} style={{ position: 'relative', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer' }}>
                {/* Placeholder for image thumbnail */}
                <div style={{ width: '100%', paddingBottom: '80%', background: theme.line, position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.inkSoft, fontSize: 12 }}>
                    Image
                  </div>
                </div>

                {/* Card content */}
                <div style={{ padding: '12px' }}>
                  <div style={{ fontSize: 11, color: theme.inkSoft, marginBottom: 8 }}>
                    {new Date(record.createdAt).toLocaleDateString('ko-KR')}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <button onClick={() => handleOpen(record.assetRecordId, record.blobId)} style={{ padding: '6px', borderRadius: 6, border: 'none', background: theme.line, color: theme.ink, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
                      Open
                    </button>
                    <button onClick={() => handleShare(record)} style={{ padding: '6px', borderRadius: 6, border: 'none', background: theme.line, color: theme.ink, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
                      Share
                    </button>
                    <button onClick={() => handleDelete(record.assetRecordId, record.blobId)} style={{ gridColumn: '1 / -1', padding: '6px', borderRadius: 6, border: 'none', background: '#FDE8EA', color: theme.pinkDeep, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ResultGalleryScreen });
