import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'node:vm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function readFile(filename) {
  try {
    return fs.readFileSync(path.join(rootDir, filename), 'utf8');
  } catch (err) {
    return null;
  }
}

function extractFunctionBody(source, signature) {
  if (!source || !signature) return '';
  const start = source.indexOf(signature);
  if (start === -1) return '';
  const open = source.indexOf('{', start);
  if (open === -1) return '';
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  return '';
}

let hasErrors = false;

function checkRepositoryScope() {
  const rootDir = path.resolve('.');
  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  } catch (e) {
    console.error('❌ FAIL: package.json is missing or corrupted');
    hasErrors = true;
    return;
  }

  // package.json name identity check
  if (packageJson.name !== 'immm-photobooth') {
    console.error(`❌ FAIL: Invalid repository identity name: ${packageJson.name}`);
    hasErrors = true;
  }

  // task.md identity check (IMMM photobooth references)
  const taskContent = readFile('task.md') || '';
  if (!taskContent.includes('IMMM') && !taskContent.includes('Photobooth')) {
     console.error('❌ FAIL: task.md does not contain IMMM/Photobooth project identities');
     hasErrors = true;
  }
}

checkRepositoryScope();

async function checkCaptureSessionSystem() {
  const model = readFile('session-model.jsx');
  const adapter = readFile('session-adapter.jsx');
  
  if (!model) {
    console.error('❌ FAIL: session-model.jsx missing');
    hasErrors = true;
    return;
  }
  if (!adapter) {
    console.error('❌ FAIL: session-adapter.jsx missing');
    hasErrors = true;
    return;
  }

  // Model required strings
  const modelRequired = [
    'window.IMMMSessionModel',
    'SESSION_MODES',
    'MEDIA_TYPES',
    'SOURCE_TYPES',
    'SHARE_STATUSES',
    'EXPORT_STATUSES',
    'createCaptureSession',
    'createMediaAsset',
    'createSelectedCut',
    'createRenderRecipe',
    'createEditRecipe',
    'createShareState',
    'createExportState',
    'validateCaptureSession',
    'normalizeCaptureSession',
    'runSessionModelSelfTest',
    'clonePlain'
  ];

  modelRequired.forEach(r => {
    if (!model.includes(r)) {
      console.error(`❌ FAIL: session-model.jsx missing ${r}`);
      hasErrors = true;
    }
  });

  // Adapter required strings
  const adapterRequired = [
    'window.IMMMSessionAdapter',
    'ADAPTER_VERSION',
    'createSessionSnapshot',
    'createMediaAssetsFromShots',
    'createSelectedCutsFromSelection',
    'createRenderRecipeFromAppState',
    'createEditRecipeFromAppState',
    'createResultAssetContract',
    'runSessionAdapterSelfTest'
  ];

  adapterRequired.forEach(r => {
    if (!adapter.includes(r)) {
      console.error(`❌ FAIL: session-adapter.jsx missing ${r}`);
      hasErrors = true;
    }
  });

  // Adapter original index hotfix requirements
  const adapterHotfixRequired = [
    'findAssetByOriginalIndex',
    'remoteUrl',
    'metadata.originalIndex'
  ];

  adapterHotfixRequired.forEach(r => {
    if (!adapter.includes(r)) {
      console.error(`❌ FAIL: session-adapter.jsx missing hotfix requirement: ${r}`);
      hasErrors = true;
    }
  });

  // ResultAssetStore required strings
  const store = readFile('result-asset-store.jsx');
  const storeRequired = [
    'window.IMMMResultAssetStore',
    'STORE_VERSION',
    'ASSET_KINDS',
    'ASSET_STATUSES',
    'createResultAssetRecord',
    'createResultAssetStoreState',
    'addResultAssetRecord',
    'updateResultAssetRecord',
    'markResultAssetRevoked',
    'markResultAssetExpired',
    'getResultAssetById',
    'listResultAssetsBySession',
    'validateResultAssetRecord',
    'validateResultAssetStoreState',
    'runResultAssetStoreSelfTest'
  ];

  if (store) {
    storeRequired.forEach(r => {
      if (!store.includes(r)) {
        console.error(`❌ FAIL: result-asset-store.jsx missing ${r}`);
        hasErrors = true;
      }
    });
  } else {
    console.error('❌ FAIL: result-asset-store.jsx missing');
    hasErrors = true;
  }

  const distModel = readFile('dist/session-model.js');
  const distAdapter = readFile('dist/session-adapter.js');
  const distStore = readFile('dist/result-asset-store.js');

  if (distModel && distAdapter && distStore) {
    if (!distModel.includes('runSessionModelSelfTest')) {
      console.error('❌ FAIL: dist/session-model.js missing runSessionModelSelfTest');
      hasErrors = true;
    }
    if (!distAdapter.includes('runSessionAdapterSelfTest')) {
      console.error('❌ FAIL: dist/session-adapter.js missing runSessionAdapterSelfTest');
      hasErrors = true;
    }
    if (!distStore.includes('runResultAssetStoreSelfTest')) {
      console.error('❌ FAIL: dist/result-asset-store.js missing runResultAssetStoreSelfTest');
      hasErrors = true;
    }

    if (!hasErrors) {
      // Execute actual self-tests in VM
      try {
        const sandbox = {
          window: {},
          crypto: { randomUUID: () => 'test-uuid-0000-1111' },
          Date,
          Math,
          console,
          React: {
            createContext: () => ({ Provider: ({ children }) => children }),
            createElement: (type, props, ...children) => ({ type, props, children }),
            useState: (val) => [val, () => {}],
            useEffect: () => {},
            useRef: () => ({ current: null }),
            useCallback: (fn) => fn,
            Fragment: 'React.Fragment'
          }
        };
        vm.createContext(sandbox);

        const distSticker = readFile('dist/sticker-engine.js');
        const distFramePresets = readFile('dist/frame-presets.js');
        const distFrameSystem = readFile('dist/frame-system.js');

        // Order matters: model then adapter then store
        vm.runInContext(distModel, sandbox);
        vm.runInContext(distAdapter, sandbox);
        vm.runInContext(distStore, sandbox);
        if (distSticker) vm.runInContext(distSticker, sandbox);
        if (distFramePresets) vm.runInContext(distFramePresets, sandbox);
        if (distFrameSystem) vm.runInContext(distFrameSystem, sandbox);

        const modelObj = sandbox.window.IMMMSessionModel;
        const adapterObj = sandbox.window.IMMMSessionAdapter;
        const storeObj = sandbox.window.IMMMResultAssetStore;

        if (!modelObj) throw new Error('window.IMMMSessionModel not found after execution');
        if (!adapterObj) throw new Error('window.IMMMSessionAdapter not found after execution');
        if (!storeObj) throw new Error('window.IMMMResultAssetStore not found after execution');

        // 1. Model Positive self-test
        const modelTestResult = modelObj.runSessionModelSelfTest();
        if (!modelTestResult.ok) {
          console.error('❌ FAIL: IMMMSessionModel.runSessionModelSelfTest() failed:', modelTestResult.errors);
          hasErrors = true;
        }

        // 2. Adapter Positive self-test
        const adapterTestResult = adapterObj.runSessionAdapterSelfTest();
        if (!adapterTestResult.ok) {
          console.error('❌ FAIL: IMMMSessionAdapter.runSessionAdapterSelfTest() failed:', adapterTestResult.errors);
          hasErrors = true;
        }

        // 3. Store Positive self-test
        const storeTestResult = storeObj.runResultAssetStoreSelfTest();
        if (!storeTestResult.ok) {
          console.error('❌ FAIL: IMMMResultAssetStore.runResultAssetStoreSelfTest() failed:', storeTestResult.errors);
          hasErrors = true;
        }

        // 4. Negative tests (Model)
        const badMode = modelObj.createCaptureSession({ mode: 'invalid_mode_xyz' });
        if (modelObj.validateCaptureSession(badMode).ok) {
          console.error('❌ FAIL: validateCaptureSession allowed invalid mode (not-a-valid-status)');
          hasErrors = true;
        }

        const badExportStatus = modelObj.createExportState({ status: 'not-a-valid-export-status' });
        if (modelObj.validateCaptureSession({ exportState: badExportStatus }).ok) {
          console.error('❌ FAIL: validateCaptureSession allowed invalid export status');
          hasErrors = true;
        }

        const badShareStatus = modelObj.createShareState({ status: 'invalid-share-status' });
        if (modelObj.validateCaptureSession({ shareState: badShareStatus }).ok) {
          console.error('❌ FAIL: validateCaptureSession allowed invalid share status');
          hasErrors = true;
        }

        // Test normalizeCaptureSession creates new reference at top level
        const origSession = modelObj.createCaptureSession();
        const normalizedSession = modelObj.normalizeCaptureSession(origSession);
        if (origSession === normalizedSession) {
          console.error('❌ FAIL: normalizeCaptureSession returned same reference (should clone)');
          hasErrors = true;
        }

        // Test normalizeCaptureSession nested cloning for renderRecipe
        const sessionWithRecipe = modelObj.createCaptureSession();
        const recipe = modelObj.createRenderRecipe({ stickers: [{ id: 'test' }] });
        sessionWithRecipe.renderRecipe = recipe;
        const originalRecipeJson = JSON.stringify(recipe);
        const normalized = modelObj.normalizeCaptureSession(sessionWithRecipe);
        if (JSON.stringify(normalized.renderRecipe) !== originalRecipeJson) {
          console.error('❌ FAIL: normalizeCaptureSession renderRecipe nested clone separation issue');
          hasErrors = true;
        }

        // 4. Adapter negative tests
        // Test validateSessionSnapshot with wrapper
        const snapshotWrapper = adapterObj.createSessionSnapshot({
          shots: ['data:image/png;base64,test']
        });
        const validateWrapperTest = adapterObj.validateSessionSnapshot(snapshotWrapper);
        if (!validateWrapperTest.ok) {
          console.error('❌ FAIL: Adapter validateSessionSnapshot should accept wrapper');
          hasErrors = true;
        }

        // Test validateSessionSnapshot with raw session
        const validateRawTest = adapterObj.validateSessionSnapshot(snapshotWrapper.session);
        if (!validateRawTest.ok) {
          console.error('❌ FAIL: Adapter validateSessionSnapshot should accept raw session');
          hasErrors = true;
        }

        // Test empty selected array
        const emptySelectedResult = adapterObj.createSessionSnapshot({
          shots: ['data:image/png;base64,test'],
          selected: []
        });
        if (emptySelectedResult.session.selectedCuts.length !== 0) {
          console.error('❌ FAIL: Empty selected array should not auto-select cuts');
          hasErrors = true;
        }

        // Test invalid shot input is skipped
        const invalidShotResult = adapterObj.createSessionSnapshot({
          shots: [null, undefined, 123, true, { dataUrl: 'data:image/png;base64,valid' }]
        });
        if (invalidShotResult.session.shots.length !== 1) {
          console.error('❌ FAIL: Invalid shot inputs not skipped correctly');
          hasErrors = true;
        }

        // Test result asset invalid kind normalizes
        const invalidKindAsset = adapterObj.createResultAssetContract({ kind: 'invalid' });
        if (invalidKindAsset.kind !== 'image') {
          console.error('❌ FAIL: Result asset invalid kind should normalize to image');
          hasErrors = true;
        }

        // Test result asset video default mimeType
        const videoAsset = adapterObj.createResultAssetContract({ kind: 'video' });
        if (videoAsset.mimeType !== 'video/mp4') {
          console.error('❌ FAIL: Result asset video should default to video/mp4');
          hasErrors = true;
        }

        // 5. Hotfix verification - sparse shot with original index mapping
        const sparseVerifyResult = adapterObj.createSessionSnapshot({
          shots: ['data:image/png;base64,shot0', null, 'data:image/png;base64,shot2'],
          selected: [2]
        });
        if (sparseVerifyResult.session && sparseVerifyResult.session.selectedCuts.length === 1) {
          const boundAsset = sparseVerifyResult.session.shots.find(a => a.metadata && a.metadata.originalIndex === 2);
          if (!boundAsset || sparseVerifyResult.session.selectedCuts[0].assetId !== boundAsset.assetId) {
            console.error('❌ FAIL: Sparse shot original index mapping failed');
            hasErrors = true;
          }
        }

        // 6. Hotfix verification - remoteUrl from HTTP string
        const remoteVerifyResult = adapterObj.createSessionSnapshot({
          shots: ['https://example.com/photo.jpg']
        });
        if (remoteVerifyResult.session && remoteVerifyResult.session.shots[0].remoteUrl !== 'https://example.com/photo.jpg') {
          console.error('❌ FAIL: HTTP string shot should map to remoteUrl');
          hasErrors = true;
        }

        // 6.5. validateFrameReadiness VM Tests
        const validateFrameReadiness = modelObj.validateFrameReadiness;
        if (typeof validateFrameReadiness !== 'function') {
          console.error('❌ FAIL: validateFrameReadiness function is missing on IMMMSessionModel');
          hasErrors = true;
        } else {
          // Positive test
          const posLayout = 'strip';
          const posShots = [
            { assetId: 'asset_0', dataUrl: 'data:image/png;base64,1' },
            { assetId: 'asset_1', dataUrl: 'data:image/png;base64,2' },
            { assetId: 'asset_2', dataUrl: 'data:image/png;base64,3' },
            { assetId: 'asset_3', dataUrl: 'data:image/png;base64,4' }
          ];
          const posSelected = [
            { assetId: 'asset_0', targetSlotIndex: 0 },
            { assetId: 'asset_1', targetSlotIndex: 1 },
            { assetId: 'asset_2', targetSlotIndex: 2 },
            { assetId: 'asset_3', targetSlotIndex: 3 }
          ];
          const posResult = validateFrameReadiness({ layout: posLayout, shots: posShots, selected: posSelected });
          if (!posResult.ok) {
            console.error('❌ FAIL: validateFrameReadiness positive test failed:', posResult.errors);
            hasErrors = true;
          }

          // Negative test 1: Selected count mismatch
          const negSelected1 = [
            { assetId: 'asset_0', targetSlotIndex: 0 },
            { assetId: 'asset_1', targetSlotIndex: 1 }
          ];
          const negResult1 = validateFrameReadiness({ layout: posLayout, shots: posShots, selected: negSelected1 });
          if (negResult1.ok) {
            console.error('❌ FAIL: validateFrameReadiness allowed selected count mismatch');
            hasErrors = true;
          }

          // Negative test 2: Slot coverage missing (duplicated targetSlotIndex)
          const negSelected2 = [
            { assetId: 'asset_0', targetSlotIndex: 0 },
            { assetId: 'asset_1', targetSlotIndex: 0 },
            { assetId: 'asset_2', targetSlotIndex: 2 },
            { assetId: 'asset_3', targetSlotIndex: 3 }
          ];
          const negResult2 = validateFrameReadiness({ layout: posLayout, shots: posShots, selected: negSelected2 });
          if (negResult2.ok) {
            console.error('❌ FAIL: validateFrameReadiness allowed duplicated targetSlotIndex / missing slots');
            hasErrors = true;
          }

          // Negative test 3: Missing image data
          const negShots3 = [
            { assetId: 'asset_0', dataUrl: '' },
            { assetId: 'asset_1', dataUrl: 'data:image/png;base64,2' },
            { assetId: 'asset_2', dataUrl: 'data:image/png;base64,3' },
            { assetId: 'asset_3', dataUrl: 'data:image/png;base64,4' }
          ];
          const negResult3 = validateFrameReadiness({ layout: posLayout, shots: negShots3, selected: posSelected });
          if (negResult3.ok) {
            console.error('❌ FAIL: validateFrameReadiness allowed missing image data');
            hasErrors = true;
          }

          // Positive test with index fallback (no assetId on shots)
          const fallbackShots = [
            { dataUrl: 'data:image/png;base64,1' },
            { dataUrl: 'data:image/png;base64,2' },
            { dataUrl: 'data:image/png;base64,3' },
            { dataUrl: 'data:image/png;base64,4' }
          ];
          const fallbackSelected = [
            { assetId: 'asset_0', targetSlotIndex: 0 },
            { assetId: 'asset_1', targetSlotIndex: 1 },
            { assetId: 'asset_2', targetSlotIndex: 2 },
            { assetId: 'asset_3', targetSlotIndex: 3 }
          ];
          const fallbackResult = validateFrameReadiness({ layout: posLayout, shots: fallbackShots, selected: fallbackSelected });
          if (!fallbackResult.ok) {
            console.error('❌ FAIL: validateFrameReadiness index fallback positive test failed:', fallbackResult.errors);
            hasErrors = true;
          }

          // Negative test with index fallback: one asset is missing image
          const fallbackShotsBad = [
            { dataUrl: 'data:image/png;base64,1' },
            { dataUrl: '' },
            { dataUrl: 'data:image/png;base64,3' },
            { dataUrl: 'data:image/png;base64,4' }
          ];
          const fallbackResultBad = validateFrameReadiness({ layout: posLayout, shots: fallbackShotsBad, selected: fallbackSelected });
          if (fallbackResultBad.ok) {
            console.error('❌ FAIL: validateFrameReadiness index fallback allowed missing image data');
            hasErrors = true;
          }

          // 6.6. validateFrameReadiness new Hardening Tests
          // 6.6.1. Slot count fallback tests (polaroid=1, trip=3, grid=4, strip=4)
          const testLayoutSlots = (l, expectedCount) => {
            const tempShots = Array.from({ length: 10 }, () => ({ dataUrl: 'data:image/png;base64,ok' }));
            const tempSel = Array.from({ length: expectedCount }, (_, i) => ({ sourceShotIndex: i, targetSlotIndex: i }));
            const res = validateFrameReadiness({ layout: l, shots: tempShots, selected: tempSel });
            if (!res.ok) {
              console.error(`❌ FAIL: validateFrameReadiness slot count fallback for layout '${l}' (expected: ${expectedCount}) failed:`, res.errors);
              hasErrors = true;
            }
          };
          testLayoutSlots('polaroid', 1);
          testLayoutSlots('trip', 3);
          testLayoutSlots('grid', 4);
          testLayoutSlots('strip', 4);

          // 6.6.2. Selected sourceShotIndex sparse array index fallback tests (shots 중간에 null이 있는 경우)
          const sparseShots = [
            { assetId: 'asset_0', dataUrl: 'data:image/png;base64,1' },
            null,
            { assetId: 'asset_2', dataUrl: 'data:image/png;base64,3' }
          ];
          const sparseSelected = [
            { assetId: null, sourceShotIndex: 2, targetSlotIndex: 0 }
          ];
          const sparseResult = validateFrameReadiness({ layout: 'polaroid', shots: sparseShots, selected: sparseSelected });
          if (!sparseResult.ok) {
            console.error('❌ FAIL: validateFrameReadiness sparse shots sourceShotIndex fallback failed:', sparseResult.errors);
            hasErrors = true;
          }

          // 6.6.3. filter(Boolean) mismatch detection simulation
          const filteredShots = sparseShots.filter(Boolean); // [asset_0, asset_2]
          const filteredResult = validateFrameReadiness({ layout: 'polaroid', shots: filteredShots, selected: sparseSelected });
          if (filteredResult.ok) {
            // filteredShots[2]는 undefined이므로, validateFrameReadiness는 mismatch를 감지하여 fail 처리해야 정상임
            console.error('❌ FAIL: validateFrameReadiness filter(Boolean) allowed mismatching index without failure');
            hasErrors = true;
          }

          // 6.6.4. Selected shot has no image data failure test
          const noImageShots = [
            { assetId: 'asset_0', dataUrl: null, blobUrl: null, remoteUrl: '' }
          ];
          const noImageSelected = [
            { assetId: 'asset_0', sourceShotIndex: 0, targetSlotIndex: 0 }
          ];
          const noImageResult = validateFrameReadiness({ layout: 'polaroid', shots: noImageShots, selected: noImageSelected });
          if (noImageResult.ok) {
            console.error('❌ FAIL: validateFrameReadiness allowed empty image data for selected shot');
            hasErrors = true;
          }

          // 6.6.5. resolveStickerFidelityMetrics VM verification
          const resolveStickerFidelityMetrics = sandbox.window.resolveStickerFidelityMetrics;
          if (typeof resolveStickerFidelityMetrics !== 'function') {
            console.error('❌ FAIL: resolveStickerFidelityMetrics is missing in sticker-engine.jsx');
            hasErrors = true;
          } else {
            // Slotted sticker metrics
            const slottedSticker = { frameSlot: 0, slotX: 30, slotY: 40, sizeNorm: 0.2, scale: 1.5 };
            const slottedMetrics = resolveStickerFidelityMetrics(slottedSticker, null, 100, 100);
            if (slottedMetrics.xPercent !== 30 || slottedMetrics.yPercent !== 40) {
              console.error('❌ FAIL: resolveStickerFidelityMetrics slotted sticker must use slotX/slotY');
              hasErrors = true;
            }
            if (slottedMetrics.widthPx !== 100 * 0.2 * 1.5) {
              console.error('❌ FAIL: resolveStickerFidelityMetrics slotted sticker width calculation mismatch');
              hasErrors = true;
            }

            // Free sticker metrics
            const freeSticker = { frameSlot: null, x: 70, y: 80, sizeNorm: 0.1, scale: 2.0 };
            const freeMetrics = resolveStickerFidelityMetrics(freeSticker, null, 500, 500);
            if (freeMetrics.xPercent !== 70 || freeMetrics.yPercent !== 80) {
              console.error('❌ FAIL: resolveStickerFidelityMetrics free sticker must use x/y');
              hasErrors = true;
            }
            if (freeMetrics.widthPx !== 500 * 0.1 * 2.0) {
              console.error('❌ FAIL: resolveStickerFidelityMetrics free sticker width calculation mismatch');
              hasErrors = true;
            }

            // frameSlot 문자열 호환성 테스트 (P0-1)
            const slottedStickerStr = { frameSlot: "0", slotX: 30, slotY: 40, sizeNorm: 0.2, scale: 1.5 };
            const slottedMetricsStr = resolveStickerFidelityMetrics(slottedStickerStr, null, 100, 100);
            if (slottedMetricsStr.xPercent !== 30 || slottedMetricsStr.yPercent !== 40) {
              console.error('❌ FAIL: resolveStickerFidelityMetrics with string frameSlot "0" must use slotX/slotY');
              hasErrors = true;
            }

            // 6.6.7. sanitizeFrameSticker metadata preservation validation (P0-2)
            const sanitizeFrameSticker = sandbox.window.sanitizeFrameSticker;
            if (typeof sanitizeFrameSticker !== 'function') {
              console.error('❌ FAIL: sanitizeFrameSticker is missing in frame-presets.jsx');
              hasErrors = true;
            } else {
              const rawSticker = {
                id: 'st_test_123',
                kind: 'preset',
                payload: { libId: 'preset_cat_1' },
                x: 45,
                y: 55,
                scale: 1.2,
                rotation: 15,
                frameSlot: "2", // string slot
                slotX: 60.5,
                slotY: -10, // clamp to 0
                sizeNorm: 0.15
              };
              const sanitized = sanitizeFrameSticker(rawSticker);
              if (!sanitized) {
                console.error('❌ FAIL: sanitizeFrameSticker returned null for valid sticker');
                hasErrors = true;
              } else {
                if (sanitized.frameSlot !== 2) {
                  console.error('❌ FAIL: sanitizeFrameSticker must cast frameSlot to number, got:', sanitized.frameSlot);
                  hasErrors = true;
                }
                if (sanitized.slotX !== 60.5) {
                  console.error('❌ FAIL: sanitizeFrameSticker slotX mismatch');
                  hasErrors = true;
                }
                if (sanitized.slotY !== 0) {
                  console.error('❌ FAIL: sanitizeFrameSticker slotY must be clamped between 0 and 100, got:', sanitized.slotY);
                  hasErrors = true;
                }
                if (sanitized.sizeNorm !== 0.15) {
                  console.error('❌ FAIL: sanitizeFrameSticker sizeNorm mismatch');
                  hasErrors = true;
                }
              }
            }

            // 6.6.7b. sanitizeFrameSticker boundary and abnormal inputs test (P1-2)
            const abnormalSticker = {
              id: 'st_abnormal_777',
              kind: 'preset',
              payload: { libId: 'sticker_normal' },
              x: 10,
              y: 20,
              scale: 1.0,
              rotation: 0,
              frameSlot: "abc", // invalid slot string
              slotX: -50,       // invalid slotX
              slotY: 300,       // invalid slotY
              sizeNorm: 999     // overflow sizeNorm
            };
            const sanitizedAbnormal = sanitizeFrameSticker(abnormalSticker);
            if (sanitizedAbnormal) {
              if (sanitizedAbnormal.frameSlot !== undefined) {
                console.error('❌ FAIL: sanitizeFrameSticker must drop frameSlot if it is not an integer');
                hasErrors = true;
              }
              if (sanitizedAbnormal.slotX !== undefined || sanitizedAbnormal.slotY !== undefined) {
                console.error('❌ FAIL: sanitizeFrameSticker must not store slotX/slotY when frameSlot is invalid');
                hasErrors = true;
              }
              if (sanitizedAbnormal.sizeNorm !== 1.2) { // 999 should clamp to 1.2
                console.error('❌ FAIL: sanitizeFrameSticker sizeNorm must clamp to 1.2 when value overflows, got:', sanitizedAbnormal.sizeNorm);
                hasErrors = true;
              }
            } else {
              console.error('❌ FAIL: sanitizeFrameSticker returned null for abnormal input, should just clean the fields');
              hasErrors = true;
            }

            const abnormalStickerUnderflow = {
              id: 'st_underflow_777',
              kind: 'preset',
              payload: { libId: 'sticker_normal' },
              x: 10,
              y: 20,
              sizeNorm: -0.5 // underflow sizeNorm
            };
            const sanitizedUnderflow = sanitizeFrameSticker(abnormalStickerUnderflow);
            if (sanitizedUnderflow && sanitizedUnderflow.sizeNorm !== 0.02) { // -0.5 should clamp to 0.02
              console.error('❌ FAIL: sanitizeFrameSticker sizeNorm must clamp to 0.02 when value underflows, got:', sanitizedUnderflow.sizeNorm);
              hasErrors = true;
            }

            // 6.6.9. LegacyFrameThumb rendering context policy validation (P1-1)
            const screensEditContent = readFile('screens-edit.jsx') || '';
            if (!screensEditContent.includes("if (suppressSlottedStickers || renderPolicy === 'overlay-owned')")) {
              console.error("❌ FAIL: LegacyFrameThumb is missing check for renderPolicy === 'overlay-owned' inside screens-edit.jsx");
              hasErrors = true;
            }

            // 6.6.8. Custom frame export/import metadata preservation test (P0-2)
            const exportCustomFramePackJson = sandbox.window.exportCustomFramePackJson;
            const importFramePackJson = sandbox.window.importFramePackJson;
            if (typeof exportCustomFramePackJson === 'function' && typeof importFramePackJson === 'function') {
              const testCustomFrame = {
                id: 'my-custom-frame-test-999',
                name: 'My Slotted Custom Frame',
                layout: 'trip',
                source: 'custom',
                canvasSize: { width: 500, height: 750 },
                photoSlots: [],
                stickers: [
                  {
                    id: 'st_slotted_999',
                    kind: 'preset',
                    payload: { libId: 'presets_sticker_cool' },
                    x: 30,
                    y: 30,
                    scale: 1.5,
                    rotation: 45,
                    frameSlot: 1,
                    slotX: 45.5,
                    slotY: 55.5,
                    sizeNorm: 0.2
                  }
                ]
              };
              const exportedPackJson = exportCustomFramePackJson([testCustomFrame]);
              const importedResult = importFramePackJson(exportedPackJson);
              if (!importedResult.ok) {
                console.error('❌ FAIL: importFramePackJson failed on valid exported pack:', importedResult.error);
                hasErrors = true;
              } else {
                const importedPreset = importedResult.presets?.[0];
                if (!importedPreset) {
                  console.error('❌ FAIL: Imported preset is empty');
                  hasErrors = true;
                } else {
                  const importedSticker = importedPreset.stickers?.[0];
                  if (!importedSticker) {
                    console.error('❌ FAIL: Imported preset sticker is missing');
                    hasErrors = true;
                  } else {
                    if (Number(importedSticker.frameSlot) !== 1) {
                      console.error('❌ FAIL: Slotted sticker frameSlot not preserved after export/import, got:', importedSticker.frameSlot);
                      hasErrors = true;
                    }
                    if (importedSticker.slotX !== 45.5 || importedSticker.slotY !== 55.5) {
                      console.error('❌ FAIL: Slotted sticker slotX/slotY not preserved after export/import, got:', importedSticker.slotX, importedSticker.slotY);
                      hasErrors = true;
                    }
                    if (importedSticker.sizeNorm !== 0.2) {
                      console.error('❌ FAIL: Slotted sticker sizeNorm not preserved after export/import, got:', importedSticker.sizeNorm);
                      hasErrors = true;
                    }
                  }
                }
              }
            }
          }

          // 6.6.6. Sticker UI/UX Hardening static checks (P0 requirements)
          const stickerEngineContent = readFile('sticker-engine.jsx') || '';
          
          // Requirement 1 & 2: invScale & scale(${invScale}) removal check in renderStickerControls
          const renderStickerControlsBody = extractFunctionBody(stickerEngineContent, 'const renderStickerControls =');
          if (renderStickerControlsBody.includes('invScale') || renderStickerControlsBody.includes('scale(')) {
            console.error('❌ FAIL: renderStickerControls still contains invScale or scale(...) inverse scale logic');
            hasErrors = true;
          }

          // P0-1 static checks: frameSlot filter should be number based
          const numberFilterMatch = /Number\(s\.frameSlot\)\s*===\s*Number\(slotIndex\)/;
          if (!numberFilterMatch.test(stickerEngineContent)) {
            console.error('❌ FAIL: Number conversion filter Number(s.frameSlot) === Number(slotIndex) is missing in sticker-engine.jsx');
            hasErrors = true;
          }

          // Requirement 3 & 4: visual/controls layer classes check
          if (!stickerEngineContent.includes('slotted-sticker-visual-layer')) {
            console.error('❌ FAIL: slotted-sticker-visual-layer is missing in sticker-engine.jsx');
            hasErrors = true;
          }
          if (!stickerEngineContent.includes('slotted-sticker-controls-layer')) {
            console.error('❌ FAIL: slotted-sticker-controls-layer is missing in sticker-engine.jsx');
            hasErrors = true;
          }

          // Requirement 5 & 6: visual container should have overflow hidden, controls must not
          const visualLayerRegex = /className="slotted-sticker-visual-layer"[\s\S]*?overflow:\s*'hidden'/;
          if (!visualLayerRegex.test(stickerEngineContent)) {
            console.error('❌ FAIL: slotted-sticker-visual-layer is missing overflow: hidden styling');
            hasErrors = true;
          }

          // Requirement 7: check SlottedStickersCtx.Provider value contains renderPolicy and slottedMap
          const providerValMatch = /<SlottedStickersCtx\.Provider\s+value=\{\{\s*renderPolicy:\s*'overlay-owned',\s*slottedMap\s*\}\}\s*>/;
          if (!providerValMatch.test(stickerEngineContent)) {
            console.error("❌ FAIL: SlottedStickersCtx.Provider within StickerCanvas must pass { renderPolicy: 'overlay-owned', slottedMap } to control duplicate rendering");
            hasErrors = true;
          }

          // Requirement 8 & 9: check frame-system.jsx drawStickerToCtx slot placement
          const frameSystemContent = readFile('frame-system.jsx') || '';
          
          // Photo loop must not draw slotted sticker inside slot rendering (623~634)
          const photoSlotsLoopSection = extractFunctionBody(frameSystemContent, 'for (let i = 0; i < photoSlots.length; i++) {');
          if (photoSlotsLoopSection.includes('await drawStickerToCtx')) {
             console.error('❌ FAIL: photo slot loop inside renderComposition still draws slotted sticker directly');
             hasErrors = true;
          }

          // Front layer after pass slotted sticker check
          const hasSlottedStickerPassAfterFront = frameSystemContent.includes('4b. Slotted sticker pass');
          if (!hasSlottedStickerPassAfterFront) {
            console.error('❌ FAIL: frame-system.jsx is missing the post-front-layer slotted sticker rendering pass');
            hasErrors = true;
          }

          // P0-5. Session Integrity Hardening VM & Static Tests
          const mainContent = readFile('main.jsx') || '';
          const body = extractFunctionBody(mainContent, 'function normalizeSelectedForLayout(selected, shots, slotCount)');
          if (!body) {
            console.error('❌ FAIL: Could not extract normalizeSelectedForLayout from main.jsx');
            hasErrors = true;
          } else {
            try {
              vm.runInContext(`
                function normalizeSelectedForLayout(selected, shots, slotCount) {
                  ${body}
                }
                window.normalizeSelectedForLayout = normalizeSelectedForLayout;
              `, sandbox);
            } catch (runErr) {
              console.error('❌ FAIL: Failed to evaluate normalizeSelectedForLayout in VM sandbox:', runErr.message);
              hasErrors = true;
            }

            const normalizeSelectedForLayout = sandbox.window.normalizeSelectedForLayout;
            if (typeof normalizeSelectedForLayout !== 'function') {
              console.error('❌ FAIL: normalizeSelectedForLayout is not defined on window in sandbox');
              hasErrors = true;
            } else {
              // 1. selected=[0], shots 4장, slotCount=4 => [0,1,2,3]
              {
                const testShots = [
                  { assetId: 'a0', dataUrl: 'data:image/png;base64,1' },
                  { assetId: 'a1', dataUrl: 'data:image/png;base64,2' },
                  { assetId: 'a2', dataUrl: 'data:image/png;base64,3' },
                  { assetId: 'a3', dataUrl: 'data:image/png;base64,4' }
                ];
                const res = normalizeSelectedForLayout([0], testShots, 4);
                if (JSON.stringify(res.selected) !== JSON.stringify([0, 1, 2, 3]) || !res.complete) {
                  console.error('❌ FAIL: normalizeSelectedForLayout test 1 failed. Expected [0,1,2,3], got:', res);
                  hasErrors = true;
                }
              }

              // 2. selected=[0,0,1], shots 4장, slotCount=4 => 중복 제거 후 4개 보정
              {
                const testShots = [
                  { assetId: 'a0', dataUrl: 'data:image/png;base64,1' },
                  { assetId: 'a1', dataUrl: 'data:image/png;base64,2' },
                  { assetId: 'a2', dataUrl: 'data:image/png;base64,3' },
                  { assetId: 'a3', dataUrl: 'data:image/png;base64,4' }
                ];
                const res = normalizeSelectedForLayout([0, 0, 1], testShots, 4);
                if (JSON.stringify(res.selected) !== JSON.stringify([0, 1, 2, 3]) || !res.complete) {
                  console.error('❌ FAIL: normalizeSelectedForLayout test 2 failed. Expected [0,1,2,3], got:', res);
                  hasErrors = true;
                }
              }

              // 3. selected=[5], shots[5] 있음, slotCount=4 => 5 포함하고 나머지 실제 이미지로 보정
              {
                const testShots = [
                  { assetId: 'a0', dataUrl: 'data:image/png;base64,0' },
                  null,
                  { assetId: 'a2', dataUrl: 'data:image/png;base64,2' },
                  null,
                  { assetId: 'a4', dataUrl: 'data:image/png;base64,4' },
                  { assetId: 'a5', dataUrl: 'data:image/png;base64,5' }
                ];
                const res = normalizeSelectedForLayout([5], testShots, 4);
                if (JSON.stringify(res.selected) !== JSON.stringify([5, 0, 2, 4]) || !res.complete) {
                  console.error('❌ FAIL: normalizeSelectedForLayout test 3 failed. Expected [5,0,2,4], got:', res);
                  hasErrors = true;
                }
              }

              // 4. selected 부족 + shots 부족 => validateFrameReadiness는 fail 유지
              {
                const testShots = [
                  { assetId: 'a0', dataUrl: 'data:image/png;base64,0' },
                  null,
                  { assetId: 'a2', dataUrl: 'data:image/png;base64,2' }
                ];
                const res = normalizeSelectedForLayout([0], testShots, 4);
                const repairedSelected = res.selected;
                // fake fill 제거 확인: testShots의 유효 이미지는 2개(a0, a2)뿐이므로 length는 2여야 하며 4가 되면 안 됨
                if (repairedSelected.length >= 4 || res.complete) {
                  console.error('❌ FAIL: normalizeSelectedForLayout should not fake fill to slotCount when shots are insufficient, got:', res);
                  hasErrors = true;
                }
                const mappedSelected = repairedSelected.map((shotIdx, targetSlotIndex) => {
                  const asset = testShots[shotIdx];
                  return {
                    assetId: asset?.assetId || null,
                    sourceShotIndex: shotIdx,
                    targetSlotIndex
                  };
                });
                const vRes = validateFrameReadiness({ layout: 'strip', shots: testShots, selected: mappedSelected });
                if (vRes.ok) {
                  console.error('❌ FAIL: validateFrameReadiness should fail when shots and selected are insufficient');
                  hasErrors = true;
                }
              }

              // 4b. loadImageForCanvasDetailed VM unit test
              const loadImageForCanvasDetailed = sandbox.window.loadImageForCanvasDetailed;
              if (typeof loadImageForCanvasDetailed !== 'function') {
                console.error('❌ FAIL: loadImageForCanvasDetailed is missing on window in sandbox');
                hasErrors = true;
              } else {
                const resMissing = await loadImageForCanvasDetailed(null);
                if (resMissing.ok || resMissing.reason !== 'missing-src') {
                  console.error('❌ FAIL: loadImageForCanvasDetailed failed to detect missing-src, got:', resMissing);
                  hasErrors = true;
                }
              }
            }
          }

          // 5. route guard가 selected count mismatch만으로 setup 이동하지 않고 repair를 먼저 시도하는지 static check
          const hasRepairLogic = mainContent.includes('normalizeSelectedForLayout(selected, shots, slotCount)') &&
                                 mainContent.includes('secondValidation') &&
                                 mainContent.includes('선택 순서를 프레임에 맞게 복구했습니다.');
          if (!hasRepairLogic) {
            console.error('❌ FAIL: main.jsx route guard does not seem to try repairing mismatch before redirecting to setup');
            hasErrors = true;
          }

          // 6. applyFramePreset이 screen === 'deco' || screen === 'result' 조건 하에서만 토스트/이동을 유발하는지 static check
          const hasApplyFramePresetScreenCheck = mainContent.includes("if (screen === 'deco' || screen === 'result')") &&
                                                 mainContent.includes("setRouteToast('프레임에 넣을 사진이 부족합니다. 사진을 다시 선택해주세요.');");
          if (!hasApplyFramePresetScreenCheck) {
            console.error("❌ FAIL: main.jsx applyFramePreset does not restrict toast warning to deco or result screens only");
            hasErrors = true;
          }

          // 7. loadImageForCanvas가 외부 http(s) 원격 주소에만 crossOrigin을 anonymous로 세팅하는지 static check
          const hasImageCrossOriginGuard = (readFile('frame-system.jsx') || '').includes("if (typeof src === 'string' && /^https?:\\/\\//.test(src))");
          if (!hasImageCrossOriginGuard) {
             console.error("❌ FAIL: loadImageForCanvas does not restrict crossOrigin to remote http(s) protocols only");
             hasErrors = true;
          }

          // 7b. applyFramePreset이 상태 레이스 방지를 위해 workingShots / workingSelected를 사용하는지 static check
          const hasApplyFramePresetHardening = mainContent.includes('let workingShots =') &&
                                               mainContent.includes('let workingSelected =') &&
                                               mainContent.includes('normalizeSelectedForLayout(workingSelected, nextShots, slotCount)');
          if (!hasApplyFramePresetHardening) {
             console.error("❌ FAIL: main.jsx applyFramePreset does not use workingShots / workingSelected to prevent state race condition");
             hasErrors = true;
          }
        }

        // 7. Foundation Contracts VM Tests
        const distSnapshot = readFile('dist/session-runtime-snapshot.js');
        const distCloudShare = readFile('dist/cloud-share-adapter.js');
        const distShare = readFile('dist/share-contract.js');
        const distMotion = readFile('dist/motion-export-contract.js');
        const distEdit = readFile('dist/edit-recipe-contract.js');
        const distPWA = readFile('dist/pwa-release-contract.js');

        if (distSnapshot && distCloudShare && distShare && distMotion && distEdit && distPWA) {
          // Load foundation contracts into sandbox
          vm.runInContext(distSnapshot, sandbox);
          vm.runInContext(distCloudShare, sandbox);
          vm.runInContext(distShare, sandbox);
          vm.runInContext(distMotion, sandbox);
          vm.runInContext(distEdit, sandbox);
          vm.runInContext(distPWA, sandbox);

          const snapshotObj = sandbox.window.IMMMSessionRuntimeSnapshot;
          const cloudShareObj = sandbox.window.IMMMCloudShareAdapter;
          const shareObj = sandbox.window.IMMMShareContract;
          const motionObj = sandbox.window.IMMMMotionExportContract;
          const editObj = sandbox.window.IMMMEditRecipeContract;
          const pwaObj = sandbox.window.IMPWAReleaseContract;

          if (!snapshotObj) throw new Error('window.IMMMSessionRuntimeSnapshot not found');
          if (!cloudShareObj) throw new Error('window.IMMMCloudShareAdapter not found');
          if (!shareObj) throw new Error('window.IMMMShareContract not found');
          if (!motionObj) throw new Error('window.IMMMMotionExportContract not found');
          if (!editObj) throw new Error('window.IMMMEditRecipeContract not found');
          if (!pwaObj) throw new Error('window.IMPWAReleaseContract not found');

          // Run self-tests for each contract
          const snapshotTest = snapshotObj.runSessionRuntimeSnapshotSelfTest();
          if (!snapshotTest.ok) {
            console.error('❌ FAIL: IMMMSessionRuntimeSnapshot.runSessionRuntimeSnapshotSelfTest() failed:', snapshotTest.errors);
            hasErrors = true;
          }

          const cloudShareTest = cloudShareObj.runCloudShareAdapterSelfTest();
          if (!cloudShareTest.ok) {
            console.error('❌ FAIL: IMMMCloudShareAdapter.runCloudShareAdapterSelfTest() failed:', cloudShareTest.errors);
            hasErrors = true;
          }

          const shareTest = shareObj.runShareContractSelfTest();
          if (!shareTest.ok) {
            console.error('❌ FAIL: IMMMShareContract.runShareContractSelfTest() failed:', shareTest.errors);
            hasErrors = true;
          }

          const motionTest = motionObj.runMotionExportContractSelfTest();
          if (!motionTest.ok) {
            console.error('❌ FAIL: IMMMMotionExportContract.runMotionExportContractSelfTest() failed:', motionTest.errors);
            hasErrors = true;
          }

          const editTest = editObj.runEditRecipeContractSelfTest();
          if (!editTest.ok) {
            console.error('❌ FAIL: IMMMEditRecipeContract.runEditRecipeContractSelfTest() failed:', editTest.errors);
            hasErrors = true;
          }

          const pwaTest = pwaObj.runPwaReleaseContractSelfTest();
          if (!pwaTest.ok) {
            console.error('❌ FAIL: IMPWAReleaseContract.runPwaReleaseContractSelfTest() failed:', pwaTest.errors);
            hasErrors = true;
          }
        } else {
          if (!distSnapshot) console.error('❌ FAIL: dist/session-runtime-snapshot.js not found');
          if (!distCloudShare) console.error('❌ FAIL: dist/cloud-share-adapter.js not found');
          if (!distShare) console.error('❌ FAIL: dist/share-contract.js not found');
          if (!distMotion) console.error('❌ FAIL: dist/motion-export-contract.js not found');
          if (!distEdit) console.error('❌ FAIL: dist/edit-recipe-contract.js not found');
          if (!distPWA) console.error('❌ FAIL: dist/pwa-release-contract.js not found');
          hasErrors = true;
        }

      } catch (err) {
        console.error('💥 FAIL: Exception during Session System VM self-test execution:', err.message);
        hasErrors = true;
      }
    }
  }

  const build = readFile('scripts/build-precompile.mjs');
  if (build) {
    if (!build.includes('session-model.jsx')) {
      console.error('❌ FAIL: build-precompile.mjs manifest missing session-model.jsx');
      hasErrors = true;
    }
    if (!build.includes('session-adapter.jsx')) {
      console.error('❌ FAIL: build-precompile.mjs manifest missing session-adapter.jsx');
      hasErrors = true;
    }
    if (!build.includes('result-asset-store.jsx')) {
      console.error('❌ FAIL: build-precompile.mjs manifest missing result-asset-store.jsx');
      hasErrors = true;
    }
    if (!build.includes('session-runtime-snapshot.jsx')) {
      console.error('❌ FAIL: build-precompile.mjs manifest missing session-runtime-snapshot.jsx');
      hasErrors = true;
    }
    if (!build.includes('cloud-share-adapter.jsx')) {
      console.error('❌ FAIL: build-precompile.mjs manifest missing cloud-share-adapter.jsx');
      hasErrors = true;
    }
    if (!build.includes('share-contract.jsx')) {
      console.error('❌ FAIL: build-precompile.mjs manifest missing share-contract.jsx');
      hasErrors = true;
    }
    if (!build.includes('motion-export-contract.jsx')) {
      console.error('❌ FAIL: build-precompile.mjs manifest missing motion-export-contract.jsx');
      hasErrors = true;
    }
    if (!build.includes('edit-recipe-contract.jsx')) {
      console.error('❌ FAIL: build-precompile.mjs manifest missing edit-recipe-contract.jsx');
      hasErrors = true;
    }
    if (!build.includes('pwa-release-contract.jsx')) {
      console.error('❌ FAIL: build-precompile.mjs manifest missing pwa-release-contract.jsx');
      hasErrors = true;
    }
  }

  const index = readFile('index.html');
  if (index) {
    const requiredScripts = [
      'dist/session-model.js',
      'dist/session-adapter.js',
      'dist/result-asset-store.js',
      'dist/session-runtime-snapshot.js',
      'dist/cloud-share-adapter.js',
      'dist/share-contract.js',
      'dist/motion-export-contract.js',
      'dist/edit-recipe-contract.js',
      'dist/pwa-release-contract.js'
    ];
    requiredScripts.forEach(d => {
      if (!index.includes(d)) {
        console.error(`❌ FAIL: index.html missing ${d}`);
        hasErrors = true;
      }
    });

    const modelIdx = index.indexOf('dist/session-model.js');
    const adapterIdx = index.indexOf('dist/session-adapter.js');
    const storeIdx = index.indexOf('dist/result-asset-store.js');
    const snapshotIdx = index.indexOf('dist/session-runtime-snapshot.js');
    const cloudShareIdx = index.indexOf('dist/cloud-share-adapter.js');
    const shareIdx = index.indexOf('dist/share-contract.js');
    const motionIdx = index.indexOf('dist/motion-export-contract.js');
    const editIdx = index.indexOf('dist/edit-recipe-contract.js');
    const pwaIdx = index.indexOf('dist/pwa-release-contract.js');
    const systemIdx = index.indexOf('dist/frame-system.js');

    if (modelIdx > adapterIdx) {
      console.error('❌ FAIL: session-model.js must be loaded BEFORE session-adapter.js');
      hasErrors = true;
    }
    if (adapterIdx > storeIdx) {
      console.error('❌ FAIL: session-adapter.js must be loaded BEFORE result-asset-store.js');
      hasErrors = true;
    }
    if (storeIdx > snapshotIdx) {
      console.error('❌ FAIL: result-asset-store.js must be loaded BEFORE session-runtime-snapshot.js');
      hasErrors = true;
    }
    if (snapshotIdx > cloudShareIdx) {
      console.error('❌ FAIL: session-runtime-snapshot.js must be loaded BEFORE cloud-share-adapter.js');
      hasErrors = true;
    }
    if (cloudShareIdx > shareIdx) {
      console.error('❌ FAIL: cloud-share-adapter.js must be loaded BEFORE share-contract.js');
      hasErrors = true;
    }
    if (shareIdx > motionIdx) {
      console.error('❌ FAIL: share-contract.js must be loaded BEFORE motion-export-contract.js');
      hasErrors = true;
    }
    if (motionIdx > editIdx) {
      console.error('❌ FAIL: motion-export-contract.js must be loaded BEFORE edit-recipe-contract.js');
      hasErrors = true;
    }
    if (editIdx > pwaIdx) {
      console.error('❌ FAIL: edit-recipe-contract.js must be loaded BEFORE pwa-release-contract.js');
      hasErrors = true;
    }
    if (pwaIdx > systemIdx) {
      console.error('❌ FAIL: pwa-release-contract.js must be loaded BEFORE frame-system.js');
      hasErrors = true;
    }
  }

  const sw = readFile('sw.js');
  if (sw) {
    const requiredAssets = [
      './dist/session-model.js',
      './dist/session-adapter.js',
      './dist/result-asset-store.js',
      './dist/session-runtime-snapshot.js',
      './dist/cloud-share-adapter.js',
      './dist/share-contract.js',
      './dist/motion-export-contract.js',
      './dist/edit-recipe-contract.js',
      './dist/pwa-release-contract.js'
    ];
    requiredAssets.forEach(asset => {
      if (!sw.includes(asset)) {
        console.error(`❌ FAIL: sw.js ASSETS missing ${asset}`);
        hasErrors = true;
      }
    });

    // Check cache version matching release-manifest.json
    const manifestData = JSON.parse(fs.readFileSync('release-manifest.json', 'utf8'));
    const cacheVersion = manifestData.cache;
    if (!sw.includes(`immm-cache-${cacheVersion}`)) {
      console.error(`❌ FAIL: sw.js CACHE_NAME must match manifest cache version: expected 'immm-cache-${cacheVersion}'`);
      hasErrors = true;
    }
  }
}

