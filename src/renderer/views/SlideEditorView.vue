<template>
  <div class="flex-1 flex h-full">
    <!-- Left sidebar: Slide navigation -->
    <div class="w-48 bg-gray-100 border-r border-gray-200 p-3 overflow-y-auto flex flex-col">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-medium text-gray-700">Slides</h3>
        <span class="text-xs text-gray-500">{{ slidesStore.completedCount }}/{{ slidesStore.slides.length }}</span>
      </div>

      <div class="space-y-2 flex-1">
        <div
          v-for="(slide, index) in slidesStore.slides"
          :key="slide.id"
          @click="slidesStore.setActiveSlide(index)"
          class="relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all"
          :class="index === slidesStore.activeSlideIndex
            ? 'border-primary-500 shadow-md'
            : 'border-transparent hover:border-gray-300'"
        >
          <!-- Mini preview -->
          <div class="aspect-video bg-white relative overflow-hidden">
            <!-- Background -->
            <div
              class="absolute inset-0"
              :style="getSlideBackgroundStyle(slide)"
            ></div>
            <!-- Render elements based on actual positions -->
            <div
              v-for="element in slide.elements"
              :key="element.id"
              class="absolute overflow-hidden"
              :style="getThumbnailElementStyle(element)"
            >
              <!-- Text elements -->
              <div v-if="element.type === 'headline'" class="text-[6px] font-bold text-gray-800 leading-tight line-clamp-2">
                {{ element.content }}
              </div>
              <div v-else-if="element.type === 'subheadline'" class="text-[5px] font-medium text-gray-600 leading-tight line-clamp-2">
                {{ element.content }}
              </div>
              <div v-else-if="element.type === 'body'" class="text-[4px] text-gray-600 leading-tight line-clamp-3">
                {{ element.content }}
              </div>
              <div v-else-if="element.type === 'bullets'" class="text-[4px] text-gray-600 leading-tight">
                <div v-for="(bullet, bi) in (element.content || '').split('\n').slice(0, 3)" :key="bi" class="truncate">
                  • {{ bullet }}
                </div>
              </div>
              <!-- Image element -->
              <img
                v-else-if="element.type === 'image' && element.imagePath"
                :src="encodeFilePath(element.imagePath)"
                class="w-full h-full"
                :style="getThumbnailImageStyle(element)"
                alt=""
              />
            </div>
            <!-- Status indicator -->
            <div
              class="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full"
              :class="slide.status === 'complete' ? 'bg-green-500' : 'bg-gray-300'"
            ></div>
          </div>
          <div class="text-xs text-center py-1 bg-gray-50">{{ index + 1 }}</div>
        </div>
      </div>

      <!-- Add/Delete Slide Buttons -->
      <div class="mt-3 pt-3 border-t border-gray-200 space-y-2">
        <button
          @click="addNewSlide"
          class="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Slide
        </button>
        <button
          v-if="slidesStore.slides.length > 1"
          @click="deleteCurrentSlide"
          class="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete Slide
        </button>
      </div>
    </div>

    <!-- Main canvas area -->
    <div class="flex-1 flex flex-col bg-gray-200">
      <!-- Toolbar -->
      <div class="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <button
            @click="slidesStore.prevSlide"
            :disabled="slidesStore.activeSlideIndex === 0"
            class="btn-icon"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span class="text-sm text-gray-600">
            Slide {{ slidesStore.activeSlideIndex + 1 }} of {{ slidesStore.slides.length }}
          </span>
          <button
            @click="slidesStore.nextSlide"
            :disabled="slidesStore.activeSlideIndex === slidesStore.slides.length - 1"
            class="btn-icon"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div class="flex items-center gap-2">
          <button
            v-if="slidesStore.activeSlide?.status !== 'complete'"
            @click="slidesStore.markComplete"
            class="btn-secondary text-sm py-1"
          >
            Mark Complete
          </button>
          <button
            v-else
            @click="slidesStore.markPending"
            class="btn-secondary text-sm py-1"
          >
            Mark Incomplete
          </button>
          <button @click="saveSlide" class="btn-primary text-sm py-1" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>

      <!-- Canvas -->
      <div class="flex-1 p-6 flex items-center justify-center overflow-auto">
        <SlideCanvas
          v-if="slidesStore.activeSlide"
          :slide="slidesStore.activeSlide"
          :preview-time="animationPreviewTime"
          :show-animations="showAnimations"
          @select-element="slidesStore.selectElement"
          @move-element="handleMoveElement"
          @resize-element="handleResizeElement"
        />
      </div>
    </div>

    <!-- Right sidebar: Property panels -->
    <div class="w-80 bg-white border-l border-gray-200 flex flex-col">
      <!-- Panel Tabs -->
      <div class="flex border-b border-gray-200 bg-gray-50">
        <button
          v-for="tab in panelTabs"
          :key="tab.value"
          @click="activePanel = tab.value"
          class="flex-1 px-2 py-2 text-xs font-medium transition-colors"
          :class="activePanel === tab.value
            ? 'text-primary-600 border-b-2 border-primary-500 bg-white'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Panel Content -->
      <div class="flex-1 overflow-y-auto p-4">
        <!-- Text Panel -->
        <TextPanel
          v-if="activePanel === 'text'"
          :slide="slidesStore.activeSlide"
          @update="handleTextUpdate"
        />

        <!-- Visual Panel -->
        <VisualPanel
          v-if="activePanel === 'visual'"
          :slide="slidesStore.activeSlide"
          @update-visual="handleVisualUpdate"
        />

        <!-- Background Panel -->
        <BackgroundPanel
          v-if="activePanel === 'background'"
          :slide="slidesStore.activeSlide"
          @update-background="handleBackgroundUpdate"
          @apply-to-all="handleBackgroundApplyToAll"
        />

        <!-- Narration Panel -->
        <NarrationPanel
          v-if="activePanel === 'narration'"
          :slide="slidesStore.activeSlide"
          @update-narration="handleNarrationUpdate"
        />

        <!-- Animation Panel -->
        <AnimationPanel
          v-if="activePanel === 'animation'"
          :slide="slidesStore.activeSlide"
          @update="handleAnimationSlideUpdate"
          @update-element="handleAnimationElementUpdate"
          @preview="handleAnimationPreview"
        />

        <!-- AI Panel -->
        <AIPanel
          v-if="activePanel === 'ai'"
          ref="aiPanelRef"
          :slide="slidesStore.activeSlide"
          @regenerate="handleRegenerate"
        />
      </div>
    </div>

    <!-- Bottom action bar -->
    <div class="absolute bottom-0 left-48 right-80 bg-white border-t border-gray-200 p-3 flex items-center justify-between">
      <router-link
        :to="`/project/${projectStore.project?.id}/plan`"
        class="btn-secondary text-sm"
      >
        Back to Plan
      </router-link>
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-500">
          {{ slidesStore.completedCount }} of {{ slidesStore.slides.length }} slides complete
        </span>
        <button
          @click="proceedToAudio"
          :disabled="!slidesStore.allComplete"
          class="btn-primary"
        >
          Generate Audio
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '../stores/projectStore'
import { useSlidesStore } from '../stores/slidesStore'
import SlideCanvas from '../components/SlideCanvas.vue'
import TextPanel from '../components/panels/TextPanel.vue'
import VisualPanel from '../components/panels/VisualPanel.vue'
import BackgroundPanel from '../components/panels/BackgroundPanel.vue'
import NarrationPanel from '../components/panels/NarrationPanel.vue'
import AIPanel from '../components/panels/AIPanel.vue'
import AnimationPanel from '../components/panels/AnimationPanel.vue'
import type { Slide, SlideElement, VisualData, ElementAnimation } from '@shared/types'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const slidesStore = useSlidesStore()

