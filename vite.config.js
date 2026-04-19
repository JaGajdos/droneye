import { defineConfig } from "vite";
import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

// Plugin to copy localization files to dist
function copyLocalesPlugin() {
    return {
        name: "copy-locales",
        writeBundle() {
            const srcLocales = join(process.cwd(), "src", "locales");
            const distLocales = join(process.cwd(), "dist", "src", "locales");

            if (existsSync(srcLocales)) {
                // Create dist/src/locales directory
                if (!existsSync(distLocales)) {
                    mkdirSync(distLocales, { recursive: true });
                }

                // Copy all JSON files
                const files = readdirSync(srcLocales);
                files.forEach(file => {
                    if (file.endsWith(".json")) {
                        const srcFile = join(srcLocales, file);
                        const distFile = join(distLocales, file);
                        copyFileSync(srcFile, distFile);
                        console.log(`Copied ${file} to dist/src/locales/`);
                    }
                });
            }
        }
    };
}

// Plugin to copy .htaccess to dist
function copyHtaccessPlugin() {
    return {
        name: "copy-htaccess",
        writeBundle() {
            const htaccessFile = join(process.cwd(), ".htaccess");
            const distHtaccess = join(process.cwd(), "dist", ".htaccess");

            if (existsSync(htaccessFile)) {
                copyFileSync(htaccessFile, distHtaccess);
                console.log(`Copied .htaccess to dist/`);
            }
        }
    };
}

// Plugin to copy basegraph images to dist/assets
function copyBasegraphImagesPlugin() {
    return {
        name: "copy-basegraph-images",
        writeBundle() {
            const assetsDir = join(process.cwd(), "assets");
            const distAssetsDir = join(process.cwd(), "dist", "assets");

            // Create dist/assets directory if it doesn't exist
            if (!existsSync(distAssetsDir)) {
                mkdirSync(distAssetsDir, { recursive: true });
            }

            // Copy basegraph images
            const basegraphFiles = [
                "basegraph-sk-desktop2.webp",
                "basegraph-en-desktop2.webp",
                "basegraph-de-desktop2.webp"
            ];

            basegraphFiles.forEach(file => {
                const srcFile = join(assetsDir, file);
                const distFile = join(distAssetsDir, file);
                if (existsSync(srcFile)) {
                    copyFileSync(srcFile, distFile);
                    console.log(`Copied ${file} to dist/assets/`);
                } else {
                    console.warn(`Warning: ${file} not found in assets/`);
                }
            });
        }
    };
}

export default defineConfig({
    base: "/droneye/",
    server: {
        port: 5173,
        open: true,
        historyApiFallback: true
    },
    plugins: [copyLocalesPlugin(), copyHtaccessPlugin(), copyBasegraphImagesPlugin()],
    build: {
        outDir: "dist",
        assetsDir: "assets",
        sourcemap: true,
        rollupOptions: {
            input: {
                main: "index.html",
                index2: "index2.html",
                sluzby: "sluzby.html",
                projekty: "projekty.html",
                tim: "tim.html",
                "cenova-ponuka": "cenova-ponuka.html",
                kontakt: "kontakt.html",
                legislativa: "legislativa.html",
                gdpr: "gdpr.html"
            },
            output: {
                manualChunks: {
                    three: ["three"]
                }
            }
        }
    },
    optimizeDeps: {
        include: ["three"]
    }
});
