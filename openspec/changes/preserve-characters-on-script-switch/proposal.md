# Change: Preserve Characters When Switching Scripts

## Why
Currently, when users switch between scripts or create a new script, all previously added characters are lost because the global `characters` array is replaced with `script.characters` or reset to empty. This forces users to re-add characters every time they switch scripts, which is poor user experience.

## What Changes
- Modify `loadScript` function in `AppContext.tsx` to merge global characters with script-specific characters instead of replacing them
- Modify `createNewScript` function to preserve existing global characters instead of resetting to empty
- Ensure characters added to the global library persist across all scripts

## Impact
- Affected code: `src/context/AppContext.tsx`
- Affected capabilities: Character management, Script management
- User behavior change: Characters will now persist when switching between scripts
