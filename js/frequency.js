// frequency.js

const ENGLISH_FREQ = {
    'A': 8.17, 'B': 1.49, 'C': 2.78, 'D': 4.25, 'E': 12.70, 'F': 2.23, 'G': 2.02, 'H': 6.09, 'I': 6.97,
    'J': 0.15, 'K': 0.77, 'L': 4.03, 'M': 2.41, 'N': 6.75, 'O': 7.51, 'P': 1.93, 'Q': 0.10, 'R': 5.99,
    'S': 6.33, 'T': 9.06, 'U': 2.76, 'V': 0.98, 'W': 2.36, 'X': 0.15, 'Y': 1.97, 'Z': 0.07
};

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
// English letters sorted by descending frequency (E=most common … Z=least)
const ENGLISH_BY_FREQ = Object.entries(ENGLISH_FREQ).sort((a, b) => b[1] - a[1]).map(e => e[0]);
let ciphertext = "";
let currentMap = {}; // CipherChar -> UserInput
let chart = null;
let letterModeCorpusHints = {}; // Store word suggestions for resolved text

// Punctuation/whitespace/digits are left as-is; every other character is treated as a
// substitution-cipher symbol (covers both plain A-Z ciphers and symbolic/Unicode ciphers).
const PASSTHROUGH_CHAR = /[\s.,!?;:'"()\[\]{}\-\u2013\u2014\d]/;
function isCipherChar(ch) {
    return !!ch && !PASSTHROUGH_CHAR.test(ch);
}
function escapeForCharClass(ch) {
    return ch.replace(/[\]\\^-]/g, '\\$&');
}
// Returns every maximal run of known cipher characters in the ciphertext (i.e. "words")
function getCipherWords() {
    const chars = Object.keys(currentMap).map(escapeForCharClass).join('');
    if (!chars) return [];
    // 'u' flag: treat surrogate-pair (supplementary-plane) cipher symbols as single code points
    return ciphertext.match(new RegExp(`[${chars}]+`, 'gu')) || [];
}

// Debounce utility for performance optimization
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Debounced version of updateCorpusHints for better performance
const debouncedUpdateCorpusHints = debounce(function() {
    updateCorpusHints();
}, 50);

function processUserInput() {
    // Get user input from textarea
    const input = document.getElementById("letter-cipher-input");
    if (!input) return;
    
    // Strip invisible Unicode formatting chars (variation selectors, zero-width joiners, BOM, etc.)
    // that some symbol sets/fonts attach — left in, they'd be miscounted as extra cipher letters.
    ciphertext = input.value
        .replace(/[\u200B-\u200F\u202A-\u202E\u2060\uFEFF\uFE00-\uFE0F]/g, '')
        .toUpperCase()
        .trim();
    
    if (!ciphertext) {
        alert("Please enter ciphertext to analyze.");
        return;
    }
    
    // Reset current mapping
    currentMap = {};
    
    // Display ciphertext
    const ciphertextElement = document.getElementById("ciphertext");
    ciphertextElement.textContent = ciphertext;
    ciphertextElement.classList.remove("empty-state");
    
    // Update resolved text placeholder
    const resolvedElement = document.getElementById("resolvedText");
    resolvedElement.classList.remove("empty-state");
    
    // Populate mapping grid
    const grid = document.getElementById("mappingGrid");
    grid.innerHTML = "";
    
    // Get unique characters from ciphertext and sort by frequency
    const charCounts = {};
    Array.from(ciphertext).forEach(char => {
        if (isCipherChar(char)) {
            charCounts[char] = (charCounts[char] || 0) + 1;
        }
    });
    
    const presentChars = Object.keys(charCounts).sort((a, b) => charCounts[b] - charCounts[a]);
    
    presentChars.forEach(char => {
        currentMap[char] = "";
        const card = document.createElement("div");
        card.className = "map-card";
        const label = document.createElement("label");
        label.textContent = char;
        const input = document.createElement("input");
        input.type = "text";
        input.maxLength = 1;
        input.dataset.char = char;
        input.addEventListener("input", function() { handleMapInput(this); });
        card.appendChild(label);
        card.appendChild(input);
        grid.appendChild(card);
    });

    autoSolveByWordPattern();
    initChart(presentChars);
}

function handleMapInput(input) {
    const cipherChar = input.getAttribute("data-char");
    const val = input.value.toUpperCase();
    input.value = val;
    currentMap[cipherChar] = val;
    updateResolvedText();
    debouncedUpdateCorpusHints(); // Debounced for better performance
}

function updateResolvedText() {
    const resolved = Array.from(ciphertext).map(char => {
        if (!Object.prototype.hasOwnProperty.call(currentMap, char)) return char;
        const userChar = currentMap[char];
        return userChar ? userChar : "_";
    }).join("");

    const resolvedElement = document.getElementById("resolvedText");
    resolvedElement.textContent = resolved;
    
    // Add corpus highlighting if words are recognized
    if (wordModeInitialized) {
        highlightRecognizedWords(resolvedElement, resolved);
    }
}

