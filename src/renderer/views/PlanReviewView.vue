<template>
  <div class="flex-1 flex">
    <!-- Sidebar with slide overview -->
    <div class="w-72 bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <h2 class="font-semibold text-gray-900 mb-4">Content Plan</h2>

      <!-- Status -->
      <div v-if="!projectStore.hasStrategy" class="text-center py-8">
        <div v-if="generating" class="space-y-4">
          <div class="spinner spinner-lg mx-auto"></div>
          <p class="text-sm text-gray-600">Generating content strategy...</p>
        </div>
        <div v-else class="space-y-4">
          <p class="text-sm text-gray-500">No content plan yet. Generate one to get started.</p>
          <button @click="generateStrategy" class="btn-primary w-full">
            Generate Content Plan
          </button>
        </div>
      </div>

      <!-- Slide list -->
      <div v-else class="space-y-2">
        <div
          v-for="(slide, index) in projectStore.project?.contentStrategy?.slides"
          :key="slide.slideNum"
          @click="selectedSlideIndex = index"
          class="p-3 rounded-lg cursor-pointer transition-colors"
          :class="selectedSlideIndex === index ? 'bg-primary-50 border border-primary-200' : 'hover:bg-gray-50'"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-medium text-gray-500">Slide {{ slide.slideNum + 1 }}</span>
            <span class="badge-gray text-xs">{{ slide.type }}</span>
          </div>
          <p class="text-sm font-medium text-gray-900 line-clamp-2">
            {{ slide.headline || 'Untitled' }}
          </p>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-xs text-gray-500">{{ slide.duration }}s</span>
            <span class="text-xs text-gray-400">|</span>
            <span class="text-xs text-gray-500">{{ slide.visualType }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main content area -->
    <div class="flex-1 p-6 overflow-y-auto">
      <div v-if="!projectStore.hasStrategy" class="h-full flex items-center justify-center">
        <div class="text-center max-w-md">
          <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Ready to Generate</h3>
          <p class="text-gray-600 mb-4">
            Click the button in the sidebar to generate your content strategy using AI.
          </p>
          <div class="text-sm text-gray-500">
            <p><strong>Topic:</strong> {{ projectStore.project?.config.topic }}</p>
            <p><strong>Duration:</strong> {{ projectStore.project?.config.targetDuration }}s</p>
            <p><strong>Slides:</strong> {{ projectStore.project?.config.numSlides }}</p>
          </div>
        </div>
      </div>

      <div v-else-if="selectedSlide" class="max-w-3xl">
        <!-- Slide header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <span class="text-sm text-gray-500">Slide {{ selectedSlide.slideNum + 1 }} of {{ slideCount }}</span>
            <h2 class="text-xl font-semibold text-gray-900">
              {{ selectedSlide.headline || 'Slide ' + (selectedSlide.slideNum + 1) }}
            </h2>
          </div>
          <span :class="getTypeClass(selectedSlide.type)">{{ selectedSlide.type }}</span>
        </div>

        <!-- Slide details -->
        <div class="space-y-6">
          <!-- Text content -->
          <div class="card p-4">
            <h3 class="font-medium text-gray-900 mb-3">Text Content</h3>
            <div class="space-y-3">
              <div v-if="selectedSlide.headline">
                <label class="text-xs text-gray-500">Headline</label>
                <p class="text-gray-900">{{ selectedSlide.headline }}</p>
              </div>
              <div v-if="selectedSlide.subheadline">
                <label class="text-xs text-gray-500">Subheadline</label>
                <p class="text-gray-700">{{ selectedSlide.subheadline }}</p>
              </div>
              <div v-if="selectedSlide.bodyText">
                <label class="text-xs text-gray-500">Body</label>
                <p class="text-gray-700">{{ selectedSlide.bodyText }}</p>
              </div>
              <div v-if="selectedSlide.bullets && selectedSlide.bullets.length > 0">
                <label class="text-xs text-gray-500">Bullets</label>
                <ul class="list-disc list-inside text-gray-700">
                  <li v-for="(bullet, i) in selectedSlide.bullets" :key="i">{{ bullet }}</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Visual -->
          <div class="card p-4">
            <h3 class="font-medium text-gray-900 mb-3">Visual</h3>
            <div class="flex items-center gap-2 mb-2">
              <span class="badge-blue">{{ selectedSlide.visualType }}</span>
              <span class="badge-gray">{{ selectedSlide.layout }}</span>
            </div>
            <p class="text-sm text-gray-600">{{ selectedSlide.visualDescription }}</p>
            <div v-if="selectedSlide.pexelsKeywords" class="mt-2">
              <span class="text-xs text-gray-500">Pexels Keywords:</span>
              <span class="text-sm text-gray-700 ml-1">{{ selectedSlide.pexelsKeywords }}</span>
            </div>
            <div v-if="selectedSlide.geminiPrompt" class="mt-2">
              <span class="text-xs text-gray-500">AI Image Prompt:</span>
              <p class="text-sm text-gray-700 mt-1 bg-gray-50 p-2 rounded">{{ selectedSlide.geminiPrompt }}</p>
            </div>
            <div v-if="selectedSlide.diagramDescription" class="mt-2">
              <span class="text-xs text-gray-500">Diagram Description:</span>
              <p class="text-sm text-gray-700 mt-1">{{ selectedSlide.diagramDescription }}</p>
            </div>
          </div>

          <!-- Narration -->
          <div class="card p-4">
            <h3 class="font-medium text-gray-900 mb-3">Narration</h3>
            <p class="text-gray-700 italic">"{{ selectedSlide.narration }}"</p>
            <div class="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>{{ wordCount }} words</span>
              <span>~{{ selectedSlide.duration }}s</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom action bar -->
    <div v-if="projectStore.hasStrategy" class="absolute bottom-0 left-72 right-0 bg-white border-t border-gray-200 p-4 flex items-center justify-between">
      <div class="text-sm text-gray-600">
        <span>{{ slideCount }} slides</span>
        <span class="mx-2">|</span>
        <span>{{ projectStore.project?.contentStrategy?.totalDuration }}s total</span>
        <span class="mx-2">|</span>
        <span>{{ projectStore.project?.contentStrategy?.wordCount }} words</span>
      </div>
      <div class="flex gap-3">
        <button @click="regenerateStrategy" class="btn-secondary" :disabled="generating">
          Regenerate Plan
        </button>
        <button @click="proceedToEditing" class="btn-primary">
          Start Editing Slides
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '../stores/projectStore'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()

const generating = ref(false)
const selectedSlideIndex = ref(0)

const slideCount = computed(() => projectStore.project?.contentStrategy?.slides.length || 0)

const selectedSlide = computed(() => {
  if (!projectStore.project?.contentStrategy?.slides) return null
  return projectStore.project.contentStrategy.slides[selectedSlideIndex.value]
})

const wordCount = computed(() => {
  if (!selectedSlide.value) return 0
  return selectedSlide.value.narration.split(/\s+/).length
})

onMounted(async () => {
  const projectId = route.params.id as string
  if (!projectStore.project || projectStore.project.id !== projectId) {
    await projectStore.loadProject(projectId)
  }
})

async function generateStrategy() {
  generating.value = true
  await projectStore.generateContentStrategy()
  generating.value = false
}

async function regenerateStrategy() {
  if (confirm('This will replace the current content plan. Continue?')) {
    generating.value = true
    await projectStore.generateContentStrategy()
    selectedSlideIndex.value = 0
    generating.value = false
  }
}

function proceedToEditing() {
  if (projectStore.project) {
    router.push(`/project/${projectStore.project.id}/edit`)
  }
}

function getTypeClass(type: string): string {
  const classes: Record<string, string> = {
    intro: 'badge-blue',
    main: 'badge-gray',
    end: 'badge-green'
  }
  return classes[type] || 'badge-gray'
}
</script>
