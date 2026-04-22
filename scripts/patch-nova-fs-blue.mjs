import fs from "fs";

const binPath = new URL("../public/droneye/assets.bin", import.meta.url);
const buf = fs.readFileSync(binPath);

const NOVA_FS_OFFSET = 311911;
const NOVA_FS_SIZE = 324;

const newShader = `uniform sampler2D uTexture;
varying vec2 vUv1;
varying vec2 vUv2;
varying float v;
void main() {
	float a1 = texture2D(uTexture, vUv1).r;
	float a2 = texture2D(uTexture, vUv2).r;
	vec3 c1 = vec3(0.12, 0.35, 0.85) * .75 * a1;
	vec3 c2 = vec3(0.25, 0.55, 1.00) * .75 * a2;
	gl_FragColor = vec4((c1 + c2), v);
}
`;

const patch = Buffer.from(newShader, "utf8");
if (patch.length > NOVA_FS_SIZE) {
    console.error("nova.fs patch too long:", patch.length, "max", NOVA_FS_SIZE);
    process.exit(1);
}

const padded = Buffer.alloc(NOVA_FS_SIZE, 0x20); // pad with spaces
patch.copy(padded);

const out = Buffer.from(buf);
padded.copy(out, NOVA_FS_OFFSET);

fs.writeFileSync(binPath, out);
console.log("Patched nova.fs at", NOVA_FS_OFFSET, "bytes:", patch.length, "padded to", NOVA_FS_SIZE);