// Full cryptogram solver: performs a backtracking constraint-satisfaction search over all
// cipher words at once, rather than resolving each
// word in isolation. Each candidate assignment for one word restricts which words/candidates
// remain valid for every other cipher character, guaranteeing a globally consistent mapping.
// Falls back to plain letter-frequency ranking for any cipher characters that can't be pinned
// down by dictionary matches (e.g. words not present in the corpus).
function autoSolveByWordPattern() {
    clearAlternativeSuggestions();
    if (!wordModeInitialized || Object.keys(structuralPatternIndex).length === 0) {
        applyFrequencyRankMapping();
        return;
    }

    const cipherWords = [...new Set(getCipherWords())];
    if (cipherWords.length === 0) {
        applyFrequencyRankMapping();
        return;
    }

    const CANDIDATE_LIMIT = 60;
    const MAX_NODES = 250000;

    // Gather dictionary candidates per cipher word (matching length + repeated-letter structure)
    // cwChars: code-point array (not cw.length/cw[i], which count UTF-16 code units and break
    // on supplementary-plane cipher symbols) so indexing lines up with the matched candidate word.
    let wordOrder = cipherWords
        .map(cw => ({
            cw,
            cwChars: Array.from(cw),
            candidates: (structuralPatternIndex[computeStructuralPattern(cw)] || []).slice(0, CANDIDATE_LIMIT)
        }))
        .filter(w => w.candidates.length > 0);

    if (wordOrder.length === 0) {
        applyFrequencyRankMapping();
        return;
    }

    // Most-constrained-variable heuristic: solve words with fewest candidates first,
    // and prefer longer words as a tie-break since they pin down more characters.
    wordOrder.sort((a, b) => a.candidates.length - b.candidates.length || b.cwChars.length - a.cwChars.length);

    const cipherToPlain = new Map();
    const plainToCipher = new Map();
    let currentScore = 0;
    let nodes = 0;

    // Keep the top few distinct complete assignments (by score) so we can offer alternative
    // readings, not just the single best guess.
    const TOP_K = 3;
    const topSolutions = [];
    const seenSignatures = new Set();
    const signatureOf = map => [...map.entries()].sort().join(',');

    function backtrack(index) {
        if (nodes++ > MAX_NODES) return;
        if (index === wordOrder.length) {
            if (topSolutions.length < TOP_K || currentScore > topSolutions[topSolutions.length - 1].score) {
                const sig = signatureOf(cipherToPlain);
                if (!seenSignatures.has(sig)) {
                    seenSignatures.add(sig);
                    topSolutions.push({ score: currentScore, map: new Map(cipherToPlain) });
                    topSolutions.sort((a, b) => b.score - a.score);
                    if (topSolutions.length > TOP_K) topSolutions.length = TOP_K;
                }
            }
            return;
        }

        const { cwChars, candidates } = wordOrder[index];
        let anyApplied = false;

        for (const englishWord of candidates) {
            const added = [];
            let conflict = false;
            for (let i = 0; i < cwChars.length; i++) {
                const cc = cwChars[i];
                const pc = englishWord[i].toUpperCase();
                const existingP = cipherToPlain.get(cc);
                const existingC = plainToCipher.get(pc);
                if (existingP !== undefined) {
                    if (existingP !== pc) { conflict = true; break; }
                    continue;
                }
                if (existingC !== undefined) {
                    if (existingC !== cc) { conflict = true; break; }
                    continue;
                }
                cipherToPlain.set(cc, pc);
                plainToCipher.set(pc, cc);
                added.push([cc, pc]);
            }

            if (!conflict) {
                anyApplied = true;
                const wordScore = wordFrequency[englishWord.toLowerCase()] || 1;
                currentScore += wordScore;
                backtrack(index + 1);
                currentScore -= wordScore;
            }

            added.forEach(([cc, pc]) => { cipherToPlain.delete(cc); plainToCipher.delete(pc); });
            if (nodes > MAX_NODES) return;
        }

        // No dictionary candidate fit this word (or all conflicted) — skip it and keep solving
        // the rest so a missing word doesn't block resolution of the others.
        if (!anyApplied) backtrack(index + 1);
    }

    backtrack(0);

    const resolvedMap = completeMapFromPartial(topSolutions[0] ? Object.fromEntries(topSolutions[0].map) : {});

    Object.assign(currentMap, resolvedMap);
    document.querySelectorAll('#mappingGrid input[data-char]').forEach(input => {
        const v = resolvedMap[input.dataset.char];
        if (v) input.value = v;
    });

    updateResolvedText();
    renderAlternativeSuggestions(topSolutions, resolvedTextFromMap(resolvedMap));
    debouncedUpdateCorpusHints();
}

// Fills any cipher chars a partial solution left unmapped using frequency rank, without touching currentMap.
function completeMapFromPartial(partialMap) {
    const map = Object.assign({}, partialMap);
    const usedPlain = new Set(Object.values(map));
    const charCounts = {};
    Array.from(ciphertext).forEach(c => { if (isCipherChar(c)) charCounts[c] = (charCounts[c] || 0) + 1; });
    const unmapped = Object.keys(currentMap)
        .filter(cc => !map[cc])
        .sort((a, b) => (charCounts[b] || 0) - (charCounts[a] || 0));
    let freqIdx = 0;
    unmapped.forEach(cc => {
        while (freqIdx < ENGLISH_BY_FREQ.length && usedPlain.has(ENGLISH_BY_FREQ[freqIdx])) freqIdx++;
        if (freqIdx < ENGLISH_BY_FREQ.length) {
            map[cc] = ENGLISH_BY_FREQ[freqIdx];
            usedPlain.add(ENGLISH_BY_FREQ[freqIdx]);
            freqIdx++;
        }
    });
    return map;
}

function resolvedTextFromMap(map) {
    return Array.from(ciphertext).map(ch => (isCipherChar(ch) ? (map[ch] || '_') : ch)).join('');
}

function clearAlternativeSuggestions() {
    const container = document.getElementById('altSuggestions');
    if (!container) return;
    container.innerHTML = '';
    container.classList.remove('has-alts');
}

// Renders up to 2 alternative full decodings (distinct from the main one) below the resolved text.
function renderAlternativeSuggestions(topSolutions, mainText) {
    const container = document.getElementById('altSuggestions');
    if (!container) return;
    container.innerHTML = '';

    const seenTexts = new Set([mainText]);
    const alts = [];
    for (let i = 1; i < topSolutions.length && alts.length < 2; i++) {
        const text = resolvedTextFromMap(completeMapFromPartial(Object.fromEntries(topSolutions[i].map)));
        if (!seenTexts.has(text)) {
            seenTexts.add(text);
            alts.push(text);
        }
    }

    if (alts.length === 0) {
        container.classList.remove('has-alts');
        return;
    }

    container.classList.add('has-alts');
    const label = document.createElement('div');
    label.className = 'alt-suggestions-label';
    label.textContent = 'Other possible readings:';
    container.appendChild(label);
    alts.forEach(text => {
        const item = document.createElement('div');
        item.className = 'alt-suggestion-item';
        item.textContent = text;
        container.appendChild(item);
    });
}

