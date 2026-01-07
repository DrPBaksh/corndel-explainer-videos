<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="font-semibold text-gray-900">Animations</h3>
      <label class="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          v-model="animationsEnabled"
          @change="toggleAnimations"
          class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <span class="text-gray-700">Enable</span>
      </label>
    </div>

    <div v-if="!slide" class="text-sm text-gray-500">
      No slide selected
    </div>

    <div v-else-if="animationsEnabled" class="space-y-4">
      <!-- Timeline Preview -->
      <div class="bg-gray-100 rounded-lg p-3">
        <div class="text-xs font-medium text-gray-500 mb-2">Timeline</div>
        <div class="relative h-20 bg-gray-200 rounded overflow-hidden">
          <!-- Time markers -->
          <div class="absolute top-0 left-0 right-0 h-4 bg-gray-300 flex text-[10px] text-gray-600">
            <div
              v-for="i in Math.ceil(slideDuration)"
              :key="i"
              class="flex-1 border-r border-gray-400 px-1"
            >
              {{ i - 1 }}s
            </div>
          </div>

          <!-- Animation bars -->
          <div class="absolute top-5 left-0 right-0 bottom-1 px-1">
            <div
              v-for="(element, index) in elementsWithAnimations"
              :key="element.id"
              class="absolute h-3 rounded text-[9px] text-white truncate px-1 cursor-pointer hover:opacity-80"
              :class="getBarColor(element.type)"
              :style="getBarStyle(element, index)"
              @click="selectElement(element.id)"
            >
              {{ element.type }}
            </div>
          </div>

          <!-- Playhead -->
          <div
            v-if="previewTime !== null"
            class="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
            :style="{ left: `${(previewTime / slideDuration) * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- Element Animation List -->
      <div class="space-y-2">
        <div class="text-xs font-medium text-gray-500">Element Animations</div>
        <div
          v-for="element in slide.elements"
          :key="element.id"
          class="border rounded-lg p-3 transition-colors"
          :class="{
            'border-primary-500 bg-primary-50': selectedElementId === element.id,
            'border-gray-200 hover:border-gray-300': selectedElementId !== element.id
          }"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium capitalize">{{ element.type }}</span>
            <button
              @click="selectElement(element.id)"
              class="text-xs text-primary-600 hover:underline"
            >
              {{ selectedElementId === element.id ? 'Editing' : 'Edit' }}
            </button>
          </div>

          <div class="flex items-center gap-2">
            <select
              :value="getElementAnimation(element.id)?.type || 'none'"
              @change="updateAnimationType(element.id, ($event.target as HTMLSelectElement).value)"
              class="input text-sm flex-1"
            >
              <optgroup label="No Animation">
                <option value="none">None</option>
              </optgroup>
              <optgroup label="Entrance">
                <option value="fade-in">Fade In</option>
                <option value="slide-left">Slide from Left</option>
                <option value="slide-right">Slide from Right</option>
                <option value="slide-up">Slide Up</option>
                <option value="slide-down">Slide Down</option>
                <option value="scale-in">Scale In</option>
                <option value="zoom-in">Zoom In</option>
                <option value="bounce">Bounce</option>
              </optgroup>
              <optgroup label="Text Effects" v-if="element.type !== 'image'">
                <option value="typewriter">Typewriter</option>
              </optgroup>
              <optgroup label="Emphasis">
                <option value="pop">Pop</option>
                <option value="highlight">Highlight</option>
                <option value="glow-pulse">Glow Pulse</option>
                <option value="shake">Shake</option>
                <option value="wobble">Wobble</option>
              </optgroup>
            </select>
          </div>

          <!-- Expanded Animation Settings -->
          <div v-if="selectedElementId === element.id && getElementAnimation(element.id)" class="mt-3 space-y-3 pt-3 border-t border-gray-200">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-gray-500 block mb-1">Start Time (s)</label>
                <input
                  type="number"
                  :value="getElementAnimation(element.id)?.startTime ?? 0"
                  @change="updateAnimationProperty(element.id, 'startTime', parseFloat(($event.target as HTMLInputElement).value))"
                  class="input text-sm"
                  min="0"
                  :max="slideDuration"
                  step="0.1"
                />
              </div>
              <div>
                <label class="text-xs text-gray-500 block mb-1">Duration (s)</label>
                <input
                  type="number"
                  :value="getElementAnimation(element.id)?.duration ?? 0.5"
                  @change="updateAnimationProperty(element.id, 'duration', parseFloat(($event.target as HTMLInputElement).value))"
                  class="input text-sm"
                  min="0.1"
                  max="5"
                  step="0.1"
                />
              </div>
            </div>

            <div>
              <label class="text-xs text-gray-500 block mb-1">Easing</label>
              <select
                :value="getElementAnimation(element.id)?.easing ?? 'ease-out'"
                @change="updateAnimationProperty(element.id, 'easing', ($event.target as HTMLSelectElement).value)"
                class="input text-sm w-full"
              >
                <option value="linear">Linear</option>
                <option value="ease-in">Ease In (Slow Start)</option>
                <option value="ease-out">Ease Out (Slow End)</option>
                <option value="ease-in-out">Ease In/Out</option>
                <option value="bounce">Bounce</option>
                <option value="elastic">Elastic</option>
              </select>
            </div>

            <!-- Animation-specific options -->
            <div v-if="['shake', 'wobble'].includes(getElementAnimation(element.id)?.type || '')">
              <label class="text-xs text-gray-500 block mb-1">Intensity</label>
              <select
                :value="getElementAnimation(element.id)?.intensity ?? 'medium'"
                @change="updateAnimationProperty(element.id, 'intensity', ($event.target as HTMLSelectElement).value)"
                class="input text-sm w-full"
              >
                <option value="light">Light</option>
                <option value="medium">Medium</option>
                <option value="strong">Strong</option>
              </select>
            </div>

            <div v-if="getElementAnimation(element.id)?.type === 'highlight'">
              <label class="text-xs text-gray-500 block mb-1">Highlight Color</label>
              <input
                type="color"
                :value="getElementAnimation(element.id)?.highlightColor ?? '#ffeb3b'"
                @change="updateAnimationProperty(element.id, 'highlightColor', ($event.target as HTMLInputElement).value)"
                class="w-full h-8 rounded cursor-pointer"
              />
            </div>

            <button
              @click="removeAnimation(element.id)"
              class="text-xs text-red-600 hover:text-red-700"
            >
              Remove Animation
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Presets -->
      <div class="border-t pt-4">
        <div class="text-xs font-medium text-gray-500 mb-2">Quick Presets</div>
        <div class="grid grid-cols-2 gap-2">
          <button @click="applyPreset('sequential')" class="btn-secondary text-xs">
            Sequential Build
          </button>
          <button @click="applyPreset('stagger')" class="btn-secondary text-xs">
            Staggered Entry
          </button>
          <button @click="applyPreset('all-fade')" class="btn-secondary text-xs">
            All Fade In
          </button>
          <button @click="applyPreset('emphasis')" class="btn-secondary text-xs">
            Emphasis First
          </button>
          <button @click="applyPreset('clear')" class="btn-secondary text-xs col-span-2">
            Clear All Animations
          </button>
        </div>
      </div>

      <!-- Slide Transition -->
      <div class="border-t pt-4">
        <div class="text-xs font-medium text-gray-500 mb-2">Transition to Next Slide</div>
        <div class="flex gap-2">
          <select
            :value="slide.transition?.type ?? 'cut'"
            @change="updateTransition('type', ($event.target as HTMLSelectElement).value)"
            class="input text-sm flex-1"
          >
            <option value="cut">Cut (Instant)</option>
            <option value="fade">Fade</option>
            <option value="dissolve">Dissolve</option>
            <option value="slide-left">Slide Left</option>
            <option value="slide-right">Slide Right</option>
            <option value="wipe">Wipe</option>
            <option value="zoom">Zoom</option>
          </select>
          <input
            type="number"
            :value="slide.transition?.duration ?? 0.3"
            @change="updateTransition('duration', parseFloat(($event.target as HTMLInputElement).value))"
            class="input text-sm w-20"
            min="0.1"
            max="2"
            step="0.1"
            placeholder="Duration"
          />
        </div>
      </div>

      <!-- Audio Sync -->
      <div class="border-t pt-4">
        <div class="flex items-center justify-between mb-2">
          <div class="text-xs font-medium text-gray-500">Audio Delay</div>
          <span class="text-xs text-gray-600">{{ (slide.audioDelay ?? 0.5).toFixed(1) }}s</span>
        </div>
        <input
          type="range"
          :value="slide.audioDelay ?? 0.5"
          @input="updateAudioDelay(parseFloat(($event.target as HTMLInputElement).value))"
          class="w-full accent-primary-600"
          min="0"
          max="2"
          step="0.1"
        />
        <div class="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>0s (immediate)</span>
          <span>2s (delayed)</span>
        </div>
        <p class="text-[10px] text-gray-500 mt-2">
          Delays narration start to let animations complete before audio begins.
        </p>
      </div>

      <!-- Preview Button -->
      <button
        @click="startPreview"
        class="btn-primary w-full flex items-center justify-center gap-2"
        :disabled="isPreviewPlaying"
      >
        <svg v-if="!isPreviewPlaying" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
        <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        {{ isPreviewPlaying ? 'Playing...' : 'Preview Animations' }}
      </button>
    </div>

    <div v-else class="text-sm text-gray-500 text-center py-4">
      Enable animations to configure element entry effects for this slide.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import type { Slide, SlideElement, ElementAnimation, AnimationType, SlideTransition } from '@shared/types'
