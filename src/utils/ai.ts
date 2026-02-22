import type { Script, Character, Dialogue } from '../types'

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

interface AIConfig {
  apiKey?: string
  provider: string
  model?: string
  baseUrl?: string
}

interface APIError {
  error?: {
    message?: string
    code?: string
    type?: string
  }
  message?: string
}

async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  config: AIConfig
): Promise<string> {
  if (!config.apiKey) {
    throw new Error('请在设置中配置API密钥')
  }

  let url: string
  let headers: Record<string, string>
  let model: string

  switch (config.provider) {
    case 'openai':
      url = 'https://api.openai.com/v1/chat/completions'
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      }
      model = config.model || 'gpt-4'
      break

    case 'openrouter':
      url = `${OPENROUTER_BASE_URL}/chat/completions`
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'HTTP-Referer': window.location.origin || 'http://localhost:3000',
        'X-Title': 'AI Manga Studio',
      }
      model = config.model || 'openai/gpt-4'
      break

    case 'anthropic':
      url = 'https://api.anthropic.com/v1/messages'
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      }
      model = config.model || 'claude-3-sonnet-20240229'
      break

    case 'local':
      url = config.baseUrl || 'http://localhost:11434/v1/chat/completions'
      headers = { 'Content-Type': 'application/json' }
      model = config.model || 'llama2'
      break

    default:
      throw new Error(`不支持的API提供商: ${config.provider}`)
  }

  const isAnthropic = config.provider === 'anthropic'
  
  const body = isAnthropic
    ? {
        model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }
    : {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
      }

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
  } catch (networkError) {
    throw new Error(`网络请求失败: ${networkError instanceof Error ? networkError.message : '请检查网络连接'}`)
  }

  if (!response.ok) {
    let errorMessage = `API请求失败 (${response.status})`
    
    try {
      const errorText = await response.text()
      const errorData = JSON.parse(errorText) as APIError
      errorMessage = errorData.error?.message || errorData.message || errorMessage
      
      if (errorData.error?.type === 'invalid_api_key') {
        errorMessage = 'API密钥无效，请检查设置中的密钥'
      } else if (errorData.error?.type === 'insufficient_quota') {
        errorMessage = 'API配额不足，请充值或更换账户'
      } else if (response.status === 401) {
        errorMessage = 'API密钥错误或已过期'
      } else if (response.status === 429) {
        errorMessage = '请求过于频繁，请稍后重试'
      } else if (response.status >= 500) {
        errorMessage = 'API服务端错误，请稍后重试'
      }
    } catch {
      errorMessage = `请求失败 (${response.status}): 请检查API配置`
    }
    
    throw new Error(errorMessage)
  }

  const data = await response.json()
  
  if (isAnthropic) {
    if (!data.content || !data.content[0]) {
      throw new Error('API返回格式异常')
    }
    return data.content[0].text
  }
  
  if (!data.choices || !data.choices[0]) {
    throw new Error('API返回格式异常')
  }
  
  return data.choices[0].message.content
}

export async function generateScript(
  prompt: string,
  genre: string,
  config: AIConfig
): Promise<Partial<Script>> {
  const systemPrompt = `你是一个专业的漫画剧本编剧。根据用户的提示，创作一个完整的漫画剧本。
返回纯JSON格式（不要包含markdown代码块标记），包含以下字段：
- title: 剧本标题
- description: 剧本简介  
- genre: 类型（${genre}）
- scenes: 场景数组，每个场景包含：
  - name: 场景名称
  - description: 场景描述
  - location: 地点
  - timeOfDay: 时间（morning/afternoon/evening/night）
  - dialogues: 对话数组，每个对话包含：
    - characterId: 角色ID（用占位符或空字符串）
    - content: 对话内容
    - emotion: 情绪（可选）
    - action: 动作描述（可选）
- characters: 角色数组，每个角色包含：
  - name: 角色名
  - description: 角色描述
  - appearance: 外貌描述
  - personality: 性格特点
  - traits: 特征标签数组`

  try {
    const content = await callLLM(systemPrompt, prompt, config)
    
    let jsonStr = content
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }
    
    const result = JSON.parse(jsonStr)
    
    if (!result.title && !result.scenes) {
      throw new Error('API返回的内容格式不正确')
    }
    
    return result
  } catch (error) {
    console.error('生成剧本失败:', error)
    throw error
  }
}

