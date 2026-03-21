export class ImagePreloader {
  private queue: string[] = []
  private loaded = new Set<string>()
  private loading = new Set<string>()
  private maxConcurrent = 3

  add(url: string): void {
    if (this.loaded.has(url) || this.loading.has(url) || this.queue.includes(url)) {
      return
    }
    this.queue.push(url)
    this.processQueue()
  }

  addBatch(urls: string[]): void {
    urls.forEach(url => this.add(url))
  }

  private async processQueue(): Promise<void> {
    while (this.queue.length > 0 && this.loading.size < this.maxConcurrent) {
      const url = this.queue.shift()
      if (!url) break
      
      this.loading.add(url)
      await this.loadImage(url)
      this.loading.delete(url)
      this.loaded.add(url)
    }
  }

  private loadImage(url: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => resolve()
      img.src = url
    })
  }

  isLoaded(url: string): boolean {
    return this.loaded.has(url)
  }

  clear(): void {
    this.queue = []
    this.loaded.clear()
    this.loading.clear()
  }
}

export class GenerationQueue<T> {
  private queue: Array<{
    id: string
    data: T
    priority: number
    status: 'pending' | 'processing' | 'completed' | 'failed'
    result?: unknown
    error?: string
    createdAt: Date
  }> = []
  private maxConcurrent: number
  private processor: (item: T) => Promise<unknown>

  constructor(
    processor: (item: T) => Promise<unknown>,
    maxConcurrent = 2
  ) {
    this.processor = processor
    this.maxConcurrent = maxConcurrent
  }

  add(id: string, data: T, priority = 0): void {
    const existing = this.queue.findIndex(item => item.id === id)
    if (existing >= 0) {
      return
    }
    
    this.queue.push({
      id,
      data,
      priority,
      status: 'pending',
      createdAt: new Date(),
    })
    
    this.queue.sort((a, b) => b.priority - a.priority)
    this.processQueue()
  }

  remove(id: string): void {
    const index = this.queue.findIndex(item => item.id === id)
    if (index >= 0) {
      this.queue.splice(index, 1)
    }
  }

  private async processQueue(): Promise<void> {
    const processing = this.queue.filter(item => item.status === 'processing')
    const pending = this.queue.filter(item => item.status === 'pending')
    
    while (processing.length < this.maxConcurrent && pending.length > 0) {
      const item = pending.shift()
      if (!item) break
      
      item.status = 'processing'
      
      try {
        const result = await this.processor(item.data)
        item.result = result
        item.status = 'completed'
      } catch (error) {
        item.error = error instanceof Error ? error.message : 'Unknown error'
        item.status = 'failed'
      }
    }
  }

  getStatus(id: string): string {
    const item = this.queue.find(item => item.id === id)
    return item?.status || 'unknown'
  }

  getResult(id: string): unknown {
    const item = this.queue.find(item => item.id === id)
    return item?.result
  }

  getError(id: string): string | undefined {
    const item = this.queue.find(item => item.id === id)
    return item?.error
  }

  getQueue(): Array<{id: string, status: string}> {
    return this.queue.map(item => ({
      id: item.id,
      status: item.status,
    }))
  }

  clear(): void {
    this.queue = []
  }

  clearCompleted(): void {
    this.queue = this.queue.filter(item => item.status !== 'completed')
  }
}

export function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  
  return function(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

export function throttle<T extends (...args: Parameters<T>) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

export function compressImage(
  file: File,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * maxWidth / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * maxHeight / height)
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        
        ctx.drawImage(img, 0, 0, width, height)
        const base64 = canvas.toDataURL('image/jpeg', quality)
        resolve(base64)
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function estimateStorageUsage(): { used: number, available: number, percentage: number } {
  let used = 0
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key)
        if (value) {
          used += key.length + value.length
        }
      }
    }
  } catch {
    used = 0
  }

  const available = 5 * 1024 * 1024
  const percentage = Math.round((used / available) * 100)
  
  return { used, available, percentage }
}
