import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { HardDrive, Trash2, Download, AlertTriangle } from 'lucide-react'
import { estimateStorageUsage, formatFileSize } from '../utils/performance'

export function StorageIndicator() {
  const { clearAllData, exportData } = useApp()
  const [storage, setStorage] = useState({ used: 0, available: 0, percentage: 0 })

  useEffect(() => {
    const updateStorage = () => {
      setStorage(estimateStorageUsage())
    }
    
    updateStorage()
    const interval = setInterval(updateStorage, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getColorClass = () => {
    if (storage.percentage > 80) return 'bg-red-500'
    if (storage.percentage > 50) return 'bg-yellow-500'
    return 'bg-primary-500'
  }

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="bg-slate-800/90 backdrop-blur rounded-lg px-4 py-3 shadow-lg border border-slate-700">
        <div className="flex items-center gap-3 mb-2">
          <HardDrive size={16} className="text-slate-400" />
          <span className="text-sm text-slate-300">
            存储 {formatFileSize(storage.used)} / 5MB
          </span>
        </div>
        
        <div className="w-32 h-1.5 bg-slate-700 rounded-full overflow-hidden mb-2">
          <div 
            className={`h-full ${getColorClass()} transition-all`}
            style={{ width: `${Math.min(storage.percentage, 100)}%` }}
          />
        </div>

        {storage.percentage > 50 && (
          <p className="text-xs text-yellow-400 flex items-center gap-1">
            <AlertTriangle size={12} />
            存储空间不足，建议导出备份
          </p>
        )}

        <div className="flex gap-2 mt-3">
          <button
            onClick={handleExport}
            className="btn btn-secondary text-xs py-1 px-2 flex items-center gap-1"
          >
            <Download size={12} />
            备份
          </button>
          {storage.percentage > 70 && (
            <button
              onClick={() => {
                if (confirm('确定要清除所有数据吗？此操作不可撤销。')) {
                  clearAllData()
                  setStorage({ used: 0, available: 5 * 1024 * 1024, percentage: 0 })
                }
              }}
              className="btn btn-danger text-xs py-1 px-2 flex items-center gap-1"
            >
              <Trash2 size={12} />
              清除
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function LoadingOverlay({ message }: { message?: string }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-lg p-6 flex flex-col items-center">
        <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-slate-300">{message || '加载中...'}</p>
      </div>
    </div>
  )
}
