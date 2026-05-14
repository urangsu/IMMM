/**
 * IMMM Share / QR Contract (Foundation)
 *
 * Defines sharing requirements without implementing actual share/QR functionality.
 * No DOM, no API calls, no actual sharing.
 */

(function() {
  const SHARE_CONTRACT_VERSION = '1.0.0';

  const SHARE_TYPES = Object.freeze([
    'local-preview',
    'os-share',
    'cloud-share',
    'qr-share'
  ]);

  const SHARE_REQUIREMENTS = Object.freeze({
    'local-preview': {
      requiresCloudReady: false,
      allowsBlobUrl: true,
      requiresRemoteUrl: false
    },
    'os-share': {
      requiresCloudReady: false,
      allowsBlobUrl: true,
      requiresRemoteUrl: false
    },
    'cloud-share': {
      requiresCloudReady: true,
      allowsBlobUrl: false,
      requiresRemoteUrl: true
    },
    'qr-share': {
      requiresCloudReady: true,
      allowsBlobUrl: false,
      requiresRemoteUrl: true
    }
  });

  const isPlainObject = (value) => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  };

  /**
   * Determines if QR share is possible for the given asset.
   * Requires cloudShareResult from cloud-share-adapter for remote URL validation.
   */
  const canCreateQrShare = (params) => {
    if (!isPlainObject(params)) {
      return {
        ok: false,
        reason: 'Invalid params',
        requirements: []
      };
    }

    const { shareState, resultAsset, cloudShareResult } = params;
    const failures = [];

    // Check 1: CloudShareResult must be ok (cloud-ready)
    if (!cloudShareResult || !cloudShareResult.ok || cloudShareResult.status !== 'cloud-ready') {
      failures.push('cloud-share-required');
    }

    // Check 2: CloudShareResult must have valid http(s) remoteUrl
    if (cloudShareResult) {
      if (!cloudShareResult.remoteUrl || !/^https?:\/\//.test(cloudShareResult.remoteUrl)) {
        failures.push('remote-url-missing');
      }

      // Check 2b: CloudShareResult remoteUrl must NOT be blob:
      if (cloudShareResult.remoteUrl && cloudShareResult.remoteUrl.startsWith('blob:')) {
        failures.push('blob-url-not-allowed');
      }
    }

    // Check 3: ResultAsset status must not be expired/revoked/failed
    if (resultAsset) {
      if (resultAsset.status === 'expired') {
        failures.push('expired');
      }
      if (resultAsset.status === 'revoked') {
        failures.push('revoked');
      }
      if (resultAsset.status === 'failed') {
        failures.push('asset-not-shareable');
      }
    } else {
      failures.push('asset-not-shareable');
    }

    return {
      ok: failures.length === 0,
      reason: failures.length > 0 ? failures[0] : 'OK',
      requirements: failures
    };
  };

  /**
   * Determines if cloud share is possible.
   */
  const canCreateCloudShare = (params) => {
    if (!isPlainObject(params)) {
      return { ok: false, reason: 'Invalid params' };
    }

    const { shareState } = params;
    if (!shareState || shareState.status !== 'cloud-ready') {
      return {
        ok: false,
        reason: 'ShareState.status must be cloud-ready'
      };
    }

    return { ok: true, reason: 'OK' };
  };

  /**
   * Determines if OS share (local file/blob share) is possible.
   */
  const canUseOsShare = (params) => {
    if (!isPlainObject(params)) {
      return { ok: false, reason: 'Invalid params' };
    }

    const { resultAsset } = params;
    if (!resultAsset) {
      return { ok: false, reason: 'ResultAsset required' };
    }

    if (resultAsset.status === 'expired' || resultAsset.status === 'revoked') {
      return { ok: false, reason: 'ResultAsset is not available' };
    }

    // OS share works with objectUrl (blob) or remoteUrl
    const hasObjectUrl = !!resultAsset.objectUrl;
    const hasRemoteUrl = !!resultAsset.remoteUrl;

    if (!hasObjectUrl && !hasRemoteUrl) {
      return { ok: false, reason: 'No objectUrl or remoteUrl available' };
    }

    return { ok: true, reason: 'OK' };
  };

  /**
   * Classifies the share target based on available data.
   */
  const classifyShareTarget = (params) => {
    if (!isPlainObject(params)) return 'invalid';

    const { shareState, resultAsset } = params;

    // Prefer QR if eligible
    const qrCheck = canCreateQrShare(params);
    if (qrCheck.ok) return 'qr-share';

    // Fall back to cloud share if eligible
    const cloudCheck = canCreateCloudShare(params);
    if (cloudCheck.ok) return 'cloud-share';

    // Fall back to OS share if eligible
    const osCheck = canUseOsShare(params);
    if (osCheck.ok) return 'os-share';

    // Default to local preview
    return 'local-preview';
  };

  /**
   * Creates a share readiness report.
   */
  const createShareReadinessReport = (params) => {
    return {
      reportVersion: SHARE_CONTRACT_VERSION,
      timestamp: new Date().toISOString(),
      qrShareReady: canCreateQrShare(params),
      cloudShareReady: canCreateCloudShare(params),
      osShareReady: canUseOsShare(params),
      recommendedType: classifyShareTarget(params)
    };
  };

  /**
   * Self-test for share contract.
   */
  const runShareContractSelfTest = () => {
    const errors = [];

    // Test 1: blob URL in cloudShareResult is rejected
    const blobParams = {
      resultAsset: { status: 'local-ready' },
      shareState: { status: 'cloud-ready' },
      cloudShareResult: { ok: true, status: 'cloud-ready', remoteUrl: 'blob:http://example.com/uuid' }
    };
    const blobQr = canCreateQrShare(blobParams);
    if (blobQr.ok) {
      errors.push('Test 1 FAIL: blob: URL in cloudShareResult should be rejected for QR');
    }

    // Test 2: missing cloudShareResult should be rejected
    const missingCloudParams = {
      resultAsset: { status: 'local-ready' },
      shareState: { status: 'cloud-ready' }
    };
    const missingCloudQr = canCreateQrShare(missingCloudParams);
    if (missingCloudQr.ok) {
      errors.push('Test 2 FAIL: missing cloudShareResult should not pass QR check');
    }

    // Test 3: cloud-ready cloudShareResult + valid asset passes QR
    const cloudReadyParams = {
      resultAsset: {
        status: 'cloud-ready'
      },
      shareState: { status: 'cloud-ready' },
      cloudShareResult: {
        ok: true,
        status: 'cloud-ready',
        remoteUrl: 'https://example.com/photo.jpg'
      }
    };
    const cloudQr = canCreateQrShare(cloudReadyParams);
    if (!cloudQr.ok) {
      errors.push('Test 3 FAIL: cloud-ready cloudShareResult + valid asset should pass QR check');
    }

    // Test 4: expired asset is rejected
    const expiredParams = {
      resultAsset: {
        status: 'expired'
      },
      shareState: { status: 'cloud-ready' },
      cloudShareResult: {
        ok: true,
        status: 'cloud-ready',
        remoteUrl: 'https://example.com/photo.jpg'
      }
    };
    const expiredQr = canCreateQrShare(expiredParams);
    if (expiredQr.ok) {
      errors.push('Test 4 FAIL: expired asset should be rejected for QR');
    }

    // Test 5: failed asset is rejected
    const failedParams = {
      resultAsset: {
        status: 'failed'
      },
      shareState: { status: 'cloud-ready' },
      cloudShareResult: {
        ok: true,
        status: 'cloud-ready',
        remoteUrl: 'https://example.com/photo.jpg'
      }
    };
    const failedQr = canCreateQrShare(failedParams);
    if (failedQr.ok) {
      errors.push('Test 5 FAIL: failed asset should be rejected for QR');
    }

    // Test 6: OS share works with objectUrl
    const osParams = {
      resultAsset: {
        status: 'local-ready',
        objectUrl: 'blob:http://example.com/uuid'
      }
    };
    const osShare = canUseOsShare(osParams);
    if (!osShare.ok) {
      errors.push('Test 6 FAIL: OS share should work with objectUrl');
    }

    // Test 7: Classification with cloud-ready params needs cloudShareResult
    const classifyParams = {
      resultAsset: {
        status: 'cloud-ready'
      },
      shareState: { status: 'cloud-ready' },
      cloudShareResult: {
        ok: true,
        status: 'cloud-ready',
        remoteUrl: 'https://example.com/photo.jpg'
      }
    };
    const classified = classifyShareTarget(classifyParams);
    if (classified !== 'qr-share') {
      errors.push(`Test 7 FAIL: cloud-ready should classify as qr-share, got ${classified}`);
    }

    return {
      ok: errors.length === 0,
      errors
    };
  };

  // --- Export Namespace ---

  window.IMMMShareContract = Object.freeze({
    SHARE_CONTRACT_VERSION,
    SHARE_TYPES,
    SHARE_REQUIREMENTS,
    canCreateQrShare,
    canCreateCloudShare,
    canUseOsShare,
    classifyShareTarget,
    createShareReadinessReport,
    runShareContractSelfTest
  });

})();
