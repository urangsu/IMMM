/**
 * IMMM CaptureSession Model Foundation (Hardened)
 * 
 * Provides data factories, validators, and normalizers for session-based capture flow.
 * Note: These are for local session management and do not imply cloud backend readiness.
 */

(function () {
  var SCHEMA_VERSION = '1.0.0';

  // --- Enums ---

  var SESSION_MODES = Object.freeze(['classic', 'bestCut', 'motion']);
  var MEDIA_TYPES = Object.freeze(['photo', 'video']);
  var SOURCE_TYPES = Object.freeze(['camera', 'upload', 'demo', 'remote']);
  var SHARE_STATUSES = Object.freeze(['local', 'os-share', 'cloud-pending', 'cloud-ready', 'expired']);
  var EXPORT_STATUSES = Object.freeze(['idle', 'rendering', 'ready', 'failed']);

  // --- Helpers ---

  var nowIso = () => new Date().toISOString();
  var makeId = prefix => {
    // Note: This is for local session tracking only, not cryptographically secure for server use.
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `${prefix}_${crypto.randomUUID()}`;
    }
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  };

  /**
   * Deep clone for plain objects/arrays.
   * Note: This uses JSON serialization, so it will NOT preserve Functions, Blobs, or Files.
   * MediaAsset data should rely on string-based dataUrl/blobUrl/remoteUrl contracts.
   */
  var clonePlain = value => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    return JSON.parse(JSON.stringify(value));
  };
  var isPlainObject = value => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  };

  // --- Factories ---

  var createCaptureSession = (overrides = {}) => {
    var base = {
      schemaVersion: SCHEMA_VERSION,
      sessionId: makeId('session'),
      mode: 'classic',
      // in SESSION_MODES
      ownerId: 'local_user',
      groupId: null,
      frameTemplateId: 'strip_1x4',
      layout: 'strip',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      participants: [],
      shots: [],
      selectedCuts: [],
      renderRecipe: createRenderRecipe(),
      editRecipe: createEditRecipe(),
      shareState: createShareState(),
      exportState: createExportState(),
      metadata: {}
    };
    return {
      ...base,
      ...overrides
    };
  };
  var createMediaAsset = (overrides = {}) => {
    var base = {
      assetId: makeId('asset'),
      sessionId: null,
      slotIndex: 0,
      mediaType: 'photo',
      // in MEDIA_TYPES
      sourceType: 'camera',
      // in SOURCE_TYPES
      dataUrl: null,
      blobUrl: null,
      remoteUrl: null,
      posterDataUrl: null,
      width: 0,
      height: 0,
      durationMs: 0,
      filterRecipe: null,
      cropRecipe: null,
      createdAt: nowIso(),
      metadata: {}
    };
    return {
      ...base,
      ...overrides
    };
  };
  var createSelectedCut = (overrides = {}) => {
    var base = {
      cutId: makeId('cut'),
      sessionId: null,
      assetId: null,
      sourceShotIndex: 0,
      targetSlotIndex: 0,
      cropRecipe: null,
      editRecipe: null,
      createdAt: nowIso()
    };
    return {
      ...base,
      ...overrides
    };
  };
  var createRenderRecipe = (overrides = {}) => {
    var base = {
      recipeId: makeId('recipe'),
      layout: 'strip',
      frameTheme: 'black',
      frameTemplateId: 'strip_1x4',
      stickers: [],
      drawings: [],
      textLayers: [],
      logo: true,
      dateStamp: true,
      outputScale: 3.0,
      createdAt: nowIso()
    };
    return {
      ...base,
      ...overrides
    };
  };
  var createEditRecipe = (overrides = {}) => {
    var base = {
      filterId: 'original',
      intensity: 1.0,
      blur: 0,
      skin: 0,
      crop: null,
      adjustments: {},
      version: 1
    };
    return {
      ...base,
      ...overrides
    };
  };
  var createShareState = (overrides = {}) => {
    var base = {
      status: 'local',
      // in SHARE_STATUSES
      localPreviewUrl: null,
      cloudUrl: null,
      qrUrl: null,
      expiresAt: null,
      provider: null,
      createdAt: nowIso()
    };
    return {
      ...base,
      ...overrides
    };
  };
  var createExportState = (overrides = {}) => {
    var base = {
      status: 'idle',
      // in EXPORT_STATUSES
      imageBlobId: null,
      imageObjectUrl: null,
      videoBlobId: null,
      videoObjectUrl: null,
      error: null,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    return {
      ...base,
      ...overrides
    };
  };

  // --- Validation ---

  var validateCaptureSession = session => {
    var errors = [];
    if (!isPlainObject(session)) {
      errors.push('Session is not an object');
      return {
        ok: false,
        errors
      };
    }
    if (typeof session.sessionId !== 'string') errors.push('sessionId must be a string');
    if (session.schemaVersion !== SCHEMA_VERSION) errors.push(`Invalid schemaVersion (expected ${SCHEMA_VERSION})`);
    if (!SESSION_MODES.includes(session.mode)) errors.push(`Invalid mode: ${session.mode}`);
    if (!Array.isArray(session.shots)) errors.push('shots must be an array');else {
      session.shots.forEach((shot, i) => {
        if (!isPlainObject(shot)) errors.push(`shot[${i}] is not an object`);else {
          if (shot.mediaType && !MEDIA_TYPES.includes(shot.mediaType)) errors.push(`shot[${i}] invalid mediaType: ${shot.mediaType}`);
          if (shot.sourceType && !SOURCE_TYPES.includes(shot.sourceType)) errors.push(`shot[${i}] invalid sourceType: ${shot.sourceType}`);
          if (shot.assetId && typeof shot.assetId !== 'string') errors.push(`shot[${i}] assetId must be a string`);
        }
      });
    }
    if (!Array.isArray(session.selectedCuts)) errors.push('selectedCuts must be an array');else {
      session.selectedCuts.forEach((cut, i) => {
        if (!isPlainObject(cut)) errors.push(`selectedCut[${i}] is not an object`);else {
          if (!cut.cutId) errors.push(`selectedCut[${i}] missing cutId`);
          if (!cut.assetId) errors.push(`selectedCut[${i}] missing assetId`);
        }
      });
    }
    if (!isPlainObject(session.renderRecipe)) errors.push('renderRecipe must be an object');
    if (!isPlainObject(session.editRecipe)) errors.push('editRecipe must be an object');
    if (!isPlainObject(session.shareState)) errors.push('shareState must be an object');else {
      if (!SHARE_STATUSES.includes(session.shareState.status)) errors.push(`Invalid share status: ${session.shareState.status}`);
    }
    if (!isPlainObject(session.exportState)) errors.push('exportState must be an object');else {
      if (!EXPORT_STATUSES.includes(session.exportState.status)) errors.push(`Invalid export status: ${session.exportState.status}`);
    }
    return {
      ok: errors.length === 0,
      errors
    };
  };
  var normalizeCaptureSession = input => {
    if (!isPlainObject(input)) return createCaptureSession();
    var base = createCaptureSession();
    var normalized = {
      ...base,
      ...clonePlain(input),
      // Deep merge critical nested objects if they exist
      renderRecipe: {
        ...base.renderRecipe,
        ...clonePlain(input.renderRecipe || {})
      },
      editRecipe: {
        ...base.editRecipe,
        ...clonePlain(input.editRecipe || {})
      },
      shareState: {
        ...base.shareState,
        ...clonePlain(input.shareState || {})
      },
      exportState: {
        ...base.exportState,
        ...clonePlain(input.exportState || {})
      },
      updatedAt: nowIso()
    };
    return normalized;
  };

  // --- Self-Test ---

  function runSessionModelSelfTest() {
    var session = createCaptureSession({
      mode: 'bestCut',
      shots: [createMediaAsset({
        mediaType: 'photo',
        sourceType: 'camera',
        width: 1200,
        height: 1600
      })],
      selectedCuts: [createSelectedCut({
        sourceShotIndex: 0,
        targetSlotIndex: 0
      })]
    });
    var result = validateCaptureSession(session);
    var normalized = normalizeCaptureSession(session);
    var normalizedResult = validateCaptureSession(normalized);
    return {
      ok: result.ok && normalizedResult.ok,
      errors: [...result.errors, ...normalizedResult.errors],
      sample: {
        sessionId: session.sessionId,
        shotCount: session.shots.length,
        selectedCount: session.selectedCuts.length
      }
    };
  }

  // --- Export Namespace ---

  window.IMMMSessionModel = Object.freeze({
    SCHEMA_VERSION,
    SESSION_MODES,
    MEDIA_TYPES,
    SOURCE_TYPES,
    SHARE_STATUSES,
    EXPORT_STATUSES,
    createCaptureSession,
    createMediaAsset,
    createSelectedCut,
    createRenderRecipe,
    createEditRecipe,
    createShareState,
    createExportState,
    validateCaptureSession,
    normalizeCaptureSession,
    runSessionModelSelfTest
  });
})();