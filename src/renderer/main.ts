import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import './assets/styles.css'

// Import views
import HomeView from './views/HomeView.vue'
import ProjectSetupView from './views/ProjectSetupView.vue'
import PlanReviewView from './views/PlanReviewView.vue'
import SlideEditorView from './views/SlideEditorView.vue'
import AudioGenerationView from './views/AudioGenerationView.vue'
import VideoAssemblyView from './views/VideoAssemblyView.vue'
import SettingsView from './views/SettingsView.vue'

// Create router
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/project/setup',
      name: 'project-setup',
      component: ProjectSetupView
    },
    {
      path: '/project/:id/plan',
      name: 'plan-review',
      component: PlanReviewView
    },
    {
      path: '/project/:id/edit',
      name: 'slide-editor',
      component: SlideEditorView
    },
    {
      path: '/project/:id/audio',
      name: 'audio-generation',
      component: AudioGenerationView
    },
    {
      path: '/project/:id/video',
      name: 'video-assembly',
      component: VideoAssemblyView
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView
    }
  ]
})

// Create app
const app = createApp(App)

// Use plugins
app.use(createPinia())
app.use(router)

// Mount
app.mount('#app')
