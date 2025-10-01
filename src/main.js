import * as THREE from 'three';

// Global variables
let scene, camera, renderer, particles, animationId;
let mouseX = 0, mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

// Internationalization
let currentLanguage = 'sk';
let translations = {};

// Initialize internationalization
async function initInternationalization() {
    // Load saved language from localStorage or default to 'sk'
    currentLanguage = localStorage.getItem('language') || 'sk';
    
    // Load translations
    await loadTranslations();
    
    // Apply translations
    applyTranslations();
    
    // Initialize language switcher
    initLanguageSwitcher();
}

// Load translation files
async function loadTranslations() {
    try {
        const response = await fetch(`/src/locales/${currentLanguage}.json`);
        translations = await response.json();
    } catch (error) {
        console.error('Error loading translations:', error);
        // Fallback to Slovak if loading fails
        if (currentLanguage !== 'sk') {
            currentLanguage = 'sk';
            const response = await fetch('/src/locales/sk.json');
            translations = await response.json();
        }
    }
}

// Apply translations to elements
function applyTranslations() {
    // Update elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = getNestedTranslation(translations, key);
        if (translation) {
            element.textContent = translation;
        }
    });
    
    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        const translation = getNestedTranslation(translations, key);
        if (translation) {
            element.placeholder = translation;
        }
    });
}

// Get nested translation value
function getNestedTranslation(obj, path) {
    return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : null;
    }, obj);
}

// Initialize language switcher
function initLanguageSwitcher() {
    const languageOptions = document.querySelectorAll('.language-option');
    
    languageOptions.forEach(option => {
        option.addEventListener('click', async (e) => {
            e.preventDefault();
            const newLang = option.getAttribute('data-lang');
            
            if (newLang !== currentLanguage) {
                currentLanguage = newLang;
                localStorage.setItem('language', currentLanguage);
                
                // Load new translations
                await loadTranslations();
                
                // Apply new translations
                applyTranslations();
                
                // Update active language option
                updateActiveLanguageOption();
            }
        });
    });
    
    // Set initial active language
    updateActiveLanguageOption();
}

// Update active language option
function updateActiveLanguageOption() {
    const languageOptions = document.querySelectorAll('.language-option');
    languageOptions.forEach(option => {
        option.classList.remove('active');
        if (option.getAttribute('data-lang') === currentLanguage) {
            option.classList.add('active');
        }
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initInternationalization();
    initNavigation();
    initThemeSwitcher();
    
    // Only show loading screen on homepage (CSS handles hiding on subpages)
    const isHomepage = window.location.pathname === '/' || window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    if (isHomepage) {
        hideLoadingScreen();
        // Initialize Three.js immediately on homepage
        initThreeJS();
    }
});

// Fast loading screen hide function removed - no longer needed

// Three.js Scene Setup
function initThreeJS() {
    const canvas = document.getElementById('three-canvas');
    
    if (!canvas) {
        console.warn('Three.js canvas not found');
        return;
    }
    
    // Scene
    scene = new THREE.Scene();
    
    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 500;
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        alpha: true,
        antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Create particle system
    createParticleSystem();
    
    // Add event listeners
    document.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);
    
    // Start animation
    animate();
    
    console.log('Three.js animation started!');
}

// Create animated particle system
function createParticleSystem() {
    const particleCount = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Random positions
        positions[i3] = (Math.random() - 0.5) * 2000;
        positions[i3 + 1] = (Math.random() - 0.5) * 2000;
        positions[i3 + 2] = (Math.random() - 0.5) * 2000;
        
        // Random colors (blue to purple gradient)
        const color = new THREE.Color();
        color.setHSL(0.6 + Math.random() * 0.2, 0.7, 0.5 + Math.random() * 0.3);
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    
    particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

// Animation loop
function animate() {
    animationId = requestAnimationFrame(animate);
    
    const time = Date.now() * 0.001;
    
    // Rotate particles
    if (particles) {
        particles.rotation.x = time * 0.05;
        particles.rotation.y = time * 0.075;
        
        // Move particles based on mouse position
        particles.rotation.x += mouseY * 0.0001;
        particles.rotation.y += mouseX * 0.0001;
    }
    
    // Camera movement
    camera.position.x += (mouseX - camera.position.x) * 0.05;
    camera.position.y += (-mouseY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);
    
    renderer.render(scene, camera);
}

// Mouse movement handler
function onMouseMove(event) {
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;
}

// Window resize handler
function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Navigation System
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    // Navigation click handlers
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Update active states
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Close mobile menu
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });
    
    // Mobile menu toggle
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        }
    });
}

