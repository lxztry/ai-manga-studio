import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Plus, User, Edit2, Trash2, X } from 'lucide-react'
import type { Character } from '../../types'

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
        <h2 className="text-xl font-bold">角色管理</h2>
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
                  <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                    {character.avatar ? (
                      <img src={character.avatar} alt={character.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User size={24} className="text-slate-400" />
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
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(character)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteCharacter(character.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"
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
  return (
    <div className="space-y-3">
      <div>
        <label className="label">角色名称</label>
        <input
          type="text"
          className="input"
          value={form.name || ''}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
        />
      </div>
      <div>
        <label className="label">角色描述</label>
        <textarea
          className="textarea"
          rows={2}
          value={form.description || ''}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
        />
      </div>
      <div>
        <label className="label">外貌特征</label>
        <textarea
          className="textarea"
          rows={2}
          value={form.appearance || ''}
          onChange={(e) => onChange({ ...form, appearance: e.target.value })}
          placeholder="描述角色的外貌..."
        />
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
        <label className="label">特征标签 (用逗号分隔)</label>
        <input
          type="text"
          className="input"
          value={form.traits?.join(', ') || ''}
          onChange={(e) => onChange({ ...form, traits: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
          placeholder="勇敢, 善良, 冒险家"
        />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <button onClick={onCancel} className="btn btn-secondary">
          取消
        </button>
        <button onClick={onSave} className="btn btn-primary">
          保存
        </button>
      </div>
    </div>
  )
}
