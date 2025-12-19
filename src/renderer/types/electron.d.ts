import type {
  Project,
  ProjectConfig,
  ContentStrategy,
  AppSettings,
  GenAIOptions,
  ReferenceImage,
  PexelsImage,
  GalleryImage,
  SlideVideo,
  VideoOptions,
  TemplateParams,
  ProgressUpdate
} from '@shared/types'

export interface ElectronAPI {
  // Settings & API Keys
  getSettings: () => Promise<AppSettings>
  saveSettings: (settings: Partial<AppSettings>) => Promise<boolean>
  setApiKey: (provider: string, apiKey: string) => Promise<{ success: boolean; message?: string }>
  getApiKey: (provider: string) => Promise<{ hasKey: boolean; maskedKey: string }>
  clearApiKey: (provider: string) => Promise<boolean>

  // Project Management
  createProject: (config: ProjectConfig) => Promise<{ success: boolean; data?: Project; error?: string }>
  loadProject: (projectId: string) => Promise<{ success: boolean; data?: Project; error?: string }>
  saveProject: (project: Project) => Promise<boolean>
  listProjects: () => Promise<Project[]>
  deleteProject: (projectId: string) => Promise<boolean>

  // Content Generation
  generateContentStrategy: (config: ProjectConfig) => Promise<{ success: boolean; data?: ContentStrategy; error?: string; cost?: number }>
  generateDiagram: (description: string) => Promise<{ success: boolean; data?: string; error?: string }>
  generateDiagramHtml: (description: string, colors: { primary: string; secondary: string; accent: string }) => Promise<{ success: boolean; data?: string; error?: string; cost?: number }>

  // Image Generation
  generateImage: (prompt: string, model?: string) => Promise<{ success: boolean; data?: string; error?: string }>
  generateGenaiImage: (prompt: string, options: GenAIOptions, outputPath: string) => Promise<{ success: boolean; data?: { imagePath: string; imageBase64: string }; error?: string; cost?: number }>
  searchPexels: (query: string, count?: number) => Promise<{ success: boolean; data?: PexelsImage[]; error?: string }>
  downloadPexelsImage: (imageUrl: string, outputPath: string) => Promise<{ success: boolean; data?: string; error?: string }>

  // Reference Images
  getBundledReferenceImages: () => Promise<ReferenceImage[]>
  loadReferenceImageData: (filePath: string) => Promise<{ success: boolean; data?: string; mimeType?: string; error?: string }>

  // Image Gallery
  getGalleryImages: () => Promise<GalleryImage[]>

  // TTS
  generateOpenaiTts: (text: string, voice: string, outputPath: string) => Promise<{ success: boolean; data?: { audioPath: string; duration: number }; error?: string; cost?: number }>
  generateElevenlabsTts: (text: string, voiceId: string, outputPath: string) => Promise<{ success: boolean; data?: { audioPath: string; duration: number }; error?: string; cost?: number }>
  generateAudio: (params: { projectId: string; text: string; provider: string; voiceName: string; slideNum: number }) => Promise<{ success: boolean; data?: { path: string; duration: number }; error?: string; cost?: number }>

  // Video Assembly
  assembleVideo: (slides: SlideVideo[], outputPath: string, options: VideoOptions) => Promise<{ success: boolean; data?: string; error?: string }>

  // File Dialogs
  selectDocuments: () => Promise<{ success: boolean; data?: Array<{ fileName: string; content: string; mimeType: string }>; error?: string }>
  selectOutputFolder: () => Promise<string | null>
  selectImage: () => Promise<{ success: boolean; data?: string; error?: string }>
  showInFolder: (filePath: string) => Promise<void>

  // Template
  getTemplateParams: () => Promise<TemplateParams>

  // Events
  onProgressUpdate: (callback: (progress: ProgressUpdate) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
