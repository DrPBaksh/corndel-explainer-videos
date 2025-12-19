<template>
  <div class="space-y-4">
    <h3 class="font-semibold text-gray-900">Background</h3>

    <div v-if="!slide" class="text-sm text-gray-500">
      No slide selected
    </div>

    <div v-else class="space-y-4">
      <!-- Background Type -->
      <div>
        <label class="label">Type</label>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="type in backgroundTypes"
            :key="type.value"
            @click="selectedType = type.value"
            class="p-2 border rounded-lg text-sm transition-colors"
            :class="selectedType === type.value
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-gray-200 hover:border-gray-300'"
          >
            {{ type.label }}
          </button>
        </div>
      </div>

      <!-- Solid Color -->
      <div v-if="selectedType === 'solid'" class="space-y-3">
        <div>
          <label class="label">Color</label>
          <div class="flex gap-2">
            <input
              v-model="solidColor"
              type="color"
              class="w-12 h-10 rounded cursor-pointer"
            />
            <input
              v-model="solidColor"
              type="text"
              class="input flex-1"
              placeholder="#ffffff"
            />
          </div>
        </div>

        <!-- Color presets -->
        <div class="grid grid-cols-6 gap-2">
          <button
            v-for="color in colorPresets"
            :key="color"
            @click="solidColor = color"
            class="w-8 h-8 rounded border border-gray-200"
            :style="{ backgroundColor: color }"
          ></button>
        </div>

        <button @click="applySolid" class="btn-primary w-full">
          Apply Color
        </button>
      </div>

      <!-- Gradient -->
      <div v-if="selectedType === 'gradient'" class="space-y-3">
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="label">From</label>
            <input
              v-model="gradientFrom"
              type="color"
              class="w-full h-10 rounded cursor-pointer"
            />
          </div>
          <div>
            <label class="label">To</label>
            <input
              v-model="gradientTo"
              type="color"
              class="w-full h-10 rounded cursor-pointer"
            />
          </div>
        </div>

        <div>
          <label class="label">Direction</label>
          <select v-model="gradientDirection" class="input">
            <option value="to bottom">Top to Bottom</option>
            <option value="to top">Bottom to Top</option>
            <option value="to right">Left to Right</option>
            <option value="to left">Right to Left</option>
            <option value="to bottom right">Diagonal ↘</option>
            <option value="to bottom left">Diagonal ↙</option>
          </select>
        </div>

        <!-- Gradient preview -->
        <div
          class="h-16 rounded-lg border border-gray-200"
          :style="{ background: gradientPreview }"
        ></div>

        <!-- Gradient presets -->
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="preset in gradientPresets"
            :key="preset.name"
            @click="applyGradientPreset(preset)"
            class="h-10 rounded border border-gray-200"
            :style="{ background: preset.value }"
          ></button>
        </div>

        <button @click="applyGradient" class="btn-primary w-full">
          Apply Gradient
        </button>
      </div>

      <!-- Image Background -->
      <div v-if="selectedType === 'image'" class="space-y-3">
        <!-- Current background preview -->
        <div v-if="slide.backgroundImagePath" class="space-y-2">
          <label class="label">Current Background</label>
          <div
            class="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-300"
            :style="backgroundPreviewStyle"
          ></div>

          <!-- Size Control -->
          <div class="space-y-2">
            <label class="label">Scale Size</label>
            <div class="flex gap-2 items-center flex-wrap">
              <input
                v-model="bgSize"
                type="text"
                class="input w-24"
                placeholder="e.g. 120%"
                @keyup.enter="applyImageSettings"
              />
              <button
                @click="applyImageSettings()"
                class="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1.5 rounded"
              >Apply</button>
              <button
                @click="bgSize = 'cover'; applyImageSettings()"
                class="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm px-3 py-1.5 rounded"
              >Cover</button>
              <button
                @click="bgSize = 'contain'; applyImageSettings()"
                class="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm px-3 py-1.5 rounded"
              >Fit</button>
            </div>
            <p class="text-xs text-gray-500">Enter a percentage (e.g. 50%, 150%) or use cover/fit</p>
          </div>

          <!-- Position Control -->
          <div class="space-y-2">
            <label class="label">Position</label>
            <div class="grid grid-cols-3 gap-1 w-32 mx-auto">
              <button
                v-for="pos in positionPresets"
                :key="pos.value"
                @click="bgPosition = pos.value; applyImageSettings()"
                class="p-2 border rounded text-xs hover:bg-gray-100"
                :class="bgPosition === pos.value ? 'bg-blue-100 border-blue-500 text-blue-700' : 'border-gray-300'"
              >
                {{ pos.label }}
              </button>
            </div>
          </div>
        </div>

        <div v-else class="text-sm text-gray-500 italic">
          Select a background image first to adjust size and position
        </div>

        <!-- Fine-tune position -->
        <div v-if="slide.backgroundImagePath" class="space-y-2">
          <label class="label">Fine-tune Position</label>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="text-xs text-gray-500">X Offset</label>
                <input
                  v-model.number="bgOffsetX"
                  type="number"
                  class="w-16 text-xs text-center border rounded px-1 py-0.5"
                  min="-50"
                  max="50"
                  @change="applyImageSettings"
                />
              </div>
              <input
                :value="bgOffsetX"
                type="range"
                min="-50"
                max="50"
                step="1"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                @input="bgOffsetX = Number(($event.target as HTMLInputElement).value); applyImageSettings()"
              />
            </div>
            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="text-xs text-gray-500">Y Offset</label>
                <input
                  v-model.number="bgOffsetY"
                  type="number"
                  class="w-16 text-xs text-center border rounded px-1 py-0.5"
                  min="-50"
                  max="50"
                  @change="applyImageSettings"
                />
              </div>
              <input
                :value="bgOffsetY"
                type="range"
                min="-50"
                max="50"
                step="1"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                @input="bgOffsetY = Number(($event.target as HTMLInputElement).value); applyImageSettings()"
              />
            </div>
          </div>
          <button
            @click="bgOffsetX = 0; bgOffsetY = 0; applyImageSettings()"
            class="btn-secondary text-xs w-full"
          >
            Reset Offsets
          </button>
        </div>

        <button @click="selectBackgroundImage" class="btn-secondary w-full">
          Choose Image File
        </button>

        <div>
          <label class="label">Reference Images</label>
          <div v-if="referenceImages.length > 0" class="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            <div
              v-for="img in referenceImages"
              :key="img.path"
              @click="applyReferenceBackground(img.path)"
              class="aspect-video bg-gray-100 rounded cursor-pointer hover:ring-2 hover:ring-primary-500 overflow-hidden relative group"
            >
              <img
                :src="encodeFilePath(img.path)"
                class="w-full h-full object-cover"
                :alt="img.name"
                @error="handleImageError($event, img)"
              />
              <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                <span class="text-white text-xs opacity-0 group-hover:opacity-100">Apply</span>
              </div>
            </div>
          </div>
          <div v-else class="text-sm text-gray-500">
            No reference images found
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { Slide } from '@shared/types'

