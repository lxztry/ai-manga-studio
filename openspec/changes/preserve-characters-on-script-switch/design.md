## Context
The app has two levels of character storage:
1. Global `characters` array in app state - intended as a character library
2. Script-level `characters` array within each Script object

Currently, when `loadScript()` is called, it replaces the global characters with `script.characters`, losing any characters in the global library. Similarly, `createNewScript()` resets characters to empty.

## Goals / Non-Goals
- Goals: Preserve global character library when switching scripts
- Non-Goals: 
  - Modify how characters are stored within individual scripts
  - Add character sync between scripts (each script can have its own character list)

## Decisions
- Decision: Keep global characters as a shared library that persists across all scripts
- Implementation approach: When loading a script, merge global characters with script-specific characters (deduplicating by ID)
- When creating a new script: Don't reset the global characters array

## Risks / Trade-offs
- Risk: Characters may accumulate over time if users create many characters
- Mitigation: No action needed for MVP; can add character deletion/cleanup later if needed

## Migration Plan
1. Update `loadScript` to merge characters instead of replacing
2. Update `createNewScript` to preserve existing characters
3. Test that existing functionality still works
