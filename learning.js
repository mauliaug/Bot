/**
 * Learning System for AI Chat Interface
 * Provides context memory, sentiment analysis, response generation and learning capabilities
 */

// Learning system for AI chat
const learningSystem = {
    // Storage for learned patterns and responses
    knowledgeBase: {
        keywords: {},       // Maps keywords to relevant responses
        patterns: {},       // Common sentence patterns
        sentiments: {},     // Sentiment patterns and appropriate responses
        frequencies: {},    // Frequency of words/phrases
        customResponses: {} // User-defined custom responses for specific inputs
    },
    
    // Context memory storage
    contextMemory: {},
    
    // User preferences and stats
    userStats: {},
    
    // Initialize the learning system
    init() {
        this.loadFromStorage();
        console.log("Learning system initialized");
        return this;
    },
    
    // Generate a response based on user input and context
    generateResponse(message, context, personality) {
        // Extract intent and entities from the message
        const { intent, entities } = this.extractIntent(message);
        
        // Analyze sentiment
        const sentiment = this.analyzeSentiment(message);
        
        // Check for custom responses first
        const customResponse = this.getCustomResponse(message, intent);
        if (customResponse) return customResponse;
        
        // Process repeated questions
        if (this.isRepeatedQuestion(message, context.botId)) {
            return this.getPreviousResponse(message, context.botId);
        }
        
        // Generate contextual response based on intent
        let response = this.generateIntentResponse(intent, entities, context, sentiment, personality);
        
        // Learn from this interaction
        this.learnFromInteraction(message, response, intent, sentiment);
        
        return response;
    },
    
    // Extract intent and entities from a message
    extractIntent(message) {
        // Simple intent classification
        let intent = 'general';
        const entities = [];
        
        // Common intents detection
        if (message.match(/hai|halo|helo|hi|hello|hey/i)) {
            intent = 'greeting';
        } else if (message.match(/terima kasih|makasih|thx|thank/i)) {
            intent = 'thanks';
        } else if (message.match(/siapa|apa|mengapa|bagaimana|kapan|dimana|kemana|kenapa/i)) {
            intent = 'question';
        } else if (message.match(/bye|dadah|sampai jumpa|selamat tinggal/i)) {
            intent = 'farewell';
        } else if (message.match(/bantuan|help|tolong/i)) {
            intent = 'help';
        }
        
        // Extract entities (simple implementation)
        const words = message.split(/\s+/);
        const commonWords = ['saya', 'kamu', 'dia', 'mereka', 'kita', 'ini', 'itu', 'dan', 'atau', 'jika', 'maka'];
        
        words.forEach(word => {
            if (word.length > 3 && !commonWords.includes(word.toLowerCase())) {
                entities.push(word);
                
                // Store keyword for learning
                if (!this.knowledgeBase.keywords[word.toLowerCase()]) {
                    this.knowledgeBase.keywords[word.toLowerCase()] = {
                        count: 1,
                        lastSeen: new Date().toISOString()
                    };
                } else {
                    this.knowledgeBase.keywords[word.toLowerCase()].count++;
                    this.knowledgeBase.keywords[word.toLowerCase()].lastSeen = new Date().toISOString();
                }
            }
        });
        
        return { intent, entities };
    },
    
    // Analyze sentiment of a message
    analyzeSentiment(message) {
        // Simple sentiment analysis
        const positiveWords = ['senang', 'bahagia', 'suka', 'bagus', 'baik', 'hebat', 'keren'];
        const negativeWords = ['sedih', 'marah', 'kesal', 'buruk', 'jelek', 'payah', 'benci'];
        
        let score = 0;
        const words = message.toLowerCase().split(/\s+/);
        
        words.forEach(word => {
            if (positiveWords.includes(word)) score++;
            if (negativeWords.includes(word)) score--;
        });
        
        return {
            score,
            label: score > 0 ? 'positive' : (score < 0 ? 'negative' : 'neutral')
        };
    },
    
    // Generate response based on intent
    generateIntentResponse(intent, entities, context, sentiment, personality) {
        // Responses based on different personalities
        const personalityResponses = {
            friendly: {
                greeting: ["Halo! Senang bertemu dengan Anda!", "Hai! Apa kabar?", "Halo! Ada yang bisa saya bantu hari ini?"],
                thanks: ["Sama-sama! Senang bisa membantu.", "Dengan senang hati!", "Tidak masalah, kapanpun Anda butuh bantuan!"],
                question: ["Hmm, mari saya coba bantu Anda dengan itu.", "Pertanyaan bagus! Saya akan coba jawab.", "Mari kita cari tahu bersama!"],
                farewell: ["Sampai jumpa! Semoga harimu menyenangkan!", "Selamat tinggal! Senang bisa berbincang dengan Anda!", "Sampai ketemu lagi!"],
                help: ["Tentu, saya siap membantu! Apa yang Anda butuhkan?", "Saya di sini untuk membantu. Apa masalahnya?", "Mari saya bantu Anda!"],
                general: ["Menarik sekali! Ceritakan lebih banyak.", "Saya mengerti. Ada hal lain yang ingin dibahas?", "Hmm, saya paham maksud Anda."]
            },
            technical: {
                greeting: ["Halo. Sistem siap membantu.", "Selamat datang. Apa yang perlu diproses hari ini?", "Hai. Siap menerima input."],
                thanks: ["Konfirmasi: bantuan berhasil diberikan.", "Sama-sama. Efisiensi adalah prioritas.", "Terima kasih kembali. Apakah ada tugas lain?"],
                question: ["Menganalisis pertanyaan... ", "Mencari informasi yang relevan...", "Processing query..."],
                farewell: ["Menutup sesi. Terima kasih.", "Sesi berakhir. Sampai jumpa kembali.", "Logging out. Goodbye."],
                help: ["Menampilkan opsi bantuan. Silakan spesifikasikan kebutuhan.", "Help module activated. Apa yang perlu diatasi?", "Technical support ready."],
                general: ["Input diterima. Mohon elaborasi lebih lanjut.", "Data noted. Continuing analysis.", "Processing information..."]
            },
            enthusiastic: {
                greeting: ["HALO! Senang sekali bertemu dengan Anda hari ini!", "HEY! Apa kabar? Semoga hari Anda LUAR BIASA!", "HAII! Saya SANGAT senang bisa berbincang dengan Anda!"],
                thanks: ["Dengan SANGAT senang hati! Saya senang bisa membantu!", "WOWW! Terima kasih kembali!", "TENTU SAJA! Kapanpun Anda butuhkan!"],
                question: ["PERTANYAAN HEBAT! Mari kita cari jawabannya!", "WOW! Pertanyaan yang MENARIK! Saya akan jawab!", "KEREN! Mari kita bahas itu bersama!"],
                farewell: ["SAMPAI JUMPA LAGI! Semoga hari Anda SPEKTAKULER!", "BYE BYE! Jangan lupa untuk tersenyum hari ini!", "DADAH! Hari yang LUAR BIASA menanti Anda!"],
                help: ["TENTU! Saya SANGAT SENANG bisa membantu!", "WOW! Mari kita selesaikan masalah ini BERSAMA!", "SIAP MEMBANTU! Apa yang bisa saya lakukan?"],
                general: ["MENARIK SEKALI! Ceritakan lebih banyak!", "WOW! Itu KEREN! Ada hal lain?", "AWESOME! Saya sangat tertarik dengan apa yang Anda katakan!"]
            },
            caring: {
                greeting: ["Halo, bagaimana perasaan Anda hari ini?", "Selamat datang. Saya harap Anda baik-baik saja.", "Hai. Saya senang Anda ada di sini."],
                thanks: ["Sama-sama. Saya senang bisa membantu Anda.", "Tentu. Kesejahteraan Anda adalah prioritas saya.", "Tidak perlu berterima kasih. Saya peduli dengan Anda."],
                question: ["Pertanyaan yang baik. Mari kita cari jawaban yang tepat untuk Anda.", "Saya akan berusaha memberikan informasi terbaik untuk Anda.", "Mari kita bahas pertanyaan ini dengan hati-hati."],
                farewell: ["Sampai jumpa. Jaga kesehatan Anda.", "Selamat tinggal. Ingat untuk istirahat yang cukup.", "Sampai bertemu lagi. Saya akan selalu siap membantu Anda."],
                help: ["Saya di sini untuk Anda. Apa yang sedang Anda hadapi?", "Ceritakan masalah Anda. Saya akan mendengarkan.", "Saya siap membantu Anda. Apa yang Anda rasakan?"],
                general: ["Saya mengerti. Bagaimana perasaan Anda tentang hal itu?", "Terima kasih sudah berbagi. Bagaimana hal itu memengaruhi Anda?", "Saya mendengarkan. Apa yang Anda rasakan saat ini?"]
            },
            adventurous: {
                greeting: ["Halo petualang! Siap untuk petualangan baru?", "Selamat datang di dunia eksplorasi! Apa yang akan kita temukan hari ini?", "Hai! Mari mulai perjalanan kita!"],
                thanks: ["Sama-sama! Itu adalah bagian dari petualangan kita!", "Petualangan selalu lebih baik bersama!", "Tidak masalah! Itulah gunanya rekan perjalanan!"],
                question: ["Pertanyaan yang menarik untuk dijelajahi!", "Mari kita temukan jawabannya bersama!", "Ekspedisi pencarian jawaban dimulai!"],
                farewell: ["Sampai petualangan berikutnya! Jaga semangat!", "Selamat jalan! Jangan lupa membawa peta!", "Perjalanan kita akan berlanjut segera!"],
                help: ["Saya siap membantu menjelajahi masalah ini!", "Mari kita hadapi tantangan ini bersama!", "Setiap rintangan adalah petualangan!"],
                general: ["Sungguh perjalanan yang menarik!", "Teruskan eksplorasi Anda!", "Apa destinasi berikutnya dalam pikiran Anda?"]
            }
        };
        
        // Select response based on personality and intent
        const responses = personalityResponses[personality] || personalityResponses.friendly;
        const intentResponses = responses[intent] || responses.general;
        
        // Contextual response considering entities and previous conversation
        let responseText = this.getRandomItem(intentResponses);
        
        // Add entity-specific information if available
        if (entities.length > 0 && intent === 'question') {
            // Try to find relevant information about the entity
            const topEntity = entities[0];
            if (this.knowledgeBase.keywords[topEntity.toLowerCase()]) {
                const keywordInfo = this.knowledgeBase.keywords[topEntity.toLowerCase()];
                if (keywordInfo.responses && keywordInfo.responses.length > 0) {
                    // Use a learned response about this entity
                    const entityResponse = this.getRandomItem(keywordInfo.responses);
                    responseText = entityResponse;
                }
            }
        }
        
        // Adjust response based on sentiment
        if (sentiment.label === 'positive' && Math.random() > 0.5) {
            responseText += " Saya senang mendengar hal itu!";
        } else if (sentiment.label === 'negative' && Math.random() > 0.5) {
            responseText += " Saya harap saya bisa membantu.";
        }
        
        // Add context awareness occasionally
        if (context.recentTopics && context.recentTopics.length > 0 && Math.random() > 0.7) {
            const recentTopic = this.getRandomItem(context.recentTopics);
            responseText += ` Ngomong-ngomong, kita tadi membahas tentang ${recentTopic}, ya?`;
        }
        
        return responseText;
    },
    
    // Helper to get random item from array
    getRandomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    },
    
    // Check if question has been asked before
    isRepeatedQuestion(message, botId) {
        if (!this.contextMemory[botId]) return false;
        
        const simplifiedMsg = message.toLowerCase().trim();
        const history = this.contextMemory[botId].messageHistory || [];
        
        return history.some(item => {
            const similarity = this.calculateSimilarity(simplifiedMsg, item.message.toLowerCase());
            return similarity > 0.8; // 80% similarity threshold
        });
    },
    
    // Get previous response to similar question
    getPreviousResponse(message, botId) {
        if (!this.contextMemory[botId]) return null;
        
        const simplifiedMsg = message.toLowerCase().trim();
        const history = this.contextMemory[botId].messageHistory || [];
        
        let bestMatch = null;
        let highestSimilarity = 0;
        
        history.forEach(item => {
            const similarity = this.calculateSimilarity(simplifiedMsg, item.message.toLowerCase());
            if (similarity > highestSimilarity && similarity > 0.8) {
                highestSimilarity = similarity;
                bestMatch = item;
            }
        });
        
        return bestMatch ? bestMatch.response : null;
    },
    
    // Calculate text similarity (simple implementation)
    calculateSimilarity(text1, text2) {
        const words1 = text1.split(/\s+/);
        const words2 = text2.split(/\s+/);
        
        const set1 = new Set(words1);
        const set2 = new Set(words2);
        
        let intersection = 0;
        set1.forEach(word => {
            if (set2.has(word)) intersection++;
        });
        
        const union = set1.size + set2.size - intersection;
        return union === 0 ? 0 : intersection / union;
    },
    
    // Check for custom defined responses
    getCustomResponse(message, intent) {
        const lowerMsg = message.toLowerCase().trim();
        
        // Check exact matches first
        if (this.knowledgeBase.customResponses[lowerMsg]) {
            return this.knowledgeBase.customResponses[lowerMsg];
        }
        
        // Check partial matches
        for (const key in this.knowledgeBase.customResponses) {
            if (lowerMsg.includes(key)) {
                return this.knowledgeBase.customResponses[key];
            }
        }
        
        return null;
    },
    
    // Update context memory with new message
    updateContextMemory(message, botId, response) {
        if (!this.contextMemory[botId]) {
            this.contextMemory[botId] = {
                messageHistory: [],
                recentTopics: [],
                lastActive: new Date().toISOString()
            };
        }
        
        const context = this.contextMemory[botId];
        
        // Update message history
        context.messageHistory.push({
            message,
            response,
            timestamp: new Date().toISOString()
        });
        
        // Keep history manageable (last 20 messages)
        if (context.messageHistory.length > 20) {
            context.messageHistory.shift();
        }
        
        // Extract potential topics
        const words = message.split(/\s+/);
        const significantWords = words.filter(word => 
            word.length > 4 && !['adalah', 'dengan', 'untuk', 'yang', 'pada', 'dari'].includes(word.toLowerCase())
        );
        
        // Update recent topics
        if (significantWords.length > 0) {
            const newTopic = significantWords[Math.floor(Math.random() * significantWords.length)];
            context.recentTopics.unshift(newTopic);
            
            // Keep topics list manageable (last 5 topics)
            if (context.recentTopics.length > 5) {
                context.recentTopics.pop();
            }
        }
        
        // Update last active time
        context.lastActive = new Date().toISOString();
        
        this.saveToStorage();
    },
    
    // Get current context
    getContextMemory(botId) {
        return this.contextMemory[botId] || {
            messageHistory: [],
            recentTopics: [],
            lastActive: new Date().toISOString()
        };
    },
    
    // Learn from user interaction
    learnFromInteraction(message, response, intent, sentiment) {
        // Extract key terms from message
        const words = message.toLowerCase().split(/\s+/);
        const significantWords = words.filter(word => 
            word.length > 4 && !['adalah', 'dengan', 'untuk', 'yang', 'pada', 'dari'].includes(word)
        );
        
        // Update keyword database with response
        significantWords.forEach(word => {
            if (!this.knowledgeBase.keywords[word]) {
                this.knowledgeBase.keywords[word] = {
                    count: 1,
                    responses: [response],
                    sentiments: [sentiment.label],
                    lastSeen: new Date().toISOString()
                };
            } else {
                const keyword = this.knowledgeBase.keywords[word];
                keyword.count++;
                
                // Avoid duplicate responses
                if (!keyword.responses.includes(response)) {
                    keyword.responses = [...keyword.responses, response].slice(-5); // Keep last 5
                }
                
                keyword.sentiments = [...keyword.sentiments, sentiment.label].slice(-10); // Keep last 10
                keyword.lastSeen = new Date().toISOString();
            }
        });
        
        // Update frequencies
        words.forEach(word => {
            if (word.length < 3) return; // Skip very short words
            
            this.knowledgeBase.frequencies[word] = (this.knowledgeBase.frequencies[word] || 0) + 1;
        });
        
        // Learn sentence patterns (simple implementation)
        const pattern = this.extractPattern(message);
        if (pattern) {
            this.knowledgeBase.patterns[pattern] = (this.knowledgeBase.patterns[pattern] || 0) + 1;
        }
        
        this.saveToStorage();
    },
    
    // Extract sentence pattern
    extractPattern(message) {
        // Simple pattern: first word + sentence length category + last word
        const words = message.toLowerCase().split(/\s+/);
        if (words.length < 2) return null;
        
        const firstWord = words[0];
        const lastWord = words[words.length - 1];
        const lengthCategory = words.length < 5 ? 'short' : (words.length < 10 ? 'medium' : 'long');
        
        return `${firstWord}_${lengthCategory}_${lastWord}`;
    },
    
    // Add custom response
    addCustomResponse(trigger, response) {
        this.knowledgeBase.customResponses[trigger.toLowerCase()] = response;
        this.saveToStorage();
    },
    
    // Get statistics about conversations
    getStatistics() {
        const stats = {
            totalKeywords: Object.keys(this.knowledgeBase.keywords).length,
            topKeywords: this.getTopItems(this.knowledgeBase.keywords, 'count', 10),
            topPatterns: this.getTopItems(this.knowledgeBase.patterns, null, 5),
            sentimentDistribution: this.getSentimentDistribution(),
            totalCustomResponses: Object.keys(this.knowledgeBase.customResponses).length
        };
        
        return stats;
    },
    
    // Get top items from an object by count property
    getTopItems(obj, countProperty, limit) {
        const items = Object.entries(obj).map(([key, value]) => {
            return {
                key,
                count: countProperty ? value[countProperty] : value
            };
        });
        
        return items
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    },
    
    // Get sentiment distribution
    getSentimentDistribution() {
        let positive = 0;
        let neutral = 0;
        let negative = 0;
        
        Object.values(this.knowledgeBase.keywords).forEach(keyword => {
            if (!keyword.sentiments) return;
            
            keyword.sentiments.forEach(sentiment => {
                if (sentiment === 'positive') positive++;
                else if (sentiment === 'negative') negative++;
                else neutral++;
            });
        });
        
        const total = positive + neutral + negative;
        return {
            positive: total ? (positive / total * 100).toFixed(1) + '%' : '0%',
            neutral: total ? (neutral / total * 100).toFixed(1) + '%' : '0%',
            negative: total ? (negative / total * 100).toFixed(1) + '%' : '0%'
        };
    },
    
    // Save data to local storage
    saveToStorage() {
        try {
            localStorage.setItem('aiLearningSystem', JSON.stringify({
                knowledgeBase: this.knowledgeBase,
                contextMemory: this.contextMemory,
                userStats: this.userStats
            }));
        } catch (error) {
            console.error('Error saving learning data:', error);
        }
    },
    
    // Load data from local storage
    loadFromStorage() {
        try {
            const data = localStorage.getItem('aiLearningSystem');
            if (data) {
                const parsed = JSON.parse(data);
                this.knowledgeBase = parsed.knowledgeBase || this.knowledgeBase;
                this.contextMemory = parsed.contextMemory || this.contextMemory;
                this.userStats = parsed.userStats || this.userStats;
            }
        } catch (error) {
            console.error('Error loading learning data:', error);
        }
    },
    
    // Export learning data
    exportData() {
        return JSON.stringify({
            knowledgeBase: this.knowledgeBase,
            contextMemory: this.contextMemory,
            userStats: this.userStats,
            exportDate: new Date().toISOString()
        });
    },
    
    // Import learning data
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            this.knowledgeBase = data.knowledgeBase || this.knowledgeBase;
            this.contextMemory = data.contextMemory || this.contextMemory;
            this.userStats = data.userStats || this.userStats;
            this.saveToStorage();
            return true;
        } catch (error) {
            console.error('Error importing learning data:', error);
            return false;
        }
    },
    
    // Reset learning system
    reset() {
        this.knowledgeBase = {
            keywords: {},
            patterns: {},
            sentiments: {},
            frequencies: {},
            customResponses: {}
        };
        
        this.contextMemory = {};
        this.userStats = {};
        
        this.saveToStorage();
    }
};

// Initialize and export
const learningSystemInstance = learningSystem.init();
export default learningSystemInstance;
