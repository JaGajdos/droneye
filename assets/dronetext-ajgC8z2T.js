import{M as ie,V as T,C as I,F as Oe,P as _e,a as te,b as he,c as Se,W as Ge,U as pe,d as ge,S as be,e as Ze,f as Q,B as Me,g as Be,A as ce,D as le,h as de,i as Ne,j as $e,k as Ce,l as je,m as Ie,n as ue,o as Ue,p as De,G as Te,T as fe,q as Le,r as ze,R as Xe,s as He,t as ve}from"./three-BlOKnPzJ.js";import{G as qe}from"./GLTFLoader-C434yn19.js";class Ve extends ie{constructor(n,t={}){super(n),this.isWater=!0;const a=this,r=t.textureWidth!==void 0?t.textureWidth:512,o=t.textureHeight!==void 0?t.textureHeight:512,e=t.clipBias!==void 0?t.clipBias:0,i=t.alpha!==void 0?t.alpha:1,s=t.time!==void 0?t.time:0,c=t.waterNormals!==void 0?t.waterNormals:null,l=t.sunDirection!==void 0?t.sunDirection:new T(.70707,.70707,0),p=new I(t.sunColor!==void 0?t.sunColor:16777215),v=new I(t.waterColor!==void 0?t.waterColor:8355711),b=t.eye!==void 0?t.eye:new T(0,0,0),m=t.distortionScale!==void 0?t.distortionScale:20,h=t.side!==void 0?t.side:Oe,f=t.fog!==void 0?t.fog:!1,g=new _e,w=new T,x=new T,W=new T,S=new te,O=new T(0,0,-1),A=new he,k=new T,E=new T,Z=new he,B=new te,C=new Se,U=new Ge(r,o),N={name:"MirrorShader",uniforms:pe.merge([ge.fog,ge.lights,{normalSampler:{value:null},mirrorSampler:{value:null},alpha:{value:1},time:{value:0},size:{value:1},distortionScale:{value:20},textureMatrix:{value:new te},sunColor:{value:new I(8355711)},sunDirection:{value:new T(.70707,.70707,0)},eye:{value:new T},waterColor:{value:new I(5592405)}}]),vertexShader:`
				uniform mat4 textureMatrix;
				uniform float time;

				varying vec4 mirrorCoord;
				varying vec4 worldPosition;

				#include <common>
				#include <fog_pars_vertex>
				#include <shadowmap_pars_vertex>
				#include <logdepthbuf_pars_vertex>

				void main() {
					mirrorCoord = modelMatrix * vec4( position, 1.0 );
					worldPosition = mirrorCoord.xyzw;
					mirrorCoord = textureMatrix * mirrorCoord;
					vec4 mvPosition =  modelViewMatrix * vec4( position, 1.0 );
					gl_Position = projectionMatrix * mvPosition;

				#include <beginnormal_vertex>
				#include <defaultnormal_vertex>
				#include <logdepthbuf_vertex>
				#include <fog_vertex>
				#include <shadowmap_vertex>
			}`,fragmentShader:`
				uniform sampler2D mirrorSampler;
				uniform float alpha;
				uniform float time;
				uniform float size;
				uniform float distortionScale;
				uniform sampler2D normalSampler;
				uniform vec3 sunColor;
				uniform vec3 sunDirection;
				uniform vec3 eye;
				uniform vec3 waterColor;

				varying vec4 mirrorCoord;
				varying vec4 worldPosition;

				vec4 getNoise( vec2 uv ) {
					vec2 uv0 = ( uv / 103.0 ) + vec2(time / 17.0, time / 29.0);
					vec2 uv1 = uv / 107.0-vec2( time / -19.0, time / 31.0 );
					vec2 uv2 = uv / vec2( 8907.0, 9803.0 ) + vec2( time / 101.0, time / 97.0 );
					vec2 uv3 = uv / vec2( 1091.0, 1027.0 ) - vec2( time / 109.0, time / -113.0 );
					vec4 noise = texture2D( normalSampler, uv0 ) +
						texture2D( normalSampler, uv1 ) +
						texture2D( normalSampler, uv2 ) +
						texture2D( normalSampler, uv3 );
					return noise * 0.5 - 1.0;
				}

				void sunLight( const vec3 surfaceNormal, const vec3 eyeDirection, float shiny, float spec, float diffuse, inout vec3 diffuseColor, inout vec3 specularColor ) {
					vec3 reflection = normalize( reflect( -sunDirection, surfaceNormal ) );
					float direction = max( 0.0, dot( eyeDirection, reflection ) );
					specularColor += pow( direction, shiny ) * sunColor * spec;
					diffuseColor += max( dot( sunDirection, surfaceNormal ), 0.0 ) * sunColor * diffuse;
				}

				#include <common>
				#include <packing>
				#include <bsdfs>
				#include <fog_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <lights_pars_begin>
				#include <shadowmap_pars_fragment>
				#include <shadowmask_pars_fragment>

				void main() {

					#include <logdepthbuf_fragment>
					vec4 noise = getNoise( worldPosition.xz * size );
					vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );

					vec3 diffuseLight = vec3(0.0);
					vec3 specularLight = vec3(0.0);

					vec3 worldToEye = eye-worldPosition.xyz;
					vec3 eyeDirection = normalize( worldToEye );
					sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, 0.5, diffuseLight, specularLight );

					float distance = length(worldToEye);

					vec2 distortion = surfaceNormal.xz * ( 0.001 + 1.0 / distance ) * distortionScale;
					vec3 reflectionSample = vec3( texture2D( mirrorSampler, mirrorCoord.xy / mirrorCoord.w + distortion ) );

					float theta = max( dot( eyeDirection, surfaceNormal ), 0.0 );
					float rf0 = 0.3;
					float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );
					vec3 scatter = max( 0.0, dot( surfaceNormal, eyeDirection ) ) * waterColor;
					vec3 albedo = mix( ( sunColor * diffuseLight * 0.3 + scatter ) * getShadowMask(), ( vec3( 0.1 ) + reflectionSample * 0.9 + reflectionSample * specularLight ), reflectance);
					vec3 outgoingLight = albedo;
					gl_FragColor = vec4( outgoingLight, alpha );

					#include <tonemapping_fragment>
					#include <colorspace_fragment>
					#include <fog_fragment>	
				}`},D=new be({name:N.name,uniforms:pe.clone(N.uniforms),vertexShader:N.vertexShader,fragmentShader:N.fragmentShader,lights:!0,side:h,fog:f});D.uniforms.mirrorSampler.value=U.texture,D.uniforms.textureMatrix.value=B,D.uniforms.alpha.value=i,D.uniforms.time.value=s,D.uniforms.normalSampler.value=c,D.uniforms.sunColor.value=p,D.uniforms.waterColor.value=v,D.uniforms.sunDirection.value=l,D.uniforms.distortionScale.value=m,D.uniforms.eye.value=b,a.material=D,a.onBeforeRender=function(z,Ee,X){if(x.setFromMatrixPosition(a.matrixWorld),W.setFromMatrixPosition(X.matrixWorld),S.extractRotation(a.matrixWorld),w.set(0,0,1),w.applyMatrix4(S),k.subVectors(x,W),k.dot(w)>0)return;k.reflect(w).negate(),k.add(x),S.extractRotation(X.matrixWorld),O.set(0,0,-1),O.applyMatrix4(S),O.add(W),E.subVectors(x,O),E.reflect(w).negate(),E.add(x),C.position.copy(k),C.up.set(0,1,0),C.up.applyMatrix4(S),C.up.reflect(w),C.lookAt(E),C.far=X.far,C.updateMatrixWorld(),C.projectionMatrix.copy(X.projectionMatrix),B.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),B.multiply(C.projectionMatrix),B.multiply(C.matrixWorldInverse),g.setFromNormalAndCoplanarPoint(w,x),g.applyMatrix4(C.matrixWorldInverse),A.set(g.normal.x,g.normal.y,g.normal.z,g.constant);const _=C.projectionMatrix;Z.x=(Math.sign(A.x)+_.elements[8])/_.elements[0],Z.y=(Math.sign(A.y)+_.elements[9])/_.elements[5],Z.z=-1,Z.w=(1+_.elements[10])/_.elements[14],A.multiplyScalar(2/A.dot(Z)),_.elements[2]=A.x,_.elements[6]=A.y,_.elements[10]=A.z+1-e,_.elements[14]=A.w,b.setFromMatrixPosition(X.matrixWorld);const Ye=z.getRenderTarget(),Re=z.xr.enabled,Fe=z.shadowMap.autoUpdate;a.visible=!1,z.xr.enabled=!1,z.shadowMap.autoUpdate=!1,z.setRenderTarget(U),z.state.buffers.depth.setMask(!0),z.autoClear===!1&&z.clear(),z.render(Ee,C),a.visible=!0,z.xr.enabled=Re,z.shadowMap.autoUpdate=Fe,z.setRenderTarget(Ye);const me=X.viewport;me!==void 0&&z.state.viewport(me)}}}let R,L,H,d=null,$=[];const Je=18,V=new Be,ne=new Map;let M=[],P=0,y=0,F=0,we=0,K=3e3,ee=!1;const j=50,q=-10;let Y=j,Pe=0,J=!0,We=0;const Ke=2,se=-30,oe=0,G={body:9062,rotors:16737792,details:16777215};function Qe(u,n){if(!d){console.warn("Drone model not loaded yet");return}u&&(G.body=typeof u=="string"?parseInt(u.replace("#",""),16):u),n&&(G.rotors=typeof n=="string"?parseInt(n.replace("#",""),16):n),d.traverse(t=>{t.isMesh&&t.material&&(Array.isArray(t.material)?t.material:[t.material]).forEach(r=>{(r.isMeshStandardMaterial||r.isMeshPhongMaterial||r.isMeshLambertMaterial)&&(t.name&&/body/i.test(t.name)?r.color.setHex(G.body):t.name&&/rotor/i.test(t.name)&&r.color.setHex(G.rotors),r.needsUpdate=!0)})}),console.log("✅ Colors updated:",{body:`#${G.body.toString(16)}`,rotors:`#${G.rotors.toString(16)}`})}window.changeDroneColor=Qe;function et(u){if(!u){console.warn("No texture path(s) provided");return}const n=M[1]?.userData.sceneObject;if(!n||!n.group){console.warn("Sky scene or cloud group not found");return}const t=Array.isArray(u)?u:[u],a=new fe,r=[];let o=0;t.forEach((e,i)=>{a.load(e,s=>{if(console.log(`✅ Cloud texture ${i+1} loaded successfully`),s.flipY=!1,r[i]=s,o++,o===t.length){const c=r.filter(S=>S!==void 0);n.scene.userData.cloudTextures=c;const l=n.group;if(l.clear(),c.length===0){console.warn("No valid textures loaded");return}const p=45,v=30,b=20,m=250,h=250,f=25,g=Math.ceil(m/f)+2,w=Math.ceil(h/f)+2,x=3,W=1.5;for(let S=0;S<x;S++){const O=p+S*W,A=.5-S*.1;for(let k=0;k<g;k++)for(let E=0;E<w;E++){const Z=(Math.random()-.5)*f*1.2,B=(Math.random()-.5)*f*1.2,C=(k-g/2)*f+Z+S*2,U=(E-w/2)*f+B+S*2,N=c[Math.floor(Math.random()*c.length)],D=xe(C,O,U,v,b,N,A);D&&l.add(D)}}}},void 0,s=>{if(console.warn(`⚠️ Failed to load cloud texture ${i+1}:`,s),o++,o===t.length){const c=r.filter(l=>l!==void 0);if(c.length>0){n.scene.userData.cloudTextures=c;const l=n.group;l.clear();const p=45,v=30,b=20,m=250,h=250,f=25,g=Math.ceil(m/f)+2,w=Math.ceil(h/f)+2,x=3,W=1.5;for(let S=0;S<x;S++){const O=p+S*W,A=.5-S*.1;for(let k=0;k<g;k++)for(let E=0;E<w;E++){const Z=(Math.random()-.5)*f*1.2,B=(Math.random()-.5)*f*1.2,C=(k-g/2)*f+Z+S*2,U=(E-w/2)*f+B+S*2,N=c[Math.floor(Math.random()*c.length)],D=xe(C,O,U,v,b,N,A);D&&l.add(D)}}}}})})}function xe(u,n,t,a,r,o,e=.5){if(!o)return null;const i=Math.max(a,r),s=new ue(i,i),c=new He({map:o,transparent:!0,opacity:e,depthWrite:!1,side:De,roughness:.8,metalness:0});o.wrapS=ve,o.wrapT=ve,o.flipY=!1;const l=new ie(s,c);return l.position.set(u,n,t),l.rotation.z=(Math.random()-.5)*Math.PI*.3,l.rotation.x=(Math.random()-.5)*Math.PI*.1,l.rotation.y=(Math.random()-.5)*Math.PI*.1,l.userData.originalY=n,l.userData.originalZ=t,l.userData.originalRotationZ=l.rotation.z,l}window.setCloudTexture=et;function tt(){if(re&&R&&H){console.log("Animation already initialized, skipping init()...");return}const u=document.getElementById("drone-canvas");if(!u){console.error("Canvas not found");return}H=new Ze({canvas:u,antialias:!0}),H.setPixelRatio(Math.min(window.devicePixelRatio,2)),H.setSize(window.innerWidth,window.innerHeight),R=new Q,R.background=new I(1118481),L=new Se(55,window.innerWidth/window.innerHeight,.01,1e3),L.position.set(0,15,15),L.lookAt(0,0,0),at(),R=M[0],rt(),window.addEventListener("resize",lt,!1),window.addEventListener("wheel",dt,{passive:!1}),window.addEventListener("touchstart",ut,{passive:!1}),window.addEventListener("touchmove",ft,{passive:!1}),window.addEventListener("touchend",mt,{passive:!1}),Ae()}class ot{constructor(){this.scene=new Q,this.scene.background=new I(0),this.scene.add(new ce(16777215,1.2));const n=new le(16777215,1.5);n.position.set(5,10,5),this.scene.add(n);const t=new de(16777215,1,100);t.position.set(0,0,10),this.scene.add(t);const a=new Ne,r=800,o=new Float32Array(r*3),e=8,i=280,s=1200;for(let m=0;m<r*3;m+=3){const h=Math.random()*Math.PI*2,f=Math.pow(Math.random(),.4),g=e+f*(i-e),w=-Math.random()*s;o[m]=g*Math.cos(h),o[m+1]=g*Math.sin(h),o[m+2]=w}a.setAttribute("position",new $e(o,3));const c=document.createElement("canvas");c.width=64,c.height=64;const l=c.getContext("2d"),p=l.createRadialGradient(32,32,0,32,32,32);p.addColorStop(0,"rgba(255, 255, 255, 1)"),p.addColorStop(.5,"rgba(255, 255, 255, 0.8)"),p.addColorStop(1,"rgba(255, 255, 255, 0)"),l.fillStyle=p,l.fillRect(0,0,64,64);const v=new Ce(c),b=new je({map:v,color:16777215,size:2.5,sizeAttenuation:!0,transparent:!0,alphaTest:.1,opacity:.9});this.stars=new Ie(a,b),this.scene.add(this.stars),this.scene.userData.stars=this.stars,this.createAuroraTunnel()}createAuroraTunnel(){this.auroraLayers=[];for(let t=0;t<20;t++){const a=60+t*2,r=64,o=new ue(a,a,r,r),e=new be({uniforms:{time:{value:0},index:{value:t},total:{value:20},dronePos:{value:new T(0,0,0)}},vertexShader:`
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
            `,fragmentShader:`
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
                    
                        // Create aurora colors - more blue, less purple
                        vec3 color1 = vec3(0.2, 0.3, 0.6); // Blue-cyan
                        vec3 color2 = vec3(0.25, 0.4, 0.7); // Blue
                        vec3 color3 = vec3(0.3, 0.5, 0.8); // Bright Blue
                    
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
                    
                    // Create organic alpha pattern - much softer, less bright
                    float alpha = pattern * (1.0 - smoothstep(0.3, 1.0, dist)) * 0.06; // Reduced brightness significantly
                    
                    // Add vertical streaks like real aurora (softer)
                    float streaks = sin(pos.y * 0.3 + time * 0.4) * 0.5 + 0.5;
                    alpha *= (0.5 + streaks * 0.15); // Further reduced intensity
                    
                    // Fade out at edges organically
                    alpha *= smoothstep(0.0, 0.3, 1.0 - dist);
                    
                    gl_FragColor = vec4(baseColor, alpha);
                }
            `,transparent:!0,side:De,blending:Ue,depthWrite:!1}),i=new ie(o,e);i.rotation.x=Math.PI/1.5,i.position.set(0,0,-80+t*4),this.scene.add(i),this.auroraLayers.push(i)}this.scene.userData.auroraRings=this.auroraLayers}animate(n,t){if(this.stars&&d){const a=this.stars.geometry.attributes.position,r=120,o=0,e=800,i=o+30,s=o-e;for(let c=0;c<a.count;c++){const l=a.getZ(c),p=l+r*n;if(p>i||l<s){const v=Math.random()*Math.PI*2,b=Math.pow(Math.random(),.4),m=8,f=m+b*(280-m),g=f*Math.cos(v),w=f*Math.sin(v),x=e*.8,W=o-e,S=c%100/100*x,O=(Math.random()-.5)*x*.2;a.setX(c,g),a.setY(c,w),a.setZ(c,W+S+O)}else a.setZ(c,p)}a.needsUpdate=!0,this.stars.position.x=0,this.stars.position.y=d.position.y}this.auroraLayers&&d&&this.auroraLayers.forEach((r,o)=>{r.material.uniforms&&(r.material.uniforms.time.value=t),r.position.x=0,r.position.y=d.position.y,r.position.z=-40+o*4})}enable(){}disable(){}}class nt{constructor(){this.scene=new Q;const n=document.createElement("canvas");n.width=256,n.height=256;const t=n.getContext("2d"),a=t.createLinearGradient(0,0,0,n.height);a.addColorStop(0,"#6BB6FF"),a.addColorStop(1,"#002366"),t.fillStyle=a,t.fillRect(0,0,n.width,n.height);const r=new Ce(n);this.scene.background=r,this.scene.add(new ce(16777215,1.2));const o=new le(16777215,1.5);o.position.set(5,10,5),this.scene.add(o);const e=new de(16777215,1,100);e.position.set(0,0,10),this.scene.add(e),this.cloudGroup=new Te,this.scene.add(this.cloudGroup),this.scene.userData.cloudGroup=this.cloudGroup,this.cloudTextures=[],this.clouds=[],this.scene.userData.cloudTextures=[];const i=new fe;i.load("/droneye/cloud1.png",s=>{s.flipY=!1,this.cloudTextures[0]=s,this.scene.userData.cloudTextures[0]=s,this.createClouds()},void 0,s=>{console.warn("cloud1.png not found:",s)}),i.load("/droneye/cloud2.png",s=>{s.flipY=!1,this.cloudTextures[1]=s,this.scene.userData.cloudTextures[1]=s,this.createClouds()},void 0,s=>{console.warn("cloud2.png not found:",s)})}createClouds(){if(this.cloudTextures.length<2||this.clouds.length>0)return;const n=(r,o)=>r+Math.random()*(o-r),a=window.innerWidth<=768?100:300;for(let r=0;r<a;r++){const o=Math.floor(Math.random()*2),e=this.cloudTextures[o];if(!e)continue;const i=new Le({map:e,transparent:!0,opacity:n(.4,.6),depthWrite:!1}),s=new ze(i),c=e.image?e.image.width:100,l=e.image?e.image.height:80,p=c,v=l,b=n(.3,.5),m=p*b,h=v*b;s.scale.set(m,h,1);const g=window.innerWidth*.5,w=n(-g,g),x=n(-70,-60),W=n(-2500,50);s.position.set(w,x,W),this.clouds.push(s),this.cloudGroup.add(s)}console.log(`✅ Created ${this.clouds.length} sprite clouds with cloud1.png and cloud2.png`)}animate(n,t){if(!d||this.clouds.length===0)return;const a=(o,e)=>o+Math.random()*(e-o),r=80;this.clouds.forEach((o,e)=>{const s=o.position.z+r*n,c=-1e3,l=-200;let p=1;if(s<c)p=.1;else if(s<l){const m=l-c;p=.1+(s-c)/m*.9}else p=1;if(o.material&&(o.material.opacity=p),s>50?o.visible=!1:o.visible=!0,s>50){const h=window.innerWidth*.5,f=a(-h,h),g=a(-90,-70),w=a(-1500,-1400);o.position.set(f,g,w),o.visible=!0,o.material&&(o.material.opacity=.1)}else o.position.z=s}),this.cloudGroup.position.x=0,this.cloudGroup.position.y=d.position.y}enable(){}disable(){}}class st{constructor(n){this.scene=new Q,this.scene.background=new I(8900331),this.skyScene=n,this.scene.add(new ce(16777215,1.2));const t=new le(16777215,1.5);t.position.set(5,10,5),this.scene.add(t);const a=new de(16777215,1,100);a.position.set(0,0,10),this.scene.add(a);const r=new ue(1e4,1e4),e=new fe().load("https://threejs.org/examples/textures/waternormals.jpg",i=>{i.wrapS=i.wrapT=Xe});this.water=new Ve(r,{textureWidth:512,textureHeight:512,waterNormals:e,sunDirection:new T,sunColor:16777215,waterColor:7695,distortionScale:3.7,fog:!1}),this.water.rotation.x=-Math.PI/2,this.water.position.set(0,-5,0),this.scene.add(this.water),this.cloudGroup=new Te,this.scene.add(this.cloudGroup),this.scene.userData.cloudGroup=this.cloudGroup,this.cloudTextures=[],this.clouds=[],this.scene.userData.cloudTextures=[],this.loadCloudTextures()}loadCloudTextures(){const n=this.skyScene?.scene.userData.cloudTextures||[];if(n.length===0){const t=setInterval(()=>{const a=this.skyScene?.scene.userData.cloudTextures||[];a.length>0&&(this.cloudTextures=a,this.scene.userData.cloudTextures=a,this.createClouds(),clearInterval(t))},100);return}this.cloudTextures=n,this.scene.userData.cloudTextures=n,this.createClouds()}createClouds(){if(this.cloudTextures.length===0||this.clouds.length>0)return;const n=(r,o)=>r+Math.random()*(o-r),a=window.innerWidth<=768?100:300;for(let r=0;r<a;r++){const o=Math.floor(Math.random()*this.cloudTextures.length),e=this.cloudTextures[o];if(!e)continue;const i=new Le({map:e,transparent:!0,opacity:n(.4,.8),depthWrite:!1}),s=new ze(i),c=e.image?e.image.width:100,l=e.image?e.image.height:80,p=c,v=l,b=n(.3,.5),m=p*b,h=v*b;s.scale.set(m,h,1);const g=window.innerWidth*.5,w=n(-g,g),x=n(40,60),W=n(-4500,50);s.position.set(w,x,W),this.clouds.push(s),this.cloudGroup.add(s)}console.log(`✅ Created ${this.clouds.length} sprite clouds above drone (WaterScene)`)}animate(n,t){if(!d||this.clouds.length===0)return;const a=(o,e)=>o+Math.random()*(e-o),r=80;if(this.clouds.forEach((o,e)=>{const s=o.position.z+r*n,c=-1e3,l=-200;let p=1;if(s<c)p=.1;else if(s<l){const m=l-c;p=.1+(s-c)/m*.9}else p=1;if(o.material&&(o.material.opacity=p),s>50?o.visible=!1:o.visible=!0,s>50){const h=window.innerWidth*.5,f=a(-h,h),g=a(70,90),w=a(-1500,-1400);o.position.set(f,g,w),o.visible=!0,o.material&&(o.material.opacity=.1)}else o.position.z=s}),this.cloudGroup.position.x=0,this.cloudGroup.position.y=d.position.y,this.water&&this.water.material&&this.water.material.uniforms){const o=t;this.water.material.uniforms.time.value=o}}enable(){}disable(){}}function at(){M=[];const u=new ot;M.push(u.scene);const n=new nt;M.push(n.scene);const t=new st(n);M.push(t.scene),M[0].userData.sceneObject=u,M[1].userData.sceneObject=n,M[2].userData.sceneObject=t}function rt(){console.log("Loading drone model...");const u=new qe,n="/droneye/Drone.glb";console.log("Attempting to load model from:",n),u.load(n,t=>{console.log("✅ Model loaded successfully!",t),d=t.scene,console.log("✅ droneRoot set:",{droneRoot:!!d}),it(d),d.position.y=j,d.position.x=se,d.position.z=Pe,d.visible=!1,M.forEach((e,i)=>{e&&!e.children.includes(d)&&(e.add(d),console.log(`Added drone to scene ${i} during model load`))}),R&&!R.children.includes(d)&&R.add(d),console.group("📋 GLB node/mesh list");let a=0;const r=[];d.traverse(e=>{if(e.isMesh){const i=new Me().setFromObject(e),s=new T;i.getSize(s);const c=new T;i.getCenter(c),r.push({mesh:e,size:s,center:c,name:e.name||""})}}),r.forEach((e,i)=>{const s=e.mesh,c=(e.name||"").toLowerCase(),l=e.size,p=e.center,v=Math.max(l.x,l.y,l.z);console.log(`MESH [${i+1}]:`,c||"(no-name)",{name:c,size:v.toFixed(2),position:`(${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)})`}),s.material&&(Array.isArray(s.material)?s.material:[s.material]).forEach((m,h)=>{const f=c==="body",g=/rotor/i.test(c),w=c==="cube002";let x;f?(x=G.body,console.log(`Applied body color to ${c}:`,x.toString(16))):g?(x=G.rotors,console.log(`Applied rotor color to ${c}:`,x.toString(16))):w?(x=G.details,console.log(`Applied detail color to ${c}:`,x.toString(16))):(x=G.body,console.log(`Applied default body color to ${c||"unnamed"}:`,x.toString(16)))})}),d.traverse(e=>{e.isObject3D&&e.name&&!e.isMesh&&(a++,console.log(`NODE [${a}]:`,e.name,{name:e.name,type:e.type,children:e.children.length}))}),console.log(`Total: ${r.length} meshes, ${a} named nodes`),console.groupEnd();const o=/(prop|rotor|fan|blade)/i;$=[],d.traverse(e=>{if(e.isMesh&&o.test(e.name||"")){const i=e.parent&&e.parent!==d&&o.test(e.parent.name||"")?e.parent:e;$.push(i),console.log("Found rotor:",i.name,"Type:",i.type,"Parent:",i.parent?.name)}}),$.length===0&&(console.warn("⚠️ Nenašiel som vrtule podľa názvu. Dopln ich ručne podľa názvov z konzoly."),["Rotor_FL","Rotor_FR","Rotor_BL","Rotor_BR"].forEach(i=>{const s=d.getObjectByName(i);s&&$.push(s)})),$.length>0&&(console.log("✅ Rotors found:",$.map(e=>e.name||"(no-name)")),$.forEach(e=>{if(ne.set(e,e.position.clone()),e.geometry){e.geometry.computeBoundingBox();const i=e.geometry.boundingBox,s=new T;i.getCenter(s),e.geometry.translate(-s.x,-s.y,-s.z),e.position.add(s),ne.set(e,e.position.clone())}}))},t=>{if(t.lengthComputable){const a=t.loaded/t.total*100;console.log(`📥 Loading: ${a.toFixed(1)}%`)}},t=>{console.error("❌ Failed to load GLB:",t),console.error("Error details:",{message:t.message,url:n,stack:t.stack}),console.error("Make sure Drone.glb is in the public/ directory")})}function it(u){const n=new Me().setFromObject(u),t=new T;n.getSize(t);const a=new T;n.getCenter(a),u.position.sub(a);const r=Math.max(t.x,t.y,t.z);if(r>0){const i=(window.innerWidth<=768?3.5:5)/r;u.scale.setScalar(i)}}function ct(){const u=document.querySelectorAll(".scroll-text"),t=1/u.length,a=.05,r=.05,o=.15;u.forEach((e,i)=>{const s=i*t,c=(i+1)*t,l=s+a,p=l+o,v=c-r,b=e.classList.contains("scroll-text-cta");let m=0,h=100;if(b)if(y>=s)if(y<l){const f=(y-s)/(l-s);m=f,h=50*(1-f)+30}else m=1,h=30;else m=0,h=50;else if(i===0)if(y<=c)if(y<=v)m=1,h=-200-y/v*100;else{const f=(y-v)/(c-v);m=1-f,h=-300-f*50}else m=0,h=-350;else if(y>=s&&y<=c)if(y<l){const f=(y-s)/(l-s);m=f,h=150*(1-f)}else if(y<=p)m=1,h=50;else if(y<=v){const f=(y-p)/(v-p);m=1,h=50-f*350}else{const f=(y-v)/(c-v);m=1-f,h=-300-f*50}else y<s?(m=0,h=150):(m=0,h=-300);e.style.opacity=m,e.style.transform=`translateY(${h}px)`,m>.1?e.classList.add("visible"):e.classList.remove("visible")})}function Ae(){requestAnimationFrame(Ae);const u=V.getDelta();y=Math.max(0,Math.min(1,F/K)),ct();const n=Math.min(Math.floor(y*M.length),M.length-1);if(n!==P&&n<M.length){const t=P,a=F>we;d&&M[P]&&M[P].remove(d),P=n,R=M[P],ke(P);const r=K/M.length;if(a?(F=n*r,y=n/M.length):(F=(n+1)*r-1,y=(n+1)/M.length-.001),d){Pe=0;let o;P===1?t===0?o=d.position.y:o=63:P===2?o=20:o=j,d.position.y=o,P===1?t===0?Y=63:Y=63-y*5:P===2?(Y=20-y*20,Y=Math.max(Y,0)):Y=j-y*(j-q);const e=5,i=15,s=1.5;L.position.y=o+e,L.position.z=i,L.position.x=s}d&&R.add(d)}if(we=F,P===1?Y=63-y*5:P===2?(Y=20-y*20,Y=Math.max(Y,0)):Y=j-y*(j-q),d&&d.visible){if(J){const a=V.getElapsedTime()-We,r=Math.min(a/Ke,1),o=1-Math.pow(1-r,3);d.position.x=se+(oe-se)*o,r>=1&&(J=!1,d.position.x=oe,console.log("✅ Drone entrance animation complete"))}else d.position.x=oe;const t=P===2?.2:.1;d.position.y+=(Y-d.position.y)*t,d.position.z=0;for(const a of $){if(!a)continue;const r=ne.get(a);r&&(a.rotation.y+=Je*u,a.position.copy(r))}}if(d){const t=d.position.y;d.position.z;const r=3+(t-q)/(j-q)*2,o=15,e=1.5;if(L.position.y+=(t+r-L.position.y)*.05,L.position.z=o,L.position.x=e,J){const i=t-1;L.lookAt(0,i,0)}else{const i=d.position.x,s=t-1;L.lookAt(i*.5,s,0)}if(R.userData.sceneObject){const i=V.getElapsedTime();R.userData.sceneObject.animate(u,i)}}H.render(R,L)}function ke(u){const n=document.querySelector(".navbar");!n||!(window.innerWidth>1024)||(u===0||u===1?(n.style.setProperty("--navbar-text","#ffffff"),document.querySelectorAll(".nav-link").forEach(e=>{e.style.color="#ffffff"}),document.querySelectorAll(".bar").forEach(e=>{e.style.background="#ffffff"}),document.querySelectorAll(".language-option").forEach(e=>{e.classList.contains("active")||(e.style.color="#ffffff",e.style.borderColor="rgba(255, 255, 255, 0.3)")})):u===2?(n.style.setProperty("--navbar-text","#003d99"),document.querySelectorAll(".nav-link").forEach(e=>{e.style.color="#003d99"}),document.querySelectorAll(".bar").forEach(e=>{e.style.background="#003d99"}),document.querySelectorAll(".language-option").forEach(e=>{e.classList.contains("active")||(e.style.color="#003d99",e.style.borderColor="#003d99")})):(n.style.setProperty("--navbar-text","var(--footer-text)"),document.querySelectorAll(".nav-link").forEach(e=>{e.style.color=""}),document.querySelectorAll(".bar").forEach(e=>{e.style.background=""}),document.querySelectorAll(".language-option").forEach(e=>{e.style.color="",e.style.borderColor=""})))}function lt(){L.aspect=window.innerWidth/window.innerHeight,L.updateProjectionMatrix(),H.setSize(window.innerWidth,window.innerHeight)}function dt(u){ee&&(u.preventDefault(),F+=u.deltaY*.5,F=Math.max(0,Math.min(K,F)),clearTimeout(window.scrollTimeout),window.scrollTimeout=setTimeout(()=>{},150))}let ye=0,ae=0;function ut(u){ee&&(ye=u.touches[0].clientY,ae=ye)}function ft(u){if(!ee)return;u.preventDefault();const n=u.touches[0].clientY,t=ae-n;F+=t*2,F=Math.max(0,Math.min(K,F)),ae=n}function mt(u){clearTimeout(window.scrollTimeout),window.scrollTimeout=setTimeout(()=>{},150)}let re=!1;function ht(){if(!d){console.warn("Drone not loaded yet");return}ee=!0,J=!0,We=V.getElapsedTime(),d.visible=!0,console.log("🚁 Starting drone entrance animation from left")}window.startDroneEntrance=ht;document.addEventListener("DOMContentLoaded",()=>{re||(tt(),re=!0,ke(0))});
//# sourceMappingURL=dronetext-ajgC8z2T.js.map
