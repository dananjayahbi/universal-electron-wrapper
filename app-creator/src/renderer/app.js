/**
 * App Creator - Renderer Application Logic
 */

// State
const state = {
  currentStep: 1,
  totalSteps: 4,
  config: {
    url: '',
    appName: '',
    iconPath: null,
    window: {
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      resizable: true,
      frame: true,
      alwaysOnTop: false
    },
    platforms: {
      windows: { enabled: true },
      macos: { enabled: false },
      linux: { enabled: false }
    },
    advanced: {
      devTools: false,
      autoUpdate: false
    }
  },
  validation: {
    url: false,
    appName: false
  },
  building: false,
  buildResult: null
};

// DOM Elements
const elements = {
  steps: document.querySelectorAll('.step'),
  stepContents: document.querySelectorAll('.step-content'),
  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn'),
  // Step 1
  urlInput: document.getElementById('url'),
  urlValidation: document.getElementById('url-validation'),
  appNameInput: document.getElementById('appName'),
  nameValidation: document.getElementById('name-validation'),
  iconUploadArea: document.getElementById('iconUploadArea'),
  iconPreview: document.getElementById('iconPreview'),
  clearIconBtn: document.getElementById('clearIconBtn'),
  iconValidation: document.getElementById('icon-validation'),
  // Step 2
  windowWidth: document.getElementById('windowWidth'),
  windowHeight: document.getElementById('windowHeight'),
  minWidth: document.getElementById('minWidth'),
  minHeight: document.getElementById('minHeight'),
  resizable: document.getElementById('resizable'),
  frame: document.getElementById('frame'),
  alwaysOnTop: document.getElementById('alwaysOnTop'),
  // Step 3
  platformCards: document.querySelectorAll('.platform-card'),
  devTools: document.getElementById('devTools'),
  autoUpdate: document.getElementById('autoUpdate'),
  // Step 4
  buildSummary: document.getElementById('buildSummary'),
  buildProgress: document.getElementById('buildProgress'),
  buildResult: document.getElementById('buildResult'),
  startBuildBtn: document.getElementById('startBuildBtn'),
  cancelBuildBtn: document.getElementById('cancelBuildBtn'),
  progressFill: document.getElementById('progressFill'),
  buildPercentage: document.getElementById('buildPercentage'),
  currentStepEl: document.getElementById('currentStep'),
  consoleContent: document.getElementById('consoleContent'),
  buildStatus: document.getElementById('buildStatus'),
  resultIcon: document.getElementById('resultIcon'),
  resultTitle: document.getElementById('resultTitle'),
  resultMessage: document.getElementById('resultMessage'),
  outputPath: document.getElementById('outputPath'),
  buildTime: document.getElementById('buildTime'),
  openOutputBtn: document.getElementById('openOutputBtn'),
  createAnotherBtn: document.getElementById('createAnotherBtn')
};

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
  setupEventListeners();
  updateUI();
  loadDefaults();
}

function loadDefaults() {
  // Load default config if available
  if (window.electronAPI) {
    window.electronAPI.getDefaults().then(defaults => {
      if (defaults) {
        state.config = { ...state.config, ...defaults };
        updateFormFromState();
      }
    });
  }
}

