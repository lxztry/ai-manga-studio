import { v4 as uuidv4 } from 'uuid'
import type { Character, Scene, Script, StoryboardPanel } from '../types'

export function createCharacter(data?: Partial<Character>): Character {
  return {
    id: uuidv4(),
    name: data?.name || '新角色',
    description: data?.description || '',
    appearance: data?.appearance || '',
    personality: data?.personality || '',
    avatar: data?.avatar,
    traits: data?.traits || [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export function createScene(data?: Partial<Scene>): Scene {
  return {
    id: uuidv4(),
    name: data?.name || '新场景',
    description: data?.description || '',
    location: data?.location || '',
    timeOfDay: data?.timeOfDay || 'morning',
    dialogues: data?.dialogues || [],
    createdAt: new Date(),
  }
}

export function createScript(data?: Partial<Script>): Script {
  return {
    id: uuidv4(),
    title: data?.title || '未命名剧本',
    description: data?.description || '',
    genre: data?.genre || '冒险',
    scenes: data?.scenes || [],
    characters: data?.characters || [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export function createStoryboardPanel(data?: Partial<StoryboardPanel>): StoryboardPanel {
  return {
    id: uuidv4(),
    sceneId: data?.sceneId || '',
    order: data?.order || 0,
    description: data?.description || '',
    dialogue: data?.dialogue,
    cameraAngle: data?.cameraAngle || 'medium',
    imageUrl: data?.imageUrl,
    prompt: data?.prompt,
    isGenerating: false,
  }
}

export function generateImagePrompt(
  panel: StoryboardPanel,
  characters: Character[]
): string {
  const characterNames = characters.map(c => c.name).join(', ')
  return `Manga style illustration: ${panel.description}. 
    Camera angle: ${panel.cameraAngle}. 
    Characters involved: ${characterNames}.
    Style: Japanese manga, black and white with screentones, dynamic composition.`
}

export function exportToJSON(data: unknown): string {
  return JSON.stringify(data, null, 2)
}

export function importFromJSON<T>(json: string): T {
  return JSON.parse(json) as T
}
