/**
 * IMMM MotionExport / Save Video Contract (Foundation)
 *
 * Defines motion export specifications without implementing rendering.
 * Save Video remains disabled.
 */

(function () {
  var MOTION_CONTRACT_VERSION = '1.0.0';
  var VIDEO_EXPORT_FAILURE_REASONS = Object.freeze({
    UNSUPPORTED_MEDIARECORDER: 'unsupported-mediarecorder',
    UNSUPPORTED_CANVAS_STREAM: 'unsupported-canvas-stream',
    UNSUPPORTED_MIME: 'unsupported-mime',
    RECORDER_START_FAILED: 'recorder-start-failed',
    RECORDER_TIMEOUT: 'recorder-timeout',
    RECORDER_EMPTY_BLOB: 'recorder-empty-blob',
    RENDER_FAILED: 'render-failed'
  });
  var MOTION_OUTPUT_TYPES = Object.freeze(['webm', 'mp4', 'gif', 'preview-only']);
  var MOTION_SLOT_TYPES = Object.freeze(['still', 'transition', 'motion']);
  var isPlainObject = value => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  };

  /**
   * Creates a motion export recipe (specification only, no rendering).
   */
  var createMotionExportRecipe = params => {
    var {
      outputType = 'preview-only',
      layout = 'strip',
      durationMs = 3000,
      fps = 24,
      slots = [],
      frameTemplateId = 'strip_1x4',
      renderRecipe = null,
      audioPolicy = 'silent',
      metadata = {}
    } = params || {};

    // Validate outputType
    var finalOutputType = MOTION_OUTPUT_TYPES.includes(outputType) ? outputType : 'preview-only';

    // Validate fps
    var finalFps = typeof fps === 'number' && fps > 0 ? fps : 24;

    // Validate durationMs
    var finalDurationMs = typeof durationMs === 'number' && durationMs > 0 ? durationMs : 3000;

    // Validate slots array
    var finalSlots = Array.isArray(slots) ? slots : [];
    return Object.freeze({
      contractVersion: MOTION_CONTRACT_VERSION,
      outputType: finalOutputType,
      layout,
      durationMs: finalDurationMs,
      fps: finalFps,
      slots: finalSlots,
      frameTemplateId,
      renderRecipe: renderRecipe ? Object.freeze({
        ...renderRecipe
      }) : null,
      audioPolicy,
      metadata: typeof metadata === 'object' && metadata !== null ? Object.freeze({
        ...metadata
      }) : Object.freeze({})
    });
  };

  /**
   * Creates a motion slot provider interface.
   * Describes how frames are provided for a motion slot.
   */
  var createMotionSlotProvider = params => {
    var {
      slotIndex = 0,
      sourceAssetId = null,
      type = 'still',
      startFrame = 0,
      endFrame = 0,
      metadata = {}
    } = params || {};
    return Object.freeze({
      slotIndex,
      sourceAssetId,
      type: MOTION_SLOT_TYPES.includes(type) ? type : 'still',
      startFrame: Math.max(0, startFrame),
      endFrame: Math.max(0, endFrame),
      metadata: typeof metadata === 'object' ? Object.freeze({
        ...metadata
      }) : Object.freeze({})
    });
  };

  /**
   * Validates a motion export recipe.
   */
  var validateMotionExportRecipe = recipe => {
    var errors = [];
    if (!isPlainObject(recipe)) {
      errors.push('Recipe is not a plain object');
      return {
        ok: false,
        errors
      };
    }
    if (!MOTION_OUTPUT_TYPES.includes(recipe.outputType)) {
      errors.push(`Invalid outputType: ${recipe.outputType}`);
    }
    if (typeof recipe.durationMs !== 'number' || recipe.durationMs <= 0) {
      errors.push('durationMs must be a positive number');
    }
    if (typeof recipe.fps !== 'number' || recipe.fps <= 0) {
      errors.push('fps must be a positive number');
    }
    if (!Array.isArray(recipe.slots)) {
      errors.push('slots must be an array');
    } else if (recipe.slots.length === 0 && recipe.outputType !== 'preview-only') {
      errors.push('Non-preview recipes must have at least one slot');
    }
    return {
      ok: errors.length === 0,
      errors
    };
  };

  /**
   * Creates a motion readiness report.
   */
  var createMotionReadinessReport = params => {
    var recipe = createMotionExportRecipe(params);
    var validation = validateMotionExportRecipe(recipe);
    return {
      reportVersion: MOTION_CONTRACT_VERSION,
      timestamp: new Date().toISOString(),
      isValid: validation.ok,
      outputType: recipe.outputType,
      estimatedFileSizeBytes: recipe.durationMs * recipe.fps * 50000,
      // rough estimate
      renderPath: 'renderMotionComposition',
      // future function
      issues: validation.errors
    };
  };

  /**
   * Self-test for motion export contract.
   */
  var runMotionExportContractSelfTest = () => {
    var errors = [];

    // Test 1: Valid preview-only recipe
    var previewRecipe = createMotionExportRecipe({
      outputType: 'preview-only',
      durationMs: 2000,
      fps: 24
    });
    var previewValidation = validateMotionExportRecipe(previewRecipe);
    if (!previewValidation.ok) {
      errors.push('Test 1 FAIL: preview-only recipe should be valid');
    }

    // Test 2: Invalid outputType normalized
    var invalidTypeRecipe = createMotionExportRecipe({
      outputType: 'invalid-type'
    });
    if (invalidTypeRecipe.outputType !== 'preview-only') {
      errors.push(`Test 2 FAIL: Invalid type should normalize to preview-only, got ${invalidTypeRecipe.outputType}`);
    }

    // Test 3: Empty slots on non-preview rejected
    var emptySlotRecipe = createMotionExportRecipe({
      outputType: 'mp4',
      slots: []
    });
    var emptyValidation = validateMotionExportRecipe(emptySlotRecipe);
    if (emptyValidation.ok) {
      errors.push('Test 3 FAIL: Empty slots on mp4 recipe should be rejected');
    }

    // Test 4: Valid video recipe with slots
    var videoRecipe = createMotionExportRecipe({
      outputType: 'mp4',
      durationMs: 3000,
      fps: 30,
      slots: [{
        slotIndex: 0,
        sourceAssetId: 'asset-1'
      }, {
        slotIndex: 1,
        sourceAssetId: 'asset-2'
      }]
    });
    var videoValidation = validateMotionExportRecipe(videoRecipe);
    if (!videoValidation.ok) {
      errors.push('Test 4 FAIL: Valid video recipe should pass validation');
    }

    // Test 5: Slot provider creation
    var slot = createMotionSlotProvider({
      slotIndex: 0,
      sourceAssetId: 'asset-1',
      type: 'still'
    });
    if (!slot || slot.slotIndex !== 0) {
      errors.push('Test 5 FAIL: Slot provider not created correctly');
    }

    // Test 6: Invalid type normalizes to 'still'
    var invalidSlot = createMotionSlotProvider({
      slotIndex: 0,
      type: 'invalid-type'
    });
    if (invalidSlot.type !== 'still') {
      errors.push(`Test 6 FAIL: Invalid slot type should normalize to 'still', got ${invalidSlot.type}`);
    }

    // Test 7: Readiness report
    var report = createMotionReadinessReport({
      outputType: 'mp4',
      durationMs: 2000,
      fps: 24
    });
    if (!report || report.outputType !== 'mp4') {
      errors.push('Test 7 FAIL: Readiness report not created correctly');
    }

    // Test 8: recipe is immutable
    var immutableRecipe = createMotionExportRecipe({
      slots: [{
        slotIndex: 0
      }]
    });
    var frozenError = false;
    try {
      immutableRecipe.outputType = 'mp4';
      frozenError = true;
    } catch (e) {
      // Expected - frozen object
    }
    if (!frozenError && typeof Object.isFrozen === 'function' && !Object.isFrozen(immutableRecipe)) {
      errors.push('Test 8 FAIL: Recipe should be immutable');
    }
    return {
      ok: errors.length === 0,
      errors
    };
  };

  // --- Export Namespace ---

  window.IMMMMotionExportContract = Object.freeze({
    MOTION_CONTRACT_VERSION,
    MOTION_OUTPUT_TYPES,
    MOTION_SLOT_TYPES,
    VIDEO_EXPORT_FAILURE_REASONS,
    createMotionExportRecipe,
    createMotionSlotProvider,
    validateMotionExportRecipe,
    createMotionReadinessReport,
    runMotionExportContractSelfTest
  });
})();