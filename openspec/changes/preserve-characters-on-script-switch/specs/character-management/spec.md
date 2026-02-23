## ADDED Requirements
### Requirement: Global Character Library
The system SHALL maintain a global character library that persists across all scripts.

#### Scenario: Switching between scripts
- **WHEN** user adds characters to the global library and switches to a different script
- **THEN** the previously added characters remain available in the character library

#### Scenario: Creating a new script
- **WHEN** user creates a new script while characters exist in the global library
- **THEN** the existing characters in the global library are preserved

#### Scenario: Characters available across scripts
- **WHEN** user has multiple scripts open
- **THEN** all characters from the global library can be used in any script
