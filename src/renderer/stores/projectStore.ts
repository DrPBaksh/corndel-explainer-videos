import { defineStore } from 'pinia'
import { ref, computed, toRaw } from 'vue'
import type {
  Project,
  ProjectConfig,
  ContentStrategy,
  Slide,
  SlideStrategy,
  SlideElement,
  LayoutType
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
      layout: strategy.layout,
      elements,
      backgroundType: 'solid',
      backgroundColor: '#ffffff',
      backgroundGradient: null,
      backgroundImagePath: null,
      backgroundSize: null,
      backgroundPosition: null,
      narration: strategy.narration,
      pngPath: null,
      htmlPath: null,
      audioPath: null,
      audioDuration: null
    }
  }

  function createDefaultElements(strategy: SlideStrategy): SlideElement[] {
    const elements: SlideElement[] = []
    const layout = strategy.layout

    // Define positions based on layout
    let textX = 5, textY = 10, textWidth = 40, textHeight = 80
    let imageX = 50, imageY = 10, imageWidth = 45, imageHeight = 80

    if (layout === 'text-right-image-left') {
      textX = 55
      imageX = 5
    } else if (layout === 'center') {
      textX = 10
      textWidth = 80
      textHeight = 90
    } else if (layout === 'text-top-image-bottom') {
      textX = 10
      textY = 5
      textWidth = 80
      textHeight = 35
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
        height: 15,
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
        y: textY + 15,
        width: textWidth,
        height: 10,
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
        y: textY + 28,
        width: textWidth,
        height: 20,
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
        y: strategy.bodyText ? textY + 50 : textY + 28,
        width: textWidth,
        height: 35,
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
    clearProject
  }
})
