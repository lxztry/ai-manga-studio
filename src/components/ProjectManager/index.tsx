import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { 
  FolderOpen, Plus, Copy, Trash2, Download, 
  Clock, FileText, Users, 
  ChevronRight, Check, AlertCircle
} from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import type { Script } from '../../types'

interface ProjectInfo {
  id: string
  title: string
  scenes: number
  characters: number
  panels: number
  lastModified: Date
  thumbnail?: string
}

type Project = Script

export function ProjectManager() {
  const { 
    scripts, 
    currentScript,
    createNewScript,
    loadScript,
    deleteScript,
    importData,
  } = useApp()
  
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)

  const projects: ProjectInfo[] = scripts.map(script => ({
    id: script.id,
    title: script.title,
    scenes: script.scenes.length,
    characters: script.characters.length,
    panels: 0,
    lastModified: script.updatedAt,
  }))

  const handleDuplicateProject = (projectId: string) => {
    const original = scripts.find(s => s.id === projectId)
    if (!original) return

    const duplicated: Script = {
      ...JSON.parse(JSON.stringify(original)),
      id: uuidv4(),
      title: `${original.title} (副本)`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const newScripts = [...scripts, duplicated]
    importData(JSON.stringify({
      scripts: newScripts,
      currentScript: duplicated,
    }))
    
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  const handleDeleteProject = (projectId: string) => {
    deleteScript(projectId)
    setShowDeleteConfirm(null)
    setSelectedProject(null)
  }

  const handleExportProject = (project: Project) => {
    const projectData = {
      scripts: [project],
      currentScript: project,
    }
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatDate = (date: Date) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    return d.toLocaleDateString('zh-CN')
  }

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FolderOpen size={24} className="text-primary-400" />
          <div>
            <h2 className="text-xl font-bold">项目管理</h2>
            <p className="text-sm text-slate-400">{scripts.length} 个项目</p>
          </div>
        </div>
        <button 
          onClick={() => createNewScript('新项目')}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          新建项目
        </button>
      </div>

      {copySuccess && (
        <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg flex items-center gap-2 text-green-400">
          <Check size={18} />
          项目复制成功！
        </div>
      )}

      {scripts.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <FolderOpen size={64} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">还没有项目</p>
          <p className="text-sm">点击上方按钮创建你的第一个漫剧项目</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const isActive = currentScript?.id === project.id
            const isSelected = selectedProject === project.id
            
            return (
              <div
                key={project.id}
                className={`card p-4 cursor-pointer transition-all ${
                  isActive ? 'border-primary-500 ring-2 ring-primary-500/30' : ''
                } ${isSelected ? 'ring-2 ring-blue-500/30' : ''} hover:border-slate-500`}
                onClick={() => setSelectedProject(isSelected ? null : project.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{project.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <Clock size={12} />
                      {formatDate(project.lastModified)}
                    </div>
                  </div>
                  {isActive && (
                    <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded">
                      当前
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                  <div className="flex items-center gap-1">
                    <FileText size={14} />
                    <span>{project.scenes} 场景</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    <span>{project.characters} 角色</span>
                  </div>
                </div>

                {selectedProject === project.id && (
                  <div className="space-y-2 pt-3 border-t border-slate-700">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        loadScript(scripts.find(s => s.id === project.id)!)
                      }}
                      className="btn btn-secondary w-full text-sm flex items-center justify-center gap-2"
                    >
                      <ChevronRight size={16} />
                      打开项目
                    </button>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDuplicateProject(project.id)
                        }}
                        className="btn btn-secondary text-xs py-1.5"
                      >
                        <Copy size={12} className="inline mr-1" />
                        复制
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleExportProject(scripts.find(s => s.id === project.id)!)
                        }}
                        className="btn btn-secondary text-xs py-1.5"
                      >
                        <Download size={12} className="inline mr-1" />
                        导出
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowDeleteConfirm(project.id)
                        }}
                        className="btn btn-danger text-xs py-1.5"
                      >
                        <Trash2 size={12} className="inline mr-1" />
                        删除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle size={24} className="text-red-400" />
              <h3 className="text-lg font-bold">确认删除</h3>
            </div>
            <p className="text-slate-400 mb-4">
              确定要删除项目 "{scripts.find(s => s.id === showDeleteConfirm)?.title}" 吗？
              此操作不可撤销。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="btn btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteProject(showDeleteConfirm)}
                className="btn btn-danger flex-1"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
