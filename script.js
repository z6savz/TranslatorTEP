let cipherToAlphabet = {};
let alphabetToCipher = {};
let cipherToAlternative = {};
let alternativeToAlphabet = {};

// Add event listener to foxInput
document.getElementById("foxInput").addEventListener("keydown", function (event) {
    if (event.key === "Enter") { // Check if the pressed key is Enter
        event.preventDefault(); // Prevent default behavior (e.g., adding a newline)
        checkFox(); // Call the Submit function
    }
});

// Function to verify the fox
async function checkFox() {
    try {
        const response = await fetch('fox.xml'); // Fetch fox.xml file
        if (!response.ok) throw new Error(`Failed to load fox file: ${response.statusText}`);
        const xml = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, "application/xml");

        const correctFox = xmlDoc.getElementsByTagName("fox")[0].textContent;
        const userFox = document.getElementById("foxInput").value;

        if (userFox === correctFox) {
            // Hide the fox screen
            hideFoxScreen();
        } else {
            alert("Incorrect! Try again."); // Notify the user
        }
    } catch (error) {
        console.error(error.message); // Log any errors
    }
}

// Function to hide the fox screen
function hideFoxScreen() {
    const foxScreen = document.getElementById("foxScreen");
    foxScreen.style.zIndex = "-1"; // Push to the back
    foxScreen.style.opacity = "0"; // Make it invisible
    foxScreen.style.pointerEvents = "none"; // Disable interactions
}

// Load the XML file and populate cipher mappings
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

// Populate cipher buttons dynamically in the keyboard panel
function populateCipherButtons() {
    const keyboardPanel = document.getElementById("keyboardPanel");
    for (let cipher in cipherToAlphabet) {
        const button = document.createElement("button");
        button.textContent = cipher; // Display cipher character on the button
        button.onclick = () => addCipherToInput(cipher); // Add cipher to the input field when clicked
        keyboardPanel.appendChild(button); // Append button to the keyboard panel
    }
}

// Append cipher to the input field
function addCipherToInput(cipher) {
    const inputText = document.getElementById("inputText");
    inputText.value += cipher; // Add the cipher character to the input text area
}

// Translate the text to Alphabet (Standard and Alternative)
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

// Translate the text to Cipher (Standard and Alternative)
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

// Automatically focus on fox input when the page loads and initialize mappings
window.onload = () => {
    document.getElementById("foxInput").focus();
    loadMappings(); // Load cipher mappings when the page loads
};
