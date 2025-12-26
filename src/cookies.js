// Cookie Consent Management
(function() {
    'use strict';

    const COOKIE_CONSENT_KEY = 'cookie_consent';
    const COOKIE_CONSENT_EXPIRY_DAYS = 365;

    // Cookie categories
    const COOKIE_CATEGORIES = {
        necessary: 'necessary',
        analytics: 'analytics',
        marketing: 'marketing'
    };

    // Check if user has already given consent
    function hasConsent() {
        return localStorage.getItem(COOKIE_CONSENT_KEY) !== null;
    }

    // Get consent data
    function getConsentData() {
        const data = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (!data) return null;
        try {
            return JSON.parse(data);
        } catch (e) {
            return null;
        }
    }

    // Save consent to localStorage
    function saveConsent(consentData) {
        const data = {
            ...consentData,
            timestamp: new Date().toISOString(),
            expiry: new Date(Date.now() + COOKIE_CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()
        };
        localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(data));
    }

    // Show cookie banner
    function showCookieBanner() {
        const banner = document.getElementById('cookie-banner');
        if (banner) {
            banner.style.display = 'block';
            setTimeout(() => {
                banner.classList.add('show');
            }, 100);
        }
    }

    // Hide cookie banner
    function hideCookieBanner() {
        const banner = document.getElementById('cookie-banner');
        if (banner) {
            banner.classList.remove('show');
            setTimeout(() => {
                banner.style.display = 'none';
            }, 300);
        }
    }

    // Show cookie settings modal
    function showCookieSettings() {
        const modal = document.getElementById('cookie-settings-modal');
        if (!modal) {
            createCookieSettingsModal();
        }
        const modalElement = document.getElementById('cookie-settings-modal');
        if (modalElement) {
            modalElement.style.display = 'flex';
            setTimeout(() => {
                modalElement.classList.add('show');
            }, 10);
            
            // Load current settings
            loadCookieSettings();
        }
    }

    // Hide cookie settings modal
    function hideCookieSettings() {
        const modal = document.getElementById('cookie-settings-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    }

    // Create cookie settings modal HTML
    function createCookieSettingsModal() {
        const modal = document.createElement('div');
        modal.id = 'cookie-settings-modal';
        modal.className = 'cookie-settings-modal';
        modal.innerHTML = `
            <div class="cookie-settings-content">
                <div class="cookie-settings-header">
                    <h3 data-i18n="cookies.settingsTitle">Nastavenia cookies</h3>
                    <button class="cookie-settings-close" id="cookie-settings-close" aria-label="Close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="cookie-settings-body">
                    <p class="cookie-settings-description" data-i18n="cookies.settingsDescription">Vyberte, ktoré cookies chcete povoliť. Nevyhnutné cookies sú vždy aktívne, pretože sú potrebné pre základnú funkčnosť stránky.</p>
                    
                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <label class="cookie-category-label">
                                <input type="checkbox" id="cookie-necessary" checked disabled>
                                <span class="cookie-category-name" data-i18n="cookies.necessary">Nevyhnutné cookies</span>
                            </label>
                        </div>
                        <p class="cookie-category-desc" data-i18n="cookies.necessaryDesc">Tieto cookies sú nevyhnutné pre fungovanie webovej stránky a nemôžu byť vypnuté.</p>
                    </div>

                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <label class="cookie-category-label">
                                <input type="checkbox" id="cookie-analytics">
                                <span class="cookie-category-name" data-i18n="cookies.analytics">Analytické cookies</span>
                            </label>
                        </div>
                        <p class="cookie-category-desc" data-i18n="cookies.analyticsDesc">Pomáhajú nám pochopiť, ako návštevníci používajú našu stránku.</p>
                    </div>

                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <label class="cookie-category-label">
                                <input type="checkbox" id="cookie-marketing">
                                <span class="cookie-category-name" data-i18n="cookies.marketing">Marketingové cookies</span>
                            </label>
                        </div>
                        <p class="cookie-category-desc" data-i18n="cookies.marketingDesc">Používame ich na personalizáciu reklám a meranie ich účinnosti.</p>
                    </div>
                </div>
                <div class="cookie-settings-footer">
                    <button id="cookie-settings-save" class="cookie-btn cookie-btn-accept" data-i18n="cookies.save">Uložiť nastavenia</button>
                    <button id="cookie-settings-cancel" class="cookie-btn cookie-btn-reject" data-i18n="cookies.close">Zavrieť</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Apply translations
        if (window.applyTranslations) {
            window.applyTranslations();
        }
    }

    // Load current cookie settings into modal
    function loadCookieSettings() {
        const consentData = getConsentData();
        if (consentData) {
            document.getElementById('cookie-necessary').checked = true; // Always checked
            document.getElementById('cookie-analytics').checked = consentData.analytics === true;
            document.getElementById('cookie-marketing').checked = consentData.marketing === true;
        } else {
            // Default: only necessary
            document.getElementById('cookie-necessary').checked = true;
            document.getElementById('cookie-analytics').checked = false;
            document.getElementById('cookie-marketing').checked = false;
        }
    }

    // Save cookie settings from modal
    function saveCookieSettings() {
        const consentData = {
            necessary: true, // Always true
            analytics: document.getElementById('cookie-analytics').checked,
            marketing: document.getElementById('cookie-marketing').checked,
            accepted: true // User has made a choice
        };
        saveConsent(consentData);
        hideCookieSettings();
        hideCookieBanner();
        initAnalytics();
        
        // Reload YouTube videos based on new consent
        loadYouTubeVideos();
    }

    // Accept all cookies
    function acceptCookies() {
        const consentData = {
            necessary: true,
            analytics: true,
            marketing: true,
            accepted: true
        };
        saveConsent(consentData);
        hideCookieBanner();
        initAnalytics();
    }

    // Reject all cookies (except necessary)
    function rejectCookies() {
        const consentData = {
            necessary: true,
            analytics: false,
            marketing: false,
            accepted: false
        };
        saveConsent(consentData);
        hideCookieBanner();
    }

    // Check if analytics cookies are allowed
    function hasAnalyticsConsent() {
        const consentData = getConsentData();
        return consentData && consentData.analytics === true;
    }

    // Load YouTube videos - use nocookie version if analytics not allowed
    function loadYouTubeVideos() {
        const useNoCookie = !hasAnalyticsConsent();
        const domain = useNoCookie ? 'www.youtube-nocookie.com' : 'www.youtube.com';

        // Find all YouTube iframe placeholders and load them
        const placeholders = document.querySelectorAll('.youtube-placeholder[data-youtube-id]');
        placeholders.forEach(placeholder => {
            const videoId = placeholder.getAttribute('data-youtube-id');
            const iframe = document.createElement('iframe');
            iframe.src = `https://${domain}/embed/${videoId}`;
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
            iframe.setAttribute('allowfullscreen', '');
            iframe.setAttribute('loading', 'lazy');
            iframe.className = 'youtube-iframe';
            
            placeholder.replaceWith(iframe);
        });

        // Also load/update iframes that have data-youtube-id
        const iframesWithDataId = document.querySelectorAll('iframe[data-youtube-id]');
        iframesWithDataId.forEach(iframe => {
            const videoId = iframe.getAttribute('data-youtube-id');
            const currentSrc = iframe.getAttribute('src');
            const newSrc = `https://${domain}/embed/${videoId}`;
            
            // Only update if src is different or missing
            if (!currentSrc || !currentSrc.includes(domain)) {
                iframe.src = newSrc;
            }
        });
    }

    // Initialize YouTube videos - always load them, but use nocookie version if analytics not allowed
    function initializeYouTubeVideos() {
        // Load all YouTube videos (they will use nocookie domain if analytics not allowed)
        loadYouTubeVideos();
    }

    // Initialize analytics (only if consent given)
    function initAnalytics() {
        // Always initialize YouTube videos (they will use nocookie domain if analytics not allowed)
        initializeYouTubeVideos();

        const consentData = getConsentData();
        if (consentData) {
            // Initialize Google Analytics, Facebook Pixel, etc. here if analytics consent given
            if (consentData.analytics === true) {
                // Example:
                // if (typeof gtag !== 'undefined') {
                //     gtag('consent', 'update', {
                //         'analytics_storage': 'granted'
                //     });
                // }
            }

            // Initialize marketing if consent given
            if (consentData.marketing === true) {
                // Initialize marketing tracking here
            }
        }
    }

    // Initialize cookie consent
    function initCookieConsent() {
        // Wait a bit for translations to be applied
        setTimeout(() => {
            // Check if consent already given
            if (hasConsent()) {
                const consentData = getConsentData();
                if (consentData) {
                    const expiryDate = new Date(consentData.expiry);
                    
                    // Check if consent expired
                    if (new Date() > expiryDate) {
                        localStorage.removeItem(COOKIE_CONSENT_KEY);
                        // Still initialize YouTube videos with nocookie domain
                        initAnalytics();
                        showCookieBanner();
                    } else {
                        initAnalytics();
                    }
                }
            } else {
                // No consent yet, but still initialize YouTube videos with nocookie domain
                initAnalytics();
                showCookieBanner();
            }

            // Add event listeners (use event delegation to handle multiple banners)
            document.addEventListener('click', (e) => {
                if (e.target.id === 'cookie-accept' || e.target.closest('#cookie-accept')) {
                    e.preventDefault();
                    acceptCookies();
                } else if (e.target.id === 'cookie-reject' || e.target.closest('#cookie-reject')) {
                    e.preventDefault();
                    rejectCookies();
                } else if (e.target.id === 'cookie-settings' || e.target.closest('#cookie-settings')) {
                    e.preventDefault();
                    showCookieSettings();
                } else if (e.target.id === 'cookie-settings-close' || e.target.closest('#cookie-settings-close')) {
                    e.preventDefault();
                    hideCookieSettings();
                } else if (e.target.id === 'cookie-settings-cancel' || e.target.closest('#cookie-settings-cancel')) {
                    e.preventDefault();
                    hideCookieSettings();
                } else if (e.target.id === 'cookie-settings-save' || e.target.closest('#cookie-settings-save')) {
                    e.preventDefault();
                    saveCookieSettings();
                } else if (e.target.closest('#cookie-settings-modal') && e.target.id === 'cookie-settings-modal') {
                    // Close modal when clicking on backdrop
                    hideCookieSettings();
                }
            });
        }, 500);
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initCookieConsent();
            // Check YouTube videos after a short delay to ensure DOM is fully loaded
            setTimeout(() => {
                initAnalytics();
            }, 1000);
        });
    } else {
        initCookieConsent();
        // Check YouTube videos after a short delay to ensure DOM is fully loaded
        setTimeout(() => {
            initAnalytics();
        }, 1000);
    }

    // Export functions for external use
    window.cookieConsent = {
        accept: acceptCookies,
        reject: rejectCookies,
        hasConsent: hasConsent,
        hasAnalyticsConsent: hasAnalyticsConsent,
        showSettings: showCookieSettings,
        loadYouTubeVideos: loadYouTubeVideos
    };
})();
