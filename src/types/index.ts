export interface Character {
  id: string
  name: string
  description: string
  appearance: string
  personality: string
  avatar?: string
  traits: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Dialogue {
  id: string
  characterId: string
  content: string
  emotion?: string
  action?: string
}

export interface Scene {
  id: string
  name: string
  description: string
  location: string
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  dialogues: Dialogue[]
  createdAt: Date
}

export interface Script {
  id: string
  title: string
  description: string
  genre: string
  scenes: Scene[]
  characters: Character[]
  createdAt: Date
  updatedAt: Date
}

export interface StoryboardPanel {
  id: string
  sceneId: string
  order: number
  description: string
  dialogue?: string
  cameraAngle: 'close-up' | 'medium' | 'wide' | 'birds-eye' | 'low-angle'
  imageUrl?: string
  prompt?: string
  isGenerating: boolean
}

export interface Storyboard {
  id: string
  scriptId: string
  panels: StoryboardPanel[]
  createdAt: Date
}

export interface ImageGenerationRequest {
  prompt: string
  style: 'manga' | 'anime' | 'realistic' | 'watercolor'
  characterDescriptions?: string[]
  sceneDescription: string
  cameraAngle: string
}

export interface AIModelConfig {
  provider: 'openai' | 'anthropic' | 'openrouter' | 'local'
  model: string
  apiKey?: string
  baseUrl?: string
}
