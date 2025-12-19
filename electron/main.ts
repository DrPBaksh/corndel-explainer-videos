import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'fs'
import Store from 'electron-store'
import type {
  Project,
  ProjectConfig,
  ContentStrategy,
  Slide,
  SlideStrategy,
  AppSettings,
  GenAIOptions,
  TTSOptions,
  ProgressUpdate,
  ReferenceImage,
  PexelsImage,
  GalleryImage,
  SlideVideo,
  VideoOptions,
  TemplateParams
} from '../src/shared/types'

// Load environment variables
const envPaths = [
  join(__dirname, '..', '.env'),
  join(app.getPath('userData'), '.env'),
  join(process.cwd(), '.env')
]

for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8')
    content.split('\n').forEach((line: string) => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=')
        if (key && values.length) {
          process.env[key.trim()] = values.join('=').trim()
        }
      }
    })
    break
  }
}

// Initialize stores
const settingsStore = new Store({
  name: 'settings',
  defaults: {
    defaultVoiceProvider: 'openai',
    defaultVoice: 'nova',
    defaultOutputDir: '',
    defaultNumSlides: 5,
    defaultDuration: 60,
    totalCost: 0,
    totalVideosGenerated: 0
  }
})

const apiKeyStore = new Store({
  name: 'api-keys',
  encryptionKey: 'corndel-explainer-videos-2025'
})

const projectsStore = new Store({
  name: 'projects',
  defaults: {
    projects: []
  }
})

// Main window reference
let mainWindow: BrowserWindow | null = null

// ============================================
// WINDOW CREATION
// ============================================

function createWindow() {
  const preloadPath = join(__dirname, 'preload.js')

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: false
    },
    titleBarStyle: 'default',
    show: false
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }
}

// ============================================
// SETTINGS & API KEYS
// ============================================

ipcMain.handle('get-settings', async (): Promise<AppSettings> => {
  return {
    hasOpenAIKey: !!apiKeyStore.get('openai'),
    hasElevenLabsKey: !!apiKeyStore.get('elevenlabs'),
    hasGenAIKey: !!apiKeyStore.get('genai'),
    hasPexelsKey: !!apiKeyStore.get('pexels'),
    defaultVoiceProvider: settingsStore.get('defaultVoiceProvider') as 'openai' | 'elevenlabs',
    defaultVoice: settingsStore.get('defaultVoice') as string,
    defaultOutputDir: settingsStore.get('defaultOutputDir') as string,
    defaultNumSlides: settingsStore.get('defaultNumSlides') as number,
    defaultDuration: settingsStore.get('defaultDuration') as number,
    totalCost: settingsStore.get('totalCost') as number,
    totalVideosGenerated: settingsStore.get('totalVideosGenerated') as number
  }
})

ipcMain.handle('save-settings', async (_event, settings: Partial<AppSettings>): Promise<boolean> => {
  try {
    const { hasOpenAIKey, hasElevenLabsKey, hasGenAIKey, hasPexelsKey, ...rest } = settings
    Object.entries(rest).forEach(([key, value]) => {
      if (value !== undefined) {
        settingsStore.set(key, value)
      }
    })
    return true
  } catch (e) {
    console.error('Failed to save settings:', e)
    return false
  }
})

ipcMain.handle('set-api-key', async (_event, provider: string, apiKey: string): Promise<{ success: boolean; message?: string }> => {
  try {
    // Normalize provider name to lowercase
    const normalizedProvider = provider.toLowerCase()
    apiKeyStore.set(normalizedProvider, apiKey)
    return { success: true }
  } catch (e: any) {
    return { success: false, message: e.message }
  }
})

ipcMain.handle('get-api-key', async (_event, provider: string): Promise<{ hasKey: boolean; maskedKey: string }> => {
  const normalizedProvider = provider.toLowerCase()
  const key = apiKeyStore.get(normalizedProvider) as string || ''
  if (key && key.length > 4) {
    return { hasKey: true, maskedKey: '•'.repeat(key.length - 4) + key.slice(-4) }
  }
  return { hasKey: !!key, maskedKey: '' }
})

ipcMain.handle('clear-api-key', async (_event, provider: string): Promise<boolean> => {
  try {
    const normalizedProvider = provider.toLowerCase()
    apiKeyStore.delete(normalizedProvider)
    return true
  } catch {
    return false
  }
})

// ============================================
// PROJECT MANAGEMENT
// ============================================

ipcMain.handle('create-project', async (_event, config: ProjectConfig): Promise<{ success: boolean; data?: Project; error?: string }> => {
  console.log('Creating project with config:', config)
  try {
    const id = `project_${Date.now()}`
    const projectDir = join(app.getPath('userData'), 'projects', id)
    console.log('Project directory:', projectDir)
    mkdirSync(projectDir, { recursive: true })
    mkdirSync(join(projectDir, 'slides'), { recursive: true })
    mkdirSync(join(projectDir, 'audio'), { recursive: true })
    mkdirSync(join(projectDir, 'video'), { recursive: true })

    const project: Project = {
      id,
      name: config.topic.substring(0, 50),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'setup',
      config,
      contentStrategy: null,
      slides: [],
      audioGenerated: false,
      videoPath: null,
      totalCost: 0,
      costBreakdown: {
        contentGeneration: 0,
        webResearch: 0,
        textHtml: 0,
        diagramGeneration: 0,
        imageGeneration: 0,
        visionReview: 0,
        audioGeneration: 0,
        total: 0
      },
      projectDir
    }

    // Save project metadata
    writeFileSync(join(projectDir, 'project.json'), JSON.stringify(project, null, 2))

    // Add to projects list
    const projects = projectsStore.get('projects') as string[]
    projects.push(id)
    projectsStore.set('projects', projects)

    console.log('Project created successfully:', project.id)
    return { success: true, data: project }
  } catch (e: any) {
    console.error('Failed to create project:', e)
    return { success: false, error: e.message }
  }
})

