<template>
  <div class="flex-1 flex h-full">
    <!-- Left sidebar: Slide navigation -->
    <div class="w-48 bg-gray-100 border-r border-gray-200 p-3 overflow-y-auto">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-medium text-gray-700">Slides</h3>
        <span class="text-xs text-gray-500">{{ slidesStore.completedCount }}/{{ slidesStore.slides.length }}</span>
      </div>

      <div class="space-y-2">
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
            <!-- Visual image (if any) -->
            <div
              v-if="getSlideImagePath(slide)"
              class="absolute right-0 top-0 w-1/2 h-full"
            >
              <img
                :src="encodeFilePath(getSlideImagePath(slide)!)"
                class="w-full h-full object-cover"
                alt=""
              />
            </div>
            <!-- Text content -->
            <div class="absolute inset-0 p-1.5">
              <p class="text-[7px] font-semibold text-gray-800 line-clamp-1">{{ slide.headline }}</p>
              <p v-if="slide.subheadline" class="text-[5px] text-gray-600 line-clamp-1">{{ slide.subheadline }}</p>
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
        />

        <!-- Narration Panel -->
        <NarrationPanel
          v-if="activePanel === 'narration'"
          :slide="slidesStore.activeSlide"
          @update-narration="handleNarrationUpdate"
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
import type { Slide, VisualData } from '@shared/types'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const slidesStore = useSlidesStore()

const activePanel = ref<'text' | 'visual' | 'background' | 'narration'>('text')
const saving = ref(false)

const panelTabs = [
  { value: 'text' as const, label: 'Text' },
  { value: 'visual' as const, label: 'Visual' },
  { value: 'background' as const, label: 'Background' },
  { value: 'narration' as const, label: 'Narration' }
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

// Get the image path from slide's visual data or image element
function getSlideImagePath(slide: Slide): string | null {
  // First check visualData
  if (slide.visualData?.imagePath) {
    return slide.visualData.imagePath
  }
  // Then check elements for an image element
  const imageEl = slide.elements?.find(e => e.type === 'image' && e.imagePath)
  return imageEl?.imagePath || null
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

function handleNarrationUpdate(narration: string) {
  slidesStore.updateNarration(narration)
}

async function saveSlide() {
  saving.value = true
  await projectStore.saveProject()
  saving.value = false
}

function proceedToAudio() {
  if (projectStore.project && slidesStore.allComplete) {
    router.push(`/project/${projectStore.project.id}/audio`)
  }
}
</script>
