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

// Color configuration - Royal blue theme from project with detailed parts
const droneColors = {
    body: 0x002366,      // Royal blue (#002366) - primary color from project - for Body
    bodyAccent: 0x003d99, // Secondary blue (#003d99) - for body accents
    rotors: 0xff6600,    // Vibrant orange (very visible and lively) - for Rotors
    camera: 0x1a1a1a,    // Dark gray/black - for camera
    lens: 0x000000,      // Black - for camera lens
    sensors: 0x4a9eff,   // Light blue - for sensors
    frame: 0x001a4d,     // Darker blue - for frame/arms
    details: 0xffffff,   // Bright white - for Cube002 and other details
    accent: 0x003d99,    // Secondary blue (#003d99) from project
    led: 0x00ffff,       // Cyan - for LED lights
    white: 0xffffff      // White
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
                    const cloudLayerHeight = 45; // Higher - clouds positioned higher
                    const cloudScaleX = 30; // Width scale for sprite
                    const cloudScaleY = 20; // Height scale for sprite
                    const coverageWidth = 250; // Larger area to cover
                    const coverageDepth = 250;
                    const spacing = 25; // Wider spacing for fewer clouds
                    
                    const xCount = Math.ceil(coverageWidth / spacing) + 2;
                    const zCount = Math.ceil(coverageDepth / spacing) + 2;
                    
                    // Create 3D effect with multiple layers at different heights - fewer layers
                    const layerCount = 3; // Fewer layers for less dense clouds
                    const layerSpacing = 1.5; // Vertical spacing between layers
                    
                    for (let layer = 0; layer < layerCount; layer++) {
                        const layerY = cloudLayerHeight + layer * layerSpacing;
                        const layerOpacity = 0.5 - layer * 0.1; // More transparent for deeper layers (sprite opacity)
                        
                        for (let x = 0; x < xCount; x++) {
                            for (let z = 0; z < zCount; z++) {
                                // Much larger random offset to break grid pattern and create seamless distribution
                                const randomOffsetX = (Math.random() - 0.5) * spacing * 1.2;
                                const randomOffsetZ = (Math.random() - 0.5) * spacing * 1.2;
                                const xPos = (x - xCount / 2) * spacing + randomOffsetX + layer * 2;
                                const zPos = (z - zCount / 2) * spacing + randomOffsetZ + layer * 2;
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
                        
                        const cloudLayerHeight = 45; // Higher - clouds positioned higher
                        const cloudScaleX = 30; // Width scale for sprite
                        const cloudScaleY = 20; // Height scale for sprite
                        const coverageWidth = 250; // Larger area to cover
                        const coverageDepth = 250;
                        const spacing = 25; // Wider spacing for fewer clouds
                        
                        const xCount = Math.ceil(coverageWidth / spacing) + 2;
                        const zCount = Math.ceil(coverageDepth / spacing) + 2;
                        
                        // Create 3D effect with multiple layers at different heights - fewer layers
                        const layerCount = 3; // Fewer layers for less dense clouds
                        const layerSpacing = 1.5; // Vertical spacing between layers
                        
                        for (let layer = 0; layer < layerCount; layer++) {
                            const layerY = cloudLayerHeight + layer * layerSpacing;
                            const layerOpacity = 0.5 - layer * 0.1; // More transparent for deeper layers (sprite opacity)
                            
                            for (let x = 0; x < xCount; x++) {
                                for (let z = 0; z < zCount; z++) {
                                    // Much larger random offset to break grid pattern and create seamless distribution
                                    const randomOffsetX = (Math.random() - 0.5) * spacing * 1.2;
                                    const randomOffsetZ = (Math.random() - 0.5) * spacing * 1.2;
                                    const xPos = (x - xCount / 2) * spacing + randomOffsetX + layer * 2;
                                    const zPos = (z - zCount / 2) * spacing + randomOffsetZ + layer * 2;
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

// Helper function to create cloud (Gamiable style - Mesh with PlaneGeometry)
function createCloudForScene(x, y, z, scaleX, scaleY, cloudTexture, opacity = 0.5) {
    if (!cloudTexture) return null;
    
    // Gamiable style: Use Mesh with PlaneGeometry instead of Sprite for better 3D effect
    const cloudSize = Math.max(scaleX, scaleY); // Use average size for plane geometry
    const cloudGeometry = new THREE.PlaneGeometry(cloudSize, cloudSize);
    
    // Create material similar to Gamiable style
    const cloudMaterial = new THREE.MeshStandardMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: opacity,
        depthWrite: false,
        side: THREE.DoubleSide,
        roughness: 0.8, // Less reflective, more matte like clouds
        metalness: 0.0
    });
    
    // Don't repeat texture - use original size
    cloudTexture.wrapS = THREE.ClampToEdgeWrapping;
    cloudTexture.wrapT = THREE.ClampToEdgeWrapping;
    cloudTexture.flipY = false;
    
    // Create mesh (Gamiable style)
    const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
    cloud.position.set(x, y, z);
    
    // Random rotation for 3D effect (like Gamiable)
    cloud.rotation.z = (Math.random() - 0.5) * Math.PI * 0.3; // Slight random rotation
    cloud.rotation.x = (Math.random() - 0.5) * Math.PI * 0.1;
    cloud.rotation.y = (Math.random() - 0.5) * Math.PI * 0.1;
    
    // Store original position for animation
    cloud.userData.originalY = y;
    cloud.userData.originalZ = z;
    cloud.userData.originalRotationZ = cloud.rotation.z;
    
    return cloud;
}

// Make function available globally for console access
window.setCloudTexture = setCloudTexture;

// Initialize Three.js
function init() {
    // Prevent multiple initializations
    if (isInitialized && scene && renderer) {
        console.log('Animation already initialized, skipping init()...');
        return;
    }
    
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
    // Camera will be updated in animate() to follow drone
    // Initial position - will be updated when drone loads
    camera.position.set(0, 15, 15);
    camera.lookAt(0, 0, 0);
    
    // Create three scenes
    createScenes();
    
    // Set initial scene
    scene = scenes[0];
    
    // Enable UniverseScene if it's the first scene
    if (scene.userData.universeScene) {
        scene.userData.universeScene.enable();
    }
    
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
}

// UniverseScene class - Gamiable style (EXACT implementation)
class UniverseScene {
    constructor() {
        this.stars = null;
        this.nova = null;
        this.group = null;
        this.clearColor = new THREE.Color(0);
        this.scene = new THREE.Scene(); // THREE.Scene for compatibility with existing code
        this.scene.background = new THREE.Color(0x000000); // Deep space black
        
        // Lighting for space scene
        this.scene.add(new THREE.AmbientLight(0xffffff, 1.2));
        const spaceDirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        spaceDirLight.position.set(5, 10, 5);
        this.scene.add(spaceDirLight);
        const pointLight = new THREE.PointLight(0xffffff, 1.0, 100);
        pointLight.position.set(0, 0, 10);
        this.scene.add(pointLight);
        
        // Gamiable constants - EXACT
        const FAR = 1000;
        const rnd = (min, max) => min + Math.random() * (max - min);
        const rndFS = (range) => (Math.random() - 0.5) * 2 * range;
        
        // Gamiable: group.position.set(0, 800, 0) - but that's for ship at Y=800
        // In our case, drone starts at Y=50, so adjust group position accordingly
        // We'll position group at origin and adjust star positions instead
        this.group = new THREE.Group();
        this.group.visible = false;
        this.group.position.set(0, 0, 0); // Position at origin, stars are distributed around it
        this.scene.add(this.group);
        
        // Create stars - Gamiable style
        const positions = new Float32Array(6000);
        const colors = new Float32Array(8000);
        const sizes = new Float32Array(2000);
        const speeds = new Float32Array(2000);
        const tempVec = new THREE.Vector3();
        
        for (let i = 0; i < 2000; i++) {
            tempVec.set(rndFS(1000), rndFS(1000), -rnd(0, FAR));
            tempVec.toArray(positions, i * 3);
            
            colors[i * 4] = rnd(0.5, 1);
            colors[i * 4 + 1] = rnd(0.5, 1);
            colors[i * 4 + 2] = rnd(0.5, 1);
            colors[i * 4 + 3] = rnd(0.2, 1.5);
            
            sizes[i] = 0.2 * rnd(5, 100);
            speeds[i] = rnd(40, 400);
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4));
        
        // Shaders - Gamiable style (matching as closely as possible)
        // Note: Gamiable uses actual shaders from assets.bin, these are approximations
        const starfieldVS = `
            attribute float size;
            attribute float speed;
            attribute vec4 color;
            varying vec4 vColor;
            uniform float uTime;
            
            void main() {
                vColor = color;
                vec3 pos = position;
                // Gamiable: stars move forward based on speed and time
                pos.z += uTime * speed * 0.01;
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                // Point size calculation - Gamiable style
                float pointSize = size * (300.0 / -mvPosition.z);
                gl_PointSize = pointSize;
                gl_Position = projectionMatrix * mvPosition;
            }
        `;
        
        const starfieldFS = `
            varying vec4 vColor;
            uniform sampler2D uTexture;
            
            void main() {
                vec4 texColor = texture2D(uTexture, gl_PointCoord);
                gl_FragColor = texColor * vColor;
            }
        `;
        
        // Create star texture (fallback if star.png not available)
        const starTextureCanvas = document.createElement('canvas');
        starTextureCanvas.width = 64;
        starTextureCanvas.height = 64;
        const starTextureContext = starTextureCanvas.getContext('2d');
        const gradient = starTextureContext.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        starTextureContext.fillStyle = gradient;
        starTextureContext.fillRect(0, 0, 64, 64);
        const starTexture = new THREE.CanvasTexture(starTextureCanvas);
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uTexture: { value: starTexture }
            },
            vertexShader: starfieldVS,
            fragmentShader: starfieldFS,
            transparent: true,
            depthWrite: false
        });
        
        // Try to load star.png texture
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            `${import.meta.env.BASE_URL}star.png`,
            (texture) => {
                material.uniforms.uTexture.value = texture;
            },
            undefined,
            () => {
                console.warn('star.png not found, using fallback texture');
            }
        );
        
        const points = new THREE.Points(geometry, material);
        points.renderOrder = 2;
        this.group.add(points);
        this.stars = points;
        
        // Create nova - Gamiable style
        const novaVS = `
            varying vec2 vUv;
            uniform float vShift;
            
            void main() {
                vUv = uv;
                vec3 pos = position;
                pos.y += vShift;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `;
        
        const novaFS = `
            varying vec2 vUv;
            uniform sampler2D uTexture;
            
            void main() {
                vec4 texColor = texture2D(uTexture, vUv);
                gl_FragColor = vec4(texColor.rgb * 1.5, texColor.a * 0.5);
            }
        `;
        
        const novaGeometry = new THREE.CylinderGeometry(1000, 100, 600, 128, 1, true);
        const novaMaterial = new THREE.ShaderMaterial({
            uniforms: {
                vShift: { value: 0 },
                uTexture: { value: null }
            },
            vertexShader: novaVS,
            fragmentShader: novaFS,
            depthTest: false,
            depthWrite: false,
            side: THREE.BackSide,
            transparent: true
        });
        
        // Try to load nova.jpg texture
        textureLoader.load(
            `${import.meta.env.BASE_URL}nova.jpg`,
            (texture) => {
                novaMaterial.uniforms.uTexture.value = texture;
            },
            undefined,
            () => {
                console.warn('nova.jpg not found, using fallback');
                // Create fallback texture
                const novaTextureCanvas = document.createElement('canvas');
                novaTextureCanvas.width = 256;
                novaTextureCanvas.height = 256;
                const novaTextureContext = novaTextureCanvas.getContext('2d');
                const novaGradient = novaTextureContext.createRadialGradient(128, 128, 0, 128, 128, 128);
                novaGradient.addColorStop(0, 'rgba(255, 200, 100, 1)');
                novaGradient.addColorStop(1, 'rgba(255, 100, 50, 0)');
                novaTextureContext.fillStyle = novaGradient;
                novaTextureContext.fillRect(0, 0, 256, 256);
                const fallbackNovaTexture = new THREE.CanvasTexture(novaTextureCanvas);
                novaMaterial.uniforms.uTexture.value = fallbackNovaTexture;
            }
        );
        
        const nova = new THREE.Mesh(novaGeometry, novaMaterial);
        // Gamiable: nova.position.z = camera.position.z - 700
        // Since camera might not be initialized, use relative position
        // Camera is typically at z=15, so -700 is far behind
        nova.position.z = -700;
        nova.rotation.x = Math.PI / 2;
        nova.renderOrder = -10;
        this.group.add(nova);
        this.nova = nova;
        
        // Store for animation
        this.scene.userData.universeScene = this;
    }
    
    animate(delta, time) {
        if (this.group && this.stars && this.nova) {
            if (this.stars.material.uniforms) {
                this.stars.material.uniforms.uTime.value = time;
            }
            if (this.nova.material.uniforms) {
                this.nova.material.uniforms.vShift.value = 0.2 * time;
            }
        }
    }
    
    enable() {
        if (this.group) this.group.visible = true;
    }
    
    disable() {
        if (this.group) this.group.visible = false;
    }
}

