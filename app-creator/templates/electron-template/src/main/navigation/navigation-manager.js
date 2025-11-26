/**
 * Navigation Manager
 * Handles navigation events, external links, and URL filtering
 */

const { shell } = require('electron');
const logger = require('../utils/logger');

class NavigationManager {
  constructor(config) {
    this.config = config;
    this.targetHost = null;
    
    // Extract host from target URL
    try {
      const targetUrl = new URL(this.config.target.url);
      this.targetHost = targetUrl.hostname;
    } catch (error) {
      logger.error('Invalid target URL', { url: this.config.target.url });
    }
  }

  /**
   * Attach navigation handlers to a window
   * @param {BrowserWindow} window - The window to attach handlers to
   */
  attach(window) {
    // Handle new window requests (e.g., target="_blank")
    window.webContents.setWindowOpenHandler(({ url }) => {
      return this.handleNewWindow(url);
    });

    // Handle navigation attempts
    window.webContents.on('will-navigate', (event, url) => {
      this.handleNavigation(event, url, window);
    });

    // Handle frame navigation
    window.webContents.on('will-frame-navigate', (event) => {
      // Allow frame navigation by default
    });

    // Handle redirects
    window.webContents.on('will-redirect', (event, url) => {
      this.handleRedirect(event, url);
    });

    // Handle did-navigate (after navigation completes)
    window.webContents.on('did-navigate', (event, url) => {
      logger.info('Navigation completed', { url });
    });

    // Handle navigation errors
    window.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      logger.error('Navigation failed', { 
        errorCode, 
        errorDescription, 
        url: validatedURL 
      });
    });

    // Handle certificate errors
    window.webContents.on('certificate-error', (event, url, error, certificate, callback) => {
      logger.warn('Certificate error', { url, error });
      // In production, you might want to handle this differently
      // For now, we deny invalid certificates
      callback(false);
    });
  }

  /**
   * Handle new window open requests
   * @param {string} url - URL to open
   * @returns {Object} Action to take
   */
  handleNewWindow(url) {
    logger.info('New window requested', { url });

    if (this.shouldOpenExternally(url)) {
      // Open in default browser
      shell.openExternal(url).catch((error) => {
        logger.error('Failed to open external URL', { url, error: error.message });
      });
      return { action: 'deny' };
    }

    // Allow opening in a new window within the app
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        width: this.config.window.width,
        height: this.config.window.height,
        webPreferences: {
          contextIsolation: this.config.features.contextIsolation,
          nodeIntegration: this.config.features.nodeIntegration,
          sandbox: this.config.features.sandbox
        }
      }
    };
  }

  /**
   * Handle navigation attempts
   * @param {Event} event - Navigation event
   * @param {string} url - Target URL
   * @param {BrowserWindow} window - The browser window
   */
  handleNavigation(event, url, window) {
    logger.debug('Navigation attempt', { url });

    if (this.shouldOpenExternally(url)) {
      event.preventDefault();
      shell.openExternal(url).catch((error) => {
        logger.error('Failed to open external URL', { url, error: error.message });
      });
    }
  }

  /**
   * Handle redirect attempts
   * @param {Event} event - Redirect event
   * @param {string} url - Target URL
   */
  handleRedirect(event, url) {
    logger.debug('Redirect attempt', { url });

    if (this.shouldOpenExternally(url)) {
      event.preventDefault();
      shell.openExternal(url).catch((error) => {
        logger.error('Failed to open external URL', { url, error: error.message });
      });
    }
  }

  /**
   * Determine if URL should open externally
   * @param {string} url - URL to check
   * @returns {boolean} True if should open externally
   */
  shouldOpenExternally(url) {
    // If external link opening is disabled, never open externally
    if (!this.config.navigation.openExternalLinksInBrowser) {
      return false;
    }

    try {
      const urlObj = new URL(url);

      // Always open non-http(s) protocols externally
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        // Handle mailto:, tel:, etc.
        return true;
      }

      // Check if URL matches target host
      if (urlObj.hostname === this.targetHost) {
        return false;
      }

      // Check if URL is in allowed domains
      const allowedDomains = this.config.navigation.allowedDomains || [];
      for (const domain of allowedDomains) {
        if (this.matchesDomain(urlObj.hostname, domain)) {
          return false;
        }
      }

      // Check internal URL patterns
      const internalPatterns = this.config.navigation.internalUrlPatterns || [];
      for (const pattern of internalPatterns) {
        if (this.matchesPattern(url, pattern)) {
          return false;
        }
      }

      // URL is external
      return true;
    } catch (error) {
      logger.error('Error parsing URL', { url, error: error.message });
      // If we can't parse the URL, treat it as external for safety
      return true;
    }
  }

  /**
   * Check if hostname matches domain pattern
   * @param {string} hostname - Hostname to check
   * @param {string} pattern - Domain pattern (e.g., "example.com" or "*.example.com")
   * @returns {boolean} True if matches
   */
  matchesDomain(hostname, pattern) {
    // Handle wildcard patterns like *.example.com
    if (pattern.startsWith('*.')) {
      const baseDomain = pattern.substring(2);
      return hostname === baseDomain || hostname.endsWith('.' + baseDomain);
    }
    
    // Exact match
    return hostname === pattern;
  }

  /**
   * Check if URL matches pattern
   * @param {string} url - URL to check
   * @param {string} pattern - URL pattern (can include wildcards)
   * @returns {boolean} True if matches
   */
  matchesPattern(url, pattern) {
    // Convert pattern to regex
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
      .replace(/\*/g, '.*'); // Convert wildcards
    
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(url);
  }

  /**
   * Check if URL is valid
   * @param {string} url - URL to validate
   * @returns {boolean} True if valid
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = NavigationManager;
