# App Creator

This directory will contain the **App Creator Tool** - a user-friendly Electron application that generates custom Electron wrapper applications.

## Status
🚧 **Under Development** - Project structure defined in planning phase

## Purpose
The App Creator Tool is a desktop application that enables users to:
- Enter a target web application URL
- Configure application branding (name, icon)
- Set window properties and advanced options
- Select target platforms (Windows, macOS, Linux)
- Generate installable Electron applications automatically

## Planned Structure
```
app-creator/
├── src/
│   ├── main/              # Main process (backend)
│   ├── renderer/          # Renderer process (UI)
│   └── preload/           # Preload scripts
├── templates/             # Electron template storage
├── build/                 # Build output
├── package.json
└── README.md
```

## Documentation
For detailed specifications, see:
- [App Creator Specifications](../plan-docs/03-app-creator-specs.md)
- [Technical Architecture](../plan-docs/02-technical-architecture.md)
- [Implementation Roadmap](../plan-docs/05-implementation-roadmap.md)

## Next Steps
1. Initialize npm project
2. Install Electron and dependencies
3. Set up React/Vue framework
4. Begin Phase 2 development

---
**Last Updated**: November 24, 2025
