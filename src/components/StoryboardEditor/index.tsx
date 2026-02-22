import { useState, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { Plus, Grid, Trash2, ChevronUp, ChevronDown, Image, Wand2, Upload, X, Sparkles } from 'lucide-react'
import type { StoryboardPanel } from '../../types'
import { generateImagePrompt } from '../../utils'

const CAMERA_ANGLES = [
  { value: 'close-up', label: '特写' },
  { value: 'medium', label: '中景' },
  { value: 'wide', label: '广角' },
  { value: 'birds-eye', label: '俯视' },
  { value: 'low-angle', label: '仰视' },
]

export function StoryboardEditor() {
  const {
    currentScript,
    storyboard,
    characters,
    addStoryboardPanel,
    updateStoryboardPanel,
    deleteStoryboardPanel,
    reorderStoryboardPanels,
  } = useApp()
  const [selectedPanel, setSelectedPanel] = useState<string | null>(null)
  const [generatingPanelId, setGeneratingPanelId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAddPanel = () => {
    addStoryboardPanel({
      description: '',
      cameraAngle: 'medium',
    })
  }

  const handleMovePanel = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= (storyboard?.panels.length || 0)) return
    reorderStoryboardPanels(index, newIndex)
  }

  const handleGeneratePrompt = (panel: StoryboardPanel) => {
    const prompt = generateImagePrompt(panel, characters)
    updateStoryboardPanel(panel.id, { prompt })
  }

  const handleGenerateImage = async (panelId: string, description: string) => {
    if (!description?.trim()) {
      alert('请先填写画面描述')
      return
    }
    setGeneratingPanelId(panelId)
    try {
      const siliconflowKey = localStorage.getItem('siliconflow-api-key')
      
      if (!siliconflowKey) {
        alert('请先在设置中配置 SiliconFlow API密钥\n前往 https://siliconflow.cn 获取免费密钥')
        setGeneratingPanelId(null)
        return
      }

      const response = await fetch('https://api.siliconflow.cn/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${siliconflowKey}`,
        },
        body: JSON.stringify({
          model: 'black-forest-labs/FLUX.1-schnell',
          prompt: description.slice(0, 500),
          image_size: '1024x768',
          num_inference_steps: 20,
          guidance_scale: 7.5,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('API密钥无效，请检查设置中的SiliconFlow密钥')
        }
        throw new Error(`生成失败: ${response.status}`)
      }

      const data = await response.json()
      if (!data.images?.[0]?.url) {
        throw new Error('未能获取图像')
      }

      updateStoryboardPanel(panelId, { imageUrl: data.images[0].url })
    } catch (error) {
      console.error('生成图像失败:', error)
      alert(error instanceof Error ? error.message : '生成图像失败，请检查网络连接')
    } finally {
      setGeneratingPanelId(null)
    }
  }

  const handleBatchGenerateImages = async () => {
    const siliconflowKey = localStorage.getItem('siliconflow-api-key')
    if (!siliconflowKey) {
      alert('请先在设置中配置 SiliconFlow API密钥')
      return
    }

    const panelsWithoutImage = storyboard?.panels.filter(p => !p.imageUrl && p.description) || []
    if (panelsWithoutImage.length === 0) {
      alert('没有需要生成图像的分镜（需要有画面描述且未上传图片）')
      return
    }

    if (!confirm(`将为 ${panelsWithoutImage.length} 个分镜生成图像，继续？`)) {
      return
    }

    for (const panel of panelsWithoutImage) {
      setGeneratingPanelId(panel.id)
      try {
        const response = await fetch('https://api.siliconflow.cn/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${siliconflowKey}`,
          },
          body: JSON.stringify({
            model: 'black-forest-labs/FLUX.1-schnell',
            prompt: panel.description.slice(0, 500),
            image_size: '1024x768',
            num_inference_steps: 20,
            guidance_scale: 7.5,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.images?.[0]?.url) {
            updateStoryboardPanel(panel.id, { imageUrl: data.images[0].url })
          }
        }
      } catch (error) {
        console.error(`生成图像失败 ${panel.id}:`, error)
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    setGeneratingPanelId(null)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, panelId?: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      if (panelId) {
        updateStoryboardPanel(panelId, { imageUrl: base64 })
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  if (!currentScript || !storyboard) {
    return (
      <div className="panel p-4 flex items-center justify-center h-full">
        <div className="text-center text-slate-400">
          <Grid size={48} className="mx-auto mb-2 opacity-50" />
          <p>请先创建剧本</p>
        </div>
      </div>
    )
  }

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">分镜编辑</h2>
        <div className="flex gap-2">
          {currentScript && currentScript.scenes.length > 0 && (
            <button
              onClick={() => {
                if (confirm('将自动为每个场景创建1个分镜，是否继续？')) {
                  currentScript.scenes.forEach((scene) => {
                    addStoryboardPanel({
                      sceneId: scene.id,
                      description: scene.description,
                      dialogue: scene.dialogues[0]?.content || '',
                      cameraAngle: 'medium',
                    })
                  })
                }
              }}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Sparkles size={18} />
              从场景生成
            </button>
          )}
          {storyboard && storyboard.panels.some(p => !p.imageUrl && p.description) && (
            <button
              onClick={handleBatchGenerateImages}
              disabled={!!generatingPanelId}
              className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles size={18} />
              {generatingPanelId ? '生成中...' : '批量生成图像'}
            </button>
          )}
          <label className="btn btn-secondary flex items-center gap-2 cursor-pointer">
            <Upload size={18} />
            批量导入
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = e.target.files
                if (files) {
                  Array.from(files).forEach((file) => {
                    if (file.type.startsWith('image/')) {
                      const reader = new FileReader()
                      reader.onload = (event) => {
                        const base64 = event.target?.result as string
                        addStoryboardPanel({
                          imageUrl: base64,
                          description: file.name.replace(/\.[^/.]+$/, ''),
                        })
                      }
                      reader.readAsDataURL(file)
                    }
                  })
                }
                e.target.value = ''
              }}
            />
          </label>
          <button onClick={handleAddPanel} className="btn btn-primary flex items-center gap-2">
            <Plus size={18} />
            添加分镜
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {storyboard.panels.map((panel, index) => (
          <div
            key={panel.id}
            className={`storyboard-panel ${selectedPanel === panel.id ? 'storyboard-panel-selected' : ''}`}
            onClick={() => setSelectedPanel(selectedPanel === panel.id ? null : panel.id)}
          >
            <div className="aspect-[4/3] bg-slate-800 flex items-center justify-center relative group">
              {panel.isGenerating || generatingPanelId === panel.id ? (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-2" />
                    <span className="text-sm">生成中...</span>
                  </div>
                </div>
              ) : panel.imageUrl ? (
                <img
                  src={panel.imageUrl}
                  alt={panel.description}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              ) : (
                <div className="text-center text-slate-500">
                  <Image size={32} className="mx-auto mb-1" />
                  <span className="text-xs">#{index + 1} 点击上传</span>
                </div>
              )}
              <label 
                className="absolute inset-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, panel.id)}
                />
                <div className="bg-black/70 px-3 py-2 rounded-lg text-sm">
                  {panel.imageUrl ? '更换图片' : '上传图片'}
                </div>
              </label>
              {!panel.imageUrl && panel.description && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleGenerateImage(panel.id, panel.description)
                  }}
                  disabled={generatingPanelId === panel.id}
                  className="absolute bottom-2 right-2 btn btn-primary btn-sm flex items-center gap-1"
                  title="根据描述生成图像"
                >
                  {generatingPanelId === panel.id ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles size={12} />
                  )}
                  生成
                </button>
              )}
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">#{index + 1}</span>
                  {panel.sceneId && (
                    <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded">
                      {currentScript?.scenes.find(s => s.id === panel.sceneId)?.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMovePanel(index, 'up')
                    }}
                    disabled={index === 0}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMovePanel(index, 'down')
                    }}
                    disabled={index === storyboard.panels.length - 1}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteStoryboardPanel(panel.id)
                    }}
                    className="p-1 text-slate-400 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-300 line-clamp-2">{panel.description || '无描述'}</p>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                <span>{CAMERA_ANGLES.find(a => a.value === panel.cameraAngle)?.label}</span>
                {panel.sceneId && (
                  <span className="text-primary-400 truncate max-w-[100px]">
                    {currentScript?.scenes.find(s => s.id === panel.sceneId)?.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {storyboard.panels.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400">
            <Grid size={48} className="mx-auto mb-2 opacity-50" />
            <p>还没有分镜，点击上方按钮添加</p>
            <p className="text-sm mt-1">或点击"批量导入"一次导入多张图片</p>
          </div>
        )}
      </div>

      {selectedPanel && (
        <PanelEditor
          panelId={selectedPanel}
          onClose={() => setSelectedPanel(null)}
          onGeneratePrompt={handleGeneratePrompt}
          onFileUpload={handleFileUpload}
          onGenerateImage={handleGenerateImage}
          generatingPanelId={generatingPanelId}
        />
      )}
    </div>
  )
}

