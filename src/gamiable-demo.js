import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Constants
const NEAR = 0.1;
const FAR = 1000;
const FOG_NEAR = 100;
const FOG_FAR = 1000;
const FOG_COLOR = 0x8A9A9C; // 9091836 in decimal
const MOVE_SPEED = 50;
const CLOUD_COUNT = 500;
const CLOUD_SPEED = 100;
const starCount = 2000;

// Global variables
let renderer, scene, camera;
let isWebGL2 = false;
let scenes = [];
let visibleScene = null;
let nextScene = null;
let ship = null;
const clock = new THREE.Clock();
let currentClearColor = new THREE.Color(0);
const { randFloat: rnd, randFloatSpread: rndFS, clamp } = THREE.MathUtils;

// Asset definitions - extracted from Gamiable.html
const assets = [
    { name: "adventure.glb", offset: 0, size: 77236 },
    { name: "ship.png", offset: 77236, size: 130, width: 8, height: 8 },
    { name: "cloud.jpg", offset: 77366, size: 22637, wrap: THREE.RepeatWrapping, width: 512, height: 512 },
    { name: "ocean.jpg", offset: 100003, size: 101768, wrap: THREE.RepeatWrapping, width: 1024, height: 1024 },
    { name: "sky.jpg", offset: 201771, size: 369, width: 32, height: 32 },
    { name: "cloud.png", offset: 202140, size: 58580, wrap: THREE.ClampToEdgeWrapping, width: 256, height: 256 },
    { name: "nova.jpg", offset: 260720, size: 40589, wrap: THREE.RepeatWrapping, width: 1024, height: 1024 },
    { name: "star.png", offset: 301309, size: 2181, width: 64, height: 64 },
    { name: "ship.vs", offset: 303490, size: 578 },
    { name: "ship.fs", offset: 304068, size: 1681 },
    { name: "nitro.vs", offset: 305749, size: 1054 },
    { name: "nitro.fs", offset: 306803, size: 500 },
    { name: "ocean.vs", offset: 307303, size: 617 },
    { name: "ocean.fs", offset: 307920, size: 2121 },
    { name: "ocean_cloud.vs", offset: 310041, size: 464 },
    { name: "ocean_cloud.fs", offset: 310505, size: 443 },
    { name: "sky_bg.vs", offset: 310948, size: 79 },
    { name: "sky_bg.fs", offset: 311027, size: 148 },
    { name: "sky_cloud.vs", offset: 311175, size: 321 },
    { name: "sky_cloud.fs", offset: 311496, size: 133 },
    { name: "nova.vs", offset: 311629, size: 282 },
    { name: "nova.fs", offset: 311911, size: 324 },
    { name: "starfield.vs", offset: 312235, size: 517 },
    { name: "starfield.fs", offset: 312752, size: 125 }
];

// Reflector class for water reflections
class Reflector extends THREE.Mesh {
    constructor(geometry, options = {}) {
        super(geometry);
        this.type = 'Reflector';
        
        const scope = this;
        const textureWidth = options.textureWidth || 512;
        const textureHeight = options.textureHeight || 512;
        const clipBias = options.clipBias || 0;
        const exclusion = options.exclusion || null;
        
        const normal = new THREE.Plane();
        const normal3 = new THREE.Vector3();
        const cameraWorldPosition = new THREE.Vector3();
        const lookAtPosition = new THREE.Vector3();
        const clipPlane = new THREE.Matrix4();
        const view = new THREE.Vector3(0, 0, -1);
        const target = new THREE.Vector4();
        const q = new THREE.Vector4();
        const textureMatrix = new THREE.Matrix4();
        const virtualCamera = new THREE.PerspectiveCamera();
        
        const parameters = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBFormat
        };
        
        const renderTarget = new THREE.WebGLRenderTarget(textureWidth, textureHeight, parameters);
        
        if (!THREE.MathUtils.isPowerOfTwo(textureWidth) || !THREE.MathUtils.isPowerOfTwo(textureHeight)) {
            renderTarget.texture.generateMipmaps = false;
        }
        
        const material = options.material;
        material.uniforms.reflectionTexture.value = renderTarget.texture;
        material.uniforms.reflectionMatrix.value = textureMatrix;
        
        this.material = material;
        
        this.onBeforeRender = function(renderer, scene, camera) {
            normal3.setFromMatrixPosition(scope.matrixWorld);
            cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);
            
            const rotationMatrix = new THREE.Matrix4();
            rotationMatrix.extractRotation(scope.matrixWorld);
            
            normal.set(0, 1, 0);
            normal.applyMatrix4(rotationMatrix);
            normal.normalize();
            
            const viewWorldPosition = new THREE.Vector3();
            viewWorldPosition.subVectors(normal3, cameraWorldPosition);
            
            if (viewWorldPosition.dot(normal) > 0) return;
            
            viewWorldPosition.reflect(normal).negate();
            viewWorldPosition.add(normal3);
            
            rotationMatrix.extractRotation(camera.matrixWorld);
            
            view.set(0, 0, -1);
            view.applyMatrix4(rotationMatrix);
            view.add(cameraWorldPosition);
            
