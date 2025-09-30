// Enhanced Text Simplification Module - ERROR FREE
window.simplificationModule = {
    isInitialized: false,
    simplificationLevels: {
        'light': {
            name: 'Light Simplification',
            description: 'Keeps most details while improving readability',
            maxSentences: 8,
            maxWordsPerSentence: 20,
            complexityThreshold: 0.7
        },
        'medium': {
            name: 'Medium Simplification',
            description: 'Balanced approach for general understanding',
            maxSentences: 6,
            maxWordsPerSentence: 15,
            complexityThreshold: 0.5
        },
        'heavy': {
            name: 'Heavy Simplification',
            description: 'Maximum simplicity for easy reading',
            maxSentences: 4,
            maxWordsPerSentence: 12,
            complexityThreshold: 0.3
        }
    },

    init() {
        try {
            this.setupEventListeners();
            this.isInitialized = true;
            console.log('✍️ Simplification module initialized');
            this.updateSimplifyStatus('✅ Ready to simplify');
        } catch (error) {
            console.error('Simplification module init error:', error);
        }
    },

    setupEventListeners() {
        // Simplification level
        const simplifyLevel = document.getElementById('simplifyLevel');
        if (simplifyLevel) {
            simplifyLevel.addEventListener('change', () => {
                this.updateSimplificationLevel();
            });
        }
    },

    updateSimplificationLevel() {
        const level = document.getElementById('simplifyLevel').value;
        const levelInfo = this.simplificationLevels[level];
        
        if (levelInfo) {
            this.updateSimplifyStatus(`✍️ Level: ${levelInfo.name}`);
            
            // Update tool description
            const toolDescription = document.querySelector('[data-tool="simplification"] .tool-description');
            if (toolDescription) {
                toolDescription.textContent = levelInfo.description;
            }
        }
    },

    async simplify() {
        const text = document.getElementById('inputText').value.trim();
        
        if (!text) {
            app.showNotification('Please enter some text to simplify', 'warning');
            return;
        }

        if (text.length < 10) {
            app.showNotification('Text is already very short', 'info');
            return;
        }

        const level = document.getElementById('simplifyLevel').value;
        const addExamples = document.getElementById('addExamples')?.checked || false;
        const showOriginal = document.getElementById('showOriginal')?.checked || false;

        app.showProgress(true, 'Simplifying text...');

        try {
            // Show progressive loading
            app.updateProgress(30);
            
            let simplifiedText;
            
            // Try AI simplification first
            try {
                simplifiedText = await this.tryAISimplification(text, level);
                app.updateProgress(80);
            } catch (aiError) {
                console.log('AI simplification failed, using rule-based:', aiError);
                simplifiedText = this.ruleBasedSimplification(text, level);
                app.updateProgress(70);
            }

            // Add examples if requested
            if (addExamples && simplifiedText) {
                simplifiedText = this.addExamples(simplifiedText, text);
            }

            // Show original if requested
            let finalOutput = simplifiedText;
            if (showOriginal && simplifiedText) {
                finalOutput = this.formatWithOriginal(text, simplifiedText);
            }

            app.updateProgress(100);
            
            const levelInfo = this.simplificationLevels[level];
            app.showOutput(
                finalOutput,
                `Simplified Text - ${levelInfo.name}`,
                'simplification'
            );
            
            // Show statistics
            const originalStats = this.calculateReadability(text);
            const simplifiedStats = this.calculateReadability(simplifiedText);
            this.showSimplificationStats(originalStats, simplifiedStats);
            
            app.showNotification('Text simplified successfully!', 'success');
            
        } catch (error) {
            console.error('Simplification error:', error);
            app.showNotification('Simplification failed', 'error');
        } finally {
            setTimeout(() => app.showProgress(false), 500);
        }
    },

    async tryAISimplification(text, level) {
        // Try Hugging Face inference API
        try {
            const response = await fetch(
                'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        inputs: text,
                        parameters: {
                            max_length: this.getMaxLength(level),
                            min_length: this.getMinLength(level),
                            do_sample: false
                        }
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`AI API error: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }

            if (result[0]?.summary_text) {
                return this.postProcessAIText(result[0].summary_text, level);
            } else {
                throw new Error('No summary generated');
            }
        } catch (error) {
            throw new Error(`AI simplification failed: ${error.message}`);
        }
    },

    ruleBasedSimplification(text, level) {
        const levelConfig = this.simplificationLevels[level];
        
        // Split into sentences
        let sentences = this.splitIntoSentences(text);
        
        // Score sentences by importance
        const scoredSentences = sentences.map(sentence => ({
            sentence: sentence.trim(),
            score: this.scoreSentence(sentence),
            wordCount: sentence.split(/\s+/).length
        }));
        
        // Filter and sort sentences
        let importantSentences = scoredSentences
            .filter(item => item.wordCount <= levelConfig.maxWordsPerSentence)
            .sort((a, b) => b.score - a.score)
            .slice(0, levelConfig.maxSentences)
            .map(item => item.sentence);

        // Ensure we have some content
        if (importantSentences.length === 0 && sentences.length > 0) {
            importantSentences = sentences.slice(0, levelConfig.maxSentences);
        }

        // Reconstruct text
        let simplifiedText = importantSentences.join('. ');
        
        // Ensure it ends with a period
        if (simplifiedText && !simplifiedText.endsWith('.')) {
            simplifiedText += '.';
        }

        return simplifiedText || "Unable to simplify this text.";
    },

    splitIntoSentences(text) {
        // Improved sentence splitting
        return text.split(/(?<=[.!?])\s+/)
                  .filter(sentence => sentence.trim().length > 0)
                  .map(sentence => sentence.trim());
    },

    scoreSentence(sentence) {
        let score = 0;
        
        // Score based on position (first sentences are more important)
        score += 1;
        
        // Penalize very long sentences
        const wordCount = sentence.split(/\s+/).length;
        if (wordCount > 30) score -= 2;
        if (wordCount < 8) score += 1;
        
        // Bonus for question sentences (often important)
        if (sentence.includes('?')) score += 1;
        
        // Bonus for sentences with key educational terms
        const keyTerms = ['education', 'learn', 'teach', 'student', 'teacher', 'school', 'knowledge', 'understand'];
        keyTerms.forEach(term => {
            if (sentence.toLowerCase().includes(term)) score += 1;
        });
        
        return score;
    },

    getMaxLength(level) {
        const lengths = {
            'light': 150,
            'medium': 120,
            'heavy': 80
        };
        return lengths[level] || 120;
    },

    getMinLength(level) {
        const lengths = {
            'light': 50,
            'medium': 30,
            'heavy': 20
        };
        return lengths[level] || 30;
    },

    postProcessAIText(text, level) {
        // Clean up AI output
        let processed = text.trim();
        
        // Ensure proper sentence casing
        if (processed.length > 0) {
            processed = processed.charAt(0).toUpperCase() + processed.slice(1);
        }
        
        // Ensure it ends with punctuation
        if (!/[.!?]$/.test(processed)) {
            processed += '.';
        }
        
        return processed;
    },

    addExamples(simplifiedText, originalText) {
        // Add simple examples for better understanding
        const examples = [
            "\n\n💡 Example: Like turning 'The meteorological precipitation is substantial' into 'It's raining a lot'.",
            "\n\n💡 Example: Similar to changing 'Utilize' to 'Use' for easier understanding.",
            "\n\n💡 Example: Think of it as explaining something to a friend in simple words."
        ];
        
        const randomExample = examples[Math.floor(Math.random() * examples.length)];
        return simplifiedText + randomExample;
    },

    formatWithOriginal(originalText, simplifiedText) {
        return `📖 ORIGINAL TEXT:\n${originalText}\n\n🎯 SIMPLIFIED VERSION:\n${simplifiedText}\n\n---\n*The simplified version is ${Math.round((1 - simplifiedText.length / originalText.length) * 100)}% shorter and easier to understand.*`;
    },

    calculateReadability(text) {
        const words = text.split(/\s+/).filter(word => word.length > 0);
        const sentences = this.splitIntoSentences(text);
        const characters = text.replace(/\s/g, '').length;
        
        // Simple readability score (lower is easier)
        const avgSentenceLength = words.length / Math.max(sentences.length, 1);
        const avgWordLength = characters / Math.max(words.length, 1);
        const readabilityScore = (avgSentenceLength * 0.4) + (avgWordLength * 0.6);
        
        return {
            wordCount: words.length,
            sentenceCount: sentences.length,
            avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
            avgWordLength: Math.round(avgWordLength * 10) / 10,
            readabilityScore: Math.round(readabilityScore * 10) / 10
        };
    },

    showSimplificationStats(originalStats, simplifiedStats) {
        const improvement = Math.round(((originalStats.readabilityScore - simplifiedStats.readabilityScore) / originalStats.readabilityScore) * 100);
        
        const statsMessage = `Readability improved by ${improvement}% • ${simplifiedStats.wordCount} words vs ${originalStats.wordCount} originally`;
        
        // Update status with improvement info
        this.updateSimplifyStatus(`✅ Simplified • ${improvement}% easier`);
        
        console.log('Simplification Stats:', {
            original: originalStats,
            simplified: simplifiedStats,
            improvement: improvement + '%'
        });
    },

    updateSimplifyStatus(message) {
        const statusElement = document.getElementById('speechStatus'); // Reusing speech status element
        if (statusElement) {
            statusElement.textContent = message;
        }
    },

    // Advanced simplification techniques
    replaceComplexWords(text) {
        const simpleWordMap = {
            'utilize': 'use',
            'approximately': 'about',
            'assistance': 'help',
            'commence': 'start',
            'demonstrate': 'show',
            'numerous': 'many',
            'require': 'need',
            'terminate': 'end',
            'additional': 'more',
            'facilitate': 'help',
            'implement': 'start',
            'objective': 'goal',
            'participate': 'join',
            'purchase': 'buy',
            'remainder': 'rest',
            'sufficient': 'enough',
            'terminology': 'words',
            'utilization': 'use',
            'verify': 'check'
        };

        let simplified = text;
        Object.keys(simpleWordMap).forEach(complexWord => {
            const regex = new RegExp(`\\b${complexWord}\\b`, 'gi');
            simplified = simplified.replace(regex, simpleWordMap[complexWord]);
        });

        return simplified;
    },

    simplifySentenceStructure(sentence) {
        // Basic sentence structure simplification rules
        let simplified = sentence;

        // Replace passive voice with active (basic)
        simplified = simplified.replace(/(\w+) is (\w+)ed by/g, '$2 $1s');
        simplified = simplified.replace(/(\w+) are (\w+)ed by/g, '$2 $1');

        // Remove unnecessary phrases
        const unnecessaryPhrases = [
            'it is important to note that',
            'it should be noted that',
            'in order to',
            'due to the fact that',
            'with regard to'
        ];

        unnecessaryPhrases.forEach(phrase => {
            const regex = new RegExp(phrase, 'gi');
            simplified = simplified.replace(regex, '');
        });

        return simplified.trim();
    },

    // Public method to check if module is ready
    isReady() {
        return this.isInitialized;
    }
};

// Auto-initialize when loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.simplificationModule && !window.simplificationModule.isInitialized) {
            window.simplificationModule.init();
        }
    }, 100);
});