import{M as G,V as r,C as A,F as Le,P as Pe,a as O,b as J,c as re,W as Te,U,d as Q,S as Y,B as se,e as De,f as le,g as ze,A as ke,h as Ae,D as Re,i as _e,T as We,R as Fe,j as Be,k as qe,l as Ie,m as ee}from"./three-DHVhvH9d.js";class Ne extends G{constructor(o,e={}){super(o),this.isWater=!0;const a=this,i=e.textureWidth!==void 0?e.textureWidth:512,c=e.textureHeight!==void 0?e.textureHeight:512,q=e.clipBias!==void 0?e.clipBias:0,S=e.alpha!==void 0?e.alpha:1,I=e.time!==void 0?e.time:0,he=e.waterNormals!==void 0?e.waterNormals:null,pe=e.sunDirection!==void 0?e.sunDirection:new r(.70707,.70707,0),ge=new A(e.sunColor!==void 0?e.sunColor:16777215),we=new A(e.waterColor!==void 0?e.waterColor:8355711),K=e.eye!==void 0?e.eye:new r(0,0,0),ye=e.distortionScale!==void 0?e.distortionScale:20,xe=e.side!==void 0?e.side:Le,Se=e.fog!==void 0?e.fog:!1,b=new Pe,g=new r,M=new r,N=new r,E=new O,T=new r(0,0,-1),h=new J,L=new r,D=new r,P=new J,z=new O,l=new re,Z=new Te(i,c),k={name:"MirrorShader",uniforms:U.merge([Q.fog,Q.lights,{normalSampler:{value:null},mirrorSampler:{value:null},alpha:{value:1},time:{value:0},size:{value:1},distortionScale:{value:20},textureMatrix:{value:new O},sunColor:{value:new A(8355711)},sunDirection:{value:new r(.70707,.70707,0)},eye:{value:new r},waterColor:{value:new A(5592405)}}]),vertexShader:`
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
				}`},d=new Y({name:k.name,uniforms:U.clone(k.uniforms),vertexShader:k.vertexShader,fragmentShader:k.fragmentShader,lights:!0,side:xe,fog:Se});d.uniforms.mirrorSampler.value=Z.texture,d.uniforms.textureMatrix.value=z,d.uniforms.alpha.value=S,d.uniforms.time.value=I,d.uniforms.normalSampler.value=he,d.uniforms.sunColor.value=ge,d.uniforms.waterColor.value=we,d.uniforms.sunDirection.value=pe,d.uniforms.distortionScale.value=ye,d.uniforms.eye.value=K,a.material=d,a.onBeforeRender=function(s,be,C){if(M.setFromMatrixPosition(a.matrixWorld),N.setFromMatrixPosition(C.matrixWorld),E.extractRotation(a.matrixWorld),g.set(0,0,1),g.applyMatrix4(E),L.subVectors(M,N),L.dot(g)>0)return;L.reflect(g).negate(),L.add(M),E.extractRotation(C.matrixWorld),T.set(0,0,-1),T.applyMatrix4(E),T.add(N),D.subVectors(M,T),D.reflect(g).negate(),D.add(M),l.position.copy(L),l.up.set(0,1,0),l.up.applyMatrix4(E),l.up.reflect(g),l.lookAt(D),l.far=C.far,l.updateMatrixWorld(),l.projectionMatrix.copy(C.projectionMatrix),z.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),z.multiply(l.projectionMatrix),z.multiply(l.matrixWorldInverse),b.setFromNormalAndCoplanarPoint(g,M),b.applyMatrix4(l.matrixWorldInverse),h.set(b.normal.x,b.normal.y,b.normal.z,b.constant);const m=l.projectionMatrix;P.x=(Math.sign(h.x)+m.elements[8])/m.elements[0],P.y=(Math.sign(h.y)+m.elements[9])/m.elements[5],P.z=-1,P.w=(1+m.elements[10])/m.elements[14],h.multiplyScalar(2/h.dot(P)),m.elements[2]=h.x,m.elements[6]=h.y,m.elements[10]=h.z+1-q,m.elements[14]=h.w,K.setFromMatrixPosition(C.matrixWorld);const Me=s.getRenderTarget(),Ce=s.xr.enabled,Ee=s.shadowMap.autoUpdate;a.visible=!1,s.xr.enabled=!1,s.shadowMap.autoUpdate=!1,s.setRenderTarget(Z),s.state.buffers.depth.setMask(!0),s.autoClear===!1&&s.clear(),s.render(be,l),a.visible=!0,s.xr.enabled=Ce,s.shadowMap.autoUpdate=Ee,s.setRenderTarget(Me);const $=C.viewport;$!==void 0&&s.state.viewport($)}}}class B extends G{constructor(){const o=B.SkyShader,e=new Y({name:o.name,uniforms:U.clone(o.uniforms),vertexShader:o.vertexShader,fragmentShader:o.fragmentShader,side:se,depthWrite:!1});super(new De(1,1,1),e),this.isSky=!0}}B.SkyShader={name:"SkyShader",uniforms:{turbidity:{value:2},rayleigh:{value:1},mieCoefficient:{value:.005},mieDirectionalG:{value:.8},sunPosition:{value:new r},up:{value:new r(0,1,0)}},vertexShader:`
		uniform vec3 sunPosition;
		uniform float rayleigh;
		uniform float turbidity;
		uniform float mieCoefficient;
		uniform vec3 up;

		varying vec3 vWorldPosition;
		varying vec3 vSunDirection;
		varying float vSunfade;
		varying vec3 vBetaR;
		varying vec3 vBetaM;
		varying float vSunE;

		// constants for atmospheric scattering
		const float e = 2.71828182845904523536028747135266249775724709369995957;
		const float pi = 3.141592653589793238462643383279502884197169;

		// wavelength of used primaries, according to preetham
		const vec3 lambda = vec3( 680E-9, 550E-9, 450E-9 );
		// this pre-calcuation replaces older TotalRayleigh(vec3 lambda) function:
		// (8.0 * pow(pi, 3.0) * pow(pow(n, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * pn)) / (3.0 * N * pow(lambda, vec3(4.0)) * (6.0 - 7.0 * pn))
		const vec3 totalRayleigh = vec3( 5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5 );

		// mie stuff
		// K coefficient for the primaries
		const float v = 4.0;
		const vec3 K = vec3( 0.686, 0.678, 0.666 );
		// MieConst = pi * pow( ( 2.0 * pi ) / lambda, vec3( v - 2.0 ) ) * K
		const vec3 MieConst = vec3( 1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14 );

		// earth shadow hack
		// cutoffAngle = pi / 1.95;
		const float cutoffAngle = 1.6110731556870734;
		const float steepness = 1.5;
		const float EE = 1000.0;

		float sunIntensity( float zenithAngleCos ) {
			zenithAngleCos = clamp( zenithAngleCos, -1.0, 1.0 );
			return EE * max( 0.0, 1.0 - pow( e, -( ( cutoffAngle - acos( zenithAngleCos ) ) / steepness ) ) );
		}

		vec3 totalMie( float T ) {
			float c = ( 0.2 * T ) * 10E-18;
			return 0.434 * c * MieConst;
		}

		void main() {

			vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
			vWorldPosition = worldPosition.xyz;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			gl_Position.z = gl_Position.w; // set z to camera.far

			vSunDirection = normalize( sunPosition );

			vSunE = sunIntensity( dot( vSunDirection, up ) );

			vSunfade = 1.0 - clamp( 1.0 - exp( ( sunPosition.y / 450000.0 ) ), 0.0, 1.0 );

			float rayleighCoefficient = rayleigh - ( 1.0 * ( 1.0 - vSunfade ) );

			// extinction (absorbtion + out scattering)
			// rayleigh coefficients
			vBetaR = totalRayleigh * rayleighCoefficient;

			// mie coefficients
			vBetaM = totalMie( turbidity ) * mieCoefficient;

		}`,fragmentShader:`
		varying vec3 vWorldPosition;
		varying vec3 vSunDirection;
		varying float vSunfade;
		varying vec3 vBetaR;
		varying vec3 vBetaM;
		varying float vSunE;

		uniform float mieDirectionalG;
		uniform vec3 up;

		// constants for atmospheric scattering
		const float pi = 3.141592653589793238462643383279502884197169;

		const float n = 1.0003; // refractive index of air
		const float N = 2.545E25; // number of molecules per unit volume for air at 288.15K and 1013mb (sea level -45 celsius)

		// optical length at zenith for molecules
		const float rayleighZenithLength = 8.4E3;
		const float mieZenithLength = 1.25E3;
		// 66 arc seconds -> degrees, and the cosine of that
		const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;

		// 3.0 / ( 16.0 * pi )
		const float THREE_OVER_SIXTEENPI = 0.05968310365946075;
		// 1.0 / ( 4.0 * pi )
		const float ONE_OVER_FOURPI = 0.07957747154594767;

		float rayleighPhase( float cosTheta ) {
			return THREE_OVER_SIXTEENPI * ( 1.0 + pow( cosTheta, 2.0 ) );
		}

		float hgPhase( float cosTheta, float g ) {
			float g2 = pow( g, 2.0 );
			float inverse = 1.0 / pow( 1.0 - 2.0 * g * cosTheta + g2, 1.5 );
			return ONE_OVER_FOURPI * ( ( 1.0 - g2 ) * inverse );
		}

		void main() {

			vec3 direction = normalize( vWorldPosition - cameraPosition );

			// optical length
			// cutoff angle at 90 to avoid singularity in next formula.
			float zenithAngle = acos( max( 0.0, dot( up, direction ) ) );
			float inverse = 1.0 / ( cos( zenithAngle ) + 0.15 * pow( 93.885 - ( ( zenithAngle * 180.0 ) / pi ), -1.253 ) );
			float sR = rayleighZenithLength * inverse;
			float sM = mieZenithLength * inverse;

			// combined extinction factor
			vec3 Fex = exp( -( vBetaR * sR + vBetaM * sM ) );

			// in scattering
			float cosTheta = dot( direction, vSunDirection );

			float rPhase = rayleighPhase( cosTheta * 0.5 + 0.5 );
			vec3 betaRTheta = vBetaR * rPhase;

			float mPhase = hgPhase( cosTheta, mieDirectionalG );
			vec3 betaMTheta = vBetaM * mPhase;

			vec3 Lin = pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * ( 1.0 - Fex ), vec3( 1.5 ) );
			Lin *= mix( vec3( 1.0 ), pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * Fex, vec3( 1.0 / 2.0 ) ), clamp( pow( 1.0 - dot( up, vSunDirection ), 5.0 ), 0.0, 1.0 ) );

			// nightsky
			float theta = acos( direction.y ); // elevation --> y-axis, [-pi/2, pi/2]
			float phi = atan( direction.z, direction.x ); // azimuth --> x-axis [-pi/2, pi/2]
			vec2 uv = vec2( phi, theta ) / vec2( 2.0 * pi, pi ) + vec2( 0.5, 0.0 );
			vec3 L0 = vec3( 0.1 ) * Fex;

			// composition + solar disc
			float sundisk = smoothstep( sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta );
			L0 += ( vSunE * 19000.0 * Fex ) * sundisk;

			vec3 texColor = ( Lin + L0 ) * 0.04 + vec3( 0.0, 0.0003, 0.00075 );

			vec3 retColor = pow( texColor, vec3( 1.0 / ( 1.2 + ( 1.2 * vSunfade ) ) ) );

			gl_FragColor = vec4( retColor, 1.0 );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>

		}`};let v,f,u,V,ce=window.innerWidth/2,ue=window.innerHeight/2,n,w,R,_=0,X=200,W=!1,y,te,F,j=0,oe=performance.now(),H=60,Oe=60,ae=0,p="sk",x={};async function je(){p=localStorage.getItem("language")||"sk",await de(),me(),He()}async function de(){try{x=await(await fetch(`/src/locales/${p}.json`)).json()}catch(t){console.error("Error loading translations:",t),p!=="sk"&&(p="sk",x=await(await fetch("/src/locales/sk.json")).json())}}function me(){document.querySelectorAll("[data-i18n]").forEach(t=>{const o=t.getAttribute("data-i18n"),e=ne(x,o);e&&(t.textContent=e)}),document.querySelectorAll("[data-i18n-placeholder]").forEach(t=>{const o=t.getAttribute("data-i18n-placeholder"),e=ne(x,o);e&&(t.placeholder=e)})}function ne(t,o){return o.split(".").reduce((e,a)=>e&&e[a]!==void 0?e[a]:e&&Array.isArray(e)&&!isNaN(a)?e[parseInt(a)]:null,t)}function He(){document.querySelectorAll(".language-option").forEach(o=>{o.addEventListener("click",async e=>{e.preventDefault();const a=o.getAttribute("data-lang");a!==p&&(p=a,localStorage.setItem("language",p),await de(),me(),ie())})}),ie()}function ie(){document.querySelectorAll(".language-option").forEach(o=>{o.classList.remove("active"),o.getAttribute("data-lang")===p&&o.classList.add("active")})}document.addEventListener("DOMContentLoaded",function(){je(),Je(),et(),(window.location.pathname==="/"||window.location.pathname.endsWith("index.html")||window.location.pathname.endsWith("/"))&&(Qe(),Ue())});function Ue(){const t=document.getElementById("three-canvas");if(!t){console.warn("Three.js canvas not found");return}v=new le,f=new re(55,window.innerWidth/window.innerHeight,1,2e4),f.position.set(30,200,1e3),u=new ze({canvas:t,alpha:!0,antialias:!0}),u.setSize(window.innerWidth,window.innerHeight),u.setPixelRatio(Math.min(window.devicePixelRatio,2)),u.toneMapping=ke,u.toneMappingExposure=.5,u.shadowMap.enabled=!1,u.antialias=!1;const o=new Ae(4210752,.6);v.add(o);const e=new Re(16777215,.8);e.position.set(1,1,1),v.add(e),Ve(),document.addEventListener("mousemove",Xe,!1),window.addEventListener("resize",$e,!1),window.addEventListener("scroll",Ke,!1),document.addEventListener("wheel",Ze,!1),fe(),console.log("Three.js animation started!")}function Ve(){Ge()}function Ge(){R=new r;const t=new _e(5e4,5e4,32,32);n=new Ne(t,{textureWidth:128,textureHeight:128,waterNormals:new We().load("https://threejs.org/examples/textures/waternormals.jpg",function(S){S.wrapS=S.wrapT=Fe}),sunDirection:new r,sunColor:16777215,waterColor:0,distortionScale:.3,size:.5,fog:v.fog!==void 0}),n.rotation.x=-Math.PI/2,n.position.y=0,n.position.x=-5e3,n.position.z=0,n.userData={layer:"ocean",speed:1},v.add(n),w=new B,w.scale.setScalar(5e4),v.add(w);const o=w.material.uniforms;o.turbidity.value=10,o.rayleigh.value=2,o.mieCoefficient.value=.005,o.mieDirectionalG.value=.8;const e={elevation:2,azimuth:180},a=new Be(u),i=new le;let c;function q(){const S=ee.degToRad(90-e.elevation),I=ee.degToRad(e.azimuth);R.setFromSphericalCoords(1,S,I),w.material.uniforms.sunPosition.value.copy(R),n.material.uniforms.sunDirection.value.copy(R).normalize(),c!==void 0&&c.dispose(),i.add(w),c=a.fromScene(i),v.add(w),v.environment=c.texture}q(),Ye()}function Ye(){te=new qe(1e5,32,32),F=new Y({uniforms:{time:{value:0},resolution:{value:new Ie(window.innerWidth,window.innerHeight)}},vertexShader:`
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,fragmentShader:`
            uniform float time;
            uniform vec2 resolution;
            varying vec2 vUv;
            
            // Simple random function
            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }
            
            // Create small star dots
            float star(vec2 uv, float size) {
                float star = random(uv);
                if (star > 0.999) { // Much much fewer stars
                    return 1.0;
                }
                return 0.0;
            }
            
            void main() {
                vec2 uv = vUv;
                
                // Calculate height factor (0.0 = bottom, 1.0 = top)
                float heightFactor = uv.y;
                
                // Create gradient from sun (bottom) to space (top)
                vec3 sunColor = vec3(1.0, 0.8, 0.4); // Warm sun color
                vec3 spaceColor = vec3(0.0, 0.0, 0.0); // Black space
                
                // Smooth transition between sun and space
                vec3 baseColor = mix(sunColor, spaceColor, smoothstep(0.3, 0.8, heightFactor));
                
                // Add stars only in upper part (space area) and only distant ones
                float starField = 0.0;
                if (heightFactor > 0.7) { // Only in top 30% of space
                    // Only distant stars, no close ones
                    starField += star(uv * 30.0, 0.1) * 0.4; // Very few distant stars
                    
                    // Add subtle twinkling effect
                    float twinkle = sin(time * 1.5 + uv.x * 5.0 + uv.y * 4.0) * 0.1 + 0.9;
                    starField *= twinkle;
                }
                
                // Remove atmospheric glow to prevent blue tint on ocean
                float atmosphere = 0.0;
                
                // Combine all effects
                vec3 color = baseColor;
                color += vec3(starField); // White stars
                // No atmospheric glow to prevent blue tint
                
                gl_FragColor = vec4(color, 1.0);
            }
        `,side:se}),y=new G(te,F),y.position.y=1e3,y.position.x=0,y.position.z=0,y.userData={layer:"space",speed:1},v.add(y)}function fe(){V=requestAnimationFrame(fe);const t=performance.now();if(t-ae<1e3/Oe)return;ae=t;const e=t*.001;j++,t-oe>=1e3&&(H=j,j=0,oe=t,H<30&&n?(n.material.uniforms.distortionScale.value=Math.max(.5,n.material.uniforms.distortionScale.value-.1),n.material.uniforms.size.value=Math.max(.5,n.material.uniforms.size.value-.1)):H>50&&n&&(n.material.uniforms.distortionScale.value=Math.min(2,n.material.uniforms.distortionScale.value+.05),n.material.uniforms.size.value=Math.min(2,n.material.uniforms.size.value+.05))),n&&(n.material.uniforms.time.value+=1/60),y&&F&&(F.uniforms.time.value=e),f.position.y+=(X-f.position.y)*.1;const a=new r(0,f.position.y,f.position.z-100);f.lookAt(a),u.render(v,f)}function Xe(t){t.clientX-ce,t.clientY-ue}function Ke(t){W&&(_=window.scrollY,X=Math.max(200,200+_*2))}function Ze(t){W&&(t.preventDefault(),_+=t.deltaY*.5,X=Math.max(200,200+_*2),window.scrollBy(0,t.deltaY*.5))}function $e(){ce=window.innerWidth/2,ue=window.innerHeight/2,f.aspect=window.innerWidth/window.innerHeight,f.updateProjectionMatrix(),u.setSize(window.innerWidth,window.innerHeight)}function Je(){const t=document.querySelectorAll(".nav-link"),o=document.querySelector(".hamburger"),e=document.querySelector(".nav-menu");t.forEach(a=>{a.addEventListener("click",i=>{t.forEach(c=>c.classList.remove("active")),a.classList.add("active"),e.classList.remove("active"),o.classList.remove("active")})}),o.addEventListener("click",()=>{o.classList.toggle("active"),e.classList.toggle("active")}),document.addEventListener("click",a=>{!o.contains(a.target)&&!e.contains(a.target)&&(e.classList.remove("active"),o.classList.remove("active"))})}function Qe(){setTimeout(()=>{const t=document.getElementById("loading-screen");t&&(t.style.opacity="0",setTimeout(()=>{t.style.display="none"},300))},500)}document.querySelectorAll('a[href^="#"]').forEach(t=>{t.addEventListener("click",function(o){o.preventDefault();const e=document.querySelector(this.getAttribute("href"));e&&e.scrollIntoView({behavior:"smooth",block:"start"})})});document.querySelector(".contact-form")?.addEventListener("submit",function(t){t.preventDefault(),new FormData(this);const o=this.querySelector('input[type="text"]').value,e=this.querySelector('input[type="email"]').value,a=this.querySelector("textarea").value;if(!o||!e||!a){alert(x.contact?.form?.error||"Prosím vyplňte všetky polia.");return}const i=this.querySelector("button"),c=i.textContent;i.textContent=x.contact?.form?.sending||"Odosielam...",i.disabled=!0,setTimeout(()=>{alert(x.contact?.form?.success||"Ďakujeme za vašu správu! Čoskoro vás budeme kontaktovať."),this.reset(),i.textContent=c,i.disabled=!1},2e3)});document.getElementById("start-animation-btn")?.addEventListener("click",function(){if(!(window.location.pathname==="/"||window.location.pathname.endsWith("index.html")||window.location.pathname.endsWith("/")))return;const o=document.querySelector(".hero");o&&o.classList.add("hidden"),W||(W=!0,console.log("Animation started and scroll enabled!")),this.disabled=!0});function et(){const t=localStorage.getItem("theme")||"royal-blue";ve(t),document.querySelector(".theme-switcher")||tt()}function ve(t){document.documentElement.setAttribute("data-theme",t),localStorage.setItem("theme",t);const o=document.querySelector(".theme-switcher");if(o){const e=o.querySelector(`[data-theme="${t}"]`);e&&(o.querySelectorAll(".theme-btn").forEach(a=>a.classList.remove("active")),e.classList.add("active"))}}function tt(){const t=document.querySelector(".nav-container");if(!t)return;const o=document.createElement("div");o.className="theme-switcher",o.innerHTML=`
        <div class="theme-dropdown">
            <button class="theme-btn" data-theme="royal-blue">👑</button>
            <div class="theme-options">
                <div class="theme-option" data-theme="royal-blue">👑 Royal Blue</div>
                <div class="theme-option" data-theme="forest-green">🌲 Forest Green</div>
                <div class="theme-option" data-theme="sunset-orange">🌅 Sunset Orange</div>
                <div class="theme-option" data-theme="deep-purple">💜 Deep Purple</div>
                <div class="theme-option" data-theme="ocean-blue">🌊 Ocean Blue</div>
                <div class="theme-option" data-theme="dark">🌙 Dark</div>
                <div class="theme-option" data-theme="light">☀️ Light</div>
            </div>
        </div>
    `,t.insertBefore(o,t.firstChild);const e=o.querySelector(".theme-btn"),a=o.querySelectorAll(".theme-option");e.addEventListener("click",()=>{o.classList.toggle("active")}),a.forEach(i=>{i.addEventListener("click",()=>{const c=i.getAttribute("data-theme");ve(c),o.classList.remove("active")})}),document.addEventListener("click",i=>{o.contains(i.target)||o.classList.remove("active")})}const ot={threshold:.1,rootMargin:"0px 0px -50px 0px"},at=new IntersectionObserver(t=>{t.forEach(o=>{o.isIntersecting&&(o.target.style.opacity="1",o.target.style.transform="translateY(0)")})},ot);document.querySelectorAll(".content-card, .service-card, .project-card, .team-card, .pricing-card").forEach(t=>{t.style.opacity="0",t.style.transform="translateY(30px)",t.style.transition="opacity 0.6s ease, transform 0.6s ease",at.observe(t)});window.addEventListener("beforeunload",function(){V&&cancelAnimationFrame(V),u&&u.dispose()});
//# sourceMappingURL=main-ouD51QbY.js.map
