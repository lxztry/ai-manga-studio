import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { Script, Character, Scene, Storyboard, StoryboardPanel } from '../types'
import { createScript, createScene, createCharacter, createStoryboardPanel } from '../utils'

const STORAGE_KEY = 'ai-manga-studio-data'

interface AppState {
  scripts: Script[]
  currentScript: Script | null
  characters: Character[]
  currentScene: Scene | null
  storyboard: Storyboard | null
  apiKey: string
  apiProvider: 'openai' | 'anthropic' | 'openrouter' | 'local'
  apiModel: string
  apiBaseUrl: string
}

interface AppContextType extends AppState {
  setApiKey: (key: string) => void
  setApiProvider: (provider: 'openai' | 'anthropic' | 'openrouter' | 'local') => void
  setApiModel: (model: string) => void
  setApiBaseUrl: (url: string) => void
  createNewScript: (title: string) => void
  loadScript: (script: Script) => void
  updateScript: (updates: Partial<Script>) => void
  deleteScript: (scriptId: string) => void
  addScene: (scene?: Partial<Scene>) => void
  updateScene: (sceneId: string, updates: Partial<Scene>) => void
  deleteScene: (sceneId: string) => void
  addCharacter: (character?: Partial<Character>) => void
  updateCharacter: (characterId: string, updates: Partial<Character>) => void
  deleteCharacter: (characterId: string) => void
  setCurrentScene: (scene: Scene | null) => void
  addStoryboardPanel: (panel?: Partial<StoryboardPanel>) => void
  updateStoryboardPanel: (panelId: string, updates: Partial<StoryboardPanel>) => void
  deleteStoryboardPanel: (panelId: string) => void
  reorderStoryboardPanels: (startIndex: number, endIndex: number) => void
  clearAllData: () => void
  exportData: () => string
  importData: (json: string) => void
}

const defaultState: AppState = {
  scripts: [],
  currentScript: null,
  characters: [],
  currentScene: null,
  storyboard: null,
  apiKey: '',
  apiProvider: 'openrouter',
  apiModel: 'openai/gpt-4',
  apiBaseUrl: '',
}

function loadFromStorage(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        ...defaultState,
        ...parsed,
      }
    }
  } catch (e) {
    console.error('Failed to load from storage:', e)
  }
  return defaultState
}

