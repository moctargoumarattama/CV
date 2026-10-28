(function () {
  const root = document.documentElement;
  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-menu");
  const navBackdrop = document.querySelector(".nav-backdrop");
  const themeToggle = document.querySelector(".theme-toggle");
  const themeLabel = themeToggle ? themeToggle.querySelector(".theme-label") : null;
  const year = document.getElementById("current-year");
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const quickTop = document.querySelector(".quick-top");
  const pageProgressBar = document.querySelector(".page-progress-bar");
  const pageLoader = document.getElementById("page-loader");

  function readPreference(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function writePreference(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      // Preferences still work for this visit when storage is unavailable.
    }
  }

  if (pageLoader) {
    let loaderHidden = false;
    const loaderCircle = document.getElementById("loader-circle");
    const loaderPercent = document.getElementById("loader-percent");
    const totalCircumference = 226; // 2 * PI * 36
    const startTime = performance.now();
    const duration = 1200; // 1.2 seconde de chargement fluide et luxueux

    function setLoaderProgress(val) {
      const progress = Math.min(100, Math.max(0, val));
      if (loaderPercent) loaderPercent.textContent = Math.round(progress) + "%";
      if (loaderCircle) {
        const offset = totalCircumference - (progress / 100) * totalCircumference;
        loaderCircle.style.strokeDashoffset = offset;
      }
    }

    function updateLoader(currentTime) {
      if (loaderHidden) return;
      const elapsed = currentTime - startTime;
      const t = Math.min(1, elapsed / duration);

      // Courbe d'accélération puis décélération élégante (ease-out cubic)
      const easedProgress = 1 - Math.pow(1 - t, 2.5);
      setLoaderProgress(easedProgress * 100);

      if (t < 1) {
        window.requestAnimationFrame(updateLoader);
      } else {
        setLoaderProgress(100);
        window.setTimeout(hidePageLoader, 140); // Courte pause à 100% pour savourer la complétion
      }
    }

    window.requestAnimationFrame(updateLoader);

    function hidePageLoader() {
      if (loaderHidden) return;
      loaderHidden = true;
      setLoaderProgress(100);

      pageLoader.classList.add("is-hidden");
      window.setTimeout(function () {
        pageLoader.remove();
      }, 400);
    }
  }

  function setTheme(theme) {
    if (theme === "light") {
      root.setAttribute("data-theme", "light");
      if (themeMeta) themeMeta.setAttribute("content", "#f4f8fb");
      if (themeLabel) themeLabel.textContent = "Mode nuit";
      else if (themeToggle) themeToggle.textContent = "Mode nuit";
      if (themeToggle) themeToggle.setAttribute("aria-label", "Activer le mode nuit");
    } else {
      root.removeAttribute("data-theme");
      if (themeMeta) themeMeta.setAttribute("content", "#0b1b24");
      if (themeLabel) themeLabel.textContent = "Mode clair";
      else if (themeToggle) themeToggle.textContent = "Mode clair";
      if (themeToggle) themeToggle.setAttribute("aria-label", "Activer le mode clair");
    }
    writePreference("portfolio-theme", theme);
  }

  const themeVersion = "solar-premium-v1";
  const savedTheme = readPreference("portfolio-theme-version") === themeVersion
    ? readPreference("portfolio-theme") || "light"
    : "light";
  writePreference("portfolio-theme-version", themeVersion);
  setTheme(savedTheme);

  if (year) {
    year.textContent = new Date().getFullYear();
  }    if (pageProgressBar) {
      let progressTicking = false;
      let cachedScrollable = 0;

      function updateCachedScrollable() {
        cachedScrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      }
      updateCachedScrollable();

      function updatePageProgress() {
        if (!cachedScrollable) updateCachedScrollable();
        const progress = Math.min(1, Math.max(0, window.scrollY / cachedScrollable));
        pageProgressBar.style.setProperty("--scroll-progress", progress.toFixed(4));
        progressTicking = false;
      }

      function requestPageProgressUpdate() {
        if (progressTicking) return;
        progressTicking = true;
        window.requestAnimationFrame(updatePageProgress);
      }

      window.addEventListener("scroll", requestPageProgressUpdate, { passive: true });
      window.addEventListener("resize", function () {
        updateCachedScrollable();
        requestPageProgressUpdate();
      }, { passive: true });
      updatePageProgress();
    }

  if (navToggle && navMenu) {
    let menuPointerId = null;
    let menuStartX = 0;
    let menuStartY = 0;
    let menuStartTime = 0;
    let menuDragX = 0;
    let menuDragY = 0;
    let menuGestureMoved = false;
    let suppressMenuClick = false;

    function resetMenuDrag() {
      menuPointerId = null;
      menuDragX = 0;
      menuDragY = 0;
      navMenu.classList.remove("is-dragging");
      navMenu.style.removeProperty("--menu-drag-x");
      navMenu.style.removeProperty("--menu-drag-y");
    }

    function setMenuState(isOpen) {
      resetMenuDrag();
      navMenu.classList.toggle("active", isOpen);
      navToggle.classList.toggle("active", isOpen);
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Fermer le menu" : "Ouvrir le menu");
      document.body.classList.toggle("menu-open", isOpen);
    }

    function closeMenu() {
      setMenuState(false);
    }

    navToggle.addEventListener("click", function () {
      setMenuState(!navMenu.classList.contains("active"));
    });

    if (navBackdrop) {
      navBackdrop.addEventListener("click", closeMenu);
    }

    navMenu.addEventListener("pointerdown", function (event) {
      if (!navMenu.classList.contains("active") || event.pointerType === "mouse") return;

      menuPointerId = event.pointerId;
      menuStartX = event.clientX;
      menuStartY = event.clientY;
      menuStartTime = performance.now();
      menuDragX = 0;
      menuDragY = 0;
      menuGestureMoved = false;
      navMenu.classList.add("is-dragging");
      navMenu.setPointerCapture(menuPointerId);
    });

    navMenu.addEventListener("pointermove", function (event) {
      if (event.pointerId !== menuPointerId) return;

      const deltaX = event.clientX - menuStartX;
      const deltaY = event.clientY - menuStartY;
      menuDragX = Math.max(0, deltaX);
      menuDragY = Math.max(-18, Math.min(18, deltaY * 0.18));
      menuGestureMoved = menuDragX > 10 || Math.abs(deltaY) > 14;

      navMenu.style.setProperty("--menu-drag-x", menuDragX.toFixed(1) + "px");
      navMenu.style.setProperty("--menu-drag-y", menuDragY.toFixed(1) + "px");
    });

    function finishMenuGesture(event) {
      if (event.pointerId !== menuPointerId) return;

      const elapsed = Math.max(1, performance.now() - menuStartTime);
      const velocityX = menuDragX / elapsed;
      const shouldClose = menuDragX > 72 || velocityX > 0.42;

      if (shouldClose) {
        suppressMenuClick = true;
        closeMenu();
      } else {
        resetMenuDrag();
      }
    }

    navMenu.addEventListener(
      "click",
      function (event) {
        if (!suppressMenuClick && !menuGestureMoved) return;
        event.preventDefault();
        event.stopPropagation();
        suppressMenuClick = false;
        menuGestureMoved = false;
      },
      true
    );

    navMenu.addEventListener("pointerup", finishMenuGesture);
    navMenu.addEventListener("pointercancel", resetMenuDrag);

    navMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    window.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && navMenu.classList.contains("active")) {
        closeMenu();
        navToggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 760 && navMenu.classList.contains("active")) {
        closeMenu();
      }
    });
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      const current = root.getAttribute("data-theme") === "light" ? "light" : "dark";
      setTheme(current === "light" ? "dark" : "light");
    });
  }

  if (quickTop) {
    let ticking = false;

    function setQuickTopState() {
      const threshold = Math.min(720, window.innerHeight * 0.72);
      const shouldShow = window.scrollY > threshold;

      if (!shouldShow && document.activeElement === quickTop) {
        quickTop.blur();
      }

      quickTop.classList.toggle("is-visible", shouldShow);
      quickTop.setAttribute("aria-hidden", String(!shouldShow));
      quickTop.tabIndex = shouldShow ? 0 : -1;
      ticking = false;
    }

    function requestQuickTopUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(setQuickTopState);
    }

    quickTop.addEventListener("click", function () {
      quickTop.classList.add("is-lifting");
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      window.setTimeout(function () {
        quickTop.classList.remove("is-lifting");
        setQuickTopState();
      }, 520);
    });

    window.addEventListener("scroll", requestQuickTopUpdate, { passive: true });
    window.addEventListener("resize", requestQuickTopUpdate);
    setQuickTopState();
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (event) {
      const targetId = anchor.getAttribute("href");
      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();
      const offset = 82;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
    });
  });

  const filterButtons = document.querySelectorAll(".filter-btn");
  const projectCards = Array.from(document.querySelectorAll(".project-card")).sort(function (first, second) {
    const firstPriority = Number(first.dataset.priority || 999);
    const secondPriority = Number(second.dataset.priority || 999);
    return firstPriority - secondPriority;
  });
  const projectCount = document.getElementById("project-count");
  const projectsMore = document.getElementById("projects-more");
  const summaryLinks = document.querySelectorAll("[data-section-link]");
  const navSectionLinks = navMenu ? navMenu.querySelectorAll('.nav-menu a[href^="#"]') : [];
  const canObserve = "IntersectionObserver" in window;
  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduceMotion = reduceMotionQuery.matches;
  const networkConnection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  let batterySaverActive = false;

  function requiresMediaClick() {
    // 1. Respect de l'économiseur de données natif activé par l'utilisateur (Navigateur / OS mobile)
    if (networkConnection && networkConnection.saveData) return true;

    // 2. Détection d'une connexion réseau très restreinte (2G lente uniquement)
    if (networkConnection && (networkConnection.effectiveType === "slow-2g" || networkConnection.effectiveType === "2g")) {
      return true;
    }

    // 3. Mode économie d'énergie critique (batterie <= 15% sur appareil débranché)
    if (batterySaverActive) return true;

    // 4. Chargement direct et fluide des aperçus
    return false;
  }

  let mediaClickRequired = requiresMediaClick();
  let previewScanFrame = 0;
  const mobileProjectBatchSize = 7;
  let activeProjectFilter = "all";
  let visibleProjectLimit = mobileProjectBatchSize;
  const filterLabels = {
    all: "projets",
    iot: "projets IoT",
    industry: "projets Industrie",
    ai: "projets IA",
    web: "projets Web",
    energy: "projets Energie",
  };

  function projectMatchesFilter(card, filter) {
    const categories = (card.dataset.category || "").split(/\s+/);
    return filter === "all" || categories.includes(filter);
  }

  function getMatchingProjectCards() {
    return Array.from(projectCards).filter(function (card) {
      return projectMatchesFilter(card, activeProjectFilter);
    });
  }

  function scrollToProjectBatch(target) {
    if (!target) return;

    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        const offset = 92;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
      });
    });
  }

  function animateProjectBatch(cards) {
    if (reduceMotion) return;

    cards.forEach(function (card, index) {
      const delay = Math.min(index * 38, 230);
      card.style.setProperty("--batch-delay", delay + "ms");
      card.classList.remove("batch-entering");

      window.requestAnimationFrame(function () {
        card.classList.add("batch-entering");
      });

      card.addEventListener(
        "animationend",
        function () {
          card.classList.remove("batch-entering");
          card.style.removeProperty("--batch-delay");
        },
        { once: true }
      );
    });
  }

  function updateProjectCount(filter, matchingCount) {
    if (!projectCount) return;

    const currentFilter = filter || "all";
    let visibleCount = 0;

    projectCards.forEach(function (card) {
      if (!card.hidden) visibleCount += 1;
    });

    const label = filterLabels[currentFilter] || "projets";
    const plural = visibleCount > 1 ? "s" : "";

    if (typeof matchingCount === "number" && visibleCount < matchingCount) {
      projectCount.textContent = visibleCount + " sur " + matchingCount + " " + label + " affichés";
      return;
    }

    projectCount.textContent = visibleCount + " " + label + " affiché" + plural;
  }

  function updateProjectLimit() {
    const matchingCards = getMatchingProjectCards();

    projectCards.forEach(function (card) {
      const matchesFilter = projectMatchesFilter(card, activeProjectFilter);
      const isBeyondProjectLimit = matchingCards.indexOf(card) >= visibleProjectLimit;
      card.hidden = !matchesFilter || isBeyondProjectLimit;
    });

    if (projectsMore) {
      const canToggle = matchingCards.length > mobileProjectBatchSize;
      const hasMore = matchingCards.length > visibleProjectLimit;
      projectsMore.hidden = !canToggle;
      projectsMore.textContent = hasMore
        ? "Voir " + mobileProjectBatchSize + " projets de plus"
        : "Réduire la liste";
      projectsMore.dataset.state = hasMore ? "more" : "collapse";
      projectsMore.setAttribute(
        "aria-label",
        hasMore ? "Afficher 7 projets de plus" : "Réduire la liste des projets"
      );
      projectsMore.setAttribute("aria-expanded", String(!hasMore));
    }

    updateProjectCount(activeProjectFilter, matchingCards.length);
    requestPreviewScan();
  }

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const filter = button.dataset.filter || "all";
      activeProjectFilter = filter;
      visibleProjectLimit = mobileProjectBatchSize;

      filterButtons.forEach(function (item) {
        item.classList.toggle("active", item === button);
      });

      updateProjectLimit();
    });
  });

  if (projectsMore) {
    projectsMore.addEventListener("click", function () {
      const matchingCards = getMatchingProjectCards();
      const previousLimit = visibleProjectLimit;
      const hasMore = matchingCards.length > visibleProjectLimit;

      visibleProjectLimit = hasMore ? visibleProjectLimit + mobileProjectBatchSize : mobileProjectBatchSize;
      updateProjectLimit();

      if (hasMore) {
        const nextProjectBatch = matchingCards.slice(previousLimit, visibleProjectLimit);
        nextProjectBatch.forEach(function (card) {
          card.classList.add("visible");
        });
        animateProjectBatch(nextProjectBatch);
        scrollToProjectBatch(matchingCards[previousLimit]);
      } else {
        scrollToProjectBatch(document.getElementById("projects"));
      }
    });
  }

  updateProjectLimit();

  const carousels = document.querySelectorAll(".project-carousel");
  let lightbox = null;
  let lightboxFrame = null;
  let lightboxCaption = null;
  let lightboxTitle = null;
  let isClosingLightbox = false;
  let lastMediaTrigger = null;
  const iframePosters = new WeakMap();

  if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    projectCards.forEach(function (card) {
      let tiltFrame = 0;
      let nextTiltX = "0deg";
      let nextTiltY = "0deg";
      let rect = null;

      function applyTilt() {
        card.style.setProperty("--tilt-x", nextTiltX);
        card.style.setProperty("--tilt-y", nextTiltY);
        tiltFrame = 0;
      }

      card.addEventListener("pointerenter", function () {
        rect = card.getBoundingClientRect();
      });

      card.addEventListener("pointermove", function (event) {
        if (!rect) rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        nextTiltX = (x * 4).toFixed(2) + "deg";
        nextTiltY = (y * -4).toFixed(2) + "deg";
        if (!tiltFrame) {
          tiltFrame = window.requestAnimationFrame(applyTilt);
        }
      });

      card.addEventListener("pointerleave", function () {
        rect = null;
        nextTiltX = "0deg";
        nextTiltY = "0deg";
        if (!tiltFrame) {
          tiltFrame = window.requestAnimationFrame(applyTilt);
        }
      });
    });
  }

  function createModalLoader() {
    const loader = document.createElement("div");
    loader.className = "media-lightbox-loader";
    loader.setAttribute("role", "status");
    loader.setAttribute("aria-live", "polite");
    loader.innerHTML = [
      '<div class="media-lightbox-spinner">',
      '  <div class="media-lightbox-spinner-ring"></div>',
      '  <div class="media-lightbox-spinner-core"></div>',
      '</div>',
      '<div class="media-lightbox-loader-info">',
      '  <span class="media-lightbox-loader-badge">',
      '    <span class="media-lightbox-loader-pulse"></span>',
      '    Document certifié',
      '  </span>',
      '  <p class="media-lightbox-loader-text">Chargement haute définition...</p>',
      '</div>',
    ].join("");
    return loader;
  }

  function getLightbox() {
    if (lightbox) return lightbox;

    lightbox = document.createElement("div");
    lightbox.className = "media-lightbox";
    lightbox.hidden = true;
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", "Fiche et attestation");
    lightbox.innerHTML = [
      '<div class="media-lightbox-backdrop" aria-hidden="true"></div>',
      '<div class="media-lightbox-card">',
      '  <div class="media-lightbox-header">',
      '    <div class="media-lightbox-title-wrap">',
      '      <span class="media-lightbox-badge-dot" aria-hidden="true"></span>',
      '      <strong class="media-lightbox-title">Attestation officielle</strong>',
      '    </div>',
      '    <button class="media-lightbox-close" type="button" aria-label="Fermer la fenêtre (Échap)">',
      '      <span class="media-lightbox-close-text">Fermer</span>',
      '      <kbd class="media-lightbox-kbd">Échap</kbd>',
      '    </button>',
      '  </div>',
      '  <div class="media-lightbox-frame"></div>',
      '  <p class="media-lightbox-caption"></p>',
      '</div>',
    ].join("");

    document.body.appendChild(lightbox);
    lightboxFrame = lightbox.querySelector(".media-lightbox-frame");
    lightboxCaption = lightbox.querySelector(".media-lightbox-caption");
    lightboxTitle = lightbox.querySelector(".media-lightbox-title");

    lightbox.querySelector(".media-lightbox-close").addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox || event.target.classList.contains("media-lightbox-backdrop")) {
        closeLightbox();
      }
    });

    return lightbox;
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden || isClosingLightbox) return;

    isClosingLightbox = true;
    lightbox.classList.add("is-closing");
    lightbox.classList.remove("is-open");

    const exitDelay = 160;

    window.setTimeout(function () {
      if (!lightbox) return;
      lightbox.hidden = true;
      lightbox.classList.remove("is-closing");
      document.documentElement.classList.remove("media-open");
      document.body.classList.remove("media-open");
      if (lightboxFrame) lightboxFrame.replaceChildren();
      if (lastMediaTrigger) {
        lastMediaTrigger.focus({ preventScroll: true });
        lastMediaTrigger = null;
      }
      if (!mediaClickRequired) {
        projectVideos.forEach(function (video) {
          if (isMediaNearViewport(video, 0)) setVideoState(video, true);
        });
      }
      isClosingLightbox = false;
    }, exitDelay);
  }

  function getActiveMedia(projectImage) {
    const carousel = projectImage.querySelector(".project-carousel");
    if (carousel) {
      const slides = Array.from(carousel.children).filter(function (slide) {
        return slide.matches("img, video, iframe");
      });
      const activeIndex = Number(carousel.dataset.activeIndex || 0);
      return slides[activeIndex] || slides[0] || null;
    }

    return projectImage.querySelector("img, video, iframe");
  }

  function openLightboxFromMedia(media, trigger) {
    if (!media) return;

    const dialog = getLightbox();
    const tagName = media.tagName.toLowerCase();
    let preview = null;
    let caption = media.getAttribute("alt") || media.getAttribute("title") || media.getAttribute("aria-label") || "";

    if (tagName === "img") {
      const loader = createModalLoader();
      preview = new Image();
      preview.alt = caption;
      preview.className = "media-lightbox-media";
      lightboxFrame.replaceChildren(loader, preview);

      let revealed = false;
      function revealImage() {
        if (revealed) return;
        revealed = true;
        loader.classList.add("is-hidden");
        preview.classList.add("is-loaded");
        window.setTimeout(function () {
          if (loader.parentNode) loader.remove();
        }, 200);
      }

      preview.src = media.dataset.fullSrc || media.currentSrc || media.getAttribute("src") || media.dataset.src || "";
      if (preview.complete) {
        window.setTimeout(revealImage, 90);
      } else {
        preview.onload = revealImage;
        preview.onerror = revealImage;
      }
    } else if (tagName === "video") {
      media.pause();
      preview = document.createElement("video");
      preview.src = media.dataset.src || media.currentSrc || media.getAttribute("src") || "";
      const posterSrc = media.getAttribute("poster") || media.dataset.poster || "";
      if (posterSrc) preview.poster = posterSrc;
      preview.controls = true;
      preview.autoplay = true;
      preview.loop = true;
      preview.playsInline = true;
      preview.className = "media-lightbox-media is-loaded";
      lightboxFrame.replaceChildren(preview);
    } else if (tagName === "iframe") {
      preview = document.createElement("iframe");
      preview.src = media.getAttribute("src") || media.dataset.src || "";
      preview.title = media.getAttribute("title") || "Apercu video";
      preview.allow = media.getAttribute("allow") || "autoplay; fullscreen";
      preview.className = "media-lightbox-media is-loaded";
      lightboxFrame.replaceChildren(preview);
    }

    if (!preview) return;

    if (lightboxTitle) {
      lightboxTitle.textContent = caption || "Aperçu du média";
    }
    lightboxCaption.textContent = caption;
    lightboxCaption.hidden = !caption;

    lastMediaTrigger = trigger || null;
    isClosingLightbox = false;
    dialog.classList.remove("is-closing");
    dialog.hidden = false;
    dialog.classList.add("is-open");
    document.documentElement.classList.add("media-open");
    document.body.classList.add("media-open");

    dialog.querySelector(".media-lightbox-close").focus({ preventScroll: true });

    if (tagName === "video") {
      preview.play().catch(function () {});
    }
  }

  function parseProofGalleryItems(trigger) {
    return (trigger.dataset.proofImages || "")
      .split(";")
      .map(function (item) {
        const parts = item.split("|");
        return {
          src: (parts[0] || "").trim(),
          caption: (parts[1] || "").trim(),
        };
      })
      .filter(function (item) {
        return item.src;
      });
  }

  function openProofGallery(trigger) {
    const items = parseProofGalleryItems(trigger);
    if (!items.length) return;

    const dialog = getLightbox();

    // If single item: render directly with modern loading state
    if (items.length === 1) {
      const item = items[0];
      const isPdf = /\.pdf($|[?#])/i.test(item.src);

      if (isPdf) {
        const media = document.createElement("iframe");
        media.src = item.src;
        media.title = item.caption || "Aperçu de l'attestation";
        media.loading = "lazy";
        media.className = "media-lightbox-media is-loaded";
        lightboxFrame.replaceChildren(media);
      } else {
        const loader = createModalLoader();
        const media = new Image();
        media.className = "media-lightbox-media";
        media.alt = item.caption || "Attestation";
        lightboxFrame.replaceChildren(loader, media);

        let revealed = false;
        function revealImage() {
          if (revealed) return;
          revealed = true;
          loader.classList.add("is-hidden");
          media.classList.add("is-loaded");
          window.setTimeout(function () {
            if (loader.parentNode) loader.remove();
          }, 200);
        }

        media.src = item.src;
        if (media.complete) {
          window.setTimeout(revealImage, 90);
        } else {
          media.onload = revealImage;
          media.onerror = revealImage;
        }
      }
    } else {
      const loader = createModalLoader();
      const gallery = document.createElement("div");
      gallery.className = "media-lightbox-gallery";

      let loadedCount = 0;
      function checkAllLoaded() {
        loadedCount += 1;
        if (loadedCount >= items.length) {
          loader.classList.add("is-hidden");
          window.setTimeout(function () {
            if (loader.parentNode) loader.remove();
          }, 200);
        }
      }

      items.forEach(function (item) {
        const figure = document.createElement("figure");
        const isPdf = /\.pdf($|[?#])/i.test(item.src);
        let media = null;

        if (isPdf) {
          media = document.createElement("iframe");
          media.src = item.src;
          media.title = item.caption || "Aperçu de l'attestation";
          media.loading = "lazy";
          media.className = "media-lightbox-media is-loaded";
          checkAllLoaded();
        } else {
          media = new Image();
          media.src = item.src;
          media.alt = item.caption || "Attestation";
          media.onload = function () {
            media.classList.add("is-loaded");
            checkAllLoaded();
          };
          media.onerror = checkAllLoaded;
          if (media.complete) {
            window.setTimeout(function () {
              media.classList.add("is-loaded");
              checkAllLoaded();
            }, 90);
          }
        }

        figure.appendChild(media);

        if (item.caption) {
          const caption = document.createElement("figcaption");
          caption.textContent = item.caption;
          figure.appendChild(caption);
        }

        gallery.appendChild(figure);
      });

      lightboxFrame.replaceChildren(loader, gallery);
    }

    const titleText = trigger.dataset.proofTitle || "Attestation officielle";
    if (lightboxTitle) {
      lightboxTitle.textContent = titleText;
    }

    const pdfUrl = trigger.dataset.proofPdf || (/\.pdf($|[?#])/i.test(items[0]?.src || "") ? items[0].src : null);
    const captionText = items.length > 1
      ? `${items.length} documents disponibles`
      : (items[0].caption || titleText);

    if (pdfUrl) {
      lightboxCaption.innerHTML = `<span>${captionText}</span> <span style="opacity:0.35;margin:0 0.4rem;">•</span> <a href="${pdfUrl}" target="_blank" rel="noopener noreferrer" class="media-lightbox-pdf-link" download>📥 Télécharger le PDF officiel</a>`;
    } else {
      lightboxCaption.textContent = captionText;
    }
    lightboxCaption.hidden = !captionText && !pdfUrl;

    lastMediaTrigger = trigger;
    isClosingLightbox = false;
    dialog.classList.remove("is-closing");
    dialog.hidden = false;
    dialog.classList.add("is-open");
    document.documentElement.classList.add("media-open");
    document.body.classList.add("media-open");

    dialog.querySelector(".media-lightbox-close").focus({ preventScroll: true });
  }

  const expandIconSvg = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>';
  const playIconSvg = '<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';

  function wireProjectMedia(projectImage) {
    const media = projectImage.querySelector("img, video, iframe");
    if (!media) return;

    const openButton = document.createElement("button");
    openButton.className = "media-open-btn";
    openButton.type = "button";
    openButton.setAttribute("aria-label", "Voir ce media en grand");
    projectImage.appendChild(openButton);
    updateMediaButton(projectImage);

    function openCurrentMedia(trigger) {
      openLightboxFromMedia(getActiveMedia(projectImage), trigger);
    }

    openButton.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      openCurrentMedia(openButton);
    });

    projectImage.addEventListener("click", function (event) {
      if (event.target.closest("button, .project-carousel-controls")) return;
      openCurrentMedia(openButton);
    });
  }

  function updateMediaButton(projectImage) {
    const button = projectImage.querySelector(".media-open-btn");
    if (!button) return;
    const activeMedia = getActiveMedia(projectImage);
    const clickToPlay = mediaClickRequired && activeMedia && activeMedia.matches("video, iframe");
    projectImage.classList.toggle("is-click-to-play", Boolean(clickToPlay));
    button.innerHTML = clickToPlay
      ? playIconSvg + '<span>Lire la vidéo</span>'
      : expandIconSvg + '<span>Agrandir</span>';
    button.setAttribute("aria-label", clickToPlay ? "Lire la vidéo du projet" : "Voir ce media en grand");
  }

  function ensureVideoSource(video) {
    if (!video || video.src || !video.dataset.src) return;
    video.src = video.dataset.src;
    video.load();
  }

  function setVideoState(video, shouldPlay) {
    const carousel = video.closest(".project-carousel");
    const activeSlide = carousel
      ? Array.from(carousel.children).filter(function (slide) {
        return slide.matches("img, video, iframe");
      })[Number(carousel.dataset.activeIndex)]
      : null;
    const isActiveSlide = !carousel || activeSlide === video || (activeSlide && activeSlide.contains(video));

    if (shouldPlay && !reduceMotion && isActiveSlide &&
      isMediaNearViewport(video, 180) && !document.body.classList.contains("media-open")) {
      loadProjectPreview(video.closest(".project-image"));
      ensureVideoSource(video);
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(function () {});
      }
    } else {
      video.pause();
    }
  }

  carousels.forEach(function (carousel) {
    const slides = Array.from(carousel.children).filter(function (slide) {
      return slide.matches("img, video, iframe");
    });
    const projectImage = carousel.closest(".project-image");
    if (!projectImage || slides.length < 2) return;

    let activeIndex = 0;
    let autoTimer = null;
    const step = 100 / slides.length;

    carousel.classList.add("is-enhanced");
    carousel.dataset.activeIndex = "0";
    carousel.style.width = slides.length * 100 + "%";

    slides.forEach(function (slide) {
      slide.style.flex = "0 0 " + step + "%";
      slide.style.width = step + "%";
      slide.style.height = "100%";
      slide.style.display = "block";
    });

    const controls = document.createElement("div");
    controls.className = "project-carousel-controls";

    const prevButton = document.createElement("button");
    prevButton.className = "project-carousel-control";
    prevButton.type = "button";
    prevButton.textContent = "<";
    prevButton.setAttribute("aria-label", "Image precedente");

    const nextButton = document.createElement("button");
    nextButton.className = "project-carousel-control";
    nextButton.type = "button";
    nextButton.textContent = ">";
    nextButton.setAttribute("aria-label", "Image suivante");

    const count = document.createElement("span");
    count.className = "project-carousel-count";

    controls.append(prevButton, count, nextButton);
    projectImage.appendChild(controls);

    function showSlide(nextIndex) {
      activeIndex = (nextIndex + slides.length) % slides.length;

      slides.forEach(function (slide, idx) {
        if (idx !== activeIndex) {
          if (slide.matches("video")) {
            slide.pause();
          }
          slide.querySelectorAll("video").forEach(function (video) {
            video.pause();
          });
        }
      });

      carousel.dataset.activeIndex = String(activeIndex);
      carousel.style.transform = "translateX(-" + step * activeIndex + "%)";
      count.textContent = activeIndex + 1 + "/" + slides.length;
      updateMediaButton(projectImage);
      loadProjectPreview(projectImage);

      if (isVisible) {
        const activeSlide = slides[activeIndex];
        if (activeSlide.matches("video")) setVideoState(activeSlide, true);
        activeSlide.querySelectorAll("video").forEach(function (video) {
          setVideoState(video, true);
        });
      }
    }

    function stopAuto() {
      if (autoTimer) {
        window.clearInterval(autoTimer);
        autoTimer = null;
      }
    }

    let isVisible = !canObserve;

    function startAuto() {
      if (reduceMotion || !isVisible) return;
      stopAuto();
      autoTimer = window.setInterval(function () {
        showSlide(activeIndex + 1);
      }, 4200);
    }

    function move(direction) {
      stopAuto();
      showSlide(activeIndex + direction);
    }

    prevButton.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      move(-1);
    });

    nextButton.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      move(1);
    });

    projectImage.addEventListener("mouseenter", stopAuto);
    projectImage.addEventListener("mouseleave", startAuto);
    projectImage.addEventListener("focusin", stopAuto);
    projectImage.addEventListener("focusout", function (event) {
      if (!projectImage.contains(event.relatedTarget)) {
        startAuto();
      }
    });

    showSlide(0);

    if (canObserve) {
      const carouselObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            isVisible = entry.isIntersecting;
            if (isVisible) {
              startAuto();
              const activeSlide = slides[activeIndex];
              if (activeSlide.matches("video")) setVideoState(activeSlide, true);
              activeSlide.querySelectorAll("video").forEach(function (video) {
                setVideoState(video, true);
              });
            } else {
              stopAuto();
              slides.forEach(function (slide) {
                if (slide.matches("video")) slide.pause();
                slide.querySelectorAll("video").forEach(function (video) {
                  video.pause();
                });
              });
            }
          });
        },
        { rootMargin: "160px 0px", threshold: 0.08 }
      );

      carouselObserver.observe(projectImage);
    } else {
      startAuto();
    }
  });

  document.querySelectorAll(".project-image").forEach(wireProjectMedia);

  document.querySelectorAll("[data-proof-gallery]").forEach(function (trigger) {
    trigger.classList.add("proof-gallery-trigger");
    trigger.addEventListener("click", function () {
      openProofGallery(trigger);
    });
  });

  function loadLazyIframe(iframe) {
    if (mediaClickRequired || !iframe || iframe.src || !iframe.dataset.src) return;
    if (!isMediaNearViewport(iframe, 500)) return;
    iframe.src = iframe.dataset.src;
    updateIframePoster(iframe);
  }

  const lazyProjectIframes = document.querySelectorAll("iframe.project-video-frame[data-src]");

  function updateIframePoster(iframe) {
    let poster = iframePosters.get(iframe);
    if (!poster) {
      const projectImage = iframe.closest(".project-image");
      if (!projectImage || !isMediaNearViewport(projectImage, 300)) return;
      poster = document.createElement("div");
      poster.className = "project-iframe-poster";
      poster.setAttribute("aria-hidden", "true");
      if (iframe.dataset.poster) {
        poster.style.backgroundImage = "url(" + JSON.stringify(iframe.dataset.poster) + ")";
      }
      projectImage.appendChild(poster);
      iframePosters.set(iframe, poster);
    }
    poster.hidden = Boolean(iframe.getAttribute("src"));
  }

  function loadProjectPreview(projectImage, forceInstant) {
    if (!projectImage) return;
    if (!forceInstant && !isMediaNearViewport(projectImage, 600)) return;
    const media = getActiveMedia(projectImage);
    if (!media) return;

    if (media.matches("img") && !media.getAttribute("src")) {
      media.setAttribute("fetchpriority", "high");
      // Prioritize high-res candidates to prevent blur on retina screens:
      if (media.dataset.srcset) {
        media.srcset = media.dataset.srcset.replace(/[^,]*400\.webp\?[^,]*400w,?\s*/g, "");
      }
      const crispSrc = (window.devicePixelRatio >= 1.5 && media.dataset.fullSrc) ? media.dataset.fullSrc : media.dataset.src;
      if (crispSrc) media.src = crispSrc;
    } else if (media.matches("video")) {
      if (!media.getAttribute("poster") && media.dataset.poster) {
        media.poster = media.dataset.poster;
      }
      ensureVideoSource(media);
    } else if (media.matches("iframe")) {
      updateIframePoster(media);
    }
  }

  function requestPreviewScan() {
    if (previewScanFrame) return;
    previewScanFrame = window.requestAnimationFrame(function () {
      previewScanFrame = 0;
      document.querySelectorAll(".project-image").forEach(loadProjectPreview);
      if (!canObserve) {
        projectVideos.forEach(function (video) {
          setVideoState(video, isMediaNearViewport(video, 180));
        });
        lazyProjectIframes.forEach(function (iframe) {
          if (isMediaNearViewport(iframe, 500)) loadLazyIframe(iframe);
        });
      }
    });
  }

  if (canObserve) {
    // Preload prédictif large (750px) pour affichage instantané des images dès le défilement
      const previewObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            loadProjectPreview(entry.target, true);
            previewObserver.unobserve(entry.target);
          }
        });
      }, { rootMargin: "750px 0px 350px 0px", threshold: 0.01 });
    document.querySelectorAll(".project-image").forEach(function (projectImage) {
      previewObserver.observe(projectImage);
    });
  } else {
    window.addEventListener("scroll", requestPreviewScan, { passive: true });
  }
  window.addEventListener("resize", requestPreviewScan);
  requestPreviewScan();

  if (lazyProjectIframes.length) {
    if (canObserve) {
      const iframeObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            loadLazyIframe(entry.target);
            // Keep observing: the network may switch between fast and slow.
          });
        },
        { rootMargin: "500px 0px", threshold: 0.01 }
      );

      lazyProjectIframes.forEach(function (iframe) {
        iframeObserver.observe(iframe);
      });
    } else {
      requestPreviewScan();
    }
  }

  document.querySelectorAll("[data-copy]").forEach(function (button) {
    const defaultHTML = button.innerHTML;
    const defaultText = button.textContent.trim();
    const hasSvg = button.querySelector("svg") !== null;

    function showCopiedState() {
      button.classList.add("copied");
      if (hasSvg) {
        button.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      } else {
        button.textContent = "Copié";
      }
      window.setTimeout(function () {
        button.classList.remove("copied");
        button.innerHTML = defaultHTML;
      }, 1800);
    }

    button.addEventListener("click", function () {
      const value = button.dataset.copy || "";
      if (!value) return;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(showCopiedState).catch(function () {
          window.prompt("Copier :", value);
        });
      } else {
        window.prompt("Copier :", value);
      }
    });
  });

  const projectVideos = document.querySelectorAll(".project-video-local");

  if (projectVideos.length) {
    if (canObserve) {
      const videoObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            setVideoState(entry.target, entry.isIntersecting);
          });
        },
        { rootMargin: "180px 0px", threshold: 0.12 }
      );

      projectVideos.forEach(function (video) {
        videoObserver.observe(video);
      });
    } else {
      requestPreviewScan();
    }
  }

  function refreshMediaNetworkPolicy() {
    const nextClickRequired = requiresMediaClick();
    if (nextClickRequired === mediaClickRequired) return;
    mediaClickRequired = nextClickRequired;

    projectVideos.forEach(function (video) {
      if (mediaClickRequired && !video.matches(".project-video-local")) {
        video.pause();
        if (video.getAttribute("src")) {
          video.removeAttribute("src");
          video.load();
        }
      } else if (isMediaNearViewport(video, 180)) {
        setVideoState(video, true);
      }
    });

    lazyProjectIframes.forEach(function (iframe) {
      if (mediaClickRequired) {
        iframe.removeAttribute("src");
        updateIframePoster(iframe);
      } else if (isMediaNearViewport(iframe, 500)) {
        loadLazyIframe(iframe);
      }
    });

    document.querySelectorAll(".project-image").forEach(updateMediaButton);
    requestPreviewScan();
  }

  function isMediaNearViewport(media, margin) {
    if (!media.getClientRects().length || media.closest("[hidden]")) return false;
    const bounds = media.getBoundingClientRect();
    return bounds.bottom >= -margin && bounds.top <= window.innerHeight + margin &&
      bounds.right > 0 && bounds.left < window.innerWidth;
  }

  if (networkConnection && typeof networkConnection.addEventListener === "function") {
    networkConnection.addEventListener("change", refreshMediaNetworkPolicy);
  }

  if (typeof navigator.getBattery === "function") {
    navigator.getBattery().then(function (battery) {
      function updateBatteryState() {
        batterySaverActive = !battery.charging && battery.level <= 0.2;
        refreshMediaNetworkPolicy();
      }
      updateBatteryState();
      battery.addEventListener("chargingchange", updateBatteryState);
      battery.addEventListener("levelchange", updateBatteryState);
    }).catch(function () {});
  }

  function loadHeroDecorations() {
    const hero = document.getElementById("home");
    if (hero) {
      const background = mediaClickRequired
        ? "assets/previews/panneau-fifa-d0f84fbc-400.webp?cache=20261026"
        : "assets/previews/panneau-fifa-d0f84fbc-1200.webp?cache=20261026";
      hero.style.setProperty("--hero-landscape", "url(" + JSON.stringify(background) + ")");
    }
    document.querySelectorAll(".hero-3d-img[data-decoration-src]").forEach(function (image) {
      if (image.dataset.decorationSrcset) image.srcset = image.dataset.decorationSrcset;
      image.src = image.dataset.decorationSrc;
    });
  }

  const heroPhoto = Array.from(document.querySelectorAll(".profile-photo")).find(function (image) {
    return image.getClientRects().length;
  });
  let heroDecorationsStarted = false;
  function scheduleHeroDecorations() {
    if (heroDecorationsStarted) return;
    heroDecorationsStarted = true;
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(loadHeroDecorations);
    });
  }
  if (!heroPhoto || heroPhoto.complete) {
    scheduleHeroDecorations();
  } else {
    heroPhoto.addEventListener("load", scheduleHeroDecorations, { once: true });
    heroPhoto.addEventListener("error", scheduleHeroDecorations, { once: true });
  }

  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeLightbox();
    }
  });

  if (summaryLinks.length) {
    const sectionMap = new Map();

    summaryLinks.forEach(function (link) {
      const sectionId = link.dataset.sectionLink;
      const section = sectionId ? document.getElementById(sectionId) : null;
      if (section) sectionMap.set(section, link);
    });

    function setActiveSection(section) {
      summaryLinks.forEach(function (link) {
        const isActive = link === sectionMap.get(section);
        link.classList.toggle("active", isActive);
        if (isActive) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });

      navSectionLinks.forEach(function (link) {
        const linkId = (link.getAttribute("href") || "").replace("#", "");
        const isActive = linkId === section.id;
        link.classList.toggle("active", isActive);
        if (isActive) {
          link.setAttribute("aria-current", "page");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }

    if (canObserve && sectionMap.size) {
      const observedSections = Array.from(sectionMap.keys());
      let activeSectionTicking = false;

      function updateActiveSection() {
        const marker = Math.min(window.innerHeight * 0.35, 260);
        let activeSection = observedSections[0];

        observedSections.forEach(function (section) {
          if (section.getBoundingClientRect().top <= marker) {
            activeSection = section;
          }
        });

        if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) {
          activeSection = observedSections[observedSections.length - 1];
        }

        if (activeSection) {
          setActiveSection(activeSection);
        }
      }

      function requestActiveSectionUpdate() {
        if (activeSectionTicking) return;
        activeSectionTicking = true;
        window.requestAnimationFrame(function () {
          activeSectionTicking = false;
          updateActiveSection();
        });
      }

      const sectionObserver = new IntersectionObserver(
        function () {
          requestActiveSectionUpdate();
        },
        { rootMargin: "-36% 0px -48% 0px", threshold: 0.01 }
      );

      sectionMap.forEach(function (_link, section) {
        sectionObserver.observe(section);
      });

      window.addEventListener("resize", updateActiveSection);
      updateActiveSection();
    }
  }

  const revealItems = document.querySelectorAll(".reveal");
    if (!canObserve) {
      revealItems.forEach(function (item) {
        item.classList.add("visible");
      });
      return;
    }

    // Anticipation prédictive ultra-fluide : déclenchement 250px en amont pour affichage instantané
    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "250px 0px 100px 0px", threshold: 0.01 }
    );

    const initialViewportBottom = window.innerHeight + 160;
    revealItems.forEach(function (item) {
      // Révélation immédiate des éléments déjà dans le premier pli pour 0 latence au chargement
      const rect = item.getBoundingClientRect();
      if (rect.top <= initialViewportBottom) {
        item.classList.add("visible");
      } else {
        revealObserver.observe(item);
      }
    });

  // =========================================================================
  // CARROUSEL 3D COVERFLOW SKILLS (MOBILE) AVEC ROTATION AUTOMATIQUE
  // =========================================================================
  const skillsGrid = document.querySelector(".skills-grid");
  const skillsCards = skillsGrid ? Array.from(skillsGrid.querySelectorAll(".skill-card")) : [];
  const skillsDots = document.getElementById("skills-dots");
  const skillsCounter = document.getElementById("skills-counter");
  const skillsPrev = document.getElementById("skills-prev");
  const skillsNext = document.getElementById("skills-next");

  if (skillsGrid && skillsCards.length > 0) {
    let currentSkillIndex = 0;
    const totalSkills = skillsCards.length;
    let autoRotateTimer = null;
    let isUserInteracting = false;
    let resumeTimeout = null;
    const autoRotateDelay = 3500; // 3.5s par carte pour une lecture confortable

    // Initialisation des points de navigation (dots)
    if (skillsDots) {
      skillsDots.innerHTML = "";
      skillsCards.forEach(function (_, idx) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "skill-dot" + (idx === 0 ? " active" : "");
        dot.setAttribute("aria-label", "Compétence " + (idx + 1));
        dot.addEventListener("click", function () {
          pauseAndGoTo(idx);
        });
        skillsDots.appendChild(dot);
      });
    }

    function update3DDeck() {
      // Sur écran desktop (> 860px), on désactive le mode 3D pour préserver la grille 4x2
      if (window.innerWidth > 860) {
        skillsCards.forEach(function (card) {
          card.classList.remove("deck-active", "deck-prev", "deck-next", "deck-hidden-left", "deck-hidden-right");
        });
        stopAutoRotate();
        return;
      }

      skillsCards.forEach(function (card, i) {
        card.classList.remove("deck-active", "deck-prev", "deck-next", "deck-hidden-left", "deck-hidden-right");

        if (i === currentSkillIndex) {
          card.classList.add("deck-active");
        } else if (i === (currentSkillIndex - 1 + totalSkills) % totalSkills) {
          card.classList.add("deck-prev");
        } else if (i === (currentSkillIndex + 1) % totalSkills) {
          card.classList.add("deck-next");
        } else {
          const diff = (i - currentSkillIndex + totalSkills) % totalSkills;
          if (diff > totalSkills / 2) {
            card.classList.add("deck-hidden-left");
          } else {
            card.classList.add("deck-hidden-right");
          }
        }
      });

      // Mise à jour visuelle des dots
      if (skillsDots) {
        const dots = Array.from(skillsDots.children);
        dots.forEach(function (dot, idx) {
          dot.classList.toggle("active", idx === currentSkillIndex);
        });
      }

      // Mise à jour du compteur chiffré
      if (skillsCounter) {
        skillsCounter.textContent = String(currentSkillIndex + 1).padStart(2, "0") + " / " + String(totalSkills).padStart(2, "0");
      }
    }

    function goToSkill(idx) {
      currentSkillIndex = (idx + totalSkills) % totalSkills;
      update3DDeck();
    }

    function nextSkill() {
      goToSkill(currentSkillIndex + 1);
    }

    function prevSkill() {
      goToSkill(currentSkillIndex - 1);
    }

    let isSkillsInViewport = false;

    function startAutoRotate() {
      if (autoRotateTimer || window.innerWidth > 860 || !isSkillsInViewport) return;
      autoRotateTimer = window.setInterval(function () {
        if (!isUserInteracting) {
          nextSkill();
        }
      }, autoRotateDelay);
    }

    function stopAutoRotate() {
      if (autoRotateTimer) {
        window.clearInterval(autoRotateTimer);
        autoRotateTimer = null;
      }
    }

    // Observer pour mettre en pause la rotation dès que la section n'est plus visible (économie CPU/GPU)
    if (canObserve) {
      const skillsSectionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          isSkillsInViewport = entry.isIntersecting;
          if (isSkillsInViewport && window.innerWidth <= 860) {
            startAutoRotate();
          } else {
            stopAutoRotate();
          }
        });
      }, { rootMargin: "80px 0px", threshold: 0.05 });
      skillsSectionObserver.observe(skillsGrid);
    } else {
      isSkillsInViewport = true;
    }

    function pauseAndGoTo(idx) {
      isUserInteracting = true;
      goToSkill(idx);
      clearTimeout(resumeTimeout);
      resumeTimeout = window.setTimeout(function () {
        isUserInteracting = false;
      }, 5000); // Reprend la rotation automatique après 5s
    }

    if (skillsPrev) {
      skillsPrev.addEventListener("click", function () {
        pauseAndGoTo(currentSkillIndex - 1);
      });
    }

    if (skillsNext) {
      skillsNext.addEventListener("click", function () {
        pauseAndGoTo(currentSkillIndex + 1);
      });
    }

    // Clic sur une carte adjacente pour la faire passer au centre
    skillsCards.forEach(function (card, idx) {
      card.addEventListener("click", function () {
        if (window.innerWidth <= 860 && idx !== currentSkillIndex) {
          pauseAndGoTo(idx);
        }
      });
    });

    // Support tactile Swipe (glisser du doigt)
    let touchStartX = 0;
    let touchStartY = 0;
    skillsGrid.addEventListener("touchstart", function (e) {
      isUserInteracting = true;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    skillsGrid.addEventListener("touchend", function (e) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;

      if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) {
          goToSkill(currentSkillIndex - 1);
        } else {
          goToSkill(currentSkillIndex + 1);
        }
      }

      clearTimeout(resumeTimeout);
      resumeTimeout = window.setTimeout(function () {
        isUserInteracting = false;
      }, 5000);
    }, { passive: true });

    // Pause au survol de la souris
    skillsGrid.addEventListener("mouseenter", function () {
      isUserInteracting = true;
    });
    skillsGrid.addEventListener("mouseleave", function () {
      isUserInteracting = false;
    });

    // Gestion du responsive
    window.addEventListener("resize", function () {
      update3DDeck();
      if (window.innerWidth <= 860) {
        startAutoRotate();
      } else {
        stopAutoRotate();
      }
    });

    // Pause si la fenêtre n'est pas active
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        stopAutoRotate();
      } else if (window.innerWidth <= 860) {
        startAutoRotate();
      }
    });

    // Démarrage initial
    update3DDeck();
    if (window.innerWidth <= 860) {
      startAutoRotate();
    }
  }

})();
