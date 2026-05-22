# Touch Policy

## Goals
- Samsung Internet must not process pointer and touch path twice.
- Touch fallback must be single-path.
- Drag should not trigger scroll unexpectedly.
- Passive listener options must be explicit where preventDefault is required.
- Touch state cleanup must run on cancel/end.

## Required checks
- isSamsungInternet or equivalent UA branch
- pointer/touch dedupe guard
- touchStart/touchMove/touchEnd fallback
- touchCancel cleanup
- selected object remains stable during drag
