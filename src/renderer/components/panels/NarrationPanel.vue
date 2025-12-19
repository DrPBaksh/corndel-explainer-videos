<template>
  <div class="space-y-4">
    <h3 class="font-semibold text-gray-900">Narration</h3>

    <div v-if="!slide" class="text-sm text-gray-500">
      No slide selected
    </div>

    <div v-else class="space-y-4">
      <!-- Narration Text -->
      <div>
        <label class="label">Narration Script</label>
        <textarea
          v-model="localNarration"
          class="input min-h-[200px]"
          placeholder="Enter the narration text for this slide..."
          @blur="emitUpdate"
        ></textarea>
      </div>

      <!-- Stats -->
      <div class="bg-gray-50 rounded-lg p-3 space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">Word count:</span>
          <span class="font-medium text-gray-900">{{ wordCount }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">Estimated duration:</span>
          <span class="font-medium text-gray-900">{{ estimatedDuration }}s</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">Target duration:</span>
          <span class="font-medium text-gray-900">{{ slide.duration }}s</span>
        </div>
        <div v-if="durationDiff !== 0" class="text-xs" :class="durationClass">
          {{ durationDiff > 0 ? '+' : '' }}{{ durationDiff }}s {{ durationDiff > 0 ? 'over' : 'under' }} target
        </div>
      </div>

      <!-- Tips -->
      <div class="space-y-2">
        <h4 class="text-sm font-medium text-gray-700">Writing Tips</h4>
        <ul class="text-xs text-gray-600 space-y-1">
          <li class="flex items-start gap-2">
            <span class="text-primary-500">•</span>
            Average speaking rate: ~150 words/minute
          </li>
          <li class="flex items-start gap-2">
            <span class="text-primary-500">•</span>
            Keep sentences concise and clear
          </li>
          <li class="flex items-start gap-2">
            <span class="text-primary-500">•</span>
            Match narration to visual content
          </li>
          <li class="flex items-start gap-2">
            <span class="text-primary-500">•</span>
            Use pauses for emphasis (add "...")
          </li>
        </ul>
      </div>

      <!-- AI Suggestions -->
      <div>
        <button
          @click="generateNarration"
          :disabled="generating"
          class="btn-secondary w-full"
        >
          {{ generating ? 'Generating...' : 'Generate with AI' }}
        </button>
        <p class="text-xs text-gray-500 mt-1 text-center">
          Uses context from slide content
        </p>
      </div>

      <!-- Duration Adjustment -->
      <div>
        <label class="label">Adjust Duration</label>
        <div class="flex items-center gap-2">
          <input
            v-model.number="localDuration"
            type="range"
            min="5"
            max="60"
            class="flex-1"
          />
          <span class="text-sm font-medium text-gray-900 w-12 text-right">{{ localDuration }}s</span>
        </div>
        <button
          @click="updateDuration"
          class="btn-secondary w-full mt-2 text-sm"
        >
          Update Duration
        </button>
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
  'update-narration': [narration: string]
}>()

const localNarration = ref('')
const localDuration = ref(10)
const generating = ref(false)

watch(() => props.slide, (newSlide) => {
  if (newSlide) {
    localNarration.value = newSlide.narration || ''
    localDuration.value = newSlide.duration || 10
  }
}, { immediate: true })

const wordCount = computed(() => {
  if (!localNarration.value.trim()) return 0
  return localNarration.value.trim().split(/\s+/).length
})

const estimatedDuration = computed(() => {
  // Average speaking rate: ~150 words per minute = 2.5 words per second
  return Math.ceil(wordCount.value / 2.5)
})

const durationDiff = computed(() => {
  if (!props.slide) return 0
  return estimatedDuration.value - props.slide.duration
})

const durationClass = computed(() => {
  if (Math.abs(durationDiff.value) <= 2) return 'text-green-600'
  if (Math.abs(durationDiff.value) <= 5) return 'text-yellow-600'
  return 'text-red-600'
})

function emitUpdate() {
  emit('update-narration', localNarration.value)
}

async function generateNarration() {
  if (!props.slide) return

  generating.value = true
  try {
    const context = {
      headline: props.slide.headline,
      subheadline: props.slide.subheadline,
      bodyText: props.slide.bodyText,
      bullets: props.slide.bullets,
      duration: props.slide.duration
    }

    const result = await window.electronAPI.generateNarration(context)
    if (result.success && result.data) {
      localNarration.value = result.data
      emitUpdate()
    }
  } catch (error) {
    console.error('Narration generation failed:', error)
  } finally {
    generating.value = false
  }
}

async function updateDuration() {
  // This would update the slide duration
  // For now, just a placeholder
  console.log('Update duration to:', localDuration.value)
}
</script>