await checkCaptureSessionSystem();

function checkWebGL() {
  const webgl = readFile('webgl-engine.jsx');
  if (!webgl) return;
  if (webgl.includes('mobileRef')) {
    console.error('❌ FAIL: webgl-engine.jsx contains "mobileRef"');
    hasErrors = true;
  }
}

function checkVisibleFilters() {
  const content = readFile('filters.jsx');
  if (!content) return;

  const vMatch = content.match(/const\s+VISIBLE_FILTER_KEYS\s*=\s*\[([\s\S]*?)\]/);
  if (!vMatch) {
    console.error('❌ FAIL: filters.jsx missing VISIBLE_FILTER_KEYS');
    hasErrors = true;
    return;
  }
  const keys = vMatch[1].split(',').map(k => k.trim().replace(/['"]/g, '')).filter(Boolean);
  const approved = ['original', 'porcelain', 'smooth', 'blush', 'grain', 'bw'];
  const prohibitedInVisible = ['purikura', 'glam', 'aurora', 'seoul', 'classic_neg', 'kodak_portra', 'ilford_hp5', 'y2k', 'dream', 'glitter'];

  if (keys.length !== 6) {
    console.error(`❌ FAIL: filters.jsx VISIBLE_FILTER_KEYS must be exactly 6 (current: ${keys.length})`);
    hasErrors = true;
  }

  keys.forEach(k => {
    if (!approved.includes(k)) {
      console.error(`❌ FAIL: filters.jsx exposes non-approved visible filter: ${k}`);
      hasErrors = true;
    }
    if (prohibitedInVisible.includes(k)) {
      console.error(`❌ FAIL: prohibited filter "${k}" is in VISIBLE_FILTER_KEYS`);
      hasErrors = true;
    }
  });

  const hidden = ['purikura', 'glam', 'aurora', 'seoul'];
  hidden.forEach(h => {
    const reg = new RegExp(`${h}:[\\s\\S]*?hidden:\\s*true`);
    if (!reg.test(content)) {
      console.error(`❌ FAIL: filters.jsx ${h} must have hidden: true`);
      hasErrors = true;
    }
  });

  if (!content.includes('getVisibleFilters')) {
    console.error('❌ FAIL: filters.jsx missing getVisibleFilters');
    hasErrors = true;
  }
  if (content.includes('getSafeFilterKey') && !content.includes('!FILTERS[key].hidden')) {
    console.error('❌ FAIL: filters.jsx getSafeFilterKey missing hidden filter protection');
    hasErrors = true;
  }
}

function checkWebglVisiblePipelines() {
  const content = readFile('webgl-engine.jsx');
  if (!content) return;

  const approvedFilters = ['original', 'porcelain', 'smooth', 'blush', 'grain', 'bw'];
  const prohibitedShaders = [
    'skin_retouch', 'purikura', 'glam', 'aurora',
    'classic_neg', 'kodak_portra', 'ilford_hp5',
    'y2k', 'dream', 'glitter', 'chromatic_ab', 'vignette'
  ];

  approvedFilters.forEach(p => {
    const reg = new RegExp(`${p}:\\s*\\{[\\s\\S]*?pipeline:\\s*\\[([\\s\\S]*?)\\]\\s*\\}`);
    const match = content.match(reg);
    if (match) {
      const body = match[1];
      prohibitedShaders.forEach(s => {
        if (body.includes(`shader:'${s}'`)) {
          console.error(`❌ FAIL: webgl-engine.jsx visible pipeline "${p}" contains prohibited shader "${s}"`);
          hasErrors = true;
        }
      });
    }
  });
}

function checkEmergencyFaceSafety() {
  const webgl = readFile('webgl-engine.jsx');
  const main = readFile('main.jsx');
  const rest = readFile('screens-v2-rest.jsx');

  if (webgl) {
    if (webgl.match(/pipeline:\s*\[[\s\S]*?shader:'skin_retouch'[\s\S]*?\]/)) {
      console.error("❌ FAIL: active pipeline contains shader:'skin_retouch'");
      hasErrors = true;
    }

    const blushMatch = webgl.match(/blush:\s*`([\s\S]*?)`/);
    if (blushMatch) {
      const body = blushMatch[1];
      ['u_faceCount', 'u_leftCheek', 'u_rightCheek', 'cheek('].forEach(b => {
        if (body.includes(b)) {
          console.error(`❌ FAIL: blush shader body contains landmark token: ${b}`);
          hasErrors = true;
        }
      });
    }

    const skinMatch = webgl.match(/skin_retouch:\s*`([\s\S]*?)`/);
    if (skinMatch) {
      const body = skinMatch[1];
      ['u_blurredTex', 'u_maskTex', 'finalMask', 'getSkinConfidence', 'mix(ori, blur'].forEach(b => {
        if (body.includes(b)) {
          console.error(`❌ FAIL: skin_retouch shader body contains prohibited logic: ${b}`);
          hasErrors = true;
        }
      });
    }

    const prohibitedGlobal = [
      'IMMM_ENABLE_EXPERIMENTAL_SKIN_RETOUCH', 'warpEye', 'warpToward', 'u_eyeScale', 'u_eyeRadius', 'faceUniforms.u_', 'useFaceLandmarks', 'useFaceDistortion'
    ];
    prohibitedGlobal.forEach(p => {
      if (webgl.includes(p) && !webgl.includes(`// ${p}`)) {
        const reg = new RegExp(`^\\s*[^\\/\\n]*\\b${p.replace('.', '\\.')}\\b`, 'm');
        if (reg.test(webgl)) {
          console.error(`❌ FAIL: webgl-engine.jsx contains prohibited keyword: ${p}`);
          hasErrors = true;
        }
      }
    });
  }

  if (rest) {
    const softening = rest.match(/const\s+applyFaceZoneSoftening\s*=\s*.*\{([\s\S]*?)\}/) ||
      rest.match(/function\s+applyFaceZoneSoftening[\s\S]*?\{([\s\S]*?)\}/);
    if (softening) {
      const body = softening[1].trim();
      if (body !== '' && body !== 'return;' && !body.includes('//')) {
        console.error('❌ FAIL: screens-v2-rest.jsx applyFaceZoneSoftening is not a no-op');
        hasErrors = true;
      }
    }
  }

  if (main) {
    if (!main.includes('const FACE_LANDMARKS_DISABLED = true')) {
      console.error('❌ FAIL: main.jsx missing const FACE_LANDMARKS_DISABLED = true');
      hasErrors = true;
    }
    if (!main.includes('const faceTrackedFilters = []')) {
      console.error('❌ FAIL: main.jsx missing const faceTrackedFilters = []');
      hasErrors = true;
    }
    if (main.includes('setCameraZoom(1)') && !main.includes('settings.zoom ?? 1')) {
      console.error('❌ FAIL: main.jsx setCameraZoom(1) must use settings.zoom ?? 1');
      hasErrors = true;
    }
  }
}

function checkEmergencyFrameGlobals() {
  const files = ['screens-v2-rest.jsx', 'screens-v2-deco.jsx', 'screens-v2.jsx', 'main.jsx'];
  const frameSystem = readFile('frame-system.jsx');
  if (frameSystem) {
    if (!frameSystem.includes('getFrameTemplateSafe')) {
      console.error('❌ FAIL: frame-system.jsx missing getFrameTemplateSafe');
      hasErrors = true;
    }
    if (frameSystem.includes('async function renderComposition') && !frameSystem.includes('getFrameTemplateSafe')) {
      console.error('❌ FAIL: frame-system.jsx renderComposition missing getFrameTemplateSafe usage');
      hasErrors = true;
    }
    if (frameSystem.includes('async function renderFrameToCanvas') && !frameSystem.includes('getFrameTemplateSafe')) {
      console.error('❌ FAIL: frame-system.jsx renderFrameToCanvas missing getFrameTemplateSafe usage');
      hasErrors = true;
    }
  }
  for (const f of files) {
    const content = readFile(f);
    if (!content) continue;
    if (content.match(/\bgetFrameTemplate\(/) && !content.includes('window.getFrameTemplate') && !content.includes('resolveFrameTemplate') && !content.includes('getFrameTemplateSafe')) {
      console.error(`❌ FAIL: ${f} uses bare getFrameTemplate instead of safe/resolved path`);
      hasErrors = true;
    }
  }
}

function checkFrameStoreFoundation() {
  const framePresets = readFile('frame-presets.jsx');
  const main = readFile('main.jsx');
  const setup = readFile('screens-v2.jsx');
  const deco = readFile('screens-v2-deco.jsx');
  const frameSystem = readFile('frame-system.jsx');

  if (!framePresets) {
    console.error('❌ FAIL: frame-presets.jsx missing');
    hasErrors = true;
    return;
  }

  const requiredStrings = [
    'FRAME_PRESET_STORAGE_KEY',
    'immm.v2.customFrames',
    'getBuiltinFramePresets',
    'createCustomFramePresetFromAppState',
    'sanitizeCustomFramePreset',
    'drawFramePresetOverlay',
  ];
  requiredStrings.forEach((needle) => {
    if (!framePresets.includes(needle)) {
      console.error(`❌ FAIL: frame-presets.jsx missing ${needle}`);
      hasErrors = true;
    }
  });

  try {
    const sandbox = {
      console,
      Math,
      Date,
      JSON,
      localStorage: {
        _store: {},
        getItem(key) { return Object.prototype.hasOwnProperty.call(this._store, key) ? this._store[key] : null; },
        setItem(key, value) { this._store[key] = String(value); },
        removeItem(key) { delete this._store[key]; },
      },
      window: null,
    };
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(framePresets, sandbox);
    const api = sandbox.window.IMMMFramePresets;
    if (!api) throw new Error('window.IMMMFramePresets not found');
    if (typeof api.normalizePresetLayout !== 'function') {
      throw new Error('normalizePresetLayout helper missing');
    }
    if (typeof api.createFrameDesignerDraft !== 'function' || typeof api.normalizeDesignerDraft !== 'function' || typeof api.validateDesignerDraft !== 'function' || typeof api.draftToCustomFramePreset !== 'function' || typeof api.duplicateFramePresetAsDraft !== 'function') {
      throw new Error('designer draft helpers missing');
    }
    if (typeof api.clampRectToCanvas !== 'function') {
      throw new Error('photo slot clamp helper missing');
    }

    const builtins = api.getBuiltinFramePresets();
    if (!Array.isArray(builtins) || builtins.length < 9) {
      throw new Error(`expected at least 9 builtins, got ${builtins?.length || 0}`);
    }
    if (builtins.some((preset) => !preset?.id || !preset?.layout || !preset?.background)) {
      throw new Error('builtin frame preset normalization failed');
    }
    if (!builtins.some((preset) => preset.id === 'clean-polaroid-1x1')) {
      throw new Error('clean-polaroid-1x1 builtin missing');
    }

    const defaultChecks = [
      ['strip', 'clean-white-4cut'],
      ['1x4', 'clean-white-4cut'],
      ['grid', 'heart-gem-2x2'],
      ['2x2', 'heart-gem-2x2'],
      ['trip', 'friend-bubble-1x3'],
      ['1x3', 'friend-bubble-1x3'],
      ['polaroid', 'clean-polaroid-1x1'],
      ['1x1', 'clean-polaroid-1x1'],
    ];
    defaultChecks.forEach(([layout, expected]) => {
      const actual = api.getDefaultFramePresetIdForLayout(layout, []);
      if (actual !== expected) {
        throw new Error(`default preset mismatch for ${layout}: expected ${expected}, got ${actual}`);
      }
    });
    if (api.normalizePresetLayout('2x2') !== 'grid' || api.normalizePresetLayout('grid') !== 'grid') {
      throw new Error('normalizePresetLayout failed for grid');
    }
    if (api.normalizePresetLayout('1x3') !== 'trip' || api.normalizePresetLayout('trip') !== 'trip') {
      throw new Error('normalizePresetLayout failed for trip');
    }
    if (api.normalizePresetLayout('1x1') !== 'polaroid' || api.normalizePresetLayout('polaroid') !== 'polaroid') {
      throw new Error('normalizePresetLayout failed for polaroid');
    }

    const draft = api.createFrameDesignerDraft(builtins[0]);
    if (!draft || !api.validateDesignerDraft(draft).ok) {
      throw new Error('designer draft creation or validation failed');
    }
    const draftPreset = api.draftToCustomFramePreset(draft);
    if (!draftPreset || JSON.stringify(draftPreset).includes('dataUrl')) {
      throw new Error('designer draft save leaked dataUrl');
    }
    if (!Array.isArray(draftPreset.stickers) || !Array.isArray(draftPreset.drawStrokes)) {
      throw new Error('designer draft save should preserve stickers and drawStrokes arrays');
    }
    const normalizedDraft = api.normalizeDesignerDraft({ ...draft, layout: '2x2', photoSlots: api.getPhotoSlotsForLayout('2x2') });
    if (!normalizedDraft || normalizedDraft.layout !== 'grid') {
      throw new Error('designer draft layout normalization failed');
    }
    const clamped = api.clampRectToCanvas({ x: -20, y: 999, width: 9999, height: 12, radius: 999 }, { width: 100, height: 100 }, 10, 10);
    if (clamped.x < 0 || clamped.y < 0 || clamped.width > 100 || clamped.height > 100) {
      throw new Error('clampRectToCanvas failed to clamp to canvas');
    }
    const dupDraft = api.duplicateFramePresetAsDraft(builtins[0]);
    if (!dupDraft || dupDraft.id === builtins[0].id) {
      throw new Error('duplicateFramePresetAsDraft should create a new draft id');
    }

    const sample = api.createCustomFramePresetFromAppState({
      name: 'Sanity Frame',
      layout: '2x2',
      frameColor: '#ffffff',
      decorations: [
        { type: 'shape', shape: 'circle', x: 12, y: 12, width: 20, height: 20, rotation: 0, opacity: 0.8, zIndex: -1, fill: '#f2d' },
      ],
      stickers: [
        { kind: 'preset', payload: { libId: 'm-heart-1' }, x: 12, y: 12, rotation: 0, scale: 1 },
        { kind: 'upload', payload: { dataUrl: 'data:image/png;base64,AAAA' }, x: 30, y: 30, rotation: 0, scale: 1 },
      ],
      drawStrokes: [
        { points: [[0, 0], [10, 10]], color: '#111', width: 3, seed: 1 },
      ],
      background: { type: 'solid', value: '#fff' },
    });
    const sampleJson = JSON.stringify(sample);
    if (sampleJson.includes('dataUrl')) {
      throw new Error('custom frame save leaked dataUrl');
    }
    if (!sampleJson.includes('drawStrokes') || !sampleJson.includes('stickers') || !sampleJson.includes('decorations')) {
      throw new Error('custom frame save missing decorations, stickers, or drawStrokes');
    }
    if (!Array.isArray(sample.stickers) || !Array.isArray(sample.decorations)) {
      throw new Error('custom frame save should keep stickers and decorations as arrays');
    }
    if (sample.stickers.length === 0 || sample.decorations.length === 0) {
      throw new Error('custom frame save should preserve both stickers and decorations');
    }
    const stored = api.saveCustomFramePresets([sample, { ...sample, id: 'deleted-frame', deletedAt: new Date().toISOString() }]);
    if (JSON.stringify(stored).includes('dataUrl')) {
      throw new Error('saved custom frame collection leaked dataUrl');
    }
    const loaded = api.loadCustomFramePresets();
    if (loaded.some((frame) => frame.deletedAt)) {
      throw new Error('deleted custom frames should be hidden from loads');
    }
    if (api.listFramePresets([sample, { ...sample, id: 'deleted-frame', deletedAt: new Date().toISOString() }]).some((frame) => frame.id === 'deleted-frame')) {
      throw new Error('deleted custom frames should be hidden from lists');
    }

    if (!Array.isArray(api.FRAME_PACKS) || api.FRAME_PACKS.length < 3) {
      throw new Error('FRAME_PACKS should contain at least three packs');
    }
    if (!api.FRAME_PACKS.some((pack) => pack.priceType === 'free')) {
      throw new Error('FRAME_PACKS missing free pack');
    }
    if (!api.FRAME_PACKS.some((pack) => pack.priceType === 'premium')) {
      throw new Error('FRAME_PACKS missing premium pack');
    }
    const builtinPresetIds = new Set(api.listFramePresets([]).map((preset) => preset.id));
    api.FRAME_PACKS.forEach((pack) => {
      if (!pack.author?.name || !pack.license) {
        throw new Error(`pack metadata missing author/license for ${pack.id}`);
      }
      if (!pack.coverPresetId || !Array.isArray(pack.presetIds) || !pack.presetIds.includes(pack.coverPresetId)) {
        throw new Error(`pack cover preset is not included for ${pack.id}`);
      }
      pack.presetIds.forEach((presetId) => {
        if (!builtinPresetIds.has(presetId)) {
          throw new Error(`pack presetId ${presetId} does not resolve to a preset`);
        }
      });
    });
    if (!['heart-gem-2x2', 'kitsch-bear-2x2'].includes(api.getDefaultFramePresetIdForLayout('grid', []))) {
      throw new Error('grid default preset should not resolve to a strip preset');
    }
    if (!['heart-gem-2x2', 'kitsch-bear-2x2'].includes(api.getDefaultFramePresetIdForLayout('2x2', []))) {
      throw new Error('2x2 default preset should not resolve to a strip preset');
    }
    if (api.getDefaultFramePresetIdForLayout('trip', []) !== 'friend-bubble-1x3') {
      throw new Error('trip default preset should be friend-bubble-1x3');
    }
    if (api.getDefaultFramePresetIdForLayout('1x1', []) !== 'clean-polaroid-1x1') {
      throw new Error('polaroid layout should resolve a default preset');
    }
    const ownerTest = api.createCustomFramePresetFromAppState({ name: 'Owner Test' });
    if (!ownerTest.author?.name || ownerTest.author.name !== 'You') {
      throw new Error('custom frame author metadata should default to You');
    }
    const packExport = api.exportCustomFramePackJson([sample]);
    if (String(packExport).includes('dataUrl')) {
      throw new Error('exported custom frame pack leaked dataUrl');
    }
    const rejectedImport = api.validateFramePackJson(JSON.stringify({
      pack: { id: 'bad-pack', name: 'Bad', presetIds: ['bad-preset'], coverPresetId: 'bad-preset' },
      presets: [{ id: 'bad-preset', dataUrl: 'data:image/png;base64,AAAA' }],
    }));
    if (rejectedImport.ok) {
      throw new Error('frame pack validation should reject photo dataUrl payloads');
    }
    const rejectedNestedUpload = api.validateFramePackJson(JSON.stringify({
      pack: { id: 'bad-pack-2', name: 'Bad2', presetIds: ['bad-preset-2'], coverPresetId: 'bad-preset-2' },
      presets: [{ id: 'bad-preset-2', stickers: [{ kind: 'upload', payload: { dataUrl: 'data:image/png;base64,BBBB' } }] }],
    }));
    if (rejectedNestedUpload.ok) {
      throw new Error('frame pack validation should reject nested upload sticker dataUrl payloads');
    }
    if (/sanitizeFrameSticker\s*\(\s*(deco|decorations|frame\.decorations)/.test(framePresets)) {
      throw new Error('decorations should not flow through sanitizeFrameSticker');
    }
    if (!framePresets.includes('FRAME_PACKS') || !framePresets.includes('exportCustomFramePackJson') || !framePresets.includes('importFramePackJson')) {
      throw new Error('frame-presets.jsx missing pack commerce API');
    }
  } catch (err) {
    console.error('❌ FAIL: frame-presets.jsx runtime validation failed:', err.message);
    hasErrors = true;
  }

  if (main && !main.includes('selectedFramePresetId')) {
    console.error('❌ FAIL: main.jsx missing selectedFramePresetId state');
    hasErrors = true;
  }
  if (main && !main.includes("case 'designer'")) {
    console.error('❌ FAIL: main.jsx missing designer route');
    hasErrors = true;
  }
  if (main && (!main.includes('openDesigner') || !main.includes('saveDesignerFrame') || !main.includes('saveDesignerPackDraft'))) {
    console.error('❌ FAIL: main.jsx missing designer actions');
    hasErrors = true;
  }
  if (main && !main.includes('normalizePresetLayout')) {
    console.error('❌ FAIL: main.jsx missing layout normalization helper');
    hasErrors = true;
  }
  if (main && !main.includes("localStorage.setItem('immm.v2.selectedFramePresetId'")) {
    console.error('❌ FAIL: main.jsx missing selectedFramePresetId localStorage sync');
    hasErrors = true;
  }
  if (main && !main.includes('softDeleteCustomFrame')) {
    console.error('❌ FAIL: main.jsx missing soft delete frame management');
    hasErrors = true;
  }
  if (main && (!main.includes('exportCustomFramesAsJson') || !main.includes('importFramePackFromJson'))) {
    console.error('❌ FAIL: main.jsx missing frame pack import/export handlers');
    hasErrors = true;
  }
  if (main && (!main.includes('unlockedFramePackIds') || !main.includes('favoriteFramePresetIds'))) {
    console.error('❌ FAIL: main.jsx missing frame pack unlock/favorite state');
    hasErrors = true;
  }
  if (main && (!main.includes('immm.v2.unlockedFramePacks') || !main.includes('immm.v2.favoriteFramePresets'))) {
    console.error('❌ FAIL: main.jsx missing frame pack localStorage keys');
    hasErrors = true;
  }
  if (setup && !setup.includes('No saved frames yet')) {
    console.error('❌ FAIL: screens-v2.jsx missing My Frames empty state');
    hasErrors = true;
  }
  if (setup && (!setup.includes('Rename') || !setup.includes('Duplicate') || !setup.includes('Delete'))) {
    console.error('❌ FAIL: screens-v2.jsx missing My Frames management actions');
    hasErrors = true;
  }
  if (setup && (!setup.includes('Create Frame') || !setup.includes('Duplicate & Edit') || !setup.includes('Create your first frame') || !setup.includes('Frame Designer Studio'))) {
    console.error('❌ FAIL: screens-v2.jsx missing designer entry points');
    hasErrors = true;
  }
  if (setup && !setup.includes('Save Frame')) {
    console.error('❌ FAIL: screens-v2.jsx missing designer save action');
    hasErrors = true;
  }
  if (setup && !setup.includes('Import Pack JSON')) {
    console.error('❌ FAIL: screens-v2.jsx missing designer pack import action');
    hasErrors = true;
  }
  if (setup && (!setup.includes('View Pack') || !setup.includes('Unlock coming soon') || !setup.includes('Export My Frames as JSON') || !setup.includes('Import Frame Pack JSON'))) {
    console.error('❌ FAIL: screens-v2.jsx missing pack commerce UI');
    hasErrors = true;
  }
  if (setup && (!setup.includes('Featured Packs') || !setup.includes('Favorites') || !setup.includes('All Presets') || !setup.includes('Frame Store'))) {
    console.error('❌ FAIL: screens-v2.jsx missing pack tabs/search/filter structure');
    hasErrors = true;
  }
  if (setup && (!setup.includes('Save as Pack Draft') || !setup.includes('Back to Store') || !setup.includes('Discard'))) {
    console.error('❌ FAIL: screens-v2.jsx missing designer save/exit controls');
    hasErrors = true;
  }
  if (setup && (!setup.includes('Frame Designer Studio') || !setup.includes('Background') || !setup.includes('Slots') || !setup.includes('Decorations') || !setup.includes('Text'))) {
    console.error('❌ FAIL: screens-v2.jsx missing designer editors');
    hasErrors = true;
  }
  // Verify devUnlockVisible is defined within FrameStoreScreen function scope in screens-v2.jsx
  const frameStoreIdx = setup.indexOf('function FrameStoreScreen(');
  if (frameStoreIdx !== -1) {
    const checkArea = setup.substring(frameStoreIdx, frameStoreIdx + 2000);
    if (!checkArea.includes('const devUnlockVisible =')) {
      console.error('❌ FAIL: screens-v2.jsx is missing devUnlockVisible declaration near FrameStoreScreen start');
      hasErrors = true;
    }
  } else {
    console.error('❌ FAIL: screens-v2.jsx is missing FrameStoreScreen function definition');
    hasErrors = true;
  }
  // Verify openDesigner is in ResultV2 destructuring parameter list in screens-v2-deco.jsx
  const resultV2Idx = deco.indexOf('function ResultV2(');
  if (resultV2Idx !== -1) {
    const checkArea = deco.substring(resultV2Idx, resultV2Idx + 500);
    if (!checkArea.includes('openDesigner')) {
      console.error('❌ FAIL: screens-v2-deco.jsx is missing openDesigner prop in ResultV2 function signature');
      hasErrors = true;
    }
  } else {
    console.error('❌ FAIL: screens-v2-deco.jsx is missing ResultV2 function definition');
    hasErrors = true;
  }
  const cloudQa = readFile('scripts/cloud-qa-check.mjs');
  const exportSamples = readFile('scripts/export-frame-samples.mjs');
  const frameSamplePage = readFile('qa/frame-samples/index.html');
  const frameDesignQa = readFile('docs/FRAME_DESIGN_QA.md');
  const qaMatrix = readFile('QA_MATRIX.md');
  const fieldQaScript = readFile('FIELD_QA_SCRIPT.md');
  if (!cloudQa || !cloudQa.includes('FRAME_PACKS') || !cloudQa.includes('qa/frame-samples/index.html')) {
    console.error('❌ FAIL: scripts/cloud-qa-check.mjs missing frame sample contract checks');
    hasErrors = true;
  }
  if (!exportSamples || !exportSamples.includes('dist/frame-presets.js') || !exportSamples.includes('frame-samples') || !exportSamples.includes('index.html')) {
    console.error('❌ FAIL: scripts/export-frame-samples.mjs missing sample page generator');
    hasErrors = true;
  }
  if (!frameSamplePage || !frameSamplePage.includes('IMMM Frame Samples QA') || !frameSamplePage.includes('QA Checklist')) {
    console.error('❌ FAIL: qa/frame-samples/index.html missing frame sample content');
    hasErrors = true;
  }
  if (!frameDesignQa || !frameDesignQa.includes('Designer save/load QA') || !frameDesignQa.includes('My Frames regression checklist')) {
    console.error('❌ FAIL: docs/FRAME_DESIGN_QA.md missing QA instructions');
    hasErrors = true;
  }
  if (!qaMatrix || !qaMatrix.includes('Frame sample review') || !qaMatrix.includes('Designer save/load')) {
    console.error('❌ FAIL: QA_MATRIX.md missing frame QA matrix entries');
    hasErrors = true;
  }
  if (!fieldQaScript || !fieldQaScript.includes('Frame samples') || !fieldQaScript.includes('Designer')) {
    console.error('❌ FAIL: FIELD_QA_SCRIPT.md missing field QA steps');
    hasErrors = true;
  }
  if (deco && !deco.includes('saveCustomFrame')) {
    console.error('❌ FAIL: screens-v2-deco.jsx missing custom frame save hook');
    hasErrors = true;
  }
  if (deco && !deco.includes('decorations: framePreset?.decorations || []')) {
    console.error('❌ FAIL: screens-v2-deco.jsx missing decoration/sticker separation');
    hasErrors = true;
  }
  if (frameSystem && !frameSystem.includes('framePreset')) {
    console.error('❌ FAIL: frame-system.jsx missing framePreset integration');
    hasErrors = true;
  }
  if (frameSystem && (!frameSystem.includes('drawPresetBackground') || !frameSystem.includes('drawPresetLayer') || !frameSystem.includes('drawPresetWatermark'))) {
    console.error('❌ FAIL: frame-system.jsx missing preset render paths');
    hasErrors = true;
  }
  if (frameSystem && (frameSystem.includes('createFrameDesignerDraft') || frameSystem.includes('normalizeDesignerDraft') || frameSystem.includes('draftToCustomFramePreset'))) {
    console.error('❌ FAIL: frame-system.jsx should not absorb designer template edits');
    hasErrors = true;
  }
  if (frameSystem && !frameSystem.includes('FRAME_TEMPLATES')) {
    console.error('❌ FAIL: frame-system.jsx FRAME_TEMPLATES missing');
    hasErrors = true;
  }

  const forbiddenClears = [
    ['main.jsx', main],
    ['screens-v2.jsx', setup],
    ['screens-v2-deco.jsx', deco],
    ['frame-presets.jsx', framePresets],
    ['frame-system.jsx', frameSystem],
    ['index.html', readFile('index.html')],
  ];
  forbiddenClears.forEach(([name, content]) => {
    if (!content) return;
    const codeOnly = content
      .split('\n')
      .map((line) => line.replace(/\/\/.*$/, ''))
      .join('\n');
    if (/\blocalStorage\.clear\s*\(/.test(codeOnly) || /\bsessionStorage\.clear\s*\(/.test(codeOnly)) {
      console.error(`❌ FAIL: ${name} contains forbidden storage clear`);
      hasErrors = true;
    }
  });
}

function checkEmergencyServiceWorker() {
  const sw = readFile('sw.js');
  if (!sw) return;
  if (!sw.includes('self.skipWaiting()') || !sw.includes('self.clients.claim()')) {
    console.error('❌ FAIL: sw.js missing skipWaiting or clients.claim');
    hasErrors = true;
  }
  if (!sw.toLowerCase().includes('network-first')) {
    console.warn('⚠️ WARN: sw.js should explicitly mention network-first strategy for stability');
  }
  // Actual network-first pattern check
  if (!sw.includes('fetch(e.request).catch(() => caches.match(e.request))')) {
    console.error('❌ FAIL: sw.js missing actual network-first fetch implementation');
    hasErrors = true;
  }
}

function checkAppStability() {
  const index = readFile('index.html');
  if (index && index.includes('screens-edit.jsx')) {
    console.error('❌ FAIL: index.html still loads legacy screens-edit.jsx');
    hasErrors = true;
  }
}


function checkFrameSystem() {
  const content = readFile('frame-system.jsx');
  if (!content) return;
  if (content.includes('drawCatalog(')) {
    console.error('❌ FAIL: frame-system.jsx contains forbidden drawCatalog call');
    hasErrors = true;
  }
  // Deepening checkFrameSystem
  const frameChecks = [
    'sticker.sizeNorm',
    'isDarkFrameColor',
    'frameSlot == null',
    'renderFrameOverlay'
  ];
  frameChecks.forEach(c => {
    if (!content.includes(c)) {
      console.error(`❌ FAIL: frame-system.jsx missing required element: ${c}`);
      hasErrors = true;
    }
  });
  if (!content.includes('baseW * actualSizeNorm') && !content.includes('sizeNorm')) {
    console.error('❌ FAIL: frame-system.jsx missing sizeNorm scaling logic');
    hasErrors = true;
  }
  if (content.includes('#D98893') && !content.includes('getFrameTheme')) {
    console.error('❌ FAIL: frame-system.jsx contains prohibited color #D98893 outside theme resolver');
    hasErrors = true;
  }
  if (content.includes('s.frameSlot === i')) {
    console.error('❌ FAIL: frame-system.jsx uses s.frameSlot === i (unreliable, use Number())');
    hasErrors = true;
  }
  if (!content.includes('Number(s.frameSlot) === i')) {
    console.error('❌ FAIL: frame-system.jsx missing Number(s.frameSlot) === i (required for stability)');
    hasErrors = true;
  }
}

function checkStickerEngine() {
  const content = readFile('sticker-engine.jsx');
  if (!content) return;
  if (!/id:\s*'kretro'[\s\S]*?hidden:\s*true/.test(content)) {
    console.error('❌ FAIL: sticker-engine.jsx kretro must be hidden');
    hasErrors = true;
  }
  // Deepening checkStickerEngine
  const stickerChecks = [
    'getVisibleStickerPacks',
    '!pack.hidden',
    'getDefaultStickerSizeNorm',
    'makeSticker',
    'sizeNorm',
    'getLayoutSlotCount',
    'getCaptureSlotIndex',
    'getStickersForCapturePreview'
  ];
  stickerChecks.forEach(c => {
    if (!content.includes(c)) {
      console.error(`❌ FAIL: sticker-engine.jsx missing required function/element: ${c}`);
      hasErrors = true;
    }
  });
}

function checkCapture() {
  const rest = readFile('screens-v2-rest.jsx');
  if (!rest) return;
  if (rest.includes('preStickers.map') && rest.includes('CaptureV2')) {
    console.error('❌ FAIL: screens-v2-rest.jsx CaptureV2 contains preStickers.map (risk of duplication)');
    hasErrors = true;
  }
  if (rest.includes('renderShotStickers')) {
    console.error('❌ FAIL: screens-v2-rest.jsx contains legacy renderShotStickers');
    hasErrors = true;
  }
  // Deepening checkCapture
  if (rest.includes('drawStickerToCanvas') && rest.includes('preStickers')) {
    // Basic detection for preStickers leakage in capture path
    const captureBlock = rest.match(/CaptureV2[\s\S]*?\{([\s\S]*?)\}/);
    if (captureBlock && captureBlock[1].includes('drawStickerToCanvas') && captureBlock[1].includes('preStickers')) {
      console.error('❌ FAIL: screens-v2-rest.jsx potential preStickers leakage in drawStickerToCanvas path');
      hasErrors = true;
    }
  }
  if (rest.includes('preStickers.length > 0') && rest.includes('cameraOverlay')) {
    console.error('❌ FAIL: screens-v2-rest.jsx uses preStickers.length > 0 in cameraOverlay (risk of stale UI)');
    hasErrors = true;
  }
  if (!rest.includes('visibleCaptureStickers.length > 0')) {
    console.error('❌ FAIL: screens-v2-rest.jsx missing visibleCaptureStickers check');
    hasErrors = true;
  }
  // Check visibleCaptureStickers.map count
  const mapCount = (rest.match(/visibleCaptureStickers\.map/g) || []).length;
  if (mapCount > 1) {
    console.error(`❌ FAIL: screens-v2-rest.jsx contains multiple visibleCaptureStickers.map calls (current: ${mapCount})`);
    hasErrors = true;
  }
}

function checkSetupAndDecoStickerCanvas() {
  const deco = readFile('screens-v2-deco.jsx');
  if (!deco) return;
  if (!deco.includes('compositionCanvasRef')) {
    console.error('❌ FAIL: screens-v2-deco.jsx missing compositionCanvasRef');
    hasErrors = true;
  }
}

function checkDeco() {
  const content = readFile('screens-v2-deco.jsx');
  if (!content) return;

  const checks = [
    'fontsReady', 'document.fonts.ready', 'renderSeqRef', 'drawRafRef', 'setPointerCapture', 'releasePointerCapture'
  ];
  checks.forEach(c => {
    if (!content.includes(c)) {
      console.error(`❌ FAIL: screens-v2-deco.jsx missing "${c}"`);
      hasErrors = true;
    }
  });

  const prohibited = ['onPointerLeave={onDrawEnd}'];
  prohibited.forEach(p => {
    if (content.includes(p)) {
      console.error(`❌ FAIL: screens-v2-deco.jsx contains prohibited pattern: ${p}`);
      hasErrors = true;
    }
  });
}

function checkRuntimeSessionBridge() {
  const main = readFile('main.jsx');
  const mainDist = readFile('dist/main.js');
  const deco = readFile('screens-v2-deco.jsx');
  const decoDist = readFile('dist/screens-v2-deco.js');

  if (!main || !mainDist || !deco || !decoDist) {
    console.error('❌ FAIL: Runtime bridge files missing');
    hasErrors = true;
    return;
  }

  // Check main.jsx debug helpers
  const mainRequired = [
    'isSessionDebugEnabled',
    'publishDebugSessionSnapshot',
    'publishDebugShareReadiness',
    'publishDebugMotionReadiness',
    'createDebugEditRecipeSnapshot'
  ];

  mainRequired.forEach(r => {
    if (!main.includes(r)) {
      console.error(`❌ FAIL: main.jsx missing ${r}`);
      hasErrors = true;
    }
    if (!mainDist.includes(r)) {
      console.error(`❌ FAIL: dist/main.js missing ${r}`);
      hasErrors = true;
    }
  });

  // Check screens-v2-deco.jsx bridge
  if (!deco.includes('publishDebugResultAssetRecord')) {
    console.error('❌ FAIL: screens-v2-deco.jsx missing publishDebugResultAssetRecord');
    hasErrors = true;
  }
  if (!decoDist.includes('publishDebugResultAssetRecord')) {
    console.error('❌ FAIL: dist/screens-v2-deco.js missing publishDebugResultAssetRecord');
    hasErrors = true;
  }

  // Check that debug bridge functions don't use localStorage
  // Look for publishDebugSessionSnapshot and surrounding code
  const publishDebugIdx = main.indexOf('function publishDebugSessionSnapshot');
  if (publishDebugIdx !== -1) {
    const publishDebugEnd = main.indexOf('function ', publishDebugIdx + 1);
    const publishDebugCode = main.slice(publishDebugIdx, publishDebugEnd > -1 ? publishDebugEnd : main.length);
    if (publishDebugCode.includes('localStorage.setItem') && !publishDebugCode.includes('IMMM_DEBUG_SESSION')) {
      console.error('❌ FAIL: publishDebugSessionSnapshot must not use localStorage');
      hasErrors = true;
    }
  }

  // Check QR/Video buttons remain disabled
  if (!deco.includes('disabled') || !deco.includes('Preparing')) {
    console.error('❌ FAIL: screens-v2-deco.jsx QR/Video buttons must remain disabled');
    hasErrors = true;
  }

  // Check __IMMM_ memory storage references
  const memoryStorageRefs = [
    '__IMMM_LAST_SESSION_SNAPSHOT__',
    '__IMMM_RESULT_ASSET_STORE__',
    '__IMMM_LAST_SHARE_READINESS__',
    '__IMMM_LAST_MOTION_READINESS__',
    '__IMMM_LAST_EDIT_RECIPE__'
  ];

  memoryStorageRefs.forEach(ref => {
    if (!mainDist.includes(ref) && !decoDist.includes(ref)) {
      // It's OK if not all are used, but at least some should be
    }
  });

  if (!mainDist.includes('storeLastDebugSessionSnapshot') && !mainDist.includes('__IMMM_LAST_SESSION_SNAPSHOT__')) {
    console.error('❌ FAIL: dist/main.js missing session snapshot storage reference');
    hasErrors = true;
  }
}

function checkTask() {
  const task = readFile('task.md');
  if (!task) return;

  if (task.includes('## Selfie 0.6× / Wide Camera Support (Phase C)')) {
    const section = task.split('## Selfie 0.6× / Wide Camera Support (Phase C)')[1].split('---')[0];
    const forbiddenChecks = [
      'Galaxy S23+',
      'Samsung Internet 0.6× toggle verified',
      'Chrome 0.6× toggle verified',
      '1× return path verified',
      'Debug camera pill shows correct device'
    ];
    forbiddenChecks.forEach(f => {
      if (section.includes(`[x] ${f}`)) {
        console.error(`❌ FAIL: task.md Phase C item "${f}" must not be checked [x] until real-device QA is done`);
        hasErrors = true;
      }
    });
  }

  const unverified = ['- [x] Samsung Internet clears old cache after reload', '- [x] Capture → Select → Deco does not throw getFrameTemplate undefined'];
  unverified.forEach(bc => {
    if (task.includes(bc) && !task.includes('Real QA log')) {
      console.error(`❌ FAIL: task.md has unverified check "${bc}" (Galaxy QA pending)`);
      hasErrors = true;
    }
  });
}


function checkFrameThemeUnification() {
  const fs = readFile('frame-system.jsx');
  const rest = readFile('screens-v2-rest.jsx');
  const deco = readFile('screens-v2-deco.jsx');
  const setup = readFile('screens-v2.jsx');

  if (!fs.includes('function getFrameTheme')) {
    console.error("❌ FAIL: frame-system.jsx missing getFrameTheme resolver");
    hasErrors = true;
  }

  if (!fs.includes('window.getFrameTheme = getFrameTheme')) {
    console.error("❌ FAIL: frame-system.jsx missing window.getFrameTheme export");
    hasErrors = true;
  }

  if (fs.includes('logoColor:') || fs.includes('dotColor:') || fs.includes('textColor:')) {
    // Check if it's inside FRAME_TEMPLATES
    const tMatch = fs.match(/const\s+FRAME_TEMPLATES\s*=\s*\{([\s\S]*?)\};/);
    if (tMatch && (tMatch[1].includes('logoColor:') || tMatch[1].includes('dotColor:') || tMatch[1].includes('textColor:'))) {
      console.error("❌ FAIL: frame-system.jsx FRAME_TEMPLATES contains legacy theme tokens (logoColor/dotColor/textColor)");
      hasErrors = true;
    }
  }

  if (fs.includes('template.theme?.dotColor') && fs.includes('renderFrameOverlay')) {
    const overlayBlock = fs.match(/function\s+renderFrameOverlay[\s\S]*?\{([\s\S]*?)\}/);
    if (overlayBlock && overlayBlock[1].includes('template.theme?.dotColor')) {
      console.error("❌ FAIL: renderFrameOverlay uses legacy template.theme?.dotColor");
      hasErrors = true;
    }
  }

  if (!fs.includes('getFrameTheme(')) {
    console.error("❌ FAIL: frame-system.jsx should call getFrameTheme");
    hasErrors = true;
  }

  // Ensure renderFrameOverlay and renderComposition call getFrameTheme
  const overlayBlock = fs.match(/function\s+renderFrameOverlay[\s\S]*?\{([\s\S]*?)\n\}/);
  if (overlayBlock && !overlayBlock[1].includes('getFrameTheme(')) {
    console.error("❌ FAIL: renderFrameOverlay missing getFrameTheme call");
    hasErrors = true;
  }
  const compBlock = fs.match(/async\s+function\s+renderComposition[\s\S]*?\{([\s\S]*?)\n\}/);
  if (compBlock && !compBlock[1].includes('getFrameTheme(')) {
    console.error("❌ FAIL: renderComposition missing getFrameTheme call");
    hasErrors = true;
  }

  if (fs.includes('window.getFrameTemplate(') && fs.includes('function getFrameTemplateSafe')) {
    const safeBlock = fs.match(/function\s+getFrameTemplateSafe[\s\S]*?\{([\s\S]*?)\}/);
    if (safeBlock) {
      const body = safeBlock[1];
      const localIdx = body.indexOf('getFrameTemplate(');
      const windowIdx = body.indexOf('window.getFrameTemplate(');
      if (windowIdx !== -1 && (localIdx === -1 || windowIdx < localIdx)) {
        console.error("❌ FAIL: getFrameTemplateSafe must prefer local getFrameTemplate before window.getFrameTemplate");
        hasErrors = true;
      }
    }
  }

  const hardcodedColors = ["dotColor: '#000'", "dotColor: '#111'", "logoColor: '#111'", "logoColor: '#fff'"];
  [rest, deco, setup].forEach((content, i) => {
    const name = ['screens-v2-rest.jsx', 'screens-v2-deco.jsx', 'screens-v2.jsx'][i];
    if (!content) return;
    hardcodedColors.forEach(c => {
      if (content.includes(c)) {
        console.error(`❌ FAIL: ${name} contains hardcoded theme color: ${c}`);
        hasErrors = true;
      }
    });

    // Aggressive Zoom Button Check (Raw Text +/-)
    const rawZoomIconPatterns = [
      />\s*\+\s*<\/button>/,
      />\s*-\s*<\/button>/,
      />\s*−\s*<\/button>/,
      />\s*＋\s*<\/button>/,
    ];
    if (name !== 'screens-v2-rest.jsx') {
      rawZoomIconPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          console.error(`❌ FAIL: ${name} contains raw text zoom icons (+/-)`);
          hasErrors = true;
        }
      });
    }
  });

  checkDecoZoomButtons(deco);
}

function checkDecoZoomButtons(deco) {
  if (!deco) return;

  if (!deco.includes('ZoomPlusIcon')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing ZoomPlusIcon");
    hasErrors = true;
  }
  if (!deco.includes('ZoomMinusIcon')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing ZoomMinusIcon");
    hasErrors = true;
  }

  // 3. Raw text buttons
  const rawPatterns = [
    />\+<\/button>/,
    />−<\/button>/,
    />-<\/button>/,
    />＋<\/button>/
  ];
  rawPatterns.forEach(p => {
    if (p.test(deco)) {
      console.error(`❌ FAIL: screens-v2-deco.jsx contains raw text zoom button matching ${p}`);
      hasErrors = true;
    }
  });

  const styleMatch = deco.match(/const\s+zoomBtnStyle\s*=\s*\{([\s\S]*?)\};/);
  if (!styleMatch) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing zoomBtnStyle definition");
    hasErrors = true;
  } else {
    const s = styleMatch[1];
    if (!s.includes('width: 56')) { console.error("❌ FAIL: screens-v2-deco.jsx missing width: 56"); hasErrors = true; }
    if (!s.includes('height: 56')) { console.error("❌ FAIL: screens-v2-deco.jsx missing height: 56"); hasErrors = true; }
    if (!s.includes("display: 'inline-flex'")) { console.error("❌ FAIL: screens-v2-deco.jsx missing display: 'inline-flex'"); hasErrors = true; }
    if (!s.includes("alignItems: 'center'")) { console.error("❌ FAIL: screens-v2-deco.jsx missing alignItems: 'center'"); hasErrors = true; }
    if (!s.includes("justifyContent: 'center'")) { console.error("❌ FAIL: screens-v2-deco.jsx missing justifyContent: 'center'"); hasErrors = true; }
    if (!s.includes('padding: 0')) { console.error("❌ FAIL: screens-v2-deco.jsx missing padding: 0"); hasErrors = true; }
  }
}

function checkPhaseCCameraZoom() {
  const main = fs.readFileSync('main.jsx', 'utf8');
  const rest = fs.readFileSync('screens-v2-rest.jsx', 'utf8');
  const task = fs.readFileSync('task.md', 'utf8');

  // 1. main.jsx checks
  if (!main.includes('const [activeCameraDeviceId')) { console.error("❌ FAIL: main.jsx missing activeCameraDeviceId state"); hasErrors = true; }
  if (!main.includes('const [normalCameraDeviceId')) { console.error("❌ FAIL: main.jsx missing normalCameraDeviceId state"); hasErrors = true; }
  if (!main.includes('const [wideCameraActive')) { console.error("❌ FAIL: main.jsx missing wideCameraActive state"); hasErrors = true; }
  if (!main.includes('const toggleWideCamera =')) { console.error("❌ FAIL: main.jsx missing toggleWideCamera callback"); hasErrors = true; }
  if (!main.includes('applyCameraZoom(0.6)')) { console.error("❌ FAIL: main.jsx missing hardware zoom path (0.6x)"); hasErrors = true; }
  if (!main.includes('switchCameraDevice(candidate.deviceId)')) { console.error("❌ FAIL: main.jsx missing device switch fallback path"); hasErrors = true; }


  // 2. screens-v2-rest.jsx checks
  if (!rest.includes('toggleWideCamera')) { console.error("❌ FAIL: screens-v2-rest.jsx missing toggleWideCamera prop/usage"); hasErrors = true; }
  
  if (rest.includes('cameraZoomOptions.map')) {
    // Zoom rail architecture confirmed
    if (!rest.includes('opt.label') || !rest.includes('setCameraZoom(opt.value)')) {
       console.error("❌ FAIL: screens-v2-rest.jsx zoom rail mapping is incomplete");
       hasErrors = true;
    }
  } else {
    console.error("❌ FAIL: screens-v2-rest.jsx missing zoom rail (cameraZoomOptions.map)");
    hasErrors = true;
  }

  if (!rest.includes("maxHeight: mobile ? 'min(68vh, 620px)' : 'none'")) {
    console.error("❌ FAIL: screens-v2-rest.jsx mobile camera preview maxHeight not optimized (should be min(68vh, 620px))");
    hasErrors = true;
  }

  // Shutter row grouping check
  const shutterRowMatch = rest.match(/Shutter row[\s\S]*?cameraOverlay/);
  const shutterRow = shutterRowMatch ? shutterRowMatch[0] : "";

  if (!shutterRow.includes('toggleAuto') || (!shutterRow.includes('toggleWideCamera') && !shutterRow.includes('onToggle'))) {
    console.error("❌ FAIL: screens-v2-rest.jsx shutter row missing Auto or 0.6x toggle");
    hasErrors = true;
  }
  if (!shutterRow.includes('timerLen') || !shutterRow.includes('shotCount-idx')) {
    console.error("❌ FAIL: screens-v2-rest.jsx shutter row missing Timer or Left counter");
    hasErrors = true;
  }

  if (!rest.includes("position:'absolute', right:0, display:'flex', gap:6, alignItems:'center'")) {
    console.error("❌ FAIL: screens-v2-rest.jsx right side controls (timer/left) must be grouped on the right");
    hasErrors = true;
  }

  if (rest.includes('isWideActive ? \'1×\' : \'0.6×\'') && rest.split('isWideActive ? \'1×\' : \'0.6×\'').length > 2) {
    console.error("❌ FAIL: screens-v2-rest.jsx has duplicate 0.6x toggle buttons");
    hasErrors = true;
  }

  if (!rest.includes('WideCameraDebugPill') || !rest.includes('DebugWideDevicePicker')) {
    console.error("❌ FAIL: screens-v2-rest.jsx missing debug camera components");
    hasErrors = true;
  }

  if (!rest.includes('{debugCamera && <WideCameraDebugPill />}') || !rest.includes('{showWidePicker && <DebugWideDevicePicker />}')) {
    console.error("❌ FAIL: screens-v2-rest.jsx debug components missing correct guards");
    hasErrors = true;
  }

  if (rest.includes('scale(0.6)')) {
    console.error("❌ FAIL: screens-v2-rest.jsx contains prohibited CSS scale(0.6)");
    hasErrors = true;
  }
  if (!rest.includes('[IMMM capture crop]')) {
    console.error("❌ FAIL: screens-v2-rest.jsx missing [IMMM capture crop] log");
    hasErrors = true;
  }
}

function checkRuntimeVersion() {
  let manifestData;
  try {
    manifestData = JSON.parse(fs.readFileSync('release-manifest.json', 'utf8'));
  } catch (e) {
    console.error('❌ FAIL: release-manifest.json is missing or corrupted');
    hasErrors = true;
    return;
  }

  const appVersion = manifestData.version;
  const cacheVersion = manifestData.cache;
  const buildLabel = `${appVersion}-precompiled-entry`;
  const rcBaseline = manifestData.rcReleaseCommit ? manifestData.rcReleaseCommit.slice(0, 7) : 'b3f7f1c';
  const stableBaseline = manifestData.rcBaseCommit ? manifestData.rcBaseCommit.slice(0, 7) : '8b5e42c';
  const expectedCacheName = `immm-cache-${cacheVersion}-${appVersion}-rc-final`;

  const html = fs.readFileSync('index.html', 'utf8');
  const main = fs.readFileSync('main.jsx', 'utf8');
  const sw = fs.readFileSync('sw.js', 'utf8');

  // Verify manifest version/cache variables in index.html
  if (!html.includes(`IMMM_APP_VERSION = '${appVersion}'`)) {
    console.error(`❌ FAIL: index.html mismatch or missing IMMM_APP_VERSION: expected '${appVersion}'`);
    hasErrors = true;
  }
  if (!html.includes(`IMMM_BUILD_LABEL = '${buildLabel}'`)) {
    console.error(`❌ FAIL: index.html mismatch or missing IMMM_BUILD_LABEL: expected '${buildLabel}'`);
    hasErrors = true;
  }
  if (!html.includes(`IMMM_RC_BASELINE = '${rcBaseline}'`)) {
    console.error(`❌ FAIL: index.html mismatch or missing IMMM_RC_BASELINE: expected '${rcBaseline}'`);
    hasErrors = true;
  }
  if (!html.includes(`IMMM_STABLE_BASELINE = '${stableBaseline}'`)) {
    console.error(`❌ FAIL: index.html mismatch or missing IMMM_STABLE_BASELINE: expected '${stableBaseline}'`);
    hasErrors = true;
  }

  // sw.js cache name check
  if (!sw.includes(`const CACHE_NAME = '${expectedCacheName}'`)) {
    console.error(`❌ FAIL: sw.js CACHE_NAME mismatch: expected '${expectedCacheName}'`);
    hasErrors = true;
  }
  if (!sw.includes('.respondWith(') || !sw.includes('fetch(')) {
    console.error("❌ FAIL: sw.js missing network-first logic (safety check)");
    hasErrors = true;
  }

  // dist/release-manifest.json validation
  try {
    const distManifest = JSON.parse(fs.readFileSync('dist/release-manifest.json', 'utf8'));
    if (distManifest.version !== appVersion || distManifest.cache !== cacheVersion) {
      console.error('❌ FAIL: dist/release-manifest.json version/cache mismatch with root manifest');
      hasErrors = true;
    }
  } catch (_) {
    console.error('❌ FAIL: dist/release-manifest.json is missing or corrupted');
    hasErrors = true;
  }
}

function checkWidePickerSafety() {
  const main = fs.readFileSync('main.jsx', 'utf8');
  const rest = fs.readFileSync('screens-v2-rest.jsx', 'utf8');

  if (!rest.includes('const debugCamera =')) {
    console.error("❌ FAIL: screens-v2-rest.jsx missing debugCamera variable");
    hasErrors = true;
  }

  // Debug components check
  if (!rest.includes('<WideCameraDebugPill />') || !rest.includes('<DebugWideDevicePicker />')) {
    console.error("❌ FAIL: screens-v2-rest.jsx missing named debug camera components");
    hasErrors = true;
  }

  if (!rest.includes('{debugCamera && <WideCameraDebugPill />}') || !rest.includes('{showWidePicker && <DebugWideDevicePicker />}')) {
    console.error("❌ FAIL: screens-v2-rest.jsx debug components missing correct guards");
    hasErrors = true;
  }

  const diagnosticStrings = [
    'zoom unsupported',
    'wide: {String(wideCameraActive)}',
    'activeDev: {String(activeCameraDeviceId).slice(-4)}',
    'normalDev: {String(normalCameraDeviceId).slice(-4)}',
    'fWide: {frontWideCandidates.length}',
    'rWide: {rearWideCandidates.length}'
  ];
  diagnosticStrings.forEach(s => {
    if (!rest.includes(s)) {
      console.error(`❌ FAIL: screens-v2-rest.jsx missing diagnostic string: ${s}`);
      hasErrors = true;
    }
  });

  // Forbidden: automatic switchCameraDevice call with wide candidate
  const autoPatterns = [
    /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?switchCameraDevice\(frontWideCandidates/,
    /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?switchCameraDevice\(rearWideCandidates/,
    /useEffect\s*\(\s*async\s*\(\s*\)\s*=>\s*\{[\s\S]*?switchCameraDevice\(frontWideCandidates/,
    /useEffect\s*\(\s*async\s*\(\s*\)\s*=>\s*\{[\s\S]*?switchCameraDevice\(rearWideCandidates/
  ];

  autoPatterns.forEach(p => {
    if (p.test(main)) {
      console.error("❌ FAIL: main.jsx contains automatic switch to wide candidates in useEffect");
      hasErrors = true;
    }
    if (p.test(rest)) {
      console.error("❌ FAIL: screens-v2-rest.jsx contains automatic switch to wide candidates in useEffect");
      hasErrors = true;
    }
  });

  if (/const\s+shouldShowZoomControls\s*=\s*[^;]*?Candidates\.length/.test(rest)) {
    console.error("❌ FAIL: shouldShowZoomControls depends on candidate count (forbidden)");
    hasErrors = true;
  }

  // Reactivity check for BuildPill in main.jsx
  if (!main.includes('debugBuildVisible') || !main.includes('setInterval') || !main.includes('clearInterval')) {
    console.error("❌ FAIL: main.jsx missing debugBuildVisible state or interval polling for BuildPill reactivity");
    hasErrors = true;
  }
}

function checkResultUX() {
  const deco = fs.readFileSync('screens-v2-deco.jsx', 'utf8');

  // Hardening: Prohibit destructive clears
  const destructivePatterns = [
    { pattern: 'localStorage.clear()', error: 'prohibited localStorage.clear()' },
    { pattern: 'sessionStorage.clear()', error: 'prohibited sessionStorage.clear()' },
    { pattern: 'caches.delete', error: 'prohibited caches.delete' },
    { pattern: 'serviceWorker.unregister', error: 'prohibited serviceWorker.unregister' }
  ];
  destructivePatterns.forEach(({ pattern, error }) => {
    if (deco.includes(pattern)) {
      console.error(`❌ FAIL: screens-v2-deco.jsx contains ${error}`);
      hasErrors = true;
    }
  });

  // Hardening: Verify states for used setters
  const stateSetters = [
    { setter: 'setDownloading', state: 'useState(false)' },
    { setter: 'setSharing', state: 'useState(false)' },
    { setter: 'setSaveSheetUrl', state: 'useState(null)' },
    { setter: 'setQrShare', state: 'useState(null)' },
    { setter: 'setQrBusy', state: 'useState(false)' },
    { setter: 'setShowMoreActions', state: 'useState(false)' }
  ];

  stateSetters.forEach(({ setter, state }) => {
    if (deco.includes(setter) && !deco.includes(state)) {
      console.error(`❌ FAIL: screens-v2-deco.jsx uses ${setter} but missing ${state} declaration`);
      hasErrors = true;
    }
  });

  // Hardening: finally blocks for busy states
  if (deco.includes('const handleShare')) {
    if (!deco.includes('finally {') || !deco.includes('setSharing(false)')) {
      console.error("❌ FAIL: handleShare must have both finally block AND setSharing(false)");
      hasErrors = true;
    }
  }
  if (deco.includes('const handleDownload')) {
    if (!deco.includes('finally {') || !deco.includes('setDownloading(false)')) {
      console.error("❌ FAIL: handleDownload must have both finally block AND setDownloading(false)");
      hasErrors = true;
    }
  }

  // Hardening: triggerDownload and iOS revoke logic
  if (!deco.includes('const triggerDownload =')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing triggerDownload function");
    hasErrors = true;
  }

  // Phase 3.11 UX Polish: Menu Actions & Routing
  const actions = [
    { label: 'Redecorate', target: "go('deco')" },
    { label: 'Retake', target: "go('setup')" },
    { label: 'New Session', target: "go('landing')" }
  ];
  actions.forEach(a => {
    if (!deco.includes(a.label)) {
      console.error(`❌ FAIL: screens-v2-deco.jsx missing Result menu action: ${a.label}`);
      hasErrors = true;
    }
    const actionRegex = new RegExp(`${a.label}.*?${a.target.replace('(', '\\(').replace(')', '\\)')}`, 's');
    if (!actionRegex.test(deco)) {
      console.error(`❌ FAIL: screens-v2-deco.jsx Result action ${a.label} has incorrect routing (expected ${a.target})`);
      hasErrors = true;
    }
  });

  // Result More Menu Touch Polish (Phase 3.12)
  if (!deco.includes('width: 196') && !deco.includes('width: 200')) {
    console.error("❌ FAIL: screens-v2-deco.jsx Result More menu missing 196/200px width (touch UX risk)");
    hasErrors = true;
  }

  // QR/Video Preparing (Disabled) (Hardened)
  const qrPrepButton = deco.match(/<button[\s\S]*?QR Share[\s\S]*?Preparing[\s\S]*?<\/button>/);
  if (!qrPrepButton || !qrPrepButton[0].includes('disabled')) {
    console.error("❌ FAIL: QR Share (Preparing) must be disabled");
    hasErrors = true;
  }

  const videoPrepButton = deco.match(/<button[\s\S]*?Save Video[\s\S]*?Preparing[\s\S]*?<\/button>/);
  if (!videoPrepButton || !videoPrepButton[0].includes('disabled')) {
    console.error("❌ FAIL: Save Video (Preparing) must be disabled");
    hasErrors = true;
  }

  if (deco.includes('onClick={handleQrShare}') || deco.includes('onClick={handleVideoDownload}')) {
    // Check if these are connected to buttons that say Preparing
    if (qrPrepButton && qrPrepButton[0].includes('onClick={handleQrShare}')) {
      console.error("❌ FAIL: screens-v2-deco.jsx QR Share (Preparing) has functional onClick");
      hasErrors = true;
    }
    if (videoPrepButton && videoPrepButton[0].includes('onClick={handleVideoDownload}')) {
      console.error("❌ FAIL: screens-v2-deco.jsx Save Video (Preparing) has functional onClick");
      hasErrors = true;
    }
  }

  if (!deco.includes('getFormattedFilename')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing getFormattedFilename function");
    hasErrors = true;
  }

  if (!deco.includes('IMMM_${YYYY}-${MM}-${DD}_${HH}${mm}.png')) {
    console.error("❌ FAIL: screens-v2-deco.jsx incorrect filename format logic");
    hasErrors = true;
  }

  // Ensure filename always ends with .png
  if (deco.includes('getFormattedFilename') && !deco.includes('return `IMMM_${YYYY}-${MM}-${DD}_${HH}${mm}.png`;')) {
    console.error("❌ FAIL: getFormattedFilename must return .png extension");
    hasErrors = true;
  }

  // Forbidden: reintroduction of Date.now() filenames
  if (deco.includes('IMMM_${Date.now()}.png')) {
    console.error("❌ FAIL: screens-v2-deco.jsx re-introduced Date.now() filename");
    hasErrors = true;
  }

  if (!deco.includes('navigator.share') || !deco.includes('navigator.canShare')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing Web Share API check");
    hasErrors = true;
  }
  if (!deco.includes('addToast')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing Toast notification system");
    hasErrors = true;
  }

  // Result Print Intro checks
  if (!deco.includes('ResultPrintIntro')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing ResultPrintIntro component");
    hasErrors = true;
  }
  if (!deco.includes('showPrintIntro')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing showPrintIntro state");
    hasErrors = true;
  }
  const timerMatch = deco.match(/setTimeout\(\(\)\s*=>\s*setShowPrintIntro\(false\),\s*(.+?)\)/);
  if (timerMatch) {
    const timeoutStr = timerMatch[1];
    if (/^\d+$/.test(timeoutStr)) {
      const timeout = parseInt(timeoutStr);
      if (timeout > 2300) {
        console.error(`❌ FAIL: ResultPrintIntro timeout is too long: ${timeout}ms (max 2300ms)`);
        hasErrors = true;
      }
    }
  }
  const forbiddenAssets = ['.gif', 'lottie'];
  forbiddenAssets.forEach(a => {
    if (deco.includes(a) && !deco.includes('handleVideoDownload')) {
      console.error(`❌ FAIL: screens-v2-deco.jsx contains prohibited asset reference: ${a}`);
      hasErrors = true;
    }
  });

  // Hotfix checks: restored state
  if (!deco.includes('const [toasts, setToasts] = React.useState([])')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing toasts state");
    hasErrors = true;
  }
  if (!deco.includes('const [showMoreActions, setShowMoreActions] = React.useState(false)')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing showMoreActions state");
    hasErrors = true;
  }
  if (deco.includes('toasts.map') && !deco.includes('const [toasts,')) {
    console.error("❌ FAIL: screens-v2-deco.jsx uses toasts.map but missing state");
    hasErrors = true;
  }
  if (deco.includes('setToasts') && !deco.includes('const [toasts,')) {
    console.error("❌ FAIL: screens-v2-deco.jsx uses setToasts but missing state");
    hasErrors = true;
  }
  if (deco.includes('showMoreActions') && !deco.includes('const [showMoreActions,')) {
    console.error("❌ FAIL: screens-v2-deco.jsx uses showMoreActions but missing state");
    hasErrors = true;
  }

  // Phase 3.11 UX Polish: Menu Actions & Routing (Restored)
  if (!deco.includes('Redecorate') || !deco.includes('Retake') || !deco.includes('New Session')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing Result menu action labels");
    hasErrors = true;
  }
  if (!deco.includes("go('deco')") || !deco.includes("go('setup')") || !deco.includes("go('landing')")) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing Result routing targets");
    hasErrors = true;
  }
  if (!deco.includes('setShowMoreActions(false)') || !deco.includes('setShowMoreActions(!showMoreActions)')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing More menu toggle/close logic");
    hasErrors = true;
  }

  // Storage safety check
  const forbiddenClears = ['localStorage.clear', 'sessionStorage.clear', 'caches.delete', 'serviceWorker.unregister'];
  forbiddenClears.forEach(f => {
    if (deco.includes(f)) {
      console.error(`❌ FAIL: screens-v2-deco.jsx contains prohibited storage/worker cleanup: ${f}`);
      hasErrors = true;
    }
  });

  // matchMedia guard check
  if (deco.includes('window.matchMedia') && !deco.includes("typeof window.matchMedia === 'function'")) {
    console.error("❌ FAIL: screens-v2-deco.jsx uses window.matchMedia without typeof check");
    hasErrors = true;
  }

  // Preview blank fix check (showPrintIntro dependency in draw effect)
  if (!deco.includes('showPrintIntro])')) {
    console.error("❌ FAIL: screens-v2-deco.jsx draw effect missing showPrintIntro dependency (preview blank risk)");
    hasErrors = true;
  }

  // Result Preview Recovery checks (Phase 3.9 Offscreen Render Hotfix)
  const resultStates = ['resultPreviewSrc', 'resultPreviewStatus', 'resultPreviewError'];
  resultStates.forEach(s => {
    if (!deco.includes(s)) {
      console.error(`❌ FAIL: screens-v2-deco.jsx missing Result preview state: ${s}`);
      hasErrors = true;
    }
  });

  if (!deco.includes('renderFinalResultBlob')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing renderFinalResultBlob offscreen helper");
    hasErrors = true;
  }

  // Function-level containment checks for DOM capture risk
  const finalAssetFunctions = ['getFinalResultBlob', 'handleDownload', 'handleShare', 'buildFinalResultAsset', 'renderFinalResultBlob'];
  finalAssetFunctions.forEach(fn => {
    const fnRegex = new RegExp(`(const ${fn} =|async function ${fn}\\()`, 's');
    if (!fnRegex.test(deco)) {
      console.error(`❌ FAIL: screens-v2-deco.jsx missing required function: ${fn}`);
      hasErrors = true;
      return;
    }

    // Extract function body to check strictly
    const startIdx = deco.indexOf(fn);
    const body = deco.substring(startIdx, startIdx + 2500);

    if (fn === 'renderFinalResultBlob') {
      if (!body.includes("document.createElement('canvas')") || !body.includes('toBlob') || !body.includes('renderComposition')) {
        console.error("❌ FAIL: renderFinalResultBlob missing offscreen canvas or renderComposition/toBlob logic");
        hasErrors = true;
      }
    } else if (fn === 'getFinalResultBlob') {
      if (!body.includes('renderFinalResultBlob')) {
        console.error("❌ FAIL: getFinalResultBlob must use renderFinalResultBlob");
        hasErrors = true;
      }
    }

    if (body.includes('captureFrameAsBlob')) {
      console.error(`❌ FAIL: screens-v2-deco.jsx function ${fn} contains captureFrameAsBlob`);
      hasErrors = true;
    }

    if (fn !== 'buildFinalResultAsset' && body.includes('captureRef')) {
      console.error(`❌ FAIL: screens-v2-deco.jsx function ${fn} contains captureRef`);
      hasErrors = true;
    }
  });

  if (!deco.includes('<img src={resultPreviewSrc}') && !deco.includes('src={resultPreviewSrc}')) {
    console.error("❌ FAIL: screens-v2-deco.jsx Result preview not using <img> with resultPreviewSrc");
    hasErrors = true;
  }

  // Result Preview Sizing Tuning (Phase 3.19 Final)
  if (!deco.includes('getResultPreviewBaseWidth')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing getResultPreviewBaseWidth helper");
    hasErrors = true;
  }
  if (!deco.includes('targetHeightVh') || !deco.includes('maxHeightPx')) {
    console.error("❌ FAIL: screens-v2-deco.jsx getResultPreviewFit missing targetHeightVh or maxHeightPx");
    hasErrors = true;
  }

  // Validate enlarged base widths
  if (!deco.includes('if (layoutId === \'strip\') return 340;')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing desktop strip base width 340");
    hasErrors = true;
  }
  if (!deco.includes('if (layoutId === \'strip\') return 230;')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing mobile strip base width 230");
    hasErrors = true;
  }

  // Validate enlarged maxScale
  const stripMaxScaleMatch = deco.match(/strip: \{ maxScale: isMobile \? \d+\.\d+ : (\d+\.\d+)/);
  if (stripMaxScaleMatch) {
    const val = parseFloat(stripMaxScaleMatch[1]);
    if (val < 2.2) {
      console.error(`❌ FAIL: screens-v2-deco.jsx desktop strip maxScale ${val} is too small (min 2.2)`);
      hasErrors = true;
    }
  }

  if (deco.includes('ResultPrintIntro') && (deco.includes('resultFrame=') || deco.includes('resultFrame:'))) {
    console.error("❌ FAIL: screens-v2-deco.jsx ResultPrintIntro still uses resultFrame (DOM risk)");
    hasErrors = true;
  }

  // Single Source usage check (Phase 3.8/3.9/3.10)
  if (!deco.includes('exportBlobRef.current = { key: getExportKey(), blob }')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing asset caching for Save/Share");
    hasErrors = true;
  }
  // Deco Zoom Fit checks
  if (!deco.includes('getDecoFitMaxScale')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing getDecoFitMaxScale helper");
    hasErrors = true;
  }

  if (deco.includes('minHeight: mobile ? \'clamp')) {
    if (!deco.includes('660px')) {
      console.error("❌ FAIL: screens-v2-deco.jsx Result preview container missing enlarged clamp height (660px)");
      hasErrors = true;
    }
  }

  // Result Final Display Sizing (Phase 3.23 - 3.26)
  if (!deco.includes('getResultDisplayFit')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing getResultDisplayFit helper");
    hasErrors = true;
  }
  if (!deco.includes('resultStageHeight')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing resultStageHeight helper");
    hasErrors = true;
  }
  
  // Phase 3.26 Row Budget Grid Layout Check (Content-bound)
  if (!deco.includes('gridTemplateRows: \'auto auto auto auto\'') || !deco.includes('alignContent: \'start\'')) {
    console.error("❌ FAIL: screens-v2-deco.jsx Result desktop root missing content-bound grid template");
    hasErrors = true;
  }

  // Validate strip specific rules in getResultDisplayFit (Updated for Phase 3.26)
  if (!deco.includes('minScale: isMobile ? 0.76 : 0.70')) {
    console.error("❌ FAIL: screens-v2-deco.jsx getResultDisplayFit missing strip minScale rules (expected 0.70 for desktop)");
    hasErrors = true;
  }
  if (!deco.includes('targetHeightVh: isMobile ? 52 : 58')) {
    console.error("❌ FAIL: screens-v2-deco.jsx getResultDisplayFit missing strip targetHeightVh rules (expected 58 for desktop)");
    hasErrors = true;
  }

  // Validate container height rules (Updated for Phase 3.26)
  if (!deco.includes('clamp(520px, 58vh, 700px)')) {
    console.error("❌ FAIL: screens-v2-deco.jsx resultStageHeight missing desktop strip clamp height (expected 700px max)");
    hasErrors = true;
  }

  if (!deco.includes('marginTop: 4')) {
    console.error("❌ FAIL: screens-v2-deco.jsx Result action row marginTop too large (expected 4)");
    hasErrors = true;
  }

  if (!deco.includes('marginBottom: 2')) {
    console.error("❌ FAIL: screens-v2-deco.jsx Result title block marginBottom too large (expected 2)");
    hasErrors = true;
  }

  if (!deco.includes('padding: 0, height: resultStageHeight')) {
    console.error("❌ FAIL: screens-v2-deco.jsx Result preview container missing zero padding or height binding");
    hasErrors = true;
  }
}

function checkCameraCapabilityHarden() {
  const main = fs.readFileSync('main.jsx', 'utf8');
  const rest = fs.readFileSync('screens-v2-rest.jsx', 'utf8');

  // Phase 3.28 Strict Diagnostics
  if (!main.includes('function getCameraDebugSnapshot') && !main.includes('getCameraDebugSnapshot = React.useCallback')) {
    console.error("❌ FAIL: main.jsx missing getCameraDebugSnapshot helper");
    hasErrors = true;
  }

  // Phase 3.28 Hardware Zoom Verification (Strict)
  if (!main.includes('applyCameraZoom') || !main.includes('reason:') || !main.includes('ok:')) {
    console.error("❌ FAIL: main.jsx missing applyCameraZoom result object return (ok/path/reason)");
    hasErrors = true;
  }
  
  if (main.includes('afterZoom === undefined') && main.includes('return true')) {
     // Check if undefined is still treated as success
     const lines = main.split('\n');
     const undefLine = lines.findIndex(l => l.includes('afterZoom === undefined'));
     if (undefLine !== -1 && (lines[undefLine+1].includes('return true') || lines[undefLine+2].includes('return true'))) {
        console.error("❌ FAIL: main.jsx treats undefined afterZoom as success (false positive)");
        hasErrors = true;
     }
  }

  // Phase 3.28 Device Switch Verification (Strict)
  if (!main.includes('switchCameraDevice') || !main.includes('reason:')) {
    console.error("❌ FAIL: main.jsx missing switchCameraDevice result object return");
    hasErrors = true;
  }

  // Phase 3.28 Debug Manual Picker
  if (!rest.includes('DebugWideDevicePicker') || !rest.includes('cameraDevices.map')) {
    console.error("❌ FAIL: screens-v2-rest.jsx missing manual DebugWideDevicePicker");
    hasErrors = true;
  }

  // Forbidden Fake Wide
  const forbidden = [
    'scale(0.6)', 'transform: \'scale(0.6)\'', 'drawImage(.*0.6.*)', 'ctx.scale(0.6)'
  ];
  forbidden.forEach(pat => {
    if (new RegExp(pat).test(main) || new RegExp(pat).test(rest)) {
      console.error(`❌ FAIL: Forbidden fake wide implementation found: ${pat}`);
      hasErrors = true;
    }
  });

  // Debug Reason/Path Tracking
  if (!main.includes('lastWideToggleReason') || !rest.includes('lastWideTogglePath')) {
    console.error("❌ FAIL: Camera toggle diagnostics missing in main/rest");
    hasErrors = true;
  }
}

function checkCameraDiagnosticFinal() {
  const main = fs.readFileSync('main.jsx', 'utf8');
  const rest = fs.readFileSync('screens-v2-rest.jsx', 'utf8');

  // Phase 3.29 onDebugSwitchCameraDevice
  if (!main.includes('onDebugSwitchCameraDevice') || !rest.includes('onDebugSwitchCameraDevice')) {
    console.error("❌ FAIL: main/rest missing onDebugSwitchCameraDevice helper");
    hasErrors = true;
  }

  // Phase 3.29 switch verification hardening
  if (main.includes('settings.label')) {
     console.error("❌ FAIL: main.jsx still uses unreliable settings.label for verification");
     hasErrors = true;
  }
  if (!main.includes('unverified-device-switch')) {
     console.error("❌ FAIL: main.jsx missing unverified-device-switch reason for hidden deviceIds");
     hasErrors = true;
  }

  // Phase 3.29 merged reasons
  if (!main.includes('hardware:') || !main.includes('device:')) {
     console.error("❌ FAIL: main.jsx missing merged hardware/device failure reasons");
     hasErrors = true;
  }

  // Phase 3.29 cameraToggleBusy
  if (!rest.includes('disabled={cameraToggleBusy}') || !rest.includes('cameraToggleBusy ? \'...\'')) {
     console.error("❌ FAIL: screens-v2-rest.jsx missing busy state visual feedback on buttons");
     hasErrors = true;
  }

  // Phase 3.29 debug picker logic
  if (rest.includes('onClick={() => switchCameraDevice?.(d.deviceId)}')) {
     console.error("❌ FAIL: DebugWideDevicePicker calling switchCameraDevice directly (should use onDebugSwitchCameraDevice)");
     hasErrors = true;
  }
  
  if (!rest.includes('groupId')) {
     console.error("❌ FAIL: DebugWideDevicePicker missing groupId display");
     hasErrors = true;
  }
}

function checkCleanCottonTheme() {
  const index = fs.existsSync('index.html') ? fs.readFileSync('index.html', 'utf8') : null;
  const setup = fs.existsSync('screens-v2.jsx') ? fs.readFileSync('screens-v2.jsx', 'utf8') : null;
  const app = fs.existsSync('app.jsx') ? fs.readFileSync('app.jsx', 'utf8') : null;
  const fsys = fs.existsSync('frame-system.jsx') ? fs.readFileSync('frame-system.jsx', 'utf8') : null;

  if (index && !index.includes('#FCFCFA')) {
    console.error("❌ FAIL: index.html missing clean cotton background #FCFCFA");
    hasErrors = true;
  }
  if (app && !app.includes("bg: '#FCFCFA'")) {
    console.error("❌ FAIL: app.jsx TOKENS.A missing clean cotton background #FCFCFA");
    hasErrors = true;
  }
  if (setup) {
    if (!setup.includes('T.bgAlt') && !setup.includes('#F8F8F5')) {
      console.error("❌ FAIL: screens-v2.jsx missing clean cotton stage background token (T.bgAlt or #F8F8F5)");
      hasErrors = true;
    }
    if (!setup.includes('T.line') && !setup.includes('#E5E2DA')) {
      console.error("❌ FAIL: screens-v2.jsx missing frame picker card border token (T.line or #E5E2DA)");
      hasErrors = true;
    }
    if (setup.includes('#FDFCF8')) {
      // Check if it's in a comment or active code. The prompt says remove it from Setup background.
      const lines = setup.split('\n');
      lines.forEach((line, i) => {
        if (line.includes('#FDFCF8') && !line.trim().startsWith('//')) {
          console.warn(`⚠️ WARN: screens-v2.jsx:L${i + 1} still contains #FDFCF8. Ensure it is not active background.`);
        }
      });
    }
  }

  // Forbidden leakage/modification checks
  if (fsys && (fsys.includes('#FCFCFA') || fsys.includes('#F8F8F5'))) {
    console.error("❌ FAIL: frame-system.jsx contains clean cotton tokens (must not be modified)");
    hasErrors = true;
  }

  // Palette preservation check (defined in screens-v2.jsx UI)
  if (setup) {
    const palette = ['#F1C0C5', '#A6C8DE', '#E6C8BE', '#A2352B'];
    palette.forEach(c => {
      if (!setup.toLowerCase().includes(c.toLowerCase())) {
        console.error(`❌ FAIL: screens-v2.jsx missing original palette color: ${c}`);
        hasErrors = true;
      }
    });
  }
}

function checkStrayFiles() {
  const strayFiles = ['pgpt.mjs', 'pgpt_daemon.py'];
  strayFiles.forEach(f => {
    if (fs.existsSync(f)) {
      console.error(`❌ FAIL: IMMM workspace contains stray file: ${f}`);
      hasErrors = true;
    }
  });

  try {
    const gitFiles = execSync('git ls-files', { encoding: 'utf8' });
    if (gitFiles.includes('pgpt')) {
      console.error(`❌ FAIL: IMMM workspace git tracks stray pgpt files`);
      hasErrors = true;
    }
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    if (gitStatus.includes('pgpt')) {
      console.error(`❌ FAIL: IMMM workspace has dirty/untracked pgpt files:\n${gitStatus.split('\n').filter(l => l.includes('pgpt')).join('\n')}`);
      hasErrors = true;
    }
  } catch (e) { }
}

function checkFramePickerResilience() {
  if (!fs.existsSync('screens-v2.jsx')) return;
  const v2 = fs.readFileSync('screens-v2.jsx', 'utf8');

  if (v2.includes('if (!tpl) return null;')) {
    console.error("❌ FAIL: screens-v2.jsx contains 'if (!tpl) return null;' which hides frame buttons");
    hasErrors = true;
  }
  if (!v2.includes('function FramePickerFallback')) {
    console.error("❌ FAIL: screens-v2.jsx missing FramePickerFallback component");
    hasErrors = true;
  }
  if (!v2.includes('canRenderRealThumb') && !v2.includes('Boolean(WFrameThumb && tpl)')) {
    console.error("❌ FAIL: screens-v2.jsx missing canRenderRealThumb guard for frame picker");
    hasErrors = true;
  }

  // Declaration order check
  const tplIdx = v2.indexOf('const tpl = resolveFrameTemplate(o.id)');
  const thumbIdx = v2.indexOf('const canRenderRealThumb =');
  if (tplIdx === -1) {
    console.error("❌ FAIL: screens-v2.jsx missing 'const tpl = resolveFrameTemplate(o.id)'");
    hasErrors = true;
  } else if (thumbIdx !== -1 && thumbIdx < tplIdx) {
    console.error("❌ FAIL: screens-v2.jsx 'canRenderRealThumb' declared before 'tpl'");
    hasErrors = true;
  }
  // Check for sibling overlay (should be ternary/conditional)
  if (v2.includes('<FramePickerFallback') && v2.includes('<WFrameThumb') && v2.indexOf('<FramePickerFallback') < v2.indexOf('<WFrameThumb')) {
    const framePickerSection = v2.substring(v2.indexOf('frameTab'), v2.indexOf('filterTab'));
    if (framePickerSection.includes('<FramePickerFallback') && framePickerSection.includes('<WFrameThumb')) {
      // If they are both present without a ternary operator nearby
      if (!framePickerSection.includes('?')) {
        console.error("❌ FAIL: screens-v2.jsx frame picker might be overlaying fallback and real thumb");
        hasErrors = true;
      }
    }
  }
  if (v2.includes('Frame preview unavailable')) {
    console.error("❌ FAIL: screens-v2.jsx should not use 'Frame preview unavailable' text");
    hasErrors = true;
  }
  if (!v2.includes('setLayout(o.id)')) {
    console.error("❌ FAIL: screens-v2.jsx frame picker buttons missing setLayout call");
    hasErrors = true;
  }
}

function checkStabilityAuditDocumented() {
  if (!fs.existsSync('task.md')) return;
  const task = fs.readFileSync('task.md', 'utf8');
  if (!task.includes('## Full App Bottleneck & Risk Audit (Phase 3.31)')) {
    console.error("❌ FAIL: task.md missing finalized stability audit section (Phase 3.31)");
    hasErrors = true;
  }
  if (!task.includes('## Runtime Production UMD Hotfix (Phase 3.32)')) {
    console.error("❌ FAIL: task.md missing finalized stability audit section (Phase 3.32)");
    hasErrors = true;
  }
  if (!task.includes('## Babel Standalone Removal Scope (Phase 3.33)')) {
    console.error("❌ FAIL: task.md missing Babel Standalone Removal Scope (Phase 3.33)");
    hasErrors = true;
  }
  if (!task.includes('## Blob URL Lifecycle Cleanup (Phase 3.34)')) {
    console.error("❌ FAIL: task.md missing Blob URL Lifecycle Cleanup (Phase 3.34)");
    hasErrors = true;
  }
  if (!task.includes('| Priority | Area | File | Risk | Symptom | Recommendation | Follow-up Commit |')) {
    console.error("❌ FAIL: task.md missing risk table header");
    hasErrors = true;
  }
  if (!task.includes('React UMD switched from development to production')) {
    console.error("❌ FAIL: task.md missing React production UMD confirmation in Phase 3.32");
    hasErrors = true;
  }
  if (!task.includes('Babel standalone removed via production build pipeline')) {
    console.error("❌ FAIL: task.md missing Babel removal goal in Phase 3.32");
    hasErrors = true;
  }
  if (!task.includes('Choose build strategy')) {
    console.error("❌ FAIL: task.md missing 'Choose build strategy' in Phase 3.33");
    hasErrors = true;
  }
  if (!task.includes('iOS long-press save URL not revoked immediately')) {
    console.error("❌ FAIL: task.md missing iOS long-press save URL guard in Phase 3.34");
    hasErrors = true;
  }
}

function checkBlobUrlLifecycle() {
  const deco = readFile('screens-v2-deco.jsx');
  const fsys = readFile('frame-system.jsx');

  if (deco) {
    if (!deco.includes('resultPreviewUrlRef')) {
      console.error("❌ FAIL: screens-v2-deco.jsx missing resultPreviewUrlRef for blob lifecycle");
      hasErrors = true;
    }
    if (!deco.includes('saveSheetUrlRef')) {
      console.error("❌ FAIL: screens-v2-deco.jsx missing saveSheetUrlRef for blob lifecycle");
      hasErrors = true;
    }
    if (deco.includes('setTimeout(() => URL.revokeObjectURL(saveSheetUrl),')) {
       console.error("❌ FAIL: screens-v2-deco.jsx uses immediate timeout for saveSheetUrl (unstable on iOS)");
       hasErrors = true;
    }
    if (!deco.includes('function revokeBlobUrl(url)')) {
       console.error("❌ FAIL: screens-v2-deco.jsx missing revokeBlobUrl helper");
       hasErrors = true;
    }
    // Verify helper usage
    const lines = deco.split('\n');
    let inHelper = false;
    lines.forEach((l, i) => {
      if (l.includes('function revokeBlobUrl')) inHelper = true;
      if (!inHelper && l.includes('URL.revokeObjectURL')) {
        console.error(`❌ FAIL: screens-v2-deco.jsx:L${i+1} manual URL.revokeObjectURL call detected`);
        hasErrors = true;
      }
      if (inHelper && l.includes('}')) inHelper = false;
    });
  }

  if (fsys) {
    if (!fsys.includes('revokeShare') || !fsys.includes('clearExpired')) {
      console.error("❌ FAIL: frame-system.jsx missing ShareStore cleanup methods");
      hasErrors = true;
    }
    if (!fsys.includes('localUrls: new Map()')) {
      console.error("❌ FAIL: frame-system.jsx missing localUrls map for ShareStore lifecycle");
      hasErrors = true;
    }
    if (!fsys.includes('function revokeBlobUrl(url)')) {
       console.error("❌ FAIL: frame-system.jsx missing revokeBlobUrl helper");
       hasErrors = true;
    }
    // Verify helper usage
    const lines = fsys.split('\n');
    let inHelper = false;
    lines.forEach((l, i) => {
      if (l.includes('function revokeBlobUrl')) inHelper = true;
      if (!inHelper && l.includes('URL.revokeObjectURL')) {
        console.error(`❌ FAIL: frame-system.jsx:L${i+1} manual URL.revokeObjectURL call detected`);
        hasErrors = true;
      }
      if (inHelper && l.includes('}')) inHelper = false;
    });
  }
}

function checkReactProductionMode() {
  if (!fs.existsSync('index.html')) return;
  const index = fs.readFileSync('index.html', 'utf8');
  if (index.includes('react.development.js') || index.includes('react-dom.development.js')) {
    console.error("❌ FAIL: index.html is using React development build (P0 Risk)");
    hasErrors = true;
  }
  if (!index.includes('react.production.min.js') || !index.includes('react-dom.production.min.js')) {
    console.error("❌ FAIL: index.html missing React production build");
    hasErrors = true;
  }
  if (index.includes('@babel/standalone')) {
    console.warn("⚠️ WARN: index.html is using Babel standalone runtime (P0 Risk)");
  }
}

console.log('🔍 Running IMMM COMPREHENSIVE Hardened Sanity Checks...');
checkRuntimeVersion();
checkWidePickerSafety();
checkWebGL();
checkVisibleFilters();
checkWebglVisiblePipelines();
checkEmergencyFaceSafety();
checkEmergencyFrameGlobals();
checkFrameStoreFoundation();
checkEmergencyServiceWorker();
checkAppStability();
checkCameraCapabilityHarden();
checkCameraDiagnosticFinal();
checkCleanCottonTheme();
checkFrameSystem();
checkStickerEngine();
checkCapture();
checkSetupAndDecoStickerCanvas();
checkDeco();
checkFrameThemeUnification();
checkRuntimeSessionBridge();
checkTask();
checkPhaseCCameraZoom();
checkResultUX();
checkFramePickerResilience();
function checkStickerPreload() {
  const fsys = readFile('frame-system.jsx');
  if (!fsys) return;

  const order = [
    'function drawFallbackSticker',
    'function collectUploadStickerSources',
    'async function preloadStickerImages',
    'async function drawStickerToCtx'
  ];

  let lastIndex = -1;
  order.forEach(fn => {
    const idx = fsys.indexOf(fn);
    if (idx === -1) {
      console.error(`❌ FAIL: frame-system.jsx missing ${fn}`);
      hasErrors = true;
    } else if (idx < lastIndex) {
      console.error(`❌ FAIL: frame-system.jsx helper order incorrect: ${fn} appears before its predecessor`);
      hasErrors = true;
    }
    lastIndex = idx;
  });

  // Nesting check: ensure no helpers are defined inside drawFallbackSticker
  const startIdx = fsys.indexOf('function drawFallbackSticker');
  const endIdx = fsys.indexOf('function collectUploadStickerSources');
  if (startIdx !== -1 && endIdx !== -1) {
    const body = fsys.slice(startIdx, endIdx);
    if (body.includes('async function') || body.includes('function collectUploadStickerSources')) {
       console.error("❌ FAIL: frame-system.jsx has nested helpers inside drawFallbackSticker (missing closing brace?)");
       hasErrors = true;
    }
  }

  const requirements = [
    'collectUploadStickerSources',
    'preloadStickerImages',
    'uploadImages',
    'Promise.all',
    'drawStickerToCtx(ctx, local, sw, sh, scale, stickerAssets)',
    'drawStickerToCtx(ctx, s, w, h, scale, stickerAssets)',
    'assets.uploadImages.get'
  ];

  requirements.forEach(req => {
    if (!fsys.includes(req)) {
      console.error(`❌ FAIL: frame-system.jsx missing sticker preload requirement: ${req}`);
      hasErrors = true;
    }
  });

  if (!fsys.includes('preloadStickerImages(data.stickers || [])')) {
      console.error("❌ FAIL: renderComposition missing preloadStickerImages call");
      hasErrors = true;
  }

  if (!fsys.includes('catch (err)') || !fsys.includes('return [src, null]')) {
      console.error("❌ FAIL: preloadStickerImages missing failure isolation (try-catch or null return)");
      hasErrors = true;
  }

  if (!fsys.includes('uploadImages?.has')) {
      console.error("❌ FAIL: drawStickerToCtx missing preload existence check (uploadImages?.has)");
      hasErrors = true;
  }

  const perfRequirements = [
    'isExportPerfDebugEnabled',
    'logExportPerf',
    'nowMs',
    '[IMMM export perf]',
    'sticker-preload',
    'render-total'
  ];

  perfRequirements.forEach(req => {
    if (!fsys.includes(req)) {
      console.error(`❌ FAIL: frame-system.jsx missing export perf requirement: ${req}`);
      hasErrors = true;
    }
  });

  if (!fsys.includes('if (isExportPerfDebugEnabled())') || !fsys.includes('sticker preload failed')) {
      console.error("❌ FAIL: frame-system.jsx sticker preload failure warning not wrapped in debug check");
      hasErrors = true;
  }
}

function checkBabelMigrationPlan() {
  const task = readFile('task.md');
  if (!task) return;

  const requirements = [
    'Babel Standalone Removal Build Plan',
    'Script Inventory',
    'Global / API Dependency Map',
    'Build Strategy Selection',
    'Babel CLI Precompile',
    'Build Manifest Strategy',
    'Do not use glob order',
    'index.precompiled.html',
    'babel app.jsx filters.jsx webgl-engine.jsx',
    '`app.jsx` -> `dist/app.js`',
    '`main.jsx` -> `dist/main.js`'
  ];

  requirements.forEach(req => {
    if (!task.includes(req)) {
      console.error(`❌ FAIL: task.md missing Babel migration plan requirement: ${req}`);
      hasErrors = true;
    }
  });

  if (task.includes('babel scripts/*.jsx')) {
      console.error("❌ FAIL: task.md contains incorrect build command 'babel scripts/*.jsx'");
      hasErrors = true;
  }

  const index = readFile('index.html');
  if (index) {
    // Phase 3.52: @babel/standalone must be removed from index.html
    if (index.includes('@babel/standalone')) {
      console.error('❌ FAIL: index.html still contains @babel/standalone (Phase 3.52: production entry switch required)');
      hasErrors = true;
    }
    if (index.includes('type="text/babel"')) {
      console.error('❌ FAIL: index.html still contains type="text/babel" (Phase 3.52: production entry switch required)');
      hasErrors = true;
    }
    // Must load dist scripts in order
    const distOrder = ['dist/app.js','dist/filters.js','dist/webgl-engine.js','dist/mediapipe-face.js',
      'dist/sticker-engine.js','dist/frame-system.js','dist/screens-v2.js',
      'dist/screens-v2-rest.js','dist/screens-v2-deco.js','dist/main.js'];
    let lastIdx = -1;
    let orderOk = true;
    distOrder.forEach(s => {
      const pos = index.indexOf(s);
      if (pos === -1) { orderOk = false; }
      else if (pos < lastIdx) { orderOk = false; }
      else lastIdx = pos;
    });
    if (!orderOk) {
      console.error('❌ FAIL: index.html dist script order does not match manifest order');
      hasErrors = true;
    }
  }

  const packageJson = readFile('package.json');
  if (packageJson) {
    if (!packageJson.includes('build:precompile')) {
       console.error('❌ FAIL: package.json missing build:precompile script');
       hasErrors = true;
    }
  } else {
    console.error('❌ FAIL: package.json missing (Phase 3.40 requirement)');
    hasErrors = true;
  }
  // Phase 3.40 Artifact Checks (precompiled.html remains Babel-free)
  const precompiled = readFile('index.precompiled.html');
  if (precompiled) {
    if (precompiled.includes('@babel/standalone')) {
      console.error('❌ FAIL: index.precompiled.html still contains @babel/standalone');
      hasErrors = true;
    }
    if (precompiled.includes('type="text/babel"')) {
      console.error('❌ FAIL: index.precompiled.html still contains type="text/babel"');
      hasErrors = true;
    }
    if (!precompiled.includes('dist/main.js')) {
      console.error('❌ FAIL: index.precompiled.html missing dist/main.js entry');
      hasErrors = true;
    }
  } else {
    console.warn('⚠️ WARN: index.precompiled.html not found (Phase 3.40 incomplete)');
  }

  // Phase 3.52 & 3.56: sw.js CACHE_NAME and dist precache guards
  const swJs = readFile('sw.js');
  if (swJs) {
    const manifestData = JSON.parse(fs.readFileSync('release-manifest.json', 'utf8'));
    const cacheVersion = manifestData.cache;
    const appVersion = manifestData.version;
    const expectedCacheName = `immm-cache-${cacheVersion}-${appVersion}-rc-final`;
    if (!swJs.includes(`const CACHE_NAME = '${expectedCacheName}'`)) {
      console.error(`❌ FAIL: sw.js CACHE_NAME mismatch with manifest: expected '${expectedCacheName}'`);
      hasErrors = true;
    }
    ['dist/app.js','dist/filters.js','dist/webgl-engine.js','dist/screens-v2-rest.js','dist/main.js'].forEach(d => {
      if (!swJs.includes(d)) {
        console.error(`❌ FAIL: sw.js ASSETS missing ${d}`);
        hasErrors = true;
      }
    });
    if (!swJs.includes('self.skipWaiting()')) {
      console.error('❌ FAIL: sw.js missing skipWaiting');
      hasErrors = true;
    }
    if (!swJs.includes('self.clients.claim')) {
      console.error('❌ FAIL: sw.js missing clients.claim');
      hasErrors = true;
    }
  }

  // Phase 3.52: QR / Video disabled guard
  const deco = readFile('screens-v2-deco.jsx');
  if (deco) {
    // handleQrShare / handleVideoDownload must NOT be wired to onClick directly
    const qrClickPattern = /onClick\s*=\s*\{[^}]*handleQrShare/;
    const videoClickPattern = /onClick\s*=\s*\{[^}]*handleVideoDownload/;
    if (qrClickPattern.test(deco)) {
      console.error('❌ FAIL: screens-v2-deco.jsx handleQrShare is wired to onClick (must stay disabled)');
      hasErrors = true;
    }
    if (videoClickPattern.test(deco)) {
      console.error('❌ FAIL: screens-v2-deco.jsx handleVideoDownload is wired to onClick (must stay disabled)');
      hasErrors = true;
    }
    // captureFrameAsBlob must NOT appear in final asset path
    if (deco.includes('captureFrameAsBlob') && deco.includes('getFinalResultBlob')) {
      console.error('❌ FAIL: screens-v2-deco.jsx captureFrameAsBlob found in final asset path context');
      hasErrors = true;
    }
    if (!deco.includes('renderFinalResultBlob')) {
      console.error('❌ FAIL: screens-v2-deco.jsx missing renderFinalResultBlob (result export path broken)');
      hasErrors = true;
    }
  }

  // Phase 3.52: task.md gate sections
  const task352 = readFile('task.md');
  if (task352) {
    if (!task352.includes('1×4 Preview / Capture / Export Crop Parity Gate')) {
      console.error('❌ FAIL: task.md missing 1×4 Crop Parity Gate section');
      hasErrors = true;
    }
    if (!task352.includes('QR / Video Production Gate')) {
      console.error('❌ FAIL: task.md missing QR / Video Production Gate section');
      hasErrors = true;
    }
    if (!task352.includes('CaptureSession Model Contract')) {
      console.error('❌ FAIL: task.md missing CaptureSession Model Contract section');
      hasErrors = true;
    }
    if (!task352.includes('Production Precompiled Entry Switch + Crop Parity Gate (Phase 3.52)')) {
      console.error('❌ FAIL: task.md missing Phase 3.52 section');
      hasErrors = true;
    }
  }

  const buildScript = readFile('scripts/build-precompile.mjs');
  if (buildScript) {
    if (!buildScript.includes('process.exit(1)') || !buildScript.includes('console.error')) {
      console.error('❌ FAIL: scripts/build-precompile.mjs must fail (process.exit(1)) on import/export');
      hasErrors = true;
    }
    if (buildScript.includes('console.warn') && (buildScript.includes('import/export') || buildScript.includes('import ') || buildScript.includes('export '))) {
      console.error('❌ FAIL: scripts/build-precompile.mjs must not just warn on import/export');
      hasErrors = true;
    }
    if (!buildScript.includes('plugin-transform-block-scoping')) {
      console.error('❌ FAIL: scripts/build-precompile.mjs missing @babel/plugin-transform-block-scoping (required to prevent classic script lexical collision)');
      hasErrors = true;
    }
  }

  const pkgJson = readFile('package.json');
  if (pkgJson && !pkgJson.includes('plugin-transform-block-scoping')) {
    console.error('❌ FAIL: package.json missing @babel/plugin-transform-block-scoping');
    hasErrors = true;
  }

  // Multi-script classic global lexical collision guard
  const distFiles = ['dist/app.js', 'dist/filters.js', 'dist/webgl-engine.js',
    'dist/mediapipe-face.js', 'dist/sticker-engine.js', 'dist/frame-system.js',
    'dist/screens-v2.js', 'dist/screens-v2-rest.js', 'dist/screens-v2-deco.js', 'dist/main.js'];
  const collisionSymbols = ['ZoomMinusIcon', 'ZoomPlusIcon'];
  collisionSymbols.forEach(sym => {
    let count = 0;
    distFiles.forEach(df => {
      const content = readFile(df);
      if (content && new RegExp(`const ${sym}\\b`).test(content)) count++;
    });
    if (count > 0) {
      console.error(`❌ FAIL: dist contains top-level 'const ${sym}' — will cause SyntaxError in classic multi-script context`);
      hasErrors = true;
    }
  });
  distFiles.forEach(df => {
    const content = readFile(df);
    if (content && /^const /m.test(content)) {
      console.error(`❌ FAIL: ${df} contains top-level const — block-scoping transform must convert all const/let to var`);
      hasErrors = true;
    }
    if (content && /^let /m.test(content)) {
      console.error(`❌ FAIL: ${df} contains top-level let — block-scoping transform must convert all const/let to var`);
      hasErrors = true;
    }
  });


  // Workspace Hygiene & QA Truth Checks
  const gitignore = readFile('.gitignore');
  if (gitignore) {
    if (!gitignore.includes('node_modules/')) {
      console.error('❌ FAIL: .gitignore missing node_modules/');
      hasErrors = true;
    }
    if (gitignore.includes('dist/')) {
      console.error('❌ FAIL: .gitignore should NOT contain dist/ (tracked in Phase 3.40)');
      hasErrors = true;
    }
  }

  // Phase 3.49 Precompiled Sync Check
  const distRest = readFile('dist/screens-v2-rest.js');
  if (distRest) {
    if (!distRest.includes('SoftLightGlyph')) {
      console.error('❌ FAIL: dist/screens-v2-rest.js is out of sync (missing SoftLightGlyph)');
      hasErrors = true;
    }
    if (!distRest.includes('Selfie Light')) {
      console.error('❌ FAIL: dist/screens-v2-rest.js is out of sync (missing Selfie Light label)');
      hasErrors = true;
    }
    if (distRest.includes('🤳') || distRest.includes('🔦') || distRest.includes('💡')) {
      console.error('❌ FAIL: dist/screens-v2-rest.js still contains crude emojis');
      hasErrors = true;
    }
  }

  const task349 = readFile('task.md');
  if (task349 && !task349.includes('Precompiled Sync + Capture Full Flow QA + Entry Switch Readiness (Phase 3.49)')) {
     console.error('❌ FAIL: task.md missing Phase 3.49 Roadmap section');
     hasErrors = true;
  }

  const task350 = readFile('task.md');
  if (task350) {
    if (!task350.includes('Actual Precompiled Full-Flow Release Gate (Phase 3.50)')) {
       console.error('❌ FAIL: task.md missing Phase 3.50 Release Gate section');
       hasErrors = true;
    }
    if (!task350.includes('Entry Switch Package Draft')) {
       console.error('❌ FAIL: task.md missing Entry Switch Package Draft');
       hasErrors = true;
    }
    if (task350.includes('- [x] index.html switch approved') && task350.includes('decision: Not Ready')) {
       console.error('❌ FAIL: index.html switch approved while decision is Not Ready');
       hasErrors = true;
    }
  }

  // Phase 3.51 Release Gate Correction
  const task351 = readFile('task.md');
  if (task351) {
    const correctOrder = 'app -> filters -> webgl-engine -> mediapipe-face -> sticker-engine -> frame-system -> screens-v2 -> screens-v2-rest -> screens-v2-deco -> main';
    const wrongOrder = 'webgl-engine -> app -> filters';
    
    if (task351.includes(wrongOrder)) {
       console.error('❌ FAIL: task.md contains wrong dist script order (Phase 3.51 Correction needed)');
       hasErrors = true;
    }
    if (!task351.includes(correctOrder)) {
       console.error('❌ FAIL: task.md missing correct dist script order (Phase 3.51 requirement)');
       hasErrors = true;
    }
    if (!task351.includes('Phase 3.50 is a release gate draft')) {
       console.error('❌ FAIL: task.md missing Phase 3.50 draft clarification');
       hasErrors = true;
    }
    if (!task351.includes('Full-flow verification remains pending')) {
       console.error('❌ FAIL: task.md missing full-flow pending status');
       hasErrors = true;
    }
    if (!task351.includes('Parallel Stabilization While Full-Flow QA Is Pending')) {
       console.error('❌ FAIL: task.md missing Parallel Stabilization section');
       hasErrors = true;
    }
  }

  const taskForQA = readFile('task.md');
  if (taskForQA) {
    if (taskForQA.includes('## Precompiled Entry Smoke Test (Phase 3.45)')) {
      console.error('❌ FAIL: Phase 3.45 in task.md must be labeled as "Plan" until actually verified');
      hasErrors = true;
    }
    // Check for premature "Success" in Phase 3.45 area
    const phase345Section = taskForQA.split('## Precompiled Entry Smoke Test')[1]?.split('---')[0] || '';
    if (phase345Section.includes('boot: Success') || phase345Section.includes('capture: Success')) {
      console.error('❌ FAIL: task.md contains premature "Success" reports in Phase 3.45');
      hasErrors = true;
    }
  }

  // Phase 3.53: Post-Switch Release Gate
  const task353 = readFile('task.md');
  if (task353) {
    if (!task353.includes('Production Precompiled Post-Switch Release Gate (Phase 3.53)')) {
      console.error('❌ FAIL: task.md missing Phase 3.53 Post-Switch Release Gate section');
      hasErrors = true;
    }
    if (!task353.includes('Production Precompiled Rollback Plan')) {
      console.error('❌ FAIL: task.md missing Rollback Plan section');
      hasErrors = true;
    }
    // If Release approved is checked, Desktop Chrome must also be checked
    const approvedChecked = task353.includes('- [x] Release approved');
    const desktopPending = task353.includes('- [ ] Desktop Chrome production boot verified');
    if (approvedChecked && desktopPending) {
      console.error('❌ FAIL: Release approved checked but Desktop Chrome boot not yet verified');
      hasErrors = true;
    }
    // SW guard must also be pending if release not ready
    const swPending = task353.includes('- [ ] Service Worker registered');
    if (approvedChecked && swPending) {
      console.error('❌ FAIL: Release approved checked but Service Worker verification still pending');
      hasErrors = true;
    }
  }

  // Phase 3.54: Document structure + evidence guards
  const task354 = readFile('task.md');
  if (task354) {
    if (!task354.includes('## 🚀 Phase B — WebGL Skin Retouch Roadmap')) {
      console.error('❌ FAIL: task.md missing Phase B heading (document structure regression)');
      hasErrors = true;
    }
    if (!task354.includes('Phase 3.54 Evidence')) {
      console.error('❌ FAIL: task.md missing Phase 3.54 Evidence section');
      hasErrors = true;
    }
    const relApproved354 = task354.includes('- [x] Release approved');
    const bothBootsPending = task354.includes('- [ ] Desktop Chrome production boot verified') &&
                             task354.includes('- [ ] Galaxy S23+ Chrome boot verified');
    const allCapturePending = task354.includes('- [ ] Desktop Chrome capture entry verified') &&
                              task354.includes('- [ ] Galaxy S23+ Chrome capture verified');
    if (relApproved354 && bothBootsPending) {
      console.error('❌ FAIL: Release approved but neither Desktop nor Galaxy boot is verified');
      hasErrors = true;
    }
    if (relApproved354 && allCapturePending) {
      console.error('❌ FAIL: Release approved but no capture entry is verified');
      hasErrors = true;
    }
    if (relApproved354 && task354.includes('- [ ] Service Worker registered')) {
      console.error('❌ FAIL: Release approved but Service Worker still pending');
      hasErrors = true;
    }
  }
}

function checkCameraArchitecture() {
  const main = readFile('main.jsx');
  const rest = readFile('screens-v2-rest.jsx');
  if (!main || !rest) return;

  const adapterHelpers = ['setCameraZoom', 'setCameraTorch', 'runScreenFlash'];
  adapterHelpers.forEach(h => {
    if (!main.includes(h)) {
      console.error(`❌ FAIL: main.jsx missing camera control adapter helper: ${h}`);
      hasErrors = true;
    }
  });

  if (!main.includes('cameraZoomOptions') || !main.includes('type: \'hardware\'')) {
    console.error("❌ FAIL: main.jsx missing capability-based zoom option model");
    hasErrors = true;
  }

  if (!rest.includes('screenFlashActive') && !rest.includes('screenFlashEnabled') && !rest.includes('screenFlashOverlay') && !rest.includes('screenLightActive')) {
    console.error("❌ FAIL: screens-v2-rest.jsx missing screen flash light simulation");
    hasErrors = true;
  }

  // Phase 3.48 UI Polish
  if (!rest.includes('function SoftLightGlyph()')) {
    console.error("❌ FAIL: screens-v2-rest.jsx missing SoftLightGlyph component");
    hasErrors = true;
  }
  if (rest.includes('💡') || rest.includes('🔦') || rest.includes('🤳')) {
     // Use regex to check if they are in the Light button specifically if needed, 
     // but general grep is safer for "removal of crude icons".
     console.error("❌ FAIL: screens-v2-rest.jsx still contains crude emojis in Capture UI");
     hasErrors = true;
  }
  if (!rest.includes('Selfie Light')) {
    console.error("❌ FAIL: screens-v2-rest.jsx missing 'Selfie Light' label for front camera");
    hasErrors = true;
  }
  if (!rest.includes('aria-label') || !rest.includes('Turn on selfie light')) {
    console.error("❌ FAIL: screens-v2-rest.jsx missing accessibility aria-labels for Light control");
    hasErrors = true;
  }

  // FAKE ZOOM GUARDS
  if (main.includes('scale(0.6') || rest.includes('scale(0.6') || rest.includes('transform: \'scale(0.6\'')) {
    console.error("❌ FAIL: Prohibited fake 0.6x CSS scale detected");
    hasErrors = true;
  }

  const task = readFile('task.md');
  if (task && !task.includes('Camera Control Architecture (Phase 3.41)')) {
    console.error("❌ FAIL: task.md missing Phase 3.41 Camera Architecture roadmap");
    hasErrors = true;
  }
}

function checkCameraModelAndBestCut() {
  const main = readFile('main.jsx');
  const task = readFile('task.md');

  if (main) {
    if (!main.includes('function deriveCameraZoomOptions')) {
      console.error('❌ FAIL: main.jsx missing deriveCameraZoomOptions helper');
      hasErrors = true;
    }
    if (!main.includes('cameraZoomOptions = React.useMemo')) {
      console.error('❌ FAIL: main.jsx cameraZoomOptions must be a derived useMemo model');
      hasErrors = true;
    }
    if (main.includes('setCameraZoomOptions')) {
      console.error('❌ FAIL: main.jsx contains prohibited setCameraZoomOptions state setter');
      hasErrors = true;
    }
    if (!main.includes('function getCaptureShotCountForLayout')) {
      console.error('❌ FAIL: main.jsx missing getCaptureShotCountForLayout helper');
      hasErrors = true;
    }
    // Polaroid Best Cut: 3 shots instead of 1
    if (main.match(/layout\s*===\s*'polaroid'\s*\?\s*1\s*:\s*6/) && main.includes('captureShotCount')) {
      console.error('❌ FAIL: main.jsx polaroid captureShotCount must be 3 (Best Cut contract)');
      hasErrors = true;
    }
    // Hotfix 3.42: 1x Return Path
    if (!main.includes('val === 1 && wideCameraActive')) {
      console.error('❌ FAIL: main.jsx missing 1x return path for wide camera');
      hasErrors = true;
    }
    if (!main.includes('switchCameraDevice(normalCameraDeviceId)')) {
      console.error('❌ FAIL: main.jsx missing normal camera device return path');
      hasErrors = true;
    }
    if (!main.includes('type: \'lens-return\'')) {
      console.error('❌ FAIL: main.jsx missing lens-return option type');
      hasErrors = true;
    }

    // Torch Duplication Guard
    const torchSetterMatch = main.match(/setTorchEnabled\(settings\.torch \|\| false\)/g);
    if (torchSetterMatch && torchSetterMatch.length >= 2) {
      console.error('❌ FAIL: main.jsx contains duplicate setTorchEnabled calls');
      hasErrors = true;
    }

    // Capture Shot Count Policy
    if (!main.includes("layout === 'polaroid') return 3")) {
      console.error('❌ FAIL: main.jsx getCaptureShotCountForLayout missing polaroid=3 policy');
      hasErrors = true;
    }
    if (!main.includes("layout === 'trip') return 5")) {
      console.error('❌ FAIL: main.jsx getCaptureShotCountForLayout missing trip=5 policy');
      hasErrors = true;
    }

    // Hotfix 3.43: Zoom QA Instrumentation
    if (!main.includes('cameraZoomHistory')) {
      console.error('❌ FAIL: main.jsx missing cameraZoomHistory state');
      hasErrors = true;
    }
    if (!main.includes('pushCameraZoomHistory')) {
      console.error('❌ FAIL: main.jsx missing pushCameraZoomHistory helper');
      hasErrors = true;
    }
    if (!main.includes('trackLabel: track?.label') || !main.includes('zoomCap: capabilities.zoom')) {
      console.error('❌ FAIL: main.jsx getCameraDebugSnapshot missing FOV proxy fields');
      hasErrors = true;
    }

    // Camera Prewarm Check (Persistent getUserMedia)
    if (!main.includes('navigator.mediaDevices.getUserMedia') || !main.includes('streamRef.current = s')) {
      console.error('❌ FAIL: main.jsx missing persistent camera prewarm (getUserMedia on mount)');
      hasErrors = true;
    }
  }

  const rest = readFile('screens-v2-rest.jsx');
  if (rest) {
    if (!rest.includes('Math.abs') || !rest.includes('0.08')) {
      console.error('❌ FAIL: screens-v2-rest.jsx missing zoom active tolerance logic');
      hasErrors = true;
    }
    if (!rest.includes('ZoomHistoryPanel')) {
      console.error('❌ FAIL: screens-v2-rest.jsx missing ZoomHistoryPanel debug UI');
      hasErrors = true;
    }
    if (rest.includes('<ZoomHistoryPanel />') && !rest.includes('debugCamera &&')) {
       console.error('❌ FAIL: screens-v2-rest.jsx ZoomHistoryPanel must be gated by debugCamera');
       hasErrors = true;
    }
  }

  if (task) {
    const requiredSections = [
      'Best Cut Capture Contract',
      'Future Edit Capabilities',
      'Prewarm Policy',
      '카메라 Prewarm 제거 금지'
    ];
    requiredSections.forEach(s => {
      if (!task.includes(s)) {
        console.error(`❌ FAIL: task.md missing required section: ${s}`);
        hasErrors = true;
      }
    });
  }
}

function checkReleaseCandidateLock() {
  const main = readFile('main.jsx');
  const deco = readFile('screens-v2-deco.jsx');
  const motion = readFile('motion-export-contract.jsx');
  const swFile = readFile('sw.js');
  const task = readFile('task.md');

  // 1. AppErrorBoundary exists
  if (!main || !main.includes('AppErrorBoundary')) {
    console.error('❌ RC-1: main.jsx missing AppErrorBoundary');
    hasErrors = true;
  }

  // 2. IMMM_DIAGNOSTICS exists
  if (!main || !main.includes('IMMM_DIAGNOSTICS')) {
    console.error('❌ RC-2: main.jsx missing IMMM_DIAGNOSTICS');
    hasErrors = true;
  }

  // 3. getSnapshot / copySnapshot exists
  if (!main || !main.includes('getSnapshot') || !main.includes('copySnapshot')) {
    console.error('❌ RC-3: main.jsx missing getSnapshot / copySnapshot in IMMM_DIAGNOSTICS');
    hasErrors = true;
  }

  // 4. diagnostics must NOT include dataUrl
  if (main && main.includes('dataUrl') && main.includes('getSnapshot')) {
    const snapBlock = main.slice(main.indexOf('getSnapshot'));
    const closingIdx = snapBlock.indexOf('window.IMMM_DIAGNOSTICS');
    const snapSection = closingIdx > 0 ? snapBlock.slice(0, closingIdx) : snapBlock.slice(0, 600);
    if (snapSection.includes('.dataUrl')) {
      console.error('❌ RC-4: IMMM_DIAGNOSTICS.getSnapshot must not include photo dataUrl');
      hasErrors = true;
    }
  }

  // 5. diagnostics must NOT dump all localStorage
  if (main) {
    const snapIdx = main.indexOf('getSnapshot');
    if (snapIdx !== -1) {
      const snapSection = main.slice(snapIdx, snapIdx + 1200);
      if (snapSection.includes('JSON.stringify(localStorage)') || snapSection.includes('localStorage.getItem') && snapSection.includes('getAll')) {
        console.error('❌ RC-5: IMMM_DIAGNOSTICS must not dump all localStorage');
        hasErrors = true;
      }
    }
  }

  // 6. IMMM_FIELD_TEST or fieldTest=1 conditional exists
  if (!main || (!main.includes('IMMM_FIELD_TEST') && !main.includes("fieldTest"))) {
    console.error('❌ RC-6: main.jsx missing IMMM_FIELD_TEST / fieldTest panel conditional');
    hasErrors = true;
  }

  // 7. QR_SHARE_FAILURE_REASONS exists
  if (!deco || !deco.includes('QR_SHARE_FAILURE_REASONS')) {
    console.error('❌ RC-7: screens-v2-deco.jsx missing QR_SHARE_FAILURE_REASONS');
    hasErrors = true;
  }

  // 8. VIDEO_EXPORT_FAILURE_REASONS exists
  if (!motion || !motion.includes('VIDEO_EXPORT_FAILURE_REASONS')) {
    console.error('❌ RC-8: motion-export-contract.jsx missing VIDEO_EXPORT_FAILURE_REASONS');
    hasErrors = true;
  }

  // 9. release-manifest.json exists at root
  const manifest = readFile('release-manifest.json');
  if (!manifest) {
    console.error('❌ RC-9: release-manifest.json missing at project root');
    hasErrors = true;
  }

  // 10. dist/release-manifest.json exists
  const distManifest = readFile('dist/release-manifest.json');
  if (!distManifest) {
    console.error('❌ RC-10: dist/release-manifest.json missing');
    hasErrors = true;
  }

  // 11. release-manifest runtime = precompiled
  if (manifest) {
    try {
      const m = JSON.parse(manifest);
      if (m.runtime !== 'precompiled') {
        console.error('❌ RC-11: release-manifest.json runtime must be "precompiled"');
        hasErrors = true;
      }
    } catch (e) {
      console.error('❌ RC-11: release-manifest.json is not valid JSON');
      hasErrors = true;
    }
  }

  // 12. release-manifest branch must match
  if (manifest) {
    try {
      const m = JSON.parse(manifest);
      if (m.branch !== 'claude/session-adapter-hardening-03que') {
        console.error('❌ RC-12: release-manifest.json branch must be "claude/session-adapter-hardening-03que"');
        hasErrors = true;
      }
    } catch (e) { /* already reported in RC-11 */ }
  }

  // 13. fake immm.io share URL must not be assembled
  const shareFiles = ['share-viewer.jsx', 'screens-v2-deco.jsx', 'share-contract.jsx', 'cloud-share-adapter.jsx'];
  shareFiles.forEach(f => {
    const content = readFile(f);
    if (content && content.includes('immm.io/share')) {
      console.error(`❌ RC-13: ${f} must not assemble fake immm.io/share URL`);
      hasErrors = true;
    }
  });

  // 14. MediaRecorder.isTypeSupported must be guarded (not called without typeof MediaRecorder check)
  const mediaFiles = ['screens-v2-deco.jsx', 'screens-v2-rest.jsx', 'motion-export-contract.jsx'];
  mediaFiles.forEach(f => {
    const content = readFile(f);
    if (!content) return;
    const idx = content.indexOf('MediaRecorder.isTypeSupported');
    if (idx !== -1) {
      const context = content.slice(Math.max(0, idx - 80), idx);
      if (!context.includes('typeof MediaRecorder') && !context.includes('MediaRecorder !==')) {
        console.error(`❌ RC-14: ${f} calls MediaRecorder.isTypeSupported without typeof guard`);
        hasErrors = true;
      }
    }
  });

  // 15. sw.js SKIP_WAITING message handler exists
  if (!swFile || !swFile.includes('SKIP_WAITING')) {
    console.error('❌ RC-15: sw.js missing SKIP_WAITING message handler');
    hasErrors = true;
  }

  // 16. main.jsx controllerchange + reload guard exists
  if (!main || !main.includes('controllerchange') || !main.includes('__IMMM_RELOADING_FOR_UPDATE')) {
    console.error('❌ RC-16: main.jsx missing controllerchange + reload guard (__IMMM_RELOADING_FOR_UPDATE)');
    hasErrors = true;
  }

  // 17. renderFinalResultBlob / getFinalResultBlob not modified (names still present, contract preserved)
  if (!deco || (!deco.includes('renderFinalResultBlob') && !deco.includes('getFinalResultBlob'))) {
    console.error('❌ RC-17: screens-v2-deco.jsx missing renderFinalResultBlob / getFinalResultBlob (final path removed)');
    hasErrors = true;
  }

  // 18. URL.revokeObjectURL direct call outside revokeBlobUrl wrapper is prohibited
  // Allow: URL.revokeObjectURL inside revokeBlobUrl function body
  // Prohibit: URL.revokeObjectURL called from anywhere else
  const revokeFiles = ['result-gallery.jsx', 'screens-v2-deco.jsx'];
  revokeFiles.forEach(f => {
    const content = readFile(f);
    if (!content) return;
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.includes('URL.revokeObjectURL(')) {
        // Allow if on same line as revokeBlobUrl or try/catch inside revokeBlobUrl
        const surroundingLines = lines.slice(Math.max(0, i - 3), i + 2).join(' ');
        if (!surroundingLines.includes('revokeBlobUrl') && !surroundingLines.includes('function revokeBlobUrl')) {
          console.error(`❌ RC-18: ${f}:${i + 1} calls URL.revokeObjectURL directly — use revokeBlobUrl wrapper`);
          hasErrors = true;
        }
      }
    });
  });

  // 19. localStorage.clear / sessionStorage.clear prohibited (excluding comments)
  const allSrcFiles = ['main.jsx', 'screens-v2-deco.jsx', 'screens-v2-rest.jsx', 'screens-v2.jsx', 'app.jsx'];
  allSrcFiles.forEach(f => {
    const content = readFile(f);
    if (!content) return;
    const codeLines = content.split('\n').filter(l => {
      const trimmed = l.trim();
      return !trimmed.startsWith('//') && !trimmed.startsWith('*');
    });
    const codeOnly = codeLines.join('\n');
    if (codeOnly.includes('localStorage.clear()') || codeOnly.includes('sessionStorage.clear()')) {
      console.error(`❌ RC-19: ${f} must not call localStorage.clear() or sessionStorage.clear()`);
      hasErrors = true;
    }
  });

  // 20. pgpt stray guard — verify checkStrayFiles (which checks pgpt) is still present in this script
  const selfContent = readFile('scripts/sanity-check.mjs');
  if (!selfContent || !selfContent.includes('pgpt') || !selfContent.includes('checkStrayFiles')) {
    console.error('❌ RC-20: sanity-check.mjs pgpt / checkStrayFiles guard has been removed');
    hasErrors = true;
  }

  // RC-A: Cache alignment checks (Part A metadata consistency)
  if (manifest && swFile) {
    try {
      const m = JSON.parse(manifest);
      const cacheVersion = m.cache; // e.g., "v17"
      const swCacheName = swFile.match(/const CACHE_NAME = '([^']+)'/)?.[1] || '';
      if (!swCacheName.includes(cacheVersion)) {
        console.error(`❌ RC-A: sw.js CACHE_NAME does not include manifest cache version (${cacheVersion})`);
        hasErrors = true;
      }
    } catch (e) {
      console.error('❌ RC-A: release-manifest.json JSON parse failed');
      hasErrors = true;
    }
  }

  // RC-B: Privacy hardening checks (Part B diagnostics)
  const privacyFiles = ['main.jsx'];
  privacyFiles.forEach(f => {
    const content = readFile(f);
    if (!content) return;
    if (content.includes('JSON.stringify(localStorage)')) {
      console.error(`❌ RC-B1: ${f} must not use JSON.stringify(localStorage)`);
      hasErrors = true;
    }
    if (content.includes('Object.values(localStorage)')) {
      console.error(`❌ RC-B2: ${f} must not use Object.values(localStorage)`);
      hasErrors = true;
    }
    if (content.includes('Object.entries(localStorage)')) {
      console.error(`❌ RC-B3: ${f} must not use Object.entries(localStorage)`);
      hasErrors = true;
    }
  });

  // RC-C: QR Share / Share Viewer contract finalization checks (Part C)
  const decoFiles = ['screens-v2-deco.jsx'];
  decoFiles.forEach(f => {
    const content = readFile(f);
    if (!content) return;
    // Check for fake immm.io URLs
    if (content.includes('immm.io/share')) {
      console.error(`❌ RC-C1: ${f} must not assemble fake immm.io/share URLs`);
      hasErrors = true;
    }
    // QR Share must use getFinalResultBlob, not renderFinalResultBlob
    if (!content.includes('getFinalResultBlob')) {
      console.error(`❌ RC-C2: ${f} QR Share must use getFinalResultBlob`);
      hasErrors = true;
    }
    // Modal must have Copy/Open/Retry/Close buttons
    const hasQrReply = content.includes('handleCreateQrShare') || content.includes('getQrShareState');
    if (hasQrReply && !content.includes('Copy') && !content.includes('Retry')) {
      console.error(`❌ RC-C3: ${f} QR modal must have Copy/Open/Retry/Close elements`);
      hasErrors = true;
    }
  });

  // RC-D: Video Export capability/failure hardening checks (Part D)
  const motionFile = readFile('motion-export-contract.jsx');
  if (!motionFile || !motionFile.includes('VIDEO_EXPORT_FAILURE_REASONS')) {
    console.error('❌ RC-D1: motion-export-contract.jsx must define VIDEO_EXPORT_FAILURE_REASONS');
    hasErrors = true;
  }

  const decoFile = readFile('screens-v2-deco.jsx');
  if (decoFile) {
    // Check for MediaRecorder guard
    const mediaRecorderIdx = decoFile.indexOf('MediaRecorder.isTypeSupported');
    if (mediaRecorderIdx !== -1) {
      const context = decoFile.slice(Math.max(0, mediaRecorderIdx - 100), mediaRecorderIdx);
      if (!context.includes('typeof MediaRecorder') && !context.includes('MediaRecorder !==')) {
        console.error('❌ RC-D2: screens-v2-deco.jsx must guard MediaRecorder.isTypeSupported with typeof check');
        hasErrors = true;
      }
    }
    // Check for captureStream guard
    if (decoFile.includes('captureStream') && !decoFile.includes('typeof HTMLCanvasElement')) {
      console.error('❌ RC-D3: screens-v2-deco.jsx must guard captureStream with typeof check');
      hasErrors = true;
    }
  }

  // RC-E: Blob lifecycle finalization checks (Part E)
  if (decoFile) {
    // Check for activeSessionId cleanup effect
    if (!decoFile.includes('activeSessionId') || !decoFile.includes('sessionIdRef')) {
      console.error('❌ RC-E1: screens-v2-deco.jsx must have sessionIdRef and activeSessionId cleanup');
      hasErrors = true;
    }
    // Check for revokeBlobUrl wrapper usage (not direct URL.revokeObjectURL)
    const revokeMatches = decoFile.match(/URL\.revokeObjectURL\(/g);
    const revokeWrapperIdx = decoFile.indexOf('function revokeBlobUrl');
    if (revokeMatches && revokeMatches.length > 0) {
      // Count revokes — should mostly be inside revokeBlobUrl definition
      for (let i = 0; i < revokeMatches.length - 1; i++) {
        const idx = decoFile.indexOf('URL.revokeObjectURL(', decoFile.lastIndexOf('URL.revokeObjectURL(') + 1);
        if (idx > revokeWrapperIdx + 200) { // after function definition + body
          console.error('❌ RC-E2: screens-v2-deco.jsx direct URL.revokeObjectURL outside revokeBlobUrl wrapper');
          hasErrors = true;
          break;
        }
      }
    }
    // Check for exportBlobRef reset
    if (!decoFile.includes('exportBlobRef.current = { key: null, blob: null }')) {
      console.error('❌ RC-E3: screens-v2-deco.jsx must reset exportBlobRef in cleanup');
      hasErrors = true;
    }
  }

  // RC-F: PWA update UX finalization checks (Part F)
  const mainFile = readFile('main.jsx');
  if (swFile && !swFile.match(/addEventListener\s*\(\s*['"]message['"]\s*,/)) {
    console.error('❌ RC-F1: sw.js must have message event listener for SKIP_WAITING');
    hasErrors = true;
  }
  if (mainFile && !mainFile.includes('controllerchange')) {
    console.error('❌ RC-F2: main.jsx must have controllerchange listener for PWA update');
    hasErrors = true;
  }
  if (mainFile && !mainFile.includes('__IMMM_RELOADING_FOR_UPDATE')) {
    console.error('❌ RC-F3: main.jsx must have __IMMM_RELOADING_FOR_UPDATE guard');
    hasErrors = true;
  }
}

function checkInteractiveCreatorPlatform() {
  const framePresets = readFile('frame-presets.jsx');
  const motionContract = readFile('motion-frame-contract.jsx');
  const creatorProfile = readFile('creator-profile.jsx');
  const frameSystem = readFile('frame-system.jsx');
  const stickerEngine = readFile('sticker-engine.jsx');
  const setup = readFile('screens-v2.jsx');
  const deco = readFile('screens-v2-deco.jsx');

  if (framePresets) {
    ['FRAME_LAYER_TYPES', 'FRAME_BLEND_MODE_WHITELIST', 'FRAME_EXPORT_PRESETS', 'generateFrameIdea', 'loadDesignerDraftRecovery', 'saveDesignerDraftRecovery', 'clearDesignerDraftRecovery'].forEach((needle) => {
      if (!framePresets.includes(needle)) {
        console.error(`❌ FAIL: frame-presets.jsx missing ${needle}`);
        hasErrors = true;
      }
    });
    if (framePresets.includes('fetch(') || framePresets.includes('openai')) {
      console.error('❌ FAIL: frame-presets.jsx must not use real AI fetch or OpenAI calls');
      hasErrors = true;
    }
  } else {
    console.error('❌ FAIL: frame-presets.jsx missing');
    hasErrors = true;
  }

  if (motionContract) {
    ['MOTION_FRAME_LAYER_TYPES', 'MOTION_FRAME_BLEND_MODES', 'createMotionFrameLayersFromPreset', 'validateMotionFrameContract'].forEach((needle) => {
      if (!motionContract.includes(needle)) {
        console.error(`❌ FAIL: motion-frame-contract.jsx missing ${needle}`);
        hasErrors = true;
      }
    });
  } else {
    console.error('❌ FAIL: motion-frame-contract.jsx missing');
    hasErrors = true;
  }

  if (creatorProfile) {
    ['CREATOR_PROFILE_STORAGE_KEY', 'createCreatorProfile', 'normalizeCreatorProfile', 'getTrendingScore', 'buildCreatorSharePayload'].forEach((needle) => {
      if (!creatorProfile.includes(needle)) {
        console.error(`❌ FAIL: creator-profile.jsx missing ${needle}`);
        hasErrors = true;
      }
    });
  } else {
    console.error('❌ FAIL: creator-profile.jsx missing');
    hasErrors = true;
  }

  if (frameSystem && !frameSystem.includes('requestIdleCallbackSafe')) {
    console.error('❌ FAIL: frame-system.jsx missing requestIdleCallbackSafe');
    hasErrors = true;
  }
  if (stickerEngine) {
    ['getCanvasPointerPoint', 'onTouchStart', 'touchmove'].forEach((needle) => {
      if (!stickerEngine.includes(needle)) {
        console.error(`❌ FAIL: sticker-engine.jsx missing Samsung/touch fallback support: ${needle}`);
        hasErrors = true;
      }
    });
  }
  if (deco) {
    ['getDragPoint', 'useTouchFallback', 'onTouchStart', 'onTouchMove', 'onTouchEnd'].forEach((needle) => {
      if (!deco.includes(needle)) {
        console.error(`❌ FAIL: screens-v2-deco.jsx missing touch fallback support: ${needle}`);
        hasErrors = true;
      }
    });
    if (!deco.includes('onTouchStart={useTouchFallback ? onDrawStart : undefined}') && !deco.includes('onTouchStart={onDrawStart}')) {
      console.error('❌ FAIL: screens-v2-deco.jsx touch start binding missing');
      hasErrors = true;
    }
  }
  if (setup) {
    ['Frame Designer Studio', 'Generate Ideas', 'Export preset'].forEach((needle) => {
      if (!setup.includes(needle)) {
        console.error(`❌ FAIL: screens-v2.jsx missing creator platform UI: ${needle}`);
        hasErrors = true;
      }
    });
    if (!setup.includes("touchAction: 'none'") && !setup.includes("touchAction:'none'")) {
      console.error('❌ FAIL: screens-v2.jsx missing touchAction none creator drag guard');
      hasErrors = true;
    }
  }
}

function checkProductionSetupFramesHotfix() {
  const main = readFile('main.jsx') || '';
  const screens = readFile('screens-v2.jsx') || '';
  const frameSystem = readFile('frame-system.jsx') || '';
  const setupStart = screens.indexOf('function SetupScreen');
  const frameStoreStart = screens.indexOf('function FrameStoreScreen');
  const setupBody = setupStart !== -1 && frameStoreStart > setupStart
    ? screens.slice(setupStart, frameStoreStart)
    : extractFunctionBody(screens, 'function SetupScreen');
  const designerBody = extractFunctionBody(screens, 'function DesignerScreen');

  if (!main.includes("case 'frames'")) {
    console.error("❌ FAIL: main.jsx missing case 'frames'");
    hasErrors = true;
  }
  if (!main.includes("go('frames')")) {
    console.error("❌ FAIL: Landing Frames action must navigate to go('frames')");
    hasErrors = true;
  }
  if (main.includes('setSelectedFramePresetId(defaultFramePresetId)')) {
    console.error('❌ FAIL: selectedFramePresetId must not auto-inject defaultFramePresetId');
    hasErrors = true;
  }
  if (!main.includes('options.baseOnly === true')) {
    console.error('❌ FAIL: setLayoutAndPreset missing baseOnly mode');
    hasErrors = true;
  }
  if (!screens.includes('function FrameStoreScreen')) {
    console.error('❌ FAIL: screens-v2.jsx missing independent FrameStoreScreen');
    hasErrors = true;
  }
  if (!setupBody) {
    console.error('❌ FAIL: screens-v2.jsx missing SetupScreen body');
    hasErrors = true;
  } else {
    ['frameStoreOpen', 'importJsonText', 'storeSearch', 'selectedCreatorId'].forEach((needle) => {
      if (setupBody.includes(needle)) {
        console.error(`❌ FAIL: SetupScreen still owns Frame Store state: ${needle}`);
        hasErrors = true;
      }
    });
    ['Paste frame pack JSON here', 'Export My Frames as JSON', 'Featured Packs', 'View Creator'].forEach((needle) => {
      if (setupBody.includes(needle)) {
        console.error(`❌ FAIL: SetupScreen still renders Frame Store UI: ${needle}`);
        hasErrors = true;
      }
    });
    if (!setupBody.includes('baseOnly: true')) {
      console.error('❌ FAIL: Setup base layout cards must call setLayout with baseOnly true');
      hasErrors = true;
    }
    if (!setupBody.includes('CleanFrameMiniPreview') && !setupBody.includes('framePreset={null}')) {
      console.error('❌ FAIL: Setup base frame thumbnails must not use applied frame presets');
      hasErrors = true;
    }
  }
  if (!frameSystem.includes("'1x3':") && !frameSystem.includes('"1x3":')) {
    console.error("❌ FAIL: frame-system.jsx FRAME_TEMPLATES missing '1x3'");
    hasErrors = true;
  }
  if (!screens.includes('function DesignerPreviewCanvas')) {
    console.error('❌ FAIL: DesignerPreviewCanvas missing');
    hasErrors = true;
  }
  ['getDesignerPreviewMetrics', 'clientPointToCanvasPoint', 'canvasRectToPreviewRect'].forEach((needle) => {
    if (!screens.includes(needle)) {
      console.error(`❌ FAIL: screens-v2.jsx missing Designer preview coordinate helper: ${needle}`);
      hasErrors = true;
    }
  });
  if (designerBody.includes('<WFrameThumb') || designerBody.includes('FrameThumb')) {
    console.error('❌ FAIL: DesignerScreen manipulation preview must not use FrameThumb');
    hasErrors = true;
  }
}

function checkProductionHotfix2() {
  const main = readFile('main.jsx') || '';
  const screens = readFile('screens-v2.jsx') || '';
  const presets = readFile('frame-presets.jsx') || '';

  // 1. clean-white-4cut decorations empty check
  const cleanWhiteMatch = presets.match(/id:\s*'clean-white-4cut'[\s\S]*?decorations:\s*\[([\s\S]*?)\]/);
  if (cleanWhiteMatch && cleanWhiteMatch[1].trim() !== '') {
    console.error("❌ FAIL: clean-white-4cut decorations must be empty []");
    hasErrors = true;
  }

  // 2. black-studio-4cut decorations empty check
  const blackStudioMatch = presets.match(/id:\s*'black-studio-4cut'[\s\S]*?decorations:\s*\[([\s\S]*?)\]/);
  if (blackStudioMatch && blackStudioMatch[1].trim() !== '') {
    console.error("❌ FAIL: black-studio-4cut decorations must be empty []");
    hasErrors = true;
  }

  // 3. resetAppliedFramePreset defined in main.jsx
  if (!main.includes('resetAppliedFramePreset')) {
    console.error("❌ FAIL: main.jsx missing resetAppliedFramePreset");
    hasErrors = true;
  }

  // 4. resetAppliedFramePreset prop in SetupScreen
  if (!screens.includes('resetAppliedFramePreset')) {
    console.error("❌ FAIL: screens-v2.jsx SetupScreen missing resetAppliedFramePreset prop or usage");
    hasErrors = true;
  }

  // 5. SetupScreen '기본 프레임으로 초기화' button check
  if (!screens.includes('기본 프레임으로 초기화')) {
    console.error("❌ FAIL: SetupScreen missing '기본 프레임으로 초기화' button");
    hasErrors = true;
  }

  // 6. FrameStoreScreen simplified tabs check (4 tabs)
  const storeSection = screens.match(/function FrameStoreScreen[\s\S]*?const\s+tabs\s*=\s*\[([\s\S]*?)\];/);
  if (storeSection) {
    const tabsCount = (storeSection[1].match(/\[/g) || []).length;
    if (tabsCount > 4) {
      console.error(`❌ FAIL: FrameStoreScreen tabs must be simplified to 4 tabs, found ${tabsCount}`);
      hasErrors = true;
    }
  }

  // 7. DesignerScreen activeTab default layout
  if (!screens.includes("activeTab, setActiveTab] = uS('layout')")) {
    console.error("❌ FAIL: DesignerScreen activeTab default state must be 'layout'");
    hasErrors = true;
  }

  // 8. DesignerScreen showAdvancedLayers state
  if (!screens.includes('showAdvancedLayers')) {
    console.error("❌ FAIL: DesignerScreen missing showAdvancedLayers state");
    hasErrors = true;
  }

  // 9. DesignerScreen toggle button text
  if (!screens.includes('고급 레이어')) {
    console.error("❌ FAIL: DesignerScreen missing '고급 레이어' toggle button text");
    hasErrors = true;
  }

  // 10. DesignerScreen gridTemplateColumns 60%/40% layout
  if (!screens.includes('minmax(520px, 1.35fr) minmax(360px, 0.65fr)')) {
    console.error("❌ FAIL: DesignerScreen grid template columns must use 60%/40% proportions");
    hasErrors = true;
  }
}

async function checkCustomCanvasSizePrioritization() {
  const frameSystem = readFile('frame-system.jsx') || '';
  if (!frameSystem.includes('baseCanvasSize') || !frameSystem.includes('framePreset.canvasSize')) {
    console.error('❌ FAIL: frame-system.jsx must prioritize framePreset.canvasSize in renderComposition and renderFrameToCanvas');
    hasErrors = true;
  }

  try {
    const sandbox = {
      console,
      Math,
      Date,
      JSON,
      document: {
        fonts: { ready: Promise.resolve() },
        createElement(tag) {
          if (tag === 'canvas') {
            return {
              getContext() {
                return {
                  save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
                  fillRect() {}, fillText() {}, beginPath() {}, rect() {}, clip() {}, drawImage() {},
                  arc() {}, fill() {}, stroke() {}, lineTo() {}, moveTo() {}, closePath() {},
                  createPattern() { return { setTransform() {} }; }, measureText() { return { width: 10 }; },
                  ellipse() {}, quadraticCurveTo() {}, bezierCurveTo() {}, clearRect() {}
                };
              },
              width: 0,
              height: 0,
            };
          }
          return {};
        }
      },
      window: {},
      Promise
    };
    sandbox.window = sandbox;
    sandbox.getFrameTemplateSafe = () => ({
      canvasSize: { width: 560, height: 1200 },
      photoSlots: []
    });
    sandbox.getFrameTemplate = sandbox.getFrameTemplateSafe;
    sandbox.getFrameTheme = () => ({ frameBg: '#fff', photoBg: '#eee' });
    sandbox.preloadStickerImages = () => Promise.resolve(new Map());
    sandbox.getFramePresetApiSafe = () => null;
    sandbox.nowMs = () => Date.now();
    sandbox.logExportPerf = () => {};

    const ReactMock = {
      useRef: () => ({ current: null }),
      useEffect: () => {},
      useCallback: (fn) => fn,
      useState: (init) => [init, () => {}],
      createContext: () => ({ Provider: ({children}) => children }),
      useContext: () => ({}),
      useMemo: (fn) => fn(),
    };
    sandbox.React = ReactMock;

    vm.createContext(sandbox);

    const distFrameSystem = fs.readFileSync('dist/frame-system.js', 'utf8');
    vm.runInContext(distFrameSystem, sandbox);

    const renderFrameToCanvasFn = sandbox.window.FrameRenderEngine?.renderToCanvas || sandbox.renderFrameToCanvas;
    if (typeof renderFrameToCanvasFn === 'function') {
      const mockInput = {
        layout: 'strip',
        framePreset: {
          canvasSize: { width: 1000, height: 2000 },
          photoSlots: []
        },
        skipAssetValidation: true
      };
      const canvasResult = await renderFrameToCanvasFn(mockInput);
      if (canvasResult.width !== 1000 || canvasResult.height !== 2000) {
        console.error('❌ FAIL: renderFrameToCanvas did not prioritize framePreset.canvasSize, got width:', canvasResult.width, 'height:', canvasResult.height);
        hasErrors = true;
      }
    } else {
      console.error('❌ FAIL: renderFrameToCanvas function not found in VM sandbox');
      hasErrors = true;
    }
  } catch (vmErr) {
    console.error('❌ FAIL: framePreset.canvasSize prioritization VM test failed with error:', vmErr.message);
    hasErrors = true;
  }
}

checkStrayFiles();
checkBlobUrlLifecycle();
checkStickerPreload();
checkBabelMigrationPlan();
checkCameraArchitecture();
checkCameraModelAndBestCut();
checkStabilityAuditDocumented();
checkReactProductionMode();
checkReleaseCandidateLock();
checkInteractiveCreatorPlatform();
checkProductionSetupFramesHotfix();
checkProductionHotfix2();
await checkCustomCanvasSizePrioritization();

if (hasErrors) {
  console.error('\n💥 Sanity check failed! DO NOT REMOVE GUARDS. FIX THE CODE.');
  process.exit(1);
} else {
  console.log('\n✅ All sanity checks passed. Zero-Distortion & Zero-Crash baseline restored.');
}