// Fallback: map cipher chars to English letters by raw frequency rank
function applyFrequencyRankMapping() {
    const charCounts = {};
    Array.from(ciphertext).forEach(c => { if (isCipherChar(c)) charCounts[c] = (charCounts[c] || 0) + 1; });
    const ordered = Object.keys(currentMap).sort((a, b) => (charCounts[b] || 0) - (charCounts[a] || 0));
    const usedPlain = new Set();
    let freqIdx = 0;
    ordered.forEach(cc => {
        while (freqIdx < ENGLISH_BY_FREQ.length && usedPlain.has(ENGLISH_BY_FREQ[freqIdx])) freqIdx++;
        if (freqIdx < ENGLISH_BY_FREQ.length) {
            currentMap[cc] = ENGLISH_BY_FREQ[freqIdx];
            usedPlain.add(ENGLISH_BY_FREQ[freqIdx]);
            freqIdx++;
        }
    });
    document.querySelectorAll('#mappingGrid input[data-char]').forEach(input => {
        if (currentMap[input.dataset.char]) input.value = currentMap[input.dataset.char];
    });
    updateResolvedText();
}

function initChart(presentChars) {
    const ctx = document.getElementById('freqChart').getContext('2d');

    // Calculate ciphertext frequencies
    const counts = {};
    let totalAlpha = 0;
    Array.from(ciphertext).forEach(char => {
        if (isCipherChar(char)) {
            counts[char] = (counts[char] || 0) + 1;
            totalAlpha++;
        }
    });

    const cipherFreqs = presentChars.map(char => {
        return ((counts[char] || 0) / totalAlpha * 100).toFixed(2);
    });

    const englishRef = presentChars.map((_, i) => ENGLISH_FREQ[ENGLISH_BY_FREQ[i]] || 0);

    if (chart) {
        chart.destroy();
    }

    if (typeof Chart === 'undefined') return;
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: presentChars,
            datasets: [
                {
                    label: 'Ciphertext Frequency (%)',
                    data: cipherFreqs,
                    backgroundColor: 'rgba(235, 63, 123, 0.6)',
                    borderColor: 'rgba(235, 63, 123, 1)',
                    borderWidth: 1
                },
                {
                    label: 'English Standard (%)',
                    data: englishRef,
                    backgroundColor: 'rgba(120, 160, 255, 0.5)',
                    borderColor: 'rgba(120, 160, 255, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#fff' }
                },
                x: {
                    ticks: { color: '#fff' }
                }
            },
            plugins: {
                legend: { labels: { color: '#fff' } }
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // Don't auto-initialize letter mode - wait for user input
    initWordMode();          // Eager init so suggestions work before mode is clicked
    checkForSuggestedWords(); // Pick up terms sent from Forensic Index
    // Mode buttons and actions (replaces onclick= in frequency.html)
    const bnd = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
    bnd('processInputBtn', () => typeof processUserInput === 'function' && processUserInput());
    bnd('refreshCorpusBtn', () => typeof refreshCorpus  === 'function' && refreshCorpus());
    // mode-letter / mode-word IDs replace the onclick=setMode('letter'/'word') already on those elements,
    // but setMode may already be called by existing id-based code — only add if not already wired
    if (document.getElementById('mode-letter') && !document.getElementById('mode-letter')._modeWired) {
        bnd('mode-letter', () => typeof setMode === 'function' && setMode('letter'));
        bnd('mode-word',   () => typeof setMode === 'function' && setMode('word'));
        const ml = document.getElementById('mode-letter'); if (ml) ml._modeWired = true;
    }

});

// ============================================================================
// MODE SWITCHING
// ============================================================================

let currentMode = 'letter';

function setMode(mode) {
    currentMode = mode;
    
    // Update button states
    document.getElementById('mode-letter').classList.toggle('active', mode === 'letter');
    document.getElementById('mode-word').classList.toggle('active', mode === 'word');
    
    // Update content visibility
    document.getElementById('letter-mode-content').classList.toggle('active', mode === 'letter');
    document.getElementById('word-mode-content').classList.toggle('active', mode === 'word');
    
    // Update description
    const descriptions = {
        letter: 'Analyze substitution ciphers by mapping encrypted letters to their plaintext equivalents using frequency distribution and corpus-based word hints.',
        word: 'Solve messages with missing words using corpus-based pattern matching and contextual analysis.'
    };
    document.getElementById('mode-description').textContent = descriptions[mode];
    
    // Initialize word mode if switching to it
    if (mode === 'word' && !wordModeInitialized) {
        initWordMode();
    }
}

// ============================================================================
// WORD-LEVEL SOLVER - CORPUS & DICTIONARY
// ============================================================================

let wordModeInitialized = false;
let wordFrequency = {};
let patternIndex = {};
let lengthIndex = {};
let structuralPatternIndex = {};
let vocabularySize = 0;
let corpusMode = 'fallback';
let documentCount = 0;

