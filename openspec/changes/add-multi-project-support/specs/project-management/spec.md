## ADDED Requirements
### Requirement: Project Management
The system MUST support creating, switching, and managing multiple projects.

#### Scenario: Create new project
- **WHEN** user clicks "New Project" and enters a name
- **THEN** a new project is created and becomes active

#### Scenario: Switch project
- **WHEN** user selects a different project from the dropdown
- **THEN** current project state is saved and selected project is loaded

#### Scenario: Delete project
- **WHEN** user clicks delete on a project
- **THEN** confirmation dialog appears and project is removed from storage

### Requirement: Project Data Isolation
The system MUST ensure data from one project does not leak to another.

#### Scenario: Independent state
- **WHEN** user switches from Project A to Project B
- **THEN** Project B contains only its own scripts, characters, and storyboards

### Requirement: Project Metadata
The system MUST store and display project metadata.

#### Scenario: Last modified timestamp
- **WHEN** user modifies any project data
- **THEN** lastModified timestamp is updated for that project