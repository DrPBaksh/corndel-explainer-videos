import { defineStore } from 'pinia'
import { ref, computed, toRaw } from 'vue'
import type {
  Project,
  ProjectConfig,
  Slide,
  SlideStrategy,
  SlideElement,
  LayoutType,
  AnimationPlan,
  AnimationType,
  EasingType
} from '@shared/types'

export const useProjectStore = defineStore('project', () => {
  // State
  const project = ref<Project | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const currentPhase = computed(() => project.value?.status || 'setup')
  const isComplete = computed(() => project.value?.status === 'complete')
  const hasStrategy = computed(() => !!project.value?.contentStrategy)
  const slideCount = computed(() => project.value?.slides.length || 0)

  // Actions
  async function createProject(config: ProjectConfig): Promise<boolean> {
    loading.value = true
    error.value = null

    // Convert reactive proxy to plain object for IPC
    const plainConfig = JSON.parse(JSON.stringify(toRaw(config)))
    console.log('projectStore.createProject called with:', plainConfig)

    try {
      const result = await window.electronAPI.createProject(plainConfig)
      console.log('createProject result:', result)
      if (result.success && result.data) {
        project.value = result.data
        return true
      } else {
        error.value = result.error || 'Failed to create project'
        console.error('createProject failed:', error.value)
        return false
      }
    } catch (e: any) {
      console.error('createProject exception:', e)
      error.value = e.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function loadProject(projectId: string): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const result = await window.electronAPI.loadProject(projectId)
      if (result.success && result.data) {
        project.value = result.data
        return true
      } else {
        error.value = result.error || 'Failed to load project'
        return false
      }
    } catch (e: any) {
      error.value = e.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function saveProject(): Promise<boolean> {
    if (!project.value) return false

    try {
      // Convert reactive proxy to plain object for IPC
      const plainProject = JSON.parse(JSON.stringify(toRaw(project.value)))
      return await window.electronAPI.saveProject(plainProject)
    } catch (e: any) {
      error.value = e.message
      return false
    }
  }

  async function generateContentStrategy(): Promise<boolean> {
    if (!project.value) return false

    loading.value = true
    error.value = null
    project.value.status = 'planning'

    try {
      // Convert reactive proxy to plain object for IPC
      const plainConfig = JSON.parse(JSON.stringify(toRaw(project.value.config)))
      const result = await window.electronAPI.generateContentStrategy(plainConfig)

      if (result.success && result.data) {
        project.value.contentStrategy = result.data
        project.value.totalCost += result.cost || 0
        project.value.costBreakdown.contentGeneration = result.cost || 0

        // Initialize slides from strategy
        project.value.slides = result.data.slides.map(createSlideFromStrategy)
        project.value.status = 'editing'

        await saveProject()
        return true
      } else {
        error.value = result.error || 'Failed to generate content strategy'
        project.value.status = 'setup'
        return false
      }
    } catch (e: any) {
      error.value = e.message
      project.value.status = 'setup'
      return false
    } finally {
      loading.value = false
    }
  }

  function createSlideFromStrategy(strategy: SlideStrategy): Slide {
    const elements = createDefaultElements(strategy)

    // Apply animation plan from AI if present
    if (strategy.animationPlan) {
      applyAnimationPlanToElements(elements, strategy.animationPlan, strategy.duration)
    }

    return {
      id: `slide_${strategy.slideNum}`,
      slideNum: strategy.slideNum,
      status: 'pending',
      headline: strategy.headline,
      subheadline: strategy.subheadline,
      bodyText: strategy.bodyText,
      bullets: strategy.bullets,
      visualType: strategy.visualType,
      visualData: null,
      pexelsKeywords: strategy.pexelsKeywords,
      geminiPrompt: strategy.geminiPrompt,
      diagramDescription: strategy.diagramDescription,
      layout: strategy.layout,
      elements,
      backgroundType: 'solid',
      backgroundColor: '#ffffff',
      backgroundGradient: null,
      backgroundImagePath: null,
      backgroundSize: null,
      backgroundPosition: null,
      narration: strategy.narration,
      duration: strategy.duration,
      pngPath: null,
      htmlPath: null,
      audioPath: null,
      audioDuration: null,
      audioDelay: 0.5,  // Default 0.5s delay to let animations complete before narration
      // Animation settings
      animationsEnabled: true,
      animationPlan: strategy.animationPlan,
      transition: strategy.animationPlan?.transition
    }
  }

  function applyAnimationPlanToElements(
    elements: SlideElement[],
    plan: AnimationPlan,
    slideDuration: number
  ): void {
    for (const animConfig of plan.elementAnimations) {
      // Find the element matching this animation config
      const element = elements.find(e => e.type === animConfig.elementType)
      if (element) {
        // Convert relative timing to absolute seconds
        const startTime = (animConfig.relativeStartPercent / 100) * slideDuration
        const duration = (animConfig.durationPercent / 100) * slideDuration

        element.animation = {
          id: `anim_${element.id}`,
          elementId: element.id,
          type: animConfig.animation as AnimationType,
          startTime,
          duration,
          easing: animConfig.easing as EasingType
        }
      }
    }
  }

  function createDefaultElements(strategy: SlideStrategy): SlideElement[] {
    const elements: SlideElement[] = []
    const layout = strategy.layout

    // Define positions based on layout
    let textX = 5, textY = 10, textWidth = 40
    let imageX = 50, imageY = 10, imageWidth = 45, imageHeight = 80

    if (layout === 'text-right-image-left') {
      textX = 55
      imageX = 5
    } else if (layout === 'center') {
      textX = 10
      textWidth = 80
    } else if (layout === 'text-top-image-bottom') {
      textX = 10
      textY = 5
      textWidth = 80
      imageX = 10
      imageY = 45
      imageWidth = 80
      imageHeight = 50
    } else if (layout === 'full-visual') {
      imageX = 5
      imageY = 5
      imageWidth = 90
      imageHeight = 90
    } else if (layout === 'split-50-50') {
      textWidth = 45
      imageWidth = 45
    }

    // Headline element
    if (strategy.headline) {
      elements.push({
        id: `headline_${strategy.slideNum}`,
        type: 'headline',
        x: textX,
        y: textY,
        width: textWidth,
        height: 18,
        zIndex: 10,
        content: strategy.headline,
        imagePath: null,
        styles: {
          fontSize: 48,
          fontWeight: 'bold',
          color: '#1f2937',
          textAlign: 'left'
        }
      })
    }

    // Subheadline element
    if (strategy.subheadline) {
      elements.push({
        id: `subheadline_${strategy.slideNum}`,
        type: 'subheadline',
        x: textX,
        y: textY + 18,
        width: textWidth,
        height: 12,
        zIndex: 9,
        content: strategy.subheadline,
        imagePath: null,
        styles: {
          fontSize: 32,
          fontWeight: 'normal',
          color: '#4b5563',
          textAlign: 'left'
        }
      })
    }

    // Body text element
    if (strategy.bodyText) {
      elements.push({
        id: `body_${strategy.slideNum}`,
        type: 'body',
        x: textX,
        y: textY + 30,
        width: textWidth,
        height: 25,
        zIndex: 8,
        content: strategy.bodyText,
        imagePath: null,
        styles: {
          fontSize: 24,
          fontWeight: 'normal',
          color: '#374151',
          textAlign: 'left'
        }
      })
    }

    // Bullets element
    if (strategy.bullets && strategy.bullets.length > 0) {
      elements.push({
        id: `bullets_${strategy.slideNum}`,
        type: 'bullets',
        x: textX,
        y: strategy.bodyText ? textY + 55 : textY + 30,
        width: textWidth,
        height: 40,
        zIndex: 7,
        content: strategy.bullets.join('\n'),
        imagePath: null,
        styles: {
          fontSize: 22,
          fontWeight: 'normal',
          color: '#374151',
          textAlign: 'left'
        }
      })
    }

    // Image placeholder
    if (strategy.visualType !== 'none' && layout !== 'center') {
      elements.push({
        id: `image_${strategy.slideNum}`,
        type: 'image',
        x: imageX,
        y: imageY,
        width: imageWidth,
        height: imageHeight,
        zIndex: 5,
        content: null,
        imagePath: null,
        styles: {
          borderRadius: 12
        }
      })
    }

    return elements
  }

  function updateSlide(slideNum: number, updates: Partial<Slide>): void {
    if (!project.value) return

    const slideIndex = project.value.slides.findIndex(s => s.slideNum === slideNum)
    if (slideIndex >= 0) {
      project.value.slides[slideIndex] = {
        ...project.value.slides[slideIndex],
        ...updates
      }
    }
  }

  function updateSlideElement(slideNum: number, element: SlideElement): void {
    if (!project.value) return

    const slideIndex = project.value.slides.findIndex(s => s.slideNum === slideNum)
    if (slideIndex >= 0) {
      const elementIndex = project.value.slides[slideIndex].elements.findIndex(
        e => e.id === element.id
      )
      if (elementIndex >= 0) {
        project.value.slides[slideIndex].elements[elementIndex] = element
      }
    }
  }

  function removeSlideElement(slideNum: number, elementId: string): void {
    if (!project.value) return

    const slideIndex = project.value.slides.findIndex(s => s.slideNum === slideNum)
    if (slideIndex >= 0) {
      const elementIndex = project.value.slides[slideIndex].elements.findIndex(
        e => e.id === elementId
      )
      if (elementIndex >= 0) {
        project.value.slides[slideIndex].elements.splice(elementIndex, 1)
      }
    }
  }

  function setStatus(status: Project['status']): void {
    if (project.value) {
      project.value.status = status
      saveProject()
    }
  }

  function addCost(category: keyof Project['costBreakdown'], amount: number): void {
    if (project.value) {
      project.value.costBreakdown[category] += amount
      project.value.costBreakdown.total += amount
      project.value.totalCost += amount
    }
  }

  function clearProject(): void {
    project.value = null
    error.value = null
  }

  function addBlankSlide(afterIndex?: number): Slide | null {
    if (!project.value) return null

    const slides = project.value.slides
    const insertIndex = afterIndex !== undefined ? afterIndex + 1 : slides.length
    const newSlideNum = slides.length // Will be renumbered

    // Create blank slide
    const blankSlide: Slide = {
      id: `slide_${Date.now()}`,
      slideNum: newSlideNum,
      status: 'pending',
      headline: 'New Slide',
      subheadline: null,
      bodyText: null,
      bullets: null,
      visualType: 'none',
      visualData: null,
      pexelsKeywords: null,
      geminiPrompt: null,
      diagramDescription: null,
      layout: 'text-left-image-right',
      elements: [
        {
          id: `headline_${newSlideNum}_${Date.now()}`,
          type: 'headline',
          x: 5,
          y: 10,
          width: 40,
          height: 18,
          zIndex: 10,
          content: 'New Slide',
          imagePath: null,
          styles: {
            fontSize: 48,
            fontWeight: 'bold',
            color: '#1f2937',
            textAlign: 'left'
          }
        },
        {
          id: `image_${newSlideNum}_${Date.now()}`,
          type: 'image',
          x: 50,
          y: 10,
          width: 45,
          height: 80,
          zIndex: 5,
          content: null,
          imagePath: null,
          styles: {
            borderRadius: 12
          }
        }
      ],
      backgroundType: 'solid',
      backgroundColor: '#ffffff',
      backgroundGradient: null,
      backgroundImagePath: null,
      backgroundSize: null,
      backgroundPosition: null,
      narration: '',
      duration: null,
      pngPath: null,
      htmlPath: null,
      audioPath: null,
      audioDuration: null,
      audioDelay: 0.5,  // Default 0.5s delay to let animations complete before narration
      // Animation settings
      animationsEnabled: true
    }

    // Insert at position
    slides.splice(insertIndex, 0, blankSlide)

    // Renumber all slides
    slides.forEach((slide, index) => {
      slide.slideNum = index
    })

    // Save project
    saveProject()

    return blankSlide
  }

  function deleteSlide(slideNum: number): boolean {
    if (!project.value) return false

    const slides = project.value.slides
    if (slides.length <= 1) return false // Don't delete last slide

    const slideIndex = slides.findIndex(s => s.slideNum === slideNum)
    if (slideIndex < 0) return false

    // Remove slide
    slides.splice(slideIndex, 1)

    // Renumber all slides
    slides.forEach((slide, index) => {
      slide.slideNum = index
    })

    // Save project
    saveProject()

    return true
  }

  async function regenerateSlide(
    slideNum: number,
    customInstructions: string,
    regenerateFields: {
      layout: boolean
      headline: boolean
      subheadline: boolean
      bodyText: boolean
      bullets: boolean
      visualSuggestions: boolean
      narration: boolean
    },
    preserve: {
      visual: boolean
      audio: boolean
      positions: boolean
      background: boolean
    }
  ): Promise<{ success: boolean; error?: string }> {
    if (!project.value) return { success: false, error: 'No project loaded' }

    const slideIndex = project.value.slides.findIndex(s => s.slideNum === slideNum)
    if (slideIndex < 0) return { success: false, error: 'Slide not found' }

    const existingSlide = project.value.slides[slideIndex]

    try {
      const result = await window.electronAPI.regenerateSlide({
        projectId: project.value.id,
        slideNum,
        customInstructions,
        regenerateFields
      })

      if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Regeneration failed' }
      }

      const regenerated = result.data

      // Build updated slide by merging regenerated fields
      const updatedSlide: Slide = { ...existingSlide }

      // Apply regenerated fields
      if (regenerateFields.layout && regenerated.layout) {
        updatedSlide.layout = regenerated.layout as LayoutType
        // If not preserving positions, recreate elements based on new layout
        if (!preserve.positions) {
          const mockStrategy = {
            slideNum,
            headline: regenerated.headline ?? existingSlide.headline,
            subheadline: regenerated.subheadline ?? existingSlide.subheadline,
            bodyText: regenerated.bodyText ?? existingSlide.bodyText,
            bullets: regenerated.bullets ?? existingSlide.bullets,
            visualType: regenerated.visualType ?? existingSlide.visualType,
            layout: regenerated.layout as LayoutType,
            narration: regenerated.narration ?? existingSlide.narration
          } as SlideStrategy
          updatedSlide.elements = createDefaultElements(mockStrategy)
        }
      }

      if (regenerateFields.headline && regenerated.headline !== undefined) {
        updatedSlide.headline = regenerated.headline
        // Update headline element content
        const headlineEl = updatedSlide.elements.find(e => e.type === 'headline')
        if (headlineEl) {
          headlineEl.content = regenerated.headline
        }
      }

      if (regenerateFields.subheadline && regenerated.subheadline !== undefined) {
        updatedSlide.subheadline = regenerated.subheadline
        const subheadlineEl = updatedSlide.elements.find(e => e.type === 'subheadline')
        if (subheadlineEl) {
          subheadlineEl.content = regenerated.subheadline
        }
      }

      if (regenerateFields.bodyText && regenerated.bodyText !== undefined) {
        updatedSlide.bodyText = regenerated.bodyText
        const bodyEl = updatedSlide.elements.find(e => e.type === 'body')
        if (bodyEl) {
          bodyEl.content = regenerated.bodyText
        }
      }

      if (regenerateFields.bullets && regenerated.bullets !== undefined) {
        updatedSlide.bullets = regenerated.bullets
        const bulletsEl = updatedSlide.elements.find(e => e.type === 'bullets')
        if (bulletsEl) {
          bulletsEl.content = regenerated.bullets?.join('\n') || null
        }
      }

      if (regenerateFields.visualSuggestions) {
        if (regenerated.visualType) {
          updatedSlide.visualType = regenerated.visualType as any
        }
        // Store visual suggestions in slide (for reference)
        // Note: pexelsKeywords, geminiPrompt, diagramDescription are stored in strategy, not slide
        // We could add these to metadata if needed
      }

      if (regenerateFields.narration && regenerated.narration !== undefined) {
        updatedSlide.narration = regenerated.narration
      }

      // Handle preservation
      if (!preserve.visual) {
        updatedSlide.visualData = null
        const imageEl = updatedSlide.elements.find(e => e.type === 'image')
        if (imageEl) {
          imageEl.imagePath = null
        }
      }

      if (!preserve.audio) {
        updatedSlide.audioPath = null
        updatedSlide.audioDuration = null
      }

      if (!preserve.background) {
        updatedSlide.backgroundType = 'solid'
        updatedSlide.backgroundColor = '#ffffff'
        updatedSlide.backgroundGradient = null
        updatedSlide.backgroundImagePath = null
      }

      // Reset status to pending
      updatedSlide.status = 'pending'

      // Update the slide in the project
      project.value.slides[slideIndex] = updatedSlide

      // Track cost
      if (result.cost) {
        addCost('contentGeneration', result.cost)
      }

      // Save project
      await saveProject()

      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }

  return {
    // State
    project,
    loading,
    error,

    // Computed
    currentPhase,
    isComplete,
    hasStrategy,
    slideCount,

    // Actions
    createProject,
    loadProject,
    saveProject,
    generateContentStrategy,
    updateSlide,
    updateSlideElement,
    removeSlideElement,
    setStatus,
    addCost,
    clearProject,
    addBlankSlide,
    deleteSlide,
    regenerateSlide
  }
})