ipcMain.handle('load-project', async (_event, projectId: string): Promise<{ success: boolean; data?: Project; error?: string }> => {
  try {
    const projectDir = join(app.getPath('userData'), 'projects', projectId)
    const projectPath = join(projectDir, 'project.json')

    if (!existsSync(projectPath)) {
      return { success: false, error: 'Project not found' }
    }

    const project = JSON.parse(readFileSync(projectPath, 'utf-8'))
    return { success: true, data: project }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
})

ipcMain.handle('save-project', async (_event, project: Project): Promise<boolean> => {
  try {
    project.updatedAt = new Date().toISOString()
    const projectPath = join(project.projectDir, 'project.json')
    writeFileSync(projectPath, JSON.stringify(project, null, 2))
    return true
  } catch (e) {
    console.error('Failed to save project:', e)
    return false
  }
})

ipcMain.handle('list-projects', async (): Promise<Project[]> => {
  try {
    const projectIds = projectsStore.get('projects') as string[]
    const projects: Project[] = []

    for (const id of projectIds) {
      const projectDir = join(app.getPath('userData'), 'projects', id)
      const projectPath = join(projectDir, 'project.json')

      if (existsSync(projectPath)) {
        const project = JSON.parse(readFileSync(projectPath, 'utf-8'))
        projects.push(project)
      }
    }

    return projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  } catch (e) {
    console.error('Failed to list projects:', e)
    return []
  }
})

ipcMain.handle('delete-project', async (_event, projectId: string): Promise<boolean> => {
  try {
    const projectDir = join(app.getPath('userData'), 'projects', projectId)
    if (existsSync(projectDir)) {
      rmSync(projectDir, { recursive: true })
    }

    const projects = projectsStore.get('projects') as string[]
    projectsStore.set('projects', projects.filter(id => id !== projectId))

    return true
  } catch (e) {
    console.error('Failed to delete project:', e)
    return false
  }
})

// ============================================
// CONTENT GENERATION (OpenAI)
// ============================================

ipcMain.handle('generate-content-strategy', async (_event, config: ProjectConfig): Promise<{ success: boolean; data?: ContentStrategy; error?: string; cost?: number }> => {
  const apiKey = apiKeyStore.get('openai') as string
  if (!apiKey) {
    return { success: false, error: 'OpenAI API key not configured' }
  }

  try {
    const OpenAI = (await import('openai')).default
    const openai = new OpenAI({ apiKey })

    const systemPrompt = buildContentSystemPrompt(config)
    const userPrompt = buildContentUserPrompt(config)

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    })

    const content = response.choices[0].message.content
    if (!content) {
      return { success: false, error: 'No response from AI' }
    }

    const strategy = JSON.parse(content) as ContentStrategy

    // Calculate cost
    const inputTokens = response.usage?.prompt_tokens || 0
    const outputTokens = response.usage?.completion_tokens || 0
    const cost = (inputTokens / 1_000_000 * 2.5) + (outputTokens / 1_000_000 * 10)

    return { success: true, data: strategy, cost }
  } catch (e: any) {
    console.error('Content generation error:', e)
    return { success: false, error: e.message }
  }
})

function buildContentSystemPrompt(config: ProjectConfig): string {
  return `You are an expert explainer video content strategist and scriptwriter.

Your task is to create a complete content strategy for an explainer video in JSON format.

REQUIREMENTS:
- Create ${config.numSlides === 'flexible' ? '5-7' : config.numSlides} slides (1 intro + main slides + 1 end)
- Total duration: ${config.targetDuration} seconds
- Speaking rate: 150 words per minute

For each slide, specify:
1. Layout: Must be one of: "text-left-image-right", "text-right-image-left", "center", "text-top-image-bottom", "full-visual", "split-50-50"
2. Visual type: Must be one of: "pexels", "gemini", "diagram", "chart", "code", "table", "none"
3. Text content: headline, subheadline (optional), bodyText (optional), bullets (optional array)
4. Narration: voiceover script for this slide

Visual type guidance:
- "pexels": Stock photos - provide pexelsKeywords for search
- "gemini": AI-generated custom images - provide detailed geminiPrompt
- "diagram": For flowcharts, processes - provide diagramDescription
- "chart": For data visualizations - will use Chart.js
- "none": Text-only slide (use for intro/outro)

Return a JSON object with this structure:
{
  "topic": "string",
  "totalDuration": number,
  "wordCount": number,
  "fullScript": "complete narration script",
  "slides": [
    {
      "slideNum": 0,
      "type": "intro" | "main" | "end",
      "duration": number (seconds),
      "startTime": number,
      "headline": "string or null",
      "subheadline": "string or null",
      "bodyText": "string or null",
      "bullets": ["array", "of", "strings"] or null,
      "visualType": "pexels" | "gemini" | "diagram" | "chart" | "none",
      "visualDescription": "description of the visual",
      "pexelsKeywords": "search keywords" or null,
      "geminiPrompt": "detailed AI image prompt" or null,
      "diagramDescription": "diagram description" or null,
      "layout": "text-left-image-right",
      "narration": "voiceover script for this slide"
    }
  ]
}`
}

