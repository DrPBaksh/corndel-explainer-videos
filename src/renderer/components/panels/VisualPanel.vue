<template>
  <div class="space-y-4">
    <h3 class="font-semibold text-gray-900">Visual</h3>

    <div v-if="!slide" class="text-sm text-gray-500">
      No slide selected
    </div>

    <div v-else class="space-y-4">
      <!-- Current Visual -->
      <div v-if="slide.visualData?.imagePath" class="space-y-2">
        <label class="label">Current Visual</label>
        <div class="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
          <img
            :src="encodeFilePath(slide.visualData.imagePath)"
            class="w-full h-full"
            :style="visualPreviewStyle"
            alt="Current visual"
          />
        </div>
        <p class="text-xs text-gray-500">
          Type: {{ slide.visualData.type }}
          <span v-if="slide.visualData.source"> | Source: {{ slide.visualData.source }}</span>
        </p>

        <!-- Visual Scale/Fit Controls -->
        <div class="space-y-2 pt-2 border-t border-gray-200">
          <label class="label">Image Fit</label>
          <div class="flex gap-2 items-center flex-wrap">
            <input
              v-model="visualSize"
              type="text"
              class="input w-20"
              placeholder="100%"
              @keyup.enter="applyVisualSettings"
            />
            <button
              @click="applyVisualSettings"
              class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1.5 rounded"
            >Apply</button>
            <button
              @click="visualSize = 'cover'; applyVisualSettings()"
              class="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs px-2 py-1.5 rounded"
            >Cover</button>
            <button
              @click="visualSize = 'contain'; applyVisualSettings()"
              class="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs px-2 py-1.5 rounded"
            >Fit</button>
          </div>

          <!-- Position -->
          <label class="label">Position</label>
          <div class="grid grid-cols-3 gap-1 w-28 mx-auto">
            <button
              v-for="pos in positionPresets"
              :key="pos.value"
              @click="visualPosition = pos.value; applyVisualSettings()"
              class="p-1.5 border rounded text-xs hover:bg-gray-100"
              :class="visualPosition === pos.value ? 'bg-blue-100 border-blue-500' : 'border-gray-300'"
            >{{ pos.label }}</button>
          </div>
        </div>

        <button
          @click="clearVisual"
          class="text-red-500 hover:text-red-700 text-xs"
        >Remove Visual</button>
      </div>

      <!-- Visual Type Selector -->
      <div>
        <label class="label">Visual Type</label>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="type in visualTypes"
            :key="type.value"
            @click="selectedType = type.value"
            class="p-3 border rounded-lg text-sm transition-colors"
            :class="selectedType === type.value
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-gray-200 hover:border-gray-300'"
          >
            <div class="font-medium">{{ type.label }}</div>
            <div class="text-xs text-gray-500 mt-1">{{ type.description }}</div>
          </button>
        </div>
      </div>

      <!-- Pexels Search -->
      <div v-if="selectedType === 'stock-photo'" class="space-y-3">
        <div>
          <label class="label">Search Pexels</label>
          <div class="flex gap-2">
            <input
              v-model="pexelsQuery"
              type="text"
              class="input flex-1"
              placeholder="Search for images..."
              @keyup.enter="searchPexels"
            />
            <button
              @click="searchPexels"
              :disabled="pexelsLoading || !pexelsQuery.trim()"
              class="btn-primary"
            >
              {{ pexelsLoading ? '...' : 'Search' }}
            </button>
          </div>
        </div>

        <div v-if="pexelsResults.length > 0" class="grid grid-cols-2 gap-2">
          <div
            v-for="photo in pexelsResults"
            :key="photo.id"
            @click="selectPexelsPhoto(photo)"
            class="aspect-video bg-gray-100 rounded cursor-pointer hover:ring-2 hover:ring-primary-500 overflow-hidden"
          >
            <img
              :src="photo.thumbnail"
              class="w-full h-full object-cover"
              :alt="photo.alt"
            />
          </div>
        </div>
        <div v-else-if="pexelsQuery && !pexelsLoading" class="text-sm text-gray-500">
          No results found. Try a different search term.
        </div>
      </div>

      <!-- AI Image Generation -->
      <div v-if="selectedType === 'ai-generated'" class="space-y-3">
        <div>
          <label class="label">Model</label>
          <select v-model="selectedImageModel" class="input w-full">
            <option
              v-for="model in imageModels"
              :key="model.value"
              :value="model.value"
            >{{ model.label }}</option>
          </select>
          <p class="text-xs text-gray-500 mt-1">{{ selectedModelDescription }}</p>
        </div>
        <div>
          <label class="label">AI Image Prompt</label>
          <textarea
            v-model="genAIPrompt"
            class="input min-h-[100px]"
            placeholder="Describe the image you want to generate..."
          ></textarea>
          <p class="text-xs text-gray-500 mt-1">
            Suggested: {{ slide.geminiPrompt || 'No suggestion available' }}
          </p>
        </div>
        <button
          @click="generateImage"
          :disabled="genAILoading || !genAIPrompt.trim()"
          class="btn-primary w-full"
        >
          {{ genAILoading ? 'Generating...' : 'Generate Image' }}
        </button>
      </div>

      <!-- Diagram -->
      <div v-if="selectedType === 'diagram'" class="space-y-3">
        <div>
          <label class="label">Diagram Description</label>
          <textarea
            v-model="diagramDescription"
            class="input min-h-[100px]"
            placeholder="Describe the diagram structure..."
          ></textarea>
          <p class="text-xs text-gray-500 mt-1">
            Suggested: {{ slide.diagramDescription || 'No suggestion available' }}
          </p>
        </div>
        <button
          @click="generateDiagram"
          :disabled="diagramLoading || !diagramDescription.trim()"
          class="btn-primary w-full"
        >
          {{ diagramLoading ? 'Generating...' : 'Generate Diagram' }}
        </button>
      </div>

      <!-- Reference Images -->
      <div v-if="selectedType === 'reference'" class="space-y-3">
        <label class="label">Reference Images</label>
        <div v-if="referenceImages.length === 0" class="text-sm text-gray-500">
          Loading reference images...
        </div>
        <div v-else class="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
          <div
            v-for="img in referenceImages"
            :key="img.path"
            @click="selectReferenceImage(img)"
            class="aspect-video bg-gray-100 rounded cursor-pointer hover:ring-2 hover:ring-primary-500 overflow-hidden"
          >
            <img
              :src="encodeFilePath(img.path)"
              class="w-full h-full object-cover"
              :alt="img.name"
            />
          </div>
        </div>
      </div>

      <!-- Custom Upload -->
      <div v-if="selectedType === 'custom'" class="space-y-3">
        <button @click="uploadImage" class="btn-secondary w-full">
          Upload Image
        </button>
      </div>

      <!-- Image Gallery (previously used images) -->
      <div v-if="selectedType === 'gallery'" class="space-y-3">
        <label class="label">Previously Used Images</label>
        <div v-if="galleryImages.length === 0" class="text-sm text-gray-500">
          No images in gallery yet. Images you use will appear here.
        </div>
        <div v-else class="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
          <div
            v-for="img in galleryImages"
            :key="img.path"
            @click="selectGalleryImage(img)"
            class="aspect-video bg-gray-100 rounded cursor-pointer hover:ring-2 hover:ring-primary-500 overflow-hidden"
          >
            <img
              :src="encodeFilePath(img.path)"
              class="w-full h-full object-cover"
              :alt="img.name"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import type { Slide, VisualData, VisualType } from '@shared/types'

