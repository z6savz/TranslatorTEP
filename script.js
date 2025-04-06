let cipherToAlphabet = {};
let alphabetToCipher = {};
let cipherToAlternative = {};
let alternativeToAlphabet = {};

// Function to verify the fox
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

    // Show the hamburger button once `foxScreen` is hidden
    document.getElementById("hamburgerBtn").classList.remove("hidden");
}

// Function to load cipher mappings
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
    const inputText = document.getElementById("inputText").value.toUpperCase();
    let cipherOutput = "";
    let alternativeOutput = "";

    for (let char of inputText) {
        cipherOutput += char === " " ? " " : alphabetToCipher[char] || "?";
        alternativeOutput += char === " " ? " " : cipherToAlternative[alphabetToCipher[char]] || "?";
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

// Hide hamburger button while `foxScreen` is active
window.onload = () => {
    document.getElementById("foxInput").focus();
    loadMappings();
    document.getElementById("hamburgerBtn").classList.add("hidden"); // Hide hamburger at startup
};

// Add event listener to `foxInput` for Enter key submission
document.getElementById("foxInput").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        checkFox();
    }
});

// Ensure input fields only allow letters and spaces
document.getElementById("foxInput").addEventListener("input", function () {
    this.value = this.value.replace(/[^a-zA-Z\s]/g, '');
});

document.getElementById("inputText").addEventListener("input", function () {
    this.value = this.value.replace(/[^a-zA-Z\s]/g, '');
});

// Sidebar open/close functionality
document.getElementById("hamburgerBtn").addEventListener("click", function () {
    document.getElementById("sidebarMenu").style.left = "0";
});

document.getElementById("closeBtn").addEventListener("click", function () {
    document.getElementById("sidebarMenu").style.left = "-250px";
});
