// Function to encrypt text to selected base
function encryptBinary(base) {
    const inputElement = document.querySelector('.binary-input');
    const outputElement = document.querySelector('.binary-output');
    const text = inputElement.value.trim();

    const encoded = text.split('')
        .map(char => char.charCodeAt(0).toString(base))
        .join(' ');

    outputElement.textContent = encoded || "Invalid input!";
}

// Function to decrypt encoded text from selected base
function decryptBinary(base) {
    const inputElement = document.querySelector('.binary-input');
    const outputElement = document.querySelector('.binary-output');
    const encodedString = inputElement.value.trim();

    try {
        const decoded = encodedString.split(' ')
            .map(num => String.fromCharCode(parseInt(num, base)))
            .join('');

        outputElement.textContent = decoded || "Invalid input!";
    } catch {
        outputElement.textContent = "Invalid base input!";
    }
}

// Function to get the selected base from dropdown
function getSelectedBase() {
    return document.querySelector('.binary-base').value;
}

// Function to clear binary fields
function clearBinaryFields() {
    const inputElement = document.querySelector('.binary-input');
    const outputElement = document.querySelector('.binary-output');
    const baseSelect = document.querySelector('.binary-base');

    if (inputElement) inputElement.value = ''; // Clear input
    if (outputElement) outputElement.textContent = ''; // Clear output
    if (baseSelect) baseSelect.selectedIndex = 0; // Reset dropdown
}

// Attach event listener
document.addEventListener('DOMContentLoaded', () => {
    const clearButton = document.getElementById('clearBinaryFieldsBtn');
    if (clearButton) {
        clearButton.addEventListener('click', clearBinaryFields);
    }
});

// Hexadecimal Encryption & Decryption
function encryptHex() {
    const inputElement = document.querySelector('.hex-input');
    const outputElement = document.querySelector('.hex-output');
    const text = inputElement.value.trim();

    const hex = text.split('')
        .map(char => char.charCodeAt(0).toString(16))
        .join(' ');

    outputElement.textContent = hex || "Invalid input!";
}

function decryptHex() {
    const inputElement = document.querySelector('.hex-input');
    const outputElement = document.querySelector('.hex-output');
    const hexString = inputElement.value.trim();

    const text = hexString.split(' ')
        .map(hex => String.fromCharCode(parseInt(hex, 16)))
        .join('');

    outputElement.textContent = text || "Invalid hex input!";
}

// Function to clear hex fields
function clearHexFields() {
    const inputElement = document.querySelector('.hex-input');
    const outputElement = document.querySelector('.hex-output');

    if (inputElement) inputElement.value = ''; // Clear input
    if (outputElement) outputElement.textContent = ''; // Clear output
}

// Attach event listener
document.addEventListener('DOMContentLoaded', () => {
    const clearButton = document.getElementById('clearHexFieldsBtn');
    if (clearButton) {
        clearButton.addEventListener('click', clearHexFields);
    }
});

// Ensure cipher mappings are loaded when the page loads
loadJacquard();

// Define mapping objects
const jacquardToAlphabet = {};
const alphabetToJacquard = {};

// Function to load cipher mappings
async function loadJacquard() {
    try {
        const response = await fetch('jacquard.xml'); // Fetch the mappings XML file
        if (!response.ok) throw new Error(`Failed to load mappings: ${response.statusText}`);
        const xml = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, "application/xml");

        // Extract mappings from the XML file
        const mappings = xmlDoc.getElementsByTagName("mapping");
        for (let mapping of mappings) {
            const cipher = mapping.getAttribute("cipher");
            const alphabet = mapping.getAttribute("alphabet");

            // Populate mapping objects
            jacquardToAlphabet[cipher] = alphabet;
            alphabetToJacquard[alphabet] = cipher;
        }

        console.log("Mappings loaded successfully:", cipherToAlphabet, alphabetToCipher);
    } catch (error) {
        console.error("Error loading mappings:", error);
    }
}

// Jacquard Cipher Encryption: Translates alphabet to cipher
function encryptJacquard() {
    const inputElement = document.querySelector('.jacquard-input');
    const outputElement = document.querySelector('.jacquard-output');
    const text = inputElement.value.trim().toUpperCase(); // Convert to uppercase for matching

    // Translate each character to cipher using the mapping
    const cipherText = text.split('')
        .map(char => alphabetToJacquard[char] || "[?]") // Use [?] for unknown characters
        .join(' ');

    outputElement.textContent = cipherText || "Invalid input!";
}

