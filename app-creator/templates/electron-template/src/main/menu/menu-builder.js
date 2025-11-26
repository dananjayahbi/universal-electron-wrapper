/**
 * Menu Builder
 * Creates application menus based on configuration
 */

const { Menu, shell, app } = require('electron');
const logger = require('../utils/logger');

class MenuBuilder {
  constructor(config, mainWindow) {
    this.config = config;
    this.mainWindow = mainWindow;
  }

  /**
   * Build the application menu
   * @returns {Menu} The built menu
   */
  buildMenu() {
    const template = this.getMenuTemplate();
    const menu = Menu.buildFromTemplate(template);
    logger.debug('Menu built', { template: this.config.menu.template });
    return menu;
  }

  /**
   * Get menu template based on configuration
   * @returns {Array} Menu template array
   */
  getMenuTemplate() {
    switch (this.config.menu.template) {
      case 'minimal':
        return this.getMinimalTemplate();
      case 'none':
        return [];
      default:
        return this.getDefaultTemplate();
    }
  }

  /**
   * Get default menu template
   * @returns {Array} Default menu template
   */
  getDefaultTemplate() {
    const isMac = process.platform === 'darwin';
    const appName = this.config.app.name;

    return [
      // App menu (macOS only)
      ...(isMac ? [{
        label: appName,
        submenu: [
          { 
            label: `About ${appName}`, 
            role: 'about' 
          },
          { type: 'separator' },
          { 
            label: 'Preferences',
            accelerator: 'CmdOrCtrl+,',
            enabled: false // Can be enabled when preferences are implemented
          },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { 
            label: `Hide ${appName}`, 
            role: 'hide' 
          },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { 
            label: `Quit ${appName}`, 
            role: 'quit' 
          }
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
          ...(isMac ? [
            { role: 'pasteAndMatchStyle' },
            { role: 'delete' },
            { role: 'selectAll' },
            { type: 'separator' },
            {
              label: 'Speech',
              submenu: [
                { role: 'startSpeaking' },
                { role: 'stopSpeaking' }
              ]
            }
          ] : [
            { role: 'delete' },
            { type: 'separator' },
            { role: 'selectAll' }
          ])
        ]
      },

      // View menu
      {
        label: 'View',
        submenu: [
          { 
            label: 'Reload',
            accelerator: 'CmdOrCtrl+R',
            click: () => {
              if (this.mainWindow) {
                this.mainWindow.reload();
              }
            }
          },
          { 
            label: 'Force Reload',
            accelerator: 'CmdOrCtrl+Shift+R',
            click: () => {
              if (this.mainWindow) {
                this.mainWindow.webContents.reloadIgnoringCache();
              }
            }
          },
          ...(this.config.features.devTools ? [
            { type: 'separator' },
            { 
              label: 'Toggle Developer Tools',
              accelerator: isMac ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
              click: () => {
                if (this.mainWindow) {
                  this.mainWindow.webContents.toggleDevTools();
                }
              }
            }
          ] : []),
          { type: 'separator' },
          { 
            label: 'Actual Size',
            accelerator: 'CmdOrCtrl+0',
            click: () => {
              if (this.mainWindow) {
                this.mainWindow.webContents.setZoomLevel(0);
              }
            }
          },
          { 
            label: 'Zoom In',
            accelerator: 'CmdOrCtrl+Plus',
            click: () => {
              if (this.mainWindow) {
                const zoomLevel = this.mainWindow.webContents.getZoomLevel();
                this.mainWindow.webContents.setZoomLevel(zoomLevel + 0.5);
              }
            }
          },
          { 
            label: 'Zoom Out',
            accelerator: 'CmdOrCtrl+-',
            click: () => {
              if (this.mainWindow) {
                const zoomLevel = this.mainWindow.webContents.getZoomLevel();
                this.mainWindow.webContents.setZoomLevel(zoomLevel - 0.5);
              }
            }
          },
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
            { role: 'front' },
            { type: 'separator' },
            { role: 'window' }
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
          },
          {
            label: 'Documentation',
            click: async () => {
              await shell.openExternal('https://electronjs.org/docs');
            }
          },
          { type: 'separator' },
          {
            label: 'Report Issue',
            click: async () => {
              await shell.openExternal('https://github.com/electron/electron/issues');
            }
          }
        ]
      }
    ];
  }

  /**
   * Get minimal menu template
   * @returns {Array} Minimal menu template
   */
  getMinimalTemplate() {
    const isMac = process.platform === 'darwin';
    const appName = this.config.app.name;

    return [
      // App menu (macOS only)
      ...(isMac ? [{
        label: appName,
        submenu: [
          { label: `About ${appName}`, role: 'about' },
          { type: 'separator' },
          { label: `Hide ${appName}`, role: 'hide' },
          { role: 'hideOthers' },
          { type: 'separator' },
          { label: `Quit ${appName}`, role: 'quit' }
        ]
      }] : []),

      // File menu
      {
        label: 'File',
        submenu: [
          isMac ? { role: 'close' } : { role: 'quit' }
        ]
      },

      // View menu
      {
        label: 'View',
        submenu: [
          { 
            label: 'Reload',
            accelerator: 'CmdOrCtrl+R',
            click: () => {
              if (this.mainWindow) {
                this.mainWindow.reload();
              }
            }
          },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      }
    ];
  }

  /**
   * Create context menu
   * @returns {Menu} Context menu
   */
  createContextMenu() {
    const template = [
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { type: 'separator' },
      { role: 'selectAll' }
    ];

    return Menu.buildFromTemplate(template);
  }
}

module.exports = MenuBuilder;
