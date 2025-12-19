import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useProjectStore } from './projectStore'
import type { Slide, SlideElement, VisualData, VisualType, LayoutType } from '@shared/types'

export const useSlidesStore = defineStore('slides', () => {
  const projectStore = useProjectStore()

  // State
  const activeSlideIndex = ref(0)
  const loading = ref(false)
  const selectedElementId = ref<string | null>(null)

  // Computed
  const slides = computed(() => projectStore.project?.slides || [])

  const activeSlide = computed(() => slides.value[activeSlideIndex.value] || null)

  const completedCount = computed(() =>
    slides.value.filter(s => s.status === 'complete').length
  )

  const allComplete = computed(() =>
    slides.value.length > 0 && slides.value.every(s => s.status === 'complete')
  )

  const selectedElement = computed(() => {
    if (!activeSlide.value || !selectedElementId.value) return null
    return activeSlide.value.elements.find(e => e.id === selectedElementId.value) || null
  })

  // Actions
  function setActiveSlide(index: number): void {
    if (index >= 0 && index < slides.value.length) {
      activeSlideIndex.value = index
      selectedElementId.value = null
    }
  }

  function nextSlide(): void {
    if (activeSlideIndex.value < slides.value.length - 1) {
      activeSlideIndex.value++
      selectedElementId.value = null
    }
  }

  function prevSlide(): void {
    if (activeSlideIndex.value > 0) {
      activeSlideIndex.value--
      selectedElementId.value = null
    }
  }

  function selectElement(elementId: string | null): void {
    selectedElementId.value = elementId
  }

  function updateText(updates: {
    headline?: string | null
    subheadline?: string | null
    bodyText?: string | null
    bullets?: string[] | null
  }): void {
    if (!activeSlide.value) return

    projectStore.updateSlide(activeSlide.value.slideNum, updates)

    // Helper to check if content is empty
    const isEmpty = (val: string | null | undefined) => !val || val.trim() === ''

    // Update, create, or remove elements based on content
    if (updates.headline !== undefined) {
      const headlineEl = activeSlide.value.elements.find(e => e.type === 'headline')
      if (isEmpty(updates.headline)) {
        // Remove element if content is empty
        if (headlineEl) {
          projectStore.removeSlideElement(activeSlide.value.slideNum, headlineEl.id)
        }
      } else if (headlineEl) {
        // Update existing element
        projectStore.updateSlideElement(activeSlide.value.slideNum, {
          ...headlineEl,
          content: updates.headline
        })
      } else {
        // Create new headline element
        const newEl = {
          id: `headline_${activeSlide.value.slideNum}_${Date.now()}`,
          type: 'headline' as const,
          x: 5,
          y: 5,
          width: 45,
          height: 15,
          zIndex: 10,
          content: updates.headline,
          imagePath: null,
          styles: { fontSize: 48, fontWeight: 'bold', color: '#1f2937', textAlign: 'left' as const }
        }
        activeSlide.value.elements.push(newEl)
      }
    }

    if (updates.subheadline !== undefined) {
      const subheadlineEl = activeSlide.value.elements.find(e => e.type === 'subheadline')
      if (isEmpty(updates.subheadline)) {
        // Remove element if content is empty
        if (subheadlineEl) {
          projectStore.removeSlideElement(activeSlide.value.slideNum, subheadlineEl.id)
        }
      } else if (subheadlineEl) {
        // Update existing element
        projectStore.updateSlideElement(activeSlide.value.slideNum, {
          ...subheadlineEl,
          content: updates.subheadline
        })
      } else {
        // Create new subheadline element
        const newEl = {
          id: `subheadline_${activeSlide.value.slideNum}_${Date.now()}`,
          type: 'subheadline' as const,
          x: 5,
          y: 20,
          width: 45,
          height: 10,
          zIndex: 9,
          content: updates.subheadline,
          imagePath: null,
          styles: { fontSize: 32, fontWeight: 'normal', color: '#4b5563', textAlign: 'left' as const }
        }
        activeSlide.value.elements.push(newEl)
      }
    }

    if (updates.bodyText !== undefined) {
      const bodyEl = activeSlide.value.elements.find(e => e.type === 'body')
      if (isEmpty(updates.bodyText)) {
        // Remove element if content is empty
        if (bodyEl) {
          projectStore.removeSlideElement(activeSlide.value.slideNum, bodyEl.id)
        }
      } else if (bodyEl) {
        // Update existing element
        projectStore.updateSlideElement(activeSlide.value.slideNum, {
          ...bodyEl,
          content: updates.bodyText
        })
      } else {
        // Create new body element
        const newEl = {
          id: `body_${activeSlide.value.slideNum}_${Date.now()}`,
          type: 'body' as const,
          x: 5,
          y: 32,
          width: 45,
          height: 20,
          zIndex: 8,
          content: updates.bodyText,
          imagePath: null,
          styles: { fontSize: 24, fontWeight: 'normal', color: '#374151', textAlign: 'left' as const }
        }
        activeSlide.value.elements.push(newEl)
      }
    }

    if (updates.bullets !== undefined) {
      const bulletsEl = activeSlide.value.elements.find(e => e.type === 'bullets')
      const bulletsEmpty = !updates.bullets || updates.bullets.length === 0 || updates.bullets.every(b => !b.trim())
      if (bulletsEmpty) {
        // Remove element if content is empty
        if (bulletsEl) {
          projectStore.removeSlideElement(activeSlide.value.slideNum, bulletsEl.id)
        }
      } else if (bulletsEl) {
        // Update existing element
        projectStore.updateSlideElement(activeSlide.value.slideNum, {
          ...bulletsEl,
          content: updates.bullets?.join('\n') || null
        })
      } else {
        // Create new bullets element
        const newEl = {
          id: `bullets_${activeSlide.value.slideNum}_${Date.now()}`,
          type: 'bullets' as const,
          x: 5,
          y: 55,
          width: 45,
          height: 35,
          zIndex: 7,
          content: updates.bullets!.join('\n'),
          imagePath: null,
          styles: { fontSize: 22, fontWeight: 'normal', color: '#374151', textAlign: 'left' as const }
        }
        activeSlide.value.elements.push(newEl)
      }
    }
  }

  function updateNarration(narration: string): void {
    if (!activeSlide.value) return
    projectStore.updateSlide(activeSlide.value.slideNum, { narration })
  }

  function updateLayout(layout: LayoutType): void {
    if (!activeSlide.value) return
    projectStore.updateSlide(activeSlide.value.slideNum, { layout })
    // TODO: Reposition elements based on new layout
  }

  function updateElement(element: SlideElement): void {
    if (!activeSlide.value) return
    projectStore.updateSlideElement(activeSlide.value.slideNum, element)
  }

  function moveElement(elementId: string, x: number, y: number): void {
    if (!activeSlide.value) return

    const element = activeSlide.value.elements.find(e => e.id === elementId)
    if (element) {
      projectStore.updateSlideElement(activeSlide.value.slideNum, {
        ...element,
        x: Math.max(0, Math.min(100 - element.width, x)),
        y: Math.max(0, Math.min(100 - element.height, y))
      })
    }
  }

  function resizeElement(elementId: string, width: number, height: number): void {
    if (!activeSlide.value) return

    const element = activeSlide.value.elements.find(e => e.id === elementId)
    if (element) {
      projectStore.updateSlideElement(activeSlide.value.slideNum, {
        ...element,
        width: Math.max(10, Math.min(100 - element.x, width)),
        height: Math.max(5, Math.min(100 - element.y, height))
      })
    }
  }

  function setVisualType(type: VisualType): void {
    if (!activeSlide.value) return
    projectStore.updateSlide(activeSlide.value.slideNum, { visualType: type })
  }

  function setVisualData(visualData: VisualData & { metadata?: { objectFit?: string; objectPosition?: string } }): void {
    if (!activeSlide.value) return

    console.log('setVisualData called:', visualData)

    projectStore.updateSlide(activeSlide.value.slideNum, {
      visualData,
      visualType: visualData.type
    })

    // Update image element or create one if it doesn't exist
    let imageEl = activeSlide.value.elements.find(e => e.type === 'image')

    // Extract image fit settings from metadata
    const objectFit = (visualData.metadata?.objectFit || 'cover') as 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
    const objectPosition = visualData.metadata?.objectPosition || 'center'

    if (visualData.imagePath) {
      if (imageEl) {
        // Update existing image element with new styles
        projectStore.updateSlideElement(activeSlide.value.slideNum, {
          ...imageEl,
          imagePath: visualData.imagePath,
          styles: {
            ...imageEl.styles,
            objectFit,
            objectPosition
          }
        })
        console.log('Updated existing image element with styles:', { objectFit, objectPosition })
      } else {
        // Create a new image element
        const newImageEl = {
          id: `image_${activeSlide.value.slideNum}_${Date.now()}`,
          type: 'image' as const,
          x: 50,
          y: 10,
          width: 45,
          height: 80,
          zIndex: 5,
          content: null,
          imagePath: visualData.imagePath,
          styles: {
            borderRadius: 12,
            objectFit,
            objectPosition
          }
        }
        activeSlide.value.elements.push(newImageEl)
        console.log('Created new image element:', newImageEl)
      }
    } else if (imageEl && visualData.metadata) {
      // Update just the styles if no new image but metadata changed
      projectStore.updateSlideElement(activeSlide.value.slideNum, {
        ...imageEl,
        styles: {
          ...imageEl.styles,
          objectFit,
          objectPosition
        }
      })
      console.log('Updated image element styles:', { objectFit, objectPosition })
    }
  }

  function setBackground(
    type: 'solid' | 'gradient' | 'image',
    value: string,
    options?: { size?: string; position?: string }
  ): void {
    if (!activeSlide.value) return

    const updates: Partial<Slide> = { backgroundType: type }

    if (type === 'solid') {
      updates.backgroundColor = value
      updates.backgroundGradient = null
      updates.backgroundImagePath = null
      updates.backgroundSize = null
      updates.backgroundPosition = null
    } else if (type === 'gradient') {
      updates.backgroundColor = null
      updates.backgroundGradient = value
      updates.backgroundImagePath = null
      updates.backgroundSize = null
      updates.backgroundPosition = null
    } else if (type === 'image') {
      updates.backgroundColor = null
      updates.backgroundGradient = null
      updates.backgroundImagePath = value
      updates.backgroundSize = options?.size || 'cover'
      updates.backgroundPosition = options?.position || 'center'
    }

    projectStore.updateSlide(activeSlide.value.slideNum, updates)
  }

  function markComplete(): void {
    if (!activeSlide.value) return
    projectStore.updateSlide(activeSlide.value.slideNum, { status: 'complete' })
  }

  function markPending(): void {
    if (!activeSlide.value) return
    projectStore.updateSlide(activeSlide.value.slideNum, { status: 'pending' })
  }

  async function saveAndNext(): Promise<void> {
    markComplete()
    await projectStore.saveProject()

    if (activeSlideIndex.value < slides.value.length - 1) {
      nextSlide()
    }
  }

  return {
    // State
    activeSlideIndex,
    loading,
    selectedElementId,

    // Computed
    slides,
    activeSlide,
    completedCount,
    allComplete,
    selectedElement,

    // Actions
    setActiveSlide,
    nextSlide,
    prevSlide,
    selectElement,
    updateText,
    updateNarration,
    updateLayout,
    updateElement,
    moveElement,
    resizeElement,
    setVisualType,
    setVisualData,
    setBackground,
    markComplete,
    markPending,
    saveAndNext
  }
})