function buildContentUserPrompt(config: ProjectConfig): string {
  let prompt = `Create a content strategy for this explainer video:

TOPIC: ${config.topic}
DESCRIPTION: ${config.description}
DURATION: ${config.targetDuration} seconds
SLIDES: ${config.numSlides === 'flexible' ? '5-7 (you decide)' : config.numSlides}
`

  if (config.groundedMaterial.length > 0) {
    prompt += '\n\nREFERENCE MATERIAL (use this as primary source):\n'
    for (const doc of config.groundedMaterial) {
      prompt += `\n--- ${doc.fileName} ---\n${doc.content.substring(0, 3000)}\n`
    }
  }

  if (config.webSearchEnabled) {
    prompt += '\n\nNote: Use current, accurate information. Include recent statistics and examples where relevant.'
  }

  return prompt
}

// ============================================
// DIAGRAM GENERATION (OpenAI)
// ============================================

// Simple diagram generation - generates HTML and converts to PNG
ipcMain.handle('generate-diagram', async (_event, description: string): Promise<{ success: boolean; data?: string; error?: string }> => {
  const apiKey = apiKeyStore.get('openai') as string
  if (!apiKey) {
    return { success: false, error: 'OpenAI API key not configured. Please add your OpenAI API key in Settings.' }
  }

  try {
    const OpenAI = (await import('openai')).default
    const openai = new OpenAI({ apiKey })

    // Default colors
    const colors = { primary: '#6366f1', secondary: '#8b5cf6', accent: '#ec4899' }

    const prompt = `Generate a clean CSS/HTML diagram based on this description:
${description}

Requirements:
1. Use inline CSS (no external stylesheets)
2. Use these theme colors:
   - Primary: ${colors.primary}
   - Secondary: ${colors.secondary}
   - Accent: ${colors.accent}
3. Use flexbox for layout
4. Fixed dimensions: width 800px, height 450px (16:9 aspect ratio)
5. Use arrows (→, ↓, ←, ↑) or CSS borders for connections
6. Add subtle shadows: box-shadow: 0 4px 12px rgba(0,0,0,0.1)
7. Use large readable fonts (20px+ for labels)
8. Rounded corners (12-16px)
9. White or light background

Output ONLY the HTML, no markdown code blocks, no explanation.`

    console.log('Generating diagram with OpenAI...')
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You generate clean HTML/CSS diagrams. Output only raw HTML, no markdown.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3
    })

    let html = response.choices[0].message.content || ''
    html = html.replace(/```html/g, '').replace(/```/g, '').trim()

    // Wrap in a full HTML document if not already
    if (!html.toLowerCase().includes('<!doctype') && !html.toLowerCase().includes('<html')) {
      html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: white; }
  </style>
</head>
<body>
${html}
</body>
</html>`
    }

    // Save HTML to temp file
    const tempDir = join(app.getPath('temp'), 'corndel-videos', 'diagrams')
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true })
    }

    const timestamp = Date.now()
    const htmlPath = join(tempDir, `diagram_${timestamp}.html`)
    const pngPath = join(tempDir, `diagram_${timestamp}.png`)

    writeFileSync(htmlPath, html)
    console.log('Saved diagram HTML to:', htmlPath)

    // Convert HTML to PNG using Electron's built-in capabilities
    const { BrowserWindow } = await import('electron')
    const win = new BrowserWindow({
      width: 800,
      height: 450,
      show: false,
      webPreferences: {
        offscreen: true
      }
    })

    await win.loadFile(htmlPath)
    await new Promise(resolve => setTimeout(resolve, 500)) // Wait for render

    const image = await win.webContents.capturePage()
    const pngBuffer = image.toPNG()
    writeFileSync(pngPath, pngBuffer)

    win.close()

    console.log('Saved diagram PNG to:', pngPath)

    // Auto-save to gallery
    await saveToGallery(pngPath, 'diagram')

    return { success: true, data: pngPath }
  } catch (e: any) {
    console.error('Diagram generation error:', e)
    return { success: false, error: e.message }
  }
})

ipcMain.handle('generate-diagram-html', async (_event, description: string, colors: { primary: string; secondary: string; accent: string }): Promise<{ success: boolean; data?: string; error?: string; cost?: number }> => {
  const apiKey = apiKeyStore.get('openai') as string
  if (!apiKey) {
    return { success: false, error: 'OpenAI API key not configured' }
  }

  try {
    const OpenAI = (await import('openai')).default
    const openai = new OpenAI({ apiKey })

    const prompt = `Generate a clean CSS/HTML diagram based on this description:
${description}

Requirements:
1. Use inline CSS (no external stylesheets)
2. Use these theme colors:
   - Primary: ${colors.primary}
   - Secondary: ${colors.secondary}
   - Accent: ${colors.accent}
3. Use flexbox for layout
4. Max dimensions: 800x600px
5. Use arrows (→, ↓, ←, ↑) or CSS for connections
6. Add subtle shadows: box-shadow: 0 4px 12px rgba(0,0,0,0.1)
7. Use large readable fonts (24px+ for labels)
8. Rounded corners (12-16px)

Output ONLY the HTML, no markdown code blocks, no explanation.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You generate clean HTML/CSS diagrams. Output only raw HTML, no markdown.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3
    })

    let html = response.choices[0].message.content || ''
    html = html.replace(/```html/g, '').replace(/```/g, '').trim()

    const inputTokens = response.usage?.prompt_tokens || 0
    const outputTokens = response.usage?.completion_tokens || 0
    const cost = (inputTokens / 1_000_000 * 2.5) + (outputTokens / 1_000_000 * 10)

    return { success: true, data: html, cost }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
})

// ============================================
// IMAGE GENERATION (Google GenAI)
// ============================================

// Model mapping
const IMAGE_MODELS = {
  flash: 'gemini-2.5-flash-image',        // Fast, cheaper
  pro: 'gemini-3-pro-image-preview'       // Premium, higher quality
}

