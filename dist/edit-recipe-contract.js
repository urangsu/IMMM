/**
 * IMMM EditRecipe / Blur Contract (Foundation)
 *
 * Defines editing specifications without implementing rendering.
 * No canvas manipulation, no WebGL, no actual image processing.
 */

(function () {
  var EDIT_CONTRACT_VERSION = '1.0.0';
  var EDIT_TYPES = Object.freeze(['blur', 'filter', 'crop', 'adjustment']);
  var BLUR_TYPES = Object.freeze(['background', 'face-safe', 'full-frame']);
  var isPlainObject = value => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  };

  /**
   * Creates a blur editing recipe (specification only).
   */
  var createBlurRecipe = params => {
    var {
      blurType = 'background',
      strength = 0.5,
      radius = 10,
      metadata = {}
    } = params || {};
    var finalBlurType = BLUR_TYPES.includes(blurType) ? blurType : 'background';
    var finalStrength = Math.min(1.0, Math.max(0, strength));
    var finalRadius = Math.max(1, radius);
    return Object.freeze({
      editType: 'blur',
      blurType: finalBlurType,
      strength: finalStrength,
      radius: finalRadius,
      metadata: isPlainObject(metadata) ? Object.freeze({
        ...metadata
      }) : Object.freeze({})
    });
  };

  /**
   * Creates a filter editing recipe.
   */
  var createFilterRecipe = params => {
    var {
      filterId = 'original',
      intensity = 1.0,
      metadata = {}
    } = params || {};
    var finalIntensity = Math.min(1.0, Math.max(0, intensity));
    return Object.freeze({
      editType: 'filter',
      filterId,
      intensity: finalIntensity,
      metadata: isPlainObject(metadata) ? Object.freeze({
        ...metadata
      }) : Object.freeze({})
    });
  };

  /**
   * Creates a crop editing recipe.
   */
  var createCropRecipe = params => {
    var {
      x = 0,
      y = 0,
      width = 100,
      height = 100,
      metadata = {}
    } = params || {};
    return Object.freeze({
      editType: 'crop',
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: Math.max(1, width),
      height: Math.max(1, height),
      metadata: isPlainObject(metadata) ? Object.freeze({
        ...metadata
      }) : Object.freeze({})
    });
  };

  /**
   * Creates a composite edit recipe combining multiple edits.
   */
  var createCompositeEditRecipe = params => {
    var {
      edits = [],
      metadata = {}
    } = params || {};
    var finalEdits = Array.isArray(edits) ? edits : [];
    return Object.freeze({
      editType: 'composite',
      edits: Object.freeze([...finalEdits]),
      metadata: isPlainObject(metadata) ? Object.freeze({
        ...metadata
      }) : Object.freeze({})
    });
  };

  /**
   * Validates an edit recipe.
   */
  var validateEditRecipe = recipe => {
    var errors = [];
    if (!isPlainObject(recipe)) {
      errors.push('Recipe is not a plain object');
      return {
        ok: false,
        errors
      };
    }
    if (!recipe.editType || !EDIT_TYPES.includes(recipe.editType)) {
      errors.push(`Invalid editType: ${recipe.editType}`);
    }

    // Type-specific validation
    if (recipe.editType === 'blur') {
      if (!BLUR_TYPES.includes(recipe.blurType)) {
        errors.push(`Invalid blurType: ${recipe.blurType}`);
      }
      if (typeof recipe.strength !== 'number' || recipe.strength < 0 || recipe.strength > 1) {
        errors.push('strength must be between 0 and 1');
      }
    }
    if (recipe.editType === 'crop') {
      if (typeof recipe.width !== 'number' || recipe.width <= 0) {
        errors.push('width must be positive');
      }
      if (typeof recipe.height !== 'number' || recipe.height <= 0) {
        errors.push('height must be positive');
      }
    }
    if (recipe.editType === 'filter') {
      if (typeof recipe.filterId !== 'string') {
        errors.push('filterId must be a string');
      }
    }
    return {
      ok: errors.length === 0,
      errors
    };
  };

  /**
   * Self-test for edit recipe contract.
   */
  var runEditRecipeContractSelfTest = () => {
    var errors = [];

    // Test 1: Blur recipe creation
    var blurRecipe = createBlurRecipe({
      blurType: 'background',
      strength: 0.7
    });
    if (!blurRecipe || blurRecipe.editType !== 'blur') {
      errors.push('Test 1 FAIL: Blur recipe not created');
    }

    // Test 2: Blur recipe validation
    var blurValidation = validateEditRecipe(blurRecipe);
    if (!blurValidation.ok) {
      errors.push(`Test 2 FAIL: Valid blur recipe failed validation: ${blurValidation.errors.join('; ')}`);
    }

    // Test 3: Invalid blur type normalized
    var invalidBlurRecipe = createBlurRecipe({
      blurType: 'invalid-type'
    });
    if (invalidBlurRecipe.blurType !== 'background') {
      errors.push(`Test 3 FAIL: Invalid blur type should normalize to background`);
    }

    // Test 4: Filter recipe
    var filterRecipe = createFilterRecipe({
      filterId: 'porcelain',
      intensity: 0.8
    });
    var filterValidation = validateEditRecipe(filterRecipe);
    if (!filterValidation.ok) {
      errors.push('Test 4 FAIL: Valid filter recipe failed validation');
    }

    // Test 5: Crop recipe
    var cropRecipe = createCropRecipe({
      x: 10,
      y: 20,
      width: 300,
      height: 400
    });
    var cropValidation = validateEditRecipe(cropRecipe);
    if (!cropValidation.ok) {
      errors.push('Test 5 FAIL: Valid crop recipe failed validation');
    }

    // Test 6: Composite recipe
    var compositeRecipe = createCompositeEditRecipe({
      edits: [blurRecipe, filterRecipe]
    });
    if (!compositeRecipe || compositeRecipe.edits.length !== 2) {
      errors.push('Test 6 FAIL: Composite recipe not created correctly');
    }

    // Test 7: Strength clamping
    var strongBlur = createBlurRecipe({
      strength: 5.0
    });
    if (strongBlur.strength !== 1.0) {
      errors.push('Test 7 FAIL: Strength should be clamped to 1.0');
    }

    // Test 8: Recipe immutability
    var mutationFailed = false;
    try {
      blurRecipe.strength = 0.1;
      mutationFailed = true;
    } catch (e) {
      // Expected
    }
    if (!mutationFailed && typeof Object.isFrozen === 'function' && !Object.isFrozen(blurRecipe)) {
      errors.push('Test 8 FAIL: Recipe should be immutable');
    }
    return {
      ok: errors.length === 0,
      errors
    };
  };

  // --- Export Namespace ---

  window.IMMMEditRecipeContract = Object.freeze({
    EDIT_CONTRACT_VERSION,
    EDIT_TYPES,
    BLUR_TYPES,
    createBlurRecipe,
    createFilterRecipe,
    createCropRecipe,
    createCompositeEditRecipe,
    validateEditRecipe,
    runEditRecipeContractSelfTest
  });
})();