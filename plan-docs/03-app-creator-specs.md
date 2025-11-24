# App Creator Tool - Detailed Specifications

## Document Information
- **Version**: 1.0.0
- **Date**: November 24, 2025
- **Status**: Draft

---

## 1. Overview

The App Creator Tool is a desktop application built with Electron that enables users to create custom Electron wrapper applications through a guided, user-friendly interface. It automates the entire process of configuring, building, and packaging Electron applications.

---

## 2. Feature Specifications

### 2.1 Core Features

#### Feature 1: URL Configuration
**Priority**: MUST HAVE

**Description**: Allow users to specify the web application URL to be loaded.

**Requirements**:
- Text input field for URL entry
- Real-time validation (format check)
- Support for HTTP and HTTPS protocols
- URL reachability check (optional ping)
- Display validation status (✓ or ✗)

**Validation Rules**:
```javascript
- Must start with http:// or https://
- Must be a valid URL format
- Must not contain dangerous characters
- Max length: 2048 characters
- Optional: Check if URL is reachable (with timeout)
```

**User Stories**:
- As a user, I want to enter my web app URL so that my Electron app loads it
- As a user, I want to see if my URL is valid before proceeding
- As a user, I want to be warned if my URL is unreachable

---

#### Feature 2: Application Naming
**Priority**: MUST HAVE

**Description**: Allow users to specify the name of the generated application.

**Requirements**:
- Text input field for app name
- Character validation (alphanumeric, spaces, hyphens)
- No special characters that break file systems
- Length constraints (3-50 characters)
- Auto-suggest based on URL domain (optional)

**Validation Rules**:
```javascript
- Min length: 3 characters
- Max length: 50 characters
- Allowed: a-z, A-Z, 0-9, spaces, hyphens
- Not allowed: \ / : * ? " < > |
- Cannot start or end with space
```

**User Stories**:
- As a user, I want to name my application meaningfully
- As a user, I want to avoid name conflicts with my file system
- As a user, I want helpful suggestions based on my URL

---

#### Feature 3: Icon Upload & Processing
**Priority**: MUST HAVE

**Description**: Allow users to upload custom application icons.

**Requirements**:
- File upload dialog (drag-and-drop + click)
- Support formats: PNG, JPG, JPEG, ICO
- Minimum size: 512x512 pixels
- Automatic resizing to required sizes:
  - Windows: 16, 24, 32, 48, 64, 128, 256
  - macOS: 16, 32, 64, 128, 256, 512, 1024
  - Linux: 16, 24, 32, 48, 64, 128, 256, 512
- Icon preview display
- Default icon fallback

**Icon Processing Pipeline**:
```
Upload → Validate → Resize → Convert → Save to assets/
```

**User Stories**:
- As a user, I want to upload my company logo as the app icon
- As a user, I want to see a preview of how my icon will look
- As a user, I want the system to handle icon sizing automatically

---

#### Feature 4: Window Configuration
**Priority**: SHOULD HAVE

**Description**: Configure the Electron window properties.

**Requirements**:
- Default window size (width × height)
- Minimum window size
- Resizable toggle
- Frameless window option
- Always on top option
- Full-screen toggle
- Start maximized option

**Configuration Schema**:
```json
{
  "window": {
    "width": 1200,
    "height": 800,
    "minWidth": 800,
    "minHeight": 600,
    "resizable": true,
    "frame": true,
    "alwaysOnTop": false,
    "fullscreen": false,
    "maximized": false
  }
}
```

**User Stories**:
- As a user, I want to set the default window size for my app
- As a user, I want to prevent users from making the window too small
- As a user, I want to create a kiosk-mode app with a frameless window

---

#### Feature 5: Platform Selection
**Priority**: MUST HAVE

**Description**: Select target platforms for building.

**Requirements**:
- Checkbox for Windows
- Checkbox for macOS
- Checkbox for Linux
- Architecture selection (x64, ARM64)
- Platform-specific options
- Current OS pre-selected