import { applyAnimationPreset, type AnimationPreset } from '@shared/animationUtils'

const props = defineProps<{
  slide: Slide | null
}>()

const emit = defineEmits<{
  update: [updates: Partial<Slide>]
  updateElement: [elementId: string, animation: ElementAnimation | null]
  preview: [time: number | null]
}>()

const animationsEnabled = ref(true)
const selectedElementId = ref<string | null>(null)
const previewTime = ref<number | null>(null)
const isPreviewPlaying = ref(false)
let previewInterval: ReturnType<typeof setInterval> | null = null

const slideDuration = computed(() => {
  return props.slide?.audioDuration || props.slide?.duration || 5
})

const elementsWithAnimations = computed(() => {
  if (!props.slide) return []
  return props.slide.elements.filter(e => e.animation && e.animation.type !== 'none')
})

watch(() => props.slide, (newSlide) => {
  if (newSlide) {
    animationsEnabled.value = newSlide.animationsEnabled ?? true
    selectedElementId.value = null
    stopPreview()
  }
}, { immediate: true })

onUnmounted(() => {
  stopPreview()
})

function toggleAnimations() {
  emit('update', { animationsEnabled: animationsEnabled.value })
}

function selectElement(elementId: string) {
  selectedElementId.value = selectedElementId.value === elementId ? null : elementId
}

