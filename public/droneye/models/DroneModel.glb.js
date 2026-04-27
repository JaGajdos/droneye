(function () {
    if (!window.DroneModelRegistry) return;

    function collectRotorsForSpin(droneRoot, helpers) {
        const parts = [];
        const seen = new Set();

        function detectSpinAxis(size) {
            // Rotor plane normal is usually the thinnest dimension.
            if (size.x <= size.y && size.x <= size.z) return "x";
            if (size.y <= size.x && size.y <= size.z) return "y";
            return "z";
        }

        function getSpinDirectionByPosition(pos) {
            // Real quadcopter pattern: diagonals spin same way, neighboring rotors opposite.
            // Use X/Z quadrant so this works even if propeller naming changes.
            return pos.x * pos.z >= 0 ? 1 : -1;
        }

        const addPart = (rotor, rotorName) => {
            if (!rotor || seen.has(rotor)) return;
            seen.add(rotor);

            let spinTarget = rotor;
            rotor.traverse(child => {
                if (!spinTarget.isMesh && child.isMesh) spinTarget = child;
            });

            if (spinTarget.isMesh && spinTarget.geometry) {
                spinTarget.geometry.computeBoundingBox();
                const box = spinTarget.geometry.boundingBox;
                const ThreeCtor = helpers && helpers.THREE ? helpers.THREE : window.THREE;
                const center = new ThreeCtor.Vector3();
                const size = new ThreeCtor.Vector3();
                box.getCenter(center);
                box.getSize(size);
                spinTarget.geometry.translate(-center.x, -center.y, -center.z);
                spinTarget.position.add(center);
                parts.push({
                    rotor: spinTarget,
                    basePos: spinTarget.position.clone(),
                    axis: detectSpinAxis(size),
                    dir: getSpinDirectionByPosition(spinTarget.position)
                });
                return;
            }

            parts.push({
                rotor: spinTarget,
                basePos: spinTarget.position.clone(),
                axis: "y",
                dir: getSpinDirectionByPosition(spinTarget.position)
            });
        };

        ["Propeller1", "Propeller2", "Propeller3", "Propeller4"].forEach(name => {
            addPart(droneRoot.getObjectByName(name), name);
        });

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
            part.basePos && part.rotor.position.copy(part.basePos);
        }
    }

    window.DroneModelRegistry.register("DroneModel.glb", {
        EXTERNAL_SHIP_BASE_PITCH: -50,
        EXTERNAL_SHIP_ENABLE_CUSTOM_LOOK: false,
        EXTERNAL_SHIP_BRIGHTNESS: 1.2,
        EXTERNAL_SHIP_TINT_HEX: 0x9ec9ff,
        EXTERNAL_SHIP_TINT_STRENGTH: 0.8,
        EXTERNAL_SHIP_EMISSIVE_STRENGTH: 0.1,
        EXTERNAL_SHIP_EMISSIVE_INTENSITY: 0.35,
        EXTERNAL_SHIP_METALNESS_MULT: 0.95,
        EXTERNAL_SHIP_ROUGHNESS_MULT: 0.9,
        collectRotorsForSpin,
        animate: spinRotors
    });
})();