function setupEventListeners() {
  // Navigation
  elements.prevBtn.addEventListener('click', prevStep);
  elements.nextBtn.addEventListener('click', nextStep);

  // Step indicators
  elements.steps.forEach(step => {
    step.addEventListener('click', () => {
      const stepNum = parseInt(step.dataset.step);
      if (canGoToStep(stepNum)) {
        goToStep(stepNum);
      }
    });
  });

  // Step 1: URL and App Name validation
  elements.urlInput.addEventListener('input', debounce(validateUrl, 500));
  elements.urlInput.addEventListener('blur', validateUrl);
  elements.appNameInput.addEventListener('input', debounce(validateAppName, 500));
  elements.appNameInput.addEventListener('blur', validateAppName);

  // Icon upload
  elements.iconUploadArea.addEventListener('click', selectIcon);
  elements.clearIconBtn.addEventListener('click', clearIcon);

  // Step 2: Window settings
  elements.windowWidth.addEventListener('change', updateWindowConfig);
  elements.windowHeight.addEventListener('change', updateWindowConfig);
  elements.minWidth.addEventListener('change', updateWindowConfig);
  elements.minHeight.addEventListener('change', updateWindowConfig);
  elements.resizable.addEventListener('change', updateWindowConfig);
  elements.frame.addEventListener('change', updateWindowConfig);
  elements.alwaysOnTop.addEventListener('change', updateWindowConfig);

  // Step 3: Platform selection
  elements.platformCards.forEach(card => {
    card.addEventListener('click', () => togglePlatform(card.dataset.platform));
  });
  elements.devTools.addEventListener('change', updateAdvancedConfig);
  elements.autoUpdate.addEventListener('change', updateAdvancedConfig);

  // Step 4: Build
  elements.startBuildBtn.addEventListener('click', startBuild);
  elements.cancelBuildBtn.addEventListener('click', cancelBuild);
  elements.openOutputBtn.addEventListener('click', openOutputFolder);
  elements.createAnotherBtn.addEventListener('click', resetApp);

  // Build events from main process
  if (window.electronAPI) {
    window.electronAPI.onBuildProgress(handleBuildProgress);
    window.electronAPI.onBuildLog(handleBuildLog);
    window.electronAPI.onBuildComplete(handleBuildComplete);
    window.electronAPI.onBuildError(handleBuildError);
  }
}

// Navigation
function canGoToStep(step) {
  if (step < state.currentStep) return true;
  if (step === state.currentStep + 1 && isCurrentStepValid()) return true;
  return false;
}

function isCurrentStepValid() {
  switch (state.currentStep) {
    case 1:
      return state.validation.url && state.validation.appName;
    case 2:
      return true; // Window settings always valid with defaults
    case 3:
      return Object.values(state.config.platforms).some(p => p.enabled);
    default:
      return true;
  }
}

function goToStep(step) {
  state.currentStep = step;
  updateUI();
  
  if (step === 4) {
    updateBuildSummary();
  }
}

function prevStep() {
  if (state.currentStep > 1) {
    goToStep(state.currentStep - 1);
  }
}

function nextStep() {
  if (state.currentStep < state.totalSteps && isCurrentStepValid()) {
    goToStep(state.currentStep + 1);
  }
}

function updateUI() {
  // Update step indicators
  elements.steps.forEach(step => {
    const stepNum = parseInt(step.dataset.step);
    step.classList.remove('active', 'completed');
    if (stepNum === state.currentStep) {
      step.classList.add('active');
    } else if (stepNum < state.currentStep) {
      step.classList.add('completed');
    }
  });

  // Update step content
  elements.stepContents.forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`step-${state.currentStep}`).classList.add('active');

  // Update navigation buttons
  elements.prevBtn.disabled = state.currentStep === 1;
  
  if (state.currentStep === state.totalSteps) {
    elements.nextBtn.style.display = 'none';
  } else {
    elements.nextBtn.style.display = 'block';
    elements.nextBtn.disabled = !isCurrentStepValid();
  }
}

// Validation
async function validateUrl() {
  const url = elements.urlInput.value.trim();
  state.config.url = url;

  if (!url) {
    setValidation(elements.urlInput, elements.urlValidation, false, 'URL is required');
    state.validation.url = false;
    updateUI();
    return;
  }

  if (window.electronAPI) {
    const result = await window.electronAPI.validateUrl(url);
    if (result.valid) {
      setValidation(elements.urlInput, elements.urlValidation, true, '✓ Valid URL');
      state.validation.url = true;
    } else {
      setValidation(elements.urlInput, elements.urlValidation, false, result.error);
      state.validation.url = false;
    }
  } else {
    // Fallback validation
    try {
      new URL(url);
      if (url.startsWith('http://') || url.startsWith('https://')) {
        setValidation(elements.urlInput, elements.urlValidation, true, '✓ Valid URL');
        state.validation.url = true;
      } else {
        throw new Error('Invalid protocol');
      }
    } catch {
      setValidation(elements.urlInput, elements.urlValidation, false, 'URL must start with http:// or https://');
      state.validation.url = false;
    }
  }
  updateUI();
}