// Loading screen
function hideLoadingScreen() {
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 300);
        }
    }, 500);
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Form submission handler
document.querySelector('.contact-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(this);
    const name = this.querySelector('input[type="text"]').value;
    const email = this.querySelector('input[type="email"]').value;
    const message = this.querySelector('textarea').value;
    
    // Simple validation
    if (!name || !email || !message) {
        alert(translations.contact?.form?.error || 'Prosím vyplňte všetky polia.');
        return;
    }
    
    // Simulate form submission
    const button = this.querySelector('button');
    const originalText = button.textContent;
    button.textContent = translations.contact?.form?.sending || 'Odosielam...';
    button.disabled = true;
    
    setTimeout(() => {
        alert(translations.contact?.form?.success || 'Ďakujeme za vašu správu! Čoskoro vás budeme kontaktovať.');
        this.reset();
        button.textContent = originalText;
        button.disabled = false;
    }, 2000);
});

// CTA Button handler - only on homepage
document.getElementById('start-animation-btn')?.addEventListener('click', function() {
    // Check if we're on homepage
    const isHomepage = window.location.pathname === '/' || window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    
    if (!isHomepage) {
        return; // Don't work on subpages
    }
    
    // Hide hero section immediately
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.classList.add('hidden');
    }
    
    // Keep button text as "Explore" and disable it
    this.disabled = true;
});

// Theme switching functionality
function initThemeSwitcher() {
    // Load saved theme from localStorage or default to 'royal-blue'
    const savedTheme = localStorage.getItem('theme') || 'royal-blue';
    setTheme(savedTheme);
    
    // Add theme switcher to navigation if it doesn't exist
    if (!document.querySelector('.theme-switcher')) {
        addThemeSwitcher();
    }
}

function setTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('theme', themeName);
    
    // Update theme switcher if it exists
    const themeSwitcher = document.querySelector('.theme-switcher');
    if (themeSwitcher) {
        const currentThemeBtn = themeSwitcher.querySelector(`[data-theme="${themeName}"]`);
        if (currentThemeBtn) {
            // Remove active class from all theme buttons
            themeSwitcher.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
            // Add active class to current theme button
            currentThemeBtn.classList.add('active');
        }
    }
}

function addThemeSwitcher() {
    const navContainer = document.querySelector('.nav-container');
    if (!navContainer) return;
    
    const themeSwitcher = document.createElement('div');
    themeSwitcher.className = 'theme-switcher';
    themeSwitcher.innerHTML = `
        <div class="theme-dropdown">
            <button class="theme-btn" data-theme="royal-blue">👑</button>
            <div class="theme-options">
                <div class="theme-option" data-theme="royal-blue">👑 Royal Blue</div>
                <div class="theme-option" data-theme="forest-green">🌲 Forest Green</div>
                <div class="theme-option" data-theme="sunset-orange">🌅 Sunset Orange</div>
                <div class="theme-option" data-theme="deep-purple">💜 Deep Purple</div>
                <div class="theme-option" data-theme="ocean-blue">🌊 Ocean Blue</div>
                <div class="theme-option" data-theme="dark">🌙 Dark</div>
                <div class="theme-option" data-theme="light">☀️ Light</div>
            </div>
        </div>
    `;
    
    // Insert theme switcher at the beginning of nav-container
    navContainer.insertBefore(themeSwitcher, navContainer.firstChild);
    
    // Add event listeners
    const themeBtn = themeSwitcher.querySelector('.theme-btn');
    const themeOptions = themeSwitcher.querySelectorAll('.theme-option');
    
    themeBtn.addEventListener('click', () => {
        themeSwitcher.classList.toggle('active');
    });
    
    themeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const theme = option.getAttribute('data-theme');
            setTheme(theme);
            themeSwitcher.classList.remove('active');
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!themeSwitcher.contains(e.target)) {
            themeSwitcher.classList.remove('active');
        }
    });
}

// Scroll effects removed - navbar stays blue

// Add intersection observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards for animation
document.querySelectorAll('.content-card, .service-card, .project-card, .team-card, .pricing-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

// Performance optimization
let lastTime = 0;
const targetFPS = 60;
const frameInterval = 1000 / targetFPS;

function optimizedAnimate(currentTime) {
    if (currentTime - lastTime >= frameInterval) {
        // Animation logic here
        lastTime = currentTime;
    }
    requestAnimationFrame(optimizedAnimate);
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    if (renderer) {
        renderer.dispose();
    }
});
