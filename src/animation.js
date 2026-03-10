import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Water } from "three/examples/jsm/objects/Water.js";

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
let animationStarted = false; // Track if Explore button was clicked

// Vertical offset for drone and water - adjust this single value to move everything up/down
const VERTICAL_OFFSET = -650; // Negative = lower, Positive = higher

// Drone flight path (base values + offset)
const droneStartY = 50 + VERTICAL_OFFSET; // Start high up
const droneEndY = -10 + VERTICAL_OFFSET; // End low
let droneTargetY = droneStartY;
let dronePositionZ = 0; // Forward position (negative = forward/away)

// Drone entrance animation
let entranceAnimationActive = true;
let entranceAnimationStartTime = 0;
const entranceAnimationDuration = 2.0; // 2 seconds
const entranceStartX = -30; // Start position from left
const entranceEndX = 0; // End position (center)

// Color configuration - Realistic drone colors (lighter version, inspired by DJI drones)
const droneColors = {
    body: 0x666666, // Light gray (#D3D3D3) - like DJI Mavic/Phantom body color - for Body (primary)
    rotors: 0xD3D3D3, // Vibrant orange (very visible and lively) - for Rotors
    details: 0xD3D3D3 // Off-white (#F5F5F5) - light gray-white for details - for Cube002 and other details
};

const enableDroneColors = false;

// Drone brightness control (when enableDroneColors is false)
// Range: 0.0 (darkest) to 2.0 (brightest), default: 1.0 (original brightness)
const droneBrightness = 1.2;

// Initialize Three.js
function init() {
    // Prevent multiple initializations
    if (isInitialized && scene && renderer) {
        console.log("Animation already initialized, skipping init()...");
        return;
    }

    const canvas = document.getElementById("drone-canvas");

    if (!canvas) {
        console.error("Canvas not found");
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
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.01, 1000);
    // Camera will be updated in animate() to follow drone
    // Initial position - will be updated when drone loads
    camera.position.set(0, 15, 15);
    camera.lookAt(0, 0, 0);

    // Create three scenes
    createScenes();

    // Set initial scene
    scene = scenes[0];

    // Load GLB model
    loadDroneModel();

    // Event listeners
    window.addEventListener("resize", onWindowResize, false);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: false });

    // Start animation
    animate();
}

