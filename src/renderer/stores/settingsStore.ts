import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AppSettings } from '@shared/types'

export const useSettingsStore = defineStore('settings', () => {
  // State
  const settings = ref<AppSettings>({
    hasOpenAIKey: false,
    hasElevenLabsKey: false,
    hasGenAIKey: false,
    hasPexelsKey: false,
    hasRemoveBgKey: false,
    defaultVoiceProvider: 'openai',
    defaultVoice: 'nova',
    defaultOutputDir: '',
    defaultNumSlides: 5,
    defaultDuration: 60,
    totalCost: 0,
    totalVideosGenerated: 0
  })

  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const hasRequiredKeys = computed(() =>
    settings.value.hasOpenAIKey &&
    (settings.value.hasGenAIKey || settings.value.hasPexelsKey)
  )

  const canGenerateContent = computed(() => settings.value.hasOpenAIKey)
  const canGenerateImages = computed(() => settings.value.hasGenAIKey)
  const canSearchPexels = computed(() => settings.value.hasPexelsKey)
  const canUseElevenLabs = computed(() => settings.value.hasElevenLabsKey)
  const canRemoveBackground = computed(() => settings.value.hasRemoveBgKey)

  // Actions
  async function loadSettings(): Promise<void> {
    loading.value = true
    try {
      settings.value = await window.electronAPI.getSettings()
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function saveSettings(updates: Partial<AppSettings>): Promise<boolean> {
    try {
      const success = await window.electronAPI.saveSettings(updates)
      if (success) {
        settings.value = { ...settings.value, ...updates }
      }
      return success
    } catch (e: any) {
      error.value = e.message
      return false
    }
  }

  async function setApiKey(provider: string, apiKey: string): Promise<{ success: boolean; message?: string }> {
    try {
      const result = await window.electronAPI.setApiKey(provider, apiKey)
      if (result.success) {
        // Reload settings to get updated hasKey flags
        await loadSettings()
      }
      return result
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }

  async function getApiKey(provider: string): Promise<{ hasKey: boolean; maskedKey: string }> {
    try {
      return await window.electronAPI.getApiKey(provider)
    } catch {
      return { hasKey: false, maskedKey: '' }
    }
  }

  async function clearApiKey(provider: string): Promise<boolean> {
    try {
      const success = await window.electronAPI.clearApiKey(provider)
      if (success) {
        // Reload settings to get updated hasKey flags
        await loadSettings()
      }
      return success
    } catch {
      return false
    }
  }

  return {
    // State
    settings,
    loading,
    error,

    // Computed
    hasRequiredKeys,
    canGenerateContent,
    canGenerateImages,
    canSearchPexels,
    canUseElevenLabs,
    canRemoveBackground,

    // Actions
    loadSettings,
    saveSettings,
    setApiKey,
    getApiKey,
    clearApiKey
  }
})