// Curated common-English word list (fallback dictionary) used for cryptogram solving.
// A complete dictionary (170k+ words) isn't practical to ship client-side, so this covers
// thousands of the most common words/word-forms, which is sufficient to solve most substitution
// ciphers via structural pattern matching + constraint propagation (see autoSolveByWordPattern).
const COMMON_WORDS = [
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with",
    "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
    "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up", "out", "if",
    "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just", "him",
    "know", "take", "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than",
    "then", "now", "look", "only", "come", "its", "over", "think", "also", "back", "after", "use", "two",
    "how", "our", "work", "first", "well", "way", "even", "new", "want", "because", "any", "these", "give",
    "day", "most", "us", "is", "was", "are", "been", "has", "had", "were", "said", "did", "having", "may",
    "should", "am", "being", "ought", "might", "does", "must", "shall", "doing", "done", "made",
    "quick", "brown", "fox", "jumps", "jump", "lazy", "dog", "hello", "world", "test", "example", "word",
    "text", "message", "cipher", "code", "secret", "hidden", "mystery", "puzzle", "solve", "find", "search",
    "through", "under", "where", "before", "between", "same", "each", "feel", "seem", "hand", "eye", "place",
    "case", "tell", "own", "leave", "ask", "man", "old", "right", "mean", "keep", "let", "begin", "help",
    "talk", "turn", "start", "show", "hear", "play", "run", "move", "live", "believe", "hold", "bring",
    "happen", "write", "provide", "sit", "stand", "lose", "pay", "meet", "include", "continue", "set",
    "learn", "change", "lead", "understand", "watch", "follow", "stop", "create", "speak", "read", "allow",
    "add", "spend", "grow", "open", "walk", "win", "offer", "remember", "love", "consider", "appear",
    "buy", "wait", "serve", "die", "send", "expect", "build", "stay", "fall", "cut", "reach", "kill",
    "remain", "suggest", "raise", "pass", "sell", "require", "report", "decide", "pull", "break", "pick",
    "wear", "catch", "choose", "fly", "return", "hope", "carry", "draw", "produce", "eat", "force", "throw",
    "such", "every", "much", "while", "still", "try", "another", "great", "little", "large", "big",
    "small", "long", "early", "young", "important", "few", "public", "bad", "able", "woman", "here",
    "national", "human", "both", "far", "present", "next", "social", "past", "possible", "true", "certain",
    "ever", "real", "full", "available", "whole", "likely", "economic", "hard", "strong", "necessary",
    "clear", "common", "recent", "simple", "main", "political", "personal", "sure", "ready", "similar",
    "easy", "serious", "wrong", "fine", "less", "dark", "several", "close", "professional", "special",
    "free", "dead", "military", "current", "happy", "white", "black", "red", "blue", "green",
    "room", "house", "home", "family", "door", "water", "food", "book", "paper", "name", "number", "part",
    "line", "area", "money", "story", "fact", "month", "lot", "study", "business", "issue", "side", "kind",
    "head", "mother", "father", "power", "country", "top", "end", "point", "member",
    "law", "car", "city", "community", "information", "history", "party", "result", "morning",
    "reason", "research", "girl", "guy", "moment", "air", "teacher", "education", "foot", "boy",
    "age", "policy", "everything", "process", "music", "including", "art", "company", "president",
    "until", "record", "million", "ago", "difference", "management", "control", "upon", "although", "within",
    "during", "without", "toward", "once", "enough", "almost", "phone", "away", "around",
    "something", "actually", "nothing", "thought", "perhaps", "rather", "quite", "especially", "else",
    "course", "someone", "simply", "itself", "often", "please", "therefore", "whether",
    "goes", "going", "went", "gone", "comes", "coming", "came", "gets", "getting", "got", "gotten",
    "makes", "making", "knows", "knowing", "knew", "known", "thinks", "thinking", "thought",
    "takes", "taking", "took", "taken", "sees", "seeing", "saw", "seen", "wants", "wanting", "wanted",
    "looks", "looking", "looked", "uses", "using", "used", "finds", "finding", "found",
    "gives", "giving", "gave", "given", "tells", "telling", "told", "works", "working", "worked",
    "calls", "calling", "called", "tries", "trying", "tried", "asks", "asking", "asked",
    "needs", "needing", "needed", "feels", "feeling", "felt", "becomes", "becoming", "became",
    "leaves", "leaving", "left", "puts", "putting", "means", "meaning", "meant",
    "keeps", "keeping", "kept", "lets", "letting", "begins", "beginning", "began", "begun",
    "seems", "seeming", "seemed", "helps", "helping", "helped", "talks", "talking", "talked",
    "turns", "turning", "turned", "starts", "starting", "started", "shows", "showing", "showed", "shown",
    "hears", "hearing", "heard", "plays", "playing", "played", "runs", "running", "ran",
    "moves", "moving", "moved", "lives", "living", "lived", "believes", "believing", "believed",
    "brings", "bringing", "brought", "happens", "happening", "happened", "writes", "writing", "wrote", "written",
    "provides", "providing", "provided", "sits", "sitting", "sat", "stands", "standing", "stood",
    "loses", "losing", "lost", "pays", "paying", "paid", "meets", "meeting", "met",
    "includes", "including", "included", "continues", "continuing", "continued", "sets", "setting",
    "learns", "learning", "learned", "learnt", "changes", "changing", "changed", "leads", "leading", "led",
    "understands", "understanding", "understood", "watches", "watching", "watched", "follows", "following", "followed",
    "stops", "stopping", "stopped", "creates", "creating", "created", "speaks", "speaking", "spoke", "spoken",
    "reads", "reading", "allows", "allowing", "allowed", "adds", "adding", "added",
    "spends", "spending", "spent", "grows", "growing", "grew", "grown", "opens", "opening", "opened",
    "walks", "walking", "walked", "wins", "winning", "won", "offers", "offering", "offered",
    "remembers", "remembering", "remembered", "loves", "loving", "loved", "considers", "considering", "considered",
    "appears", "appearing", "appeared", "buys", "buying", "bought", "waits", "waiting", "waited",
    "serves", "serving", "served", "dies", "dying", "died", "sends", "sending", "sent",
    "expects", "expecting", "expected", "builds", "building", "built", "stays", "staying", "stayed",
    "falls", "falling", "fell", "fallen", "cuts", "cutting", "reaches", "reaching", "reached",
    "kills", "killing", "killed", "remains", "remaining", "remained", "suggests", "suggesting", "suggested",
    "raises", "raising", "raised", "passes", "passing", "passed", "sells", "selling", "sold",
    "requires", "requiring", "required", "reports", "reporting", "reported", "decides", "deciding", "decided",
    "pulls", "pulling", "pulled", "breaks", "breaking", "broke", "broken", "picks", "picking", "picked",
    "wears", "wearing", "wore", "worn", "catches", "catching", "caught", "chooses", "choosing", "chose", "chosen",
    "flies", "flying", "flew", "flown", "returns", "returning", "returned", "hopes", "hoping", "hoped",
    "carries", "carrying", "carried", "draws", "drawing", "drew", "drawn", "produces", "producing", "produced",
    "eats", "eating", "ate", "eaten", "forces", "forcing", "forced", "throws", "throwing", "threw", "thrown",
    "crack", "cracks", "cracking", "cracked", "always", "never", "sometimes", "usually", "rarely",
    "child", "children", "night", "week", "government", "service", "job", "friend",
    "hour", "game", "member", "minute", "idea", "body", "back", "parent", "face", "level",
    "office", "health", "person", "war", "party", "change", "reason", "moment",
    "voice", "wife", "police", "mind", "price", "report", "decision", "son", "hospital", "church",
    "chair", "lawyer", "daughter", "bird", "list", "dog", "wall", "staff", "blood", "letter", "cat",
    "action", "table", "king", "queen", "ship", "boat", "river", "lake", "sea", "ocean",
    "forest", "tree", "flower", "garden", "park", "street", "road", "bridge", "mountain", "valley",
    "island", "beach", "desert", "jungle", "cloud", "sky", "sun", "moon", "star", "storm",
    "rain", "snow", "wind", "fire", "earth", "stone", "rock", "sand", "cave", "castle",
    "tower", "palace", "village", "town", "nation", "planet", "universe", "space", "science", "secret",
    "note", "page", "chapter", "tale", "legend", "myth", "dream", "nightmare", "memory",
    "goal", "fear", "anger", "joy", "sadness", "happiness", "sorrow", "pain", "pleasure", "hate",
    "trust", "doubt", "faith", "truth", "lie", "honesty", "courage", "bravery", "cowardice",
    "wisdom", "knowledge", "ignorance", "freedom", "justice", "peace", "battle", "fight", "struggle",
    "victory", "defeat", "quick", "slow", "fast", "strong", "weak", "brave", "afraid", "happy",
    "sad", "angry", "calm", "quiet", "loud", "soft", "hard", "smooth", "rough", "sharp",
    "dull", "bright", "dim", "clear", "cloudy", "sunny", "rainy", "windy", "cold", "hot",
    "warm", "cool", "wet", "dry", "clean", "dirty", "empty", "full", "heavy", "light",
    "thick", "thin", "wide", "narrow", "deep", "shallow", "tall", "short", "fat", "ugly",
    "beautiful", "pretty", "handsome", "plain", "simple", "complex", "difficult", "safe", "dangerous",
    "hidden", "open", "closed", "free", "busy", "tired", "sick", "healthy", "alive", "dead",
    "real", "fake", "true", "false", "correct", "incorrect", "possible", "impossible", "certain",
    "uncertain", "sure", "unsure", "careful", "careless", "honest", "dishonest", "kind", "cruel",
    "gentle", "friendly", "unfriendly", "polite", "rude", "patient", "impatient", "nervous",
    "excited", "bored", "interested", "curious", "confused", "ancient", "modern",
    "quickly", "slowly", "carefully", "carelessly", "quietly", "loudly", "happily", "sadly", "angrily",
    "calmly", "bravely", "honestly", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
    "sunday", "january", "february", "march", "april", "june", "july", "august", "september",
    "october", "november", "december", "spring", "summer", "autumn", "winter", "north", "south",
    "east", "west", "above", "below", "inside", "outside", "behind", "beyond", "beside",
    "toward", "against", "along", "among", "throughout", "shadow", "light", "dark",
    "whisper", "shout", "silence", "sound", "noise", "echo", "voice", "song", "melody",
    "rhythm", "dance", "story", "poem", "novel", "chapter", "verse", "riddle", "clue",
    "answer", "solution", "problem", "mystery", "detective", "witness", "evidence", "suspect",
    "criminal", "victim", "murder", "theft", "crime", "justice", "trial", "judge", "jury",
    "verdict", "sentence", "prison", "escape", "chase", "hunt", "search", "discover", "reveal",
    "expose", "conceal", "protect", "defend", "attack", "invade", "conquer", "surrender",
    "retreat", "advance", "army", "soldier", "general", "captain", "sergeant", "weapon",
    "sword", "shield", "armor", "arrow", "bow", "spear", "knife", "blade", "gun", "bullet",
    "explosion", "bomb", "danger", "threat", "risk", "safety", "rescue", "save", "help",
    "friend", "enemy", "ally", "traitor", "hero", "villain", "monster", "creature", "beast",
    "dragon", "wolf", "bear", "lion", "tiger", "eagle", "hawk", "snake", "spider", "insect",
    "animal", "plant", "flower", "seed", "root", "branch", "leaf", "fruit", "harvest",
    "field", "farm", "crop", "grain", "wheat", "corn", "rice", "bread", "meat", "fish",
    "milk", "egg", "sugar", "salt", "spice", "flavor", "taste", "smell", "touch", "sight",
    "hearing", "sense", "feeling", "emotion", "thought", "opinion", "belief", "value", "moral",
    "ethic", "principle", "rule", "law", "order", "chaos", "system", "structure", "pattern",
    "design", "plan", "project", "task", "goal", "purpose", "mission", "duty", "responsibility",
    "obligation", "promise", "agreement", "contract", "deal", "trade", "exchange", "gift", "reward",
    "prize", "award", "honor", "praise", "blame", "criticism", "compliment", "insult", "argument",
    "debate", "discussion", "conversation", "dialogue", "speech", "lecture", "lesson", "class",
    "school", "student", "professor", "university", "college", "degree", "diploma", "exam",
    "test", "grade", "score", "result", "success", "failure", "mistake", "error", "correction",
    "improvement", "progress", "development", "growth", "change", "transformation", "evolution",
    "revolution", "rebellion", "protest", "riot", "conflict", "crisis", "emergency", "disaster",
    "accident", "injury", "wound", "illness", "disease", "cure", "medicine", "doctor", "nurse",
    "patient", "hospital", "clinic", "surgery", "treatment", "recovery", "health", "wellness",
    "exercise", "diet", "nutrition", "sleep", "rest", "energy", "strength", "power", "weakness",
    "ability", "skill", "talent", "gift", "craft", "trade", "profession", "career", "job",
    "employer", "employee", "worker", "manager", "leader", "follower", "team", "group", "organization",
    "corporation", "company", "business", "industry", "market", "economy", "trade", "commerce",
    "finance", "money", "cash", "coin", "currency", "bank", "account", "deposit", "withdrawal",
    "loan", "debt", "credit", "interest", "profit", "loss", "budget", "expense", "income",
    "salary", "wage", "tax", "fund", "investment", "wealth", "poverty", "rich", "poor",
    "castle", "kingdom", "empire", "republic", "democracy", "monarchy", "dictator", "citizen",
    "voter", "election", "campaign", "politician", "senator", "governor", "mayor", "minister",
    "ambassador", "diplomat", "treaty", "alliance", "border", "territory", "region", "province",
    "capital", "metropolis", "suburb", "neighborhood", "district", "zone", "area", "location",
    "position", "direction", "distance", "journey", "trip", "travel", "adventure", "expedition",
    "voyage", "flight", "arrival", "departure", "destination", "route", "path", "trail", "map",
    "compass", "guide", "explorer", "traveler", "pilgrim", "wanderer", "nomad", "settler",
    "pioneer", "colony", "settlement", "civilization", "culture", "tradition", "custom", "ritual",
    "ceremony", "festival", "celebration", "holiday", "vacation", "rest", "relaxation", "leisure",
    "hobby", "sport", "exercise", "competition", "contest", "tournament", "champion", "medal",
    "trophy", "record", "achievement", "accomplishment", "milestone", "landmark", "monument",
    "statue", "sculpture", "painting", "drawing", "artwork", "gallery", "museum", "exhibition",
    "collection", "treasure", "artifact", "relic", "antique", "ancient", "modern", "future",
    "past", "present", "history", "legacy", "heritage", "generation", "ancestor", "descendant",
    "family", "relative", "cousin", "uncle", "aunt", "nephew", "niece", "sibling", "brother",
    "sister", "husband", "wife", "spouse", "partner", "marriage", "wedding", "divorce",
    "childhood", "youth", "adult", "elder", "senior", "infant", "baby", "toddler", "teenager"
];