            const target = new THREE.Vector3();
            target.subVectors(normal3, view);
            target.reflect(normal).negate();
            target.add(normal3);
            
            virtualCamera.position.copy(viewWorldPosition);
            virtualCamera.up.set(0, 1, 0);
            virtualCamera.up.applyMatrix4(rotationMatrix);
            virtualCamera.up.reflect(normal);
            virtualCamera.lookAt(target);
            virtualCamera.far = camera.far;
            virtualCamera.updateMatrixWorld();
            virtualCamera.projectionMatrix.copy(camera.projectionMatrix);
            
            textureMatrix.set(
                0.5, 0.0, 0.0, 0.5,
                0.0, 0.5, 0.0, 0.5,
                0.0, 0.0, 0.5, 0.5,
                0.0, 0.0, 0.0, 1.0
            );
            textureMatrix.multiply(virtualCamera.projectionMatrix);
            textureMatrix.multiply(virtualCamera.matrixWorldInverse);
            textureMatrix.multiply(scope.matrixWorld);
            
            normal.setFromNormalAndCoplanarPoint(normal, normal3);
            normal.applyMatrix4(virtualCamera.matrixWorldInverse);
            
            const clipPlane = new THREE.Vector4(normal.x, normal.y, normal.z, normal.constant);
            const projectionMatrix = virtualCamera.projectionMatrix;
            
            const q = new THREE.Vector4();
            q.x = (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
            q.y = (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
            q.z = -1.0;
            q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];
            
            clipPlane.multiplyScalar(2.0 / clipPlane.dot(q));
            projectionMatrix.elements[2] = clipPlane.x;
            projectionMatrix.elements[6] = clipPlane.y;
            projectionMatrix.elements[10] = clipPlane.z + 1.0 - clipBias;
            projectionMatrix.elements[14] = clipPlane.w;
            
            renderTarget.texture.encoding = renderer.outputEncoding;
            
            scope.visible = false;
            const currentRenderTarget = renderer.getRenderTarget();
            const currentXrEnabled = renderer.xr.enabled;
            const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;
            
            renderer.xr.enabled = false;
            renderer.shadowMap.autoUpdate = false;
            renderer.setRenderTarget(renderTarget);
            renderer.state.buffers.depth.setMask(true);
            if (renderer.autoClear === false) renderer.clear();
            renderer.render(scene, virtualCamera);
            
            renderer.xr.enabled = currentXrEnabled;
            renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
            renderer.setRenderTarget(currentRenderTarget);
            
            const viewport = camera.viewport;
            if (viewport !== undefined) {
                renderer.state.viewport(viewport);
            }
            
            scope.visible = true;
        };
        
        this.getRenderTarget = function() {
            return renderTarget;
        };
    }
}

Reflector.prototype.isReflector = true;
// Note: We don't add Reflector to THREE object as it's not extensible in modern Three.js
// Use Reflector class directly instead

// Check for OffscreenCanvas support
const isOffscreenCanvasSupported = (function() {
    try {
        return typeof OffscreenCanvas !== 'undefined' && new OffscreenCanvas(1, 1).getContext('2d') !== null;
    } catch (e) {
        return false;
    }
})();

// Create texture from blob
async function createTexture(blob, options) {
    try {
        const imageBitmap = await createImageBitmap(blob);
        let canvas, ctx;
        
        if (isOffscreenCanvasSupported) {
            canvas = new OffscreenCanvas(options.width, options.height);
            ctx = canvas.getContext('2d');
        } else {
            canvas = document.createElement('canvas');
            canvas.width = options.width;
            canvas.height = options.height;
            ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, options.width, options.height);
        }
        
        ctx.drawImage(imageBitmap, 0, 0, options.width, options.height);
        const imageData = ctx.getImageData(0, 0, options.width, options.height);
        
        const format = (options.type === 'image/jpeg') ? THREE.RGBFormat : THREE.RGBAFormat;
        const wrap = options.wrap || THREE.ClampToEdgeWrapping;
        const filter = options.filter || THREE.LinearFilter;
        
        const texture = new THREE.DataTexture(
            imageData.data,
            imageData.width,
            imageData.height,
            format,
            THREE.UnsignedByteType,
            THREE.Texture.DEFAULT_MAPPING,
            wrap,
            wrap,
            filter,
            filter
        );
        
        texture.flipY = options.flipY || false;
        texture.needsUpdate = true;
        
        imageBitmap.close();
        
        // Clear blob from memory
        if (blob.arrayBuffer) {
            const arrayBuffer = await blob.arrayBuffer();
            new Uint8Array(arrayBuffer).fill(0);
        } else {
            const reader = new FileReader();
            await new Promise((resolve) => {
                reader.onloadend = () => {
                    const result = reader.result;
                    new Uint8Array(result).fill(0);
                    resolve();
                };
                reader.readAsArrayBuffer(blob);
            });
        }
        
        return texture;
    } catch (error) {
        console.error('Error creating texture:', error);
        throw error;
    }
}

