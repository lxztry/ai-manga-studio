# AI Manga Studio - Agent Guidelines

This document provides guidelines for AI agents working in this codebase.

---

## 1. Build, Lint, and Test Commands

### Development
```bash
npm run dev          # Start development server (port 3000)
```

### Build
```bash
npm run build       # TypeScript check + Vite production build
npm run preview     # Preview production build locally
```

### Linting
```bash
npm run lint        # ESLint check for TypeScript/TSX files
```

### Type Checking
```bash
npx tsc --noEmit   # TypeScript type checking only
```

**Note:** This project has no test framework configured. To add tests, consider installing Vitest or Jest.

---

## 2. Project Structure

```
ai-manga-studio/
├── src/
│   ├── components/          # React components
│   │   ├── CharacterManager/
│   │   ├── ImageGenerator/
│   │   ├── Layout/
│   │   ├── MangaExporter/
│   │   ├── ScriptEditor/
│   │   └── StoryboardEditor/
│   ├── context/             # React Context (state management)
│   ├── types/               # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── styles/             # Global CSS
│   ├── App.tsx             # Root component
│   └── main.tsx             # Entry point
├── .opencode/skills/        # OpenCode skills (optional)
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## 3. Code Style Guidelines

### TypeScript

- **Strict Mode**: Always enabled. Do not use `any` unless absolutely necessary
- **Type Definitions**: Use explicit types for function parameters and return values
- **Interfaces vs Types**: Use `interface` for object shapes, `type` for unions/aliases

### React/TSX

- **Component Style**: Use functional components with hooks
- **Props**: Define props using TypeScript interfaces
- **State**: Use `useState` for local state, `useContext` for global state
- **Effects**: Always include dependency arrays in `useEffect`

### Imports

```typescript
// Order: external → internal → relative
import { useState, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import type { Character } from '../types'
import { generateScript } from '../utils/ai'

// Avoid: import * as X, default imports (except React)
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Components | PascalCase | `ScriptEditor` |
| Functions | camelCase | `handleSubmit` |
| Types/Interfaces | PascalCase | `Character` |
| Constants | UPPER_SNAKE | `MAX_PANELS` |
| Files | kebab-case | `script-editor.tsx` |

### Error Handling

- Use try-catch for async operations
- Display user-friendly error messages via UI
- Log errors to console with context
- Never expose internal errors to users

```typescript
try {
  await generateImage(prompt)
} catch (error) {
  console.error('Image generation failed:', error)
  setError('Failed to generate image. Please try again.')
}
```

### CSS/Styling

- Use Tailwind CSS classes in components
- Define custom utilities in `src/styles/globals.css`
- Avoid inline styles except for dynamic values
- Follow BEM-like naming for custom CSS classes

### API Calls

- Handle loading and error states
- Validate API responses
- Use environment variables for API keys (never hardcode)

---

## 4. Specific Guidelines

### Image Generation
- Support multiple providers: Pollinations AI, HuggingFace, Stability AI, OpenAI, OpenRouter
- Use free providers (Pollinations) by default for testing
- Handle CORS issues gracefully

### Video Export
- Use Canvas API for frame-by-frame rendering
- Support WebM format with MediaRecorder
- Handle audio via Web Audio API
- Provide fallback to image sequence export

### Data Persistence
- Use localStorage for data persistence
- Implement export/import functionality for backups
- Handle storage quota limits gracefully

---

## 5. Common Patterns

### State Updates with Context
```typescript
const updateStoryboardPanel = useCallback((panelId: string, updates: Partial<StoryboardPanel>) => {
  setState(prev => {
    if (!prev.storyboard) return prev
    const updatedPanels = prev.storyboard.panels.map(panel =>
      panel.id === panelId ? { ...panel, ...updates } : panel
    )
    return {
      ...prev,
      storyboard: {
        ...prev.storyboard,
        panels: updatedPanels,
      },
    }
  })
}, [])
```

### File Upload Handler
```typescript
const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return
  
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file')
    return
  }
  
  const reader = new FileReader()
  reader.onload = (event) => {
    const base64 = event.target?.result as string
    setImage(base64)
  }
  reader.readAsDataURL(file)
}
```

---

## 6. Checklist Before Committing

- [ ] Run `npm run build` - no TypeScript errors
- [ ] Run `npm run lint` - no ESLint errors
- [ ] Check for console.log statements (remove in production)
- [ ] Verify no hardcoded API keys
- [ ] Test the feature manually

---

## 7. Available Skills

This project includes OpenCode skills in `.opencode/skills/`:

- **manga-generator** - AI manga creation workflow
- **skill-creator** - How to create OpenCode skills
- **react-component** - React component best practices
- **api-designer** - RESTful API design guidelines
- **video-prompt** - Video prompt optimization (Seedance/Runway/Pika/Kling)

---

*Last updated: 2026-02-21*