function initWordMode() {
    wordModeInitialized = true;
    loadCorpus();
}

function loadCorpus() {
    try {
        const corpusData = localStorage.getItem('crypticfox_corpus');
        if (corpusData) {
            const corpus = JSON.parse(corpusData);
            if (corpus.documents && corpus.documents.length > 0) {
                buildCorpusIndex(corpus.documents);
                return;
            }
        }
    } catch (e) {
        console.warn('Could not load corpus from localStorage:', e);
    }
    
    // Fallback to common words dictionary
    buildFallbackDictionary();
}

function buildCorpusIndex(documents) {
    corpusMode = 'corpus';
    documentCount = documents.length;
    wordFrequency = {};
    
    // Check if Porter Stemmer is available
    const useStemming = typeof PorterStemmer !== 'undefined';
    let stemmer = null;
    if (useStemming) {
        stemmer = new PorterStemmer();
        console.log('[Word Solver] Building index with Porter Stemmer');
    }
    
    // Tokenize all documents and count word frequencies
    documents.forEach(doc => {
        const tokens = tokenize(doc.text);
        tokens.forEach(token => {
            // Store both original and stemmed versions for better matching
            wordFrequency[token] = (wordFrequency[token] || 0) + 1;
            
            // Also index stemmed version if available
            if (useStemming && stemmer) {
                const stemmed = stemmer.stem(token);
                if (stemmed !== token) {
                    // Create a link between stemmed and original forms
                    wordFrequency[stemmed] = (wordFrequency[stemmed] || 0) + 1;
                }
            }
        });
    });
    
    buildIndexes();
    updateCorpusStatus();
}

