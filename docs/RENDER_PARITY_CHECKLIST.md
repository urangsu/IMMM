# Render Parity Checklist

The same frame preset should be visually consistent across:

- Setup FrameThumb
- Frame Store thumbnail
- Designer preview
- Deco preview
- Result preview
- Save Image export
- Share Image export

## Invariants
- layout and framePreset.layout must match
- selectedFramePresetId must persist
- background drawn once
- photo slots drawn once
- watermark drawn once
- decorations drawn in layer order
- preset without layers falls back to back/front path
- preset without framePreset keeps legacy frame output
