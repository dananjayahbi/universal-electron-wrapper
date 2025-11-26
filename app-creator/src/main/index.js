/**
 * App Creator - Main Entry Point
 * This is the main process for the App Creator tool
 */

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { setupConfigHandlers } = require('./ipc/config-handlers');
const { setupBuildHandlers } = require('./ipc/build-handlers');
const { setupFileHandlers } = require('./ipc/file-handlers');
const logger = require('./utils/logger');

class AppCreator {
  constructor() {
    this.mainWindow = null;
    this.isDev = process.argv.includes('--dev');
  }

  /**
   * Initialize the application
   */
  async initialize() {
    logger.info('Initializing App Creator');

    // Setup IPC handlers
    this.setupIpcHandlers();

    // App lifecycle events
    app.on('ready', () => this.onReady());
    app.on('window-all-closed', () => this.onWindowAllClosed());
    app.on('activate', () => this.onActivate());

    logger.info('App Creator initialized');
  }

  /**
   * Called when Electron is ready
   */
  async onReady() {
    logger.info('App Creator ready');
    this.createWindow();
  }

  /**
   * Create the main application window
   */
  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1100,
      height: 750,
      minWidth: 900,
      minHeight: 650,
      title: 'Universal Electron Wrapper Creator',
      icon: path.join(__dirname, '../../build/icon.png'),
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      },
      show: false,
      backgroundColor: '#1a1a2e'
    });

    // Hide menu bar completely
    this.mainWindow.setMenuBarVisibility(false);

    // Load the renderer
    this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    // Show when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
      
      // Open DevTools in development
      if (this.isDev) {
        this.mainWindow.webContents.openDevTools({ mode: 'detach' });
      }
    });

    // Handle window close
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    logger.info('Main window created');
  }

  /**
   * Setup IPC handlers
   */
  setupIpcHandlers() {
    // Setup modular IPC handlers
    setupConfigHandlers(ipcMain);
    setupBuildHandlers(ipcMain);
    setupFileHandlers(ipcMain, dialog, shell);

    // General app handlers
    ipcMain.handle('app:get-info', () => {
      return {
        name: app.getName(),
        version: app.getVersion(),
        electronVersion: process.versions.electron,
        nodeVersion: process.versions.node,
        platform: process.platform
      };
    });

    ipcMain.handle('app:get-paths', () => {
      return {
        home: app.getPath('home'),
        documents: app.getPath('documents'),
        downloads: app.getPath('downloads'),
        temp: app.getPath('temp'),
        userData: app.getPath('userData'),
        appPath: app.getAppPath()
      };
    });

    // Window controls
    ipcMain.on('window:minimize', () => {
      if (this.mainWindow) this.mainWindow.minimize();
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
      if (this.mainWindow) this.mainWindow.close();
    });

    logger.info('IPC handlers setup complete');
  }

  /**
   * Called when all windows are closed
   */
  onWindowAllClosed() {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  /**
   * Called when app is activated (macOS)
   */
  onActivate() {
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createWindow();
    }
  }
}

// Create and start application
const appCreator = new AppCreator();
appCreator.initialize();

module.exports = AppCreator;