async function validateAppName() {
  const name = elements.appNameInput.value.trim();
  state.config.appName = name;

  if (!name) {
    setValidation(elements.appNameInput, elements.nameValidation, false, 'App name is required');
    state.validation.appName = false;
    updateUI();
    return;
  }

  if (window.electronAPI) {
    const result = await window.electronAPI.validateName(name);
    if (result.valid) {
      setValidation(elements.appNameInput, elements.nameValidation, true, '✓ Valid name');
      state.config.safeName = result.safeName;
      state.validation.appName = true;
    } else {
      setValidation(elements.appNameInput, elements.nameValidation, false, result.error);
      state.validation.appName = false;
    }
  } else {
    // Fallback validation
    if (name.length >= 3 && name.length <= 50) {
      setValidation(elements.appNameInput, elements.nameValidation, true, '✓ Valid name');
      state.validation.appName = true;
    } else {
      setValidation(elements.appNameInput, elements.nameValidation, false, 'Name must be 3-50 characters');
      state.validation.appName = false;
    }
  }
  updateUI();
}

function setValidation(input, messageEl, valid, message) {
  input.classList.remove('valid', 'invalid');
  messageEl.classList.remove('success', 'error');
  
  if (valid) {
    input.classList.add('valid');
    messageEl.classList.add('success');
  } else {
    input.classList.add('invalid');
    messageEl.classList.add('error');
  }
  
  messageEl.textContent = message;
}

// Icon handling
async function selectIcon() {
  if (window.electronAPI) {
    const result = await window.electronAPI.selectIcon();
    if (result.success) {
      state.config.iconPath = result.path;
      updateIconPreview(result.path, result.info);
    } else if (result.error) {
      elements.iconValidation.textContent = result.error;
      elements.iconValidation.className = 'validation-message error';
    }
  }
}

function updateIconPreview(path, info) {
  elements.iconPreview.innerHTML = `
    <img src="file://${path}" alt="Icon Preview">
    <p>${info?.dimensions?.width || '?'}x${info?.dimensions?.height || '?'}</p>
  `;
  elements.iconUploadArea.classList.add('has-icon');
  elements.clearIconBtn.style.display = 'block';
  elements.iconValidation.textContent = '✓ Icon selected';
  elements.iconValidation.className = 'validation-message success';
}

function clearIcon() {
  state.config.iconPath = null;
  elements.iconPreview.innerHTML = `
    <span class="icon-placeholder">📁</span>
    <p>Click to select icon</p>
    <p class="hint">PNG, JPG, or ICO (512x512 minimum)</p>
  `;
  elements.iconUploadArea.classList.remove('has-icon');
  elements.clearIconBtn.style.display = 'none';
  elements.iconValidation.textContent = '';
}

// Window config
function updateWindowConfig() {
  state.config.window = {
    width: parseInt(elements.windowWidth.value) || 1200,
    height: parseInt(elements.windowHeight.value) || 800,
    minWidth: parseInt(elements.minWidth.value) || 800,
    minHeight: parseInt(elements.minHeight.value) || 600,
    resizable: elements.resizable.checked,
    frame: elements.frame.checked,
    alwaysOnTop: elements.alwaysOnTop.checked
  };
}

// Platform selection
function togglePlatform(platform) {
  state.config.platforms[platform].enabled = !state.config.platforms[platform].enabled;
  
  elements.platformCards.forEach(card => {
    const p = card.dataset.platform;
    card.classList.toggle('selected', state.config.platforms[p].enabled);
  });
  
  updateUI();
}

// Advanced config
function updateAdvancedConfig() {
  state.config.advanced = {
    devTools: elements.devTools.checked,
    autoUpdate: elements.autoUpdate.checked
  };
}

// Build summary
function updateBuildSummary() {
  document.getElementById('summaryName').textContent = state.config.appName || '-';
  document.getElementById('summaryUrl').textContent = state.config.url || '-';
  document.getElementById('summarySize').textContent = 
    `${state.config.window.width}x${state.config.window.height}`;
  
  const platforms = Object.entries(state.config.platforms)
    .filter(([_, p]) => p.enabled)
    .map(([name]) => name.charAt(0).toUpperCase() + name.slice(1))
    .join(', ');
  document.getElementById('summaryPlatform').textContent = platforms || '-';
}

