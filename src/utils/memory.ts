import type { Character, StoryboardPanel } from '../types'

export interface CharacterMemory {
  characterId: string
  characterName: string
  lastAppearance: {
    panelId: string
    description: string
    clothingDescription: string
    pose: string
    expression: string
    cameraAngle: string
  } | null
  appearanceCount: number
  clothingHistory: string[]
  poseHistory: string[]
}

export interface SceneContext {
  sceneId: string
  sceneName: string
  location: string
  timeOfDay: string
  style: string
  previousPanelId: string | null
  characterStates: Map<string, CharacterMemory>
  propsInScene: string[]
  colorPalette: string[]
}

export interface ConsistencyWarning {
  type: 'clothing' | 'pose' | 'style' | 'color'
  characterId?: string
  message: string
  currentValue: string
  expectedValue: string
}

export interface GenerationContext {
  storyId: string
  sceneContext: SceneContext | null
  characterMemories: Map<string, CharacterMemory>
  style: string
  lastPanel: StoryboardPanel | null
  warnings: ConsistencyWarning[]
}

export function createCharacterMemory(character: Character): CharacterMemory {
  return {
    characterId: character.id,
    characterName: character.name,
    lastAppearance: null,
    appearanceCount: 0,
    clothingHistory: [],
    poseHistory: [],
  }
}

export function updateCharacterMemory(
  memory: CharacterMemory,
  panel: StoryboardPanel,
  description: string
): CharacterMemory {
  const clothingMatch = description.match(/穿(.+?)的|着(.+?)装|衣服(.+?)[,。]/i)
  const clothing = clothingMatch ? (clothingMatch[1] || clothingMatch[2] || clothingMatch[3] || '') : ''
  
  const poseMatch = description.match(/(站着|坐着|躺着|跑着|走着|跳着|举手|低头|抬头|转身|鞠躬|挥手)/i)
  const pose = poseMatch ? poseMatch[1] : 'normal'
  
  const expressionMatch = description.match(/(微笑|大笑|皱眉|生气|悲伤|惊讶|平静|严肃|开心|高兴)/i)
  const expression = expressionMatch ? expressionMatch[1] : 'neutral'

  const newClothingHistory = clothing && !memory.clothingHistory.includes(clothing)
    ? [...memory.clothingHistory, clothing].slice(-5)
    : memory.clothingHistory

  const newPoseHistory = pose !== 'normal' && !memory.poseHistory.includes(pose)
    ? [...memory.poseHistory, pose].slice(-5)
    : memory.poseHistory

  return {
    ...memory,
    lastAppearance: {
      panelId: panel.id,
      description,
      clothingDescription: clothing,
      pose,
      expression,
      cameraAngle: panel.cameraAngle,
    },
    appearanceCount: memory.appearanceCount + 1,
    clothingHistory: newClothingHistory,
    poseHistory: newPoseHistory,
  }
}

export function checkConsistency(
  character: Character,
  description: string,
  memory: CharacterMemory,
  _style: string = localStorage.getItem('manga-studio-style') || '日式漫画'
): ConsistencyWarning[] {
  const warnings: ConsistencyWarning[] = []

  if (memory.lastAppearance) {
    if (memory.clothingHistory.length > 0) {
      const clothingMatch = description.match(/穿(.+?)的|着(.+?)装/i)
      const currentClothing = clothingMatch ? (clothingMatch[1] || clothingMatch[2] || '') : ''
      
      if (currentClothing && memory.clothingHistory[memory.clothingHistory.length - 1] !== currentClothing) {
        const isSameOutfit = memory.clothingHistory.some(c => 
          currentClothing.includes(c) || c.includes(currentClothing)
        )
        
        if (!isSameOutfit && memory.appearanceCount > 1) {
          warnings.push({
            type: 'clothing',
            characterId: character.id,
            message: `服装可能不一致：当前描述"${currentClothing}"，之前穿"${memory.clothingHistory[memory.clothingHistory.length - 1]}"`,
            currentValue: currentClothing,
            expectedValue: memory.clothingHistory[memory.clothingHistory.length - 1],
          })
        }
      }
    }
  }

  const styleKeywords: Record<string, string[]> = {
    '日式漫画': ['漫画', '黑白', '网点', 'screentone'],
    '动画风格': ['动漫', '二次元', 'anime', '色彩鲜艳'],
    '写实风格': ['写实', '真实', 'realistic', '照片级'],
    '水彩风格': ['水彩', '柔和', 'watercolor'],
    '美式漫画': ['美漫', 'bold', 'vibrant'],
  }

  const expectedKeywords = styleKeywords[_style] || []
  
  for (const keyword of expectedKeywords) {
    if (!description.toLowerCase().includes(keyword.toLowerCase())) {
      warnings.push({
        type: 'style',
        message: `建议添加风格关键词：${keyword}`,
        currentValue: description,
        expectedValue: expectedKeywords.join(', '),
      })
      break
    }
  }

  return warnings
}

export function buildConsistentPrompt(
  basePrompt: string,
  character: Character,
  memory: CharacterMemory
): string {
  let prompt = basePrompt
  
  if (memory.lastAppearance) {
    const { clothingDescription, pose, expression } = memory.lastAppearance
    
    if (clothingDescription && !basePrompt.includes(clothingDescription)) {
      prompt += ` wearing ${clothingDescription}`
    }
    
    if (pose && !basePrompt.includes(pose)) {
      prompt += `, ${pose}`
    }
    
    if (expression && !basePrompt.includes(expression)) {
      prompt += `, ${expression} expression`
    }
  }

  if (character.clothingNotes && !prompt.includes(character.clothingNotes)) {
    prompt += `. Clothing: ${character.clothingNotes}`
  }

  if (character.appearanceNotes && !prompt.includes(character.appearanceNotes)) {
    prompt += `. Appearance: ${character.appearanceNotes}`
  }

  return prompt
}

export function getSceneStyleContext(
  panels: StoryboardPanel[],
  currentIndex: number
): {
  colorPalette: string[]
  lighting: string
  atmosphere: string
} {
  const recentPanels = panels.slice(Math.max(0, currentIndex - 3), currentIndex)
  
  const colorKeywords = ['红色', '蓝色', '黄色', '绿色', '紫色', '橙色', '粉色', '棕色', '白色', '黑色', '灰色']
  const lightingKeywords = ['阳光', '月光', '灯光', '阴影', '明亮', '黑暗', '柔和', '强烈']
  const atmosphereKeywords = ['温馨', '紧张', '神秘', '浪漫', '悲伤', '欢乐', '恐怖', '平静']

  let colorPalette: string[] = []
  let lighting = '自然光'
  let atmosphere = '中性'

  for (const panel of recentPanels) {
    const desc = panel.description.toLowerCase()
    
    for (const color of colorKeywords) {
      if (desc.includes(color.toLowerCase())) {
        if (!colorPalette.includes(color)) {
          colorPalette.push(color)
        }
      }
    }
    
    for (const light of lightingKeywords) {
      if (desc.includes(light.toLowerCase())) {
        lighting = light
        break
      }
    }
    
    for (const atmo of atmosphereKeywords) {
      if (desc.includes(atmo.toLowerCase())) {
        atmosphere = atmo
        break
      }
    }
  }

  return {
    colorPalette: colorPalette.slice(0, 3),
    lighting,
    atmosphere,
  }
}
