(function () {
    if (!window.DroneModelRegistry) return;

    function collectRotorsForSpin(droneRoot, helpers) {
        const parts = [];
        const seen = new Set();

        function getSpinDirectionByName(name) {
            // Real quad pattern: diagonals share direction, neighboring rotors are opposite.
            // Based on this model's naming/placement: (1,4) one way, (2,3) opposite way.
            if ("Propeller1" === name || "Propeller4" === name) return 1;
            if ("Propeller2" === name || "Propeller3" === name) return -1;
            return 1;
        }

        const addPart = rotor => {
            if (!rotor || seen.has(rotor)) return;
            seen.add(rotor);

            parts.push({
                rotor,
                axis: "z",
                dir: getSpinDirectionByName(rotor.name)
            });
        };

        ["Propeller1", "Propeller2", "Propeller3", "Propeller4"].forEach(name => {
            addPart(droneRoot.getObjectByName(name));
        });
        if (!parts.length) {
            [
                "Propeller1_Material_0",
                "Propeller2_Material_0",
                "Propeller3_Material_0",
                "Propeller4_Material_0"
            ].forEach(name => {
                addPart(droneRoot.getObjectByName(name));
            });
        }

        if (!parts.length && helpers && typeof helpers.collectDefault == "function") {
            return helpers.collectDefault(droneRoot);
        }
        return parts;
    }

    function spinRotors(ctx, timing) {
        const parts = ctx.rotorSpinParts || [];
        if (!parts.length) return;
        const spin = 30 * timing.delta;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!part || !part.rotor) continue;
            const signedSpin = spin * (part.dir || 1);
            const axis = part.axis || "y";
            if ("x" === axis) part.rotor.rotation.x += signedSpin;
            else if ("z" === axis) part.rotor.rotation.z += signedSpin;
            else part.rotor.rotation.y += signedSpin;
        }
    }

    function applyDroneModelColors(droneRoot, runtime) {
        const THREE = runtime.THREE;
        const bodyColor = new THREE.Color(0x003d99);
        const whiteColor = new THREE.Color(0xffffff);

        const bodyTargets = new Set(["Quadrocopter_Material_0", "Legs_Material_0"]);
        const whiteTargets = new Set([
            "Propeller1_Material_0",
            "Propeller2_Material_0",
            "Propeller3_Material_0",
            "Propeller4_Material_0",
            "Rotors_Material_0",
            "BottomCam.001_Material_0",
            "BottomCam_Material_0",
            "TopCam_Material_0",
            "CamBackground_Material_0",
            "Lens_Material_0",
            "TopLens_Material_0",
            "BottomLens_Material_0",
            "Glass_Glass_0",
            "SidePart_Material_0"
        ]);

        droneRoot.traverse(obj => {
            if (!obj.isMesh || !obj.material) return;
            const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
            const hasBodyMaterialName = materials.some(mat => mat && bodyTargets.has(mat.name));
            const hasWhiteMaterialName = materials.some(mat => mat && whiteTargets.has(mat.name));
            const isBody = bodyTargets.has(obj.name) || hasBodyMaterialName;
            const isWhite = whiteTargets.has(obj.name) || hasWhiteMaterialName;
            if (!isBody && !isWhite) return;
            const targetColor = isBody ? bodyColor : whiteColor;

            for (let i = 0; i < materials.length; i++) {
                const mat = materials[i];
                if (!mat) continue;
                if (mat.color) mat.color.copy(targetColor);
                if (mat.emissive) mat.emissive.set(0x000000);
                mat.needsUpdate = true;
            }
        });
    }

    const droneModelAdapter = {
        EXTERNAL_SHIP_BASE_PITCH: -50,
        EXTERNAL_SHIP_ENABLE_CUSTOM_LOOK: false,
        EXTERNAL_SHIP_BRIGHTNESS: 1.2,
        EXTERNAL_SHIP_TINT_HEX: 0x9ec9ff,
        EXTERNAL_SHIP_TINT_STRENGTH: 0.8,
        EXTERNAL_SHIP_EMISSIVE_STRENGTH: 0.1,
        EXTERNAL_SHIP_EMISSIVE_INTENSITY: 0.35,
        EXTERNAL_SHIP_METALNESS_MULT: 0.95,
        EXTERNAL_SHIP_ROUGHNESS_MULT: 0.9,
        onInit: applyDroneModelColors,
        collectRotorsForSpin,
        animate: spinRotors
    };

    window.DroneModelRegistry.register("DroneModel.glb", droneModelAdapter);
})();