// SpaceScene class - Space scene with stars and aurora
class SpaceScene {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000); // Deep space black

        // Ambient light for space - brighter for vibrant drone colors
        this.scene.add(new THREE.AmbientLight(0xffffff, 1.2));

        // Add directional light for better drone visibility and vibrant colors
        const spaceDirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        spaceDirLight.position.set(5, 10, 5);
        this.scene.add(spaceDirLight);

        // Add additional point light for more vibrant colors
        const pointLight = new THREE.PointLight(0xffffff, 1.0, 100);
        pointLight.position.set(0, 0, 10);
        this.scene.add(pointLight);

        // Add stars - create tunnel effect (cylindrical distribution)
        // Create multiple star groups with different sizes for realistic star field
        const starsGroup = new THREE.Group();

        // Small stars (most common)
        const smallStarsGeometry = new THREE.BufferGeometry();
        const smallStarsCount = 1000;
        const smallStarsPositions = new Float32Array(smallStarsCount * 3);

        // Medium stars (less common)
        const mediumStarsGeometry = new THREE.BufferGeometry();
        const mediumStarsCount = 250;
        const mediumStarsPositions = new Float32Array(mediumStarsCount * 3);

        // Large/bright stars (rare)
        const largeStarsGeometry = new THREE.BufferGeometry();
        const largeStarsCount = 50;
        const largeStarsPositions = new Float32Array(largeStarsCount * 3);

        // Tunnel parameters - wider tunnel for more side distribution
        const tunnelMinRadius = 8;
        const tunnelMaxRadius = 280;
        const tunnelLength = 1200;

        // Helper function to create star positions
        const createStarPositions = (positions, count) => {
            for (let i = 0; i < count * 3; i += 3) {
                const theta = Math.random() * Math.PI * 2;
                const radiusFactor = Math.pow(Math.random(), 0.4);
                const radius = tunnelMinRadius + radiusFactor * (tunnelMaxRadius - tunnelMinRadius);
                const z = -Math.random() * tunnelLength;
                positions[i] = radius * Math.cos(theta);
                positions[i + 1] = radius * Math.sin(theta);
                positions[i + 2] = z;
            }
        };

        createStarPositions(smallStarsPositions, smallStarsCount);
        createStarPositions(mediumStarsPositions, mediumStarsCount);
        createStarPositions(largeStarsPositions, largeStarsCount);

        smallStarsGeometry.setAttribute("position", new THREE.BufferAttribute(smallStarsPositions, 3));
        mediumStarsGeometry.setAttribute("position", new THREE.BufferAttribute(mediumStarsPositions, 3));
        largeStarsGeometry.setAttribute("position", new THREE.BufferAttribute(largeStarsPositions, 3));

        // Create sharper, more point-like star texture
        const starTextureCanvas = document.createElement("canvas");
        starTextureCanvas.width = 16; // Very small canvas for sharp point-like stars
        starTextureCanvas.height = 16;
        const starTextureContext = starTextureCanvas.getContext("2d");

        // Draw sharp star - small bright center with quick fade
        const gradient = starTextureContext.createRadialGradient(8, 8, 0, 8, 8, 6);
        gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
        gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.95)");
        gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.4)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        starTextureContext.fillStyle = gradient;
        starTextureContext.fillRect(0, 0, 16, 16);

        const starTexture = new THREE.CanvasTexture(starTextureCanvas);

        // Small stars material
        const smallStarsMaterial = new THREE.PointsMaterial({
            map: starTexture,
            color: 0xffaaaa,
            size: 1.8, // Very small for realistic stars
            sizeAttenuation: true,
            transparent: true,
            alphaTest: 0.1,
            opacity: 1.0
        });

        // Medium stars material
        const mediumStarsMaterial = new THREE.PointsMaterial({
            map: starTexture,
            color: 0xffffff,
            size: 3, // Medium size
            sizeAttenuation: true,
            transparent: true,
            alphaTest: 0.1,
            opacity: 1.0
        });

        // Large/bright stars material
        const largeStarsMaterial = new THREE.PointsMaterial({
            map: starTexture,
            color: 0xaaaaaa,
            size: 5.0, // Larger bright stars
            sizeAttenuation: true,
            transparent: true,
            alphaTest: 0.1,
            opacity: 1.0
        });

        const smallStars = new THREE.Points(smallStarsGeometry, smallStarsMaterial);
        const mediumStars = new THREE.Points(mediumStarsGeometry, mediumStarsMaterial);
        const largeStars = new THREE.Points(largeStarsGeometry, largeStarsMaterial);

        starsGroup.add(smallStars);
        starsGroup.add(mediumStars);
        starsGroup.add(largeStars);

        this.stars = starsGroup;
        this.scene.add(this.stars);

        // Store stars reference for animation
        this.scene.userData.stars = this.stars;

        // Add aurora borealis tunnel effect (polar light)
        this.createAuroraTunnel();
    }

    createAuroraTunnel() {
        // Create multiple wavy aurora layers for organic tunnel effect
        const layerCount = 20;
        this.auroraLayers = [];

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
                    
                        // Create aurora colors - less purple, more blue tones
                        vec3 color1 = vec3(0.2, 0.3, 0.5); // Blue
                        vec3 color2 = vec3(0.25, 0.35, 0.6); // Blue-purple
                        vec3 color3 = vec3(0.3, 0.4, 0.65); // Light blue-purple
                    
                    // Create organic, flowing color patterns
                    float colorWave1 = sin(pos.x * 0.1 + time * 0.4 + index * 0.3) * 0.5 + 0.5;
                    float colorWave2 = cos(pos.y * 0.15 + time * 0.3 + index * 0.2) * 0.5 + 0.5;
                    float colorWave3 = sin(pos.x * 0.08 + pos.y * 0.12 + time * 0.5) * 0.5 + 0.5;
                    
                        // Mix colors organically - more emphasis on purple
                    vec3 baseColor = mix(color1, color2, colorWave1);
                        baseColor = mix(baseColor, color3, colorWave2 * 0.7);
                        baseColor = mix(baseColor, color2, colorWave3 * 0.4);
                    
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
                    float alpha = pattern * (1.0 - smoothstep(0.3, 1.0, dist)) * 0.1; // Reduced intensity
                    
                    // Add vertical streaks like real aurora (softer)
                    float streaks = sin(pos.y * 0.3 + time * 0.4) * 0.5 + 0.5;
                    alpha *= (0.5 + streaks * 0.15); // Further reduced intensity
                    
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
            this.scene.add(layer);
            this.auroraLayers.push(layer);
        }

        // Store layers for animation
        this.scene.userData.auroraRings = this.auroraLayers;
    }

    animate(delta, time) {
        // Animate stars moving forward (infinite forward movement)
        if (this.stars && droneRoot) {
            const starSpeed = 220; // Speed at which stars approach (units per second)
            const droneZ = 0; // Drone stays at fixed Z position
            const resetDistance = 2000; // Distance behind drone to reset stars
            const resetStartZ = droneZ + 30; // Start resetting stars before they pass drone
            const resetEndZ = droneZ - resetDistance; // End of reset range

            // Helper function to animate a star group
            const animateStarGroup = starPoints => {
                const positions = starPoints.geometry.attributes.position;

                for (let i = 0; i < positions.count; i++) {
                    const currentZ = positions.getZ(i);

                    // Move star forward (towards drone)
                    const newZ = currentZ + starSpeed * delta;

                    // Reset star if it passed the drone OR if it's too far behind
                    if (newZ > resetStartZ || currentZ < resetEndZ) {
                        // Reset star to tunnel position BEHIND drone (cylindrical distribution)
                        const theta = Math.random() * Math.PI * 2;
                        const radiusFactor = Math.pow(Math.random(), 0.4);
                        const tunnelMinRadius = 8;
                        const tunnelMaxRadius = 280;
                        const radius = tunnelMinRadius + radiusFactor * (tunnelMaxRadius - tunnelMinRadius);

                        const x = radius * Math.cos(theta);
                        const y = radius * Math.sin(theta);

                        const resetRange = resetDistance * 0.8;
                        const baseZ = droneZ - resetDistance;
                        const zOffset = ((i % 100) / 100) * resetRange;
                        const randomOffset = (Math.random() - 0.5) * resetRange * 0.2;

                        positions.setX(i, x);
                        positions.setY(i, y);
                        positions.setZ(i, baseZ + zOffset + randomOffset);
                    } else {
                        positions.setZ(i, newZ);
                    }
                }

                positions.needsUpdate = true;
            };

            // Animate all star groups (small, medium, large)
            this.stars.children.forEach(animateStarGroup);

            // Keep stars centered around drone's X and Y position (drone stays at origin)
            this.stars.position.x = 0; // Drone stays at X=0
            this.stars.position.y = droneRoot.position.y; // Follow drone's Y position
        }

        // Animate aurora layers
        if (this.auroraLayers && droneRoot) {
            const droneZ = 0; // Drone stays at fixed Z position
            this.auroraLayers.forEach((layer, index) => {
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
    }

    enable() {
        // Scene is always visible, no need to enable/disable
    }

    disable() {
        // Scene is always visible, no need to enable/disable
    }
}

// SkyScene class - Sky scene with 3D clouds
class SkyScene {
    constructor() {
        this.scene = new THREE.Scene();
        // Create gradient background - lighter at top, darker at bottom
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext("2d");

        // Create vertical gradient - fresh light sky blue at top, darker blue at bottom
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "#6BB6FF"); // Slightly darker sky blue at top
        gradient.addColorStop(1, "#002366"); // Darker blue at bottom (lighter than before)

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Use canvas as texture for background
        const texture = new THREE.CanvasTexture(canvas);
        this.scene.background = texture;

        // Lighting - same as SpaceScene for consistent drone appearance
        this.scene.add(new THREE.AmbientLight(0xffffff, 1.2));

        const skyDirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        skyDirLight.position.set(5, 10, 5);
        this.scene.add(skyDirLight);

        const skyPointLight = new THREE.PointLight(0xffffff, 1.0, 100);
        skyPointLight.position.set(0, 0, 10);
        this.scene.add(skyPointLight);

        // Create group for clouds that will follow drone's Y position
        this.cloudGroup = new THREE.Group();
        this.scene.add(this.cloudGroup);
        this.scene.userData.cloudGroup = this.cloudGroup;

        // Store cloud textures
        this.cloudTextures = [];
        this.clouds = [];

        // Store textures in scene.userData for WaterScene to access
        this.scene.userData.cloudTextures = [];

        // Load cloud textures
        const textureLoader = new THREE.TextureLoader();

        // Load cloud1.png and cloud2.png
        textureLoader.load(
            `${import.meta.env.BASE_URL}cloud1.png`,
            texture => {
                texture.flipY = false;
                this.cloudTextures[0] = texture;
                this.scene.userData.cloudTextures[0] = texture;
                this.createClouds();
            },
            undefined,
            error => {
                console.warn("cloud1.png not found:", error);
            }
        );

        textureLoader.load(
            `${import.meta.env.BASE_URL}cloud2.png`,
            texture => {
                texture.flipY = false;
                this.cloudTextures[1] = texture;
                this.scene.userData.cloudTextures[1] = texture;
                this.createClouds();
            },
            undefined,
            error => {
                console.warn("cloud2.png not found:", error);
            }
        );
    }

    createClouds() {
        // Only create clouds if both textures are loaded
        if (this.cloudTextures.length < 2 || this.clouds.length > 0) return;

        const rnd = (min, max) => min + Math.random() * (max - min);
        // Reduce cloud count on mobile devices for better performance
        const isMobile = window.innerWidth <= 768;
        const CLOUD_COUNT = isMobile ? 100 : 300; // Fewer clouds on mobile

        for (let i = 0; i < CLOUD_COUNT; i++) {
            // Randomly choose cloud texture (0 or 1)
            const textureIndex = Math.floor(Math.random() * 2);
            const texture = this.cloudTextures[textureIndex];

            if (!texture) continue;

            // Create cloud using Sprite (like addRealisticCloud function)
            const material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                opacity: rnd(0.4, 0.6),
                depthWrite: false
            });

            const sprite = new THREE.Sprite(material);
            // Scale clouds percentage-wise: 80% to 150% of texture size
            // Get texture dimensions (use default if not loaded yet)
            const textureWidth = texture.image ? texture.image.width : 100;
            const textureHeight = texture.image ? texture.image.height : 80;
            const baseScaleX = textureWidth;
            const baseScaleY = textureHeight;
            const scalePercent = rnd(0.3, 0.5); // 80% to 150%
            const scaleX = baseScaleX * scalePercent;
            const scaleY = baseScaleY * scalePercent;
            sprite.scale.set(scaleX, scaleY, 1);

            // Get viewport width for X spread
            const viewportWidth = window.innerWidth;
            const xSpread = viewportWidth * 0.5; // Use half viewport width for each side

            // Set initial position - from Z drone + 50 (in front) to Z drone - 1500 (behind)
            // droneZ = 0, so range is from +50 to -1500
            const x = rnd(-xSpread, xSpread);
            const y = rnd(-70, -60); // Y: random position in range -70 to -90
            const z = rnd(-1500, 50); // Z: from -1500 to +50

            sprite.position.set(x, y, z);

            this.clouds.push(sprite);
            this.cloudGroup.add(sprite);
        }

        console.log(`✅ Created ${this.clouds.length} sprite clouds with cloud1.png and cloud2.png`);
    }

    animate(delta, time) {
        if (!droneRoot || this.clouds.length === 0) return;

        const rnd = (min, max) => min + Math.random() * (max - min);
        const cloudSpeed = 80; // Speed at which clouds approach (units per second)

        // Move clouds forward (towards drone) continuously, just like stars
        this.clouds.forEach((cloud, i) => {
            const currentZ = cloud.position.z;

            // Move cloud forward (towards drone)
            const newZ = currentZ + cloudSpeed * delta;

            // Distance-based opacity - clouds fade in as they approach
            // Far clouds (Z < -1000) are very transparent, closer clouds are more visible
            const fadeStartDistance = -1000; // Start fading in from this distance
            const fadeEndDistance = -200; // Fully visible at this distance
            let opacity = 1.0;

            if (newZ < fadeStartDistance) {
                // Very far - almost invisible
                opacity = 0.1;
            } else if (newZ < fadeEndDistance) {
                // Fade in as cloud approaches
                const fadeRange = fadeEndDistance - fadeStartDistance;
                const distanceFromStart = newZ - fadeStartDistance;
                opacity = 0.1 + (distanceFromStart / fadeRange) * 0.9; // Fade from 0.1 to 1.0
            } else {
                // Close - fully visible
                opacity = 1.0;
            }

            // Update cloud opacity
            if (cloud.material) {
                cloud.material.opacity = opacity;
            }

            // Hide cloud if it's behind camera and not visible (passed drone significantly)
            const hideDistance = 50; // Hide clouds that are far behind drone
            if (newZ > hideDistance) {
                cloud.visible = false;
            } else {
                cloud.visible = true;
            }

            // Reset cloud only when it passes droneZ + 50 (in front of drone)
            const respawnThreshold = 50; // Respawn when cloud passes this point
            if (newZ > respawnThreshold) {
                // Get viewport width for X spread
                const viewportWidth = window.innerWidth;
                const xSpread = viewportWidth * 0.5; // Use half viewport width for each side

                // X: spread horizontally across full width based on viewport resolution
                const x = rnd(-xSpread, xSpread);

                // Y: random position in range -70 to -90
                const y = rnd(-90, -70);

                // Respawn cloud in area droneZ - 1500 to droneZ - 1400 (droneZ = 0, so -1500 to -1400)
                const z = rnd(-1500, -1400);

                cloud.position.set(x, y, z);
                cloud.visible = true; // Make sure cloud is visible when reset
                // Set initial opacity for respawned cloud (very transparent)
                if (cloud.material) {
                    cloud.material.opacity = 0.1;
                }
            } else {
                cloud.position.z = newZ;
            }
        });

        // Keep cloud group centered around drone's X and Y position (drone stays at origin)
        this.cloudGroup.position.x = 0; // Drone stays at X=0
        this.cloudGroup.position.y = droneRoot.position.y; // Follow drone's Y position
    }

    enable() {
        // Scene is always visible, no need to enable/disable
    }

    disable() {
        // Scene is always visible, no need to enable/disable
    }
}

