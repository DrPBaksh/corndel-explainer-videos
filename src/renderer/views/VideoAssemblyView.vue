<template>
  <div class="flex-1 flex flex-col">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-gray-900">Video Assembly</h1>
          <p class="text-sm text-gray-600 mt-1">
            Generate the final video from your slides
          </p>
        </div>
        <div class="flex items-center gap-3">
          <router-link
            :to="`/project/${projectStore.project?.id}/audio`"
            class="btn-secondary"
          >
            Back to Audio
          </router-link>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 p-6 overflow-y-auto">
      <div class="max-w-4xl mx-auto">
        <!-- Status Card -->
        <div class="card p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-gray-900">Video Status</h2>
            <span
              class="badge"
              :class="statusBadgeClass"
            >
              {{ statusText }}
            </span>
          </div>

          <!-- Progress -->
          <div v-if="isGenerating" class="space-y-3">
            <div class="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="h-full bg-primary-500 transition-all duration-300"
                :style="{ width: `${progress}%` }"
              ></div>
            </div>
            <p class="text-sm text-gray-600 text-center">{{ progressText }}</p>
          </div>

          <!-- Completed -->
          <div v-else-if="videoPath" class="space-y-4">
            <div class="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref="videoPlayer"
                :src="`file://${videoPath}`"
                controls
                class="w-full h-full"
              ></video>
            </div>

            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-600">
                <p><strong>Duration:</strong> {{ Math.round(videoDuration) }}s</p>
                <p><strong>Resolution:</strong> 1920x1080</p>
              </div>
              <div class="flex gap-2">
                <button @click="openVideoFolder" class="btn-primary">
                  Open Folder
                </button>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div class="flex-1">
                <p class="text-sm font-medium text-red-800">Video Generation Error</p>
                <p class="text-sm text-red-600 mt-1">{{ errorMessage }}</p>
              </div>
              <button @click="errorMessage = null" class="text-red-400 hover:text-red-600">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Ready to Generate -->
          <div v-else class="text-center py-8">
            <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p class="text-gray-600 mb-4">
              Ready to assemble {{ slides.length }} slides into a video
            </p>
            <button
              @click="generateVideo"
              :disabled="!canGenerate"
              class="btn-primary"
            >
              Generate Video
            </button>
          </div>
        </div>

        <!-- Slide Preview List -->
        <div class="card p-4">
          <h2 class="font-medium text-gray-900 mb-4">Slides Overview</h2>
          <div class="space-y-3">
            <div
              v-for="(slide, index) in slides"
              :key="slide.slideNum"
              class="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
              :class="{ 'ring-2 ring-primary-500': currentSlideIndex === index && isGenerating }"
            >
              <!-- Thumbnail -->
              <div class="w-24 h-14 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                <div
                  class="w-full h-full flex items-center justify-center text-xs text-gray-500"
                  :style="getSlideBackgroundStyle(slide)"
                >
                  {{ index + 1 }}
                </div>
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <h3 class="font-medium text-gray-900 truncate">
                  {{ slide.headline || `Slide ${index + 1}` }}
                </h3>
                <div class="flex items-center gap-3 text-sm text-gray-500">
                  <span>{{ slide.duration }}s</span>
                  <span v-if="slide.audioPath" class="text-green-600">Audio ready</span>
                  <span v-else class="text-red-600">No audio</span>
                </div>
              </div>

              <!-- Status -->
              <div>
                <span v-if="isGenerating && currentSlideIndex === index" class="spinner"></span>
                <svg v-else-if="generatedSlides.includes(index)" class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <div v-else class="w-5 h-5 rounded-full border-2 border-gray-300"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Estimated Info -->
        <div class="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 class="font-medium text-gray-900 mb-2">Video Details</h3>
          <div class="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span class="text-gray-500">Total Duration</span>
              <p class="font-medium text-gray-900">{{ totalDuration }}s</p>
            </div>
            <div>
              <span class="text-gray-500">Slides</span>
              <p class="font-medium text-gray-900">{{ slides.length }}</p>
            </div>
            <div>
              <span class="text-gray-500">Format</span>
              <p class="font-medium text-gray-900">MP4 (H.264)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectStore } from '../stores/projectStore'
import type { Slide } from '@shared/types'

const route = useRoute()
const projectStore = useProjectStore()

const videoPlayer = ref<HTMLVideoElement | null>(null)
const isGenerating = ref(false)
const progress = ref(0)
const progressText = ref('')
const currentSlideIndex = ref(-1)
const generatedSlides = ref<number[]>([])
const videoPath = ref<string | null>(null)
const videoDuration = ref(0)
const errorMessage = ref<string | null>(null)

onMounted(async () => {
  const projectId = route.params.id as string
  if (!projectStore.project || projectStore.project.id !== projectId) {
    await projectStore.loadProject(projectId)
  }

  // Check if video already exists
  if (projectStore.project?.outputPath) {
    videoPath.value = projectStore.project.outputPath
    videoDuration.value = projectStore.project.contentStrategy?.totalDuration || 0
  }

  // Listen for progress updates
  window.electronAPI.onProgressUpdate((data) => {
    if (data.type === 'video') {
      progress.value = data.progress
      progressText.value = data.message || ''
      if (data.slideIndex !== undefined) {
        currentSlideIndex.value = data.slideIndex
        if (!generatedSlides.value.includes(data.slideIndex)) {
          generatedSlides.value.push(data.slideIndex)
        }
      }
    }
  })
})

const slides = computed(() => projectStore.project?.slides || [])

const canGenerate = computed(() =>
  slides.value.length > 0 && slides.value.every(s => s.audioPath)
)

const totalDuration = computed(() =>
  slides.value.reduce((sum, s) => sum + (s.audioDuration || s.duration), 0)
)

const statusText = computed(() => {
  if (isGenerating.value) return 'Generating...'
  if (videoPath.value) return 'Complete'
  return 'Ready'
})

const statusBadgeClass = computed(() => {
  if (isGenerating.value) return 'badge-yellow'
  if (videoPath.value) return 'badge-green'
  return 'badge-gray'
})

function getSlideBackgroundStyle(slide: Slide): Record<string, string> {
  if (slide.backgroundType === 'gradient' && slide.backgroundGradient) {
    return { background: slide.backgroundGradient }
  } else if (slide.backgroundType === 'image' && slide.backgroundImagePath) {
    return {
      backgroundImage: `url(file://${slide.backgroundImagePath})`,
      backgroundSize: 'cover'
    }
  }
  return { backgroundColor: slide.backgroundColor || '#ffffff' }
}

async function generateVideo() {
  if (!projectStore.project || !canGenerate.value) return

  console.log('=== generateVideo called ===')
  isGenerating.value = true
  progress.value = 0
  progressText.value = 'Preparing slides...'
  generatedSlides.value = []
  currentSlideIndex.value = 0
  errorMessage.value = null

  try {
    const result = await window.electronAPI.generateVideo(projectStore.project.id)
    console.log('generateVideo result:', result)

    if (result.success && result.data) {
      videoPath.value = result.data.path
      videoDuration.value = result.data.duration

      // Reload project to get updated status
      await projectStore.loadProject(projectStore.project.id)
    } else {
      errorMessage.value = result.error || 'Video generation failed'
    }
  } catch (error: any) {
    console.error('Video generation failed:', error)
    errorMessage.value = error.message || 'Video generation failed'
  } finally {
    isGenerating.value = false
    currentSlideIndex.value = -1
  }
}

async function openVideoFolder() {
  if (videoPath.value) {
    await window.electronAPI.showInFolder(videoPath.value)
  }
}
</script>