const activePanel = ref<'text' | 'visual' | 'background' | 'narration' | 'animation' | 'ai'>('text')
const saving = ref(false)
const aiPanelRef = ref<InstanceType<typeof AIPanel> | null>(null)

// Animation preview state
const animationPreviewTime = ref<number | null>(null)
const showAnimations = ref(false)

const panelTabs = [
  { value: 'text' as const, label: 'Text' },
  { value: 'visual' as const, label: 'Visual' },
  { value: 'background' as const, label: 'BG' },
  { value: 'narration' as const, label: 'Narration' },
  { value: 'animation' as const, label: 'Animate' },
  { value: 'ai' as const, label: 'AI' }
]

onMounted(async () => {
  const projectId = route.params.id as string
  if (!projectStore.project || projectStore.project.id !== projectId) {
    await projectStore.loadProject(projectId)
  }
})

// Encode file path for use in file:// URLs (handles spaces and special chars)
function encodeFilePath(path: string): string {
  const normalizedPath = path.replace(/\\/g, '/')
  const encoded = normalizedPath.split('/').map(part => encodeURIComponent(part)).join('/')
  return `file://${encoded}`
}

function getSlideBackgroundStyle(slide: Slide): Record<string, string> {
  if (slide.backgroundType === 'gradient' && slide.backgroundGradient) {
    return { background: slide.backgroundGradient }
  } else if (slide.backgroundType === 'image' && slide.backgroundImagePath) {
    return {
      backgroundImage: `url(${encodeFilePath(slide.backgroundImagePath)})`,
      backgroundSize: 'cover',  // Always use cover for thumbnails
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }
  } else {
    return { backgroundColor: slide.backgroundColor || '#ffffff' }
  }
}

