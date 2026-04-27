(function () {
    const adapters = Object.create(null);

    function normalizeName(name) {
        return String(name || "")
            .trim()
            .toLowerCase();
    }

    function register(fileName, adapter) {
        const key = normalizeName(fileName);
        if (!key) return;
        adapters[key] = adapter || {};
    }

    function resolve(fileName) {
        const key = normalizeName(fileName);
        return adapters[key] || adapters["*"] || {};
    }

    window.DroneModelRegistry = {
        register,
        resolve,
        normalizeName
    };
})();
