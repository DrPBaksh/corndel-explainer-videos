# Corndel Explainer Videos - Implementation Plan

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Project Structure](#project-structure)
5. [Data Models](#data-models)
6. [Phase 1: AI Plan Generation](#phase-1-ai-plan-generation)
7. [Phase 2: Interactive Slide Builder](#phase-2-interactive-slide-builder)
8. [Phase 3: Audio Generation](#phase-3-audio-generation)
9. [Phase 4: Video Assembly](#phase-4-video-assembly)
10. [IPC Handlers](#ipc-handlers)
11. [Vue Components](#vue-components)
12. [Pinia Stores](#pinia-stores)
13. [API Integrations](#api-integrations)
14. [Reference Images System](#reference-images-system)
15. [Implementation Order](#implementation-order)
16. [Cost Tracking](#cost-tracking)
17. [Future Enhancements](#future-enhancements)

---

## Project Overview

### Purpose
An Electron-based desktop application that generates professional explainer videos through an AI-assisted, user-interactive workflow. The app combines AI-powered content planning with hands-on slide editing, giving users control while leveraging AI capabilities.

### Key Differentiators from Python Version
- **Interactive editing** - Users review and modify each slide (not fully automated)
- **Drag-and-drop canvas** - Visual positioning of elements
- **Per-slide audio** - Individual MP3 files for natural timing
- **Desktop app** - Electron + Vue (not Python CLI)
- **Reference images** - Corndel brand assets as backgrounds

### User Workflow
```
User Inputs → AI Generates Plan → User Edits Each Slide → Generate Audio → Assemble Video
     ↓              ↓                      ↓                    ↓              ↓
  Settings    ContentStrategy       SlideEditor            Per-slide MP3    Final MP4
```

---

## Technology Stack

### Core Framework
| Component | Technology | Version | Source |
|-----------|------------|---------|--------|
| Desktop Shell | Electron | ^33.0.0 | video-cropper |
| Frontend | Vue 3 (Composition API) | ^3.5.0 | both repos |
| State Management | Pinia | ^2.2.0 | both repos |
| Styling | Tailwind CSS | ^3.4.0 | both repos |
| Build Tool | Vite | ^6.0.0 | video-cropper |
| Language | TypeScript | ^5.7.0 | both repos |

### APIs & Services
| Service | Purpose | SDK/Method |
|---------|---------|------------|
| OpenAI GPT-5/4o | Content strategy, HTML diagrams | `openai` npm package |
| OpenAI TTS | Voice generation | `openai.audio.speech.create()` |
| ElevenLabs | Premium voice option | REST API |
| Google GenAI | AI image generation | `@google/genai` ^0.7.0 |
| Pexels | Stock photos | REST API |

### Local Processing
| Component | Technology | Purpose |
|-----------|------------|---------|
| HTML → PNG | Playwright | Render slides |
| Video Assembly | FFmpeg | Concat slides + audio |
| Persistence | electron-store | Settings, projects |

---

## Architecture

### Two-Process Model
```
┌─────────────────────────────────────────────────────────────────────┐
│ MAIN PROCESS (Node.js) - electron/main.ts                          │
├─────────────────────────────────────────────────────────────────────┤
│ • File system operations (read/write slides, audio, video)         │
│ • API calls (OpenAI, ElevenLabs, Google GenAI, Pexels)            │
│ • Playwright for HTML → PNG rendering                              │
│ • FFmpeg for video assembly                                        │
│ • electron-store for persistence                                   │
│ • IPC handlers (ipcMain.handle)                                    │
└─────────────────────────────────────────────────────────────────────┘
                              ↕ IPC Bridge
┌─────────────────────────────────────────────────────────────────────┐
│ PRELOAD - electron/preload.ts                                       │
├─────────────────────────────────────────────────────────────────────┤
│ • contextBridge.exposeInMainWorld('electronAPI', {...})            │
│ • Type-safe method exposure to renderer                            │
│ • Progress event listeners                                          │
└─────────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────────┐
│ RENDERER PROCESS (Vue 3 SPA) - src/renderer/                       │
├─────────────────────────────────────────────────────────────────────┤
│ • Vue components for UI                                             │
│ • Pinia stores for state                                           │
│ • Calls window.electronAPI.* for all operations                    │
│ • Tailwind CSS styling                                             │
└─────────────────────────────────────────────────────────────────────┘
```

### Four-Phase Pipeline
```
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 1: AI PLAN GENERATION                                         │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ User Inputs:                                                     │ │
│ │ • Number of slides (or flexible)                                │ │
│ │ • Video duration target                                         │ │
│ │ • Topic/description                                             │ │
│ │ • Voice type selection (global)                                 │ │
│ │ • Web search enabled? (yes/no)                                  │ │
│ │ • Grounded material (optional documents)                        │ │
│ │                           ↓                                      │ │
│ │ OpenAI GPT-5 → ContentStrategy JSON                             │ │
│ │ (slides, layouts, visual types, narration scripts)              │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 2: INTERACTIVE SLIDE BUILDER (repeat for each slide)         │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ For each slide:                                                  │ │
│ │ 1. Display AI-suggested text → User can edit                    │ │
│ │ 2. Display AI-suggested layout → User can change                │ │
│ │ 3. Canvas editor with drag-and-drop positioning                 │ │
│ │ 4. Visual generation options:                                   │ │
│ │    • GPT HTML diagram → render → PNG                            │ │
│ │    • Pexels search (show top 10, user picks)                    │ │
│ │    • Google GenAI image generation                              │ │
│ │ 5. Reference images as slide backgrounds                        │ │
│ │ 6. Edit narration text at bottom                                │ │
│ │ 7. Save → Next slide                                            │ │
│ │                           ↓                                      │ │
│ │ Output: slide_00.png, slide_01.png, ... + metadata              │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 3: AUDIO GENERATION                                           │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ User clicks "Generate Transcript"                                │ │
│ │ Select voice API: OpenAI TTS or ElevenLabs                      │ │
│ │                           ↓                                      │ │
│ │ For each slide:                                                  │ │
│ │   narration text → TTS API → slide_00.mp3                       │ │
│ │                           ↓                                      │ │
│ │ Output: Individual MP3 per slide with duration metadata         │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 4: VIDEO ASSEMBLY                                             │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ For each slide:                                                  │ │
│ │   slide_XX.png + slide_XX.mp3 → slide_XX.mp4 (duration = audio) │ │
│ │                           ↓                                      │ │
│ │ FFmpeg concat all slide videos → final_video.mp4                │ │
│ │                           ↓                                      │ │
│ │ Output: final_video.mp4 + all artifacts                         │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
corndel-explainer-videos/
├── electron/
│   ├── main.ts                      # Main process entry, IPC handlers
│   ├── preload.ts                   # Context bridge API
│   └── services/
│       ├── openaiService.ts         # GPT and TTS calls
│       ├── elevenLabsService.ts     # ElevenLabs TTS
│       ├── genaiService.ts          # Google GenAI image generation
│       ├── pexelsService.ts         # Pexels stock photo search
│       ├── playwrightService.ts     # HTML → PNG rendering
│       ├── ffmpegService.ts         # Video assembly
│       └── fileManager.ts           # Temp file lifecycle
│
├── src/
│   ├── renderer/
│   │   ├── main.ts                  # Vue app entry
│   │   ├── App.vue                  # Root component
│   │   │
│   │   ├── components/
│   │   │   ├── setup/
│   │   │   │   ├── ProjectSetup.vue       # Phase 1 inputs
│   │   │   │   ├── SettingsPanel.vue      # API keys, preferences
│   │   │   │   └── GroundedMaterial.vue   # Document upload
│   │   │   │
│   │   │   ├── planning/
│   │   │   │   ├── PlanReview.vue         # Review AI-generated plan
│   │   │   │   └── SlideOverview.vue      # Thumbnail overview
│   │   │   │
│   │   │   ├── editor/
│   │   │   │   ├── SlideEditor.vue        # Main slide editing view
│   │   │   │   ├── SlideCanvas.vue        # Drag-and-drop canvas
│   │   │   │   ├── TextEditor.vue         # Edit text content
│   │   │   │   ├── LayoutSelector.vue     # Choose layout
│   │   │   │   ├── VisualPanel.vue        # Visual generation options
│   │   │   │   │   ├── DiagramGenerator.vue   # GPT diagram
│   │   │   │   │   ├── PexelsSearch.vue       # Stock photo search
│   │   │   │   │   └── GenAIGenerator.vue     # AI image gen
│   │   │   │   ├── BackgroundSelector.vue # Reference images
│   │   │   │   ├── NarrationEditor.vue    # Edit narration text
│   │   │   │   └── SlidePreview.vue       # Live preview
│   │   │   │
│   │   │   ├── audio/
│   │   │   │   ├── AudioGeneration.vue    # Generate all audio
│   │   │   │   ├── VoiceSelector.vue      # Choose voice/provider
│   │   │   │   └── AudioPreview.vue       # Preview per-slide audio
│   │   │   │
│   │   │   ├── video/
│   │   │   │   ├── VideoAssembly.vue      # Final video generation
│   │   │   │   ├── ProgressTracker.vue    # Show progress
│   │   │   │   └── ExportComplete.vue     # Success + file location
│   │   │   │
│   │   │   └── shared/
│   │   │       ├── Sidebar.vue            # Navigation
│   │   │       ├── TopNav.vue             # Project name, settings
│   │   │       ├── ErrorBanner.vue        # Error display
│   │   │       └── LoadingSpinner.vue     # Loading states
│   │   │
│   │   ├── stores/
│   │   │   ├── projectStore.ts            # Current project state
│   │   │   ├── slidesStore.ts             # Slides data + editing
│   │   │   ├── settingsStore.ts           # App settings, API keys
│   │   │   └── audioStore.ts              # Audio generation state
│   │   │
│   │   └── types/
│   │       ├── electron.d.ts              # electronAPI types
│   │       └── index.ts                   # Shared types
│   │
│   └── shared/
│       └── types.ts                       # Types shared main/renderer
│
├── public/
│   ├── reference-images/                  # Corndel brand assets
│   │   ├── Corndel_LogoSuite_*.png
│   │   ├── Artboard *.png
│   │   └── ...
│   └── favicon.ico
│
├── templates/
│   ├── slide-layouts/                     # HTML layout templates
│   │   ├── text-left-image-right.html
│   │   ├── text-right-image-left.html
│   │   ├── center.html
│   │   ├── text-top-image-bottom.html
│   │   ├── full-visual.html
│   │   └── split-50-50.html
│   │
│   └── template-params.json               # Brand colors, fonts
│
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── electron-builder.json
├── .env.example
└── start-up-docs/
    ├── TECHNICAL_DOCUMENTATION.md
    ├── AI_API_DEEP_DIVE.md
    ├── objectives.md
    └── IMPLEMENTATION_PLAN.md             # This file
```

---

## Data Models

### Core Types (`src/shared/types.ts`)

```typescript
// ============================================
// PROJECT & CONFIGURATION
// ============================================

export interface Project {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  status: 'planning' | 'editing' | 'audio' | 'video' | 'complete'

  // Phase 1 inputs
  config: ProjectConfig

  // Phase 1 output
  contentStrategy: ContentStrategy | null

  // Phase 2 output
  slides: Slide[]

  // Phase 3 output
  audioGenerated: boolean

  // Phase 4 output
  videoPath: string | null

  // Cost tracking
  totalCost: number
  costBreakdown: CostBreakdown
}

export interface ProjectConfig {
  topic: string
  description: string
  targetDuration: number           // seconds
  numSlides: number | 'flexible'
  webSearchEnabled: boolean
  groundedMaterial: GroundedDocument[]
  voiceProvider: 'openai' | 'elevenlabs'
  voiceName: string                // e.g., 'nova', 'rachel'
}

export interface GroundedDocument {
  id: string
  fileName: string
  content: string
  mimeType: string
}

// ============================================
// CONTENT STRATEGY (AI Output)
// ============================================

export interface ContentStrategy {
  topic: string
  totalDuration: number
  wordCount: number
  fullScript: string
  slides: SlideStrategy[]
}

export interface SlideStrategy {
  slideNum: number
  type: 'intro' | 'main' | 'end'
  duration: number
  startTime: number

  // Text content
  headline: string | null
  subheadline: string | null
  bodyText: string | null
  bullets: string[] | null

  // Visual
  visualType: VisualType
  visualDescription: string
  pexelsKeywords: string | null
  geminiPrompt: string | null
  diagramDescription: string | null

  // Layout
  layout: LayoutType

  // Narration
  narration: string
}

export type VisualType =
  | 'pexels'      // Stock photo
  | 'gemini'      // AI-generated image
  | 'diagram'     // GPT HTML diagram
  | 'chart'       // Chart.js
  | 'code'        // Code block
  | 'table'       // HTML table
  | 'none'        // Text only

export type LayoutType =
  | 'text-left-image-right'
  | 'text-right-image-left'
  | 'center'
  | 'text-top-image-bottom'
  | 'full-visual'
  | 'split-50-50'

// ============================================
// SLIDE (User-Edited Version)
// ============================================

export interface Slide {
  id: string
  slideNum: number
  status: 'pending' | 'editing' | 'complete'

  // Content (user-editable)
  headline: string | null
  subheadline: string | null
  bodyText: string | null
  bullets: string[] | null

  // Visual
  visualType: VisualType
  visualData: VisualData | null

  // Layout
  layout: LayoutType

  // Element positions (for drag-and-drop)
  elements: SlideElement[]

  // Background
  backgroundType: 'solid' | 'gradient' | 'image'
  backgroundColor: string | null
  backgroundImagePath: string | null   // Reference image

  // Narration
  narration: string

  // Generated assets
  pngPath: string | null
  htmlPath: string | null

  // Audio
  audioPath: string | null
  audioDuration: number | null
}

export interface SlideElement {
  id: string
  type: 'text' | 'image' | 'headline' | 'bullets'
  x: number                          // Percentage 0-100
  y: number                          // Percentage 0-100
  width: number                      // Percentage
  height: number                     // Percentage
  zIndex: number
  content: string | null             // For text elements
  imagePath: string | null           // For image elements
}

export interface VisualData {
  type: VisualType
  imagePath: string | null           // Path to PNG
  imageBase64: string | null         // For preview
  sourceUrl: string | null           // Pexels URL
  generationPrompt: string | null    // What was used to generate
}

// ============================================
// AUDIO
// ============================================

export interface AudioConfig {
  provider: 'openai' | 'elevenlabs'
  voice: string
  speed: number                      // 0.83 for 150 WPM
}

export interface SlideAudio {
  slideId: string
  audioPath: string
  duration: number                   // seconds
  wordCount: number
  cost: number
}

// ============================================
// COST TRACKING
// ============================================

export interface CostBreakdown {
  contentGeneration: number          // GPT for content strategy
  webResearch: number                // GPT web search
  textHtml: number                   // GPT for slide HTML
  diagramGeneration: number          // GPT for diagrams
  imageGeneration: number            // Google GenAI
  visionReview: number               // GPT-4o-mini (if used)
  audioGeneration: number            // TTS
  total: number
}

// ============================================
// GENERATION OPTIONS
// ============================================

export interface GenAIOptions {
  model: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview'
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  temperature: number
  safetyOff: boolean
}

export interface TTSOptions {
  provider: 'openai' | 'elevenlabs'
  voice: string
  speed: number
  model: string                      // 'tts-1-hd' for OpenAI
}

// ============================================
// PROGRESS & STATUS
// ============================================

export interface ProgressUpdate {
  phase: 'planning' | 'editing' | 'audio' | 'video'
  step: string
  progress: number                   // 0-100
  message: string
  currentItem: number | null
  totalItems: number | null
}

export interface GenerationResult<T> {
  success: boolean
  data?: T
  error?: string
  cost?: number
}
```

---

## Phase 1: AI Plan Generation

### User Interface

```
┌─────────────────────────────────────────────────────────────────────┐
│ CREATE NEW VIDEO                                          [Settings]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Topic / Title                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Introduction to Machine Learning                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Description                                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Explain the basics of machine learning for beginners,       │   │
│  │ covering supervised, unsupervised, and reinforcement        │   │
│  │ learning with practical examples.                           │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌───────────────────┐  ┌───────────────────┐                      │
│  │ Number of Slides  │  │ Target Duration   │                      │
│  │ ┌─────────────┐   │  │ ┌─────────────┐   │                      │
│  │ │ 5 ▼        │   │  │ │ 60 seconds ▼│   │                      │
│  │ └─────────────┘   │  │ └─────────────┘   │                      │
│  │ □ Flexible        │  │                   │                      │
│  └───────────────────┘  └───────────────────┘                      │
│                                                                     │
│  Voice Selection (applies to all slides)                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Provider: ○ OpenAI TTS  ● ElevenLabs                        │   │
│  │ Voice:    [ Rachel (British) ▼ ]                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ☑ Enable Web Search (gather current facts)                        │
│                                                                     │
│  Grounded Material (optional)                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 📄 product_specs.pdf                              [Remove]   │   │
│  │ 📄 brand_guidelines.txt                           [Remove]   │   │
│  │                                                              │   │
│  │              [+ Add Documents]                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│                     [ Generate Content Plan ]                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### API Call: Content Strategy Generation

**Service**: `electron/services/openaiService.ts`

```typescript
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateContentStrategy(
  config: ProjectConfig
): Promise<GenerationResult<ContentStrategy>> {

  // Build system prompt
  const systemPrompt = buildSystemPrompt(config)

  // Build user prompt with grounded material
  const userPrompt = buildUserPrompt(config)

  // Call GPT-5 with structured output
  const response = await openai.beta.chat.completions.parse({
    model: 'gpt-5',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    response_format: ContentStrategySchema,  // Zod schema
    temperature: 0.7
  })

  const strategy = response.choices[0].message.parsed

  return {
    success: true,
    data: strategy,
    cost: calculateCost(response.usage)
  }
}
```

### System Prompt (Key Elements)

```
You are an expert explainer video content strategist.

Create a content strategy for a {duration}-second video with {numSlides} slides.

For each slide, specify:
1. Layout: text-left-image-right, text-right-image-left, center, etc.
2. Visual type: pexels, gemini, diagram, chart, code, table, none
3. Text content: headline, subheadline, body, bullets
4. Narration: voiceover script (150 WPM speaking rate)

Visual type guidance:
- pexels: General concepts, people, places (provide search keywords)
- gemini: Custom illustrations, abstract concepts (provide detailed prompt)
- diagram: Processes, workflows, architectures (provide description)
- chart: Data comparisons (provide data structure)

{If web research enabled: Include current facts and statistics}
{If grounded material provided: Use this as primary source}

Return structured JSON matching the ContentStrategy schema.
```

---

## Phase 2: Interactive Slide Builder

### Main Editor Interface

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Machine Learning Intro                    Slide 2 of 5         [◀] [▶]     │
├──────────────────┬──────────────────────────────────────────────────────────┤
│                  │                                                          │
│  SLIDES          │  ┌────────────────────────────────────────────────────┐ │
│  ┌────────────┐  │  │                                                    │ │
│  │ 1. Intro   │  │  │         CANVAS (16:9 preview)                     │ │
│  │ [thumb]    │  │  │                                                    │ │
│  └────────────┘  │  │  ┌──────────────┐    ┌────────────────────────┐   │ │
│  ┌────────────┐  │  │  │              │    │                        │   │ │
│  │ 2. What is │◀─┤  │  │   TEXT       │    │      IMAGE/VISUAL      │   │ │
│  │ [thumb]    │  │  │  │   SECTION    │    │                        │   │ │
│  └────────────┘  │  │  │              │    │    (drag to move)      │   │ │
│  ┌────────────┐  │  │  │  (editable)  │    │                        │   │ │
│  │ 3. Types   │  │  │  │              │    │                        │   │ │
│  │ [thumb]    │  │  │  └──────────────┘    └────────────────────────┘   │ │
│  └────────────┘  │  │                                                    │ │
│  ┌────────────┐  │  └────────────────────────────────────────────────────┘ │
│  │ 4. Uses    │  │                                                          │
│  │ [thumb]    │  │  LAYOUT: [ text-left-image-right ▼ ]                    │
│  └────────────┘  │                                                          │
│  ┌────────────┐  │  ┌────────────────────────────────────────────────────┐ │
│  │ 5. End     │  │  │ TEXT CONTENT                                       │ │
│  │ [thumb]    │  │  │ Headline: [What is Machine Learning?         ]     │ │
│  └────────────┘  │  │ Subhead:  [The Foundation of AI               ]     │ │
│                  │  │ Body:     [Machine learning allows computers...]    │ │
│                  │  │ Bullets:                                            │ │
│                  │  │   • [Learns from data              ] [+ Add]        │ │
│                  │  │   • [Improves over time            ]                │ │
│                  │  │   • [Makes predictions             ]                │ │
│                  │  └────────────────────────────────────────────────────┘ │
│                  │                                                          │
│                  │  ┌────────────────────────────────────────────────────┐ │
│                  │  │ VISUAL                                              │ │
│                  │  │ Type: ○ AI Diagram  ● Stock Photo  ○ AI Image      │ │
│                  │  │                                                     │ │
│                  │  │ [Search Pexels: machine learning brain      🔍]    │ │
│                  │  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │ │
│                  │  │ │ img1 │ │ img2 │ │ img3 │ │ img4 │ │ img5 │      │ │
│                  │  │ │  ✓   │ │      │ │      │ │      │ │      │      │ │
│                  │  │ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘      │ │
│                  │  └────────────────────────────────────────────────────┘ │
│                  │                                                          │
│                  │  ┌────────────────────────────────────────────────────┐ │
│                  │  │ BACKGROUND                                          │ │
│                  │  │ ○ Solid Color  ● Brand Image  ○ Gradient           │ │
│                  │  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │ │
│                  │  │ │Cornd │ │Art1  │ │Art2  │ │Art3  │               │ │
│                  │  │ │  ✓   │ │      │ │      │ │      │               │ │
│                  │  │ └──────┘ └──────┘ └──────┘ └──────┘               │ │
│                  │  └────────────────────────────────────────────────────┘ │
│                  │                                                          │
│                  │  ┌────────────────────────────────────────────────────┐ │
│                  │  │ NARRATION (voiceover script)                        │ │
│                  │  │ ┌──────────────────────────────────────────────┐   │ │
│                  │  │ │ So what is machine learning? At its core,    │   │ │
│                  │  │ │ it's a type of artificial intelligence that  │   │ │
│                  │  │ │ allows computers to learn from data without  │   │ │
│                  │  │ │ being explicitly programmed...               │   │ │
│                  │  │ └──────────────────────────────────────────────┘   │ │
│                  │  │ Words: 45 | Est. duration: 18s                      │ │
│                  │  └────────────────────────────────────────────────────┘ │
│                  │                                                          │
│                  │  [ Save & Render ]  [ ◀ Previous ]  [ Next ▶ ]          │
│                  │                                                          │
└──────────────────┴──────────────────────────────────────────────────────────┘
```

### Drag-and-Drop Canvas

**Component**: `src/renderer/components/editor/SlideCanvas.vue`

```vue
<template>
  <div
    class="canvas-container"
    ref="canvasRef"
    @mouseup="onCanvasMouseUp"
    @mousemove="onCanvasMouseMove"
  >
    <!-- Background layer -->
    <div
      class="canvas-background"
      :style="backgroundStyle"
    />

    <!-- Draggable elements -->
    <div
      v-for="element in slide.elements"
      :key="element.id"
      class="canvas-element"
      :class="{ 'dragging': draggingElement?.id === element.id }"
      :style="getElementStyle(element)"
      @mousedown="startDrag(element, $event)"
    >
      <!-- Text element -->
      <div v-if="element.type === 'text' || element.type === 'headline'">
        {{ element.content }}
      </div>

      <!-- Image element -->
      <img
        v-if="element.type === 'image'"
        :src="element.imagePath"
        class="element-image"
      />

      <!-- Bullets -->
      <ul v-if="element.type === 'bullets'">
        <li v-for="(bullet, i) in parseBullets(element.content)" :key="i">
          {{ bullet }}
        </li>
      </ul>

      <!-- Resize handles -->
      <div
        v-if="selectedElement?.id === element.id"
        class="resize-handles"
      >
        <div class="handle nw" @mousedown.stop="startResize('nw', $event)" />
        <div class="handle ne" @mousedown.stop="startResize('ne', $event)" />
        <div class="handle sw" @mousedown.stop="startResize('sw', $event)" />
        <div class="handle se" @mousedown.stop="startResize('se', $event)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Slide, SlideElement } from '@/shared/types'

const props = defineProps<{
  slide: Slide
}>()

const emit = defineEmits<{
  (e: 'update:element', element: SlideElement): void
}>()

const draggingElement = ref<SlideElement | null>(null)
const selectedElement = ref<SlideElement | null>(null)
const dragOffset = ref({ x: 0, y: 0 })
const canvasRef = ref<HTMLElement | null>(null)

function startDrag(element: SlideElement, event: MouseEvent) {
  draggingElement.value = element
  selectedElement.value = element

  const rect = canvasRef.value?.getBoundingClientRect()
  if (rect) {
    dragOffset.value = {
      x: event.clientX - (rect.left + (element.x / 100) * rect.width),
      y: event.clientY - (rect.top + (element.y / 100) * rect.height)
    }
  }
}

function onCanvasMouseMove(event: MouseEvent) {
  if (!draggingElement.value || !canvasRef.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  const x = ((event.clientX - rect.left - dragOffset.value.x) / rect.width) * 100
  const y = ((event.clientY - rect.top - dragOffset.value.y) / rect.height) * 100

  // Clamp to canvas bounds
  const clampedX = Math.max(0, Math.min(100 - draggingElement.value.width, x))
  const clampedY = Math.max(0, Math.min(100 - draggingElement.value.height, y))

  emit('update:element', {
    ...draggingElement.value,
    x: clampedX,
    y: clampedY
  })
}

function onCanvasMouseUp() {
  draggingElement.value = null
}

function getElementStyle(element: SlideElement) {
  return {
    left: `${element.x}%`,
    top: `${element.y}%`,
    width: `${element.width}%`,
    height: `${element.height}%`,
    zIndex: element.zIndex
  }
}
</script>

<style scoped>
.canvas-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

.canvas-element {
  position: absolute;
  cursor: move;
  user-select: none;
  border: 2px solid transparent;
  transition: border-color 0.2s;
}

.canvas-element:hover {
  border-color: #3b82f6;
}

.canvas-element.dragging {
  border-color: #2563eb;
  opacity: 0.9;
}

.resize-handles .handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #3b82f6;
  border-radius: 50%;
}

.handle.nw { top: -6px; left: -6px; cursor: nw-resize; }
.handle.ne { top: -6px; right: -6px; cursor: ne-resize; }
.handle.sw { bottom: -6px; left: -6px; cursor: sw-resize; }
.handle.se { bottom: -6px; right: -6px; cursor: se-resize; }
</style>
```

### Visual Generation Options

#### 1. GPT Diagram Generation

```typescript
// electron/services/openaiService.ts

export async function generateDiagramHTML(
  description: string,
  themeColors: ThemeColors
): Promise<GenerationResult<string>> {

  const prompt = `
Generate a clean CSS/HTML diagram based on this description:
${description}

Requirements:
1. Use inline CSS (no external stylesheets)
2. Use these theme colors:
   - Primary: ${themeColors.primary}
   - Secondary: ${themeColors.secondary}
   - Accent: ${themeColors.accent}
3. Use flexbox for layout
4. Max dimensions: 800x600px
5. Use arrows (→, ↓) or CSS for connections
6. Add subtle shadows: box-shadow: 0 4px 12px rgba(0,0,0,0.1)

Output ONLY the HTML, no markdown.
`

  const response = await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [
      { role: 'system', content: 'You generate clean HTML/CSS diagrams. Output only HTML.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.3
  })

  const html = response.choices[0].message.content
    .replace(/```html/g, '')
    .replace(/```/g, '')
    .trim()

  return { success: true, data: html }
}
```

#### 2. Pexels Search

```typescript
// electron/services/pexelsService.ts

const PEXELS_API_KEY = process.env.PEXELS_API_KEY

export async function searchPexels(
  query: string,
  count: number = 10
): Promise<GenerationResult<PexelsImage[]>> {

  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
    {
      headers: { Authorization: PEXELS_API_KEY }
    }
  )

  const data = await response.json()

  const images = data.photos.map((photo: any) => ({
    id: photo.id,
    url: photo.src.large2x,
    thumbnail: photo.src.medium,
    photographer: photo.photographer,
    alt: photo.alt || query
  }))

  return { success: true, data: images }
}
```

#### 3. Google GenAI Image Generation

```typescript
// electron/services/genaiService.ts
// Copied from corndel-image-generator

import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_CLOUD_API_KEY })

const MODELS = {
  flash: 'gemini-2.5-flash-image',
  pro: 'gemini-3-pro-image-preview'
}

export async function generateImage(
  prompt: string,
  options: GenAIOptions
): Promise<GenerationResult<{ imageData: string; filePath: string }>> {

  const modelName = options.model.includes('flash') ? MODELS.flash : MODELS.pro

  const parts = [{ text: prompt }]

  const safetySettings = options.safetyOff ? [
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'OFF' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'OFF' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'OFF' },
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'OFF' }
  ] : [
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
  ]

  const response = await ai.models.generateContent({
    model: modelName,
    contents: [{ role: 'user', parts }],
    config: {
      temperature: options.temperature ?? 1,
      topP: 0.95,
      maxOutputTokens: 32768,
      responseModalities: ['TEXT', 'IMAGE'],
      safetySettings
    }
  })

  // Extract image from response
  for (const candidate of response.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        const imageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
        const filePath = await saveImage(part.inlineData.data, part.inlineData.mimeType)

        return {
          success: true,
          data: { imageData, filePath },
          cost: calculateGenAICost(options.model)
        }
      }
    }
  }

  return { success: false, error: 'No image in response' }
}
```

### Slide Rendering (HTML → PNG)

```typescript
// electron/services/playwrightService.ts

import { chromium, Browser, Page } from 'playwright'

let browser: Browser | null = null

export async function initPlaywright() {
  browser = await chromium.launch({ headless: true })
}

export async function renderSlideToImage(
  slide: Slide,
  templatePath: string,
  outputPath: string
): Promise<string> {

  if (!browser) await initPlaywright()

  const page = await browser!.newPage()
  await page.setViewportSize({ width: 1920, height: 1080 })

  // Build HTML from template + slide data
  const html = buildSlideHTML(slide, templatePath)

  await page.setContent(html)
  await page.waitForTimeout(2000)  // Wait for any animations/charts

  await page.screenshot({
    path: outputPath,
    type: 'png',
    fullPage: false
  })

  await page.close()

  return outputPath
}

function buildSlideHTML(slide: Slide, templatePath: string): string {
  // Load template
  let template = readFileSync(templatePath, 'utf-8')

  // Load template params (colors, fonts)
  const params = JSON.parse(readFileSync('templates/template-params.json', 'utf-8'))

  // Replace placeholders
  template = template
    .replace('{{HEADLINE}}', slide.headline || '')
    .replace('{{SUBHEADLINE}}', slide.subheadline || '')
    .replace('{{BODY}}', slide.bodyText || '')
    .replace('{{BULLETS}}', buildBulletsHTML(slide.bullets))
    .replace('{{VISUAL}}', buildVisualHTML(slide.visualData))
    .replace('{{BACKGROUND}}', buildBackgroundCSS(slide))
    .replace(/\{\{PRIMARY_COLOR\}\}/g, params.colors.primary)
    .replace(/\{\{SECONDARY_COLOR\}\}/g, params.colors.secondary)
    .replace(/\{\{ACCENT_COLOR\}\}/g, params.colors.accent)
    .replace(/\{\{TEXT_COLOR\}\}/g, params.colors.text)
    .replace(/\{\{FONT_PRIMARY\}\}/g, params.typography.font_primary)

  return template
}
```

---

## Phase 3: Audio Generation

### Audio Generation Interface

```
┌─────────────────────────────────────────────────────────────────────┐
│ GENERATE AUDIO                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Voice Settings (applies to all slides)                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Provider: ● OpenAI TTS   ○ ElevenLabs                       │   │
│  │ Voice:    [ Nova ▼ ]                                        │   │
│  │ Speed:    0.83 (optimized for 150 WPM)                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Slide │ Narration                              │ Status     │   │
│  ├───────┼────────────────────────────────────────┼────────────┤   │
│  │   1   │ "Have you ever wondered how Netflix..."│ ✓ 12.3s   │   │
│  │   2   │ "So what is machine learning?..."      │ ✓ 18.1s   │   │
│  │   3   │ "There are three main types..."        │ ⏳ ...     │   │
│  │   4   │ "Let's look at real-world examples..." │ ○ Pending │   │
│  │   5   │ "In conclusion, machine learning..."   │ ○ Pending │   │
│  └───────┴────────────────────────────────────────┴────────────┘   │
│                                                                     │
│  Progress: ████████████░░░░░░░░ 60%  (3/5 slides)                  │
│                                                                     │
│  Estimated cost: $0.02                                              │
│                                                                     │
│           [ Generate All Audio ]    [ Preview Selected ]            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Audio Generation Service

```typescript
// electron/services/openaiService.ts

export async function generateSlideAudio(
  narration: string,
  options: TTSOptions,
  outputPath: string
): Promise<GenerationResult<SlideAudio>> {

  if (options.provider === 'openai') {
    return generateOpenAIAudio(narration, options, outputPath)
  } else {
    return generateElevenLabsAudio(narration, options, outputPath)
  }
}

async function generateOpenAIAudio(
  narration: string,
  options: TTSOptions,
  outputPath: string
): Promise<GenerationResult<SlideAudio>> {

  const response = await openai.audio.speech.create({
    model: 'tts-1-hd',
    voice: options.voice as any,  // 'nova', 'alloy', 'echo', etc.
    input: narration,
    speed: options.speed  // 0.83 for 150 WPM
  })

  const buffer = Buffer.from(await response.arrayBuffer())
  writeFileSync(outputPath, buffer)

  // Get audio duration
  const duration = await getAudioDuration(outputPath)

  // Calculate cost ($15 per 1M characters)
  const cost = (narration.length / 1_000_000) * 15

  return {
    success: true,
    data: {
      slideId: '',  // Set by caller
      audioPath: outputPath,
      duration,
      wordCount: narration.split(/\s+/).length,
      cost
    }
  }
}

// electron/services/elevenLabsService.ts

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY

const VOICES = {
  rachel: '21m00Tcm4TlvDq8ikWAM',    // British
  elizabeth: 'HXOwtW4XU7Ne6iOiDHTl'  // American
}

export async function generateElevenLabsAudio(
  narration: string,
  options: TTSOptions,
  outputPath: string
): Promise<GenerationResult<SlideAudio>> {

  const voiceId = VOICES[options.voice as keyof typeof VOICES]

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: narration,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          speed: options.speed * 1.13  // ElevenLabs scale adjustment
        }
      })
    }
  )

  const buffer = Buffer.from(await response.arrayBuffer())
  writeFileSync(outputPath, buffer)

  const duration = await getAudioDuration(outputPath)

  // Cost: $0.30 per 1K characters
  const cost = (narration.length / 1000) * 0.30

  return {
    success: true,
    data: {
      slideId: '',
      audioPath: outputPath,
      duration,
      wordCount: narration.split(/\s+/).length,
      cost
    }
  }
}
```

---

## Phase 4: Video Assembly

### Video Assembly Interface

```
┌─────────────────────────────────────────────────────────────────────┐
│ CREATE VIDEO                                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  All slides and audio are ready!                                    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Slide │ Image           │ Audio          │ Duration        │   │
│  ├───────┼─────────────────┼────────────────┼─────────────────┤   │
│  │   1   │ ✓ slide_01.png  │ ✓ slide_01.mp3 │ 12.3s          │   │
│  │   2   │ ✓ slide_02.png  │ ✓ slide_02.mp3 │ 18.1s          │   │
│  │   3   │ ✓ slide_03.png  │ ✓ slide_03.mp3 │ 15.5s          │   │
│  │   4   │ ✓ slide_04.png  │ ✓ slide_04.mp3 │ 14.2s          │   │
│  │   5   │ ✓ slide_05.png  │ ✓ slide_05.mp3 │ 8.9s           │   │
│  └───────┴─────────────────┴────────────────┴─────────────────┘   │
│                                                                     │
│  Total duration: 69.0 seconds                                       │
│                                                                     │
│  Output Settings:                                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Resolution:  1920x1080 (Full HD)                            │   │
│  │ Format:      MP4 (H.264/AAC)                                │   │
│  │ Transitions: ☑ Crossfade (0.5s)                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Output: /Users/pete/Videos/ml_intro.mp4                           │
│                                                                     │
│                     [ Generate Video ]                              │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Progress: ████████████████████ 100%                                │
│  Status:   Video generation complete!                               │
│                                                                     │
│           [ Open Video ]    [ Open Folder ]    [ New Project ]      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Video Assembly Service

```typescript
// electron/services/ffmpegService.ts

import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import ffprobeStatic from 'ffprobe-static'

ffmpeg.setFfmpegPath(ffmpegStatic)
ffmpeg.setFfprobePath(ffprobeStatic.path)

export interface SlideVideo {
  pngPath: string
  mp3Path: string
  duration: number
}

export async function assembleVideo(
  slides: SlideVideo[],
  outputPath: string,
  options: {
    resolution: { width: number; height: number }
    enableTransitions: boolean
    transitionDuration: number
  },
  onProgress: (progress: number) => void
): Promise<string> {

  const tempDir = join(app.getPath('temp'), `video_${Date.now()}`)
  mkdirSync(tempDir, { recursive: true })

  try {
    // Step 1: Create individual slide videos (PNG + MP3 → MP4)
    const slideVideos: string[] = []

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i]
      const slideVideoPath = join(tempDir, `slide_${i.toString().padStart(2, '0')}.mp4`)

      await createSlideVideo(
        slide.pngPath,
        slide.mp3Path,
        slide.duration,
        slideVideoPath,
        options.resolution
      )

      slideVideos.push(slideVideoPath)
      onProgress(((i + 1) / slides.length) * 50)  // First 50% is creating slides
    }

    // Step 2: Concatenate all slide videos
    const concatListPath = join(tempDir, 'concat_list.txt')
    const concatList = slideVideos.map(p => `file '${p}'`).join('\n')
    writeFileSync(concatListPath, concatList)

    // Step 3: Final concatenation
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(concatListPath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions([
          '-c:v', 'libx264',
          '-preset', 'medium',
          '-crf', '23',
          '-c:a', 'aac',
          '-b:a', '192k'
        ])
        .output(outputPath)
        .on('progress', (progress) => {
          onProgress(50 + (progress.percent || 0) * 0.5)
        })
        .on('end', () => resolve())
        .on('error', reject)
        .run()
    })

    // Cleanup temp files
    rmSync(tempDir, { recursive: true })

    return outputPath

  } catch (error) {
    rmSync(tempDir, { recursive: true })
    throw error
  }
}

async function createSlideVideo(
  pngPath: string,
  mp3Path: string,
  duration: number,
  outputPath: string,
  resolution: { width: number; height: number }
): Promise<void> {

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(pngPath)
      .inputOptions(['-loop', '1'])
      .input(mp3Path)
      .outputOptions([
        '-c:v', 'libx264',
        '-tune', 'stillimage',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-pix_fmt', 'yuv420p',
        '-shortest',
        `-t`, duration.toString(),
        '-vf', `scale=${resolution.width}:${resolution.height}`
      ])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', reject)
      .run()
  })
}
```

---

## IPC Handlers

### Main Process Handlers (`electron/main.ts`)

```typescript
// ============================================
// PROJECT MANAGEMENT
// ============================================

ipcMain.handle('create-project', async (_, config: ProjectConfig) => {
  return await projectManager.createProject(config)
})

ipcMain.handle('load-project', async (_, projectId: string) => {
  return await projectManager.loadProject(projectId)
})

ipcMain.handle('save-project', async (_, project: Project) => {
  return await projectManager.saveProject(project)
})

ipcMain.handle('list-projects', async () => {
  return await projectManager.listProjects()
})

// ============================================
// PHASE 1: CONTENT GENERATION
// ============================================

ipcMain.handle('generate-content-strategy', async (_, config: ProjectConfig) => {
  return await openaiService.generateContentStrategy(config)
})

ipcMain.handle('web-research', async (_, topic: string) => {
  return await openaiService.webResearch(topic)
})

// ============================================
// PHASE 2: SLIDE EDITING
// ============================================

ipcMain.handle('search-pexels', async (_, query: string, count: number) => {
  return await pexelsService.searchPexels(query, count)
})

ipcMain.handle('generate-genai-image', async (_, prompt: string, options: GenAIOptions) => {
  return await genaiService.generateImage(prompt, options)
})

ipcMain.handle('generate-diagram-html', async (_, description: string, colors: ThemeColors) => {
  return await openaiService.generateDiagramHTML(description, colors)
})

ipcMain.handle('render-slide-to-png', async (_, slide: Slide, templatePath: string, outputPath: string) => {
  return await playwrightService.renderSlideToImage(slide, templatePath, outputPath)
})

// ============================================
// REFERENCE IMAGES (from corndel-image-generator)
// ============================================

ipcMain.handle('get-bundled-reference-images', async () => {
  return await referenceImages.getBundledImages()
})

ipcMain.handle('load-reference-image-data', async (_, filePath: string) => {
  return await referenceImages.loadImageData(filePath)
})

// ============================================
// PHASE 3: AUDIO GENERATION
// ============================================

ipcMain.handle('generate-slide-audio', async (_, narration: string, options: TTSOptions, outputPath: string) => {
  return await generateSlideAudio(narration, options, outputPath)
})

ipcMain.handle('get-audio-duration', async (_, audioPath: string) => {
  return await ffmpegService.getAudioDuration(audioPath)
})

// ============================================
// PHASE 4: VIDEO ASSEMBLY
// ============================================

ipcMain.handle('assemble-video', async (event, slides: SlideVideo[], outputPath: string, options: any) => {
  return await ffmpegService.assembleVideo(slides, outputPath, options, (progress) => {
    event.sender.send('video-progress', progress)
  })
})

// ============================================
// SETTINGS & API KEYS
// ============================================

ipcMain.handle('get-settings', async () => {
  return store.get('settings', defaultSettings)
})

ipcMain.handle('save-settings', async (_, settings: Settings) => {
  store.set('settings', settings)
  return { success: true }
})

ipcMain.handle('test-openai-key', async (_, apiKey: string) => {
  return await openaiService.testApiKey(apiKey)
})

ipcMain.handle('test-elevenlabs-key', async (_, apiKey: string) => {
  return await elevenLabsService.testApiKey(apiKey)
})

ipcMain.handle('test-genai-key', async (_, apiKey: string) => {
  return await genaiService.testApiKey(apiKey)
})

ipcMain.handle('test-pexels-key', async (_, apiKey: string) => {
  return await pexelsService.testApiKey(apiKey)
})

// ============================================
// FILE OPERATIONS
// ============================================

ipcMain.handle('select-documents', async () => {
  return await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Documents', extensions: ['txt', 'md', 'pdf', 'docx'] }]
  })
})

ipcMain.handle('select-output-folder', async () => {
  return await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory']
  })
})

ipcMain.handle('show-in-folder', async (_, filePath: string) => {
  shell.showItemInFolder(filePath)
})
```

---

## Vue Components

### Component Hierarchy

```
App.vue
├── TopNav.vue
│   ├── Project name
│   ├── Save status
│   └── Settings button
│
├── Sidebar.vue
│   ├── Phase indicators (1-4)
│   ├── Slide thumbnails (in Phase 2)
│   └── Navigation
│
└── MainContent (router-view)
    │
    ├── ProjectSetup.vue (Phase 1 input)
    │   ├── TopicInput
    │   ├── DurationSelector
    │   ├── VoiceSelector
    │   ├── WebSearchToggle
    │   └── GroundedMaterial.vue
    │
    ├── PlanReview.vue (Phase 1 output)
    │   ├── SlideOverview.vue (thumbnails)
    │   └── ContentStrategy display
    │
    ├── SlideEditor.vue (Phase 2)
    │   ├── SlideCanvas.vue (drag-and-drop)
    │   ├── TextEditor.vue
    │   ├── LayoutSelector.vue
    │   ├── VisualPanel.vue
    │   │   ├── DiagramGenerator.vue
    │   │   ├── PexelsSearch.vue
    │   │   └── GenAIGenerator.vue
    │   ├── BackgroundSelector.vue
    │   └── NarrationEditor.vue
    │
    ├── AudioGeneration.vue (Phase 3)
    │   ├── VoiceSelector.vue
    │   ├── SlideAudioList.vue
    │   └── AudioPreview.vue
    │
    └── VideoAssembly.vue (Phase 4)
        ├── SlideVideoList.vue
        ├── ProgressTracker.vue
        └── ExportComplete.vue
```

---

## Pinia Stores

### Project Store

```typescript
// src/renderer/stores/projectStore.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Project, ProjectConfig, ContentStrategy } from '@/shared/types'

export const useProjectStore = defineStore('project', () => {
  // State
  const project = ref<Project | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const currentPhase = computed(() => project.value?.status || 'planning')
  const isComplete = computed(() => project.value?.status === 'complete')

  // Actions
  async function createProject(config: ProjectConfig) {
    loading.value = true
    error.value = null

    try {
      const result = await window.electronAPI.createProject(config)
      if (result.success) {
        project.value = result.data
      } else {
        error.value = result.error
      }
    } finally {
      loading.value = false
    }
  }

  async function generateContentStrategy() {
    if (!project.value) return

    loading.value = true

    try {
      const result = await window.electronAPI.generateContentStrategy(project.value.config)
      if (result.success) {
        project.value.contentStrategy = result.data
        project.value.totalCost += result.cost || 0

        // Initialize slides from strategy
        project.value.slides = result.data.slides.map(s => ({
          id: `slide_${s.slideNum}`,
          slideNum: s.slideNum,
          status: 'pending',
          headline: s.headline,
          subheadline: s.subheadline,
          bodyText: s.bodyText,
          bullets: s.bullets,
          visualType: s.visualType,
          visualData: null,
          layout: s.layout,
          elements: createDefaultElements(s),
          backgroundType: 'solid',
          backgroundColor: '#ffffff',
          backgroundImagePath: null,
          narration: s.narration,
          pngPath: null,
          htmlPath: null,
          audioPath: null,
          audioDuration: null
        }))

        project.value.status = 'editing'
        await saveProject()
      }
    } finally {
      loading.value = false
    }
  }

  async function saveProject() {
    if (!project.value) return
    project.value.updatedAt = new Date().toISOString()
    await window.electronAPI.saveProject(project.value)
  }

  return {
    project,
    loading,
    error,
    currentPhase,
    isComplete,
    createProject,
    generateContentStrategy,
    saveProject
  }
})
```

### Slides Store

```typescript
// src/renderer/stores/slidesStore.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Slide, SlideElement, VisualData } from '@/shared/types'

export const useSlidesStore = defineStore('slides', () => {
  // State
  const slides = ref<Slide[]>([])
  const activeSlideIndex = ref(0)
  const loading = ref(false)

  // Computed
  const activeSlide = computed(() => slides.value[activeSlideIndex.value])
  const completedCount = computed(() =>
    slides.value.filter(s => s.status === 'complete').length
  )
  const allComplete = computed(() =>
    slides.value.every(s => s.status === 'complete')
  )

  // Actions
  function setActiveSlide(index: number) {
    activeSlideIndex.value = index
  }

  function updateSlideText(updates: Partial<Slide>) {
    if (!activeSlide.value) return
    Object.assign(activeSlide.value, updates)
  }

  function updateElement(element: SlideElement) {
    if (!activeSlide.value) return
    const index = activeSlide.value.elements.findIndex(e => e.id === element.id)
    if (index >= 0) {
      activeSlide.value.elements[index] = element
    }
  }

  async function setVisual(visualData: VisualData) {
    if (!activeSlide.value) return
    activeSlide.value.visualData = visualData
    activeSlide.value.visualType = visualData.type
  }

  function setBackground(type: 'solid' | 'gradient' | 'image', value: string) {
    if (!activeSlide.value) return
    activeSlide.value.backgroundType = type
    if (type === 'image') {
      activeSlide.value.backgroundImagePath = value
    } else {
      activeSlide.value.backgroundColor = value
    }
  }

  async function renderSlide() {
    if (!activeSlide.value) return

    loading.value = true
    try {
      const result = await window.electronAPI.renderSlideToPng(
        activeSlide.value,
        `templates/slide-layouts/${activeSlide.value.layout}.html`,
        `output/slides/slide_${activeSlide.value.slideNum.toString().padStart(2, '0')}.png`
      )

      if (result.success) {
        activeSlide.value.pngPath = result.data
        activeSlide.value.status = 'complete'
      }
    } finally {
      loading.value = false
    }
  }

  function nextSlide() {
    if (activeSlideIndex.value < slides.value.length - 1) {
      activeSlideIndex.value++
    }
  }

  function prevSlide() {
    if (activeSlideIndex.value > 0) {
      activeSlideIndex.value--
    }
  }

  return {
    slides,
    activeSlideIndex,
    activeSlide,
    loading,
    completedCount,
    allComplete,
    setActiveSlide,
    updateSlideText,
    updateElement,
    setVisual,
    setBackground,
    renderSlide,
    nextSlide,
    prevSlide
  }
})
```

---

## API Integrations

### Summary Table

| API | Purpose | Auth | Cost |
|-----|---------|------|------|
| OpenAI GPT-5/4o | Content strategy, diagrams | API Key | $5/$15 per 1M tokens |
| OpenAI TTS | Voice generation | API Key | $15 per 1M chars |
| ElevenLabs | Premium voice | API Key | $0.30 per 1K chars |
| Google GenAI | AI images | API Key | $0.04/image |
| Pexels | Stock photos | API Key | Free |

### Environment Variables

```bash
# .env
OPENAI_API_KEY=sk-proj-...
ELEVENLABS_API_KEY=...
GOOGLE_CLOUD_API_KEY=AIza...
PEXELS_API_KEY=...
```

---

## Reference Images System

### Source
Copy from `corndel-image-generator/public/reference-images/`:
- Corndel logo variants
- Artboard designs
- Brand templates

### Usage
- Slide backgrounds
- Brand consistency
- Visual elements

### Implementation
Use same pattern as `corndel-image-generator`:
- `get-bundled-reference-images` IPC handler
- `load-reference-image-data` for on-demand loading
- `file://` URLs for previews

---

## Implementation Order

### Week 1: Foundation
1. **Project scaffold**
   - Electron + Vue + Vite setup
   - TypeScript configuration
   - Tailwind CSS
   - Folder structure

2. **Core infrastructure**
   - IPC bridge (preload.ts)
   - electron-store for persistence
   - Type definitions

3. **Settings & API keys**
   - Settings panel UI
   - API key management
   - Key testing

### Week 2: Phase 1
4. **Project setup UI**
   - ProjectSetup.vue
   - Form inputs
   - Document upload

5. **Content strategy generation**
   - OpenAI service
   - GPT-5 integration
   - Structured outputs

6. **Plan review UI**
   - Display generated plan
   - Slide overview

### Week 3: Phase 2 (Core)
7. **Slide editor layout**
   - SlideEditor.vue
   - Sidebar with thumbnails
   - Navigation

8. **Text editing**
   - TextEditor.vue
   - Layout selector
   - Narration editor

9. **Canvas implementation**
   - SlideCanvas.vue
   - Drag-and-drop
   - Element positioning

### Week 4: Phase 2 (Visuals)
10. **Visual generation**
    - Pexels search
    - Google GenAI images
    - GPT diagrams

11. **Background system**
    - Reference images integration
    - Color/gradient options

12. **Slide rendering**
    - Playwright service
    - HTML templates
    - PNG generation

### Week 5: Phases 3 & 4
13. **Audio generation**
    - OpenAI TTS
    - ElevenLabs
    - Per-slide MP3s

14. **Video assembly**
    - FFmpeg service
    - Slide concatenation
    - Final export

15. **Polish**
    - Progress tracking
    - Error handling
    - Cost tracking
    - Testing

---

## Cost Tracking

### Per-Video Estimates

| Phase | Low Cost | High Cost |
|-------|----------|-----------|
| Content Strategy (GPT-5) | $0.02 | $0.03 |
| Diagrams (GPT-5, 3 slides) | $0.02 | $0.03 |
| Images (GenAI, 2 slides) | $0.08 | $0.08 |
| Images (Pexels, others) | $0.00 | $0.00 |
| TTS (OpenAI, 500 chars) | $0.008 | $0.008 |
| TTS (ElevenLabs, 500 chars) | - | $0.15 |
| **Total** | **$0.13** | **$0.30** |

---

## Future Enhancements

### Phase 1
- [ ] Multiple content strategy options to choose from
- [ ] Edit strategy before proceeding

### Phase 2
- [ ] Advanced canvas: rotation, opacity, layers
- [ ] Custom fonts
- [ ] Animation previews
- [ ] Template library

### Phase 3
- [ ] Audio preview before generation
- [ ] Per-slide voice adjustment
- [ ] Background music layer

### Phase 4
- [ ] Transition effects library
- [ ] Video preview before export
- [ ] Multiple export formats (WebM, GIF)
- [ ] Auto-upload to YouTube/Vimeo

---

## Document Version

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Created | December 19, 2025 |
| Author | Claude (AI Assistant) |
| Status | Ready for Implementation |

---

**Next Step**: Begin implementation with project scaffold (Week 1, Item 1).
