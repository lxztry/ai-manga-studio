# Change: Add Multi-Project Support

## Why

Currently only one project can exist at a time. Users need:
- Multiple manga projects organized separately
- Easy switching between projects
- Project-level settings and metadata

## What Changes

- Add project management (create, switch, delete, rename)
- Add project selector UI in header
- Store each project separately in localStorage
- Add project metadata (name, created date, last modified)

## Impact

- Affected specs: project-management
- Affected code: src/context/AppContext.tsx, src/App.tsx