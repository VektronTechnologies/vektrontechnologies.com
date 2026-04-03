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
})();
