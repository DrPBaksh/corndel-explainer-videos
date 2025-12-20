<template>
  <div class="flex-1 p-8">
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <router-link to="/" class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </router-link>
        <h1 class="text-2xl font-bold text-gray-900">Create New Video</h1>
        <p class="text-gray-600 mt-1">Configure your explainer video settings</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="createProject" class="space-y-6">
        <!-- Topic -->
        <div>
          <label class="label">Topic / Title *</label>
          <input
            v-model="config.topic"
            type="text"
            class="input"
            placeholder="e.g., Introduction to Machine Learning"
            required
          />
        </div>

        <!-- Description -->
        <div>
          <label class="label">Description *</label>
          <textarea
            v-model="config.description"
            class="input min-h-[100px]"
            placeholder="Describe what the video should cover..."
            required
          ></textarea>
        </div>

        <!-- Duration & Slides -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Target Duration (seconds)</label>
            <input
              v-model.number="config.targetDuration"
              type="number"
              min="15"
              max="600"
              step="5"
              class="input"
              placeholder="60"
            />
            <p class="text-xs text-gray-500 mt-1">15-600 seconds ({{ formatDuration(config.targetDuration) }})</p>
          </div>
          <div>
            <label class="label">Number of Slides</label>
            <div class="flex items-center gap-2">
              <input
                v-model.number="numSlidesValue"
                type="number"
                min="1"
                max="20"
                :disabled="flexibleSlides"
                class="input flex-1"
                :class="{ 'bg-gray-100': flexibleSlides }"
                placeholder="5"
              />
              <label class="flex items-center gap-1.5 text-sm whitespace-nowrap cursor-pointer">
                <input
                  v-model="flexibleSlides"
                  type="checkbox"
                  class="w-4 h-4 text-primary-600 rounded border-gray-300"
                />
                <span class="text-gray-600">AI decides</span>
              </label>
            </div>
            <p class="text-xs text-gray-500 mt-1">1-20 slides</p>
          </div>
        </div>

        <!-- Voice Settings -->
        <div class="card p-4">
          <h3 class="font-medium text-gray-900 mb-3">Voice Settings</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Provider</label>
              <select v-model="config.voiceProvider" class="input">
                <option value="openai">OpenAI TTS</option>
                <option value="elevenlabs" :disabled="!settingsStore.canUseElevenLabs">
                  ElevenLabs {{ !settingsStore.canUseElevenLabs ? '(No API key)' : '' }}
                </option>
              </select>
            </div>
            <div>
              <label class="label">Voice</label>
              <select v-model="config.voiceName" class="input">
                <template v-if="config.voiceProvider === 'openai'">
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

        <!-- Options -->
        <div class="space-y-3">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="config.webSearchEnabled"
              type="checkbox"
              class="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
            <span class="text-gray-700">Enable Web Search</span>
            <span class="text-sm text-gray-500">(Gather current facts and statistics)</span>
          </label>
        </div>

        <!-- Grounded Material -->
        <div>
          <label class="label">Grounded Material (Optional)</label>
          <p class="text-sm text-gray-500 mb-2">
            Upload documents to use as reference material for content generation.
          </p>

          <div v-if="config.groundedMaterial.length > 0" class="space-y-2 mb-3">
            <div
              v-for="doc in config.groundedMaterial"
              :key="doc.id"
              class="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
            >
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span class="text-sm text-gray-700">{{ doc.fileName }}</span>
              </div>
              <button
                @click="removeDocument(doc.id)"
                type="button"
                class="text-gray-400 hover:text-red-500"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <button
            @click="addDocuments"
            type="button"
            class="btn-secondary w-full"
          >
            <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Documents
          </button>
        </div>

        <!-- Submit -->
        <div class="flex gap-4 pt-4">
          <router-link to="/" class="btn-secondary flex-1">Cancel</router-link>
          <button
            type="submit"
            :disabled="loading || !isValid"
            class="btn-primary flex-1"
          >
            <span v-if="loading" class="spinner mr-2"></span>
            {{ loading ? 'Creating...' : 'Create Project' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settingsStore'
import { useProjectStore } from '../stores/projectStore'
import type { ProjectConfig, GroundedDocument } from '@shared/types'

const router = useRouter()
const settingsStore = useSettingsStore()
const projectStore = useProjectStore()

const loading = ref(false)
const numSlidesValue = ref(5)
const flexibleSlides = ref(false)

const config = ref<ProjectConfig>({
  topic: '',
  description: '',
  targetDuration: 60,
  numSlides: 5,
  webSearchEnabled: false,
  groundedMaterial: [],
  voiceProvider: 'openai',
  voiceName: 'nova'
})

const isValid = computed(() => {
  return config.value.topic.trim() && config.value.description.trim()
})

onMounted(async () => {
  await settingsStore.loadSettings()
  config.value.voiceProvider = settingsStore.settings.defaultVoiceProvider
  config.value.voiceName = settingsStore.settings.defaultVoice
})

async function addDocuments() {
  const result = await window.electronAPI.selectDocuments()
  if (result.success && result.data) {
    for (const doc of result.data) {
      config.value.groundedMaterial.push({
        id: `doc_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        fileName: doc.fileName,
        content: doc.content,
        mimeType: doc.mimeType
      })
    }
  }
}

function removeDocument(docId: string) {
  config.value.groundedMaterial = config.value.groundedMaterial.filter(d => d.id !== docId)
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
}

async function createProject() {
  loading.value = true

  // Set numSlides based on selection
  config.value.numSlides = flexibleSlides.value ? 'flexible' : numSlidesValue.value

  try {
    const success = await projectStore.createProject(config.value)

    if (success && projectStore.project) {
      router.push(`/project/${projectStore.project.id}/plan`)
    } else {
      alert(projectStore.error || 'Failed to create project')
    }
  } catch (e: any) {
    console.error('Create project error:', e)
    alert('Error creating project: ' + e.message)
  } finally {
    loading.value = false
  }
}
</script>
