/**
 * IMMM PWA / Release Contract (Foundation)
 *
 * Defines PWA release requirements at data level.
 * No icon generation, no manifest creation.
 */

(function () {
  var PWA_CONTRACT_VERSION = '1.0.0';
  var REQUIRED_ICON_SIZES = Object.freeze([192, 512]);
  var REQUIRED_CACHE_ASSETS = Object.freeze(['./dist/session-model.js', './dist/session-adapter.js', './dist/result-asset-store.js', './dist/session-runtime-snapshot.js', './dist/share-contract.js', './dist/motion-export-contract.js', './dist/edit-recipe-contract.js', './dist/pwa-release-contract.js', './dist/frame-system.js', './dist/screens-v2.js', './dist/screens-v2-rest.js', './dist/screens-v2-deco.js', './dist/main.js']);
  var isPlainObject = value => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  };

  /**
   * Creates a PWA readiness report.
   */
  var createPwaReadinessReport = params => {
    var {
      iconSizes = [],
      cacheAssets = [],
      hasMaskableIcon = false,
      hasAppleTouchIcon = false,
      distFiles = []
    } = params || {};
    var issues = [];

    // Check icon sizes
    REQUIRED_ICON_SIZES.forEach(size => {
      if (!iconSizes.includes(size)) {
        issues.push(`Missing icon size: ${size}px`);
      }
    });

    // Check maskable icon
    if (!hasMaskableIcon) {
      issues.push('Missing maskable icon');
    }

    // Check apple touch icon
    if (!hasAppleTouchIcon) {
      issues.push('Missing apple-touch-icon');
    }

    // Check cache assets
    REQUIRED_CACHE_ASSETS.forEach(asset => {
      if (!cacheAssets.includes(asset)) {
        issues.push(`Missing cache asset: ${asset}`);
      }
    });
    return {
      reportVersion: PWA_CONTRACT_VERSION,
      timestamp: new Date().toISOString(),
      isReady: issues.length === 0,
      iconSizes: Array.isArray(iconSizes) ? iconSizes : [],
      cacheAssets: Array.isArray(cacheAssets) ? cacheAssets : [],
      issues
    };
  };

  /**
   * Validates manifest contract.
   */
  var validateManifestContract = manifest => {
    var errors = [];
    if (!isPlainObject(manifest)) {
      errors.push('Manifest is not a plain object');
      return {
        ok: false,
        errors
      };
    }
    if (typeof manifest.name !== 'string') {
      errors.push('Manifest missing name');
    }
    if (typeof manifest.short_name !== 'string') {
      errors.push('Manifest missing short_name');
    }
    if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
      errors.push('Manifest missing icons array');
    } else {
      var sizes = manifest.icons.map(icon => icon.sizes);
      if (!sizes.includes('192x192')) {
        errors.push('Manifest missing 192x192 icon');
      }
      if (!sizes.includes('512x512')) {
        errors.push('Manifest missing 512x512 icon');
      }
      var hasMaskable = manifest.icons.some(icon => icon.purpose === 'maskable');
      if (!hasMaskable) {
        errors.push('Manifest missing maskable icon');
      }
    }
    if (typeof manifest.start_url !== 'string') {
      errors.push('Manifest missing start_url');
    }
    if (typeof manifest.display !== 'string') {
      errors.push('Manifest missing display');
    }
    return {
      ok: errors.length === 0,
      errors
    };
  };

  /**
   * Validates service worker contract.
   */
  var validateServiceWorkerContract = swContent => {
    var errors = [];
    if (typeof swContent !== 'string') {
      errors.push('SW content is not a string');
      return {
        ok: false,
        errors
      };
    }
    if (!swContent.includes('CACHE_NAME')) {
      errors.push('SW missing CACHE_NAME');
    }
    if (!swContent.includes('skipWaiting')) {
      errors.push('SW missing skipWaiting');
    }
    if (!swContent.includes('clients.claim')) {
      errors.push('SW missing clients.claim');
    }
    if (!swContent.includes('respondWith')) {
      errors.push('SW missing respondWith');
    }

    // Check that Babel is not included
    if (swContent.includes('@babel/standalone') || swContent.includes('type="text/babel"')) {
      errors.push('SW should not include Babel standalone');
    }
    return {
      ok: errors.length === 0,
      errors
    };
  };

  /**
   * Self-test for PWA release contract.
   */
  var runPwaReleaseContractSelfTest = () => {
    var errors = [];

    // Test 1: Readiness report with missing icons
    var emptyReport = createPwaReadinessReport({
      iconSizes: [],
      cacheAssets: [],
      hasMaskableIcon: false,
      hasAppleTouchIcon: false
    });
    if (emptyReport.isReady !== false) {
      errors.push('Test 1 FAIL: Empty report should not be ready');
    }
    if (emptyReport.issues.length === 0) {
      errors.push('Test 1 FAIL: Empty report should have issues');
    }

    // Test 2: Readiness report with all icons
    var fullReport = createPwaReadinessReport({
      iconSizes: [192, 512],
      cacheAssets: REQUIRED_CACHE_ASSETS,
      hasMaskableIcon: true,
      hasAppleTouchIcon: true
    });
    if (!fullReport.isReady) {
      errors.push(`Test 2 FAIL: Full report should be ready. Issues: ${fullReport.issues.join('; ')}`);
    }

    // Test 3: Valid manifest
    var validManifest = {
      name: 'IMMM',
      short_name: 'IMMM',
      icons: [{
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png'
      }, {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png'
      }, {
        src: '/icon-maskable.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      }],
      start_url: '/',
      display: 'standalone'
    };
    var manifestValidation = validateManifestContract(validManifest);
    if (!manifestValidation.ok) {
      errors.push(`Test 3 FAIL: Valid manifest should pass: ${manifestValidation.errors.join('; ')}`);
    }

    // Test 4: Invalid manifest missing icon
    var invalidManifest = {
      name: 'IMMM',
      short_name: 'IMMM',
      icons: [{
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png'
      }],
      start_url: '/',
      display: 'standalone'
    };
    var invalidValidation = validateManifestContract(invalidManifest);
    if (invalidValidation.ok) {
      errors.push('Test 4 FAIL: Invalid manifest should fail');
    }

    // Test 5: Valid SW content
    var validSw = `
const CACHE_NAME = 'immm-cache-v13';
self.addEventListener('install', () => {
  self.skipWaiting();
});
self.addEventListener('activate', () => {
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request));
});
    `;
    var swValidation = validateServiceWorkerContract(validSw);
    if (!swValidation.ok) {
      errors.push(`Test 5 FAIL: Valid SW should pass: ${swValidation.errors.join('; ')}`);
    }

    // Test 6: SW with Babel should fail
    var babelSw = `
const CACHE_NAME = 'immm-cache';
<script src="@babel/standalone"></script>
    `;
    var babelValidation = validateServiceWorkerContract(babelSw);
    if (babelValidation.ok) {
      errors.push('Test 6 FAIL: SW with Babel should fail validation');
    }
    return {
      ok: errors.length === 0,
      errors
    };
  };

  // --- Export Namespace ---

  window.IMPWAReleaseContract = Object.freeze({
    PWA_CONTRACT_VERSION,
    REQUIRED_ICON_SIZES,
    REQUIRED_CACHE_ASSETS,
    createPwaReadinessReport,
    validateManifestContract,
    validateServiceWorkerContract,
    runPwaReleaseContractSelfTest
  });
})();