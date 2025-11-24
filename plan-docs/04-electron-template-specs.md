# Electron Template - Detailed Specifications

## Document Information
- **Version**: 1.0.0
- **Date**: November 24, 2025
- **Status**: Draft

---

## 1. Overview

The Electron Template is a pre-configured, minimal Electron application that serves as the foundation for all generated wrapper applications. It is designed to be highly configurable, lightweight, and easy to customize through JSON configuration files.

**Purpose**: Provide a ready-to-use Electron application template that can be quickly configured to load any web URL with custom branding.

---

## 2. Core Requirements

### 2.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Load specified URL from configuration file | MUST HAVE |
| FR-2 | Support custom application name and branding | MUST HAVE |
| FR-3 | Support custom application icons | MUST HAVE |
| FR-4 | Configurable window properties | MUST HAVE |
| FR-5 | Handle external links appropriately | MUST HAVE |
| FR-6 | Manage downloads from web content | SHOULD HAVE |
| FR-7 | Session persistence (cookies, storage) | SHOULD HAVE |
| FR-8 | Custom menu bar support | SHOULD HAVE |
| FR-9 | Auto-update capability | COULD HAVE |
| FR-10 | DevTools access (configurable) | SHOULD HAVE |

### 2.2 Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 | Startup time | < 3 seconds |
| NFR-2 | Memory footprint | < 150MB idle |
| NFR-3 | Package size (before compression) | < 150MB |
| NFR-4 | Cross-platform compatibility | Windows, macOS, Linux |
| NFR-5 | Security compliance | CSP, context isolation |

---

## 3. Architecture

### 3.1 Process Architecture

```
┌─────────────────────────────────────────────────────────┐
│              ELECTRON TEMPLATE APP                       │
└─────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                    MAIN PROCESS                          │
│                                                          │
│  ├─ Application Lifecycle                               │
│  │  ├─ app.on('ready')                                  │
│  │  ├─ app.on('window-all-closed')                      │
│  │  ├─ app.on('activate')                               │
│  │  └─ app.on('quit')                                   │
│  │                                                       │
│  ├─ Configuration Management                            │
│  │  ├─ Load config.json                                 │
│  │  ├─ Validate configuration                           │
│  │  └─ Apply defaults                                   │
│  │                                                       │
│  ├─ Window Management                                   │
│  │  ├─ Create BrowserWindow                             │
│  │  ├─ Set window properties                            │
│  │  ├─ Load target URL                                  │
│  │  └─ Handle window events                             │
│  │                                                       │
│  ├─ Menu Management                                     │
│  │  ├─ Create application menu                          │
│  │  ├─ Create context menu                              │
│  │  └─ Register shortcuts                               │
│  │                                                       │
│  ├─ Download Management                                 │
│  │  ├─ Handle will-download event                       │
│  │  ├─ Show save dialog                                 │
│  │  └─ Track download progress                          │
│  │                                                       │
│  └─ External Link Handling                              │
│     ├─ Intercept navigation                             │
│     ├─ Open external URLs in browser                    │
│     └─ Keep internal URLs in app                        │
│                                                          │
└──────────────────────────────────────────────────────────┘
                            │
                            │ IPC Bridge
                            │
┌───────────────────────────▼──────────────────────────────┐
│                   PRELOAD SCRIPT                         │
│                                                          │
│  ├─ Expose safe APIs to renderer                        │
│  ├─ Context isolation bridge                            │
│  └─ Security sanitization                               │
│                                                          │
└──────────────────────────────────────────────────────────┘
                            │
                            │
┌───────────────────────────▼──────────────────────────────┐
│                  RENDERER PROCESS                        │
│                                                          │
│  ├─ Load target web application                         │
│  ├─ Handle web content interactions                     │
│  ├─ Execute web app JavaScript                          │
│  └─ Communicate with main via IPC                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Configuration System

### 4.1 Configuration File Structure

**File**: `config/config.json`

```json
{
  "app": {
    "name": "My Application",
    "version": "1.0.0",
    "description": "My web application wrapper",
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
    "maxWidth": null,
    "maxHeight": null,
    "resizable": true,
    "movable": true,
    "minimizable": true,
    "maximizable": true,
    "closable": true,
    "focusable": true,
    "alwaysOnTop": false,
    "fullscreen": false,
    "kiosk": false,
    "frame": true,
    "show": true,
    "center": true,
    "title": "My Application",
    "backgroundColor": "#ffffff",
    "transparent": false,
    "hasShadow": true,
    "opacity": 1.0
  },
  
  "features": {
    "devTools": false,
    "contextIsolation": true,
    "nodeIntegration": false,
    "sandbox": true,
    "webSecurity": true,
    "autoHideMenuBar": false,
    "enableRemoteModule": false
  },
  
  "menu": {
    "enabled": true,
    "template": "default"
  },
  
  "navigation": {
    "allowedDomains": ["example.com", "*.example.com"],
    "openExternalLinksInBrowser": true,
    "internalUrlPatterns": []
  },
  
  "downloads": {
    "enabled": true,
    "openFolderOnComplete": false,
    "defaultPath": null
  },
  
  "session": {
    "persistent": true,
    "partition": "persist:main",
    "clearOnExit": false
  },
  
  "updates": {
    "enabled": false,
    "autoDownload": false,
    "autoInstall": false,
    "checkOnStart": false
  },
  
  "logging": {
    "level": "info",
    "file": true,
    "console": true
  }
}
```

### 4.2 Configuration Loading Process

```javascript
// src/main/config/config-loader.js

