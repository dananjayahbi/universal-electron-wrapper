/**
 * Build Orchestrator
 * Manages the entire build process for creating Electron apps
 */

const { EventEmitter } = require('events');
const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const { app } = require('electron');
const TemplateManager = require('./TemplateManager');
const IconProcessor = require('./IconProcessor');
const logger = require('../utils/logger');

class BuildOrchestrator extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.templateManager = new TemplateManager();
    this.iconProcessor = new IconProcessor();
    this.workspacePath = null;
    this.status = 'idle';
    this.progress = 0;
    this.currentStep = '';
    this.startTime = null;
    this.cancelled = false;
    this.childProcess = null;

    // Build steps with weights for progress calculation
    this.steps = [
      { name: 'prepare', label: 'Preparing workspace', weight: 5 },
      { name: 'copy', label: 'Copying template', weight: 10 },
      { name: 'configure', label: 'Applying configuration', weight: 10 },
      { name: 'icons', label: 'Processing icons', weight: 10 },
      { name: 'install', label: 'Installing dependencies', weight: 30 },
      { name: 'build', label: 'Building application', weight: 30 },
      { name: 'complete', label: 'Finalizing', weight: 5 }
    ];
  }

  /**
   * Start the build process
   * @returns {Promise<Object>} Build result
   */
  async start() {
    logger.info('Starting build process', { config: this.config });
    this.startTime = Date.now();
    this.status = 'running';
    this.cancelled = false;

    try {
      // Step 1: Prepare workspace
      await this.executeStep('prepare', async () => {
        this.workspacePath = await this.prepareWorkspace();
      });

      if (this.cancelled) throw new Error('Build cancelled');

      // Step 2: Copy template
      await this.executeStep('copy', async () => {
        const result = await this.templateManager.copyTemplate(this.workspacePath);
        if (!result.success) throw new Error(result.error);
      });

      if (this.cancelled) throw new Error('Build cancelled');

      // Step 3: Apply configuration
      await this.executeStep('configure', async () => {
        const result = await this.templateManager.applyConfiguration(this.workspacePath, this.config);
        if (!result.success) throw new Error(result.error);
      });

      if (this.cancelled) throw new Error('Build cancelled');

      // Step 4: Process icons
      await this.executeStep('icons', async () => {
        await this.processIcons();
      });

      if (this.cancelled) throw new Error('Build cancelled');

      // Step 5: Install dependencies
      await this.executeStep('install', async () => {
        await this.runNpmInstall();
      });

      if (this.cancelled) throw new Error('Build cancelled');

      // Step 6: Build application
      await this.executeStep('build', async () => {
        await this.runElectronBuilder();
      });

      if (this.cancelled) throw new Error('Build cancelled');

      // Step 7: Complete
      await this.executeStep('complete', async () => {
        // Copy installers to Downloads folder
        await this.finalizeOutput();
      });

      const duration = Date.now() - this.startTime;
      const downloadsPath = app.getPath('downloads');
      const result = {
        success: true,
        outputPath: downloadsPath,  // Point to Downloads folder, not temp
        installerFiles: this.getInstallerFiles(),  // List of installer files
        duration,
        config: this.config
      };

      this.status = 'complete';
      this.emit('complete', result);
      
      // Save to history
      await this.saveToHistory(result);

      // Clean up temp workspace after a delay (keep it for debugging)
      setTimeout(async () => {
        try {
          await fs.remove(this.workspacePath);
          logger.info('Cleaned up temporary workspace');
        } catch (err) {
          logger.warn('Could not clean up workspace', { error: err.message });
        }
      }, 60000); // Clean up after 1 minute

      logger.info('Build completed successfully', { duration });
      return result;

    } catch (error) {
      this.status = 'error';
      const errorResult = {
        success: false,
        error: error.message,
        duration: Date.now() - this.startTime
      };
      
      this.emit('error', errorResult);
      logger.error('Build failed', { error: error.message });
      
      throw error;
    }
  }

  /**
   * Execute a build step with progress tracking
   * @param {string} stepName - Step name
   * @param {Function} action - Step action
   */
  async executeStep(stepName, action) {
    const step = this.steps.find(s => s.name === stepName);
    if (!step) throw new Error(`Unknown step: ${stepName}`);

    this.currentStep = step.label;
    this.log(`Starting: ${step.label}`);
    this.emit('progress', { 
      progress: this.progress, 
      step: step.label 
    });

    await action();

    // Update progress
    const completedWeight = this.steps
      .slice(0, this.steps.indexOf(step) + 1)
      .reduce((sum, s) => sum + s.weight, 0);
    this.progress = completedWeight;

    this.log(`Completed: ${step.label}`);
    this.emit('progress', { 
      progress: this.progress, 
      step: step.label 
    });
  }

  /**
   * Prepare workspace directory - uses temp folder for builds
   * @returns {Promise<string>} Workspace path
   */
  async prepareWorkspace() {
    // Use temp folder for building (not Documents)
    const tempBase = app.getPath('temp');
    const safeName = this.config.safeName || this.templateManager.generateSafeName(this.config.appName);
    const timestamp = Date.now();
    const workspacePath = path.join(tempBase, 'ElectronAppBuilder', `${safeName}-${timestamp}`);

    // Clean up any existing workspace
    await fs.remove(workspacePath);
    await fs.ensureDir(workspacePath);
    this.log(`Workspace prepared: ${workspacePath}`);
    
    return workspacePath;
  }

  /**
   * Process application icons
   */
  async processIcons() {
    const buildDir = path.join(this.workspacePath, 'build');
    await fs.ensureDir(buildDir);
    
    if (this.config.iconPath) {
      try {
        // Process user-provided icon
        const result = await this.iconProcessor.process(
          this.config.iconPath,
          this.workspacePath
        );
        this.log(`Icons processed: ${result.iconSet?.length || 0} sizes generated`);
      } catch (error) {
        // Icon processing failed, but don't fail the entire build
        // Generate a default icon instead
        this.log(`Warning: Icon processing failed (${error.message}), using default icon`);
        logger.warn('Icon processing failed, generating default icon', { error: error.message });
        
        try {
          const defaultIconPath = path.join(buildDir, 'icon.png');
          await this.iconProcessor.generateDefaultIcon(defaultIconPath, this.config.appName);
          this.log('Default icon generated as fallback');
        } catch (defaultError) {
          // Even default icon failed, continue without icon
          this.log('Warning: Could not generate default icon, build will continue without custom icon');
          logger.warn('Default icon generation failed', { error: defaultError.message });
        }
      }
    } else {
      // Generate default icon
      try {
        const defaultIconPath = path.join(buildDir, 'icon.png');
        await this.iconProcessor.generateDefaultIcon(defaultIconPath, this.config.appName);
        this.log('Default icon generated');
      } catch (error) {
        // Default icon failed, continue without
        this.log('Warning: Could not generate default icon, build will continue');
        logger.warn('Default icon generation failed', { error: error.message });
      }
    }
  }

  /**
   * Run npm install in workspace
   */
  async runNpmInstall() {
    this.log('Installing dependencies...');
    
    return new Promise((resolve, reject) => {
      const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      
      this.childProcess = spawn(npm, ['install'], {
        cwd: this.workspacePath,
        shell: true,
        env: { ...process.env, NODE_ENV: 'production' }
      });

      let stdout = '';
      let stderr = '';

      this.childProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        this.log(data.toString().trim());
      });

      this.childProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        // npm often writes to stderr for warnings, so we log but don't fail
        this.log(data.toString().trim());
      });

      this.childProcess.on('close', (code) => {
        this.childProcess = null;
        if (code === 0) {
          this.log('Dependencies installed successfully');
          resolve();
        } else {
          reject(new Error(`npm install failed with code ${code}\n${stderr}`));
        }
      });

      this.childProcess.on('error', (error) => {
        this.childProcess = null;
        reject(error);
      });
    });
  }

  /**
   * Run electron-builder to create distributable
   */
  async runElectronBuilder() {
    this.log('Building application...');
    
    // Store logs for debugging
    this.buildLogs = [];
    
    return new Promise((resolve, reject) => {
      // Use npx to run electron-builder directly from node_modules
      const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      const args = ['electron-builder', '--win'];  // Explicit Windows build

      this.log(`Running: ${npx} ${args.join(' ')}`);
      
      this.childProcess = spawn(npx, args, {
        cwd: this.workspacePath,
        shell: true,
        env: { 
          ...process.env,
          // Ensure node_modules/.bin is in PATH
          PATH: `${path.join(this.workspacePath, 'node_modules', '.bin')}${path.delimiter}${process.env.PATH}`
        }
      });

      let stdout = '';
      let stderr = '';

      this.childProcess.stdout.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        const lines = text.split('\n').filter(l => l.trim());
        lines.forEach(line => {
          this.log(line);
          this.buildLogs.push({ type: 'stdout', text: line, time: new Date().toISOString() });
        });
      });

      this.childProcess.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        const lines = text.split('\n').filter(l => l.trim());
        lines.forEach(line => {
          this.log(line);
          this.buildLogs.push({ type: 'stderr', text: line, time: new Date().toISOString() });
        });
      });

      this.childProcess.on('close', async (code) => {
        this.childProcess = null;
        
        // Save build log to file
        try {
          const logPath = path.join(this.workspacePath, 'build.log');
          const logContent = this.buildLogs.map(l => `[${l.time}] [${l.type.toUpperCase()}] ${l.text}`).join('\n');
          await fs.writeFile(logPath, logContent);
          this.log(`Build log saved to: ${logPath}`);
        } catch (err) {
          logger.warn('Could not save build log', { error: err.message });
        }
        
        if (code === 0) {
          this.log('Application built successfully');
          resolve();
        } else {
          const errorMsg = `Build failed with code ${code}`;
          this.log(`ERROR: ${errorMsg}`);
          this.log(`STDERR: ${stderr}`);
          this.log(`STDOUT: ${stdout}`);
          reject(new Error(`${errorMsg}\n\nOutput:\n${stdout}\n\nErrors:\n${stderr}`));
        }
      });

      this.childProcess.on('error', (error) => {
        this.childProcess = null;
        this.log(`Process error: ${error.message}`);
        reject(error);
      });
    });
  }

  /**
   * Finalize build output - copy installer to app-builds folder
   */
  async finalizeOutput() {
    const distPath = path.join(this.workspacePath, 'dist');
    
    // Save to app-creator/app-builds/{appName}/ folder
    const appBuildsPath = path.join(app.getAppPath(), 'app-builds');
    const safeName = this.config.safeName || this.templateManager.generateSafeName(this.config.appName);
    const appOutputPath = path.join(appBuildsPath, safeName);
    
    // Ensure the app-builds folder exists
    await fs.ensureDir(appOutputPath);
    
    this.installerFiles = [];
    this.appOutputPath = appOutputPath;
    
    if (await fs.pathExists(distPath)) {
      const files = await fs.readdir(distPath);
      this.log(`Build output: ${files.length} files in dist folder`);
      
      // Find installer files (.exe, .dmg, .AppImage, .deb)
      const installerExtensions = ['.exe', '.dmg', '.AppImage', '.deb', '.rpm'];
      
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (installerExtensions.includes(ext)) {
          const sourcePath = path.join(distPath, file);
          const destPath = path.join(appOutputPath, file);
          
          try {
            // Copy to app-builds folder
            await fs.copy(sourcePath, destPath, { overwrite: true });
            this.installerFiles.push({
              name: file,
              path: destPath,
              size: (await fs.stat(destPath)).size
            });
            this.log(`✓ Saved: ${file}`);
          } catch (error) {
            this.log(`Warning: Could not copy ${file}: ${error.message}`);
          }
        }
      }
      
      if (this.installerFiles.length === 0) {
        this.log('Warning: No installer files found in build output');
      } else {
        this.log(`${this.installerFiles.length} installer(s) saved to: ${appOutputPath}`);
      }
    } else {
      this.log('Warning: dist folder not found');
    }
  }

  /**
   * Get installer files that were created
   * @returns {Array} Array of installer file info
   */
  getInstallerFiles() {
    return this.installerFiles || [];
  }

  /**
   * Get output path
   * @returns {string} Output path (app-builds folder)
   */
  getOutputPath() {
    return this.appOutputPath || path.join(this.workspacePath, 'dist');
  }

  /**
   * Cancel the build process
   */
  cancel() {
    this.cancelled = true;
    this.status = 'cancelled';
    
    if (this.childProcess) {
      this.childProcess.kill('SIGTERM');
    }
    
    this.log('Build cancelled by user');
    this.emit('cancelled');
  }

  /**
   * Get current build status
   * @returns {Object} Status object
   */
  getStatus() {
    return {
      status: this.status,
      progress: this.progress,
      currentStep: this.currentStep,
      duration: this.startTime ? Date.now() - this.startTime : 0
    };
  }

  /**
   * Log message and emit event
   * @param {string} message - Log message
   */
  log(message) {
    logger.debug(message);
    this.emit('log', message);
  }

  /**
   * Save build to history
   * @param {Object} result - Build result
   */
  async saveToHistory(result) {
    try {
      const historyPath = path.join(app.getPath('userData'), 'build-history.json');
      let history = [];
      
      if (await fs.pathExists(historyPath)) {
        history = await fs.readJson(historyPath);
      }

      history.unshift({
        timestamp: new Date().toISOString(),
        appName: this.config.appName,
        url: this.config.url,
        outputPath: result.outputPath,
        duration: result.duration,
        success: result.success
      });

      // Keep only last 50 builds
      history = history.slice(0, 50);

      await fs.writeJson(historyPath, history, { spaces: 2 });
    } catch (error) {
      logger.warn('Failed to save build history', { error: error.message });
    }
  }

  /**
   * Get build history
   * @returns {Promise<Array>} Build history
   */
  static async getHistory() {
    try {
      const historyPath = path.join(app.getPath('userData'), 'build-history.json');
      
      if (await fs.pathExists(historyPath)) {
        return await fs.readJson(historyPath);
      }
      
      return [];
    } catch (error) {
      logger.warn('Failed to read build history', { error: error.message });
      return [];
    }
  }

  /**
   * Clear build history
   */
  static async clearHistory() {
    try {
      const historyPath = path.join(app.getPath('userData'), 'build-history.json');
      await fs.writeJson(historyPath, [], { spaces: 2 });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = BuildOrchestrator;