function buildFallbackDictionary() {
    corpusMode = 'fallback';
    documentCount = 0;
    wordFrequency = {};
    
    // Assign decreasing frequency values to common words
    COMMON_WORDS.forEach((word, index) => {
        wordFrequency[word.toLowerCase()] = COMMON_WORDS.length - index;
    });
    
    buildIndexes();
    updateCorpusStatus();
}

function buildIndexes() {
    patternIndex = {};
    lengthIndex = {};
    structuralPatternIndex = {};
    vocabularySize = Object.keys(wordFrequency).length;
    
    // Build pattern and length indexes
    Object.keys(wordFrequency).forEach(word => {
        const len = word.length;
        
        // Length index
        if (!lengthIndex[len]) lengthIndex[len] = [];
        lengthIndex[len].push(word);
        
        // Pattern index (full word pattern)
        const pattern = '_'.repeat(len);
        if (!patternIndex[pattern]) patternIndex[pattern] = [];
        patternIndex[pattern].push(word);

        // Structural pattern index (repeated-char structure, e.g. "were" → "0,1,2,1")
        const sp = computeStructuralPattern(word);
        if (!structuralPatternIndex[sp]) structuralPatternIndex[sp] = [];
        structuralPatternIndex[sp].push(word);
    });
    
    // Sort by frequency
    Object.keys(lengthIndex).forEach(len => {
        lengthIndex[len].sort((a, b) => wordFrequency[b] - wordFrequency[a]);
    });
    Object.keys(structuralPatternIndex).forEach(sp => {
        structuralPatternIndex[sp].sort((a, b) => wordFrequency[b] - wordFrequency[a]);
    });
}

// Returns a comma-joined pattern of integer indices representing repeated chars (e.g. "were" → "0,1,2,1")
function computeStructuralPattern(word) {
    const seen = {};
    let counter = 0;
    // Array.from (not split) so supplementary-plane cipher symbols count as one character each
    return Array.from(word).map(c => {
        if (!(c in seen)) seen[c] = counter++;
        return seen[c];
    }).join(',');
}

function tokenize(text) {
    return text.toLowerCase().match(/\b[a-z]+\b/g) || [];
}

function updateCorpusStatus() {
    document.getElementById('corpus-mode').textContent = corpusMode === 'corpus' ? 'Corpus' : 'Fallback';
    document.getElementById('corpus-vocab').textContent = vocabularySize.toLocaleString();
    document.getElementById('corpus-docs').textContent = documentCount.toString();
}

function refreshCorpus() {
    loadCorpus();
    if (currentTokens.length > 0) {
        updateAllSuggestions();
    }
}

// ============================================================================
// TOKEN PARSING & STATE MANAGEMENT
// ============================================================================

let currentTokens = [];
let tokenMap = {};
let cipherInput = '';

function parseTokens() {
    if (!wordModeInitialized) initWordMode(); // Safety net
    cipherInput = document.getElementById('word-cipher-input').value;
    
    // Extract all [WORDn] tokens
    const tokenPattern = /\[WORD(\d+)\]/g;
    const foundTokens = new Set();
    let match;
    
    while ((match = tokenPattern.exec(cipherInput)) !== null) {
        foundTokens.add(match[0]);
    }
    
    currentTokens = Array.from(foundTokens).sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)[0]);
        const numB = parseInt(b.match(/\d+/)[0]);
        return numA - numB;
    });
    
    // Initialize token map
    currentTokens.forEach(token => {
        if (!tokenMap[token]) {
            tokenMap[token] = {
                pattern: '',
                solution: '',
                suggestions: []
            };
        }
    });
    
    // Remove tokens that are no longer in the input
    Object.keys(tokenMap).forEach(token => {
        if (!currentTokens.includes(token)) {
            delete tokenMap[token];
        }
    });
    
    renderTokenGrid();
    updateResolvedWordText();
    updateAllSuggestions();
}

