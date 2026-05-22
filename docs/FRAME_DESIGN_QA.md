# FRAME DESIGN QA

This document covers the frame sample review flow for IMMM.

## Sample page

Generate the visual QA page from the precompiled frame preset bundle:

```bash
npm run build:precompile
node scripts/export-frame-samples.mjs
```

Open `qa/frame-samples/index.html` in a browser. The page shows:

- preset id, name, layout, and canvas size
- slot coverage and decoration count
- pack name, author, and license
- the current QA checklist

## Designer save/load QA

Verify the following flows after editing a frame in Designer:

1. Create a new frame.
2. Adjust background, slots, decorations, text, and watermark.
3. Save to My Frames.
4. Reload the frame from My Frames.
5. Duplicate and edit the frame.
6. Soft delete the frame and confirm it is hidden from the default list.

## My Frames regression checklist

- Saved frames should not include photo `dataUrl` data.
- Imported frames should preserve metadata but ignore unknown fields.
- Deleted frames should remain recoverable through soft delete semantics.
- Preview and export should render the same frame structure.
