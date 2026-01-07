# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies
npm install

# Development (starts Vite dev server + Electron)
npm run dev

# Type checking
npm run typecheck

# Production build (includes TypeScript check + Vite build + Electron packaging)
npm run build

# Platform-specific builds
npm run build:win
npm run build:mac
npm run build:linux
```

## Architecture Overview

This is an Electron + Vue 3 desktop application for creating AI-powered explainer videos. The app follows a multi-phase workflow: Project Setup → Content Generation → Slide Editing → Audio Generation → Video Assembly.

### Process Boundaries

**Main Process** (`electron/main.ts`):
- Handles all external API calls (OpenAI, Google GenAI, Pexels, ElevenLabs, Remove.bg)
- Manages project files stored in `app.getPath('userData')/projects/`
- Uses `electron-store` for settings and API keys (encrypted in `api-keys` store)
- Coordinates FFmpeg for video assembly via `fluent-ffmpeg`
- All IPC handlers are defined here

**Preload** (`electron/preload.ts`):
- Exposes `window.electronAPI` to renderer via `contextBridge`
- Type-safe bridge between renderer and main process

**Renderer Process** (`src/renderer/`):
- Vue 3 with Composition API
- Pinia stores for state management
- Tailwind CSS for styling

### Key Stores

- `projectStore`: Project lifecycle, content strategy generation, slide CRUD operations. Use `JSON.parse(JSON.stringify(toRaw(...)))` when passing reactive objects to IPC calls.
- `slidesStore`: Active slide state for the editor, element manipulation, visual data management
- `settingsStore`: App preferences and API key status

### Data Flow

1. `ProjectConfig` → OpenAI GPT-4o generates `ContentStrategy` with slide plans
2. `ContentStrategy.slides[]` → converted to editable `Slide[]` with positioned `SlideElement[]`
3. Slides rendered to PNG via `html2canvas` in renderer, saved via `save-slide-png` IPC
4. Narration text → TTS API → MP3 files in project's `audio/` directory
5. Video assembly: PNG + MP3 per slide → FFmpeg → individual slide videos → concatenated final MP4

### Type Definitions

All shared types are in `src/shared/types.ts`. Key types:
- `Project`: Full project state with phases, costs, file paths
- `Slide`: User-editable slide with elements, visual data, background settings
- `SlideStrategy`: AI-generated slide plan (from content strategy)
- `SlideElement`: Positioned element (headline, subheadline, body, bullets, image)

### Path Aliases

- `@` → `src/`
- `@shared` → `src/shared/`

### Environment Variables

API keys can be set via `.env` file (checked in order: `dist-electron/../.env`, `userData/.env`, `cwd/.env`) or through the Settings UI which stores them encrypted in electron-store.

Required keys for full functionality:
- `OPENAI_API_KEY`: Content generation, TTS, image generation (gpt-image-1)
- `GOOGLE_GENAI_API_KEY`: Gemini image generation
- `PEXELS_API_KEY`: Stock photo search
- `ELEVENLABS_API_KEY`: Premium TTS (optional)
- `REMOVEBG_API_KEY`: Background removal (optional)
