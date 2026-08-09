// ── Utility helpers ──────────────────────────────────────────────────

function bufToBase64(buf) {
    const bytes = new Uint8Array(buf);
    let binary = '';
    const chunk = 8192;
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
}

function base64ToBuf(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
}

async function deriveKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

// ── AES-256-GCM Image Encryption ─────────────────────────────────────

async function encryptAESImage() {
    const fileInput = document.querySelector('.base64-image-input');
    const password  = document.querySelector('.image-encrypt-password')?.value;
    const file      = fileInput?.files[0];
    const statusEl  = document.getElementById('image-encrypt-status');

    if (!file)     { statusEl.textContent = 'Error: Please select an image file.'; return; }
    if (!password) { statusEl.textContent = 'Error: Please enter a password.';     return; }

    statusEl.textContent = 'Encrypting…';
    try {
        const salt      = crypto.getRandomValues(new Uint8Array(16));
        const iv        = crypto.getRandomValues(new Uint8Array(12));
        const key       = await deriveKey(password, salt);
        const plaintext = await file.arrayBuffer();
        const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);

        // Package: [salt 16B][iv 12B][ciphertext]
        const pkg = new Uint8Array(16 + 12 + ciphertext.byteLength);
        pkg.set(salt, 0);
        pkg.set(iv, 16);
        pkg.set(new Uint8Array(ciphertext), 28);

        const outputField = document.querySelector('.base64-encrypted-output');
        outputField.value = bufToBase64(pkg.buffer);
        outputField.dataset.originalName = file.name;
        statusEl.textContent = 'Encrypted successfully. Copy the output or use Swap to move it to the decryption field.';
    } catch (e) {
        console.error(e);
        statusEl.textContent = 'Error: ' + e.message;
    }
}

async function decryptAESImage() {
    const encInput  = document.querySelector('.base64-decryption-input')?.value.trim();
    const password  = document.querySelector('.image-decrypt-password')?.value;
    const outputImg = document.getElementById('base64-image-output');
    const dlLink    = document.getElementById('base64-download-link');
    const statusEl  = document.getElementById('image-decrypt-status');

    if (!encInput) { statusEl.textContent = 'Error: Please paste encrypted data.'; return; }
    if (!password) { statusEl.textContent = 'Error: Please enter the password.';   return; }

    statusEl.textContent = 'Decrypting…';
    try {
        const pkg    = new Uint8Array(base64ToBuf(encInput));
        const salt   = pkg.slice(0, 16);
        const iv     = pkg.slice(16, 28);
        const cipher = pkg.slice(28);

        const key   = await deriveKey(password, salt);
        const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);

        const blob = new Blob([plain]);
        const url  = URL.createObjectURL(blob);

        if (outputImg) { outputImg.src = url; outputImg.style.display = 'block'; }
        if (dlLink)    { dlLink.href = url; dlLink.download = 'decrypted-image'; dlLink.style.display = 'inline-block'; }
        statusEl.textContent = 'Decrypted successfully.';
    } catch (e) {
        console.error(e);
        statusEl.textContent = 'Decryption failed — wrong password or corrupted data.';
    }
}

// ── Workflow Helpers ──────────────────────────────────────────────────

function copyImageOutput() {
    const outputField = document.querySelector('.base64-encrypted-output');
    if (!outputField?.value) return;
    navigator.clipboard.writeText(outputField.value).then(() => {
        const btn = document.getElementById('copyImageBtn');
        if (!btn) return;
        const orig = btn.textContent;
        btn.textContent = '✔ Copied!';
        setTimeout(() => { btn.textContent = orig; }, 1500);
    });
}

function swapImageFields() {
    const output = document.querySelector('.base64-encrypted-output')?.value;
    const input  = document.querySelector('.base64-decryption-input');
    if (output && input) input.value = output;
}

function clearImageFields() {
    const els = ['.base64-image-input', '.base64-encrypted-output', '.base64-decryption-input',
                 '.image-encrypt-password', '.image-decrypt-password'];
    els.forEach(sel => { const el = document.querySelector(sel); if (el) el.value = ''; });

    const eo = document.querySelector('.base64-encrypted-output');
    if (eo) delete eo.dataset.originalName;

    const outputImg = document.getElementById('base64-image-output');
    const dlLink    = document.getElementById('base64-download-link');
    if (outputImg) { outputImg.style.display = 'none'; outputImg.src = ''; }
    if (dlLink)    dlLink.style.display = 'none';

    const s1 = document.getElementById('image-encrypt-status');
    const s2 = document.getElementById('image-decrypt-status');
    if (s1) s1.textContent = '';
    if (s2) s2.textContent = '';
}

