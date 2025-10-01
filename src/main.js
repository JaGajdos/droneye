import * as THREE from 'three';

// Global variables
let scene, camera, renderer, particles, animationId;
let mouseX = 0, mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
let scrollY = 0;
let centerObject;
let targetY = 0; // Target position for smooth movement
let animationStarted = false;
let touchStartY = 0;
let lastTouchY = 0;

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
    
    // Add wheel event listener for canvas scrolling
    document.addEventListener('wheel', onWheel, false);
    
    // Add touch event listeners for mobile scrolling
    document.addEventListener('touchstart', onTouchStart, false);
    document.addEventListener('touchmove', onTouchMove, false);
    
    // Start animation
    animate();
    
    console.log('Three.js animation started!');
}

// Create 3-layer object system based on viewport
function createParticleSystem() {
    // Top third - one gray cube
    const topGeometry = new THREE.BoxGeometry(100, 100, 100);
    const topMaterial = new THREE.MeshLambertMaterial({ 
        color: new THREE.Color().setHSL(0, 0, 0.5) 
    });
    const topCube = new THREE.Mesh(topGeometry, topMaterial);
    topCube.position.set(0, 1000, 0); // Upper third
    topCube.userData = { layer: 'top', speed: 0.5 };
    scene.add(topCube);
    
    // Middle third - one red sphere
    const middleGeometry = new THREE.SphereGeometry(80, 16, 16);
    const middleMaterial = new THREE.MeshLambertMaterial({ 
        color: new THREE.Color().setHSL(0, 0.8, 0.6) 
    });
    const middleSphere = new THREE.Mesh(middleGeometry, middleMaterial);
    middleSphere.position.set(0, 0, 0); // Middle third
    middleSphere.userData = { layer: 'middle', speed: 1.0 };
    scene.add(middleSphere);
    
    // Bottom third - one yellow cylinder
    const bottomGeometry = new THREE.CylinderGeometry(50, 50, 120, 16);
    const bottomMaterial = new THREE.MeshLambertMaterial({ 
        color: new THREE.Color().setHSL(0.15, 0.8, 0.6) 
    });
    const bottomCylinder = new THREE.Mesh(bottomGeometry, bottomMaterial);
    bottomCylinder.position.set(0, -1000, 0); // Lower third
    bottomCylinder.userData = { layer: 'bottom', speed: 1.5 };
    scene.add(bottomCylinder);
}

// Create center object
function createCenterObject() {
    // Create a drone-like object in the center
    const droneGroup = new THREE.Group();
    
    // Main body
    const bodyGeometry = new THREE.BoxGeometry(20, 8, 12);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    droneGroup.add(body);
    
    // Propellers
    const propGeometry = new THREE.CylinderGeometry(1, 1, 0.5, 8);
    const propMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    
    const propPositions = [
        { x: -15, y: 5, z: -8 },
        { x: 15, y: 5, z: -8 },
        { x: -15, y: 5, z: 8 },
        { x: 15, y: 5, z: 8 }
    ];
    
    propPositions.forEach(pos => {
        const propeller = new THREE.Mesh(propGeometry, propMaterial);
        propeller.position.set(pos.x, pos.y, pos.z);
        propeller.rotation.x = Math.PI / 2;
        droneGroup.add(propeller);
    });
    
    // Landing gear
    const gearGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 6);
    const gearMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    
    const gearPositions = [
        { x: -12, y: -4, z: -6 },
        { x: 12, y: -4, z: -6 },
        { x: -12, y: -4, z: 6 },
        { x: 12, y: -4, z: 6 }
    ];
    
    gearPositions.forEach(pos => {
        const gear = new THREE.Mesh(gearGeometry, gearMaterial);
        gear.position.set(pos.x, pos.y, pos.z);
        droneGroup.add(gear);
    });
    
    // Position in center
    droneGroup.position.set(0, 0, 0);
    centerObject = droneGroup;
    scene.add(centerObject);
}

// Animation loop
function animate() {
    animationId = requestAnimationFrame(animate);
    
    const time = Date.now() * 0.001;
    
    // Animate objects by layers
    scene.children.forEach((child) => {
        if (child.userData && child.userData.layer) {
            const speed = child.userData.speed;
            
            // Rotate objects
            child.rotation.x += time * speed * 0.01;
            child.rotation.y += time * speed * 0.015;
            child.rotation.z += time * speed * 0.005;
            
            // Float objects
            child.position.y += Math.sin(time * speed + child.position.x * 0.01) * 0.5;
            child.position.x += Math.cos(time * speed + child.position.z * 0.01) * 0.3;
        }
    });
    
    // Move center object based on scroll with smooth interpolation (only if animation started)
    if (centerObject && animationStarted) {
        // Smooth movement to target position
        centerObject.position.y += (targetY - centerObject.position.y) * 0.1;
        
        // Animate propellers
        centerObject.children.forEach((child, index) => {
            if (index > 0 && index <= 4) { // Skip body (index 0) and landing gear (last 4)
                child.rotation.z += 0.3; // Rotate propellers
            }
        });
        
        // Gentle floating motion
        centerObject.position.y += Math.sin(time * 2) * 0.5;
    }
    
    // Camera follows center object (only if animation started)
    if (centerObject && animationStarted) {
        camera.position.x = centerObject.position.x + mouseX * 0.1;
        camera.position.y = centerObject.position.y + 100 - mouseY * 0.1;
        camera.position.z = centerObject.position.z + 200;
        
        // Camera looks at center object
        camera.lookAt(centerObject.position);
    } else {
        // Default camera position when animation not started
        camera.position.x += (mouseX - camera.position.x) * 0.05;
        camera.position.y += (-mouseY - camera.position.y) * 0.05;
        camera.position.z = 500;
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
    targetY = -scrollY * 0.5; // Set target position
}

// Wheel handler for canvas scrolling
function onWheel(event) {
    event.preventDefault();
    
    // Update scrollY based on wheel delta
    scrollY += event.deltaY * 0.5;
    targetY = -scrollY * 0.5; // Set target position
    
    // Also scroll the page
    window.scrollBy(0, event.deltaY * 0.5);
}

// Touch event handlers for mobile scrolling
function onTouchStart(event) {
    if (event.touches.length === 1) {
        touchStartY = event.touches[0].clientY;
        lastTouchY = touchStartY;
    }
}

function onTouchMove(event) {
    if (event.touches.length === 1) {
        event.preventDefault();
        
        const touchY = event.touches[0].clientY;
        const deltaY = lastTouchY - touchY;
        
        // Update scrollY based on touch movement
        scrollY += deltaY * 0.5;
        targetY = -scrollY * 0.5; // Set target position
        
        // Also scroll the page
        window.scrollBy(0, deltaY * 0.5);
        
        lastTouchY = touchY;
    }
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
    
    // Start animation and create drone
    if (!animationStarted) {
        animationStarted = true;
        createCenterObject();
        console.log('Drone created and animation started!');
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
