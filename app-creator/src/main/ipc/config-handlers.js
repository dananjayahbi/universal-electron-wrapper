/**
 * Config IPC Handlers
 * Handle configuration validation and management
 */

const ConfigManager = require('../services/ConfigManager');
const logger = require('../utils/logger');

const configManager = new ConfigManager();

/**
 * Setup configuration-related IPC handlers
 * @param {IpcMain} ipcMain - Electron IpcMain instance
 */
function setupConfigHandlers(ipcMain) {
  // Validate URL
  ipcMain.handle('config:validate-url', async (event, url) => {
    logger.debug('Validating URL', { url });
    return configManager.validateUrl(url);
  });

  // Validate app name
  ipcMain.handle('config:validate-name', async (event, name) => {
    logger.debug('Validating app name', { name });
    return configManager.validateAppName(name);
  });

  // Validate entire configuration
  ipcMain.handle('config:validate', async (event, config) => {
    logger.debug('Validating configuration');
    return configManager.validateConfig(config);
  });

  // Save configuration profile
  ipcMain.handle('config:save-profile', async (event, { name, config }) => {
    logger.info('Saving configuration profile', { name });
    return configManager.saveProfile(name, config);
  });

  // Load configuration profile
  ipcMain.handle('config:load-profile', async (event, name) => {
    logger.info('Loading configuration profile', { name });
    return configManager.loadProfile(name);
  });

  // Get all profiles
  ipcMain.handle('config:get-profiles', async () => {
    return configManager.getProfiles();
  });

  // Delete profile
  ipcMain.handle('config:delete-profile', async (event, name) => {
    logger.info('Deleting configuration profile', { name });
    return configManager.deleteProfile(name);
  });

  // Get default configuration
  ipcMain.handle('config:get-defaults', async () => {
    return configManager.getDefaultConfig();
  });

  logger.info('Config IPC handlers registered');
}

module.exports = { setupConfigHandlers };