// Asset Manager
class AssetManager {
    constructor() {
        this.assets = {};
        this.ready = new Promise((resolve, reject) => {
            // Use base URL from Vite config
            const baseUrl = import.meta.env.BASE_URL || '/';
            // Remove trailing slash and add src/assets.bin
            const assetPath = (baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl) + '/src/assets.bin';
            
            console.log('Loading assets from:', assetPath);
            
            fetch(assetPath)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to load assets.bin: ${response.status} ${response.statusText}. Path tried: ${assetPath}`);
                    }
                    // Check if response is actually binary, not HTML error page
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('text/html')) {
                        throw new Error(`Received HTML instead of binary data. Check if assets.bin exists at: ${assetPath}`);
                    }
                    return response.arrayBuffer();
                })
                .then(arrayBuffer => {
                    let loadedCount = 0;
                    
                    for (const asset of assets) {
                        const slice = arrayBuffer.slice(asset.offset, asset.offset + asset.size);
                        
                        if (asset.name.endsWith('.jpg') || asset.name.endsWith('.jpeg') || asset.name.endsWith('.png')) {
                            const type = (asset.name.endsWith('.jpg') || asset.name.endsWith('.jpeg')) ? 'image/jpeg' : 'image/png';
                            createTexture(new Blob([slice], { type }), asset)
                                .then(texture => {
                                    this.assets[asset.name] = texture;
                                    loadedCount++;
                                    if (loadedCount === assets.length) resolve();
                                })
                                .catch(reject);
                        } else if (asset.name.endsWith('.vs') || asset.name.endsWith('.fs')) {
                            this.assets[asset.name] = new TextDecoder().decode(slice);
                            loadedCount++;
                            if (loadedCount === assets.length) resolve();
                        } else if (asset.name.endsWith('.glb')) {
                            const loader = new GLTFLoader();
                            loader.parse(slice, '', (gltf) => {
                                this.assets[asset.name] = gltf;
                                loadedCount++;
                                if (loadedCount === assets.length) resolve();
                            });
                        } else {
                            throw new Error(`Unsupported asset type: ${asset.name}`);
                        }
                    }
                })
                .catch(error => {
                    console.error('Failed to load assets:', error);
                    reject(error);
                });
        });
    }
    
    waitUntilReady() {
        return this.ready;
    }
    
    load(name, callback) {
        const asset = this.assets[name];
        if (!asset) {
            throw new Error(`Asset not found: ${name}`);
        }
        if (callback) callback(asset);
        return asset;
    }
}

// Scene classes
class UniverseScene {
    constructor() {
        this.stars = null;
        this.nova = null;
        this.group = null;
        this.clearColor = new THREE.Color(0);
        
        this.group = new THREE.Group();
        this.group.visible = false;
        this.group.position.set(0, 800, 0);
        scene.add(this.group);
        
        // Create stars
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
        
        // Load shaders with error checking
        let starfieldVS = assetManager.load('starfield.vs');
        let starfieldFS = assetManager.load('starfield.fs');
        
        if (!starfieldVS || !starfieldFS) {
            console.error('Failed to load starfield shaders');
            starfieldVS = starfieldVS || 'void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
            starfieldFS = starfieldFS || 'void main() { gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); }';
        }
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uTexture: { value: null }
            },
            vertexShader: starfieldVS,
            fragmentShader: starfieldFS,
            transparent: true,
            depthWrite: false
        });
        
        assetManager.load('star.png', texture => {
            material.uniforms.uTexture.value = texture;
        });
        
        const points = new THREE.Points(geometry, material);
        points.renderOrder = 2;
        this.group.add(points);
        this.stars = points;
        
        // Create nova - load shaders with error checking
        let novaVS = assetManager.load('nova.vs');
        let novaFS = assetManager.load('nova.fs');
        
        if (!novaVS || !novaFS || novaVS.length === 0 || novaFS.length === 0) {
            console.error('Failed to load nova shaders', { novaVS: novaVS?.length || 0, novaFS: novaFS?.length || 0 });
            novaVS = novaVS || 'void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
            novaFS = novaFS || 'void main() { gl_FragColor = vec4(1.0, 0.8, 0.6, 0.5); }';
        } else {
            console.log('Nova shaders loaded:', { vsLength: novaVS.length, fsLength: novaFS.length });
        }
        
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
        
        assetManager.load('nova.jpg', texture => {
            novaMaterial.uniforms.uTexture.value = texture;
        });
        
        const nova = new THREE.Mesh(novaGeometry, novaMaterial);
        nova.position.z = camera.position.z - 700;
        nova.rotation.x = Math.PI / 2;
        nova.renderOrder = -10;
        this.group.add(nova);
        this.nova = nova;
    }
    
    animate(delta, time) {
        if (this.group) {
            this.stars.material.uniforms.uTime.value = time;
            this.nova.material.uniforms.vShift.value = 0.2 * time;
        }
    }
    
    enable() {
        if (this.group) this.group.visible = true;
    }
    
    disable() {
        if (this.group) this.group.visible = false;
    }
    
    containsShip() {
        return ship.positionY >= this.group.position.y - 500;
    }
}

class SkyScene {
    constructor() {
        this.group = null;
        this.clouds = [];
        this.clearColor = new THREE.Color(0x194244); // 1655940 in decimal
        
        const group = new THREE.Group();
        group.visible = false;
        group.position.set(0, 200, 0);
        scene.add(group);
        
        // Sky background - load shaders with error checking
        let skyBgVS = assetManager.load('sky_bg.vs');
        let skyBgFS = assetManager.load('sky_bg.fs');
        
        if (!skyBgVS || !skyBgFS) {
            console.error('Failed to load sky_bg shaders');
            skyBgVS = skyBgVS || 'void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
            skyBgFS = skyBgFS || 'void main() { gl_FragColor = vec4(0.1, 0.25, 0.27, 1.0); }';
        }
        
        this.skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: null },
                uColor: { value: new THREE.Color(0x194244) }
            },
            vertexShader: skyBgVS,
            fragmentShader: skyBgFS,
            depthTest: false,
            depthWrite: false
        });
        
        assetManager.load('sky.jpg', texture => {
            texture.flipY = true;
            this.skyMaterial.uniforms.uTexture.value = texture;
        });
        
        const skyPlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.skyMaterial);
        skyPlane.scale.set(1000, 1000, 1);
        skyPlane.rotation.x = Math.PI / 2;
        skyPlane.position.set(0, 0, -900);
        skyPlane.renderOrder = -100;
        group.add(skyPlane);
        
        // Clouds - load shaders with error checking
        let skyCloudVS = assetManager.load('sky_cloud.vs');
        let skyCloudFS = assetManager.load('sky_cloud.fs');
        
        if (!skyCloudVS || !skyCloudFS) {
            console.error('Failed to load sky_cloud shaders');
            skyCloudVS = skyCloudVS || 'void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
            skyCloudFS = skyCloudFS || 'void main() { gl_FragColor = vec4(1.0, 1.0, 1.0, 0.5); }';
        }
        
        const cloudMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: null }
            },
            vertexShader: skyCloudVS,
            fragmentShader: skyCloudFS,
            transparent: true,
            depthWrite: false
        });
        
        assetManager.load('cloud.png', texture => {
            cloudMaterial.uniforms.uTexture.value = texture;
        });
        
        for (let i = 0; i < CLOUD_COUNT; i++) {
            const size = rnd(100, 175);
            const cloud = new THREE.Mesh(new THREE.PlaneGeometry(size, size), cloudMaterial);
            cloud.position.set(rndFS(1500), rndFS(50) - 100, -rndFS(FAR));
            cloud.renderOrder = FAR + cloud.position.z;
            cloud.rotation.z = rndFS(2 * Math.PI);
            this.clouds.push(cloud);
            group.add(cloud);
        }
        
        this.group = group;
    }
    
    animate(delta, time) {
        const speed = CLOUD_SPEED * delta;
        this.skyMaterial.uniforms.uColor.value.copy(currentClearColor);
        
        for (let i = 0; i < this.clouds.length; i++) {
            this.clouds[i].position.z += speed;
            if (this.clouds[i].position.z > 0) {
                this.clouds[i].position.z -= FAR;
            }
            this.clouds[i].renderOrder = FAR + this.clouds[i].position.z;
        }
    }
    
    enable() {
        if (this.group) this.group.visible = true;
    }
    
    disable() {
        if (this.group) this.group.visible = false;
    }
    
    containsShip() {
        const shipY = ship.positionY;
        const groupY = this.group.position.y;
        return shipY >= groupY - 100 && shipY < groupY + 300;
    }
}

class OceanScene {
    constructor() {
        this.group = null;
        this.reflectionExclusion = null;
        this.cloud = null;
        this.ocean = null;
        // Ocean scene should have a lighter blue background (sky blue for ocean scene)
        this.clearColor = new THREE.Color(0x87CEEB); // Sky blue - lighter than FOG_COLOR
    }
    
    init(oceanGeometry, cloudMesh) {
        const group = new THREE.Group();
        group.visible = false;
        group.position.set(0, 0, 0); // Ocean scene at ground level
        scene.add(group);
        
        const cloudGroup = new THREE.Group();
        group.add(cloudGroup);
        
        // Cloud material - load shaders with error checking
        let oceanCloudVS = assetManager.load('ocean_cloud.vs');
        let oceanCloudFS = assetManager.load('ocean_cloud.fs');
        
        if (!oceanCloudVS || !oceanCloudFS) {
            console.error('Failed to load ocean_cloud shaders');
            oceanCloudVS = oceanCloudVS || '#version 300 es\nin vec3 position; void main() { gl_Position = vec4(position, 1.0); }';
            oceanCloudFS = oceanCloudFS || '#version 300 es\nout vec4 fragColor; void main() { fragColor = vec4(1.0, 1.0, 1.0, 0.5); }';
        }
        
        const cloudMaterial = new THREE.RawShaderMaterial({
            vertexShader: oceanCloudVS,
            fragmentShader: oceanCloudFS,
            uniforms: {
                fogColor: { value: new THREE.Color(FOG_COLOR) },
                fogNear: { value: FOG_NEAR },
                fogFar: { value: FOG_FAR },
                cloudTex: { value: null },
                vShift1: { value: 0 },
                vShift2: { value: 0 }
            },
            fog: true,
            transparent: true
        });
        
        assetManager.load('cloud.jpg', texture => {
            cloudMaterial.uniforms.cloudTex.value = texture;
        });
        
        cloudMesh.material = cloudMaterial;
        cloudMesh.updateMatrix();
        cloudGroup.add(cloudMesh);
        group.add(cloudMesh);
        this.cloud = cloudMesh;
        
        // Ocean material - try to load shaders, fallback to simple material
        let oceanVS = assetManager.load('ocean.vs');
        let oceanFS = assetManager.load('ocean.fs');
        
        let oceanMaterial;
        let useReflector = false;
        
        if (oceanVS && oceanFS && oceanVS.length > 0 && oceanFS.length > 0) {
            // Use shader material with Reflector (Gamiable style)
            oceanMaterial = new THREE.RawShaderMaterial({
                vertexShader: oceanVS,
                fragmentShader: oceanFS,
                uniforms: {
                    fogColor: { value: new THREE.Color(FOG_COLOR) },
                    fogNear: { value: FOG_NEAR },
                    fogFar: { value: FOG_FAR },
                    time: { value: 0 },
                    lightDirection: { value: new THREE.Vector3(-1, 3, 1).normalize() },
                    waterColor: { value: new THREE.Color(0x487D79) }, // 4748249
                    foamColor: { value: new THREE.Color(0xFFFFFF) },
                    sunColor: { value: new THREE.Color(0xFFEFF1) }, // 16772753
                    reflectionTexture: { value: null },
                    reflectionMatrix: { value: new THREE.Matrix4() },
                    noiseTex: { value: null }
                },
                side: THREE.DoubleSide,
                fog: true,
                transparent: true
            });
            
            assetManager.load('ocean.jpg', texture => {
                if (oceanMaterial.uniforms) {
                    oceanMaterial.uniforms.noiseTex.value = texture;
                }
            });
            
            useReflector = true;
        } else {
            // Fallback: simple water material without shaders
            console.warn('Ocean shaders not available, using simple water material');
            oceanMaterial = new THREE.MeshStandardMaterial({
                color: 0x487D79, // Water blue
                roughness: 0.1,
                metalness: 0.3,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.9
            });
            useReflector = false;
        }
        
        // Create ocean - use Reflector if shaders available, otherwise simple mesh
        if (useReflector) {
            this.ocean = new Reflector(oceanGeometry, {
                clipBias: 0.003,
                exclusion: this.reflectionExclusion,
                material: oceanMaterial,
                textureWidth: window.innerWidth * window.devicePixelRatio * 0.5,
                textureHeight: window.innerHeight * window.devicePixelRatio * 0.5
            });
        } else {
            // Simple mesh for fallback
            this.ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
        }
        
        // Position ocean - make it visible below ship (Gamiable: position.set(0, -5, 20))
        // Rotate to be horizontal (water surface)
        this.ocean.rotation.x = -Math.PI / 2;
        this.ocean.position.set(0, -5, 20);
        this.ocean.visible = true; // Ensure ocean is visible
        this.ocean.receiveShadow = true; // Enable shadow receiving
        group.add(this.ocean);
        this.group = group;
        
        // Set group position to be at ground level
        this.group.position.set(0, 0, 0);
        
        // Store if using Reflector for animation
        this.ocean.userData.useReflector = useReflector;
        
        // Make sure ocean material is visible and properly lit
        if (!useReflector && oceanMaterial) {
            oceanMaterial.transparent = false; // Make it fully opaque for visibility
            oceanMaterial.opacity = 1.0;
            // Make water brighter and more visible
            oceanMaterial.color.setHex(0x5F9EA0); // Brighter teal/cyan for better visibility
            oceanMaterial.emissive = new THREE.Color(0x1E3A3A); // Slight emissive for visibility
            oceanMaterial.emissiveIntensity = 0.2;
        }
        
        console.log('✅ OceanScene initialized:', {
            oceanPosition: this.ocean.position,
            oceanRotation: this.ocean.rotation,
            groupPosition: this.group.position,
            oceanVisible: this.ocean.visible,
            useReflector: useReflector,
            oceanColor: oceanMaterial.color ? oceanMaterial.color.getHex() : 'N/A'
        });
    }
    
    animate(delta, time) {
        if (this.group && this.ocean && this.cloud) {
            // Animate cloud (only if material has uniforms)
            if (this.cloud.material && this.cloud.material.uniforms) {
                let vShift1 = this.cloud.material.uniforms.vShift1.value + 0.05 * delta;
                if (vShift1 > 1) vShift1 -= 1;
                this.cloud.material.uniforms.vShift1.value = vShift1;
                
                let vShift2 = this.cloud.material.uniforms.vShift2.value + 0.1 * delta;
                if (vShift2 > 1) vShift2 -= 1;
                this.cloud.material.uniforms.vShift2.value = vShift2;
            }
            
            // Animate ocean (only if using shader material with uniforms)
            if (this.ocean.userData && this.ocean.userData.useReflector && this.ocean.material && this.ocean.material.uniforms && this.ocean.material.uniforms.time) {
                let oceanTime = this.ocean.material.uniforms.time.value + (50 * delta / 1000) * 160;
                if (oceanTime > 200) oceanTime -= 200;
                this.ocean.material.uniforms.time.value = oceanTime;
            } else if ((!this.ocean.userData || !this.ocean.userData.useReflector) && this.ocean.geometry) {
                // Animate water waves by manipulating vertices (fallback method)
                const positions = this.ocean.geometry.attributes.position;
                
                if (positions && !this.ocean.userData.originalPositions) {
                    // Store original positions
                    this.ocean.userData.originalPositions = new Float32Array(positions.array.length);
                    this.ocean.userData.originalPositions.set(positions.array);
                }
                
                if (this.ocean.userData && this.ocean.userData.originalPositions) {
                    for (let i = 0; i < positions.count; i++) {
                        const i3 = i * 3;
                        const x = this.ocean.userData.originalPositions[i3];
                        const z = this.ocean.userData.originalPositions[i3 + 2];
                        
                        // Wave animation
                        const wave1 = Math.sin(x * 0.08 + time * 0.4) * 0.4;
                        const wave2 = Math.sin(z * 0.12 + time * 0.6) * 0.3;
                        const wave3 = Math.sin((x + z) * 0.06 + time * 0.5) * 0.2;
                        
                        positions.setY(i, this.ocean.userData.originalPositions[i3 + 1] + wave1 + wave2 + wave3);
                    }
                    positions.needsUpdate = true;
                }
            }
        }
    }
    
    enable() {
        if (this.group) this.group.visible = true;
    }
    
    disable() {
        if (this.group) this.group.visible = false;
    }
    
    containsShip() {
        return ship.positionY < 100;
    }
}

// Nitro Effect
let nitroMaterial = null;

function updateNitro(time) {
    if (nitroMaterial) {
        nitroMaterial.uniforms.uTime.value = time;
    }
}

class NitroEffect {
    constructor(particleCount = 20) {
        this.particleCount = particleCount;
        this.geometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(3 * particleCount);
        const sizes = new Float32Array(particleCount);
        const speeds = new Float32Array(particleCount);
        const ranges = new Float32Array(particleCount);
        const colors = new Float32Array(3 * particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = rndFS(0.2);
            positions[i3 + 1] = rndFS(0.2);
            positions[i3 + 2] = 0;
            
            sizes[i] = rnd(50, 70);
            speeds[i] = rnd(1, 1.2);
            ranges[i] = rnd(2, 2.4);
            
            colors[i3] = rnd(-0.5, 0.5);
            colors[i3 + 1] = rnd(-0.5, 0.5);
            colors[i3 + 2] = rnd(-0.5, 0.5);
        }
        
        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        this.geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
        this.geometry.setAttribute('aSpeed', new THREE.Float32BufferAttribute(speeds, 1));
        this.geometry.setAttribute('aRange', new THREE.Float32BufferAttribute(ranges, 1));
        this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const vs = assetManager.load('nitro.vs');
        const fs = assetManager.load('nitro.fs');
        
        if (!nitroMaterial) {
            nitroMaterial = new THREE.RawShaderMaterial({
                vertexShader: vs,
                fragmentShader: fs,
                uniforms: {
                    uTime: { value: 0 }
                },
                blending: THREE.AdditiveBlending,
                transparent: true,
                depthWrite: false
            });
        }
        
        this.points = new THREE.Points(this.geometry, nitroMaterial);
        this.points.renderOrder = 10000;
    }
    
    attachToShip(ship) {
        ship.model.add(this.points);
    }
    
    setPosition(x, y, z) {
        this.points.position.set(x, y, z);
    }
}

// Ship class
const SHIP_STRAFE_RANGE = 6;
const SHIP_STRAFE_SPEED_X = 5;
const SHIP_STRAFE_SPEED_Y = 5;
const SHIP_STRAFE_SPEED_Z = 1;
const TOUCH_SENSITIVITY = 0.1;

function clampShipX(x) {
    return Math.max(-SHIP_STRAFE_RANGE, Math.min(SHIP_STRAFE_RANGE, x));
}

class Ship {
    constructor() {
        this.positionX = 2000;
        this.positionY = -3;
        this.positionZ = 20;
        this.targetX = 0;
        this.targetY = -3;
        this.targetZ = -20;
        this.material = null;
        this.nitros = [];
    }
    
    init(shipMesh) {
        const vs = assetManager.load('ship.vs');
        const fs = assetManager.load('ship.fs');
        
        const material = new THREE.RawShaderMaterial({
            vertexShader: vs,
            fragmentShader: fs,
            uniforms: {
                shipTex: { value: null },
                fogColor: { value: new THREE.Color(scene.fog.color) },
                fogNear: { value: scene.fog.near },
                fogFar: { value: scene.fog.far },
                uLightDirection: { value: new THREE.Vector3(-1, -2, -1).normalize() },
                uLightColor: { value: new THREE.Color(0x909090) }, // 9474192
                uAmbientColor: { value: new THREE.Color(0xAAAAAA) }, // 11184810
                uShininess: { value: 32 },
                uRimColor: { value: new THREE.Color(0xA8FF) }, // 43263
                uRimPower: { value: 2 },
                uRimIntensity: { value: 0.7 }
            }
        });
        
        assetManager.load('ship.png', texture => {
            texture.needsUpdate = true;
            material.uniforms.shipTex.value = texture;
        });
        
        shipMesh.traverse(child => {
            if (child.isMesh) {
                child.material = material;
            }
        });
        
        shipMesh.position.set(this.positionX, this.positionY, this.positionZ);
        shipMesh.scale.set(1.2, 1.2, 1.2);
        shipMesh.renderOrder = 1;
        scene.add(shipMesh);
        
        this.material = material;
        this.model = shipMesh;
        
        // Add nitro effects
        for (let i = 0; i < 2; i++) {
            this.nitros.push(new NitroEffect());
            this.nitros[i].attachToShip(this);
        }
        this.nitros[0].setPosition(-2.5, 0, 0.8);
        this.nitros[1].setPosition(2.5, 0, 0.8);
    }
    
    animate(delta, time) {
        if (!this.model) return;
        
        const lerpX = THREE.MathUtils.lerp(this.positionX, this.targetX, 5 * delta);
        const lerpY = THREE.MathUtils.lerp(this.positionY, this.targetY, 5 * delta);
        const lerpZ = THREE.MathUtils.lerp(this.positionZ, this.targetZ, 1 * delta);
        
        const deltaX = lerpX - this.positionX;
        const deltaY = lerpY - this.positionY;
        
        this.positionX = lerpX;
        this.positionY = lerpY;
        this.positionZ = lerpZ;
        
        this.model.position.x = this.positionX + 0.3 * Math.cos(2 * time);
        this.model.position.y = this.positionY + 0.2 * Math.sin(time);
        this.model.position.z = this.positionZ;
        
        this.model.rotation.x = 0.1 * Math.sin(time) - 0.05 * deltaX;
        this.model.rotation.z = 0.1 * Math.cos(0.8 * time) - 0.3 * deltaY;
        
        updateNitro(time);
    }
    
    setTargetY(y) {
        this.targetY = Math.max(-2, y);
    }
}

// Touch/Mouse controls
let touchStartX = 0;
let isTouching = false;

document.addEventListener('mousemove', (e) => {
    if (ship && !isTouching) {
        ship.targetX = clampShipX((e.clientX - window.innerWidth / 2) / 300 * 5);
    }
});

document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
        isTouching = true;
        touchStartX = e.touches[0].clientX;
    }
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    if (e.touches.length <= 0 || !isTouching || !ship) return;
    
    const touchX = e.touches[0].clientX;
    const delta = (touchX - touchStartX) * TOUCH_SENSITIVITY;
    ship.targetX = clampShipX(ship.targetX + delta);
    touchStartX = touchX;
}, { passive: false });

document.addEventListener('touchend', () => {
    isTouching = false;
});

// Initialize renderer
function initRenderer() {
    const canvas = document.getElementById('webgl');
    if (!canvas) {
        console.error('Canvas not found');
        return;
    }
    
    const gl2Context = canvas.getContext('webgl2');
    if (!(isWebGL2 = !!gl2Context) && !(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))) {
        showWelcome();
        return;
    }
    
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    
    renderer = new THREE.WebGLRenderer(
        isWebGL2
            ? { canvas, context: gl2Context, antialias: false, powerPreference: 'low-power', alpha: false, stencil: false, depth: true }
            : { canvas, antialias: false, powerPreference: 'low-power', alpha: false, stencil: false, depth: true }
    );
    
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    updateSize();
    renderer.setClearColor(FOG_COLOR);
}

// Initialize scene
function initScene() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0, FOG_NEAR, FOG_FAR);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, NEAR, FAR);
    
    const ambientLight = new THREE.AmbientLight(0x404040); // 4210752
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
    directionalLight.position.set(-1, 3, 1);
    scene.add(directionalLight);
    
    // Create scenes
    scenes.push(new UniverseScene());
    scenes.push(new SkyScene());
    
    // Load GLB model
    assetManager.load('adventure.glb', (gltf) => {
        let shipMesh = null;
        let oceanMesh = null;
        let cloudMesh = null;
        
        gltf.scene.traverse((child) => {
            if (child.name === 'ship') {
                shipMesh = child;
            } else if (child.name === 'ocean') {
                child.traverse((mesh) => {
                    if (mesh.isMesh) {
                        oceanMesh = mesh;
                    }
                });
            } else if (child.name === 'cloud1') {
                child.traverse((mesh) => {
                    if (mesh.isMesh) {
                        cloudMesh = mesh;
                    }
                });
            }
        });
        
        // Create OceanScene - with or without GLB model
        const oceanScene = new OceanScene();
        
        if (oceanMesh && cloudMesh) {
            // Use geometry from GLB model
            oceanScene.init(oceanMesh.geometry, cloudMesh);
        } else {
            // Fallback: create simple ocean geometry if GLB model not available
            console.warn('Ocean or cloud mesh not found in GLB, creating fallback ocean');
            const fallbackOceanGeometry = new THREE.PlaneGeometry(400, 400, 64, 64);
            const fallbackCloudGeometry = new THREE.PlaneGeometry(200, 200);
            const fallbackCloudMesh = new THREE.Mesh(fallbackCloudGeometry);
            oceanScene.init(fallbackOceanGeometry, fallbackCloudMesh);
        }
        
        scenes.push(oceanScene);
        
        if (shipMesh) {
            ship = new Ship();
            ship.init(shipMesh);
        }
        
        updateSize();
        onScrolled();
        
        // If nextScene is not set, default to SkyScene (index 1) - Gamiable starts with sky
        if (!nextScene && scenes.length > 1) {
            nextScene = scenes[1]; // SkyScene
        }
        
        visibleScene = nextScene || scenes[1] || scenes[0]; // Default to SkyScene, fallback to first
        if (visibleScene) {
            currentClearColor.copy(visibleScene.clearColor);
            visibleScene.enable();
        }
        
        if (ship && visibleScene && visibleScene.group) {
            ship.positionY = visibleScene.group.position.y;
        }
    });
    
    showWelcome();
    animate();
}

// Show welcome
function showWelcome() {
    const section1 = document.getElementById('section1');
    if (section1) {
        section1.style.opacity = '1';
        section1.style.transition = 'opacity 2s ease-in-out';
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();
    
    // Ensure we have a visible scene
    if (!visibleScene && scenes.length > 1) {
        visibleScene = scenes[1]; // Default to SkyScene
        if (visibleScene) {
            visibleScene.enable();
            currentClearColor.copy(visibleScene.clearColor);
        }
    }
    
    if (visibleScene) {
        currentClearColor.lerp(visibleScene.clearColor, 2 * delta);
        renderer.setClearColor(currentClearColor);
        scene.fog.color.set(currentClearColor);
        visibleScene.animate(delta, time);
    }
    
    if (ship) {
        ship.animate(delta, time);
        const shipY = ship.positionY;
        camera.position.y = shipY;
        
        // Switch scenes when nextScene is different and ship is in range
        if (visibleScene !== nextScene && nextScene) {
            // Check if ship is in the new scene's range
            if (nextScene.containsShip && nextScene.containsShip()) {
                if (visibleScene) visibleScene.disable();
                visibleScene = nextScene;
                visibleScene.enable();
            } else if (!nextScene.containsShip) {
                // If scene doesn't have containsShip method, switch immediately
                if (visibleScene) visibleScene.disable();
                visibleScene = nextScene;
                visibleScene.enable();
            }
        }
    }
    
    renderer.render(scene, camera);
}

// Update size
function updateSize() {
    if (!renderer) return;
    
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const pixelRatio = window.devicePixelRatio || 1;
    
    if (canvas.width !== width * pixelRatio || canvas.height !== height * pixelRatio) {
        canvas.width = width * pixelRatio;
        canvas.height = height * pixelRatio;
        renderer.setSize(width, height, false);
        
        if (camera) {
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        }
    }
}

// Handle scroll
function onScrolled() {
    const sectionIds = ['section1', 'section2', 'section3'];
    const viewportHeight = renderer.domElement.clientHeight;
    let activeIndex = 1; // Start with section2 (SkyScene) - Gamiable starts with sky, not universe
    
    for (let i = 0; i < sectionIds.length; i++) {
        const section = document.getElementById(sectionIds[i]);
        if (!section) continue;
        
        const rect = section.getBoundingClientRect();
        const top = rect.top;
        const height = rect.height;
        
        // Check if section is visible in viewport
        if (top < viewportHeight && top + height > 0) {
            activeIndex = i;
            // If section is fully visible, use it
            if (top >= 0 && top + height <= viewportHeight) {
                break;
            }
        }
    }
    
    // Map section index to scene index
    // section1 (index 0) -> UniverseScene (index 0)
    // section2 (index 1) -> SkyScene (index 1) 
    // section3 (index 2) -> OceanScene (index 2)
    const sceneIndex = activeIndex;
    
    if (sceneIndex < 0 || sceneIndex >= scenes.length || !scenes[sceneIndex]) return;
    
    nextScene = scenes[sceneIndex];
    
    if (!ship) return;
    
    const section = document.getElementById(sectionIds[activeIndex]);
    if (!section) {
        // Fallback: set target Y based on scene position
        if (nextScene.group) {
            ship.setTargetY(nextScene.group.position.y);
        }
        return;
    }
    
    const rect = section.getBoundingClientRect();
    const scrollProgress = (rect.top + rect.height - viewportHeight) / viewportHeight;
    const targetY = nextScene.group.position.y + 20 * scrollProgress / viewportHeight - 2;
    
    ship.setTargetY(targetY);
}

// Initialize asset manager
const assetManager = new AssetManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initRenderer();
    
    assetManager.waitUntilReady()
        .then(() => {
            console.log('Assets loaded, initializing application...');
            const loadingEl = document.getElementById('loading');
            if (loadingEl) loadingEl.style.display = 'none';
            initScene();
        })
        .catch((error) => {
            console.error('Failed to load assets:', error);
            const loadingEl = document.getElementById('loading');
            if (loadingEl) {
                loadingEl.innerHTML = `
                    <h2>Error Loading Assets</h2>
                    <p>Failed to load required assets. Please refresh the page to try again.</p>
                    <p>If the problem persists, please check that assets.bin is in the src/ directory.</p>
                `;
            }
        });
});

// Event listeners
window.addEventListener('resize', updateSize);
window.addEventListener('scroll', onScrolled);
window.addEventListener('wheel', () => {
    requestAnimationFrame(onScrolled);
});