// Simple image generation (auto-generates output path)
ipcMain.handle('generate-image', async (_event, prompt: string, model: string = 'flash'): Promise<{ success: boolean; data?: string; error?: string }> => {
  const apiKey = apiKeyStore.get('genai') as string
  if (!apiKey) {
    return { success: false, error: 'Google GenAI API key not configured' }
  }

  // Resolve model name - accept 'flash', 'pro', or full model names
  const modelName = model === 'flash' ? IMAGE_MODELS.flash :
                    model === 'pro' ? IMAGE_MODELS.pro :
                    model.includes('flash') ? IMAGE_MODELS.flash :
                    model.includes('pro') ? IMAGE_MODELS.pro :
                    IMAGE_MODELS.flash

  console.log('Generating image with model:', modelName, 'prompt:', prompt.substring(0, 50) + '...')

  try {
    const { GoogleGenAI } = await import('@google/genai')
    const ai = new GoogleGenAI({ apiKey })

    // Build generation config
    const generateContentConfig = {
      temperature: 1,
      topP: 0.95,
      maxOutputTokens: 32768,
      responseModalities: ['TEXT', 'IMAGE']
    }

    console.log('Sending request to model:', modelName)

    // Make the request using the SDK
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: generateContentConfig
    })

    console.log('Response received')

    // Extract image from response
    const candidates = response.candidates || []
    for (const candidate of candidates) {
      const contentParts = candidate.content?.parts || []
      for (const part of contentParts) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          console.log('Found image!')
          const mimeType = part.inlineData.mimeType
          const buffer = Buffer.from(part.inlineData.data, 'base64')

          // Save to temp directory
          const tempDir = join(app.getPath('temp'), 'corndel-videos', 'genai')
          if (!existsSync(tempDir)) {
            mkdirSync(tempDir, { recursive: true })
          }
          const ext = mimeType === 'image/jpeg' ? 'jpg' : 'png'
          const outputPath = join(tempDir, `genai_${Date.now()}.${ext}`)
          writeFileSync(outputPath, buffer)
          console.log('Image saved to:', outputPath)

          // Auto-save to gallery
          await saveToGallery(outputPath, 'genai')

          return { success: true, data: outputPath }
        }
      }
    }

    return { success: false, error: 'No image in response' }
  } catch (e: any) {
    console.error('GenAI error:', e)
    return { success: false, error: e.message }
  }
})

ipcMain.handle('generate-genai-image', async (_event, prompt: string, options: GenAIOptions, outputPath: string): Promise<{ success: boolean; data?: { imagePath: string; imageBase64: string }; error?: string; cost?: number }> => {
  const apiKey = apiKeyStore.get('genai') as string
  if (!apiKey) {
    return { success: false, error: 'Google GenAI API key not configured' }
  }

  try {
    const { GoogleGenAI } = await import('@google/genai')
    const ai = new GoogleGenAI({ apiKey })

    const modelName = options.model.includes('flash') ? 'gemini-2.5-flash-image' : 'gemini-3-pro-image-preview'

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
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
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
          const imageBase64 = part.inlineData.data
          const buffer = Buffer.from(imageBase64, 'base64')
          writeFileSync(outputPath, buffer)

          const cost = options.model.includes('flash') ? 0.02 : 0.04

          return {
            success: true,
            data: {
              imagePath: outputPath,
              imageBase64: `data:${part.inlineData.mimeType};base64,${imageBase64}`
            },
            cost
          }
        }
      }
    }

    return { success: false, error: 'No image in response' }
  } catch (e: any) {
    console.error('GenAI error:', e)
    return { success: false, error: e.message }
  }
})

// ============================================
// PEXELS SEARCH
// ============================================

ipcMain.handle('search-pexels', async (_event, query: string, count: number = 10): Promise<{ success: boolean; data?: PexelsImage[]; error?: string }> => {
  const apiKey = apiKeyStore.get('pexels') as string
  if (!apiKey) {
    return { success: false, error: 'Pexels API key not configured' }
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
      {
        headers: { Authorization: apiKey }
      }
    )

    if (!response.ok) {
      return { success: false, error: `Pexels API error: ${response.status}` }
    }

    const data = await response.json()

    const images: PexelsImage[] = data.photos.map((photo: any) => ({
      id: photo.id,
      url: photo.src.large2x,
      thumbnail: photo.src.medium,
      photographer: photo.photographer,
      alt: photo.alt || query
    }))

    return { success: true, data: images }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
})

ipcMain.handle('download-pexels-image', async (_event, imageUrl: string, photoId: string): Promise<{ success: boolean; data?: string; error?: string }> => {
  try {
    // Create a temp directory for downloaded images
    const tempDir = join(app.getPath('temp'), 'corndel-videos', 'pexels')
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true })
    }

    const outputPath = join(tempDir, `pexels_${photoId}.jpg`)

    // Check if already downloaded
    if (existsSync(outputPath)) {
      // Still save to gallery even if already downloaded
      await saveToGallery(outputPath, 'pexels')
      return { success: true, data: outputPath }
    }

    const response = await fetch(imageUrl)
    if (!response.ok) {
      return { success: false, error: `Failed to download: ${response.status}` }
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    writeFileSync(outputPath, buffer)
    console.log('Downloaded Pexels image to:', outputPath)

    // Auto-save to gallery
    await saveToGallery(outputPath, 'pexels')

    return { success: true, data: outputPath }
  } catch (e: any) {
    console.error('Pexels download error:', e)
    return { success: false, error: e.message }
  }
})

// ============================================
// REFERENCE IMAGES
// ============================================