export async function generateDialogue(
  context: string,
  characters: Character[],
  config: AIConfig
): Promise<Dialogue[]> {
  const characterInfo = characters.map(c => `${c.name}: ${c.personality}`).join('\n')
  
  const systemPrompt = `你是一个对话编剧。根据上下文和角色信息，创作自然的对话。
角色信息：
${characterInfo}

返回纯JSON数组（不要包含markdown代码块标记），每个对话包含：
- characterId: 角色ID
- content: 对话内容
- emotion: 情绪（可选）
- action: 动作描述（可选）`

  try {
    const content = await callLLM(systemPrompt, context, config)
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(content)
  } catch (error) {
    console.error('生成对话失败:', error)
    throw error
  }
}

export async function generateSceneDescription(
  context: string,
  config: AIConfig
): Promise<{ description: string; location: string }> {
  const systemPrompt = `你是一个场景设计师。根据上下文，创作详细的场景描述。
返回纯JSON对象（不要包含markdown代码块标记），包含：
- description: 场景的详细视觉描述
- location: 场景地点名称`

  try {
    const content = await callLLM(systemPrompt, context, config)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(content)
  } catch (error) {
    console.error('生成场景描述失败:', error)
    throw error
  }
}

export async function optimizeVideoPrompt(
  prompt: string,
  config: AIConfig
): Promise<string> {
  const systemPrompt = `你是一个AI视频提示词优化专家。根据用户提供的原始描述，为各种AI视频生成工具优化提示词。

支持的模型：Seedance, Runway, Pika, Kling, Sora, Luma Dream Machine, Google Veo

请返回纯JSON格式（不要包含markdown代码块标记），包含以下字段：
- optimized_prompt: 优化后的英文提示词，包含主体、动作、场景、镜头运动、光线氛围、风格修饰
- negative_prompt: 负面提示词，避免常见问题
- tips: 使用建议数组
- model_prompts: 针对不同模型优化的提示词版本

优化技巧：
1. 主体描述要具体明确
2. 动作描述要清晰可实现
3. 镜头运动要明确指定
4. 添加质量修饰词（cinematic, high quality, 4k等）
5. 添加光线和氛围描述`

  try {
    const content = await callLLM(systemPrompt, prompt, config)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return jsonMatch[0]
    }
    return content
  } catch (error) {
    console.error('优化提示词失败:', error)
    throw error
  }
}

export const POPULAR_OPENROUTER_MODELS = [
  { id: 'openai/gpt-4', name: 'GPT-4' },
  { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus' },
  { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku' },
  { id: 'google/gemini-pro', name: 'Gemini Pro' },
  { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B' },
  { id: 'mistralai/mixtral-8x7b-instruct', name: 'Mixtral 8x7B' },
  { id: 'qwen/qwen-2-72b-instruct', name: 'Qwen 2 72B' },
]

export async function importTextToScript(
  text: string,
  config: AIConfig
): Promise<Partial<Script>> {
  const systemPrompt = `你是一个专业的漫画剧本编剧。分析用户提供的文本故事，转换为结构化的剧本格式。`

  const userPrompt = `请分析以下文本故事，并将其转换为结构化的剧本格式。返回纯JSON格式（不要包含markdown代码块标记），包含以下字段：
- title: 剧本标题（从文本中提取或生成）
- description: 剧本简介
- genre: 故事类型（冒险/爱情/科幻/奇幻/悬疑/喜剧/动作/恐怖）
- scenes: 场景数组，每个场景包含：
  - name: 场景名称
  - description: 场景描述
  - location: 地点
  - timeOfDay: 时间（morning/afternoon/evening/night）
  - dialogues: 对话数组，每句对话包含：
    - character: 角色名
    - content: 对话内容
    - emotion: 情绪（可选）

请直接返回JSON，不要其他内容。

故事文本：
${text.slice(0, 5000)}`

  try {
    const content = await callLLM(systemPrompt, userPrompt, config)
    
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('AI返回的内容格式不正确')
    }

    const result = JSON.parse(jsonMatch[0])
    
    return result
  } catch (error) {
    console.error('导入文本失败:', error)
    throw error
  }
}
