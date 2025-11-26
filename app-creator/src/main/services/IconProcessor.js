/**
 * Icon Processor
 * Handles icon validation, resizing, and format conversion
 */

const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

// Note: Sharp is optional for icon processing
// If not available, basic validation will still work
let sharp = null;
try {
  sharp = require('sharp');
} catch (error) {
  logger.warn('Sharp not available, icon processing will be limited');
}

class IconProcessor {
  constructor() {
    // Icon sizes required for each platform
    this.iconSizes = {
      windows: [16, 24, 32, 48, 64, 128, 256],
      macos: [16, 32, 64, 128, 256, 512, 1024],
      linux: [16, 24, 32, 48, 64, 128, 256, 512]
    };

    this.supportedFormats = ['png', 'jpg', 'jpeg', 'ico'];
    this.minSize = 512;
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
  }

  /**
   * Validate icon file
   * @param {string} iconPath - Path to icon file
   * @returns {Promise<Object>} Validation result
   */
  async validate(iconPath) {
    logger.debug('Validating icon', { path: iconPath });

    try {
      // Check if file exists
      if (!await fs.pathExists(iconPath)) {
        return { valid: false, error: 'Icon file not found' };
      }

      // Check file extension
      const ext = path.extname(iconPath).toLowerCase().slice(1);
      if (!this.supportedFormats.includes(ext)) {
        return { 
          valid: false, 
          error: `Unsupported format: ${ext}. Use PNG, JPG, or ICO` 
        };
      }

      // Check file size
      const stats = await fs.stat(iconPath);
      if (stats.size > this.maxFileSize) {
        return { 
          valid: false, 
          error: `File too large. Maximum size is 5MB` 
        };
      }

      // Get image dimensions if sharp is available
      let dimensions = { width: 0, height: 0 };
      if (sharp) {
        try {
          const metadata = await sharp(iconPath).metadata();
          dimensions = { width: metadata.width, height: metadata.height };

          // Check minimum size
          if (dimensions.width < this.minSize || dimensions.height < this.minSize) {
            return { 
              valid: false, 
              error: `Icon must be at least ${this.minSize}x${this.minSize} pixels. Current: ${dimensions.width}x${dimensions.height}` 
            };
          }

          // Warn if not square
          if (dimensions.width !== dimensions.height) {
            logger.warn('Icon is not square, it will be cropped', dimensions);
          }
        } catch (error) {
          logger.warn('Could not read image metadata', { error: error.message });
        }
      }

      return { 
        valid: true, 
        info: {
          path: iconPath,
          format: ext,
          size: stats.size,
          dimensions
        }
      };
    } catch (error) {
      logger.error('Icon validation error', { error: error.message });
      return { valid: false, error: error.message };
    }
  }

  /**
   * Process icon for all platforms
   * @param {string} sourcePath - Source icon path
   * @param {string} outputDir - Output directory for processed icons
   * @returns {Promise<Object>} Processing result
   */
  async process(sourcePath, outputDir) {
    logger.info('Processing icon', { source: sourcePath, output: outputDir });

    try {
      // Validate source icon
      const validation = await this.validate(sourcePath);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Ensure output directory exists
      const buildDir = path.join(outputDir, 'build');
      const iconSetDir = path.join(buildDir, 'icons');
      await fs.ensureDir(iconSetDir);

      const results = {
        main: null,
        windows: null,
        macos: null,
        linux: null,
        iconSet: []
      };

      // Copy original icon as main
      const mainIconPath = path.join(buildDir, 'icon.png');
      
      if (sharp) {
        // Resize and convert to PNG if needed
        await sharp(sourcePath)
          .resize(1024, 1024, { fit: 'cover' })
          .png()
          .toFile(mainIconPath);
        results.main = mainIconPath;

        // Generate icon set for all sizes
        const allSizes = [...new Set([
          ...this.iconSizes.windows,
          ...this.iconSizes.macos,
          ...this.iconSizes.linux
        ])].sort((a, b) => a - b);

        for (const size of allSizes) {
          const iconPath = path.join(iconSetDir, `icon-${size}.png`);
          await sharp(sourcePath)
            .resize(size, size, { fit: 'cover' })
            .png()
            .toFile(iconPath);
          results.iconSet.push({ size, path: iconPath });
        }

        // Generate Windows ICO (using 256x256 PNG as base)
        const icoPath = path.join(buildDir, 'icon.ico');
        await sharp(sourcePath)
          .resize(256, 256, { fit: 'cover' })
          .toFile(icoPath);
        results.windows = icoPath;

        // For macOS, we'll use the PNG (electron-builder will convert to ICNS)
        results.macos = mainIconPath;

        // Linux uses PNG
        results.linux = mainIconPath;

      } else {
        // Without sharp, just copy the original file
        await fs.copy(sourcePath, mainIconPath);
        results.main = mainIconPath;
        results.windows = mainIconPath;
        results.macos = mainIconPath;
        results.linux = mainIconPath;
        
        logger.warn('Sharp not available, using original icon without processing');
      }

      logger.info('Icon processing complete', { icons: results.iconSet.length });
      return results;
    } catch (error) {
      logger.error('Icon processing failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate default placeholder icon
   * @param {string} outputPath - Path to save default icon
   * @param {string} appName - Application name for text
   * @returns {Promise<string>} Path to generated icon
   */
  async generateDefaultIcon(outputPath, appName = 'App') {
    logger.debug('Generating default icon', { output: outputPath });

    if (!sharp) {
      // Create a simple SVG fallback
      const svgIcon = this.createSvgIcon(appName);
      await fs.writeFile(outputPath, svgIcon);
      return outputPath;
    }

    try {
      // Generate a simple colored square with first letter
      const initial = appName.charAt(0).toUpperCase();
      const size = 1024;
      
      // Generate a random color based on app name
      const hue = this.stringToHue(appName);
      const color = `hsl(${hue}, 70%, 50%)`;

      const svg = `
        <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="${color}" rx="200"/>
          <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" 
                fill="white" font-family="Arial, sans-serif" font-size="500" font-weight="bold">
            ${initial}
          </text>
        </svg>
      `;

      await sharp(Buffer.from(svg))
        .resize(size, size)
        .png()
        .toFile(outputPath);

      return outputPath;
    } catch (error) {
      logger.error('Failed to generate default icon', { error: error.message });
      throw error;
    }
  }

  /**
   * Create SVG icon string
   * @param {string} appName - App name
   * @returns {string} SVG content
   */
  createSvgIcon(appName) {
    const initial = appName.charAt(0).toUpperCase();
    const hue = this.stringToHue(appName);
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="hsl(${hue}, 70%, 50%)" rx="100"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" 
        fill="white" font-family="Arial, sans-serif" font-size="280" font-weight="bold">
    ${initial}
  </text>
</svg>`;
  }

  /**
   * Convert string to hue value for consistent colors
   * @param {string} str - Input string
   * @returns {number} Hue value (0-360)
   */
  stringToHue(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 360;
  }
}

module.exports = IconProcessor;
