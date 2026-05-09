(function () {
  const root = document.documentElement;
  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-menu");
  const navBackdrop = document.querySelector(".nav-backdrop");
  const themeToggle = document.querySelector(".theme-toggle");
  const year = document.getElementById("current-year");
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const quickTop = document.querySelector(".quick-top");
  const pageProgressBar = document.querySelector(".page-progress-bar");
  const pageLoader = document.getElementById("page-loader");

  if (pageLoader) {
    const loaderStart = performance.now();
    let loaderHidden = false;

    function hidePageLoader() {
      if (loaderHidden) return;
      loaderHidden = true;

      const elapsed = performance.now() - loaderStart;
      const delay = Math.max(0, 450 - elapsed);

      window.setTimeout(function () {
        pageLoader.classList.add("is-hidden");
        window.setTimeout(function () {
          pageLoader.remove();
        }, 560);
      }, delay);
    }

    if (document.readyState === "complete") {
      hidePageLoader();
    } else {
      window.addEventListener("load", hidePageLoader, { once: true });
      window.setTimeout(hidePageLoader, 4500);
    }
  }

  function setTheme(theme) {
    if (theme === "light") {
      root.setAttribute("data-theme", "light");
      if (themeMeta) themeMeta.setAttribute("content", "#f4f8f1");
      if (themeToggle) themeToggle.textContent = "Mode nuit";
    } else {
      root.removeAttribute("data-theme");
      if (themeMeta) themeMeta.setAttribute("content", "#07111f");
      if (themeToggle) themeToggle.textContent = "Mode clair";
    }
    localStorage.setItem("portfolio-theme", theme);
  }

  const savedTheme = localStorage.getItem("portfolio-theme") || "dark";
  setTheme(savedTheme);

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  if (pageProgressBar) {
    let progressTicking = false;

    function updatePageProgress() {
      const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / scrollable));
      root.style.setProperty("--scroll-progress", progress.toFixed(4));
      progressTicking = false;
    }

    function requestPageProgressUpdate() {
      if (progressTicking) return;
      progressTicking = true;
      window.requestAnimationFrame(updatePageProgress);
    }

    window.addEventListener("scroll", requestPageProgressUpdate, { passive: true });
    window.addEventListener("resize", requestPageProgressUpdate);
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
      window.scrollTo({ top: 0, behavior: "smooth" });
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
      window.scrollTo({ top, behavior: "smooth" });
    });
  });

  const filterButtons = document.querySelectorAll(".filter-btn");
  const projectCards = document.querySelectorAll(".project-card");
  const projectCount = document.getElementById("project-count");
  const projectsMore = document.getElementById("projects-more");
  const summaryLinks = document.querySelectorAll("[data-section-link]");
  const navSectionLinks = navMenu ? navMenu.querySelectorAll('.nav-menu a[href^="#"]') : [];
  const canObserve = "IntersectionObserver" in window;
  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduceMotion = reduceMotionQuery.matches;
  const mobileProjectsQuery = window.matchMedia("(max-width: 760px)");
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

  let scrollIdleTimer = null;

  function markScrolling() {
    document.body.classList.add("is-scrolling");
    window.clearTimeout(scrollIdleTimer);
    scrollIdleTimer = window.setTimeout(function () {
      document.body.classList.remove("is-scrolling");
    }, 160);
  }

  window.addEventListener("scroll", markScrolling, { passive: true });

  function projectMatchesFilter(card, filter) {
    const categories = (card.dataset.category || "").split(/\s+/);
    return filter === "all" || categories.includes(filter);
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
    const matchingCards = Array.from(projectCards).filter(function (card) {
      return projectMatchesFilter(card, activeProjectFilter);
    });
    const shouldLimit = mobileProjectsQuery.matches && matchingCards.length > visibleProjectLimit;

    projectCards.forEach(function (card) {
      const matchesFilter = projectMatchesFilter(card, activeProjectFilter);
      const isBeyondMobileLimit = mobileProjectsQuery.matches && matchingCards.indexOf(card) >= visibleProjectLimit;
      card.hidden = !matchesFilter || isBeyondMobileLimit;
    });

    if (projectsMore) {
      const canToggle = mobileProjectsQuery.matches && matchingCards.length > mobileProjectBatchSize;
      const hasMore = matchingCards.length > visibleProjectLimit;
      projectsMore.hidden = !canToggle;
      projectsMore.textContent = hasMore ? "Voir 7 projets de plus" : "Réduire la liste";
      projectsMore.setAttribute("aria-expanded", String(!hasMore));
    }

    updateProjectCount(activeProjectFilter, matchingCards.length);
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
      const matchingCount = Array.from(projectCards).filter(function (card) {
        return projectMatchesFilter(card, activeProjectFilter);
      }).length;
      const hasMore = matchingCount > visibleProjectLimit;

      visibleProjectLimit = hasMore ? visibleProjectLimit + mobileProjectBatchSize : mobileProjectBatchSize;
      updateProjectLimit();
    });
  }

  if (typeof mobileProjectsQuery.addEventListener === "function") {
    mobileProjectsQuery.addEventListener("change", updateProjectLimit);
  } else if (typeof mobileProjectsQuery.addListener === "function") {
    mobileProjectsQuery.addListener(updateProjectLimit);
  }

  updateProjectLimit();

  const carousels = document.querySelectorAll(".project-carousel");
  let lightbox = null;
  let lightboxFrame = null;
  let lightboxCaption = null;
  let lastMediaTrigger = null;

  if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    projectCards.forEach(function (card) {
      let tiltFrame = 0;
      let nextTiltX = "0deg";
      let nextTiltY = "0deg";

      function applyTilt() {
        card.style.setProperty("--tilt-x", nextTiltX);
        card.style.setProperty("--tilt-y", nextTiltY);
        tiltFrame = 0;
      }

      card.addEventListener("pointermove", function (event) {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        nextTiltX = (x * 4).toFixed(2) + "deg";
        nextTiltY = (y * -4).toFixed(2) + "deg";
        if (!tiltFrame) {
          tiltFrame = window.requestAnimationFrame(applyTilt);
        }
      });

      card.addEventListener("pointerleave", function () {
        nextTiltX = "0deg";
        nextTiltY = "0deg";
        if (!tiltFrame) {
          tiltFrame = window.requestAnimationFrame(applyTilt);
        }
      });
    });
  }

  function getLightbox() {
    if (lightbox) return lightbox;

    lightbox = document.createElement("div");
    lightbox.className = "media-lightbox";
    lightbox.hidden = true;
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", "Apercu du media");
    lightbox.innerHTML = [
      '<button class="media-lightbox-close" type="button">Fermer</button>',
      '<div class="media-lightbox-frame"></div>',
      '<p class="media-lightbox-caption"></p>',
    ].join("");

    document.body.appendChild(lightbox);
    lightboxFrame = lightbox.querySelector(".media-lightbox-frame");
    lightboxCaption = lightbox.querySelector(".media-lightbox-caption");

    lightbox.querySelector(".media-lightbox-close").addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });

    return lightbox;
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;

    lightbox.hidden = true;
    document.body.classList.remove("media-open");
    if (lightboxFrame) lightboxFrame.replaceChildren();
    if (lastMediaTrigger) {
      lastMediaTrigger.focus({ preventScroll: true });
      lastMediaTrigger = null;
    }
  }

  function getActiveMedia(projectImage) {
    const carousel = projectImage.querySelector(".project-carousel");
    if (carousel) {
      const slides = carousel.querySelectorAll("img");
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
      preview = new Image();
      preview.src = media.currentSrc || media.src;
      preview.alt = caption;
    } else if (tagName === "video") {
      preview = document.createElement("video");
      preview.src = media.currentSrc || media.getAttribute("src");
      preview.controls = true;
      preview.autoplay = true;
      preview.loop = true;
      preview.playsInline = true;
    } else if (tagName === "iframe") {
      preview = document.createElement("iframe");
      preview.src = media.getAttribute("src") || media.dataset.src || "";
      preview.title = media.getAttribute("title") || "Apercu video";
      preview.allow = media.getAttribute("allow") || "autoplay; fullscreen";
      preview.allowFullscreen = true;
    }

    if (!preview) return;

    preview.className = "media-lightbox-media";
    lightboxFrame.replaceChildren(preview);
    lightboxCaption.textContent = caption;
    lightboxCaption.hidden = !caption;
    lastMediaTrigger = trigger || null;
    dialog.hidden = false;
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
    const gallery = document.createElement("div");
    gallery.className = "media-lightbox-gallery";

    items.forEach(function (item) {
      const figure = document.createElement("figure");
      const image = new Image();
      image.src = item.src;
      image.alt = item.caption || "Attestation";
      image.className = "media-lightbox-media";
      figure.appendChild(image);

      if (item.caption) {
        const caption = document.createElement("figcaption");
        caption.textContent = item.caption;
        figure.appendChild(caption);
      }

      gallery.appendChild(figure);
    });

    lightboxFrame.replaceChildren(gallery);
    lightboxCaption.textContent = trigger.dataset.proofTitle || "Attestations du parcours";
    lightboxCaption.hidden = false;
    lastMediaTrigger = trigger;
    dialog.hidden = false;
    document.body.classList.add("media-open");
    dialog.querySelector(".media-lightbox-close").focus({ preventScroll: true });
  }

  function wireProjectMedia(projectImage) {
    const media = projectImage.querySelector("img, video, iframe");
    if (!media) return;

    const openButton = document.createElement("button");
    openButton.className = "media-open-btn";
    openButton.type = "button";
    openButton.textContent = "Agrandir";
    openButton.setAttribute("aria-label", "Voir ce media en grand");
    projectImage.appendChild(openButton);

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

  carousels.forEach(function (carousel) {
    const slides = Array.from(carousel.querySelectorAll("img"));
    const projectImage = carousel.closest(".project-image");
    if (!projectImage || slides.length < 2) return;

    let activeIndex = 0;
    let autoTimer = null;
    const step = 100 / slides.length;

    carousel.classList.add("is-enhanced");
    carousel.dataset.activeIndex = "0";

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
      carousel.dataset.activeIndex = String(activeIndex);
      carousel.style.transform = "translateX(-" + step * activeIndex + "%)";
      count.textContent = activeIndex + 1 + "/" + slides.length;
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
            } else {
              stopAuto();
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
    if (!iframe || iframe.src || !iframe.dataset.src) return;
    iframe.src = iframe.dataset.src;
  }

  const lazyProjectIframes = document.querySelectorAll("iframe.project-video-frame[data-src]");

  if (lazyProjectIframes.length) {
    if (canObserve) {
      const iframeObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            loadLazyIframe(entry.target);
            iframeObserver.unobserve(entry.target);
          });
        },
        { rootMargin: "420px 0px", threshold: 0.01 }
      );

      lazyProjectIframes.forEach(function (iframe) {
        iframeObserver.observe(iframe);
      });
    } else {
      lazyProjectIframes.forEach(loadLazyIframe);
    }
  }

  document.querySelectorAll("[data-copy]").forEach(function (button) {
    const defaultText = button.textContent;

    function showCopiedState() {
      button.textContent = "Copié";
      window.setTimeout(function () {
        button.textContent = defaultText;
      }, 1600);
    }

    button.addEventListener("click", function () {
      const value = button.dataset.copy || "";
      if (!value) return;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(showCopiedState).catch(function () {
          window.prompt("Copier l'adresse email", value);
        });
      } else {
        window.prompt("Copier l'adresse email", value);
      }
    });
  });

  const projectVideos = document.querySelectorAll(".project-video-local");

  if (projectVideos.length) {
    function setVideoState(video, shouldPlay) {
      if (shouldPlay && !reduceMotion) {
        video.play().catch(function () {});
      } else {
        video.pause();
      }
    }

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
      projectVideos.forEach(function (video) {
        setVideoState(video, true);
      });
    }
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
      const sectionObserver = new IntersectionObserver(
        function (entries) {
          const visibleSections = entries
            .filter(function (entry) {
              return entry.isIntersecting;
            })
            .sort(function (first, second) {
              return first.boundingClientRect.top - second.boundingClientRect.top;
            });

          if (visibleSections[0]) {
            setActiveSection(visibleSections[0].target);
          }
        },
        { rootMargin: "-36% 0px -48% 0px", threshold: 0.01 }
      );

      sectionMap.forEach(function (_link, section) {
        sectionObserver.observe(section);
      });
    }
  }

  const revealItems = document.querySelectorAll(".reveal");
  if (!canObserve) {
    revealItems.forEach(function (item) {
      item.classList.add("visible");
    });
    return;
  }

  const revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  revealItems.forEach(function (item) {
    revealObserver.observe(item);
  });
})();
