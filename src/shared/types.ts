// ============================================
// PROJECT & CONFIGURATION
// ============================================

export interface Project {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  status: ProjectStatus

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

  // File paths
  projectDir: string
}

export type ProjectStatus = 'setup' | 'planning' | 'editing' | 'audio' | 'video' | 'complete'

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
  type: SlideType
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

  // Animation plan (AI-generated)
  animationPlan?: AnimationPlan
}

export type SlideType = 'intro' | 'main' | 'end'

export type VisualType =
  | 'pexels'      // Stock photo
  | 'gemini'      // AI-generated image
  | 'diagram'     // GPT HTML diagram
  | 'chart'       // Chart.js
  | 'code'        // Code block
  | 'table'       // HTML table
  | 'gallery'     // Previously used image from gallery
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
  status: SlideStatus

  // Content (user-editable)
  headline: string | null
  subheadline: string | null
  bodyText: string | null
  bullets: string[] | null

  // Visual
  visualType: VisualType
  visualData: VisualData | null

  // Visual generation hints (from content strategy)
  pexelsKeywords: string | null
  geminiPrompt: string | null
  diagramDescription: string | null

  // Layout
  layout: LayoutType

  // Element positions (for drag-and-drop)
  elements: SlideElement[]

  // Background
  backgroundType: BackgroundType
  backgroundColor: string | null
  backgroundGradient: string | null
  backgroundImagePath: string | null   // Reference image
  backgroundSize: string | null        // CSS background-size (cover, contain, 100%, etc.)
  backgroundPosition: string | null    // CSS background-position (center, top left, etc.)

  // Narration
  narration: string

  // Timing
  duration: number | null              // Duration in seconds

  // Generated assets
  pngPath: string | null
  htmlPath: string | null

  // Audio
  audioPath: string | null
  audioDuration: number | null

  // Animation settings
  animationsEnabled: boolean
  animationPlan?: AnimationPlan         // Resolved animation plan for this slide
  transition?: SlideTransition          // Transition to next slide
}

export type SlideStatus = 'pending' | 'editing' | 'complete'
export type BackgroundType = 'solid' | 'gradient' | 'image'

export interface SlideElement {
  id: string
  type: ElementType
  x: number                          // Percentage 0-100
  y: number                          // Percentage 0-100
  width: number                      // Percentage
  height: number                     // Percentage
  zIndex: number
  content: string | null             // For text elements
  imagePath: string | null           // For image elements
  styles: ElementStyles
  // Direct styling (alternative to styles object)
  fontSize?: number
  fontWeight?: string
  color?: string
  textAlign?: 'left' | 'center' | 'right'
  // Animation for this element
  animation?: ElementAnimation | null
}

export type ElementType = 'headline' | 'subheadline' | 'body' | 'bullets' | 'image'

export interface ElementStyles {
  fontSize?: number
  fontWeight?: string
  color?: string
  textAlign?: 'left' | 'center' | 'right'
  backgroundColor?: string
  borderRadius?: number
  padding?: number
  // Image-specific styles
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  objectPosition?: string  // CSS object-position (e.g., 'center', 'top left', '50% 25%')
}