// Jacquard Cipher Decryption: Translates cipher to alphabet
function decryptJacquard() {
    const inputElement = document.querySelector('.jacquard-input');
    const outputElement = document.querySelector('.jacquard-output');
    const cipherText = inputElement.value.trim();

    // Split the cipher text by spaces and translate each to alphabet
    const text = cipherText.split(' ')
        .map(code => jacquardToAlphabet[code] || "[?]") // Use [?] for unknown cipher codes
        .join('');

    outputElement.textContent = text || "Invalid cipher text!";
}

// Function to clear Jacquard fields
function clearJacquardFields() {
    const inputElement = document.querySelector('.jacquard-input');
    const outputElement = document.querySelector('.jacquard-output');

    if (inputElement) inputElement.value = ''; // Clear input
    if (outputElement) outputElement.textContent = ''; // Clear output
}

// Attach event listener
document.addEventListener('DOMContentLoaded', () => {
    const clearButton = document.getElementById('clearJacquardFieldsBtn');
    if (clearButton) {
        clearButton.addEventListener('click', clearJacquardFields);
    }
});

// Caesar Cipher Encryption & Decryption
function encryptCaesar(shift) {
    const inputElement = document.querySelector('.caesar-input');
    const outputElement = document.querySelector('.caesar-output');
    const text = inputElement.value.trim();

    const cipherText = text.split('')
        .map(char => {
            if (char.match(/[a-z]/i)) {
                let code = char.charCodeAt(0);
                let offset = char >= 'a' ? 97 : 65;
                return String.fromCharCode(((code - offset + shift) % 26) + offset);
            }
            return char;
        })
        .join('');

    outputElement.textContent = cipherText || "Invalid input!";
}

function decryptCaesar(shift) {
    const inputElement = document.querySelector('.caesar-input');
    const outputElement = document.querySelector('.caesar-output');
    const cipherText = inputElement.value.trim();

    const text = cipherText.split('')
        .map(char => {
            if (char.match(/[a-z]/i)) {
                let code = char.charCodeAt(0);
                let offset = char >= 'a' ? 97 : 65;
                return String.fromCharCode(((code - offset - shift + 26) % 26) + offset);
            }
            return char;
        })
        .join('');

    outputElement.textContent = text || "Invalid cipher text!";
}

function getShiftValue() {
    return parseInt(document.querySelector('.caesar-shift').value, 10);
}

// Clear fields for Caesar Cipher
function clearCaesarFields() {
    const inputElement = document.querySelector('.caesar-input');
    const outputElement = document.querySelector('.caesar-output');
    const shiftElement = document.querySelector('.caesar-shift');

    if (inputElement) inputElement.value = ''; // Clear input
    if (outputElement) outputElement.textContent = ''; // Clear output
    if (shiftElement) shiftElement.value = 3; // Reset shift to default value
}

// Attach event listener
document.addEventListener('DOMContentLoaded', () => {
    const clearCaesarButton = document.getElementById('clearCaesarFieldsBtn');
    if (clearCaesarButton) {
        clearCaesarButton.addEventListener('click', clearCaesarFields);
    }
});

// Vigenère Cipher Encryption & Decryption
document.querySelector('.encrypt-btn').addEventListener('click', function () {
    const key = document.querySelector('.vigenere-key').value.trim();
    const text = document.querySelector('.vigenere-input').value.trim();
    document.querySelector('.vigenere-output').textContent = vigenereEncrypt(text, key);
});

document.querySelector('.decrypt-btn').addEventListener('click', function () {
    const key = document.querySelector('.vigenere-key').value.trim();
    const cipherText = document.querySelector('.vigenere-input').value.trim();
    document.querySelector('.vigenere-output').textContent = vigenereDecrypt(cipherText, key);
});

// Function to generate repeating key while skipping spaces
function generateKey(str, key) {
    key = key.toUpperCase();
    let expandedKey = "";
    let keyIndex = 0;

    for (let i = 0; i < str.length; i++) {
        if (str[i].match(/[A-Z]/)) {
            expandedKey += key[keyIndex % key.length]; // Repeat key correctly
            keyIndex++; // Move to next key letter **only for letters**
        } else {
            expandedKey += str[i]; // Preserve spaces
        }
    }

    return expandedKey;
}

