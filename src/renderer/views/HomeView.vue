<template>
  <div class="flex-1 p-8">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          Corndel Explainer Videos
        </h1>
        <p class="text-gray-600">
          Create professional explainer videos with AI-assisted content generation
        </p>
      </div>

      <!-- API Keys Warning -->
      <div
        v-if="!settingsStore.hasRequiredKeys"
        class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 flex items-start gap-3"
      >
        <svg class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <h3 class="font-medium text-yellow-800">API Keys Required</h3>
          <p class="text-sm text-yellow-700 mt-1">
            Please configure your API keys in settings to start creating videos.
          </p>
          <router-link to="/settings" class="text-sm text-yellow-800 underline mt-2 inline-block">
            Go to Settings
          </router-link>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <button
          @click="router.push('/project/setup')"
          :disabled="!settingsStore.hasRequiredKeys"
          class="card-hover p-6 text-left group"
          :class="{ 'opacity-50 cursor-not-allowed': !settingsStore.hasRequiredKeys }"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">Create New Video</h3>
              <p class="text-sm text-gray-500">Start a new explainer video project</p>
            </div>
          </div>
        </button>

        <router-link to="/settings" class="card-hover p-6 text-left group">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">Settings</h3>
              <p class="text-sm text-gray-500">Configure API keys and preferences</p>
            </div>
          </div>
        </router-link>
      </div>

      <!-- Recent Projects -->
      <div>
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Recent Projects</h2>

        <div v-if="loading" class="text-center py-8">
          <div class="spinner spinner-lg mx-auto"></div>
        </div>

        <div v-else-if="projects.length === 0" class="card p-8 text-center">
          <svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p class="text-gray-500">No projects yet. Create your first video!</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="project in projects"
            :key="project.id"
            class="card-hover p-4 flex items-center justify-between"
            @click="openProject(project.id)"
          >
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 class="font-medium text-gray-900">{{ project.name }}</h3>
                <p class="text-sm text-gray-500">
                  {{ formatDate(project.updatedAt) }}
                  <span :class="getStatusClass(project.status)">{{ formatStatus(project.status) }}</span>
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500">${{ project.totalCost.toFixed(2) }}</span>
              <button
                @click.stop="deleteProject(project.id)"
                class="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settingsStore'
import { useProjectStore } from '../stores/projectStore'
import type { Project } from '@shared/types'

const router = useRouter()
const settingsStore = useSettingsStore()
const projectStore = useProjectStore()

const projects = ref<Project[]>([])
const loading = ref(true)

onMounted(async () => {
  await settingsStore.loadSettings()
  projects.value = await window.electronAPI.listProjects()
  loading.value = false
})

async function openProject(projectId: string) {
  const success = await projectStore.loadProject(projectId)
  if (success && projectStore.project) {
    const status = projectStore.project.status
    if (status === 'setup' || status === 'planning') {
      router.push(`/project/${projectId}/plan`)
    } else if (status === 'editing') {
      router.push(`/project/${projectId}/edit`)
    } else if (status === 'audio') {
      router.push(`/project/${projectId}/audio`)
    } else if (status === 'video' || status === 'complete') {
      router.push(`/project/${projectId}/video`)
    }
  }
}

async function deleteProject(projectId: string) {
  if (confirm('Are you sure you want to delete this project?')) {
    await window.electronAPI.deleteProject(projectId)
    projects.value = projects.value.filter(p => p.id !== projectId)
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function getStatusClass(status: string): string {
  const classes: Record<string, string> = {
    setup: 'badge-gray',
    planning: 'badge-yellow',
    editing: 'badge-blue',
    audio: 'badge-blue',
    video: 'badge-blue',
    complete: 'badge-green'
  }
  return `ml-2 ${classes[status] || 'badge-gray'}`
}
</script>
