/**
 * Preload Script
 * Bridge between main process and renderer process
 * Exposes safe APIs to the renderer using contextBridge
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // ==========================================
  // Application Info
  // ==========================================
  
  /**
   * Get application information
   * @returns {Promise<Object>} App info (name, version, description)
   */
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),

  /**
   * Get application configuration
   * @returns {Promise<Object>} Configuration object
   */
  getConfig: () => ipcRenderer.invoke('config:get'),

  // ==========================================
  // Window Controls
  // ==========================================
  
  /**
   * Minimize the window
   */
  minimize: () => ipcRenderer.send('window:minimize'),

  /**
   * Maximize or restore the window
   */
  maximize: () => ipcRenderer.send('window:maximize'),

  /**
   * Close the window
   */
  close: () => ipcRenderer.send('window:close'),

  // ==========================================
  // Navigation
  // ==========================================
  
  /**
   * Open a URL in the external browser
   * @param {string} url - URL to open
   */
  openExternal: (url) => ipcRenderer.send('link:open-external', url),

  /**
   * Reload the application
   */
  reload: () => ipcRenderer.send('app:reload'),

  // ==========================================
  // Developer Tools
  // ==========================================
  
  /**
   * Toggle developer tools
   */
  toggleDevTools: () => ipcRenderer.send('app:toggle-devtools'),

  // ==========================================
  // Updates (if enabled)
  // ==========================================
  
  /**
   * Check for updates
   */
  checkForUpdates: () => ipcRenderer.send('updates:check'),

  /**
   * Listen for update available event
   * @param {Function} callback - Callback function
   */
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('updates:available', (event, info) => callback(info));
  },

  /**
   * Listen for update downloaded event
   * @param {Function} callback - Callback function
   */
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('updates:downloaded', (event, info) => callback(info));
  },

  /**
   * Install update and restart
   */
  installUpdate: () => ipcRenderer.send('updates:install'),

  // ==========================================
  // Platform Information
  // ==========================================
  
  /**
   * Get platform information
   * @returns {Object} Platform info
   */
  platform: {
    isWindows: process.platform === 'win32',
    isMac: process.platform === 'darwin',
    isLinux: process.platform === 'linux',
    name: process.platform
  },

  // ==========================================
  // Event Listeners
  // ==========================================
  
  /**
   * Add event listener with cleanup function
   * @param {string} channel - IPC channel name
   * @param {Function} callback - Callback function
   * @returns {Function} Cleanup function to remove listener
   */
  on: (channel, callback) => {
    // Whitelist of allowed channels
    const allowedChannels = [
      'updates:available',
      'updates:downloaded',
      'updates:progress',
      'download:progress',
      'download:complete',
      'error'
    ];

    if (allowedChannels.includes(channel)) {
      const listener = (event, ...args) => callback(...args);
      ipcRenderer.on(channel, listener);
      
      // Return cleanup function
      return () => ipcRenderer.removeListener(channel, listener);
    }
    
    console.warn(`Channel "${channel}" is not allowed`);
    return () => {};
  },

  /**
   * Remove all listeners for a channel
   * @param {string} channel - IPC channel name
   */
  removeAllListeners: (channel) => {
    const allowedChannels = [
      'updates:available',
      'updates:downloaded',
      'updates:progress',
      'download:progress',
      'download:complete',
      'error'
    ];

    if (allowedChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  }
});

// Log preload script initialization
console.log('Preload script initialized');

// Handle any errors in preload
window.addEventListener('error', (event) => {
  console.error('Preload error:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
