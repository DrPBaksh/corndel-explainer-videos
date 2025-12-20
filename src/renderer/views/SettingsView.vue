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
        <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
        <p class="text-gray-600 mt-1">Configure API keys and preferences</p>
      </div>

      <div class="space-y-6">
        <!-- API Keys Section -->
        <div class="card p-6">
          <h2 class="font-semibold text-gray-900 mb-4">API Keys</h2>
          <p class="text-sm text-gray-600 mb-4">
            API keys are stored securely in your system's keychain.
          </p>

          <div class="space-y-4">
            <!-- OpenAI -->
            <div class="border-b border-gray-200 pb-4">
              <div class="flex items-center justify-between mb-2">
                <div>
                  <h3 class="font-medium text-gray-900">OpenAI</h3>
                  <p class="text-sm text-gray-500">Required for content generation and TTS</p>
                </div>
                <span
                  class="badge"
                  :class="settingsStore.settings.hasOpenAIKey ? 'badge-green' : 'badge-gray'"
                >
                  {{ settingsStore.settings.hasOpenAIKey ? 'Configured' : 'Not Set' }}
                </span>
              </div>
              <div class="flex gap-2">
                <input
                  v-model="openAIKey"
                  type="password"
                  class="input flex-1"
                  placeholder="sk-..."
                />
                <button @click="saveApiKey('openAI', openAIKey)" class="btn-primary" :disabled="!openAIKey">
                  Save
                </button>
                <button
                  v-if="settingsStore.settings.hasOpenAIKey"
                  @click="clearApiKey('openAI')"
                  class="btn-secondary"
                >
                  Clear
                </button>
              </div>
            </div>

            <!-- Google GenAI -->
            <div class="border-b border-gray-200 pb-4">
              <div class="flex items-center justify-between mb-2">
                <div>
                  <h3 class="font-medium text-gray-900">Google GenAI</h3>
                  <p class="text-sm text-gray-500">For AI image generation</p>
                </div>
                <span
                  class="badge"
                  :class="settingsStore.settings.hasGenAIKey ? 'badge-green' : 'badge-gray'"
                >
                  {{ settingsStore.settings.hasGenAIKey ? 'Configured' : 'Not Set' }}
                </span>
              </div>
              <div class="flex gap-2">
                <input
                  v-model="genAIKey"
                  type="password"
                  class="input flex-1"
                  placeholder="AIza..."
                />
                <button @click="saveApiKey('genAI', genAIKey)" class="btn-primary" :disabled="!genAIKey">
                  Save
                </button>
                <button
                  v-if="settingsStore.settings.hasGenAIKey"
                  @click="clearApiKey('genAI')"
                  class="btn-secondary"
                >
                  Clear
                </button>
              </div>
            </div>

            <!-- Pexels -->
            <div class="border-b border-gray-200 pb-4">
              <div class="flex items-center justify-between mb-2">
                <div>
                  <h3 class="font-medium text-gray-900">Pexels</h3>
                  <p class="text-sm text-gray-500">For stock photo search</p>
                </div>
                <span
                  class="badge"
                  :class="settingsStore.settings.hasPexelsKey ? 'badge-green' : 'badge-gray'"
                >
                  {{ settingsStore.settings.hasPexelsKey ? 'Configured' : 'Not Set' }}
                </span>
              </div>
              <div class="flex gap-2">
                <input
                  v-model="pexelsKey"
                  type="password"
                  class="input flex-1"
                  placeholder="Enter Pexels API key"
                />
                <button @click="saveApiKey('pexels', pexelsKey)" class="btn-primary" :disabled="!pexelsKey">
                  Save
                </button>
                <button
                  v-if="settingsStore.settings.hasPexelsKey"
                  @click="clearApiKey('pexels')"
                  class="btn-secondary"
                >
                  Clear
                </button>
              </div>
            </div>

            <!-- ElevenLabs -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <div>
                  <h3 class="font-medium text-gray-900">ElevenLabs</h3>
                  <p class="text-sm text-gray-500">Optional: Premium voice synthesis</p>
                </div>
                <span
                  class="badge"
                  :class="settingsStore.settings.hasElevenLabsKey ? 'badge-green' : 'badge-gray'"
                >
                  {{ settingsStore.settings.hasElevenLabsKey ? 'Configured' : 'Not Set' }}
                </span>
              </div>
              <div class="flex gap-2">
                <input
                  v-model="elevenLabsKey"
                  type="password"
                  class="input flex-1"
                  placeholder="Enter ElevenLabs API key"
                />
                <button @click="saveApiKey('elevenLabs', elevenLabsKey)" class="btn-primary" :disabled="!elevenLabsKey">
                  Save
                </button>
                <button
                  v-if="settingsStore.settings.hasElevenLabsKey"
                  @click="clearApiKey('elevenLabs')"
                  class="btn-secondary"
                >
                  Clear
                </button>
              </div>
            </div>

            <!-- Remove.bg -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <div>
                  <h3 class="font-medium text-gray-900">Remove.bg</h3>
                  <p class="text-sm text-gray-500">Optional: Background removal from images</p>
                </div>
                <span
                  class="badge"
                  :class="settingsStore.settings.hasRemoveBgKey ? 'badge-green' : 'badge-gray'"
                >
                  {{ settingsStore.settings.hasRemoveBgKey ? 'Configured' : 'Not Set' }}
                </span>
              </div>
              <div class="flex gap-2">
                <input
                  v-model="removeBgKey"
                  type="password"
                  class="input flex-1"
                  placeholder="Enter Remove.bg API key"
                />
                <button @click="saveApiKey('removeBg', removeBgKey)" class="btn-primary" :disabled="!removeBgKey">
                  Save
                </button>
                <button
                  v-if="settingsStore.settings.hasRemoveBgKey"
                  @click="clearApiKey('removeBg')"
                  class="btn-secondary"
                >
                  Clear
                </button>
              </div>
              <p class="text-xs text-gray-500 mt-1">
                Get your API key at <a href="https://www.remove.bg/api" target="_blank" class="text-primary-600 hover:underline">remove.bg/api</a>
              </p>
            </div>
          </div>
        </div>

        <!-- Default Settings -->
        <div class="card p-6">
          <h2 class="font-semibold text-gray-900 mb-4">Default Settings</h2>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label">Default Voice Provider</label>
                <select v-model="defaultVoiceProvider" class="input">
                  <option value="openai">OpenAI TTS</option>
                  <option value="elevenlabs" :disabled="!settingsStore.settings.hasElevenLabsKey">
                    ElevenLabs
                  </option>
                </select>
              </div>
              <div>
                <label class="label">Default Voice</label>
                <select v-model="defaultVoice" class="input">
                  <template v-if="defaultVoiceProvider === 'openai'">
                    <option value="nova">Nova</option>
                    <option value="alloy">Alloy</option>
                    <option value="echo">Echo</option>
                    <option value="fable">Fable</option>
                    <option value="onyx">Onyx</option>
                    <option value="shimmer">Shimmer</option>
                  </template>
                  <template v-else>
                    <option value="21m00Tcm4TlvDq8ikWAM">Rachel</option>
                    <option value="HXOwtW4XU7Ne6iOiDHTl">Elizabeth</option>
                  </template>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label">Default Duration</label>
                <select v-model.number="defaultDuration" class="input">
                  <option :value="30">30 seconds</option>
                  <option :value="60">60 seconds</option>
                  <option :value="90">90 seconds</option>
                  <option :value="120">2 minutes</option>
                  <option :value="180">3 minutes</option>
                </select>
              </div>
              <div>
                <label class="label">Default Slides</label>
                <select v-model.number="defaultNumSlides" class="input">
                  <option :value="3">3 slides</option>
                  <option :value="5">5 slides</option>
                  <option :value="7">7 slides</option>
                  <option :value="10">10 slides</option>
                </select>
              </div>
            </div>

            <div>
              <label class="label">Output Directory</label>
              <div class="flex gap-2">
                <input
                  v-model="defaultOutputDir"
                  type="text"
                  class="input flex-1"
                  placeholder="Default output directory"
                  readonly
                />
                <button @click="selectOutputDir" class="btn-secondary">
                  Browse
                </button>
              </div>
            </div>

            <button @click="saveDefaults" class="btn-primary w-full">
              Save Default Settings
            </button>
          </div>
        </div>

        <!-- Statistics -->
        <div class="card p-6">
          <h2 class="font-semibold text-gray-900 mb-4">Statistics</h2>
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-50 rounded-lg p-4">
              <p class="text-sm text-gray-500">Total Videos Generated</p>
              <p class="text-2xl font-bold text-gray-900">{{ settingsStore.settings.totalVideosGenerated }}</p>
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
              <p class="text-sm text-gray-500">Total API Cost</p>
              <p class="text-2xl font-bold text-gray-900">${{ settingsStore.settings.totalCost.toFixed(2) }}</p>
            </div>
          </div>
        </div>

        <!-- About -->
        <div class="card p-6">
          <h2 class="font-semibold text-gray-900 mb-4">About</h2>
          <div class="text-sm text-gray-600 space-y-1">
            <p><strong>Corndel Explainer Videos</strong></p>
            <p>Version 1.0.0</p>
            <p class="mt-2">Create professional explainer videos with AI-assisted content generation.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '../stores/settingsStore'