ipcMain.handle('get-bundled-reference-images', async (): Promise<ReferenceImage[]> => {
  const isDev = process.env.VITE_DEV_SERVER_URL
  let refDir: string

  if (isDev) {
    refDir = join(__dirname, '..', 'public', 'reference-images')
  } else {
    const asarUnpackedPath = __dirname.replace('app.asar', 'app.asar.unpacked')
    refDir = join(asarUnpackedPath, '..', 'dist', 'reference-images')
  }

  console.log('Looking for reference images in:', refDir)

  if (!existsSync(refDir)) {
    console.log('Reference images folder not found:', refDir)
    return []
  }

  try {
    const files = readdirSync(refDir)
    return files
      .filter((file: string) => /\.(png|jpg|jpeg|gif|webp)$/i.test(file))
      .map((file: string) => {
        const filePath = join(refDir, file)
        const ext = file.split('.').pop()?.toLowerCase()
        const mimeType = ext === 'png' ? 'image/png' :
                         ext === 'gif' ? 'image/gif' :
                         ext === 'webp' ? 'image/webp' : 'image/jpeg'
        return {
          id: `bundled-${file}`,
          fileName: file,
          filePath,
          previewUrl: `file://${filePath}`,
          mimeType,
          isBundled: true
        }
      })
  } catch (e) {
    console.error('Failed to read reference images:', e)
    return []
  }
})

ipcMain.handle('load-reference-image-data', async (_event, filePath: string): Promise<{ success: boolean; data?: string; mimeType?: string; error?: string }> => {
  try {
    if (!existsSync(filePath)) {
      return { success: false, error: 'File not found' }
    }
    const data = readFileSync(filePath)
    const ext = filePath.split('.').pop()?.toLowerCase()
    const mimeType = ext === 'png' ? 'image/png' :
                     ext === 'gif' ? 'image/gif' :
                     ext === 'webp' ? 'image/webp' : 'image/jpeg'
    return {
      success: true,
      data: data.toString('base64'),
      mimeType
    }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
})

// ============================================
// IMAGE GALLERY
// ============================================

// Gallery directory path
function getGalleryDir(): string {
  const galleryDir = join(app.getPath('userData'), 'gallery')
  if (!existsSync(galleryDir)) {
    mkdirSync(galleryDir, { recursive: true })
  }
  return galleryDir
}

// Save an image to the gallery (copies file and records metadata)
async function saveToGallery(imagePath: string, source: 'pexels' | 'genai' | 'diagram' | 'upload'): Promise<string> {
  console.log('saveToGallery called:', { imagePath, source })
  const galleryDir = getGalleryDir()
  console.log('Gallery directory:', galleryDir)

  const fileName = imagePath.split('/').pop() || imagePath.split('\\').pop() || `image_${Date.now()}.png`
  const destPath = join(galleryDir, fileName)
  console.log('Destination path:', destPath)

  // Copy file to gallery if it's not already there
  if (imagePath !== destPath && !existsSync(destPath)) {
    const { copyFileSync } = await import('fs')
    copyFileSync(imagePath, destPath)
    console.log('Copied file to gallery')
  } else {
    console.log('File already exists in gallery or same path')
  }

  // Update gallery index
  const indexPath = join(galleryDir, 'index.json')
  let index: GalleryImage[] = []
  if (existsSync(indexPath)) {
    try {
      index = JSON.parse(readFileSync(indexPath, 'utf-8'))
      console.log('Loaded existing index with', index.length, 'entries')
    } catch {
      console.log('Failed to parse index, starting fresh')
      index = []
    }
  } else {
    console.log('No existing index file')
  }

  // Check if already in index
  const existingIdx = index.findIndex(img => img.filePath === destPath)
  if (existingIdx === -1) {
    const newEntry = {
      id: `gallery_${Date.now()}`,
      fileName,
      filePath: destPath,
      source,
      createdAt: new Date().toISOString()
    }
    index.unshift(newEntry)
    console.log('Added new entry to index:', newEntry)
    // Keep only last 100 images in index
    if (index.length > 100) {
      index = index.slice(0, 100)
    }
    writeFileSync(indexPath, JSON.stringify(index, null, 2))
    console.log('Saved index with', index.length, 'entries')
  } else {
    console.log('Image already in index at position', existingIdx)
  }

  return destPath
}

ipcMain.handle('get-gallery-images', async (): Promise<GalleryImage[]> => {
  console.log('get-gallery-images called')
  const galleryDir = getGalleryDir()
  const indexPath = join(galleryDir, 'index.json')
  console.log('Gallery dir:', galleryDir, 'Index path:', indexPath)

  // First try to load from index
  if (existsSync(indexPath)) {
    try {
      const index = JSON.parse(readFileSync(indexPath, 'utf-8')) as GalleryImage[]
      console.log('Loaded index with', index.length, 'entries')
      // Filter out entries where file no longer exists
      const validImages = index.filter(img => {
        const exists = existsSync(img.filePath)
        if (!exists) console.log('File not found:', img.filePath)
        return exists
      })
      console.log('Returning', validImages.length, 'valid images')
      return validImages
    } catch (e) {
      console.error('Failed to parse index:', e)
      // Fall through to directory scan
    }
  } else {
    console.log('Index file does not exist')
  }

  // Fallback: scan directory for images
  try {
    console.log('Falling back to directory scan')
    const files = readdirSync(galleryDir)
    const images: GalleryImage[] = files
      .filter((file: string) => /\.(png|jpg|jpeg|gif|webp)$/i.test(file))
      .map((file: string) => {
        const filePath = join(galleryDir, file)
        return {
          id: `gallery_${file}`,
          fileName: file,
          filePath,
          source: 'unknown' as const,
          createdAt: new Date().toISOString()
        }
      })
    console.log('Found', images.length, 'images in directory')
    return images
  } catch (e) {
    console.error('Failed to read gallery:', e)
    return []
  }
})

// ============================================
// TTS - OPENAI
// ============================================

ipcMain.handle('generate-openai-tts', async (_event, text: string, voice: string, outputPath: string): Promise<{ success: boolean; data?: { audioPath: string; duration: number }; error?: string; cost?: number }> => {
  const apiKey = apiKeyStore.get('openai') as string
  if (!apiKey) {
    return { success: false, error: 'OpenAI API key not configured' }
  }

  try {
    const OpenAI = (await import('openai')).default
    const openai = new OpenAI({ apiKey })

    const response = await openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: voice as any,
      input: text,
      speed: 0.83  // Optimized for 150 WPM
    })

    const buffer = Buffer.from(await response.arrayBuffer())
    writeFileSync(outputPath, buffer)

    // Get duration using ffprobe
    const duration = await getAudioDuration(outputPath)

    // Cost: $15 per 1M characters
    const cost = (text.length / 1_000_000) * 15

    return {
      success: true,
      data: { audioPath: outputPath, duration },
      cost
    }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
})

