(function(){const n="cookie_consent";function k(){return localStorage.getItem(n)!==null}function c(){const e=localStorage.getItem(n);if(!e)return null;try{return JSON.parse(e)}catch{return null}}function l(e){const t={...e,timestamp:new Date().toISOString(),expiry:new Date(Date.now()+31536e6).toISOString()};localStorage.setItem(n,JSON.stringify(t))}function g(){const e=document.getElementById("cookie-banner");e&&(e.style.display="block",setTimeout(()=>{e.classList.add("show")},100))}function d(){const e=document.getElementById("cookie-banner");e&&(e.classList.remove("show"),setTimeout(()=>{e.style.display="none"},300))}function m(){document.getElementById("cookie-settings-modal")||v();const t=document.getElementById("cookie-settings-modal");t&&(t.style.display="flex",setTimeout(()=>{t.classList.add("show")},10),h())}function a(){const e=document.getElementById("cookie-settings-modal");e&&(e.classList.remove("show"),setTimeout(()=>{e.style.display="none"},300))}function v(){const e=document.createElement("div");e.id="cookie-settings-modal",e.className="cookie-settings-modal",e.innerHTML=`
            <div class="cookie-settings-content">
                <div class="cookie-settings-header">
                    <h3 data-i18n="cookies.settingsTitle">Nastavenia cookies</h3>
                    <button class="cookie-settings-close" id="cookie-settings-close" aria-label="Close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="cookie-settings-body">
                    <p class="cookie-settings-description" data-i18n="cookies.settingsDescription">Vyberte, ktoré cookies chcete povoliť. Nevyhnutné cookies sú vždy aktívne, pretože sú potrebné pre základnú funkčnosť stránky.</p>
                    
                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <label class="cookie-category-label">
                                <input type="checkbox" id="cookie-necessary" checked disabled>
                                <span class="cookie-category-name" data-i18n="cookies.necessary">Nevyhnutné cookies</span>
                            </label>
                        </div>
                        <p class="cookie-category-desc" data-i18n="cookies.necessaryDesc">Tieto cookies sú nevyhnutné pre fungovanie webovej stránky a nemôžu byť vypnuté.</p>
                    </div>

                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <label class="cookie-category-label">
                                <input type="checkbox" id="cookie-analytics">
                                <span class="cookie-category-name" data-i18n="cookies.analytics">Analytické cookies</span>
                            </label>
                        </div>
                        <p class="cookie-category-desc" data-i18n="cookies.analyticsDesc">Pomáhajú nám pochopiť, ako návštevníci používajú našu stránku.</p>
                    </div>

                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <label class="cookie-category-label">
                                <input type="checkbox" id="cookie-marketing">
                                <span class="cookie-category-name" data-i18n="cookies.marketing">Marketingové cookies</span>
                            </label>
                        </div>
                        <p class="cookie-category-desc" data-i18n="cookies.marketingDesc">Používame ich na personalizáciu reklám a meranie ich účinnosti.</p>
                    </div>
                </div>
                <div class="cookie-settings-footer">
                    <button id="cookie-settings-save" class="cookie-btn cookie-btn-accept" data-i18n="cookies.save">Uložiť nastavenia</button>
                    <button id="cookie-settings-cancel" class="cookie-btn cookie-btn-reject" data-i18n="cookies.close">Zavrieť</button>
                </div>
            </div>
        `,document.body.appendChild(e),window.applyTranslations&&window.applyTranslations()}function h(){const e=c();e?(document.getElementById("cookie-necessary").checked=!0,document.getElementById("cookie-analytics").checked=e.analytics===!0,document.getElementById("cookie-marketing").checked=e.marketing===!0):(document.getElementById("cookie-necessary").checked=!0,document.getElementById("cookie-analytics").checked=!1,document.getElementById("cookie-marketing").checked=!1)}function D(){const e={necessary:!0,analytics:document.getElementById("cookie-analytics").checked,marketing:document.getElementById("cookie-marketing").checked,accepted:!0};l(e),a(),d(),i(),r()}function y(){l({necessary:!0,analytics:!0,marketing:!0,accepted:!0}),d(),i()}function p(){l({necessary:!0,analytics:!1,marketing:!1,accepted:!1}),d()}function f(){const e=c();return e&&e.analytics===!0}function r(){const t=!f()?"www.youtube-nocookie.com":"www.youtube.com";document.querySelectorAll(".youtube-placeholder[data-youtube-id]").forEach(s=>{const u=s.getAttribute("data-youtube-id"),o=document.createElement("iframe");o.src=`https://${t}/embed/${u}`,o.setAttribute("frameborder","0"),o.setAttribute("allow","accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"),o.setAttribute("allowfullscreen",""),o.setAttribute("loading","lazy"),o.className="youtube-iframe",s.replaceWith(o)}),document.querySelectorAll("iframe[data-youtube-id]").forEach(s=>{const u=s.getAttribute("data-youtube-id"),o=s.getAttribute("src"),C=`https://${t}/embed/${u}`;(!o||!o.includes(t))&&(s.src=C)})}function w(){r()}function i(){w();const e=c();e&&(e.analytics,e.marketing)}function b(){setTimeout(()=>{if(k()){const e=c();if(e){const t=new Date(e.expiry);new Date>t?(localStorage.removeItem(n),i(),g()):i()}}else i(),g();document.addEventListener("click",e=>{e.target.id==="cookie-accept"||e.target.closest("#cookie-accept")?(e.preventDefault(),y()):e.target.id==="cookie-reject"||e.target.closest("#cookie-reject")?(e.preventDefault(),p()):e.target.id==="cookie-settings"||e.target.closest("#cookie-settings")?(e.preventDefault(),m()):e.target.id==="cookie-settings-close"||e.target.closest("#cookie-settings-close")||e.target.id==="cookie-settings-cancel"||e.target.closest("#cookie-settings-cancel")?(e.preventDefault(),a()):e.target.id==="cookie-settings-save"||e.target.closest("#cookie-settings-save")?(e.preventDefault(),D()):e.target.closest("#cookie-settings-modal")&&e.target.id==="cookie-settings-modal"&&a()})},500)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{b(),setTimeout(()=>{i()},1e3)}):(b(),setTimeout(()=>{i()},1e3)),window.cookieConsent={accept:y,reject:p,hasConsent:k,hasAnalyticsConsent:f,showSettings:m,loadYouTubeVideos:r}})();
//# sourceMappingURL=cookies-Ckv3Il1Y.js.map
