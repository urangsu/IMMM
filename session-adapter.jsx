/**
 * IMMM CaptureSession Adapter (Foundation)
 * 
 * Provides pure functions to transform existing application state into CaptureSession snapshots.
 * Note: This is a read-only adapter and does not modify the original application state.
 */

(function() {
  const ADAPTER_VERSION = '1.0.0';
  const RESULT_KINDS = Object.freeze(['image', 'video']);

  // --- Helpers ---

  const clonePlain = (value) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    return JSON.parse(JSON.stringify(value));
  };

  const isPlainObject = (value) => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  };

  // --- Mapping Functions ---

  /**
   * Transforms raw shots into MediaAsset objects.
   * shots can be array of: strings (dataUrl), objects with dataUrl/blobUrl/url/src.
   * Unsupported inputs (null, undefined, number, boolean, function, array) are skipped.
   */
  const createMediaAssetsFromShots = (shots, options = {}) => {
    const Model = window.IMMMSessionModel;
    if (!Model) return [];

    const { sessionId = null, sourceType = 'camera', mediaType = 'photo' } = options;

    if (!Array.isArray(shots)) return [];

    const assets = [];

    shots.forEach((shot, index) => {
      // Skip unsupported input types
      const shotType = typeof shot;
      if (shot === null || shot === undefined) return;
      if (shotType === 'number' || shotType === 'boolean' || shotType === 'function') return;
      if (Array.isArray(shot)) return;

      let dataUrl = null;
      let blobUrl = null;
      let width = 0;
      let height = 0;

      if (shotType === 'string') {
        dataUrl = shot;
      } else if (isPlainObject(shot)) {
        dataUrl = shot.dataUrl || shot.url || shot.src || null;
        blobUrl = shot.blobUrl || null;
        width = (typeof shot.width === 'number') ? shot.width : 0;
        height = (typeof shot.height === 'number') ? shot.height : 0;
      }

      // Only create asset if we have meaningful data
      if (dataUrl || blobUrl) {
        assets.push(Model.createMediaAsset({
          sessionId,
          slotIndex: index,
          mediaType,
          sourceType,
          dataUrl,
          blobUrl,
          width,
          height,
          metadata: {
            originalIndex: index
          }
        }));
      }
    });

    return assets;
  };

  /**
   * Transforms selection indices/objects into SelectedCut objects.
   */
  const createSelectedCutsFromSelection = (selected, mediaAssets, options = {}) => {
    const Model = window.IMMMSessionModel;
    if (!Model) return [];

    const { sessionId = null } = options;

    if (!Array.isArray(selected) || !Array.isArray(mediaAssets)) return [];

    const cuts = [];
    selected.forEach((item, index) => {
      let asset = null;

      if (typeof item === 'number') {
        asset = mediaAssets[item];
      } else if (isPlainObject(item)) {
        if (item.assetId) {
          asset = mediaAssets.find(a => a.assetId === item.assetId);
        } else {
          const shotIdx = item.index !== undefined ? item.index : item.shotIndex;
          if (shotIdx !== undefined) {
            asset = mediaAssets[shotIdx];
          }
        }
      }

      if (asset) {
        cuts.push(Model.createSelectedCut({
          sessionId,
          assetId: asset.assetId,
          sourceShotIndex: asset.metadata ? asset.metadata.originalIndex : 0,
          targetSlotIndex: (isPlainObject(item) && item.targetSlotIndex !== undefined) ? item.targetSlotIndex : index
        }));
      }
    });

    return cuts;
  };

  /**
   * Maps application UI/deco state to RenderRecipe.
   */
  const createRenderRecipeFromAppState = (appState) => {
    const Model = window.IMMMSessionModel;
    if (!Model || !isPlainObject(appState)) return null;

    return Model.createRenderRecipe({
      layout: appState.layout || 'strip',
      frameTheme: appState.frameTheme || 'black',
      frameTemplateId: appState.frameTemplateId || 'strip_1x4',
      stickers: clonePlain(appState.stickers || []),
      drawings: clonePlain(appState.drawings || []),
      textLayers: clonePlain(appState.textLayers || []),
      logo: appState.logo !== undefined ? appState.logo : true,
      dateStamp: appState.dateStamp !== undefined ? appState.dateStamp : true,
      outputScale: appState.outputScale || 3.0
    });
  };

  /**
   * Maps application filter state to EditRecipe.
   */
  const createEditRecipeFromAppState = (appState) => {
    const Model = window.IMMMSessionModel;
    if (!Model || !isPlainObject(appState)) return null;

    return Model.createEditRecipe({
      filterId: appState.filterId || (appState.filter ? appState.filter.id : 'original'),
      intensity: appState.intensity !== undefined ? appState.intensity : 1.0,
      blur: appState.blur || 0,
      skin: appState.skin || 0,
      crop: clonePlain(appState.crop || null),
      adjustments: clonePlain(appState.adjustments || {}),
      version: 1
    });
  };

  /**
   * Main adapter entry point to create a CaptureSession snapshot.
   */
  const createSessionSnapshot = (input) => {
    const Model = window.IMMMSessionModel;
    if (!Model) {
      return { ok: false, errors: ['IMMMSessionModel not found'] };
    }

    const {
      mode = 'classic',
      ownerId = 'local_user',
      groupId = null,
      frameTemplateId = 'strip_1x4',
      layout = 'strip',
      shots = [],
      selected = [],
      appState = {},
      metadata = {}
    } = input || {};

    // 1. Create base session
    const session = Model.createCaptureSession({
      mode,
      ownerId,
      groupId,
      frameTemplateId,
      layout,
      metadata: clonePlain(metadata)
    });

    // 2. Map media assets
    const mediaAssets = createMediaAssetsFromShots(shots, { sessionId: session.sessionId });
    session.shots = mediaAssets;

    // 3. Map selected cuts
    session.selectedCuts = createSelectedCutsFromSelection(selected, mediaAssets, { sessionId: session.sessionId });

    // 4. Map recipes
    const renderRecipe = createRenderRecipeFromAppState(appState);
    if (renderRecipe) session.renderRecipe = renderRecipe;

    const editRecipe = createEditRecipeFromAppState(appState);
    if (editRecipe) session.editRecipe = editRecipe;

    // 5. Normalize and Validate
    const normalized = Model.normalizeCaptureSession(session);
    const validation = Model.validateCaptureSession(normalized);

    return {
      ok: validation.ok,
      session: normalized,
      errors: validation.errors
    };
  };

  /**
   * Defines a contract for a finalized result (image or video).
   * Enforces kind normalization, default mimeTypes, and dimension validation.
   */
  const createResultAssetContract = (params) => {
    const {
      sessionId = null,
      kind = 'image',
      objectUrl = null,
      blobId = null,
      remoteUrl = null,
      width = 0,
      height = 0,
      mimeType = null,
      createdAt = new Date().toISOString(),
      metadata = {}
    } = params || {};

    // Normalize kind to valid values
    const normalizedKind = RESULT_KINDS.includes(kind) ? kind : 'image';

    // Set default mimeType based on kind
    let finalMimeType = mimeType;
    if (!finalMimeType) {
      finalMimeType = normalizedKind === 'video' ? 'video/mp4' : 'image/png';
    }

    // Validate dimensions
    const finalWidth = (typeof width === 'number') ? width : 0;
    const finalHeight = (typeof height === 'number') ? height : 0;

    return Object.freeze({
      contractVersion: ADAPTER_VERSION,
      sessionId,
      kind: normalizedKind,
      objectUrl,
      blobId,
      remoteUrl,
      width: finalWidth,
      height: finalHeight,
      mimeType: finalMimeType,
      createdAt,
      metadata: clonePlain(metadata)
    });
  };

  // --- Validation ---

  /**
   * Validates a CaptureSession snapshot or wrapper.
   * Handles both { ok, session, errors } wrapper and raw session objects.
   */
  const validateSessionSnapshot = (snapshotOrSession) => {
    const Model = window.IMMMSessionModel;
    if (!Model) {
      return { ok: false, errors: ['Model missing'] };
    }

    const session = snapshotOrSession && snapshotOrSession.session
      ? snapshotOrSession.session
      : snapshotOrSession;

    return Model.validateCaptureSession(session);
  };

  // --- Self-Test ---

  const runSessionAdapterSelfTest = () => {
    const Model = window.IMMMSessionModel;
    if (!Model) {
      return { ok: false, errors: ['IMMMSessionModel dependency missing'] };
    }

    const errors = [];

    // Test 1: Basic snapshot with 3 shots + selected [0, 2]
    const sampleShots = [
      'data:image/png;base64,shot1',
      { dataUrl: 'data:image/png;base64,shot2', width: 100, height: 100 },
      { url: 'data:image/png;base64,shot3' }
    ];
    const sampleSelected = [0, 2];
    const sampleAppState = {
      layout: 'strip',
      frameTheme: 'white',
      stickers: [{ id: 's1', x: 10, y: 10 }],
      filterId: 'porcelain'
    };

    const originalShotsJson = JSON.stringify(sampleShots);
    const result = createSessionSnapshot({
      shots: sampleShots,
      selected: sampleSelected,
      appState: sampleAppState
    });

    // Test 1a: Basic result ok
    if (!result.ok) {
      errors.push('Test 1a FAIL: Basic snapshot failed: ' + JSON.stringify(result.errors));
    }

    // Test 1b: MediaAssets created
    if (result.session && result.session.shots.length !== 3) {
      errors.push(`Test 1b FAIL: Expected 3 shots, got ${result.session.shots.length}`);
    }

    // Test 2: Selected cuts length
    if (result.session && result.session.selectedCuts.length !== 2) {
      errors.push(`Test 2 FAIL: Expected 2 selected cuts, got ${result.session.selectedCuts.length}`);
    }

    // Test 3: Asset ID binding
    if (result.session) {
      const cut0 = result.session.selectedCuts[0];
      const asset0 = result.session.shots[0];
      if (cut0.assetId !== asset0.assetId) {
        errors.push('Test 3 FAIL: Asset ID binding mismatch');
      }
    }

    // Test 4: Empty selected array
    const resultEmpty = createSessionSnapshot({
      shots: sampleShots,
      selected: []
    });
    if (resultEmpty.session && resultEmpty.session.selectedCuts.length !== 0) {
      errors.push(`Test 4 FAIL: Empty selected should have 0 cuts, got ${resultEmpty.session.selectedCuts.length}`);
    }

    // Test 5: Invalid selected index is skipped
    const resultBadIndex = createSessionSnapshot({
      shots: sampleShots,
      selected: [0, 99, 1]
    });
    if (resultBadIndex.session && resultBadIndex.session.selectedCuts.length !== 2) {
      errors.push(`Test 5 FAIL: Invalid index not skipped, expected 2 cuts, got ${resultBadIndex.session.selectedCuts.length}`);
    }

    // Test 6: Unsupported shot input is skipped
    const mixedShots = [
      'data:image/png;base64,valid1',
      null,
      undefined,
      123,
      true,
      { dataUrl: 'data:image/png;base64,valid2' }
    ];
    const resultMixed = createSessionSnapshot({
      shots: mixedShots
    });
    if (resultMixed.session && resultMixed.session.shots.length !== 2) {
      errors.push(`Test 6 FAIL: Unsupported inputs not skipped, expected 2 shots, got ${resultMixed.session.shots.length}`);
    }

    // Test 7: validateSessionSnapshot accepts wrapper
    const validateWrapperResult = validateSessionSnapshot(result);
    if (!validateWrapperResult.ok) {
      errors.push('Test 7 FAIL: validateSessionSnapshot failed on wrapper: ' + JSON.stringify(validateWrapperResult.errors));
    }

    // Test 8: validateSessionSnapshot accepts raw session
    const validateRawResult = validateSessionSnapshot(result.session);
    if (!validateRawResult.ok) {
      errors.push('Test 8 FAIL: validateSessionSnapshot failed on raw session: ' + JSON.stringify(validateRawResult.errors));
    }

    // Test 9: Result asset video default mimeType
    const videoAsset = createResultAssetContract({ kind: 'video' });
    if (videoAsset.mimeType !== 'video/mp4') {
      errors.push(`Test 9 FAIL: Video mimeType should be 'video/mp4', got '${videoAsset.mimeType}'`);
    }

    // Test 10: Result asset invalid kind normalizes to image
    const invalidAsset = createResultAssetContract({ kind: 'invalid-kind' });
    if (invalidAsset.kind !== 'image') {
      errors.push(`Test 10 FAIL: Invalid kind should normalize to 'image', got '${invalidAsset.kind}'`);
    }

    // Test 11: No input mutation
    if (JSON.stringify(sampleShots) !== originalShotsJson) {
      errors.push('Test 11 FAIL: Input shots object was mutated');
    }

    return {
      ok: errors.length === 0,
      errors,
      sample: result.session ? {
        sessionId: result.session.sessionId,
        shotCount: result.session.shots.length,
        selectedCount: result.session.selectedCuts.length
      } : null
    };
  };

  // --- Export Namespace ---

  window.IMMMSessionAdapter = Object.freeze({
    ADAPTER_VERSION,
    RESULT_KINDS,
    createSessionSnapshot,
    createMediaAssetsFromShots,
    createSelectedCutsFromSelection,
    createRenderRecipeFromAppState,
    createEditRecipeFromAppState,
    createResultAssetContract,
    validateSessionSnapshot,
    runSessionAdapterSelfTest
  });

})();
