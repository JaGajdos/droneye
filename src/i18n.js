// Internationalization module
let currentLanguage = 'sk';
let translations = {};

// Get current language
export function getCurrentLanguage() {
    return currentLanguage;
}

// Get translations object
export function getTranslations() {
    return translations;
}

// Get base URL helper
function getBaseUrl() {
    let baseUrl = import.meta.env.BASE_URL;
    
    if (!baseUrl || baseUrl === '/') {
        const path = window.location.pathname;
        const pathDir = path.substring(0, path.lastIndexOf('/') + 1);
        baseUrl = pathDir;
    }
    
    if (!baseUrl.endsWith('/')) {
        baseUrl += '/';
    }
    
    return baseUrl;
}

// Load translation files
async function loadTranslations() {
    try {
        const baseUrl = getBaseUrl();
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
            
            const baseUrl = getBaseUrl();
            const response = await fetch(`${baseUrl}src/locales/sk.json`);
            if (response.ok) {
                translations = await response.json();
            }
        }
    }
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

// Initialize internationalization
export async function initInternationalization() {
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