// Function to encrypt using letter addition while preserving spaces
function vigenereEncrypt(str, key) {
    str = str.toUpperCase();
    key = generateKey(str, key.toUpperCase());
    let cipherText = "";

    for (let i = 0; i < str.length; i++) {
        if (str[i].match(/[A-Z]/)) {
            let plainValue = str[i].charCodeAt(0) - 65;
            let keyValue = key[i].charCodeAt(0) - 65;
            let encryptedValue = (plainValue + keyValue) % 26; // Letter addition (modulo 26)
            cipherText += String.fromCharCode(encryptedValue + 65);
        } else {
            cipherText += str[i]; // Preserve spaces and special characters
        }
    }

    return cipherText;
}

// Function to decrypt using letter subtraction while preserving spaces
function vigenereDecrypt(cipherText, key) {
    cipherText = cipherText.toUpperCase();
    key = generateKey(cipherText, key.toUpperCase());
    let plainText = "";

    for (let i = 0; i < cipherText.length; i++) {
        if (cipherText[i].match(/[A-Z]/)) {
            let cipherValue = cipherText[i].charCodeAt(0) - 65;
            let keyValue = key[i].charCodeAt(0) - 65;
            let decryptedValue = (cipherValue - keyValue + 26) % 26; // Letter subtraction (modulo 26)
            plainText += String.fromCharCode(decryptedValue + 65);
        } else {
            plainText += cipherText[i]; // Preserve spaces and special characters
        }
    }

    return plainText;
}

// Clear fields for Vigenère Cipher
function clearVigenereFields() {
    const inputElement = document.querySelector('.vigenere-input');
    const keyElement = document.querySelector('.vigenere-key');
    const outputElement = document.querySelector('.vigenere-output');

    if (inputElement) inputElement.value = ''; // Clear input
    if (keyElement) keyElement.value = ''; // Clear key
    if (outputElement) outputElement.textContent = ''; // Clear output
}

// Attach event listener
document.addEventListener('DOMContentLoaded', () => {
const clearVigenereButton = document.getElementById('clearVigenereFieldsBtn');
    if (clearVigenereButton) {
        clearVigenereButton.addEventListener('click', clearVigenereFields);
    }
});

// Atbash Cipher Encryption & Decryption
function encryptAtbash() {
    const inputElement = document.querySelector('.atbash-input');
    const outputElement = document.querySelector('.atbash-output');
    const text = inputElement.value.trim();

    const cipherText = text.split('')
        .map(char => {
            if (char.match(/[a-z]/i)) {
                let offset = char >= 'a' ? 97 : 65;
                return String.fromCharCode((25 - (char.charCodeAt(0) - offset)) + offset);
            }
            return char;
        })
        .join('');

    outputElement.textContent = cipherText || "Invalid input!";
}

function decryptAtbash() {
    const inputElement = document.querySelector('.atbash-input');
    const outputElement = document.querySelector('.atbash-output');
    const cipherText = inputElement.value.trim();

    const text = cipherText.split('')
        .map(char => {
            if (char.match(/[a-z]/i)) {
                let offset = char >= 'a' ? 97 : 65;
                return String.fromCharCode((25 - (char.charCodeAt(0) - offset)) + offset);
            }
            return char;
        })
        .join('');

    outputElement.textContent = text || "Invalid cipher text!";
}

function clearAtbashFields() {
    const inputElement = document.querySelector('.atbash-input');
    const outputElement = document.querySelector('.atbash-output');

    if (inputElement) inputElement.value = ''; // Clear input
    if (outputElement) outputElement.textContent = ''; // Clear output
}

document.addEventListener('DOMContentLoaded', () => {
const clearAtbashButton = document.getElementById('clearAtbashFieldsBtn');
    if (clearAtbashButton) {
        clearAtbashButton.addEventListener('click', clearAtbashFields);
    }
});

