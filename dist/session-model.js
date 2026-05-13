/**
 * IMMM CaptureSession Model Foundation
 * 
 * Provides data factories, validators, and normalizers for session-based capture flow.
 * Note: These are for local session management and do not imply cloud backend readiness.
 */

(function () {
  var SCHEMA_VERSION = '1.0.0';

  // --- Helpers ---

  var nowIso = () => new Date().toISOString();
  var makeId = prefix => {
    // Note: This is for local session tracking only, not cryptographically secure for server use.
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `${prefix}_${crypto.randomUUID()}`;
    }
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  };
  var clonePlain = value => {
    if (value === undefined) return undefined;
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
      // classic | bestCut | motion
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
      // photo | video
      sourceType: 'camera',
      // camera | upload | demo | remote
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
      // local | os-share | cloud-pending | cloud-ready | expired
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
      // idle | rendering | ready | failed
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
    if (!session.sessionId) errors.push('Missing sessionId');
    if (!session.schemaVersion) errors.push('Missing schemaVersion');
    if (!Array.isArray(session.shots)) errors.push('shots must be an array');
    if (!Array.isArray(session.selectedCuts)) errors.push('selectedCuts must be an array');
    if (!isPlainObject(session.renderRecipe)) errors.push('renderRecipe must be an object');
    if (!isPlainObject(session.shareState)) errors.push('shareState must be an object');
    if (!isPlainObject(session.exportState)) errors.push('exportState must be an object');
    return {
      ok: errors.length === 0,
      errors
    };
  };
  var normalizeCaptureSession = input => {
    if (!isPlainObject(input)) return createCaptureSession();
    var base = createCaptureSession();
    return {
      ...base,
      ...input,
      renderRecipe: {
        ...base.renderRecipe,
        ...(input.renderRecipe || {})
      },
      editRecipe: {
        ...base.editRecipe,
        ...(input.editRecipe || {})
      },
      shareState: {
        ...base.shareState,
        ...(input.shareState || {})
      },
      exportState: {
        ...base.exportState,
        ...(input.exportState || {})
      },
      updatedAt: nowIso()
    };
  };

  // --- Export Namespace ---

  window.IMMMSessionModel = Object.freeze({
    SCHEMA_VERSION,
    createCaptureSession,
    createMediaAsset,
    createSelectedCut,
    createRenderRecipe,
    createEditRecipe,
    createShareState,
    createExportState,
    validateCaptureSession,
    normalizeCaptureSession
  });
})();