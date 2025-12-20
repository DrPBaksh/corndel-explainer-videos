import { contextBridge, ipcRenderer } from 'electron'
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
} from '../src/shared/types'

// Expose API to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // ============================================
  // SETTINGS & API KEYS
  // ============================================
  getSettings: (): Promise<AppSettings> =>
    ipcRenderer.invoke('get-settings'),

  saveSettings: (settings: Partial<AppSettings>): Promise<boolean> =>
    ipcRenderer.invoke('save-settings', settings),

  setApiKey: (provider: string, apiKey: string): Promise<{ success: boolean; message?: string }> =>
    ipcRenderer.invoke('set-api-key', provider, apiKey),

  getApiKey: (provider: string): Promise<{ hasKey: boolean; maskedKey: string }> =>
    ipcRenderer.invoke('get-api-key', provider),

  clearApiKey: (provider: string): Promise<boolean> =>
    ipcRenderer.invoke('clear-api-key', provider),

  // ============================================
  // PROJECT MANAGEMENT
  // ============================================
  createProject: (config: ProjectConfig): Promise<{ success: boolean; data?: Project; error?: string }> =>
    ipcRenderer.invoke('create-project', config),

  loadProject: (projectId: string): Promise<{ success: boolean; data?: Project; error?: string }> =>
    ipcRenderer.invoke('load-project', projectId),

  saveProject: (project: Project): Promise<boolean> =>
    ipcRenderer.invoke('save-project', project),

  listProjects: (): Promise<Project[]> =>
    ipcRenderer.invoke('list-projects'),

  deleteProject: (projectId: string): Promise<boolean> =>
    ipcRenderer.invoke('delete-project', projectId),

  // ============================================
  // CONTENT GENERATION
  // ============================================
  generateContentStrategy: (config: ProjectConfig): Promise<{ success: boolean; data?: ContentStrategy; error?: string; cost?: number }> =>
    ipcRenderer.invoke('generate-content-strategy', config),

  generateDiagram: (description: string): Promise<{ success: boolean; data?: string; error?: string }> =>
    ipcRenderer.invoke('generate-diagram', description),

  generateDiagramHtml: (description: string, colors: { primary: string; secondary: string; accent: string }): Promise<{ success: boolean; data?: string; error?: string; cost?: number }> =>
    ipcRenderer.invoke('generate-diagram-html', description, colors),

  regenerateSlide: (params: {
    projectId: string
    slideNum: number
    customInstructions: string
    regenerateFields: {
      layout: boolean
      headline: boolean
      subheadline: boolean
      bodyText: boolean
      bullets: boolean
      visualSuggestions: boolean
      narration: boolean
    }
  }): Promise<{ success: boolean; data?: any; error?: string; cost?: number }> =>
    ipcRenderer.invoke('regenerate-slide', params),

  // ============================================
  // IMAGE GENERATION
  // ============================================
  generateImage: (prompt: string, model?: string): Promise<{ success: boolean; data?: string; error?: string }> =>
    ipcRenderer.invoke('generate-image', prompt, model),

  generateGenaiImage: (prompt: string, options: GenAIOptions, outputPath: string): Promise<{ success: boolean; data?: { imagePath: string; imageBase64: string }; error?: string; cost?: number }> =>
    ipcRenderer.invoke('generate-genai-image', prompt, options, outputPath),

  generateOpenAIImage: (prompt: string, model?: string): Promise<{ success: boolean; data?: string; error?: string; cost?: number }> =>
    ipcRenderer.invoke('generate-openai-image', prompt, model),

  removeBackground: (imagePath: string): Promise<{ success: boolean; data?: string; error?: string; cost?: number }> =>
    ipcRenderer.invoke('remove-background', imagePath),

  searchPexels: (query: string, count?: number): Promise<{ success: boolean; data?: PexelsImage[]; error?: string }> =>
    ipcRenderer.invoke('search-pexels', query, count),

  downloadPexelsImage: (imageUrl: string, outputPath: string): Promise<{ success: boolean; data?: string; error?: string }> =>
    ipcRenderer.invoke('download-pexels-image', imageUrl, outputPath),

  // ============================================
  // REFERENCE IMAGES
  // ============================================
  getBundledReferenceImages: (): Promise<ReferenceImage[]> =>
    ipcRenderer.invoke('get-bundled-reference-images'),

  loadReferenceImageData: (filePath: string): Promise<{ success: boolean; data?: string; mimeType?: string; error?: string }> =>
    ipcRenderer.invoke('load-reference-image-data', filePath),

  // ============================================
  // IMAGE GALLERY
  // ============================================
  getGalleryImages: (): Promise<GalleryImage[]> =>
    ipcRenderer.invoke('get-gallery-images'),

  // ============================================
  // TTS
  // ============================================
  generateOpenaiTts: (text: string, voice: string, outputPath: string): Promise<{ success: boolean; data?: { audioPath: string; duration: number }; error?: string; cost?: number }> =>
    ipcRenderer.invoke('generate-openai-tts', text, voice, outputPath),

  generateElevenlabsTts: (text: string, voiceId: string, outputPath: string): Promise<{ success: boolean; data?: { audioPath: string; duration: number }; error?: string; cost?: number }> =>
    ipcRenderer.invoke('generate-elevenlabs-tts', text, voiceId, outputPath),

  generateAudio: (params: { projectId: string; text: string; provider: string; voiceName: string; slideNum: number }): Promise<{ success: boolean; data?: { path: string; duration: number }; error?: string; cost?: number }> =>
    ipcRenderer.invoke('generate-audio', params),

  // ============================================
  // VIDEO GENERATION
  // ============================================
  generateVideo: (projectId: string): Promise<{ success: boolean; data?: { path: string; duration: number }; error?: string }> =>
    ipcRenderer.invoke('generate-video', projectId),

  // Legacy - VIDEO ASSEMBLY
  assembleVideo: (slides: SlideVideo[], outputPath: string, options: VideoOptions): Promise<{ success: boolean; data?: string; error?: string }> =>
    ipcRenderer.invoke('assemble-video', slides, outputPath, options),

  // ============================================
  // SLIDE RENDERING
  // ============================================
  saveSlidePng: (projectId: string, slideNum: number, dataUrl: string): Promise<{ success: boolean; data?: string; error?: string }> =>
    ipcRenderer.invoke('save-slide-png', projectId, slideNum, dataUrl),

  // ============================================
  // FILE DIALOGS
  // ============================================
  selectDocuments: (): Promise<{ success: boolean; data?: Array<{ fileName: string; content: string; mimeType: string }>; error?: string }> =>
    ipcRenderer.invoke('select-documents'),

  selectOutputFolder: (): Promise<string | null> =>
    ipcRenderer.invoke('select-output-folder'),

  selectImage: (): Promise<{ success: boolean; data?: string; error?: string }> =>
    ipcRenderer.invoke('select-image'),

  showInFolder: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('show-in-folder', filePath),

  saveVideoAs: (sourcePath: string, projectName: string): Promise<{ success: boolean; data?: string; error?: string }> =>
    ipcRenderer.invoke('save-video-as', sourcePath, projectName),

  // ============================================
  // TEMPLATE
  // ============================================
  getTemplateParams: (): Promise<TemplateParams> =>
    ipcRenderer.invoke('get-template-params'),

  // ============================================
  // EVENTS
  // ============================================
  onProgressUpdate: (callback: (progress: ProgressUpdate) => void) => {
    const handler = (_event: any, progress: ProgressUpdate) => callback(progress)
    ipcRenderer.on('progress-update', handler)
    return () => ipcRenderer.removeListener('progress-update', handler)
  }
})