const props = defineProps<{
  slide: Slide | null
}>()

const emit = defineEmits<{
  'update-visual': [visualData: VisualData]
}>()

// Matches the PexelsImage type from backend
interface PexelsPhoto {
  id: number
  url: string        // large2x image
  thumbnail: string  // medium image for preview
  alt: string
  photographer: string
}

interface ReferenceImage {
  name: string
  path: string
}

// Use internal type names for the UI tabs
type VisualTabType = 'stock-photo' | 'ai-generated' | 'diagram' | 'reference' | 'gallery' | 'custom'

const selectedType = ref<VisualTabType>('stock-photo')
const pexelsQuery = ref('')
const pexelsLoading = ref(false)
const pexelsResults = ref<PexelsPhoto[]>([])
const genAIPrompt = ref('')
const genAILoading = ref(false)
const selectedImageModel = ref('flash')
const diagramDescription = ref('')
const diagramLoading = ref(false)
const referenceImages = ref<ReferenceImage[]>([])
const galleryImages = ref<ReferenceImage[]>([])

// Available image generation models
const imageModels = [
  {
    value: 'flash',
    label: 'Gemini 2.5 Flash',
    description: 'Fast, good quality images. Best for quick iterations. Cheaper.'
  },
  {
    value: 'pro',
    label: 'Gemini 3 Pro',
    description: 'Premium quality images. Slower but better results. More expensive.'
  }
]

// Get description for selected model
const selectedModelDescription = computed(() => {
  const model = imageModels.find(m => m.value === selectedImageModel.value)
  return model?.description || ''
})

// Visual size/position controls
const visualSize = ref('cover')
const visualPosition = ref('center')