// ============================================
// TTS - ELEVENLABS
// ============================================

ipcMain.handle('generate-elevenlabs-tts', async (_event, text: string, voiceId: string, outputPath: string): Promise<{ success: boolean; data?: { audioPath: string; duration: number }; error?: string; cost?: number }> => {
  const apiKey = apiKeyStore.get('elevenlabs') as string
  if (!apiKey) {
    return { success: false, error: 'ElevenLabs API key not configured' }
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            speed: 0.94
          }
        })
      }
    )

    if (!response.ok) {
      return { success: false, error: `ElevenLabs API error: ${response.status}` }
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    writeFileSync(outputPath, buffer)

    const duration = await getAudioDuration(outputPath)

    // Cost: $0.30 per 1K characters
    const cost = (text.length / 1000) * 0.30

    return {
      success: true,
      data: { audioPath: outputPath, duration },
      cost
    }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
})

// ============================================
// AUDIO UTILITIES
// ============================================

async function getAudioDuration(audioPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const ffprobe = require('ffprobe-static')
    const { spawn } = require('child_process')

    const proc = spawn(ffprobe.path, [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      audioPath
    ])

    let output = ''
    proc.stdout.on('data', (data: Buffer) => {
      output += data.toString()
    })

    proc.on('close', (code: number) => {
      if (code === 0) {
        resolve(parseFloat(output.trim()) || 0)
      } else {
        resolve(0)
      }
    })

    proc.on('error', () => resolve(0))
  })
}

// ============================================
// UNIFIED AUDIO GENERATION
// ============================================

interface AudioGenerationParams {
  projectId: string
  text: string
  provider: string
  voiceName: string
  slideNum: number
}

ipcMain.handle('generate-audio', async (_event, params: AudioGenerationParams): Promise<{ success: boolean; data?: { path: string; duration: number }; error?: string; cost?: number }> => {
  const { projectId, text, provider, voiceName, slideNum } = params

  if (!text || !text.trim()) {
    return { success: false, error: 'No text provided for audio generation' }
  }

  // Determine output path
  const projectDir = join(app.getPath('userData'), 'projects', projectId)
  const audioDir = join(projectDir, 'audio')
  mkdirSync(audioDir, { recursive: true })
  const outputPath = join(audioDir, `slide-${slideNum}.mp3`)

  try {
    if (provider === 'openai') {
      const apiKey = apiKeyStore.get('openai') as string
      if (!apiKey) {
        return { success: false, error: 'OpenAI API key not configured' }
      }

      const OpenAI = (await import('openai')).default
      const openai = new OpenAI({ apiKey })

      const response = await openai.audio.speech.create({
        model: 'tts-1-hd',
        voice: voiceName as any,
        input: text,
        speed: 0.83
      })

      const buffer = Buffer.from(await response.arrayBuffer())
      writeFileSync(outputPath, buffer)

      const duration = await getAudioDuration(outputPath)
      const cost = (text.length / 1_000_000) * 15

      return {
        success: true,
        data: { path: outputPath, duration },
        cost
      }
    } else if (provider === 'elevenlabs') {
      const apiKey = apiKeyStore.get('elevenlabs') as string
      if (!apiKey) {
        return { success: false, error: 'ElevenLabs API key not configured' }
      }

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceName}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': apiKey
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75
            }
          })
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        return { success: false, error: `ElevenLabs error: ${errorText}` }
      }

      const buffer = Buffer.from(await response.arrayBuffer())
      writeFileSync(outputPath, buffer)

      const duration = await getAudioDuration(outputPath)
      const cost = (text.length / 1000) * 0.30

      return {
        success: true,
        data: { path: outputPath, duration },
        cost
      }
    } else {
      return { success: false, error: `Unknown provider: ${provider}` }
    }
  } catch (e: any) {
    console.error('Audio generation error:', e)
    return { success: false, error: e.message }
  }
})

// ============================================
// VIDEO GENERATION (Simplified - takes projectId)
// ============================================

