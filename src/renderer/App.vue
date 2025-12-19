<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- Top Navigation -->
    <header class="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <router-link to="/" class="flex items-center gap-2">
          <div class="w-8 h-8 bg-corndel-purple rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-sm">C</span>
          </div>
          <span class="font-semibold text-gray-900">Explainer Videos</span>
        </router-link>

        <!-- Breadcrumb -->
        <div v-if="projectStore.project" class="flex items-center gap-2 text-sm text-gray-500">
          <span>/</span>
          <span class="text-gray-700">{{ projectStore.project.name }}</span>
          <span class="badge-blue">{{ statusLabel }}</span>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <!-- Cost display -->
        <div v-if="projectStore.project" class="text-sm text-gray-500">
          Cost: <span class="font-medium text-gray-700">${{ projectStore.project.totalCost.toFixed(4) }}</span>
        </div>

        <!-- Settings -->
        <router-link to="/settings" class="btn-ghost btn-sm">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </router-link>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 flex overflow-hidden">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Progress Modal -->
    <div
      v-if="showProgress"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-xl p-6 w-96 shadow-xl">
        <h3 class="text-lg font-semibold mb-4">{{ progressUpdate?.step }}</h3>
        <div class="progress-bar mb-2">
          <div
            class="progress-bar-fill"
            :style="{ width: `${progressUpdate?.progress || 0}%` }"
          />
        </div>
        <p class="text-sm text-gray-600">{{ progressUpdate?.message }}</p>
        <p v-if="progressUpdate?.currentItem" class="text-xs text-gray-500 mt-1">
          {{ progressUpdate.currentItem }} / {{ progressUpdate.totalItems }}
        </p>
      </div>
    </div>

    <!-- Error Toast -->
    <transition name="slide-up">
      <div
        v-if="error"
        class="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-md"
      >
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="text-sm">{{ error }}</span>
        <button @click="error = null" class="ml-auto hover:opacity-80">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useProjectStore } from './stores/projectStore'
import type { ProgressUpdate } from '@shared/types'

const projectStore = useProjectStore()

const error = ref<string | null>(null)
const showProgress = ref(false)
const progressUpdate = ref<ProgressUpdate | null>(null)

const statusLabel = computed(() => {
  const status = projectStore.project?.status
  switch (status) {
    case 'setup': return 'Setup'
    case 'planning': return 'Planning'
    case 'editing': return 'Editing'
    case 'audio': return 'Audio'
    case 'video': return 'Video'
    case 'complete': return 'Complete'
    default: return ''
  }
})

// Listen for progress updates
let unsubscribe: (() => void) | null = null

onMounted(() => {
  unsubscribe = window.electronAPI.onProgressUpdate((progress) => {
    progressUpdate.value = progress
    showProgress.value = progress.progress < 100
  })
})

onUnmounted(() => {
  unsubscribe?.()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>
