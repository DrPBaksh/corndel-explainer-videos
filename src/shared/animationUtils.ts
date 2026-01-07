import type { ElementAnimation, AnimationType, EasingType } from './types'

// ============================================
// ANIMATION STATE
// ============================================

export interface AnimationState {
  opacity: number
  translateX: number        // Percentage offset
  translateY: number        // Percentage offset
  scale: number
  rotation: number          // Degrees
  // Text-specific
  visibleChars?: number     // For typewriter effect
  // Emphasis effects
  highlightOpacity?: number
  glowIntensity?: number
  // Draw effects
  drawProgress?: number     // 0-1 for underline/circle draw
}

export const DEFAULT_ANIMATION_STATE: AnimationState = {
  opacity: 1,
  translateX: 0,
  translateY: 0,
  scale: 1,
  rotation: 0
}

// ============================================
// EASING FUNCTIONS
// ============================================

export function applyEasing(t: number, easing: EasingType): number {
  // Clamp t to 0-1
  t = Math.max(0, Math.min(1, t))

  switch (easing) {
    case 'linear':
      return t

    case 'ease-in':
      return t * t * t

    case 'ease-out':
      return 1 - Math.pow(1 - t, 3)

    case 'ease-in-out':
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2

    case 'bounce':
      const n1 = 7.5625
      const d1 = 2.75
      if (t < 1 / d1) {
        return n1 * t * t
      } else if (t < 2 / d1) {
        return n1 * (t -= 1.5 / d1) * t + 0.75
      } else if (t < 2.5 / d1) {
        return n1 * (t -= 2.25 / d1) * t + 0.9375
      } else {
        return n1 * (t -= 2.625 / d1) * t + 0.984375
      }

    case 'elastic':
      if (t === 0 || t === 1) return t
      const c4 = (2 * Math.PI) / 3
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1

    default:
      return t
  }
}

// ============================================
// ANIMATION STATE CALCULATOR
// ============================================

export function calculateAnimationState(
  animation: ElementAnimation | null | undefined,
  timeInSlide: number,
  totalContent?: string  // For typewriter - total text content
): AnimationState {
  // No animation = fully visible
  if (!animation || animation.type === 'none') {
    return { ...DEFAULT_ANIMATION_STATE }
  }

  const { type, startTime, duration, easing, delay = 0 } = animation

  // Calculate elapsed time since animation should start
  const effectiveStartTime = startTime + delay
  const elapsed = timeInSlide - effectiveStartTime

  // Before animation starts - element is in initial state
  if (elapsed < 0) {
    return getInitialState(type, animation)
  }

  // After animation ends - element is in final state
  if (elapsed >= duration) {
    return getFinalState(type, animation)
  }

  // During animation - interpolate
  const progress = elapsed / duration
  const easedProgress = applyEasing(progress, easing)

  return interpolateState(type, easedProgress, animation, totalContent)
}

// ============================================
// INITIAL STATES (before animation)
// ============================================

function getInitialState(type: AnimationType, animation: ElementAnimation): AnimationState {
  const distance = animation.distance || 100

  switch (type) {
    // Entrance animations - start hidden/off-screen
    case 'fade-in':
      return { ...DEFAULT_ANIMATION_STATE, opacity: 0 }

    case 'slide-left':
      return { ...DEFAULT_ANIMATION_STATE, translateX: distance, opacity: 0 }

    case 'slide-right':
      return { ...DEFAULT_ANIMATION_STATE, translateX: -distance, opacity: 0 }

    case 'slide-up':
      return { ...DEFAULT_ANIMATION_STATE, translateY: distance, opacity: 0 }

    case 'slide-down':
      return { ...DEFAULT_ANIMATION_STATE, translateY: -distance, opacity: 0 }

    case 'scale-in':
      return { ...DEFAULT_ANIMATION_STATE, scale: 0, opacity: 0 }

    case 'zoom-in':
      return { ...DEFAULT_ANIMATION_STATE, scale: 0.5, opacity: 0 }

    case 'bounce':
      return { ...DEFAULT_ANIMATION_STATE, scale: 0, opacity: 0 }

    case 'typewriter':
      return { ...DEFAULT_ANIMATION_STATE, visibleChars: 0 }

    case 'pop':
      return { ...DEFAULT_ANIMATION_STATE, scale: 0 }

    // Exit animations - start visible
    case 'fade-out':
    case 'scale-out':
      return { ...DEFAULT_ANIMATION_STATE }

    // Emphasis animations - element is visible, effect not active
    case 'highlight':
      return { ...DEFAULT_ANIMATION_STATE, highlightOpacity: 0 }

    case 'glow-pulse':
      return { ...DEFAULT_ANIMATION_STATE, glowIntensity: 0 }

    case 'shake':
    case 'wobble':
      return { ...DEFAULT_ANIMATION_STATE }

    // Draw animations
    case 'underline-draw':
    case 'circle-draw':
      return { ...DEFAULT_ANIMATION_STATE, drawProgress: 0 }

    default:
      return { ...DEFAULT_ANIMATION_STATE }
  }
}

