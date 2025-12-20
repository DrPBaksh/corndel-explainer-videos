<template>
  <div
    ref="canvasRef"
    class="slide-canvas relative bg-white shadow-xl rounded-lg overflow-hidden"
    :style="canvasStyle"
    @click="handleCanvasClick"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
  >
    <!-- Background layer -->
    <div class="absolute inset-0" :style="backgroundStyle"></div>

    <!-- Elements layer -->
    <div
      v-for="element in slide.elements"
      :key="element.id"
      class="absolute select-none"
      :class="{
        'ring-2 ring-primary-500 ring-offset-2': selectedElementId === element.id,
        'cursor-move': !isResizing
      }"
      :style="getElementStyle(element)"
      @mousedown.stop="handleElementMouseDown($event, element)"
    >
      <!-- Text elements -->
      <div v-if="element.type === 'headline'" class="text-content headline">
        {{ element.content || 'Headline' }}
      </div>
      <div v-else-if="element.type === 'subheadline'" class="text-content subheadline">
        {{ element.content || 'Subheadline' }}
      </div>
      <div v-else-if="element.type === 'body'" class="text-content body">
        {{ element.content || 'Body text' }}
      </div>
      <div v-else-if="element.type === 'bullets'" class="text-content bullets">
        <ul class="list-disc list-inside space-y-1">
          <li v-for="(bullet, i) in getBullets(element.content)" :key="i">{{ bullet }}</li>
        </ul>
      </div>

      <!-- Image element -->
      <div v-else-if="element.type === 'image'" class="w-full h-full">
        <img
          v-if="element.imagePath"
          :src="encodeFilePath(element.imagePath)"
          class="w-full h-full rounded"
          :style="getImageStyle(element)"
          alt="Slide visual"
        />
        <div v-else class="w-full h-full bg-gray-100 rounded flex items-center justify-center">
          <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      <!-- Resize handles (when selected) -->
      <template v-if="selectedElementId === element.id">
        <div
          class="resize-handle resize-handle-se"
          @mousedown.stop="handleResizeStart($event, element, 'se')"
        ></div>
        <div
          class="resize-handle resize-handle-sw"
          @mousedown.stop="handleResizeStart($event, element, 'sw')"
        ></div>
        <div
          class="resize-handle resize-handle-ne"
          @mousedown.stop="handleResizeStart($event, element, 'ne')"
        ></div>
        <div
          class="resize-handle resize-handle-nw"
          @mousedown.stop="handleResizeStart($event, element, 'nw')"
        ></div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Slide, SlideElement } from '@shared/types'

const props = defineProps<{
  slide: Slide
}>()

const emit = defineEmits<{
  'select-element': [elementId: string | null]
  'move-element': [elementId: string, x: number, y: number]
  'resize-element': [elementId: string, width: number, height: number]
}>()

const canvasRef = ref<HTMLDivElement | null>(null)
const selectedElementId = ref<string | null>(null)
const isDragging = ref(false)
const isResizing = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const dragElement = ref<SlideElement | null>(null)
const resizeCorner = ref<string | null>(null)
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0, elemX: 0, elemY: 0 })

// Canvas size (16:9 aspect ratio)
const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 450

// Encode file path for use in file:// URLs (handles spaces and special chars)
function encodeFilePath(path: string): string {
  const normalizedPath = path.replace(/\\/g, '/')
  const encoded = normalizedPath.split('/').map(part => encodeURIComponent(part)).join('/')
  return `file://${encoded}`
}

const canvasStyle = computed(() => ({
  width: `${CANVAS_WIDTH}px`,
  height: `${CANVAS_HEIGHT}px`
}))

const backgroundStyle = computed(() => {
  if (props.slide.backgroundType === 'gradient' && props.slide.backgroundGradient) {
    return { background: props.slide.backgroundGradient }
  } else if (props.slide.backgroundType === 'image' && props.slide.backgroundImagePath) {
    return {
      backgroundImage: `url(${encodeFilePath(props.slide.backgroundImagePath)})`,
      backgroundSize: props.slide.backgroundSize || 'cover',
      backgroundPosition: props.slide.backgroundPosition || 'center',
      backgroundRepeat: 'no-repeat'
    }
  } else {
    return { backgroundColor: props.slide.backgroundColor || '#ffffff' }
  }
})

function getElementStyle(element: SlideElement): Record<string, string> {
  return {
    left: `${element.x}%`,
    top: `${element.y}%`,
    width: `${element.width}%`,
    height: `${element.height}%`,
    fontSize: element.fontSize ? `${element.fontSize}px` : undefined,
    fontWeight: element.fontWeight || undefined,
    color: element.color || '#1f2937',
    textAlign: element.textAlign || 'left'
  } as Record<string, string>
}

