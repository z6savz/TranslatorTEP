let cipherToAlphabet = {};
let alphabetToCipher = {};

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
            cipherToAlphabet[cipher] = alphabet;
            alphabetToCipher[alphabet] = cipher;
        }

        populateCipherButtons();
    } catch (error) {
        console.error(error.message);
    }
}

// Populate cipher buttons dynamically
function populateCipherButtons() {
    const keyboardPanel = document.getElementById("keyboardPanel");
    for (let cipher in cipherToAlphabet) {
        const button = document.createElement("button");
        button.textContent = cipher;
        button.onclick = () => addCipherToInput(cipher);
        keyboardPanel.appendChild(button);
    }
}

// Append cipher to input field
function addCipherToInput(cipher) {
    const inputText = document.getElementById("inputText");
    inputText.value += cipher;
}

// Translate to Alphabet
function translateToAlphabet() {
    const inputText = document.getElementById("inputText").value;
    let outputText = "";
    for (let char of inputText) {
        outputText += (char === " ") ? " " : (cipherToAlphabet[char] || "?"); // Preserve spaces
    }
    document.getElementById("outputText").value = outputText;
}

// Translate to Cipher
function translateToCipher() {
    const inputText = document.getElementById("inputText").value.toUpperCase();
    let outputText = "";
    for (let char of inputText) {
        outputText += (char === " ") ? " " : (alphabetToCipher[char] || "?"); // Preserve spaces
    }
    document.getElementById("outputText").value = outputText;
}

// Clear input and output fields
function clearFields() {
    document.getElementById("inputText").value = "";
    document.getElementById("outputText").value = "";
}

// Load mappings when the page loads
window.onload = loadMappings;
