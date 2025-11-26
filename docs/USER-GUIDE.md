# Universal Electron Wrapper - User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [System Overview](#system-overview)
3. [Quick Start](#quick-start)
4. [Using the App Creator](#using-the-app-creator)
5. [Configuration Options](#configuration-options)
6. [Building Applications](#building-applications)
7. [Customizing the Electron Template](#customizing-the-electron-template)
8. [Troubleshooting](#troubleshooting)
9. [FAQ](#faq)

---

## Introduction

**Universal Electron Wrapper** is a tool that allows you to convert any web application into a standalone desktop application for Windows, macOS, and Linux. It consists of two main components:

1. **App Creator Tool** - A GUI application to configure and generate desktop apps
2. **Electron Template** - The base template used for generated applications

### Who is this for?

- **Business owners** who want to distribute their web apps as desktop applications
- **Developers** who need to quickly create Electron wrappers without writing code
- **Teams** who want to maintain consistency across multiple desktop app deployments

---

## System Overview

### Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    App Creator Tool                         │
│  ┌────────────────────────────────────────────────────┐   │
│  │ • Enter URL, App Name, Icon                         │   │
│  │ • Configure Window Settings                         │   │
│  │ • Select Target Platforms                           │   │
│  └────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Build Process:                                      │   │
│  │ 1. Copy Electron Template                           │   │
│  │ 2. Apply Configuration                              │   │
│  │ 3. Process Icons                                    │   │
│  │ 4. Install Dependencies                             │   │
│  │ 5. Build with electron-builder                      │   │
│  └────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│              Generated Desktop Application                  │
│              (.exe, .dmg, .AppImage, .deb)                 │
└────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
universal-electron-wrapper/
├── app-creator/           # The GUI tool for creating apps
│   ├── src/
│   │   ├── main/          # Electron main process
│   │   ├── renderer/      # UI (HTML/CSS/JS)
│   │   └── preload/       # IPC bridge
│   └── templates/         # Contains electron-template copy
│
├── electron-template/     # Base template for generated apps
│   ├── src/
│   │   ├── main/          # Main process code
│   │   └── preload/       # Preload script
│   └── config/            # Configuration files
│
└── docs/                  # Documentation
```

---

## Quick Start

### Prerequisites

Before using Universal Electron Wrapper, ensure you have:

- **Node.js** v18.0.0 or higher
- **npm** v8.0.0 or higher
- **Git** (optional, for version control)

### Installation

1. **Clone or download the repository:**
   ```bash
   git clone https://github.com/yourusername/universal-electron-wrapper.git
   cd universal-electron-wrapper
   ```

2. **Install dependencies for the App Creator:**
   ```bash
   cd app-creator
   npm install
   ```

3. **Copy the Electron Template to the templates folder:**
   ```bash
   # From the app-creator directory
   cp -r ../electron-template ./templates/
   ```

4. **Start the App Creator:**
   ```bash
   npm start
   ```

---

## Using the App Creator

### Step 1: Basic Configuration

When you launch the App Creator, you'll see a wizard interface:

1. **Application URL** (Required)
   - Enter the full URL of your web application
   - Must start with `http://` or `https://`
   - Example: `https://www.myapp.com`

2. **Application Name** (Required)
   - Choose a meaningful name for your desktop app
   - Allowed characters: letters, numbers, spaces, hyphens
   - Length: 3-50 characters
   - Example: `My Awesome App`

3. **Application Icon** (Optional)
   - Click "Upload Icon" or drag and drop an image
   - Recommended: PNG, 512x512 pixels or larger
   - Supported formats: PNG, JPG, JPEG, ICO
   - If not provided, a default icon will be used

### Step 2: Advanced Settings

Configure how your application window behaves:

| Setting | Default | Description |
|---------|---------|-------------|
| **Width** | 1200px | Initial window width |
| **Height** | 800px | Initial window height |
| **Min Width** | 800px | Minimum resizable width |
| **Min Height** | 600px | Minimum resizable height |
| **Resizable** | ✓ Yes | Allow user to resize window |
| **Frameless** | ✗ No | Hide window title bar |
| **Always On Top** | ✗ No | Keep window above others |
| **Start Maximized** | ✗ No | Open window maximized |
| **Enable DevTools** | ✗ No | Show developer tools |
| **Auto Update** | ✗ No | Enable update checking |

### Step 3: Platform Selection

Choose which platforms to build for:

#### Windows
- **Architectures**: x64 (recommended), ARM64, ia32
- **Output**: NSIS Installer (.exe)
- **Requirements**: Can build on any OS

#### macOS
- **Architectures**: Intel (x64), Apple Silicon (ARM64), Universal
- **Output**: DMG installer
- **Requirements**: Must build on macOS for signing

#### Linux
- **Architectures**: x64, ARM64
- **Output**: AppImage, DEB, RPM
- **Requirements**: Can build on any OS

### Step 4: Build

1. Click the **"Create App 🚀"** button
2. Watch the build progress:
   - ✓ Preparing workspace
   - ✓ Copying template files
   - ✓ Applying configuration
   - ✓ Processing icons
   - ⟳ Installing dependencies
   - ○ Building application
3. Wait for completion (typically 2-5 minutes)

### Step 5: Access Your App

After a successful build:

1. Click **"Open Output Folder"** to find your installers
2. Click **"Test Application"** to run the generated app
3. Distribute the installers to your users!

---

## Configuration Options

### config.json Reference

The generated applications use a `config/config.json` file. Here's a complete reference:

```json
{
  "app": {
    "name": "My Application",
    "version": "1.0.0",
    "description": "Description of my app",
    "author": "Your Name",
    "homepage": "https://www.example.com"
  },
  
  "target": {
    "url": "https://www.example.com",
    "userAgent": null
  },
  
  "window": {
    "width": 1200,
    "height": 800,
    "minWidth": 800,
    "minHeight": 600,
    "resizable": true,
    "frame": true,
    "alwaysOnTop": false,
    "fullscreen": false
  },
  
  "features": {
    "devTools": false,
    "contextIsolation": true,
    "nodeIntegration": false
  },
  
  "navigation": {
    "allowedDomains": ["example.com", "*.example.com"],
    "openExternalLinksInBrowser": true
  },
  
  "downloads": {
    "enabled": true,
    "openFolderOnComplete": false
  },
  
  "session": {
    "persistent": true,
    "clearOnExit": false
  }
}
```

### Configuration Sections Explained

#### `app` - Application Metadata
| Field | Description |
|-------|-------------|
| `name` | Display name of the application |
| `version` | Application version (semver format) |
| `description` | Short description for installers |
| `author` | Author or company name |
| `homepage` | Help menu link |

#### `target` - Web Application Target
| Field | Description |
|-------|-------------|
| `url` | The web application URL to load |
| `userAgent` | Custom User-Agent string (null = default) |

#### `window` - Window Appearance
| Field | Description |
|-------|-------------|
| `width/height` | Initial window dimensions |
| `minWidth/minHeight` | Minimum resize dimensions |
| `resizable` | Allow window resizing |
| `frame` | Show window title bar |
| `alwaysOnTop` | Keep window on top of others |
| `fullscreen` | Start in fullscreen mode |

#### `navigation` - Link Handling
| Field | Description |
|-------|-------------|
| `allowedDomains` | Domains that stay in the app |
| `openExternalLinksInBrowser` | Open external links in default browser |

---

## Building Applications

### From the App Creator GUI

The App Creator handles all build steps automatically. Just follow the wizard!

### Manual Building (Advanced)

If you need to build manually:

1. **Navigate to the generated app folder:**
   ```bash
   cd output/my-application
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run in development mode:**
   ```bash
   npm start
   ```

4. **Build for specific platforms:**
   ```bash
   # Windows
   npm run build:win
   
   # macOS
   npm run build:mac
   
   # Linux
   npm run build:linux
   ```

### Build Output Locations

After building, find your installers in:

```
output/my-application/
└── dist/
    ├── My-Application-Setup-1.0.0.exe    (Windows)
    ├── My-Application-1.0.0.dmg          (macOS)
    ├── My-Application-1.0.0.AppImage     (Linux)
    └── my-application_1.0.0_amd64.deb    (Linux Debian)
```

---

## Customizing the Electron Template

### Adding Custom Features

For advanced users who want to extend the template:

1. **Modify the template before building:**
   Edit files in `electron-template/src/main/`

2. **Add custom preload APIs:**
   Edit `electron-template/src/preload/preload.js`

3. **Change menu items:**
   Edit `electron-template/src/main/menu/menu-builder.js`

### Adding Custom CSS/JS Injection

To inject custom styles or scripts into the loaded web page:

```javascript
// In src/main/main.js, after loading the URL:
mainWindow.webContents.on('did-finish-load', () => {
  mainWindow.webContents.insertCSS(`
    /* Your custom CSS */
  `);
  
  mainWindow.webContents.executeJavaScript(`
    // Your custom JavaScript
  `);
});
```

---

## Troubleshooting

### Common Issues

#### "URL validation failed"
- **Cause**: Invalid URL format
- **Solution**: Ensure URL starts with `http://` or `https://`

#### "Icon processing failed"
- **Cause**: Image too small or wrong format
- **Solution**: Use PNG at least 512x512 pixels

#### "Build failed: npm install error"
- **Cause**: Missing dependencies or network issues
- **Solution**: 
  1. Check internet connection
  2. Clear npm cache: `npm cache clean --force`
  3. Try again

#### "macOS build requires signing"
- **Cause**: Code signing not configured
- **Solution**: 
  1. For testing: Use unsigned builds (not for distribution)
  2. For distribution: Obtain Apple Developer certificate

#### Application shows white screen
- **Cause**: URL unreachable or CORS issues
- **Solution**:
  1. Verify the URL works in a regular browser
  2. Check if the site blocks iframe embedding
  3. Contact the web app owner about Electron compatibility

### Error Logs

Build logs are stored in:
- **Windows**: `%APPDATA%\app-creator\logs\`
- **macOS**: `~/Library/Logs/app-creator/`
- **Linux**: `~/.config/app-creator/logs/`

---

## FAQ

### Can I wrap any website?

Yes, but the website owner should grant permission. Some sites may:
- Block embedding in Electron
- Have security measures that prevent desktop wrapping
- Require authentication that doesn't persist

### Is the generated app size too large?

Electron apps include the Chromium engine, resulting in ~150-200MB installers. This is normal for Electron applications.

### Can I update the wrapped app without rebuilding?

Yes! The `config.json` file can be edited after installation:
- Windows: `%LOCALAPPDATA%\Programs\{AppName}\resources\app\config\config.json`
- macOS: `/Applications/{AppName}.app/Contents/Resources/app/config/config.json`

### How do I enable auto-updates?

1. Set `updates.enabled: true` in config
2. Configure an update server (electron-updater)
3. Rebuild the application

### Can I remove the Electron branding?

Yes, customize:
- Application icon
- Window title
- Menu bar items
- About dialog

All through the App Creator or `config.json`.

---

## Support

For issues and feature requests:
- GitHub Issues: [Project Issues Page]
- Documentation: This guide

---

**Version**: 1.0.0  
**Last Updated**: November 2025