**Platform Options**:
```javascript
Windows:
  - Architecture: x64, ARM64, ia32
  - Output: NSIS installer, Portable EXE, MSI

macOS:
  - Architecture: x64, ARM64 (Universal)
  - Output: DMG, PKG, ZIP

Linux:
  - Architecture: x64, ARM64, ARMv7
  - Output: AppImage, DEB, RPM, Snap
```

**User Stories**:
- As a user, I want to build for my current operating system
- As a user, I want to build for multiple platforms at once
- As a developer, I want to create universal binaries for macOS

---

#### Feature 6: Build Execution
**Priority**: MUST HAVE

**Description**: Execute the build process and show progress.

**Requirements**:
- "Create App" button (prominent, primary action)
- Build progress indicator (percentage)
- Real-time console output display
- Step-by-step progress tracking:
  1. Copying template
  2. Applying configuration
  3. Processing icons
  4. Installing dependencies
  5. Building application
  6. Packaging installer
- Cancel build option
- Build time estimation

**Build Process Stages**:
```
┌─────────────────┐
│ 1. Prepare      │ 10%
│ - Create folder │
│ - Copy template │
└────────┬────────┘
         │
┌────────▼────────┐
│ 2. Configure    │ 20%
│ - Update config │
│ - Update pkg.json│
└────────┬────────┘
         │
┌────────▼────────┐
│ 3. Process Icons│ 30%
│ - Resize        │
│ - Convert       │
└────────┬────────┘
         │
┌────────▼────────┐
│ 4. Install Deps │ 50%
│ - npm install   │
└────────┬────────┘
         │
┌────────▼────────┐
│ 5. Build        │ 80%
│ - electron-build│
└────────┬────────┘
         │
┌────────▼────────┐
│ 6. Complete     │ 100%
│ - Success msg   │
└─────────────────┘
```

**User Stories**:
- As a user, I want to see the build progress in real-time
- As a user, I want to know what's happening at each stage
- As a user, I want to cancel a build if I made a mistake

---

#### Feature 7: Build Output Management
**Priority**: MUST HAVE

**Description**: Display build results and provide access to output files.

**Requirements**:
- Success/failure notification
- Output file location display
- "Open Folder" button
- Build summary (size, duration, platforms)
- Error log display (if failed)
- "Create Another App" button

**Output Display**:
```
✅ Build Completed Successfully!

Application: My Awesome App
Duration: 2m 34s
Platforms: Windows x64

Output Files:
📁 C:\Users\...\universal-electron-wrapper\output\my-awesome-app\

Windows:
  ├─ My-Awesome-App-Setup-1.0.0.exe (85.2 MB)
  └─ My-Awesome-App-1.0.0-win.zip (124.8 MB)

[Open Output Folder] [Create Another App]
```

**User Stories**:
- As a user, I want to know when my build is complete
- As a user, I want easy access to the generated installer files
- As a user, I want to see a summary of what was built

---

### 2.2 Advanced Features

#### Feature 8: Build Profiles
**Priority**: COULD HAVE

**Description**: Save and load build configurations.

**Requirements**:
- Save current configuration to JSON
- Load previous configurations
- Profile management (list, delete)
- Quick-load recent profiles

---

#### Feature 9: Batch Creation
**Priority**: COULD HAVE

**Description**: Create multiple apps from a list of configurations.

**Requirements**:
- Import configuration CSV/JSON
- Queue multiple builds
- Sequential or parallel execution
- Batch progress tracking

---

#### Feature 10: Advanced Settings
**Priority**: SHOULD HAVE

**Description**: Additional customization options.

**Requirements**:
- Enable/disable DevTools in production
- Custom User-Agent string
- Custom menu bar
- Keyboard shortcuts
- Auto-update configuration
- Splash screen option

---

## 3. User Interface Specifications

### 3.1 UI/UX Design Principles

- **Simplicity**: Clean, uncluttered interface
- **Guidance**: Step-by-step wizard approach
- **Feedback**: Clear status messages and validation
- **Consistency**: Uniform design language
- **Accessibility**: Keyboard navigation, screen reader support

### 3.2 Screen Wireframes

#### Screen 1: Welcome Screen

