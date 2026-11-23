/* wokanoka — small progressive enhancements. The site is fully readable without this file. */
(function () {
  "use strict";

  var doc = document.documentElement;
  doc.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var hasIO = "IntersectionObserver" in window;

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      nav.classList.toggle("is-open", open);
    };

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener("click", function (e) {
      if (toggle.getAttribute("aria-expanded") === "true" && !e.target.closest(".site-header")) setOpen(false);
    });
  }

  /* ---------- Helpers ---------- */
  function attachSource(video) {
    if (video.dataset.loaded) return;
    var src = video.dataset.src;
    if (!src) return;
    var source = document.createElement("source");
    source.src = src;
    source.type = "video/mp4";
    video.appendChild(source);
    video.dataset.loaded = "1";
    video.load();
  }

  /* ---------- Trailer: attach the file only when the section is near or on play ---------- */
  var trailer = document.querySelector("[data-trailer]");
  if (trailer) {
    if (hasIO) {
      var trailerIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            attachSource(trailer);
            trailerIO.disconnect();
          }
        });
      }, { rootMargin: "300px 0px" });
      trailerIO.observe(trailer);
    } else {
      attachSource(trailer);
    }
    trailer.addEventListener("play", function () { attachSource(trailer); }, { once: true });
    trailer.addEventListener("click", function () { attachSource(trailer); }, { once: true });
  }

  /* Smooth jump from "Watch Trailer" also gives the player focus */
  var watch = document.querySelector("[data-watch-trailer]");
  if (watch && trailer) {
    watch.addEventListener("click", function () {
      attachSource(trailer);
      window.setTimeout(function () { trailer.focus({ preventScroll: true }); }, reduceMotion.matches ? 0 : 600);
    });
  }

  /* ---------- Gameplay loops: lazy load, play on screen, pause off screen ---------- */
  var loops = Array.prototype.slice.call(document.querySelectorAll("[data-loop]"));

  loops.forEach(function (video) {
    var btn = video.parentElement.querySelector(".motion-toggle");
    video.userPaused = reduceMotion.matches;
    video.inView = false;

    function syncButton() {
      if (!btn) return;
      var paused = video.userPaused;
      btn.setAttribute("aria-pressed", String(paused));
      btn.setAttribute("aria-label", paused ? "Play animation" : "Pause animation");
    }

    function update() {
      if (video.inView && !video.userPaused) {
        attachSource(video);
        var p = video.play();
        if (p && p.catch) p.catch(function () {});
      } else if (!video.paused) {
        video.pause();
      }
    }

    video.updateLoop = update;

    if (btn) {
      btn.hidden = false;
      syncButton();
      btn.addEventListener("click", function () {
        video.userPaused = !video.userPaused;
        syncButton();
        update();
      });
    }
  });

  if (hasIO && loops.length) {
    var preloadIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !entry.target.userPaused) {
          attachSource(entry.target);
          preloadIO.unobserve(entry.target);
        }
      });
    }, { rootMargin: "400px 0px" });

    var playIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.inView = entry.isIntersecting;
        entry.target.updateLoop();
      });
    }, { threshold: 0.35 });

    loops.forEach(function (v) {
      preloadIO.observe(v);
      playIO.observe(v);
    });
  }

  if (reduceMotion.addEventListener) {
    reduceMotion.addEventListener("change", function () {
      loops.forEach(function (v) {
        v.userPaused = reduceMotion.matches;
        var btn = v.parentElement.querySelector(".motion-toggle");
        if (btn) {
          btn.setAttribute("aria-pressed", String(v.userPaused));
          btn.setAttribute("aria-label", v.userPaused ? "Play animation" : "Pause animation");
        }
        v.updateLoop();
      });
    });
  }

  /* Pause everything when the tab is hidden */
  document.addEventListener("visibilitychange", function () {
    loops.forEach(function (v) {
      if (document.hidden) v.pause();
      else v.updateLoop();
    });
  });
})();