ipcMain.handle('generate-video', async (_event, projectId: string): Promise<{ success: boolean; data?: { path: string; duration: number }; error?: string }> => {
  try {
    console.log('=== generate-video called ===')
    console.log('Project ID:', projectId)

    // Load project
    const projectDir = join(app.getPath('userData'), 'projects', projectId)
    const projectPath = join(projectDir, 'project.json')

    if (!existsSync(projectPath)) {
      return { success: false, error: 'Project not found' }
    }

    const project: Project = JSON.parse(readFileSync(projectPath, 'utf-8'))
    console.log('Project loaded, slides:', project.slides.length)

    // Verify all slides have audio
    const slidesWithAudio = project.slides.filter(s => s.audioPath && existsSync(s.audioPath))
    if (slidesWithAudio.length !== project.slides.length) {
      return { success: false, error: `Only ${slidesWithAudio.length} of ${project.slides.length} slides have audio` }
    }

    const ffmpeg = require('fluent-ffmpeg')
    const ffmpegStatic = require('ffmpeg-static')
    const ffprobeStatic = require('ffprobe-static')

    ffmpeg.setFfmpegPath(ffmpegStatic)
    ffmpeg.setFfprobePath(ffprobeStatic.path)

    const tempDir = join(app.getPath('temp'), `video_${Date.now()}`)
    mkdirSync(tempDir, { recursive: true })

    const slideVideos: string[] = []
    const width = 1920
    const height = 1080

    // Create individual slide videos
    for (let i = 0; i < project.slides.length; i++) {
      const slide = project.slides[i]
      console.log(`Processing slide ${i + 1}/${project.slides.length}`)

      // Send progress
      mainWindow?.webContents.send('progress-update', {
        type: 'video',
        progress: (i / project.slides.length) * 80,
        message: `Processing slide ${i + 1} of ${project.slides.length}`,
        slideIndex: i
      })

      const slideVideoPath = join(tempDir, `slide_${i.toString().padStart(3, '0')}.mp4`)

      // Look for rendered PNG first (created by frontend)
      const renderedPngPath = join(projectDir, 'slides', `slide_${slide.slideNum.toString().padStart(3, '0')}.png`)

      let imageInput: string
      let inputOptions: string[] = ['-loop', '1']

      if (existsSync(renderedPngPath)) {
        imageInput = renderedPngPath
        console.log(`  Using rendered PNG: ${renderedPngPath}`)
      } else {
        // Fallback: Check for visual image
        const visualPath = slide.visualData?.imagePath
        if (visualPath && existsSync(visualPath)) {
          imageInput = visualPath
          console.log(`  Using visual image: ${visualPath}`)
        } else if (slide.backgroundType === 'image' && slide.backgroundImagePath && existsSync(slide.backgroundImagePath)) {
          imageInput = slide.backgroundImagePath
          console.log(`  Using background image: ${slide.backgroundImagePath}`)
        } else {
          // Create a solid color image using ffmpeg
          const bgColor = slide.backgroundColor || '#1a1a2e'
          imageInput = `color=c=${bgColor.replace('#', '')}:s=${width}x${height}:d=1`
          inputOptions = ['-f', 'lavfi']
          console.log(`  Using solid color: ${bgColor}`)
        }
      }

      const duration = slide.audioDuration || slide.duration || 5

      await new Promise<void>((resolve, reject) => {
        const cmd = ffmpeg()
          .input(imageInput)
          .inputOptions(inputOptions)
          .input(slide.audioPath!)
          .outputOptions([
            '-c:v', 'libx264',
            '-tune', 'stillimage',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-pix_fmt', 'yuv420p',
            '-shortest',
            '-t', duration.toString(),
            '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`
          ])
          .output(slideVideoPath)
          .on('end', () => {
            console.log(`  Slide ${i + 1} video created`)
            resolve()
          })
          .on('error', (err: Error) => {
            console.error(`  Error creating slide ${i + 1}:`, err)
            reject(err)
          })

        cmd.run()
      })

      slideVideos.push(slideVideoPath)
    }

    // Create concat list
    const concatListPath = join(tempDir, 'concat_list.txt')
    const concatList = slideVideos.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n')
    writeFileSync(concatListPath, concatList)
    console.log('Concat list created')

    // Final output path
    const outputPath = join(projectDir, 'video', `${project.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.mp4`)
    mkdirSync(join(projectDir, 'video'), { recursive: true })

    // Send progress
    mainWindow?.webContents.send('progress-update', {
      type: 'video',
      progress: 85,
      message: 'Assembling final video...'
    })

    // Concatenate videos
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
        .on('progress', (progress: any) => {
          mainWindow?.webContents.send('progress-update', {
            type: 'video',
            progress: 85 + (progress.percent || 0) * 0.15,
            message: 'Finalizing video...'
          })
        })
        .on('end', () => {
          console.log('Final video created:', outputPath)
          resolve()
        })
        .on('error', (err: Error) => {
          console.error('Error concatenating:', err)
          reject(err)
        })
        .run()
    })

    // Calculate total duration
    const totalDuration = project.slides.reduce((sum, s) => sum + (s.audioDuration || s.duration || 5), 0)

    // Update project with video path
    project.videoPath = outputPath
    project.status = 'complete'
    writeFileSync(projectPath, JSON.stringify(project, null, 2))

    // Clean up temp files
    try {
      rmSync(tempDir, { recursive: true })
    } catch (e) {
      console.warn('Could not clean temp dir:', e)
    }

    mainWindow?.webContents.send('progress-update', {
      type: 'video',
      progress: 100,
      message: 'Complete!'
    })

    return {
      success: true,
      data: { path: outputPath, duration: totalDuration }
    }
  } catch (e: any) {
    console.error('Video generation error:', e)
    return { success: false, error: e.message }
  }
})

// ============================================
// VIDEO ASSEMBLY (FFmpeg) - Legacy
// ============================================

