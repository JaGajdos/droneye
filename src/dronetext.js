import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Global variables
let scene, camera, renderer;
let droneRoot = null;
let rotors = [];
const rotorSpinSpeed = 18; // rad/s
const clock = new THREE.Clock();
const rotorOriginalPositions = new Map(); // Store original positions

// Scene management
let scenes = [];
let currentSceneIndex = 0;
let scrollProgress = 0; // 0 to 1
let scrollY = 0;
let prevScrollY = 0; // Track previous scroll position to detect direction
let maxScroll = 3000; // Total scroll distance for all scenes
let isScrolling = false;

// Drone flight path
const droneStartY = 50; // Start high up
const droneEndY = -10; // End low
let droneTargetY = droneStartY;
let dronePositionZ = 0; // Forward position (negative = forward/away)
const autoMoveSpeed = 0.3; // Automatic forward movement speed (increased)

// Color configuration - Royal blue theme (brighter for visibility)
const droneColors = {
    body: 0x0055cc,      // Brighter royal blue (more visible) - for Body
    rotors: 0x00aaff,    // Light blue (very visible) - for Rotors
    details: 0xcccccc,   // Light gray - for Cube002 and other details
    accent: 0x66a3ff,    // Light blue accent
    white: 0xffffff       // White
};

// Function to change drone color (can be called from console or UI)
function changeDroneColor(bodyColor, rotorColor) {
    if (!droneRoot) {
        console.warn('Drone model not loaded yet');
        return;
    }
    
    if (bodyColor) droneColors.body = typeof bodyColor === 'string' ? parseInt(bodyColor.replace('#', ''), 16) : bodyColor;
    if (rotorColor) droneColors.rotors = typeof rotorColor === 'string' ? parseInt(rotorColor.replace('#', ''), 16) : rotorColor;
    
    droneRoot.traverse((o) => {
        if (o.isMesh && o.material) {
            const materials = Array.isArray(o.material) ? o.material : [o.material];
            
            materials.forEach(mat => {
                if (mat.isMeshStandardMaterial || mat.isMeshPhongMaterial || mat.isMeshLambertMaterial) {
                    // Change body color
                    if (o.name && /body/i.test(o.name)) {
                        mat.color.setHex(droneColors.body);
                    }
                    // Change rotor color
                    else if (o.name && /rotor/i.test(o.name)) {
                        mat.color.setHex(droneColors.rotors);
                    }
                    mat.needsUpdate = true;
                }
            });
        }
    });
    
    console.log('✅ Colors updated:', { body: `#${droneColors.body.toString(16)}`, rotors: `#${droneColors.rotors.toString(16)}` });
}

// Make function available globally for console access
window.changeDroneColor = changeDroneColor;