// ============================================
// FINAL STATES (after animation)
// ============================================

function getFinalState(type: AnimationType, _animation: ElementAnimation): AnimationState {
  switch (type) {
    // Exit animations - end hidden
    case 'fade-out':
      return { ...DEFAULT_ANIMATION_STATE, opacity: 0 }

    case 'scale-out':
      return { ...DEFAULT_ANIMATION_STATE, scale: 0, opacity: 0 }

    // Emphasis animations - return to normal (or stay highlighted)
    case 'highlight':
      return { ...DEFAULT_ANIMATION_STATE, highlightOpacity: 1 }

    case 'glow-pulse':
      return { ...DEFAULT_ANIMATION_STATE, glowIntensity: 0 }

    case 'shake':
    case 'wobble':
      return { ...DEFAULT_ANIMATION_STATE }

    // Draw animations - fully drawn
    case 'underline-draw':
    case 'circle-draw':
      return { ...DEFAULT_ANIMATION_STATE, drawProgress: 1 }

    // Pop - slight overshoot then normal
    case 'pop':
      return { ...DEFAULT_ANIMATION_STATE, scale: 1 }

    case 'bounce':
      return { ...DEFAULT_ANIMATION_STATE, scale: 1 }

    // All entrance animations - fully visible
    default:
      return { ...DEFAULT_ANIMATION_STATE }
  }
}

// ============================================
// INTERPOLATION
// ============================================

function interpolateState(
  type: AnimationType,
  progress: number,  // 0-1, already eased
  animation: ElementAnimation,
  totalContent?: string
): AnimationState {
  const distance = animation.distance || 100

  switch (type) {
    case 'fade-in':
      return { ...DEFAULT_ANIMATION_STATE, opacity: progress }

    case 'fade-out':
      return { ...DEFAULT_ANIMATION_STATE, opacity: 1 - progress }

    case 'slide-left':
      return {
        ...DEFAULT_ANIMATION_STATE,
        translateX: distance * (1 - progress),
        opacity: Math.min(1, progress * 2)  // Fade in during first half
      }

    case 'slide-right':
      return {
        ...DEFAULT_ANIMATION_STATE,
        translateX: -distance * (1 - progress),
        opacity: Math.min(1, progress * 2)
      }

    case 'slide-up':
      return {
        ...DEFAULT_ANIMATION_STATE,
        translateY: distance * (1 - progress),
        opacity: Math.min(1, progress * 2)
      }

    case 'slide-down':
      return {
        ...DEFAULT_ANIMATION_STATE,
        translateY: -distance * (1 - progress),
        opacity: Math.min(1, progress * 2)
      }

    case 'scale-in':
      return {
        ...DEFAULT_ANIMATION_STATE,
        scale: progress,
        opacity: progress
      }

    case 'scale-out':
      return {
        ...DEFAULT_ANIMATION_STATE,
        scale: 1 - progress,
        opacity: 1 - progress
      }

    case 'zoom-in':
      return {
        ...DEFAULT_ANIMATION_STATE,
        scale: 0.5 + progress * 0.5,
        opacity: progress
      }

    case 'bounce':
      // Overshoot then settle
      const bounceScale = progress < 0.6
        ? progress / 0.6 * 1.2  // Overshoot to 1.2
        : 1.2 - (progress - 0.6) / 0.4 * 0.2  // Settle to 1.0
      return {
        ...DEFAULT_ANIMATION_STATE,
        scale: Math.min(bounceScale, 1.2),
        opacity: Math.min(1, progress * 2)
      }

    case 'pop':
      // Quick scale up with overshoot
      const popScale = progress < 0.5
        ? progress * 2 * 1.15  // Scale to 1.15
        : 1.15 - (progress - 0.5) * 2 * 0.15  // Back to 1.0
      return {
        ...DEFAULT_ANIMATION_STATE,
        scale: popScale
      }

    case 'typewriter':
      const totalChars = totalContent?.length || 100
      return {
        ...DEFAULT_ANIMATION_STATE,
        visibleChars: Math.floor(progress * totalChars)
      }

    case 'highlight':
      return {
        ...DEFAULT_ANIMATION_STATE,
        highlightOpacity: progress
      }

    case 'glow-pulse':
      // Pulse in and out
      const pulseProgress = Math.sin(progress * Math.PI * 2) * 0.5 + 0.5
      return {
        ...DEFAULT_ANIMATION_STATE,
        glowIntensity: pulseProgress
      }

    case 'shake':
      // Oscillate horizontally, decreasing amplitude
      const shakeIntensity = getIntensityMultiplier(animation.intensity)
      const shakeAmplitude = (1 - progress) * 3 * shakeIntensity
      const shakeOffset = Math.sin(progress * Math.PI * 8) * shakeAmplitude
      return {
        ...DEFAULT_ANIMATION_STATE,
        translateX: shakeOffset
      }

    case 'wobble':
      // Oscillate rotation, decreasing amplitude
      const wobbleIntensity = getIntensityMultiplier(animation.intensity)
      const wobbleAmplitude = (1 - progress) * 5 * wobbleIntensity
      const wobbleRotation = Math.sin(progress * Math.PI * 6) * wobbleAmplitude
      return {
        ...DEFAULT_ANIMATION_STATE,
        rotation: wobbleRotation
      }

    case 'underline-draw':
    case 'circle-draw':
      return {
        ...DEFAULT_ANIMATION_STATE,
        drawProgress: progress
      }

    default:
      return { ...DEFAULT_ANIMATION_STATE }
  }
}

