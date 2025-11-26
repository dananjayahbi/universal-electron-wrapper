/**
 * Logger Utility
 * Simple logging utility for the application
 */

const path = require('path');
const fs = require('fs');
const { app } = require('electron');

class Logger {
  constructor() {
    this.level = 'info';
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    this.logToFile = false;
    this.logToConsole = true;
    this.logFile = null;
    this.initialized = false;
  }

  /**
   * Initialize logger with configuration
   * @param {Object} config - Logging configuration
   */
  initialize(config = {}) {
    if (this.initialized) return;

    this.level = config.level || 'info';
    this.logToFile = config.file !== false;
    this.logToConsole = config.console !== false;

    // Setup log file if enabled
    if (this.logToFile) {
      try {
        const userDataPath = app.getPath('userData');
        const logDir = path.join(userDataPath, 'logs');
        
        // Create logs directory if it doesn't exist
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }

        const date = new Date().toISOString().split('T')[0];
        this.logFile = path.join(logDir, `app-${date}.log`);
      } catch (error) {
        console.error('Failed to setup log file:', error);
        this.logToFile = false;
      }
    }

    this.initialized = true;
  }

  /**
   * Check if message should be logged at given level
   * @param {string} level - Log level
   * @returns {boolean} True if should log
   */
  shouldLog(level) {
    return this.levels[level] <= this.levels[this.level];
  }

  /**
   * Format log message
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   * @returns {string} Formatted message
   */
  formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(5);
    
    let formattedMessage = `[${timestamp}] [${levelStr}] ${message}`;
    
    if (data && Object.keys(data).length > 0) {
      formattedMessage += ` ${JSON.stringify(data)}`;
    }
    
    return formattedMessage;
  }

  /**
   * Write log entry
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  log(level, message, data = {}) {
    // Initialize with defaults if not initialized
    if (!this.initialized) {
      this.initialize();
    }

    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, data);

    // Console output
    if (this.logToConsole) {
      switch (level) {
        case 'error':
          console.error(formattedMessage);
          break;
        case 'warn':
          console.warn(formattedMessage);
          break;
        case 'debug':
          console.debug(formattedMessage);
          break;
        default:
          console.log(formattedMessage);
      }
    }

    // File output
    if (this.logToFile && this.logFile) {
      try {
        fs.appendFileSync(this.logFile, formattedMessage + '\n');
      } catch (error) {
        console.error('Failed to write to log file:', error);
      }
    }
  }

  /**
   * Log error message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  error(message, data) {
    this.log('error', message, data);
  }

  /**
   * Log warning message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  warn(message, data) {
    this.log('warn', message, data);
  }

  /**
   * Log info message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  info(message, data) {
    this.log('info', message, data);
  }

  /**
   * Log debug message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  debug(message, data) {
    this.log('debug', message, data);
  }

  /**
   * Get log file path
   * @returns {string|null} Log file path
   */
  getLogFilePath() {
    return this.logFile;
  }

  /**
   * Clear old log files (keep last N days)
   * @param {number} daysToKeep - Number of days to keep
   */
  clearOldLogs(daysToKeep = 7) {
    if (!this.logToFile) return;

    try {
      const logDir = path.dirname(this.logFile);
      const files = fs.readdirSync(logDir);
      const now = Date.now();
      const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

      files.forEach((file) => {
        if (file.startsWith('app-') && file.endsWith('.log')) {
          const filePath = path.join(logDir, file);
          const stats = fs.statSync(filePath);
          
          if (now - stats.mtimeMs > maxAge) {
            fs.unlinkSync(filePath);
            this.info('Deleted old log file', { file });
          }
        }
      });
    } catch (error) {
      console.error('Failed to clear old logs:', error);
    }
  }
}

// Export singleton instance
module.exports = new Logger();
