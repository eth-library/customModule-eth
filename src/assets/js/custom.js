

/**
 * Main function to apply dynamic design based on URL parameters.
 * Checks for 'design' query parameter and adds corresponding class to body.
 */
function applyDesign() {
    console.log('Custom.js: Checking for design parameter...');
    const urlParams = new URLSearchParams(window.location.search);
    const design = urlParams.get('design') || 'blue';
    if (design) {
        document.body.classList.add('design-' + design);
        console.log('Custom.js: Applied design class: design-' + design);

        // Load dynamic CSS
        loadDesignCss(design);

        // Inject particle background for 'blue-ani' design by loading its specific JS
        if (design === 'blue-ani') {
            loadDesignJs(design);
        }

        // Apply specific font size for 'dinpro' design
        if (design === 'dinpro') {
            document.documentElement.style.fontSize = '105%';
        }


    } else {
        console.log('Custom.js: No design parameter found.');
    }
}

/**
 * Dynamically loads a CSS file based on the design parameter.
 * @param {string} design - The design name (e.g., 'petrol1')
 */
function loadDesignCss(design) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = `/nde/custom/41SLSP_ETH-ETH_CUSTOMDESIGN/assets/css/${design}.css`;
    link.media = 'all';
    document.head.appendChild(link);
    console.log(`Custom.js: Loaded CSS for ${design}`);
}

/**
 * Dynamically loads a JS file based on the design parameter.
 * @param {string} design - The design name (e.g., 'petrol2')
 */
function loadDesignJs(design) {
    const script = document.createElement('script');
    script.src = `/nde/custom/41SLSP_ETH-ETH_CUSTOMDESIGN/assets/js/${design}.js`;
    script.defer = true;
    document.body.appendChild(script);
    console.log(`Custom.js: Loaded JS for ${design}`);
}

// Check document readiness and apply design
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyDesign);
} else {
    applyDesign(); // Document already ready, run immediately
}
