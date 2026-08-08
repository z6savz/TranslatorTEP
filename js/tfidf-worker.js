/**
 * TF-IDF Web Worker
 * Performs TF-IDF computation in a separate thread to avoid blocking the UI
 */

// Import TF-IDF calculator (when converted to modules)
// For now, we'll include the core logic here

class TFIDFCalculator {
    constructor(useStemming = false) {
        this.documents = {};
        this.documentCount = 0;
        this.documentFrequency = {};
        this.idfCache = {};
        this.useStemming = useStemming;
        this.documentNames = [];
    }

    tokenize(text) {
        const tokens = text.toLowerCase().match(/\b[a-z0-9]+\b/g) || [];
        return tokens;
    }

    addDocument(docId, text) {
        if (this.documents[docId]) {
            this.removeDocument(docId);
        }

        const tokens = this.tokenize(text);
        const termFrequency = {};
        
        tokens.forEach(token => {
            termFrequency[token] = (termFrequency[token] || 0) + 1;
        });

        this.documents[docId] = termFrequency;
        this.documentNames.push(docId);
        this.documentCount++;

        // Update document frequency
        Object.keys(termFrequency).forEach(term => {
            if (!this.documentFrequency[term]) {
                this.documentFrequency[term] = 0;
            }
            this.documentFrequency[term]++;
        });

        this.idfCache = {}; // Invalidate cache
    }

    removeDocument(docId) {
        if (!this.documents[docId]) return;

        const termFrequency = this.documents[docId];
        Object.keys(termFrequency).forEach(term => {
            this.documentFrequency[term]--;
            if (this.documentFrequency[term] === 0) {
                delete this.documentFrequency[term];
            }
        });

        delete this.documents[docId];
        this.documentNames = this.documentNames.filter(id => id !== docId);
        this.documentCount--;
        this.idfCache = {};
    }

    idf(term) {
        if (this.idfCache[term] !== undefined) {
            return this.idfCache[term];
        }

        const df = this.documentFrequency[term] || 0;
        if (df === 0) {
            this.idfCache[term] = 0;
            return 0;
        }

        const idfValue = Math.log(this.documentCount / df);
        this.idfCache[term] = idfValue;
        return idfValue;
    }

    tfidf(term, docId) {
        const doc = this.documents[docId];
        if (!doc) return 0;

        const tf = doc[term] || 0;
        const idfValue = this.idf(term);
        return tf * idfValue;
    }

    getTopTerms(docId, n = 10) {
        const doc = this.documents[docId];
        if (!doc) return [];

        const scores = Object.keys(doc).map(term => ({
            term,
            score: this.tfidf(term, docId)
        }));

        return scores
            .sort((a, b) => b.score - a.score)
            .slice(0, n);
    }

    similarity(docId1, docId2) {
        const doc1 = this.documents[docId1];
        const doc2 = this.documents[docId2];
        
        if (!doc1 || !doc2) return 0;

        const allTerms = new Set([
            ...Object.keys(doc1),
            ...Object.keys(doc2)
        ]);

        let dotProduct = 0;
        let magnitude1 = 0;
        let magnitude2 = 0;

        allTerms.forEach(term => {
            const tfidf1 = this.tfidf(term, docId1);
            const tfidf2 = this.tfidf(term, docId2);
            
            dotProduct += tfidf1 * tfidf2;
            magnitude1 += tfidf1 * tfidf1;
            magnitude2 += tfidf2 * tfidf2;
        });

        magnitude1 = Math.sqrt(magnitude1);
        magnitude2 = Math.sqrt(magnitude2);

        if (magnitude1 === 0 || magnitude2 === 0) return 0;

        return dotProduct / (magnitude1 * magnitude2);
    }

    detectAnomalies(docId, threshold = 2.0) {
        const doc = this.documents[docId];
        if (!doc) return [];

        const allScores = Object.keys(doc).map(term => this.tfidf(term, docId));
        
        if (allScores.length === 0) return [];

        const mean = allScores.reduce((a, b) => a + b, 0) / allScores.length;
        const variance = allScores.reduce((sum, score) => 
            sum + Math.pow(score - mean, 2), 0) / allScores.length;
        const stdDev = Math.sqrt(variance);

        return Object.keys(doc)
            .map(term => {
                const score = this.tfidf(term, docId);
                const zScore = stdDev > 0 ? (score - mean) / stdDev : 0;
                return { term, score, zScore };
            })
            .filter(item => Math.abs(item.zScore) > threshold)
            .sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
    }
}

// Worker message handler
let calculator = null;

self.onmessage = function(e) {
    const { action, data } = e.data;

    try {
        switch (action) {
            case 'init':
                calculator = new TFIDFCalculator(data.useStemming);
                self.postMessage({ action: 'init', success: true });
                break;

            case 'addDocument':
                if (!calculator) {
                    calculator = new TFIDFCalculator();
                }
                calculator.addDocument(data.docId, data.text);
                self.postMessage({ 
                    action: 'addDocument', 
                    success: true,
                    docId: data.docId 
                });
                break;

            case 'removeDocument':
                calculator?.removeDocument(data.docId);
                self.postMessage({ 
                    action: 'removeDocument', 
                    success: true 
                });
                break;

            case 'tfidf':
                const score = calculator?.tfidf(data.term, data.docId) || 0;
                self.postMessage({ 
                    action: 'tfidf', 
                    term: data.term,
                    docId: data.docId,
                    score 
                });
                break;

            case 'getTopTerms':
                const topTerms = calculator?.getTopTerms(data.docId, data.n) || [];
                self.postMessage({ 
                    action: 'getTopTerms', 
                    docId: data.docId,
                    terms: topTerms 
                });
                break;

            case 'similarity':
                const similarity = calculator?.similarity(data.docId1, data.docId2) || 0;
                self.postMessage({ 
                    action: 'similarity', 
                    docId1: data.docId1,
                    docId2: data.docId2,
                    similarity 
                });
                break;

            case 'detectAnomalies':
                const anomalies = calculator?.detectAnomalies(data.docId, data.threshold) || [];
                self.postMessage({ 
                    action: 'detectAnomalies', 
                    docId: data.docId,
                    anomalies 
                });
                break;

            case 'getState':
                self.postMessage({
                    action: 'getState',
                    state: {
                        documentCount: calculator?.documentCount || 0,
                        documentNames: calculator?.documentNames || []
                    }
                });
                break;

            default:
                self.postMessage({ 
                    action: 'error', 
                    message: `Unknown action: ${action}` 
                });
        }
    } catch (error) {
        self.postMessage({ 
            action: 'error', 
            message: error.message,
            stack: error.stack 
        });
    }
};