// WaterScene class - Water surface scene with gentle clouds above
class WaterScene {
    constructor(skyScene) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
        this.skyScene = skyScene; // Reference to sky scene for cloud textures

        // Lighting - same as SpaceScene for consistent drone appearance
        this.scene.add(new THREE.AmbientLight(0xffffff, 1.2));

        const waterDirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        waterDirLight.position.set(5, 10, 5);
        this.scene.add(waterDirLight);

        const waterPointLight = new THREE.PointLight(0xffffff, 1.0, 100);
        waterPointLight.position.set(0, 0, 10);
        this.scene.add(waterPointLight);

        // Ocean (Water) - exactly as in the example
        const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

        const textureLoader = new THREE.TextureLoader();
        const waterNormals = textureLoader.load("https://threejs.org/examples/textures/waternormals.jpg", texture => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        });

        this.water = new Water(waterGeometry, {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: waterNormals,
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 3.7,
            fog: false
        });

        this.water.rotation.x = -Math.PI / 2;
        this.water.position.set(0, -5 + VERTICAL_OFFSET, 0); // Water surface position
        this.scene.add(this.water);

        // Create clouds above drone - same system as SkyScene but above drone
        this.cloudGroup = new THREE.Group();
        this.scene.add(this.cloudGroup);
        this.scene.userData.cloudGroup = this.cloudGroup;

        // Store cloud textures
        this.cloudTextures = [];
        this.clouds = [];

        // Store textures in scene.userData for compatibility
        this.scene.userData.cloudTextures = [];

        // Load cloud textures from skyScene
        this.loadCloudTextures();
    }

    loadCloudTextures() {
        const availableTextures = this.skyScene?.scene.userData.cloudTextures || [];
        if (availableTextures.length === 0) {
            // Wait for textures to load
            const checkTextures = setInterval(() => {
                const textures = this.skyScene?.scene.userData.cloudTextures || [];
                if (textures.length > 0) {
                    this.cloudTextures = textures;
                    this.scene.userData.cloudTextures = textures;
                    this.createClouds();
                    clearInterval(checkTextures);
                }
            }, 100);
            return;
        }

        this.cloudTextures = availableTextures;
        this.scene.userData.cloudTextures = availableTextures;
        this.createClouds();
    }

    createClouds() {
        // Only create clouds if textures are loaded
        if (this.cloudTextures.length === 0 || this.clouds.length > 0) return;

        const rnd = (min, max) => min + Math.random() * (max - min);
        // Reduce cloud count on mobile devices for better performance
        const isMobile = window.innerWidth <= 768;
        const CLOUD_COUNT = isMobile ? 100 : 300; // Fewer clouds on mobile

        for (let i = 0; i < CLOUD_COUNT; i++) {
            // Randomly choose cloud texture
            const textureIndex = Math.floor(Math.random() * this.cloudTextures.length);
            const texture = this.cloudTextures[textureIndex];

            if (!texture) continue;

            // Create cloud using Sprite (same as SkyScene)
            const material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                opacity: rnd(0.4, 0.8),
                depthWrite: false
            });

            const sprite = new THREE.Sprite(material);
            // Scale clouds percentage-wise: 80% to 150% of texture size
            const textureWidth = texture.image ? texture.image.width : 100;
            const textureHeight = texture.image ? texture.image.height : 80;
            const baseScaleX = textureWidth;
            const baseScaleY = textureHeight;
            const scalePercent = rnd(0.3, 0.5); // 80% to 150%
            const scaleX = baseScaleX * scalePercent;
            const scaleY = baseScaleY * scalePercent;
            sprite.scale.set(scaleX, scaleY, 1);

            // Get viewport width for X spread
            const viewportWidth = window.innerWidth;
            const xSpread = viewportWidth * 0.5;

            // Set initial position - from Z drone + 50 (in front) to Z drone - 1500 (behind)
            // Y: above drone (positive values) - range 70 to 90
            const x = rnd(-xSpread, xSpread);
            const y = rnd(40, 60); // Above drone (positive Y)
            const z = rnd(-4500, 50); // Z: from -1500 to +50

            sprite.position.set(x, y, z);

            this.clouds.push(sprite);
            this.cloudGroup.add(sprite);
        }

        console.log(`✅ Created ${this.clouds.length} sprite clouds above drone (WaterScene)`);
    }

    animate(delta, time) {
        // Animate clouds - same system as SkyScene but above drone
        if (!droneRoot || this.clouds.length === 0) return;

        const rnd = (min, max) => min + Math.random() * (max - min);
        const cloudSpeed = 80; // Speed at which clouds approach (units per second)

        // Move clouds forward (towards drone) continuously, just like SkyScene
        this.clouds.forEach((cloud, i) => {
            const currentZ = cloud.position.z;

            // Move cloud forward (towards drone)
            const newZ = currentZ + cloudSpeed * delta;

            // Distance-based opacity - clouds fade in as they approach
            // Far clouds (Z < -1000) are very transparent, closer clouds are more visible
            const fadeStartDistance = -1000; // Start fading in from this distance
            const fadeEndDistance = -200; // Fully visible at this distance
            let opacity = 1.0;

            if (newZ < fadeStartDistance) {
                // Very far - almost invisible
                opacity = 0.1;
            } else if (newZ < fadeEndDistance) {
                // Fade in as cloud approaches
                const fadeRange = fadeEndDistance - fadeStartDistance;
                const distanceFromStart = newZ - fadeStartDistance;
                opacity = 0.1 + (distanceFromStart / fadeRange) * 0.9; // Fade from 0.1 to 1.0
            } else {
                // Close - fully visible
                opacity = 1.0;
            }

            // Update cloud opacity
            if (cloud.material) {
                cloud.material.opacity = opacity;
            }

            // Hide cloud if it's behind camera and not visible (passed drone significantly)
            const hideDistance = 50; // Hide clouds that are far behind drone
            if (newZ > hideDistance) {
                cloud.visible = false;
            } else {
                cloud.visible = true;
            }

            // Reset cloud only when it passes droneZ + 50 (in front of drone)
            const respawnThreshold = 50; // Respawn when cloud passes this point
            if (newZ > respawnThreshold) {
                // Get viewport width for X spread
                const viewportWidth = window.innerWidth;
                const xSpread = viewportWidth * 0.5;

                // X: spread horizontally across full width based on viewport resolution
                const x = rnd(-xSpread, xSpread);

                // Y: above drone (positive values) - range 70 to 90
                const y = rnd(70, 90);

                // Respawn cloud in area droneZ - 1500 to droneZ - 1400 (droneZ = 0, so -1500 to -1400)
                const z = rnd(-1500, -1400);

                cloud.position.set(x, y, z);
                cloud.visible = true; // Make sure cloud is visible when reset
                // Set initial opacity for respawned cloud (very transparent)
                if (cloud.material) {
                    cloud.material.opacity = 0.1;
                }
            } else {
                cloud.position.z = newZ;
            }
        });

        // Keep cloud group centered around drone's X and Y position (drone stays at origin)
        this.cloudGroup.position.x = 0; // Drone stays at X=0
        this.cloudGroup.position.y = droneRoot.position.y; // Follow drone's Y position

        // Update water animation - exactly as in the example
        if (this.water && this.water.material && this.water.material.uniforms) {
            const t = time; // Use time directly (should be in seconds)
            this.water.material.uniforms["time"].value = t;
        }
    }

    enable() {
        // Scene is always visible, no need to enable/disable
    }

    disable() {
        // Scene is always visible, no need to enable/disable
    }
}