// Base64 Encoding
function encryptBase64() {
    const inputElement = document.querySelector('.base64-input');
    const outputElement = document.querySelector('.base64-output');
    const text = inputElement.value.trim();

    if (!text) {
        outputElement.textContent = "Error: Input cannot be empty!";
        return;
    }

    try {
        const encoded = btoa(unescape(encodeURIComponent(text))); // Properly encode text to Base64
        outputElement.textContent = encoded;
    } catch (error) {
        outputElement.textContent = "Error: Invalid input!";
        console.error(error);
    }
}

// Base64 Decoding
function decryptBase64() {
    const inputElement = document.querySelector('.base64-input');
    const outputElement = document.querySelector('.base64-output');
    const encodedText = inputElement.value.trim();

    if (!encodedText) {
        outputElement.textContent = "Error: Input cannot be empty!";
        return;
    }

    try {
        const decoded = decodeURIComponent(escape(atob(encodedText))); // Properly decode Base64 to text
        outputElement.textContent = decoded;
    } catch (error) {
        outputElement.textContent = "Error: Invalid Base64 input!";
        console.error(error);
    }
}

// Clear Base64 Fields
function clearBase64Fields() {
    const inputElement = document.querySelector('.base64-input');
    const outputElement = document.querySelector('.base64-output');

    if (inputElement) inputElement.value = ''; // Clear input
    if (outputElement) outputElement.textContent = ''; // Clear output
}

// Attach event listeners
document.addEventListener('DOMContentLoaded', () => {
    const encryptButton = document.getElementById('encryptBase64Btn');
    const decryptButton = document.getElementById('decryptBase64Btn');
    const clearButton = document.getElementById('clearBase64FieldsBtn');

    if (encryptButton) encryptButton.addEventListener('click', encryptBase64);
    if (decryptButton) decryptButton.addEventListener('click', decryptBase64);
    if (clearButton) clearButton.addEventListener('click', clearBase64Fields);
});

// Morse Code Encryption & Decryption
const morseCodeMap = {
    "A": ".-", "B": "-...", "C": "-.-.", "D": "-..", "E": ".",
    "F": "..-.", "G": "--.", "H": "....", "I": "..", "J": ".---",
    "K": "-.-", "L": ".-..", "M": "--", "N": "-.", "O": "---",
    "P": ".--.", "Q": "--.-", "R": ".-.", "S": "...", "T": "-",
    "U": "..-", "V": "...-", "W": ".--", "X": "-..-", "Y": "-.--",
    "Z": "--..", " ": "/"
};

function encryptMorse() {
    const inputElement = document.querySelector('.morse-input');
    const outputElement = document.querySelector('.morse-output');
    const text = inputElement.value.trim().toUpperCase();

    const morseCode = text.split('')
        .map(char => morseCodeMap[char] || '?')
        .join(' ');

    outputElement.textContent = morseCode || "Invalid input!";
}

function decryptMorse() {
    const inputElement = document.querySelector('.morse-input');
    const outputElement = document.querySelector('.morse-output');
    const morseString = inputElement.value.trim();

    const text = morseString.split(' ')
        .map(symbol => Object.keys(morseCodeMap).find(key => morseCodeMap[key] === symbol) || '?')
        .join('');

    outputElement.textContent = text || "Invalid Morse input!";
}

// Clear fields for Morse Code
function clearMorseFields() {
    const inputElement = document.querySelector('.morse-input');
    const outputElement = document.querySelector('.morse-output');
    const separatorElement = document.querySelector('.morse-separator');

    if (inputElement) inputElement.value = ''; // Clear input
    if (outputElement) outputElement.textContent = ''; // Clear output
    if (separatorElement) separatorElement.selectedIndex = 0; // Reset separator to default
}

// Attach event listener
document.addEventListener('DOMContentLoaded', () => {
const clearMorseButton = document.getElementById('clearMorseFieldsBtn');
    if (clearMorseButton) {
        clearMorseButton.addEventListener('click', clearMorseFields);
    }
});