export interface VisualData {
  type: VisualType
  imagePath: string | null           // Path to PNG
  imageBase64: string | null         // For preview
  sourceUrl: string | null           // Pexels URL
  generationPrompt: string | null    // What was used to generate
  thumbnailPath: string | null
  source?: string                    // Source identifier (e.g., 'pexels', 'upload', 'gallery')
  metadata?: Record<string, any>     // Additional metadata (objectFit, objectPosition, etc.)
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

export type ImageGenModel =
  | 'gemini-2.5-flash-image'      // Fast, cheaper
  | 'gemini-3-pro-image-preview'  // Premium, higher quality

export interface GenAIOptions {
  model: ImageGenModel
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  temperature: number
  safetyOff: boolean
}

export interface TTSOptions {
  provider: 'openai' | 'elevenlabs'
  voice: string
  speed: number
  model?: string                      // 'tts-1-hd' for OpenAI
}

// ============================================
// ANIMATIONS
// ============================================

export type AnimationType =
  | 'none'
  | 'fade-in'
  | 'fade-out'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'scale-in'
  | 'scale-out'
  | 'typewriter'
  | 'bounce'
  | 'zoom-in'
  // Emphasis animations
  | 'highlight'
  | 'glow-pulse'
  | 'shake'
  | 'wobble'
  | 'pop'
  // Draw animations
  | 'underline-draw'
  | 'circle-draw'

export type EasingType =
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'bounce'
  | 'elastic'

export interface ElementAnimation {
  id: string
  elementId: string
  type: AnimationType
  startTime: number                    // Seconds from slide start
  duration: number                     // Animation duration in seconds
  easing: EasingType
  delay?: number                       // Optional delay before animation starts
  // Animation-specific options
  distance?: number                    // For slide animations (percentage)
  highlightColor?: string              // For highlight animation
  intensity?: 'light' | 'medium' | 'strong'  // For shake/wobble
}

export interface SlideTransition {
  type: 'cut' | 'fade' | 'dissolve' | 'slide-left' | 'slide-right' | 'wipe' | 'zoom'
  duration: number                     // Transition duration in seconds
}

export interface AnimationPlan {
  elementAnimations: Array<{
    elementType: ElementType
    animation: AnimationType
    relativeStartPercent: number       // 0-100 percent into slide duration
    durationPercent: number            // Percent of slide duration
    easing: EasingType
  }>
  staggerDelay?: number                // Delay between sequential elements (seconds)
  totalBuildTime?: number              // How long all animations take
  transition?: SlideTransition         // Transition to next slide
}

// ============================================
// PROGRESS & STATUS
// ============================================

export interface ProgressUpdate {
  phase: ProjectStatus
  step: string
  progress: number                   // 0-100
  message: string
  currentItem: number | null
  totalItems: number | null
  type?: string                      // Type of progress (e.g., 'slide', 'audio', 'video')
  slideIndex?: number                // Current slide being processed
}

export interface GenerationResult<T> {
  success: boolean
  data?: T
  error?: string
  cost?: number
}

// ============================================
// REFERENCE IMAGES
// ============================================

export interface ReferenceImage {
  id: string
  fileName: string
  filePath: string
  previewUrl: string
  mimeType: string
  isBundled: boolean
}

// ============================================
// PEXELS
// ============================================

export interface PexelsImage {
  id: number
  url: string
  thumbnail: string
  photographer: string
  alt: string
}

// ============================================
// IMAGE GALLERY
// ============================================

export interface GalleryImage {
  id: string
  fileName: string
  filePath: string
  thumbnail?: string
  source: 'pexels' | 'genai' | 'diagram' | 'upload' | 'unknown'
  createdAt: string
}

// ============================================
// SETTINGS
// ============================================

export interface AppSettings {
  // API Keys (stored separately for security)
  hasOpenAIKey: boolean
  hasElevenLabsKey: boolean
  hasGenAIKey: boolean
  hasPexelsKey: boolean
  hasRemoveBgKey: boolean

  // Preferences
  defaultVoiceProvider: 'openai' | 'elevenlabs'
  defaultVoice: string
  defaultOutputDir: string
  defaultNumSlides: number
  defaultDuration: number

  // Cost tracking
  totalCost: number
  totalVideosGenerated: number
}

// ============================================
// TEMPLATE
// ============================================

export interface TemplateParams {
  brand: {
    logoPath: string
    companyName: string
    logoDimensions: string
  }
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
  }
  typography: {
    fontPrimary: string
    fontSizeTitle: number
    fontSizeSubtitle: number
    fontSizeBody: number
    fontSizeBullet: number
  }
}

// ============================================
// VIDEO ASSEMBLY
// ============================================

export interface SlideVideo {
  slideNum: number
  pngPath: string
  mp3Path: string
  duration: number
}

export interface VideoOptions {
  resolution: {
    width: number
    height: number
  }
  enableTransitions: boolean
  transitionDuration: number
  outputPath: string
}
