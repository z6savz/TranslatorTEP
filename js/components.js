document.addEventListener('DOMContentLoaded', () => {
    // 1. Inject Navigation
    const navPlaceholder = document.querySelector('[role="navigation"]');
    if (navPlaceholder) {
        // Skip link must be the first focusable element — inject before the nav
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        navPlaceholder.parentNode.insertBefore(skipLink, navPlaceholder);

        // Anchor the skip-link target to the first h1 on the page
        document.addEventListener('DOMContentLoaded', () => {
            const h1 = document.querySelector('h1');
            if (h1 && !h1.id) h1.id = 'main-content';
        });
        
        const isRoot = !window.location.pathname.includes('blog-posts/');
        const prefix = isRoot ? '' : '../';
        
        const navHtml = `
            <button class="dropbtn" aria-label="Navigation menu" aria-expanded="false">MENU</button>
            <div class="dropdown-content">
                <a href="${prefix}index.html">Home</a>
                <a href="${prefix}about.html">About</a>
                <a href="${prefix}decrypt.html">Encrypt/Decrypt</a>
                <a href="${prefix}image-encrypt.html">Image Encryption</a>
                <a href="${prefix}audio-encrypt.html">Audio Encryption</a>
                <a href="${prefix}red.html">Steganalysis</a>
                <a href="${prefix}music-cipher.html">Musical Notation Cipher</a>
                <a href="${prefix}text-stego-detect.html">Text Stego Detector</a>
                <a href="${prefix}text-stego-index.html">Forensic Index</a>
                <a href="${prefix}frequency.html">Frequency Analysis</a>
                <a href="${prefix}cryptography.html">Resources</a>
                <a href="${prefix}note-g.html">Note G: Bernoulli Numbers</a>
                <a href="${prefix}lovelace-music.html">The Machine Sings</a>
                <a href="${prefix}blog.html">Blog</a>
                <a href="${prefix}tepcipher.html">🜎🜢🜁⊖🜨♄🜁🜎🜛🜢</a>
            </div>
        `;
        navPlaceholder.innerHTML = navHtml;

        // Re-attach dropdown toggle logic (extracted from script.js)
        const dropbtn = navPlaceholder.querySelector('.dropbtn');
        const dropdownContent = navPlaceholder.querySelector('.dropdown-content');
        
        dropbtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isExpanded = dropbtn.getAttribute('aria-expanded') === 'true';
            dropbtn.setAttribute('aria-expanded', !isExpanded);
            dropdownContent.classList.toggle('active');
        });

        dropbtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const isExpanded = dropbtn.getAttribute('aria-expanded') === 'true';
                dropbtn.setAttribute('aria-expanded', !isExpanded);
                dropdownContent.classList.toggle('active');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && dropdownContent.classList.contains('active')) {
                dropdownContent.classList.remove('active');
                dropbtn.setAttribute('aria-expanded', 'false');
                dropbtn.focus();
            }
        });

        // Close dropdown when clicking outside
        window.addEventListener('click', () => {
            if (dropdownContent.classList.contains('active')) {
                dropdownContent.classList.remove('active');
                dropbtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Close dropdown when clicking any link inside it
        dropdownContent.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                dropdownContent.classList.remove('active');
                dropbtn.setAttribute('aria-expanded', 'false');
            });
        });

        // Mark as initialized so script.js doesn't attach duplicate listeners
        navPlaceholder.dataset.navInitialized = 'true';
    }

    // 2. Inject Footer
    const footer = document.querySelector('footer');
    if (footer) {
        footer.innerHTML = `
            <p>&copy; 2025–2026 Cryptic Fox &nbsp;|&nbsp; 
                <a href='https://ko-fi.com/S6S81YLIDM' target='_blank' rel='noopener noreferrer'>
                    <img src='https://storage.ko-fi.com/cdn/kofi6.png?v=6' alt='Support me on Ko-fi' />
                </a>
            </p>
        `;
    }
});