const fs = require('fs');
const path = require('path');

class ConfigLoader {
  constructor() {
    this.configPath = path.join(__dirname, '../../config/config.json');
    this.config = null;
  }

  load() {
    try {
      const configFile = fs.readFileSync(this.configPath, 'utf8');
      this.config = JSON.parse(configFile);
      this.validate();
      this.applyDefaults();
      return this.config;
    } catch (error) {
      console.error('Failed to load config:', error);
      return this.getDefaultConfig();
    }
  }

  validate() {
    // Validate required fields
    if (!this.config.target?.url) {
      throw new Error('Target URL is required');
    }
    
    // Validate URL format
    try {
      new URL(this.config.target.url);
    } catch {
      throw new Error('Invalid target URL');
    }
  }

  applyDefaults() {
    // Apply default values for missing fields
    this.config = {
      ...this.getDefaultConfig(),
      ...this.config
    };
  }

  getDefaultConfig() {
    return {
      app: {
        name: 'Electron Wrapper',
        version: '1.0.0'
      },
      target: {
        url: 'https://example.com'
      },
      window: {
        width: 1200,
        height: 800,
        resizable: true,
        frame: true
      },
      features: {
        devTools: false,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    };
  }
}

module.exports = ConfigLoader;
```

---

## 5. Main Process Implementation

### 5.1 Main Entry Point

**File**: `src/main/main.js`

```javascript
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const ConfigLoader = require('./config/config-loader');
const WindowManager = require('./window/window-manager');
const MenuBuilder = require('./menu/menu-builder');
const DownloadManager = require('./downloads/download-manager');
const NavigationManager = require('./navigation/navigation-manager');
const logger = require('./utils/logger');

class Application {
  constructor() {
    this.config = null;
    this.mainWindow = null;
    this.configLoader = new ConfigLoader();
  }

  async initialize() {
    // Load configuration
    this.config = this.configLoader.load();
    logger.info('Configuration loaded', { config: this.config });

    // Set application name
    app.name = this.config.app.name;

    // Initialize app when ready
    app.on('ready', () => this.onReady());
    app.on('window-all-closed', () => this.onWindowAllClosed());
    app.on('activate', () => this.onActivate());
  }

  onReady() {
    // Create main window
    const windowManager = new WindowManager(this.config);
    this.mainWindow = windowManager.createWindow();

    // Build menu
    if (this.config.menu.enabled) {
      const menuBuilder = new MenuBuilder(this.config);
      const menu = menuBuilder.buildMenu();
      Menu.setApplicationMenu(menu);
    }

    // Setup download handling
    const downloadManager = new DownloadManager(this.config);
    downloadManager.attach(this.mainWindow);

    // Setup navigation handling
    const navManager = new NavigationManager(this.config);
    navManager.attach(this.mainWindow);

    // Load target URL
    this.mainWindow.loadURL(this.config.target.url);

    logger.info('Application ready');
  }

  onWindowAllClosed() {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  onActivate() {
    if (BrowserWindow.getAllWindows().length === 0) {
      this.onReady();
    }
  }
}

// Start application
const application = new Application();
application.initialize();
```

### 5.2 Window Manager

**File**: `src/main/window/window-manager.js`

```javascript
const { BrowserWindow } = require('electron');
const path = require('path');

class WindowManager {
  constructor(config) {
    this.config = config;
  }

