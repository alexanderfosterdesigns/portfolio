(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;
  const header = document.getElementById("site-header");
  const progressLine = document.getElementById("progress-line");
  const transitionEl = document.getElementById("page-transition");
  const transitionLabel = transitionEl?.querySelector("span");
  const cursorDot = document.getElementById("cursor-dot");
  const cursorRing = document.getElementById("cursor-ring");
  const cursorBlob = document.getElementById("cursor-blob");
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  const gsapReady = typeof window.gsap !== "undefined";
  const scrollTriggerReady = gsapReady && typeof window.ScrollTrigger !== "undefined";

  if (scrollTriggerReady) {
    window.gsap.registerPlugin(window.ScrollTrigger);
  }

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  function markReady() {
    requestAnimationFrame(() => body.classList.add("is-ready"));
  }

  function updateHeaderAndProgress() {
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 30);
    }

    if (!progressLine) {
      return;
    }

    const total = document.documentElement.scrollHeight - window.innerHeight;
    const progress = total > 0 ? window.scrollY / total : 0;
    progressLine.style.transform = `scaleX(${clamp(progress, 0, 1)})`;
  }

  function initFallbackReveal() {
    if (prefersReducedMotion || gsapReady) {
      document.querySelectorAll("[data-reveal]").forEach((el) => el.style.opacity = "1");
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.style.opacity = "1";
          entry.target.style.transform = "none";
          entry.target.style.filter = "none";
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    document.querySelectorAll("[data-reveal]").forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(40px)";
      el.style.filter = "blur(8px)";
      el.style.transition = "opacity 700ms ease, transform 700ms ease, filter 700ms ease";
      observer.observe(el);
    });
  }

  function initGsap() {
    if (!gsapReady || prefersReducedMotion) {
      initFallbackReveal();
      return;
    }

    const { gsap } = window;
    const revealItems = gsap.utils.toArray("[data-reveal]");
    revealItems.forEach((item) => {
      gsap.set(item, { autoAlpha: 0, y: 48, filter: "blur(10px)" });
      gsap.to(item, {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1.05,
        ease: "power3.out",
        scrollTrigger: scrollTriggerReady
          ? {
              trigger: item,
              start: "top 84%"
            }
          : undefined
      });
    });

    const titleLines = gsap.utils.toArray(".hero__title-line");
    if (titleLines.length) {
      gsap.fromTo(
        titleLines,
        { yPercent: 120, autoAlpha: 0 },
        {
          yPercent: 0,
          autoAlpha: 1,
          duration: 1,
          stagger: 0.08,
          ease: "power4.out",
          delay: 0.12
        }
      );
    }

    if (scrollTriggerReady) {
      const parallaxItems = gsap.utils.toArray("[data-parallax]");
      parallaxItems.forEach((item) => {
        const speed = parseFloat(item.getAttribute("data-parallax")) || 40;
        gsap.to(item, {
          y: speed,
          ease: "none",
          scrollTrigger: {
            trigger: item,
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        });
      });
    }
  }

  function initCursor() {
    if (!finePointer || prefersReducedMotion || !cursorDot || !cursorRing || !cursorBlob) {
      return;
    }

    body.classList.add("has-custom-cursor");

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring = { x: mouse.x, y: mouse.y };
    const blob = { x: mouse.x, y: mouse.y };

    const hoverTargets = "a, button, [data-tilt], .shelf-book, .book-card";

    document.addEventListener("mousemove", (event) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      cursorDot.style.left = `${mouse.x}px`;
      cursorDot.style.top = `${mouse.y}px`;
    });

    document.querySelectorAll(hoverTargets).forEach((target) => {
      target.addEventListener("mouseenter", () => body.classList.add("cursor-hover"));
      target.addEventListener("mouseleave", () => body.classList.remove("cursor-hover"));
    });

    const tick = () => {
      ring.x += (mouse.x - ring.x) * 0.22;
      ring.y += (mouse.y - ring.y) * 0.22;
      blob.x += (mouse.x - blob.x) * 0.11;
      blob.y += (mouse.y - blob.y) * 0.11;

      cursorRing.style.left = `${ring.x}px`;
      cursorRing.style.top = `${ring.y}px`;
      cursorBlob.style.left = `${blob.x}px`;
      cursorBlob.style.top = `${blob.y}px`;

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  function initTilt() {
    if (prefersReducedMotion) {
      return;
    }

    document.querySelectorAll("[data-tilt]").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        const rotateY = (px - 0.5) * 10;
        const rotateX = (0.5 - py) * 10;
        card.style.transform = `perspective(1400px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });

      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }

  function initParticles() {
    document.querySelectorAll("[data-particles]").forEach((canvas) => {
      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      let width = 0;
      let height = 0;
      const pointer = { x: 0, y: 0 };
      const particles = [];
      const particleCount = 56;

      const resize = () => {
        width = canvas.clientWidth;
        height = canvas.clientHeight;
        canvas.width = width;
        canvas.height = height;
      };

      const resetParticles = () => {
        particles.length = 0;
        for (let index = 0; index < particleCount; index += 1) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: Math.random() * 2 + 1
          });
        }
      };

      const render = () => {
        context.clearRect(0, 0, width, height);
        context.fillStyle = "rgba(121, 231, 255, 0.9)";

        particles.forEach((particle, index) => {
          particle.x += particle.vx;
          particle.y += particle.vy;

          if (particle.x < -40) particle.x = width + 40;
          if (particle.x > width + 40) particle.x = -40;
          if (particle.y < -40) particle.y = height + 40;
          if (particle.y > height + 40) particle.y = -40;

          const dxMouse = pointer.x - particle.x;
          const dyMouse = pointer.y - particle.y;
          const mouseDistance = Math.hypot(dxMouse, dyMouse);
          if (mouseDistance < 140) {
            particle.x -= dxMouse * 0.0012;
            particle.y -= dyMouse * 0.0012;
          }

          context.beginPath();
          context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          context.fill();

          for (let inner = index + 1; inner < particles.length; inner += 1) {
            const other = particles[inner];
            const dx = other.x - particle.x;
            const dy = other.y - particle.y;
            const distance = Math.hypot(dx, dy);
            if (distance > 110) {
              continue;
            }
            context.strokeStyle = `rgba(121, 231, 255, ${0.12 - distance / 1200})`;
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(particle.x, particle.y);
            context.lineTo(other.x, other.y);
            context.stroke();
          }
        });

        requestAnimationFrame(render);
      };

      const parent = canvas.parentElement;
      parent?.addEventListener("pointermove", (event) => {
        const rect = canvas.getBoundingClientRect();
        pointer.x = event.clientX - rect.left;
        pointer.y = event.clientY - rect.top;
      });

      resize();
      resetParticles();
      render();
      window.addEventListener("resize", () => {
        resize();
        resetParticles();
      });
    });
  }

  function setTransitionLabel(label) {
    if (transitionLabel) {
      transitionLabel.textContent = label || "Portfolio";
    }
  }

  function getBookPayload(link) {
    return {
      slug: link.dataset.bookSlug || "",
      title: link.dataset.bookTitle || "",
      meta: link.dataset.bookMeta || "",
      base: link.dataset.bookBase || "#5f34f5",
      edge: link.dataset.bookEdge || "#140a33"
    };
  }

  function storeBookTransition(payload) {
    sessionStorage.setItem("bookTransition", JSON.stringify(payload));
  }

  function startPageTransition(href, label) {
    setTransitionLabel(label);
    body.classList.add("is-leaving");
    window.setTimeout(() => {
      window.location.href = href;
    }, prefersReducedMotion ? 0 : 320);
  }

  function animateBookOpen(link) {
    const href = link.getAttribute("href");
    if (!href) {
      return;
    }

    const payload = getBookPayload(link);
    if (!payload.slug || prefersReducedMotion) {
      storeBookTransition(payload);
      startPageTransition(href, payload.title);
      return;
    }

    const visual = link.querySelector("[data-book-visual]") || link.querySelector(".shelf-book__body") || link;
    const rect = visual.getBoundingClientRect();
    const width = Math.max(rect.width, 160);
    const height = Math.max(rect.height, 280);
    const finalWidth = clamp(window.innerWidth * (window.innerWidth < 760 ? 0.56 : 0.28), 180, 320);
    const finalHeight = finalWidth * 1.36;
    const finalLeft = (window.innerWidth - finalWidth) / 2;
    const finalTop = (window.innerHeight - finalHeight) / 2;

    const scene = document.createElement("div");
    scene.className = "book-open-scene";
    scene.innerHTML = `
      <div class="book-open-scene__veil"></div>
      <div class="book-open" style="left:${rect.left}px;top:${rect.top}px;width:${width}px;height:${height}px;--open-book-base:${payload.base};--open-book-edge:${payload.edge};">
        <div class="book-open__back"></div>
        <div class="book-open__pages"></div>
        <div class="book-open__spine"></div>
        <div class="book-open__front">
          <div class="book-open__front-content">
            <div class="book-open__meta">${payload.meta || "Book"}</div>
            <div class="book-open__title">${payload.title || ""}</div>
            <div class="book-open__meta">Opening</div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(scene);
    body.classList.add("is-locked");
    storeBookTransition(payload);

    const book = scene.querySelector(".book-open");
    requestAnimationFrame(() => {
      scene.classList.add("is-visible");
      requestAnimationFrame(() => {
        scene.classList.add("is-centering");
        book.style.left = `${finalLeft}px`;
        book.style.top = `${finalTop}px`;
        book.style.width = `${finalWidth}px`;
        book.style.height = `${finalHeight}px`;
      });
    });

    window.setTimeout(() => scene.classList.add("is-opening"), 640);
    window.setTimeout(() => startPageTransition(href, payload.title), 1320);
  }

  function initNavigation() {
    document.querySelectorAll("a[href]").forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      const url = new URL(href, window.location.href);
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
        if (destination.href === window.location.href) {
          return;
        }

        event.preventDefault();

        if (link.hasAttribute("data-book-link")) {
          animateBookOpen(link);
          return;
        }

        startPageTransition(link.href, link.dataset.transitionLabel || link.textContent?.trim());
      });
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

  function initBookArrival() {
    const target = document.querySelector("[data-book-arrival]");
    if (!target) {
      return;
    }

    const raw = sessionStorage.getItem("bookTransition");
    if (!raw) {
      return;
    }

    try {
      const payload = JSON.parse(raw);
      if (!payload.slug || payload.slug !== body.dataset.bookSlug) {
        return;
      }

      target.classList.add("is-entering");
      window.setTimeout(() => {
        target.classList.remove("is-entering");
      }, 120);
    } finally {
      sessionStorage.removeItem("bookTransition");
    }
  }

  function init() {
    markReady();
    updateHeaderAndProgress();
    initGsap();
    initCursor();
    initTilt();
    initParticles();
    initNavigation();
    initCurrentNav();
    initBookArrival();
  }

  init();
  window.addEventListener("scroll", updateHeaderAndProgress, { passive: true });
  window.addEventListener("resize", updateHeaderAndProgress);
})();
