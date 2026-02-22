# AI Manga Studio - Specification

## 1. Project Overview

**Project Name**: AI Manga Studio (AI 漫剧工作室)  
**Type**: Web Application  
**Core Functionality**: AI-powered manga/comic creation platform from script to video export  
**Target Users**: Manga creators, comic artists, content creators

---

## 2. Technology Stack

| Category | Technology |
|----------|------------|
| Frontend | React 18, TypeScript |
| Build | Vite |
| Styling | TailwindCSS |
| Icons | Lucide React |
| State | React Context |
| Storage | localStorage |

---

## 3. Core Features

### 3.1 Script Editor
- AI script generation with multiple LLM providers
- Text import with AI parsing
- Manual scene/dialogue editing
- Genre templates

### 3.2 Character Manager
- Create/edit/delete characters
- Character appearance, personality fields
- Character library

### 3.3 Storyboard Editor
- Drag-and-drop panel reordering
- Scene association
- Batch image upload
- Quick generation from scenes
- Individual/batch AI image generation

### 3.4 AI Image Generation
- Multi-provider support:
  - SiliconFlow (recommended, China-friendly)
  - Pollinations AI
  - HuggingFace
  - Stability AI
- Style options: manga, anime, realistic, watercolor, comic, sketch, gouache, lineart
- Art styles: cinematic, dramatic, soft, vibrant, moody, dreamy
- Character consistency with reference images
- Camera angles

### 3.5 Video Export
- Static export: WebM video, image sequence, HTML
- AI video generation (SiliconFlow Wan2.2)
- AI voice/TTS (CosyVoice)
- Auto subtitle generation (SRT)
- Background music support

### 3.6 Template System
- Built-in templates: adventure, romance, sci-fi, fantasy, mystery, comedy
- Project import/export (JSON)

---

## 4. API Integrations

### 4.1 LLM Providers
| Provider | Purpose | Auth |
|----------|---------|------|
| OpenAI | Script generation | API Key |
| OpenRouter | Script generation | API Key |
| Anthropic | Script generation | API Key |
| Local | Script generation | Base URL |

### 4.2 Image/Video Providers
| Provider | Purpose | Auth |
|----------|---------|------|
| SiliconFlow | Image/Video/TTS | API Key |
| Pollinations | Image | None (needs proxy) |
| HuggingFace | Image | API Key |
| Stability AI | Image | API Key |

---

## 5. Data Model

### Script
- title: string
- description: string
- genre: string
- scenes: Scene[]

### Scene
- id: string
- name: string
- description: string
- location: string
- timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
- dialogues: Dialogue[]

### Character
- id: string
- name: string
- appearance: string
- personality: string
- traits: string[]

### Storyboard
- id: string
- scriptId: string
- panels: StoryboardPanel[]

### StoryboardPanel
- id: string
- sceneId: string | null
- description: string
- prompt: string
- imageUrl: string | null

---

## 6. User Interface

### Navigation
- Left sidebar with tab navigation
- Tabs: Script, Characters, Storyboard, Image, Templates, Export

### Settings Panel
- API provider selection
- API key input
- Model selection
- SiliconFlow API key (separate)

### Data Persistence
- localStorage with key: `ai-manga-studio-data`
- Project export/import as JSON backup

---

## 7. File Structure

```
ai-manga-studio/
├── src/
│   ├── components/
│   │   ├── CharacterManager/
│   │   ├── ImageGenerator/
│   │   ├── Layout/
│   │   ├── MangaExporter/
│   │   ├── ScriptEditor/
│   │   ├── StoryboardEditor/
│   │   └── Templates/
│   ├── context/
│   ├── types/
│   ├── utils/
│   └── styles/
├── .openspec/
│   └── config.yaml
├── specs/
│   └── SPEC.md (this file)
├── AGENTS.md
├── README.md
└── package.json
```

---

## 8. OpenSpec Integration

This project uses OpenSpec for Spec-Driven Development (SDD).

### Workflow
1. Create a change: `/opsx:new <feature-name>`
2. Generate planning: `/opsx:ff`
3. Implement: `/opsx:apply`
4. Validate: `/opsx:validate`

### Commands
```bash
openspec init          # Initialize OpenSpec
openspec status        # Check status
openspec validate      # Validate against spec
openspec new <name>    # Create new change
```

---

*Last updated: 2026-02-23*
*Version: 1.0.0*