  createWindow() {
    const windowConfig = this.config.window;
    const featuresConfig = this.config.features;

    const window = new BrowserWindow({
      width: windowConfig.width,
      height: windowConfig.height,
      minWidth: windowConfig.minWidth,
      minHeight: windowConfig.minHeight,
      maxWidth: windowConfig.maxWidth,
      maxHeight: windowConfig.maxHeight,
      resizable: windowConfig.resizable,
      movable: windowConfig.movable,
      minimizable: windowConfig.minimizable,
      maximizable: windowConfig.maximizable,
      closable: windowConfig.closable,
      focusable: windowConfig.focusable,
      alwaysOnTop: windowConfig.alwaysOnTop,
      fullscreen: windowConfig.fullscreen,
      kiosk: windowConfig.kiosk,
      frame: windowConfig.frame,
      show: windowConfig.show,
      center: windowConfig.center,
      title: windowConfig.title,
      backgroundColor: windowConfig.backgroundColor,
      transparent: windowConfig.transparent,
      hasShadow: windowConfig.hasShadow,
      opacity: windowConfig.opacity,
      
      webPreferences: {
        preload: path.join(__dirname, '../preload/preload.js'),
        contextIsolation: featuresConfig.contextIsolation,
        nodeIntegration: featuresConfig.nodeIntegration,
        sandbox: featuresConfig.sandbox,
        webSecurity: featuresConfig.webSecurity,
        enableRemoteModule: featuresConfig.enableRemoteModule
      }
    });

    // Open DevTools if enabled
    if (featuresConfig.devTools) {
      window.webContents.openDevTools();
    }

    // Hide menu bar if configured
    if (featuresConfig.autoHideMenuBar) {
      window.setAutoHideMenuBar(true);
      window.setMenuBarVisibility(false);
    }

    // Set custom User-Agent if specified
    if (this.config.target.userAgent) {
      window.webContents.setUserAgent(this.config.target.userAgent);
    }

    return window;
  }
}

module.exports = WindowManager;
```

### 5.3 Navigation Manager

**File**: `src/main/navigation/navigation-manager.js`

```javascript
const { shell } = require('electron');
const logger = require('../utils/logger');

class NavigationManager {
  constructor(config) {
    this.config = config;
  }

  attach(window) {
    // Handle new window requests
    window.webContents.setWindowOpenHandler(({ url }) => {
      return this.handleNewWindow(url);
    });

    // Handle navigation attempts
    window.webContents.on('will-navigate', (event, url) => {
      this.handleNavigation(event, url);
    });

    // Handle external protocol requests
    window.webContents.on('will-redirect', (event, url) => {
      this.handleRedirect(event, url);
    });
  }

  handleNewWindow(url) {
    logger.info('New window requested', { url });

    if (this.shouldOpenExternally(url)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }

    return { action: 'allow' };
  }