const visualTypes = [
  { value: 'stock-photo' as VisualTabType, label: 'Stock Photo', description: 'Search Pexels' },
  { value: 'ai-generated' as VisualTabType, label: 'AI Generated', description: 'Create with GenAI' },
  { value: 'diagram' as VisualTabType, label: 'Diagram', description: 'Generate diagram' },
  { value: 'reference' as VisualTabType, label: 'Reference', description: 'Reference images' },
  { value: 'gallery' as VisualTabType, label: 'Gallery', description: 'Previously used' }
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

// Encode file path for use in file:// URLs (handles spaces and special chars)
function encodeFilePath(path: string): string {
  // Convert backslashes to forward slashes and encode special characters
  const normalizedPath = path.replace(/\\/g, '/')
  // Encode the path but preserve forward slashes
  const encoded = normalizedPath.split('/').map(part => encodeURIComponent(part)).join('/')
  return `file://${encoded}`
}

// Computed style for visual preview
const visualPreviewStyle = computed(() => {
  const size = visualSize.value
  const position = visualPosition.value

  if (size === 'cover' || size === 'contain') {
    return {
      objectFit: size as 'cover' | 'contain',
      objectPosition: position
    }
  } else {
    // Percentage or pixel value
    return {
      objectFit: 'none' as const,
      objectPosition: position,
      width: size,
      height: 'auto'
    }
  }
})

onMounted(async () => {
  await loadReferenceImages()
  await loadGalleryImages()
})

// Map VisualType to tab type
function visualTypeToTab(vt: VisualType | undefined): VisualTabType {
  if (!vt) return 'stock-photo'
  switch (vt) {
    case 'pexels': return 'stock-photo'
    case 'gemini': return 'ai-generated'
    case 'diagram': return 'diagram'
    case 'gallery': return 'gallery'
    default: return 'stock-photo'
  }
}

watch(() => props.slide, (newSlide) => {
  if (newSlide) {
    selectedType.value = visualTypeToTab(newSlide.visualType)
    pexelsQuery.value = newSlide.pexelsKeywords || ''
    genAIPrompt.value = newSlide.geminiPrompt || ''
    diagramDescription.value = newSlide.diagramDescription || ''
    // Load visual size/position from element if exists
    const imageEl = newSlide.elements?.find(e => e.type === 'image')
    if (imageEl?.styles) {
      visualSize.value = (imageEl.styles as any).objectFit || 'cover'
      visualPosition.value = (imageEl.styles as any).objectPosition || 'center'
    } else {
      visualSize.value = 'cover'
      visualPosition.value = 'center'
    }
  }
}, { immediate: true })

function applyVisualSettings() {
  if (!props.slide?.visualData?.imagePath) return

  // Re-emit the visual data with updated settings
  emit('update-visual', {
    ...props.slide.visualData,
    // Store size/position in metadata
    metadata: {
      ...(props.slide.visualData.metadata || {}),
      objectFit: visualSize.value,
      objectPosition: visualPosition.value
    }
  })
}

function clearVisual() {
  emit('update-visual', {
    type: 'none',
    imagePath: null,
    imageBase64: null,
    sourceUrl: null,
    generationPrompt: null,
    thumbnailPath: null
  })
}

async function loadGalleryImages() {
  try {
    console.log('Loading gallery images...')
    const images = await window.electronAPI.getGalleryImages()
    console.log('Gallery images from backend:', images)
    if (images && images.length > 0) {
      galleryImages.value = images.map((img: any) => ({
        name: img.fileName,
        path: img.filePath
      }))
      console.log('Gallery images loaded:', galleryImages.value.length)
    } else {
      console.log('No gallery images found')
      galleryImages.value = []
    }
  } catch (error) {
    console.error('Failed to load gallery images:', error)
  }
}

function selectGalleryImage(img: ReferenceImage) {
  emit('update-visual', {
    type: 'gallery',
    imagePath: img.path,
    imageBase64: null,
    sourceUrl: null,
    generationPrompt: null,
    thumbnailPath: null,
    metadata: {
      source: 'gallery',
      objectFit: visualSize.value,
      objectPosition: visualPosition.value
    }
  } as any)
}

async function loadReferenceImages() {
  try {
    const images = await window.electronAPI.getBundledReferenceImages()
    referenceImages.value = images.map(img => ({
      name: img.fileName,
      path: img.filePath
    }))
  } catch (error) {
    console.error('Failed to load reference images:', error)
  }
}

async function searchPexels() {
  if (!pexelsQuery.value.trim()) return

  pexelsLoading.value = true
  pexelsResults.value = []
  try {
    const result = await window.electronAPI.searchPexels(pexelsQuery.value)
    console.log('Pexels search result:', result)
    if (result.success && result.data) {
      pexelsResults.value = result.data  // data is the array directly
    } else if (result.error) {
      console.error('Pexels search error:', result.error)
      alert('Pexels search failed: ' + result.error)
    }
  } catch (error) {
    console.error('Pexels search failed:', error)
    alert('Pexels search failed: ' + error)
  } finally {
    pexelsLoading.value = false
  }
}

async function selectPexelsPhoto(photo: PexelsPhoto) {
  try {
    console.log('Downloading Pexels image:', photo.id, photo.url)
    const result = await window.electronAPI.downloadPexelsImage(photo.url, photo.id.toString())
    console.log('Download result:', result)
    if (result.success && result.data) {
      console.log('Emitting update-visual with path:', result.data)
      emit('update-visual', {
        type: 'pexels',
        imagePath: result.data,
        imageBase64: null,
        sourceUrl: photo.url,
        generationPrompt: null,
        thumbnailPath: null,
        metadata: {
          photographer: photo.photographer,
          alt: photo.alt,
          objectFit: visualSize.value,
          objectPosition: visualPosition.value
        }
      } as any)
      // Refresh gallery since image was saved there
      await loadGalleryImages()
    } else {
      console.error('Download failed:', result.error)
      alert('Failed to download image: ' + (result.error || 'Unknown error'))
    }
  } catch (error) {
    console.error('Failed to download Pexels image:', error)
    alert('Failed to download image: ' + error)
  }
}

async function generateImage() {
  if (!genAIPrompt.value.trim()) return

  genAILoading.value = true
  try {
    console.log('Generating AI image with model:', selectedImageModel.value, 'prompt:', genAIPrompt.value)
    const result = await window.electronAPI.generateImage(genAIPrompt.value, selectedImageModel.value)
    console.log('Generate image result:', result)
    if (result.success && result.data) {
      emit('update-visual', {
        type: 'gemini',
        imagePath: result.data,
        imageBase64: null,
        sourceUrl: null,
        generationPrompt: genAIPrompt.value,
        thumbnailPath: null,
        metadata: {
          model: selectedImageModel.value,
          objectFit: visualSize.value,
          objectPosition: visualPosition.value
        }
      } as any)
      // Refresh gallery since image was saved there
      await loadGalleryImages()
      console.log('Gallery refreshed, now has', galleryImages.value.length, 'images')
    } else {
      console.error('Image generation failed:', result.error)
      alert('Image generation failed: ' + (result.error || 'Unknown error'))
    }
  } catch (error) {
    console.error('Image generation failed:', error)
    alert('Image generation failed: ' + error)
  } finally {
    genAILoading.value = false
  }
}

async function generateDiagram() {
  if (!diagramDescription.value.trim()) return

  diagramLoading.value = true
  try {
    console.log('Generating diagram:', diagramDescription.value)
    const result = await window.electronAPI.generateDiagram(diagramDescription.value)
    console.log('Diagram result:', result)
    if (result.success && result.data) {
      emit('update-visual', {
        type: 'diagram',
        imagePath: result.data,
        imageBase64: null,
        sourceUrl: null,
        generationPrompt: diagramDescription.value,
        thumbnailPath: null,
        metadata: {
          objectFit: visualSize.value,
          objectPosition: visualPosition.value
        }
      } as any)
      // Refresh gallery since image was saved there
      await loadGalleryImages()
    } else {
      console.error('Diagram generation failed:', result.error)
      alert('Diagram generation failed: ' + (result.error || 'Unknown error'))
    }
  } catch (error) {
    console.error('Diagram generation failed:', error)
    alert('Diagram generation failed: ' + error)
  } finally {
    diagramLoading.value = false
  }
}

function selectReferenceImage(img: ReferenceImage) {
  emit('update-visual', {
    type: 'pexels', // Use pexels type for reference images (just a static image)
    imagePath: img.path,
    imageBase64: null,
    sourceUrl: null,
    generationPrompt: null,
    thumbnailPath: null,
    metadata: {
      source: 'reference',
      objectFit: visualSize.value,
      objectPosition: visualPosition.value
    }
  } as any)
}

async function uploadImage() {
  try {
    const result = await window.electronAPI.selectImage()
    if (result.success && result.data) {
      emit('update-visual', {
        type: 'pexels', // Use pexels as generic image type
        imagePath: result.data,
        imageBase64: null,
        sourceUrl: null,
        generationPrompt: null,
        thumbnailPath: null,
        metadata: {
          source: 'upload',
          objectFit: visualSize.value,
          objectPosition: visualPosition.value
        }
      } as any)
      // Refresh gallery since image was saved there
      await loadGalleryImages()
    }
  } catch (error) {
    console.error('Image upload failed:', error)
  }
}
</script>
