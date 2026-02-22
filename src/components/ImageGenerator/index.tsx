import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Image, Sparkles, Download, RefreshCw, AlertCircle, Upload, X } from 'lucide-react'

const IMAGE_STYLES = [
  { value: 'manga', label: '日式漫画', prompt: 'Japanese manga style, black and white with screentones' },
  { value: 'anime', label: '动画风格', prompt: 'Anime style, vibrant colors, cel-shaded' },
  { value: 'realistic', label: '写实风格', prompt: 'Photorealistic, detailed, 8k quality' },
  { value: 'watercolor', label: '水彩风格', prompt: 'Watercolor painting, soft colors, artistic' },
  { value: 'comic', label: '美式漫画', prompt: 'American comic book style, bold lines, vibrant' },
  { value: 'sketch', label: '素描风格', prompt: 'Pencil sketch, detailed shading, artistic' },
  { value: 'gouache', label: '水粉风格', prompt: 'Gouache painting, thick brushstrokes, vivid' },
  { value: 'lineart', label: '线稿', prompt: 'Clean line art, black and white, detailed outlines' },
  { value: 'colorized', label: '线稿上色', prompt: 'Colorized manga, fully colored, professional' },
]

const CAMERA_ANGLES = [
  { value: 'close-up', label: '特写' },
  { value: 'medium', label: '中景' },
  { value: 'wide', label: '广角' },
  { value: 'birds-eye', label: '俯视' },
  { value: 'low-angle', label: '仰视' },
  { value: 'over-shoulder', label: '过肩镜' },
  { value: 'pov', label: '主观镜头' },
]

const ART_STYLES = [
  { value: 'none', label: '无' },
  { value: 'cinematic', label: '电影感' },
  { value: 'dramatic', label: '戏剧性' },
  { value: 'soft', label: '柔和' },
  { value: 'vibrant', label: '鲜艳' },
  { value: 'moody', label: '忧郁' },
  { value: 'dreamy', label: '梦幻' },
]

const IMAGE_PROVIDERS = [
  { 
    id: 'siliconflow', 
    name: 'SiliconFlow (免费)', 
    requiresKey: false,
    description: '免费额度，国内可用，支持FLUX模型'
  },
  { 
    id: 'pollinations', 
    name: 'Pollinations AI (免费)', 
    requiresKey: false,
    description: '完全免费，需代理'
  },
  { 
    id: 'pollinations-backup', 
    name: 'Pollinations 备用', 
    requiresKey: false,
    description: '免费备用接口'
  },
  { 
    id: 'huggingface', 
    name: 'Hugging Face (免费)', 
    requiresKey: true,
    description: '免费额度，需API密钥'
  },
  { 
    id: 'stability', 
    name: 'Stability AI', 
    requiresKey: true,
    description: '免费试用，需API密钥'
  },
  { 
    id: 'openrouter', 
    name: 'OpenRouter DALL-E', 
    requiresKey: true,
    description: '付费，高质量'
  },
  { 
    id: 'openai', 
    name: 'OpenAI DALL-E', 
    requiresKey: true,
    description: '付费，高质量'
  },
]