```
┌─────────────────────────────────────────────────────────┐
│  Universal Electron Wrapper                    [_][□][X]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│              🚀 Welcome to App Creator                  │
│                                                         │
│    Create custom Electron desktop apps for your        │
│           web applications in minutes!                  │
│                                                         │
│                                                         │
│              [Get Started] [Load Profile]               │
│                                                         │
│                                                         │
│    Recent Projects:                                     │
│    • My CRM App (www.mycrm.com)                        │
│    • Dashboard (dashboard.company.com)                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

#### Screen 2: Configuration Form

```
┌─────────────────────────────────────────────────────────┐
│  Create New App                                [_][□][X]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Step 1 of 3: Basic Configuration                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                         │
│  Application URL *                                      │
│  ┌───────────────────────────────────────────────────┐ │
│  │ https://www.example.com                        ✓  │ │
│  └───────────────────────────────────────────────────┘ │
│  The URL of your web application                       │
│                                                         │
│  Application Name *                                     │
│  ┌───────────────────────────────────────────────────┐ │
│  │ My Application                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Application Icon                                       │
│  ┌─────────────┐                                       │
│  │             │  [Upload Icon] [Use Default]          │
│  │   Preview   │                                       │
│  │             │  Recommended: 512x512 PNG             │
│  └─────────────┘                                       │
│                                                         │
│                               [Back] [Next Step →]     │
└─────────────────────────────────────────────────────────┘
```

---

#### Screen 3: Advanced Settings

```
┌─────────────────────────────────────────────────────────┐
│  Create New App                                [_][□][X]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Step 2 of 3: Window & Advanced Settings               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                         │
│  Window Configuration                                   │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Width:  [1200] px    Height: [800] px             │ │
│  │ Min Width: [800] px  Min Height: [600] px         │ │
│  │                                                   │ │
│  │ ☑ Resizable    ☐ Frameless                       │ │
│  │ ☐ Always on Top ☐ Start Maximized                │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Advanced Options                                       │
│  ┌───────────────────────────────────────────────────┐ │
│  │ ☐ Enable DevTools (for debugging)                │ │
│  │ ☐ Enable Auto-Update                              │ │
│  │ ☐ Custom Menu Bar                                 │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│                          [← Back] [Next Step →]        │
└─────────────────────────────────────────────────────────┘
```

---

#### Screen 4: Platform Selection

```
┌─────────────────────────────────────────────────────────┐
│  Create New App                                [_][□][X]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Step 3 of 3: Platform Selection                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                         │
│  Select Target Platforms:                               │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ☑ Windows                                       │   │
│  │   ☑ x64  ☐ ARM64  ☐ ia32                       │   │
│  │   Output: NSIS Installer                        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ☐ macOS                                         │   │
│  │   ☐ Intel (x64)  ☐ Apple Silicon  ☐ Universal  │   │
│  │   Output: DMG                                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ☐ Linux                                         │   │
│  │   ☐ x64  ☐ ARM64                               │   │
│  │   Output: AppImage, DEB                         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│                          [← Back] [Create App 🚀]      │
└─────────────────────────────────────────────────────────┘
```

---

#### Screen 5: Build Progress

```
┌─────────────────────────────────────────────────────────┐
│  Building Application...                       [_][□][X]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Creating: My Application                               │
│                                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 65%   │
│                                                         │
│  Current Step: Installing Dependencies                  │
│  Elapsed Time: 1m 23s                                   │
│                                                         │
│  Progress:                                              │
│  ✓ Preparing workspace                                  │
│  ✓ Copying template files                               │
│  ✓ Applying configuration                               │
│  ✓ Processing icons                                     │
│  ⟳ Installing dependencies...                           │
│  ○ Building application                                 │
│  ○ Packaging installer                                  │
│                                                         │
│  Console Output:                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │ npm install                                     │   │
│  │ added 847 packages in 45s                       │   │
│  │ Running electron-builder...                     │   │
│  │ • electron-builder  version=24.6.4              │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│                                          [Cancel Build] │
└─────────────────────────────────────────────────────────┘
```

---

#### Screen 6: Build Complete

```
┌─────────────────────────────────────────────────────────┐
│  Build Complete                                [_][□][X]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    ✅ Success!                           │
│                                                         │
│           Your application has been created!            │
│                                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                         │
│  Application: My Application                            │
│  Build Duration: 2m 34s                                 │
│  Total Size: 85.2 MB                                    │
│                                                         │
│  Output Files:                                          │
│  📁 C:\...\output\my-application\                       │
│                                                         │
│  Windows (x64):                                         │
│  • My-Application-Setup-1.0.0.exe                       │
│                                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                         │
│     [Open Output Folder] [Test Application]            │
│                                                         │
│              [Create Another App] [Exit]                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Technical Specifications

