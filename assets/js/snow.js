/* ==========================================
   Snow Particle Animation - Pure Canvas JS
   Konsep: particles.js snow config
   ========================================== */

(function () {
    const canvas = document.getElementById("snow-canvas");
    const ctx = canvas.getContext("2d");

    // --- Config (mirror particles.js snow settings) ---
    const CONFIG = {
        count: 200,
        color: "#ffffff",
        minSize: 1,
        maxSize: 10,
        minOpacity: 0.1,
        maxOpacity: 0.8,
        speed: 2,
        direction: "bottom",   // jatuh ke bawah
        // Interactivity
        hover: {
            enable: true,
            mode: "bubble",      // partikel mengecil saat hover
            distance: 400,
            size: 4,
        },
        click: {
            enable: true,
            mode: "repulse",     // partikel tersebar saat klik
            distance: 200,
            duration: 0.4,
        },
    };

    // --- Canvas Full Screen ---
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // --- Particle Class ---
    class Particle {
        constructor() {
            this.reset(true);
        }

        reset(randomY = false) {
            this.x = Math.random() * canvas.width;
            this.y = randomY
                ? Math.random() * canvas.height
                : -10;
            this.radius = CONFIG.minSize + Math.random() * (CONFIG.maxSize - CONFIG.minSize);
            this.baseRadius = this.radius;
            this.opacity = CONFIG.minOpacity + Math.random() * (CONFIG.maxOpacity - CONFIG.minOpacity);
            this.speedX = (Math.random() - 0.5) * 0.8; // sedikit drift horizontal
            this.speedY = 0.5 + Math.random() * CONFIG.speed;
            // repulse state
            this.repulseX = 0;
            this.repulseY = 0;
            this.repulseActive = false;
            this.repulseTimer = 0;
        }

        update(mouse, isRepulsing) {
            // --- Hover Bubble: perkecil radius saat dekat cursor ---
            if (CONFIG.hover.enable && mouse.x !== null) {
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONFIG.hover.distance) {
                    const ratio = 1 - dist / CONFIG.hover.distance;
                    this.radius = this.baseRadius - (this.baseRadius - CONFIG.hover.size) * ratio;
                    this.radius = Math.max(this.radius, 1);
                } else {
                    this.radius = this.baseRadius;
                }
            }

            // --- Click Repulse ---
            if (isRepulsing && mouse.x !== null) {
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONFIG.click.distance) {
                    const force = (CONFIG.click.distance - dist) / CONFIG.click.distance;
                    const angle = Math.atan2(dy, dx);
                    this.repulseX = Math.cos(angle) * force * 8;
                    this.repulseY = Math.sin(angle) * force * 8;
                    this.repulseActive = true;
                    this.repulseTimer = 60; // frame duration
                }
            }

            if (this.repulseActive) {
                this.x += this.repulseX;
                this.y += this.repulseY;
                this.repulseX *= 0.92; // gesekan
                this.repulseY *= 0.92;
                this.repulseTimer--;
                if (this.repulseTimer <= 0) this.repulseActive = false;
            } else {
                // --- Gerakan normal: jatuh ke bawah + drift ---
                this.y += this.speedY;
                this.x += this.speedX;
            }

            // --- Reset jika keluar layar ---
            if (
                this.y > canvas.height + 10 ||
                this.x < -20 ||
                this.x > canvas.width + 20
            ) {
                this.reset(false);
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${this.opacity})`;
            ctx.fill();
        }
    }

    // --- Init Particles ---
    let particles = [];

    function initParticles() {
        particles = [];
        for (let i = 0; i < CONFIG.count; i++) {
            particles.push(new Particle());
        }
    }

    // --- Mouse State ---
    const mouse = { x: null, y: null };
    let isRepulsing = false;
    let repulseFrames = 0;

    window.addEventListener("mousemove", (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener("mouseleave", () => {
        mouse.x = null;
        mouse.y = null;
    });

    window.addEventListener("click", (e) => {
        if (!CONFIG.click.enable) return;
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        isRepulsing = true;
        repulseFrames = Math.round(CONFIG.click.duration * 60);
    });

    // Touch support
    window.addEventListener("touchmove", (e) => {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener("touchstart", (e) => {
        if (!CONFIG.click.enable) return;
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        isRepulsing = true;
        repulseFrames = Math.round(CONFIG.click.duration * 60);
    }, { passive: true });

    // --- Animation Loop ---
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (isRepulsing) {
            repulseFrames--;
            if (repulseFrames <= 0) isRepulsing = false;
        }

        particles.forEach((p) => {
            p.update(mouse, isRepulsing);
            p.draw();
        });

        requestAnimationFrame(animate);
    }

    // --- Resize Handler ---
    window.addEventListener("resize", () => {
        resizeCanvas();
        initParticles();
    });

    // --- Retina / HiDPI Support ---
    function setupRetina() {
        const dpr = window.devicePixelRatio || 1;
        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = window.innerHeight + "px";
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.scale(dpr, dpr);
    }

    // --- Kickoff ---
    resizeCanvas();
    initParticles();
    animate();
})();