function saveToStorage(state: AppState) {
  try {
    const toSave = {
      scripts: state.scripts,
      currentScript: state.currentScript,
      characters: state.characters,
      storyboard: state.storyboard,
      apiKey: state.apiKey,
      apiProvider: state.apiProvider,
      apiModel: state.apiModel,
      apiBaseUrl: state.apiBaseUrl,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch (e) {
    console.error('Failed to save to storage:', e)
  }
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadFromStorage)

  useEffect(() => {
    saveToStorage(state)
  }, [state])

  const setApiKey = useCallback((key: string) => {
    setState(prev => ({ ...prev, apiKey: key }))
  }, [])

  const setApiProvider = useCallback((provider: 'openai' | 'anthropic' | 'openrouter' | 'local') => {
    setState(prev => ({ ...prev, apiProvider: provider }))
  }, [])

  const setApiModel = useCallback((model: string) => {
    setState(prev => ({ ...prev, apiModel: model }))
  }, [])

  const setApiBaseUrl = useCallback((url: string) => {
    setState(prev => ({ ...prev, apiBaseUrl: url }))
  }, [])

  const createNewScript = useCallback((title: string) => {
    const newScript = createScript({ title })
    setState(prev => ({
      ...prev,
      scripts: [...prev.scripts, newScript],
      currentScript: newScript,
      characters: [],
      storyboard: {
        id: newScript.id,
        scriptId: newScript.id,
        panels: [],
        createdAt: new Date(),
      },
    }))
  }, [])

  const loadScript = useCallback((script: Script) => {
    setState(prev => ({
      ...prev,
      currentScript: script,
      characters: script.characters,
    }))
  }, [])

  const updateScript = useCallback((updates: Partial<Script>) => {
    setState(prev => {
      if (!prev.currentScript) return prev
      const updatedScript = {
        ...prev.currentScript,
        ...updates,
        updatedAt: new Date(),
      }
      return {
        ...prev,
        currentScript: updatedScript,
        scripts: prev.scripts.map(s =>
          s.id === updatedScript.id ? updatedScript : s
        ),
      }
    })
  }, [])

  const deleteScript = useCallback((scriptId: string) => {
    setState(prev => ({
      ...prev,
      scripts: prev.scripts.filter(s => s.id !== scriptId),
      currentScript: prev.currentScript?.id === scriptId ? null : prev.currentScript,
      storyboard: prev.currentScript?.id === scriptId ? null : prev.storyboard,
    }))
  }, [])

  const addScene = useCallback((sceneData?: Partial<Scene>) => {
    setState(prev => {
      if (!prev.currentScript) return prev
      const newScene = createScene(sceneData)
      const updatedScript = {
        ...prev.currentScript,
        scenes: [...prev.currentScript.scenes, newScene],
        updatedAt: new Date(),
      }
      return {
        ...prev,
        currentScript: updatedScript,
        currentScene: newScene,
      }
    })
  }, [])

  const updateScene = useCallback((sceneId: string, updates: Partial<Scene>) => {
    setState(prev => {
      if (!prev.currentScript) return prev
      const updatedScenes = prev.currentScript.scenes.map(scene =>
        scene.id === sceneId ? { ...scene, ...updates } : scene
      )
      const updatedScript = {
        ...prev.currentScript,
        scenes: updatedScenes,
        updatedAt: new Date(),
      }
      return {
        ...prev,
        currentScript: updatedScript,
        currentScene: prev.currentScene?.id === sceneId
          ? { ...prev.currentScene, ...updates }
          : prev.currentScene,
      }
    })
  }, [])

  const deleteScene = useCallback((sceneId: string) => {
    setState(prev => {
      if (!prev.currentScript) return prev
      const updatedScenes = prev.currentScript.scenes.filter(s => s.id !== sceneId)
      const updatedScript = {
        ...prev.currentScript,
        scenes: updatedScenes,
        updatedAt: new Date(),
      }
      return {
        ...prev,
        currentScript: updatedScript,
        currentScene: prev.currentScene?.id === sceneId ? null : prev.currentScene,
      }
    })
  }, [])

  const addCharacter = useCallback((characterData?: Partial<Character>) => {
    setState(prev => {
      const newCharacter = createCharacter(characterData)
      return {
        ...prev,
        characters: [...prev.characters, newCharacter],
      }
    })
  }, [])

  const updateCharacter = useCallback((characterId: string, updates: Partial<Character>) => {
    setState(prev => ({
      ...prev,
      characters: prev.characters.map(char =>
        char.id === characterId ? { ...char, ...updates, updatedAt: new Date() } : char
      ),
    }))
  }, [])

  const deleteCharacter = useCallback((characterId: string) => {
    setState(prev => ({
      ...prev,
      characters: prev.characters.filter(c => c.id !== characterId),
    }))
  }, [])

  const setCurrentScene = useCallback((scene: Scene | null) => {
    setState(prev => ({ ...prev, currentScene: scene }))
  }, [])

  const addStoryboardPanel = useCallback((panelData?: Partial<StoryboardPanel>) => {
    setState(prev => {
      if (!prev.storyboard) return prev
      const newPanel = createStoryboardPanel({
        ...panelData,
        order: prev.storyboard.panels.length,
      })
      return {
        ...prev,
        storyboard: {
          ...prev.storyboard,
          panels: [...prev.storyboard.panels, newPanel],
        },
      }
    })
  }, [])

  const updateStoryboardPanel = useCallback((panelId: string, updates: Partial<StoryboardPanel>) => {
    setState(prev => {
      if (!prev.storyboard) return prev
      const updatedPanels = prev.storyboard.panels.map(panel =>
        panel.id === panelId ? { ...panel, ...updates } : panel
      )
      return {
        ...prev,
        storyboard: {
          ...prev.storyboard,
          panels: updatedPanels,
        },
      }
    })
  }, [])

  const deleteStoryboardPanel = useCallback((panelId: string) => {
    setState(prev => {
      if (!prev.storyboard) return prev
      const filteredPanels = prev.storyboard.panels.filter(p => p.id !== panelId)
      const reorderedPanels = filteredPanels.map((panel, index) => ({
        ...panel,
        order: index,
      }))
      return {
        ...prev,
        storyboard: {
          ...prev.storyboard,
          panels: reorderedPanels,
        },
      }
    })
  }, [])

  const reorderStoryboardPanels = useCallback((startIndex: number, endIndex: number) => {
    setState(prev => {
      if (!prev.storyboard) return prev
      const panels = [...prev.storyboard.panels]
      const [removed] = panels.splice(startIndex, 1)
      panels.splice(endIndex, 0, removed)
      const reorderedPanels = panels.map((panel, index) => ({
        ...panel,
        order: index,
      }))
      return {
        ...prev,
        storyboard: {
          ...prev.storyboard,
          panels: reorderedPanels,
        },
      }
    })
  }, [])

  const clearAllData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setState(defaultState)
  }, [])

  const exportData = useCallback(() => {
    return JSON.stringify(state, null, 2)
  }, [state])

  const importData = useCallback((json: string) => {
    try {
      const data = JSON.parse(json)
      setState(prev => ({
        ...prev,
        ...data,
      }))
    } catch (e) {
      console.error('Import failed:', e)
      throw new Error('导入失败：数据格式不正确')
    }
  }, [])

  const value: AppContextType = {
    ...state,
    setApiKey,
    setApiProvider,
    setApiModel,
    setApiBaseUrl,
    createNewScript,
    loadScript,
    updateScript,
    deleteScript,
    addScene,
    updateScene,
    deleteScene,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    setCurrentScene,
    addStoryboardPanel,
    updateStoryboardPanel,
    deleteStoryboardPanel,
    reorderStoryboardPanels,
    clearAllData,
    exportData,
    importData,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
