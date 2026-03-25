# Change: 拆分 AppContext 为多个子上下文

## Why

当前 AppContext.tsx 有 593 行，混合了 API 配置、剧本管理、角色管理、分镜管理、撤销重做、数据持久化等 20+ 个状态操作。这导致：
- 难以维护和测试
- 状态更新时不必要的重渲染
- 新功能难以添加

## What Changes

- **BREAKING**: 重构状态管理 API
- 将 AppContext 拆分为 4 个独立的 Context：
  - ApiContext: API 配置 (provider, key, model, baseUrl)
  - ScriptContext: 剧本和场景管理
  - CharacterContext: 角色管理
  - StoryboardContext: 分镜管理
- 保留统一的 AppProvider 组合所有子 Context
- 保持向后兼容的 useApp hook，内部组合所有子 Context
- 优化 useCallback 依赖，减少不必要的重渲染

## Impact

- Affected specs: state-management
- Affected code: src/context/AppContext.tsx, src/App.tsx