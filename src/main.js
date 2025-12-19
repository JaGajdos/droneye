// Global variables

// Internationalization
let currentLanguage = 'sk';
let translations = {};

// Initialize internationalization
async function initInternationalization() {
    // Check URL parameter for language first, then localStorage, then default to 'sk'
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam && ['sk', 'en', 'de'].includes(langParam)) {
        currentLanguage = langParam;
        localStorage.setItem('language', currentLanguage);
    } else {
        currentLanguage = localStorage.getItem('language') || 'sk';
    }
    
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
        // Get base URL - handle both local dev and GitHub Pages
        let baseUrl = import.meta.env.BASE_URL;
        
        // If BASE_URL is not set or is '/', detect from current path
        if (!baseUrl || baseUrl === '/') {
            const path = window.location.pathname;
            // Remove filename and get directory path
            const pathDir = path.substring(0, path.lastIndexOf('/') + 1);
            baseUrl = pathDir;
        }
        
        // Ensure baseUrl ends with /
        if (!baseUrl.endsWith('/')) {
            baseUrl += '/';
        }
        
        const translationPath = `${baseUrl}src/locales/${currentLanguage}.json`;
        console.log('Loading translations from:', translationPath, 'Base URL:', baseUrl);
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
            
            // Try to load Slovak with same base URL logic
            let baseUrl = import.meta.env.BASE_URL;
            if (!baseUrl || baseUrl === '/') {
                const path = window.location.pathname;
                const pathDir = path.substring(0, path.lastIndexOf('/') + 1);
                baseUrl = pathDir;
            }
            if (!baseUrl.endsWith('/')) {
                baseUrl += '/';
            }
            
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
            // Check if translation contains HTML (like links)
            if (translation.includes('<a ') || translation.includes('<br>') || translation.includes('<strong>') || translation.includes('<em>')) {
                element.innerHTML = translation;
            } else {
                element.textContent = translation;
            }
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
    
    // Update page title
    const titleElement = document.querySelector('title[data-i18n-title]');
    if (titleElement) {
        const key = titleElement.getAttribute('data-i18n-title');
        const translation = getNestedTranslation(translations, key);
        if (translation) {
            titleElement.textContent = translation;
            translatedCount++;
        } else {
            console.warn('Title translation not found for key:', key);
        }
    }
    
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
    initServicesCarousel();
    
    // Only show loading screen on homepage (CSS handles hiding on subpages)
    const isHomepage = window.location.pathname === '/' || window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    if (isHomepage) {
        hideLoadingScreen();
    }
});


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
    // Check for system preference or saved theme
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme') || (prefersDark ? 'dark' : 'light');
    setTheme(savedTheme);
    
    // Add theme switcher to navigation if it doesn't exist
    if (!document.querySelector('.theme-switcher')) {
        addThemeSwitcher();
    }
    
    // Listen for system theme changes (only if user hasn't manually set a theme)
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
}

function setTheme(themeName) {
    // Map old theme names to new ones
    const themeMap = {
        'royal-blue': 'light',
        'forest-green': 'light',
        'sunset-orange': 'light',
        'deep-purple': 'light',
        'ocean-blue': 'light'
    };
    const mappedTheme = themeMap[themeName] || themeName;
    
    document.documentElement.setAttribute('data-theme', mappedTheme);
    localStorage.setItem('theme', mappedTheme);
    
    // Update theme switcher if it exists
    const themeSwitcher = document.querySelector('.theme-switcher');
    if (themeSwitcher) {
        const themeBtn = themeSwitcher.querySelector('.theme-btn');
        if (themeBtn) {
            themeBtn.setAttribute('data-theme', mappedTheme);
            const icon = mappedTheme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
            themeBtn.innerHTML = icon;
        }
        
        // Update active state in options
        themeSwitcher.querySelectorAll('.theme-option').forEach(option => {
            option.classList.toggle('active', option.getAttribute('data-theme') === mappedTheme);
        });
    }
    
    // Update footer theme switcher if it exists
    const footerThemeBtns = document.querySelectorAll('.footer-theme-btn');
    footerThemeBtns.forEach(btn => {
        const btnTheme = btn.getAttribute('data-theme');
        btn.classList.toggle('active', btnTheme === mappedTheme);
    });
    
    // Update navbar background if scrolled
    if (navbar) {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > 50) {
            navbar.style.background = 'var(--footer-bg)';
        } else {
            navbar.style.background = 'var(--navbar-bg)';
        }
    }
}

