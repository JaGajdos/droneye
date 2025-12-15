import{M as K,V as l,C as B,F as ke,P as Ae,a as U,b as te,c as de,W as De,U as Y,d as oe,S as Z,B as me,e as ze,f as fe,g as Re,A as We,h as _e,D as Fe,i as Be,T as qe,R as Ne,j as Oe,k as Ie,l as He,m as ae}from"./three-BCRiq4VL.js";class je extends K{constructor(o,e={}){super(o),this.isWater=!0;const a=this,n=e.textureWidth!==void 0?e.textureWidth:512,r=e.textureHeight!==void 0?e.textureHeight:512,M=e.clipBias!==void 0?e.clipBias:0,y=e.alpha!==void 0?e.alpha:1,s=e.time!==void 0?e.time:0,g=e.waterNormals!==void 0?e.waterNormals:null,k=e.sunDirection!==void 0?e.sunDirection:new l(.70707,.70707,0),xe=new B(e.sunColor!==void 0?e.sunColor:16777215),Se=new B(e.waterColor!==void 0?e.waterColor:8355711),J=e.eye!==void 0?e.eye:new l(0,0,0),be=e.distortionScale!==void 0?e.distortionScale:20,Ee=e.side!==void 0?e.side:ke,Me=e.fog!==void 0?e.fog:!1,C=new Ae,x=new l,L=new l,j=new l,A=new U,R=new l(0,0,-1),p=new te,D=new l,W=new l,z=new te,_=new U,u=new de,Q=new De(n,r),F={name:"MirrorShader",uniforms:Y.merge([oe.fog,oe.lights,{normalSampler:{value:null},mirrorSampler:{value:null},alpha:{value:1},time:{value:0},size:{value:1},distortionScale:{value:20},textureMatrix:{value:new U},sunColor:{value:new B(8355711)},sunDirection:{value:new l(.70707,.70707,0)},eye:{value:new l},waterColor:{value:new B(5592405)}}]),vertexShader:`
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
				}`},m=new Z({name:F.name,uniforms:Y.clone(F.uniforms),vertexShader:F.vertexShader,fragmentShader:F.fragmentShader,lights:!0,side:Ee,fog:Me});m.uniforms.mirrorSampler.value=Q.texture,m.uniforms.textureMatrix.value=_,m.uniforms.alpha.value=y,m.uniforms.time.value=s,m.uniforms.normalSampler.value=g,m.uniforms.sunColor.value=xe,m.uniforms.waterColor.value=Se,m.uniforms.sunDirection.value=k,m.uniforms.distortionScale.value=be,m.uniforms.eye.value=J,a.material=m,a.onBeforeRender=function(c,Ce,T){if(L.setFromMatrixPosition(a.matrixWorld),j.setFromMatrixPosition(T.matrixWorld),A.extractRotation(a.matrixWorld),x.set(0,0,1),x.applyMatrix4(A),D.subVectors(L,j),D.dot(x)>0)return;D.reflect(x).negate(),D.add(L),A.extractRotation(T.matrixWorld),R.set(0,0,-1),R.applyMatrix4(A),R.add(j),W.subVectors(L,R),W.reflect(x).negate(),W.add(L),u.position.copy(D),u.up.set(0,1,0),u.up.applyMatrix4(A),u.up.reflect(x),u.lookAt(W),u.far=T.far,u.updateMatrixWorld(),u.projectionMatrix.copy(T.projectionMatrix),_.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),_.multiply(u.projectionMatrix),_.multiply(u.matrixWorldInverse),C.setFromNormalAndCoplanarPoint(x,L),C.applyMatrix4(u.matrixWorldInverse),p.set(C.normal.x,C.normal.y,C.normal.z,C.constant);const f=u.projectionMatrix;z.x=(Math.sign(p.x)+f.elements[8])/f.elements[0],z.y=(Math.sign(p.y)+f.elements[9])/f.elements[5],z.z=-1,z.w=(1+f.elements[10])/f.elements[14],p.multiplyScalar(2/p.dot(z)),f.elements[2]=p.x,f.elements[6]=p.y,f.elements[10]=p.z+1-M,f.elements[14]=p.w,J.setFromMatrixPosition(T.matrixWorld);const Le=c.getRenderTarget(),Te=c.xr.enabled,Pe=c.shadowMap.autoUpdate;a.visible=!1,c.xr.enabled=!1,c.shadowMap.autoUpdate=!1,c.setRenderTarget(Q),c.state.buffers.depth.setMask(!0),c.autoClear===!1&&c.clear(),c.render(Ce,u),a.visible=!0,c.xr.enabled=Te,c.shadowMap.autoUpdate=Pe,c.setRenderTarget(Le);const ee=T.viewport;ee!==void 0&&c.state.viewport(ee)}}}class H extends K{constructor(){const o=H.SkyShader,e=new Z({name:o.name,uniforms:Y.clone(o.uniforms),vertexShader:o.vertexShader,fragmentShader:o.fragmentShader,side:me,depthWrite:!1});super(new ze(1,1,1),e),this.isSky=!0}}H.SkyShader={name:"SkyShader",uniforms:{turbidity:{value:2},rayleigh:{value:1},mieCoefficient:{value:.005},mieDirectionalG:{value:.8},sunPosition:{value:new l},up:{value:new l(0,1,0)}},vertexShader:`
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

		}`};let h,v,d,X,ve=window.innerWidth/2,he=window.innerHeight/2,i,S,q,N=0,$=200,O=!1,b,ne,I,V=0,ie=performance.now(),G=60,Ue=60,re=0,w="sk",E={};async function Ve(){w=localStorage.getItem("language")||"sk",await pe(),ge(),Ge()}async function pe(){try{E=await(await fetch(`/src/locales/${w}.json`)).json()}catch(t){console.error("Error loading translations:",t),w!=="sk"&&(w="sk",E=await(await fetch("/src/locales/sk.json")).json())}}function ge(){document.querySelectorAll("[data-i18n]").forEach(t=>{const o=t.getAttribute("data-i18n"),e=se(E,o);e&&(t.textContent=e)}),document.querySelectorAll("[data-i18n-placeholder]").forEach(t=>{const o=t.getAttribute("data-i18n-placeholder"),e=se(E,o);e&&(t.placeholder=e)})}function se(t,o){return o.split(".").reduce((e,a)=>e&&e[a]!==void 0?e[a]:e&&Array.isArray(e)&&!isNaN(a)?e[parseInt(a)]:null,t)}function Ge(){document.querySelectorAll(".language-option").forEach(o=>{o.addEventListener("click",async e=>{e.preventDefault();const a=o.getAttribute("data-lang");a!==w&&(w=a,localStorage.setItem("language",w),await pe(),ge(),le())})}),le()}function le(){document.querySelectorAll(".language-option").forEach(o=>{o.classList.remove("active"),o.getAttribute("data-lang")===w&&o.classList.add("active")})}document.addEventListener("DOMContentLoaded",function(){Ve(),tt(),at(),(window.location.pathname==="/"||window.location.pathname.endsWith("index.html")||window.location.pathname.endsWith("/"))&&(ot(),Ye())});function Ye(){const t=document.getElementById("three-canvas");if(!t){console.warn("Three.js canvas not found");return}h=new fe,v=new de(55,window.innerWidth/window.innerHeight,1,2e4),v.position.set(30,200,1e3),d=new Re({canvas:t,alpha:!0,antialias:!0}),d.setSize(window.innerWidth,window.innerHeight),d.setPixelRatio(Math.min(window.devicePixelRatio,2)),d.toneMapping=We,d.toneMappingExposure=.5,d.shadowMap.enabled=!1,d.antialias=!1;const o=new _e(4210752,.6);h.add(o);const e=new Fe(16777215,.8);e.position.set(1,1,1),h.add(e),Xe(),document.addEventListener("mousemove",$e,!1),window.addEventListener("resize",et,!1),window.addEventListener("scroll",Je,!1),document.addEventListener("wheel",Qe,!1),we(),console.log("Three.js animation started!")}function Xe(){Ke()}function Ke(){q=new l;const t=new Be(5e4,5e4,32,32);i=new je(t,{textureWidth:128,textureHeight:128,waterNormals:new qe().load("https://threejs.org/examples/textures/waternormals.jpg",function(y){y.wrapS=y.wrapT=Ne}),sunDirection:new l,sunColor:16777215,waterColor:0,distortionScale:.3,size:.5,fog:h.fog!==void 0}),i.rotation.x=-Math.PI/2,i.position.y=0,i.position.x=-5e3,i.position.z=0,i.userData={layer:"ocean",speed:1},h.add(i),S=new H,S.scale.setScalar(5e4),h.add(S);const o=S.material.uniforms;o.turbidity.value=10,o.rayleigh.value=2,o.mieCoefficient.value=.005,o.mieDirectionalG.value=.8;const e={elevation:2,azimuth:180},a=new Oe(d),n=new fe;let r;function M(){const y=ae.degToRad(90-e.elevation),s=ae.degToRad(e.azimuth);q.setFromSphericalCoords(1,y,s),S.material.uniforms.sunPosition.value.copy(q),i.material.uniforms.sunDirection.value.copy(q).normalize(),r!==void 0&&r.dispose(),n.add(S),r=a.fromScene(n),h.add(S),h.environment=r.texture}M(),Ze()}function Ze(){ne=new Ie(1e5,32,32),I=new Z({uniforms:{time:{value:0},resolution:{value:new He(window.innerWidth,window.innerHeight)}},vertexShader:`
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
        `,side:me}),b=new K(ne,I),b.position.y=1e3,b.position.x=0,b.position.z=0,b.userData={layer:"space",speed:1},h.add(b)}function we(){X=requestAnimationFrame(we);const t=performance.now();if(t-re<1e3/Ue)return;re=t;const e=t*.001;V++,t-ie>=1e3&&(G=V,V=0,ie=t,G<30&&i?(i.material.uniforms.distortionScale.value=Math.max(.5,i.material.uniforms.distortionScale.value-.1),i.material.uniforms.size.value=Math.max(.5,i.material.uniforms.size.value-.1)):G>50&&i&&(i.material.uniforms.distortionScale.value=Math.min(2,i.material.uniforms.distortionScale.value+.05),i.material.uniforms.size.value=Math.min(2,i.material.uniforms.size.value+.05))),i&&(i.material.uniforms.time.value+=1/60),b&&I&&(I.uniforms.time.value=e),v.position.y+=($-v.position.y)*.1;const a=new l(0,v.position.y,v.position.z-100);v.lookAt(a),d.render(h,v)}function $e(t){t.clientX-ve,t.clientY-he}function Je(t){O&&(N=window.scrollY,$=Math.max(200,200+N*2))}function Qe(t){O&&(t.preventDefault(),N+=t.deltaY*.5,$=Math.max(200,200+N*2),window.scrollBy(0,t.deltaY*.5))}function et(){ve=window.innerWidth/2,he=window.innerHeight/2,v.aspect=window.innerWidth/window.innerHeight,v.updateProjectionMatrix(),d.setSize(window.innerWidth,window.innerHeight)}function tt(){const t=document.querySelectorAll(".nav-link"),o=document.querySelector(".hamburger"),e=document.querySelector(".nav-menu"),a="/droneye/";function n(s){const g=s.getAttribute("href");if(g&&g.startsWith("/")&&!g.startsWith(a)&&!g.startsWith("//")){const k=a+g.substring(1);s.setAttribute("href",k)}}t.forEach(n);const r=document.querySelector(".logo-link");if(r){const s=r.getAttribute("href");s==="/"||s===""?r.setAttribute("href",a):n(r)}const M=document.querySelector(".hero-button-secondary");M&&n(M),document.querySelectorAll('footer a[href^="/"]').forEach(n),t.forEach(s=>{s.addEventListener("click",g=>{t.forEach(k=>k.classList.remove("active")),s.classList.add("active"),e.classList.remove("active"),o.classList.remove("active")})}),o.addEventListener("click",()=>{o.classList.toggle("active"),e.classList.toggle("active")}),document.addEventListener("click",s=>{!o.contains(s.target)&&!e.contains(s.target)&&(e.classList.remove("active"),o.classList.remove("active"))})}function ot(){setTimeout(()=>{const t=document.getElementById("loading-screen");t&&(t.style.opacity="0",setTimeout(()=>{t.style.display="none"},300))},500)}document.querySelectorAll('a[href^="#"]').forEach(t=>{t.addEventListener("click",function(o){o.preventDefault();const e=document.querySelector(this.getAttribute("href"));e&&e.scrollIntoView({behavior:"smooth",block:"start"})})});document.querySelector(".contact-form")?.addEventListener("submit",function(t){t.preventDefault(),new FormData(this);const o=this.querySelector('input[type="text"]').value,e=this.querySelector('input[type="email"]').value,a=this.querySelector("textarea").value;if(!o||!e||!a){alert(E.contact?.form?.error||"Prosím vyplňte všetky polia.");return}const n=this.querySelector("button"),r=n.textContent;n.textContent=E.contact?.form?.sending||"Odosielam...",n.disabled=!0,setTimeout(()=>{alert(E.contact?.form?.success||"Ďakujeme za vašu správu! Čoskoro vás budeme kontaktovať."),this.reset(),n.textContent=r,n.disabled=!1},2e3)});document.getElementById("start-animation-btn")?.addEventListener("click",function(){if(!(window.location.pathname==="/"||window.location.pathname.endsWith("index.html")||window.location.pathname.endsWith("/")))return;const o=document.querySelector(".hero");o&&o.classList.add("hidden"),O||(O=!0,console.log("Animation started and scroll enabled!")),this.disabled=!0});function at(){const t=localStorage.getItem("theme")||"royal-blue";ye(t),document.querySelector(".theme-switcher")||nt()}function ye(t){document.documentElement.setAttribute("data-theme",t),localStorage.setItem("theme",t);const o=document.querySelector(".theme-switcher");if(o){const e=o.querySelector(`[data-theme="${t}"]`);e&&(o.querySelectorAll(".theme-btn").forEach(a=>a.classList.remove("active")),e.classList.add("active"))}}function nt(){const t=document.querySelector(".nav-container");if(!t)return;const o=document.createElement("div");o.className="theme-switcher",o.innerHTML=`
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
    `,t.insertBefore(o,t.firstChild);const e=o.querySelector(".theme-btn"),a=o.querySelectorAll(".theme-option");e.addEventListener("click",()=>{o.classList.toggle("active")}),a.forEach(n=>{n.addEventListener("click",()=>{const r=n.getAttribute("data-theme");ye(r),o.classList.remove("active")})}),document.addEventListener("click",n=>{o.contains(n.target)||o.classList.remove("active")})}const it={threshold:.1,rootMargin:"0px 0px -50px 0px"},rt=new IntersectionObserver(t=>{t.forEach(o=>{o.isIntersecting&&(o.target.style.opacity="1",o.target.style.transform="translateY(0)")})},it);document.querySelectorAll(".content-card, .service-card, .project-card, .team-card, .pricing-card").forEach(t=>{t.style.opacity="0",t.style.transform="translateY(30px)",t.style.transition="opacity 0.6s ease, transform 0.6s ease",rt.observe(t)});let ce=0,st=150,P=null;function ue(){if(P=document.querySelector(".navbar"),!P)return;let t;window.addEventListener("scroll",()=>{const o=window.pageYOffset||document.documentElement.scrollTop,e=o-ce;clearTimeout(t),o>50?P.style.background="var(--primary-color)":P.style.background="transparent",Math.abs(e)>5&&(e>0&&o>st?P.style.transform="translateY(-100%)":e<0&&(P.style.transform="translateY(0)")),ce=o},{passive:!0})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",ue):ue();window.addEventListener("beforeunload",function(){X&&cancelAnimationFrame(X),d&&d.dispose()});
//# sourceMappingURL=main-BBfM9V5h.js.map
