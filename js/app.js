// Main Application Controller - Enhanced & Error-Free
class InclusiveHubApp {
    constructor() {
        this.currentTheme = 'light';
        this.isInitialized = false;
        this.textStats = {
            characters: 0,
            words: 0,
            sentences: 0
        };
        this.lastOutput = '';
        this.outputType = '';
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        try {
            this.setupEventListeners();
            this.initializeModules();
            this.updateTextStats();
            this.hideLoadingScreen();
            this.loadVoices();
            
            this.isInitialized = true;
            console.log('🚀 Inclusive Hub App Initialized Successfully');
            this.showNotification('App loaded successfully!', 'success');
        } catch (error) {
            console.error('Initialization error:', error);
            this.showNotification('App initialization failed', 'error');
        }
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Input text monitoring
        document.getElementById('inputText').addEventListener('input', () => {
            this.updateTextStats();
            this.validateInput();
        });

        // Clear input
        document.getElementById('clearInput').addEventListener('click', () => this.clearInput());
        
        // Sample text
        document.getElementById('sampleText').addEventListener('click', () => this.loadSampleText());
        
        // Paste text
        document.getElementById('pasteText').addEventListener('click', () => this.pasteText());
        
        // Output actions
        document.getElementById('copyOutput').addEventListener('click', () => this.copyOutput());
        document.getElementById('downloadOutput').addEventListener('click', () => this.downloadOutput());
        document.getElementById('clearOutput').addEventListener('click', () => this.clearOutput());

        // Speech speed control
        const speedSlider = document.getElementById('speechSpeed');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                document.getElementById('speedValue').textContent = `${e.target.value}x`;
            });
        }

        // Tool buttons
        document.getElementById('playBtn').addEventListener('click', () => this.handlePlay());
        document.getElementById('pauseBtn').addEventListener('click', () => this.handlePause());
        document.getElementById('stopBtn').addEventListener('click', () => this.handleStop());
        document.getElementById('translateBtn').addEventListener('click', () => this.handleTranslate());
        document.getElementById('simplifyBtn').addEventListener('click', () => this.handleSimplify());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    initializeModules() {
        // Initialize speech module
        if (window.speechModule) {
            window.speechModule.init();
        } else {
            console.warn('Speech module not found');
        }

        // Initialize translation module
        if (window.translationModule) {
            window.translationModule.init();
        } else {
            console.warn('Translation module not found');
        }

        // Initialize simplification module
        if (window.simplificationModule) {
            window.simplificationModule.init();
        } else {
            console.warn('Simplification module not found');
        }
    }

    updateTextStats() {
        try {
            const text = document.getElementById('inputText').value;
            
            this.textStats = {
                characters: text.length,
                words: text.trim() ? text.trim().split(/\s+/).length : 0,
                sentences: text.trim() ? text.split(/[.!?]+/).filter(s => s.trim().length > 0).length : 0
            };

            // Update UI
            document.getElementById('charCount').textContent = this.textStats.characters.toLocaleString();
            document.getElementById('wordCount').textContent = this.textStats.words.toLocaleString();
            document.getElementById('sentenceCount').textContent = this.textStats.sentences.toLocaleString();
        } catch (error) {
            console.error('Error updating text stats:', error);
        }
    }

    validateInput() {
        const text = document.getElementById('inputText').value;
        const maxChars = 5000;
        
        if (text.length > maxChars) {
            this.showNotification('Text exceeds character limit. Please shorten your text.', 'warning');
            document.getElementById('inputText').style.borderColor = 'var(--error-color)';
        } else {
            document.getElementById('inputText').style.borderColor = '';
        }
    }

    loadVoices() {
        // Load available voices for speech synthesis
        if ('speechSynthesis' in window) {
            const voices = speechSynthesis.getVoices();
            const voiceSelect = document.getElementById('voiceSelect');
            
            if (voiceSelect && voices.length > 0) {
                voiceSelect.innerHTML = '';
                voices.forEach((voice, index) => {
                    const option = document.createElement('option');
                    option.value = index;
                    option.textContent = `${voice.name} (${voice.lang})`;
                    voiceSelect.appendChild(option);
                });
            }
            
            // Re-load voices when they become available
            speechSynthesis.onvoiceschanged = () => {
                const updatedVoices = speechSynthesis.getVoices();
                if (voiceSelect && updatedVoices.length > 0) {
                    voiceSelect.innerHTML = '';
                    updatedVoices.forEach((voice, index) => {
                        const option = document.createElement('option');
                        option.value = index;
                        option.textContent = `${voice.name} (${voice.lang})`;
                        voiceSelect.appendChild(option);
                    });
                }
            };
        }
    }

    toggleTheme() {
        const themes = ['light', 'dark', 'high-contrast'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        
        this.currentTheme = themes[nextIndex];
        document.body.setAttribute('data-theme', this.currentTheme);
        
        // Update theme toggle icon
        const themeIcons = ['🌙', '☀️', '⚫'];
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = themeIcons[nextIndex];
        }
        
        this.showNotification(`Switched to ${this.currentTheme} theme`, 'success');
        
        // Save theme preference
        localStorage.setItem('preferred-theme', this.currentTheme);
    }

    clearInput() {
        document.getElementById('inputText').value = '';
        this.updateTextStats();
        this.showNotification('Input cleared', 'success');
    }

    loadSampleText() {
        const sampleText = `Education is the most powerful weapon which you can use to change the world. Quality education should be accessible to everyone, regardless of their abilities, language, or learning preferences.

This tool demonstrates how technology can bridge educational gaps by providing multiple ways to access and understand learning materials. Students with visual impairments can listen to text, those who speak different languages can get translations, and anyone struggling with complex content can get simplified versions.

The United Nations Sustainable Development Goal 4 aims to ensure inclusive and equitable quality education and promote lifelong learning opportunities for all. This means addressing barriers like disability, language differences, and learning difficulties.`;
        
        document.getElementById('inputText').value = sampleText;
        this.updateTextStats();
        this.showNotification('Sample text loaded', 'success');
    }

    async pasteText() {
        try {
            if (!navigator.clipboard) {
                throw new Error('Clipboard API not supported');
            }
            
            const text = await navigator.clipboard.readText();
            if (text) {
                document.getElementById('inputText').value = text;
                this.updateTextStats();
                this.showNotification('Text pasted from clipboard', 'success');
            }
        } catch (error) {
            console.warn('Clipboard access failed:', error);
            this.showNotification('Please paste using Ctrl+V', 'info');
        }
    }

    showOutput(content, title, type = 'info') {
        try {
            // Hide placeholder
            const placeholder = document.getElementById('outputPlaceholder');
            const outputContent = document.getElementById('outputContent');
            
            if (placeholder) placeholder.classList.add('hidden');
            if (outputContent) {
                outputContent.classList.remove('hidden');
                outputContent.classList.add('fade-in');
            }
            
            // Set output content
            document.getElementById('outputTitle').textContent = title;
            document.getElementById('outputType').textContent = type.charAt(0).toUpperCase() + type.slice(1);
            document.getElementById('outputText').textContent = content;
            
            // Update time
            const now = new Date();
            document.getElementById('outputTime').textContent = now.toLocaleTimeString();
            
            // Store for copy/download
            this.lastOutput = content;
            this.outputType = type;
            
            // Add highlight animation
            const outputText = document.getElementById('outputText');
            outputText.classList.add('highlight');
            setTimeout(() => outputText.classList.remove('highlight'), 2000);
            
            // Update container styling
            const outputContainer = document.querySelector('.output-container');
            outputContainer.classList.add('has-content');
            
        } catch (error) {
            console.error('Error showing output:', error);
            this.showNotification('Error displaying output', 'error');
        }
    }

    async copyOutput() {
        if (!this.lastOutput) {
            this.showNotification('No content to copy', 'warning');
            return;
        }

        try {
            await navigator.clipboard.writeText(this.lastOutput);
            this.showNotification('Content copied to clipboard!', 'success');
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = this.lastOutput;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('Content copied to clipboard!', 'success');
        }
    }

    downloadOutput() {
        if (!this.lastOutput) {
            this.showNotification('No content to download', 'warning');
            return;
        }

        try {
            const blob = new Blob([this.lastOutput], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `accessible-content-${new Date().getTime()}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            this.showNotification('Content downloaded!', 'success');
        } catch (error) {
            console.error('Download error:', error);
            this.showNotification('Download failed', 'error');
        }
    }

    clearOutput() {
        const placeholder = document.getElementById('outputPlaceholder');
        const outputContent = document.getElementById('outputContent');
        const outputContainer = document.querySelector('.output-container');
        
        if (placeholder) placeholder.classList.remove('hidden');
        if (outputContent) outputContent.classList.add('hidden');
        if (outputContainer) outputContainer.classList.remove('has-content');
        
        this.lastOutput = '';
        this.outputType = '';
        this.showNotification('Output cleared', 'info');
    }

    showNotification(message, type = 'info', duration = 4000) {
        try {
            const container = document.getElementById('notificationContainer');
            if (!container) return;

            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.innerHTML = `
                <div class="notification-icon">${this.getNotificationIcon(type)}</div>
                <div class="notification-content">
                    <div class="notification-message">${message}</div>
                </div>
                <button class="notification-close" onclick="this.parentElement.remove()">×</button>
            `;

            container.appendChild(notification);

            // Auto-remove after duration
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.classList.add('fade-out');
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        } catch (error) {
            console.error('Notification error:', error);
        }
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    showProgress(show = true, text = 'Processing...') {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        if (progressBar) {
            progressBar.classList.toggle('hidden', !show);
        }
        if (progressText) {
            progressText.textContent = text;
        }
    }

    updateProgress(percentage) {
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
    }

    // Tool handlers
    handlePlay() {
        if (window.speechModule) {
            window.speechModule.play();
        }
    }

    handlePause() {
        if (window.speechModule) {
            window.speechModule.pause();
        }
    }

    handleStop() {
        if (window.speechModule) {
            window.speechModule.stop();
        }
    }

    handleTranslate() {
        if (window.translationModule) {
            window.translationModule.translate();
        }
    }

    handleSimplify() {
        if (window.simplificationModule) {
            window.simplificationModule.simplify();
        }
    }

    handleKeyboardShortcuts(e) {
        // Ctrl+Enter to translate
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            this.handleTranslate();
        }
        
        // Ctrl+Space to play/pause speech
        if (e.ctrlKey && e.key === ' ') {
            e.preventDefault();
            if (window.speechModule && window.speechModule.isPlaying) {
                this.handlePause();
            } else {
                this.handlePlay();
            }
        }
    }
}

// Initialize the application
let app;

try {
    app = new InclusiveHubApp();
    window.app = app; // Make available globally for debugging
} catch (error) {
    console.error('Failed to initialize app:', error);
    // Fallback: Show error message to user
    document.addEventListener('DOMContentLoaded', () => {
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            background: #ef4444;
            color: white;
            padding: 1rem;
            text-align: center;
            z-index: 10000;
        `;
        container.textContent = 'Error loading application. Please refresh the page.';
        document.body.appendChild(container);
    });
}