ipcMain.handle('assemble-video', async (event, slides: SlideVideo[], outputPath: string, options: VideoOptions): Promise<{ success: boolean; data?: string; error?: string }> => {
  try {
    const ffmpeg = require('fluent-ffmpeg')
    const ffmpegStatic = require('ffmpeg-static')
    const ffprobeStatic = require('ffprobe-static')

    ffmpeg.setFfmpegPath(ffmpegStatic)
    ffmpeg.setFfprobePath(ffprobeStatic.path)

    const tempDir = join(app.getPath('temp'), `video_${Date.now()}`)
    mkdirSync(tempDir, { recursive: true })

    const slideVideos: string[] = []

    // Create individual slide videos
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i]
      const slideVideoPath = join(tempDir, `slide_${i.toString().padStart(2, '0')}.mp4`)

      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(slide.pngPath)
          .inputOptions(['-loop', '1'])
          .input(slide.mp3Path)
          .outputOptions([
            '-c:v', 'libx264',
            '-tune', 'stillimage',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-pix_fmt', 'yuv420p',
            '-shortest',
            '-t', slide.duration.toString(),
            '-vf', `scale=${options.resolution.width}:${options.resolution.height}`
          ])
          .output(slideVideoPath)
          .on('end', () => resolve())
          .on('error', reject)
          .run()
      })

      slideVideos.push(slideVideoPath)

      // Send progress update
      mainWindow?.webContents.send('progress-update', {
        phase: 'video',
        step: 'Creating slide videos',
        progress: ((i + 1) / slides.length) * 50,
        message: `Processing slide ${i + 1} of ${slides.length}`,
        currentItem: i + 1,
        totalItems: slides.length
      })
    }

    // Create concat list
    const concatListPath = join(tempDir, 'concat_list.txt')
    const concatList = slideVideos.map(p => `file '${p}'`).join('\n')
    writeFileSync(concatListPath, concatList)

    // Concatenate videos
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
        .on('progress', (progress: any) => {
          mainWindow?.webContents.send('progress-update', {
            phase: 'video',
            step: 'Assembling final video',
            progress: 50 + (progress.percent || 0) * 0.5,
            message: 'Concatenating slides...',
            currentItem: null,
            totalItems: null
          })
        })
        .on('end', () => resolve())
        .on('error', reject)
        .run()
    })

    // Cleanup temp files
    rmSync(tempDir, { recursive: true })

    return { success: true, data: outputPath }
  } catch (e: any) {
    console.error('Video assembly error:', e)
    return { success: false, error: e.message }
  }
})

// ============================================
// SLIDE RENDERING
// ============================================

ipcMain.handle('save-slide-png', async (_event, projectId: string, slideNum: number, dataUrl: string): Promise<{ success: boolean; data?: string; error?: string }> => {
  try {
    const projectDir = join(app.getPath('userData'), 'projects', projectId)
    const slidesDir = join(projectDir, 'slides')
    mkdirSync(slidesDir, { recursive: true })

    const pngPath = join(slidesDir, `slide_${slideNum.toString().padStart(3, '0')}.png`)

    // Convert data URL to buffer and save
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    writeFileSync(pngPath, buffer)

    console.log(`Saved slide ${slideNum} PNG to:`, pngPath)
    return { success: true, data: pngPath }
  } catch (e: any) {
    console.error('Error saving slide PNG:', e)
    return { success: false, error: e.message }
  }
})

// ============================================
// FILE DIALOGS
// ============================================

ipcMain.handle('select-documents', async (): Promise<{ success: boolean; data?: Array<{ fileName: string; content: string; mimeType: string }>; error?: string }> => {
  if (!mainWindow) return { success: false, error: 'No window' }

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Documents', extensions: ['txt', 'md', 'pdf', 'docx'] }]
  })

  if (result.canceled) {
    return { success: true, data: [] }
  }

  const documents: Array<{ fileName: string; content: string; mimeType: string }> = []

  for (const filePath of result.filePaths) {
    const ext = filePath.split('.').pop()?.toLowerCase()
    const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'document'
    let content = ''

    try {
      if (ext === 'txt' || ext === 'md') {
        content = readFileSync(filePath, 'utf-8')
      } else if (ext === 'pdf') {
        const pdfParse = require('pdf-parse')
        const dataBuffer = readFileSync(filePath)
        const pdfData = await pdfParse(dataBuffer)
        content = pdfData.text
      } else if (ext === 'docx') {
        const mammoth = require('mammoth')
        const docResult = await mammoth.extractRawText({ path: filePath })
        content = docResult.value
      }

      documents.push({
        fileName,
        content,
        mimeType: ext === 'pdf' ? 'application/pdf' :
                  ext === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                  'text/plain'
      })
    } catch (e) {
      console.error(`Failed to parse ${fileName}:`, e)
    }
  }

  return { success: true, data: documents }
})

ipcMain.handle('select-output-folder', async (): Promise<string | null> => {
  if (!mainWindow) return null

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Output Folder'
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return result.filePaths[0]
})

ipcMain.handle('select-image', async (): Promise<{ success: boolean; data?: string; error?: string }> => {
  if (!mainWindow) return { success: false, error: 'No window' }

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
    ],
    title: 'Select Image'
  })

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false }
  }

  const imagePath = result.filePaths[0]

  // Save to gallery
  await saveToGallery(imagePath, 'upload')

  return { success: true, data: imagePath }
})

ipcMain.handle('show-in-folder', async (_event, filePath: string): Promise<void> => {
  shell.showItemInFolder(filePath)
})

// ============================================
// TEMPLATE
// ============================================

ipcMain.handle('get-template-params', async (): Promise<TemplateParams> => {
  const templatePath = join(__dirname, '..', 'templates', 'template-params.json')

  if (existsSync(templatePath)) {
    return JSON.parse(readFileSync(templatePath, 'utf-8'))
  }

  // Default template params
  return {
    brand: {
      logoPath: '',
      companyName: 'Corndel',
      logoDimensions: '150x40'
    },
    colors: {
      primary: '#2C2C2C',
      secondary: '#6B2D7B',
      accent: '#0066B3',
      background: '#FFFFFF',
      text: '#2C2C2C'
    },
    typography: {
      fontPrimary: 'Inter',
      fontSizeTitle: 72,
      fontSizeSubtitle: 48,
      fontSizeBody: 32,
      fontSizeBullet: 28
    }
  }
})

// ============================================
// APP LIFECYCLE
// ============================================

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
