
            class Reflector extends THREE.Mesh {
                constructor(geometry, options = {}) {
                    (super(geometry), (this.type = "Reflector"));
                    const reflector = this,
                        textureWidth = options.textureWidth || 512,
                        textureHeight = options.textureHeight || 512,
                        clipBias = options.clipBias || 0,
                        exclusion = options.exclusion || null,
                        clipPlane = new THREE.Plane(),
                        normal = new THREE.Vector3(),
                        reflectorWorldPos = new THREE.Vector3(),
                        cameraWorldPos = new THREE.Vector3(),
                        rotationMatrix = new THREE.Matrix4(),
                        lookAtPosition = new THREE.Vector3(0, 0, -1),
                        clipPlaneParams = new THREE.Vector4(),
                        view = new THREE.Vector3(),
                        target = new THREE.Vector3(),
                        q = new THREE.Vector4(),
                        textureMatrix = new THREE.Matrix4(),
                        virtualCamera = new THREE.PerspectiveCamera(),
                        renderTargetParams = {
                            minFilter: THREE.LinearFilter,
                            magFilter: THREE.LinearFilter,
                            format: THREE.RGBFormat
                        },
                        renderTarget = new THREE.WebGLRenderTarget(textureWidth, textureHeight, renderTargetParams);
                    (THREE.MathUtils.isPowerOfTwo(textureWidth) && THREE.MathUtils.isPowerOfTwo(textureHeight)) ||
                        (renderTarget.texture.generateMipmaps = !1);
                    const shaderMaterial = options.material;
                    ((shaderMaterial.uniforms.reflectionTexture.value = renderTarget.texture),
                        (shaderMaterial.uniforms.reflectionMatrix.value = textureMatrix),
                        (this.material = shaderMaterial),
                        (this.onBeforeRender = function (renderRenderer, renderScene, renderCamera) {
                            if (
                                (reflectorWorldPos.setFromMatrixPosition(reflector.matrixWorld),
                                cameraWorldPos.setFromMatrixPosition(renderCamera.matrixWorld),
                                rotationMatrix.extractRotation(reflector.matrixWorld),
                                normal.set(0, 1, 0),
                                normal.applyMatrix4(rotationMatrix),
                                view.subVectors(reflectorWorldPos, cameraWorldPos),
                                view.dot(normal) > 0)
                            )
                                return;
                            (view.reflect(normal).negate(),
                                view.add(reflectorWorldPos),
                                rotationMatrix.extractRotation(renderCamera.matrixWorld),
                                lookAtPosition.set(0, 0, -1),
                                lookAtPosition.applyMatrix4(rotationMatrix),
                                lookAtPosition.add(cameraWorldPos),
                                target.subVectors(reflectorWorldPos, lookAtPosition),
                                target.reflect(normal).negate(),
                                target.add(reflectorWorldPos),
                                virtualCamera.position.copy(view),
                                virtualCamera.up.set(0, 1, 0),
                                virtualCamera.up.applyMatrix4(rotationMatrix),
                                virtualCamera.up.reflect(normal),
                                virtualCamera.lookAt(target),
                                (virtualCamera.far = renderCamera.far),
                                virtualCamera.updateMatrixWorld(),
                                virtualCamera.projectionMatrix.copy(renderCamera.projectionMatrix),
                                textureMatrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1),
                                textureMatrix.multiply(virtualCamera.projectionMatrix),
                                textureMatrix.multiply(virtualCamera.matrixWorldInverse),
                                textureMatrix.multiply(reflector.matrixWorld),
                                clipPlane.setFromNormalAndCoplanarPoint(normal, reflectorWorldPos),
                                clipPlane.applyMatrix4(virtualCamera.matrixWorldInverse),
                                clipPlaneParams.set(
                                    clipPlane.normal.x,
                                    clipPlane.normal.y,
                                    clipPlane.normal.z,
                                    clipPlane.constant
                                ));
                            const projMatrix = virtualCamera.projectionMatrix;
                            ((q.x = (Math.sign(clipPlaneParams.x) + projMatrix.elements[8]) / projMatrix.elements[0]),
                                (q.y = (Math.sign(clipPlaneParams.y) + projMatrix.elements[9]) / projMatrix.elements[5]),
                                (q.z = -1),
                                (q.w = (1 + projMatrix.elements[10]) / projMatrix.elements[14]),
                                clipPlaneParams.multiplyScalar(2 / clipPlaneParams.dot(q)),
                                (projMatrix.elements[2] = clipPlaneParams.x),
                                (projMatrix.elements[6] = clipPlaneParams.y),
                                (projMatrix.elements[10] = clipPlaneParams.z + 1 - clipBias),
                                (projMatrix.elements[14] = clipPlaneParams.w),
                                (renderTarget.texture.encoding = renderRenderer.outputEncoding),
                                (reflector.visible = !1));
                            let exclusionVisibleBackup = null;
                            exclusion && ((exclusionVisibleBackup = exclusion.visible), (exclusion.visible = !1));
                            const prevTarget = renderRenderer.getRenderTarget(),
                                prevXr = renderRenderer.xr.enabled,
                                prevShadowAuto = renderRenderer.shadowMap.autoUpdate;
                            ((renderRenderer.xr.enabled = !1),
                                (renderRenderer.shadowMap.autoUpdate = !1),
                                renderRenderer.setRenderTarget(renderTarget),
                                renderRenderer.state.buffers.depth.setMask(!0),
                                !1 === renderRenderer.autoClear && renderRenderer.clear(),
                                renderRenderer.render(renderScene, virtualCamera),
                                (renderRenderer.xr.enabled = prevXr),
                                (renderRenderer.shadowMap.autoUpdate = prevShadowAuto),
                                renderRenderer.setRenderTarget(prevTarget));
                            const vp = renderCamera.viewport;
                            (void 0 !== vp && renderRenderer.state.viewport(vp),
                                (reflector.visible = !0),
                                exclusion && (exclusion.visible = exclusionVisibleBackup));
                        }),
                        (this.getRenderTarget = function () {
                            return renderTarget;
                        }));
                }
            }
            ((Reflector.prototype.isReflector = !0), (THREE.Reflector = Reflector));
            const FOG_COLOR = 9091836,
                MOVE_SPEED = 50;
            class OceanScene {
                constructor() {
                    ((this.group = null),
                        (this.reflectionExclusion = null),
                        (this.cloud = null),
                        (this.ocean = null),
                        (this.clearColor = new THREE.Color(9091836)));
                }
                init(oceanGeometrySource, cloudObject) {
                    const root = new THREE.Group();
                    ((root.visible = !1), scene.add(root));
                    const cloudHolder = new THREE.Group();
                    root.add(cloudHolder);
                    const cloudMaterial = new THREE.RawShaderMaterial({
                        vertexShader: assetManager.load("ocean_cloud.vs"),
                        fragmentShader: assetManager.load("ocean_cloud.fs"),
                        uniforms: {
                            fogColor: { value: new THREE.Color(9091836) },
                            fogNear: { value: FOG_NEAR },
                            fogFar: { value: FOG_FAR },
                            cloudTex: { value: null },
                            vShift1: { value: 0 },
                            vShift2: { value: 0 }
                        },
                        fog: !0,
                        transparent: !0
                    });
                    (assetManager.load("cloud.jpg", function (tex) {
                        cloudMaterial.uniforms.cloudTex.value = tex;
                    }),
                        (cloudObject.material = cloudMaterial),
                        cloudObject.updateMatrix(),
                        cloudHolder.add(cloudObject),
                        root.add(cloudObject),
                        (this.cloud = cloudObject));
                    const waterMaterial = new THREE.RawShaderMaterial({
                        vertexShader: assetManager.load("ocean.vs"),
                        fragmentShader: assetManager.load("ocean.fs"),
                        uniforms: {
                            fogColor: { value: new THREE.Color(9091836) },
                            fogNear: { value: FOG_NEAR },
                            fogFar: { value: FOG_FAR },
                            time: { value: 0 },
                            lightDirection: { value: new THREE.Vector3(-1, 3, 1).normalize() },
                            waterColor: { value: new THREE.Color(4748249) },
                            foamColor: { value: new THREE.Color(16777215) },
                            sunColor: { value: new THREE.Color(16772753) },
                            reflectionTexture: { value: null },
                            reflectionMatrix: { value: new THREE.Matrix4() },
                            noiseTex: { value: null }
                        },
                        side: THREE.DoubleSide,
                        fog: !0,
                        transparent: !0
                    });
                    (assetManager.load("ocean.jpg", function (tex) {
                        waterMaterial.uniforms.noiseTex.value = tex;
                    }),
                        (this.ocean = new THREE.Reflector(oceanGeometrySource.geometry, {
                            clipBias: 0.003,
                            exclusion: this.reflectionExclusion,
                            material: waterMaterial,
                            textureWidth: window.innerWidth * window.devicePixelRatio * 0.5,
                            textureHeight: window.innerHeight * window.devicePixelRatio * 0.5
                        })),
                        this.ocean.position.set(0, -5, 20),
                        root.add(this.ocean),
                        (this.group = root));
                }
                animate(delta) {
                    if (this.group) {
                        {
                            let v1 = this.cloud.material.uniforms.vShift1.value + 0.05 * delta;
                            (v1 > 1 && (v1 -= 1), (this.cloud.material.uniforms.vShift1.value = v1));
                            let v2 = this.cloud.material.uniforms.vShift2.value + 0.1 * delta;
                            (v2 > 1 && (v2 -= 1), (this.cloud.material.uniforms.vShift2.value = v2));
                        }
                        {
                            let waveTime = this.ocean.material.uniforms.time.value + ((50 * delta) / 1e3) * 160;
                            (waveTime > 200 && (waveTime -= 200), (this.ocean.material.uniforms.time.value = waveTime));
                        }
                    }
                }
                enable() {
                    this.group && (this.group.visible = !0);
                }
                disable() {
                    this.group && (this.group.visible = !1);
                }
                containsShip() {
                    return ship.positionY < 100;
                }
            }
            const starCount = 2e3;
            class UniverseScene {
                constructor() {
                    ((this.stars = null),
                        (this.nova = null),
                        (this.group = null),
                        (this.clearColor = new THREE.Color(0)),
                        (this.group = new THREE.Group()),
                        (this.group.visible = !1),
                        this.group.position.set(0, 800, 0),
                        scene.add(this.group));
                    const positions = new Float32Array(6e3),
                        colors = new Float32Array(8e3),
                        sizes = new Float32Array(2e3),
                        speeds = new Float32Array(2e3),
                        scratch = new THREE.Vector3();
                    for (let star = 0; star < 2e3; star++)
                        (scratch.set(rndFS(1e3), rndFS(1e3), -rnd(0, FAR)),
                            scratch.toArray(positions, 3 * star),
                            (colors[4 * star] = rnd(0.5, 1)),
                            (colors[4 * star + 1] = rnd(0.5, 1)),
                            (colors[4 * star + 2] = rnd(0.5, 1)),
                            (colors[4 * star + 3] = rnd(0.2, 1.5)),
                            (sizes[star] = 0.2 * rnd(5, 100)),
                            (speeds[star] = rnd(40, 400)));
                    const starGeometry = new THREE.BufferGeometry();
                    (starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3)),
                        starGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1)),
                        starGeometry.setAttribute("speed", new THREE.BufferAttribute(speeds, 1)),
                        starGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 4)));
                    const starMaterial = new THREE.ShaderMaterial({
                        uniforms: { uTime: { value: 0 }, uTexture: { value: null } },
                        vertexShader: assetManager.load("starfield.vs"),
                        fragmentShader: assetManager.load("starfield.fs"),
                        transparent: !0,
                        depthWrite: !1
                    });
                    assetManager.load("star.png", tex => {
                        starMaterial.uniforms.uTexture.value = tex;
                    });
                    const starPoints = new THREE.Points(starGeometry, starMaterial);
                    ((starPoints.renderOrder = 2), this.group.add(starPoints), (this.stars = starPoints));
                    const novaGeo = new THREE.CylinderGeometry(1e3, 100, 600, 128, 1, !0),
                        novaMat = new THREE.ShaderMaterial({
                            uniforms: { vShift: { value: 0 }, uTexture: { value: null } },
                            vertexShader: assetManager.load("nova.vs"),
                            fragmentShader: assetManager.load("nova.fs"),
                            depthTest: !1,
                            depthWrite: !1,
                            side: THREE.BackSide,
                            transparent: !0
                        });
                    assetManager.load("nova.jpg", tex => {
                        novaMat.uniforms.uTexture.value = tex;
                    });
                    const novaMesh = new THREE.Mesh(novaGeo, novaMat);
                    ((novaMesh.position.z = camera.position.z - 700),
                        (novaMesh.rotation.x = Math.PI / 2),
                        (novaMesh.renderOrder = -10),
                        this.group.add(novaMesh),
                        (this.nova = novaMesh));
                }
                animate(delta, elapsed) {
                    this.group &&
                        ((this.stars.material.uniforms.uTime.value = elapsed),
                        (this.nova.material.uniforms.vShift.value = 0.2 * elapsed));
                }
                enable() {
                    this.group && (this.group.visible = !0);
                }
                disable() {
                    this.group && (this.group.visible = !1);
                }
                containsShip() {
                    return ship.positionY >= this.group.position.y - 500;
                }
            }
            const CLOUD_COUNT = 500,
                CLOUD_SPEED = 100;
            class SkyScene {
                constructor() {
                    ((this.group = null), (this.clouds = []), (this.clearColor = new THREE.Color(1655940)));
                    const root = new THREE.Group();
                    ((root.visible = !1),
                        root.position.set(0, 200, 0),
                        scene.add(root),
                        (this.skyMaterial = new THREE.ShaderMaterial({
                            uniforms: { uTexture: { value: null }, uColor: { value: new THREE.Color(1655940) } },
                            vertexShader: assetManager.load("sky_bg.vs"),
                            fragmentShader: assetManager.load("sky_bg.fs"),
                            depthTest: !1,
                            depthWrite: !1
                        })),
                        assetManager.load("sky.jpg", tex => {
                            ((tex.flipY = !0), (this.skyMaterial.uniforms.uTexture.value = tex));
                        }));
                    const skyBackdrop = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.skyMaterial);
                    (skyBackdrop.scale.set(1e3, 1e3, 1),
                        (skyBackdrop.rotation.x = Math.PI / 2),
                        skyBackdrop.position.set(0, 0, -900),
                        (skyBackdrop.renderOrder = -100),
                        root.add(skyBackdrop));
                    const cloudBillboardMat = new THREE.ShaderMaterial({
                        uniforms: { uTexture: { value: null } },
                        vertexShader: assetManager.load("sky_cloud.vs"),
                        fragmentShader: assetManager.load("sky_cloud.fs"),
                        transparent: !0,
                        depthWrite: !1
                    });
                    assetManager.load("cloud.png", tex => {
                        cloudBillboardMat.uniforms.uTexture.value = tex;
                    });
                    for (let cloudIndex = 0; cloudIndex < 500; cloudIndex++) {
                        const size = rnd(100, 175),
                            cloudMesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), cloudBillboardMat);
                        (cloudMesh.position.set(rndFS(1500), rndFS(50) - 100, -rndFS(FAR)),
                            (cloudMesh.renderOrder = FAR + cloudMesh.position.z),
                            (cloudMesh.rotation.z = rndFS(2 * Math.PI)),
                            this.clouds.push(cloudMesh),
                            root.add(cloudMesh));
                    }
                    this.group = root;
                }
                animate(delta) {
                    const speed = 100 * delta;
                    this.skyMaterial.uniforms.uColor.value.copy(currentClearColor);
                    for (let idx = 0; idx < this.clouds.length; idx++)
                        ((this.clouds[idx].position.z += speed),
                            this.clouds[idx].position.z > 0 && (this.clouds[idx].position.z -= FAR),
                            (this.clouds[idx].renderOrder = FAR + this.clouds[idx].position.z));
                }
                enable() {
                    this.group && (this.group.visible = !0);
                }
                disable() {
                    this.group && (this.group.visible = !1);
                }
                containsShip() {
                    const shipY = ship.positionY,
                        layerY = this.group.position.y;
                    return shipY >= layerY - 100 && shipY < layerY + 300;
                }
            }
            let nitroMaterial = null;
            function updateNitro(time) {
                nitroMaterial.uniforms.uTime.value = time;
            }
            class NitroEffect {
                constructor(particleCount = 20) {
                    ((this.particleCount = particleCount), (this.geometry = new THREE.BufferGeometry()));
                    const positions = new Float32Array(3 * particleCount),
                        sizes = new Float32Array(particleCount),
                        speeds = new Float32Array(particleCount),
                        ranges = new Float32Array(particleCount),
                        colors = new Float32Array(3 * particleCount);
                    for (let particleIndex = 0; particleIndex < particleCount; particleIndex++) {
                        const base = 3 * particleIndex;
                        ((positions[base] = rndFS(0.2)),
                            (positions[base + 1] = rndFS(0.2)),
                            (positions[base + 2] = 0),
                            (sizes[particleIndex] = rnd(50, 70)),
                            (speeds[particleIndex] = rnd(1, 1.2)),
                            (ranges[particleIndex] = rnd(2, 2.4)),
                            (colors[base] = rnd(-0.5, 0.5)),
                            (colors[base + 1] = rnd(-0.5, 0.5)),
                            (colors[base + 2] = rnd(-0.5, 0.5)));
                    }
                    (this.geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3)),
                        this.geometry.setAttribute("aSize", new THREE.Float32BufferAttribute(sizes, 1)),
                        this.geometry.setAttribute("aSpeed", new THREE.Float32BufferAttribute(speeds, 1)),
                        this.geometry.setAttribute("aRange", new THREE.Float32BufferAttribute(ranges, 1)),
                        this.geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3)));
                    const vs = assetManager.load("nitro.vs"),
                        fs = assetManager.load("nitro.fs");
                    (nitroMaterial ||
                        (nitroMaterial = new THREE.RawShaderMaterial({
                            vertexShader: vs,
                            fragmentShader: fs,
                            uniforms: { uTime: { value: 0 } },
                            blending: THREE.AdditiveBlending,
                            transparent: !0,
                            depthWrite: !1
                        })),
                        (this.points = new THREE.Points(this.geometry, nitroMaterial)),
                        (this.points.renderOrder = 1e4));
                }
                attachToShip(shipInstance) {
                    shipInstance.model.add(this.points);
                }
                setPosition(x, y, z) {
                    this.points.position.set(x, y, z);
                }
            }
            const SHIP_STRAFE_RANGE = 6,
                SHIP_STRAFE_SPEED_X = 5,
                SHIP_STRAFE_SPEED_Y = 5,
                SHIP_STRAFE_SPEED_Z = 1,
                TOUCH_SENSITIVITY = 0.1;
            function clampShipX(x) {
                return Math.max(-6, Math.min(6, x));
            }
            const ROTOR_SPIN_SPEED = 18,
                EXTERNAL_SHIP_BASE_PITCH = -50;
            /* Jednoduchý prepínač: true = custom look, false = pôvodné GLB materiály. */
            const ENABLE_EXTERNAL_SHIP_CUSTOM_LOOK = false;
            /* Look pre externý Drone.glb (jednoduché doladenie farby/svetlosti). */
            const EXTERNAL_SHIP_BRIGHTNESS = 1.2,
                EXTERNAL_SHIP_TINT_HEX = 0x9ec9ff,
                EXTERNAL_SHIP_TINT_STRENGTH = 0.8,
                EXTERNAL_SHIP_EMISSIVE_STRENGTH = 0.1,
                EXTERNAL_SHIP_EMISSIVE_INTENSITY = 0.35,
                EXTERNAL_SHIP_METALNESS_MULT = 0.95,
                EXTERNAL_SHIP_ROUGHNESS_MULT = 0.9;
            function collectRotorsForSpin(droneRoot) {
                const rotorNameRegex = /(prop|rotor|fan|blade)/i,
                    parts = [],
                    seen = new Set();
                droneRoot.traverse(o => {
                    if (!o.isMesh || !rotorNameRegex.test(o.name || "")) return;
                    const rotorObj =
                        o.parent && o.parent !== droneRoot && rotorNameRegex.test(o.parent.name || "") ? o.parent : o;
                    if (seen.has(rotorObj)) return;
                    seen.add(rotorObj);
                    if (rotorObj.geometry) {
                        rotorObj.geometry.computeBoundingBox();
                        const box = rotorObj.geometry.boundingBox,
                            center = new THREE.Vector3();
                        box.getCenter(center);
                        rotorObj.geometry.translate(-center.x, -center.y, -center.z);
                        rotorObj.position.add(center);
                    }
                    parts.push({ rotor: rotorObj, basePos: rotorObj.position.clone() });
                });
                if (parts.length === 0) {
                    ["Rotor_FL", "Rotor_FR", "Rotor_BL", "Rotor_BR"].forEach(name => {
                        const obj = droneRoot.getObjectByName(name);
                        if (!obj || seen.has(obj)) return;
                        seen.add(obj);
                        if (obj.geometry) {
                            obj.geometry.computeBoundingBox();
                            const box = obj.geometry.boundingBox,
                                center = new THREE.Vector3();
                            box.getCenter(center);
                            obj.geometry.translate(-center.x, -center.y, -center.z);
                            obj.position.add(center);
                        }
                        parts.push({ rotor: obj, basePos: obj.position.clone() });
                    });
                }
                return parts;
            }
            function applyExternalDroneLook(droneRoot) {
                const tintColor = new THREE.Color(EXTERNAL_SHIP_TINT_HEX);
                droneRoot.traverse(obj => {
                    if (!obj.isMesh || !obj.material) return;
                    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
                    materials.forEach(mat => {
                        if (!mat) return;
                        if (mat.color) {
                            mat.color.multiplyScalar(EXTERNAL_SHIP_BRIGHTNESS);
                            mat.color.lerp(tintColor, EXTERNAL_SHIP_TINT_STRENGTH);
                        }
                        if (mat.emissive) {
                            mat.emissive.lerp(tintColor, EXTERNAL_SHIP_EMISSIVE_STRENGTH);
                            mat.emissiveIntensity = Math.max(
                                mat.emissiveIntensity || 0,
                                EXTERNAL_SHIP_EMISSIVE_INTENSITY
                            );
                        }
                        if (typeof mat.metalness === "number")
                            mat.metalness = Math.min(1, mat.metalness * EXTERNAL_SHIP_METALNESS_MULT);
                        if (typeof mat.roughness === "number")
                            mat.roughness = Math.max(0, mat.roughness * EXTERNAL_SHIP_ROUGHNESS_MULT);
                        mat.needsUpdate = !0;
                    });
                });
            }
            class Ship {
                constructor() {
                    ((this.positionX = 2e3),
                        (this.positionY = -3),
                        (this.positionZ = 20),
                        (this.targetX = 0),
                        (this.targetY = -3),
                        (this.targetZ = -20),
                        (this.material = null),
                        (this.nitros = []),
                        (this.rotorSpinParts = []),
                        (this.basePitchOffset = 0));
                }
                init(shipRoot, options) {
                    if (options && options.useGltfMaterials) {
                        ENABLE_EXTERNAL_SHIP_CUSTOM_LOOK && applyExternalDroneLook(shipRoot);
                        const box = new THREE.Box3().setFromObject(shipRoot),
                            size = box.getSize(new THREE.Vector3()),
                            maxDim = Math.max(size.x, size.y, size.z, 1e-6);
                        shipRoot.scale.setScalar(9.6 / maxDim);
                        shipRoot.position.set(this.positionX, this.positionY, this.positionZ);
                        shipRoot.updateMatrixWorld(!0);
                        (shipRoot.renderOrder = 1);
                        scene.add(shipRoot);
                        ((this.material = null),
                            (this.model = shipRoot),
                            (this.basePitchOffset = EXTERNAL_SHIP_BASE_PITCH),
                            (this.rotorSpinParts = collectRotorsForSpin(shipRoot)));
                        for (let slot = 0; slot < 2; slot++)
                            (this.nitros.push(new NitroEffect()), this.nitros[slot].attachToShip(this));
                        (this.nitros[0].setPosition(-2.5, 0, 0.8), this.nitros[1].setPosition(2.5, 0, 0.8));
                        return;
                    }
                    this.rotorSpinParts = [];
                    const vs = assetManager.load("ship.vs"),
                        fs = assetManager.load("ship.fs"),
                        hullMaterial = new THREE.RawShaderMaterial({
                            vertexShader: vs,
                            fragmentShader: fs,
                            uniforms: {
                                shipTex: { value: null },
                                fogColor: { value: new THREE.Color(scene.fog.color) },
                                fogNear: { value: scene.fog.near },
                                fogFar: { value: scene.fog.far },
                                uLightDirection: { value: new THREE.Vector3(-1, -2, -1).normalize() },
                                uLightColor: { value: new THREE.Color(9474192) },
                                uAmbientColor: { value: new THREE.Color(11184810) },
                                uShininess: { value: 32 },
                                uRimColor: { value: new THREE.Color(43263) },
                                uRimPower: { value: 2 },
                                uRimIntensity: { value: 0.7 }
                            }
                        });
                    (assetManager.load("ship.png", function (tex) {
                        ((tex.needsUpdate = !0), (hullMaterial.uniforms.shipTex.value = tex));
                    }),
                        shipRoot.traverse(child => {
                            child.isMesh && (child.material = hullMaterial);
                        }),
                        shipRoot.position.set(this.positionX, this.positionY, this.positionZ),
                        shipRoot.scale.set(1.2, 1.2, 1.2),
                        (shipRoot.renderOrder = 1),
                        scene.add(shipRoot),
                        (this.material = hullMaterial),
                        (this.model = shipRoot));
                    for (let slot = 0; slot < 2; slot++)
                        (this.nitros.push(new NitroEffect()), this.nitros[slot].attachToShip(this));
                    (this.nitros[0].setPosition(-2.5, 0, 0.8), this.nitros[1].setPosition(2.5, 0, 0.8));
                }
                animate(delta, elapsed) {
                    if (!this.model) return;
                    const nextX = THREE.MathUtils.lerp(this.positionX, this.targetX, 5 * delta),
                        nextY = THREE.MathUtils.lerp(this.positionY, this.targetY, 5 * delta),
                        nextZ = THREE.MathUtils.lerp(this.positionZ, this.targetZ, 1 * delta),
                        velX = nextX - this.positionX,
                        velY = nextY - this.positionY;
                    ((this.positionX = nextX),
                        (this.positionY = nextY),
                        (this.positionZ = nextZ),
                        (this.model.position.x = this.positionX + 0.3 * Math.cos(2 * elapsed)),
                        (this.model.position.y = this.positionY + 0.2 * Math.sin(elapsed)),
                        (this.model.position.z = this.positionZ),
                        (this.model.rotation.x = this.basePitchOffset + 0.1 * Math.sin(elapsed) - 0.05 * velX),
                        (this.model.rotation.z = 0.1 * Math.cos(0.8 * elapsed) - 0.3 * velY),
                        updateNitro(elapsed));
                    if (this.rotorSpinParts && this.rotorSpinParts.length) {
                        const spin = ROTOR_SPIN_SPEED * delta;
                        for (let k = 0; k < this.rotorSpinParts.length; k++) {
                            const part = this.rotorSpinParts[k];
                            if (!part || !part.rotor) continue;
                            part.rotor.rotation.y += spin;
                            part.basePos && part.rotor.position.copy(part.basePos);
                        }
                    }
                }
                setTargetY(y) {
                    this.targetY = Math.max(-2, y);
                }
            }
            let touchStartX = 0,
                isTouching = !1;
            (document.addEventListener("mousemove", event => {
                ship &&
                    !isTouching &&
                    (ship.targetX = clampShipX(((event.clientX - window.innerWidth / 2) / 300) * 5));
            }),
                document.addEventListener(
                    "touchstart",
                    event => {
                        event.touches.length <= 0 ||
                            ((isTouching = !0), (touchStartX = event.touches[0].clientX));
                    },
                    { passive: !0 }
                ),
                document.addEventListener(
                    "touchmove",
                    event => {
                        if (event.touches.length <= 0 || !isTouching || !ship) return;
                        const touchX = event.touches[0].clientX,
                            deltaX = (touchX - touchStartX) * 0.1;
                        ((ship.targetX = clampShipX(ship.targetX + deltaX)), (touchStartX = touchX));
                    },
                    { passive: !1 }
                ),
                document.addEventListener("touchend", () => {
                    isTouching = !1;
                }));
            let assets = [
                { name: "adventure.glb", offset: 0, size: 77236 },
                { name: "ship.png", offset: 77236, size: 130, width: 8, height: 8 },
                { name: "cloud.jpg", offset: 77366, size: 22637, wrap: THREE.RepeatWrapping, width: 512, height: 512 },
                {
                    name: "ocean.jpg",
                    offset: 100003,
                    size: 101768,
                    wrap: THREE.RepeatWrapping,
                    width: 1024,
                    height: 1024
                },
                { name: "sky.jpg", offset: 201771, size: 369, width: 32, height: 32 },
                {
                    name: "cloud.png",
                    offset: 202140,
                    size: 58580,
                    wrap: THREE.ClampToEdgeWrapping,
                    width: 256,
                    height: 256
                },
                {
                    name: "nova.jpg",
                    offset: 260720,
                    size: 40589,
                    wrap: THREE.RepeatWrapping,
                    width: 1024,
                    height: 1024
                },
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
            const isOffscreenCanvasSupported = (function () {
                try {
                    return "undefined" != typeof OffscreenCanvas && null !== new OffscreenCanvas(1, 1).getContext("2d");
                } catch {
                    return !1;
                }
            })();
            async function createTexture(blob, meta) {
                try {
                    const bitmap = await createImageBitmap(blob);
                    let canvasEl, ctx2d;
                    (isOffscreenCanvasSupported
                        ? (ctx2d = (canvasEl = new OffscreenCanvas(meta.width, meta.height)).getContext("2d"))
                        : (((canvasEl = document.createElement("canvas")).width = meta.width),
                          (canvasEl.height = meta.height),
                          (ctx2d = canvasEl.getContext("2d")).clearRect(0, 0, meta.width, meta.height)),
                        ctx2d.drawImage(bitmap, 0, 0, meta.width, meta.height));
                    const imageData = ctx2d.getImageData(0, 0, meta.width, meta.height),
                        format = "image/jpeg" === meta.type ? THREE.RGBFormat : THREE.RGBAFormat,
                        wrap = meta.wrap || THREE.ClampToEdgeWrapping,
                        filter = meta.filter || THREE.LinearFilter,
                        texture = new THREE.DataTexture(
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
                    if (((texture.flipY = meta.flipY || !1), (texture.needsUpdate = !0), bitmap.close(), blob.arrayBuffer)) {
                        const buf = await blob.arrayBuffer();
                        new Uint8Array(buf).fill(0);
                    } else {
                        const reader = new FileReader();
                        await new Promise(resolve => {
                            ((reader.onloadend = () => {
                                const result = reader.result;
                                (new Uint8Array(result).fill(0), resolve());
                            }),
                                reader.readAsArrayBuffer(blob));
                        });
                    }
                    return texture;
                } catch (err) {
                    throw (console.error("Error creating texture:", err), err);
                }
            }
            class AssetManager {
                constructor() {
                    ((this.assets = {}),
                        (this.ready = new Promise((resolve, reject) => {
                            fetch(new URL("droneye/assets.bin", document.baseURI).href)
                                .then(res => res.arrayBuffer())
                                .then(arrayBuffer => {
                                    let loadedCount = 0;
                                    for (const assetEntry of assets) {
                                        const bytes = arrayBuffer.slice(assetEntry.offset, assetEntry.offset + assetEntry.size);
                                        if (
                                            assetEntry.name.endsWith(".jpg") ||
                                            assetEntry.name.endsWith(".jpeg") ||
                                            assetEntry.name.endsWith(".png")
                                        ) {
                                            const mimeType =
                                                assetEntry.name.endsWith(".jpg") || assetEntry.name.endsWith(".jpeg")
                                                    ? "image/jpeg"
                                                    : "image/png";
                                            createTexture(new Blob([bytes], { type: mimeType }), assetEntry).then(tex => {
                                                ((this.assets[assetEntry.name] = tex),
                                                    ++loadedCount === assets.length && resolve());
                                            });
                                        } else if (assetEntry.name.endsWith(".vs") || assetEntry.name.endsWith(".fs"))
                                            ((this.assets[assetEntry.name] = new TextDecoder().decode(bytes)),
                                                ++loadedCount === assets.length && resolve());
                                        else if (assetEntry.name.endsWith(".glb"))
                                            new THREE.GLTFLoader().parse(bytes, "", parsed => {
                                                ((this.assets[assetEntry.name] = parsed),
                                                    ++loadedCount === assets.length && resolve());
                                            });
                                        else throw Error("Unsupported asset type: " + assetEntry.name);
                                    }
                                })
                                .catch(err => {
                                    (console.error("Failed to load assets:", err), reject(err));
                                });
                        })));
                }
                waitUntilReady() {
                    return this.ready;
                }
                load(assetName, onLoaded) {
                    const asset = this.assets[assetName];
                    if (!asset) throw Error("Asset not found: " + assetName);
                    return (onLoaded && onLoaded(asset), asset);
                }
            }
            let renderer,
                scene,
                camera,
                isWebGL2 = !1,
                scenes = [],
                visibleScene = null,
                nextScene = null,
                ship = null;
            const NEAR = 0.1,
                FAR = 1e3,
                FOG_NEAR = 100,
                FOG_FAR = 1e3,
                clock = new THREE.Clock();
            let currentClearColor = new THREE.Color(0);
            const { randFloat: rnd, randFloatSpread: rndFS, clamp: clamp } = THREE.MathUtils;
            let assetManager = new AssetManager();
            const deferDroneUntilLandingCTA =
                document.body && document.body.classList.contains("homepage-index3");
            /** Prepínač modelu lode: false = adventure.glb „ship“ + shader; true = súbor z public/ (materiály z GLB). */
            const USE_EXTERNAL_DRONE_GLB_AS_SHIP = true,
                EXTERNAL_SHIP_GLB_FILENAME = "Drone.glb";
            (initRenderer(),
                assetManager
                    .waitUntilReady()
                    .then(() => {
                        (console.log("Assets loaded, initializing application..."), initScene());
                    })
                    .catch(err => {
                        (console.error("Failed to load assets:", err),
                            (document.body.innerHTML = `
			<div style="color: white; font-family: Arial, sans-serif; text-align: center; margin-top: 100px; padding: 20px;"><h2>Error Loading Assets</h2><p>Failed to load required game assets. Please refresh the page to try again.</p><p>If the problem persists, please check your internet connection.</p></div>
		`));
                    }));
            const canvasWrapper = document.getElementById("canvas-wrapper");
            function showWelcome() {
                const section1 = document.getElementById("section1");
                section1 &&
                    ((section1.style.opacity = 1), (section1.style.transition = "opacity 2s ease-in-out"));
            }
            function initRenderer() {
                const canvas = document.getElementById("webgl"),
                    gl2 = canvas.getContext("webgl2");
                let glContext = gl2;
                if (!(isWebGL2 = !!glContext) && !(glContext = canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))) {
                    showWelcome();
                    return;
                }
                (window.devicePixelRatio,
                    (canvas.style.width = "100%"),
                    (canvas.style.height = "100%"),
                    (renderer = new THREE.WebGLRenderer(
                        isWebGL2
                            ? {
                                  canvas,
                                  context: glContext,
                                  antialias: !1,
                                  powerPreference: "low-power",
                                  alpha: !1,
                                  stencil: !1,
                                  depth: !0
                              }
                            : {
                                  canvas,
                                  antialias: !1,
                                  powerPreference: "low-power",
                                  alpha: !1,
                                  stencil: !1,
                                  depth: !0
                              }
                    )).setPixelRatio(Math.min(window.devicePixelRatio, 2)),
                    updateSize(),
                    renderer.setClearColor(9091836));
            }
            function initScene() {
                (((scene = new THREE.Scene()).fog = new THREE.Fog(0, FOG_NEAR, FOG_FAR)),
                    (camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, FAR)));
                const ambientLight = new THREE.AmbientLight(4210752);
                scene.add(ambientLight);
                const sunLight = new THREE.DirectionalLight(16777215, 1);
                (sunLight.position.set(-1, 3, 1),
                    scene.add(sunLight),
                    scenes.push(new UniverseScene()),
                    scenes.push(new SkyScene()),
                    assetManager.load("adventure.glb", gltf => {
                        let bundleShip,
                            oceanMesh,
                            cloudMesh;
                        (gltf.scene.traverse(obj => {
                            "ship" === obj.name
                                ? (bundleShip = obj)
                                : "ocean" === obj.name
                                  ? obj.traverse(child => {
                                        child.isMesh && (oceanMesh = child);
                                    })
                                  : "cloud1" === obj.name &&
                                    obj.traverse(child => {
                                        child.isMesh && (cloudMesh = child);
                                    });
                        }),
                            scenes.push(new OceanScene()),
                            scenes[scenes.length - 1].init(oceanMesh, cloudMesh));
                        const finishAfterShip = () => {
                            (updateSize(),
                                onScrolled(),
                                (visibleScene = nextScene),
                                currentClearColor.copy(visibleScene.clearColor),
                                visibleScene.enable(),
                                ship && (ship.positionY = visibleScene.group.position.y));
                        };
                        function loadDroneShipThen(afterShip) {
                            if (USE_EXTERNAL_DRONE_GLB_AS_SHIP) {
                                const droneUrl = new URL(EXTERNAL_SHIP_GLB_FILENAME, document.baseURI).href;
                                new THREE.GLTFLoader().load(
                                    droneUrl,
                                    droneGltf => {
                                        ((ship = new Ship()).init(droneGltf.scene, { useGltfMaterials: !0 }), afterShip());
                                    },
                                    void 0,
                                    err => {
                                        (console.warn("External ship GLB failed, using bundled ship:", err),
                                            bundleShip
                                                ? ((ship = new Ship()).init(bundleShip, { useGltfMaterials: !1 }), afterShip())
                                                : ((ship = null), afterShip()));
                                    }
                                );
                            } else ((ship = new Ship()).init(bundleShip, { useGltfMaterials: !1 }), afterShip());
                        }
                        if (deferDroneUntilLandingCTA) {
                            ((ship = null),
                                finishAfterShip(),
                                (window.beginLandingIntroFlow = function (onDroneReady) {
                                    if (ship) return void (onDroneReady && onDroneReady());
                                    loadDroneShipThen(() => {
                                        (updateSize(),
                                            onScrolled(),
                                            ship && (ship.positionY = visibleScene.group.position.y),
                                            onDroneReady && onDroneReady());
                                    });
                                }));
                        } else loadDroneShipThen(finishAfterShip);
                    }),
                    showWelcome(),
                    animate());
            }
            function animate() {
                const delta = clock.getDelta(),
                    elapsed = clock.getElapsedTime();
                if (
                    (requestAnimationFrame(animate),
                    visibleScene &&
                        (currentClearColor.lerp(visibleScene.clearColor, 2 * delta),
                        renderer.setClearColor(currentClearColor),
                        scene.fog.color.set(currentClearColor),
                        visibleScene.animate(delta, elapsed)),
                    ship)
                ) {
                    ship.animate(delta, elapsed);
                    const shipY = ship.positionY;
                    ((camera.position.y = shipY),
                        visibleScene != nextScene &&
                            nextScene.containsShip() &&
                            (visibleScene.disable(), (visibleScene = nextScene).enable()));
                } else if (deferDroneUntilLandingCTA && camera && visibleScene && visibleScene.group) {
                    ((camera.position.y = visibleScene.group.position.y),
                        visibleScene != nextScene &&
                            (visibleScene.disable(), (visibleScene = nextScene).enable()));
                }
                renderer.render(scene, camera);
            }
            function toggleMobileMenu(navElement) {
                navElement.classList.toggle("open");
            }
            function updateSize() {
                const canvas = renderer.domElement,
                    width = canvas.clientWidth,
                    height = canvas.clientHeight,
                    pixelRatio = window.devicePixelRatio || 1;
                (canvas.width !== width * pixelRatio || canvas.height !== height * pixelRatio) &&
                    ((canvas.width = width * pixelRatio),
                    (canvas.height = height * pixelRatio),
                    renderer.setSize(width, height, !1),
                    camera && ((camera.aspect = width / height), camera.updateProjectionMatrix()));
            }
            function onScrolled() {
                const sectionIds = ["section1", "section2", "section3"],
                    viewHeight = renderer.domElement.clientHeight;
                let activeSceneIndex = 0,
                    anySectionInDom = !1;
                for (let idx = 0; idx < sectionIds.length; idx++) {
                    const sectionEl = document.getElementById(sectionIds[idx]);
                    if (!sectionEl) continue;
                    anySectionInDom = !0;
                    const rect = sectionEl.getBoundingClientRect(),
                        top = rect.top,
                        height = rect.height;
                    if (top < viewHeight && top + height > viewHeight) {
                        activeSceneIndex = idx;
                        break;
                    }
                }
                anySectionInDom || (activeSceneIndex = 0);
                if (
                    activeSceneIndex < 0 ||
                    activeSceneIndex >= scenes.length ||
                    !scenes[activeSceneIndex] ||
                    ((nextScene = scenes[activeSceneIndex]), !ship)
                )
                    return;
                if (!anySectionInDom) return void ship.setTargetY(nextScene.group.position.y);
                const activeSection = document.getElementById(sectionIds[activeSceneIndex]);
                if (!activeSection) return void ship.setTargetY(nextScene.group.position.y);
                const activeRect = activeSection.getBoundingClientRect(),
                    scrollBlend = activeRect.top + activeRect.height - viewHeight,
                    shipTargetY = nextScene.group.position.y + (20 * scrollBlend) / viewHeight - 2;
                ship.setTargetY(shipTargetY);
            }
            (window.addEventListener("resize", updateSize),
                window.addEventListener("scroll", onScrolled),
                window.addEventListener("wheel", () => {
                    requestAnimationFrame(onScrolled);
                }));