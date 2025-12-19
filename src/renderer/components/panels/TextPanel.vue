<template>
  <div class="space-y-4">
    <h3 class="font-semibold text-gray-900">Text Content</h3>

    <div v-if="!slide" class="text-sm text-gray-500">
      No slide selected
    </div>

    <div v-else class="space-y-4">
      <!-- Headline -->
      <div>
        <label class="label">Headline</label>
        <input
          v-model="localHeadline"
          type="text"
          class="input"
          placeholder="Main headline"
          @input="debouncedUpdate"
        />
      </div>

      <!-- Subheadline -->
      <div>
        <label class="label">Subheadline</label>
        <input
          v-model="localSubheadline"
          type="text"
          class="input"
          placeholder="Supporting text"
          @input="debouncedUpdate"
        />
      </div>

      <!-- Body Text -->
      <div>
        <label class="label">Body Text</label>
        <textarea
          v-model="localBodyText"
          class="input min-h-[80px]"
          placeholder="Main body content"
          @input="debouncedUpdate"
        ></textarea>
      </div>

      <!-- Bullets -->
      <div>
        <label class="label">Bullet Points</label>
        <div class="space-y-2">
          <div
            v-for="(bullet, index) in localBullets"
            :key="index"
            class="flex gap-2"
          >
            <input
              v-model="localBullets[index]"
              type="text"
              class="input flex-1"
              :placeholder="`Bullet ${index + 1}`"
              @input="debouncedUpdate"
            />
            <button
              @click="removeBullet(index)"
              class="btn-icon text-gray-400 hover:text-red-500"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <button @click="addBullet" class="btn-secondary text-sm w-full">
            Add Bullet Point
          </button>
        </div>
      </div>

      <!-- Layout selector -->
      <div>
        <label class="label">Layout</label>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="layout in layouts"
            :key="layout.value"
            @click="setLayout(layout.value)"
            class="p-2 border rounded-lg text-xs text-center transition-colors"
            :class="slide.layout === layout.value
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-gray-200 hover:border-gray-300'"
          >
            {{ layout.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Slide, LayoutType } from '@shared/types'

const props = defineProps<{
  slide: Slide | null
}>()

const emit = defineEmits<{
  update: [updates: {
    headline?: string | null
    subheadline?: string | null
    bodyText?: string | null
    bullets?: string[] | null
  }]
}>()

const localHeadline = ref('')
const localSubheadline = ref('')
const localBodyText = ref('')
const localBullets = ref<string[]>([])

const layouts: { value: LayoutType; label: string }[] = [
  { value: 'title-center', label: 'Title Center' },
  { value: 'title-left', label: 'Title Left' },
  { value: 'split-left', label: 'Split Left' },
  { value: 'split-right', label: 'Split Right' },
  { value: 'full-image', label: 'Full Image' },
  { value: 'bullets-left', label: 'Bullets Left' }
]

// Debounce timer
let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(() => props.slide, (newSlide) => {
  if (newSlide) {
    localHeadline.value = newSlide.headline || ''
    localSubheadline.value = newSlide.subheadline || ''
    localBodyText.value = newSlide.bodyText || ''
    localBullets.value = newSlide.bullets?.length ? [...newSlide.bullets] : ['']
  }
}, { immediate: true })

function emitUpdate() {
  emit('update', {
    headline: localHeadline.value || null,
    subheadline: localSubheadline.value || null,
    bodyText: localBodyText.value || null,
    bullets: localBullets.value.filter(b => b.trim()).length > 0
      ? localBullets.value.filter(b => b.trim())
      : null
  })
}

// Debounced update for real-time typing
function debouncedUpdate() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    emitUpdate()
  }, 150)  // 150ms delay for smooth typing
}

function addBullet() {
  localBullets.value.push('')
}

function removeBullet(index: number) {
  localBullets.value.splice(index, 1)
  emitUpdate()
}

function setLayout(layout: LayoutType) {
  if (props.slide) {
    // This would need to go through the store
    // For now, just emit an update
  }
}
</script>
