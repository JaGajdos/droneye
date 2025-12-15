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
    
    // Add stars - create in much larger space and make them follow camera (skybox-like)
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
    
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.0,
        sizeAttenuation: true
    });
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene1.add(stars);
    
    // Store stars reference for camera following
    scene1.userData.stars = stars;
    
    // Add aurora borealis tunnel effect (polar light)
    createAuroraTunnel(scene1);
    
    // Scene 2: City scene
    const scene2 = new THREE.Scene();
    scene2.background = new THREE.Color(0x2C3E50); // Dark blue-gray
    scene2.add(new THREE.HemisphereLight(0xffffff, 0x222222, 0.8));
    const light2 = new THREE.DirectionalLight(0xffffff, 0.9);
    light2.position.set(5, 10, 5);
    scene2.add(light2);
    
    // Add some buildings (dummy boxes)
    for (let i = 0; i < 8; i++) {
        const building = new THREE.Mesh(
            new THREE.BoxGeometry(2, 5 + Math.random() * 10, 2),
            new THREE.MeshStandardMaterial({ color: 0x34495e })
        );
        building.position.set(
            (Math.random() - 0.5) * 30,
            0,
            (Math.random() - 0.5) * 30
        );
        building.position.y = building.geometry.parameters.height / 2;
        scene2.add(building);
    }
    
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

// Create aurora borealis tunnel effect
function createAuroraTunnel(scene) {
    // Create multiple rings for tunnel effect
    const ringCount = 30;
    const rings = [];
    
    for (let i = 0; i < ringCount; i++) {
        const radius = 25 + i * 1.5; // Gradually increasing radius
        const ringGeometry = new THREE.RingGeometry(radius, radius + 2, 64);
        
        const ringMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                index: { value: i },
                total: { value: ringCount }
            },
            vertexShader: `
                varying vec2 vUv;
                uniform float index;
                
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float index;
                varying vec2 vUv;
                
                void main() {
                    vec2 uv = vUv;
                    
                    // Create aurora colors (green, blue, purple)
                    vec3 color1 = vec3(0.0, 0.9, 0.5); // Green
                    vec3 color2 = vec3(0.3, 0.7, 1.0); // Blue
                    vec3 color3 = vec3(0.6, 0.4, 0.9); // Purple
                    
                    // Mix colors based on position
                    float colorMix = sin(uv.x * 3.14159 + time * 0.5 + index * 0.3) * 0.5 + 0.5;
                    vec3 baseColor = mix(color1, color2, colorMix);
                    baseColor = mix(baseColor, color3, sin(uv.y * 3.14159 + time * 0.3) * 0.5 + 0.5);
                    
                    // Create wavy aurora pattern
                    float wave = sin(uv.x * 6.28318 + time * 0.8 + index * 0.2) * 0.5 + 0.5;
                    float wave2 = sin(uv.y * 3.14159 + time * 0.6) * 0.5 + 0.5;
                    
                    // Alpha based on distance from center and waves
                    float dist = distance(uv, vec2(0.5));
                    float alpha = (1.0 - dist * 1.5) * wave * wave2 * 0.4; // More visible (0.4 max)
                    
                    // Fade out at edges
                    alpha *= smoothstep(0.0, 0.2, dist) * smoothstep(1.0, 0.6, dist);
                    
                    gl_FragColor = vec4(baseColor, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        // Rings are already in XY plane (perpendicular to Z axis) - perfect for tunnel
        // No rotation needed - they should be perpendicular to flight direction (Z axis)
        ring.position.set(0, 0, -100 + i * 3); // Space rings along Z axis, centered at origin
        scene.add(ring);
        rings.push(ring);
    }
    
    // Store rings for animation
    scene.userData.auroraRings = rings;
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
        // Remove drone from old scene
        if (droneRoot && scenes[currentSceneIndex]) {
            scenes[currentSceneIndex].remove(droneRoot);
        }
        
        currentSceneIndex = newSceneIndex;
        scene = scenes[currentSceneIndex];
        
        // Add drone to new scene
        if (droneRoot) {
            scene.add(droneRoot);
        }
    }
    
    // Calculate drone Y position based on scroll progress
    droneTargetY = droneStartY - (scrollProgress * (droneStartY - droneEndY));
    
    // Automatic forward movement when not scrolling
    if (!isScrolling) {
        dronePositionZ -= autoMoveSpeed * dt * 30; // Move forward faster (negative Z = away from camera)
    }
    
    // Smoothly move drone
    if (droneRoot) {
        droneRoot.position.y += (droneTargetY - droneRoot.position.y) * 0.1;
        droneRoot.position.z = dronePositionZ;
        
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
        const cameraOffsetZ = 8; // Horizontal distance (side view) - closer to drone
        const cameraOffsetX = 1.5; // Slight side angle for better view
        
        // Smooth camera movement - follow drone forward
        camera.position.y += (targetY + cameraOffsetY - camera.position.y) * 0.05;
        camera.position.z = targetZ + cameraOffsetZ; // Follow drone's Z position
        camera.position.x = cameraOffsetX;
        
        // Look at drone with slight downward angle (not straight down)
        const lookAtY = targetY - 1; // Look slightly below drone center
        camera.lookAt(cameraOffsetX * 0.5, lookAtY, targetZ);
        
        // Make stars follow camera (skybox effect) - only in space scene
        if (currentSceneIndex === 0 && scene.userData.stars) {
            // Stars follow camera position to create infinite space effect
            scene.userData.stars.position.copy(camera.position);
        }
        
        // Animate aurora rings - only in space scene
        if (currentSceneIndex === 0 && scene.userData.auroraRings && droneRoot) {
            const time = clock.getElapsedTime();
            const droneZ = droneRoot.position.z;
            scene.userData.auroraRings.forEach((ring, index) => {
                if (ring.material.uniforms) {
                    ring.material.uniforms.time.value = time;
                }
                // Make aurora follow drone - create tunnel effect around drone
                // Rings are centered around drone's position (X, Y) and spaced along Z
                ring.position.x = droneRoot.position.x;
                ring.position.y = droneRoot.position.y;
                ring.position.z = droneZ - 100 + index * 3; // Space rings along flight path
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
document.addEventListener('DOMContentLoaded', init);

