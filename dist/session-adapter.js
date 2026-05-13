/**
 * IMMM CaptureSession Adapter (Foundation)
 * 
 * Provides pure functions to transform existing application state into CaptureSession snapshots.
 * Note: This is a read-only adapter and does not modify the original application state.
 */

(function () {
  var ADAPTER_VERSION = '1.0.0';

  // --- Helpers ---

  var clonePlain = value => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    return JSON.parse(JSON.stringify(value));
  };
  var isPlainObject = value => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  };

  // --- Mapping Functions ---

  /**
   * Transforms raw shots into MediaAsset objects.
   * shots can be array of: strings (dataUrl), objects with dataUrl/blobUrl/url/src.
   */
  var createMediaAssetsFromShots = (shots, options = {}) => {
    var Model = window.IMMMSessionModel;
    if (!Model) return [];
    var {
      sessionId = null,
      sourceType = 'camera',
      mediaType = 'photo'
    } = options;
    if (!Array.isArray(shots)) return [];
    return shots.map((shot, index) => {
      var dataUrl = null;
      var blobUrl = null;
      var width = 0;
      var height = 0;
      if (typeof shot === 'string') {
        dataUrl = shot;
      } else if (isPlainObject(shot)) {
        dataUrl = shot.dataUrl || shot.url || shot.src || null;
        blobUrl = shot.blobUrl || null;
        width = shot.width || 0;
        height = shot.height || 0;
      }
      return Model.createMediaAsset({
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
      });
    });
  };

  /**
   * Transforms selection indices/objects into SelectedCut objects.
   */
  var createSelectedCutsFromSelection = (selected, mediaAssets, options = {}) => {
    var Model = window.IMMMSessionModel;
    if (!Model) return [];
    var {
      sessionId = null
    } = options;
    if (!Array.isArray(selected) || !Array.isArray(mediaAssets)) return [];
    var cuts = [];
    selected.forEach((item, index) => {
      var asset = null;
      if (typeof item === 'number') {
        asset = mediaAssets[item];
      } else if (isPlainObject(item)) {
        if (item.assetId) {
          asset = mediaAssets.find(a => a.assetId === item.assetId);
        } else {
          var shotIdx = item.index !== undefined ? item.index : item.shotIndex;
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
          targetSlotIndex: isPlainObject(item) && item.targetSlotIndex !== undefined ? item.targetSlotIndex : index
        }));
      }
    });
    return cuts;
  };

  /**
   * Maps application UI/deco state to RenderRecipe.
   */
  var createRenderRecipeFromAppState = appState => {
    var Model = window.IMMMSessionModel;
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
  var createEditRecipeFromAppState = appState => {
    var Model = window.IMMMSessionModel;
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
  var createSessionSnapshot = input => {
    var Model = window.IMMMSessionModel;
    if (!Model) {
      return {
        ok: false,
        errors: ['IMMMSessionModel not found']
      };
    }
    var {
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
    var session = Model.createCaptureSession({
      mode,
      ownerId,
      groupId,
      frameTemplateId,
      layout,
      metadata: clonePlain(metadata)
    });

    // 2. Map media assets
    var mediaAssets = createMediaAssetsFromShots(shots, {
      sessionId: session.sessionId
    });
    session.shots = mediaAssets;

    // 3. Map selected cuts
    session.selectedCuts = createSelectedCutsFromSelection(selected, mediaAssets, {
      sessionId: session.sessionId
    });

    // 4. Map recipes
    var renderRecipe = createRenderRecipeFromAppState(appState);
    if (renderRecipe) session.renderRecipe = renderRecipe;
    var editRecipe = createEditRecipeFromAppState(appState);
    if (editRecipe) session.editRecipe = editRecipe;

    // 5. Normalize and Validate
    var normalized = Model.normalizeCaptureSession(session);
    var validation = Model.validateCaptureSession(normalized);
    return {
      ok: validation.ok,
      session: normalized,
      errors: validation.errors
    };
  };

  /**
   * Defines a contract for a finalized result (image or video).
   */
  var createResultAssetContract = params => {
    var {
      sessionId = null,
      kind = 'image',
      // image | video
      objectUrl = null,
      blobId = null,
      remoteUrl = null,
      width = 0,
      height = 0,
      mimeType = 'image/png',
      createdAt = new Date().toISOString(),
      metadata = {}
    } = params || {};
    return Object.freeze({
      contractVersion: ADAPTER_VERSION,
      sessionId,
      kind,
      objectUrl,
      blobId,
      remoteUrl,
      width,
      height,
      mimeType,
      createdAt,
      metadata: clonePlain(metadata)
    });
  };

  // --- Self-Test ---

  var runSessionAdapterSelfTest = () => {
    var Model = window.IMMMSessionModel;
    if (!Model) {
      return {
        ok: false,
        errors: ['IMMMSessionModel dependency missing']
      };
    }
    var errors = [];

    // 1. Sample shots
    var sampleShots = ['data:image/png;base64,shot1', {
      dataUrl: 'data:image/png;base64,shot2',
      width: 100,
      height: 100
    }, {
      url: 'data:image/png;base64,shot3'
    }];

    // 2. Sample selection
    var sampleSelected = [0, 2];

    // 3. App state
    var sampleAppState = {
      layout: 'strip',
      frameTheme: 'white',
      stickers: [{
        id: 's1',
        x: 10,
        y: 10
      }],
      filterId: 'porcelain'
    };

    // 4. Transform
    var originalShotsJson = JSON.stringify(sampleShots);
    var result = createSessionSnapshot({
      shots: sampleShots,
      selected: sampleSelected,
      appState: sampleAppState
    });
    if (!result.ok) errors.push(...result.errors);
    if (result.session) {
      if (result.session.shots.length !== 3) errors.push('Media assets length mismatch');
      if (result.session.selectedCuts.length !== 2) errors.push('Selected cuts length mismatch');
      var cut0 = result.session.selectedCuts[0];
      var asset0 = result.session.shots[0];
      if (cut0.assetId !== asset0.assetId) errors.push('Asset ID binding mismatch');

      // Check for invalid index handling
      var resultWithBadIndex = createSessionSnapshot({
        shots: sampleShots,
        selected: [0, 99, 1] // 99 should be skipped
      });
      if (resultWithBadIndex.session.selectedCuts.length !== 2) errors.push('Invalid index not skipped correctly');
    }

    // 5. Mutate check
    if (JSON.stringify(sampleShots) !== originalShotsJson) {
      errors.push('Input shots object was mutated');
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
    createSessionSnapshot,
    createMediaAssetsFromShots,
    createSelectedCutsFromSelection,
    createRenderRecipeFromAppState,
    createEditRecipeFromAppState,
    createResultAssetContract,
    validateSessionSnapshot: s => window.IMMMSessionModel ? window.IMMMSessionModel.validateCaptureSession(s) : {
      ok: false,
      errors: ['Model missing']
    },
    runSessionAdapterSelfTest
  });
})();