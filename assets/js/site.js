(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;
  const header = document.getElementById("site-header");
  const progressBar = document.getElementById("progress-bar");
  const transitionEl = document.getElementById("page-transition");
  const transitionLabel = transitionEl?.querySelector("span");
  const cursorDot = document.getElementById("cursor-dot");
  const cursorRing = document.getElementById("cursor-ring");
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  const revealObserver = !prefersReducedMotion
    ? new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.16,
          rootMargin: "0px 0px -8% 0px"
        }
      )
    : null;

  function markReady() {
    requestAnimationFrame(() => {
      body.classList.add("is-ready");
    });
  }

  function updateHeaderAndProgress() {
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    }

    if (!progressBar) {
      return;
    }

    const doc = document.documentElement;
    const total = doc.scrollHeight - window.innerHeight;
    const progress = total > 0 ? window.scrollY / total : 0;
    progressBar.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
  }

  function initReveal() {
    const items = document.querySelectorAll("[data-reveal]");
    items.forEach((item) => {
      if (prefersReducedMotion) {
        item.classList.add("is-visible");
      } else {
        revealObserver?.observe(item);
      }
    });
  }

  function initCurrentNav() {
    const page = body.dataset.page;
    if (!page) {
      return;
    }

    document.querySelectorAll(`[data-nav="${page}"]`).forEach((link) => {
      link.classList.add("is-current");
      link.setAttribute("aria-current", "page");
    });
  }

  function initCursor() {
    if (!finePointer || prefersReducedMotion || !cursorDot || !cursorRing) {
      return;
    }

    body.classList.add("has-custom-cursor");

    const hoverSelector =
      "a, button, .button, .chapter-link, .preview-card, .shelf-book, .poster-card, .photo-card, .app-showcase";

    window.addEventListener("mousemove", (event) => {
      const { clientX, clientY } = event;
      cursorDot.style.left = `${clientX}px`;
      cursorDot.style.top = `${clientY}px`;
      cursorRing.style.left = `${clientX}px`;
      cursorRing.style.top = `${clientY}px`;
    });

    document.querySelectorAll(hoverSelector).forEach((item) => {
      item.addEventListener("mouseenter", () => body.classList.add("cursor-hover"));
      item.addEventListener("mouseleave", () => body.classList.remove("cursor-hover"));
    });
  }

  function setTransitionLabel(link) {
    if (!transitionLabel) {
      return;
    }

    const label =
      link.dataset.transitionLabel ||
      link.dataset.bookTitle ||
      link.getAttribute("aria-label") ||
      link.textContent?.trim() ||
      "Portfolio";
    transitionLabel.textContent = label;
  }

  function storeBookTransition(link) {
    const slug = link.dataset.bookSlug;
    const cover =
      link.querySelector(".shelf-book__face") ||
      link.querySelector(".chapter-link__cover") ||
      link.querySelector(".book-story__cover");

    if (!slug || !cover) {
      return;
    }

    const rect = cover.getBoundingClientRect();
    const styles = window.getComputedStyle(cover);
    const payload = {
      slug,
      title: link.dataset.bookTitle || cover.textContent?.trim() || "",
      meta: link.dataset.bookMeta || "",
      backgroundImage: styles.backgroundImage,
      backgroundColor: styles.backgroundColor,
      borderRadius: styles.borderRadius,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      rect: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      }
    };

    sessionStorage.setItem("bookTransition", JSON.stringify(payload));
  }

  function navigateWithTransition(link) {
    const href = link.getAttribute("href");
    if (!href) {
      return;
    }

    setTransitionLabel(link);
    body.classList.add("is-leaving");
    window.setTimeout(() => {
      window.location.href = href;
    }, prefersReducedMotion ? 0 : 320);
  }

  function initInternalNavigation() {
    const links = document.querySelectorAll("a[href]");

    links.forEach((link) => {
      const rawHref = link.getAttribute("href");
      if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:")) {
        return;
      }

      const url = new URL(rawHref, window.location.href);
      if (url.origin !== window.location.origin) {
        return;
      }

      link.addEventListener("click", (event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }

        const destination = new URL(link.href, window.location.href);
        const current = new URL(window.location.href);
        if (destination.href === current.href) {
          return;
        }

        event.preventDefault();

        if (link.hasAttribute("data-book-link")) {
          storeBookTransition(link);
        }

        navigateWithTransition(link);
      });
    });
  }

  function reorderSelectedBook(selected) {
    if (!selected) {
      return;
    }

    const container = document.querySelector(".chapters");
    if (!container) {
      return;
    }

    container.prepend(selected);
  }

  function updateWritingSelection(selected) {
    if (!selected) {
      return;
    }

    document.querySelectorAll(".chapter-link").forEach((link) => {
      link.classList.toggle("is-active", link.dataset.bookSlug === selected.dataset.bookSlug);
    });

    const titleTarget = document.querySelector("[data-selected-book-title]");
    const summaryTarget = document.querySelector("[data-selected-book-summary]");

    if (titleTarget) {
      titleTarget.textContent = selected.querySelector(".book-story__title")?.textContent?.trim() || "Featured chapter";
    }

    if (summaryTarget) {
      summaryTarget.textContent =
        selected.querySelector(".book-story__dek")?.textContent?.trim() ||
        "A selected chapter from the writing portfolio.";
    }
  }

  function animateBookArrival(selected, payload) {
    if (!selected || !payload || prefersReducedMotion) {
      return false;
    }

    const target = selected.querySelector(".book-story__cover");
    if (!target) {
      return false;
    }

    window.scrollTo({ top: 0, behavior: "auto" });
    selected.classList.add("is-awaiting-arrival");

    const targetRect = target.getBoundingClientRect();
    const scaleX = window.innerWidth / (payload.viewportWidth || window.innerWidth);
    const scaleY = window.innerHeight / (payload.viewportHeight || window.innerHeight);
    const overlay = document.createElement("div");
    overlay.className = "book-transition-card";
    overlay.innerHTML = `
      <div class="book-transition-card__label">
        <span class="book-transition-card__meta">${payload.meta || "Writing"}</span>
        <span class="book-transition-card__meta">Opening</span>
      </div>
      <div class="book-transition-card__title">${payload.title || ""}</div>
    `;

    const startRect = payload.rect || { left: 48, top: 120, width: 120, height: 300 };
    overlay.style.left = `${startRect.left * scaleX}px`;
    overlay.style.top = `${startRect.top * scaleY}px`;
    overlay.style.width = `${startRect.width * scaleX}px`;
    overlay.style.height = `${startRect.height * scaleY}px`;
    overlay.style.borderRadius = payload.borderRadius || "20px";
    overlay.style.background =
      payload.backgroundImage && payload.backgroundImage !== "none"
        ? payload.backgroundImage
        : payload.backgroundColor || "linear-gradient(145deg, #714024, #23130a)";

    document.body.appendChild(overlay);
    document.body.classList.add("is-locked");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.style.left = `${targetRect.left}px`;
        overlay.style.top = `${targetRect.top}px`;
        overlay.style.width = `${targetRect.width}px`;
        overlay.style.height = `${targetRect.height}px`;
        overlay.style.borderRadius = window.getComputedStyle(target).borderRadius;
      });
    });

    const cleanup = () => {
      overlay.remove();
      document.body.classList.remove("is-locked");
      selected.classList.remove("is-awaiting-arrival");
      target.classList.add("is-arrived");
      window.setTimeout(() => target.classList.remove("is-arrived"), 900);
      window.setTimeout(() => {
        selected.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 160);
    };

    overlay.addEventListener("transitionend", cleanup, { once: true });
    return true;
  }

  function initWritingPage() {
    if (body.dataset.page !== "writing") {
      return;
    }

    const stories = Array.from(document.querySelectorAll(".book-story"));
    if (!stories.length) {
      return;
    }

    const url = new URL(window.location.href);
    const selectedSlug = url.searchParams.get("book") || window.location.hash.replace("#", "") || stories[0].dataset.bookSlug;
    const selected = stories.find((story) => story.dataset.bookSlug === selectedSlug) || stories[0];

    stories.forEach((story) => story.classList.remove("is-selected"));
    selected.classList.add("is-selected");

    reorderSelectedBook(selected);
    updateWritingSelection(selected);

    const transitionRaw = sessionStorage.getItem("bookTransition");
    let didAnimate = false;
    if (transitionRaw) {
      try {
        const payload = JSON.parse(transitionRaw);
        if (payload.slug === selected.dataset.bookSlug) {
          didAnimate = animateBookArrival(selected, payload);
        }
      } catch (error) {
        didAnimate = false;
      }
      sessionStorage.removeItem("bookTransition");
    }

    if (!didAnimate && selected) {
      window.setTimeout(() => {
        selected.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start"
        });
      }, 120);
    }
  }

  function init() {
    markReady();
    initReveal();
    initCurrentNav();
    initCursor();
    initInternalNavigation();
    initWritingPage();
    updateHeaderAndProgress();
  }

  init();
  window.addEventListener("scroll", updateHeaderAndProgress, { passive: true });
  window.addEventListener("resize", updateHeaderAndProgress);
})();
