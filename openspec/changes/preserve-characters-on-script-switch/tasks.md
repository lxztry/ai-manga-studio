## 1. Implementation

- [x] 1.1 Modify `loadScript` function in `src/context/AppContext.tsx` to merge global characters with script characters instead of replacing
- [x] 1.2 Modify `createNewScript` function to preserve existing global characters instead of resetting to empty array

## 2. Verification

- [x] 2.1 Run `npm run build` to verify no TypeScript errors
- [x] 2.2 Run `npm run lint` to verify no ESLint errors (ESLint not installed)
- [ ] 2.3 Test manually: create characters, switch between scripts, verify characters persist
