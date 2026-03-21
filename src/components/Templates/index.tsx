import { useState, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { Download, Upload, Loader2, FileText, Wand2, AlertCircle, Check, ChevronRight, Layers } from 'lucide-react'
import { generateScript, importTextToScript, extractCharactersFromScript } from '../../utils/ai'
import type { Scene, Character } from '../../types'

const MANGA_TEMPLATES = [
  {
    id: 'adventure',
    name: '冒险之旅',
    genre: '冒险',
    prompt: '创作一个冒险故事：主角踏上未知旅程，在途中遇到志同道合的伙伴，一起面对各种挑战和困难，最终发现隐藏在旅途中的秘密。',
    sceneCount: 5,
    icon: '🗺️',
  },
  {
    id: 'romance',
    name: '甜蜜恋曲',
    genre: '爱情',
    prompt: '创作一个爱情故事：两个陌生人相遇，从最初的误会到逐渐了解，最后发现彼此是命中注定的缘分。',
    sceneCount: 4,
    icon: '💕',
  },
  {
    id: 'scifi',
    name: '未来都市',
    genre: '科幻',
    prompt: '创作一个科幻故事：发生在未来城市的悬疑动作故事，主角卷入一个涉及人工智能和人类命运的秘密计划中。',
    sceneCount: 6,
    icon: '🏙️',
  },
  {
    id: 'fantasy',
    name: '奇幻世界',
    genre: '奇幻',
    prompt: '创作一个奇幻故事：在充满魔法和剑的世界里，主角意外获得了神秘力量，必须踏上拯救世界的旅程。',
    sceneCount: 5,
    icon: '🧙',
  },
  {
    id: 'mystery',
    name: '悬疑解密',
    genre: '悬疑',
    prompt: '创作一个悬疑故事：围绕一个神秘事件展开调查，主角通过层层线索揭露隐藏在背后的真相。',
    sceneCount: 4,
    icon: '🔍',
  },
  {
    id: 'comedy',
    name: '日常搞笑',
    genre: '喜剧',
    prompt: '创作一个轻松搞笑的日常故事：描述主人公生活中的有趣经历和尴尬场面，充满温馨和欢乐。',
    sceneCount: 3,
    icon: '😂',
  },
]

const EXPORT_TEMPLATES = [
  {
    id: 'webtoon',
    name: '网页漫画',
    description: '适合手机竖屏阅读的条漫格式',
    aspectRatio: '9:16',
  },
  {
    id: 'print',
    name: '印刷漫画',
    description: '适合打印的A4尺寸漫画',
    aspectRatio: '3:4',
  },
  {
    id: 'cinematic',
    name: '电影感视频',
    description: '16:9横版视频，配合背景音乐',
    aspectRatio: '16:9',
  },
  {
    id: 'story',
    name: '图文故事',
    description: '图片配文字的社交媒体格式',
    aspectRatio: '1:1',
  },
]

type ImportStep = 'upload' | 'preview' | 'generating' | 'done'

interface ParsedContent {
  title: string
  description: string
  genre: string
  scenes: Array<{
    name: string
    description: string
    location: string
    timeOfDay: string
    dialogues: Array<{ character: string; content: string; emotion?: string }>
  }>
}

export function Templates() {
  const { 
    createNewScript, 
    exportData, 
    importData, 
    apiKey, 
    apiProvider, 
    apiModel, 
    apiBaseUrl,
    addCharacter,
    addScene,
    storyboard,
    addStoryboardPanel,
  } = useApp()
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  const [importStep, setImportStep] = useState<ImportStep>('upload')
  const [novelText, setNovelText] = useState('')
  const [parsedContent, setParsedContent] = useState<ParsedContent | null>(null)
  const [extractedCharacters, setExtractedCharacters] = useState<Character[]>([])
  const [importProgress, setImportProgress] = useState(0)
  const [generatePanels, setGeneratePanels] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUseTemplate = async (templateId: string) => {
    const template = MANGA_TEMPLATES.find(t => t.id === templateId)
    if (!template) return
    
    if (!apiKey) {
      alert('请先在设置中配置API密钥')
      return
    }

    setIsGenerating(true)
    setGeneratingId(template.id)
    setErrorMessage(null)

    try {
      const result = await generateScript(template.prompt, template.genre, {
        apiKey,
        provider: apiProvider,
        model: apiModel,
        baseUrl: apiBaseUrl,
      })

      createNewScript(result.title || template.name)
      
      if (result.scenes && Array.isArray(result.scenes)) {
        for (const scene of result.scenes) {
          addScene({
            name: scene.name,
            description: scene.description,
            location: scene.location,
            timeOfDay: scene.timeOfDay,
            dialogues: scene.dialogues || [],
          })
        }
      }

      if (result.characters && Array.isArray(result.characters)) {
        for (const char of result.characters) {
          addCharacter({
            name: char.name,
            description: char.description,
            appearance: char.appearance,
            personality: char.personality,
            traits: char.traits || [],
          })
        }
      }
    } catch (error) {
      console.error('生成失败:', error)
      setErrorMessage(error instanceof Error ? error.message : '生成失败，请重试')
    } finally {
      setIsGenerating(false)
      setGeneratingId(null)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setNovelText(text)
      setImportStep('preview')
    }
    
    if (file.name.endsWith('.txt')) {
      reader.readAsText(file)
    } else if (file.name.endsWith('.docx')) {
      alert('Word文档暂不支持，请使用TXT格式或粘贴文本')
    }
    e.target.value = ''
  }

  const handleParseNovel = async () => {
    if (!novelText.trim()) {
      setErrorMessage('请输入小说内容')
      return
    }

    setImportStep('generating')
    setImportProgress(10)
    setErrorMessage(null)

    try {
      setImportProgress(30)
      
      const config = {
        apiKey: apiKey,
        provider: apiProvider,
        model: apiModel,
        baseUrl: apiBaseUrl,
      }
      
      const result = await importTextToScript(novelText, config)

      setParsedContent(result as unknown as ParsedContent)
      setImportProgress(60)

      if (result.scenes && result.scenes.length > 0) {
        const extracted = await extractCharactersFromScript(
          result.title || '未命名',
          result.scenes as unknown as Scene[],
          config
        )
        setExtractedCharacters(extracted as unknown as Character[])
      }

      setImportProgress(100)
    } catch (error) {
      console.error('解析失败:', error)
      setErrorMessage(error instanceof Error ? error.message : '解析失败，请重试')
      setImportStep('preview')
    }
  }

  const handleImportConfirm = () => {
    if (!parsedContent) return

    createNewScript(parsedContent.title || '导入剧本')

    if (extractedCharacters.length > 0) {
      for (const char of extractedCharacters) {
        addCharacter({
          name: char.name,
          description: char.description,
          appearance: char.appearance,
          personality: char.personality,
          traits: char.traits || [],
        })
      }
    }

    if (parsedContent.scenes) {
      for (const scene of parsedContent.scenes) {
        addScene({
          name: scene.name,
          description: scene.description,
          location: scene.location,
          timeOfDay: scene.timeOfDay as Scene['timeOfDay'],
          dialogues: scene.dialogues.map(d => ({
            id: crypto.randomUUID(),
            characterId: d.character,
            content: d.content,
            emotion: d.emotion,
          })),
        })
      }

      if (generatePanels && storyboard) {
        for (const scene of parsedContent.scenes) {
          addStoryboardPanel({
            sceneId: scene.name,
            description: scene.description,
            dialogue: scene.dialogues[0]?.content,
          })
        }
      }
    }

    setImportStep('done')
    setTimeout(() => {
      setImportStep('upload')
      setNovelText('')
      setParsedContent(null)
      setExtractedCharacters([])
      setImportProgress(0)
    }, 2000)
  }

  const handleImportProject = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          try {
            importData(event.target?.result as string)
            alert('导入成功！')
          } catch {
            alert('导入失败：文件格式不正确')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const handleExportProject = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `manga-project-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">模板与导入</h2>
          <p className="text-sm text-slate-400 mt-1">使用模板快速创建或导入小说</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleImportProject}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Upload size={18} />
            导入项目
          </button>
          <button
            onClick={handleExportProject}
            className="btn btn-primary flex items-center gap-2"
          >
            <Download size={18} />
            导出项目
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-400 text-sm flex items-center gap-2">
          <AlertCircle size={18} />
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Wand2 size={18} className="text-primary-400" />
            <h3 className="font-medium">AI一键生成</h3>
          </div>

          {importStep === 'upload' && (
            <div className="space-y-4">
              <div className="card p-6 text-center">
                <FileText size={48} className="mx-auto mb-4 text-slate-400" />
                <h4 className="font-medium mb-2">导入小说文本</h4>
                <p className="text-sm text-slate-400 mb-4">
                  支持TXT格式，或直接粘贴文本内容
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    <Upload size={16} />
                    选择文件
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <button
                    onClick={() => setImportStep('preview')}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    粘贴文本
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {MANGA_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleUseTemplate(template.id)}
                    disabled={isGenerating}
                    className="card p-4 text-left hover:border-primary-500 transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">
                        {generatingId === template.id ? (
                          <Loader2 size={24} className="animate-spin" />
                        ) : (
                          template.icon
                        )}
                      </span>
                      <span className="text-xs bg-slate-700 px-2 py-0.5 rounded">
                        {template.genre}
                      </span>
                    </div>
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {generatingId === template.id ? '生成中...' : `${template.sceneCount}个场景`}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {importStep === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">输入小说内容</h4>
                <button
                  onClick={() => setImportStep('upload')}
                  className="text-sm text-slate-400 hover:text-white"
                >
                  返回
                </button>
              </div>
              <textarea
                className="textarea h-48"
                value={novelText}
                onChange={(e) => setNovelText(e.target.value)}
                placeholder="粘贴或输入小说内容，AI会自动解析剧情和角色..."
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  {novelText.length} 字符
                </span>
                <button
                  onClick={handleParseNovel}
                  disabled={!novelText.trim()}
                  className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  <Wand2 size={16} />
                  AI解析剧情 {apiKey ? '' : '(免费)'}
                </button>
              </div>
            </div>
          )}

          {importStep === 'generating' && (
            <div className="card p-8 text-center">
              <Loader2 size={48} className="mx-auto mb-4 animate-spin text-primary-400" />
              <h4 className="font-medium mb-2">AI正在解析小说...</h4>
              <div className="w-full bg-slate-700 h-2 rounded-full mt-4">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              <p className="text-sm text-slate-400 mt-2">{importProgress}%</p>
            </div>
          )}

          {importStep === 'done' && (
            <div className="card p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-green-600 rounded-full flex items-center justify-center">
                <Check size={24} className="text-white" />
              </div>
              <h4 className="font-medium mb-2">导入成功！</h4>
              <p className="text-sm text-slate-400">正在跳转到剧本编辑...</p>
            </div>
          )}
        </div>

        <div>
          {parsedContent && importStep !== 'done' && (
            <div className="space-y-4 mb-6">
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">解析预览</h4>
                  <button
                    onClick={handleImportConfirm}
                    className="btn btn-primary text-sm"
                  >
                    确认导入
                  </button>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">标题:</span>
                    <span>{parsedContent.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">类型:</span>
                    <span>{parsedContent.genre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">场景数:</span>
                    <span>{parsedContent.scenes?.length || 0}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generatePanels}
                      onChange={(e) => setGeneratePanels(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">自动生成分镜</span>
                  </label>
                </div>
              </div>

              {extractedCharacters.length > 0 && (
                <div className="card p-4">
                  <h4 className="font-medium mb-2">提取的角色 ({extractedCharacters.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {extractedCharacters.map((char, i) => (
                      <span key={i} className="px-2 py-1 bg-primary-600/20 text-primary-400 text-xs rounded">
                        {char.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Layers size={18} className="text-primary-400" />
            导出模板
          </h3>
          <div className="space-y-3">
            {EXPORT_TEMPLATES.map((template) => (
              <div key={template.id} className="card p-4">
                <h4 className="font-medium">{template.name}</h4>
                <p className="text-sm text-slate-400 mt-1">{template.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                  <span>比例: {template.aspectRatio}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-slate-800 rounded-lg">
        <h3 className="font-medium mb-2">💡 使用说明</h3>
        <ul className="text-sm text-slate-400 space-y-1">
          <li>• 导入小说文本：AI自动解析剧情、角色和场景</li>
          <li>• 剧本模板：选择题材快速生成完整剧本</li>
          <li>• 开启"自动生成分镜"可一键创建所有分镜</li>
          <li>• 导出项目可以备份或分享给他人</li>
        </ul>
      </div>
    </div>
  )
}