function getIntensityMultiplier(intensity?: 'light' | 'medium' | 'strong'): number {
  switch (intensity) {
    case 'light': return 0.5
    case 'strong': return 1.5
    case 'medium':
    default: return 1
  }
}

// ============================================
// ANIMATION PRESETS
// ============================================

export type AnimationPreset = 'sequential' | 'stagger' | 'all-fade' | 'all-slide' | 'emphasis' | 'clear'

export interface PresetConfig {
  baseDuration: number
  staggerDelay: number
  defaultEasing: EasingType
}

export function applyAnimationPreset(
  preset: AnimationPreset,
  elementIds: string[],
  _slideDuration: number
): ElementAnimation[] {
  const config: PresetConfig = {
    baseDuration: 0.5,
    staggerDelay: 0.15,
    defaultEasing: 'ease-out'
  }

  switch (preset) {
    case 'sequential':
      // Each element fades in one after another
      return elementIds.map((id, index) => ({
        id: `anim_${id}`,
        elementId: id,
        type: 'fade-in' as AnimationType,
        startTime: index * (config.baseDuration + config.staggerDelay),
        duration: config.baseDuration,
        easing: config.defaultEasing
      }))

    case 'stagger':
      // Elements slide in from left with stagger
      return elementIds.map((id, index) => ({
        id: `anim_${id}`,
        elementId: id,
        type: 'slide-left' as AnimationType,
        startTime: index * config.staggerDelay,
        duration: config.baseDuration,
        easing: config.defaultEasing,
        distance: 30
      }))

    case 'all-fade':
      // All elements fade in simultaneously
      return elementIds.map((id) => ({
        id: `anim_${id}`,
        elementId: id,
        type: 'fade-in' as AnimationType,
        startTime: 0,
        duration: config.baseDuration * 1.5,
        easing: config.defaultEasing
      }))

    case 'all-slide':
      // All elements slide up simultaneously
      return elementIds.map((id) => ({
        id: `anim_${id}`,
        elementId: id,
        type: 'slide-up' as AnimationType,
        startTime: 0,
        duration: config.baseDuration,
        easing: config.defaultEasing,
        distance: 20
      }))

    case 'emphasis':
      // Pop effect for first element, fade for rest
      return elementIds.map((id, index) => ({
        id: `anim_${id}`,
        elementId: id,
        type: index === 0 ? 'pop' as AnimationType : 'fade-in' as AnimationType,
        startTime: index * config.staggerDelay,
        duration: index === 0 ? 0.3 : config.baseDuration,
        easing: index === 0 ? 'bounce' as EasingType : config.defaultEasing
      }))

    case 'clear':
      // Remove all animations
      return []

    default:
      return []
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function getAnimationCSSTransform(state: AnimationState): string {
  const transforms: string[] = []

  if (state.translateX !== 0) {
    transforms.push(`translateX(${state.translateX}%)`)
  }
  if (state.translateY !== 0) {
    transforms.push(`translateY(${state.translateY}%)`)
  }
  if (state.scale !== 1) {
    transforms.push(`scale(${state.scale})`)
  }
  if (state.rotation !== 0) {
    transforms.push(`rotate(${state.rotation}deg)`)
  }

  return transforms.length > 0 ? transforms.join(' ') : 'none'
}

export function getAnimationCSSStyles(state: AnimationState): Record<string, string> {
  return {
    opacity: state.opacity.toString(),
    transform: getAnimationCSSTransform(state),
    transition: 'none'  // Disable CSS transitions during programmatic animation
  }
}

export function getTotalAnimationDuration(animations: ElementAnimation[]): number {
  if (animations.length === 0) return 0

  return Math.max(
    ...animations.map(a => a.startTime + (a.delay || 0) + a.duration)
  )
}

export function isAnimationComplete(
  animation: ElementAnimation,
  timeInSlide: number
): boolean {
  const endTime = animation.startTime + (animation.delay || 0) + animation.duration
  return timeInSlide >= endTime
}

export function areAllAnimationsComplete(
  animations: ElementAnimation[],
  timeInSlide: number
): boolean {
  return animations.every(a => isAnimationComplete(a, timeInSlide))
}
