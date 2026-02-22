import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import {
  FileText,
  Users,
  Grid,
  Image,
  Settings,
  Plus,
  Sparkles,
  ChevronLeft,
  Menu,
  X,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  Upload,
  Trash2,
  Save,
  BookOpen,
} from 'lucide-react'
import { CharacterManager } from '../CharacterManager'
import { ScriptEditor } from '../ScriptEditor'
import { StoryboardEditor } from '../StoryboardEditor'
import { ImageGenerator } from '../ImageGenerator'
import { MangaExporter } from '../MangaExporter'
import { Templates } from '../Templates'
import { POPULAR_OPENROUTER_MODELS } from '../../utils/ai'

type TabType = 'script' | 'characters' | 'storyboard' | 'image' | 'export' | 'templates'

const tabs = [
  { id: 'script' as TabType, label: '剧本编辑', icon: FileText },
  { id: 'characters' as TabType, label: '角色管理', icon: Users },
  { id: 'storyboard' as TabType, label: '分镜编辑', icon: Grid },
  { id: 'image' as TabType, label: '图像生成', icon: Image },
  { id: 'templates' as TabType, label: '模板', icon: Sparkles },
  { id: 'export' as TabType, label: '视频导出', icon: BookOpen },
]

const PROVIDER_MODELS: Record<string, { id: string; name: string }[]> = {
  openai: [
    { id: 'gpt-4', name: 'GPT-4' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  ],
  anthropic: [
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
  ],
  openrouter: POPULAR_OPENROUTER_MODELS,
  local: [
    { id: 'llama2', name: 'Llama 2' },
    { id: 'mistral', name: 'Mistral' },
    { id: 'codellama', name: 'Code Llama' },
  ],
}

export function Layout() {
  const {
    currentScript,
    scripts,
    createNewScript,
    loadScript,
    apiKey,
    setApiKey,
    apiProvider,
    setApiProvider,
    apiModel,
    setApiModel,
    apiBaseUrl,
    setApiBaseUrl,
    clearAllData,
    exportData,
    importData,
    deleteScript,
  } = useApp()
  const [activeTab, setActiveTab] = useState<TabType>('script')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showNewScriptModal, setShowNewScriptModal] = useState(false)
  const [showScriptList, setShowScriptList] = useState(false)
  const [newScriptTitle, setNewScriptTitle] = useState('')
  const [customModel, setCustomModel] = useState('')
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')
  const [importError, setImportError] = useState('')

  const handleCreateScript = () => {
    if (newScriptTitle.trim()) {
      createNewScript(newScriptTitle.trim())
      setNewScriptTitle('')
      setShowNewScriptModal(false)
    }
  }

  const handleProviderChange = (provider: typeof apiProvider) => {
    setApiProvider(provider)
    const defaultModel = PROVIDER_MODELS[provider]?.[0]?.id || ''
    setApiModel(defaultModel)
  }

  const handleModelChange = (model: string) => {
    if (model === '__custom__') {
      setApiModel(customModel)
    } else {
      setApiModel(model)
    }
  }

  const handleTestConnection = async () => {
    if (!apiKey) {
      setTestStatus('error')
      setTestMessage('请输入API密钥')
      return
    }

    setTestStatus('testing')
    setTestMessage('')

    try {
      let url: string
      let headers: Record<string, string>
      let body: object

      const model = apiModel || PROVIDER_MODELS[apiProvider]?.[0]?.id || ''

      switch (apiProvider) {
        case 'openrouter':
          url = 'https://openrouter.ai/api/v1/chat/completions'
          headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'AI Manga Studio',
          }
          body = {
            model,
            messages: [{ role: 'user', content: 'Hi' }],
            max_tokens: 5,
          }
          break

        case 'openai':
          url = 'https://api.openai.com/v1/chat/completions'
          headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          }
          body = {
            model: model || 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Hi' }],
            max_tokens: 5,
          }
          break

        case 'anthropic':
          url = 'https://api.anthropic.com/v1/messages'
          headers = {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          }
          body = {
            model: model || 'claude-3-haiku-20240307',
            max_tokens: 5,
            messages: [{ role: 'user', content: 'Hi' }],
          }
          break

        case 'local':
          url = apiBaseUrl || 'http://localhost:11434/v1/chat/completions'
          headers = { 'Content-Type': 'application/json' }
          body = {
            model: model || 'llama2',
            messages: [{ role: 'user', content: 'Hi' }],
            max_tokens: 5,
          }
          break

        default:
          throw new Error('不支持的提供商')
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setTestStatus('success')
        setTestMessage(`连接成功！模型: ${model || '默认'}`)
      } else {
        const error = await response.text()
        let errorMsg = `连接失败 (${response.status})`
        try {
          const errorJson = JSON.parse(error)
          errorMsg = errorJson.error?.message || errorJson.error?.code || errorJson.message || JSON.stringify(errorJson.error || errorJson)
        } catch {
          if (error) errorMsg = error
        }
        setTestStatus('error')
        setTestMessage(`${errorMsg} [模型: ${model}]`)
      }
    } catch (error) {
      setTestStatus('error')
      setTestMessage(error instanceof Error ? error.message : '连接失败')
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'script':
        return <ScriptEditor />
      case 'characters':
        return <CharacterManager />
      case 'storyboard':
        return <StoryboardEditor />
      case 'image':
        return <ImageGenerator />
      case 'templates':
        return <Templates />
      case 'export':
        return <MangaExporter />
      default:
        return null
    }
  }

  return (
    <div className="h-screen flex bg-slate-900">
      <aside
        className={`${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } bg-slate-800 flex flex-col transition-all duration-300`}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-700">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary-500" size={24} />
              <span className="font-bold text-lg">AI漫剧工作室</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-slate-700 rounded-lg"
          >
            {sidebarCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-600/20 text-primary-400'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Icon size={20} />
                {!sidebarCollapsed && <span>{tab.label}</span>}
              </button>
            )
          })}
        </nav>

        <div className="p-2 border-t border-slate-700 space-y-1">
          <button
            onClick={() => setShowNewScriptModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700"
          >
            <Plus size={20} />
            {!sidebarCollapsed && <span>新建剧本</span>}
          </button>
          {scripts.length > 0 && (
            <button
              onClick={() => setShowScriptList(true)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700"
            >
              <FileText size={20} />
              {!sidebarCollapsed && <span>剧本列表 ({scripts.length})</span>}
            </button>
          )}
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700"
          >
            <Settings size={20} />
            {!sidebarCollapsed && <span>设置</span>}
          </button>
        </div>

        {!sidebarCollapsed && currentScript && (
          <div className="p-4 border-t border-slate-700">
            <p className="text-xs text-slate-500 mb-1">当前剧本</p>
            <p className="text-sm text-slate-300 truncate">{currentScript.title}</p>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-slate-800 border-b border-slate-700 px-6 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h1>
            <div className="flex items-center gap-4">
              {!apiKey && (
                <span className="text-sm text-yellow-500">请先配置API密钥</span>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-slate-900">{renderContent()}</div>
      </main>

      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">设置</h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">API提供商</label>
                <select
                  className="select"
                  value={apiProvider}
                  onChange={(e) => handleProviderChange(e.target.value as typeof apiProvider)}
                >
                  <option value="openrouter">OpenRouter (推荐)</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="local">本地模型</option>
                </select>
              </div>

              <div>
                <label className="label">模型</label>
                <select
                  className="select"
                  value={PROVIDER_MODELS[apiProvider]?.some(m => m.id === apiModel) ? apiModel : '__custom__'}
                  onChange={(e) => handleModelChange(e.target.value)}
                >
                  {PROVIDER_MODELS[apiProvider]?.map((model) => (
                    <option key={model.id} value={model.id}>{model.name}</option>
                  ))}
                  <option value="__custom__">自定义模型...</option>
                </select>
              </div>

              {apiProvider === 'openrouter' && (
                <div>
                  <label className="label">自定义模型ID (可选)</label>
                  <input
                    type="text"
                    className="input"
                    value={customModel}
                    onChange={(e) => {
                      setCustomModel(e.target.value)
                      if (e.target.value) {
                        setApiModel(e.target.value)
                      }
                    }}
                    placeholder="例如: meta-llama/llama-3-70b-instruct"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    查看所有模型: <a href="https://openrouter.ai/models" target="_blank" rel="noopener" className="text-primary-400 hover:underline">openrouter.ai/models</a>
                  </p>
                </div>
              )}

              <div>
                <label className="label">API密钥</label>
                <input
                  type="password"
                  className="input"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value)
                    setTestStatus('idle')
                  }}
                  placeholder={apiProvider === 'openrouter' ? 'sk-or-...' : '输入您的API密钥...'}
                />
              </div>

              <div>
                <label className="label">SiliconFlow API密钥 (图像生成)</label>
                <input
                  type="password"
                  className="input"
                  defaultValue={localStorage.getItem('siliconflow-api-key') || ''}
                  onChange={(e) => {
                    localStorage.setItem('siliconflow-api-key', e.target.value)
                  }}
                  placeholder="sk-... (可选，用于SiliconFlow图像生成)"
                />
                <p className="text-xs text-slate-500 mt-1">
                  免费额度，国内可用。前往 <a href="https://siliconflow.cn" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">siliconflow.cn</a> 获取密钥
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleTestConnection}
                  disabled={testStatus === 'testing'}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  {testStatus === 'testing' ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      测试中...
                    </>
                  ) : (
                    '测试连接'
                  )}
                </button>
                {testStatus === 'success' && (
                  <div className="flex items-center gap-1 text-green-400 text-sm">
                    <CheckCircle size={16} />
                    {testMessage}
                  </div>
                )}
                {testStatus === 'error' && (
                  <div className="flex items-center gap-1 text-red-400 text-sm">
                    <XCircle size={16} />
                    {testMessage}
                  </div>
                )}
              </div>

              {apiProvider === 'local' && (
                <div>
                  <label className="label">本地服务地址</label>
                  <input
                    type="text"
                    className="input"
                    value={apiBaseUrl}
                    onChange={(e) => setApiBaseUrl(e.target.value)}
                    placeholder="http://localhost:11434/v1"
                  />
                </div>
              )}

              <div className="bg-slate-700/50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-2">
                  {apiProvider === 'openrouter' && (
                    <>
                      <strong className="text-slate-300">OpenRouter</strong> - 统一访问多种AI模型，支持GPT-4、Claude、Llama等。
                      <br />
                      获取密钥: <a href="https://openrouter.ai/keys" target="_blank" rel="noopener" className="text-primary-400 hover:underline">openrouter.ai/keys</a>
                    </>
                  )}
                  {apiProvider === 'openai' && (
                    <>
                      <strong className="text-slate-300">OpenAI</strong> - 官方API，需要OpenAI账户。
                    </>
                  )}
                  {apiProvider === 'anthropic' && (
                    <>
                      <strong className="text-slate-300">Anthropic</strong> - Claude系列模型。
                    </>
                  )}
                  {apiProvider === 'local' && (
                    <>
                      <strong className="text-slate-300">本地模型</strong> - 支持Ollama等本地部署的模型。
                    </>
                  )}
                </p>
              </div>

              <p className="text-xs text-slate-500">
                API密钥将存储在本地浏览器中，不会上传到服务器
              </p>

              <div className="border-t border-slate-600 pt-4 mt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Save size={16} />
                  数据管理
                </h4>
                <p className="text-xs text-slate-400 mb-3">
                  所有数据自动保存在浏览器本地存储中，刷新页面不会丢失。
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const data = exportData()
                      const blob = new Blob([data], { type: 'application/json' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `manga-studio-backup-${new Date().toISOString().slice(0, 10)}.json`
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="btn btn-secondary text-sm flex items-center gap-1"
                  >
                    <Download size={14} />
                    导出备份
                  </button>
                  <label className="btn btn-secondary text-sm flex items-center gap-1 cursor-pointer">
                    <Upload size={14} />
                    导入数据
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = (event) => {
                            try {
                              importData(event.target?.result as string)
                              setImportError('')
                              alert('导入成功！')
                            } catch {
                              setImportError('导入失败：文件格式不正确')
                            }
                          }
                          reader.readAsText(file)
                        }
                        e.target.value = ''
                      }}
                    />
                  </label>
                  <button
                    onClick={() => {
                      if (confirm('确定要清除所有数据吗？此操作不可撤销！')) {
                        clearAllData()
                        setShowSettings(false)
                      }
                    }}
                    className="btn btn-danger text-sm flex items-center gap-1"
                  >
                    <Trash2 size={14} />
                    清除数据
                  </button>
                </div>
                {importError && (
                  <p className="text-xs text-red-400 mt-2">{importError}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showScriptList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">剧本列表 ({scripts.length})</h3>
              <button onClick={() => setShowScriptList(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2">
              {scripts.map((script) => (
                <div
                  key={script.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    currentScript?.id === script.id
                      ? 'bg-primary-600/20 border border-primary-500'
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                  onClick={() => {
                    loadScript(script)
                    setShowScriptList(false)
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{script.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        {script.scenes.length} 场景 · {script.characters.length} 角色
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('确定删除此剧本？')) {
                          deleteScript(script.id)
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {scripts.length === 0 && (
                <p className="text-center text-slate-400 py-4">暂无剧本</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showNewScriptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">新建剧本</h3>
              <button onClick={() => setShowNewScriptModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">剧本标题</label>
                <input
                  type="text"
                  className="input"
                  value={newScriptTitle}
                  onChange={(e) => setNewScriptTitle(e.target.value)}
                  placeholder="输入剧本标题..."
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateScript()}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowNewScriptModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  取消
                </button>
                <button onClick={handleCreateScript} className="btn btn-primary flex-1">
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
