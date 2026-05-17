// result-gallery.jsx — Local Result Gallery MVP

function ResultGalleryScreen({
  go,
  T = {},
  mobile = false
}) {
  var [records, setRecords] = React.useState([]);
  var [loading, setLoading] = React.useState(true);
  var [viewRecord, setViewRecord] = React.useState(null);
  var [viewUrl, setViewUrl] = React.useState(null);
  var load = async () => {
    try {
      var Store = window.IMMMResultAssetStore;
      if (!Store) return;
      var data = await Store.listResultAssetRecordsFromDb(null, 50);
      setRecords(data || []);
    } catch (e) {
      console.error('[IMMM] gallery load error', e);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Safety helper to revoke blob URLs without touching remote or non-blob URLs
   */
  var revokeBlobUrl = url => {
    if (typeof url === 'string' && url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {}
    }
  };
  var openLarge = async record => {
    var Store = window.IMMMResultAssetStore;
    if (!Store || !record.blobId) return;
    var blob = await Store.loadResultAssetBlobFromDb(record.blobId);
    if (blob) {
      if (viewUrl) revokeBlobUrl(viewUrl);
      var url = URL.createObjectURL(blob);
      setViewUrl(url);
      setViewRecord(record);
    }
  };
  var closeLarge = () => {
    if (viewUrl) revokeBlobUrl(viewUrl);
    setViewUrl(null);
    setViewRecord(null);
  };
  React.useEffect(() => {
    load();
    return () => {
      if (viewUrl) revokeBlobUrl(viewUrl);
    };
  }, [viewUrl]);
  var theme = {
    bg: T.bg || '#FCFCFA',
    ink: T.ink || '#111',
    inkSoft: T.inkSoft || '#777',
    line: T.line || '#E5E2DA',
    pink: T.pinkDeep || '#D98893'
  };
  var EmptyState = () => /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '100px 40px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: theme.inkSoft,
      fontWeight: 500
    }
  }, "No saved moments yet."), /*#__PURE__*/React.createElement("button", {
    onClick: () => go('setup'),
    style: {
      marginTop: 20,
      padding: '10px 20px',
      background: theme.ink,
      color: theme.bg,
      border: 'none',
      borderRadius: 8,
      fontSize: 12,
      fontWeight: 700,
      cursor: 'pointer'
    }
  }, "Start Shooting"));
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
      padding: mobile ? '16px 20px' : '24px 56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      letterSpacing: 2,
      fontWeight: 800,
      color: theme.inkSoft
    }
  }, "GALLERY"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 24,
      fontWeight: 700,
      color: theme.ink,
      marginTop: 2
    }
  }, "Your Moments")), /*#__PURE__*/React.createElement("button", {
    onClick: () => go('landing'),
    style: {
      background: 'transparent',
      border: 'none',
      color: theme.inkSoft,
      fontSize: 12,
      fontWeight: 600,
      cursor: 'pointer'
    }
  }, "Home")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: mobile ? '0 16px 40px' : '0 56px 60px'
    }
  }, loading ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 40,
      color: theme.inkSoft
    }
  }, "Loading gallery...") : records.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, null) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: mobile ? 10 : 20
    }
  }, records.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.assetRecordId,
    onClick: () => openLarge(r),
    style: {
      borderRadius: 12,
      overflow: 'hidden',
      background: '#fff',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      cursor: 'pointer',
      border: `1px solid ${theme.line}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '3/4',
      background: '#f4f4f4',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: theme.inkSoft
    }
  }, new Date(r.createdAt).toLocaleDateString())), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 10,
      fontSize: 11,
      fontWeight: 700
    }
  }, r.metadata?.label || 'Moment'))))), viewUrl && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 20000,
      background: 'rgba(0,0,0,0.9)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: viewUrl,
    style: {
      maxWidth: '100%',
      maxHeight: '85%',
      borderRadius: 4,
      boxShadow: '0 20px 80px rgba(0,0,0,0.4)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      display: 'flex',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: viewUrl,
    download: `IMMM_GALLERY_${viewRecord?.assetRecordId}.png`,
    style: {
      padding: '12px 24px',
      background: '#fff',
      color: '#111',
      borderRadius: 10,
      textDecoration: 'none',
      fontWeight: 700,
      fontSize: 13
    }
  }, "Download"), /*#__PURE__*/React.createElement("button", {
    onClick: closeLarge,
    style: {
      padding: '12px 24px',
      background: 'rgba(255,255,255,0.2)',
      color: '#fff',
      border: 'none',
      borderRadius: 10,
      fontWeight: 700,
      fontSize: 13,
      cursor: 'pointer'
    }
  }, "Close"))));
}
Object.assign(window, {
  ResultGalleryScreen
});