  handleNavigation(event, url) {
    logger.info('Navigation attempt', { url });

    if (this.shouldOpenExternally(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  }

  handleRedirect(event, url) {
    logger.info('Redirect attempt', { url });

    if (this.shouldOpenExternally(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  }

  shouldOpenExternally(url) {
    if (!this.config.navigation.openExternalLinksInBrowser) {
      return false;
    }

    try {
      const urlObj = new URL(url);
      const targetUrl = new URL(this.config.target.url);

      // Check if URL is in allowed domains
      const allowedDomains = this.config.navigation.allowedDomains || [];
      
      // Check if same domain as target
      if (urlObj.hostname === targetUrl.hostname) {
        return false;
      }

      // Check if in allowed domains
      for (const domain of allowedDomains) {
        if (this.matchesDomain(urlObj.hostname, domain)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('Error parsing URL', { url, error });
      return true;
    }
  }

  matchesDomain(hostname, pattern) {
    // Handle wildcard patterns like *.example.com
    if (pattern.startsWith('*.')) {
      const baseDomain = pattern.substring(2);
      return hostname === baseDomain || hostname.endsWith('.' + baseDomain);
    }
    return hostname === pattern;
  }
}

module.exports = NavigationManager;
```

### 5.4 Download Manager

**File**: `src/main/downloads/download-manager.js`

```javascript
const { dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class DownloadManager {
  constructor(config) {
    this.config = config;
  }

  attach(window) {
    if (!this.config.downloads.enabled) {
      return;
    }

    window.webContents.session.on('will-download', (event, item, webContents) => {
      this.handleDownload(item, webContents);
    });
  }

  handleDownload(item, webContents) {
    const filename = item.getFilename();
    logger.info('Download started', { filename });

    // Set save path
    const defaultPath = this.config.downloads.defaultPath || 
                       require('electron').app.getPath('downloads');
    
    const savePath = path.join(defaultPath, filename);
    item.setSavePath(savePath);

    // Track download progress
    item.on('updated', (event, state) => {
      if (state === 'interrupted') {
        logger.warn('Download interrupted', { filename });
      } else if (state === 'progressing') {
        const progress = Math.round((item.getReceivedBytes() / item.getTotalBytes()) * 100);
        logger.debug('Download progress', { filename, progress });
      }
    });

    // Handle download completion
    item.once('done', (event, state) => {
      if (state === 'completed') {
        logger.info('Download completed', { filename, path: savePath });
        
        if (this.config.downloads.openFolderOnComplete) {
          shell.showItemInFolder(savePath);
        }
      } else {
        logger.error('Download failed', { filename, state });
      }
    });
  }
}

module.exports = DownloadManager;
```

### 5.5 Menu Builder

**File**: `src/main/menu/menu-builder.js`

```javascript
const { Menu, shell } = require('electron');

class MenuBuilder {
  constructor(config) {
    this.config = config;
  }

  buildMenu() {
    const template = this.getMenuTemplate();
    return Menu.buildFromTemplate(template);
  }

  getMenuTemplate() {
    if (this.config.menu.template === 'minimal') {
      return this.getMinimalTemplate();
    }
    return this.getDefaultTemplate();
  }

  getDefaultTemplate() {
    const isMac = process.platform === 'darwin';

    return [
      // App menu (macOS)
      ...(isMac ? [{
        label: this.config.app.name,
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      }] : []),

      // File menu
      {
        label: 'File',
        submenu: [
          isMac ? { role: 'close' } : { role: 'quit' }
        ]
      },

      // Edit menu
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectAll' }
        ]
      },

      // View menu
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          ...(this.config.features.devTools ? [
            { role: 'toggleDevTools' }
          ] : []),
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },

      // Window menu
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'zoom' },
          ...(isMac ? [
            { type: 'separator' },
            { role: 'front' }
          ] : [
            { role: 'close' }
          ])
        ]
      },

      // Help menu
      {
        role: 'help',
        submenu: [
          {
            label: 'Learn More',
            click: async () => {
              await shell.openExternal(this.config.app.homepage || 'https://electronjs.org');
            }
          }
        ]
      }
    ];
  }

  getMinimalTemplate() {
    return [
      {
        label: 'File',
        submenu: [
          { role: 'quit' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'togglefullscreen' }
        ]
      }
    ];
  }
}

module.exports = MenuBuilder;
```

---

## 6. Preload Script

**File**: `src/preload/preload.js`

```javascript
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),
  
  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  
  // External links
  openExternal: (url) => ipcRenderer.send('link:open-external', url),
  
  // Config
  getConfig: () => ipcRenderer.invoke('config:get'),
  
  // Updates (if enabled)
  checkForUpdates: () => ipcRenderer.send('updates:check'),
  onUpdateAvailable: (callback) => ipcRenderer.on('updates:available', callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on('updates:downloaded', callback)
});
```

---

## 7. Build Configuration

### 7.1 package.json

```json
{
  "name": "electron-wrapper-app",
  "version": "1.0.0",
  "description": "Custom Electron wrapper application",
  "main": "src/main/main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder",
    "build:win": "electron-builder --win",
    "build:mac": "electron-builder --mac",
    "build:linux": "electron-builder --linux"
  },
  "keywords": ["electron", "wrapper"],
  "author": "Generated by Universal Electron Wrapper",
  "license": "MIT",
  "dependencies": {
    "electron-log": "^5.0.0"
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.6.0"
  }
}
```

### 7.2 electron-builder.yml

```yaml
appId: com.electronwrapper.${name}
productName: ${name}
copyright: Copyright © 2025

directories:
  buildResources: build
  output: dist

files:
  - src/**/*
  - config/**/*
  - node_modules/**/*
  - package.json

asar: true
asarUnpack:
  - "**/node_modules/sharp/**/*"

