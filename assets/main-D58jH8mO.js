import{M as $,V as c,C as B,F as ke,P as Ae,a as j,b as te,c as de,W as De,U as Y,d as oe,S as K,B as me,e as ze,f as fe,g as Re,A as We,h as _e,D as Fe,i as Be,T as qe,R as Ne,j as Oe,k as Ie,l as He,m as ne}from"./three-BCRiq4VL.js";class Ue extends ${constructor(t,e={}){super(t),this.isWater=!0;const n=this,a=e.textureWidth!==void 0?e.textureWidth:512,s=e.textureHeight!==void 0?e.textureHeight:512,C=e.clipBias!==void 0?e.clipBias:0,y=e.alpha!==void 0?e.alpha:1,l=e.time!==void 0?e.time:0,w=e.waterNormals!==void 0?e.waterNormals:null,k=e.sunDirection!==void 0?e.sunDirection:new c(.70707,.70707,0),xe=new B(e.sunColor!==void 0?e.sunColor:16777215),Se=new B(e.waterColor!==void 0?e.waterColor:8355711),J=e.eye!==void 0?e.eye:new c(0,0,0),be=e.distortionScale!==void 0?e.distortionScale:20,Ee=e.side!==void 0?e.side:ke,Ce=e.fog!==void 0?e.fog:!1,M=new Ae,x=new c,L=new c,U=new c,A=new j,R=new c(0,0,-1),p=new te,D=new c,W=new c,z=new te,_=new j,d=new de,Q=new De(a,s),F={name:"MirrorShader",uniforms:Y.merge([oe.fog,oe.lights,{normalSampler:{value:null},mirrorSampler:{value:null},alpha:{value:1},time:{value:0},size:{value:1},distortionScale:{value:20},textureMatrix:{value:new j},sunColor:{value:new B(8355711)},sunDirection:{value:new c(.70707,.70707,0)},eye:{value:new c},waterColor:{value:new B(5592405)}}]),vertexShader:`
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
				}`},f=new K({name:F.name,uniforms:Y.clone(F.uniforms),vertexShader:F.vertexShader,fragmentShader:F.fragmentShader,lights:!0,side:Ee,fog:Ce});f.uniforms.mirrorSampler.value=Q.texture,f.uniforms.textureMatrix.value=_,f.uniforms.alpha.value=y,f.uniforms.time.value=l,f.uniforms.normalSampler.value=w,f.uniforms.sunColor.value=xe,f.uniforms.waterColor.value=Se,f.uniforms.sunDirection.value=k,f.uniforms.distortionScale.value=be,f.uniforms.eye.value=J,n.material=f,n.onBeforeRender=function(u,Me,T){if(L.setFromMatrixPosition(n.matrixWorld),U.setFromMatrixPosition(T.matrixWorld),A.extractRotation(n.matrixWorld),x.set(0,0,1),x.applyMatrix4(A),D.subVectors(L,U),D.dot(x)>0)return;D.reflect(x).negate(),D.add(L),A.extractRotation(T.matrixWorld),R.set(0,0,-1),R.applyMatrix4(A),R.add(U),W.subVectors(L,R),W.reflect(x).negate(),W.add(L),d.position.copy(D),d.up.set(0,1,0),d.up.applyMatrix4(A),d.up.reflect(x),d.lookAt(W),d.far=T.far,d.updateMatrixWorld(),d.projectionMatrix.copy(T.projectionMatrix),_.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),_.multiply(d.projectionMatrix),_.multiply(d.matrixWorldInverse),M.setFromNormalAndCoplanarPoint(x,L),M.applyMatrix4(d.matrixWorldInverse),p.set(M.normal.x,M.normal.y,M.normal.z,M.constant);const v=d.projectionMatrix;z.x=(Math.sign(p.x)+v.elements[8])/v.elements[0],z.y=(Math.sign(p.y)+v.elements[9])/v.elements[5],z.z=-1,z.w=(1+v.elements[10])/v.elements[14],p.multiplyScalar(2/p.dot(z)),v.elements[2]=p.x,v.elements[6]=p.y,v.elements[10]=p.z+1-C,v.elements[14]=p.w,J.setFromMatrixPosition(T.matrixWorld);const Le=u.getRenderTarget(),Te=u.xr.enabled,Pe=u.shadowMap.autoUpdate;n.visible=!1,u.xr.enabled=!1,u.shadowMap.autoUpdate=!1,u.setRenderTarget(Q),u.state.buffers.depth.setMask(!0),u.autoClear===!1&&u.clear(),u.render(Me,d),n.visible=!0,u.xr.enabled=Te,u.shadowMap.autoUpdate=Pe,u.setRenderTarget(Le);const ee=T.viewport;ee!==void 0&&u.state.viewport(ee)}}}class H extends ${constructor(){const t=H.SkyShader,e=new K({name:t.name,uniforms:Y.clone(t.uniforms),vertexShader:t.vertexShader,fragmentShader:t.fragmentShader,side:me,depthWrite:!1});super(new ze(1,1,1),e),this.isSky=!0}}H.SkyShader={name:"SkyShader",uniforms:{turbidity:{value:2},rayleigh:{value:1},mieCoefficient:{value:.005},mieDirectionalG:{value:.8},sunPosition:{value:new c},up:{value:new c(0,1,0)}},vertexShader:`
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

		}`};let g,h,m,X,ve=window.innerWidth/2,he=window.innerHeight/2,i,S,q,N=0,Z=200,O=!1,b,ae,I,V=0,ie=performance.now(),G=60,je=60,re=0,r="sk",E={};async function Ve(){r=localStorage.getItem("language")||"sk",document.documentElement.setAttribute("lang",r),await ge(),pe(),document.documentElement.style.visibility="visible",Ge()}async function ge(){try{const t=`/droneye/src/locales/${r}.json`;console.log("Loading translations from:",t);const e=await fetch(t);if(!e.ok)throw new Error(`Failed to load translations: ${e.status}`);E=await e.json(),console.log("Translations loaded successfully:",r)}catch(o){if(console.error("Error loading translations:",o),r!=="sk"){console.log("Falling back to Slovak translations"),r="sk";const e=await fetch("/droneye/src/locales/sk.json");e.ok&&(E=await e.json())}}}function pe(){console.log("Applying translations, current language:",r);let o=0;document.querySelectorAll("[data-i18n]").forEach(t=>{const e=t.getAttribute("data-i18n"),n=se(E,e);n?(t.textContent=n,o++):console.warn("Translation not found for key:",e)}),document.querySelectorAll("[data-i18n-placeholder]").forEach(t=>{const e=t.getAttribute("data-i18n-placeholder"),n=se(E,e);n?(t.placeholder=n,o++):console.warn("Placeholder translation not found for key:",e)}),console.log("Applied",o,"translations")}function se(o,t){return t.split(".").reduce((e,n)=>e&&e[n]!==void 0?e[n]:e&&Array.isArray(e)&&!isNaN(n)?e[parseInt(n)]:null,o)}function Ge(){const o=document.querySelectorAll(".language-option");console.log("Initializing language switcher, found options:",o.length),o.forEach(e=>{const n=e.cloneNode(!0);e.parentNode.replaceChild(n,e)}),document.querySelectorAll(".language-option").forEach(e=>{e.addEventListener("click",async n=>{n.preventDefault(),n.stopPropagation();const a=e.getAttribute("data-lang");console.log("Language option clicked:",a,"Current:",r),a!==r?(console.log("Switching language from",r,"to",a),r=a,localStorage.setItem("language",r),document.documentElement.setAttribute("lang",r),await ge(),pe(),le()):console.log("Language already set to",r)})}),le()}function le(){const o=document.querySelectorAll(".language-option");console.log("Updating active language option, currentLanguage:",r),o.forEach(t=>{const e=t.getAttribute("data-lang");t.classList.remove("active"),e===r&&(t.classList.add("active"),console.log("Set active class on:",e))})}document.addEventListener("DOMContentLoaded",function(){Ve(),tt(),nt(),(window.location.pathname==="/"||window.location.pathname.endsWith("index.html")||window.location.pathname.endsWith("/"))&&(ot(),Ye())});function Ye(){const o=document.getElementById("three-canvas");if(!o){console.warn("Three.js canvas not found");return}g=new fe,h=new de(55,window.innerWidth/window.innerHeight,1,2e4),h.position.set(30,200,1e3),m=new Re({canvas:o,alpha:!0,antialias:!0}),m.setSize(window.innerWidth,window.innerHeight),m.setPixelRatio(Math.min(window.devicePixelRatio,2)),m.toneMapping=We,m.toneMappingExposure=.5,m.shadowMap.enabled=!1,m.antialias=!1;const t=new _e(4210752,.6);g.add(t);const e=new Fe(16777215,.8);e.position.set(1,1,1),g.add(e),Xe(),document.addEventListener("mousemove",Ze,!1),window.addEventListener("resize",et,!1),window.addEventListener("scroll",Je,!1),document.addEventListener("wheel",Qe,!1),we(),console.log("Three.js animation started!")}function Xe(){$e()}function $e(){q=new c;const o=new Be(5e4,5e4,32,32);i=new Ue(o,{textureWidth:128,textureHeight:128,waterNormals:new qe().load("https://threejs.org/examples/textures/waternormals.jpg",function(y){y.wrapS=y.wrapT=Ne}),sunDirection:new c,sunColor:16777215,waterColor:0,distortionScale:.3,size:.5,fog:g.fog!==void 0}),i.rotation.x=-Math.PI/2,i.position.y=0,i.position.x=-5e3,i.position.z=0,i.userData={layer:"ocean",speed:1},g.add(i),S=new H,S.scale.setScalar(5e4),g.add(S);const t=S.material.uniforms;t.turbidity.value=10,t.rayleigh.value=2,t.mieCoefficient.value=.005,t.mieDirectionalG.value=.8;const e={elevation:2,azimuth:180},n=new Oe(m),a=new fe;let s;function C(){const y=ne.degToRad(90-e.elevation),l=ne.degToRad(e.azimuth);q.setFromSphericalCoords(1,y,l),S.material.uniforms.sunPosition.value.copy(q),i.material.uniforms.sunDirection.value.copy(q).normalize(),s!==void 0&&s.dispose(),a.add(S),s=n.fromScene(a),g.add(S),g.environment=s.texture}C(),Ke()}function Ke(){ae=new Ie(1e5,32,32),I=new K({uniforms:{time:{value:0},resolution:{value:new He(window.innerWidth,window.innerHeight)}},vertexShader:`
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
        `,side:me}),b=new $(ae,I),b.position.y=1e3,b.position.x=0,b.position.z=0,b.userData={layer:"space",speed:1},g.add(b)}function we(){X=requestAnimationFrame(we);const o=performance.now();if(o-re<1e3/je)return;re=o;const e=o*.001;V++,o-ie>=1e3&&(G=V,V=0,ie=o,G<30&&i?(i.material.uniforms.distortionScale.value=Math.max(.5,i.material.uniforms.distortionScale.value-.1),i.material.uniforms.size.value=Math.max(.5,i.material.uniforms.size.value-.1)):G>50&&i&&(i.material.uniforms.distortionScale.value=Math.min(2,i.material.uniforms.distortionScale.value+.05),i.material.uniforms.size.value=Math.min(2,i.material.uniforms.size.value+.05))),i&&(i.material.uniforms.time.value+=1/60),b&&I&&(I.uniforms.time.value=e),h.position.y+=(Z-h.position.y)*.1;const n=new c(0,h.position.y,h.position.z-100);h.lookAt(n),m.render(g,h)}function Ze(o){o.clientX-ve,o.clientY-he}function Je(o){O&&(N=window.scrollY,Z=Math.max(200,200+N*2))}function Qe(o){O&&(o.preventDefault(),N+=o.deltaY*.5,Z=Math.max(200,200+N*2),window.scrollBy(0,o.deltaY*.5))}function et(){ve=window.innerWidth/2,he=window.innerHeight/2,h.aspect=window.innerWidth/window.innerHeight,h.updateProjectionMatrix(),m.setSize(window.innerWidth,window.innerHeight)}function tt(){const o=document.querySelectorAll(".nav-link"),t=document.querySelector(".hamburger"),e=document.querySelector(".nav-menu"),n="/droneye/";function a(l){const w=l.getAttribute("href");if(w&&w.startsWith("/")&&!w.startsWith(n)&&!w.startsWith("//")){const k=n+w.substring(1);l.setAttribute("href",k)}}o.forEach(a);const s=document.querySelector(".logo-link");if(s){const l=s.getAttribute("href");l==="/"||l===""?s.setAttribute("href",n):a(s)}const C=document.querySelector(".hero-button-secondary");C&&a(C),document.querySelectorAll('footer a[href^="/"]').forEach(a),o.forEach(l=>{l.addEventListener("click",w=>{o.forEach(k=>k.classList.remove("active")),l.classList.add("active"),e.classList.remove("active"),t.classList.remove("active")})}),t.addEventListener("click",()=>{t.classList.toggle("active"),e.classList.toggle("active")}),document.addEventListener("click",l=>{!t.contains(l.target)&&!e.contains(l.target)&&(e.classList.remove("active"),t.classList.remove("active"))})}function ot(){setTimeout(()=>{const o=document.getElementById("loading-screen");o&&(o.style.opacity="0",setTimeout(()=>{o.style.display="none"},300))},500)}document.querySelectorAll('a[href^="#"]').forEach(o=>{o.addEventListener("click",function(t){t.preventDefault();const e=document.querySelector(this.getAttribute("href"));e&&e.scrollIntoView({behavior:"smooth",block:"start"})})});document.querySelector(".contact-form")?.addEventListener("submit",function(o){o.preventDefault(),new FormData(this);const t=this.querySelector('input[type="text"]').value,e=this.querySelector('input[type="email"]').value,n=this.querySelector("textarea").value;if(!t||!e||!n){alert(E.contact?.form?.error||"Prosím vyplňte všetky polia.");return}const a=this.querySelector("button"),s=a.textContent;a.textContent=E.contact?.form?.sending||"Odosielam...",a.disabled=!0,setTimeout(()=>{alert(E.contact?.form?.success||"Ďakujeme za vašu správu! Čoskoro vás budeme kontaktovať."),this.reset(),a.textContent=s,a.disabled=!1},2e3)});document.getElementById("start-animation-btn")?.addEventListener("click",function(){if(!(window.location.pathname==="/"||window.location.pathname.endsWith("index.html")||window.location.pathname.endsWith("/")))return;const t=document.querySelector(".hero");t&&t.classList.add("hidden"),O||(O=!0,console.log("Animation started and scroll enabled!")),this.disabled=!0});function nt(){const o=localStorage.getItem("theme")||"royal-blue";ye(o),document.querySelector(".theme-switcher")||at()}function ye(o){document.documentElement.setAttribute("data-theme",o),localStorage.setItem("theme",o);const t=document.querySelector(".theme-switcher");if(t){const e=t.querySelector(`[data-theme="${o}"]`);e&&(t.querySelectorAll(".theme-btn").forEach(n=>n.classList.remove("active")),e.classList.add("active"))}}function at(){const o=document.querySelector(".nav-container");if(!o)return;const t=document.createElement("div");t.className="theme-switcher",t.innerHTML=`
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
    `,o.insertBefore(t,o.firstChild);const e=t.querySelector(".theme-btn"),n=t.querySelectorAll(".theme-option");e.addEventListener("click",()=>{t.classList.toggle("active")}),n.forEach(a=>{a.addEventListener("click",()=>{const s=a.getAttribute("data-theme");ye(s),t.classList.remove("active")})}),document.addEventListener("click",a=>{t.contains(a.target)||t.classList.remove("active")})}const it={threshold:.1,rootMargin:"0px 0px -50px 0px"},rt=new IntersectionObserver(o=>{o.forEach(t=>{t.isIntersecting&&(t.target.style.opacity="1",t.target.style.transform="translateY(0)")})},it);document.querySelectorAll(".content-card, .service-card, .project-card, .team-card, .pricing-card").forEach(o=>{o.style.opacity="0",o.style.transform="translateY(30px)",o.style.transition="opacity 0.6s ease, transform 0.6s ease",rt.observe(o)});let ce=0,st=150,P=null;function ue(){if(P=document.querySelector(".navbar"),!P)return;let o;window.addEventListener("scroll",()=>{const t=window.pageYOffset||document.documentElement.scrollTop,e=t-ce;clearTimeout(o),t>50?P.style.background="var(--primary-color)":P.style.background="transparent",Math.abs(e)>5&&(e>0&&t>st?P.style.transform="translateY(-100%)":e<0&&(P.style.transform="translateY(0)")),ce=t},{passive:!0})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",ue):ue();window.addEventListener("beforeunload",function(){X&&cancelAnimationFrame(X),m&&m.dispose()});
//# sourceMappingURL=main-D58jH8mO.js.map
