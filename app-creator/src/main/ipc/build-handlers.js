/**
 * Build IPC Handlers
 * Handle build process execution and monitoring
 */

const BuildOrchestrator = require('../services/BuildOrchestrator');
const logger = require('../utils/logger');

let buildOrchestrator = null;

/**
 * Setup build-related IPC handlers
 * @param {IpcMain} ipcMain - Electron IpcMain instance
 */
function setupBuildHandlers(ipcMain) {
  // Start build process
  ipcMain.handle('build:start', async (event, config) => {
    logger.info('Starting build process');
    
    // Create new orchestrator for this build
    buildOrchestrator = new BuildOrchestrator(config);

    // Setup progress reporting
    buildOrchestrator.on('progress', (data) => {
      event.sender.send('build:progress', data);
    });

    buildOrchestrator.on('log', (message) => {
      event.sender.send('build:log', message);
    });

    buildOrchestrator.on('error', (error) => {
      event.sender.send('build:error', error);
    });

    buildOrchestrator.on('complete', (result) => {
      event.sender.send('build:complete', result);
    });

    try {
      const result = await buildOrchestrator.start();
      return { success: true, result };
    } catch (error) {
      logger.error('Build failed', { error: error.message });
      return { success: false, error: error.message };
    }
  });

  // Cancel build process
  ipcMain.handle('build:cancel', async () => {
    logger.info('Cancelling build process');
    
    if (buildOrchestrator) {
      buildOrchestrator.cancel();
      return { success: true };
    }
    
    return { success: false, error: 'No active build' };
  });

  // Get build status
  ipcMain.handle('build:status', async () => {
    if (buildOrchestrator) {
      return buildOrchestrator.getStatus();
    }
    return { status: 'idle' };
  });

  // Get build history
  ipcMain.handle('build:get-history', async () => {
    return BuildOrchestrator.getHistory();
  });

  // Clear build history
  ipcMain.handle('build:clear-history', async () => {
    return BuildOrchestrator.clearHistory();
  });

  logger.info('Build IPC handlers registered');
}

module.exports = { setupBuildHandlers };
