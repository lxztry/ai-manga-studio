# AI 漫剧工作室 - 开发过程总结

## 项目概述

**项目名称**：AI Manga Studio (AI 漫剧工作室)  
**项目类型**：Web 应用（React + TypeScript）  
**核心功能**：从剧本创作到视频导出的 AI 漫剧制作工具  
**GitHub 仓库**：https://github.com/lxztry/ai-manga-studio

---

## 开发时间线

### 第一阶段：基础架构搭建

1. **初始化项目**
   - 使用 Vite 创建 React + TypeScript 项目
   - 配置 TailwindCSS
   - 设置项目结构

2. **核心组件开发**
   - Layout 组件（主布局 + 设置）
   - ScriptEditor 组件（剧本编辑）
   - CharacterManager 组件（角色管理）
   - StoryboardEditor 组件（分镜编辑）
   - ImageGenerator 组件（图像生成）
   - MangaExporter 组件（视频导出）

### 第二阶段：AI 功能集成

1. **大语言模型集成**
   - 支持多提供商：OpenAI、OpenRouter、Anthropic、本地模型
   - 剧本自动生成
   - 文本导入智能解析

2. **图像生成集成**
   - Pollinations AI（免费，需代理）
   - SiliconFlow（推荐，国内可用）
   - HuggingFace、Stability AI（需 API 密钥）

3. **视频/音频功能**
   - AI 视频生成（SiliconFlow Wan2.2）
   - AI 配音（TTS CosyVoice）
   - 字幕自动生成

### 第三阶段：功能完善

1. **模板系统**
   - 内置 6 种剧本模板
   - 导出模板预设
   - 项目导入/导出

2. **用户体验优化**
   - 加载状态显示
   - 错误处理增强
   - API 请求重试机制
   - 场景-分镜关联

### 第四阶段：代码整理与提交

1. **代码检视**
   - TypeScript 编译检查通过
   - 无敏感信息泄露
   - 无 console.log 遗留
   - README 文档更新

2. **GitHub 提交**
   - 初始化 git 仓库
   - 创建 .gitignore
   - 提交 31 个文件

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | React 18 |
| 语言 | TypeScript |
| 构建工具 | Vite |
| 样式 | TailwindCSS |
| 图标 | Lucide React |
| 状态管理 | React Context |
| 存储 | localStorage |

---

## API 集成

### 大语言模型

| 提供商 | 用途 | 特点 |
|--------|------|------|
| OpenAI | 剧本生成 | 稳定，需付费 |
| OpenRouter | 剧本生成 | 便宜，免费额度 |
| Anthropic | 剧本生成 | Claude 系列 |
| 本地模型 | 剧本生成 | Ollama 等 |

### 图像/视频生成

| 提供商 | 用途 | 特点 |
|--------|------|------|
| SiliconFlow | 图像/视频/配音 | 推荐，国内可用 |
| Pollinations | 图像 | 免费，需代理 |
| HuggingFace | 图像 | 免费，需密钥 |

---

## 遇到的问题与解决方案

### 1. Pollinations API 无法访问
- **问题**：国内网络无法访问 Pollinations
- **解决**：改用 SiliconFlow（国内可用，有免费额度）

### 2. API 模型名称错误
- **问题**：视频生成模型名称错误 (20012 model does not exist)
- **解决**：修正为正确的模型名 `Wan-AI/Wan2.2-I2V-A14B`

### 3. TTS 参数格式错误
- **问题**：voice_id 参数不存在
- **解决**：使用正确的 voice 参数格式 `FunAudioLLM/CosyVoice2-0.5B:belle`

### 4. OpenRouter 速率限制
- **问题**：429 错误请求过于频繁
- **解决**：添加自动重试机制（3次重试）

### 5. 导入文本 API 调用错误
- **问题**：直接调用 fetch，未复用现有工具函数
- **解决**：创建 `importTextToScript` 工具函数

---

## 项目结构

```
ai-manga-studio/
├── src/
│   ├── components/
│   │   ├── CharacterManager/   # 角色管理
│   │   ├── ImageGenerator/    # AI 图像生成
│   │   ├── Layout/           # 主布局 + 设置
│   │   ├── MangaExporter/    # 视频导出 + AI 功能
│   │   ├── ScriptEditor/     # 剧本编辑
│   │   ├── StoryboardEditor/  # 分镜编辑
│   │   └── Templates/        # 模板 + 导入导出
│   ├── context/              # 状态管理
│   ├── types/                # 类型定义
│   ├── utils/                # AI 工具函数
│   └── styles/               # 样式
├── .opencode/skills/         # OpenCode 技能
├── AGENTS.md                 # AI 代理指南
├── README.md                 # 项目说明
└── package.json
```

---

## 经验总结

### 1. API 集成最佳实践
- 封装统一的 API 调用函数
- 正确处理错误和异常
- 添加重试机制应对限流

### 2. 多提供商支持
- 使用配置对象管理不同提供商的差异
- 保持接口一致性
- 提供默认选项

### 3. 前端存储策略
- localStorage 适合小型 Web 应用
- 注意容量限制
- 提供导入/导出备份

### 4. 代码质量
- TypeScript 严格模式
- 组件职责单一
- 工具函数复用

---

## 后续优化方向

1. **服务端存储**
   - 用户认证
   - 项目云端保存

2. **更多 AI 模型**
   - Runway、Pika 视频生成
   - 更多 TTS 音色

3. **协作功能**
   - 多人编辑
   - 社区分享

4. **性能优化**
   - 大图压缩
   - 分页加载

---

## 提交信息

```
feat: Initial AI Manga Studio with full workflow

- React + TypeScript + Vite + TailwindCSS web app
- AI script generation with multiple LLM providers
- Character management system
- Storyboard editor with scene association
- AI image generation (SiliconFlow, Pollinations, etc.)
- AI video generation (Wan2.2 I2V)
- AI voice/TTS (CosyVoice)
- Auto subtitle generation
- Template system with genre presets
- Project import/export
- LocalStorage persistence
- OpenCode skills for AI workflows
```

---

*文档生成时间：2026-02-23*
