/**
 * Icon Processor
 * Handles icon validation, resizing, and format conversion
 * 
 * FEATURES:
 * - Accepts ANY image format (PNG, JPG, JPEG, GIF, WebP, AVIF, TIFF, BMP, ICO, SVG)
 * - Accepts ANY resolution (auto-scales and crops to required sizes)
 * - Auto-converts all images to proper PNG/ICO format for each platform
 */

const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

// Note: Sharp is required for full icon processing
let sharp = null;
try {
  sharp = require('sharp');
} catch (error) {
  logger.warn('Sharp not available, icon processing will be limited');
}

// png-to-ico for proper Windows ICO generation
let pngToIco = null;
try {
  pngToIco = require('png-to-ico');
} catch (error) {
  logger.warn('png-to-ico not available, ICO generation may not work properly');
}

class IconProcessor {
  constructor() {
    // Icon sizes required for each platform
    this.iconSizes = {
      windows: [16, 24, 32, 48, 64, 128, 256],
      macos: [16, 32, 64, 128, 256, 512, 1024],
      linux: [16, 24, 32, 48, 64, 128, 256, 512]
    };

    // All image formats that Sharp can read
    this.sharpReadableFormats = ['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'tiff', 'tif', 'svg'];
    
    // Common image extensions (accept anything)
    this.allImageExtensions = [
      'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'tiff', 'tif', 
      'bmp', 'ico', 'svg', 'heic', 'heif', 'raw'
    ];
    
    this.maxFileSize = 50 * 1024 * 1024; // 50MB - very generous
  }

  /**
   * Check if format can be processed by Sharp
   * @param {string} ext - File extension
   * @returns {boolean}
   */
  canProcessFormat(ext) {
    return this.sharpReadableFormats.includes(ext.toLowerCase());
  }

  /**
   * Check if file looks like an image based on extension or magic bytes
   * @param {string} filePath - Path to file
   * @returns {Promise<boolean>}
   */
  async isImageFile(filePath) {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    
    // First check by extension
    if (this.allImageExtensions.includes(ext)) {
      return true;
    }

    // Try to read as image with Sharp
    if (sharp) {
      try {
        await sharp(filePath).metadata();
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }

  /**
   * Validate icon file - now accepts ANY image
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

      // Check file size
      const stats = await fs.stat(iconPath);
      if (stats.size > this.maxFileSize) {
        return { 
          valid: false, 
          error: `File too large. Maximum size is 50MB` 
        };
      }

      // Check if it's actually an image
      const isImage = await this.isImageFile(iconPath);
      if (!isImage) {
        return { 
          valid: false, 
          error: 'File does not appear to be a valid image' 
        };
      }

      const ext = path.extname(iconPath).toLowerCase().slice(1);
      const isIco = ext === 'ico';
      
      // Get image dimensions if possible
      let dimensions = { width: 0, height: 0 };
      let format = ext;
      
      if (sharp && this.canProcessFormat(ext)) {
        try {
          const metadata = await sharp(iconPath).metadata();
          dimensions = { width: metadata.width || 0, height: metadata.height || 0 };
          format = metadata.format || ext;
          logger.info('Image metadata read successfully', { dimensions, format });
        } catch (error) {
          logger.warn('Could not read image metadata, will try to process anyway', { error: error.message });
        }
      } else if (isIco) {
        // ICO files - we'll just copy them
        logger.info('ICO file detected - will be copied directly');
        dimensions = { width: 256, height: 256 }; // Assume standard
      }

      // No size restrictions - we'll auto-scale everything
      if (dimensions.width > 0 && dimensions.height > 0) {
        if (dimensions.width < 16 || dimensions.height < 16) {
          logger.warn('Image is very small, quality may be poor when scaled up', dimensions);
        }
        if (dimensions.width !== dimensions.height) {
          logger.info('Image is not square, will be cropped to center', dimensions);
        }
      }

      return { 
        valid: true, 
        info: {
          path: iconPath,
          format,
          size: stats.size,
          dimensions,
          isIco,
          needsProcessing: !isIco
        }
      };
    } catch (error) {
      logger.error('Icon validation error', { error: error.message });
      return { valid: false, error: error.message };
    }
  }

  /**
   * Process icon for all platforms - accepts ANY image and converts automatically
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

      const ext = path.extname(sourcePath).toLowerCase().slice(1);
      const isIco = ext === 'ico';

      // Handle ICO files - just copy them directly for Windows
      if (isIco) {
        logger.info('Processing ICO file - copying directly');
        
        const icoPath = path.join(buildDir, 'icon.ico');
        await fs.copy(sourcePath, icoPath);
        results.windows = icoPath;
        results.main = icoPath;
        results.macos = icoPath;
        results.linux = icoPath;
        
        logger.info('ICO file copied successfully');
        return results;
      }

      // Process with Sharp if available
      if (sharp) {
        const mainIconPath = path.join(buildDir, 'icon.png');
        
        try {
          // Read and process the image
          // Use 'cover' fit to ensure square output, centered crop
          await sharp(sourcePath)
            .resize(1024, 1024, { 
              fit: 'cover',
              position: 'center'
            })
            .png({ quality: 100 })
            .toFile(mainIconPath);
          results.main = mainIconPath;
          
          logger.info('Main icon created (1024x1024)');

          // Generate icon set for all sizes
          const allSizes = [...new Set([
            ...this.iconSizes.windows,
            ...this.iconSizes.macos,
            ...this.iconSizes.linux
          ])].sort((a, b) => a - b);

          for (const size of allSizes) {
            const iconPath = path.join(iconSetDir, `icon-${size}.png`);
            await sharp(sourcePath)
              .resize(size, size, { 
                fit: 'cover',
                position: 'center'
              })
              .png({ quality: 100 })
              .toFile(iconPath);
            results.iconSet.push({ size, path: iconPath });
          }
          
          logger.info(`Generated ${results.iconSet.length} icon sizes`);

          // Generate Windows ICO using png-to-ico for proper ICO format
          const icoPath = path.join(buildDir, 'icon.ico');
          
          if (pngToIco) {
            try {
              // Create multiple PNG sizes for the ICO file (16, 32, 48, 64, 128, 256)
              const icoSizes = [16, 32, 48, 64, 128, 256];
              const pngBuffers = [];
              
              for (const size of icoSizes) {
                const pngBuffer = await sharp(sourcePath)
                  .resize(size, size, { 
                    fit: 'cover',
                    position: 'center'
                  })
                  .png({ quality: 100 })
                  .toBuffer();
                pngBuffers.push(pngBuffer);
              }
              
              // Convert PNGs to ICO
              const icoBuffer = await pngToIco(pngBuffers);
              await fs.writeFile(icoPath, icoBuffer);
              
              logger.info('Windows ICO created with png-to-ico', { sizes: icoSizes });
            } catch (icoError) {
              logger.warn('png-to-ico failed, falling back to 256x256 PNG', { error: icoError.message });
              // Fallback: create a 256x256 PNG (electron-builder may handle it)
              await sharp(sourcePath)
                .resize(256, 256, { 
                  fit: 'cover',
                  position: 'center'
                })
                .png({ quality: 100 })
                .toFile(icoPath);
            }
          } else {
            // Without png-to-ico, create a 256x256 PNG with .ico extension
            // Note: This may not work with all versions of electron-builder
            logger.warn('png-to-ico not available, creating PNG with .ico extension');
            await sharp(sourcePath)
              .resize(256, 256, { 
                fit: 'cover',
                position: 'center'
              })
              .png({ quality: 100 })
              .toFile(icoPath);
          }
          
          results.windows = icoPath;

          // For macOS - electron-builder will convert PNG to ICNS
          results.macos = mainIconPath;

          // Linux uses PNG
          results.linux = mainIconPath;

          logger.info('Icon processing complete', { 
            sizes: results.iconSet.length,
            platforms: ['windows', 'macos', 'linux']
          });
          
        } catch (sharpError) {
          logger.error('Sharp processing failed', { error: sharpError.message });
          // Fallback: just copy the file
          throw sharpError;
        }

      } else {
        // Without Sharp, just copy the original file
        const destPath = path.join(buildDir, 'icon.png');
        await fs.copy(sourcePath, destPath);
        results.main = destPath;
        results.windows = destPath;
        results.macos = destPath;
        results.linux = destPath;
        
        logger.warn('Sharp not available, copied original icon without processing');
      }

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
    logger.debug('Generating default icon', { output: outputPath, appName });

    // Generate a simple colored square with first letter
    const initial = appName.charAt(0).toUpperCase();
    const size = 1024;
    
    // Generate a color based on app name
    const hue = this.stringToHue(appName);
    const color = `hsl(${hue}, 70%, 50%)`;

    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:hsl(${hue}, 70%, 55%);stop-opacity:1" />
            <stop offset="100%" style="stop-color:hsl(${hue}, 70%, 40%);stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)" rx="180"/>
        <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" 
              fill="white" font-family="Arial, sans-serif" font-size="500" font-weight="bold"
              style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));">
          ${initial}
        </text>
      </svg>
    `;

    if (sharp) {
      try {
        await sharp(Buffer.from(svg))
          .resize(size, size)
          .png({ quality: 100 })
          .toFile(outputPath);
        
        logger.info('Default icon generated', { path: outputPath });
        return outputPath;
      } catch (error) {
        logger.error('Failed to generate default icon with Sharp', { error: error.message });
      }
    }

    // Fallback: save SVG directly
    const svgPath = outputPath.replace('.png', '.svg');
    await fs.writeFile(svgPath, svg.trim());
    logger.info('Default SVG icon generated', { path: svgPath });
    return svgPath;
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

  /**
   * Get information about what formats are supported
   * @returns {Object} Support information
   */
  getSupportInfo() {
    return {
      hasSharp: !!sharp,
      supportedFormats: this.allImageExtensions,
      processableFormats: this.sharpReadableFormats,
      maxFileSize: this.maxFileSize,
      outputSizes: {
        windows: this.iconSizes.windows,
        macos: this.iconSizes.macos,
        linux: this.iconSizes.linux
      }
    };
  }
}

module.exports = IconProcessor;
