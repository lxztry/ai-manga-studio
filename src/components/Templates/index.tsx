import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Sparkles, Download, Upload, Grid, Loader2 } from 'lucide-react'
import { generateScript } from '../../utils/ai'
import type { Scene, Dialogue } from '../../types'

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

export function Templates() {
  const { currentScript, createNewScript, updateScript, exportData, importData, apiKey, apiProvider, apiModel, apiBaseUrl } = useApp()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const handleUseTemplate = async (templateId: string, retryCount = 0) => {
    const template = MANGA_TEMPLATES.find(t => t.id === templateId)
    if (!template) return
    
    if (!apiKey) {
      alert('请先在设置中配置API密钥')
      return
    }

    setIsGenerating(true)
    setGeneratingId(templateId)
    setErrorMessage(null)

    try {
      const result = await generateScript(template.prompt, template.genre, {
        apiKey,
        provider: apiProvider,
        model: apiModel,
        baseUrl: apiBaseUrl,
      })

      createNewScript(template.name)
      
      updateScript({
        title: result.title || template.name,
        description: result.description || template.prompt,
        genre: result.genre || template.genre,
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

      alert('剧本生成成功！请到剧本编辑页面查看')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '生成失败'
      
      if (errorMsg.includes('过于频繁') || errorMsg.includes('429') || errorMsg.includes('rate limit')) {
        if (retryCount < 2) {
          const waitTime = (retryCount + 1) * 3000
          setErrorMessage(`请求受限，${waitTime/1000}秒后自动重试...`)
          await sleep(waitTime)
          setIsGenerating(true)
          return handleUseTemplate(templateId, retryCount + 1)
        }
        setErrorMessage('请求次数已达上限，请30秒后再试，或更换API提供商')
      } else {
        setErrorMessage(errorMsg)
      }
    } finally {
      setIsGenerating(false)
      setGeneratingId(null)
    }
  }

  const handleExportProject = () => {
    if (!currentScript) {
      alert('请先创建或选择一个剧本')
      return
    }
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentScript.title}_backup.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportProject = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (ev) => {
          try {
            importData(ev.target?.result as string)
            alert('项目导入成功！')
          } catch {
            alert('导入失败，请检查文件格式')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">模板与分享</h2>
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
        <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-400 text-sm">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Sparkles size={18} className="text-primary-400" />
            剧本模板
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {MANGA_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => handleUseTemplate(template.id)}
                disabled={isGenerating}
                className="card p-4 text-left hover:border-primary-500 transition-colors disabled:opacity-50"
              >
                <div className="text-2xl mb-2">
                  {generatingId === template.id ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    template.icon
                  )}
                </div>
                <h4 className="font-medium">{template.name}</h4>
                <p className="text-xs text-slate-400 mt-1">{template.prompt.slice(0, 30)}...</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                  <span className="bg-slate-700 px-2 py-0.5 rounded">{template.genre}</span>
                  <span>{generatingId === template.id ? '生成中...' : `${template.sceneCount}个场景`}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Grid size={18} className="text-primary-400" />
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
          <li>• 点击剧本模板快速创建新项目</li>
          <li>• 导出项目可以备份或分享给他人</li>
          <li>• 导入项目可以恢复备份或接收他人分享</li>
          <li>• 选择合适的导出模板以适配不同平台</li>
        </ul>
      </div>
    </div>
  )
}
