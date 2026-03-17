import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Plus, FileText, Trash2, ChevronRight, Sparkles, X, AlertCircle, Wand2, Upload, Users } from 'lucide-react'
import type { Scene, Dialogue } from '../../types'
import { generateScript, optimizeVideoPrompt, importTextToScript, extractCharactersFromScript, type ExtractedCharacter } from '../../utils/ai'

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
    addCharacter,
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
  const [showExtractCharacters, setShowExtractCharacters] = useState(false)
  const [extractedCharacters, setExtractedCharacters] = useState<ExtractedCharacter[]>([])
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const handleExtractCharacters = async (retryCount = 0) => {
    if (!currentScript?.scenes.length) {
      alert('当前剧本没有场景')
      return
    }
    if (!apiKey) {
      alert('请先在设置中配置API密钥')
      return
    }

    setIsExtracting(true)
    setExtractError(null)

    try {
      const chars = await extractCharactersFromScript(
        currentScript.title,
        currentScript.scenes,
        { apiKey, provider: apiProvider, model: apiModel, baseUrl: apiBaseUrl }
      )
      setExtractedCharacters(chars)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '提取失败'
      
      if (errorMsg.includes('过于频繁') || errorMsg.includes('429') || errorMsg.includes('rate limit')) {
        if (retryCount < 2) {
          const waitTime = (retryCount + 1) * 3000
          setExtractError(`请求受限，${waitTime/1000}秒后自动重试...`)
          await sleep(waitTime)
          return handleExtractCharacters(retryCount + 1)
        }
        setExtractError('请求次数已达上限，请30秒后再试')
      } else {
        setExtractError(errorMsg)
      }
    } finally {
      setIsExtracting(false)
    }
  }

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
          <button
            onClick={() => setShowExtractCharacters(true)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Users size={18} />
            提取角色
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

      {showExtractCharacters && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Users size={20} />
                从剧本提取角色
              </h3>
              <button onClick={() => { setShowExtractCharacters(false); setExtractError(null); setExtractedCharacters([]) }} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            {!extractedCharacters.length && !isExtracting && (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-4">AI将从当前剧本的场景和对话中自动提取角色信息</p>
                {extractError && (
                  <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-400 text-sm">
                    {extractError}
                  </div>
                )}
                <button
                  onClick={() => handleExtractCharacters()}
                  disabled={isExtracting}
                  className="btn btn-primary disabled:opacity-50"
                >
                  {isExtracting ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline mr-2" />
                      提取中...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} className="inline mr-2" />
                      开始提取
                    </>
                  )}
                </button>
              </div>
            )}

            {isExtracting && (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-slate-400">正在分析剧本提取角色...</p>
              </div>
            )}

            {extractedCharacters.length > 0 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-400">已提取 {extractedCharacters.length} 个角色，可以修改后添加到角色库</p>
                
                <div className="max-h-60 overflow-y-auto space-y-3">
                  {extractedCharacters.map((char, index) => (
                    <div key={index} className="p-3 bg-slate-800 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <input
                          type="text"
                          value={char.name}
                          onChange={(e) => {
                            const updated = [...extractedCharacters]
                            updated[index].name = e.target.value
                            setExtractedCharacters(updated)
                          }}
                          className="input flex-1 mr-2"
                          placeholder="角色名"
                        />
                        <button
                          onClick={() => {
                            const updated = extractedCharacters.filter((_, i) => i !== index)
                            setExtractedCharacters(updated)
                          }}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={char.appearance}
                          onChange={(e) => {
                            const updated = [...extractedCharacters]
                            updated[index].appearance = e.target.value
                            setExtractedCharacters(updated)
                          }}
                          className="input text-sm"
                          placeholder="外貌描述"
                        />
                        <input
                          type="text"
                          value={char.personality}
                          onChange={(e) => {
                            const updated = [...extractedCharacters]
                            updated[index].personality = e.target.value
                            setExtractedCharacters(updated)
                          }}
                          className="input text-sm"
                          placeholder="性格特点"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      extractedCharacters.forEach(char => {
                        addCharacter({
                          name: char.name,
                          description: char.description,
                          appearance: char.appearance,
                          personality: char.personality,
                          traits: char.traits,
                        })
                      })
                      alert(`已添加 ${extractedCharacters.length} 个角色到角色库`)
                      setShowExtractCharacters(false)
                      setExtractedCharacters([])
                    }}
                    className="btn btn-primary flex-1"
                  >
                    全部添加到角色库
                  </button>
                  <button
                    onClick={() => setExtractedCharacters([])}
                    className="btn btn-secondary"
                  >
                    重新提取
                  </button>
                </div>
              </div>
            )}
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
