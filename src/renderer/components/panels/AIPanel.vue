<template>
  <div class="space-y-4">
    <h3 class="font-semibold text-gray-900">AI Regeneration</h3>

    <div v-if="!slide" class="text-sm text-gray-500">
      No slide selected
    </div>

    <div v-else class="space-y-4">
      <!-- Custom Instructions -->
      <div>
        <label class="label">Custom Instructions</label>
        <textarea
          v-model="customInstructions"
          class="input min-h-[80px]"
          placeholder="e.g. 'Make it more concise', 'Focus on benefits', 'Add more technical detail'..."
        ></textarea>
        <p class="text-xs text-gray-500 mt-1">
          Optional: Guide the AI on how to regenerate this slide
        </p>
      </div>

      <!-- What to Regenerate -->
      <div class="border-t border-gray-200 pt-4">
        <div class="flex items-center justify-between mb-2">
          <label class="label mb-0">What to Regenerate</label>
          <div class="flex gap-2">
            <button @click="selectAllRegenerate" class="text-xs text-primary-600 hover:text-primary-800">
              All
            </button>
            <span class="text-gray-300">|</span>
            <button @click="selectNoneRegenerate" class="text-xs text-primary-600 hover:text-primary-800">
              None
            </button>
          </div>
        </div>
        <div class="space-y-2">
          <label class="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" v-model="regenerate.layout" class="checkbox" />
            <span>Layout</span>
          </label>
          <label class="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" v-model="regenerate.headline" class="checkbox" />
            <span>Headline</span>
          </label>
          <label class="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" v-model="regenerate.subheadline" class="checkbox" />
            <span>Subheadline</span>
          </label>
          <label class="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" v-model="regenerate.bodyText" class="checkbox" />
            <span>Body Text</span>
          </label>
          <label class="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" v-model="regenerate.bullets" class="checkbox" />
            <span>Bullet Points</span>
          </label>
          <label class="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" v-model="regenerate.visualSuggestions" class="checkbox" />
            <span>Visual Suggestions</span>
            <span class="text-xs text-gray-400">(prompts, keywords)</span>
          </label>
          <label class="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" v-model="regenerate.narration" class="checkbox" />
            <span>Narration Script</span>
          </label>
        </div>
      </div>

      <!-- What to Preserve -->
      <div class="border-t border-gray-200 pt-4">
        <label class="label">What to Preserve</label>
        <div class="space-y-2">
          <label class="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" v-model="preserve.visual" class="checkbox" />
            <span>Current image/visual</span>
            <span v-if="slide.visualData?.imagePath" class="text-xs text-green-600">(exists)</span>
          </label>
          <label class="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" v-model="preserve.audio" class="checkbox" />
            <span>Generated audio</span>
            <span v-if="slide.audioPath" class="text-xs text-green-600">(exists)</span>
          </label>
          <label class="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" v-model="preserve.positions" class="checkbox" />
            <span>Custom element positions</span>
          </label>
          <label class="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" v-model="preserve.background" class="checkbox" />
            <span>Background settings</span>
          </label>
        </div>
      </div>

      <!-- Regenerate Button -->
      <div class="border-t border-gray-200 pt-4">
        <button
          @click="handleRegenerate"
          :disabled="isRegenerating || !hasSelectedRegenerate"
          class="btn-primary w-full flex items-center justify-center gap-2"
        >
          <svg v-if="isRegenerating" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ isRegenerating ? 'Regenerating...' : 'Regenerate Slide' }}
        </button>

        <p v-if="!hasSelectedRegenerate" class="text-xs text-amber-600 mt-2 text-center">
          Select at least one field to regenerate
        </p>

        <p class="text-xs text-gray-500 mt-2 text-center">
          Estimated cost: ~$0.01-0.02
        </p>
      </div>

      <!-- Warning -->
      <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <div class="flex gap-2">
          <svg class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p class="text-xs text-amber-700">
            This will replace selected content with AI-generated content. Unselected fields and preserved items will remain unchanged.
          </p>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-3">
        <div class="flex items-start gap-2">
          <svg class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <p class="text-sm text-red-700">{{ errorMessage }}</p>
          </div>
          <button @click="errorMessage = null" class="text-red-400 hover:text-red-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Slide } from '@shared/types'

const props = defineProps<{
  slide: Slide | null
}>()

const emit = defineEmits<{
  regenerate: [params: {
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
  }]
}>()

const customInstructions = ref('')
const isRegenerating = ref(false)
const errorMessage = ref<string | null>(null)

const regenerate = ref({
  layout: false,
  headline: true,
  subheadline: true,
  bodyText: true,
  bullets: true,
  visualSuggestions: true,
  narration: true
})

const preserve = ref({
  visual: true,
  audio: true,
  positions: false,
  background: true
})

// Reset when slide changes
watch(() => props.slide?.id, () => {
  customInstructions.value = ''
  errorMessage.value = null
})

const hasSelectedRegenerate = computed(() => {
  return Object.values(regenerate.value).some(v => v)
})

function selectAllRegenerate() {
  Object.keys(regenerate.value).forEach(key => {
    regenerate.value[key as keyof typeof regenerate.value] = true
  })
}

function selectNoneRegenerate() {
  Object.keys(regenerate.value).forEach(key => {
    regenerate.value[key as keyof typeof regenerate.value] = false
  })
}

async function handleRegenerate() {
  if (!props.slide || !hasSelectedRegenerate.value) return

  isRegenerating.value = true
  errorMessage.value = null

  try {
    emit('regenerate', {
      customInstructions: customInstructions.value,
      regenerate: { ...regenerate.value },
      preserve: { ...preserve.value }
    })
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to regenerate slide'
  } finally {
    isRegenerating.value = false
  }
}

// Expose for parent to control loading state
defineExpose({
  setRegenerating: (value: boolean) => { isRegenerating.value = value },
  setError: (error: string | null) => { errorMessage.value = error }
})
</script>
