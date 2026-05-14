/**
 * IMMM Cloud Share Adapter
 *
 * Handles cloud storage integration for result sharing.
 * Supports endpoint-based and Supabase Storage uploads.
 * No secret keys are stored; uses public config only.
 */

(function() {
  const CLOUD_SHARE_ADAPTER_VERSION = '1.0.0';

  const CLOUD_SHARE_PROVIDERS = Object.freeze([
    'endpoint',
    'supabase',
    'none'
  ]);

  const CLOUD_SHARE_STATUSES = Object.freeze([
    'cloud-ready',
    'failed',
    'unconfigured',
    'uploading'
  ]);

  const CLOUD_SHARE_READINESS_STATUSES = Object.freeze([
    'ready',
    'unconfigured',
    'cloud-share-disabled',
    'cloud-provider-missing',
    'upload-endpoint-missing',
    'supabase-config-missing'
  ]);

  const CLOUD_SHARE_RESULT_STATUSES = Object.freeze([
    'cloud-ready',
    'failed',
    'unconfigured',
    'uploading',
    'expired'
  ]);

  const isPlainObject = (value) => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  };

  /**
   * Gets runtime cloud share config from window.IMMM_CLOUD_SHARE_CONFIG
   */
  const getRuntimeCloudShareConfig = () => {
    const config = window.IMMM_CLOUD_SHARE_CONFIG;
    if (!config || !isPlainObject(config)) {
      return null;
    }
    return config;
  };

  /**
   * Creates a validated cloud share config
   */
  const createCloudShareConfig = (params) => {
    const {
      enabled = false,
      provider = 'none',
      uploadEndpoint = null,
      publicBaseUrl = null,
      bucket = 'immm-results',
      expiresInSec = 86400,
      supabaseUrl = null,
      supabaseAnonKey = null,
      supabaseBucket = 'immm-results'
    } = params || {};

    return Object.freeze({
      enabled,
      provider,
      uploadEndpoint,
      publicBaseUrl,
      bucket,
      expiresInSec,
      supabaseUrl,
      supabaseAnonKey,
      supabaseBucket
    });
  };

  /**
   * Checks if cloud share is ready
   */
  const createCloudShareReadiness = (config) => {
    const errors = [];

    if (!config || !isPlainObject(config)) {
      return { ok: false, status: 'unconfigured', reason: 'Invalid config', requirements: ['valid-config'] };
    }

    if (!config.enabled) {
      return { ok: false, status: 'cloud-share-disabled', reason: 'Cloud share disabled', requirements: ['enable-cloud-share'] };
    }

    const provider = config.provider || 'none';
    if (!CLOUD_SHARE_PROVIDERS.includes(provider)) {
      errors.push('invalid-provider');
    }

    if (provider === 'none') {
      return { ok: false, status: 'cloud-provider-missing', reason: 'No provider configured', requirements: ['select-provider'] };
    }

    if (provider === 'endpoint') {
      if (!config.uploadEndpoint) {
        errors.push('upload-endpoint-missing');
      }
      if (!config.publicBaseUrl) {
        errors.push('public-base-url-missing');
      }
    }

    if (provider === 'supabase') {
      if (!config.supabaseUrl) errors.push('supabase-url-missing');
      if (!config.supabaseAnonKey) errors.push('supabase-key-missing');
      if (!config.supabaseBucket) errors.push('supabase-bucket-missing');
    }

    return {
      ok: errors.length === 0,
      status: errors.length > 0 ? 'unconfigured' : 'ready',
      provider,
      reason: errors[0] || 'Ready',
      requirements: errors
    };
  };

  /**
   * Creates a cloud share request object
   */
  const createCloudShareRequest = (params) => {
    const {
      filename = 'result.png',
      sessionId = null,
      assetRecordId = null,
      metadata = {}
    } = params || {};

    return Object.freeze({
      filename,
      sessionId,
      assetRecordId,
      metadata: Object.freeze({ ...metadata })
    });
  };

  /**
   * Uploads result asset via endpoint
   */
  const uploadViaEndpoint = async ({ blob, filename, metadata, config }) => {
    if (!config.uploadEndpoint) {
      throw new Error('Upload endpoint not configured');
    }

    const formData = new FormData();
    formData.append('file', blob);
    formData.append('filename', filename);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const response = await fetch(config.uploadEndpoint, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const remoteUrl = data.remoteUrl || data.url || data.publicUrl;

    if (!remoteUrl || typeof remoteUrl !== 'string' || !remoteUrl.match(/^https?:\/\//)) {
      throw new Error('Invalid remote URL from endpoint');
    }

    return { remoteUrl };
  };

  /**
   * Uploads result asset via Supabase Storage
   */
  const uploadViaSupabaseStorage = async ({ blob, filename, config }) => {
    if (!blob || typeof blob.size !== 'number') {
      throw new Error('Invalid blob for upload');
    }
    if (!config.supabaseUrl || !config.supabaseAnonKey || !config.supabaseBucket) {
      throw new Error('Supabase configuration incomplete');
    }

    const uploadUrl = `${config.supabaseUrl}/storage/v1/object/${config.supabaseBucket}/${encodeURIComponent(filename)}`;
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.supabaseAnonKey}`,
        'apikey': config.supabaseAnonKey,
        'Content-Type': blob.type || 'image/png',
        'x-upsert': 'true'
      },
      body: blob
    });

    if (!response.ok) {
      throw new Error(`Supabase upload failed: ${response.status}`);
    }

    const remoteUrl = `${config.supabaseUrl}/storage/v1/object/public/${config.supabaseBucket}/${encodeURIComponent(filename)}`;
    return { remoteUrl };
  };

  /**
   * Uploads result asset to cloud and generates share viewer URL
   */
  const uploadResultAsset = async ({ blob, filename, sessionId, assetRecordId, metadata, config, appBaseUrl }) => {
    if (!blob) {
      return createCloudShareResult({
        ok: false,
        status: 'failed',
        error: 'no-blob'
      });
    }

    try {
      const cfg = config || getRuntimeCloudShareConfig();
      const readiness = createCloudShareReadiness(cfg);

      if (!readiness.ok) {
        return createCloudShareResult({
          ok: false,
          status: readiness.status,
          error: readiness.reason
        });
      }

      let result;
      if (cfg.provider === 'endpoint') {
        result = await uploadViaEndpoint({ blob, filename, metadata, config: cfg });
      } else if (cfg.provider === 'supabase') {
        result = await uploadViaSupabaseStorage({ blob, filename, config: cfg });
      } else {
        throw new Error('Unknown provider');
      }

      // Generate Share Viewer URL
      const baseUrl = appBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
      const qrUrl = baseUrl && result.remoteUrl
        ? `${baseUrl}/?share=${encodeURIComponent(result.remoteUrl)}`
        : null;

      return createCloudShareResult({
        ok: true,
        status: 'cloud-ready',
        provider: cfg.provider,
        sessionId,
        assetRecordId,
        remoteUrl: result.remoteUrl,
        qrUrl,
        expiresAt: new Date(Date.now() + (cfg.expiresInSec * 1000)).toISOString(),
        metadata
      });
    } catch (error) {
      return createCloudShareResult({
        ok: false,
        status: 'failed',
        error: error?.message || 'upload-failed'
      });
    }
  };

  /**
   * Creates a cloud share result
   */
  const createCloudShareResult = (params) => {
    const {
      ok = false,
      status = 'failed',
      provider = null,
      sessionId = null,
      assetRecordId = null,
      remoteUrl = null,
      qrUrl = null,
      expiresAt = null,
      error = null,
      metadata = {}
    } = params || {};

    return Object.freeze({
      ok,
      status,
      provider,
      sessionId,
      assetRecordId,
      remoteUrl: remoteUrl && /^https?:\/\//.test(remoteUrl) ? remoteUrl : null,
      qrUrl: qrUrl && /^https?:\/\//.test(qrUrl) ? qrUrl : null,
      expiresAt,
      error,
      metadata: Object.freeze({ ...metadata })
    });
  };

  /**
   * Creates unavailable cloud share result
   */
  const createUnavailableCloudShareResult = (reason) => {
    return createCloudShareResult({
      ok: false,
      status: 'unconfigured',
      error: reason || 'cloud-not-available'
    });
  };

  /**
   * Validates cloud share result
   */
  const validateCloudShareResult = (result) => {
    const errors = [];

    if (!isPlainObject(result)) {
      errors.push('not-a-plain-object');
      return { ok: false, errors };
    }

    if (!result.ok && !result.status) {
      errors.push('missing-status');
    }

    if (result.ok && !result.remoteUrl) {
      errors.push('ok-result-missing-remote-url');
    }

    if (result.remoteUrl && !result.remoteUrl.match(/^https?:\/\//)) {
      errors.push('remote-url-must-be-https');
    }

    return {
      ok: errors.length === 0,
      errors
    };
  };

  /**
   * Self-test for cloud share adapter
   */
  const runCloudShareAdapterSelfTest = () => {
    const errors = [];

    // Test 1: Config creation
    const cfg = createCloudShareConfig({
      enabled: true,
      provider: 'endpoint',
      uploadEndpoint: 'https://example.com/upload',
      publicBaseUrl: 'https://cdn.example.com'
    });
    if (!cfg || !cfg.enabled) {
      errors.push('Test 1 FAIL: Config creation failed');
    }

    // Test 2: Readiness when disabled
    const disabledCfg = createCloudShareConfig({ enabled: false });
    const disabledReadiness = createCloudShareReadiness(disabledCfg);
    if (disabledReadiness.ok) {
      errors.push('Test 2 FAIL: Disabled config should not be ready');
    }

    // Test 3: Readiness when no provider
    const noProviderCfg = createCloudShareConfig({ enabled: true, provider: 'none' });
    const noProviderReadiness = createCloudShareReadiness(noProviderCfg);
    if (noProviderReadiness.ok) {
      errors.push('Test 3 FAIL: No provider should not be ready');
    }

    // Test 4: Readiness endpoint missing url
    const endpointNoCfg = createCloudShareConfig({
      enabled: true,
      provider: 'endpoint',
      uploadEndpoint: null
    });
    const endpointNoReadiness = createCloudShareReadiness(endpointNoCfg);
    if (endpointNoReadiness.ok) {
      errors.push('Test 4 FAIL: Endpoint without URL should not be ready');
    }

    // Test 5: Cloud share result validation
    const validResult = createCloudShareResult({
      ok: true,
      status: 'cloud-ready',
      remoteUrl: 'https://example.com/photo.jpg'
    });
    const validation = validateCloudShareResult(validResult);
    if (!validation.ok) {
      errors.push('Test 5 FAIL: Valid result failed validation');
    }

    // Test 6: Result immutability
    const beforeUrl = validResult.remoteUrl;
    try {
      validResult.remoteUrl = 'https://hacked.com';
    } catch (_) {}
    if (!Object.isFrozen(validResult)) {
      errors.push('Test 6 FAIL: Result should be frozen');
    }
    if (validResult.remoteUrl !== beforeUrl) {
      errors.push('Test 6 FAIL: Frozen result mutated');
    }

    // Test 7: Unavailable result
    const unavailable = createUnavailableCloudShareResult('test-reason');
    if (unavailable.ok) {
      errors.push('Test 7 FAIL: Unavailable result should have ok=false');
    }

    // Test 8: Invalid result detection
    const invalidResult = createCloudShareResult({
      ok: true,
      status: 'cloud-ready',
      remoteUrl: null
    });
    const invalidValidation = validateCloudShareResult(invalidResult);
    if (invalidValidation.ok) {
      errors.push('Test 8 FAIL: Invalid result should fail validation');
    }

    // Test 9: blob URL in result must be rejected
    const blobResult = createCloudShareResult({
      ok: true,
      status: 'cloud-ready',
      remoteUrl: 'blob:http://example.com/uuid'
    });
    const blobValidation = validateCloudShareResult(blobResult);
    if (blobValidation.ok) {
      errors.push('Test 9 FAIL: blob URL result should be invalid');
    }

    // Test 10: Supabase readiness validation
    const supabaseCfg = createCloudShareConfig({
      enabled: true,
      provider: 'supabase',
      supabaseUrl: 'https://xxx.supabase.co',
      supabaseAnonKey: 'public_key',
      supabaseBucket: 'immm-results'
    });
    const supabaseReadiness = createCloudShareReadiness(supabaseCfg);
    if (!supabaseReadiness.ok) {
      errors.push('Test 10 FAIL: Valid Supabase config should be ready');
    }

    // Test 11: Supabase missing anon key should fail
    const supabaseNoKeyCfg = createCloudShareConfig({
      enabled: true,
      provider: 'supabase',
      supabaseUrl: 'https://xxx.supabase.co'
    });
    const supabaseNoKeyReadiness = createCloudShareReadiness(supabaseNoKeyCfg);
    if (supabaseNoKeyReadiness.ok) {
      errors.push('Test 11 FAIL: Supabase without anon key should not be ready');
    }

    // Test 12: qrUrl generation in cloud share result
    const resultWithQr = createCloudShareResult({
      ok: true,
      status: 'cloud-ready',
      remoteUrl: 'https://cdn.example.com/photo.jpg',
      qrUrl: 'https://app.example.com/?share=https%3A%2F%2Fcdn.example.com%2Fphoto.jpg'
    });
    if (!resultWithQr.qrUrl || !resultWithQr.qrUrl.includes('?share=')) {
      errors.push('Test 12 FAIL: qrUrl not properly set');
    }

    return {
      ok: errors.length === 0,
      errors
    };
  };

  // --- Export Namespace ---

  window.IMMMCloudShareAdapter = Object.freeze({
    CLOUD_SHARE_ADAPTER_VERSION,
    CLOUD_SHARE_PROVIDERS,
    CLOUD_SHARE_STATUSES,
    CLOUD_SHARE_READINESS_STATUSES,
    CLOUD_SHARE_RESULT_STATUSES,
    getRuntimeCloudShareConfig,
    createCloudShareConfig,
    createCloudShareReadiness,
    createCloudShareRequest,
    uploadResultAsset,
    uploadViaEndpoint,
    uploadViaSupabaseStorage,
    createCloudShareResult,
    createUnavailableCloudShareResult,
    validateCloudShareResult,
    runCloudShareAdapterSelfTest
  });

})();
