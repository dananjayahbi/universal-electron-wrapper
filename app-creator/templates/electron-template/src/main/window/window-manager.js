/**
 * Window Manager
 * Creates and manages BrowserWindow instances
 */

const { BrowserWindow, screen } = require('electron');
const path = require('path');

class WindowManager {
  constructor(config) {
    this.config = config;
    this.windows = new Map();
  }

  /**
   * Create the main application window
   * @returns {BrowserWindow} The created window
   */
  createWindow() {
    const windowConfig = this.config.window;
    const featuresConfig = this.config.features;

    // Calculate window position if centering
    let x, y;
    if (windowConfig.center) {
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
      x = Math.round((screenWidth - windowConfig.width) / 2);
      y = Math.round((screenHeight - windowConfig.height) / 2);
    }

    const windowOptions = {
      width: windowConfig.width,
      height: windowConfig.height,
      minWidth: windowConfig.minWidth,
      minHeight: windowConfig.minHeight,
      maxWidth: windowConfig.maxWidth || undefined,
      maxHeight: windowConfig.maxHeight || undefined,
      x,
      y,
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
      show: false, // Don't show until ready
      title: windowConfig.title || this.config.app.name,
      backgroundColor: windowConfig.backgroundColor,
      transparent: windowConfig.transparent,
      hasShadow: windowConfig.hasShadow,
      opacity: windowConfig.opacity,
      
      // Icon
      icon: this.getIconPath(),
      
      // Web preferences (security settings)
      webPreferences: {
        preload: path.join(__dirname, '../preload/preload.js'),
        contextIsolation: featuresConfig.contextIsolation,
        nodeIntegration: featuresConfig.nodeIntegration,
        sandbox: featuresConfig.sandbox,
        webSecurity: featuresConfig.webSecurity,
        enableRemoteModule: featuresConfig.enableRemoteModule,
        devTools: featuresConfig.devTools,
        
        // Performance options
        backgroundThrottling: true,
        
        // Security options
        allowRunningInsecureContent: false,
        webviewTag: false,
        
        // Spellcheck
        spellcheck: true
      }
    };

    const window = new BrowserWindow(windowOptions);

    // Store window reference
    this.windows.set('main', window);

    // Show window when ready
    window.once('ready-to-show', () => {
      if (windowConfig.show !== false) {
        window.show();
        
        // Focus the window
        if (windowConfig.focusable) {
          window.focus();
        }
      }
    });

    // Open DevTools if enabled in development or configured
    if (featuresConfig.devTools && process.env.NODE_ENV === 'development') {
      window.webContents.openDevTools({ mode: 'detach' });
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

    // Handle window state events
    this.setupWindowEvents(window);

    return window;
  }

  /**
   * Get the application icon path
   * @returns {string} Path to icon file
   */
  getIconPath() {
    const iconName = process.platform === 'win32' ? 'icon.ico' :
                     process.platform === 'darwin' ? 'icon.icns' : 'icon.png';
    
    return path.join(__dirname, '../../../build', iconName);
  }

  /**
   * Setup window event handlers
   * @param {BrowserWindow} window - The window to setup
   */
  setupWindowEvents(window) {
    // Handle window close
    window.on('closed', () => {
      this.windows.delete('main');
    });

    // Handle window focus
    window.on('focus', () => {
      // Can emit event or perform actions when focused
    });

    // Handle window blur
    window.on('blur', () => {
      // Can emit event or perform actions when unfocused
    });

    // Handle window maximize
    window.on('maximize', () => {
      // Can emit event or perform actions when maximized
    });

    // Handle window unmaximize
    window.on('unmaximize', () => {
      // Can emit event or perform actions when unmaximized
    });

    // Handle window minimize
    window.on('minimize', () => {
      // Can emit event or perform actions when minimized
    });

    // Handle window restore
    window.on('restore', () => {
      // Can emit event or perform actions when restored
    });

    // Handle window enter fullscreen
    window.on('enter-full-screen', () => {
      // Can emit event or perform actions when entering fullscreen
    });

    // Handle window leave fullscreen
    window.on('leave-full-screen', () => {
      // Can emit event or perform actions when leaving fullscreen
    });

    // Handle unresponsive window
    window.on('unresponsive', () => {
      console.warn('Window became unresponsive');
    });

    // Handle responsive window
    window.on('responsive', () => {
      console.log('Window is responsive again');
    });
  }

  /**
   * Get window by name
   * @param {string} name - Window name
   * @returns {BrowserWindow|undefined} The window or undefined
   */
  getWindow(name = 'main') {
    return this.windows.get(name);
  }

  /**
   * Close all windows
   */
  closeAll() {
    this.windows.forEach((window) => {
      if (!window.isDestroyed()) {
        window.close();
      }
    });
    this.windows.clear();
  }
}

module.exports = WindowManager;