### 4.1 Technology Stack

```javascript
{
  "framework": "Electron 28+",
  "uiLibrary": "React 18",
  "stateManagement": "Redux Toolkit",
  "styling": "Tailwind CSS",
  "bundler": "Vite",
  "iconProcessing": "sharp",
  "fileOps": "fs-extra",
  "processExecution": "execa",
  "validation": "zod",
  "logging": "winston"
}
```

### 4.2 File Structure

```
app-creator/
├── src/
│   ├── main/
│   │   ├── index.js                 # Main entry point
│   │   ├── ipc/
│   │   │   ├── config-handlers.js   # Config IPC
│   │   │   ├── build-handlers.js    # Build IPC
│   │   │   └── file-handlers.js     # File IPC
│   │   ├── services/
│   │   │   ├── ConfigManager.js     # Config logic
│   │   │   ├── TemplateManager.js   # Template ops
│   │   │   ├── IconProcessor.js     # Icon processing
│   │   │   ├── BuildOrchestrator.js # Build control
│   │   │   └── FileSystemManager.js # File ops
│   │   └── utils/
│   │       ├── validators.js
│   │       ├── logger.js
│   │       └── constants.js
│   │
│   ├── renderer/
│   │   ├── index.html
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── WelcomeScreen.jsx
│   │   │   ├── ConfigurationForm.jsx
│   │   │   ├── BuildProgress.jsx
│   │   │   └── ResultScreen.jsx
│   │   ├── hooks/
│   │   │   ├── useConfig.js
│   │   │   └── useBuild.js
│   │   └── store/
│   │       └── index.js
│   │
│   └── preload/
│       └── index.js
│
└── templates/
    └── electron-template/
```

### 4.3 State Management Schema

```javascript
// Redux Store Structure
{
  config: {
    url: '',
    appName: '',
    iconPath: '',
    window: {
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      resizable: true,
      frame: true
    },
    platforms: {
      windows: { enabled: true, arch: ['x64'] },
      macos: { enabled: false, arch: [] },
      linux: { enabled: false, arch: [] }
    },
    advanced: {
      devTools: false,
      autoUpdate: false,
      customMenu: false
    }
  },
  build: {
    status: 'idle', // idle | preparing | building | complete | error
    progress: 0,
    currentStep: '',
    logs: [],
    outputPath: '',
    error: null,
    startTime: null,
    endTime: null
  },
  ui: {
    currentScreen: 'welcome', // welcome | config | build | result
    validationErrors: {}
  }
}
```

### 4.4 IPC API

```javascript
// Renderer → Main
'config:validate-url'    (url: string) → { valid: boolean, message: string }
'config:validate-name'   (name: string) → { valid: boolean, message: string }
'icon:upload'            () → { path: string }
'icon:process'           (path: string) → { success: boolean, iconSet: object }
'build:start'            (config: object) → { buildId: string }
'build:cancel'           () → { cancelled: boolean }
'output:open-folder'     (path: string) → void

// Main → Renderer
'build:progress'         { progress: number, step: string, log: string }
'build:complete'         { outputPath: string, duration: number, size: number }
'build:error'            { error: string, stack: string }
```

---

## 5. Workflow Diagrams

### 5.1 User Workflow

