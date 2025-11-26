/**
 * Main entry point for the Electron Template Application
 * This file initializes the application and manages the lifecycle
 */

const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
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
    this.windowManager = null;
    this.downloadManager = null;
    this.navigationManager = null;
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      // Load configuration
      this.config = this.configLoader.load();
      logger.info('Configuration loaded successfully', { 
        appName: this.config.app.name,
        targetUrl: this.config.target.url 
      });

      // Set application name
      app.name = this.config.app.name;

      // Initialize managers
      this.windowManager = new WindowManager(this.config);
      this.downloadManager = new DownloadManager(this.config);
      this.navigationManager = new NavigationManager(this.config);

      // Setup IPC handlers
      this.setupIpcHandlers();

      // Initialize app when ready
      app.on('ready', () => this.onReady());
      app.on('window-all-closed', () => this.onWindowAllClosed());
      app.on('activate', () => this.onActivate());
      app.on('before-quit', () => this.onBeforeQuit());

      logger.info('Application initialized');
    } catch (error) {
      logger.error('Failed to initialize application', { error: error.message });
      app.quit();
    }
  }

  /**
   * Called when Electron has finished initialization
   */
  onReady() {
    logger.info('Application ready');

    // Create main window
    this.mainWindow = this.windowManager.createWindow();

    // Build and set menu
    if (this.config.menu.enabled) {
      const menuBuilder = new MenuBuilder(this.config, this.mainWindow);
      const menu = menuBuilder.buildMenu();
      Menu.setApplicationMenu(menu);
    } else {
      // Hide menu if not enabled
      this.mainWindow.setMenuBarVisibility(false);
    }

    // Setup download handling
    this.downloadManager.attach(this.mainWindow);

    // Setup navigation handling
    this.navigationManager.attach(this.mainWindow);

    // Handle window close
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Load target URL
    this.mainWindow.loadURL(this.config.target.url)
      .then(() => {
        logger.info('Target URL loaded successfully', { url: this.config.target.url });
      })
      .catch((error) => {
        logger.error('Failed to load target URL', { url: this.config.target.url, error: error.message });
        this.showErrorPage(error);
      });
  }

  /**
   * Show error page when URL fails to load
   */
  showErrorPage(error) {
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Connection Error</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .error-container {
              text-align: center;
              padding: 40px;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 16px;
              backdrop-filter: blur(10px);
            }
            h1 { font-size: 24px; margin-bottom: 16px; }
            p { font-size: 14px; opacity: 0.9; margin-bottom: 24px; }
            button {
              background: white;
              color: #667eea;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 14px;
              cursor: pointer;
              font-weight: 600;
            }
            button:hover { transform: scale(1.05); }
          </style>
        </head>
        <body>
          <div class="error-container">
            <h1>⚠️ Connection Error</h1>
            <p>Unable to load: ${this.config.target.url}</p>
            <p style="font-size: 12px; opacity: 0.7;">${error.message || 'Please check your internet connection'}</p>
            <button onclick="location.reload()">Retry</button>
          </div>
        </body>
      </html>
    `;
    this.mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
  }

  /**
   * Called when all windows are closed
   */
  onWindowAllClosed() {
    // On macOS, apps typically stay open until explicitly quit
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  /**
   * Called when app is activated (macOS)
   */
  onActivate() {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      this.onReady();
    }
  }

  /**
   * Called before the application quits
   */
  onBeforeQuit() {
    logger.info('Application quitting');
    
    // Clear session data if configured
    if (this.config.session.clearOnExit && this.mainWindow) {
      this.mainWindow.webContents.session.clearStorageData();
    }
  }

  /**
   * Setup IPC handlers for renderer communication
   */
  setupIpcHandlers() {
    // Get application info
    ipcMain.handle('app:get-info', () => {
      return {
        name: this.config.app.name,
        version: this.config.app.version,
        description: this.config.app.description
      };
    });

    // Get configuration
    ipcMain.handle('config:get', () => {
      return this.config;
    });

    // Window controls
    ipcMain.on('window:minimize', () => {
      if (this.mainWindow) {
        this.mainWindow.minimize();
      }
    });

    ipcMain.on('window:maximize', () => {
      if (this.mainWindow) {
        if (this.mainWindow.isMaximized()) {
          this.mainWindow.unmaximize();
        } else {
          this.mainWindow.maximize();
        }
      }
    });

    ipcMain.on('window:close', () => {
      if (this.mainWindow) {
        this.mainWindow.close();
      }
    });

    // Open external link
    ipcMain.on('link:open-external', (event, url) => {
      shell.openExternal(url);
    });

    // Reload application
    ipcMain.on('app:reload', () => {
      if (this.mainWindow) {
        this.mainWindow.reload();
      }
    });

    // DevTools toggle
    ipcMain.on('app:toggle-devtools', () => {
      if (this.mainWindow && this.config.features.devTools) {
        this.mainWindow.webContents.toggleDevTools();
      }
    });
  }
}

// Create and start application
const application = new Application();
application.initialize();

module.exports = Application;
