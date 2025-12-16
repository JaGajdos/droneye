import{E as Z,g as u,C as O,a8 as ke,ap as Ae,f as G,aq as ne,W as fe,ar as De,as as K,at as ae,al as J,au as ve,av as ze,ad as he,ac as Re,aw as We,ae as _e,D as qe,ah as Fe,i as Be,R as Oe,ax as Ne,ay as Ie,V as He,X as ie}from"./three-BjNtol_2.js";(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))n(a);new MutationObserver(a=>{for(const i of a)if(i.type==="childList")for(const d of i.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&n(d)}).observe(document,{childList:!0,subtree:!0});function e(a){const i={};return a.integrity&&(i.integrity=a.integrity),a.referrerPolicy&&(i.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?i.credentials="include":a.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(a){if(a.ep)return;a.ep=!0;const i=e(a);fetch(a.href,i)}})();class Ue extends Z{constructor(o,e={}){super(o),this.isWater=!0;const n=this,a=e.textureWidth!==void 0?e.textureWidth:512,i=e.textureHeight!==void 0?e.textureHeight:512,d=e.clipBias!==void 0?e.clipBias:0,h=e.alpha!==void 0?e.alpha:1,r=e.time!==void 0?e.time:0,g=e.waterNormals!==void 0?e.waterNormals:null,E=e.sunDirection!==void 0?e.sunDirection:new u(.70707,.70707,0),s=new O(e.sunColor!==void 0?e.sunColor:16777215),p=new O(e.waterColor!==void 0?e.waterColor:8355711),ee=e.eye!==void 0?e.eye:new u(0,0,0),be=e.distortionScale!==void 0?e.distortionScale:20,Ee=e.side!==void 0?e.side:ke,Le=e.fog!==void 0?e.fog:!1,T=new Ae,L=new u,k=new u,V=new u,z=new G,_=new u(0,0,-1),b=new ne,R=new u,q=new u,W=new ne,F=new G,f=new fe,te=new De(a,i),B={name:"MirrorShader",uniforms:K.merge([ae.fog,ae.lights,{normalSampler:{value:null},mirrorSampler:{value:null},alpha:{value:1},time:{value:0},size:{value:1},distortionScale:{value:20},textureMatrix:{value:new G},sunColor:{value:new O(8355711)},sunDirection:{value:new u(.70707,.70707,0)},eye:{value:new u},waterColor:{value:new O(5592405)}}]),vertexShader:`
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
				}`},w=new J({name:B.name,uniforms:K.clone(B.uniforms),vertexShader:B.vertexShader,fragmentShader:B.fragmentShader,lights:!0,side:Ee,fog:Le});w.uniforms.mirrorSampler.value=te.texture,w.uniforms.textureMatrix.value=F,w.uniforms.alpha.value=h,w.uniforms.time.value=r,w.uniforms.normalSampler.value=g,w.uniforms.sunColor.value=s,w.uniforms.waterColor.value=p,w.uniforms.sunDirection.value=E,w.uniforms.distortionScale.value=be,w.uniforms.eye.value=ee,n.material=w,n.onBeforeRender=function(m,Ce,A){if(k.setFromMatrixPosition(n.matrixWorld),V.setFromMatrixPosition(A.matrixWorld),z.extractRotation(n.matrixWorld),L.set(0,0,1),L.applyMatrix4(z),R.subVectors(k,V),R.dot(L)>0)return;R.reflect(L).negate(),R.add(k),z.extractRotation(A.matrixWorld),_.set(0,0,-1),_.applyMatrix4(z),_.add(V),q.subVectors(k,_),q.reflect(L).negate(),q.add(k),f.position.copy(R),f.up.set(0,1,0),f.up.applyMatrix4(z),f.up.reflect(L),f.lookAt(q),f.far=A.far,f.updateMatrixWorld(),f.projectionMatrix.copy(A.projectionMatrix),F.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),F.multiply(f.projectionMatrix),F.multiply(f.matrixWorldInverse),T.setFromNormalAndCoplanarPoint(L,k),T.applyMatrix4(f.matrixWorldInverse),b.set(T.normal.x,T.normal.y,T.normal.z,T.constant);const y=f.projectionMatrix;W.x=(Math.sign(b.x)+y.elements[8])/y.elements[0],W.y=(Math.sign(b.y)+y.elements[9])/y.elements[5],W.z=-1,W.w=(1+y.elements[10])/y.elements[14],b.multiplyScalar(2/b.dot(W)),y.elements[2]=b.x,y.elements[6]=b.y,y.elements[10]=b.z+1-d,y.elements[14]=b.w,ee.setFromMatrixPosition(A.matrixWorld);const Me=m.getRenderTarget(),Pe=m.xr.enabled,Te=m.shadowMap.autoUpdate;n.visible=!1,m.xr.enabled=!1,m.shadowMap.autoUpdate=!1,m.setRenderTarget(te),m.state.buffers.depth.setMask(!0),m.autoClear===!1&&m.clear(),m.render(Ce,f),n.visible=!0,m.xr.enabled=Pe,m.shadowMap.autoUpdate=Te,m.setRenderTarget(Me);const oe=A.viewport;oe!==void 0&&m.state.viewport(oe)}}}class j extends Z{constructor(){const o=j.SkyShader,e=new J({name:o.name,uniforms:K.clone(o.uniforms),vertexShader:o.vertexShader,fragmentShader:o.fragmentShader,side:ve,depthWrite:!1});super(new ze(1,1,1),e),this.isSky=!0}}j.SkyShader={name:"SkyShader",uniforms:{turbidity:{value:2},rayleigh:{value:1},mieCoefficient:{value:.005},mieDirectionalG:{value:.8},sunPosition:{value:new u},up:{value:new u(0,1,0)}},vertexShader:`
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

		}`};let x,S,v,$,ge=window.innerWidth/2,pe=window.innerHeight/2,l,C,N,I=0,Q=200,H=!1,M,re,U,Y=0,se=performance.now(),X=60,je=60,le=0,c="sk",P={};async function Ve(){c=localStorage.getItem("language")||"sk",document.documentElement.setAttribute("lang",c),await we(),ye(),document.documentElement.style.visibility="visible",Ge()}async function we(){try{const o=`/droneye/src/locales/${c}.json`;console.log("Loading translations from:",o);const e=await fetch(o);if(!e.ok)throw new Error(`Failed to load translations: ${e.status}`);P=await e.json(),console.log("Translations loaded successfully:",c)}catch(t){if(console.error("Error loading translations:",t),c!=="sk"){console.log("Falling back to Slovak translations"),c="sk";const e=await fetch("/droneye/src/locales/sk.json");e.ok&&(P=await e.json())}}}function ye(){console.log("Applying translations, current language:",c);let t=0;document.querySelectorAll("[data-i18n]").forEach(o=>{const e=o.getAttribute("data-i18n"),n=ce(P,e);n?(n.includes("<a ")||n.includes("<br>")||n.includes("<strong>")||n.includes("<em>")?o.innerHTML=n:o.textContent=n,t++):console.warn("Translation not found for key:",e)}),document.querySelectorAll("[data-i18n-placeholder]").forEach(o=>{const e=o.getAttribute("data-i18n-placeholder"),n=ce(P,e);n?(o.placeholder=n,t++):console.warn("Placeholder translation not found for key:",e)}),console.log("Applied",t,"translations")}function ce(t,o){return o.split(".").reduce((e,n)=>e&&e[n]!==void 0?e[n]:e&&Array.isArray(e)&&!isNaN(n)?e[parseInt(n)]:null,t)}function Ge(){const t=document.querySelectorAll(".language-option");console.log("Initializing language switcher, found options:",t.length),t.forEach(e=>{const n=e.cloneNode(!0);e.parentNode.replaceChild(n,e)}),document.querySelectorAll(".language-option").forEach(e=>{e.addEventListener("click",async n=>{n.preventDefault(),n.stopPropagation();const a=e.getAttribute("data-lang");console.log("Language option clicked:",a,"Current:",c),a!==c?(console.log("Switching language from",c,"to",a),c=a,localStorage.setItem("language",c),document.documentElement.setAttribute("lang",c),await we(),ye(),ue()):console.log("Language already set to",c)})}),ue()}function ue(){const t=document.querySelectorAll(".language-option");console.log("Updating active language option, currentLanguage:",c),t.forEach(o=>{const e=o.getAttribute("data-lang");o.classList.remove("active"),e===c&&(o.classList.add("active"),console.log("Set active class on:",e))})}document.addEventListener("DOMContentLoaded",function(){Ve(),tt(),nt(),lt(),st(),(window.location.pathname==="/"||window.location.pathname.endsWith("index.html")||window.location.pathname.endsWith("/"))&&(ot(),Ye())});function Ye(){const t=document.getElementById("three-canvas");if(!t){console.warn("Three.js canvas not found");return}x=new he,S=new fe(55,window.innerWidth/window.innerHeight,1,2e4),S.position.set(30,200,1e3),v=new Re({canvas:t,alpha:!0,antialias:!0}),v.setSize(window.innerWidth,window.innerHeight),v.setPixelRatio(Math.min(window.devicePixelRatio,2)),v.toneMapping=We,v.toneMappingExposure=.5,v.shadowMap.enabled=!1,v.antialias=!1;const o=new _e(4210752,.6);x.add(o);const e=new qe(16777215,.8);e.position.set(1,1,1),x.add(e),Xe(),document.addEventListener("mousemove",Ze,!1),window.addEventListener("resize",et,!1),window.addEventListener("scroll",Je,!1),document.addEventListener("wheel",Qe,!1),Se(),console.log("Three.js animation started!")}function Xe(){Ke()}function Ke(){N=new u;const t=new Fe(5e4,5e4,32,32);l=new Ue(t,{textureWidth:128,textureHeight:128,waterNormals:new Be().load("https://threejs.org/examples/textures/waternormals.jpg",function(h){h.wrapS=h.wrapT=Oe}),sunDirection:new u,sunColor:16777215,waterColor:0,distortionScale:.3,size:.5,fog:x.fog!==void 0}),l.rotation.x=-Math.PI/2,l.position.y=0,l.position.x=-5e3,l.position.z=0,l.userData={layer:"ocean",speed:1},x.add(l),C=new j,C.scale.setScalar(5e4),x.add(C);const o=C.material.uniforms;o.turbidity.value=10,o.rayleigh.value=2,o.mieCoefficient.value=.005,o.mieDirectionalG.value=.8;const e={elevation:2,azimuth:180},n=new Ne(v),a=new he;let i;function d(){const h=ie.degToRad(90-e.elevation),r=ie.degToRad(e.azimuth);N.setFromSphericalCoords(1,h,r),C.material.uniforms.sunPosition.value.copy(N),l.material.uniforms.sunDirection.value.copy(N).normalize(),i!==void 0&&i.dispose(),a.add(C),i=n.fromScene(a),x.add(C),x.environment=i.texture}d(),$e()}function $e(){re=new Ie(1e5,32,32),U=new J({uniforms:{time:{value:0},resolution:{value:new He(window.innerWidth,window.innerHeight)}},vertexShader:`
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
        `,side:ve}),M=new Z(re,U),M.position.y=1e3,M.position.x=0,M.position.z=0,M.userData={layer:"space",speed:1},x.add(M)}function Se(){$=requestAnimationFrame(Se);const t=performance.now();if(t-le<1e3/je)return;le=t;const e=t*.001;Y++,t-se>=1e3&&(X=Y,Y=0,se=t,X<30&&l?(l.material.uniforms.distortionScale.value=Math.max(.5,l.material.uniforms.distortionScale.value-.1),l.material.uniforms.size.value=Math.max(.5,l.material.uniforms.size.value-.1)):X>50&&l&&(l.material.uniforms.distortionScale.value=Math.min(2,l.material.uniforms.distortionScale.value+.05),l.material.uniforms.size.value=Math.min(2,l.material.uniforms.size.value+.05))),l&&(l.material.uniforms.time.value+=1/60),M&&U&&(U.uniforms.time.value=e),S.position.y+=(Q-S.position.y)*.1;const n=new u(0,S.position.y,S.position.z-100);S.lookAt(n),v.render(x,S)}function Ze(t){t.clientX-ge,t.clientY-pe}function Je(t){H&&(I=window.scrollY,Q=Math.max(200,200+I*2))}function Qe(t){H&&(t.preventDefault(),I+=t.deltaY*.5,Q=Math.max(200,200+I*2),window.scrollBy(0,t.deltaY*.5))}function et(){ge=window.innerWidth/2,pe=window.innerHeight/2,S.aspect=window.innerWidth/window.innerHeight,S.updateProjectionMatrix(),v.setSize(window.innerWidth,window.innerHeight)}function tt(){const t=document.querySelectorAll(".nav-link"),o=document.querySelector(".hamburger"),e=document.querySelector(".nav-menu"),n="/droneye/";function a(r){const g=r.getAttribute("href");if(g&&g.startsWith("/")&&!g.startsWith(n)&&!g.startsWith("//")){const E=n+g.substring(1);r.setAttribute("href",E)}}t.forEach(a);const i=document.querySelector(".logo-link");if(i){const r=i.getAttribute("href");r==="/"||r===""?i.setAttribute("href",n):a(i)}const d=document.querySelector(".hero-button-secondary");d&&a(d),document.querySelectorAll('footer a[href^="/"]').forEach(a),t.forEach(r=>{r.addEventListener("click",g=>{t.forEach(E=>E.classList.remove("active")),r.classList.add("active"),e.classList.remove("active"),o.classList.remove("active")})}),o.addEventListener("click",()=>{o.classList.toggle("active"),e.classList.toggle("active")}),document.addEventListener("click",r=>{!o.contains(r.target)&&!e.contains(r.target)&&(e.classList.remove("active"),o.classList.remove("active"))})}function ot(){setTimeout(()=>{const t=document.getElementById("loading-screen");t&&(t.style.opacity="0",setTimeout(()=>{t.style.display="none"},300))},500)}document.querySelectorAll('a[href^="#"]').forEach(t=>{t.addEventListener("click",function(o){o.preventDefault();const e=document.querySelector(this.getAttribute("href"));e&&e.scrollIntoView({behavior:"smooth",block:"start"})})});document.querySelector(".contact-form")?.addEventListener("submit",function(t){t.preventDefault(),new FormData(this);const o=this.querySelector('input[type="text"]').value,e=this.querySelector('input[type="email"]').value,n=this.querySelector("textarea").value;if(!o||!e||!n){alert(P.contact?.form?.error||"Prosím vyplňte všetky polia.");return}const a=this.querySelector("button"),i=a.textContent;a.textContent=P.contact?.form?.sending||"Odosielam...",a.disabled=!0,setTimeout(()=>{alert(P.contact?.form?.success||"Ďakujeme za vašu správu! Čoskoro vás budeme kontaktovať."),this.reset(),a.textContent=i,a.disabled=!1},2e3)});document.getElementById("start-animation-btn")?.addEventListener("click",function(){if(!(window.location.pathname==="/"||window.location.pathname.endsWith("index.html")||window.location.pathname.endsWith("/")))return;const o=document.querySelector(".hero");o&&o.classList.add("hidden"),H||(H=!0,console.log("Animation started and scroll enabled!")),this.disabled=!0});function nt(){const t=localStorage.getItem("theme")||"royal-blue";xe(t),document.querySelector(".theme-switcher")||at()}function xe(t){document.documentElement.setAttribute("data-theme",t),localStorage.setItem("theme",t);const o=document.querySelector(".theme-switcher");if(o){const e=o.querySelector(`[data-theme="${t}"]`);e&&(o.querySelectorAll(".theme-btn").forEach(n=>n.classList.remove("active")),e.classList.add("active"))}}function at(){const t=document.querySelector(".nav-container");if(!t)return;const o=document.createElement("div");o.className="theme-switcher",o.innerHTML=`
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
    `,t.insertBefore(o,t.firstChild);const e=o.querySelector(".theme-btn"),n=o.querySelectorAll(".theme-option");e.addEventListener("click",()=>{o.classList.toggle("active")}),n.forEach(a=>{a.addEventListener("click",()=>{const i=a.getAttribute("data-theme");xe(i),o.classList.remove("active")})}),document.addEventListener("click",a=>{o.contains(a.target)||o.classList.remove("active")})}const it={threshold:.1,rootMargin:"0px 0px -50px 0px"},rt=new IntersectionObserver(t=>{t.forEach(o=>{o.isIntersecting&&(o.target.style.opacity="1",o.target.style.transform="translateY(0)")})},it);document.querySelectorAll(".content-card, .service-card, .project-card, .team-card, .pricing-card").forEach(t=>{t.style.opacity="0",t.style.transform="translateY(30px)",t.style.transition="opacity 0.6s ease, transform 0.6s ease",rt.observe(t)});function st(){const t=document.querySelector(".services-carousel");if(!t)return;const o=t.querySelectorAll(".carousel-slide"),e=t.querySelector(".carousel-arrow-prev"),n=t.querySelector(".carousel-arrow-next"),a=t.querySelectorAll(".carousel-indicator"),i=t.querySelectorAll(".carousel-tab");let d=0;const h=o.length;function r(s){o.forEach(p=>p.classList.remove("active")),a.forEach(p=>p.classList.remove("active")),i.forEach(p=>p.classList.remove("active")),o[s]&&o[s].classList.add("active"),a[s]&&a[s].classList.add("active"),i[s]&&i[s].classList.add("active"),d=s}function g(){const s=(d+1)%h;r(s)}function E(){const s=(d-1+h)%h;r(s)}n&&n.addEventListener("click",g),e&&e.addEventListener("click",E),a.forEach((s,p)=>{s.addEventListener("click",()=>{r(p)})}),i.forEach((s,p)=>{s.addEventListener("click",()=>{r(p)})}),document.addEventListener("keydown",s=>{t.closest(".page.active")&&(s.key==="ArrowLeft"?E():s.key==="ArrowRight"&&g())}),r(0)}function lt(){const t=document.querySelectorAll(".team-card");if(t.length===0)return;(window.matchMedia("(max-width: 1024px)").matches||"ontouchstart"in window)&&(t.forEach(e=>{e.addEventListener("click",n=>{n.preventDefault(),n.stopPropagation();const a=e.classList.contains("active");t.forEach(i=>{i.classList.remove("active")}),a||e.classList.add("active")})}),document.addEventListener("click",e=>{let n=!1;t.forEach(a=>{a.contains(e.target)&&(n=!0)}),n||t.forEach(a=>{a.classList.remove("active")})}))}let de=0,ct=150,D=null;function me(){if(D=document.querySelector(".navbar"),!D)return;let t;window.addEventListener("scroll",()=>{const o=window.pageYOffset||document.documentElement.scrollTop,e=o-de;clearTimeout(t),o>50?D.style.background="var(--primary-color)":D.style.background="transparent",Math.abs(e)>5&&(e>0&&o>ct?D.style.transform="translateY(-100%)":e<0&&(D.style.transform="translateY(0)")),de=o},{passive:!0})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",me):me();window.addEventListener("beforeunload",function(){$&&cancelAnimationFrame($),v&&v.dispose()});
//# sourceMappingURL=main-BYUbE7iO.js.map
