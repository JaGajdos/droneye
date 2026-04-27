(function () {
    if (!window.DroneModelRegistry) return;

    function spinRotors(ctx, timing) {
        const parts = ctx.rotorSpinParts || [];
        if (!parts.length) return;
        const spin = 18 * timing.delta;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!part || !part.rotor) continue;
            part.rotor.rotation.y += spin;
            part.basePos && part.rotor.position.copy(part.basePos);
        }
    }

    window.DroneModelRegistry.register("Drone2.glb", {
        EXTERNAL_SHIP_BASE_PITCH: -50,
        EXTERNAL_SHIP_ENABLE_CUSTOM_LOOK: false,
        EXTERNAL_SHIP_BRIGHTNESS: 1.2,
        EXTERNAL_SHIP_TINT_HEX: 0x9ec9ff,
        EXTERNAL_SHIP_TINT_STRENGTH: 0.8,
        EXTERNAL_SHIP_EMISSIVE_STRENGTH: 0.1,
        EXTERNAL_SHIP_EMISSIVE_INTENSITY: 0.35,
        EXTERNAL_SHIP_METALNESS_MULT: 0.95,
        EXTERNAL_SHIP_ROUGHNESS_MULT: 0.9,
        animate: spinRotors
    });
})();