const props = defineProps<{
  slide: Slide | null
}>()

const emit = defineEmits<{
  'update-background': [type: 'solid' | 'gradient' | 'image', value: string, options?: { size?: string; position?: string }]
}>()

interface ReferenceImage {
  name: string
  path: string
}

const selectedType = ref<'solid' | 'gradient' | 'image'>('solid')
const solidColor = ref('#ffffff')
const gradientFrom = ref('#6366f1')
const gradientTo = ref('#8b5cf6')
const gradientDirection = ref('to bottom')
const referenceImages = ref<ReferenceImage[]>([])

// Image background settings
const bgSize = ref('cover')
const bgPosition = ref('center')
const bgOffsetX = ref(0)
const bgOffsetY = ref(0)

const backgroundTypes = [
  { value: 'solid' as const, label: 'Solid' },
  { value: 'gradient' as const, label: 'Gradient' },
  { value: 'image' as const, label: 'Image' }
]

const colorPresets = [
  '#ffffff', '#f3f4f6', '#1f2937', '#111827',
  '#fef2f2', '#fef3c7', '#ecfdf5', '#eff6ff',
  '#fdf4ff', '#f5f3ff', '#6366f1', '#8b5cf6'
]

const gradientPresets = [
  { name: 'Sunset', value: 'linear-gradient(to bottom right, #f97316, #ec4899)' },
  { name: 'Ocean', value: 'linear-gradient(to bottom, #0ea5e9, #6366f1)' },
  { name: 'Forest', value: 'linear-gradient(to bottom, #22c55e, #14b8a6)' },
  { name: 'Night', value: 'linear-gradient(to bottom, #1e293b, #0f172a)' },
  { name: 'Purple', value: 'linear-gradient(to bottom right, #6366f1, #8b5cf6)' },
  { name: 'Warm', value: 'linear-gradient(to bottom, #fef3c7, #fde68a)' }
]

const positionPresets = [
  { value: 'top left', label: '↖' },
  { value: 'top center', label: '↑' },
  { value: 'top right', label: '↗' },
  { value: 'center left', label: '←' },
  { value: 'center', label: '•' },
  { value: 'center right', label: '→' },
  { value: 'bottom left', label: '↙' },
  { value: 'bottom center', label: '↓' },
  { value: 'bottom right', label: '↘' }
]

