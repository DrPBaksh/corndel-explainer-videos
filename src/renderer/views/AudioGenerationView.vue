<template>
  <div class="flex-1 flex flex-col">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-gray-900">Audio Generation</h1>
          <p class="text-sm text-gray-600 mt-1">
            Generate narration audio for each slide
          </p>
        </div>
        <div class="flex items-center gap-3">
          <router-link
            :to="`/project/${projectStore.project?.id}/edit`"
            class="btn-secondary"
          >
            Back to Editor
          </router-link>
          <button
            @click="proceedToVideo"
            :disabled="!allAudioGenerated"
            class="btn-primary"
          >
            Generate Video
          </button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 p-6 overflow-y-auto">
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Voice Settings -->
        <div class="card p-4">
          <h2 class="font-medium text-gray-900 mb-3">Voice Settings</h2>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Provider</label>
              <select v-model="voiceProvider" class="input" :disabled="isGenerating">
                <option value="openai">OpenAI TTS</option>
                <option value="elevenlabs" :disabled="!settingsStore.canUseElevenLabs">
                  ElevenLabs {{ !settingsStore.canUseElevenLabs ? '(No API key)' : '' }}
                </option>
              </select>
            </div>
            <div>
              <label class="label">Voice</label>
              <select v-model="voiceName" class="input" :disabled="isGenerating">
                <template v-if="voiceProvider === 'openai'">
                  <option value="nova">Nova (Friendly)</option>
                  <option value="alloy">Alloy (Neutral)</option>
                  <option value="echo">Echo (Clear)</option>
                  <option value="fable">Fable (Warm)</option>
                  <option value="onyx">Onyx (Deep)</option>
                  <option value="shimmer">Shimmer (Smooth)</option>
                </template>
                <template v-else>
                  <option value="21m00Tcm4TlvDq8ikWAM">Rachel (British)</option>
                  <option value="HXOwtW4XU7Ne6iOiDHTl">Elizabeth (American)</option>
                </template>
              </select>
            </div>
          </div>
        </div>

        <!-- Generate All Button -->
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-600">
            {{ generatedCount }} of {{ slides.length }} audio clips generated
          </div>
          <button
            @click="generateAllAudio"
            :disabled="isGenerating || allAudioGenerated"
            class="btn-primary"
          >
            {{ isGenerating ? 'Generating...' : 'Generate All Audio' }}
          </button>
        </div>

        <!-- Progress Bar -->
        <div v-if="isGenerating" class="space-y-2">
          <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              class="h-full bg-primary-500 transition-all duration-300"
              :style="{ width: `${progress}%` }"
            ></div>
          </div>
          <p class="text-sm text-gray-600 text-center">{{ progressText }}</p>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="flex-1">
              <p class="text-sm font-medium text-red-800">Audio Generation Error</p>
              <p class="text-sm text-red-600 mt-1">{{ errorMessage }}</p>
            </div>
            <button @click="errorMessage = null" class="text-red-400 hover:text-red-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Slide List -->
        <div class="space-y-4">
          <div
            v-for="(slide, index) in slides"
            :key="slide.slideNum"
            class="card p-4"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-sm font-medium text-gray-500">Slide {{ index + 1 }}</span>
                  <span
                    class="badge"
                    :class="slide.audioPath ? 'badge-green' : 'badge-gray'"
                  >
                    {{ slide.audioPath ? 'Generated' : 'Pending' }}
                  </span>
                </div>
                <h3 class="font-medium text-gray-900">{{ slide.headline || 'Untitled' }}</h3>
                <p class="text-sm text-gray-600 mt-1 line-clamp-2">
                  {{ slide.narration || 'No narration' }}
                </p>
              </div>

              <div class="flex items-center gap-2 ml-4">
                <!-- Audio Player -->
                <div v-if="slide.audioPath" class="flex items-center gap-2">
                  <button
                    @click="playAudio(slide.audioPath!)"
                    class="btn-icon"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <span class="text-sm text-gray-500">
                    {{ slide.audioDuration ? `${slide.audioDuration.toFixed(1)}s` : '' }}
                  </span>
                </div>

                <!-- Generate Button -->
                <button
                  @click="generateSingleAudio(index)"
                  :disabled="isGenerating || !slide.narration"
                  class="btn-secondary text-sm"
                >
                  {{ slide.audioPath ? 'Regenerate' : 'Generate' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden Audio Element -->
    <audio ref="audioPlayer" class="hidden"></audio>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '../stores/projectStore'
import { useSettingsStore } from '../stores/settingsStore'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const settingsStore = useSettingsStore()

const audioPlayer = ref<HTMLAudioElement | null>(null)
const isGenerating = ref(false)
const currentGeneratingIndex = ref(-1)
const voiceProvider = ref('openai')
const voiceName = ref('nova')
const errorMessage = ref<string | null>(null)

onMounted(async () => {
  console.log('=== AudioGenerationView mounted ===')
  const projectId = route.params.id as string
  console.log('Project ID from route:', projectId)

  if (!projectStore.project || projectStore.project.id !== projectId) {
    console.log('Loading project...')
    await projectStore.loadProject(projectId)
  }

  console.log('Project loaded:', projectStore.project?.id)
  console.log('Number of slides:', projectStore.project?.slides?.length)

  // Use project voice settings
  if (projectStore.project?.config) {
    voiceProvider.value = projectStore.project.config.voiceProvider || 'openai'
    voiceName.value = projectStore.project.config.voiceName || 'nova'
  }

  console.log('Voice provider:', voiceProvider.value)
  console.log('Voice name:', voiceName.value)
})

const slides = computed(() => projectStore.project?.slides || [])

const generatedCount = computed(() =>
  slides.value.filter(s => s.audioPath).length
)

const allAudioGenerated = computed(() =>
  slides.value.length > 0 && slides.value.every(s => s.audioPath)
)

const progress = computed(() => {
  if (slides.value.length === 0) return 0
  return (generatedCount.value / slides.value.length) * 100
})

const progressText = computed(() => {
  if (currentGeneratingIndex.value >= 0) {
    return `Generating audio for slide ${currentGeneratingIndex.value + 1}...`
  }
  return ''
})

async function generateAllAudio() {
  console.log('=== generateAllAudio called ===')
  console.log('Number of slides:', slides.value.length)
  console.log('Slides:', slides.value.map(s => ({ slideNum: s.slideNum, narration: s.narration?.substring(0, 50), audioPath: s.audioPath })))

  if (slides.value.length === 0) {
    errorMessage.value = 'No slides found in project'
    return
  }

  const slidesWithNarration = slides.value.filter(s => s.narration && !s.audioPath)
  console.log('Slides needing audio:', slidesWithNarration.length)

  if (slidesWithNarration.length === 0) {
    errorMessage.value = 'No slides need audio generation (either no narration or already generated)'
    return
  }

  isGenerating.value = true
  errorMessage.value = null

  for (let i = 0; i < slides.value.length; i++) {
    const slide = slides.value[i]
    if (!slide.audioPath && slide.narration) {
      currentGeneratingIndex.value = i
      const success = await generateAudioForSlide(i)
      if (!success) break
    }
  }

  currentGeneratingIndex.value = -1
  isGenerating.value = false
  await projectStore.saveProject()
}

async function generateSingleAudio(index: number) {
  isGenerating.value = true
  errorMessage.value = null
  currentGeneratingIndex.value = index

  await generateAudioForSlide(index)

  currentGeneratingIndex.value = -1
  isGenerating.value = false
  await projectStore.saveProject()
}

async function generateAudioForSlide(index: number): Promise<boolean> {
  const slide = slides.value[index]
  if (!slide.narration) {
    errorMessage.value = `Slide ${index + 1} has no narration text`
    return false
  }
  if (!projectStore.project?.id) {
    errorMessage.value = 'No project loaded'
    return false
  }

  try {
    console.log('Generating audio for slide', index + 1, 'with provider:', voiceProvider.value)
    const result = await window.electronAPI.generateAudio({
      projectId: projectStore.project.id,
      text: slide.narration,
      provider: voiceProvider.value,
      voiceName: voiceName.value,
      slideNum: slide.slideNum
    })

    console.log('Audio generation result:', result)

    if (result.success && result.data) {
      projectStore.updateSlide(slide.slideNum, {
        audioPath: result.data.path,
        audioDuration: result.data.duration
      })
      // Save immediately after each audio generation so progress isn't lost
      await projectStore.saveProject()
      console.log(`Audio for slide ${index + 1} saved to project`)
      return true
    } else {
      errorMessage.value = result.error || 'Failed to generate audio'
      return false
    }
  } catch (error: any) {
    console.error(`Failed to generate audio for slide ${index + 1}:`, error)
    errorMessage.value = error.message || 'An error occurred'
    return false
  }
}

function playAudio(path: string) {
  if (audioPlayer.value) {
    audioPlayer.value.src = `file://${path}`
    audioPlayer.value.play()
  }
}

function proceedToVideo() {
  if (projectStore.project && allAudioGenerated.value) {
    router.push(`/project/${projectStore.project.id}/video`)
  }
}
</script>
