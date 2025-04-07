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

// Jacquard Cipher Encryption & Decryption (Basic XOR Example)
function encryptJacquard() {
    const inputElement = document.querySelector('.jacquard-input');
    const outputElement = document.querySelector('.jacquard-output');
    const text = inputElement.value.trim();

    const cipherText = text.split('')
        .map(char => String.fromCharCode(char.charCodeAt(0) ^ 0xFF)) // XOR operation
        .join('');

    outputElement.textContent = cipherText || "Invalid input!";
}

function decryptJacquard() {
    const inputElement = document.querySelector('.jacquard-input');
    const outputElement = document.querySelector('.jacquard-output');
    const cipherText = inputElement.value.trim();

    const text = cipherText.split('')
        .map(char => String.fromCharCode(char.charCodeAt(0) ^ 0xFF)) // XOR reverses itself
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

// Vigenere Cipher Encryption & Decryption
function encryptVigenere() {
    const inputElement = document.querySelector('.vigenere-input');
    const outputElement = document.querySelector('.vigenere-output');
    const key = "KEY"; // Replace with actual key
    const text = inputElement.value.trim();

    let keyIndex = 0;
    const cipherText = text.split('')
        .map(char => {
            if (char.match(/[a-z]/i)) {
                let code = char.charCodeAt(0);
                let offset = char >= 'a' ? 97 : 65;
                let shift = key.charCodeAt(keyIndex % key.length) - offset;
                keyIndex++;
                return String.fromCharCode(((code - offset + shift) % 26) + offset);
            }
            return char;
        })
        .join('');

    outputElement.textContent = cipherText || "Invalid input!";
}

function decryptVigenere() {
    const inputElement = document.querySelector('.vigenere-input');
    const outputElement = document.querySelector('.vigenere-output');
    const key = "KEY"; // Replace with actual key
    const cipherText = inputElement.value.trim();

    let keyIndex = 0;
    const text = cipherText.split('')
        .map(char => {
            if (char.match(/[a-z]/i)) {
                let code = char.charCodeAt(0);
                let offset = char >= 'a' ? 97 : 65;
                let shift = key.charCodeAt(keyIndex % key.length) - offset;
                keyIndex++;
                return String.fromCharCode(((code - offset - shift + 26) % 26) + offset);
            }
            return char;
        })
        .join('');

    outputElement.textContent = text || "Invalid cipher text!";
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

// SHA-256 Hashing (Not decryption, but useful for security)
function hashSHA256() {
    const inputElement = document.querySelector('.sha256-input');
    const outputElement = document.querySelector('.sha256-output');
    const text = inputElement.value.trim();

    outputElement.textContent = CryptoJS.SHA256(text).toString();
}

// HMAC Authentication
function generateHMAC() {
    const inputElement = document.querySelector('.hmac-input');
    const outputElement = document.querySelector('.hmac-output');
    const text = inputElement.value.trim();
    const secretKey = "mysecretkey"; // Change this key

    outputElement.textContent = CryptoJS.HmacSHA256(text, secretKey).toString();
}