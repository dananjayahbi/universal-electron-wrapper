/**
 * Preload Script for App Creator
 * Exposes safe APIs to renderer
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // App Info
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),
  getPaths: () => ipcRenderer.invoke('app:get-paths'),

  // Window Controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),

  // Configuration
  validateUrl: (url) => ipcRenderer.invoke('config:validate-url', url),
  validateName: (name) => ipcRenderer.invoke('config:validate-name', name),
  validateConfig: (config) => ipcRenderer.invoke('config:validate', config),
  getDefaults: () => ipcRenderer.invoke('config:get-defaults'),
  saveProfile: (name, config) => ipcRenderer.invoke('config:save-profile', { name, config }),
  loadProfile: (name) => ipcRenderer.invoke('config:load-profile', name),
  getProfiles: () => ipcRenderer.invoke('config:get-profiles'),
  deleteProfile: (name) => ipcRenderer.invoke('config:delete-profile', name),

  // File Operations
  selectIcon: () => ipcRenderer.invoke('file:select-icon'),
  processIcon: (sourcePath, outputDir) => ipcRenderer.invoke('file:process-icon', { sourcePath, outputDir }),
  selectOutputFolder: () => ipcRenderer.invoke('file:select-output-folder'),
  openFolder: (path) => ipcRenderer.invoke('file:open-folder', path),
  openFile: (path) => ipcRenderer.invoke('file:open-file', path),
  showInFolder: (path) => ipcRenderer.invoke('file:show-in-folder', path),

  // Build
  startBuild: (config) => ipcRenderer.invoke('build:start', config),
  cancelBuild: () => ipcRenderer.invoke('build:cancel'),
  getBuildStatus: () => ipcRenderer.invoke('build:status'),
  getBuildHistory: () => ipcRenderer.invoke('build:get-history'),
  clearBuildHistory: () => ipcRenderer.invoke('build:clear-history'),

  // Event Listeners
  onBuildProgress: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on('build:progress', listener);
    return () => ipcRenderer.removeListener('build:progress', listener);
  },

  onBuildLog: (callback) => {
    const listener = (event, message) => callback(message);
    ipcRenderer.on('build:log', listener);
    return () => ipcRenderer.removeListener('build:log', listener);
  },

  onBuildComplete: (callback) => {
    const listener = (event, result) => callback(result);
    ipcRenderer.on('build:complete', listener);
    return () => ipcRenderer.removeListener('build:complete', listener);
  },

  onBuildError: (callback) => {
    const listener = (event, error) => callback(error);
    ipcRenderer.on('build:error', listener);
    return () => ipcRenderer.removeListener('build:error', listener);
  },

  // Platform Info
  platform: process.platform
});

console.log('Preload script initialized');
