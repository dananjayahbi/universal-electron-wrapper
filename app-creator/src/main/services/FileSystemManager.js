/**
 * File System Manager
 * Utility class for file system operations
 */

const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class FileSystemManager {
  /**
   * Check if path exists
   * @param {string} targetPath - Path to check
   * @returns {Promise<boolean>} True if exists
   */
  async exists(targetPath) {
    return fs.pathExists(targetPath);
  }

  /**
   * List directory contents
   * @param {string} dirPath - Directory path
   * @returns {Promise<Array>} Array of file info objects
   */
  async listDirectory(dirPath) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    return entries.map(entry => ({
      name: entry.name,
      path: path.join(dirPath, entry.name),
      isDirectory: entry.isDirectory(),
      isFile: entry.isFile()
    }));
  }

  /**
   * Read text file
   * @param {string} filePath - File path
   * @returns {Promise<string>} File content
   */
  async readTextFile(filePath) {
    return fs.readFile(filePath, 'utf8');
  }

  /**
   * Write text file
   * @param {string} filePath - File path
   * @param {string} content - Content to write
   */
  async writeTextFile(filePath, content) {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf8');
  }

  /**
   * Copy file or directory
   * @param {string} source - Source path
   * @param {string} destination - Destination path
   * @param {Object} options - Copy options
   */
  async copy(source, destination, options = {}) {
    await fs.copy(source, destination, options);
  }

  /**
   * Move file or directory
   * @param {string} source - Source path
   * @param {string} destination - Destination path
   */
  async move(source, destination) {
    await fs.move(source, destination);
  }

  /**
   * Remove file or directory
   * @param {string} targetPath - Path to remove
   */
  async remove(targetPath) {
    await fs.remove(targetPath);
  }

  /**
   * Ensure directory exists
   * @param {string} dirPath - Directory path
   */
  async ensureDir(dirPath) {
    await fs.ensureDir(dirPath);
  }

  /**
   * Get file stats
   * @param {string} filePath - File path
   * @returns {Promise<Object>} File stats
   */
  async getStats(filePath) {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile()
    };
  }

  /**
   * Read JSON file
   * @param {string} filePath - File path
   * @returns {Promise<Object>} Parsed JSON
   */
  async readJson(filePath) {
    return fs.readJson(filePath);
  }

  /**
   * Write JSON file
   * @param {string} filePath - File path
   * @param {Object} data - Data to write
   */
  async writeJson(filePath, data) {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, data, { spaces: 2 });
  }

  /**
   * Empty directory
   * @param {string} dirPath - Directory path
   */
  async emptyDir(dirPath) {
    await fs.emptyDir(dirPath);
  }

  /**
   * Calculate directory size
   * @param {string} dirPath - Directory path
   * @returns {Promise<number>} Total size in bytes
   */
  async calculateSize(dirPath) {
    let totalSize = 0;
    
    const walk = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else {
          const stats = await fs.stat(fullPath);
          totalSize += stats.size;
        }
      }
    };

    await walk(dirPath);
    return totalSize;
  }

  /**
   * Format bytes to human readable string
   * @param {number} bytes - Bytes to format
   * @returns {string} Formatted string
   */
  formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = FileSystemManager;