function PanelEditor({
  panelId,
  onClose,
  onGeneratePrompt,
  onFileUpload,
  onGenerateImage,
  generatingPanelId,
}: {
  panelId: string
  onClose: () => void
  onGeneratePrompt: (panel: StoryboardPanel) => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>, panelId: string) => void
  onGenerateImage: (panelId: string, description: string) => void
  generatingPanelId: string | null
}) {
  const { storyboard, updateStoryboardPanel, currentScript } = useApp()
  const panel = storyboard?.panels.find(p => p.id === panelId)

  if (!panel) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">编辑分镜 #{panel.order + 1}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="aspect-video bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden relative group">
            {panel.imageUrl ? (
              <img src={panel.imageUrl} alt="" className="w-full h-full object-contain" />
            ) : (
              <div className="text-center text-slate-500">
                <Image size={48} className="mx-auto mb-2" />
                <p>暂无图片</p>
              </div>
            )}
            <label className="absolute inset-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 flex items-center justify-center">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onFileUpload(e, panelId)}
              />
              <div className="bg-black/70 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                <Upload size={16} />
                {panel.imageUrl ? '更换图片' : '上传图片'}
              </div>
            </label>
          </div>

          <div className="flex gap-2">
            <label className="btn btn-primary flex-1 flex items-center justify-center gap-2 cursor-pointer">
              <Upload size={16} />
              上传图片
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onFileUpload(e, panelId)}
              />
            </label>
            {panel.imageUrl && (
              <button
                onClick={() => updateStoryboardPanel(panelId, { imageUrl: '' })}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Trash2 size={16} />
                移除图片
              </button>
            )}
          </div>

          <div>
            <label className="label">场景选择</label>
            <div className="flex gap-2">
              <select
                className="select flex-1"
                value={panel.sceneId}
                onChange={(e) => updateStoryboardPanel(panelId, { sceneId: e.target.value })}
              >
                <option value="">无</option>
                {currentScript?.scenes.map((scene) => (
                  <option key={scene.id} value={scene.id}>{scene.name}</option>
                ))}
              </select>
              {panel.sceneId && (
                <button
                  onClick={() => {
                    const scene = currentScript?.scenes.find(s => s.id === panel.sceneId)
                    if (scene) {
                      updateStoryboardPanel(panelId, { 
                        description: scene.description,
                        dialogue: scene.dialogues[0]?.content || ''
                      })
                    }
                  }}
                  className="btn btn-secondary whitespace-nowrap"
                  title="从场景描述生成画面描述"
                >
                  生成描述
                </button>
              )}
            </div>
            {panel.sceneId && (
              <p className="text-xs text-slate-500 mt-1">
                点击"生成描述"自动填充场景描述和对话
              </p>
            )}
          </div>

          <div>
            <label className="label">画面描述</label>
            <div className="flex gap-2">
              <textarea
                className="textarea flex-1"
                rows={3}
                value={panel.description}
                onChange={(e) => updateStoryboardPanel(panelId, { description: e.target.value })}
                placeholder="描述这个分镜的画面内容..."
              />
              <button
                onClick={() => onGenerateImage(panelId, panel.description)}
                disabled={generatingPanelId === panelId}
                className="btn btn-secondary whitespace-nowrap disabled:opacity-50"
                title="根据画面描述生成图像"
              >
                {generatingPanelId === panelId ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    生成中
                  </span>
                ) : (
                  '生成图像'
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              填写画面描述后点击"生成图像"直接应用到分镜
            </p>
          </div>

          <div>
            <label className="label">对话文本</label>
            <textarea
              className="textarea"
              rows={2}
              value={panel.dialogue || ''}
              onChange={(e) => updateStoryboardPanel(panelId, { dialogue: e.target.value })}
              placeholder="分镜中的对话..."
            />
          </div>

          <div>
            <label className="label">镜头角度</label>
            <select
              className="select"
              value={panel.cameraAngle}
              onChange={(e) => updateStoryboardPanel(panelId, { cameraAngle: e.target.value as StoryboardPanel['cameraAngle'] })}
            >
              {CAMERA_ANGLES.map((angle) => (
                <option key={angle.value} value={angle.value}>{angle.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">AI图像提示词（可选）</label>
            <div className="flex gap-2">
              <textarea
                className="textarea flex-1"
                rows={2}
                value={panel.prompt || ''}
                onChange={(e) => updateStoryboardPanel(panelId, { prompt: e.target.value })}
                placeholder="如需AI生成，可填写提示词..."
              />
              <button
                onClick={() => onGeneratePrompt(panel)}
                className="btn btn-secondary h-fit self-end"
                title="自动生成提示词"
              >
                <Wand2 size={18} />
              </button>
            </div>
          </div>

          <div>
            <label className="label">图片URL（可选）</label>
            <input
              type="text"
              className="input"
              value={panel.imageUrl && !panel.imageUrl.startsWith('data:') ? panel.imageUrl : ''}
              onChange={(e) => updateStoryboardPanel(panelId, { imageUrl: e.target.value })}
              placeholder="输入网络图片URL..."
              disabled={panel.imageUrl?.startsWith('data:')}
            />
            {panel.imageUrl?.startsWith('data:') && (
              <p className="text-xs text-slate-500 mt-1">当前使用本地上传的图片</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
