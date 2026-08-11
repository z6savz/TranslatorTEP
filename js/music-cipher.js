/**
 * Music Sheet Cipher — Decoder and Encoder
 * 
 * Decodes musical notation ciphers where notes on a staff represent letters.
 * Supports multiple cipher schemes including sequential mapping, direct note names,
 * and custom mappings.
 * 
 * Features:
 * - Multiple cipher methods (sequential, direct, scale position)
 * - Support for sharps/flats and octave notation
 * - Bidirectional encoding/decoding
 * - Visual mapping display
 */

// Note names in chromatic order
const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NATURAL_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Normalize note names (handle flats, sharps, case)
 */
function normalizeNote(note) {
    note = note.trim().toUpperCase();
    
    // Extract octave number if present
    const octaveMatch = note.match(/([0-9]+)$/);
    const octave = octaveMatch ? octaveMatch[1] : '';
    const noteWithoutOctave = note.replace(/[0-9]+$/, '');
    
    // Convert flats to sharps
    const flatToSharp = {
        'DB': 'C#',
        'EB': 'D#',
        'GB': 'F#',
        'AB': 'G#',
        'BB': 'A#'
    };
    
    let normalizedNote = noteWithoutOctave;
    if (normalizedNote.includes('B') && normalizedNote.length > 1) {
        const converted = flatToSharp[normalizedNote];
        if (converted) normalizedNote = converted;
    }
    
    // Reattach octave if present
    return octave ? normalizedNote + octave : normalizedNote;
}

/**
 * Parse input notes from string
 */
function parseNotes(input) {
    // Split by spaces, commas, or newlines
    const tokens = input.trim().split(/[\s,\n]+/);
    const notes = [];
    
    for (let token of tokens) {
        if (!token) continue;
        
        // Handle various formats: C, C4, C#, C#4, Db, Db4
        const normalized = normalizeNote(token);
        
        // Extract base note for validation (without octave)
        const baseNote = normalized.replace(/[0-9]+$/, '');
        
        // Validate base note
        if (CHROMATIC_NOTES.includes(baseNote) || NATURAL_NOTES.includes(baseNote)) {
            notes.push(normalized);
        }
    }
    
    return notes;
}

/**
 * Generate mapping based on cipher type
 */
function generateMapping(cipherType, startingNote, startingLetter) {
    const mapping = {};
    
    switch (cipherType) {
        case 'sequential':
            // Sequential: Starting note maps to starting letter, then continues through alphabet
            const noteIndex = NATURAL_NOTES.indexOf(startingNote);
            const letterIndex = ALPHABET.indexOf(startingLetter);
            
            for (let i = 0; i < 26; i++) {
                const note = NATURAL_NOTES[(noteIndex + i) % NATURAL_NOTES.length];
                const letter = ALPHABET[(letterIndex + i) % ALPHABET.length];
                
                // Build a unique key for the mapping
                const octaveOffset = Math.floor((noteIndex + i) / NATURAL_NOTES.length);
                const key = octaveOffset > 0 ? `${note}${octaveOffset}` : note;
                
                mapping[key] = letter;
            }
            
            // Also add basic notes without octave numbers for first cycle
            for (let i = 0; i < NATURAL_NOTES.length && i < 26; i++) {
                const note = NATURAL_NOTES[(noteIndex + i) % NATURAL_NOTES.length];
                const letter = ALPHABET[(letterIndex + i) % ALPHABET.length];
                if (!mapping[note]) {
                    mapping[note] = letter;
                }
            }
            break;
            
        case 'direct':
            // Direct: Musical note names map to their letter equivalents
            // A=A, B=B, C=C, D=D, E=E, F=F, G=G
            // Then continue: A=H, B=I, C=J...
            for (let i = 0; i < 26; i++) {
                const note = NATURAL_NOTES[i % NATURAL_NOTES.length];
                const letter = ALPHABET[i];
                const octaveOffset = Math.floor(i / NATURAL_NOTES.length);
                const key = octaveOffset > 0 ? `${note}${octaveOffset}` : note;
                mapping[key] = letter;
            }
            break;
            
        case 'scale-position':
            // Scale position: 1st note = A, 2nd = B, 3rd = C, etc.
            // Using C major scale: C D E F G A B
            const scale = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
            for (let i = 0; i < 26; i++) {
                const note = scale[i % scale.length];
                const letter = ALPHABET[i];
                const octaveOffset = Math.floor(i / scale.length);
                const key = octaveOffset > 0 ? `${note}${octaveOffset}` : note;
                mapping[key] = letter;
            }
            break;
            
        case 'custom':
            // Custom mapping - allow user-defined (for future enhancement)
            // For now, use sequential as default
            return generateMapping('sequential', startingNote, startingLetter);
    }
    
    return mapping;
}

/**
 * Reverse mapping for encoding
 */
function reverseMapping(mapping) {
    const reversed = {};
    for (const [note, letter] of Object.entries(mapping)) {
        // Map each letter to its note, preferring notes without octave numbers
        if (!reversed[letter]) {
            reversed[letter] = note;
        } else if (!reversed[letter].match(/[0-9]/) && note.match(/[0-9]/)) {
            // Keep the note without octave number if we already have it
            continue;
        } else if (reversed[letter].match(/[0-9]/) && !note.match(/[0-9]/)) {
            // Replace octave-numbered note with plain note if found
            reversed[letter] = note;
        }
    }
    return reversed;
}

/**
 * Decode notes to text
 */