// ── Base64 Image Encoding ────────────────────────────────────────────

function encodeImageToBase64() {
    const fileInput = document.getElementById('base64-encode-input');
    const file      = fileInput?.files[0];
    const statusEl  = document.getElementById('base64-encode-status');
    const outputEl  = document.getElementById('base64-encode-output');

    if (!file) {
        statusEl.textContent = 'Error: Please select an image file.';
        return;
    }

    statusEl.textContent = 'Encoding…';
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const base64Data = e.target.result;
            outputEl.value = base64Data;
            outputEl.dataset.originalName = file.name;
            statusEl.textContent = 'Encoded successfully. Copy the output or use Swap to move it to the decode field.';
        } catch (err) {
            console.error(err);
            statusEl.textContent = 'Error: ' + err.message;
        }
    };
    
    reader.onerror = function() {
        statusEl.textContent = 'Error reading file.';
    };
    
    reader.readAsDataURL(file);
}

function decodeBase64ToImage() {
    const inputEl   = document.getElementById('base64-decode-input');
    const base64    = inputEl?.value.trim();
    const statusEl  = document.getElementById('base64-decode-status');
    const outputImg = document.getElementById('base64-decoded-output');
    const dlLink    = document.getElementById('base64-decoded-download');

    if (!base64) {
        statusEl.textContent = 'Error: Please paste Base64 data.';
        return;
    }

    statusEl.textContent = 'Decoding…';
    try {
        // Validate it's a data URL
        if (!base64.startsWith('data:image/')) {
            throw new Error('Invalid Base64 image data. Must start with "data:image/"');
        }

        // Convert base64 to blob
        const arr = base64.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const url = URL.createObjectURL(blob);

        if (outputImg) {
            outputImg.src = url;
            outputImg.style.display = 'block';
        }
        if (dlLink) {
            dlLink.href = url;
            dlLink.download = 'decoded-image.' + mime.split('/')[1];
            dlLink.style.display = 'inline-block';
        }
        statusEl.textContent = 'Decoded successfully.';
    } catch (err) {
        console.error(err);
        statusEl.textContent = 'Decoding failed: ' + err.message;
    }
}

function copyBase64Output() {
    const outputField = document.getElementById('base64-encode-output');
    if (!outputField?.value) return;
    navigator.clipboard.writeText(outputField.value).then(() => {
        const btn = document.getElementById('copyBase64Btn');
        if (!btn) return;
        const orig = btn.textContent;
        btn.textContent = '✔ Copied!';
        setTimeout(() => { btn.textContent = orig; }, 1500);
    });
}

function swapBase64Fields() {
    const output = document.getElementById('base64-encode-output')?.value;
    const input  = document.getElementById('base64-decode-input');
    if (output && input) input.value = output;
}

function clearBase64Fields() {
    const els = ['base64-encode-input', 'base64-encode-output', 'base64-decode-input'];
    els.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    const eo = document.getElementById('base64-encode-output');
    if (eo) delete eo.dataset.originalName;

    const outputImg = document.getElementById('base64-decoded-output');
    const dlLink    = document.getElementById('base64-decoded-download');
    if (outputImg) {
        outputImg.style.display = 'none';
        outputImg.src = '';
    }
    if (dlLink) dlLink.style.display = 'none';

    const s1 = document.getElementById('base64-encode-status');
    const s2 = document.getElementById('base64-decode-status');
    if (s1) s1.textContent = '';
    if (s2) s2.textContent = '';
}

// ── Event listeners ───────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    const b = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
    
    // AES encryption
    b('encryptImageBtn', encryptAESImage);
    b('decryptImageBtn', decryptAESImage);
    b('copyImageBtn',    copyImageOutput);
    b('swapImageBtn',    swapImageFields);
    b('clearImageBtn',   clearImageFields);
    
    // Base64 encoding
    b('encodeBase64Btn', encodeImageToBase64);
    b('decodeBase64Btn', decodeBase64ToImage);
    b('copyBase64Btn',   copyBase64Output);
    b('swapBase64Btn',   swapBase64Fields);
    b('clearBase64Btn',  clearBase64Fields);
});
