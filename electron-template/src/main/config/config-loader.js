/**
 * Configuration Loader
 * Loads and validates application configuration from config.json
 */

const fs = require('fs');
const path = require('path');

class ConfigLoader {
  constructor() {
    this.configPath = path.join(__dirname, '../../../config/config.json');
    this.config = null;
  }

  /**
   * Load configuration from file
   * @returns {Object} Configuration object
   */
  load() {
    try {
      // Check if config file exists
      if (!fs.existsSync(this.configPath)) {
        console.warn('Config file not found, using defaults');
        return this.getDefaultConfig();
      }

      // Read and parse config file
      const configFile = fs.readFileSync(this.configPath, 'utf8');
      this.config = JSON.parse(configFile);

      // Validate configuration
      this.validate();

      // Merge with defaults to ensure all fields exist
      this.config = this.mergeWithDefaults(this.config);

      return this.config;
    } catch (error) {
      console.error('Failed to load configuration:', error.message);
      return this.getDefaultConfig();
    }
  }

  /**
   * Validate configuration
   * @throws {Error} If validation fails
   */
  validate() {
    // Validate required fields
    if (!this.config.target?.url) {
      throw new Error('Target URL is required in configuration');
    }

    // Validate URL format
    try {
      new URL(this.config.target.url);
    } catch {
      throw new Error(`Invalid target URL: ${this.config.target.url}`);
    }

    // Validate window dimensions if provided
    if (this.config.window) {
      const { width, height, minWidth, minHeight } = this.config.window;
      
      if (width && (width < 200 || width > 10000)) {
        throw new Error('Window width must be between 200 and 10000');
      }
      
      if (height && (height < 150 || height > 10000)) {
        throw new Error('Window height must be between 150 and 10000');
      }
      
      if (minWidth && width && minWidth > width) {
        throw new Error('Minimum width cannot be greater than width');
      }
      
      if (minHeight && height && minHeight > height) {
        throw new Error('Minimum height cannot be greater than height');
      }
    }
  }

  /**
   * Merge user config with defaults
   * @param {Object} userConfig - User configuration
   * @returns {Object} Merged configuration
   */
  mergeWithDefaults(userConfig) {
    const defaults = this.getDefaultConfig();
    
    return {
      app: { ...defaults.app, ...userConfig.app },
      target: { ...defaults.target, ...userConfig.target },
      window: { ...defaults.window, ...userConfig.window },
      features: { ...defaults.features, ...userConfig.features },
      menu: { ...defaults.menu, ...userConfig.menu },
      navigation: { ...defaults.navigation, ...userConfig.navigation },
      downloads: { ...defaults.downloads, ...userConfig.downloads },
      session: { ...defaults.session, ...userConfig.session },
      updates: { ...defaults.updates, ...userConfig.updates },
      logging: { ...defaults.logging, ...userConfig.logging }
    };
  }

  /**
   * Get default configuration
   * @returns {Object} Default configuration
   */
  getDefaultConfig() {
    return {
      app: {
        name: 'Electron Wrapper',
        version: '1.0.0',
        description: 'A web application wrapper',
        author: 'Unknown',
        homepage: 'https://example.com'
      },
      target: {
        url: 'https://example.com',
        userAgent: null
      },
      window: {
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        maxWidth: null,
        maxHeight: null,
        resizable: true,
        movable: true,
        minimizable: true,
        maximizable: true,
        closable: true,
        focusable: true,
        alwaysOnTop: false,
        fullscreen: false,
        kiosk: false,
        frame: true,
        show: true,
        center: true,
        title: 'Electron Wrapper',
        backgroundColor: '#ffffff',
        transparent: false,
        hasShadow: true,
        opacity: 1.0
      },
      features: {
        devTools: false,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
        autoHideMenuBar: false,
        enableRemoteModule: false
      },
      menu: {
        enabled: true,
        template: 'default'
      },
      navigation: {
        allowedDomains: [],
        openExternalLinksInBrowser: true,
        internalUrlPatterns: []
      },
      downloads: {
        enabled: true,
        openFolderOnComplete: false,
        defaultPath: null
      },
      session: {
        persistent: true,
        partition: 'persist:main',
        clearOnExit: false
      },
      updates: {
        enabled: false,
        autoDownload: false,
        autoInstall: false,
        checkOnStart: false
      },
      logging: {
        level: 'info',
        file: true,
        console: true
      }
    };
  }

  /**
   * Save configuration to file
   * @param {Object} config - Configuration to save
   */
  save(config) {
    try {
      const configJson = JSON.stringify(config, null, 2);
      fs.writeFileSync(this.configPath, configJson, 'utf8');
      this.config = config;
    } catch (error) {
      console.error('Failed to save configuration:', error.message);
      throw error;
    }
  }
}

module.exports = ConfigLoader;
