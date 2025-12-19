# Corndel Explainer Videos

An Electron + Vue 3 application for creating AI-powered explainer videos with automated slide generation, visual content, and narration.

## Features

### Content Generation
- **AI Content Strategy**: Generates complete slide content from documents or topics using OpenAI GPT-4
- **Smart Slide Planning**: Automatically creates headlines, subheadlines, body text, bullet points, and narration scripts

### Visual Panel
- **Stock Photos**: Search and download images from Pexels API
- **AI Image Generation**: Generate images using Google GenAI with model selection:
  - Gemini 2.5 Flash (fast, cheaper)
  - Gemini 3 Pro (premium, higher quality)
- **Diagram Generation**: Create HTML/CSS diagrams rendered as PNG images
- **Image Gallery**: Auto-archive of all generated/downloaded images for reuse
- **Zoom Controls**: Adjust image fit (cover/contain) and position (9-point grid)

### Slide Editor
- **Real-time Text Editing**: Edit headlines, subheadlines, body text, and bullet points with live preview
- **Dynamic Element Management**: Elements are automatically created when text is added and removed when cleared
- **Background Controls**: Solid colors, gradients, or images with size/position controls
- **Layout Templates**: Multiple layout options (text-left, text-right, center, etc.)

### Audio & Video
- **Text-to-Speech**: Generate narration using OpenAI TTS or ElevenLabs
- **Video Assembly**: Compile slides and audio into final video using FFmpeg

## Tech Stack

- **Frontend**: Vue 3 + TypeScript + Pinia + Tailwind CSS
- **Backend**: Electron with Node.js
- **AI Services**:
  - OpenAI GPT-4 (content generation)
  - Google GenAI (image generation)
  - Pexels API (stock photos)
  - OpenAI TTS / ElevenLabs (narration)
- **Build**: Vite + electron-builder

## Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file (see `.env.example`):

```env
OPENAI_API_KEY=your-openai-key
GOOGLE_GENAI_API_KEY=your-google-genai-key
PEXELS_API_KEY=your-pexels-key
ELEVENLABS_API_KEY=your-elevenlabs-key
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Project Structure

```
├── electron/
│   ├── main.ts          # Electron main process
│   └── preload.ts       # Preload script for IPC
├── src/
│   ├── renderer/
│   │   ├── components/  # Vue components
│   │   ├── stores/      # Pinia stores
│   │   ├── views/       # Page views
│   │   └── types/       # TypeScript definitions
│   └── shared/
│       └── types.ts     # Shared type definitions
├── templates/           # Video templates
└── public/              # Static assets
```

## Key Components

### Stores
- **projectStore**: Project management, content strategy, slide CRUD
- **slidesStore**: Active slide state, element manipulation, visual data

### Panels
- **TextPanel**: Edit slide text content
- **VisualPanel**: Image search, AI generation, gallery
- **BackgroundPanel**: Background color/gradient/image settings
- **NarrationPanel**: TTS generation and preview

## Recent Updates

- Added image gallery with auto-archiving of generated/downloaded images
- Added zoom controls for visual images (objectFit/objectPosition)
- Added AI image model selection (Flash vs Pro)
- Fixed text element removal when content is cleared
- Fixed Pexels image search and download
- Fixed diagram generation
- Added real-time text updates with debouncing
- Fixed background size/position synchronization

## License

MIT
