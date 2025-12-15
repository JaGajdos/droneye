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
let targetY = 200; // Start at ocean level
let animationStarted = false;
let space, spaceGeometry, spaceMaterial;

// Performance monitoring
let frameCount = 0;
let lastTime = performance.now();
let fps = 60;
let frameRateLimit = 60; // Target FPS
let lastFrameTime = 0;

// Internationalization
let currentLanguage = 'sk';
let translations = {};

// Initialize internationalization
async function initInternationalization() {
    // Load saved language from localStorage or default to 'sk'
    currentLanguage = localStorage.getItem('language') || 'sk';
    
    // Set HTML lang attribute to current language (default: 'sk')
    document.documentElement.setAttribute('lang', currentLanguage);
    
    // Load translations
    await loadTranslations();
    
    // Apply translations
    applyTranslations();
    
    // Show content after translations are applied
    document.documentElement.style.visibility = 'visible';
    
    // Initialize language switcher
    initLanguageSwitcher();
}

// Load translation files
async function loadTranslations() {
    try {
        const baseUrl = import.meta.env.BASE_URL || '/';
        const translationPath = `${baseUrl}src/locales/${currentLanguage}.json`;
        console.log('Loading translations from:', translationPath);
        const response = await fetch(translationPath);
        
        if (!response.ok) {
            throw new Error(`Failed to load translations: ${response.status}`);
        }
        
        translations = await response.json();
        console.log('Translations loaded successfully:', currentLanguage);
    } catch (error) {
        console.error('Error loading translations:', error);
        // Fallback to Slovak if loading fails
        if (currentLanguage !== 'sk') {
            console.log('Falling back to Slovak translations');
            currentLanguage = 'sk';
            const baseUrl = import.meta.env.BASE_URL || '/';
            const response = await fetch(`${baseUrl}src/locales/sk.json`);
            if (response.ok) {
                translations = await response.json();
            }
        }
    }
}

// Apply translations to elements
function applyTranslations() {
    console.log('Applying translations, current language:', currentLanguage);
    let translatedCount = 0;
    
    // Update elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = getNestedTranslation(translations, key);
        if (translation) {
            element.textContent = translation;
            translatedCount++;
        } else {
            console.warn('Translation not found for key:', key);
        }
    });
    
    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        const translation = getNestedTranslation(translations, key);
        if (translation) {
            element.placeholder = translation;
            translatedCount++;
        } else {
            console.warn('Placeholder translation not found for key:', key);
        }
    });
    
    console.log('Applied', translatedCount, 'translations');
}

// Get nested translation value
function getNestedTranslation(obj, path) {
    return path.split('.').reduce((current, key) => {
        if (current && current[key] !== undefined) {
            return current[key];
        }
        // Handle array indices (e.g., "items.0")
        if (current && Array.isArray(current) && !isNaN(key)) {
            return current[parseInt(key)];
        }
        return null;
    }, obj);
}

// Initialize language switcher
function initLanguageSwitcher() {
    const languageOptions = document.querySelectorAll('.language-option');
    console.log('Initializing language switcher, found options:', languageOptions.length);
    
    // Remove all existing listeners by cloning and replacing
    languageOptions.forEach(option => {
        const newOption = option.cloneNode(true);
        option.parentNode.replaceChild(newOption, option);
    });
    
    // Get fresh references after cloning
    const freshOptions = document.querySelectorAll('.language-option');
    
    freshOptions.forEach(option => {
        option.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const newLang = option.getAttribute('data-lang');
            console.log('Language option clicked:', newLang, 'Current:', currentLanguage);
            
            if (newLang !== currentLanguage) {
                console.log('Switching language from', currentLanguage, 'to', newLang);
                currentLanguage = newLang;
                localStorage.setItem('language', currentLanguage);
                
                // Update HTML lang attribute
                document.documentElement.setAttribute('lang', currentLanguage);
                
                // Load new translations
                await loadTranslations();
                
                // Apply new translations
                applyTranslations();
                
                // Update active language option
                updateActiveLanguageOption();
            } else {
                console.log('Language already set to', currentLanguage);
            }
        });
    });
    
    // Set initial active language
    updateActiveLanguageOption();
}