// Function to set cloud texture(s) (can be called from console or UI)
// Accepts either a single texture path string or an array of texture paths
function setCloudTexture(texturePathOrPaths) {
    if (!texturePathOrPaths) {
        console.warn('No texture path(s) provided');
        return;
    }
    
    // Find sky scene (scene index 1)
    const skyScene = scenes[1];
    if (!skyScene || !skyScene.userData.cloudGroup) {
        console.warn('Sky scene or cloud group not found');
        return;
    }
    
    // Convert single path to array for consistent handling
    const texturePaths = Array.isArray(texturePathOrPaths) ? texturePathOrPaths : [texturePathOrPaths];
    
    const textureLoader = new THREE.TextureLoader();
    const loadedTextures = [];
    let loadedCount = 0;
    
    // Load all textures
    texturePaths.forEach((path, index) => {
        textureLoader.load(
            path,
            (texture) => {
                console.log(`✅ Cloud texture ${index + 1} loaded successfully`);
                texture.flipY = false;
                loadedTextures[index] = texture;
                loadedCount++;
                
                // When all textures are loaded, recreate clouds
                if (loadedCount === texturePaths.length) {
                    const availableTextures = loadedTextures.filter(t => t !== undefined);
                    skyScene.userData.cloudTextures = availableTextures;
                    
                    // Recreate clouds with new textures using the same logic as createClouds
                    const cloudGroup = skyScene.userData.cloudGroup;
                    cloudGroup.clear();
                    
                    if (availableTextures.length === 0) {
                        console.warn('No valid textures loaded');
                        return;
                    }
                    
                    // Create continuous cloud layer - 3D effect with multiple layers
                    const cloudLayerHeight = 30; // Lower - clouds below drone
                    const cloudScaleX = 30; // Width scale for sprite
                    const cloudScaleY = 20; // Height scale for sprite
                    const coverageWidth = 250; // Larger area to cover
                    const coverageDepth = 250;
                    const spacing = 15; // Closer spacing for denser clouds
                    
                    const xCount = Math.ceil(coverageWidth / spacing) + 6;
                    const zCount = Math.ceil(coverageDepth / spacing) + 6;
                    
                    // Create 3D effect with multiple layers at different heights - more layers for denser clouds
                    const layerCount = 5; // More layers for denser, bushier clouds
                    const layerSpacing = 1.5; // Vertical spacing between layers
                    
                    for (let layer = 0; layer < layerCount; layer++) {
                        const layerY = cloudLayerHeight + layer * layerSpacing;
                        const layerOpacity = 0.5 - layer * 0.1; // More transparent for deeper layers (sprite opacity)
                        
                        for (let x = 0; x < xCount; x++) {
                            for (let z = 0; z < zCount; z++) {
                                const xPos = (x - xCount / 2) * spacing + (Math.random() - 0.5) * 5 + layer * 2;
                                const zPos = (z - zCount / 2) * spacing + (Math.random() - 0.5) * 5 + layer * 2;
                                const selectedTexture = availableTextures[Math.floor(Math.random() * availableTextures.length)];
                                
                                const cloud = createCloudForScene(xPos, layerY, zPos, cloudScaleX, cloudScaleY, selectedTexture, layerOpacity);
                                if (cloud) {
                                    cloudGroup.add(cloud);
                                }
                            }
                        }
                    }
                }
            },
            undefined,
            (err) => {
                console.warn(`⚠️ Failed to load cloud texture ${index + 1}:`, err);
                loadedCount++;
                
                // If all textures failed or all loaded, recreate clouds
                if (loadedCount === texturePaths.length) {
                    const availableTextures = loadedTextures.filter(t => t !== undefined);
                    if (availableTextures.length > 0) {
                        skyScene.userData.cloudTextures = availableTextures;
                        
                        // Recreate clouds with available textures using continuous layer - 3D effect
                        const cloudGroup = skyScene.userData.cloudGroup;
                        cloudGroup.clear();
                        
                        const cloudLayerHeight = 30; // Lower - clouds below drone
                        const cloudScaleX = 30; // Width scale for sprite
                        const cloudScaleY = 20; // Height scale for sprite
                        const coverageWidth = 250; // Larger area to cover
                        const coverageDepth = 250;
                        const spacing = 15; // Closer spacing for denser clouds
                        
                        const xCount = Math.ceil(coverageWidth / spacing) + 6;
                        const zCount = Math.ceil(coverageDepth / spacing) + 6;
                        
                        // Create 3D effect with multiple layers at different heights - more layers for denser clouds
                        const layerCount = 5; // More layers for denser, bushier clouds
                        const layerSpacing = 1.5; // Vertical spacing between layers
                        
                        for (let layer = 0; layer < layerCount; layer++) {
                            const layerY = cloudLayerHeight + layer * layerSpacing;
                            const layerOpacity = 0.5 - layer * 0.1; // More transparent for deeper layers (sprite opacity)
                            
                            for (let x = 0; x < xCount; x++) {
                                for (let z = 0; z < zCount; z++) {
                                    const xPos = (x - xCount / 2) * spacing + (Math.random() - 0.5) * 5 + layer * 2;
                                    const zPos = (z - zCount / 2) * spacing + (Math.random() - 0.5) * 5 + layer * 2;
                                    const selectedTexture = availableTextures[Math.floor(Math.random() * availableTextures.length)];
                                    
                                    const cloud = createCloudForScene(xPos, layerY, zPos, cloudScaleX, cloudScaleY, selectedTexture, layerOpacity);
                                    if (cloud) {
                                        cloudGroup.add(cloud);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        );
    });
}

// Helper function to create cloud sprite (always faces camera)
function createCloudForScene(x, y, z, scaleX, scaleY, cloudTexture, opacity = 0.5) {
    if (!cloudTexture) return null;
    
    // Create sprite material (always faces camera)
    const cloudMaterial = new THREE.SpriteMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: opacity,
        depthWrite: false,
    });
    
    // Don't repeat texture - use original size
    cloudTexture.wrapS = THREE.ClampToEdgeWrapping;
    cloudTexture.wrapT = THREE.ClampToEdgeWrapping;
    cloudTexture.flipY = false;
    
    // Create sprite
    const cloud = new THREE.Sprite(cloudMaterial);
    cloud.scale.set(scaleX, scaleY, 1);
    cloud.position.set(x, y, z);
    
    // Store original position for animation
    cloud.userData.originalY = y;
    cloud.userData.originalZ = z;
    
    return cloud;
}

// Make function available globally for console access
window.setCloudTexture = setCloudTexture;

// Initialize Three.js
function init() {
    const canvas = document.getElementById('drone-canvas');
    
    if (!canvas) {
        console.error('Canvas not found');
        return;
    }
    
    // Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    
    // Camera - closer to drone
    camera = new THREE.PerspectiveCamera(
        55,
        window.innerWidth / window.innerHeight,
        0.01,
        1000
    );
    camera.position.set(0, 15, 15);
    camera.lookAt(0, 0, 0);
    
    // Create three scenes
    createScenes();
    
    // Set initial scene
    scene = scenes[0];
    
    // Load GLB model
    loadDroneModel();
    
    // Event listeners
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: false });
    
    // Start animation
    animate();
    
    // Initialize navigation
    initNavigation();
}

// Create three dummy scenes
function createScenes() {
    scenes = [];
    
    // Scene 1: Space scene
    const scene1 = new THREE.Scene();
    scene1.background = new THREE.Color(0x000000); // Deep space black
    
    // Ambient light for space - brighter for drone visibility
    scene1.add(new THREE.AmbientLight(0xffffff, 0.8));
    
    // Add directional light for better drone visibility
    const spaceDirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    spaceDirLight.position.set(5, 10, 5);
    scene1.add(spaceDirLight);
    
    // Add stars - create in much larger space for infinite forward movement
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 2000;
    const starsPositions = new Float32Array(starsCount * 3);
    const starsDistance = 500; // Large distance for stars (far away)
    
    for (let i = 0; i < starsCount * 3; i += 3) {
        // Create stars in a large sphere around origin
        const theta = Math.random() * Math.PI * 2; // Azimuth angle
        const phi = Math.acos(2 * Math.random() - 1); // Polar angle
        const radius = starsDistance + Math.random() * starsDistance; // Distance from center
        
        starsPositions[i] = radius * Math.sin(phi) * Math.cos(theta); // x
        starsPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta); // y
        starsPositions[i + 2] = radius * Math.cos(phi); // z
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
    
    // Create circular texture for stars
    const starTextureCanvas = document.createElement('canvas');
    starTextureCanvas.width = 64;
    starTextureCanvas.height = 64;
    const starTextureContext = starTextureCanvas.getContext('2d');
    
    // Draw circular gradient for soft circular star
    const gradient = starTextureContext.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    starTextureContext.fillStyle = gradient;
    starTextureContext.fillRect(0, 0, 64, 64);
    
    const starTexture = new THREE.CanvasTexture(starTextureCanvas);
    
    const starsMaterial = new THREE.PointsMaterial({
        map: starTexture,
        color: 0xffffff,
        size: 3.0,
        sizeAttenuation: true,
        transparent: true,
        alphaTest: 0.1
    });
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene1.add(stars);
    
    // Store stars reference for animation
    scene1.userData.stars = stars;
    
    // Add aurora borealis tunnel effect (polar light)
    createAuroraTunnel(scene1);
    
    // Scene 2: Sky scene with clouds
    const scene2 = new THREE.Scene();
    scene2.background = new THREE.Color(0x87CEEB); // Sky blue
    scene2.add(new THREE.HemisphereLight(0xffffff, 0x87CEEB, 1.2)); // Bright sky lighting
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(10, 20, 5);
    sunLight.castShadow = false;
    scene2.add(sunLight);
    
    // Add ambient light for bright sky
    const ambientLight2 = new THREE.AmbientLight(0xffffff, 0.8);
    scene2.add(ambientLight2);
    
    // Create clouds - cloud layer at the bottom of the screen
    const cloudGroup = new THREE.Group();
    scene2.add(cloudGroup);
    scene2.userData.cloudGroup = cloudGroup;
    scene2.userData.cloudTexture = null; // Will store cloud texture when loaded
    
    // Load cloud textures - cloud1.png and cloud2.png from public folder
    const cloudTexturePaths = [
        `${import.meta.env.BASE_URL}cloud1.png`,
        `${import.meta.env.BASE_URL}cloud2.png`
    ];
    
    // Function to create cloud material with texture
    function createCloudMaterial(texture) {
        if (!texture) {
            console.warn('No texture provided for cloud material');
            return null;
        }
        
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide,
            depthWrite: false,
            alphaTest: 0.1
        });
        
        // Don't repeat texture - use original size
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        
        return material;
    }
    
    // Function to create a cloud sprite (always faces camera)
    function createCloudPlane(x, y, z, scaleX, scaleY, cloudTexture, opacity = 0.5) {
        if (!cloudTexture) return null;
        
        // Create sprite material (always faces camera)
        const cloudMaterial = new THREE.SpriteMaterial({
            map: cloudTexture,
            transparent: true,
            opacity: opacity,
            depthWrite: false,
        });
        
        // Don't repeat texture - use original size
        cloudTexture.wrapS = THREE.ClampToEdgeWrapping;
        cloudTexture.wrapT = THREE.ClampToEdgeWrapping;
        cloudTexture.flipY = false;
        
        // Create sprite
        const cloud = new THREE.Sprite(cloudMaterial);
        cloud.scale.set(scaleX, scaleY, 1);
        cloud.position.set(x, y, z);
        
        // Store original position for animation
        cloud.userData.originalY = y;
        cloud.userData.originalZ = z;
        
        return cloud;
    }
    
    // Function to load cloud textures and create clouds
    function createCloudsWithTextures(texturePaths) {
        if (!texturePaths || texturePaths.length === 0) {
            // No textures provided, create clouds without texture
            createClouds();
            return;
        }
        
        const textureLoader = new THREE.TextureLoader();
        const loadedTextures = [];
        let loadedCount = 0;
        
        // Load all textures
        texturePaths.forEach((path, index) => {
            textureLoader.load(
                path,
                (texture) => {
                    console.log(`✅ Cloud texture ${index + 1} loaded successfully`);
                    texture.flipY = false; // Adjust if needed based on your texture
                    loadedTextures[index] = texture;
                    loadedCount++;
                    
                    // When all textures are loaded, create clouds
                    if (loadedCount === texturePaths.length) {
                        scene2.userData.cloudTextures = loadedTextures;
                        createClouds(loadedTextures);
                    }
                },
                undefined,
                (err) => {
                    console.warn(`⚠️ Failed to load cloud texture ${index + 1}, skipping:`, err);
                    loadedCount++;
                    
                    // If all textures failed or all loaded, create clouds
                    if (loadedCount === texturePaths.length) {
                        if (loadedTextures.length > 0) {
                            scene2.userData.cloudTextures = loadedTextures.filter(t => t !== undefined);
                            createClouds(loadedTextures.filter(t => t !== undefined));
                        } else {
                            createClouds(); // Fallback to clouds without texture
                        }
                    }
                }
            );
        });
    }
    
    // Function to create cloud layer - full sky coverage at bottom
    function createClouds(cloudTextures = null) {
        // Clear existing clouds if any
        cloudGroup.clear();
        
        if (!cloudTextures || (Array.isArray(cloudTextures) && cloudTextures.length === 0)) {
            console.warn('No cloud textures available');
            return;
        }
        
        // Get available textures
        const availableTextures = Array.isArray(cloudTextures) 
            ? cloudTextures.filter(t => t !== undefined)
            : [cloudTextures].filter(t => t !== undefined);
        
        if (availableTextures.length === 0) {
            console.warn('No valid cloud textures');
            return;
        }
        
        // Create a continuous cloud layer covering the entire bottom area - 3D effect with multiple layers
        const cloudLayerHeight = 30; // Lower - clouds below drone
        // Use sprite scaling - realistic cloud sizes
        const cloudScaleX = 30; // Width scale for sprite
        const cloudScaleY = 20; // Height scale for sprite
        
        // Create many clouds to cover the entire area - denser coverage
        const coverageWidth = 250; // Larger area to cover
        const coverageDepth = 250;
        const spacing = 15; // Closer spacing for denser clouds
        
        const xCount = Math.ceil(coverageWidth / spacing) + 6; // Extra clouds for coverage
        const zCount = Math.ceil(coverageDepth / spacing) + 6;
        
        // Create 3D effect with multiple layers at different heights - more layers for denser clouds
        const layerCount = 5; // More layers for denser, bushier clouds
        const layerSpacing = 1.5; // Vertical spacing between layers
        
        for (let layer = 0; layer < layerCount; layer++) {
            const layerY = cloudLayerHeight + layer * layerSpacing;
            const layerOpacity = 0.5 - layer * 0.1; // More transparent for deeper layers (sprite opacity)
            
            // Create grid of cloud sprites for this layer
            for (let x = 0; x < xCount; x++) {
                for (let z = 0; z < zCount; z++) {
                    // Calculate position with slight random offset for each layer
                    const xPos = (x - xCount / 2) * spacing + (Math.random() - 0.5) * 5 + layer * 2;
                    const zPos = (z - zCount / 2) * spacing + (Math.random() - 0.5) * 5 + layer * 2;
                    
                    // Randomly select a texture for variation
                    const selectedTexture = availableTextures[Math.floor(Math.random() * availableTextures.length)];
                    
                    // Create cloud sprite (always faces camera)
                    const cloud = createCloudPlane(xPos, layerY, zPos, cloudScaleX, cloudScaleY, selectedTexture, layerOpacity);
                    if (cloud) {
                        cloudGroup.add(cloud);
                    }
                }
            }
        }
    }
    
    // Create clouds with textures
    createCloudsWithTextures(cloudTexturePaths);
    
    // Scene 3: Ground/Nature scene
    const scene3 = new THREE.Scene();
    scene3.background = new THREE.Color(0x90EE90); // Light green
    scene3.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
    const light3 = new THREE.DirectionalLight(0xffffff, 1.2);
    light3.position.set(5, 10, 5);
    scene3.add(light3);
    
    // Add ground
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    scene3.add(ground);
    
    // Add some trees (dummy cylinders with spheres)
    for (let i = 0; i < 10; i++) {
        const tree = new THREE.Group();
        
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 3, 8),
            new THREE.MeshStandardMaterial({ color: 0x8B4513 })
        );
        trunk.position.y = 1.5;
        tree.add(trunk);
        
        const leaves = new THREE.Mesh(
            new THREE.ConeGeometry(2, 3, 8),
            new THREE.MeshStandardMaterial({ color: 0x228B22 })
        );
        leaves.position.y = 4;
        tree.add(leaves);
        
        tree.position.set(
            (Math.random() - 0.5) * 40,
            0,
            (Math.random() - 0.5) * 40
        );
        scene3.add(tree);
    }
    
    scenes.push(scene1, scene2, scene3);
}

