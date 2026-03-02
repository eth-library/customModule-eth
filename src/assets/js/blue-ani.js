/**
 * Injects a canvas element for the particle background animation.
 * Uses a polling mechanism to wait for the target container to exist.
 */
function injectParticleBackground() {
    console.log('blue-ani.js: Initializing particle background...');
    const selector = '.top-bar-background-image';
    let attempts = 0;
    const maxAttempts = 20; // 10 seconds

    const interval = setInterval(() => {
        attempts++;
        const container = document.querySelector(selector);

        if (container) {
            clearInterval(interval);
            console.log('blue-ani.js: Container found, injecting particle canvas.');

            if (container.querySelector('#particle-canvas')) return;

            const canvas = document.createElement('canvas');
            canvas.id = 'particle-canvas';

            // Prepend to ensure it's the first child (behind content with correct z-index)
            if (container.firstChild) {
                container.insertBefore(canvas, container.firstChild);
            } else {
                container.appendChild(canvas);
            }

            initParticles(canvas, container);

        } else if (attempts >= maxAttempts) {
            clearInterval(interval);
            console.log('blue-ani.js: Container for particles not found.');
        }
    }, 500);
}

/**
 * Initializes the particle animation on the given canvas.
 * Creates moving dots connected by lines to simulate a network/constellation effect.
 * @param {HTMLCanvasElement} canvas 
 * @param {HTMLElement} container 
 */
function initParticles(canvas, container) {
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    // Resize handler to adjust canvas size
    const resize = () => {
        width = container.offsetWidth;
        height = container.offsetHeight;
        canvas.width = width;
        canvas.height = height;
        initParticlesArray();
    };

    // Initialize particle objects with random positions and velocities
    const initParticlesArray = () => {
        particles = [];
        const numberOfParticles = (width * height) / 9000;
        for (let i = 0; i < numberOfParticles; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1
            });
        }
    };

    // Animation loop
    const animate = () => {
        ctx.clearRect(0, 0, width, height);

        // Particle style
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';

        for (let i = 0; i < particles.length; i++) {
            let p = particles[i];
            p.x += p.vx;
            p.y += p.vy;

            // Bounce off edges
            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            // Draw particle
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();

            // Draw connecting lines if close enough
            for (let j = i; j < particles.length; j++) {
                let p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 100) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    animate();
}

// Start immediately when loaded
injectParticleBackground();