// Create three dummy scenes
function createScenes() {
    scenes = [];
    
    // Scene 1: Universe scene - Gamiable style
    const universeSceneObj = new UniverseScene();
    const scene1 = universeSceneObj.scene; // Use the THREE.Scene from UniverseScene
    
    // Scene 2: Sky scene with clouds - EXACT Gamiable implementation
    const scene2 = new THREE.Scene();
    scene2.background = new THREE.Color(0x194244); // Gamiable sky color (darker blue-gray)
    
    // Gamiable constants
    const CLOUD_COUNT = 500; // Gamiable uses 500 clouds
    const CLOUD_SPEED = 100; // Gamiable CLOUD_SPEED = 100
    const FAR = 1000; // Far distance
    
    // Helper functions for random (Gamiable style)
    const rnd = (min, max) => min + Math.random() * (max - min);
    const rndFS = (range) => (Math.random() - 0.5) * 2 * range;
    
    // Create group (Gamiable style)
    const skyGroup = new THREE.Group();
    skyGroup.position.set(0, 200, 0); // Gamiable: group.position.set(0, 200, 0)
    scene2.add(skyGroup);
    scene2.userData.skyGroup = skyGroup;
    scene2.userData.clouds = []; // Store cloud array like Gamiable
    
    // Sky background - try to load sky.jpg, fallback to simple material
    const textureLoader = new THREE.TextureLoader();
    
    // Simple shader-like fallback for sky background (Gamiable uses ShaderMaterial)
    const skyMaterial = new THREE.MeshBasicMaterial({
        color: 0x194244, // Gamiable uColor default
        side: THREE.DoubleSide,
        depthTest: false, // Gamiable: depthTest: false
        depthWrite: false // Gamiable: depthWrite: false
    });
    
    // Try to load sky.jpg texture
    textureLoader.load(
        `${import.meta.env.BASE_URL}sky.jpg`,
        (texture) => {
            texture.flipY = true; // Gamiable: texture.flipY = true
            skyMaterial.map = texture;
            skyMaterial.needsUpdate = true;
        },
        undefined,
        () => {
            // Fallback: use solid color
            console.warn('sky.jpg not found, using solid color');
        }
    );
    
    const skyPlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), skyMaterial);
    skyPlane.scale.set(1000, 1000, 1); // Gamiable: scale.set(1000, 1000, 1)
    skyPlane.rotation.x = Math.PI / 2; // Gamiable: rotation.x = Math.PI / 2
    skyPlane.position.set(0, 0, -900); // Gamiable: position.set(0, 0, -900)
    skyPlane.renderOrder = -100; // Gamiable: renderOrder = -100
    skyGroup.add(skyPlane);
    scene2.userData.skyPlane = skyPlane;
    scene2.userData.skyMaterial = skyMaterial; // Store for animation updates
    
    // Clouds - try to load cloud.png, fallback to simple material
    // Simple shader-like fallback for clouds (Gamiable uses ShaderMaterial)
    const cloudMaterial = new THREE.MeshStandardMaterial({
        transparent: true,
        depthWrite: false, // Gamiable: depthWrite: false
        side: THREE.DoubleSide,
        roughness: 1.0,
        metalness: 0.0
    });
    
    // Try to load cloud.png texture
    textureLoader.load(
        `${import.meta.env.BASE_URL}cloud.png`,
        (texture) => {
            cloudMaterial.map = texture;
            cloudMaterial.needsUpdate = true;
            createGamiableClouds();
        },
        undefined,
        () => {
            // Fallback: create white clouds without texture
            console.warn('cloud.png not found, creating white clouds');
            cloudMaterial.color = new THREE.Color(0xffffff);
            cloudMaterial.opacity = 0.8;
            createGamiableClouds();
        }
    );
    
    // Function to create Gamiable style clouds (EXACT implementation)
    function createGamiableClouds() {
        scene2.userData.clouds = [];
        
        for (let i = 0; i < CLOUD_COUNT; i++) {
            const size = rnd(100, 175); // Gamiable: rnd(100, 175)
            const cloud = new THREE.Mesh(new THREE.PlaneGeometry(size, size), cloudMaterial);
            cloud.position.set(rndFS(1500), rndFS(50) - 100, -rndFS(FAR)); // Gamiable exact
            cloud.renderOrder = FAR + cloud.position.z; // Gamiable: renderOrder = FAR + cloud.position.z
            cloud.rotation.z = rndFS(2 * Math.PI); // Gamiable: rndFS(2 * Math.PI)
            scene2.userData.clouds.push(cloud);
            skyGroup.add(cloud);
        }
        
        console.log(`✅ Created ${CLOUD_COUNT} Gamiable-style clouds (exact implementation)`);
    }
    
    // Scene 3: Water surface scene with gentle clouds above (inspired by gamiable.com)
    const scene3 = new THREE.Scene();
    scene3.background = new THREE.Color(0x87CEEB); // Sky blue
    // Enhanced lighting for realistic water scene
    scene3.add(new THREE.HemisphereLight(0xffffff, 0x87CEEB, 1.4)); // Brighter, more sky-like
    const light3 = new THREE.DirectionalLight(0xffffff, 1.5);
    light3.position.set(5, 15, 5);
    scene3.add(light3);
    
    // Add ambient light for water scene
    const ambientLight3 = new THREE.AmbientLight(0xffffff, 0.9);
    scene3.add(ambientLight3);
    
    // Add realistic water surface with waves (enhanced for gamiable.com style)
    const waterGeometry = new THREE.PlaneGeometry(400, 400, 128, 128); // More segments for smoother waves
    const waterMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1E90FF, // Bright blue (DodgerBlue) - very visible
        roughness: 0.05, // More reflective water
        metalness: 0.4, // More metallic for water reflection
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95 // Slightly transparent for depth
    });
    
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, -3, 0); // Water below drone but visible, centered
    water.receiveShadow = false;
    water.castShadow = false;
    
    // Add water reflection effect (simple environment map simulation)
    waterMaterial.envMapIntensity = 0.5;
    
    // Store original positions for wave animation
    const positions = waterGeometry.attributes.position;
    const originalPositions = new Float32Array(positions.array.length);
    originalPositions.set(positions.array);
    water.userData.originalPositions = originalPositions;
    scene3.add(water);
    scene3.userData.water = water; // Store reference for animation
    
    // Create gentle clouds above drone - similar to scene 2 but lighter and higher
    const cloudGroup3 = new THREE.Group();
    scene3.add(cloudGroup3);
    scene3.userData.cloudGroup = cloudGroup3;
    scene3.userData.cloudTexture = null;
    
    // Function to create clouds for scene 3 (gentle clouds above)
    function createCloudsForScene3() {
        const availableTextures = scene2.userData.cloudTextures || [];
        if (availableTextures.length === 0) {
            // If textures not loaded yet, wait for them
            return;
        }
        
        // Enhanced clouds for water scene (inspired by gamiable.com)
        const cloudLayerHeight = 15; // Clouds above drone (lower position)
        const cloudScaleX = 28; // Slightly larger clouds for better visibility
        const cloudScaleY = 20;
        const coverageWidth = 450; // Wider coverage for clouds
        const coverageDepth = 600; // Much deeper coverage - generate clouds far ahead
        const spacing = 28; // Slightly tighter spacing for more clouds
        
        const xCount = Math.ceil(coverageWidth / spacing) + 3; // More clouds for seamless coverage
        const zCount = Math.ceil(coverageDepth / spacing) + 3;
        
        // More layers for better depth effect
        const layerCount = 3; // More layers for depth
        const layerSpacing = 1.8;
        
        // Get drone position for relative cloud positioning (drone is at Z=0)
        // Generate clouds already spread far ahead - from -600 to +100 (already ahead of drone)
        const droneZ = 0;
        const cloudStartZ = droneZ - coverageDepth; // Start at -600
        const cloudEndZ = droneZ + 100; // Extend to +100 (already ahead)
        const totalDepth = cloudEndZ - cloudStartZ; // Total depth: 700
        
        for (let layer = 0; layer < layerCount; layer++) {
            const layerY = cloudLayerHeight + layer * layerSpacing;
            // Enhanced opacity for water scene clouds (inspired by gamiable.com)
            const layerOpacity = 0.35 - layer * 0.1; // More visible clouds (0.35, 0.25, 0.15)
            
            for (let x = 0; x < xCount; x++) {
                for (let z = 0; z < zCount; z++) {
                    const randomOffsetX = (Math.random() - 0.5) * spacing * 1.2;
                    const randomOffsetZ = (Math.random() - 0.5) * spacing * 1.2;
                    const xPos = (x - xCount / 2) * spacing + randomOffsetX + layer * 2;
                    // Distribute clouds across the full range from cloudStartZ to cloudEndZ
                    const zProgress = z / (zCount - 1); // 0 to 1
                    const zPos = cloudStartZ + zProgress * totalDepth + randomOffsetZ + layer * 2;
                    
                    const selectedTexture = availableTextures[Math.floor(Math.random() * availableTextures.length)];
                    const cloud = createCloudForScene(xPos, layerY, zPos, cloudScaleX, cloudScaleY, selectedTexture, layerOpacity);
                    if (cloud) {
                        cloudGroup3.add(cloud);
                    }
                }
            }
        }
    }
    
    // Create clouds when textures are available (use scene2 which has the cloud textures)
    if (scene2.userData.cloudTextures && scene2.userData.cloudTextures.length > 0) {
        createCloudsForScene3();
    } else {
        // Wait for textures to load
        const checkTextures = setInterval(() => {
            if (scene2.userData.cloudTextures && scene2.userData.cloudTextures.length > 0) {
                createCloudsForScene3();
                clearInterval(checkTextures);
            }
        }, 100);
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
            console.log('✅ droneRoot set:', { droneRoot: !!droneRoot });
            
            // Center and scale
            fitAndCenter(droneRoot);
            
            // Position drone at start position (high up, centered)
            droneRoot.position.y = droneStartY;
            droneRoot.position.x = 0; // Start centered
            droneRoot.position.z = dronePositionZ;
            // Show drone from the start
            droneRoot.visible = true;
            
            // Add to ALL scenes for smooth transitions
            scenes.forEach((s, index) => {
                if (s && !s.children.includes(droneRoot)) {
                    s.add(droneRoot);
                    console.log(`Added drone to scene ${index} during model load`);
                }
            });
            // Also add to current scene
            if (scene && !scene.children.includes(droneRoot)) {
                scene.add(droneRoot);
            }
            
            // Log all nodes/meshes and apply colors
            console.group('📋 GLB node/mesh list');
            let meshCount = 0;
            let nodeCount = 0;
            const meshPositions = []; // Store mesh positions for size-based coloring
            
            // First pass: collect all meshes and their positions
            droneRoot.traverse((o) => {
                if (o.isMesh) {
                    meshCount++;
                    const box = new THREE.Box3().setFromObject(o);
                    const size = new THREE.Vector3();
                    box.getSize(size);
                    const center = new THREE.Vector3();
                    box.getCenter(center);
                    
                    meshPositions.push({
                        mesh: o,
                        size: size,
                        center: center,
                        name: o.name || ''
                    });
                }
            });
            
            // Second pass: apply colors based on position, size, and name
            meshPositions.forEach((meshData, index) => {
                const o = meshData.mesh;
                const name = (meshData.name || '').toLowerCase();
                const size = meshData.size;
                const center = meshData.center;
                const maxSize = Math.max(size.x, size.y, size.z);
                const isSmall = maxSize < 0.5; // Small parts
                const isMedium = maxSize >= 0.5 && maxSize < 1.5; // Medium parts
                const isLarge = maxSize >= 1.5; // Large parts
                
                console.log(`MESH [${index + 1}]:`, name || '(no-name)', {
                    name: name,
                    size: maxSize.toFixed(2),
                    position: `(${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})`
                });
                
                // Apply colors to ALL meshes - Vibrant colorful theme
                if (o.material) {
                    const materials = Array.isArray(o.material) ? o.material : [o.material];
                    
                    materials.forEach((mat, idx) => {
                        // Detect different parts of the drone
                        const isRotor = /rotor|prop|fan|blade/i.test(name);
                        const isCamera = /camera|cam/i.test(name);
                        const isLens = /lens/i.test(name);
                        const isSensor = /sensor|detector|scanner/i.test(name);
                        const isFrame = /frame|arm|leg|support/i.test(name);
                        const isLED = /led|light|indicator/i.test(name);
                        const isBody = /body|main|center|core/i.test(name);
                        const isDetail = /cube|detail|part|component/i.test(name);
                        
                        let colorToApply;
                        let emissiveColor;
                        let emissiveIntensity;
                        
                        if (isRotor) {
                            // Rotors - vibrant orange
                            colorToApply = droneColors.rotors;
                            emissiveColor = droneColors.rotors;
                            emissiveIntensity = 2.0;
                            console.log(`Applied rotor color to ${name}:`, colorToApply.toString(16));
                        } else if (isLens) {
                            // Camera lens - black
                            colorToApply = droneColors.lens;
                            emissiveColor = 0x000000;
                            emissiveIntensity = 0.0;
                            console.log(`Applied lens color to ${name}:`, colorToApply.toString(16));
                        } else if (isCamera) {
                            // Camera body - black
                            colorToApply = 0x000000;
                            emissiveColor = 0x000000;
                            emissiveIntensity = 0.0;
                            console.log(`Applied camera color to ${name}:`, colorToApply.toString(16));
                        } else if (isSensor) {
                            // Sensors - light blue
                            colorToApply = droneColors.sensors;
                            emissiveColor = droneColors.sensors;
                            emissiveIntensity = 1.2;
                            console.log(`Applied sensor color to ${name}:`, colorToApply.toString(16));
                        } else if (isLED) {
                            // LED lights - cyan
                            colorToApply = droneColors.led;
                            emissiveColor = droneColors.led;
                            emissiveIntensity = 2.5;
                            console.log(`Applied LED color to ${name}:`, colorToApply.toString(16));
                        } else if (isFrame) {
                            // Frame/arms - darker blue
                            colorToApply = droneColors.frame;
                            emissiveColor = droneColors.frame;
                            emissiveIntensity = 0.8;
                            console.log(`Applied frame color to ${name}:`, colorToApply.toString(16));
                        } else if (isDetail || isSmall) {
                            // Small parts and details - white or secondary blue
                            const useAccent = (index % 3) === 0; // Every 3rd uses accent
                            colorToApply = useAccent ? droneColors.bodyAccent : droneColors.details;
                            emissiveColor = useAccent ? droneColors.bodyAccent : droneColors.details;
                            emissiveIntensity = useAccent ? 1.0 : 0.8;
                            console.log(`Applied detail/small color to ${name}:`, colorToApply.toString(16));
                        } else if (isMedium) {
                            // Medium parts - alternate between royal blue and secondary blue
                            const useAccent = (index % 2) === 0; // Alternate
                            colorToApply = useAccent ? droneColors.bodyAccent : droneColors.body;
                            emissiveColor = useAccent ? droneColors.bodyAccent : droneColors.body;
                            emissiveIntensity = useAccent ? 1.2 : 1.5;
                            console.log(`Applied medium part color to ${name}:`, colorToApply.toString(16));
                        } else if (isLarge || isBody) {
                            // Large parts/body - royal blue with some accent parts
                            const useAccent = (index % 5) === 0 || (index % 5) === 2; // Some parts use accent
                            colorToApply = useAccent ? droneColors.bodyAccent : droneColors.body;
                            emissiveColor = useAccent ? droneColors.bodyAccent : droneColors.body;
                            emissiveIntensity = useAccent ? 1.2 : 1.5;
                            console.log(`Applied large/body color to ${name}:`, colorToApply.toString(16));
                        } else {
                            // Default - use index for consistent coloring pattern
                            const pattern = index % 6;
                            if (pattern === 0 || pattern === 3) {
                                colorToApply = droneColors.body;
                                emissiveColor = droneColors.body;
                                emissiveIntensity = 1.5;
                            } else if (pattern === 1 || pattern === 4) {
                                colorToApply = droneColors.bodyAccent;
                                emissiveColor = droneColors.bodyAccent;
                                emissiveIntensity = 1.2;
                            } else {
                                colorToApply = droneColors.details;
                                emissiveColor = droneColors.details;
                                emissiveIntensity = 0.8;
                            }
                            console.log(`Applied default pattern color to ${name || 'unnamed'}:`, colorToApply.toString(16));
                        }
                        
                        // Create new MeshStandardMaterial with vibrant colors and very high emissive
                        // Using MeshStandardMaterial with high emissive for self-illuminated vibrant colors
                        const newMaterial = new THREE.MeshStandardMaterial({
                            color: colorToApply,
                            emissive: emissiveColor,
                            emissiveIntensity: emissiveIntensity,
                            metalness: isLens ? 0.8 : (isFrame ? 0.2 : 0.0), // Lens and frame slightly metallic
                            roughness: isLens ? 0.05 : (isFrame ? 0.3 : 0.1), // Lens very smooth, frame rougher
                        });
                        
                        // Replace material
                        if (Array.isArray(o.material)) {
                            o.material[idx] = newMaterial;
                        } else {
                            o.material = newMaterial;
                        }
                    });
                }
            });
            
            // Log node information
            droneRoot.traverse((o) => {
                if (o.isObject3D && o.name && !o.isMesh) {
                    nodeCount++;
                    console.log(`NODE [${nodeCount}]:`, o.name, {
                        name: o.name,
                        type: o.type,
                        children: o.children.length
                    });
                }
            });
            
            console.log(`Total: ${meshPositions.length} meshes, ${nodeCount} named nodes`);
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
    
    // Scale to larger size - smaller on mobile devices
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
        // Check if mobile device (width <= 768px)
        const isMobile = window.innerWidth <= 768;
        const targetSize = isMobile ? 3.5 : 5.0; // Smaller on mobile
        const scale = targetSize / maxDim;
        object3d.scale.setScalar(scale);
    }
    
    // Don't place on ground - we'll position it manually for flight
    // const box2 = new THREE.Box3().setFromObject(object3d);
    // object3d.position.y -= box2.min.y;
}

