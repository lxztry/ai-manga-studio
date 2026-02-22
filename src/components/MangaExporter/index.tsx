import { useState, useRef, useCallback } from 'react'
import { useApp } from '../../context/AppContext'
import {
  Download,
  Play,
  Video,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  FileImage,
  Music,
  Upload,
  X,
  Volume2,
  VolumeX,
  Wand2,
  Mic,
  Subtitles,
  Sparkles,
} from 'lucide-react'

type ExportTab = 'static' | 'aivideo' | 'tts' | 'subtitles'

export function MangaExporter() {
  const { currentScript, storyboard } = useApp()
  const [currentPage, setCurrentPage] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [panelDuration, setPanelDuration] = useState(3)
  const [showDialogue, setShowDialogue] = useState(true)
  const [dialogueStyle, setDialogueStyle] = useState<'bubble' | 'subtitle'>('bubble')
  const [bgMusic, setBgMusic] = useState<string | null>(null)
  const [bgMusicName, setBgMusicName] = useState<string>('')
  const [musicVolume, setMusicVolume] = useState(0.5)
  const [isPlayingMusic, setIsPlayingMusic] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const [exportTab, setExportTab] = useState<ExportTab>('static')
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)

  const [ttsText, setTtsText] = useState('')
  const [ttsVoice, setTtsVoice] = useState('belle')
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null)
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false)

  const [subtitleText, setSubtitleText] = useState('')
  const [generatedSubtitles, setGeneratedSubtitles] = useState<Array<{start: number, end: number, text: string}>>([])
  const [isGeneratingSubtitles, setIsGeneratingSubtitles] = useState(false)

  const panels = storyboard?.panels || []
  const panelsWithImages = panels.filter(p => p.imageUrl)

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('audio/')) {
      alert('请选择音频文件')
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('音频文件大小不能超过20MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setBgMusic(event.target?.result as string)
      setBgMusicName(file.name)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const togglePlayMusic = () => {
    if (!audioRef.current || !bgMusic) return
    
    if (isPlayingMusic) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlayingMusic(!isPlayingMusic)
  }

  const removeMusic = () => {
    setBgMusic(null)
    setBgMusicName('')
    setIsPlayingMusic(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
  }

  const handleExportVideo = useCallback(async () => {
    if (panelsWithImages.length === 0) {
      alert('没有可导出的分镜图片')
      return
    }

    setIsExporting(true)
    setExportProgress(0)

    const canvas = canvasRef.current
    if (!canvas) {
      setIsExporting(false)
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setIsExporting(false)
      return
    }

    const width = 1280
    const height = 720
    canvas.width = width
    canvas.height = height

    const fps = 10
    const totalFrames = panelsWithImages.length * panelDuration * fps

    const stream = canvas.captureStream(fps)
    
    let audioContext: AudioContext | null = null
    let audioDestination: MediaStreamAudioDestinationNode | null = null
    let audioElement: HTMLAudioElement | null = null

    if (bgMusic) {
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioDestination = audioContext.createMediaStreamDestination()
        
        audioElement = new window.Audio()
        audioElement.src = bgMusic
        audioElement.loop = true
        audioElement.volume = musicVolume
        
        const source = audioContext.createMediaElementSource(audioElement)
        const gainNode = audioContext.createGain()
        gainNode.gain.value = musicVolume
        
        source.connect(gainNode)
        gainNode.connect(audioDestination)
        
        audioElement.play()
        
        const audioTrack = audioDestination.stream.getAudioTracks()[0]
        stream.addTrack(audioTrack)
      } catch (err) {
        console.warn('音频处理失败，将导出无声视频:', err)
        audioContext = null
        audioDestination = null
      }
    }
    
    let mimeType = 'video/webm;codecs=vp8'
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      mimeType = 'video/webm;codecs=vp9'
    } else if (MediaRecorder.isTypeSupported('video/webm')) {
      mimeType = 'video/webm'
    }

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 3000000,
    })

    const chunks: Blob[] = []
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data)
      }
    }

    mediaRecorder.onstop = () => {
      if (audioElement) {
        audioElement.pause()
        audioElement.src = ''
      }
      if (audioContext) {
        audioContext.close()
      }
      
      const blob = new Blob(chunks, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentScript?.title || '漫剧'}_${Date.now()}.webm`
      a.click()
      URL.revokeObjectURL(url)
      setIsExporting(false)
      setExportProgress(0)
    }

    mediaRecorder.start(100)

    const loadedImages: HTMLImageElement[] = []

    for (let i = 0; i < panelsWithImages.length; i++) {
      const panel = panelsWithImages[i]
      setExportProgress(Math.round((i / panelsWithImages.length) * 20))

      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      
      await new Promise<void>((resolve) => {
        img.onload = () => {
          loadedImages[i] = img
          resolve()
        }
        img.onerror = () => {
          loadedImages[i] = null as any
          resolve()
        }
        img.src = panel.imageUrl!
      })
    }

    const framesPerPanel = panelDuration * fps
    let frameCount = 0

    const drawFrame = () => {
      if (frameCount >= totalFrames) {
        mediaRecorder.stop()
        return
      }

      const panelIndex = Math.floor(frameCount / framesPerPanel)
      const panel = panelsWithImages[panelIndex]
      const img = loadedImages[panelIndex]

      ctx.fillStyle = '#0f0f23'
      ctx.fillRect(0, 0, width, height)

      if (img) {
        const imgRatio = img.width / img.height
        const canvasRatio = width / height
        let drawWidth, drawHeight, drawX, drawY

        if (imgRatio > canvasRatio) {
          drawWidth = width
          drawHeight = width / imgRatio
          drawX = 0
          drawY = (height - drawHeight) / 2
        } else {
          drawHeight = height
          drawWidth = height * imgRatio
          drawX = (width - drawWidth) / 2
          drawY = 0
        }

        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
      } else {
        ctx.fillStyle = '#1a1a2e'
        ctx.fillRect(0, 0, width, height)
        ctx.fillStyle = '#666'
        ctx.font = '32px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`分镜 ${panelIndex + 1}`, width / 2, height / 2)
      }

      if (showDialogue && panel?.dialogue) {
        if (dialogueStyle === 'bubble') {
          drawSpeechBubble(ctx, panel.dialogue, width, height)
        } else {
          drawSubtitle(ctx, panel.dialogue, width, height)
        }
      }

      const pageNum = `${panelIndex + 1} / ${panelsWithImages.length}`
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
      ctx.fillRect(width - 80, height - 28, 70, 22)
      ctx.fillStyle = '#fff'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(pageNum, width - 15, height - 12)

      frameCount++
      setExportProgress(20 + Math.round((frameCount / totalFrames) * 80))

      requestAnimationFrame(() => {
        setTimeout(drawFrame, 1000 / fps)
      })
    }

    drawFrame()
  }, [panelsWithImages, currentScript, panelDuration, showDialogue, dialogueStyle, bgMusic, musicVolume])

  const drawSpeechBubble = (ctx: CanvasRenderingContext2D, text: string, width: number, height: number) => {
    const padding = 15
    const maxWidth = width - 80
    const x = 40
    const y = height - 120

    ctx.font = '16px Arial, sans-serif'
    const lines = wrapText(ctx, text, maxWidth - padding * 2)
    const lineHeight = 24
    const bubbleHeight = lines.length * lineHeight + padding * 2

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 2
    
    ctx.beginPath()
    ctx.roundRect(x, y - bubbleHeight, maxWidth, bubbleHeight, 8)
    ctx.fill()
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(x + 20, y)
    ctx.lineTo(x + 35, y + 12)
    ctx.lineTo(x + 50, y)
    ctx.fill()

    ctx.fillStyle = '#000'
    ctx.textAlign = 'left'
    lines.forEach((line, i) => {
      ctx.fillText(line, x + padding, y - bubbleHeight + padding + 18 + i * lineHeight)
    })
  }

  const drawSubtitle = (ctx: CanvasRenderingContext2D, text: string, width: number, height: number) => {
    const maxWidth = width - 80
    const y = height - 50

    ctx.font = '18px Arial, sans-serif'
    const lines = wrapText(ctx, text, maxWidth)

    lines.forEach((line, i) => {
      const metrics = ctx.measureText(line)
      const x = (width - metrics.width) / 2

      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.fillRect(x - 8, y + i * 26 - 18, metrics.width + 16, 24)

      ctx.fillStyle = '#fff'
      ctx.textAlign = 'left'
      ctx.fillText(line, x, y + i * 26)
    })
  }

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const chars = text.split('')
    const lines: string[] = []
    let currentLine = ''

    for (const char of chars) {
      const testLine = currentLine + char
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = char
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) {
      lines.push(currentLine)
    }
    return lines.length > 0 ? lines : [text]
  }

  const handleExportImages = async () => {
    if (panelsWithImages.length === 0) {
      alert('没有可导出的分镜图片')
      return
    }

    setIsExporting(true)
    setExportProgress(0)

    for (let i = 0; i < panelsWithImages.length; i++) {
      const panel = panelsWithImages[i]
      if (panel.imageUrl) {
        setExportProgress(Math.round((i / panelsWithImages.length) * 100))
        
        try {
          const response = await fetch(panel.imageUrl)
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${currentScript?.title || '漫剧'}_${String(i + 1).padStart(3, '0')}.png`
          a.click()
          URL.revokeObjectURL(url)
          await new Promise(r => setTimeout(r, 300))
        } catch {
          const a = document.createElement('a')
          a.href = panel.imageUrl
          a.download = `${currentScript?.title || '漫剧'}_${String(i + 1).padStart(3, '0')}.png`
          a.click()
          await new Promise(r => setTimeout(r, 300))
        }
      }
    }

    setIsExporting(false)
    setExportProgress(0)
  }

  const handleExportHTML = () => {
    if (panels.length === 0) {
      alert('没有可导出的分镜')
      return
    }

    const title = currentScript?.title || '漫剧'
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: sans-serif; background: #1a1a2e; color: #fff; padding: 20px; }
    .container { max-width: 900px; margin: 0 auto; }
    h1 { text-align: center; margin-bottom: 10px; }
    .panel { background: #16213e; border-radius: 8px; margin-bottom: 15px; overflow: hidden; }
    .panel-image { width: 100%; display: flex; align-items: center; justify-content: center; background: #0f0f23; }
    .panel-image img { max-width: 100%; max-height: 70vh; }
    .panel-info { padding: 10px; }
    .dialogue { background: #fff; color: #000; padding: 8px 12px; margin: 10px; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    ${panels.map((p, i) => `
    <div class="panel">
      <div class="panel-image">${p.imageUrl ? `<img src="${p.imageUrl}" alt="${i + 1}">` : `<p style="padding:40px;color:#444;">第 ${i + 1} 镜</p>`}</div>
      ${p.dialogue ? `<div class="dialogue">${p.dialogue}</div>` : ''}
      <div class="panel-info"><small>第 ${i + 1} 镜 · ${getCameraAngleLabel(p.cameraAngle)}</small><br>${p.description || ''}</div>
    </div>
    `).join('')}
  </div>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getCameraAngleLabel = (angle: string) => {
    const labels: Record<string, string> = {
      'close-up': '特写', 'medium': '中景', 'wide': '广角',
      'birds-eye': '俯视', 'low-angle': '仰视',
    }
    return labels[angle] || angle
  }

  const handleGenerateAIVideo = async () => {
    const siliconflowKey = localStorage.getItem('siliconflow-api-key')
    if (!siliconflowKey) {
      alert('请先在设置中配置 SiliconFlow API密钥')
      return
    }

    const panelWithImage = panelsWithImages[0]
    if (!panelWithImage?.imageUrl) {
      alert('请先上传至少一张分镜图片')
      return
    }

    const prompt = panelWithImage.description || 'A beautiful anime scene'
    
    setIsGeneratingVideo(true)
    setGeneratedVideoUrl(null)

    try {
      let imageBase64 = panelWithImage.imageUrl
      if (!panelWithImage.imageUrl.startsWith('data:')) {
        const response = await fetch(panelWithImage.imageUrl)
        const blob = await response.blob()
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(blob)
        })
        imageBase64 = base64
      }

      const submitResponse = await fetch('https://api.siliconflow.cn/v1/video/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${siliconflowKey}`,
        },
        body: JSON.stringify({
          model: 'Wan-AI/Wan2.2-I2V-A14B',
          prompt: prompt.slice(0, 500),
          image: imageBase64,
        }),
      })

      if (!submitResponse.ok) {
        const errorText = await submitResponse.text()
        if (submitResponse.status === 401) {
          throw new Error('API密钥无效')
        }
        throw new Error(`提交失败: ${errorText}`)
      }

      const data = await submitResponse.json()
      const requestId = data.data?.request_id || data.request_id
      if (!requestId) {
        throw new Error('未能获取任务ID')
      }
      
      let attempts = 0
      const maxAttempts = 60
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        const statusResponse = await fetch('https://api.siliconflow.cn/v1/video/status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${siliconflowKey}`,
          },
          body: JSON.stringify({ request_id: requestId }),
        })

        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          const status = statusData.data?.status || statusData.status
          
          if (status === 'SUCCEEDED') {
            const videoUrl = statusData.data?.video?.url || statusData.data?.video_url
            if (videoUrl) {
              setGeneratedVideoUrl(videoUrl)
              alert('视频生成成功！')
              break
            }
          } else if (status === 'FAILED') {
            throw new Error('视频生成失败')
          }
        }
        
        attempts++
        setExportProgress(Math.round((attempts / maxAttempts) * 100))
      }

      if (!generatedVideoUrl && attempts >= maxAttempts) {
        alert('视频生成超时，请稍后重试')
      }
    } catch (error) {
      console.error('AI视频生成失败:', error)
      alert(error instanceof Error ? error.message : 'AI视频生成失败')
    } finally {
      setIsGeneratingVideo(false)
      setExportProgress(0)
    }
  }

  const handleGenerateTTS = async () => {
    if (!ttsText.trim()) {
      alert('请输入要转换为语音的文字')
      return
    }

    const siliconflowKey = localStorage.getItem('siliconflow-api-key')
    if (!siliconflowKey) {
      alert('请先在设置中配置 SiliconFlow API密钥')
      return
    }

    setIsGeneratingTTS(true)

    try {
      const voiceMap: Record<string, string> = {
        'belle': 'FunAudioLLM/CosyVoice2-0.5B:belle',
        'alex': 'FunAudioLLM/CosyVoice2-0.5B:alex',
        'jesse': 'FunAudioLLM/CosyVoice2-0.5B:jesse',
        'elena': 'FunAudioLLM/CosyVoice2-0.5B:elena',
        'jenny': 'FunAudioLLM/CosyVoice2-0.5B:jenny',
      }

      const response = await fetch('https://api.siliconflow.cn/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${siliconflowKey}`,
        },
        body: JSON.stringify({
          model: 'FunAudioLLM/CosyVoice2-0.5B',
          input: ttsText.slice(0, 1000),
          voice: voiceMap[ttsVoice] || voiceMap.belle,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        if (response.status === 401) {
          throw new Error('API密钥无效')
        }
        throw new Error(`生成失败: ${errorText}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setGeneratedAudioUrl(url)
    } catch (error) {
      console.error('TTS生成失败:', error)
      alert(error instanceof Error ? error.message : 'TTS生成失败')
    } finally {
      setIsGeneratingTTS(false)
    }
  }

  const handleGenerateSubtitles = async () => {
    if (!subtitleText.trim()) {
      alert('请输入要生成字幕的文字')
      return
    }

    const siliconflowKey = localStorage.getItem('siliconflow-api-key')
    if (!siliconflowKey) {
      alert('请先在设置中配置 SiliconFlow API密钥')
      return
    }

    setIsGeneratingSubtitles(true)

    try {
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${siliconflowKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-ai/DeepSeek-R1',
          messages: [
            {
              role: 'user',
              content: `请将以下文字按句子分割成JSON数组格式的字幕。每个字幕条目需要包含start(秒), end(秒), text(文字)字段。假设每个句子3秒，依次递增。仅返回JSON数组，不要其他内容。\n\n${subtitleText}`
            }
          ]
        }),
      })

      if (!response.ok) {
        throw new Error('字幕生成失败')
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''
      
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const subtitles = JSON.parse(jsonMatch[0])
        setGeneratedSubtitles(subtitles)
        alert('字幕生成成功！')
      } else {
        const lines = subtitleText.split(/[。！？\n]/).filter(l => l.trim())
        const subtitles = lines.map((line, i) => ({
          start: i * 3,
          end: (i + 1) * 3,
          text: line.trim()
        }))
        setGeneratedSubtitles(subtitles)
        alert('字幕生成成功（简单模式）！')
      }
    } catch (error) {
      console.error('字幕生成失败:', error)
      const lines = subtitleText.split(/[。！？\n]/).filter(l => l.trim())
      const subtitles = lines.map((line, i) => ({
        start: i * 3,
        end: (i + 1) * 3,
        text: line.trim()
      }))
      setGeneratedSubtitles(subtitles)
      alert('字幕生成成功（降级模式）！')
    } finally {
      setIsGeneratingSubtitles(false)
    }
  }

  const handleExportSubtitles = () => {
    if (generatedSubtitles.length === 0) {
      alert('没有可导出的字幕')
      return
    }

    const srtContent = generatedSubtitles.map((sub, i) => {
      const startTime = formatSRTTime(sub.start)
      const endTime = formatSRTTime(sub.end)
      return `${i + 1}\n${startTime} --> ${endTime}\n${sub.text}\n`
    }).join('\n')

    const blob = new Blob([srtContent], { type: 'text/srt' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentScript?.title || '漫剧'}_subtitles.srt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatSRTTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`
  }

  if (!currentScript || !storyboard) {
    return (
      <div className="panel p-4 flex items-center justify-center h-full">
        <div className="text-center text-slate-400">
          <Video size={48} className="mx-auto mb-2 opacity-50" />
          <p>请先创建剧本和分镜</p>
        </div>
      </div>
    )
  }

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">漫剧导出</h2>
        <button onClick={() => setShowPreview(!showPreview)} className="btn btn-secondary flex items-center gap-2">
          <Play size={18} />
          {showPreview ? '关闭预览' : '预览'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-medium mb-3">项目信息</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">剧本标题</span>
                <span>{currentScript.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">分镜数</span>
                <span>{panels.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">已生成图片</span>
                <span className={panelsWithImages.length > 0 ? 'text-green-400' : 'text-yellow-400'}>
                  {panelsWithImages.length} / {panels.length}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex gap-1 mb-4">
              <button
                onClick={() => setExportTab('static')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  exportTab === 'static' ? 'bg-primary-500 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <FileImage size={16} className="inline mr-1" />
                静态导出
              </button>
              <button
                onClick={() => setExportTab('aivideo')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  exportTab === 'aivideo' ? 'bg-primary-500 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Wand2 size={16} className="inline mr-1" />
                AI视频
              </button>
              <button
                onClick={() => setExportTab('tts')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  exportTab === 'tts' ? 'bg-primary-500 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Mic size={16} className="inline mr-1" />
                AI配音
              </button>
              <button
                onClick={() => setExportTab('subtitles')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  exportTab === 'subtitles' ? 'bg-primary-500 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Subtitles size={16} className="inline mr-1" />
                字幕
              </button>
            </div>

            {exportTab === 'static' && (
              <div className="space-y-3">
                <div>
                  <label className="label">每镜持续时间（秒）</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={panelDuration}
                    onChange={(e) => setPanelDuration(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-sm text-slate-400 text-right">{panelDuration} 秒</div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showDialogue"
                    checked={showDialogue}
                    onChange={(e) => setShowDialogue(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="showDialogue" className="text-sm">显示对话</label>
                </div>

                {showDialogue && (
                  <div>
                    <label className="label">对话样式</label>
                    <select
                      className="select w-full"
                      value={dialogueStyle}
                      onChange={(e) => setDialogueStyle(e.target.value as 'bubble' | 'subtitle')}
                    >
                      <option value="bubble">气泡样式</option>
                      <option value="subtitle">字幕样式</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {exportTab === 'aivideo' && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                  <p className="text-sm text-blue-300">
                    使用AI将分镜图片转换为动态视频。目前支持图生视频功能。
                  </p>
                </div>

                {generatedVideoUrl ? (
                  <div className="space-y-3">
                    <video
                      src={generatedVideoUrl}
                      controls
                      className="w-full rounded-lg"
                    />
                    <a
                      href={generatedVideoUrl}
                      download={`${currentScript?.title || 'video'}.mp4`}
                      className="btn btn-primary w-full flex items-center justify-center gap-2"
                    >
                      <Download size={16} />
                      下载视频
                    </a>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateAIVideo}
                    disabled={isGeneratingVideo || panelsWithImages.length === 0}
                    className="btn btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {isGeneratingVideo ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        生成中... {exportProgress}%
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        生成AI视频
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {exportTab === 'tts' && (
              <div className="space-y-4">
                <div className="p-3 bg-purple-900/30 border border-purple-700 rounded-lg">
                  <p className="text-sm text-purple-300">
                    将文字转换为自然语音，支持多种音色选择。
                  </p>
                </div>

                <div>
                  <label className="label">配音文字</label>
                  <textarea
                    className="textarea"
                    rows={4}
                    value={ttsText}
                    onChange={(e) => setTtsText(e.target.value)}
                    placeholder="输入要转换为语音的文字..."
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    建议输入剧本对话或旁白文字
                  </p>
                </div>

                <div>
                  <label className="label">音色选择</label>
                  <select
                    className="select w-full"
                    value={ttsVoice}
                    onChange={(e) => setTtsVoice(e.target.value)}
                  >
                    <option value="belle">Belle (女声)</option>
                    <option value="alex">Alex (男声)</option>
                    <option value="jesse">Jesse (男声)</option>
                    <option value="elena">Elena (女声)</option>
                    <option value="jenny">Jenny (英文女声)</option>
                  </select>
                </div>

                {generatedAudioUrl ? (
                  <div className="space-y-3">
                    <audio controls className="w-full" src={generatedAudioUrl} />
                    <a
                      href={generatedAudioUrl}
                      download={`${currentScript?.title || 'audio'}.mp3`}
                      className="btn btn-primary w-full flex items-center justify-center gap-2"
                    >
                      <Download size={16} />
                      下载音频
                    </a>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateTTS}
                    disabled={isGeneratingTTS || !ttsText.trim()}
                    className="btn btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {isGeneratingTTS ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Mic size={18} />
                        生成配音
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {exportTab === 'subtitles' && (
              <div className="space-y-4">
                <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg">
                  <p className="text-sm text-green-300">
                    将文字智能分割为字幕条目，支持SRT格式导出。
                  </p>
                </div>

                <div>
                  <label className="label">字幕文字</label>
                  <textarea
                    className="textarea"
                    rows={4}
                    value={subtitleText}
                    onChange={(e) => setSubtitleText(e.target.value)}
                    placeholder="输入要转换为字幕的文字..."
                  />
                </div>

                <button
                  onClick={handleGenerateSubtitles}
                  disabled={isGeneratingSubtitles || !subtitleText.trim()}
                  className="btn btn-primary w-full flex items-center justify-center gap-2"
                >
                  {isGeneratingSubtitles ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Subtitles size={18} />
                      生成字幕
                    </>
                  )}
                </button>

                {generatedSubtitles.length > 0 && (
                  <div className="space-y-2">
                    <div className="max-h-40 overflow-y-auto space-y-1 bg-slate-800 p-2 rounded">
                      {generatedSubtitles.map((sub, i) => (
                        <div key={i} className="text-xs text-slate-300 flex gap-2">
                          <span className="text-slate-500">{formatSRTTime(sub.start)}</span>
                          <span>{sub.text}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleExportSubtitles}
                      className="btn btn-secondary w-full flex items-center justify-center gap-2"
                    >
                      <Download size={16} />
                      导出SRT字幕
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {exportTab === 'static' && (
            <div className="card">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Music size={16} />
                背景音乐
              </h3>
              <div className="space-y-3">
                {bgMusic ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-slate-700 rounded-lg">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Music size={16} className="text-primary-400 flex-shrink-0" />
                        <span className="text-sm truncate">{bgMusicName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={togglePlayMusic}
                          className="p-1.5 hover:bg-slate-600 rounded"
                          title={isPlayingMusic ? '暂停' : '播放'}
                        >
                          {isPlayingMusic ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>
                        <button
                          onClick={removeMusic}
                          className="p-1.5 hover:bg-slate-600 rounded text-red-400"
                          title="移除"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="label">音量</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={musicVolume}
                        onChange={(e) => {
                          setMusicVolume(Number(e.target.value))
                          if (audioRef.current) {
                            audioRef.current.volume = Number(e.target.value)
                          }
                        }}
                        className="w-full"
                      />
                      <div className="text-sm text-slate-400 text-right">{Math.round(musicVolume * 100)}%</div>
                    </div>
                  </div>
                ) : (
                  <label className="btn btn-secondary w-full flex items-center justify-center gap-2 cursor-pointer">
                    <Upload size={18} />
                    上传音乐文件
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={handleMusicUpload}
                    />
                  </label>
                )}
                <p className="text-xs text-slate-500">
                  支持 MP3、WAV、OGG 等格式，最大 20MB
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={handleExportVideo}
              disabled={isExporting || panelsWithImages.length === 0}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  导出中... {exportProgress}%
                </>
              ) : (
                <>
                  <Video size={18} />
                  导出视频 (WebM)
                </>
              )}
            </button>

            <button 
              onClick={handleExportImages} 
              disabled={isExporting || panelsWithImages.length === 0}
              className="btn btn-secondary w-full flex items-center justify-center gap-2"
            >
              <FileImage size={18} />
              导出图片序列
            </button>

            <button onClick={handleExportHTML} className="btn btn-secondary w-full flex items-center justify-center gap-2">
              <Download size={18} />
              导出网页 (HTML)
            </button>
          </div>

          {panelsWithImages.length === 0 && panels.length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-400 text-sm">
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              <span>请先上传或生成分镜图片后再导出</span>
            </div>
          )}

          <div className="p-3 bg-slate-700/30 rounded-lg text-xs text-slate-400">
            <p className="font-medium mb-1">提示：</p>
            <ul className="list-disc list-inside space-y-1">
              <li>WebM视频可用VLC、Chrome等播放</li>
              <li>如视频无法播放，建议导出图片序列</li>
              <li>图片序列可用剪映等软件合成</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          {showPreview && panelsWithImages.length > 0 ? (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">预览</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="p-1 hover:bg-slate-700 rounded disabled:opacity-30"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-sm">{currentPage + 1} / {panelsWithImages.length}</span>
                  <button
                    onClick={() => setCurrentPage(Math.min(panelsWithImages.length - 1, currentPage + 1))}
                    disabled={currentPage >= panelsWithImages.length - 1}
                    className="p-1 hover:bg-slate-700 rounded disabled:opacity-30"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
              <div className="aspect-video bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden mb-3">
                {panelsWithImages[currentPage]?.imageUrl ? (
                  <img src={panelsWithImages[currentPage].imageUrl} alt="" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center text-slate-500">
                    <Video size={32} className="mx-auto mb-2" />
                    <p>未生成图片</p>
                  </div>
                )}
              </div>
              {panelsWithImages[currentPage]?.dialogue && (
                <div className="bg-white text-black p-3 rounded text-sm">
                  {panelsWithImages[currentPage].dialogue}
                </div>
              )}
            </div>
          ) : (
            <div className="card h-64 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <Video size={48} className="mx-auto mb-2 opacity-50" />
                <p>点击"预览"查看分镜</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
      {bgMusic && (
        <audio
          ref={audioRef}
          src={bgMusic}
          onEnded={() => setIsPlayingMusic(false)}
          onPlay={() => setIsPlayingMusic(true)}
          onPause={() => setIsPlayingMusic(false)}
        />
      )}
    </div>
  )
}
