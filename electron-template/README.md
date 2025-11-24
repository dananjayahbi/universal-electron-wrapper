# Electron Template

This directory contains the **Electron Template** - a pre-configured, minimal Electron application that serves as the foundation for all generated wrapper applications.

## Status
🚧 **Under Development** - Project structure defined in planning phase

## Purpose
The Electron Template is a ready-to-use Electron application that:
- Loads a specified URL from configuration
- Supports custom branding (name, icon)
- Provides configurable window properties
- Handles navigation and downloads
- Can be packaged for Windows, macOS, and Linux

## Planned Structure
```
electron-template/
├── src/
│   ├── main/              # Main process
│   │   ├── main.js
│   │   ├── config/
│   │   ├── window/
│   │   ├── menu/
│   │   └── utils/
│   └── preload/           # Preload scripts
├── config/                # Configuration files
│   └── config.json
├── build/                 # Build resources (icons)
├── dist/                  # Distribution output
├── package.json
├── electron-builder.yml
└── README.md
```

## Documentation
For detailed specifications, see:
- [Electron Template Specifications](../plan-docs/04-electron-template-specs.md)
- [Technical Architecture](../plan-docs/02-technical-architecture.md)
- [Implementation Roadmap](../plan-docs/05-implementation-roadmap.md)

## Next Steps
1. Initialize npm project
2. Install Electron
3. Create main.js entry point
4. Begin Phase 1 development

---
**Last Updated**: November 24, 2025
