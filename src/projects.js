// Projects page - Dynamic loading of videos and photos from Contentful JSON files
import { getCurrentLanguage } from "./i18n.js";

// Get base URL helper
function getBaseUrl() {
    let baseUrl = import.meta.env.BASE_URL;

    if (!baseUrl || baseUrl === "/") {
        const path = window.location.pathname;
        const pathDir = path.substring(0, path.lastIndexOf("/") + 1);
        baseUrl = pathDir;
    }

    if (!baseUrl.endsWith("/")) {
        baseUrl += "/";
    }

    return baseUrl;
}

// Load YouTube videos from JSON
async function loadVideos() {
    try {
        const baseUrl = getBaseUrl();
        const videosPath = `${baseUrl}assets/contentful/youtube-videos.json`;
        const response = await fetch(videosPath);

        if (!response.ok) {
            throw new Error(`Failed to load videos: ${response.status}`);
        }

        const data = await response.json();
        return data.videos || [];
    } catch (error) {
        console.error("Error loading videos:", error);
        return [];
    }
}

// Load photos from JSON
async function loadPhotos() {
    try {
        const baseUrl = getBaseUrl();
        const photosPath = `${baseUrl}assets/contentful/photos.json`;
        const response = await fetch(photosPath);

        if (!response.ok) {
            throw new Error(`Failed to load photos: ${response.status}`);
        }

        const data = await response.json();
        return data.photos || [];
    } catch (error) {
        console.error("Error loading photos:", error);
        return [];
    }
}

// Generate video HTML
function generateVideoHTML(video, index) {
    const currentLang = getCurrentLanguage();
    const title = video.title?.[currentLang] || video.title?.sk || `Video ${index + 1}`;
    const videoId = video.id;

    return `
        <div class="video-item">
            <div class="video-wrapper">
                <iframe
                    data-youtube-id="${videoId}"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                    loading="lazy"
                ></iframe>
            </div>
            <h3 class="video-title">${escapeHtml(title)}</h3>
        </div>
    `;
}