export function ImageGenerator() {
  const { characters, apiKey, storyboard, updateStoryboardPanel } = useApp()
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('manga')
  const [artStyle, setArtStyle] = useState('none')
  const [cameraAngle, setCameraAngle] = useState('medium')
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([])
  const [characterReference, setCharacterReference] = useState<string | null>(null)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageProvider, setImageProvider] = useState('siliconflow')

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('请输入画面描述')
      return
    }

    const provider = IMAGE_PROVIDERS.find(p => p.id === imageProvider)
    if (provider?.requiresKey && !apiKey) {
      setError(`使用 ${provider.name} 需要在设置中配置API密钥`)
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const characterDescriptions = characters
        .filter(c => selectedCharacters.includes(c.id))
        .map(c => `${c.name}: ${c.appearance}`)

      const fullPrompt = buildPrompt(
        prompt, 
        characterDescriptions, 
        style, 
        cameraAngle,
        artStyle,
        characterReference || undefined
      )
      
      let imageUrl: string | null = null

      switch (imageProvider) {
        case 'siliconflow':
          imageUrl = await generateWithSiliconFlow(fullPrompt)
          break
        case 'pollinations':
          imageUrl = await generateWithPollinations(fullPrompt)
          break
        case 'pollinations-backup':
          imageUrl = await generateWithPollinationsBackup(fullPrompt)
          break
        case 'huggingface':
          imageUrl = await generateWithHuggingFace(fullPrompt, apiKey)
          break
        case 'stability':
          imageUrl = await generateWithStability(fullPrompt, apiKey)
          break
        case 'openrouter':
          imageUrl = await generateWithOpenRouter(fullPrompt, apiKey)
          break
        case 'openai':
          imageUrl = await generateWithOpenAI(fullPrompt, apiKey)
          break
        default:
          throw new Error('未知的图像提供商')
      }

      if (imageUrl) {
        setGeneratedImage(imageUrl)
      } else {
        throw new Error('未能获取生成的图像')
      }
    } catch (err) {
      console.error('生成失败:', err)
      setError(err instanceof Error ? err.message : '图像生成失败')
    } finally {
      setIsGenerating(false)
    }
  }

  const generateWithSiliconFlow = async (prompt: string): Promise<string> => {
    const siliconflowKey = localStorage.getItem('siliconflow-api-key')
    
    const response = await fetch('https://api.siliconflow.cn/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${siliconflowKey || ''}`,
      },
      body: JSON.stringify({
        model: 'black-forest-labs/FLUX.1-schnell',
        prompt: prompt.slice(0, 500),
        image_size: '1024x768',
        num_inference_steps: 20,
        guidance_scale: 7.5,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      if (response.status === 401) {
        throw new Error('SiliconFlow API密钥无效，请在设置中配置')
      }
      throw new Error(`SiliconFlow API错误: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    if (!data.images?.[0]?.url) {
      throw new Error('未能获取生成的图像URL')
    }

    return data.images[0].url
  }

  const generateWithPollinations = async (prompt: string): Promise<string> => {
    const seed = Math.floor(Math.random() * 1000000)
    const cleanPrompt = prompt.slice(0, 400)
    const encodedPrompt = encodeURIComponent(cleanPrompt)
    
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true`
    
    try {
      const response = await fetch(imageUrl, {
        mode: 'cors',
        cache: 'no-cache',
      })
      
      if (response.ok) {
        const blob = await response.blob()
        return URL.createObjectURL(blob)
      }
      
      throw new Error(`请求失败: ${response.status}`)
    } catch {
      return imageUrl
    }
  }

  const generateWithPollinationsBackup = async (prompt: string): Promise<string> => {
    const seed = Math.floor(Math.random() * 1000000)
    const cleanPrompt = prompt.slice(0, 400)
    
    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: `Generate an image description and URL for: ${cleanPrompt}. Return only the image URL.` }],
        model: 'openai',
        seed,
        jsonMode: true,
      }),
    })
    
    if (!response.ok) throw new Error('备用接口请求失败')
    
    const text = await response.text()
    const urlMatch = text.match(/https?:\/\/[^\s"'<>]+\.(png|jpg|jpeg|gif|webp)/i)
    
    if (urlMatch) return urlMatch[0]
    
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=512&height=512&seed=${seed}`
  }

  const generateWithHuggingFace = async (prompt: string, key?: string): Promise<string> => {
    if (!key) throw new Error('请配置 Hugging Face API 密钥')
    
    const models = [
      'stabilityai/stable-diffusion-xl-base-1.0',
      'runwayml/stable-diffusion-v1-5',
    ]

    for (const model of models) {
      try {
        const response = await fetch(
          `https://api-inference.huggingface.co/models/${model}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              inputs: prompt,
              parameters: {
                width: 1024,
                height: 1024,
              },
            }),
          }
        )

        if (response.ok) {
          const blob = await response.blob()
          return URL.createObjectURL(blob)
        }
      } catch (e) {
        console.warn(`Model ${model} failed:`, e)
      }
    }

    throw new Error('Hugging Face 模型暂时不可用，请稍后重试')
  }

  const generateWithStability = async (prompt: string, key?: string): Promise<string> => {
    if (!key) throw new Error('请配置 Stability AI API 密钥')
    
    const response = await fetch(
      'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text_prompts: [{ text: prompt }],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          steps: 30,
          samples: 1,
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      let errorMsg = `图像生成失败 (${response.status})`
      try {
        const errorJson = JSON.parse(errorText)
        errorMsg = errorJson.message || errorMsg
      } catch {
        errorMsg = errorText || errorMsg
      }
      throw new Error(errorMsg)
    }

    const data = await response.json()
    const artifact = data.artifacts?.[0]
    if (artifact?.base64) {
      return `data:image/png;base64,${artifact.base64}`
    }
    throw new Error('未能获取生成的图像')
  }

  const generateWithOpenRouter = async (prompt: string, key?: string): Promise<string> => {
    if (!key) throw new Error('请配置 OpenRouter API 密钥')

    const response = await fetch('https://openrouter.ai/api/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'AI Manga Studio',
      },
      body: JSON.stringify({
        model: 'openai/dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMsg = `图像生成失败 (${response.status})`
      try {
        const errorJson = JSON.parse(errorText)
        errorMsg = errorJson.error?.message || errorJson.error || errorMsg
      } catch {
        errorMsg = errorText || errorMsg
      }
      throw new Error(errorMsg)
    }

    const data = await response.json()
    return data.data?.[0]?.url
  }

  const generateWithOpenAI = async (prompt: string, key?: string): Promise<string> => {
    if (!key) throw new Error('请配置 OpenAI API 密钥')

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMsg = `图像生成失败 (${response.status})`
      try {
        const errorJson = JSON.parse(errorText)
        errorMsg = errorJson.error?.message || errorJson.error || errorMsg
      } catch {
        errorMsg = errorText || errorMsg
      }
      throw new Error(errorMsg)
    }

    const data = await response.json()
    return data.data[0].url
  }

  const buildPrompt = (
    basePrompt: string,
    characterDescriptions: string[],
    style: string,
    angle: string,
    artStyle: string = 'none',
    characterRef?: string
  ): string => {
    const styleDescriptions: Record<string, string> = {
      manga: 'Japanese manga style, black and white with screentones, dynamic lines, expressive characters',
      anime: 'Anime style, vibrant colors, clean lines, cel-shaded, Studio Ghibli inspired',
      realistic: 'Photorealistic style, detailed textures, natural lighting, cinematic quality',
      watercolor: 'Watercolor painting style, soft edges, blended colors, artistic, dreamy atmosphere',
      comic: 'American comic book style, bold outlines, vibrant colors, dynamic action',
      sketch: 'Pencil sketch style, detailed shading, artistic, hand-drawn look',
      gouache: 'Gouache painting style, thick brushstrokes, vibrant opaque colors, matte finish',
      lineart: 'Clean line art, black and white, detailed outlines, no shading',
      colorized: 'Fully colored manga, professional coloring, vibrant, detailed',
    }

    const angleDescriptions: Record<string, string> = {
      'close-up': 'close-up shot, focused on face and emotions',
      medium: 'medium shot, showing upper body and expressions',
      wide: 'wide shot, showing full environment and context',
      'birds-eye': "bird's eye view, looking down from above",
      'low-angle': 'low angle shot, dramatic perspective from below',
      'over-shoulder': 'over-the-shoulder shot, showing two characters',
      'pov': 'first person perspective, POV shot',
    }

    const artStyleDescriptions: Record<string, string> = {
      cinematic: 'cinematic lighting, film grain, movie-quality',
      dramatic: 'dramatic lighting, high contrast, intense mood',
      soft: 'soft lighting, gentle, pastel colors, ethereal',
      vibrant: 'vibrant colors, high saturation, energetic',
      moody: 'moody atmosphere, dark tones, mysterious',
      dreamy: 'dreamy, soft focus, surreal, magical',
    }

    let fullPrompt = basePrompt

    if (characterDescriptions.length > 0) {
      fullPrompt += `. Characters: ${characterDescriptions.join('; ')}`
    }

    if (characterRef) {
      fullPrompt += `. Same character appearance as reference image`
    }

    fullPrompt += `. Style: ${styleDescriptions[style] || styleDescriptions.manga}`
    fullPrompt += `. Camera: ${angleDescriptions[angle] || angleDescriptions.medium}`

    if (artStyle !== 'none' && artStyleDescriptions[artStyle]) {
      fullPrompt += `. ${artStyleDescriptions[artStyle]}`
    }

    return fullPrompt
  }

  const handleDownload = async () => {
    if (!generatedImage) return
    try {
      const response = await fetch(generatedImage)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `manga-panel-${Date.now()}.png`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      const a = document.createElement('a')
      a.href = generatedImage
      a.download = `manga-panel-${Date.now()}.png`
      a.click()
    }
  }

  const handleApplyToStoryboard = () => {
    if (!generatedImage || !storyboard) return
    const lastPanel = storyboard.panels[storyboard.panels.length - 1]
    if (lastPanel) {
      updateStoryboardPanel(lastPanel.id, { imageUrl: generatedImage })
    }
  }

  const toggleCharacter = (characterId: string) => {
    setSelectedCharacters(prev =>
      prev.includes(characterId)
        ? prev.filter(id => id !== characterId)
        : [...prev, characterId]
    )
  }

  const currentProvider = IMAGE_PROVIDERS.find(p => p.id === imageProvider)

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">AI图像生成</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="label">图像提供商</label>
            <select
              className="select"
              value={imageProvider}
              onChange={(e) => {
                setImageProvider(e.target.value)
                setError(null)
              }}
            >
              {IMAGE_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {p.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">画面描述</label>
            <textarea
              className="textarea"
              rows={4}
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value)
                setError(null)
              }}
              placeholder="描述你想要生成的画面，例如：一个少年站在樱花树下，微风吹过..."
            />
          </div>

          <div>
            <label className="label">选择角色</label>
            <div className="flex flex-wrap gap-2">
              {characters.map((char) => (
                <button
                  key={char.id}
                  onClick={() => toggleCharacter(char.id)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedCharacters.includes(char.id)
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {char.name}
                </button>
              ))}
              {characters.length === 0 && (
                <span className="text-slate-500 text-sm">请先在角色管理中添加角色</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">画风</label>
              <select
                className="select"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              >
                {IMAGE_STYLES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">镜头</label>
              <select
                className="select"
                value={cameraAngle}
                onChange={(e) => setCameraAngle(e.target.value)}
              >
                {CAMERA_ANGLES.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">艺术风格</label>
              <select
                className="select"
                value={artStyle}
                onChange={(e) => setArtStyle(e.target.value)}
              >
                {ART_STYLES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">角色参考图</label>
              {characterReference ? (
                <div className="relative">
                  <img src={characterReference} alt="角色参考" className="w-full h-24 object-cover rounded" />
                  <button
                    onClick={() => setCharacterReference(null)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <label className="btn btn-secondary w-full flex items-center justify-center gap-2 cursor-pointer">
                  <Upload size={16} />
                  上传参考图
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (ev) => {
                          setCharacterReference(ev.target?.result as string)
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="btn btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                生成图像
              </>
            )}
          </button>

          {currentProvider && (
            <p className="text-xs text-slate-400">
              {currentProvider.id === 'pollinations' && (
                <>Pollinations AI 是完全免费的服务，无需API密钥。生成时间约30-60秒，请耐心等待。</>
              )}
              {currentProvider.id === 'pollinations-backup' && (
                <>Pollinations 备用接口，使用文本模型生成图片URL。</>
              )}
              {currentProvider.id === 'huggingface' && (
                <>获取免费API密钥: <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener" className="text-primary-400 hover:underline">huggingface.co/settings/tokens</a></>
              )}
              {currentProvider.id === 'stability' && (
                <>获取API密钥: <a href="https://platform.stability.ai/account/keys" target="_blank" rel="noopener" className="text-primary-400 hover:underline">platform.stability.ai</a> (有免费额度)</>
              )}
              {currentProvider.id === 'openrouter' && (
                <>获取API密钥: <a href="https://openrouter.ai/keys" target="_blank" rel="noopener" className="text-primary-400 hover:underline">openrouter.ai/keys</a></>
              )}
              {currentProvider.id === 'openai' && (
                <>获取API密钥: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" className="text-primary-400 hover:underline">platform.openai.com</a></>
              )}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="aspect-square bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden">
            {generatedImage ? (
              <img
                src={generatedImage}
                alt="Generated"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center text-slate-500">
                <Image size={48} className="mx-auto mb-2" />
                <p>生成的图像将显示在这里</p>
              </div>
            )}
          </div>

          {generatedImage && (
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="btn btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <Download size={18} />
                下载
              </button>
              <button
                onClick={handleApplyToStoryboard}
                className="btn btn-primary flex-1"
              >
                应用到分镜
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
