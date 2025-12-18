import{E as ae,g as d,C as U,a8 as Ne,ap as Oe,f as $,aq as de,W as Ee,ar as He,as as ee,at as me,al as ie,au as Ce,av as Ue,ad as Me,ac as je,aw as Ge,ae as Ve,D as Ye,ah as Xe,i as Ke,R as $e,ax as Ze,ay as Je,V as Qe,X as fe}from"./three-BjNtol_2.js";(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))a(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const u of i.addedNodes)u.tagName==="LINK"&&u.rel==="modulepreload"&&a(u)}).observe(document,{childList:!0,subtree:!0});function e(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function a(n){if(n.ep)return;n.ep=!0;const i=e(n);fetch(n.href,i)}})();class et extends ae{constructor(o,e={}){super(o),this.isWater=!0;const a=this,n=e.textureWidth!==void 0?e.textureWidth:512,i=e.textureHeight!==void 0?e.textureHeight:512,u=e.clipBias!==void 0?e.clipBias:0,s=e.alpha!==void 0?e.alpha:1,r=e.time!==void 0?e.time:0,v=e.waterNormals!==void 0?e.waterNormals:null,y=e.sunDirection!==void 0?e.sunDirection:new d(.70707,.70707,0),C=new U(e.sunColor!==void 0?e.sunColor:16777215),R=new U(e.waterColor!==void 0?e.waterColor:8355711),le=e.eye!==void 0?e.eye:new d(0,0,0),ze=e.distortionScale!==void 0?e.distortionScale:20,Re=e.side!==void 0?e.side:Ne,We=e.fog!==void 0?e.fog:!1,T=new Oe,M=new d,D=new d,K=new d,W=new $,I=new d(0,0,-1),b=new de,B=new d,N=new d,_=new de,O=new $,h=new Ee,ce=new He(n,i),H={name:"MirrorShader",uniforms:ee.merge([me.fog,me.lights,{normalSampler:{value:null},mirrorSampler:{value:null},alpha:{value:1},time:{value:0},size:{value:1},distortionScale:{value:20},textureMatrix:{value:new $},sunColor:{value:new U(8355711)},sunDirection:{value:new d(.70707,.70707,0)},eye:{value:new d},waterColor:{value:new U(5592405)}}]),vertexShader:`
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
				}`},p=new ie({name:H.name,uniforms:ee.clone(H.uniforms),vertexShader:H.vertexShader,fragmentShader:H.fragmentShader,lights:!0,side:Re,fog:We});p.uniforms.mirrorSampler.value=ce.texture,p.uniforms.textureMatrix.value=O,p.uniforms.alpha.value=s,p.uniforms.time.value=r,p.uniforms.normalSampler.value=v,p.uniforms.sunColor.value=C,p.uniforms.waterColor.value=R,p.uniforms.sunDirection.value=y,p.uniforms.distortionScale.value=ze,p.uniforms.eye.value=le,a.material=p,a.onBeforeRender=function(m,Be,q){if(D.setFromMatrixPosition(a.matrixWorld),K.setFromMatrixPosition(q.matrixWorld),W.extractRotation(a.matrixWorld),M.set(0,0,1),M.applyMatrix4(W),B.subVectors(D,K),B.dot(M)>0)return;B.reflect(M).negate(),B.add(D),W.extractRotation(q.matrixWorld),I.set(0,0,-1),I.applyMatrix4(W),I.add(K),N.subVectors(D,I),N.reflect(M).negate(),N.add(D),h.position.copy(B),h.up.set(0,1,0),h.up.applyMatrix4(W),h.up.reflect(M),h.lookAt(N),h.far=q.far,h.updateMatrixWorld(),h.projectionMatrix.copy(q.projectionMatrix),O.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),O.multiply(h.projectionMatrix),O.multiply(h.matrixWorldInverse),T.setFromNormalAndCoplanarPoint(M,D),T.applyMatrix4(h.matrixWorldInverse),b.set(T.normal.x,T.normal.y,T.normal.z,T.constant);const w=h.projectionMatrix;_.x=(Math.sign(b.x)+w.elements[8])/w.elements[0],_.y=(Math.sign(b.y)+w.elements[9])/w.elements[5],_.z=-1,_.w=(1+w.elements[10])/w.elements[14],b.multiplyScalar(2/b.dot(_)),w.elements[2]=b.x,w.elements[6]=b.y,w.elements[10]=b.z+1-u,w.elements[14]=b.w,le.setFromMatrixPosition(q.matrixWorld);const _e=m.getRenderTarget(),Fe=m.xr.enabled,Ie=m.shadowMap.autoUpdate;a.visible=!1,m.xr.enabled=!1,m.shadowMap.autoUpdate=!1,m.setRenderTarget(ce),m.state.buffers.depth.setMask(!0),m.autoClear===!1&&m.clear(),m.render(Be,h),a.visible=!0,m.xr.enabled=Fe,m.shadowMap.autoUpdate=Ie,m.setRenderTarget(_e);const ue=q.viewport;ue!==void 0&&m.state.viewport(ue)}}}class X extends ae{constructor(){const o=X.SkyShader,e=new ie({name:o.name,uniforms:ee.clone(o.uniforms),vertexShader:o.vertexShader,fragmentShader:o.fragmentShader,side:Ce,depthWrite:!1});super(new Ue(1,1,1),e),this.isSky=!0}}X.SkyShader={name:"SkyShader",uniforms:{turbidity:{value:2},rayleigh:{value:1},mieCoefficient:{value:.005},mieDirectionalG:{value:.8},sunPosition:{value:new d},up:{value:new d(0,1,0)}},vertexShader:`
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

		}`};let S,x,g,te,Pe=window.innerWidth/2,ke=window.innerHeight/2,l,P,j,G=0,re=200,V=!1,k,ve,Y,Z=0,he=performance.now(),J=60,tt=60,ge=0,c="sk",A={};async function ot(){c=localStorage.getItem("language")||"sk",document.documentElement.setAttribute("lang",c),await Ae(),Te(),document.documentElement.style.visibility="visible",nt()}async function Ae(){try{const o=`/droneye/src/locales/${c}.json`;console.log("Loading translations from:",o);const e=await fetch(o);if(!e.ok)throw new Error(`Failed to load translations: ${e.status}`);A=await e.json(),console.log("Translations loaded successfully:",c)}catch(t){if(console.error("Error loading translations:",t),c!=="sk"){console.log("Falling back to Slovak translations"),c="sk";const e=await fetch("/droneye/src/locales/sk.json");e.ok&&(A=await e.json())}}}function Te(){console.log("Applying translations, current language:",c);let t=0;document.querySelectorAll("[data-i18n]").forEach(o=>{const e=o.getAttribute("data-i18n"),a=pe(A,e);a?(a.includes("<a ")||a.includes("<br>")||a.includes("<strong>")||a.includes("<em>")?o.innerHTML=a:o.textContent=a,t++):console.warn("Translation not found for key:",e)}),document.querySelectorAll("[data-i18n-placeholder]").forEach(o=>{const e=o.getAttribute("data-i18n-placeholder"),a=pe(A,e);a?(o.placeholder=a,t++):console.warn("Placeholder translation not found for key:",e)}),console.log("Applied",t,"translations")}function pe(t,o){return o.split(".").reduce((e,a)=>e&&e[a]!==void 0?e[a]:e&&Array.isArray(e)&&!isNaN(a)?e[parseInt(a)]:null,t)}function nt(){const t=document.querySelectorAll(".language-option");console.log("Initializing language switcher, found options:",t.length),t.forEach(e=>{const a=e.cloneNode(!0);e.parentNode.replaceChild(a,e)}),document.querySelectorAll(".language-option").forEach(e=>{e.addEventListener("click",async a=>{a.preventDefault(),a.stopPropagation();const n=e.getAttribute("data-lang");console.log("Language option clicked:",n,"Current:",c),n!==c?(console.log("Switching language from",c,"to",n),c=n,localStorage.setItem("language",c),document.documentElement.setAttribute("lang",c),await Ae(),Te(),ye()):console.log("Language already set to",c)})}),ye()}function ye(){const t=document.querySelectorAll(".language-option");console.log("Updating active language option, currentLanguage:",c),t.forEach(o=>{const e=o.getAttribute("data-lang");o.classList.remove("active"),e===c&&(o.classList.add("active"),console.log("Set active class on:",e))})}document.addEventListener("DOMContentLoaded",function(){ot(),mt(),vt(),wt(),yt(),(window.location.pathname==="/"||window.location.pathname.endsWith("index.html")||window.location.pathname.endsWith("/"))&&(ft(),at())});function at(){const t=document.getElementById("three-canvas");if(!t){console.warn("Three.js canvas not found");return}S=new Me,x=new Ee(55,window.innerWidth/window.innerHeight,1,2e4),x.position.set(30,200,1e3),g=new je({canvas:t,alpha:!0,antialias:!0}),g.setSize(window.innerWidth,window.innerHeight),g.setPixelRatio(Math.min(window.devicePixelRatio,2)),g.toneMapping=Ge,g.toneMappingExposure=.5,g.shadowMap.enabled=!1,g.antialias=!1;const o=new Ve(4210752,.6);S.add(o);const e=new Ye(16777215,.8);e.position.set(1,1,1),S.add(e),it(),document.addEventListener("mousemove",lt,!1),window.addEventListener("resize",dt,!1),window.addEventListener("scroll",ct,!1),document.addEventListener("wheel",ut,!1),De(),console.log("Three.js animation started!")}function it(){rt()}function rt(){j=new d;const t=new Xe(5e4,5e4,32,32);l=new et(t,{textureWidth:128,textureHeight:128,waterNormals:new Ke().load("https://threejs.org/examples/textures/waternormals.jpg",function(s){s.wrapS=s.wrapT=$e}),sunDirection:new d,sunColor:16777215,waterColor:0,distortionScale:.3,size:.5,fog:S.fog!==void 0}),l.rotation.x=-Math.PI/2,l.position.y=0,l.position.x=-5e3,l.position.z=0,l.userData={layer:"ocean",speed:1},S.add(l),P=new X,P.scale.setScalar(5e4),S.add(P);const o=P.material.uniforms;o.turbidity.value=10,o.rayleigh.value=2,o.mieCoefficient.value=.005,o.mieDirectionalG.value=.8;const e={elevation:2,azimuth:180},a=new Ze(g),n=new Me;let i;function u(){const s=fe.degToRad(90-e.elevation),r=fe.degToRad(e.azimuth);j.setFromSphericalCoords(1,s,r),P.material.uniforms.sunPosition.value.copy(j),l.material.uniforms.sunDirection.value.copy(j).normalize(),i!==void 0&&i.dispose(),n.add(P),i=a.fromScene(n),S.add(P),S.environment=i.texture}u(),st()}function st(){ve=new Je(1e5,32,32),Y=new ie({uniforms:{time:{value:0},resolution:{value:new Qe(window.innerWidth,window.innerHeight)}},vertexShader:`
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
        `,side:Ce}),k=new ae(ve,Y),k.position.y=1e3,k.position.x=0,k.position.z=0,k.userData={layer:"space",speed:1},S.add(k)}function De(){te=requestAnimationFrame(De);const t=performance.now();if(t-ge<1e3/tt)return;ge=t;const e=t*.001;Z++,t-he>=1e3&&(J=Z,Z=0,he=t,J<30&&l?(l.material.uniforms.distortionScale.value=Math.max(.5,l.material.uniforms.distortionScale.value-.1),l.material.uniforms.size.value=Math.max(.5,l.material.uniforms.size.value-.1)):J>50&&l&&(l.material.uniforms.distortionScale.value=Math.min(2,l.material.uniforms.distortionScale.value+.05),l.material.uniforms.size.value=Math.min(2,l.material.uniforms.size.value+.05))),l&&(l.material.uniforms.time.value+=1/60),k&&Y&&(Y.uniforms.time.value=e),x.position.y+=(re-x.position.y)*.1;const a=new d(0,x.position.y,x.position.z-100);x.lookAt(a),g.render(S,x)}function lt(t){t.clientX-Pe,t.clientY-ke}function ct(t){V&&(G=window.scrollY,re=Math.max(200,200+G*2))}function ut(t){V&&(t.preventDefault(),G+=t.deltaY*.5,re=Math.max(200,200+G*2),window.scrollBy(0,t.deltaY*.5))}function dt(){Pe=window.innerWidth/2,ke=window.innerHeight/2,x.aspect=window.innerWidth/window.innerHeight,x.updateProjectionMatrix(),g.setSize(window.innerWidth,window.innerHeight)}function mt(){const t=document.querySelectorAll(".nav-link"),o=document.querySelector(".hamburger"),e=document.querySelector(".nav-menu"),a="/droneye/";function n(r){const v=r.getAttribute("href");if(v&&v.startsWith("/")&&!v.startsWith(a)&&!v.startsWith("//")){const y=a+v.substring(1);r.setAttribute("href",y)}}t.forEach(n);const i=document.querySelector(".logo-link");if(i){const r=i.getAttribute("href");r==="/"||r===""?i.setAttribute("href",a):n(i)}const u=document.querySelector(".hero-button-secondary");u&&n(u),document.querySelectorAll('footer a[href^="/"]').forEach(n),t.forEach(r=>{r.addEventListener("click",v=>{t.forEach(y=>y.classList.remove("active")),r.classList.add("active"),e.classList.remove("active"),o.classList.remove("active")})}),o.addEventListener("click",()=>{o.classList.toggle("active"),e.classList.toggle("active")}),document.addEventListener("click",r=>{!o.contains(r.target)&&!e.contains(r.target)&&(e.classList.remove("active"),o.classList.remove("active"))})}function ft(){setTimeout(()=>{const t=document.getElementById("loading-screen");t&&(t.style.opacity="0",setTimeout(()=>{t.style.display="none"},300))},500)}document.querySelectorAll('a[href^="#"]').forEach(t=>{t.addEventListener("click",function(o){o.preventDefault();const e=document.querySelector(this.getAttribute("href"));e&&e.scrollIntoView({behavior:"smooth",block:"start"})})});document.querySelector(".contact-form")?.addEventListener("submit",function(t){t.preventDefault(),new FormData(this);const o=this.querySelector('input[type="text"]').value,e=this.querySelector('input[type="email"]').value,a=this.querySelector("textarea").value;if(!o||!e||!a){alert(A.contact?.form?.error||"Prosím vyplňte všetky polia.");return}const n=this.querySelector("button"),i=n.textContent;n.textContent=A.contact?.form?.sending||"Odosielam...",n.disabled=!0,setTimeout(()=>{alert(A.contact?.form?.success||"Ďakujeme za vašu správu! Čoskoro vás budeme kontaktovať."),this.reset(),n.textContent=i,n.disabled=!1},2e3)});document.getElementById("start-animation-btn")?.addEventListener("click",function(){if(!(window.location.pathname==="/"||window.location.pathname.endsWith("index.html")||window.location.pathname.endsWith("/")))return;const o=document.querySelector(".hero");o&&o.classList.add("hidden"),V||(V=!0,console.log("Animation started and scroll enabled!")),this.disabled=!0});function vt(){const t=localStorage.getItem("theme")||"royal-blue";qe(t),document.querySelector(".theme-switcher")||ht()}function qe(t){document.documentElement.setAttribute("data-theme",t),localStorage.setItem("theme",t);const o=document.querySelector(".theme-switcher");if(o){const e=o.querySelector(`[data-theme="${t}"]`);e&&(o.querySelectorAll(".theme-btn").forEach(a=>a.classList.remove("active")),e.classList.add("active"))}}function ht(){const t=document.querySelector(".nav-container");if(!t)return;const o=document.createElement("div");o.className="theme-switcher",o.innerHTML=`
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
    `,t.insertBefore(o,t.firstChild);const e=o.querySelector(".theme-btn"),a=o.querySelectorAll(".theme-option");e.addEventListener("click",()=>{o.classList.toggle("active")}),a.forEach(n=>{n.addEventListener("click",()=>{const i=n.getAttribute("data-theme");qe(i),o.classList.remove("active")})}),document.addEventListener("click",n=>{o.contains(n.target)||o.classList.remove("active")})}const gt={threshold:.1,rootMargin:"0px 0px -50px 0px"},pt=new IntersectionObserver(t=>{t.forEach(o=>{o.isIntersecting&&(o.target.style.opacity="1",o.target.style.transform="translateY(0)")})},gt);document.querySelectorAll(".content-card, .service-card, .project-card, .team-card, .pricing-card").forEach(t=>{t.style.opacity="0",t.style.transform="translateY(30px)",t.style.transition="opacity 0.6s ease, transform 0.6s ease",pt.observe(t)});function yt(){const t=document.querySelector(".services-carousel");if(!t)return;const o=t.querySelectorAll(".carousel-slide"),e=t.querySelectorAll(".carousel-tab");let a=0;const n=o.length;function i(s){o.forEach(r=>r.classList.remove("active")),e.forEach(r=>r.classList.remove("active")),o[s]&&o[s].classList.add("active"),e[s]&&e[s].classList.add("active"),a=s,u()}function u(){const s=t.querySelector(".carousel-slide.active");if(!s)return;const r=s.querySelector(".service-card-carousel");if(!r)return;const v=r.querySelector(".carousel-arrow-prev"),y=r.querySelector(".carousel-arrow-next");if(v){const C=v.cloneNode(!0);v.parentNode.replaceChild(C,v),C.addEventListener("click",()=>{const R=(a-1+n)%n;i(R)})}if(y){const C=y.cloneNode(!0);y.parentNode.replaceChild(C,y),C.addEventListener("click",()=>{const R=(a+1)%n;i(R)})}}e.forEach((s,r)=>{s.addEventListener("click",()=>{i(r)})}),document.addEventListener("keydown",s=>{if(t.closest(".page.active")){if(s.key==="ArrowLeft"){const r=(a-1+n)%n;i(r)}else if(s.key==="ArrowRight"){const r=(a+1)%n;i(r)}}}),i(0)}function wt(){const t=document.querySelectorAll(".team-card");if(t.length===0)return;(window.matchMedia("(max-width: 1024px)").matches||"ontouchstart"in window)&&(t.forEach(e=>{e.addEventListener("click",a=>{a.preventDefault(),a.stopPropagation();const n=e.classList.contains("active");t.forEach(i=>{i.classList.remove("active")}),n||e.classList.add("active")})}),document.addEventListener("click",e=>{let a=!1;t.forEach(n=>{n.contains(e.target)&&(a=!0)}),a||t.forEach(n=>{n.classList.remove("active")})}))}let we=0,xt=150,z=null;function xe(){if(z=document.querySelector(".navbar"),!z)return;let t;window.addEventListener("scroll",()=>{const o=window.pageYOffset||document.documentElement.scrollTop,e=o-we;clearTimeout(t),o>50?z.style.background="var(--primary-color)":z.style.background="transparent",Math.abs(e)>5&&(e>0&&o>xt?z.style.transform="translateY(-100%)":e<0&&(z.style.transform="translateY(0)")),we=o},{passive:!0})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",xe):xe();let f=[],E=0,L=null,F=null,oe=null,ne=null;function Se(){const t=document.querySelectorAll(".photo-item[data-gallery]");if(L=document.getElementById("photo-lightbox"),F=document.getElementById("lightbox-image"),oe=document.getElementById("lightbox-current"),ne=document.getElementById("lightbox-total"),!L||!F)return;const o=document.querySelector(".photo-lightbox-close"),e=document.querySelector(".photo-lightbox-prev"),a=document.querySelector(".photo-lightbox-next");t.forEach(n=>{n.addEventListener("click",i=>{i.preventDefault();const u=n.querySelectorAll(".photo-gallery-images img");u.length!==0&&(f=Array.from(u).map(s=>({src:s.src,alt:s.alt})),E=0,St())})}),o&&o.addEventListener("click",Q),L.addEventListener("click",n=>{n.target===L&&Q()}),e&&e.addEventListener("click",n=>{n.stopPropagation(),be()}),a&&a.addEventListener("click",n=>{n.stopPropagation(),Le()}),document.addEventListener("keydown",n=>{L.classList.contains("active")&&(n.key==="Escape"?Q():n.key==="ArrowLeft"?be():n.key==="ArrowRight"&&Le())})}function St(){if(!L||f.length===0)return;const t=document.querySelector(".navbar");t&&(t.style.transform="translateY(-100%)"),L.classList.add("active"),document.body.style.overflow="hidden",se()}function Q(){if(!L)return;const t=document.querySelector(".navbar");t&&(t.style.transform="translateY(0)"),L.classList.remove("active"),document.body.style.overflow="",f=[],E=0}function se(){if(!F||!oe||!ne||f.length===0)return;const t=f[E];F.src=t.src,F.alt=t.alt,oe.textContent=E+1,ne.textContent=f.length;const o=document.querySelector(".photo-lightbox-prev"),e=document.querySelector(".photo-lightbox-next");o&&(o.style.display=f.length>1?"flex":"none"),e&&(e.style.display=f.length>1?"flex":"none");const a=document.querySelector(".photo-lightbox-counter");a&&(a.style.display=f.length>1?"block":"none")}function be(){f.length!==0&&(E=(E-1+f.length)%f.length,se())}function Le(){f.length!==0&&(E=(E+1)%f.length,se())}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Se):Se();window.addEventListener("beforeunload",function(){te&&cancelAnimationFrame(te),g&&g.dispose()});
//# sourceMappingURL=main-Dq7i0ieH.js.map