// Create aurora borealis tunnel effect - organic, wavy aurora instead of rings
function createAuroraTunnel(scene) {
    // Create multiple wavy aurora layers for organic tunnel effect
    const layerCount = 20;
    const layers = [];
    
    for (let i = 0; i < layerCount; i++) {
        // Use PlaneGeometry instead of RingGeometry for more organic shapes
        const size = 60 + i * 2;
        const segments = 64; // More segments for smoother waves
        const planeGeometry = new THREE.PlaneGeometry(size, size, segments, segments);
        
        const auroraMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                index: { value: i },
                total: { value: layerCount },
                dronePos: { value: new THREE.Vector3(0, 0, 0) }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                uniform float time;
                uniform float index;
                
                // Simple noise function for organic deformation
                float noise(vec2 p) {
                    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
                }
                
                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    
                    // Create organic wave deformation - make it wavy like aurora
                    float waveX = sin(pos.x * 0.1 + time * 0.3 + index * 0.5) * 2.0;
                    float waveY = cos(pos.y * 0.15 + time * 0.4 + index * 0.3) * 1.5;
                    float waveZ = sin(pos.x * 0.08 + pos.y * 0.12 + time * 0.5) * 1.0;
                    
                    // Add noise for more organic variation
                    vec2 noiseCoord = pos.xy * 0.05 + time * 0.1;
                    float n = noise(noiseCoord) * 0.5;
                    
                    // Deform the plane to create wavy aurora shape
                    pos.z += waveX + waveY + waveZ * 0.5 + n;
                    
                    vPosition = pos;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float index;
                varying vec2 vUv;
                varying vec3 vPosition;
                
                // Simple noise function
                float noise(vec2 p) {
                    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
                }
                
                void main() {
                    vec2 uv = vUv;
                    vec2 pos = vPosition.xy;
                    
                    // Create aurora colors (green, blue, purple) - softer, more subtle
                    vec3 color1 = vec3(0.0, 0.6, 0.35); // Softer Green
                    vec3 color2 = vec3(0.2, 0.5, 0.7); // Softer Blue
                    vec3 color3 = vec3(0.4, 0.3, 0.6); // Softer Purple
                    
                    // Create organic, flowing color patterns
                    float colorWave1 = sin(pos.x * 0.1 + time * 0.4 + index * 0.3) * 0.5 + 0.5;
                    float colorWave2 = cos(pos.y * 0.15 + time * 0.3 + index * 0.2) * 0.5 + 0.5;
                    float colorWave3 = sin(pos.x * 0.08 + pos.y * 0.12 + time * 0.5) * 0.5 + 0.5;
                    
                    // Mix colors organically
                    vec3 baseColor = mix(color1, color2, colorWave1);
                    baseColor = mix(baseColor, color3, colorWave2 * 0.5);
                    baseColor = mix(baseColor, color1, colorWave3 * 0.3);
                    
                    // Create wavy, organic aurora pattern (not circular)
                    float wave1 = sin(pos.x * 0.2 + time * 0.6 + index * 0.4) * 0.5 + 0.5;
                    float wave2 = cos(pos.y * 0.25 + time * 0.5 + index * 0.3) * 0.5 + 0.5;
                    float wave3 = sin(pos.x * 0.15 + pos.y * 0.18 + time * 0.7) * 0.5 + 0.5;
                    
                    // Combine waves for organic pattern
                    float pattern = wave1 * wave2 * wave3;
                    
                    // Add noise for more organic variation
                    float n = noise(pos * 0.1 + time * 0.2);
                    pattern = mix(pattern, n, 0.3);
                    
                    // Distance from center (but not circular - more organic)
                    float dist = length(pos) / 40.0;
                    
                    // Create organic alpha pattern - softer, more subtle
                    float alpha = pattern * (1.0 - smoothstep(0.3, 1.0, dist)) * 0.15; // Reduced from 0.5 to 0.15
                    
                    // Add vertical streaks like real aurora (softer)
                    float streaks = sin(pos.y * 0.3 + time * 0.4) * 0.5 + 0.5;
                    alpha *= (0.6 + streaks * 0.2); // Reduced intensity
                    
                    // Fade out at edges organically
                    alpha *= smoothstep(0.0, 0.3, 1.0 - dist);
                    
                    gl_FragColor = vec4(baseColor, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const layer = new THREE.Mesh(planeGeometry, auroraMaterial);
        // Position layers perpendicular to Z axis (flight direction)
        layer.rotation.x = Math.PI / 1.5; // Rotate to be perpendicular to Z
        layer.position.set(0, 0, -80 + i * 4); // Space layers along Z axis
        scene.add(layer);
        layers.push(layer);
    }
    
    // Store layers for animation
    scene.userData.auroraRings = layers;
}

// Load drone GLB model
function loadDroneModel() {
    console.log('Loading drone model...');
    const loader = new GLTFLoader();
    
    // In Vite, files in public/ are served from root
    const MODEL_URL = `${import.meta.env.BASE_URL}Drone.glb`;
    console.log('Attempting to load model from:', MODEL_URL);
    
    loader.load(
        MODEL_URL,
        (gltf) => {
            console.log('✅ Model loaded successfully!', gltf);
            droneRoot = gltf.scene;
            
            // Center and scale
            fitAndCenter(droneRoot);
            
            // Position drone at start position (high up)
            droneRoot.position.y = droneStartY;
            droneRoot.position.x = 0;
            droneRoot.position.z = dronePositionZ;
            
            // Add to current scene
            scene.add(droneRoot);
            
            // Log all nodes/meshes and apply colors
            console.group('📋 GLB node/mesh list');
            let meshCount = 0;
            let nodeCount = 0;
            
            droneRoot.traverse((o) => {
                if (o.isMesh) {
                    meshCount++;
                    console.log(`MESH [${meshCount}]:`, o.name || '(no-name)', {
                        name: o.name,
                        type: o.type,
                        material: o.material?.type,
                        geometry: o.geometry?.type
                    });
                    
                    // Apply colors to ALL meshes - Royal blue theme
                    if (o.material) {
                        const materials = Array.isArray(o.material) ? o.material : [o.material];
                        
                        materials.forEach((mat, idx) => {
                            // Apply to all material types
                            if (mat.isMeshStandardMaterial || mat.isMeshPhongMaterial || mat.isMeshLambertMaterial || mat.isMeshBasicMaterial) {
                                const isRotor = o.name && /rotor/i.test(o.name);
                                const isBody = o.name && /body/i.test(o.name);
                                const isDetail = o.name && /cube/i.test(o.name);
                                
                                let colorToApply;
                                let emissiveColor;
                                
                                if (isRotor) {
                                    // Rotors - light blue
                                    colorToApply = droneColors.rotors;
                                    emissiveColor = droneColors.rotors;
                                    console.log(`Applied rotor color to ${o.name}:`, colorToApply.toString(16));
                                } else if (isBody) {
                                    // Body - royal blue
                                    colorToApply = droneColors.body;
                                    emissiveColor = droneColors.body;
                                    console.log(`Applied body color to ${o.name}:`, colorToApply.toString(16));
                                } else if (isDetail) {
                                    // Details (Cube002, etc.) - light gray
                                    colorToApply = droneColors.details;
                                    emissiveColor = droneColors.details;
                                    console.log(`Applied detail color to ${o.name}:`, colorToApply.toString(16));
                                } else {
                                    // Default - royal blue for unknown parts
                                    colorToApply = droneColors.body;
                                    emissiveColor = droneColors.body;
                                    console.log(`Applied default body color to ${o.name || 'unnamed'}:`, colorToApply.toString(16));
                                }
                                
                                mat.color.setHex(colorToApply);
                                
                                // Add emissive glow for better visibility in space
                                if (mat.emissive !== undefined) {
                                    mat.emissive.setHex(emissiveColor);
                                    mat.emissiveIntensity = isRotor ? 0.3 : (isDetail ? 0.1 : 0.2); // Subtle glow
                                }
                                
                                if (mat.metalness !== undefined) mat.metalness = isRotor ? 0.2 : (isDetail ? 0.5 : 0.3);
                                if (mat.roughness !== undefined) mat.roughness = isRotor ? 0.5 : (isDetail ? 0.3 : 0.4);
                                
                                mat.needsUpdate = true;
                            } else {
                                console.warn(`Material type not supported for ${o.name}:`, mat.type);
                            }
                        });
                    }
                } else if (o.isObject3D && o.name) {
                    nodeCount++;
                    console.log(`NODE [${nodeCount}]:`, o.name, {
                        name: o.name,
                        type: o.type,
                        children: o.children.length
                    });
                }
            });
            
            console.log(`Total: ${meshCount} meshes, ${nodeCount} named nodes`);
            console.groupEnd();
            
            // Auto-detect rotors by name - look for meshes with rotor names
            const rotorNameRegex = /(prop|rotor|fan|blade)/i;
            rotors = [];
            droneRoot.traverse((o) => {
                // Look for meshes with rotor names
                if (o.isMesh && rotorNameRegex.test(o.name || '')) {
                    // Try to use parent if it exists and has the same name pattern, otherwise use mesh itself
                    const rotorObj = (o.parent && o.parent !== droneRoot && rotorNameRegex.test(o.parent.name || '')) 
                        ? o.parent 
                        : o;
                    rotors.push(rotorObj);
                    console.log('Found rotor:', rotorObj.name, 'Type:', rotorObj.type, 'Parent:', rotorObj.parent?.name);
                }
            });
            
            // If auto-detection found nothing, set manually based on console names:
            if (rotors.length === 0) {
                console.warn('⚠️ Nenašiel som vrtule podľa názvu. Dopln ich ručne podľa názvov z konzoly.');
                
                // Try to get rotors by exact name (try both mesh and parent)
                const rotorNames = ['Rotor_FL', 'Rotor_FR', 'Rotor_BL', 'Rotor_BR'];
                rotorNames.forEach(name => {
                    const obj = droneRoot.getObjectByName(name);
                    if (obj) {
                        rotors.push(obj);
                    }
                });
            }
            
            if (rotors.length > 0) {
                console.log('✅ Rotors found:', rotors.map(r => r.name || '(no-name)'));
                
                // Store original positions and center geometry
                rotors.forEach(rotor => {
                    rotorOriginalPositions.set(rotor, rotor.position.clone());
                    
                    // Center the geometry so rotation happens around its center
                    if (rotor.geometry) {
                        rotor.geometry.computeBoundingBox();
                        const box = rotor.geometry.boundingBox;
                        const center = new THREE.Vector3();
                        box.getCenter(center);
                        
                        // Translate geometry so center is at origin
                        rotor.geometry.translate(-center.x, -center.y, -center.z);
                        
                        // Adjust position to compensate for geometry translation
                        rotor.position.add(center);
                        rotorOriginalPositions.set(rotor, rotor.position.clone());
                    }
                });
            }
        },
        (xhr) => {
            // Progress
            if (xhr.lengthComputable) {
                const percentComplete = (xhr.loaded / xhr.total) * 100;
                console.log(`📥 Loading: ${percentComplete.toFixed(1)}%`);
            }
        },
        (err) => {
            console.error('❌ Failed to load GLB:', err);
            console.error('Error details:', {
                message: err.message,
                url: MODEL_URL,
                stack: err.stack
            });
            console.error('Make sure Drone.glb is in the public/ directory');
        }
    );
}

// Find objects by name contains
function findByNameContains(root, contains) {
    const c = contains.toLowerCase();
    const out = [];
    root.traverse((o) => {
        if ((o.name || '').toLowerCase().includes(c)) out.push(o);
    });
    return out;
}

// Fit and center object
function fitAndCenter(object3d) {
    const box = new THREE.Box3().setFromObject(object3d);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    
    // Move to center
    object3d.position.sub(center);
    
    // Scale to larger size (target max ~5.0 units for bigger drone)
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
        const scale = 5.0 / maxDim; // Larger scale - bigger drone
        object3d.scale.setScalar(scale);
    }
    
    // Don't place on ground - we'll position it manually for flight
    // const box2 = new THREE.Box3().setFromObject(object3d);
    // object3d.position.y -= box2.min.y;
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    
    // Update scroll progress
    scrollProgress = Math.max(0, Math.min(1, scrollY / maxScroll));
    
    // Determine current scene based on scroll progress
    const newSceneIndex = Math.min(Math.floor(scrollProgress * scenes.length), scenes.length - 1);
    if (newSceneIndex !== currentSceneIndex && newSceneIndex < scenes.length) {
        // Detect scroll direction
        const scrollingDown = scrollY > prevScrollY;
        
        // Remove drone from old scene
        if (droneRoot && scenes[currentSceneIndex]) {
            scenes[currentSceneIndex].remove(droneRoot);
        }
        
        currentSceneIndex = newSceneIndex;
        scene = scenes[currentSceneIndex];
        
        // Reset scroll based on scroll direction
        const sceneScrollRange = maxScroll / scenes.length;
        if (scrollingDown) {
            // Scrolling down - reset to beginning of new scene
            scrollY = newSceneIndex * sceneScrollRange;
            scrollProgress = newSceneIndex / scenes.length;
        } else {
            // Scrolling up - reset to end of new scene
            scrollY = (newSceneIndex + 1) * sceneScrollRange - 1;
            scrollProgress = (newSceneIndex + 1) / scenes.length - 0.001;
        }
        
        // Reset drone position to start of scene
        if (droneRoot) {
            dronePositionZ = 0; // Reset forward position
            if (currentSceneIndex === 1) {
                // Sky scene - start higher
                droneRoot.position.y = 63;
            } else {
                // Other scenes - start at top
                droneRoot.position.y = droneStartY;
            }
        }
        
        // Add drone to new scene
        if (droneRoot) {
            scene.add(droneRoot);
        }
    }
    
    // Update previous scroll position
    prevScrollY = scrollY;
    
    // Calculate drone Y position based on scroll progress
    // Adjust height for sky scene (scene 1) - drone should fly just above clouds
    if (currentSceneIndex === 1) {
        // In sky scene, drone flies just above clouds (clouds at ~50-56, drone at 58-63)
        droneTargetY = 63 - (scrollProgress * 5); // Fly at 63-58 height, just above clouds at 50-56
    } else {
        droneTargetY = droneStartY - (scrollProgress * (droneStartY - droneEndY));
    }
    
    // Automatic forward movement when not scrolling - DISABLED to keep drone in scene
    // Faster movement in space scene
    // if (!isScrolling) {
    //     const speedMultiplier = currentSceneIndex === 0 ? 2.5 : 1.0; // Much faster in space
    //     dronePositionZ -= autoMoveSpeed * dt * 30 * speedMultiplier; // Move forward faster (negative Z = away from camera)
    // }
    
    // Smoothly move drone (only Y movement, no forward movement)
    if (droneRoot) {
        droneRoot.position.y += (droneTargetY - droneRoot.position.y) * 0.1;
        droneRoot.position.z = 0; // Keep drone at fixed Z position (no forward movement)
        
        // Spin rotors
        for (const r of rotors) {
            if (!r) continue;
            const originalPos = rotorOriginalPositions.get(r);
            if (!originalPos) continue;
            r.rotation.y += rotorSpinSpeed * dt;
            r.position.copy(originalPos);
        }
    }
    
    // Update camera to follow drone - move forward with drone
    if (droneRoot) {
        const targetY = droneRoot.position.y;
        const targetZ = droneRoot.position.z;
        
        // Calculate camera position based on drone height
        // Higher drone = more side view, lower drone = slightly more angled but still side view
        const heightFactor = (targetY - droneEndY) / (droneStartY - droneEndY); // 1 at top, 0 at bottom
        
        // Camera offset - more horizontal (side view) than vertical (top-down)
        const cameraOffsetY = 3 + heightFactor * 2; // Less vertical offset (3-5 instead of 8)
        const cameraOffsetZ = 15; // Horizontal distance (side view) - slightly further from drone
        const cameraOffsetX = 1.5; // Slight side angle for better view
        
        // Smooth camera movement - keep camera fixed (drone doesn't move forward)
        camera.position.y += (targetY + cameraOffsetY - camera.position.y) * 0.05;
        camera.position.z = cameraOffsetZ; // Fixed camera position (drone stays at Z=0)
        camera.position.x = cameraOffsetX;
        
        // Look at drone with slight downward angle (not straight down)
        const lookAtY = targetY - 1; // Look slightly below drone center
        camera.lookAt(cameraOffsetX * 0.5, lookAtY, 0); // Look at fixed Z position
        
        // Animate stars moving forward (infinite forward movement) - only in space scene
        // Drone stays at fixed position (Z=0), stars move towards it
        if (currentSceneIndex === 0 && scene.userData.stars && droneRoot) {
            const stars = scene.userData.stars;
            const positions = stars.geometry.attributes.position;
            const starSpeed = 80; // Speed at which stars approach (units per second) - much faster in space
            const droneZ = 0; // Drone stays at fixed Z position
            const resetDistance = 400; // Distance behind drone to reset stars
            
            // Move stars forward (towards drone) continuously
            for (let i = 0; i < positions.count; i++) {
                const currentZ = positions.getZ(i);
                
                // Move star forward (towards drone)
                const newZ = currentZ + starSpeed * dt;
                
                // If star passed the drone (went too far forward), reset it to the back
                // Also reset if star is too far behind (to ensure continuous generation)
                if (newZ > droneZ + 50 || currentZ < droneZ - resetDistance - 200) {
                    // Reset star to random position BEHIND drone
                    const theta = Math.random() * Math.PI * 2; // Azimuth angle (full circle)
                    const phi = Math.random() * Math.PI; // Polar angle (0 to π)
                    const radius = 100 + Math.random() * 400; // Distance from center
                    
                    // Calculate position in sphere
                    const x = radius * Math.sin(phi) * Math.cos(theta);
                    const y = radius * Math.sin(phi) * Math.sin(theta);
                    const z = radius * Math.cos(phi);
                    
                    // Place star behind drone (negative Z direction) - ensure it's within visible range
                    positions.setX(i, x);
                    positions.setY(i, y);
                    positions.setZ(i, droneZ - resetDistance - Math.random() * 200);
                } else {
                    positions.setZ(i, newZ);
                }
            }
            
            positions.needsUpdate = true;
            
            // Keep stars centered around drone's X and Y position (drone stays at origin)
            stars.position.x = 0; // Drone stays at X=0
            stars.position.y = droneRoot.position.y; // Follow drone's Y position
        }
        
        // Animate aurora layers - only in space scene
        // Drone stays at fixed position (Z=0)
        if (currentSceneIndex === 0 && scene.userData.auroraRings && droneRoot) {
            const time = clock.getElapsedTime();
            const droneZ = 0; // Drone stays at fixed Z position
            scene.userData.auroraRings.forEach((layer, index) => {
                if (layer.material.uniforms) {
                    layer.material.uniforms.time.value = time;
                }
                // Make aurora follow drone - create tunnel effect around drone
                // Layers are centered around drone's position (X, Y) and spaced along Z
                layer.position.x = 0; // Drone stays at X=0
                layer.position.y = droneRoot.position.y;
                layer.position.z = droneZ - 40 + index * 4; // Space layers around fixed drone position
            });
        }
        
        // Animate clouds - only in sky scene - infinite forward movement
        if (currentSceneIndex === 1 && scene.userData.cloudGroup && droneRoot) {
            const time = clock.getElapsedTime();
            const droneZ = droneRoot.position.z;
            const cloudSpeed = 2.0; // Speed at which clouds move forward (towards drone)
            
            // Animate each cloud - move forward continuously, reset when passed
            scene.userData.cloudGroup.children.forEach((cloud, index) => {
                if (cloud.userData.originalY !== undefined && cloud.userData.originalZ !== undefined) {
                    // Move cloud forward (towards drone)
                    cloud.position.z += cloudSpeed * dt;
                    
                    // Keep clouds at bottom - minimal vertical movement
                    cloud.position.y = cloud.userData.originalY + Math.sin(time * 0.3 + index) * 0.2;
                    
                    // If cloud passed the drone (went too far forward), reset it to the back
                    if (cloud.position.z > droneZ + 50) {
                        // Reset cloud to its original position relative to drone (maintain grid pattern)
                        const offsetZ = cloud.userData.originalZ - droneZ;
                        cloud.position.z = droneZ + offsetZ - 200; // Reset far behind
                    }
                }
            });
        }
    }
    
    renderer.render(scene, camera);
}

// Window resize handler
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Scroll handlers
function onWheel(event) {
    event.preventDefault();
    isScrolling = true;
    scrollY += event.deltaY * 0.5;
    scrollY = Math.max(0, Math.min(maxScroll, scrollY));
    
    // Reset scrolling flag after a delay
    clearTimeout(window.scrollTimeout);
    window.scrollTimeout = setTimeout(() => {
        isScrolling = false;
    }, 150);
}

// Touch handlers for mobile
let touchStartY = 0;
let lastTouchY = 0;

function onTouchStart(event) {
    isScrolling = true;
    touchStartY = event.touches[0].clientY;
    lastTouchY = touchStartY;
}

function onTouchMove(event) {
    event.preventDefault();
    isScrolling = true;
    const currentY = event.touches[0].clientY;
    const deltaY = lastTouchY - currentY;
    scrollY += deltaY * 2;
    scrollY = Math.max(0, Math.min(maxScroll, scrollY));
    lastTouchY = currentY;
}

function onTouchEnd(event) {
    // Reset scrolling flag after a delay
    clearTimeout(window.scrollTimeout);
    window.scrollTimeout = setTimeout(() => {
        isScrolling = false;
    }, 150);
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    init();
    // Show content after initialization (was hidden by inline script)
    document.documentElement.style.visibility = 'visible';
});