/* 🔵 Function to encrypt using selected cipher & mode
function encryptCipher(method, mode) {
    const inputElement = document.querySelector(`.${method}-input`);
    const keyElement = document.querySelector(`.${method}-key`);
    const outputElement = document.querySelector(`.${method}-output`);
    const text = inputElement.value.trim();
    const key = CryptoJS.enc.Utf8.parse(keyElement.value.trim() || "defaultkey123456");

    const encrypted = CryptoJS[method].encrypt(text, key, {
        mode: CryptoJS.mode[mode],
        padding: CryptoJS.pad.Pkcs7
    });

    outputElement.textContent = encrypted.toString();
}

// 🔴 Function to decrypt using selected cipher & mode
function decryptCipher(method, mode) {
    const inputElement = document.querySelector(`.${method}-input`);
    const keyElement = document.querySelector(`.${method}-key`);
    const outputElement = document.querySelector(`.${method}-output`);
    const encryptedText = inputElement.value.trim();
    const key = CryptoJS.enc.Utf8.parse(keyElement.value.trim() || "defaultkey123456");

    const decrypted = CryptoJS[method].decrypt(encryptedText, key, {
        mode: CryptoJS.mode[mode],
        padding: CryptoJS.pad.Pkcs7
    });

    outputElement.textContent = decrypted.toString(CryptoJS.enc.Utf8) || "Invalid input!";
}

// Function to get selected encryption mode
function getSelectedMode(method) {
    return document.querySelector(`.${method}-mode`).value;
}*/

const CryptoJS = require("crypto-js");

/* Canvas-Based Image Decryption
function encryptCanvasImage() {
    const fileInput = document.querySelector('.canvas-image-input');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select an image file to encrypt.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        // Simulating encryption by encoding the image to Base64
        const encryptedData = btoa(event.target.result);
        const outputField = document.querySelector('.canvas-encrypted-output');
        outputField.value = encryptedData; // Display encrypted image data
    };

    reader.readAsBinaryString(file);
}

function decryptCanvasImage() {
    const fileInput = document.querySelector('.canvas-image-input');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select an image file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        const img = new Image();
        img.src = event.target.result;

        img.onload = function () {
            const canvas = document.getElementById('canvas-image-output');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const downloadLink = document.getElementById('canvas-download-link');
            downloadLink.href = canvas.toDataURL('image/png'); // Canvas to Base64
            downloadLink.style.display = 'inline-block'; // Make link visible
        };
    };

    reader.readAsDataURL(file);
}*/

// Function to encrypt an image to Base64
function encryptBase64Image() {
    const fileInput = document.querySelector('.base64-image-input');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select an image file to encrypt.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        const encryptedData = btoa(event.target.result); // Encode file data to Base64
        const outputField = document.querySelector('.base64-encrypted-output');
        outputField.value = encryptedData; // Display encrypted Base64 data
    };

    // Use readAsDataURL to get Base64-compatible data
    reader.readAsBinaryString(file);
}

// Function to decrypt a Base64 string to an image
function decryptBase64Image() {
    const base64Input = document.querySelector('.base64-encrypted-output').value; // Get Base64 input

    if (!base64Input) {
        alert('Please enter Base64 encrypted image data.');
        return;
    }

    const outputImg = document.getElementById('base64-image-output');
    const downloadLink = document.getElementById('base64-download-link');

    // Set image source using Base64
    outputImg.src = `data:image/png;base64,${base64Input}`;
    outputImg.style.display = 'block'; // Ensure the image is visible

    // Set download link
    downloadLink.href = outputImg.src;
    downloadLink.download = 'decrypted-image.png'; // Suggest a filename for the download
    downloadLink.style.display = 'inline-block'; // Make the link visible
}


/* AES Decryption Function*/
function decryptAES(encryptedData, key) {
    let decrypted = CryptoJS.AES.decrypt(encryptedData, key);
    return decrypted.toString(CryptoJS.enc.Utf8);
}

