/**
 * Configuration Manager
 * Handles validation and management of app configurations
 */

const fs = require('fs-extra');
const path = require('path');
const { app } = require('electron');
const logger = require('../utils/logger');

class ConfigManager {
  constructor() {
    this.profilesDir = path.join(app.getPath('userData'), 'profiles');
    this.ensureProfilesDir();
  }

  /**
   * Ensure profiles directory exists
   */
  ensureProfilesDir() {
    fs.ensureDirSync(this.profilesDir);
  }

  /**
   * Validate URL format and accessibility
   * @param {string} url - URL to validate
   * @returns {Object} Validation result
   */
  validateUrl(url) {
    // Check if empty
    if (!url || url.trim() === '') {
      return { valid: false, error: 'URL is required' };
    }

    const trimmedUrl = url.trim();

    // Check for protocol
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      return { valid: false, error: 'URL must start with http:// or https://' };
    }

    // Check URL format
    try {
      const urlObj = new URL(trimmedUrl);
      
      // Check hostname
      if (!urlObj.hostname || urlObj.hostname.length < 1) {
        return { valid: false, error: 'Invalid URL hostname' };
      }

      return { valid: true, url: trimmedUrl };
    } catch (error) {
      return { valid: false, error: 'Invalid URL format' };
    }
  }

  /**
   * Validate application name
   * @param {string} name - App name to validate
   * @returns {Object} Validation result
   */
  validateAppName(name) {
    // Check if empty
    if (!name || name.trim() === '') {
      return { valid: false, error: 'Application name is required' };
    }

    const trimmedName = name.trim();

    // Check length
    if (trimmedName.length < 3) {
      return { valid: false, error: 'Name must be at least 3 characters' };
    }

    if (trimmedName.length > 50) {
      return { valid: false, error: 'Name must be 50 characters or less' };
    }

    // Check for invalid characters (filesystem unsafe)
    const invalidChars = /[\\/:*?"<>|]/;
    if (invalidChars.test(trimmedName)) {
      return { valid: false, error: 'Name contains invalid characters (\\/:*?"<>|)' };
    }

    // Check for leading/trailing spaces or dots
    if (trimmedName !== name || trimmedName.startsWith('.') || trimmedName.endsWith('.')) {
      return { valid: false, error: 'Name cannot start or end with spaces or dots' };
    }

    // Generate safe folder name
    const safeName = this.generateSafeName(trimmedName);

    return { valid: true, name: trimmedName, safeName };
  }

  /**
   * Generate filesystem-safe name
   * @param {string} name - Original name
   * @returns {string} Safe name for filesystem
   */
  generateSafeName(name) {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Validate entire configuration object
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validation result
   */
  validateConfig(config) {
    const errors = [];

    // Validate URL
    const urlResult = this.validateUrl(config.url);
    if (!urlResult.valid) {
      errors.push({ field: 'url', error: urlResult.error });
    }

    // Validate app name
    const nameResult = this.validateAppName(config.appName);
    if (!nameResult.valid) {
      errors.push({ field: 'appName', error: nameResult.error });
    }

    // Validate window dimensions
    if (config.window) {
      const { width, height, minWidth, minHeight } = config.window;

      if (width && (width < 400 || width > 4000)) {
        errors.push({ field: 'window.width', error: 'Width must be between 400 and 4000' });
      }

      if (height && (height < 300 || height > 4000)) {
        errors.push({ field: 'window.height', error: 'Height must be between 300 and 4000' });
      }

      if (minWidth && minWidth > width) {
        errors.push({ field: 'window.minWidth', error: 'Min width cannot exceed width' });
      }

      if (minHeight && minHeight > height) {
        errors.push({ field: 'window.minHeight', error: 'Min height cannot exceed height' });
      }
    }

    // Validate platform selection
    if (config.platforms) {
      const hasSelectedPlatform = 
        config.platforms.windows?.enabled ||
        config.platforms.macos?.enabled ||
        config.platforms.linux?.enabled;

      if (!hasSelectedPlatform) {
        errors.push({ field: 'platforms', error: 'At least one platform must be selected' });
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : null,
      config: errors.length === 0 ? this.normalizeConfig(config) : null
    };
  }

  /**
   * Normalize configuration with defaults
   * @param {Object} config - Raw configuration
   * @returns {Object} Normalized configuration
   */
  normalizeConfig(config) {
    const defaults = this.getDefaultConfig();

    return {
      url: config.url.trim(),
      appName: config.appName.trim(),
      safeName: this.generateSafeName(config.appName),
      iconPath: config.iconPath || null,
      window: {
        ...defaults.window,
        ...config.window
      },
      platforms: {
        ...defaults.platforms,
        ...config.platforms
      },
      advanced: {
        ...defaults.advanced,
        ...config.advanced
      }
    };
  }

  /**
   * Get default configuration
   * @returns {Object} Default configuration
   */
  getDefaultConfig() {
    return {
      url: '',
      appName: '',
      safeName: '',
      iconPath: null,
      window: {
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        resizable: true,
        frame: true,
        alwaysOnTop: false,
        maximized: false
      },
      platforms: {
        windows: { enabled: true, arch: ['x64'] },
        macos: { enabled: false, arch: [] },
        linux: { enabled: false, arch: [] }
      },
      advanced: {
        devTools: false,
        autoUpdate: false,
        customMenu: true
      }
    };
  }

  /**
   * Save configuration profile
   * @param {string} name - Profile name
   * @param {Object} config - Configuration to save
   * @returns {Object} Result
   */
  async saveProfile(name, config) {
    try {
      const safeName = this.generateSafeName(name);
      const profilePath = path.join(this.profilesDir, `${safeName}.json`);
      
      const profileData = {
        name,
        safeName,
        createdAt: new Date().toISOString(),
        config
      };

      await fs.writeJson(profilePath, profileData, { spaces: 2 });
      logger.info('Profile saved', { name, path: profilePath });

      return { success: true, path: profilePath };
    } catch (error) {
      logger.error('Failed to save profile', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Load configuration profile
   * @param {string} name - Profile name
   * @returns {Object} Profile data or error
   */
  async loadProfile(name) {
    try {
      const safeName = this.generateSafeName(name);
      const profilePath = path.join(this.profilesDir, `${safeName}.json`);

      if (!await fs.pathExists(profilePath)) {
        return { success: false, error: 'Profile not found' };
      }

      const profileData = await fs.readJson(profilePath);
      logger.info('Profile loaded', { name });

      return { success: true, profile: profileData };
    } catch (error) {
      logger.error('Failed to load profile', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all saved profiles
   * @returns {Array} List of profiles
   */
  async getProfiles() {
    try {
      const files = await fs.readdir(this.profilesDir);
      const profiles = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const profilePath = path.join(this.profilesDir, file);
          const profileData = await fs.readJson(profilePath);
          profiles.push({
            name: profileData.name,
            safeName: profileData.safeName,
            createdAt: profileData.createdAt,
            url: profileData.config?.url
          });
        }
      }

      return { success: true, profiles };
    } catch (error) {
      logger.error('Failed to get profiles', { error: error.message });
      return { success: false, error: error.message, profiles: [] };
    }
  }

  /**
   * Delete profile
   * @param {string} name - Profile name
   * @returns {Object} Result
   */
  async deleteProfile(name) {
    try {
      const safeName = this.generateSafeName(name);
      const profilePath = path.join(this.profilesDir, `${safeName}.json`);

      if (!await fs.pathExists(profilePath)) {
        return { success: false, error: 'Profile not found' };
      }

      await fs.remove(profilePath);
      logger.info('Profile deleted', { name });

      return { success: true };
    } catch (error) {
      logger.error('Failed to delete profile', { error: error.message });
      return { success: false, error: error.message };
    }
  }
}

module.exports = ConfigManager;