function getBullets(content: string | null): string[] {
  if (!content) return ['Bullet point']
  return content.split('\n').filter(b => b.trim())
}

function getImageStyle(element: SlideElement): Record<string, string> {
  const styles = element.styles || {}
  return {
    objectFit: styles.objectFit || 'cover',
    objectPosition: styles.objectPosition || 'center'
  }
}

function handleCanvasClick(event: MouseEvent) {
  if (event.target === canvasRef.value) {
    selectedElementId.value = null
    emit('select-element', null)
  }
}

function handleElementMouseDown(event: MouseEvent, element: SlideElement) {
  selectedElementId.value = element.id
  emit('select-element', element.id)

  if (!canvasRef.value) return

  isDragging.value = true
  dragElement.value = element

  const rect = canvasRef.value.getBoundingClientRect()
  const mouseX = ((event.clientX - rect.left) / rect.width) * 100
  const mouseY = ((event.clientY - rect.top) / rect.height) * 100

  dragOffset.value = {
    x: mouseX - element.x,
    y: mouseY - element.y
  }
}

function handleResizeStart(event: MouseEvent, element: SlideElement, corner: string) {
  if (!canvasRef.value) return

  isResizing.value = true
  dragElement.value = element
  resizeCorner.value = corner

  resizeStart.value = {
    x: event.clientX,
    y: event.clientY,
    width: element.width,
    height: element.height,
    elemX: element.x,
    elemY: element.y
  }
}

function handleMouseMove(event: MouseEvent) {
  if (!canvasRef.value || !dragElement.value) return

  const rect = canvasRef.value.getBoundingClientRect()

  if (isDragging.value) {
    const mouseX = ((event.clientX - rect.left) / rect.width) * 100
    const mouseY = ((event.clientY - rect.top) / rect.height) * 100

    const newX = mouseX - dragOffset.value.x
    const newY = mouseY - dragOffset.value.y

    emit('move-element', dragElement.value.id, newX, newY)
  }

  if (isResizing.value && resizeCorner.value) {
    const deltaX = ((event.clientX - resizeStart.value.x) / rect.width) * 100
    const deltaY = ((event.clientY - resizeStart.value.y) / rect.height) * 100

    let newWidth = resizeStart.value.width
    let newHeight = resizeStart.value.height
    let newX = resizeStart.value.elemX
    let newY = resizeStart.value.elemY

    if (resizeCorner.value.includes('e')) {
      newWidth = resizeStart.value.width + deltaX
    }
    if (resizeCorner.value.includes('w')) {
      newWidth = resizeStart.value.width - deltaX
      newX = resizeStart.value.elemX + deltaX
    }
    if (resizeCorner.value.includes('s')) {
      newHeight = resizeStart.value.height + deltaY
    }
    if (resizeCorner.value.includes('n')) {
      newHeight = resizeStart.value.height - deltaY
      newY = resizeStart.value.elemY + deltaY
    }

    if (newWidth >= 5 && newHeight >= 5) {
      if (newX !== resizeStart.value.elemX || newY !== resizeStart.value.elemY) {
        emit('move-element', dragElement.value.id, newX, newY)
      }
      emit('resize-element', dragElement.value.id, newWidth, newHeight)
    }
  }
}

function handleMouseUp() {
  isDragging.value = false
  isResizing.value = false
  dragElement.value = null
  resizeCorner.value = null
}

watch(() => props.slide.slideNum, () => {
  selectedElementId.value = null
})
</script>

<style scoped>
.slide-canvas {
  user-select: none;
}

.text-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.headline {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
}

.subheadline {
  font-size: 1.25rem;
  font-weight: 500;
  line-height: 1.4;
}

.body {
  font-size: 1rem;
  line-height: 1.6;
}

.bullets {
  font-size: 0.875rem;
  line-height: 1.5;
}

.resize-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: white;
  border: 2px solid #6366f1;
  border-radius: 2px;
}

.resize-handle-se {
  bottom: -5px;
  right: -5px;
  cursor: se-resize;
}

.resize-handle-sw {
  bottom: -5px;
  left: -5px;
  cursor: sw-resize;
}

.resize-handle-ne {
  top: -5px;
  right: -5px;
  cursor: ne-resize;
}

.resize-handle-nw {
  top: -5px;
  left: -5px;
  cursor: nw-resize;
}
</style>
