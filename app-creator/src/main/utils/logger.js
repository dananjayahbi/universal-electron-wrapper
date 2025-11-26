/**
 * Logger Utility for App Creator
 */

const path = require('path');
const fs = require('fs');

class Logger {
  constructor() {
    this.level = 'info';
    this.levels = { error: 0, warn: 1, info: 2, debug: 3 };
    this.logToFile = false;
    this.logToConsole = true;
    this.logFile = null;
    this.initialized = false;
  }

  initialize(config = {}) {
    if (this.initialized) return;
    
    this.level = config.level || 'info';
    this.logToFile = config.file !== false;
    this.logToConsole = config.console !== false;

    if (this.logToFile) {
      try {
        const { app } = require('electron');
        const userDataPath = app.getPath('userData');
        const logDir = path.join(userDataPath, 'logs');
        
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }

        const date = new Date().toISOString().split('T')[0];
        this.logFile = path.join(logDir, `creator-${date}.log`);
      } catch (error) {
        this.logToFile = false;
      }
    }

    this.initialized = true;
  }

  shouldLog(level) {
    return this.levels[level] <= this.levels[this.level];
  }

  formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(5);
    let formatted = `[${timestamp}] [${levelStr}] ${message}`;
    if (data && Object.keys(data).length > 0) {
      formatted += ` ${JSON.stringify(data)}`;
    }
    return formatted;
  }

  log(level, message, data = {}) {
    if (!this.initialized) this.initialize();
    if (!this.shouldLog(level)) return;

    const formatted = this.formatMessage(level, message, data);

    if (this.logToConsole) {
      const methods = { error: 'error', warn: 'warn', debug: 'debug' };
      console[methods[level] || 'log'](formatted);
    }

    if (this.logToFile && this.logFile) {
      try {
        fs.appendFileSync(this.logFile, formatted + '\n');
      } catch (error) {
        console.error('Failed to write log:', error);
      }
    }
  }

  error(message, data) { this.log('error', message, data); }
  warn(message, data) { this.log('warn', message, data); }
  info(message, data) { this.log('info', message, data); }
  debug(message, data) { this.log('debug', message, data); }
}

module.exports = new Logger();
