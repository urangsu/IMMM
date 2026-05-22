# QA Matrix

| Area | What to verify | Status |
| --- | --- | --- |
| Frame samples | Exported QA page shows preset geometry and metadata | Required |
| Designer save/load | Background, slots, decorations, text, and watermark survive save/load | Required |
| My Frames lifecycle | Rename, duplicate, soft delete, and hidden deleted entries | Required |
| Pack import/export | JSON validation rejects photo `dataUrl` and large payloads | Required |
| Render parity | Setup, Deco, Result, Save Image, and Share Image stay aligned | Required |

## Frame sample review

- Open `qa/frame-samples/index.html`.
- Review each preset card for slot count, canvas size, pack metadata, and author/license tags.
- Confirm the `Featured`, `Free`, `My Frames`, and `Premium` groupings make sense for the current catalog.

## Regression notes

- If frame geometry changes, regenerate the sample page.
- If a pack is added or removed, update the sample page and the cloud QA contract.