// Update active language option
function updateActiveLanguageOption() {
    const languageOptions = document.querySelectorAll('.language-option');
    console.log('Updating active language option, currentLanguage:', currentLanguage);
    languageOptions.forEach(option => {
        const lang = option.getAttribute('data-lang');
        option.classList.remove('active');
        if (lang === currentLanguage) {
            option.classList.add('active');
            console.log('Set active class on:', lang);
        }
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initInternationalization();
    initNavigation();
    initThemeSwitcher();
    initTeamCards();
    
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
    camera.position.set(30, 200, 1000); // Start at ocean level
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        alpha: true,
        antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;
    
    // Performance optimizations
    renderer.shadowMap.enabled = false; // Disable shadows for better performance
    renderer.antialias = false; // Disable antialiasing for better performance
    
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
    
    // Water geometry (infinite ocean effect)
    const waterGeometry = new THREE.PlaneGeometry(50000, 50000, 32, 32); // Massive ocean for infinite effect
    
    // Water material with ocean shader (heavily optimized for performance)
    water = new Water(waterGeometry, {
        textureWidth: 128, // Further reduced for better performance
        textureHeight: 128, // Further reduced for better performance
        waterNormals: new THREE.TextureLoader().load('https://threejs.org/examples/textures/waternormals.jpg', function (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }),
        sunDirection: new THREE.Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x000000, // Pure black ocean to prevent blue tint
        distortionScale: 0.3, // Much smaller waves for less rounded ocean
        size: 0.5, // Smaller wave size for less rounded ocean
        fog: scene.fog !== undefined
    });
    
    // Position water for infinite ocean effect (extended left)
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0; // Center of scene
    water.position.x = -5000; // Extended left for better coverage
    water.position.z = 0; // Center depth
    water.userData = { layer: 'ocean', speed: 1.0 };
    scene.add(water);
    
    // Create sky for infinite ocean effect
    sky = new Sky();
    sky.scale.setScalar(50000); // Much larger sky to match ocean
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
    
    // Create space effect above ocean
    createSpace();
}

// Create space effect above ocean
function createSpace() {
    // Create space geometry (much larger sphere for flat horizon)
    spaceGeometry = new THREE.SphereGeometry(100000, 32, 32);
    
    // Create space material with stars
    spaceMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0.0 },
            resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform vec2 resolution;
            varying vec2 vUv;
            
            // Simple random function
            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }
            
            // Create small star dots
            float star(vec2 uv, float size) {
                float star = random(uv);
                if (star > 0.999) { // Much much fewer stars
                    return 1.0;
                }
                return 0.0;
            }
            
            void main() {
                vec2 uv = vUv;
                
                // Calculate height factor (0.0 = bottom, 1.0 = top)
                float heightFactor = uv.y;
                
                // Create gradient from sun (bottom) to space (top)
                vec3 sunColor = vec3(1.0, 0.8, 0.4); // Warm sun color
                vec3 spaceColor = vec3(0.0, 0.0, 0.0); // Black space
                
                // Smooth transition between sun and space
                vec3 baseColor = mix(sunColor, spaceColor, smoothstep(0.3, 0.8, heightFactor));
                
                // Add stars only in upper part (space area) and only distant ones
                float starField = 0.0;
                if (heightFactor > 0.7) { // Only in top 30% of space
                    // Only distant stars, no close ones
                    starField += star(uv * 30.0, 0.1) * 0.4; // Very few distant stars
                    
                    // Add subtle twinkling effect
                    float twinkle = sin(time * 1.5 + uv.x * 5.0 + uv.y * 4.0) * 0.1 + 0.9;
                    starField *= twinkle;
                }
                
                // Remove atmospheric glow to prevent blue tint on ocean
                float atmosphere = 0.0;
                
                // Combine all effects
                vec3 color = baseColor;
                color += vec3(starField); // White stars
                // No atmospheric glow to prevent blue tint
                
                gl_FragColor = vec4(color, 1.0);
            }
        `,
        side: THREE.BackSide // Render inside of sphere
    });
    
    // Create space mesh (positioned above ocean to prevent blue tint)
    space = new THREE.Mesh(spaceGeometry, spaceMaterial);
    space.position.y = 1000; // Position above ocean
    space.position.x = 0; // Center horizontally
    space.position.z = 0; // Center depth
    space.userData = { layer: 'space', speed: 1.0 };
    scene.add(space);
}


// Animation loop
function animate() {
    animationId = requestAnimationFrame(animate);
    
    const currentTime = performance.now();
    const deltaTime = currentTime - lastFrameTime;
    
    // Frame rate limiting for better performance
    if (deltaTime < 1000 / frameRateLimit) {
        return;
    }
    
    lastFrameTime = currentTime;
    const time = currentTime * 0.001;
    
    // Performance monitoring
    frameCount++;
    if (currentTime - lastTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;
        
        // Adaptive quality based on FPS
        if (fps < 30 && water) {
            // Reduce quality for better performance
            water.material.uniforms['distortionScale'].value = Math.max(0.5, water.material.uniforms['distortionScale'].value - 0.1);
            water.material.uniforms['size'].value = Math.max(0.5, water.material.uniforms['size'].value - 0.1);
        } else if (fps > 50 && water) {
            // Increase quality if performance is good
            water.material.uniforms['distortionScale'].value = Math.min(2.0, water.material.uniforms['distortionScale'].value + 0.05);
            water.material.uniforms['size'].value = Math.min(2.0, water.material.uniforms['size'].value + 0.05);
        }
    }
    
    // Animate ocean water
    if (water) {
        water.material.uniforms['time'].value += 1.0 / 60.0;
    }
    
    // Animate space
    if (space && spaceMaterial) {
        spaceMaterial.uniforms['time'].value = time;
    }
    
    // Camera follows mouse for ocean scene
    //camera.position.x += (mouseX - camera.position.x) * 0.05;
    //camera.position.y += (-mouseY - camera.position.y) * 0.05;
    
    // Smooth camera movement up to space (like an elevator)
    camera.position.y += (targetY - camera.position.y) * 0.1;
    
    // Look forward (not at sun) for elevator-like movement
    const lookAtPoint = new THREE.Vector3(0, camera.position.y, camera.position.z - 100);
    camera.lookAt(lookAtPoint);
    
    renderer.render(scene, camera);
}

// Mouse movement handler
function onMouseMove(event) {
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;
}

// Scroll handler
function onScroll(event) {
    if (!animationStarted) return;
    
    scrollY = window.scrollY;
    targetY = Math.max(200, 200 + scrollY * 2); // Move camera up to space, but not below ocean level
}

// Wheel handler for canvas scrolling
function onWheel(event) {
    if (!animationStarted) return;
    
    event.preventDefault();
    
    // Update scrollY based on wheel delta
    scrollY += event.deltaY * 0.5;
    targetY = Math.max(200, 200 + scrollY * 2); // Move camera up to space, but not below ocean level
    
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
    
    // Fix all navigation links to use base path
    const basePath = import.meta.env.BASE_URL;
    
    // Fix all links starting with '/' to use base path
    function fixLinkPath(link) {
        const href = link.getAttribute('href');
        if (href && href.startsWith('/') && !href.startsWith(basePath) && !href.startsWith('//')) {
            // Remove leading slash and add base path
            const newHref = basePath + href.substring(1);
            link.setAttribute('href', newHref);
        }
    }
    
    // Fix navigation links
    navLinks.forEach(fixLinkPath);
    
    // Fix logo link
    const logoLink = document.querySelector('.logo-link');
    if (logoLink) {
        const href = logoLink.getAttribute('href');
        if (href === '/' || href === '') {
            logoLink.setAttribute('href', basePath);
        } else {
            fixLinkPath(logoLink);
        }
    }
    
    // Fix hero button links
    const heroButton = document.querySelector('.hero-button-secondary');
    if (heroButton) {
        fixLinkPath(heroButton);
    }
    
    // Fix footer links (if any)
    const footerLinks = document.querySelectorAll('footer a[href^="/"]');
    footerLinks.forEach(fixLinkPath);
    
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
    
    // Start animation and enable scroll
    if (!animationStarted) {
        animationStarted = true;
        console.log('Animation started and scroll enabled!');
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

// Team card mobile click handler
function initTeamCards() {
    const teamCards = document.querySelectorAll('.team-card');
    
    if (teamCards.length === 0) return;
    
    // Check if device is mobile/touch
    const isMobile = window.matchMedia('(max-width: 1024px)').matches || 'ontouchstart' in window;
    
    if (isMobile) {
        // Add click handler to each card
        teamCards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const wasActive = card.classList.contains('active');
                
                // Close all cards first
                teamCards.forEach(otherCard => {
                    otherCard.classList.remove('active');
                });
                
                // Toggle current card if it wasn't active
                if (!wasActive) {
                    card.classList.add('active');
                }
            });
        });
        
        // Close card when clicking outside (single listener for all cards)
        document.addEventListener('click', (e) => {
            let clickedInsideCard = false;
            teamCards.forEach(card => {
                if (card.contains(e.target)) {
                    clickedInsideCard = true;
                }
            });
            
            if (!clickedInsideCard) {
                teamCards.forEach(card => {
                    card.classList.remove('active');
                });
            }
        });
    }
}


// Navbar scroll behavior
let lastScrollTop = 0;
let scrollThreshold = 150; // Scroll distance before hiding navbar (not immediately)
let navbar = null;

function initNavbarScroll() {
    navbar = document.querySelector('.navbar');
    if (!navbar) return;
    
    let scrollTimeout;
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollDelta = scrollTop - lastScrollTop;
        
        // Clear timeout
        clearTimeout(scrollTimeout);
        
        // Update navbar background based on scroll position
        if (scrollTop > 50) {
            // Scrolled down - add royal blue background
            navbar.style.background = 'var(--primary-color)';
        } else {
            // At top - transparent background
            navbar.style.background = 'transparent';
        }
        
        // Handle navbar visibility based on scroll direction
        if (Math.abs(scrollDelta) > 5) { // Only react to significant scroll
            if (scrollDelta > 0 && scrollTop > scrollThreshold) {
                // Scrolling down and past threshold - hide navbar
                navbar.style.transform = 'translateY(-100%)';
            } else if (scrollDelta < 0) {
                // Scrolling up - show navbar
                navbar.style.transform = 'translateY(0)';
            }
        }
        
        lastScrollTop = scrollTop;
    }, { passive: true });
}

// Initialize navbar scroll behavior when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbarScroll);
} else {
    initNavbarScroll();
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
