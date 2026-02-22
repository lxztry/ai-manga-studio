# AI 漫剧工作室

一个基于 React + TypeScript 的 AI 漫剧制作 Web 应用，支持从剧本创作到视频导出的完整流程。

## 功能特性

### 剧本创作
- **AI剧本生成** - 使用大语言模型自动生成漫剧剧本
- **文本导入** - 导入已有的小说/故事文本，AI自动解析为剧本格式
- **模板系统** - 内置多种类型模板（冒险/爱情/科幻/奇幻/悬疑/喜剧）

### 角色管理
- 创建和管理漫剧角色
- 角色外观、性格描述
- 角色库管理

### 分镜编辑
- 拖拽排序分镜
- 从场景快速生成
- 批量上传图片
- 场景关联显示

### AI 图像生成
- 多提供商支持：SiliconFlow、Pollinations、HuggingFace、Stability AI
- 多种画风：日式漫画、动画风格、写实、水彩、美式漫画、素描等
- 角色一致性 - 上传参考图保持角色外观一致
- 艺术风格：电影感、戏剧性、柔和、梦幻等

### 视频导出
- **AI视频生成** - 图生视频 (SiliconFlow Wan2.2)
- **AI配音** - 文字转语音 (CosyVoice)
- **字幕生成** - 智能分割文字生成 SRT 字幕
- 静态导出：WebM视频、图片序列、HTML网页
- 背景音乐支持
- 本地数据持久化

## 技术栈

- React 18
- TypeScript
- Vite
- TailwindCSS
- Lucide Icons

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## API 配置

在使用 AI 功能之前，需要在设置中配置 API 密钥：

### 1. 大语言模型 (剧本生成/文本导入)
- **OpenAI** - GPT-4o, GPT-4, GPT-3.5
- **OpenRouter** - 多种模型，便宜
- **Anthropic** - Claude 3
- **本地模型** - Ollama 等

### 2. 图像生成 (SiliconFlow 推荐)
- 免费额度，国内可用
- 访问 [siliconflow.cn](https://siliconflow.cn) 获取 API 密钥

### 3. 视频/配音
- 使用 SiliconFlow API（图像生成同一密钥）
- 支持 Wan2.2 图生视频
- 支持 CosyVoice 语音合成

## 项目结构

```
src/
├── components/           # UI 组件
│   ├── CharacterManager/  # 角色管理
│   ├── ImageGenerator/   # AI 图像生成
│   ├── Layout/           # 主布局 + 设置
│   ├── MangaExporter/    # 视频导出 + AI 功能
│   ├── ScriptEditor/     # 剧本编辑
│   ├── StoryboardEditor/  # 分镜编辑
│   └── Templates/        # 模板 + 导入导出
├── context/              # React Context 状态管理
├── types/                # TypeScript 类型定义
├── utils/                # AI 工具函数
└── styles/               # 全局样式
```

## License

MIT
