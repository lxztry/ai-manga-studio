import { useState, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { Plus, User, Edit2, Trash2, X, Upload, Image, Check, AlertCircle } from 'lucide-react'
import type { Character, CharacterReferenceImage } from '../../types'
import { v4 as uuidv4 } from 'uuid'

const REFERENCE_TYPES = [
  { value: 'front', label: '正面' },
  { value: 'side', label: '侧面' },
  { value: 'full-body', label: '全身' },
  { value: 'action', label: '动作' },
  { value: 'other', label: '其他' },
]

export function CharacterManager() {
  const { characters, addCharacter, updateCharacter, deleteCharacter } = useApp()
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Character>>({})
  const [isAdding, setIsAdding] = useState(false)

  const handleAddCharacter = () => {
    setIsAdding(true)
    setEditForm({
      name: '新角色',
      description: '',
      appearance: '',
      personality: '',
      traits: [],
      referenceImages: [],
      appearanceNotes: '',
      clothingNotes: '',
    })
  }

  const handleSaveNew = () => {
    addCharacter(editForm)
    setIsAdding(false)
    setEditForm({})
  }

  const handleEdit = (character: Character) => {
    setIsEditing(character.id)
    setEditForm(character)
  }

  const handleSave = () => {
    if (isEditing) {
      updateCharacter(isEditing, editForm)
    }
    setIsEditing(null)
    setEditForm({})
  }

  const handleCancel = () => {
    setIsEditing(null)
    setIsAdding(false)
    setEditForm({})
  }

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">角色管理</h2>
          <p className="text-sm text-slate-400 mt-1">上传多张参考图可保持角色一致性</p>
        </div>
        <button onClick={handleAddCharacter} className="btn btn-primary flex items-center gap-2">
          <Plus size={18} />
          添加角色
        </button>
      </div>

      {isAdding && (
        <div className="card mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">新建角色</h3>
            <button onClick={handleCancel} className="text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
          <CharacterForm
            form={editForm}
            onChange={setEditForm}
            onSave={handleSaveNew}
            onCancel={handleCancel}
          />
        </div>
      )}

      <div className="space-y-3">
        {characters.map((character) => (
          <div key={character.id} className="card">
            {isEditing === character.id ? (
              <div>
                <CharacterForm
                  form={editForm}
                  onChange={setEditForm}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    {character.avatar ? (
                      <img src={character.avatar} alt={character.name} className="w-full h-full rounded-lg object-cover" />
                    ) : (
                      <User size={32} className="text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-lg">{character.name}</h3>
                    <p className="text-sm text-slate-400 mt-1">{character.description}</p>
                    {character.traits.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {character.traits.map((trait, i) => (
                          <span key={i} className="px-2 py-1 bg-primary-600/20 text-primary-400 text-xs rounded">
                            {trait}
                          </span>
                        ))}
                      </div>
                    )}
                    {character.referenceImages.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-slate-500 mb-2">参考图 ({character.referenceImages.length})</p>
                        <div className="flex gap-2 flex-wrap">
                          {character.referenceImages.map((ref) => (
                            <div key={ref.id} className="relative group">
                              <img 
                                src={ref.url} 
                                alt={`${ref.type} reference`}
                                className="w-12 h-12 rounded object-cover border-2 border-slate-600"
                              />
                              <div className="absolute -bottom-1 -right-1 bg-primary-500 text-white text-[8px] px-1 rounded">
                                {REFERENCE_TYPES.find(t => t.value === ref.type)?.label || ref.type}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(character)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                    title="编辑"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteCharacter(character.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"
                    title="删除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {characters.length === 0 && !isAdding && (
          <div className="text-center py-8 text-slate-400">
            <User size={48} className="mx-auto mb-2 opacity-50" />
            <p>还没有角色，点击上方按钮添加</p>
            <p className="text-sm mt-1">建议上传多张参考图(正面/侧面/全身)以保持角色一致性</p>
          </div>
        )}
      </div>
    </div>
  )
}

function CharacterForm({
  form,
  onChange,
  onSave,
  onCancel,
}: {
  form: Partial<Character>
  onChange: (form: Partial<Character>) => void
  onSave: () => void
  onCancel: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const newRef: CharacterReferenceImage = {
            id: uuidv4(),
            url: event.target?.result as string,
            type: 'front',
            description: '',
          }
          onChange({
            ...form,
            referenceImages: [...(form.referenceImages || []), newRef],
          })
        }
        reader.readAsDataURL(file)
      }
    })
    e.target.value = ''
  }

  const updateReferenceImage = (id: string, updates: Partial<CharacterReferenceImage>) => {
    const updated = form.referenceImages?.map(ref =>
      ref.id === id ? { ...ref, ...updates } : ref
    )
    onChange({ ...form, referenceImages: updated })
  }

  const removeReferenceImage = (id: string) => {
    const filtered = form.referenceImages?.filter(ref => ref.id !== id)
    onChange({ ...form, referenceImages: filtered })
  }

  const handleAvatarSelect = (url: string) => {
    onChange({ ...form, avatar: url })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">角色名称 *</label>
          <input
            type="text"
            className="input"
            value={form.name || ''}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            placeholder="输入角色名"
          />
        </div>
        <div>
          <label className="label">特征标签 (用逗号分隔)</label>
          <input
            type="text"
            className="input"
            value={form.traits?.join(', ') || ''}
            onChange={(e) => onChange({ ...form, traits: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            placeholder="勇敢, 善良, 冒险家"
          />
        </div>
      </div>

      <div>
        <label className="label">角色简介</label>
        <textarea
          className="textarea"
          rows={2}
          value={form.description || ''}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          placeholder="一句话描述这个角色..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">外貌特征</label>
          <textarea
            className="textarea"
            rows={2}
            value={form.appearance || ''}
            onChange={(e) => onChange({ ...form, appearance: e.target.value })}
            placeholder="身高, 发型, 眼睛颜色, 肤色..."
          />
        </div>
        <div>
          <label className="label">服装特点</label>
          <textarea
            className="textarea"
            rows={2}
            value={form.clothingNotes || ''}
            onChange={(e) => onChange({ ...form, clothingNotes: e.target.value })}
            placeholder="日常服装, 特色配饰..."
          />
        </div>
      </div>

      <div>
        <label className="label">性格特点</label>
        <textarea
          className="textarea"
          rows={2}
          value={form.personality || ''}
          onChange={(e) => onChange({ ...form, personality: e.target.value })}
          placeholder="描述角色的性格..."
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">参考图片 (保持角色一致性)</label>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-secondary text-sm flex items-center gap-1"
          >
            <Upload size={14} />
            上传参考图
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
        
        {form.referenceImages && form.referenceImages.length > 0 && (
          <div className="grid grid-cols-4 gap-3">
            {form.referenceImages.map((ref, idx) => (
              <div key={ref.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-slate-700 border-2 border-slate-600">
                  <img src={ref.url} alt={`参考图 ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
                <button
                  onClick={() => removeReferenceImage(ref.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
                <div className="mt-1">
                  <select
                    className="select text-xs py-1"
                    value={ref.type}
                    onChange={(e) => updateReferenceImage(ref.id, { type: e.target.value as CharacterReferenceImage['type'] })}
                  >
                    {REFERENCE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => handleAvatarSelect(ref.url)}
                  className={`mt-1 w-full text-xs py-1 rounded ${
                    form.avatar === ref.url 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                  }`}
                >
                  {form.avatar === ref.url ? <><Check size={12} className="inline mr-1"/>设为头像</> : '设为头像'}
                </button>
              </div>
            ))}
          </div>
        )}

        {(!form.referenceImages || form.referenceImages.length === 0) && (
          <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center text-slate-500">
            <Image size={24} className="mx-auto mb-2" />
            <p className="text-sm">建议上传多张参考图：正面、侧面、全身</p>
            <p className="text-xs mt-1">这样可以在生成时保持角色一致性</p>
          </div>
        )}
      </div>

      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <AlertCircle size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-300">
            <p className="font-medium">角色一致性提示</p>
            <ul className="mt-1 text-xs space-y-1 text-blue-300/80">
              <li>• 正面照：用于面部特征学习</li>
              <li>• 侧面照：用于侧脸轮廓</li>
              <li>• 全身照：用于体型和服装</li>
              <li>• 动作照：用于特定姿势</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button onClick={onCancel} className="btn btn-secondary">
          取消
        </button>
        <button 
          onClick={onSave} 
          className="btn btn-primary"
          disabled={!form.name?.trim()}
        >
          保存
        </button>
      </div>
    </div>
  )
}
