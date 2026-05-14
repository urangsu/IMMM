/**
 * IMMM Result Asset Store (Foundation)
 *
 * Pure in-memory data transformation for result asset lifecycle.
 * No DOM, localStorage, IndexedDB, or side effects.
 * No blob storage or URL revocation - that's the runtime owner's responsibility.
 */

(function () {
  var STORE_VERSION = '1.0.0';
  var ASSET_KINDS = Object.freeze(['image', 'video']);
  var ASSET_STATUSES = Object.freeze(['local-ready', 'cloud-pending', 'cloud-ready', 'revoked', 'expired', 'failed']);

  // --- Helpers ---

  var clonePlain = value => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    return JSON.parse(JSON.stringify(value));
  };
  var isPlainObject = value => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  };
  var generateId = () => {
    // Simple UUID-like ID for testing/demo
    return `asset-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  };

  // --- Record Creation ---

  /**
   * Creates a single ResultAssetRecord.
   * Normalizes kind and status, sets defaults for dimensions/mimeType.
   */
  var createResultAssetRecord = params => {
    var {
      assetRecordId = generateId(),
      sessionId = null,
      kind = 'image',
      status = 'local-ready',
      objectUrl = null,
      blobId = null,
      remoteUrl = null,
      qrUrl = null,
      width = 0,
      height = 0,
      mimeType = null,
      sizeBytes = 0,
      createdAt = new Date().toISOString(),
      updatedAt = new Date().toISOString(),
      expiresAt = null,
      error = null,
      metadata = {}
    } = params || {};

    // Normalize kind
    var normalizedKind = ASSET_KINDS.includes(kind) ? kind : 'image';

    // Normalize status
    var normalizedStatus = ASSET_STATUSES.includes(status) ? status : 'local-ready';

    // Default mimeType based on kind
    var finalMimeType = mimeType;
    if (!finalMimeType) {
      finalMimeType = normalizedKind === 'video' ? 'video/mp4' : 'image/png';
    }

    // Validate dimensions
    var finalWidth = typeof width === 'number' ? width : 0;
    var finalHeight = typeof height === 'number' ? height : 0;
    var finalSizeBytes = typeof sizeBytes === 'number' ? sizeBytes : 0;
    return Object.freeze({
      assetRecordId,
      sessionId,
      kind: normalizedKind,
      status: normalizedStatus,
      objectUrl,
      blobId,
      remoteUrl,
      qrUrl,
      width: finalWidth,
      height: finalHeight,
      mimeType: finalMimeType,
      sizeBytes: finalSizeBytes,
      createdAt,
      updatedAt,
      expiresAt,
      error,
      metadata: clonePlain(metadata)
    });
  };

  /**
   * Creates an empty ResultAssetStoreState.
   */
  var createResultAssetStoreState = params => {
    var {
      storeVersion = STORE_VERSION,
      records = [],
      updatedAt = new Date().toISOString()
    } = params || {};
    return Object.freeze({
      storeVersion,
      records: Array.isArray(records) ? records : [],
      updatedAt
    });
  };

  // --- State Operations (Immutable) ---

  /**
   * Adds a ResultAssetRecord to the store state.
   * Returns a new state, does not mutate original.
   */
  var addResultAssetRecord = (state, record) => {
    if (!state || !record) return state;
    return Object.freeze({
      ...state,
      records: [...state.records, record],
      updatedAt: new Date().toISOString()
    });
  };

  /**
   * Updates a ResultAssetRecord by assetRecordId with a patch.
   * Returns a new state, does not mutate original.
   */
  var updateResultAssetRecord = (state, assetRecordId, patch) => {
    if (!state || !assetRecordId || !patch) return state;
    var updated = state.records.map(record => {
      if (record.assetRecordId === assetRecordId) {
        return Object.freeze({
          ...record,
          ...patch,
          updatedAt: new Date().toISOString()
        });
      }
      return record;
    });
    return Object.freeze({
      ...state,
      records: updated,
      updatedAt: new Date().toISOString()
    });
  };

  /**
   * Marks a ResultAssetRecord as revoked.
   */
  var markResultAssetRevoked = (state, assetRecordId) => {
    return updateResultAssetRecord(state, assetRecordId, {
      status: 'revoked'
    });
  };

  /**
   * Marks a ResultAssetRecord as expired.
   */
  var markResultAssetExpired = (state, assetRecordId) => {
    return updateResultAssetRecord(state, assetRecordId, {
      status: 'expired'
    });
  };

  /**
   * Gets a ResultAssetRecord by ID.
   */
  var getResultAssetById = (state, assetRecordId) => {
    if (!state || !Array.isArray(state.records)) return null;
    return state.records.find(r => r.assetRecordId === assetRecordId) || null;
  };

  /**
   * Lists all ResultAssetRecords for a given sessionId.
   */
  var listResultAssetsBySession = (state, sessionId) => {
    if (!state || !Array.isArray(state.records)) return [];
    return state.records.filter(r => r.sessionId === sessionId);
  };

  // --- Validation ---

  /**
   * Validates a ResultAssetRecord.
   */
  var validateResultAssetRecord = record => {
    var errors = [];
    if (!isPlainObject(record)) {
      errors.push('Record is not a plain object');
      return {
        ok: false,
        errors
      };
    }
    if (typeof record.assetRecordId !== 'string') {
      errors.push('assetRecordId is not a string');
    }
    if (!ASSET_KINDS.includes(record.kind)) {
      errors.push(`kind '${record.kind}' is not in ASSET_KINDS`);
    }
    if (!ASSET_STATUSES.includes(record.status)) {
      errors.push(`status '${record.status}' is not in ASSET_STATUSES`);
    }
    if (typeof record.width !== 'number') {
      errors.push('width is not a number');
    }
    if (typeof record.height !== 'number') {
      errors.push('height is not a number');
    }
    if (!isPlainObject(record.metadata)) {
      errors.push('metadata is not a plain object');
    }
    return {
      ok: errors.length === 0,
      errors
    };
  };

  /**
   * Validates a ResultAssetStoreState.
   */
  var validateResultAssetStoreState = state => {
    var errors = [];
    if (!isPlainObject(state)) {
      errors.push('State is not a plain object');
      return {
        ok: false,
        errors
      };
    }
    if (!Array.isArray(state.records)) {
      errors.push('records is not an array');
      return {
        ok: false,
        errors
      };
    }
    state.records.forEach((record, index) => {
      var validation = validateResultAssetRecord(record);
      if (!validation.ok) {
        errors.push(`Record ${index}: ${validation.errors.join('; ')}`);
      }
    });
    return {
      ok: errors.length === 0,
      errors
    };
  };

  // --- Self-Test ---

  var runResultAssetStoreSelfTest = () => {
    var errors = [];

    // Test 1: Empty state
    var emptyState = createResultAssetStoreState();
    if (!emptyState || emptyState.records.length !== 0) {
      errors.push('Test 1 FAIL: Empty state not created correctly');
    }

    // Test 2: Image record created
    var imageRecord = createResultAssetRecord({
      sessionId: 'session-123',
      kind: 'image'
    });
    if (!imageRecord || imageRecord.kind !== 'image') {
      errors.push('Test 2 FAIL: Image record not created');
    }

    // Test 3: Add record to state
    var state = emptyState;
    state = addResultAssetRecord(state, imageRecord);
    if (state.records.length !== 1) {
      errors.push('Test 3 FAIL: Record not added to state');
    }

    // Test 4: Get record by ID
    var retrieved = getResultAssetById(state, imageRecord.assetRecordId);
    if (!retrieved || retrieved.assetRecordId !== imageRecord.assetRecordId) {
      errors.push('Test 4 FAIL: Record not retrieved by ID');
    }

    // Test 5: List by session
    var listed = listResultAssetsBySession(state, 'session-123');
    if (listed.length !== 1) {
      errors.push('Test 5 FAIL: Record not listed by session');
    }

    // Test 6: Update record
    var videoRecord = createResultAssetRecord({
      sessionId: 'session-123',
      kind: 'video'
    });
    state = addResultAssetRecord(state, videoRecord);
    state = updateResultAssetRecord(state, videoRecord.assetRecordId, {
      remoteUrl: 'https://example.com/video.mp4',
      status: 'cloud-ready'
    });
    var updated = getResultAssetById(state, videoRecord.assetRecordId);
    if (!updated || updated.remoteUrl !== 'https://example.com/video.mp4' || updated.status !== 'cloud-ready') {
      errors.push('Test 6 FAIL: Record update failed');
    }

    // Test 7: Mark revoked
    state = markResultAssetRevoked(state, videoRecord.assetRecordId);
    var revokedRecord = getResultAssetById(state, videoRecord.assetRecordId);
    if (!revokedRecord || revokedRecord.status !== 'revoked') {
      errors.push('Test 7 FAIL: Mark revoked failed');
    }

    // Test 8: Mark expired
    state = markResultAssetExpired(state, imageRecord.assetRecordId);
    var expiredRecord = getResultAssetById(state, imageRecord.assetRecordId);
    if (!expiredRecord || expiredRecord.status !== 'expired') {
      errors.push('Test 8 FAIL: Mark expired failed');
    }

    // Test 9: Invalid kind normalizes to image
    var invalidKindRecord = createResultAssetRecord({
      kind: 'invalid-kind'
    });
    if (invalidKindRecord.kind !== 'image') {
      errors.push('Test 9 FAIL: Invalid kind not normalized to image');
    }

    // Test 10: Invalid status normalizes to local-ready
    var invalidStatusRecord = createResultAssetRecord({
      status: 'invalid-status'
    });
    if (invalidStatusRecord.status !== 'local-ready') {
      errors.push('Test 10 FAIL: Invalid status not normalized to local-ready');
    }

    // Test 11: Video mimeType defaults to video/mp4
    var videoWithoutMime = createResultAssetRecord({
      kind: 'video'
    });
    if (videoWithoutMime.mimeType !== 'video/mp4') {
      errors.push('Test 11 FAIL: Video mimeType not defaulted to video/mp4');
    }

    // Test 12: Validate state
    var validation = validateResultAssetStoreState(state);
    if (!validation.ok) {
      errors.push(`Test 12 FAIL: State validation failed: ${validation.errors.join('; ')}`);
    }

    // Test 13: Original state not mutated
    var originalEmptyRecords = emptyState.records.length;
    if (originalEmptyRecords !== 0 || state.records.length === 0) {
      errors.push('Test 13 FAIL: Original state was mutated');
    }
    return {
      ok: errors.length === 0,
      errors,
      sample: state ? {
        storeVersion: state.storeVersion,
        recordCount: state.records.length,
        revokedCount: state.records.filter(r => r.status === 'revoked').length,
        expiredCount: state.records.filter(r => r.status === 'expired').length
      } : null
    };
  };

  // --- Export Namespace ---

  window.IMMMResultAssetStore = Object.freeze({
    STORE_VERSION,
    ASSET_KINDS,
    ASSET_STATUSES,
    createResultAssetRecord,
    createResultAssetStoreState,
    addResultAssetRecord,
    updateResultAssetRecord,
    markResultAssetRevoked,
    markResultAssetExpired,
    getResultAssetById,
    listResultAssetsBySession,
    validateResultAssetRecord,
    validateResultAssetStoreState,
    runResultAssetStoreSelfTest
  });
})();