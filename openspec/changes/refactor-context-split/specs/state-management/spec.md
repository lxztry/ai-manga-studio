## ADDED Requirements

### Requirement: Context Split Architecture
The system MUST use multiple independent sub-Contexts to manage different domains of state.

#### Scenario: API Context 独立
- **WHEN** 用户修改 API 配置
- **THEN** 只触发 ApiContext 更新，不影响其他 Context

#### Scenario: Script Context 独立
- **WHEN** 用户切换剧本
- **THEN** 只触发 ScriptContext 更新，不触发 Character/Storyboard 重渲染

### Requirement: Unified AppProvider
The system MUST provide a unified AppProvider that combines all sub-Contexts and exposes a single useApp hook.

#### Scenario: useApp 返回组合状态
- **WHEN** 组件调用 useApp()
- **THEN** 返回所有子 Context 的状态和操作方法

### Requirement: Backward Compatibility
The new Context structure MUST maintain backward compatibility so existing components require no modifications.

#### Scenario: 现有组件工作正常
- **WHEN** 迁移完成后
- **THEN** 所有现有使用 useApp() 的组件继续正常工作