// result-gallery.jsx — Local Result Gallery & Share Viewer Screens

function ResultGalleryScreen({
  go,
  T = {},
  mobile = false,
  I = {}
}) {
  var [records, setRecords] = React.useState([]);
  var [loading, setLoading] = React.useState(true);
  var [selectedId, setSelectedId] = React.useState(null);
  var [error, setError] = React.useState(null);
  var loadGallery = async () => {
    try {
      setLoading(true);
      setError(null);
      var Store = window.IMMMResultAssetStore;
      if (!Store || typeof Store.listResultAssetRecordsFromDb !== 'function') {
        setError('갤러리 기능을 사용할 수 없습니다');
        return;
      }
      var loaded = await Store.listResultAssetRecordsFromDb(null, 100);
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
  var handleDelete = async (assetRecordId, blobId) => {
    if (!confirm('이 사진을 삭제하시겠어요?')) return;
    try {
      var Store = window.IMMMResultAssetStore;
      if (Store && typeof Store.deleteResultAssetFromDb === 'function') {
        await Store.deleteResultAssetFromDb(assetRecordId, blobId);
        setRecords(records.filter(r => r.assetRecordId !== assetRecordId));
      }
    } catch (e) {
      console.error('[IMMM] Delete failed:', e);
      alert('삭제에 실패했습니다');
    }
  };
  var handleOpen = async (assetRecordId, blobId) => {
    if (!blobId) return;
    try {
      var Store = window.IMMMResultAssetStore;
      if (Store && typeof Store.loadResultAssetBlobFromDb === 'function') {
        var blob = await Store.loadResultAssetBlobFromDb(blobId);
        if (blob) {
          var url = URL.createObjectURL(blob);
          window.open(url, '_blank');
          setTimeout(() => URL.revokeObjectURL(url), 30000);
        }
      }
    } catch (e) {
      console.error('[IMMM] Open failed:', e);
      alert('사진을 열 수 없습니다');
    }
  };
  var handleShare = async record => {
    try {
      var Store = window.IMMMResultAssetStore;
      if (!Store || !record.blobId) return;
      var blob = await Store.loadResultAssetBlobFromDb(record.blobId);
      if (!blob) return;
      var file = new File([blob], `IMMM_${Date.now()}.png`, {
        type: 'image/png'
      });
      if (navigator.share && navigator.canShare && navigator.canShare({
        files: [file]
      })) {
        await navigator.share({
          files: [file],
          title: 'IMMM · Photobooth',
          text: '한 장에 담는 순간들. 나만의 포토부스 IMMM.'
        });
      } else {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
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
  var defaultT = {
    bg: '#FCFCFA',
    ink: '#111',
    inkSoft: '#777',
    line: '#e8e8e8',
    pinkDeep: '#D98893'
  };
  var theme = {
    ...defaultT,
    ...T
  };
  if (loading) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        height: '100%',
        background: theme.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        color: theme.inkSoft,
        marginBottom: 12
      }
    }, "\uAC24\uB7EC\uB9AC\uB97C \uBD88\uB7EC\uC624\uB294 \uC911..."), /*#__PURE__*/React.createElement("svg", {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      style: {
        animation: 'spin 1s linear infinite',
        margin: '0 auto'
      }
    }, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "10",
      stroke: theme.line,
      strokeWidth: "2",
      fill: "none"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M12 2a10 10 0 0110 10",
      stroke: theme.ink,
      strokeWidth: "2",
      fill: "none"
    }))));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      background: theme.bg,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      borderBottom: `1px solid ${theme.line}`,
      padding: mobile ? '12px 16px' : '16px 56px',
      background: theme.bg
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: '"Plus Jakarta Sans",system-ui',
      fontSize: mobile ? 24 : 32,
      fontWeight: 500
    }
  }, "My Gallery"), /*#__PURE__*/React.createElement("button", {
    onClick: () => go('landing'),
    style: {
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: theme.inkSoft,
      fontSize: 12,
      fontFamily: 'Pretendard,system-ui'
    }
  }, "New Session"))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: mobile ? '16px' : '32px 56px'
    }
  }, error ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '40px 20px',
      color: theme.pinkDeep
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      marginBottom: 16
    }
  }, error), /*#__PURE__*/React.createElement("button", {
    onClick: loadGallery,
    style: {
      padding: '8px 16px',
      borderRadius: 8,
      border: 'none',
      background: theme.ink,
      color: '#fff',
      cursor: 'pointer',
      fontSize: 12,
      fontWeight: 600
    }
  }, "\uB2E4\uC2DC \uC2DC\uB3C4")) : records.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '60px 20px',
      color: theme.inkSoft
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14
    }
  }, "\uC800\uC7A5\uB41C \uC0AC\uC9C4\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.")) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
      gap: 16
    }
  }, records.map(record => /*#__PURE__*/React.createElement("div", {
    key: record.assetRecordId,
    style: {
      position: 'relative',
      background: '#fff',
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      paddingBottom: '80%',
      background: theme.line,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: theme.inkSoft,
      fontSize: 12
    }
  }, "Image")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: theme.inkSoft,
      marginBottom: 8
    }
  }, new Date(record.createdAt).toLocaleDateString('ko-KR')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => handleOpen(record.assetRecordId, record.blobId),
    style: {
      padding: '6px',
      borderRadius: 6,
      border: 'none',
      background: theme.line,
      color: theme.ink,
      fontSize: 10,
      fontWeight: 600,
      cursor: 'pointer'
    }
  }, "Open"), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleShare(record),
    style: {
      padding: '6px',
      borderRadius: 6,
      border: 'none',
      background: theme.line,
      color: theme.ink,
      fontSize: 10,
      fontWeight: 600,
      cursor: 'pointer'
    }
  }, "Share"), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleDelete(record.assetRecordId, record.blobId),
    style: {
      gridColumn: '1 / -1',
      padding: '6px',
      borderRadius: 6,
      border: 'none',
      background: '#FDE8EA',
      color: theme.pinkDeep,
      fontSize: 10,
      fontWeight: 600,
      cursor: 'pointer'
    }
  }, "Delete"))))))));
}
Object.assign(window, {
  ResultGalleryScreen
});