// Text animation - texts scroll up as user scrolls, longer visibility for readability
function updateTexts() {
    const textElements = document.querySelectorAll('.scroll-text');
    const textCount = textElements.length;
    // Longer range per text for better readability (each text gets more scroll space)
    const progressPerText = 1 / textCount;
    const fadeInRange = 0.05; // Quick fade in (5% of text's range)
    const fadeOutRange = 0.05; // Quick fade out (5% of text's range)
    const stayDownRange = 0.15; // Time text stays down before scrolling up (15% of text's range)
    
    textElements.forEach((textEl, index) => {
        const textStart = index * progressPerText;
        const textEnd = (index + 1) * progressPerText;
        const textFadeInEnd = textStart + fadeInRange;
        const textStayDownEnd = textFadeInEnd + stayDownRange; // Text stays down longer
        const textFadeOutStart = textEnd - fadeOutRange;
        const isCTA = textEl.classList.contains('scroll-text-cta');
        
        // Calculate visibility and position based on scroll progress
        let opacity = 0;
        let translateY = 100;
        
        // CTA - stays at bottom, doesn't scroll up
        if (isCTA) {
            if (scrollProgress >= textStart) {
                // CTA appears and stays at bottom
                if (scrollProgress < textFadeInEnd) {
                    // Fade in
                    const localProgress = (scrollProgress - textStart) / (textFadeInEnd - textStart);
                    opacity = localProgress;
                    translateY = 50 * (1 - localProgress) + 30; // Start from 50px, move to 30px (lower)
                } else {
                    // Fully visible, stays at bottom (lower position)
                    opacity = 1;
                    translateY = 30; // Stay lower on screen
                }
            } else {
                // CTA hasn't appeared yet
                opacity = 0;
                translateY = 50;
            }
        }
        // First text - visible at start, much higher up, scrolls up
        else if (index === 0) {
            if (scrollProgress <= textEnd) {
                // First text is visible from start and scrolls up
                if (scrollProgress <= textFadeOutStart) {
                    // Stay fully visible and move up slowly
                    opacity = 1;
                    // Start much higher (-200px), move up gradually
                    const localProgress = scrollProgress / textFadeOutStart;
                    translateY = -200 - (localProgress * 100); // From -200px to -300px (moving up)
                } else {
                    // Fade out and continue moving up
                    const localProgress = (scrollProgress - textFadeOutStart) / (textEnd - textFadeOutStart);
                    opacity = 1 - localProgress;
                    translateY = -300 - (localProgress * 50); // Continue moving up
                }
            } else {
                // First text has passed
                opacity = 0;
                translateY = -350;
            }
        } else {
            // Other texts - appear lower, stay down longer, then scroll up
            if (scrollProgress >= textStart && scrollProgress <= textEnd) {
                // Text is in its range
                if (scrollProgress < textFadeInEnd) {
                    // Fade in from bottom (lower position)
                    const localProgress = (scrollProgress - textStart) / (textFadeInEnd - textStart);
                    opacity = localProgress;
                    translateY = 150 * (1 - localProgress); // Start from 150px, move to 50px
                } else if (scrollProgress <= textStayDownEnd) {
                    // Stay fully visible DOWN (50px) - LONG period before scrolling up
                    opacity = 1;
                    translateY = 50; // Stay down longer
                } else if (scrollProgress <= textFadeOutStart) {
                    // Scroll up while still visible
                    const localProgress = (scrollProgress - textStayDownEnd) / (textFadeOutStart - textStayDownEnd);
                    opacity = 1;
                    translateY = 50 - (localProgress * 350); // Move from 50px to -300px
                } else {
                    // Fade out while moving up
                    const localProgress = (scrollProgress - textFadeOutStart) / (textEnd - textFadeOutStart);
                    opacity = 1 - localProgress;
                    translateY = -300 - (localProgress * 50); // Continue moving up
                }
            } else if (scrollProgress < textStart) {
                // Text hasn't appeared yet - below screen
                opacity = 0;
                translateY = 150;
            } else {
                // Text has passed - above screen (same height as first text)
                opacity = 0;
                translateY = -300;
            }
        }
        
        textEl.style.opacity = opacity;
        textEl.style.transform = `translateY(${translateY}px)`;
        
        if (opacity > 0.1) {
            textEl.classList.add('visible');
        } else {
            textEl.classList.remove('visible');
        }
    });
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    
    // Update scroll progress
    scrollProgress = Math.max(0, Math.min(1, scrollY / maxScroll));
    
    // Update text animations
    updateTexts();
    
    // Determine current scene based on scroll progress
    const newSceneIndex = Math.min(Math.floor(scrollProgress * scenes.length), scenes.length - 1);
    if (newSceneIndex !== currentSceneIndex && newSceneIndex < scenes.length) {
        // Detect scroll direction
        const scrollingDown = scrollY > prevScrollY;
        
        // Disable old UniverseScene if it exists
        if (scenes[currentSceneIndex] && scenes[currentSceneIndex].userData.universeScene) {
            scenes[currentSceneIndex].userData.universeScene.disable();
        }
        
        // Remove drone from old scene
        if (droneRoot && scenes[currentSceneIndex]) {
            scenes[currentSceneIndex].remove(droneRoot);
        }
        
        currentSceneIndex = newSceneIndex;
        scene = scenes[currentSceneIndex];
        
        // Enable new UniverseScene if it exists
        if (scene.userData.universeScene) {
            scene.userData.universeScene.enable();
        }
        
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
            } else if (currentSceneIndex === 2) {
                // Water scene - start at medium height (between water and clouds)
                droneRoot.position.y = 20;
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
    } else if (currentSceneIndex === 2) {
        // In water scene (scene 3), drone should stay above water surface (water at y = -3)
        // Drone starts at y = 20 and can descend but not below y = 0 (above water)
        const minY = 0; // Minimum height above water
        const maxY = 20; // Starting height
        droneTargetY = maxY - (scrollProgress * (maxY - minY));
        droneTargetY = Math.max(droneTargetY, minY); // Ensure drone doesn't go below water
    } else {
        droneTargetY = droneStartY - (scrollProgress * (droneStartY - droneEndY));
    }
    
    // Automatic forward movement when not scrolling - DISABLED to keep drone in scene
    // Faster movement in space scene
    // if (!isScrolling) {
    //     const speedMultiplier = currentSceneIndex === 0 ? 2.5 : 1.0; // Much faster in space
    //     dronePositionZ -= autoMoveSpeed * dt * 30 * speedMultiplier; // Move forward faster (negative Z = away from camera)
    // }
    
    // Smoothly move drone (Y movement)
    if (droneRoot && droneRoot.visible) {
        // Keep drone at center
        droneRoot.position.x = 0;
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
        // Use actual drone position X for lookAt during entrance animation
        const droneX = droneRoot.position.x;
        const lookAtY = targetY - 1; // Look slightly below drone center
        camera.lookAt(droneX * 0.5, lookAtY, 0); // Look at drone's X position (centered when at 0)
        
        // Animate UniverseScene - Gamiable style
        if (currentSceneIndex === 0 && scene.userData.universeScene) {
            const universeScene = scene.userData.universeScene;
            const time = clock.getElapsedTime();
            universeScene.animate(dt, time);
            
            // Gamiable: group follows ship position (ship.positionY)
            // In our case, group should follow drone Y position
            if (universeScene.group && droneRoot) {
                // Adjust group Y position to follow drone (like Gamiable follows ship)
                // Gamiable uses group.position.set(0, 800, 0) for ship at Y=800
                // We adjust based on drone position
                universeScene.group.position.y = droneRoot.position.y;
            }
        }
        
        // Animate clouds - only in sky scene (scene 2) - EXACT Gamiable implementation
        if (currentSceneIndex === 1 && scene.userData.clouds && scene.userData.clouds.length > 0) {
            const CLOUD_SPEED = 100; // Gamiable CLOUD_SPEED = 100
            const FAR = 1000; // Gamiable FAR = 1000
            const speed = CLOUD_SPEED * dt; // Gamiable: const speed = CLOUD_SPEED * delta
            
            // Update sky material color (Gamiable: this.skyMaterial.uniforms.uColor.value.copy(currentClearColor))
            if (scene.userData.skyMaterial) {
                // Gamiable updates uColor to match currentClearColor
                // We'll update the material color to match scene background
                const currentColor = scene.background;
                if (scene.userData.skyMaterial.color) {
                    scene.userData.skyMaterial.color.copy(currentColor);
                }
            }
            
            // Animate each cloud - EXACT Gamiable style (for loop, not forEach)
            for (let i = 0; i < scene.userData.clouds.length; i++) {
                // Move cloud forward (Gamiable: this.clouds[i].position.z += speed)
                scene.userData.clouds[i].position.z += speed;
                
                // Reset when cloud passes (Gamiable: if (this.clouds[i].position.z > 0) { this.clouds[i].position.z -= FAR; })
                if (scene.userData.clouds[i].position.z > 0) {
                    scene.userData.clouds[i].position.z -= FAR;
                }
                
                // Update render order for depth (Gamiable: this.clouds[i].renderOrder = FAR + this.clouds[i].position.z)
                scene.userData.clouds[i].renderOrder = FAR + scene.userData.clouds[i].position.z;
            }
        }
        
        // Animate clouds - in water scene (scene 3) - Gamiable style gentle clouds above
        if (currentSceneIndex === 2 && scene.userData.cloudGroup && droneRoot) {
            const time = clock.getElapsedTime();
            const droneZ = droneRoot.position.z;
            const cloudSpeed = 80.0; // Gamiable style speed (slightly slower for water scene)
            const FAR = 1000; // Far distance for reset
            
            // Animate each cloud - Gamiable style continuous movement
            scene.userData.cloudGroup.children.forEach((cloud, index) => {
                if (cloud.userData.originalY !== undefined && cloud.userData.originalZ !== undefined) {
                    // Move cloud forward (towards drone) - Gamiable style
                    cloud.position.z += cloudSpeed * dt;
                    
                    // Gentle floating animation (Gamiable style)
                    cloud.position.y = cloud.userData.originalY + Math.sin(time * 0.2 + index * 0.1) * 0.4;
                    
                    // Gentle rotation animation for 3D effect (Gamiable style)
                    if (cloud.userData.originalRotationZ !== undefined) {
                        cloud.rotation.z = cloud.userData.originalRotationZ + Math.sin(time * 0.12 + index * 0.05) * 0.08;
                    }
                    
                    // Reset when cloud passes (Gamiable style)
                    if (cloud.position.z > 0) {
                        cloud.position.z -= FAR; // Reset to far back
                    }
                    
                    // Update render order for depth (Gamiable style)
                    cloud.renderOrder = FAR + cloud.position.z;
                }
            });
        }
        
        // Animate water waves - only in water scene (scene 3)
        if (currentSceneIndex === 2 && scene.userData.water) {
            const time = clock.getElapsedTime();
            const water = scene.userData.water;
            const positions = water.geometry.attributes.position;
            const originalPositions = water.userData.originalPositions;
            
            if (originalPositions) {
                for (let i = 0; i < positions.count; i++) {
                    const i3 = i * 3;
                    const x = originalPositions[i3];
                    const z = originalPositions[i3 + 2];
                    
                    // Enhanced wave animation (inspired by gamiable.com)
                    const wave1 = Math.sin(x * 0.08 + time * 0.4) * 0.4; // Larger, slower waves
                    const wave2 = Math.sin(z * 0.12 + time * 0.6) * 0.3;
                    const wave3 = Math.sin((x + z) * 0.06 + time * 0.5) * 0.2;
                    const wave4 = Math.sin((x * 0.15 + z * 0.1 + time * 0.3) * 0.5) * 0.15; // Additional wave layer
                    
                    positions.setY(i, originalPositions[i3 + 1] + wave1 + wave2 + wave3 + wave4);
                }
                positions.needsUpdate = true;
            }
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



// Flag to prevent multiple initializations
let isInitialized = false;

// Initialize when DOM is ready - start animation immediately (scene visible, drone off-screen)
document.addEventListener('DOMContentLoaded', () => {
    if (!isInitialized) {
        init(); // Start animation immediately, but drone will be off-screen until "Explore" is clicked
        isInitialized = true;
    }
});

