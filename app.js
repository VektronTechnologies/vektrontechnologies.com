/* app.js — VEKTRON Technologies */

(function () {
  "use strict";

  /* ---- Mobile Nav Toggle ---- */
  var toggle = document.querySelector(".nav-toggle");
  var navList = document.querySelector(".header-nav");

  if (toggle && navList) {
    toggle.addEventListener("click", function () {
      navList.classList.toggle("is-open");
      var isOpen = navList.classList.contains("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    /* Close nav on link click */
    var links = navList.querySelectorAll("a");
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", function () {
        navList.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    }
  }

  /* ---- Header scroll behaviour ---- */
  var header = document.querySelector(".site-header");
  var lastScroll = 0;

  if (header) {
    window.addEventListener("scroll", function () {
      var currentScroll = window.scrollY;
      if (currentScroll > 80) {
        header.style.boxShadow = "0 4px 24px rgba(0,0,0,0.4)";
      } else {
        header.style.boxShadow = "";
      }
      lastScroll = currentScroll;
    }, { passive: true });
  }

  /* ---- Smooth scroll for anchor links ---- */
  var anchors = document.querySelectorAll('a[href^="#"]');
  for (var j = 0; j < anchors.length; j++) {
    anchors[j].addEventListener("click", function (e) {
      var href = this.getAttribute("href");
      if (href && href.length > 1) {
        var target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth" });
        }
      }
    });
  }

  /* ---- JS-based reveal fallback (for browsers without scroll-timeline) ---- */
  var supportsScrollTimeline = CSS.supports && CSS.supports("animation-timeline", "scroll()");

  if (!supportsScrollTimeline) {
    var revealElements = document.querySelectorAll(".reveal, .reveal-clip");

    if (revealElements.length > 0) {
      var observer = new IntersectionObserver(function (entries) {
        for (var k = 0; k < entries.length; k++) {
          if (entries[k].isIntersecting) {
            entries[k].target.style.opacity = "1";
            entries[k].target.style.clipPath = "inset(0 0 0 0)";
            entries[k].target.style.transition = "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), clip-path 0.6s cubic-bezier(0.16, 1, 0.3, 1)";
            observer.unobserve(entries[k].target);
          }
        }
      }, { threshold: 0.1 });

      for (var m = 0; m < revealElements.length; m++) {
        revealElements[m].style.opacity = "0";
        if (revealElements[m].classList.contains("reveal-clip")) {
          revealElements[m].style.clipPath = "inset(100% 0 0 0)";
        }
        observer.observe(revealElements[m]);
      }
    }
  }

  /* ---- Stat counter animation ---- */
  var statValues = document.querySelectorAll(".stat-value[data-target]");

  if (statValues.length > 0) {
    var statObserver = new IntersectionObserver(function (entries) {
      for (var n = 0; n < entries.length; n++) {
        if (entries[n].isIntersecting) {
          animateCounter(entries[n].target);
          statObserver.unobserve(entries[n].target);
        }
      }
    }, { threshold: 0.5 });

    for (var p = 0; p < statValues.length; p++) {
      statObserver.observe(statValues[p]);
    }
  }

  function animateCounter(el) {
    var target = parseInt(el.getAttribute("data-target"), 10);
    var suffix = el.getAttribute("data-suffix") || "";
    var duration = 1200;
    var start = 0;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) { startTime = timestamp; }
      var progress = Math.min((timestamp - startTime) / duration, 1);
      /* Ease out cubic */
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.floor(eased * (target - start) + start);
      el.textContent = current + suffix;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        el.textContent = target + suffix;
      }
    }

    window.requestAnimationFrame(step);
  }

  /* ---- Founder photo: Holographic-Pokémon-card easter egg ----
     Mousemove tilts the portrait on a perspective stage and drives three
     CSS-var-controlled overlays (iridescent sheen, radial glare, chromatic
     edge). All visuals are CSS — JS only updates custom properties via rAF.
     VEKTRON-locked palette (violet / plasma / ultraviolet, no rainbow). */
  var founderPhoto = document.querySelector(".founder-photo");
  if (founderPhoto) {
    var prefersReducedQuery = (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)"));
    var prefersReduced = !!(prefersReducedQuery && prefersReducedQuery.matches);

    /* Inject overlay layers (kept out of HTML so the markup stays clean). */
    var holoLayers = ["founder-photo-shine", "founder-photo-glare", "founder-photo-edge"];
    for (var hl = 0; hl < holoLayers.length; hl++) {
      var layer = document.createElement("span");
      layer.className = holoLayers[hl];
      layer.setAttribute("aria-hidden", "true");
      founderPhoto.appendChild(layer);
    }
    founderPhoto.setAttribute("data-holo", "");

    if (!prefersReduced) {
      /* Tilt is gentle (7deg) so the founder's face geometry stays
         correct — the heavy lifting comes from the sheen + glare, not
         a warped portrait. Card still reads as 3D and "legendary". */
      var MAX_TILT = 7;
      var holoRaf = null;
      var pendingTiltX = 0;
      var pendingTiltY = 0;
      var pendingGlareX = "50%";
      var pendingGlareY = "50%";
      var pendingShine = "50%";
      var pendingIntensity = 0.6;

      function applyHolo() {
        founderPhoto.style.setProperty("--tilt-x", pendingTiltX.toFixed(2) + "deg");
        founderPhoto.style.setProperty("--tilt-y", pendingTiltY.toFixed(2) + "deg");
        founderPhoto.style.setProperty("--glare-x", pendingGlareX);
        founderPhoto.style.setProperty("--glare-y", pendingGlareY);
        founderPhoto.style.setProperty("--shine-pos", pendingShine);
        founderPhoto.style.setProperty("--holo-intensity", pendingIntensity.toFixed(2));
        holoRaf = null;
      }

      function updateHolo(clientX, clientY) {
        var rect = founderPhoto.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) { return; }
        var nx = (clientX - rect.left) / rect.width;
        var ny = (clientY - rect.top) / rect.height;
        nx = Math.max(0, Math.min(1, nx));
        ny = Math.max(0, Math.min(1, ny));

        /* rotateY follows horizontal (left tilts away on the left).
           rotateX inverted so cursor-up tilts top toward viewer. */
        pendingTiltX = (nx - 0.5) * 2 * MAX_TILT;
        pendingTiltY = -(ny - 0.5) * 2 * MAX_TILT;
        pendingGlareX = (nx * 100).toFixed(1) + "%";
        pendingGlareY = (ny * 100).toFixed(1) + "%";
        /* Sheen scans diagonally with the cursor. */
        pendingShine = ((nx * 0.6 + (1 - ny) * 0.4) * 100).toFixed(1) + "%";
        /* Intensity ramps as cursor moves off-center — the foil pops at the edges.
           Boosted vs. v1 so the holo carries the wow now that tilt is gentler. */
        var dist = Math.sqrt(Math.pow(nx - 0.5, 2) + Math.pow(ny - 0.5, 2));
        pendingIntensity = 0.75 + Math.min(dist, 0.6) * 0.65;

        if (!holoRaf) {
          holoRaf = window.requestAnimationFrame(applyHolo);
        }
      }

      function resetHolo() {
        founderPhoto.classList.remove("is-active");
        /* The 600ms transition on tilt + 500ms transitions on overlays
           handle the smooth return; we just clear the values. */
        founderPhoto.style.setProperty("--tilt-x", "0deg");
        founderPhoto.style.setProperty("--tilt-y", "0deg");
      }

      founderPhoto.addEventListener("mouseenter", function () {
        founderPhoto.classList.add("is-active");
      });
      founderPhoto.addEventListener("mousemove", function (e) {
        updateHolo(e.clientX, e.clientY);
      });
      founderPhoto.addEventListener("mouseleave", resetHolo);

      /* Touch support — tilt follows the finger; release returns to rest.
         touchmove is non-passive and calls preventDefault so the page
         doesn't scroll while the user is dragging the holo card. CSS
         touch-action: none on .founder-photo already tells the browser
         to hand off gestures, this is the JS belt-and-suspenders. */
      founderPhoto.addEventListener("touchstart", function (e) {
        founderPhoto.classList.add("is-active");
        if (e.touches && e.touches[0]) {
          updateHolo(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });
      founderPhoto.addEventListener("touchmove", function (e) {
        if (e.touches && e.touches[0]) {
          if (e.cancelable) { e.preventDefault(); }
          updateHolo(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: false });
      founderPhoto.addEventListener("touchend", resetHolo);
      founderPhoto.addEventListener("touchcancel", resetHolo);
    }
  }
})();
