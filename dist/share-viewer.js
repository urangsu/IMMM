// share-viewer.jsx — Share Link Viewer Screen

function ShareViewerScreen({
  go,
  T = {},
  mobile = false,
  I = {}
}) {
  var [imageUrl, setImageUrl] = React.useState(null);
  var [loading, setLoading] = React.useState(true);
  var [error, setError] = React.useState(null);
  React.useEffect(() => {
    var loadSharedImage = () => {
      try {
        // Parse URL parameters
        var params = new URLSearchParams(window.location.search);
        var shareUrl = params.get('share');
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
  var handleDownload = () => {
    if (!imageUrl) return;
    var a = document.createElement('a');
    a.href = imageUrl;
    a.download = `IMMM_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  var handleShare = async () => {
    if (!imageUrl) return;
    try {
      var response = await fetch(imageUrl);
      var blob = await response.blob();
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
        handleDownload();
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
        height: '100dvh',
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
    }, "\uACF5\uC720 \uC774\uBBF8\uC9C0\uB97C \uBD88\uB7EC\uC624\uB294 \uC911..."), /*#__PURE__*/React.createElement("svg", {
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
  if (error) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        height: '100dvh',
        background: theme.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center',
        color: theme.pinkDeep
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 16,
        fontWeight: 600,
        marginBottom: 8
      }
    }, "\uACF5\uC720 \uC774\uBBF8\uC9C0\uB97C \uBD88\uB7EC\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: theme.inkSoft,
        marginBottom: 24
      }
    }, error), /*#__PURE__*/React.createElement("button", {
      onClick: () => window.location.href = '/',
      style: {
        padding: '10px 20px',
        borderRadius: 8,
        border: 'none',
        background: theme.ink,
        color: '#fff',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 600
      }
    }, "\uD648\uC73C\uB85C \uC774\uB3D9")));
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
      borderBottom: `1px solid ${theme.line}`,
      padding: mobile ? '12px 16px' : '16px 32px',
      background: theme.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: mobile ? 18 : 24,
      fontWeight: 600,
      color: theme.ink
    }
  }, "\uACF5\uC720 \uC774\uBBF8\uC9C0"), /*#__PURE__*/React.createElement("button", {
    onClick: () => window.location.href = '/',
    style: {
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: theme.inkSoft,
      fontSize: 12,
      fontFamily: 'Pretendard,system-ui'
    }
  }, "\uB2EB\uAE30")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'auto',
      padding: mobile ? 12 : 24
    }
  }, imageUrl && /*#__PURE__*/React.createElement("img", {
    src: imageUrl,
    style: {
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'contain',
      borderRadius: 8
    },
    alt: "Shared IMMM Photo"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      padding: mobile ? '12px 16px calc(var(--sab) + 12px)' : '20px 32px',
      borderTop: `1px solid ${theme.line}`,
      background: theme.bg,
      display: 'flex',
      gap: 10,
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: handleDownload,
    style: {
      flex: 1,
      padding: mobile ? '12px 16px' : '14px 20px',
      borderRadius: 8,
      border: 'none',
      background: theme.ink,
      color: '#fff',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 600
    }
  }, "\uC800\uC7A5\uD558\uAE30"), /*#__PURE__*/React.createElement("button", {
    onClick: handleShare,
    style: {
      flex: 1,
      padding: mobile ? '12px 16px' : '14px 20px',
      borderRadius: 8,
      border: `1.5px solid ${theme.line}`,
      background: 'transparent',
      color: theme.ink,
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 600
    }
  }, "\uACF5\uC720\uD558\uAE30")));
}
Object.assign(window, {
  ShareViewerScreen
});