function getThumbnailElementStyle(element: SlideElement): Record<string, string> {
  return {
    left: `${element.x}%`,
    top: `${element.y}%`,
    width: `${element.width}%`,
    height: `${element.height}%`,
    color: element.color || '#1f2937'
  }
}

function getThumbnailImageStyle(element: SlideElement): Record<string, string> {
  const styles = element.styles || {}
  return {
    objectFit: (styles.objectFit as string) || 'cover',
    objectPosition: (styles.objectPosition as string) || 'center'
  }
}

function handleMoveElement(elementId: string, x: number, y: number) {
  slidesStore.moveElement(elementId, x, y)
}

function handleResizeElement(elementId: string, width: number, height: number) {
  slidesStore.resizeElement(elementId, width, height)
}

function handleTextUpdate(updates: { headline?: string | null; subheadline?: string | null; bodyText?: string | null; bullets?: string[] | null }) {
  slidesStore.updateText(updates)
}

function handleVisualUpdate(visualData: VisualData) {
  slidesStore.setVisualData(visualData)
}

function handleBackgroundUpdate(type: 'solid' | 'gradient' | 'image', value: string, options?: { size?: string; position?: string }) {
  slidesStore.setBackground(type, value, options)
}

function handleBackgroundApplyToAll(type: 'solid' | 'gradient' | 'image', value: string, options?: { size?: string; position?: string }) {
  // Apply background to all slides
  const slides = slidesStore.slides
  for (const slide of slides) {
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

    projectStore.updateSlide(slide.slideNum, updates)
  }
}

function handleNarrationUpdate(narration: string) {
  slidesStore.updateNarration(narration)
}

function handleAnimationSlideUpdate(updates: Partial<Slide>) {
  slidesStore.updateSlideProperties(updates)
}

function handleAnimationElementUpdate(elementId: string, animation: ElementAnimation | null) {
  slidesStore.updateElementAnimation(elementId, animation)
}

function handleAnimationPreview(time: number | null) {
  animationPreviewTime.value = time
  showAnimations.value = time !== null
}

async function handleRegenerate(params: {
  customInstructions: string
  regenerate: {
    layout: boolean
    headline: boolean
    subheadline: boolean
    bodyText: boolean
    bullets: boolean
    visualSuggestions: boolean
    narration: boolean
  }
  preserve: {
    visual: boolean
    audio: boolean
    positions: boolean
    background: boolean
  }
}) {
  if (!projectStore.project || !slidesStore.activeSlide) return

  aiPanelRef.value?.setRegenerating(true)
  aiPanelRef.value?.setError(null)

  try {
    const result = await projectStore.regenerateSlide(
      slidesStore.activeSlide.slideNum,
      params.customInstructions,
      params.regenerate,
      params.preserve
    )

    if (!result.success) {
      aiPanelRef.value?.setError(result.error || 'Regeneration failed')
    }
  } catch (error: any) {
    aiPanelRef.value?.setError(error.message || 'Regeneration failed')
  } finally {
    aiPanelRef.value?.setRegenerating(false)
  }
}

async function saveSlide() {
  saving.value = true
  await projectStore.saveProject()
  saving.value = false
}

function addNewSlide() {
  const newSlide = projectStore.addBlankSlide(slidesStore.activeSlideIndex)
  if (newSlide) {
    // Select the new slide
    slidesStore.setActiveSlide(slidesStore.activeSlideIndex + 1)
  }
}

function deleteCurrentSlide() {
  if (!slidesStore.activeSlide || slidesStore.slides.length <= 1) return

  if (confirm('Are you sure you want to delete this slide?')) {
    const currentIndex = slidesStore.activeSlideIndex
    const deleted = projectStore.deleteSlide(slidesStore.activeSlide.slideNum)

    if (deleted) {
      // Select previous slide or first slide
      const newIndex = Math.max(0, currentIndex - 1)
      slidesStore.setActiveSlide(newIndex)
    }
  }
}

function proceedToAudio() {
  if (projectStore.project && slidesStore.allComplete) {
    router.push(`/project/${projectStore.project.id}/audio`)
  }
}
</script>
