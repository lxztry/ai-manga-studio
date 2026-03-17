import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { Script, Character, Scene, Storyboard, StoryboardPanel } from '../types'
import { createScript, createScene, createCharacter, createStoryboardPanel } from '../utils'

const STORAGE_KEY = 'ai-manga-studio-data'
const MAX_HISTORY_SIZE = 50
const AUTOSAVE_DELAY = 30000

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

type HistoryState = Pick<AppState, 'scripts' | 'currentScript' | 'characters' | 'currentScene' | 'storyboard'>

interface History {
  past: HistoryState[]
  future: HistoryState[]
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
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  lastSaved: Date | null
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

function getHistoryState(state: AppState): HistoryState {
  return {
    scripts: JSON.parse(JSON.stringify(state.scripts)),
    currentScript: state.currentScript ? JSON.parse(JSON.stringify(state.currentScript)) : null,
    characters: JSON.parse(JSON.stringify(state.characters)),
    currentScene: state.currentScene ? JSON.parse(JSON.stringify(state.currentScene)) : null,
    storyboard: state.storyboard ? JSON.parse(JSON.stringify(state.storyboard)) : null,
  }
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
  const [history, setHistory] = useState<History>({ past: [], future: [] })
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const pushHistory = useCallback((currentState: AppState) => {
    setHistory(prev => {
      const newPast = [...prev.past, getHistoryState(currentState)]
      if (newPast.length > MAX_HISTORY_SIZE) {
        newPast.shift()
      }
      return {
        past: newPast,
        future: [],
      }
    })
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      saveToStorage(state)
      setLastSaved(new Date())
    }, AUTOSAVE_DELAY)
    return () => clearTimeout(timer)
  }, [state])

  useEffect(() => {
    saveToStorage(state)
    setLastSaved(new Date())
  }, [])

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev
      const previous = prev.past[prev.past.length - 1]
      const newPast = prev.past.slice(0, -1)
      const current = getHistoryState(state)
      setState(prev => ({
        ...prev,
        scripts: previous.scripts,
        currentScript: previous.currentScript,
        characters: previous.characters,
        currentScene: previous.currentScene,
        storyboard: previous.storyboard,
      }))
      return {
        past: newPast,
        future: [current, ...prev.future],
      }
    })
  }, [state])

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev
      const next = prev.future[0]
      const newFuture = prev.future.slice(1)
      const current = getHistoryState(state)
      setState(prev => ({
        ...prev,
        scripts: next.scripts,
        currentScript: next.currentScript,
        characters: next.characters,
        currentScene: next.currentScene,
        storyboard: next.storyboard,
      }))
      return {
        past: [...prev.past, current],
        future: newFuture,
      }
    })
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
    pushHistory(state)
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
  }, [state, pushHistory])

  const loadScript = useCallback((script: Script) => {
    pushHistory(state)
    setState(prev => ({
      ...prev,
      currentScript: script,
      characters: script.characters,
    }))
  }, [state, pushHistory])

  const updateScript = useCallback((updates: Partial<Script>) => {
    pushHistory(state)
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
  }, [state, pushHistory])

  const deleteScript = useCallback((scriptId: string) => {
    pushHistory(state)
    setState(prev => ({
      ...prev,
      scripts: prev.scripts.filter(s => s.id !== scriptId),
      currentScript: prev.currentScript?.id === scriptId ? null : prev.currentScript,
      storyboard: prev.currentScript?.id === scriptId ? null : prev.storyboard,
    }))
  }, [state, pushHistory])

  const addScene = useCallback((sceneData?: Partial<Scene>) => {
    pushHistory(state)
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
  }, [state, pushHistory])

  const updateScene = useCallback((sceneId: string, updates: Partial<Scene>) => {
    pushHistory(state)
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
  }, [state, pushHistory])

  const deleteScene = useCallback((sceneId: string) => {
    pushHistory(state)
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
  }, [state, pushHistory])

  const addCharacter = useCallback((characterData?: Partial<Character>) => {
    pushHistory(state)
    setState(prev => {
      const newCharacter = createCharacter(characterData)
      const updatedCharacters = [...prev.characters, newCharacter]
      
      if (!prev.currentScript) {
        return {
          ...prev,
          characters: updatedCharacters,
        }
      }
      
      const updatedScript = {
        ...prev.currentScript,
        characters: updatedCharacters,
        updatedAt: new Date(),
      }
      
      return {
        ...prev,
        characters: updatedCharacters,
        currentScript: updatedScript,
        scripts: prev.scripts.map(s =>
          s.id === updatedScript.id ? updatedScript : s
        ),
      }
    })
  }, [state, pushHistory])

  const updateCharacter = useCallback((characterId: string, updates: Partial<Character>) => {
    pushHistory(state)
    setState(prev => {
      const updatedCharacters = prev.characters.map(char =>
        char.id === characterId ? { ...char, ...updates, updatedAt: new Date() } : char
      )
      
      if (!prev.currentScript) {
        return {
          ...prev,
          characters: updatedCharacters,
        }
      }
      
      const updatedScript = {
        ...prev.currentScript,
        characters: updatedCharacters,
        updatedAt: new Date(),
      }
      
      return {
        ...prev,
        characters: updatedCharacters,
        currentScript: updatedScript,
        scripts: prev.scripts.map(s =>
          s.id === updatedScript.id ? updatedScript : s
        ),
      }
    })
  }, [state, pushHistory])

  const deleteCharacter = useCallback((characterId: string) => {
    pushHistory(state)
    setState(prev => {
      const updatedCharacters = prev.characters.filter(c => c.id !== characterId)
      
      if (!prev.currentScript) {
        return {
          ...prev,
          characters: updatedCharacters,
        }
      }
      
      const updatedScript = {
        ...prev.currentScript,
        characters: updatedCharacters,
        updatedAt: new Date(),
      }
      
      return {
        ...prev,
        characters: updatedCharacters,
        currentScript: updatedScript,
        scripts: prev.scripts.map(s =>
          s.id === updatedScript.id ? updatedScript : s
        ),
      }
    })
  }, [state, pushHistory])

  const setCurrentScene = useCallback((scene: Scene | null) => {
    setState(prev => ({ ...prev, currentScene: scene }))
  }, [])

  const addStoryboardPanel = useCallback((panelData?: Partial<StoryboardPanel>) => {
    pushHistory(state)
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
  }, [state, pushHistory])

  const updateStoryboardPanel = useCallback((panelId: string, updates: Partial<StoryboardPanel>) => {
    pushHistory(state)
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
  }, [state, pushHistory])

  const deleteStoryboardPanel = useCallback((panelId: string) => {
    pushHistory(state)
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
  }, [state, pushHistory])

  const reorderStoryboardPanels = useCallback((startIndex: number, endIndex: number) => {
    pushHistory(state)
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
  }, [state, pushHistory])

  const clearAllData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setState(defaultState)
    setHistory({ past: [], future: [] })
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
      setHistory({ past: [], future: [] })
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
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    lastSaved,
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
