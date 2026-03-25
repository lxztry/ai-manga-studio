# Change: Add Batch Image Generation Queue

## Why

Current image generation processes one panel at a time, causing:
- Sequential waiting for each image to complete
- Poor UX when generating multiple panels
- No progress visibility for batch operations

## What Changes

- Add a batch queue system for parallel image generation
- Allow users to queue multiple panel generations
- Show real-time progress for batch operations
- Support pause/resume/cancel for batch jobs
- Persist queue state for recovery

## Impact

- Affected specs: image-generation
- Affected code: src/utils/ai.ts, src/components/ImageGenerator/