// Generate photo HTML
function generatePhotoHTML(photo, index) {
    const currentLang = getCurrentLanguage();
    const title = photo.title?.[currentLang] || photo.title?.sk || `Fotografia projektu ${index + 1}`;
    const images = photo.images || [];
    const galleryId = `gallery${index + 1}`;
    const imageCount = images.length;
    const firstImage = images[0];
    const baseUrl = getBaseUrl();
    
    if (!firstImage) {
        return "";
    }

    // url is now the local path from assets/contentful/images/
    let previewSrc = firstImage.url || "";
    if (previewSrc.startsWith("/") && !previewSrc.startsWith("//")) {
        previewSrc = baseUrl + previewSrc.substring(1);
    } else if (!previewSrc.startsWith("http") && !previewSrc.startsWith("//")) {
        previewSrc = baseUrl + previewSrc;
    }
    const previewAlt = title;

    let galleryImagesHTML = "";
    images.forEach((img, imgIndex) => {
        let imgSrc = img.url || "";
        if (imgSrc.startsWith("/") && !imgSrc.startsWith("//")) {
            imgSrc = baseUrl + imgSrc.substring(1);
        } else if (!imgSrc.startsWith("http") && !imgSrc.startsWith("//")) {
            imgSrc = baseUrl + imgSrc;
        }
        const imgAlt = `${title} - ${imgIndex + 1}`;
        galleryImagesHTML += `<img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(imgAlt)}" />`;
    });

    const countBadge = imageCount > 1 
        ? `<div class="photo-count-badge" data-count="${imageCount}"></div>`
        : "";

    return `
        <div class="photo-item" data-gallery="${galleryId}">
            <div class="photo-gallery-preview">
                <img src="${escapeHtml(previewSrc)}" alt="${escapeHtml(previewAlt)}" loading="lazy" />
                ${countBadge}
            </div>
            <h3 class="photo-title">${escapeHtml(title)}</h3>
            <div class="photo-gallery-images" style="display: none">
                ${galleryImagesHTML}
            </div>
        </div>
    `;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Store loaded videos and photos for re-rendering on language change
let cachedVideos = [];
let cachedPhotos = [];

// Render videos
async function renderVideos() {
    const videosGrid = document.querySelector(".videos-grid");
    if (!videosGrid) {
        console.warn("Videos grid not found");
        return;
    }

    // Load videos if not cached
    if (cachedVideos.length === 0) {
        cachedVideos = await loadVideos();
    }
    
    if (cachedVideos.length === 0) {
        videosGrid.innerHTML = '<p class="no-content">Žiadne videá nie sú k dispozícii.</p>';
        return;
    }

    // Sort videos by order if available
    const sortedVideos = [...cachedVideos].sort((a, b) => {
        const orderA = a.order || 999;
        const orderB = b.order || 999;
        return orderA - orderB;
    });

    videosGrid.innerHTML = sortedVideos.map((video, index) => generateVideoHTML(video, index)).join("");

    // Initialize YouTube videos after rendering
    // Wait a bit for cookies.js to initialize
    setTimeout(() => {
        if (window.cookieConsent && window.cookieConsent.loadYouTubeVideos) {
            window.cookieConsent.loadYouTubeVideos();
        }
    }, 200);
}

// Render photos
async function renderPhotos() {
    const photosGrid = document.querySelector(".photos-grid");
    if (!photosGrid) {
        console.warn("Photos grid not found");
        return;
    }

    // Load photos if not cached
    if (cachedPhotos.length === 0) {
        cachedPhotos = await loadPhotos();
    }
    
    if (cachedPhotos.length === 0) {
        photosGrid.innerHTML = '<p class="no-content">Žiadne fotografie nie sú k dispozícii.</p>';
        return;
    }

    photosGrid.innerHTML = cachedPhotos.map((photo, index) => generatePhotoHTML(photo, index)).join("");

    // Re-initialize photo gallery after rendering
    initPhotoGallery();
}

// Initialize photo gallery (lightbox functionality)
function initPhotoGallery() {
    const photoItems = document.querySelectorAll(".photo-item");
    const lightbox = document.getElementById("photo-lightbox");
    const lightboxImage = document.getElementById("lightbox-image");
    const lightboxClose = document.querySelector(".photo-lightbox-close");
    const lightboxPrev = document.querySelector(".photo-lightbox-prev");
    const lightboxNext = document.querySelector(".photo-lightbox-next");
    const lightboxCurrent = document.getElementById("lightbox-current");
    const lightboxTotal = document.getElementById("lightbox-total");

    if (!lightbox || !lightboxImage) {
        return;
    }

    let currentGallery = null;
    let currentImageIndex = 0;
    let currentImages = [];

    // Open lightbox
    function openLightbox(galleryId, imageIndex) {
        const photoItem = document.querySelector(`[data-gallery="${galleryId}"]`);
        if (!photoItem) return;

        const galleryImages = photoItem.querySelector(".photo-gallery-images");
        if (!galleryImages) return;

        currentGallery = galleryId;
        currentImages = Array.from(galleryImages.querySelectorAll("img"));
        currentImageIndex = imageIndex;

        if (currentImages.length === 0) return;

        updateLightboxImage();
        lightbox.style.display = "flex";
        document.body.style.overflow = "hidden";
    }

    // Update lightbox image
    function updateLightboxImage() {
        if (currentImages.length === 0) return;

        const image = currentImages[currentImageIndex];
        lightboxImage.src = image.src;
        lightboxImage.alt = image.alt;
        lightboxCurrent.textContent = currentImageIndex + 1;
        lightboxTotal.textContent = currentImages.length;

        // Show/hide navigation buttons
        if (lightboxPrev) {
            lightboxPrev.style.display = currentImages.length > 1 ? "block" : "none";
        }
        if (lightboxNext) {
            lightboxNext.style.display = currentImages.length > 1 ? "block" : "none";
        }
    }

    // Close lightbox
    function closeLightbox() {
        lightbox.style.display = "none";
        document.body.style.overflow = "";
        currentGallery = null;
        currentImages = [];
        currentImageIndex = 0;
    }

    // Navigate to previous image
    function prevImage() {
        if (currentImages.length === 0) return;
        currentImageIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length;
        updateLightboxImage();
    }

    // Navigate to next image
    function nextImage() {
        if (currentImages.length === 0) return;
        currentImageIndex = (currentImageIndex + 1) % currentImages.length;
        updateLightboxImage();
    }

    // Attach click handlers to photo items
    photoItems.forEach(item => {
        const galleryId = item.getAttribute("data-gallery");
        const preview = item.querySelector(".photo-gallery-preview img");
        
        if (preview) {
            preview.addEventListener("click", () => {
                openLightbox(galleryId, 0);
            });
        }
    });

    // Lightbox controls
    if (lightboxClose) {
        lightboxClose.addEventListener("click", closeLightbox);
    }

    if (lightboxPrev) {
        lightboxPrev.addEventListener("click", prevImage);
    }

    if (lightboxNext) {
        lightboxNext.addEventListener("click", nextImage);
    }

    // Close on background click
    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
        if (lightbox.style.display === "flex") {
            if (e.key === "Escape") {
                closeLightbox();
            } else if (e.key === "ArrowLeft") {
                prevImage();
            } else if (e.key === "ArrowRight") {
                nextImage();
            }
        }
    });
}

// Initialize projects page
export async function initProjects() {
    // Check if we're on the projects page
    const isProjectsPage = window.location.pathname.includes("projekty");
    if (!isProjectsPage) {
        return;
    }

    // Render videos and photos (i18n is already initialized when this is called from main.js)
    await Promise.all([renderVideos(), renderPhotos()]);

    // Listen for language changes to update titles
    window.addEventListener('languageChanged', async (event) => {
        console.log('Language changed to:', event.detail.language);
        // Re-render videos and photos with new language
        await Promise.all([renderVideos(), renderPhotos()]);
    });
}