// Create three scenes
function createScenes() {
    scenes = [];

    // Scene 1: Space scene
    const spaceScene = new SpaceScene();
    scenes.push(spaceScene.scene);

    // Scene 2: Sky scene with clouds
    const skyScene = new SkyScene();
    scenes.push(skyScene.scene);

    // Scene 3: Water surface scene with gentle clouds above
    const waterScene = new WaterScene(skyScene);
    scenes.push(waterScene.scene);

    // Store scene objects for animation
    scenes[0].userData.sceneObject = spaceScene;
    scenes[1].userData.sceneObject = skyScene;
    scenes[2].userData.sceneObject = waterScene;
}

// createAuroraTunnel function removed - now part of SpaceScene class

// Load drone GLB model
function loadDroneModel() {
    console.log("Loading drone model...");
    const loader = new GLTFLoader();

    // In Vite, files in public/ are served from root
    const MODEL_URL = `${import.meta.env.BASE_URL}Drone.glb`;
    console.log("Attempting to load model from:", MODEL_URL);

    loader.load(
        MODEL_URL,
        gltf => {
            console.log("✅ Model loaded successfully!", gltf);
            droneRoot = gltf.scene;
            console.log("✅ droneRoot set:", { droneRoot: !!droneRoot });

            // Center and scale
            fitAndCenter(droneRoot);

            // Position drone at start position (high up, off-screen left)
            droneRoot.position.y = droneStartY;
            droneRoot.position.x = entranceStartX; // Start from left (off-screen)
            droneRoot.position.z = dronePositionZ;
            // Hide drone initially - will be shown when entrance animation starts
            droneRoot.visible = false;

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
            console.group("📋 GLB node/mesh list");
            let meshCount = 0;
            let nodeCount = 0;
            const meshPositions = []; // Store mesh positions for size-based coloring

            // First pass: collect all meshes and their positions
            droneRoot.traverse(o => {
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
                        name: o.name || ""
                    });
                }
            });

            // Second pass: apply colors based on position, size, and name
            meshPositions.forEach((meshData, index) => {
                const o = meshData.mesh;
                const name = (meshData.name || "").toLowerCase();
                const size = meshData.size;
                const center = meshData.center;
                const maxSize = Math.max(size.x, size.y, size.z);
                const isSmall = maxSize < 0.5; // Small parts
                const isMedium = maxSize >= 0.5 && maxSize < 1.5; // Medium parts
                const isLarge = maxSize >= 1.5; // Large parts

                console.log(`MESH [${index + 1}]:`, name || "(no-name)", {
                    name: name,
                    size: maxSize.toFixed(2),
                    position: `(${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})`
                });

                // Apply colors to ALL meshes - Vibrant colorful theme
                if (o.material) {
                    const materials = Array.isArray(o.material) ? o.material : [o.material];

                    materials.forEach((mat, idx) => {
                        // Detect different parts of the drone by exact name matching first
                        const isBody = name === "body";
                        const isRotor = /rotor/i.test(name);
                        const isCube002 = name === "cube002";

                        let colorToApply;
                        let emissiveColor;
                        let emissiveIntensity;

                        if (isBody) {
                            // Body - if multiple materials, use different colors for each
                            // First material gets primary body color, second gets secondary
                            if (materials.length > 1 && idx === 1) {
                                // Second material of body gets secondary color
                                colorToApply = droneColors.bodySecondary;
                                emissiveColor = droneColors.bodySecondary;
                                console.log(`Applied body secondary color to ${name} (material ${idx + 1}):`, colorToApply.toString(16));
                            } else {
                                // First material or single material gets primary body color
                                colorToApply = droneColors.body;
                                emissiveColor = droneColors.body;
                                console.log(`Applied body primary color to ${name} (material ${idx + 1}):`, colorToApply.toString(16));
                            }
                            emissiveIntensity = 1.5;
                        } else if (isRotor) {
                            // Rotors - vibrant orange
                            colorToApply = droneColors.rotors;
                            emissiveColor = droneColors.rotors;
                            emissiveIntensity = 2.0;
                            console.log(`Applied rotor color to ${name}:`, colorToApply.toString(16));
                        } else if (isCube002) {
                            // Cube002 - white detail
                            colorToApply = droneColors.details;
                            emissiveColor = droneColors.details;
                            emissiveIntensity = 0.8;
                            console.log(`Applied detail color to ${name}:`, colorToApply.toString(16));
                        } else {
                            // Default - use body color for unknown parts
                            colorToApply = droneColors.body;
                            emissiveColor = droneColors.body;
                            emissiveIntensity = 1.5;
                            console.log(
                                `Applied default body color to ${name || "unnamed"}:`,
                                colorToApply.toString(16)
                            );
                        }

                        // Actually apply the colors to the material
                        if (mat) {
                            if (enableDroneColors) {
                                // Create a new MeshStandardMaterial with our colors
                                const newMaterial = new THREE.MeshStandardMaterial({
                                    color: colorToApply,
                                    emissive: isRotor ? emissiveColor : 0x000000,
                                    emissiveIntensity: isRotor ? 0.5 : 0,
                                    roughness: 0.6,
                                    metalness: 0.2
                                });
                                
                                // Replace the material
                                if (Array.isArray(o.material)) {
                                    o.material[idx] = newMaterial;
                                } else {
                                    o.material = newMaterial;
                                }
                                
                                console.log(`✅ Created new material for ${name}: color=${colorToApply.toString(16)}`);
                            } else {
                                // When colors are disabled, adjust brightness of existing materials
                                if (mat.color) {
                                    // Get current color
                                    const currentColor = mat.color.clone();
                                    
                                    // Adjust brightness by multiplying RGB values
                                    // Brightness > 1.0 makes it brighter, < 1.0 makes it darker
                                    // Allow values above 1.0 for very bright materials
                                    currentColor.r = Math.min(10.0, currentColor.r * droneBrightness);
                                    currentColor.g = Math.min(10.0, currentColor.g * droneBrightness);
                                    currentColor.b = Math.min(10.0, currentColor.b * droneBrightness);
                                    
                                    mat.color.copy(currentColor);
                                    
                                    // For very bright values (> 1.0), also use emissive to enhance brightness
                                    if (droneBrightness > 1.0) {
                                        // Add emissive glow based on brightness
                                        const emissiveBoost = Math.min(1.0, (droneBrightness - 1.0) * 0.5);
                                        if (mat.emissive) {
                                            const emissiveColor = currentColor.clone();
                                            emissiveColor.multiplyScalar(emissiveBoost);
                                            mat.emissive.copy(emissiveColor);
                                            mat.emissiveIntensity = emissiveBoost;
                                        } else {
                                            mat.emissive = currentColor.clone().multiplyScalar(emissiveBoost);
                                            mat.emissiveIntensity = emissiveBoost;
                                        }
                                    }
                                    
                                    mat.needsUpdate = true;
                                } else if (droneBrightness > 1.0) {
                                    // If no color, create emissive for brightness
                                    const brightColor = new THREE.Color(0xffffff);
                                    const emissiveBoost = Math.min(1.0, (droneBrightness - 1.0) * 0.3);
                                    mat.emissive = brightColor;
                                    mat.emissiveIntensity = emissiveBoost;
                                    mat.needsUpdate = true;
                                }
                            }
                        }
                    });
                }
            });

            // Log node information
            droneRoot.traverse(o => {
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
            droneRoot.traverse(o => {
                // Look for meshes with rotor names
                if (o.isMesh && rotorNameRegex.test(o.name || "")) {
                    // Try to use parent if it exists and has the same name pattern, otherwise use mesh itself
                    const rotorObj =
                        o.parent && o.parent !== droneRoot && rotorNameRegex.test(o.parent.name || "") ? o.parent : o;
                    rotors.push(rotorObj);
                    console.log(
                        "Found rotor:",
                        rotorObj.name,
                        "Type:",
                        rotorObj.type,
                        "Parent:",
                        rotorObj.parent?.name
                    );
                }
            });

            // If auto-detection found nothing, set manually based on console names:
            if (rotors.length === 0) {
                console.warn("⚠️ Nenašiel som vrtule podľa názvu. Dopln ich ručne podľa názvov z konzoly.");

                // Try to get rotors by exact name (try both mesh and parent)
                const rotorNames = ["Rotor_FL", "Rotor_FR", "Rotor_BL", "Rotor_BR"];
                rotorNames.forEach(name => {
                    const obj = droneRoot.getObjectByName(name);
                    if (obj) {
                        rotors.push(obj);
                    }
                });
            }

            if (rotors.length > 0) {
                console.log(
                    "✅ Rotors found:",
                    rotors.map(r => r.name || "(no-name)")
                );

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
        xhr => {
            // Progress
            if (xhr.lengthComputable) {
                const percentComplete = (xhr.loaded / xhr.total) * 100;
                console.log(`📥 Loading: ${percentComplete.toFixed(1)}%`);
            }
        },
        err => {
            console.error("❌ Failed to load GLB:", err);
            console.error("Error details:", {
                message: err.message,
                url: MODEL_URL,
                stack: err.stack
            });
            console.error("Make sure Drone.glb is in the public/ directory");
        }
    );
}

// Find objects by name contains
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
    const textElements = document.querySelectorAll(".scroll-text");
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
        const isCTA = textEl.classList.contains("scroll-text-cta");

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
                translateY = 1150;
            }
        }
        // First text - visible at start, much higher up, scrolls up
        else if (index === 0) {
            if (scrollProgress <= textEnd) {
                // First text is visible from start and scrolls up
                if (scrollProgress <= textFadeOutStart) {
                    // Stay fully visible and move up slowly
                    opacity = 1;
                    // Start lower (-180px), move up gradually
                    const localProgress = scrollProgress / textFadeOutStart;
                    translateY = -240 - localProgress * 100; // From -180px to -280px (moving up)
                } else {
                    // Fade out and continue moving up
                    const localProgress = (scrollProgress - textFadeOutStart) / (textEnd - textFadeOutStart);
                    opacity = 1 - localProgress;
                    translateY = -300 - localProgress * 50; // Continue moving up
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
                    translateY = 50 - localProgress * 350; // Move from 50px to -300px
                } else {
                    // Fade out while moving up
                    const localProgress = (scrollProgress - textFadeOutStart) / (textEnd - textFadeOutStart);
                    opacity = 1 - localProgress;
                    translateY = -300 - localProgress * 50; // Continue moving up
                }
            } else if (scrollProgress < textStart) {
                // Text hasn't appeared yet - below screen
                opacity = 0;
                translateY = 1150;
            } else {
                // Text has passed - above screen (same height as first text)
                opacity = 0;
                translateY = -300;
            }
        }

        textEl.style.opacity = opacity;
        textEl.style.transform = `translateY(${translateY}px)`;

        if (opacity > 0.1) {
            textEl.classList.add("visible");
        } else {
            textEl.classList.remove("visible");
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
        // Store previous scene index before changing
        const prevSceneIndex = currentSceneIndex;

        // Detect scroll direction
        const scrollingDown = scrollY > prevScrollY;

        // Remove drone from old scene
        if (droneRoot && scenes[currentSceneIndex]) {
            scenes[currentSceneIndex].remove(droneRoot);
        }

        currentSceneIndex = newSceneIndex;
        scene = scenes[currentSceneIndex];

        // Update navbar color based on scene
        updateNavbarColor(currentSceneIndex);

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
            let newDroneY;

            if (currentSceneIndex === 1) {
                // Sky scene - smooth transition from space scene
                // If coming from space scene (index 0), keep current Y and let it fly down to clouds
                if (prevSceneIndex === 0) {
                    // Keep current position, will smoothly fly down to clouds
                    newDroneY = droneRoot.position.y; // Keep current height from space
                } else {
                    // Coming from other scenes - start higher
                    newDroneY = 63 + VERTICAL_OFFSET; // Sky scene start height
                }
            } else if (currentSceneIndex === 2) {
                // Water scene - start at medium height (between water and clouds)
                newDroneY = 20 + VERTICAL_OFFSET; // Water scene start height
            } else {
                // Other scenes - start at top
                newDroneY = droneStartY;
            }
            droneRoot.position.y = newDroneY;

            // Set droneTargetY immediately to prevent camera jump
            if (currentSceneIndex === 1) {
                // Sky scene - if coming from space, target is clouds, otherwise calculate based on scrollProgress
                if (prevSceneIndex === 0) {
                    // Smooth transition: target is clouds height
                    droneTargetY = 63 + VERTICAL_OFFSET; // Sky scene target height
                } else {
                    // Calculate based on current scrollProgress
                    droneTargetY = 63 + VERTICAL_OFFSET - scrollProgress * 5; // Sky scene target height
                }
            } else if (currentSceneIndex === 2) {
                // Water scene - calculate based on current scrollProgress
                const minY = 0 + VERTICAL_OFFSET; // Minimum height above water
                const maxY = 20 + VERTICAL_OFFSET; // Starting height
                droneTargetY = maxY - scrollProgress * (maxY - minY);
                droneTargetY = Math.max(droneTargetY, minY);
            } else {
                droneTargetY = droneStartY - scrollProgress * (droneStartY - droneEndY);
            }

            // Immediately update camera to match new drone position (prevent top-down view)
            const cameraOffsetY = 5; // Fixed vertical offset
            const cameraOffsetZ = 15; // Horizontal distance
            const cameraOffsetX = 1.5; // Slight side angle
            camera.position.y = newDroneY + cameraOffsetY;
            camera.position.z = cameraOffsetZ;
            camera.position.x = cameraOffsetX;
            const lookAtY = newDroneY - 1;
            //camera.lookAt(0, lookAtY, 0);
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
        // In sky scene, drone flies just above clouds
        droneTargetY = 63 + VERTICAL_OFFSET - scrollProgress * 5; // Fly at sky height, just above clouds
    } else if (currentSceneIndex === 2) {
        // In water scene (scene 3), drone should stay above water surface
        // Drone starts at maxY and can descend but not below minY (above water)
        const minY = 0 + VERTICAL_OFFSET; // Minimum height above water
        const maxY = 20 + VERTICAL_OFFSET; // Starting height
        droneTargetY = maxY - scrollProgress * (maxY - minY);
        droneTargetY = Math.max(droneTargetY, minY); // Ensure drone doesn't go below water
    } else {
        droneTargetY = droneStartY - scrollProgress * (droneStartY - droneEndY);
    }

    // Smoothly move drone (Y movement and entrance animation)
    if (droneRoot && droneRoot.visible) {
        // Handle entrance animation (flying in from left)
        if (entranceAnimationActive) {
            const elapsed = clock.getElapsedTime() - entranceAnimationStartTime;
            const progress = Math.min(elapsed / entranceAnimationDuration, 1.0);

            // Ease-out animation (smooth deceleration)
            const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out

            // Interpolate X position from left to center
            droneRoot.position.x = entranceStartX + (entranceEndX - entranceStartX) * easeProgress;

            // If animation is complete, stop it
            if (progress >= 1.0) {
                entranceAnimationActive = false;
                droneRoot.position.x = entranceEndX; // Ensure exact final position
                console.log("✅ Drone entrance animation complete");
            }
        } else {
            // After entrance animation, keep drone at center
            droneRoot.position.x = entranceEndX;
        }

        // Y movement (vertical flight) - faster on water scene
        const movementSpeed = currentSceneIndex === 2 ? 0.2 : 0.1; // Faster on water scene (index 2)
        droneRoot.position.y += (droneTargetY - droneRoot.position.y) * movementSpeed;
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
        const lookAtY = targetY - 0.3;

        // Look at center during entrance animation, then follow drone after animation completes
        if (entranceAnimationActive) {
            // During entrance animation, keep camera focused on center
            camera.lookAt(0, lookAtY, 0); // Always look at center during entrance
        } else {
            // After entrance animation, follow drone normally
            const droneX = droneRoot.position.x;
            camera.lookAt(droneX * 0.5, lookAtY, 0); // Look at drone's X position (centered when at 0)
        }

        // Animate current scene using scene object's animate method
        if (scene.userData.sceneObject) {
            const time = clock.getElapsedTime();
            scene.userData.sceneObject.animate(dt, time);
        }
    }

    renderer.render(scene, camera);
}

