import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Plus, FileText, Trash2, ChevronRight, Sparkles, X, AlertCircle, Wand2, Upload } from 'lucide-react'
import type { Scene, Dialogue } from '../../types'
import { generateScript, optimizeVideoPrompt, importTextToScript } from '../../utils/ai'

const GENRES = ['冒险', '爱情', '科幻', '奇幻', '悬疑', '喜剧', '动作', '恐怖']

export function ScriptEditor() {
  const {
    currentScript,
    currentScene,
    characters,
    apiKey,
    apiProvider,
    apiModel,
    apiBaseUrl,
    updateScript,
    addScene,
    updateScene,
    deleteScene,
    setCurrentScene,
  } = useApp()
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [showVideoPromptOptimizer, setShowVideoPromptOptimizer] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('冒险')
  const [errorMessage, setErrorMessage] = useState('')
  const [videoPromptInput, setVideoPromptInput] = useState('')
  const [optimizedVideoPrompt, setOptimizedVideoPrompt] = useState('')
  const [isOptimizingPrompt, setIsOptimizingPrompt] = useState(false)
  const [showImportText, setShowImportText] = useState(false)
  const [importText, setImportText] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return
    setIsGenerating(true)
    try {
      const result = await generateScript(aiPrompt, selectedGenre, {
        apiKey,
        provider: apiProvider,
        model: apiModel,
        baseUrl: apiBaseUrl,
      })
      updateScript({
        title: result.title || currentScript?.title,
        description: result.description || currentScript?.description,
        genre: result.genre || selectedGenre,
        scenes: result.scenes?.map((s): Scene => ({
          id: crypto.randomUUID(),
          name: s.name || '未命名场景',
          description: s.description || '',
          location: s.location || '',
          timeOfDay: s.timeOfDay || 'morning',
          createdAt: new Date(),
          dialogues: s.dialogues?.map((d): Dialogue => ({
            id: crypto.randomUUID(),
            characterId: d.characterId || '',
            content: d.content || '',
            emotion: d.emotion,
            action: d.action,
          })) || [],
        })) || [],
      })
      setShowAIGenerator(false)
      setAiPrompt('')
      setErrorMessage('')
    } catch (error) {
      console.error('生成失败:', error)
      const message = error instanceof Error ? error.message : '生成失败，请检查API配置'
      setErrorMessage(message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleImportFromText = async () => {
    if (!importText.trim()) {
      alert('请输入要转换的文本')
      return
    }
    if (!apiKey) {
      alert('请先在设置中配置API密钥')
      return
    }
    
    setIsImporting(true)
    setErrorMessage('')
    
    try {
      const result = await importTextToScript(importText, {
        apiKey,
        provider: apiProvider,
        model: apiModel,
        baseUrl: apiBaseUrl,
      })
      
      updateScript({
        title: result.title || currentScript?.title || '导入的剧本',
        description: result.description || '',
        genre: result.genre || '冒险',
        scenes: result.scenes?.map((s: any): Scene => ({
          id: crypto.randomUUID(),
          name: s.name || '未命名场景',
          description: s.description || '',
          location: s.location || '',
          timeOfDay: s.timeOfDay || 'morning',
          createdAt: new Date(),
          dialogues: s.dialogues?.map((d: any): Dialogue => ({
            id: crypto.randomUUID(),
            characterId: d.character || '',
            content: d.content || '',
            emotion: d.emotion,
            action: d.action,
          })) || [],
        })) || [],
      })
      
      setShowImportText(false)
      setImportText('')
      alert('剧本导入成功！')
    } catch (error) {
      console.error('导入失败:', error)
      setErrorMessage(error instanceof Error ? error.message : '导入失败，请检查API配置')
    } finally {
      setIsImporting(false)
    }
  }

  const handleOptimizeVideoPrompt = async () => {
    if (!videoPromptInput.trim()) return
    setIsOptimizingPrompt(true)
    setErrorMessage('')
    try {
      const result = await optimizeVideoPrompt(videoPromptInput, {
        apiKey,
        provider: apiProvider,
        model: apiModel,
        baseUrl: apiBaseUrl,
      })
      setOptimizedVideoPrompt(result)
    } catch (error) {
      console.error('优化提示词失败:', error)
      const message = error instanceof Error ? error.message : '优化失败，请检查API配置'
      setErrorMessage(message)
    } finally {
      setIsOptimizingPrompt(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleAddScene = () => {
    addScene({ name: `场景 ${(currentScript?.scenes.length || 0) + 1}` })
  }

  const handleAddDialogue = (sceneId: string) => {
    const scene = currentScript?.scenes.find(s => s.id === sceneId)
    if (!scene) return
    const newDialogue: Dialogue = {
      id: crypto.randomUUID(),
      characterId: characters[0]?.id || '',
      content: '',
    }
    updateScene(sceneId, {
      dialogues: [...scene.dialogues, newDialogue],
    })
  }

  const handleUpdateDialogue = (sceneId: string, dialogueId: string, updates: Partial<Dialogue>) => {
    const scene = currentScript?.scenes.find(s => s.id === sceneId)
    if (!scene) return
    updateScene(sceneId, {
      dialogues: scene.dialogues.map(d =>
        d.id === dialogueId ? { ...d, ...updates } : d
      ),
    })
  }

  const handleDeleteDialogue = (sceneId: string, dialogueId: string) => {
    const scene = currentScript?.scenes.find(s => s.id === sceneId)
    if (!scene) return
    updateScene(sceneId, {
      dialogues: scene.dialogues.filter(d => d.id !== dialogueId),
    })
  }

  if (!currentScript) {
    return (
      <div className="panel p-4 flex items-center justify-center h-full">
        <div className="text-center text-slate-400">
          <FileText size={48} className="mx-auto mb-2 opacity-50" />
          <p>请先创建或选择一个剧本</p>
        </div>
      </div>
    )
  }

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">{currentScript.title}</h2>
          <span className="px-2 py-1 bg-primary-600/20 text-primary-400 text-sm rounded">
            {currentScript.genre}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAIGenerator(true)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Sparkles size={18} />
            AI生成剧本
          </button>
          <button
            onClick={() => setShowImportText(true)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Upload size={18} />
            导入文本
          </button>
          <button
            onClick={() => setShowVideoPromptOptimizer(true)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Wand2 size={18} />
            优化视频提示词
          </button>
          <button onClick={handleAddScene} className="btn btn-primary flex items-center gap-2">
            <Plus size={18} />
            添加场景
          </button>
        </div>
      </div>

      {showAIGenerator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">AI生成剧本</h3>
              <button onClick={() => setShowAIGenerator(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">类型</label>
                <select
                  className="select"
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                >
                  {GENRES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">故事描述</label>
                <textarea
                  className="textarea"
                  rows={4}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="描述你想要的故事情节..."
                />
              </div>
              <button
                onClick={handleAIGenerate}
                disabled={isGenerating}
                className="btn btn-primary w-full"
              >
                {isGenerating ? '生成中...' : '开始生成'}
              </button>
              {errorMessage && (
                <div className="flex items-start gap-2 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
                  <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showImportText && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Upload size={20} />
                导入文本生成剧本
              </h3>
              <button onClick={() => setShowImportText(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                <p className="text-sm text-blue-300">
                  导入已有的故事文本，AI将自动分析并生成结构化的剧本格式（场景划分、角色对话等）
                </p>
              </div>
              <div>
                <label className="label">故事文本</label>
                <textarea
                  className="textarea"
                  rows={10}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="粘贴你的故事文本、小说片段或剧本大纲...

例如：
清晨的阳光透过窗帘，小林缓缓睁开眼睛。今天是他期待已久的日子——大学毕业典礼。他迅速起身，开始梳洗打扮。

「今天一定要表现得自然些」他暗自想着，穿上了那套准备已久的西装。"
                />
                <p className="text-xs text-slate-500 mt-1">
                  支持粘贴中文故事文本、小说片段等，AI会自动识别角色和对话
                </p>
              </div>
              <button
                onClick={handleImportFromText}
                disabled={isImporting || !importText.trim()}
                className="btn btn-primary w-full"
              >
                {isImporting ? '分析中...' : '开始导入'}
              </button>
              {errorMessage && (
                <div className="flex items-start gap-2 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
                  <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showVideoPromptOptimizer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Wand2 size={20} />
                视频提示词优化
              </h3>
              <button onClick={() => setShowVideoPromptOptimizer(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">原始描述（中文）</label>
                <textarea
                  className="textarea"
                  rows={3}
                  value={videoPromptInput}
                  onChange={(e) => setVideoPromptInput(e.target.value)}
                  placeholder="例如：一个女孩在海边奔跑，日落时分..."
                />
              </div>
              <button
                onClick={handleOptimizeVideoPrompt}
                disabled={isOptimizingPrompt || !videoPromptInput.trim()}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                {isOptimizingPrompt ? (
                  <>
                    <Sparkles size={18} className="animate-spin" />
                    优化中...
                  </>
                ) : (
                  <>
                    <Wand2 size={18} />
                    优化提示词
                  </>
                )}
              </button>
              
              {optimizedVideoPrompt && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">优化结果</span>
                      <button
                        onClick={() => copyToClipboard(optimizedVideoPrompt)}
                        className="text-xs text-primary-400 hover:underline"
                      >
                        复制
                      </button>
                    </div>
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap max-h-60 overflow-auto">
                      {optimizedVideoPrompt}
                    </pre>
                  </div>
                </div>
              )}
              
              {errorMessage && (
                <div className="flex items-start gap-2 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
                  <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
              
              <p className="text-xs text-slate-500">
                使用video-prompt技能优化提示词，支持Seedance、Runway、Pika、Kling等模型
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className="label">剧本简介</label>
        <textarea
          className="textarea"
          rows={2}
          value={currentScript.description}
          onChange={(e) => updateScript({ description: e.target.value })}
          placeholder="输入剧本简介..."
        />
      </div>

      <div className="space-y-4">
        {currentScript.scenes.map((scene, index) => (
          <div key={scene.id} className="card">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setCurrentScene(currentScene?.id === scene.id ? null : scene)}
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-400">#{index + 1}</span>
                <h3 className="font-medium">{scene.name}</h3>
                <span className="text-sm text-slate-500">{scene.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <ChevronRight
                  size={20}
                  className={`transition-transform ${currentScene?.id === scene.id ? 'rotate-90' : ''}`}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteScene(scene.id)
                  }}
                  className="p-1 text-slate-400 hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {currentScene?.id === scene.id && (
              <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">场景名称</label>
                    <input
                      type="text"
                      className="input"
                      value={scene.name}
                      onChange={(e) => updateScene(scene.id, { name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">地点</label>
                    <input
                      type="text"
                      className="input"
                      value={scene.location}
                      onChange={(e) => updateScene(scene.id, { location: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">时间</label>
                    <select
                      className="select"
                      value={scene.timeOfDay}
                      onChange={(e) => updateScene(scene.id, { timeOfDay: e.target.value as Scene['timeOfDay'] })}
                    >
                      <option value="morning">早晨</option>
                      <option value="afternoon">下午</option>
                      <option value="evening">傍晚</option>
                      <option value="night">夜晚</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">场景描述</label>
                    <input
                      type="text"
                      className="input"
                      value={scene.description}
                      onChange={(e) => updateScene(scene.id, { description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="label mb-0">对话</label>
                    <button
                      onClick={() => handleAddDialogue(scene.id)}
                      className="btn btn-secondary text-sm py-1"
                    >
                      <Plus size={14} className="mr-1" />
                      添加对话
                    </button>
                  </div>
                  <div className="space-y-2">
                    {scene.dialogues.map((dialogue) => (
                      <div key={dialogue.id} className="bg-slate-700/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <select
                            className="select py-1 text-sm"
                            value={dialogue.characterId}
                            onChange={(e) => handleUpdateDialogue(scene.id, dialogue.id, { characterId: e.target.value })}
                          >
                            {characters.map((char) => (
                              <option key={char.id} value={char.id}>{char.name}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            className="input py-1 text-sm flex-1"
                            placeholder="情绪"
                            value={dialogue.emotion || ''}
                            onChange={(e) => handleUpdateDialogue(scene.id, dialogue.id, { emotion: e.target.value })}
                          />
                          <button
                            onClick={() => handleDeleteDialogue(scene.id, dialogue.id)}
                            className="p-1 text-slate-400 hover:text-red-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <textarea
                          className="textarea text-sm"
                          rows={2}
                          placeholder="对话内容..."
                          value={dialogue.content}
                          onChange={(e) => handleUpdateDialogue(scene.id, dialogue.id, { content: e.target.value })}
                        />
                        <input
                          type="text"
                          className="input py-1 text-sm mt-2"
                          placeholder="动作描述（可选）"
                          value={dialogue.action || ''}
                          onChange={(e) => handleUpdateDialogue(scene.id, dialogue.id, { action: e.target.value })}
                        />
                      </div>
                    ))}
                    {scene.dialogues.length === 0 && (
                      <p className="text-slate-500 text-sm text-center py-4">暂无对话</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {currentScript.scenes.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <FileText size={48} className="mx-auto mb-2 opacity-50" />
            <p>还没有场景，点击上方按钮添加</p>
          </div>
        )}
      </div>
    </div>
  )
}