```
Start
  │
  ├─→ Welcome Screen
  │   └─→ Click "Get Started" or "Load Profile"
  │
  ├─→ Configuration (Step 1)
  │   ├─→ Enter URL
  │   ├─→ Enter App Name
  │   ├─→ Upload Icon (optional)
  │   └─→ Click "Next"
  │
  ├─→ Advanced Settings (Step 2)
  │   ├─→ Set Window Config
  │   ├─→ Toggle Advanced Options
  │   └─→ Click "Next"
  │
  ├─→ Platform Selection (Step 3)
  │   ├─→ Select Platforms
  │   ├─→ Select Architectures
  │   └─→ Click "Create App"
  │
  ├─→ Build Progress
  │   ├─→ Watch Progress
  │   ├─→ View Console Logs
  │   └─→ Wait for Completion
  │
  └─→ Build Complete
      ├─→ View Output Info
      ├─→ Open Output Folder
      ├─→ Test Application
      └─→ Create Another or Exit
```

### 5.2 Build Process Workflow

```
Configuration
      │
      ▼
Validate Inputs
      │
      ▼
Create Workspace
      │
      ▼
Copy Template Files
      │
      ▼
Process Icon
      │
      ▼
Update package.json
      │
      ▼
Update config.json
      │
      ▼
Update electron-builder.yml
      │
      ▼
npm install
      │
      ▼
electron-builder build
      │
      ▼
Move to Output Folder
      │
      ▼
Complete / Error
```

---

## 6. Validation Rules

### 6.1 Input Validation

```javascript
const validationRules = {
  url: {
    required: true,
    pattern: /^https?:\/\/.+/,
    maxLength: 2048,
    custom: (url) => isValidURL(url)
  },
  
  appName: {
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s\-]+$/,
    custom: (name) => !startsOrEndsWithSpace(name)
  },
  
  icon: {
    required: false,
    fileTypes: ['png', 'jpg', 'jpeg', 'ico'],
    minSize: { width: 512, height: 512 },
    maxFileSize: 5 * 1024 * 1024 // 5MB
  },
  
  window: {
    width: { min: 400, max: 4000 },
    height: { min: 300, max: 4000 },
    minWidth: { min: 200, max: 4000 },
    minHeight: { min: 150, max: 4000 }
  }
};
```

---

## 7. Error Handling

### 7.1 Error Categories

| Category | Examples | Handling |
|----------|----------|----------|
| **Validation Errors** | Invalid URL, bad icon size | Show inline error messages |
| **File System Errors** | Permission denied, disk full | Show dialog with solution |
| **Build Errors** | npm install failed, build timeout | Show detailed log, offer retry |
| **Network Errors** | Template download failed | Offer offline mode/retry |
| **System Errors** | Out of memory, crash | Log error, show crash report |

### 7.2 Error Messages

```javascript
const errorMessages = {
  'INVALID_URL': 'Please enter a valid URL starting with http:// or https://',
  'INVALID_APP_NAME': 'App name must be 3-50 characters, alphanumeric only',
  'ICON_TOO_SMALL': 'Icon must be at least 512x512 pixels',
  'ICON_WRONG_FORMAT': 'Icon must be PNG, JPG, or ICO format',
  'BUILD_FAILED': 'Build process failed. Check the console for details.',
  'TEMPLATE_NOT_FOUND': 'Template files not found. Please reinstall the app.',
  'DISK_SPACE_LOW': 'Not enough disk space. Need at least 500MB free.',
  'PERMISSION_DENIED': 'Permission denied. Try running as administrator.'
};
```

---

## 8. Performance Requirements

| Metric | Target | Maximum |
|--------|--------|---------|
| App startup time | < 2s | 5s |
| Icon processing | < 5s | 10s |
| Form validation | < 100ms | 500ms |
| Build initiation | < 2s | 5s |
| UI responsiveness | 60 FPS | 30 FPS |
| Memory usage | < 200MB | 500MB |

---

## 9. Accessibility Requirements

- Keyboard navigation support
- Screen reader compatibility (ARIA labels)
- High contrast mode support
- Focus indicators
- Minimum font size: 14px
- Color blind friendly palette

---

## 10. Testing Requirements

### 10.1 Unit Tests
- Config validation logic
- Icon processing functions
- File system operations
- State management reducers

### 10.2 Integration Tests
- IPC communication
- Build orchestration
- Template copying and modification

### 10.3 E2E Tests
- Complete app creation workflow
- Error handling scenarios
- Multi-platform builds

---

**Document Status**: Draft  
**Last Updated**: November 24, 2025  
**Next Review**: After Electron Template specifications