// AES Audio Decryption
function encryptAESAudio() {
    const fileInput = document.querySelector('.aes-audio-input').files[0];
    const key = document.querySelector('.aes-audio-key').value;

    if (!fileInput || !key) {
        alert('Please select an audio file and provide an AES key.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        const encryptedData = CryptoJS.AES.encrypt(event.target.result, key).toString();
        const outputField = document.querySelector('.aes-encrypted-output');
        outputField.value = encryptedData; // Display encrypted audio data
    };
    reader.readAsText(fileInput); // Read audio file as text
}

function decryptAESAudio() {
    const encryptedData = document.querySelector('.aes-audio-input-decrypt').value;
    const key = document.querySelector('.aes-audio-key-decrypt').value;

    if (!encryptedData || !key) {
        alert('Please provide the AES encrypted data and key.');
        return;
    }

    const decryptedData = CryptoJS.AES.decrypt(encryptedData, key).toString(CryptoJS.enc.Utf8);
    const audioElement = document.getElementById('aes-audio-output');
    audioElement.src = decryptedData; // Set decrypted data as audio source

    const downloadLink = document.getElementById('aes-audio-download-link');
    downloadLink.href = decryptedData; // Allow downloading decrypted audio
    downloadLink.style.display = 'inline-block'; // Make link visible
}

function encryptRSAAudio() {
    const fileInput = document.querySelector('.rsa-audio-input').files[0];
    const publicKey = document.querySelector('.rsa-public-key').value;

    if (!fileInput || !publicKey) {
        alert('Please select an audio file and provide an RSA public key.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        const encryptedData = rsaEncrypt(event.target.result, publicKey); // RSA encryption logic
        const outputField = document.querySelector('.rsa-encrypted-output');
        outputField.value = encryptedData; // Display encrypted audio data
    };
    reader.readAsText(fileInput); // Read audio file as text
}

// RSA encryption logic
function rsaEncrypt(data, publicKey) {
    // Add RSA encryption logic here (use libraries like NodeRSA or others)
    return data; // Placeholder
}

function decryptRSAAudio() {
    const encryptedData = document.querySelector('.rsa-audio-input-decrypt').value;
    const privateKey = document.querySelector('.rsa-private-key').value;

    if (!encryptedData || !privateKey) {
        alert('Please provide the RSA encrypted data and private key.');
        return;
    }

    const decryptedData = rsaDecrypt(encryptedData, privateKey); // RSA decryption logic
    const audioElement = document.getElementById('rsa-audio-output');
    audioElement.src = decryptedData; // Set decrypted data as audio source

    const downloadLink = document.getElementById('rsa-audio-download-link');
    downloadLink.href = decryptedData; // Allow downloading decrypted audio
    downloadLink.style.display = 'inline-block'; // Make link visible
}

// RSA decryption logic
function rsaDecrypt(data, privateKey) {
    // Add RSA decryption logic here (use libraries like NodeRSA or others)
    return data; // Placeholder
}

// Function to calculate RGB values based on names
function calculateRGB(names) {
    // Combine all names into one string
    const fullName = names.join('').toUpperCase();

    // Convert letters to numerical values (A=1, B=2, ..., Z=26)
    const letterValues = Array.from(fullName)
        .filter(char => char >= 'A' && char <= 'Z') // Only process letters
        .map(char => char.charCodeAt(0) - 64); // Convert letters to numbers

    // Calculate the sum of all letter values
    const sum = letterValues.reduce((acc, val) => acc + val, 0);

    // Scale RGB components proportionally (not exceeding 255)
    const red = (sum % 255); // Modulus to wrap within 0-255 range
    const green = ((sum * 2) % 255); // Example scaling factor
    const blue = ((sum * 3) % 255); // Another scaling factor

    return { red, green, blue };
}

function generateSingleColor() {
    // Input Fields
    const firstName = document.getElementById('firstName').value || "";
    const middleName = document.getElementById('middleName').value || "";
    const lastName = document.getElementById('lastName').value || "";

    // Output Elements
    const outputBox = document.getElementById('outputBox');
    const outputRGB = document.getElementById('outputRGB');
    const outputName = document.getElementById('outputName');

    // Calculate RGB values
    const { red, green, blue } = calculateRGB([firstName, middleName, lastName]);
    const color = `rgb(${red}, ${green}, ${blue})`;

    // Apply the color to the output box and display RGB values
    outputBox.style.backgroundColor = color;
    outputRGB.textContent = `Generated RGB Color: ${color}`;

    // Display the full name in the generated color
    const fullName = `${firstName} ${middleName} ${lastName}`.trim(); // Combine names
    outputName.textContent = fullName || "No name provided";
    outputName.style.color = color; // Set text color to match the generated color
}

function clearFields() {
    // Clear input fields
    document.getElementById('firstName').value = '';
    document.getElementById('middleName').value = '';
    document.getElementById('lastName').value = '';

    // Clear output
    document.getElementById('outputBox').style.backgroundColor = '';
    document.getElementById('outputRGB').textContent = '';
    document.getElementById('outputName').textContent = '';
}
