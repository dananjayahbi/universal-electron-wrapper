/**
 * Download Manager
 * Handles file downloads from web content
 */

const { dialog, shell, app } = require('electron');
const path = require('path');
const logger = require('../utils/logger');

class DownloadManager {
  constructor(config) {
    this.config = config;
    this.downloads = new Map();
  }

  /**
   * Attach download handlers to a window
   * @param {BrowserWindow} window - The window to attach handlers to
   */
  attach(window) {
    // Skip if downloads are disabled
    if (!this.config.downloads.enabled) {
      logger.info('Downloads are disabled');
      return;
    }

    // Handle download events
    window.webContents.session.on('will-download', (event, item, webContents) => {
      this.handleDownload(event, item, webContents, window);
    });
  }

  /**
   * Handle download events
   * @param {Event} event - Download event
   * @param {DownloadItem} item - Download item
   * @param {WebContents} webContents - Web contents
   * @param {BrowserWindow} window - Parent window
   */
  handleDownload(event, item, webContents, window) {
    const filename = item.getFilename();
    const fileSize = item.getTotalBytes();
    const downloadId = `${Date.now()}-${filename}`;

    logger.info('Download started', { 
      filename, 
      size: this.formatBytes(fileSize),
      url: item.getURL()
    });

    // Get save path
    const defaultPath = this.config.downloads.defaultPath || app.getPath('downloads');
    const savePath = path.join(defaultPath, filename);

    // Set save path
    item.setSavePath(savePath);

    // Track download
    this.downloads.set(downloadId, {
      item,
      filename,
      savePath,
      startTime: Date.now(),
      totalBytes: fileSize,
      receivedBytes: 0,
      state: 'progressing'
    });

    // Handle download progress
    item.on('updated', (event, state) => {
      this.handleDownloadProgress(downloadId, item, state);
    });

    // Handle download completion
    item.once('done', (event, state) => {
      this.handleDownloadComplete(downloadId, item, state, window);
    });
  }

  /**
   * Handle download progress updates
   * @param {string} downloadId - Download identifier
   * @param {DownloadItem} item - Download item
   * @param {string} state - Download state
   */
  handleDownloadProgress(downloadId, item, state) {
    const download = this.downloads.get(downloadId);
    if (!download) return;

    download.receivedBytes = item.getReceivedBytes();
    download.state = state;

    if (state === 'interrupted') {
      logger.warn('Download interrupted', { 
        filename: download.filename 
      });
    } else if (state === 'progressing') {
      const progress = this.calculateProgress(download.receivedBytes, download.totalBytes);
      logger.debug('Download progress', { 
        filename: download.filename, 
        progress: `${progress}%`
      });
    }
  }

  /**
   * Handle download completion
   * @param {string} downloadId - Download identifier
   * @param {DownloadItem} item - Download item
   * @param {string} state - Final state
   * @param {BrowserWindow} window - Parent window
   */
  handleDownloadComplete(downloadId, item, state, window) {
    const download = this.downloads.get(downloadId);
    if (!download) return;

    const duration = Date.now() - download.startTime;

    if (state === 'completed') {
      logger.info('Download completed', { 
        filename: download.filename, 
        path: download.savePath,
        duration: `${(duration / 1000).toFixed(1)}s`
      });

      // Open folder if configured
      if (this.config.downloads.openFolderOnComplete) {
        shell.showItemInFolder(download.savePath);
      }
    } else if (state === 'cancelled') {
      logger.info('Download cancelled', { filename: download.filename });
    } else {
      logger.error('Download failed', { 
        filename: download.filename, 
        state 
      });
    }

    // Cleanup
    this.downloads.delete(downloadId);
  }

  /**
   * Calculate download progress percentage
   * @param {number} received - Bytes received
   * @param {number} total - Total bytes
   * @returns {number} Progress percentage
   */
  calculateProgress(received, total) {
    if (total === 0) return 0;
    return Math.round((received / total) * 100);
  }

  /**
   * Format bytes to human readable string
   * @param {number} bytes - Bytes to format
   * @returns {string} Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Cancel a download
   * @param {string} downloadId - Download identifier
   */
  cancelDownload(downloadId) {
    const download = this.downloads.get(downloadId);
    if (download && download.item) {
      download.item.cancel();
    }
  }

  /**
   * Pause a download
   * @param {string} downloadId - Download identifier
   */
  pauseDownload(downloadId) {
    const download = this.downloads.get(downloadId);
    if (download && download.item && download.item.canResume()) {
      download.item.pause();
    }
  }

  /**
   * Resume a download
   * @param {string} downloadId - Download identifier
   */
  resumeDownload(downloadId) {
    const download = this.downloads.get(downloadId);
    if (download && download.item && download.item.isPaused()) {
      download.item.resume();
    }
  }

  /**
   * Get all active downloads
   * @returns {Array} Array of download info objects
   */
  getActiveDownloads() {
    const downloads = [];
    this.downloads.forEach((download, id) => {
      downloads.push({
        id,
        filename: download.filename,
        progress: this.calculateProgress(download.receivedBytes, download.totalBytes),
        state: download.state,
        receivedBytes: download.receivedBytes,
        totalBytes: download.totalBytes
      });
    });
    return downloads;
  }
}

module.exports = DownloadManager;
