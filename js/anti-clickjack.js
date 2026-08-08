/**
 * Clickjacking Defense (Anti-Framing)
 * Prevents the page from being embedded in cross-origin iframes
 * 
 * This script must run synchronously before body content loads
 * to prevent clickjacking attacks.
 */

(function() {
    'use strict';
    
    // Allow same-origin iframes (for VS Code preview) but block cross-origin
    if (self !== top && self.origin !== top.origin) {
        // Cross-origin iframe detected - bust out
        top.location = self.location;
    } else {
        // Same origin or top frame - remove the anti-clickjack style
        document.addEventListener('DOMContentLoaded', function() {
            const antiClickjack = document.getElementById('antiClickjack');
            if (antiClickjack && antiClickjack.parentNode) {
                antiClickjack.parentNode.removeChild(antiClickjack);
            }
        });
    }
})();
