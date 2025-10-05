import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';

// Global variables
let scene, camera, renderer, animationId;
let mouseX = 0, mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
let water, sky, sun;
let scrollY = 0;
let targetZ = 100;

// Performance monitoring
let frameCount = 0;
let lastTime = performance.now();
let fps = 60;

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
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
    camera.position.set(30, 200, 1000);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        alpha: true,
        antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Create object system
    createParticleSystem();
    
    // Add event listeners
    document.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('scroll', onScroll, false);
    document.addEventListener('wheel', onWheel, false);
    
    // Start animation
    animate();
    
    console.log('Three.js animation started!');
}

// Create ocean scene only
function createParticleSystem() {
    // Create ocean scene
    createOcean();
}

// Create ocean effect for bottom third
function createOcean() {
    // Create sun
    sun = new THREE.Vector3();
    
    // Water geometry
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    
    // Water material with ocean shader (optimized for performance)
    water = new Water(waterGeometry, {
        textureWidth: 256, // Reduced from 512 for better performance
        textureHeight: 256, // Reduced from 512 for better performance
        waterNormals: new THREE.TextureLoader().load('https://threejs.org/examples/textures/waternormals.jpg', function (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }),
        sunDirection: new THREE.Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 2.0, // Reduced from 3.7 for better performance
        fog: scene.fog !== undefined
    });
    
    // Position water in center of scene
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0; // Center of scene
    water.userData = { layer: 'ocean', speed: 1.0 };
    scene.add(water);
    
    // Create sky for better ocean effect
    sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);
    
    // Configure sky
    const skyUniforms = sky.material.uniforms;
    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;
    
    // Configure sun position
    const parameters = {
        elevation: 2,
        azimuth: 180
    };
    
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const sceneEnv = new THREE.Scene();
    let renderTarget;
    
    function updateSun() {
        const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
        const theta = THREE.MathUtils.degToRad(parameters.azimuth);
        
        sun.setFromSphericalCoords(1, phi, theta);
        
        sky.material.uniforms['sunPosition'].value.copy(sun);
        water.material.uniforms['sunDirection'].value.copy(sun).normalize();
        
        if (renderTarget !== undefined) renderTarget.dispose();
        
        sceneEnv.add(sky);
        renderTarget = pmremGenerator.fromScene(sceneEnv);
        scene.add(sky);
        
        scene.environment = renderTarget.texture;
    }
    
    updateSun();
}


// Animation loop
function animate() {
    animationId = requestAnimationFrame(animate);
    
    const time = Date.now() * 0.001;
    const currentTime = performance.now();
    
    // Performance monitoring
    frameCount++;
    if (currentTime - lastTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;
        
        // Adaptive quality based on FPS
        if (fps < 30 && water) {
            // Reduce quality for better performance
            water.material.uniforms['distortionScale'].value = Math.max(1.0, water.material.uniforms['distortionScale'].value - 0.1);
        } else if (fps > 50 && water) {
            // Increase quality if performance is good
            water.material.uniforms['distortionScale'].value = Math.min(3.0, water.material.uniforms['distortionScale'].value + 0.05);
        }
    }
    
    // Animate ocean water
    if (water) {
        water.material.uniforms['time'].value += 1.0 / 60.0;
    }
    
    // Camera follows mouse for ocean scene
    //camera.position.x += (mouseX - camera.position.x) * 0.05;
    //camera.position.y += (-mouseY - camera.position.y) * 0.05;
    
    // Smooth camera movement forward/backward based on scroll
    camera.position.z += (targetZ - camera.position.z) * 0.1;
    
    // Look at sun position for better ocean view
    if (sun) {
        // Create a point in the distance where sun is
        const sunPosition = new THREE.Vector3(sun.x * 1000, sun.y * 1000, sun.z * 1000);
        camera.lookAt(sunPosition);
    } else {
        camera.lookAt(scene.position);
    }
    
    renderer.render(scene, camera);
}

// Mouse movement handler
function onMouseMove(event) {
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;
}

// Scroll handler
function onScroll(event) {
    scrollY = window.scrollY;
    targetZ = 100 + scrollY * 0.5; // Move camera forward/backward based on scroll
}

// Wheel handler for canvas scrolling
function onWheel(event) {
    event.preventDefault();
    
    // Update scrollY based on wheel delta
    scrollY += event.deltaY * 0.5;
    targetZ = 100 + scrollY * 0.5;
    
    // Also scroll the page
    window.scrollBy(0, event.deltaY * 0.5);
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


// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    if (renderer) {
        renderer.dispose();
    }
});
