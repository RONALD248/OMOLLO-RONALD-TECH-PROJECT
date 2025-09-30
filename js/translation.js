// Enhanced Translation Module
window.translationModule = {
    isInitialized: false,
    supportedLanguages: {
        'es': { name: 'Spanish', flag: '🇪🇸' },
        'fr': { name: 'French', flag: '🇫🇷' },
        'de': { name: 'German', flag: '🇩🇪' },
        'it': { name: 'Italian', flag: '🇮🇹' },
        'pt': { name: 'Portuguese', flag: '🇵🇹' },
        'ru': { name: 'Russian', flag: '🇷🇺' },
        'ja': { name: 'Japanese', flag: '🇯🇵' },
        'ko': { name: 'Korean', flag: '🇰🇷' },
        'zh': { name: 'Chinese', flag: '🇨🇳' },
        'ar': { name: 'Arabic', flag: '🇸🇦' },
        'hi': { name: 'Hindi', flag: '🇮🇳' },
        'sw': { name: 'Swahili', flag: '🇹🇿' }
    },

    init() {
        try {
            this.setupEventListeners();
            this.populateLanguageSelect();
            this.isInitialized = true;
            console.log('🌐 Translation module initialized');
            this.updateTranslateStatus('✅ Ready to translate');
        } catch (error) {
            console.error('Translation module init error:', error);
        }
    },

    setupEventListeners() {
        // Language selection
        const targetLang = document.getElementById('targetLang');
        if (targetLang) {
            targetLang.addEventListener('change', () => {
                this.updateTargetLanguage();
            });
        }
    },

    populateLanguageSelect() {
        const targetLang = document.getElementById('targetLang');
        if (!targetLang) return;

        // Clear existing options
        targetLang.innerHTML = '';

        // Add language options
        Object.entries(this.supportedLanguages).forEach(([code, info]) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = `${info.flag} ${info.name}`;
            targetLang.appendChild(option);
        });
    },

    updateTargetLanguage() {
        const targetLang = document.getElementById('targetLang');
        const language = this.supportedLanguages[targetLang.value];
        if (language) {
            this.updateTranslateStatus(`🌐 Target: ${language.name}`);
        }
    },

    async translate() {
        const text = document.getElementById('inputText').value.trim();
        
        if (!text) {
            app.showNotification('Please enter some text to translate', 'warning');
            return;
        }

        if (text.length > 2000) {
            app.showNotification('Text too long for translation. Please use shorter text.', 'warning');
            return;
        }

        const targetLang = document.getElementById('targetLang').value;
        const language = this.supportedLanguages[targetLang];

        if (!language) {
            app.showNotification('Invalid language selected', 'error');
            return;
        }

        app.showProgress(true, `Translating to ${language.name}...`);

        try {
            // Try multiple translation APIs with fallbacks
            const translatedText = await this.tryTranslationAPIs(text, targetLang, language);
            
            app.showOutput(
                translatedText,
                `Translation to ${language.name}`,
                'translation'
            );
            
            app.showNotification(`Successfully translated to ${language.name}`, 'success');
            
        } catch (error) {
            console.error('Translation error:', error);
            this.showFallbackTranslation(text, targetLang, language);
        } finally {
            app.showProgress(false);
        }
    },

    async tryTranslationAPIs(text, targetLang, language) {
        // Try MyMemory API first
        try {
            const result = await this.translateWithMyMemory(text, targetLang);
            if (result && result.trim().length > 0) {
                return result;
            }
            throw new Error('Empty response');
        } catch (error) {
            console.log('MyMemory API failed, trying LibreTranslate...');
        }

        // Try LibreTranslate as fallback
        try {
            const result = await this.translateWithLibreTranslate(text, targetLang);
            if (result && result.trim().length > 0) {
                return result;
            }
            throw new Error('Empty response');
        } catch (error) {
            console.log('LibreTranslate failed, using demo translation...');
            throw error; // Trigger fallback
        }
    },

    async translateWithMyMemory(text, targetLang) {
        const response = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.responseStatus === 200 && data.responseData.translatedText) {
            return data.responseData.translatedText;
        } else {
            throw new Error('Translation failed');
        }
    },

    async translateWithLibreTranslate(text, targetLang) {
        const response = await fetch('https://libretranslate.de/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: text,
                source: 'en',
                target: targetLang,
                format: 'text'
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.translatedText) {
            return data.translatedText;
        } else {
            throw new Error('No translation received');
        }
    },

    showFallbackTranslation(text, targetLang, language) {
        // Create realistic demo translations
        const demoTranslations = {
            'es': `[ESPAÑOL] ${text}\n\n*Esta es una traducción de demostración. En una implementación real, se utilizaría un servicio de traducción profesional.*`,
            'fr': `[FRANÇAIS] ${text}\n\n*Ceci est une traduction de démonstration. Dans une implémentation réelle, un service de traduction professionnel serait utilisé.*`,
            'de': `[DEUTSCH] ${text}\n\n*Dies ist eine Demo-Übersetzung. In einer echten Implementierung würde ein professioneller Übersetzungsdienst verwendet werden.*`,
            'it': `[ITALIANO] ${text}\n\n*Questa è una traduzione dimostrativa. In un'implementazione reale, verrebbe utilizzato un servizio di traduzione professionale.*`,
            'pt': `[PORTUGUÊS] ${text}\n\n*Esta é uma tradução demonstrativa. Em uma implementação real, um serviço de tradução profissional seria usado.*`,
            'sw': `[KISWAHILI] ${text}\n\n*Huu ni tafsiri ya onyesho. Katika utekelezaji halisi, huduma ya kitaalamu ya tafsiri ingetumika.*`
        };

        const demoText = demoTranslations[targetLang] || 
            `[${language.name.toUpperCase()}] ${text}\n\n*This is a demo translation. In a real implementation, a professional translation service would be used.*`;

        app.showOutput(
            demoText,
            `Translation to ${language.name} (Demo)`,
            'translation'
        );
        
        app.showNotification(`Demo translation shown - API services might be busy`, 'info');
    },

    updateTranslateStatus(message) {
        const statusElement = document.getElementById('translateStatus');
        if (statusElement) {
            statusElement.textContent = message;
        }
    },

    // Utility methods
    getLanguageName(code) {
        return this.supportedLanguages[code]?.name || code;
    },

    getLanguageFlag(code) {
        return this.supportedLanguages[code]?.flag || '🌐';
    },

    detectLanguage(text) {
        // Simple language detection (basic implementation)
        const commonWords = {
            'en': ['the', 'and', 'is', 'in', 'to', 'of'],
            'es': ['el', 'la', 'de', 'que', 'y', 'en'],
            'fr': ['le', 'la', 'de', 'et', 'à', 'dans']
        };

        let maxMatches = 0;
        let detectedLang = 'en';

        Object.entries(commonWords).forEach(([lang, words]) => {
            const matches = words.filter(word => 
                text.toLowerCase().includes(word)
            ).length;
            
            if (matches > maxMatches) {
                maxMatches = matches;
                detectedLang = lang;
            }
        });

        return detectedLang;
    }
};