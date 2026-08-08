/**
 * Cryptic Fox - Shared Utility Functions
 * Consolidates common functions used across multiple pages
 */

/**
 * Copy text from an element to clipboard
 * @param {string} elementId - ID or selector of the element containing text to copy
 */
export function copyToClipboard(elementId) {
    const element = document.querySelector(elementId) || document.getElementById(elementId);
    if (!element) {
        console.warn(`Element not found: ${elementId}`);
        return;
    }
    
    const text = element.value || element.textContent;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy:', err);
            fallbackCopy(element);
        });
    } else {
        fallbackCopy(element);
    }
}

/**
 * Fallback copy method for older browsers
 * @param {HTMLElement} element - Element to copy from
 */
function fallbackCopy(element) {
    if (element.select) {
        element.select();
        element.setSelectionRange?.(0, 99999);
    }
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification('Copied to clipboard!');
        }
    } catch (err) {
        console.error('Fallback copy failed:', err);
    }
}

/**
 * Clear all input and output fields in a section
 * @param {string} selector - CSS selector for fields to clear
 */
export function clearFields(selector = 'input, textarea') {
    const fields = document.querySelectorAll(selector);
    fields.forEach(field => {
        if (field.type === 'checkbox' || field.type === 'radio') {
            field.checked = false;
        } else {
            field.value = '';
        }
    });
}

/**
 * Swap values between input and output fields
 * @param {string} inputSelector - Selector for input field
 * @param {string} outputSelector - Selector for output field
 */
export function swapFields(inputSelector, outputSelector) {
    const input = document.querySelector(inputSelector);
    const output = document.querySelector(outputSelector);
    
    if (!input || !output) {
        console.warn('Swap fields not found:', inputSelector, outputSelector);
        return;
    }
    
    const temp = input.value;
    input.value = output.value || output.textContent;
    
    if (output.tagName === 'TEXTAREA' || output.tagName === 'INPUT') {
        output.value = temp;
    } else {
        output.textContent = temp;
    }
}

/**
 * Debounce function - delays execution until after a wait period
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Show a temporary notification message
 * @param {string} message - Message to display
 * @param {number} duration - Duration in milliseconds
 */
export function showNotification(message, duration = 2000) {
    // Check if notification container exists
    let container = document.getElementById('notification-container');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        background: var(--color-primary, #3b5483);
        color: var(--color-text, #fff);
        padding: 12px 20px;
        border-radius: 5px;
        margin-bottom: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        pointer-events: auto;
        animation: slideIn 0.3s ease-out;
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

/**
 * Format bytes to human-readable size
 * @param {number} bytes - Number of bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted size string
 */
export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML
 */
export function sanitizeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

/**
 * Download text content as a file
 * @param {string} filename - Name of the file
 * @param {string} text - Content to download
 * @param {string} mimeType - MIME type of the file
 */
export function downloadAsFile(filename, text, mimeType = 'text/plain') {
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Get element with null safety
 * @param {string} selector - CSS selector or ID
 * @returns {HTMLElement|null} Element or null
 */
export function safeGetElement(selector) {
    return document.querySelector(selector) || document.getElementById(selector);
}

/**
 * Add event listener with null check
 * @param {string} selector - CSS selector or ID
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 */
export function safeAddEventListener(selector, event, handler) {
    const element = safeGetElement(selector);
    if (element) {
        element.addEventListener(event, handler);
    } else {
        console.warn(`Element not found for event listener: ${selector}`);
    }
}

// Add CSS animations if not already present
if (!document.getElementById('utils-animations')) {
    const style = document.createElement('style');
    style.id = 'utils-animations';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}