function getElementAnimation(elementId: string): ElementAnimation | null {
  const element = props.slide?.elements.find(e => e.id === elementId)
  return element?.animation ?? null
}

function updateAnimationType(elementId: string, type: string) {
  if (type === 'none') {
    emit('updateElement', elementId, null)
    return
  }

  const existing = getElementAnimation(elementId)
  const animation: ElementAnimation = {
    id: existing?.id || `anim_${elementId}`,
    elementId,
    type: type as AnimationType,
    startTime: existing?.startTime ?? 0,
    duration: existing?.duration ?? 0.5,
    easing: existing?.easing ?? 'ease-out'
  }
  emit('updateElement', elementId, animation)
}

function updateAnimationProperty(elementId: string, property: string, value: any) {
  const existing = getElementAnimation(elementId)
  if (!existing) return

  const updated: ElementAnimation = {
    ...existing,
    [property]: value
  }
  emit('updateElement', elementId, updated)
}

function removeAnimation(elementId: string) {
  emit('updateElement', elementId, null)
  if (selectedElementId.value === elementId) {
    selectedElementId.value = null
  }
}

function applyPreset(preset: AnimationPreset) {
  if (!props.slide) return

  const elementIds = props.slide.elements.map(e => e.id)
  const animations = applyAnimationPreset(preset, elementIds, slideDuration.value)

  // Clear all animations first if preset is 'clear'
  if (preset === 'clear') {
    for (const element of props.slide.elements) {
      emit('updateElement', element.id, null)
    }
    return
  }

  // Apply new animations
  for (const element of props.slide.elements) {
    const animation = animations.find(a => a.elementId === element.id)
    emit('updateElement', element.id, animation || null)
  }
}

function updateTransition(property: string, value: any) {
  const existing = props.slide?.transition
  const transition: SlideTransition = {
    type: existing?.type ?? 'cut',
    duration: existing?.duration ?? 0.3,
    [property]: value
  }
  emit('update', { transition })
}

function updateAudioDelay(delay: number) {
  // Clamp between 0 and 2 seconds
  const clampedDelay = Math.max(0, Math.min(2, delay))
  emit('update', { audioDelay: clampedDelay })
}

function getBarColor(elementType: string): string {
  const colors: Record<string, string> = {
    headline: 'bg-blue-500',
    subheadline: 'bg-cyan-500',
    body: 'bg-green-500',
    bullets: 'bg-amber-500',
    image: 'bg-purple-500'
  }
  return colors[elementType] || 'bg-gray-500'
}

function getBarStyle(element: SlideElement, index: number): Record<string, string> {
  const animation = element.animation
  if (!animation) return { display: 'none' }

  const startPercent = (animation.startTime / slideDuration.value) * 100
  const widthPercent = (animation.duration / slideDuration.value) * 100
  const top = 4 + index * 14

  return {
    left: `${Math.max(0, Math.min(100 - widthPercent, startPercent))}%`,
    width: `${Math.max(5, Math.min(100, widthPercent))}%`,
    top: `${top}px`
  }
}

function startPreview() {
  if (isPreviewPlaying.value) {
    stopPreview()
    return
  }

  isPreviewPlaying.value = true
  previewTime.value = 0
  emit('preview', 0)

  const fps = 30
  const interval = 1000 / fps

  previewInterval = setInterval(() => {
    if (previewTime.value === null) {
      stopPreview()
      return
    }

    previewTime.value += 1 / fps

    if (previewTime.value >= slideDuration.value) {
      stopPreview()
      return
    }

    emit('preview', previewTime.value)
  }, interval)
}

function stopPreview() {
  if (previewInterval) {
    clearInterval(previewInterval)
    previewInterval = null
  }
  isPreviewPlaying.value = false
  previewTime.value = null
  emit('preview', null)
}
</script>