win:
  target:
    - target: nsis
      arch:
        - x64
  icon: build/icon.ico
  artifactName: ${productName}-Setup-${version}.${ext}

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  allowElevation: true
  installerIcon: build/icon.ico
  uninstallerIcon: build/icon.ico
  installerHeaderIcon: build/icon.ico
  createDesktopShortcut: always
  createStartMenuShortcut: true
  shortcutName: ${productName}

mac:
  target:
    - target: dmg
      arch:
        - x64
        - arm64
  icon: build/icon.icns
  category: public.app-category.productivity
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist

dmg:
  contents:
    - x: 410
      y: 150
      type: link
      path: /Applications
    - x: 130
      y: 150
      type: file
  window:
    width: 540
    height: 380

linux:
  target:
    - AppImage
    - deb
    - rpm
  icon: build/icon.png
  category: Utility
  synopsis: ${description}
  description: ${description}
  maintainer: ${author}

appImage:
  license: MIT

deb:
  depends:
    - gconf2
    - gconf-service
    - libnotify4
    - libappindicator1
    - libxtst6
    - libnss3

rpm:
  depends:
    - libXScrnSaver
```

---

## 8. Directory Structure

```
electron-template/
├── src/
│   ├── main/
│   │   ├── main.js                     # Main entry point
│   │   ├── config/
│   │   │   └── config-loader.js        # Configuration loader
│   │   ├── window/
│   │   │   └── window-manager.js       # Window creation
│   │   ├── menu/
│   │   │   └── menu-builder.js         # Menu builder
│   │   ├── downloads/
│   │   │   └── download-manager.js     # Download handling
│   │   ├── navigation/
│   │   │   └── navigation-manager.js   # Navigation control
│   │   └── utils/
│   │       └── logger.js               # Logging utility
│   │
│   └── preload/
│       └── preload.js                  # Preload script
│
├── config/
│   ├── config.json                     # Main configuration
│   └── config.template.json            # Template for App Creator
│
├── build/
│   ├── icon.png                        # Default icon (1024x1024)
│   ├── icon.ico                        # Windows icon
│   ├── icon.icns                       # macOS icon
│   └── entitlements.mac.plist          # macOS entitlements
│
├── dist/                               # Build output
├── node_modules/                       # Dependencies
├── package.json                        # Package definition
├── electron-builder.yml                # Builder configuration
├── .gitignore                          # Git ignore
└── README.md                           # Documentation
```

---

## 9. Security Implementation

### 9.1 Content Security Policy

```javascript
// In main.js
const session = require('electron').session;

session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self' https:; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; " +
        "style-src 'self' 'unsafe-inline' https:; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data: https:; " +
        "connect-src 'self' https: wss:; " +
        "frame-src 'self' https:;"
      ]
    }
  });
});
```

### 9.2 Security Checklist

- [x] Context isolation enabled
- [x] Node integration disabled in renderer
- [x] Sandbox enabled
- [x] Web security enabled
- [x] Remote module disabled
- [x] Preload script used for IPC
- [x] External links open in browser
- [x] CSP implemented
- [x] HTTPS enforced (where possible)

---

## 10. Testing Strategy

### 10.1 Manual Testing Checklist

- [ ] Application launches successfully
- [ ] Target URL loads correctly
- [ ] Window size and properties match configuration
- [ ] Custom icon displays correctly
- [ ] Menu items work as expected
- [ ] External links open in browser
- [ ] Internal links stay in app
- [ ] Downloads work correctly
- [ ] Session persists across restarts
- [ ] Application quits properly

### 10.2 Automated Testing

```javascript
// Example test with Spectron
const Application = require('spectron').Application;
const path = require('path');

describe('Electron Template', function () {
  this.timeout(10000);

  beforeEach(function () {
    this.app = new Application({
      path: path.join(__dirname, '../node_modules/.bin/electron'),
      args: [path.join(__dirname, '..')]
    });
    return this.app.start();
  });

  afterEach(function () {
    if (this.app && this.app.isRunning()) {
      return this.app.stop();
    }
  });

  it('opens a window', async function () {
    const count = await this.app.client.getWindowCount();
    assert.equal(count, 1);
  });

  it('loads the target URL', async function () {
    const url = await this.app.client.getUrl();
    assert.ok(url.includes('example.com'));
  });
});
```

---

**Document Status**: Draft  
**Last Updated**: November 24, 2025  
**Next Review**: After implementation roadmap