function decodeMusic() {
    const input = document.getElementById('noteInput').value;
    const cipherType = document.getElementById('cipherType').value;
    const startingNote = document.getElementById('startingNote').value;
    const startingLetter = document.getElementById('startingLetter').value;
    const outputBox = document.getElementById('outputBox');
    
    if (!input.trim()) {
        outputBox.textContent = 'Please enter musical notes to decode.';
        outputBox.style.color = 'var(--color-text-muted)';
        return;
    }
    
    const notes = parseNotes(input);
    
    if (notes.length === 0) {
        outputBox.textContent = 'No valid notes found. Please use note names like C, D, E, F, G, A, B.';
        outputBox.style.color = 'var(--color-text-muted)';
        return;
    }
    
    const mapping = generateMapping(cipherType, startingNote, startingLetter);
    let decodedText = '';
    let unknownNotes = [];
    
    for (const note of notes) {
        if (mapping[note]) {
            decodedText += mapping[note];
        } else {
            // Try without considering it might have implicit octave
            let found = false;
            for (const [key, value] of Object.entries(mapping)) {
                if (key.startsWith(note)) {
                    decodedText += value;
                    found = true;
                    break;
                }
            }
            if (!found) {
                decodedText += '?';
                unknownNotes.push(note);
            }
        }
    }
    
    outputBox.textContent = decodedText;
    outputBox.style.color = 'var(--color-accent)';
    
    if (unknownNotes.length > 0) {
        outputBox.textContent += `\n\n(Unknown notes: ${unknownNotes.join(', ')})`;
    }
}

/**
 * Encode text to musical notes
 */
function encodeMusic() {
    const input = document.getElementById('textInput').value;
    const cipherType = document.getElementById('cipherType').value;
    const startingNote = document.getElementById('startingNote').value;
    const startingLetter = document.getElementById('startingLetter').value;
    const outputBox = document.getElementById('encodeOutputBox');
    
    if (!input.trim()) {
        outputBox.textContent = 'Please enter text to encode.';
        outputBox.style.color = 'var(--color-text-muted)';
        return;
    }
    
    const mapping = generateMapping(cipherType, startingNote, startingLetter);
    const reversed = reverseMapping(mapping);
    
    let encodedNotes = [];
    let unknownChars = [];
    
    for (const char of input.toUpperCase()) {
        if (char === ' ') {
            encodedNotes.push('|'); // Use | as space separator
        } else if (reversed[char]) {
            encodedNotes.push(reversed[char]);
        } else if (char.match(/[A-Z]/)) {
            unknownChars.push(char);
            encodedNotes.push('?');
        }
        // Skip non-alphabetic characters
    }
    
    outputBox.textContent = encodedNotes.join(' ');
    outputBox.style.color = 'var(--color-accent)';
    
    if (unknownChars.length > 0) {
        outputBox.textContent += `\n\n(Could not encode: ${unknownChars.join(', ')})`;
    }
}

/**
 * Display the cipher mapping
 */
function showMapping() {
    const cipherType = document.getElementById('cipherType').value;
    const startingNote = document.getElementById('startingNote').value;
    const startingLetter = document.getElementById('startingLetter').value;
    const mappingDisplay = document.getElementById('mappingDisplay');
    
    const mapping = generateMapping(cipherType, startingNote, startingLetter);
    
    // Sort by letter for display
    const sortedEntries = Object.entries(mapping).sort((a, b) => {
        return a[1].localeCompare(b[1]);
    });
    
    // Display only first 26 mappings (one per letter)
    const uniqueLetters = new Set();
    const displayEntries = [];
    
    for (const [note, letter] of sortedEntries) {
        if (!uniqueLetters.has(letter) && uniqueLetters.size < 26) {
            uniqueLetters.add(letter);
            displayEntries.push([note, letter]);
        }
    }
    
    mappingDisplay.innerHTML = displayEntries
        .map(([note, letter]) => `
            <div class="mapping-item">
                <div class="note-name">${note}</div>
                <div>↓</div>
                <div>${letter}</div>
            </div>
        `)
        .join('');
    
    mappingDisplay.style.display = 'grid';
}

/**
 * Clear input and output fields
 */
function clearFields() {
    document.getElementById('noteInput').value = '';
    document.getElementById('outputBox').textContent = '';
    document.getElementById('mappingDisplay').style.display = 'none';
}

/**
 * Clear encode fields
 */
function clearEncodeFields() {
    document.getElementById('textInput').value = '';
    document.getElementById('encodeOutputBox').textContent = '';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add button event listeners
    document.getElementById('decodeBtn').addEventListener('click', decodeMusic);
    document.getElementById('showMappingBtn').addEventListener('click', showMapping);
    document.getElementById('clearBtn').addEventListener('click', clearFields);
    document.getElementById('encodeBtn').addEventListener('click', encodeMusic);
    document.getElementById('clearEncodeBtn').addEventListener('click', clearEncodeFields);
    
    // Add keyboard shortcuts
    document.getElementById('noteInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            decodeMusic();
        }
    });
    
    document.getElementById('textInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            encodeMusic();
        }
    });
    
    // Update mapping when settings change
    const settingsElements = ['cipherType', 'startingNote', 'startingLetter'];
    settingsElements.forEach(id => {
        document.getElementById(id).addEventListener('change', function() {
            const mappingDisplay = document.getElementById('mappingDisplay');
            if (mappingDisplay.style.display === 'grid') {
                showMapping();
            }
        });
    });
});