// Build process
async function startBuild() {
  state.building = true;
  
  // Show progress, hide summary and result
  elements.buildSummary.style.display = 'none';
  elements.buildProgress.style.display = 'block';
  elements.buildResult.style.display = 'none';
  elements.consoleContent.innerHTML = '';
  elements.progressFill.style.width = '0%';
  elements.buildPercentage.textContent = '0%';
  elements.buildStatus.textContent = 'Starting build...';
  
  // Hide nav buttons during build
  document.querySelector('.nav-buttons').style.display = 'none';

  if (window.electronAPI) {
    try {
      const result = await window.electronAPI.startBuild(state.config);
      if (!result.success) {
        handleBuildError({ error: result.error });
      }
    } catch (error) {
      handleBuildError({ error: error.message });
    }
  } else {
    // Simulate build for testing
    simulateBuild();
  }
}

function handleBuildProgress(data) {
  elements.progressFill.style.width = `${data.progress}%`;
  elements.buildPercentage.textContent = `${data.progress}%`;
  elements.currentStepEl.textContent = data.step;
  elements.buildStatus.textContent = data.step;
}

function handleBuildLog(message) {
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.textContent = message;
  elements.consoleContent.appendChild(entry);
  elements.consoleContent.scrollTop = elements.consoleContent.scrollHeight;
}

function handleBuildComplete(result) {
  state.building = false;
  state.buildResult = result;
  
  elements.buildProgress.style.display = 'none';
  elements.buildResult.style.display = 'block';
  
  elements.resultIcon.className = 'result-icon success';
  elements.resultIcon.textContent = '✓';
  elements.resultTitle.textContent = 'Build Complete!';
  elements.resultMessage.textContent = 'Your application has been created successfully.';
  elements.outputPath.textContent = result.outputPath || '-';
  elements.buildTime.textContent = formatDuration(result.duration);
}

function handleBuildError(error) {
  state.building = false;
  
  elements.buildProgress.style.display = 'none';
  elements.buildResult.style.display = 'block';
  
  elements.resultIcon.className = 'result-icon error';
  elements.resultIcon.textContent = '✕';
  elements.resultTitle.textContent = 'Build Failed';
  elements.resultMessage.textContent = error.error || 'An error occurred during the build process.';
  elements.outputPath.textContent = '-';
  elements.buildTime.textContent = '-';
  
  document.querySelector('.nav-buttons').style.display = 'flex';
}

async function cancelBuild() {
  if (window.electronAPI) {
    await window.electronAPI.cancelBuild();
  }
  state.building = false;
  resetBuildUI();
}

function openOutputFolder() {
  if (state.buildResult?.outputPath && window.electronAPI) {
    window.electronAPI.openFolder(state.buildResult.outputPath);
  }
}

function resetApp() {
  state.currentStep = 1;
  state.validation = { url: false, appName: false };
  state.buildResult = null;
  
  // Reset form
  elements.urlInput.value = '';
  elements.appNameInput.value = '';
  clearIcon();
  
  resetBuildUI();
  updateUI();
  document.querySelector('.nav-buttons').style.display = 'flex';
}

function resetBuildUI() {
  elements.buildSummary.style.display = 'block';
  elements.buildProgress.style.display = 'none';
  elements.buildResult.style.display = 'none';
}

// Utilities
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function formatDuration(ms) {
  if (!ms) return '-';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function updateFormFromState() {
  elements.windowWidth.value = state.config.window.width;
  elements.windowHeight.value = state.config.window.height;
  elements.minWidth.value = state.config.window.minWidth;
  elements.minHeight.value = state.config.window.minHeight;
  elements.resizable.checked = state.config.window.resizable;
  elements.frame.checked = state.config.window.frame;
  elements.alwaysOnTop.checked = state.config.window.alwaysOnTop;
}

// Simulate build for testing without electron
function simulateBuild() {
  const steps = [
    { progress: 10, step: 'Preparing workspace...' },
    { progress: 25, step: 'Copying template files...' },
    { progress: 40, step: 'Applying configuration...' },
    { progress: 55, step: 'Processing icons...' },
    { progress: 75, step: 'Installing dependencies...' },
    { progress: 90, step: 'Building application...' },
    { progress: 100, step: 'Complete!' }
  ];

  let i = 0;
  const interval = setInterval(() => {
    if (i < steps.length) {
      handleBuildProgress(steps[i]);
      handleBuildLog(`[${new Date().toLocaleTimeString()}] ${steps[i].step}`);
      i++;
    } else {
      clearInterval(interval);
      handleBuildComplete({
        outputPath: 'C:\\Users\\...\\Documents\\ElectronApps\\my-app\\dist',
        duration: 45000
      });
    }
  }, 1000);
}
