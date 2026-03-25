## ADDED Requirements
### Requirement: Keyboard Shortcut System
The system MUST provide a keyboard shortcut system for common operations.

#### Scenario: Default shortcuts
- **WHEN** user presses Ctrl+S
- **THEN** project is saved to localStorage

#### Scenario: Undo/Redo shortcuts
- **WHEN** user presses Ctrl+Z
- **THEN** last action is undone

#### Scenario: Generate shortcut
- **WHEN** user presses Ctrl+G with panel selected
- **THEN** image generation is triggered for selected panel

### Requirement: Shortcut Customization
The system MUST allow users to customize keyboard shortcuts.

#### Scenario: Custom shortcut assignment
- **WHEN** user assigns a new key combination to an action in settings
- **THEN** the custom shortcut overrides the default

#### Scenario: Shortcut conflict detection
- **WHEN** user assigns a duplicate key combination
- **THEN** warning is displayed indicating conflict

### Requirement: Shortcut UI Integration
The system MUST display shortcut hints in the UI.

#### Scenario: Tooltip hint
- **WHEN** user hovers over a button with a shortcut
- **THEN** tooltip shows the keyboard shortcut