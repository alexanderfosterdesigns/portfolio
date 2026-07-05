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
  let lenis = null;

  const gsapReady = typeof window.gsap !== "undefined";
  const scrollTriggerReady = gsapReady && typeof window.ScrollTrigger !== "undefined";

  if (scrollTriggerReady) {
    window.gsap.registerPlugin(window.ScrollTrigger);
  }

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  function markReady() {
    requestAnimationFrame(() => body.classList.add("is-ready"));
  }

  function initLenis() {
    if (prefersReducedMotion || typeof window.Lenis === "undefined") {
      return;
    }

    lenis = new window.Lenis({
      lerp: 0.11,
      smoothWheel: true,
      wheelMultiplier: 0.92,
      touchMultiplier: 1.08
    });

    if (scrollTriggerReady) {
      lenis.on("scroll", () => {
        updateHeaderAndProgress();
        window.ScrollTrigger.update();
      });
      window.gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      lenis.on("scroll", updateHeaderAndProgress);
      const loop = (time) => {
        lenis.raf(time);
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
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
    const blob = { x: mouse.x, y: mouse.y, width: 96, height: 96, radius: 999 };
    let blobTarget = null;
    const trails = Array.from({ length: 8 }, (_, index) => {
      const trail = document.createElement("span");
      trail.className = "cursor-trail";
      trail.style.width = `${18 - index}px`;
      trail.style.height = `${18 - index}px`;
      trail.style.opacity = "0";
      document.body.appendChild(trail);
      return { el: trail, x: mouse.x, y: mouse.y, scale: 1 - index * 0.08 };
    });

    const hoverTargets = "a, button, [data-tilt], .shelf-book, .book-card, .spotlight-card, .project-card, .gallery-card, .print-card, .contact-card, .detail-panel, .panel, .stat-card";
    const blobTargets = ".button, .paper-plane-button, .spotlight-card, .book-card, .project-card, .gallery-card, .print-card, .contact-card, .detail-panel, .panel, .stat-card, .shelf-book--featured";

    document.addEventListener("mousemove", (event) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    });

    document.querySelectorAll(hoverTargets).forEach((target) => {
      target.addEventListener("mouseenter", () => body.classList.add("cursor-hover"));
      target.addEventListener("mouseleave", () => body.classList.remove("cursor-hover"));
    });

    document.querySelectorAll(blobTargets).forEach((target) => {
      target.addEventListener("mouseenter", () => {
        blobTarget = target;
        body.classList.add("cursor-blob-active");
      });

      target.addEventListener("mouseleave", () => {
        if (blobTarget === target) {
          blobTarget = null;
        }
        body.classList.remove("cursor-blob-active");
      });
    });

    const tick = () => {
      const ringEase = blobTarget ? 0.62 : 0.56;
      const blobEase = blobTarget ? 0.44 : 0.38;
      const sizeEase = blobTarget ? 0.4 : 0.34;

      ring.x += (mouse.x - ring.x) * ringEase;
      ring.y += (mouse.y - ring.y) * ringEase;

      let targetX = mouse.x;
      let targetY = mouse.y;
      let targetWidth = 96;
      let targetHeight = 96;
      let targetRadius = 999;

      if (blobTarget) {
        const rect = blobTarget.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const isButton = blobTarget.classList.contains("button");
          const isBook = blobTarget.classList.contains("shelf-book--featured");
          const padX = isButton ? 28 : isBook ? 42 : 22;
          const padY = isButton ? 18 : isBook ? 36 : 22;
          targetX = rect.left + rect.width / 2;
          targetY = rect.top + rect.height / 2;
          targetWidth = clamp(rect.width + padX, 96, window.innerWidth * 0.72);
          targetHeight = clamp(rect.height + padY, 96, window.innerHeight * 0.72);
          const radiusValue = parseFloat(window.getComputedStyle(blobTarget).borderRadius);
          targetRadius = Number.isFinite(radiusValue) ? radiusValue + 8 : 32;
        } else {
          blobTarget = null;
          body.classList.remove("cursor-blob-active");
        }
      }

      blob.x += (targetX - blob.x) * blobEase;
      blob.y += (targetY - blob.y) * blobEase;
      blob.width += (targetWidth - blob.width) * sizeEase;
      blob.height += (targetHeight - blob.height) * sizeEase;
      blob.radius += (targetRadius - blob.radius) * sizeEase;

      const translateBase = "translate3d(-50%, -50%, 0)";
      cursorDot.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0) ${translateBase}`;
      cursorRing.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) ${translateBase}`;
      cursorBlob.style.transform = `translate3d(${blob.x}px, ${blob.y}px, 0) ${translateBase}`;
      cursorBlob.style.width = `${blob.width}px`;
      cursorBlob.style.height = `${blob.height}px`;
      cursorBlob.style.borderRadius = `${blob.radius}px`;

      trails.forEach((trail, index) => {
        const leader = index === 0 ? mouse : trails[index - 1];
        const ease = 0.34 - index * 0.022;
        trail.x += (leader.x - trail.x) * ease;
        trail.y += (leader.y - trail.y) * ease;
        trail.el.style.transform = `translate3d(${trail.x}px, ${trail.y}px, 0) ${translateBase} scale(${trail.scale})`;
        trail.el.style.opacity = `${0.28 - index * 0.024}`;
      });

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  function setBookRestState(link) {
    link.classList.remove("is-hovered", "is-locked");
    link.style.opacity = "";
  }

  function initBookshelf() {
    const stage = document.querySelector("[data-bookshelf-stage]");
    const rig = stage?.querySelector("[data-bookshelf-rig]");
    const featuredBooks = Array.from(document.querySelectorAll(".shelf-book--featured"));
    if (!featuredBooks.length) {
      return;
    }

    featuredBooks.forEach((book) => {
      const hoverIn = () => {
        if (book.classList.contains("is-opening")) {
          return;
        }
        book.classList.add("is-hovered");
      };

      const hoverOut = () => {
        if (book.classList.contains("is-opening")) {
          return;
        }
        setBookRestState(book);
      };

      book.addEventListener("mouseenter", hoverIn);
      book.addEventListener("mouseleave", hoverOut);
      book.addEventListener("focus", hoverIn);
      book.addEventListener("blur", hoverOut);
    });

    if (!stage || !rig || prefersReducedMotion) {
      return;
    }

    let targetY = 0;
    let targetX = 0;
    let currentY = 0;
    let currentX = 0;

    stage.addEventListener("pointermove", (event) => {
      if (stage.dataset.bookshelfLocked === "true") {
        return;
      }
      const rect = stage.getBoundingClientRect();
      targetY = ((event.clientX - (rect.left + rect.width / 2)) / rect.width) * 6;
      targetX = -((event.clientY - (rect.top + rect.height / 2)) / rect.height) * 3;
    });

    stage.addEventListener("pointerleave", () => {
      targetY = 0;
      targetX = 0;
    });

    const animateRig = () => {
      if (stage.dataset.bookshelfLocked !== "true") {
        currentY += (targetY - currentY) * 0.07;
        currentX += (targetX - currentX) * 0.07;
        rig.style.transform = `rotateY(${currentY}deg) rotateX(${currentX}deg)`;
      }
      requestAnimationFrame(animateRig);
    };

    requestAnimationFrame(animateRig);
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

  function initPaperPlaneButtons() {
    document.querySelectorAll(".paper-plane-button[href]").forEach((button) => {
      const href = button.getAttribute("href");
      if (!href || !href.startsWith("mailto:")) {
        return;
      }

      const getVar = (variable) => window.getComputedStyle(button).getPropertyValue(variable).trim();
      let resetTimer = 0;
      let launchTimer = 0;

      button.addEventListener("click", (event) => {
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

        if (prefersReducedMotion || !gsapReady) {
          return;
        }

        event.preventDefault();

        if (button.classList.contains("is-active")) {
          return;
        }

        window.clearTimeout(resetTimer);
        window.clearTimeout(launchTimer);
        button.classList.add("is-active");
        button.setAttribute("aria-busy", "true");

        window.gsap.to(button, {
          keyframes: [
            {
              "--left-wing-first-x": 50,
              "--left-wing-first-y": 100,
              "--right-wing-second-x": 50,
              "--right-wing-second-y": 100,
              duration: 0.2,
              onComplete() {
                window.gsap.set(button, {
                  "--left-wing-first-y": 0,
                  "--left-wing-second-x": 40,
                  "--left-wing-second-y": 100,
                  "--left-wing-third-x": 0,
                  "--left-wing-third-y": 100,
                  "--left-body-third-x": 40,
                  "--right-wing-first-x": 50,
                  "--right-wing-first-y": 0,
                  "--right-wing-second-x": 60,
                  "--right-wing-second-y": 100,
                  "--right-wing-third-x": 100,
                  "--right-wing-third-y": 100,
                  "--right-body-third-x": 60
                });
              }
            },
            {
              "--left-wing-third-x": 20,
              "--left-wing-third-y": 90,
              "--left-wing-second-y": 90,
              "--left-body-third-y": 90,
              "--right-wing-third-x": 80,
              "--right-wing-third-y": 90,
              "--right-body-third-y": 90,
              "--right-wing-second-y": 90,
              duration: 0.2
            },
            {
              "--rotate": 50,
              "--left-wing-third-y": 95,
              "--left-wing-third-x": 27,
              "--right-body-third-x": 45,
              "--right-wing-second-x": 45,
              "--right-wing-third-x": 60,
              "--right-wing-third-y": 83,
              duration: 0.25
            },
            {
              "--rotate": 55,
              "--plane-x": -8,
              "--plane-y": 24,
              duration: 0.2
            },
            {
              "--rotate": 40,
              "--plane-x": 45,
              "--plane-y": -180,
              "--plane-opacity": 0,
              duration: 0.3,
              onComplete() {
                resetTimer = window.setTimeout(() => {
                  button.removeAttribute("style");
                  window.gsap.fromTo(button, {
                    opacity: 0,
                    y: -8
                  }, {
                    opacity: 1,
                    y: 0,
                    clearProps: "opacity,transform",
                    duration: 0.3,
                    onComplete() {
                      button.classList.remove("is-active");
                      button.removeAttribute("aria-busy");
                    }
                  });
                }, 1800);
              }
            }
          ]
        });

        window.gsap.to(button, {
          keyframes: [
            {
              "--text-opacity": 0,
              "--border-radius": 0,
              "--left-wing-background": getVar("--primary-darkest"),
              "--right-wing-background": getVar("--primary-darkest"),
              duration: 0.1
            },
            {
              "--left-wing-background": getVar("--primary"),
              "--right-wing-background": getVar("--primary"),
              duration: 0.1
            },
            {
              "--left-body-background": getVar("--primary-dark"),
              "--right-body-background": getVar("--primary-darkest"),
              duration: 0.4
            },
            {
              "--success-opacity": 1,
              "--success-scale": 1,
              duration: 0.25,
              delay: 0.25
            }
          ]
        });

        launchTimer = window.setTimeout(() => {
          window.location.href = href;
        }, 940);
      });
    });
  }

  function initStudioRockers() {
    document.querySelectorAll("[data-rocker]").forEach((rocker) => {
      const input = rocker.querySelector(".studio-rocker__input");
      const consoleEl = rocker.closest(".contact-console");
      const heading = consoleEl?.querySelector("[data-rocker-heading]");
      const status = consoleEl?.querySelector("[data-rocker-status]");

      if (!input || !consoleEl || !heading || !status) {
        return;
      }

      const syncState = () => {
        const isLive = input.checked;
        rocker.dataset.state = isLive ? "live" : "hold";
        heading.textContent = isLive ? "Studio line live" : "Studio line in build mode";
        status.textContent = isLive
          ? "Available for books, apps, photography, and print conversations."
          : "Still building, but open to the right collaboration, commission, or feature.";
      };

      input.addEventListener("change", syncState);
      syncState();
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
      transitionLabel.textContent = label || "Alexander Foster";
    }
  }

  function initHomeIntro() {
    const intro = document.getElementById("intro-sequence");
    if (!intro || body.dataset.page !== "home") {
      return;
    }

    const reveals = Array.from(document.querySelectorAll("[data-home-reveal]"));
    if (prefersReducedMotion || !gsapReady) {
      intro.remove();
      reveals.forEach((item) => {
        item.style.opacity = "1";
        item.style.transform = "none";
      });
      return;
    }

    const { gsap } = window;
    const line = intro.querySelector(".intro-sequence__line");
    const chars = gsap.utils.toArray("[data-intro-char]");
    gsap.set(reveals, { autoAlpha: 0, y: 28 });
    gsap.set(chars, {
      autoAlpha: 0,
      yPercent: 135,
      rotateX: -94,
      transformOrigin: "center bottom"
    });
    gsap.set(line, { scaleX: 0, transformOrigin: "left center" });

    gsap.timeline()
      .to(line, {
        scaleX: 1,
        duration: 0.72,
        ease: "power2.inOut"
      })
      .to(chars, {
        autoAlpha: 1,
        yPercent: 0,
        rotateX: 0,
        duration: 0.64,
        stagger: 0.08,
        ease: "back.out(1.9)"
      }, 0.26)
      .to(reveals, {
        autoAlpha: 1,
        y: 0,
        duration: 0.68,
        stagger: 0.05,
        ease: "power2.out"
      }, 0.92)
      .to(intro, {
        autoAlpha: 0,
        duration: 0.56,
        ease: "power2.out",
        pointerEvents: "none"
      }, 1.46)
      .set(intro, { display: "none" })
      .call(() => {
        if (scrollTriggerReady) {
          window.ScrollTrigger.refresh();
        }
      });
  }

  function initHomeScenes() {
    if (body.dataset.page !== "home" || prefersReducedMotion || !scrollTriggerReady) {
      return;
    }

    const { gsap } = window;
    const sections = gsap.utils.toArray(".scene-section").filter((section) => !section.classList.contains("scene-section--hero"));

    sections.forEach((section, index) => {
      const panel = section.querySelector(".scene-panel") || section;
      const depthItems = Array.from(section.querySelectorAll("[data-depth]"));
      const wipe = section.querySelector(".section-wipe");
      const line = wipe?.querySelector(".section-wipe__line");
      const geo = wipe?.querySelector(".section-wipe__geo");

      gsap.set(panel, {
        transformPerspective: 2400,
        transformOrigin: "center center"
      });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 88%",
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: true
        }
      });

      timeline.fromTo(panel, {
        scale: 1,
        z: 0,
        yPercent: 0,
        rotateX: 0
      }, {
        scale: 0.96,
        z: -90,
        yPercent: -3.5,
        rotateX: index % 2 === 0 ? 1.2 : -1.2,
        ease: "none"
      }, 0);

      depthItems.forEach((item) => {
        const depth = parseFloat(item.getAttribute("data-depth")) || 0;
        timeline.fromTo(item, {
          yPercent: 0,
          xPercent: 0,
          scale: 1
        }, {
          yPercent: depth,
          xPercent: depth * 0.12,
          scale: depth > 0 ? 1.04 : 0.98,
          ease: "none"
        }, 0);
      });

      if (line) {
        timeline.fromTo(line, {
          scaleX: 0,
          autoAlpha: 0.2,
          transformOrigin: "left center"
        }, {
          scaleX: 1,
          autoAlpha: 1,
          ease: "none"
        }, 0.08);
      }

      if (geo) {
        timeline.fromTo(geo, {
          rotate: 45,
          scale: 0.68,
          autoAlpha: 0.18
        }, {
          rotate: index % 2 === 0 ? 112 : -112,
          scale: 1.06,
          autoAlpha: 0.86,
          ease: "none"
        }, 0.12);
      }

      if (wipe) {
        timeline.to(wipe, {
          yPercent: -10,
          autoAlpha: 0.22,
          ease: "none"
        }, 0.62);
      }
    });
  }

  function getBookPayload(link) {
    return {
      slug: link.dataset.bookSlug || "",
      title: link.dataset.bookTitle || "",
      meta: link.dataset.bookMeta || "",
      year: link.dataset.bookYear || link.querySelector(".shelf-book__spine-meta")?.textContent?.trim() || "",
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

  let activeBookOpen = null;

  function cleanupBookOpenScene(state) {
    if (!state) {
      return;
    }

    if (state.cleanupTimer) {
      window.clearTimeout(state.cleanupTimer);
      state.cleanupTimer = 0;
    }

    if (state.onKeydown) {
      document.removeEventListener("keydown", state.onKeydown);
      state.onKeydown = null;
    }

    state.veil?.removeEventListener("click", state.dismiss);
    state.scene?.remove();
    setBookRestState(state.link);
    state.link.classList.remove("is-opening");
    body.classList.remove("is-locked");
    if (lenis) {
      lenis.start();
    }
    if (state.stage) {
      state.stage.dataset.bookshelfLocked = "false";
    }
    if (activeBookOpen === state) {
      activeBookOpen = null;
    }
  }

  function dismissBookOpenScene(state) {
    if (!state || state.closed || state.isFinalizing) {
      return;
    }

    state.closed = true;
    state.scene.style.pointerEvents = "none";
    state.veil.style.background = "rgba(4,3,2,0)";
    state.fly.style.transition = "opacity 0.25s ease";
    state.fly.style.opacity = "0";
    state.cleanupTimer = window.setTimeout(() => {
      cleanupBookOpenScene(state);
    }, 280);
  }

  function spawnBookOpenParticles(x, y, color) {
    for (let index = 0; index < 14; index += 1) {
      const particle = document.createElement("span");
      const angle = (Math.PI * 2 * index) / 14;
      const distance = 45 + Math.random() * 70;
      particle.className = "book-open-particle";
      particle.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
      particle.style.setProperty("--y", `${Math.sin(angle) * distance}px`);
      particle.style.setProperty("--d", `${0.6 + Math.random() * 0.5}s`);
      particle.style.setProperty("--dl", `${Math.random() * 0.12}s`);
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.background = color;
      document.body.appendChild(particle);
      window.setTimeout(() => particle.remove(), 1300);
    }
  }

  async function animateBookOpen(link) {
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

    if (link.classList.contains("is-opening") || activeBookOpen) {
      return;
    }

    const stage = link.closest("[data-bookshelf-stage]");
    const spineEl = link.querySelector(".shelf-book__spine") || link;
    const rect = spineEl.getBoundingClientRect();
    const styles = window.getComputedStyle(link);
    const width = parseFloat(styles.getPropertyValue("--book-width")) || rect.width;
    const height = parseFloat(styles.getPropertyValue("--book-height")) || rect.height;
    const pageWidth = parseFloat(styles.getPropertyValue("--book-depth")) || Math.round(height * 0.65);
    const duration = 2600;
    const scale = window.innerWidth < 760 ? 1.04 : 1.25;

    const scene = document.createElement("div");
    scene.className = "book-open-scene";
    scene.innerHTML = `
      <div class="book-open-scene__veil"></div>
      <div class="book-open"></div>
    `;

    document.body.appendChild(scene);
    body.classList.add("is-locked");
    if (lenis) {
      lenis.stop();
    }
    link.classList.add("is-hovered", "is-opening", "is-locked");
    if (stage) {
      stage.dataset.bookshelfLocked = "true";
    }

    const veil = scene.querySelector(".book-open-scene__veil");
    const fly = scene.querySelector(".book-open");
    const state = {
      cleanupTimer: 0,
      closed: false,
      dismiss: null,
      fly,
      isFinalizing: false,
      link,
      onKeydown: null,
      scene,
      stage,
      veil
    };
    activeBookOpen = state;

    state.dismiss = () => {
      dismissBookOpenScene(state);
    };
    state.onKeydown = (event) => {
      if (event.key === "Escape") {
        state.dismiss();
      }
    };
    veil.addEventListener("click", state.dismiss);
    document.addEventListener("keydown", state.onKeydown);

    const rightPage = document.createElement("div");
    rightPage.className = "book-open__right-page";
    rightPage.style.cssText = `width:${pageWidth}px; height:${height}px; left:0; z-index:2;`;
    fly.appendChild(rightPage);

    const pageAnimations = ["bookOpenPage", "bookOpenPage", "bookOpenPage", "bookOpenPage150", "bookOpenPage30", "bookOpenPage55"];
    const pageDelays = [0.05, 0.18, 0.33, 0.5, 0.65, 0.72];
    for (let index = 0; index < 6; index += 1) {
      const page = document.createElement("div");
      page.className = "book-open__panel book-open__page";
      page.style.cssText = `
        width:${pageWidth}px;
        height:${height}px;
        z-index:${5 + index};
        animation:${pageAnimations[index]} ${duration / 1000}s cubic-bezier(.4,0,.2,1) forwards;
        animation-delay:${pageDelays[index]}s;
        animation-play-state:paused;
      `;
      fly.appendChild(page);
    }

    const coverWrap = document.createElement("div");
    coverWrap.className = "book-open__panel book-open__cover-wrap";
    coverWrap.style.cssText = `
      width:${pageWidth}px;
      height:${height}px;
      z-index:10;
      animation:bookOpenCover ${duration / 1000}s cubic-bezier(.4,0,.2,1) forwards;
      animation-play-state:paused;
    `;

    const coverFront = document.createElement("div");
    coverFront.className = "book-open__cover-front";
    coverFront.style.background = `linear-gradient(162deg, ${payload.base}, ${payload.edge} 55%, ${payload.edge})`;
    coverFront.style.borderLeftColor = payload.edge;
    coverFront.innerHTML = `
      <div class="book-open__cover-inner">
        <div class="book-open__cover-title">${payload.title}</div>
        <div class="book-open__cover-year">${payload.year || payload.meta}</div>
        <div class="book-open__cover-emblem"><span></span></div>
      </div>
    `;

    const coverBack = document.createElement("div");
    coverBack.className = "book-open__cover-back";
    coverWrap.appendChild(coverFront);
    coverWrap.appendChild(coverBack);
    fly.appendChild(coverWrap);

    const crease = document.createElement("div");
    crease.className = "book-open__crease";
    crease.style.cssText = `height:${height}px; left:0;`;
    fly.appendChild(crease);

    const spineScreenX = rect.left + width / 2;
    fly.style.cssText = `
      display:block;
      position:absolute;
      width:${pageWidth * 2}px;
      height:${height}px;
      left:${spineScreenX - pageWidth}px;
      top:${rect.top}px;
      transform:rotateX(-38deg);
      transition:none;
      opacity:1;
    `;

    link.style.opacity = "0";
    spawnBookOpenParticles(rect.left + width / 2, rect.top + height * 0.42, payload.year === "2025" ? "rgba(255, 159, 90, 0.94)" : "rgba(121, 231, 255, 0.96)");
    scene.offsetHeight;
    scene.classList.add("is-visible");

    fly.style.transition = "transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94)";
    fly.style.transform = "rotateX(0deg)";
    await wait(420);
    if (state.closed) {
      return;
    }

    veil.style.background = "rgba(4,3,2,0.93)";
    const destinationLeft = window.innerWidth / 2 - pageWidth;
    const destinationTop = window.innerHeight / 2 - height / 2;
    fly.style.transition = "transform 0.55s cubic-bezier(0.16,1,0.3,1)";
    fly.style.transform = `translate(${destinationLeft - (spineScreenX - pageWidth)}px, ${destinationTop - rect.top}px) scale(${scale})`;
    await wait(600);
    if (state.closed) {
      return;
    }

    fly.querySelectorAll(".book-open__panel").forEach((panel) => {
      panel.style.animationPlayState = "running";
    });

    await wait(duration + 400);
    if (state.closed) {
      return;
    }

    state.isFinalizing = true;
    veil.style.background = "rgba(0,0,0,1)";
    fly.style.transition = "opacity 0.65s ease";
    fly.style.opacity = "0";
    await wait(220);
    if (state.closed) {
      return;
    }

    storeBookTransition(payload);
    startPageTransition(href, payload.title);

    state.cleanupTimer = window.setTimeout(() => {
      if (!body.classList.contains("is-leaving")) {
        cleanupBookOpenScene(state);
      }
    }, 1600);
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
    initLenis();
    updateHeaderAndProgress();
    initGsap();
    initHomeIntro();
    initHomeScenes();
    initCursor();
    initBookshelf();
    initTilt();
    initPaperPlaneButtons();
    initStudioRockers();
    initParticles();
    initNavigation();
    initCurrentNav();
    initBookArrival();
  }

  init();
  window.addEventListener("scroll", updateHeaderAndProgress, { passive: true });
  window.addEventListener("resize", updateHeaderAndProgress);
})();
