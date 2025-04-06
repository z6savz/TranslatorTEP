let cipherToAlphabet = {};
let alphabetToCipher = {};
let cipherToAlternative = {};
let alternativeToAlphabet = {};

// Initialize dropdown button functionality
document.addEventListener('DOMContentLoaded', () => {
    const dropdownBtn = document.querySelector('.dropbtn'); // Dropdown button
    const dropdownContent = document.querySelector('.dropdown-content'); // Dropdown content

    // Toggle dropdown visibility on button click
    dropdownBtn.addEventListener('click', () => {
        dropdownContent.classList.toggle('active'); // Add or remove the "active" class for visibility
    });

    // Optional: Close dropdown if clicked outside the dropdown button or menu
    document.addEventListener('click', (event) => {
        if (!dropdownBtn.contains(event.target) && !dropdownContent.contains(event.target)) {
            dropdownContent.classList.remove('active'); // Remove "active" class to hide dropdown
        }
    });

    // Ensure cipher mappings are loaded when the page loads
    loadMappings();
});

/* Function to verify the fox input
async function checkFox() {
    try {
        const response = await fetch('fox.xml'); // Fetch fox.xml file
        if (!response.ok) throw new Error(`Failed to load fox file: ${response.statusText}`);
        const xml = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, "application/xml");

        const correctFox = xmlDoc.getElementsByTagName("fox")[0].textContent.toLowerCase(); // Convert to lowercase
        const userFox = document.getElementById("foxInput").value.toLowerCase(); // Convert to lowercase

        if (userFox === correctFox) {
            hideFoxScreen(); // Hide `foxScreen`
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
    foxScreen.style.zIndex = "-1";
    foxScreen.style.opacity = "0";
    foxScreen.style.pointerEvents = "none";
}*/

// Function to load cipher mappings
async function loadMappings() {
    try {
        const response = await fetch('cipher_mapping.xml'); // Fetch the mappings XML file
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

        populateCipherButtons();
    } catch (error) {
        console.error(error.message);
    }
}

// Function to populate cipher buttons dynamically in the keyboard panel
function populateCipherButtons() {
    const keyboardPanel = document.getElementById("keyboardPanel");
    keyboardPanel.innerHTML = ""; // Clear previous buttons

    for (let cipher in cipherToAlphabet) {
        const button = document.createElement("button");
        button.textContent = cipher;
        button.onclick = () => addCipherToInput(cipher);
        keyboardPanel.appendChild(button);
    }
}

// Append cipher to the input field
function addCipherToInput(cipher) {
    document.getElementById("inputText").value += cipher;
}

// Translate text to Alphabet (Standard and Alternative)
function translateToAlphabet() {
    const inputText = document.getElementById("inputText").value;
    let alphabetOutput = "";
    let alternativeOutput = "";

    for (let char of inputText) {
        alphabetOutput += char === " " ? " " : cipherToAlphabet[char] || "?";
        alternativeOutput += char === " " ? " " : alternativeToAlphabet[char] || "?";
    }

    document.getElementById("outputText").value = alphabetOutput;
    document.getElementById("alternativeOutputText").value = alternativeOutput;
}

// Translate text to Cipher (Standard and Alternative)
function translateToCipher() {
    const inputText = document.getElementById("inputText").value;
    let cipherOutput = "";
    let alternativeOutput = "";

    for (let char of inputText) {
        cipherOutput += char === " " ? " " : alphabetToCipher[char.toUpperCase()] || "?";
        alternativeOutput += char === " " ? " " : cipherToAlternative[alphabetToCipher[char.toUpperCase()]] || "?";
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

/* Hide dropdown button while `foxScreen` is active
window.onload = () => {
    document.getElementById("foxInput").focus();
    loadMappings();
};*/

/* Ensure input fields only allow letters and spaces
document.getElementById("foxInput").addEventListener("input", function () {
    this.value = this.value.replace(/[^a-zA-Z\s]/g, ''); // Restrict to letters and spaces
});*/

// Input and Paste event listeners for `inputText`
document.getElementById("inputText").addEventListener("input", function () {
    this.value = this.value; // Allow all characters
});

document.getElementById("inputText").addEventListener("paste", function (event) {
    event.preventDefault(); // Prevent default paste behavior
    const pasteData = event.clipboardData.getData("text");
    this.value += pasteData; // Allow pasted content without filtering
});