function addThemeSwitcher() {
    const navContainer = document.querySelector('.nav-container');
    if (!navContainer) return;
    
    const themeSwitcher = document.createElement('div');
    themeSwitcher.className = 'theme-switcher';
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const sunIcon = '<i class="fas fa-sun"></i>';
    const moonIcon = '<i class="fas fa-moon"></i>';
    const currentIcon = currentTheme === 'dark' ? moonIcon : sunIcon;
    
    themeSwitcher.innerHTML = `
        <div class="theme-dropdown">
            <button class="theme-btn" data-theme="${currentTheme}">${currentIcon}</button>
            <div class="theme-options">
                <div class="theme-option" data-theme="dark">${moonIcon} Dark</div>
                <div class="theme-option" data-theme="light">${sunIcon} Light</div>
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
            // Update button theme attribute and icon
            themeBtn.setAttribute('data-theme', theme);
            const icon = theme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
            themeBtn.innerHTML = icon;
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

// Services Carousel
function initServicesCarousel() {
    const carousel = document.querySelector('.services-carousel');
    if (!carousel) return;
    
    const slides = carousel.querySelectorAll('.carousel-slide');
    const tabs = carousel.querySelectorAll('.carousel-tab');
    
    let currentSlide = 0;
    const totalSlides = slides.length;
    
    function showSlide(index) {
        // Remove active class from all slides and tabs
        slides.forEach(slide => slide.classList.remove('active'));
        tabs.forEach(tab => tab.classList.remove('active'));
        
        // Add active class to current slide and tab
        if (slides[index]) {
            slides[index].classList.add('active');
        }
        if (tabs[index]) {
            tabs[index].classList.add('active');
        }
        
        currentSlide = index;
        
        // Update arrow event listeners for new active slide
        updateArrowListeners();
    }
    
    function updateArrowListeners() {
        const activeSlide = carousel.querySelector('.carousel-slide.active');
        if (!activeSlide) return;
        
        const card = activeSlide.querySelector('.service-card-carousel');
        if (!card) return;
        
        const prevButton = card.querySelector('.carousel-arrow-prev');
        const nextButton = card.querySelector('.carousel-arrow-next');
        
        // Remove old listeners by cloning
        if (prevButton) {
            const newPrev = prevButton.cloneNode(true);
            prevButton.parentNode.replaceChild(newPrev, prevButton);
            newPrev.addEventListener('click', () => {
                const prev = (currentSlide - 1 + totalSlides) % totalSlides;
                showSlide(prev);
            });
        }
        
        if (nextButton) {
            const newNext = nextButton.cloneNode(true);
            nextButton.parentNode.replaceChild(newNext, nextButton);
            newNext.addEventListener('click', () => {
                const next = (currentSlide + 1) % totalSlides;
                showSlide(next);
            });
        }
    }
    
    // Tab clicks
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            showSlide(index);
        });
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!carousel.closest('.page.active')) return;
        
        if (e.key === 'ArrowLeft') {
            const prev = (currentSlide - 1 + totalSlides) % totalSlides;
            showSlide(prev);
        } else if (e.key === 'ArrowRight') {
            const next = (currentSlide + 1) % totalSlides;
            showSlide(next);
        }
    });
    
    // Initialize first slide
    showSlide(0);
}

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
            // Scrolled down - use footer background color
            const currentTheme = document.documentElement.getAttribute('data-theme');
            if (currentTheme === 'dark') {
                // In dark mode, use footer background color when scrolled
                navbar.style.background = 'var(--footer-bg)';
            } else {
                navbar.style.background = 'var(--primary-color)';
            }
        } else {
            // At top - use navbar-bg variable (transparent for both themes)
            navbar.style.background = 'var(--navbar-bg)';
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

// Photo Gallery Lightbox
let currentGallery = [];
let currentPhotoIndex = 0;
let lightbox = null;
let lightboxImage = null;
let lightboxCurrent = null;
let lightboxTotal = null;

function initPhotoGallery() {
    const photoItems = document.querySelectorAll('.photo-item[data-gallery]');
    lightbox = document.getElementById('photo-lightbox');
    lightboxImage = document.getElementById('lightbox-image');
    lightboxCurrent = document.getElementById('lightbox-current');
    lightboxTotal = document.getElementById('lightbox-total');
    
    if (!lightbox || !lightboxImage) return;
    
    const closeBtn = document.querySelector('.photo-lightbox-close');
    const prevBtn = document.querySelector('.photo-lightbox-prev');
    const nextBtn = document.querySelector('.photo-lightbox-next');
    
    // Open lightbox on photo item click
    photoItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const galleryImages = item.querySelectorAll('.photo-gallery-images img');
            if (galleryImages.length === 0) return;
            
            currentGallery = Array.from(galleryImages).map(img => ({
                src: img.src,
                alt: img.alt
            }));
            currentPhotoIndex = 0;
            
            openLightbox();
        });
    });
    
    // Close lightbox
    if (closeBtn) {
        closeBtn.addEventListener('click', closeLightbox);
    }
    
    // Close on background click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    // Navigation buttons
    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showPreviousPhoto();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showNextPhoto();
        });
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowLeft') {
            showPreviousPhoto();
        } else if (e.key === 'ArrowRight') {
            showNextPhoto();
        }
    });
}

function openLightbox() {
    if (!lightbox || currentGallery.length === 0) return;
    
    // Hide navbar when lightbox opens
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        navbar.style.transform = 'translateY(-100%)';
    }
    
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateLightboxImage();
}

function closeLightbox() {
    if (!lightbox) return;
    
    // Show navbar when lightbox closes
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        navbar.style.transform = 'translateY(0)';
    }
    
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    currentGallery = [];
    currentPhotoIndex = 0;
}

function updateLightboxImage() {
    if (!lightboxImage || !lightboxCurrent || !lightboxTotal || currentGallery.length === 0) return;
    
    const photo = currentGallery[currentPhotoIndex];
    lightboxImage.src = photo.src;
    lightboxImage.alt = photo.alt;
    lightboxCurrent.textContent = currentPhotoIndex + 1;
    lightboxTotal.textContent = currentGallery.length;
    
    // Show/hide navigation buttons based on gallery size
    const prevBtn = document.querySelector('.photo-lightbox-prev');
    const nextBtn = document.querySelector('.photo-lightbox-next');
    
    if (prevBtn) {
        prevBtn.style.display = currentGallery.length > 1 ? 'flex' : 'none';
    }
    if (nextBtn) {
        nextBtn.style.display = currentGallery.length > 1 ? 'flex' : 'none';
    }
    
    // Hide counter if only one photo
    const counter = document.querySelector('.photo-lightbox-counter');
    if (counter) {
        counter.style.display = currentGallery.length > 1 ? 'block' : 'none';
    }
}

function showPreviousPhoto() {
    if (currentGallery.length === 0) return;
    
    currentPhotoIndex = (currentPhotoIndex - 1 + currentGallery.length) % currentGallery.length;
    updateLightboxImage();
}

function showNextPhoto() {
    if (currentGallery.length === 0) return;
    
    currentPhotoIndex = (currentPhotoIndex + 1) % currentGallery.length;
    updateLightboxImage();
}

// Initialize photo gallery when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhotoGallery);
} else {
    initPhotoGallery();
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

// Initialize footer theme switcher
function initFooterThemeSwitcher() {
    const footerThemeBtns = document.querySelectorAll('.footer-theme-btn');
    footerThemeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme');
            setTheme(theme);
        });
    });
    
    // Set initial active state
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    footerThemeBtns.forEach(btn => {
        const btnTheme = btn.getAttribute('data-theme');
        btn.classList.toggle('active', btnTheme === currentTheme);
    });
}

// Initialize footer theme switcher when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFooterThemeSwitcher);
} else {
    initFooterThemeSwitcher();
}
