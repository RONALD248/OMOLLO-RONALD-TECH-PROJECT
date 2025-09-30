// Enhanced Text-to-Speech Module
window.speechModule = {
    isInitialized: false,
    isPlaying: false,
    isPaused: false,
    currentUtterance: null,

    init() {
        try {
            this.setupEventListeners();
            this.checkBrowserSupport();
            this.isInitialized = true;
            console.log('🎵 Speech module initialized');
        } catch (error) {
            console.error('Speech module init error:', error);
        }
    },

    setupEventListeners() {
        // Voice selection
        const voiceSelect = document.getElementById('voiceSelect');
        if (voiceSelect) {
            voiceSelect.addEventListener('change', (e) => {
                this.setVoice(parseInt(e.target.value));
            });
        }

        // Load voices when available
        if ('speechSynthesis' in window) {
            speechSynthesis.onvoiceschanged = () => {
                this.populateVoiceList();
            };
            
            // Initial population
            setTimeout(() => this.populateVoiceList(), 1000);
        }
    },

    populateVoiceList() {
        if (!('speechSynthesis' in window)) return;

        const voices = speechSynthesis.getVoices();
        const voiceSelect = document.getElementById('voiceSelect');
        
        if (!voiceSelect || voices.length === 0) return;

        // Clear existing options except the first one
        while (voiceSelect.options.length > 1) {
            voiceSelect.remove(1);
        }

        // Add available voices
        voices.forEach((voice, index) => {
            // Filter for English voices or keep all
            if (voice.lang.includes('en') || voices.length < 5) {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${voice.name} (${voice.lang})`;
                voiceSelect.appendChild(option);
            }
        });

        // Update status
        this.updateSpeechStatus(`✅ ${voices.length} voices available`);
    },

    setVoice(voiceIndex) {
        this.voiceIndex = voiceIndex;
    },

    play() {
        const text = document.getElementById('inputText').value.trim();
        
        if (!text) {
            app.showNotification('Please enter some text to read aloud', 'warning');
            return;
        }

        if (text.length > 5000) {
            app.showNotification('Text too long for speech synthesis', 'warning');
            return;
        }

        try {
            if (this.isPaused && this.currentUtterance) {
                // Resume paused speech
                speechSynthesis.resume();
                this.isPlaying = true;
                this.isPaused = false;
                this.updatePlaybackButtons();
                app.showNotification('Resumed speaking', 'info');
                return;
            }

            // Stop any current speech
            this.stop();

            // Create new utterance
            this.currentUtterance = new SpeechSynthesisUtterance(text);
            
            // Configure voice
            if (this.voiceIndex !== undefined) {
                const voices = speechSynthesis.getVoices();
                if (voices[this.voiceIndex]) {
                    this.currentUtterance.voice = voices[this.voiceIndex];
                }
            }

            // Configure settings
            const speed = parseFloat(document.getElementById('speechSpeed').value) || 1;
            this.currentUtterance.rate = speed;
            this.currentUtterance.pitch = 1;
            this.currentUtterance.volume = 1;

            // Event handlers
            this.currentUtterance.onstart = () => {
                this.isPlaying = true;
                this.isPaused = false;
                this.updatePlaybackButtons();
                this.updateSpeechStatus('🔊 Speaking...');
                app.showNotification('Started speaking', 'info');
            };

            this.currentUtterance.onend = () => {
                this.isPlaying = false;
                this.isPaused = false;
                this.updatePlaybackButtons();
                this.updateSpeechStatus('✅ Speech completed');
                app.showNotification('Finished speaking', 'success');
                this.currentUtterance = null;
            };

            this.currentUtterance.onerror = (event) => {
                console.error('Speech error:', event);
                this.isPlaying = false;
                this.isPaused = false;
                this.updatePlaybackButtons();
                this.updateSpeechStatus('❌ Speech error');
                app.showNotification('Speech synthesis error', 'error');
                this.currentUtterance = null;
            };

            this.currentUtterance.onpause = () => {
                this.isPaused = true;
                this.isPlaying = false;
                this.updatePlaybackButtons();
                this.updateSpeechStatus('⏸️ Speech paused');
            };

            // Start speaking
            speechSynthesis.speak(this.currentUtterance);

        } catch (error) {
            console.error('Speech play error:', error);
            app.showNotification('Speech synthesis failed', 'error');
            this.fallbackTTS(text);
        }
    },

    pause() {
        if (this.isPlaying && speechSynthesis.speaking) {
            speechSynthesis.pause();
            this.isPlaying = false;
            this.isPaused = true;
            this.updatePlaybackButtons();
            app.showNotification('Speech paused', 'info');
        }
    },

    stop() {
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
            this.isPlaying = false;
            this.isPaused = false;
            this.updatePlaybackButtons();
            this.updateSpeechStatus('⏹️ Speech stopped');
            this.currentUtterance = null;
        }
    },

    updatePlaybackButtons() {
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');

        if (playBtn) {
            if (this.isPaused) {
                playBtn.innerHTML = '<span class="btn-icon">▶️</span> Resume';
            } else {
                playBtn.innerHTML = '<span class="btn-icon">▶️</span> Play';
            }
        }

        if (pauseBtn) {
            pauseBtn.disabled = !this.isPlaying;
        }

        if (stopBtn) {
            stopBtn.disabled = !this.isPlaying && !this.isPaused;
        }
    },

    updateSpeechStatus(message) {
        const statusElement = document.getElementById('speechStatus');
        if (statusElement) {
            statusElement.textContent = message;
        }
    },

    checkBrowserSupport() {
        if (!('speechSynthesis' in window)) {
            this.updateSpeechStatus('❌ Not supported');
            app.showNotification('Text-to-speech not supported in this browser', 'warning');
            return false;
        }
        return true;
    },

    fallbackTTS(text) {
        // Simple fallback using Web Audio API (very basic)
        app.showNotification('Using fallback speech method', 'info');
        
        try {
            // This is a very basic fallback - in a real app you'd use a proper TTS service
            const utterance = new SpeechSynthesisUtterance(text.substring(0, 1000));
            speechSynthesis.speak(utterance);
        } catch (fallbackError) {
            console.error('Fallback TTS failed:', fallbackError);
            app.showNotification('Speech synthesis completely unavailable', 'error');
        }
    },

    // Public methods
    getVoices() {
        return speechSynthesis.getVoices();
    },

    isSupported() {
        return 'speechSynthesis' in window;
    }
};