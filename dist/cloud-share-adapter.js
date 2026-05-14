/**
 * IMMM Cloud Share Adapter
 *
 * Handles cloud storage integration for result sharing.
 * Supports endpoint-based and Supabase Storage uploads.
 * No secret keys are stored; uses public config only.
 */

(function () {
  var CLOUD_SHARE_ADAPTER_VERSION = '1.0.0';
  var CLOUD_SHARE_PROVIDERS = Object.freeze(['endpoint', 'supabase', 'none']);
  var CLOUD_SHARE_STATUSES = Object.freeze(['cloud-ready', 'failed', 'unconfigured', 'uploading']);
  var isPlainObject = value => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  };

  /**
   * Gets runtime cloud share config from window.IMMM_CLOUD_SHARE_CONFIG
   */
  var getRuntimeCloudShareConfig = () => {
    var config = window.IMMM_CLOUD_SHARE_CONFIG;
    if (!config || !isPlainObject(config)) {
      return null;
    }
    return config;
  };

  /**
   * Creates a validated cloud share config
   */
  var createCloudShareConfig = params => {
    var {
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
  var createCloudShareReadiness = config => {
    var errors = [];
    if (!config || !isPlainObject(config)) {
      return {
        ok: false,
        status: 'unconfigured',
        reason: 'Invalid config',
        requirements: ['valid-config']
      };
    }
    if (!config.enabled) {
      return {
        ok: false,
        status: 'cloud-share-disabled',
        reason: 'Cloud share disabled',
        requirements: ['enable-cloud-share']
      };
    }
    var provider = config.provider || 'none';
    if (!CLOUD_SHARE_PROVIDERS.includes(provider)) {
      errors.push('invalid-provider');
    }
    if (provider === 'none') {
      return {
        ok: false,
        status: 'cloud-provider-missing',
        reason: 'No provider configured',
        requirements: ['select-provider']
      };
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
  var createCloudShareRequest = params => {
    var {
      filename = 'result.png',
      sessionId = null,
      assetRecordId = null,
      metadata = {}
    } = params || {};
    return Object.freeze({
      filename,
      sessionId,
      assetRecordId,
      metadata: Object.freeze({
        ...metadata
      })
    });
  };

  /**
   * Uploads result asset via endpoint
   */
  var uploadViaEndpoint = async ({
    blob,
    filename,
    metadata,
    config
  }) => {
    if (!config.uploadEndpoint) {
      throw new Error('Upload endpoint not configured');
    }
    var formData = new FormData();
    formData.append('file', blob);
    formData.append('filename', filename);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }
    var response = await fetch(config.uploadEndpoint, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    var data = await response.json();
    var remoteUrl = data.remoteUrl || data.url || data.publicUrl;
    if (!remoteUrl || typeof remoteUrl !== 'string' || !remoteUrl.match(/^https?:\/\//)) {
      throw new Error('Invalid remote URL from endpoint');
    }
    return {
      remoteUrl
    };
  };

  /**
   * Uploads result asset via Supabase Storage
   */
  var uploadViaSupabaseStorage = async ({
    blob,
    filename,
    config
  }) => {
    if (!config.supabaseUrl || !config.supabaseAnonKey || !config.supabaseBucket) {
      throw new Error('Supabase configuration incomplete');
    }
    var uploadUrl = `${config.supabaseUrl}/storage/v1/object/${config.supabaseBucket}/${encodeURIComponent(filename)}`;
    var response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.supabaseAnonKey}`,
        'apikey': config.supabaseAnonKey,
        'x-upsert': 'true'
      },
      body: blob
    });
    if (!response.ok) {
      throw new Error(`Supabase upload failed: ${response.status}`);
    }
    var remoteUrl = `${config.supabaseUrl}/storage/v1/object/public/${config.supabaseBucket}/${encodeURIComponent(filename)}`;
    return {
      remoteUrl
    };
  };

  /**
   * Uploads result asset to cloud
   */
  var uploadResultAsset = async ({
    blob,
    filename,
    sessionId,
    assetRecordId,
    metadata,
    config
  }) => {
    if (!blob) {
      return createCloudShareResult({
        ok: false,
        status: 'failed',
        error: 'no-blob'
      });
    }
    try {
      var cfg = config || getRuntimeCloudShareConfig();
      var readiness = createCloudShareReadiness(cfg);
      if (!readiness.ok) {
        return createCloudShareResult({
          ok: false,
          status: readiness.status,
          error: readiness.reason
        });
      }
      var result;
      if (cfg.provider === 'endpoint') {
        result = await uploadViaEndpoint({
          blob,
          filename,
          metadata,
          config: cfg
        });
      } else if (cfg.provider === 'supabase') {
        result = await uploadViaSupabaseStorage({
          blob,
          filename,
          config: cfg
        });
      } else {
        throw new Error('Unknown provider');
      }
      return createCloudShareResult({
        ok: true,
        status: 'cloud-ready',
        provider: cfg.provider,
        sessionId,
        assetRecordId,
        remoteUrl: result.remoteUrl,
        expiresAt: new Date(Date.now() + cfg.expiresInSec * 1000).toISOString(),
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
  var createCloudShareResult = params => {
    var {
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
      metadata: Object.freeze({
        ...metadata
      })
    });
  };

  /**
   * Creates unavailable cloud share result
   */
  var createUnavailableCloudShareResult = reason => {
    return createCloudShareResult({
      ok: false,
      status: 'unconfigured',
      error: reason || 'cloud-not-available'
    });
  };

  /**
   * Validates cloud share result
   */
  var validateCloudShareResult = result => {
    var errors = [];
    if (!isPlainObject(result)) {
      errors.push('not-a-plain-object');
      return {
        ok: false,
        errors
      };
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
  var runCloudShareAdapterSelfTest = () => {
    var errors = [];

    // Test 1: Config creation
    var cfg = createCloudShareConfig({
      enabled: true,
      provider: 'endpoint',
      uploadEndpoint: 'https://example.com/upload',
      publicBaseUrl: 'https://cdn.example.com'
    });
    if (!cfg || !cfg.enabled) {
      errors.push('Test 1 FAIL: Config creation failed');
    }

    // Test 2: Readiness when disabled
    var disabledCfg = createCloudShareConfig({
      enabled: false
    });
    var disabledReadiness = createCloudShareReadiness(disabledCfg);
    if (disabledReadiness.ok) {
      errors.push('Test 2 FAIL: Disabled config should not be ready');
    }

    // Test 3: Readiness when no provider
    var noProviderCfg = createCloudShareConfig({
      enabled: true,
      provider: 'none'
    });
    var noProviderReadiness = createCloudShareReadiness(noProviderCfg);
    if (noProviderReadiness.ok) {
      errors.push('Test 3 FAIL: No provider should not be ready');
    }

    // Test 4: Readiness endpoint missing url
    var endpointNoCfg = createCloudShareConfig({
      enabled: true,
      provider: 'endpoint',
      uploadEndpoint: null
    });
    var endpointNoReadiness = createCloudShareReadiness(endpointNoCfg);
    if (endpointNoReadiness.ok) {
      errors.push('Test 4 FAIL: Endpoint without URL should not be ready');
    }

    // Test 5: Cloud share result validation
    var validResult = createCloudShareResult({
      ok: true,
      status: 'cloud-ready',
      remoteUrl: 'https://example.com/photo.jpg'
    });
    var validation = validateCloudShareResult(validResult);
    if (!validation.ok) {
      errors.push('Test 5 FAIL: Valid result failed validation');
    }

    // Test 6: Result immutability
    var frozenError = false;
    try {
      validResult.remoteUrl = 'https://hacked.com';
      frozenError = true;
    } catch (e) {
      // Expected
    }
    if (!frozenError && !Object.isFrozen(validResult)) {
      errors.push('Test 6 FAIL: Result should be immutable');
    }

    // Test 7: Unavailable result
    var unavailable = createUnavailableCloudShareResult('test-reason');
    if (unavailable.ok) {
      errors.push('Test 7 FAIL: Unavailable result should have ok=false');
    }

    // Test 8: Invalid result detection
    var invalidResult = createCloudShareResult({
      ok: true,
      status: 'cloud-ready',
      remoteUrl: null
    });
    var invalidValidation = validateCloudShareResult(invalidResult);
    if (invalidValidation.ok) {
      errors.push('Test 8 FAIL: Invalid result should fail validation');
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