function renderTokenGrid() {
    const grid = document.getElementById('token-grid');
    
    if (currentTokens.length === 0) {
        grid.innerHTML = '<div class="no-tokens-message">Enter ciphertext with [WORDn] tokens above to see suggestions.</div>';
        return;
    }
    
    grid.innerHTML = '';
    
    currentTokens.forEach(token => {
        const card = document.createElement('div');
        card.className = 'token-card';
        
        const patternDisplay = tokenMap[token].pattern || '___';
        
        const safeId = token.replace(/[\[\]]/g, '_'); // e.g. [WORD1] -> _WORD1_
        card.innerHTML = `
            <div class="token-header">
                <span class="token-label">${token}</span>
                <span class="token-pattern">Pattern: ${patternDisplay}</span>
            </div>
            <div class="token-input-wrapper">
                <input type="text" 
                       class="token-input" 
                       placeholder="Enter word or pattern (e.g., TH_)"
                       value="${tokenMap[token].solution}"
                       oninput="handleTokenInput('${token}', this.value)"
                       data-token="${token}">
            </div>
            <div class="suggestions-list" id="suggestions-${safeId}">
                <div style="color: var(--color-text-muted); font-size: 0.85rem; font-style: italic;">Calculating suggestions...</div>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

function handleTokenInput(token, value) {
    const normalized = value.trim().toUpperCase();
    tokenMap[token].solution = normalized;
    
    // Detect pattern from input (e.g., "TH_" or "T_E")
    if (normalized.includes('_')) {
        tokenMap[token].pattern = normalized;
    } else if (normalized.length > 0) {
        tokenMap[token].pattern = normalized;
    }
    
    updateResolvedWordText();
    updateSuggestions(token);
}

function updateResolvedWordText() {
    let resolved = cipherInput;
    
    currentTokens.forEach(token => {
        const solution = tokenMap[token].solution;
        if (solution && !solution.includes('_')) {
            resolved = resolved.replace(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), solution);
        } else {
            resolved = resolved.replace(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '______');
        }
    });
    
    document.getElementById('word-resolved-text').textContent = resolved || 'Your decoded message will appear here...';
}

// ============================================================================
// PATTERN MATCHING & SUGGESTIONS
// ============================================================================

function updateAllSuggestions() {
    currentTokens.forEach(token => updateSuggestions(token));
}

function updateSuggestions(token) {
    const data = tokenMap[token];
    const pattern = data.pattern;
    
    // Get candidates based on pattern
    let candidates = [];
    
    if (pattern && pattern !== '') {
        candidates = getWordsByPattern(pattern);
    } else {
        // No pattern - suggest by length or most common words
        candidates = Object.keys(wordFrequency)
            .sort((a, b) => wordFrequency[b] - wordFrequency[a])
            .slice(0, 20);
    }
    
    // Apply context-aware ranking
    candidates = rankByContext(token, candidates);
    
    // Store top suggestions
    tokenMap[token].suggestions = candidates.slice(0, 20);
    
    // Render suggestions
    renderSuggestions(token);
}

function getWordsByPattern(pattern) {
    const patternLower = pattern.toLowerCase();
    const length = pattern.length;
    const candidates = [];
    
    // Get all words of the same length
    const wordsOfLength = lengthIndex[length] || [];
    
    wordsOfLength.forEach(word => {
        if (matchesPattern(word, patternLower)) {
            candidates.push(word);
        }
    });
    
    // Sort by frequency
    candidates.sort((a, b) => (wordFrequency[b] || 0) - (wordFrequency[a] || 0));
    
    return candidates;
}

function matchesPattern(word, pattern) {
    if (word.length !== pattern.length) return false;
    
    for (let i = 0; i < word.length; i++) {
        if (pattern[i] !== '_' && pattern[i] !== word[i]) {
            return false;
        }
    }
    return true;
}

function rankByContext(token, candidates) {
    // Extract context words around the token
    const context = extractContext(token);
    
    if (context.length === 0) {
        return candidates; // No context available
    }
    
    // Calculate context similarity scores
    const scored = candidates.map(candidate => {
        const score = calculateContextScore(candidate, context);
        return { word: candidate, score: score };
    });
    
    // Sort by context score (higher is better)
    scored.sort((a, b) => b.score - a.score);
    
    return scored.map(s => s.word);
}

function extractContext(token) {
    const words = cipherInput.split(/\s+/);
    const tokenIndex = words.findIndex(w => w.includes(token));
    
    if (tokenIndex === -1) return [];
    
    const context = [];
    
    // Get 2 words before
    for (let i = Math.max(0, tokenIndex - 2); i < tokenIndex; i++) {
        const word = words[i].replace(/[^a-zA-Z]/g, '').toLowerCase();
        if (word && !word.includes('word')) {
            context.push(word);
        }
    }
    
    // Get 2 words after
    for (let i = tokenIndex + 1; i < Math.min(words.length, tokenIndex + 3); i++) {
        const word = words[i].replace(/[^a-zA-Z]/g, '').toLowerCase();
        if (word && !word.includes('word')) {
            context.push(word);
        }
    }
    
    return context;
}

function calculateContextScore(candidate, contextWords) {
    // Simple co-occurrence scoring
    // In a full implementation, this would use TF-IDF and cosine similarity
    // For now, we'll use a simplified frequency-based approach
    
    let score = wordFrequency[candidate] || 0;
    
    // Boost score if candidate appears near context words in our vocabulary
    // This is a simplified heuristic
    contextWords.forEach(contextWord => {
        if (wordFrequency[contextWord]) {
            // Words with similar frequencies tend to co-occur
            const freqDiff = Math.abs(wordFrequency[candidate] - wordFrequency[contextWord]);
            const maxFreq = Math.max(wordFrequency[candidate], wordFrequency[contextWord]);
            if (maxFreq > 0) {
                const similarity = 1 - (freqDiff / maxFreq);
                score += similarity * 100;
            }
        }
    });
    
    return score;
}

function renderSuggestions(token) {
    const safeId = token.replace(/[\[\]]/g, '_');
    const container = document.getElementById(`suggestions-${safeId}`);
    if (!container) return;
    
    const suggestions = tokenMap[token].suggestions.slice(0, 5);
    
    if (suggestions.length === 0) {
        container.innerHTML = '<div style="color: var(--color-text-muted); font-size: 0.85rem; font-style: italic;">No suggestions found</div>';
        return;
    }
    
    container.innerHTML = '';
    
    suggestions.forEach(word => {
        const freq = wordFrequency[word] || 0;
        const btn = document.createElement('button');
        btn.className = 'suggestion-btn';
        btn.onclick = () => acceptSuggestion(token, word);
        btn.innerHTML = `
            ${word.toUpperCase()}
            <span class="suggestion-badge">${Math.min(freq, 999)}</span>
        `;
        container.appendChild(btn);
    });
}

function acceptSuggestion(token, word) {
    tokenMap[token].solution = word.toUpperCase();
    tokenMap[token].pattern = word.toUpperCase();
    
    // Use attribute matching instead of querySelector to avoid CSS selector issues
    // with brackets in token names like [WORD1]
    const input = Array.from(document.querySelectorAll('.token-input'))
        .find(el => el.getAttribute('data-token') === token);
    if (input) {
        input.value = word.toUpperCase();
    }
    
    updateResolvedWordText();
    updateSuggestions(token); // Refresh suggestions after accepting one
}

// ============================================================================
// FORENSIC INDEX INTEGRATION
// ============================================================================

/**
 * Check localStorage for terms sent from the Forensic Index page.
 * Boosts those terms to the top of suggestion lists.
 */
function checkForSuggestedWords() {
    try {
        const raw = localStorage.getItem('crypticfox_word_suggestions');
        if (!raw) return;
        const data = JSON.parse(raw);
        if (!data || !Array.isArray(data.terms) || data.terms.length === 0) return;
        // Ignore stale data older than 5 minutes
        if (Date.now() - (data.timestamp || 0) > 300000) {
            localStorage.removeItem('crypticfox_word_suggestions');
            return;
        }
        localStorage.removeItem('crypticfox_word_suggestions');

        // Boost these terms so they appear first in suggestions
        data.terms.forEach(term => {
            const lower = term.toLowerCase();
            wordFrequency[lower] = (wordFrequency[lower] || 0) + 100000;
            const len = lower.length;
            if (!lengthIndex[len]) lengthIndex[len] = [];
            if (!lengthIndex[len].includes(lower)) lengthIndex[len].push(lower);
            const sp = computeStructuralPattern(lower);
            if (!structuralPatternIndex[sp]) structuralPatternIndex[sp] = [];
            if (!structuralPatternIndex[sp].includes(lower)) structuralPatternIndex[sp].push(lower);
        });
        // Re-sort length and structural indexes so boosted terms bubble to the top
        Object.keys(lengthIndex).forEach(len => {
            lengthIndex[len].sort((a, b) => (wordFrequency[b] || 0) - (wordFrequency[a] || 0));
        });
        Object.keys(structuralPatternIndex).forEach(sp => {
            structuralPatternIndex[sp].sort((a, b) => (wordFrequency[b] || 0) - (wordFrequency[a] || 0));
        });

        // Switch to word mode and pre-populate the textarea
        setMode('word');
        const textarea = document.getElementById('word-cipher-input');
        if (textarea) {
            const tokens = data.terms.slice(0, 8).map((_, i) => `[WORD${i + 1}]`).join(' ');
            textarea.value = `Suspicious terms from Forensic Index:\n${tokens}`;
            parseTokens();
        }

        // Show a dismissible notice
        const notice = document.createElement('div');
        notice.style.cssText = 'background:rgba(33,150,243,0.12);border:1px solid #2196F3;border-radius:6px;' +
            'padding:10px 14px;margin-bottom:12px;color:#90CAF9;font-size:0.9rem;';
        notice.innerHTML = `<strong>📊 Forensic Index:</strong> Boosted terms: ${data.terms.slice(0, 8).join(', ')}`;
        const inputSection = document.querySelector('#word-mode-content .input-section');
        if (inputSection) inputSection.prepend(notice);
    } catch (e) {
        console.warn('checkForSuggestedWords error:', e);
    }
}

// ============================================================================
// LETTER-LEVEL CORPUS INTEGRATION
// ============================================================================

function updateCorpusHints() {
    if (!wordModeInitialized) return;
    
    const resolved = document.getElementById("resolvedText").textContent;
    if (!resolved || resolved.trim() === "") return;
    
    // Extract partial words from resolved text
    const words = resolved.split(/\s+/);
    letterModeCorpusHints = {};
    
    words.forEach(word => {
        const cleanWord = word.replace(/[^A-Z_]/g, '');
        if (cleanWord.length > 0 && cleanWord.includes('_')) {
            // This is a partial word - find suggestions
            const pattern = cleanWord.toLowerCase();
            const suggestions = getWordsByPattern(pattern).slice(0, 5);
            if (suggestions.length > 0) {
                letterModeCorpusHints[cleanWord] = suggestions;
            }
        }
    });
}

function highlightRecognizedWords(element, resolved) {
    // Split into words and wrap recognized ones with styling
    const words = resolved.split(/\s+/);
    const highlighted = words.map(word => {
        const cleanWord = word.replace(/[^A-Z_]/g, '').toLowerCase();
        
        // Check if it's a complete word (no underscores)
        if (!cleanWord.includes('_') && cleanWord.length > 0) {
            // Check if word exists in corpus
            if (wordFrequency[cleanWord]) {
                return `<span style="color: #7bd389; font-weight: bold;" title="Recognized word">${word}</span>`;
            } else if (cleanWord.length > 2) {
                return `<span style="color: #ffa726; opacity: 0.8;" title="Unknown word">${word}</span>`;
            }
        } else if (cleanWord.includes('_') && cleanWord.length > 0) {
            // Partial word - show tooltip with suggestions if available
            const suggestions = letterModeCorpusHints[cleanWord.toUpperCase()];
            if (suggestions && suggestions.length > 0) {
                const suggestionText = suggestions.slice(0, 3).join(', ');
                return `<span style="border-bottom: 1px dotted #eb3f7b; cursor: help;" title="Suggestions: ${suggestionText}">${word}</span>`;
            }
        }
        
        return word;
    });
    
    element.innerHTML = highlighted.join(' ');
}
