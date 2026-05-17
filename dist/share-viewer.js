// share-viewer.jsx — Share Link Viewer Screen (Production)

function ShareViewerScreen({
  go,
  T = {},
  mobile = false
}) {
  var [imageUrl, setImageUrl] = React.useState(null);
  var [loading, setLoading] = React.useState(true);
  var [error, setError] = React.useState(null);
  React.useEffect(() => {
    var params = new URLSearchParams(window.location.search);
    var hash = window.location.hash;
    var id = params.get('id') || params.get('share') || params.get('asset');
    var url = params.get('url');

    // Handle hash-based routing #/share?id=...
    if (!id && hash.includes('id=')) {
      id = hash.split('id=')[1].split('&')[0];
    }
    var load = async () => {
      try {
        if (url) {
          if (!url.startsWith('http')) throw Object.assign(new Error('Invalid URL'), {
            reason: 'asset-resolve-failed'
          });
          setImageUrl(url);
          setLoading(false);
          return;
        }
        if (id) {
          var Adapter = window.IMMMCloudShareAdapter;
          if (Adapter && typeof Adapter.resolveShareUrl === 'function') {
            var resolved = await Adapter.resolveShareUrl(id);
            if (resolved) {
              setImageUrl(resolved);
              setLoading(false);
              return;
            }
          }
          var Store = window.IMMMResultAssetStore;
          if (Store) {
            var blob = await Store.loadResultAssetBlobFromDb(id);
            if (blob) {
              var _url = URL.createObjectURL(blob);
              setImageUrl(_url);
              setLoading(false);
              return;
            }
          }
          throw Object.assign(new Error('Cloud share resolver unavailable or image not found'), {
            reason: 'asset-resolve-failed'
          });
        }
        throw Object.assign(new Error('No asset ID or URL provided'), {
          reason: 'asset-resolve-failed'
        });
      } catch (e) {
        setError({
          message: e.message,
          reason: e.reason || 'network-failed'
        });
        setLoading(false);
      }
    };
    load();
  }, []);
  var handleDownload = () => {
    if (!imageUrl) return;
    var a = document.createElement('a');
    a.href = imageUrl;
    a.download = `IMMM_SHARE_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  var theme = {
    bg: T.bg || '#FCFCFA',
    ink: T.ink || '#111',
    inkSoft: T.inkSoft || '#777',
    line: T.line || '#E5E2DA',
    pink: T.pinkDeep || '#D98893'
  };
  if (loading) return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100dvh',
      background: theme.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: theme.inkSoft
    }
  }, "Loading moment...");
  if (error || !imageUrl) {
    var isFieldTest = window.IMMM_FIELD_TEST === true || new URLSearchParams(window.location.search).has('fieldTest');
    return /*#__PURE__*/React.createElement("div", {
      style: {
        height: '100dvh',
        background: theme.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 20,
        fontWeight: 700,
        color: theme.pink,
        marginBottom: 12
      }
    }, "Image not found"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: theme.inkSoft,
        marginBottom: 24
      }
    }, "The share link may have expired or is invalid.", isFieldTest && error?.reason && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 8,
        fontSize: 11,
        fontFamily: 'monospace',
        color: '#f00'
      }
    }, "[", error.reason, "] ", error.message)), /*#__PURE__*/React.createElement("button", {
      onClick: () => window.location.href = '/',
      style: {
        padding: '12px 24px',
        background: theme.ink,
        color: theme.bg,
        border: 'none',
        borderRadius: 8,
        fontWeight: 700,
        cursor: 'pointer'
      }
    }, "Go to IMMM"));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100dvh',
      background: theme.bg,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      padding: '16px 20px',
      borderBottom: `1px solid ${theme.line}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 800,
      letterSpacing: 2,
      color: theme.ink
    }
  }, "IMMM SHARE"), /*#__PURE__*/React.createElement("button", {
    onClick: () => window.location.href = '/',
    style: {
      background: 'transparent',
      border: 'none',
      color: theme.inkSoft,
      fontSize: 11,
      fontWeight: 600,
      cursor: 'pointer'
    }
  }, "Close")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      background: '#F1F1F3'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: imageUrl,
    style: {
      maxWidth: '100%',
      maxHeight: '100%',
      borderRadius: 4,
      boxShadow: '0 20px 60px rgba(0,0,0,0.12)'
    },
    crossOrigin: "anonymous",
    onError: () => setError({
      message: 'CORS or Network Error',
      reason: 'cors-failed'
    })
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      padding: '20px 20px calc(var(--sab) + 20px)',
      borderTop: `1px solid ${theme.line}`,
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: handleDownload,
    style: {
      flex: 1,
      padding: '16px',
      background: theme.ink,
      color: theme.bg,
      border: 'none',
      borderRadius: 10,
      fontWeight: 700,
      cursor: 'pointer'
    }
  }, "Download"), /*#__PURE__*/React.createElement("button", {
    onClick: () => window.location.href = '/',
    style: {
      flex: 1,
      padding: '16px',
      border: `1px solid ${theme.ink}`,
      background: 'transparent',
      color: theme.ink,
      borderRadius: 10,
      fontWeight: 700,
      cursor: 'pointer'
    }
  }, "Open in IMMM")));
}
Object.assign(window, {
  ShareViewerScreen
});