const gradientPreview = computed(() =>
  `linear-gradient(${gradientDirection.value}, ${gradientFrom.value}, ${gradientTo.value})`
)

const backgroundPreviewStyle = computed(() => {
  if (!props.slide?.backgroundImagePath) return {}

  // Calculate position with offsets
  let position = bgPosition.value
  if (bgOffsetX.value !== 0 || bgOffsetY.value !== 0) {
    const posMap: Record<string, [number, number]> = {
      'top left': [0, 0], 'top center': [50, 0], 'top right': [100, 0],
      'center left': [0, 50], 'center': [50, 50], 'center right': [100, 50],
      'bottom left': [0, 100], 'bottom center': [50, 100], 'bottom right': [100, 100]
    }
    const [baseX, baseY] = posMap[bgPosition.value] || [50, 50]
    position = `${baseX + bgOffsetX.value}% ${baseY + bgOffsetY.value}%`
  }

  return {
    backgroundImage: `url(${encodeFilePath(props.slide.backgroundImagePath)})`,
    backgroundSize: bgSize.value,
    backgroundPosition: position,
    backgroundRepeat: 'no-repeat'
  }
})

// Encode file path for use in file:// URLs (handles spaces and special chars)
function encodeFilePath(path: string): string {
  // Convert backslashes to forward slashes and encode special characters
  const normalizedPath = path.replace(/\\/g, '/')
  // Encode the path but preserve forward slashes
  const encoded = normalizedPath.split('/').map(part => encodeURIComponent(part)).join('/')
  return `file://${encoded}`
}

function handleImageError(event: Event, img: ReferenceImage) {
  console.error('Failed to load image:', img.path)
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

onMounted(async () => {
  await loadReferenceImages()
})

watch(() => props.slide, (newSlide) => {
  if (newSlide) {
    selectedType.value = newSlide.backgroundType || 'solid'
    if (newSlide.backgroundColor) {
      solidColor.value = newSlide.backgroundColor
    }
    // Load existing image background settings
    if (newSlide.backgroundSize) {
      bgSize.value = newSlide.backgroundSize
    } else {
      bgSize.value = 'cover'
    }
    if (newSlide.backgroundPosition) {
      // Parse position - extract the base position (ignore offset calc)
      const pos = newSlide.backgroundPosition
      const basePos = pos.replace(/calc\(|\s*[\+\-]\s*[\d\.\-%]+\s*[\d\.\-%]*\)/g, '').trim()
      bgPosition.value = basePos || 'center'
    } else {
      bgPosition.value = 'center'
    }
    bgOffsetX.value = 0
    bgOffsetY.value = 0
  }
}, { immediate: true })

async function loadReferenceImages() {
  try {
    const images = await window.electronAPI.getBundledReferenceImages()
    referenceImages.value = images.map(img => ({
      name: img.fileName,
      path: img.filePath
    }))
    console.log('Loaded reference images:', referenceImages.value.length)
  } catch (error) {
    console.error('Failed to load reference images:', error)
  }
}

function applySolid() {
  emit('update-background', 'solid', solidColor.value)
}

function applyGradient() {
  emit('update-background', 'gradient', gradientPreview.value)
}

function applyGradientPreset(preset: { name: string; value: string }) {
  emit('update-background', 'gradient', preset.value)
}

function applyImageSettings() {
  if (props.slide?.backgroundImagePath) {
    // Build position string - just use base position if no offsets
    let position = bgPosition.value
    if (bgOffsetX.value !== 0 || bgOffsetY.value !== 0) {
      // Convert named positions to percentages and add offsets
      const posMap: Record<string, [number, number]> = {
        'top left': [0, 0], 'top center': [50, 0], 'top right': [100, 0],
        'center left': [0, 50], 'center': [50, 50], 'center right': [100, 50],
        'bottom left': [0, 100], 'bottom center': [50, 100], 'bottom right': [100, 100]
      }
      const [baseX, baseY] = posMap[bgPosition.value] || [50, 50]
      position = `${baseX + bgOffsetX.value}% ${baseY + bgOffsetY.value}%`
    }
    emit('update-background', 'image', props.slide.backgroundImagePath, {
      size: bgSize.value,
      position
    })
  }
}

async function selectBackgroundImage() {
  try {
    const result = await window.electronAPI.selectOutputFolder()
    if (result) {
      // This should be selectImage, but we don't have that yet
      // For now, just log
      console.log('Selected folder:', result)
    }
  } catch (error) {
    console.error('Failed to select background image:', error)
  }
}

function applyReferenceBackground(path: string) {
  // Reset position settings when applying new image
  bgSize.value = 'cover'
  bgPosition.value = 'center'
  bgOffsetX.value = 0
  bgOffsetY.value = 0
  emit('update-background', 'image', path)
}
</script>