// Update navbar color based on current scene
function updateNavbarColor(sceneIndex) {
    const navbar = document.querySelector(".navbar");
    if (!navbar) return;

    // Remove all scene classes
    navbar.classList.remove("scene-0", "scene-1", "scene-2");

    // Add class for current scene
    navbar.classList.add(`scene-${sceneIndex}`);
}

// Window resize handler
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Scroll handlers
function onWheel(event) {
    // Block scrolling until Explore button is clicked
    if (!animationStarted) {
        return;
    }

    event.preventDefault();
    scrollY += event.deltaY * 0.5;
    scrollY = Math.max(0, Math.min(maxScroll, scrollY));
}

// Touch handlers for mobile
let touchStartY = 0;
let lastTouchY = 0;

function onTouchStart(event) {
    // Block scrolling until Explore button is clicked
    if (!animationStarted) {
        return;
    }
    touchStartY = event.touches[0].clientY;
    lastTouchY = touchStartY;
}

function onTouchMove(event) {
    // Block scrolling until Explore button is clicked
    if (!animationStarted) {
        return;
    }
    event.preventDefault();
    const currentY = event.touches[0].clientY;
    const deltaY = lastTouchY - currentY;
    scrollY += deltaY * 2;
    scrollY = Math.max(0, Math.min(maxScroll, scrollY));
    lastTouchY = currentY;
}

function onTouchEnd(event) {
    // Touch end handler
}

// Flag to prevent multiple initializations
let isInitialized = false;

// Start drone entrance animation (called from main.js when Explore button is clicked)
function startDroneEntrance() {
    if (!droneRoot) {
        console.warn("Drone not loaded yet");
        return;
    }

    animationStarted = true; // Enable scrolling after Explore button is clicked
    entranceAnimationActive = true;
    entranceAnimationStartTime = clock.getElapsedTime();
    droneRoot.visible = true;
    console.log("🚁 Starting drone entrance animation from left");
}

// Make function available globally (like other functions in this file)
window.startDroneEntrance = startDroneEntrance;

// Initialize when DOM is ready - start animation immediately (scene visible, drone off-screen)
document.addEventListener("DOMContentLoaded", () => {
    if (!isInitialized) {
        init(); // Start animation immediately, but drone will be off-screen until "Explore" is clicked
        isInitialized = true;
        // Set initial navbar color for scene 0 (Space scene)
        updateNavbarColor(0);
    }
});