const settingsStore = useSettingsStore()

// API Keys
const openAIKey = ref('')
const genAIKey = ref('')
const pexelsKey = ref('')
const elevenLabsKey = ref('')
const removeBgKey = ref('')

// Defaults
const defaultVoiceProvider = ref<'openai' | 'elevenlabs'>('openai')
const defaultVoice = ref('nova')
const defaultDuration = ref(60)
const defaultNumSlides = ref(5)
const defaultOutputDir = ref('')

onMounted(async () => {
  await settingsStore.loadSettings()

  defaultVoiceProvider.value = settingsStore.settings.defaultVoiceProvider
  defaultVoice.value = settingsStore.settings.defaultVoice
  defaultDuration.value = settingsStore.settings.defaultDuration
  defaultNumSlides.value = settingsStore.settings.defaultNumSlides
  defaultOutputDir.value = settingsStore.settings.defaultOutputDir
})

async function saveApiKey(provider: string, key: string) {
  if (!key) return

  const result = await settingsStore.setApiKey(provider, key)
  if (result.success) {
    // Clear the input
    switch (provider) {
      case 'openAI': openAIKey.value = ''; break
      case 'genAI': genAIKey.value = ''; break
      case 'pexels': pexelsKey.value = ''; break
      case 'elevenLabs': elevenLabsKey.value = ''; break
      case 'removeBg': removeBgKey.value = ''; break
    }
  } else {
    alert(result.message || 'Failed to save API key')
  }
}

async function clearApiKey(provider: string) {
  if (confirm(`Are you sure you want to remove the ${provider} API key?`)) {
    await settingsStore.clearApiKey(provider)
  }
}

async function selectOutputDir() {
  const result = await window.electronAPI.selectOutputFolder()
  if (result) {
    defaultOutputDir.value = result
  }
}

async function saveDefaults() {
  const success = await settingsStore.saveSettings({
    defaultVoiceProvider: defaultVoiceProvider.value,
    defaultVoice: defaultVoice.value,
    defaultDuration: defaultDuration.value,
    defaultNumSlides: defaultNumSlides.value,
    defaultOutputDir: defaultOutputDir.value
  })

  if (success) {
    alert('Settings saved successfully')
  } else {
    alert('Failed to save settings')
  }
}
</script>
