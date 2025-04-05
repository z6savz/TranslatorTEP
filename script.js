let cipherToAlphabet = {};
let alphabetToCipher = {};
let cipherToAlternative = {};
let alternativeToAlphabet = {}; // Mapping alternative cipher back to alphabet

// Load the XML file and populate mappings
async function loadMappings() {
    try {
        const response = await fetch('cipher_mapping.xml');
        if (!response.ok) throw new Error(`Failed to load mappings: ${response.statusText}`);
        const xml = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, "application/xml");

        const mappings = xmlDoc.getElementsByTagName("mapping");
        for (let mapping of mappings) {
            const cipher = mapping.getAttribute("cipher");
            const alphabet = mapping.getAttribute("alphabet");
            const alternative = mapping.getAttribute("alternative");

            cipherToAlphabet[cipher] = alphabet;
            alphabetToCipher[alphabet] = cipher;
            cipherToAlternative[cipher] = alternative; 
            alternativeToAlphabet[alternative] = alphabet; 
        }

        populateCipherButtons(); // Populate cipher buttons dynamically
    } catch (error) {
        console.error(error.message);
    }
}

// Populate cipher buttons dynamically
function populateCipherButtons() {
    const keyboardPanel = document.getElementById("keyboardPanel");
    keyboardPanel.innerHTML = ""; // Clear existing buttons if any
    for (let cipher in cipherToAlphabet) {
        const button = document.createElement("button");
        button.textContent = cipher; // Display cipher character on button
        button.onclick = () => addCipherToInput(cipher); // Add cipher to the input field when clicked
        keyboardPanel.appendChild(button); // Append button to the keyboard panel
    }
}

// Append cipher to input field
function addCipherToInput(cipher) {
    const inputText = document.getElementById("inputText");
    inputText.value += cipher; // Add cipher character to the input text area
}

// Translate to Alphabet (Standard and Alternative)
function translateToAlphabet() {
    const inputText = document.getElementById("inputText").value;
    let alphabetOutput = "";
    let alternativeOutput = "";

    for (let char of inputText) {
        alphabetOutput += (char === " ") ? " " : (cipherToAlphabet[char] || "?");
        alternativeOutput += (char === " ") ? " " : (alternativeToAlphabet[char] || "?");
    }

    document.getElementById("outputText").value = alphabetOutput;
    document.getElementById("alternativeOutputText").value = alternativeOutput;
}

// Translate to Cipher (Standard and Alternative)
function translateToCipher() {
    const inputText = document.getElementById("inputText").value.toUpperCase();
    let cipherOutput = "";
    let alternativeOutput = "";

    for (let char of inputText) {
        cipherOutput += (char === " ") ? " " : (alphabetToCipher[char] || "?");
        alternativeOutput += (char === " ") ? " " : (cipherToAlternative[alphabetToCipher[char]] || "?");
    }

    document.getElementById("outputText").value = cipherOutput;
    document.getElementById("alternativeOutputText").value = alternativeOutput;
}

// Clear input and output fields
function clearFields() {
    document.getElementById("inputText").value = "";
    document.getElementById("outputText").value = "";
    document.getElementById("alternativeOutputText").value = "";
}

// Load mappings when the page loads
window.onload = loadMappings;
