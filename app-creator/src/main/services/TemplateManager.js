/**
 * Template Manager
 * Handles copying and configuring the Electron template
 */

const fs = require('fs-extra');
const path = require('path');
const { app } = require('electron');
const logger = require('../utils/logger');

class TemplateManager {
  constructor() {
    this.templatePath = this.getTemplatePath();
  }

  /**
   * Get path to the Electron template
   * @returns {string} Template path
   */
  getTemplatePath() {
    // In development, template is in sibling folder
    // In production, template is in resources
    const devPath = path.join(__dirname, '../../../../electron-template');
    const prodPath = path.join(process.resourcesPath, 'templates/electron-template');

    if (fs.existsSync(devPath)) {
      return devPath;
    }
    return prodPath;
  }

  /**
   * Copy template to workspace directory
   * @param {string} workspacePath - Target workspace path
   * @returns {Promise<Object>} Result
   */
  async copyTemplate(workspacePath) {
    logger.info('Copying template', { from: this.templatePath, to: workspacePath });

    try {
      // Ensure workspace exists and is empty
      if (await fs.pathExists(workspacePath)) {
        const files = await fs.readdir(workspacePath);
        if (files.length > 0) {
          // Remove existing content
          await fs.emptyDir(workspacePath);
        }
      }

      // Copy template
      await fs.copy(this.templatePath, workspacePath, {
        filter: (src) => {
          // Skip node_modules, dist, and other build artifacts
          const relativePath = path.relative(this.templatePath, src);
          const skipDirs = ['node_modules', 'dist', 'out', '.git'];
          
          for (const dir of skipDirs) {
            if (relativePath.startsWith(dir) || relativePath.includes(`/${dir}`) || relativePath.includes(`\\${dir}`)) {
              return false;
            }
          }
          return true;
        }
      });

      logger.info('Template copied successfully');
      return { success: true, path: workspacePath };
    } catch (error) {
      logger.error('Failed to copy template', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Apply configuration to copied template
   * @param {string} workspacePath - Workspace path
   * @param {Object} config - Configuration to apply
   * @returns {Promise<Object>} Result
   */
  async applyConfiguration(workspacePath, config) {
    logger.info('Applying configuration', { workspace: workspacePath });

    try {
      // Update config.json
      await this.updateConfigJson(workspacePath, config);

      // Update package.json
      await this.updatePackageJson(workspacePath, config);

      // Update electron-builder.yml
      await this.updateBuilderConfig(workspacePath, config);

      logger.info('Configuration applied successfully');
      return { success: true };
    } catch (error) {
      logger.error('Failed to apply configuration', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Update config.json with user settings
   * @param {string} workspacePath - Workspace path
   * @param {Object} config - User configuration
   */
  async updateConfigJson(workspacePath, config) {
    const configPath = path.join(workspacePath, 'config/config.json');
    
    const appConfig = {
      app: {
        name: config.appName,
        version: '1.0.0',
        description: `${config.appName} - Desktop Application`,
        author: 'Universal Electron Wrapper',
        homepage: config.url
      },
      target: {
        url: config.url,
        userAgent: null
      },
      window: {
        width: config.window?.width || 1200,
        height: config.window?.height || 800,
        minWidth: config.window?.minWidth || 800,
        minHeight: config.window?.minHeight || 600,
        maxWidth: null,
        maxHeight: null,
        resizable: config.window?.resizable !== false,
        movable: true,
        minimizable: true,
        maximizable: true,
        closable: true,
        focusable: true,
        alwaysOnTop: config.window?.alwaysOnTop || false,
        fullscreen: false,
        kiosk: false,
        frame: config.window?.frame !== false,
        show: true,
        center: true,
        title: config.appName,
        backgroundColor: '#ffffff',
        transparent: false,
        hasShadow: true,
        opacity: 1.0
      },
      features: {
        devTools: config.advanced?.devTools || false,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
        autoHideMenuBar: false,
        enableRemoteModule: false
      },
      menu: {
        enabled: config.advanced?.customMenu !== false,
        template: 'default'
      },
      navigation: {
        allowedDomains: this.extractDomain(config.url),
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
        enabled: config.advanced?.autoUpdate || false,
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

    await fs.writeJson(configPath, appConfig, { spaces: 2 });
    logger.debug('Updated config.json');
  }

  /**
   * Extract domain from URL for allowed domains
   * @param {string} url - Target URL
   * @returns {Array} Allowed domains
   */
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return [urlObj.hostname, `*.${urlObj.hostname}`];
    } catch {
      return [];
    }
  }

  /**
   * Update package.json with app details
   * @param {string} workspacePath - Workspace path
   * @param {Object} config - User configuration
   */
  async updatePackageJson(workspacePath, config) {
    const packagePath = path.join(workspacePath, 'package.json');
    const packageJson = await fs.readJson(packagePath);

    packageJson.name = config.safeName || this.generateSafeName(config.appName);
    packageJson.version = '1.0.0';
    packageJson.description = `${config.appName} - Desktop Application`;
    packageJson.author = 'Generated by Universal Electron Wrapper';

    await fs.writeJson(packagePath, packageJson, { spaces: 2 });
    logger.debug('Updated package.json');
  }

  /**
   * Update electron-builder.yml with app details
   * @param {string} workspacePath - Workspace path
   * @param {Object} config - User configuration
   */
  async updateBuilderConfig(workspacePath, config) {
    const builderPath = path.join(workspacePath, 'electron-builder.yml');
    let builderContent = await fs.readFile(builderPath, 'utf8');

    const safeName = config.safeName || this.generateSafeName(config.appName);

    // Replace placeholders
    builderContent = builderContent
      .replace(/appId:.*$/m, `appId: com.electronwrapper.${safeName}`)
      .replace(/productName:.*$/m, `productName: ${config.appName}`)
      .replace(/shortcutName:.*$/m, `shortcutName: ${config.appName}`);

    await fs.writeFile(builderPath, builderContent, 'utf8');
    logger.debug('Updated electron-builder.yml');
  }

  /**
   * Generate filesystem-safe name
   * @param {string} name - Original name
   * @returns {string} Safe name
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
   * Verify template exists and is valid
   * @returns {Object} Verification result
   */
  async verifyTemplate() {
    try {
      if (!await fs.pathExists(this.templatePath)) {
        return { valid: false, error: 'Template not found' };
      }

      // Check for required files
      const requiredFiles = [
        'package.json',
        'src/main/main.js',
        'config/config.json'
      ];

      for (const file of requiredFiles) {
        const filePath = path.join(this.templatePath, file);
        if (!await fs.pathExists(filePath)) {
          return { valid: false, error: `Missing required file: ${file}` };
        }
      }

      return { valid: true, path: this.templatePath };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

module.exports = TemplateManager;
