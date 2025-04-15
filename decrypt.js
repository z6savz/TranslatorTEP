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

// Ensure cipher mappings are loaded when the page loads
loadJacquard();

// Define mapping objects
const cipherToAlphabet = {};
const alphabetToCipher = {};

// Function to load cipher mappings
async function loadJacquard() {
    try {
        const response = await fetch('jacquard.xml'); 
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
            cipherToAlphabet[cipher] = alphabet;
            alphabetToCipher[alphabet] = cipher;
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
        .map(char => alphabetToCipher[char] || "[?]") // Use [?] for unknown characters
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
        .map(code => cipherToAlphabet[code] || "[?]") // Use [?] for unknown cipher codes
        .join('');

    outputElement.textContent = text || "Invalid cipher text!";
}

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

// Vigenère Cipher Encryption & Decryption
// Event Listeners for Buttons
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

// 🟢 Base64 Encoding
function encryptBase64() {
    const inputElement = document.querySelector('.base64-input');
    const outputElement = document.querySelector('.base64-output');
    const text = inputElement.value.trim();

    try {
        outputElement.textContent = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text));
    } catch {
        outputElement.textContent = "Error: Invalid input!";
    }
}

// 🔴 Base64 Decoding
function decryptBase64() {
    const inputElement = document.querySelector('.base64-input');
    const outputElement = document.querySelector('.base64-output');
    const encodedText = inputElement.value.trim();

    try {
        outputElement.textContent = CryptoJS.enc.Base64.parse(encodedText).toString(CryptoJS.enc.Utf8);
    } catch {
        outputElement.textContent = "Error: Invalid Base64 input!";
    }
}

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

// 🔵 Function to encrypt using selected cipher & mode
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
}

/* SHA-256 Hashing (Not decryption, but useful for security)
function hashSHA256() {
    const inputElement = document.querySelector('.sha256-input');
    const outputElement = document.querySelector('.sha256-output');
    const text = inputElement.value.trim();

    outputElement.textContent = CryptoJS.SHA256(text).toString();
}*/

/* HMAC Authentication
function generateHMAC() {
    const inputElement = document.querySelector('.hmac-input');
    const outputElement = document.querySelector('.hmac-output');
    const text = inputElement.value.trim();
    const secretKey = "mysecretkey"; // Change this key

    outputElement.textContent = CryptoJS.HmacSHA256(text, secretKey).toString();
}*/

const CryptoJS = require("crypto-js");

// AES Image Decryption
function encryptAESImage() {
    const plaintext = document.querySelector('.aes-image-plaintext').value;
    const key = document.querySelector('.aes-image-key').value;

    if (!plaintext || !key) {
        alert('Please provide image data and the AES key for encryption.');
        return;
    }

    const encrypted = CryptoJS.AES.encrypt(plaintext, key).toString();
    const outputField = document.querySelector('.aes-encrypted-output');
    outputField.value = encrypted; // Display encrypted data
}

function decryptAESImage() {
    const encryptedData = document.querySelector('.aes-image-input').value;
    const key = document.querySelector('.aes-image-key').value;

    if (!encryptedData || !key) {
        alert('Please provide both encrypted data and the AES key.');
        return;
    }

    const decryptedData = decryptAES(encryptedData, key);

    const outputImg = document.getElementById('aes-image-output');
    outputImg.src = decryptedData; // Set decrypted image source

    const downloadLink = document.getElementById('aes-download-link');
    downloadLink.href = decryptedData; // Set download link
    downloadLink.style.display = 'inline-block'; // Make link visible
}

// Canvas-Based Image Decryption
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
}

// Base64 Image Decryption
function encryptBase64Image() {
    const fileInput = document.querySelector('.base64-image-input');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select an image file to encrypt.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        const encryptedData = btoa(event.target.result); // Encode to Base64
        const outputField = document.querySelector('.base64-encrypted-output');
        outputField.value = encryptedData; // Display encrypted Base64 data
    };

    reader.readAsBinaryString(file);
}

function decryptBase64Image() {
    const base64Input = document.querySelector('.base64-image-input').value;

    if (!base64Input) {
        alert('Please enter Base64 encrypted image data.');
        return;
    }

    const outputImg = document.getElementById('base64-image-output');
    outputImg.src = `data:image/png;base64,${base64Input}`;

    const downloadLink = document.getElementById('base64-download-link');
    downloadLink.href = outputImg.src; // Set download link
    downloadLink.style.display = 'inline-block'; // Make link visible
}

// AES Decryption Function
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
