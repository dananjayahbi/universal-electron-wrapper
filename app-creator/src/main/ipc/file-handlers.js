/**
 * File IPC Handlers
 * Handle file operations, dialogs, and icon processing
 */

const path = require('path');
const IconProcessor = require('../services/IconProcessor');
const FileSystemManager = require('../services/FileSystemManager');
const logger = require('../utils/logger');

const iconProcessor = new IconProcessor();
const fsManager = new FileSystemManager();

/**
 * Setup file-related IPC handlers
 * @param {IpcMain} ipcMain - Electron IpcMain instance
 * @param {Dialog} dialog - Electron dialog module
 * @param {Shell} shell - Electron shell module
 */
function setupFileHandlers(ipcMain, dialog, shell) {
  // Open file dialog for icon selection
  ipcMain.handle('file:select-icon', async (event) => {
    logger.debug('Opening icon selection dialog');
    
    const result = await dialog.showOpenDialog({
      title: 'Select Application Icon',
      filters: [
        { name: 'All Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'bmp', 'tiff', 'svg', 'avif'] },
        { name: 'PNG Images', extensions: ['png'] },
        { name: 'JPEG Images', extensions: ['jpg', 'jpeg'] },
        { name: 'ICO Files', extensions: ['ico'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const iconPath = result.filePaths[0];
    logger.info('Icon selected', { path: iconPath });

    // Validate icon (now accepts any image)
    try {
      const validation = await iconProcessor.validate(iconPath);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      return { 
        success: true, 
        path: iconPath,
        info: validation.info 
      };
    } catch (error) {
      logger.error('Icon validation failed', { error: error.message });
      return { success: false, error: error.message };
    }
  });

  // Process icon for build
  ipcMain.handle('file:process-icon', async (event, { sourcePath, outputDir }) => {
    logger.info('Processing icon', { sourcePath, outputDir });
    
    try {
      const result = await iconProcessor.process(sourcePath, outputDir);
      return { success: true, icons: result };
    } catch (error) {
      logger.error('Icon processing failed', { error: error.message });
      return { success: false, error: error.message };
    }
  });

  // Open folder dialog for output selection
  ipcMain.handle('file:select-output-folder', async (event) => {
    logger.debug('Opening output folder selection dialog');
    
    const result = await dialog.showOpenDialog({
      title: 'Select Output Folder',
      properties: ['openDirectory', 'createDirectory']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    return { success: true, path: result.filePaths[0] };
  });

  // Open folder in file explorer
  ipcMain.handle('file:open-folder', async (event, folderPath) => {
    logger.debug('Opening folder', { path: folderPath });
    
    try {
      await shell.openPath(folderPath);
      return { success: true };
    } catch (error) {
      logger.error('Failed to open folder', { error: error.message });
      return { success: false, error: error.message };
    }
  });

  // Open file in default application
  ipcMain.handle('file:open-file', async (event, filePath) => {
    logger.debug('Opening file', { path: filePath });
    
    try {
      await shell.openPath(filePath);
      return { success: true };
    } catch (error) {
      logger.error('Failed to open file', { error: error.message });
      return { success: false, error: error.message };
    }
  });

  // Show file in folder
  ipcMain.handle('file:show-in-folder', async (event, filePath) => {
    logger.debug('Showing file in folder', { path: filePath });
    shell.showItemInFolder(filePath);
    return { success: true };
  });

  // Check if path exists
  ipcMain.handle('file:exists', async (event, targetPath) => {
    return fsManager.exists(targetPath);
  });

  // Get directory listing
  ipcMain.handle('file:list-dir', async (event, dirPath) => {
    try {
      const files = await fsManager.listDirectory(dirPath);
      return { success: true, files };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Read file as text
  ipcMain.handle('file:read-text', async (event, filePath) => {
    try {
      const content = await fsManager.readTextFile(filePath);
      return { success: true, content };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  logger.info('File IPC handlers registered');
}

module.exports = { setupFileHandlers };
