if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

const navEntry = performance.getEntriesByType("navigation")[0];
if (navEntry && navEntry.type === "reload") {
  if (location.hash) {
    history.replaceState(null, "", location.pathname + location.search);
  }
  window.scrollTo(0, 0);
}

const body = document.body;
body.classList.add("js-enhanced");

const caseStudyTriggers = document.querySelectorAll(".case-study-trigger");
const caseModalBackdrop = document.getElementById("case-modal-backdrop");
const caseModalClose = document.getElementById("case-modal-close");
const caseModalTitle = document.getElementById("case-modal-title");
const caseModalContents = document.querySelectorAll(".case-modal-content");
const caseModalBody = document.querySelector(".case-modal-body");
const siteHeader = document.querySelector(".site-header");
const headerMenuToggle = document.querySelector(".header-menu-toggle");
const headerNavLinks = document.querySelectorAll(".site-nav a, .site-nav button");
const batcommandOpeners = document.querySelectorAll("[data-open-batcommand]");
const quoteElement = document.querySelector(".batman-quote");
const prelude = document.getElementById("gotham-prelude");
const batcommandBackdrop = document.getElementById("batcommand-backdrop");
const batcommandInput = document.getElementById("batcommand-input");
const batcommandItems = Array.from(document.querySelectorAll(".batcommand-item"));
const revealTargets = document.querySelectorAll(".gotham-status, .intro-strip, .section");
const gothamVideoA = document.getElementById("gotham-video-a");
const gothamVideoB = document.getElementById("gotham-video-b");

let lastCaseStudyTrigger = null;
let lastBatcommandTrigger = null;
let caseModalOpenTimer = 0;
let caseModalCloseTimer = 0;
let batcommandSelection = -1;

const CASE_MODAL_REVEAL_MS = 860;
const CASE_MODAL_HIDE_MS = 460;

const state = {
  videoLoopFrame: 0,
};

const quoteLines = [
  "Gotham rewards clarity under pressure.",
  "Every product choice leaves a signal.",
  "Good UX makes chaos readable.",
  "In Gotham, clear interfaces beat brute force.",
  "Ship like Batman: precise, fast, and tested under pressure.",
  "Strong design turns noise into decisive action.",
  "A reliable system is a better hero than a flashy feature.",
  "Detective work in product means listening before building.",
  "Great products earn trust before they ask for action.",
  "Scalable systems are built in the shadows, not in demos.",
  "The best interface is the one users stop noticing.",
  "In high-stakes products, clarity is a safety feature.",
  "Reliable software is invisible until it fails.",
  "Research finds the signal, design makes it usable.",
  "Good PMs reduce chaos by defining the next right step.",
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function normalizeQuoteText(text) {
  return text.replace(/[.!?]+$/, "");
}

function pickRandomQuote(excludeQuote = "") {
  const pool =
    quoteLines.length > 1
      ? quoteLines.filter((line) => line !== excludeQuote)
      : quoteLines;
  return pool[Math.floor(Math.random() * pool.length)];
}

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function prefersReducedMotion() {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function initPrelude() {
  const MIN_PRELUDE_DURATION_MS = 2880;
  const preludeStartMs = performance.now();

  const finishPrelude = () => {
    const elapsedMs = performance.now() - preludeStartMs;
    const remainingMs = Math.max(0, MIN_PRELUDE_DURATION_MS - elapsedMs);

    window.setTimeout(() => {
      body.classList.add("is-loaded");
      if (prelude) {
        prelude.setAttribute("aria-hidden", "true");
      }
    }, remainingMs);
  };

  if (document.readyState === "complete") {
    finishPrelude();
    return;
  }

  window.addEventListener("load", finishPrelude, { once: true });
}

function initAtmosphereBackground() {
  if (!gothamVideoA || !gothamVideoB) return;

  const CROSSFADE_SECONDS = 1.4;
  const FALLBACK_DURATION = 12;
  let activeVideo = gothamVideoA;
  let inactiveVideo = gothamVideoB;
  let isSwapping = false;

  const getDuration = (videoElement) =>
    Number.isFinite(videoElement.duration) && videoElement.duration > 0
      ? videoElement.duration
      : FALLBACK_DURATION;

  const safePlay = (videoElement) => {
    const playPromise = videoElement.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  };

  const swapVideos = () => {
    if (isSwapping) return;
    isSwapping = true;

    inactiveVideo.currentTime = 0;
    safePlay(inactiveVideo);

    inactiveVideo.classList.add("is-active");
    activeVideo.classList.remove("is-active");

    const previousActive = activeVideo;
    activeVideo = inactiveVideo;
    inactiveVideo = previousActive;

    window.setTimeout(() => {
      previousActive.pause();
      previousActive.currentTime = 0;
      isSwapping = false;
    }, 1550);
  };

  const monitorLoop = () => {
    state.videoLoopFrame = window.requestAnimationFrame(monitorLoop);
    if (isSwapping || document.hidden) return;
    if (!activeVideo || activeVideo.paused) return;

    const duration = getDuration(activeVideo);
    const timeRemaining = duration - activeVideo.currentTime;

    if (timeRemaining <= CROSSFADE_SECONDS) {
      swapVideos();
    }
  };

  gothamVideoA.loop = false;
  gothamVideoB.loop = false;
  gothamVideoA.muted = true;
  gothamVideoB.muted = true;
  gothamVideoA.playsInline = true;
  gothamVideoB.playsInline = true;

  gothamVideoA.classList.add("is-active");
  gothamVideoB.classList.remove("is-active");
  gothamVideoA.currentTime = 0;
  gothamVideoB.currentTime = 0;
  safePlay(gothamVideoA);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      safePlay(activeVideo);
      return;
    }

    gothamVideoA.pause();
    gothamVideoB.pause();
  });

  monitorLoop();
}

function initRevealTransitions() {
  if (!revealTargets.length) return;

  if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
    revealTargets.forEach((target) => target.classList.add("is-revealed"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, watcher) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        watcher.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.2,
    }
  );

  revealTargets.forEach((target) => observer.observe(target));
}

function initProjectCardGlow() {
  if (prefersReducedMotion()) return;

  const projectCards = Array.from(document.querySelectorAll(".work-grid .project-card"));
  if (!projectCards.length) return;

  const settings = {
    inactiveZone: 0.56,
    proximity: 18,
    easing: 0.24,
  };

  let pointerX = 0;
  let pointerY = 0;
  let hasPointer = false;
  let frameId = 0;

  projectCards.forEach((card) => {
    card.classList.add("project-card-glow");
    card.style.setProperty("--card-glow-active", "0");
    card.style.setProperty("--card-glow-angle", "0deg");
    card.dataset.glowAngle = "0";
  });

  const updateGlow = () => {
    frameId = 0;

    projectCards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      if (!hasPointer) {
        card.style.setProperty("--card-glow-active", "0");
        return;
      }

      const isNearby =
        pointerX > rect.left - settings.proximity &&
        pointerX < rect.right + settings.proximity &&
        pointerY > rect.top - settings.proximity &&
        pointerY < rect.bottom + settings.proximity;

      if (!isNearby) {
        card.style.setProperty("--card-glow-active", "0");
        return;
      }

      const centerX = rect.left + rect.width * 0.5;
      const centerY = rect.top + rect.height * 0.5;
      const distanceFromCenter = Math.hypot(pointerX - centerX, pointerY - centerY);
      const inactiveRadius = 0.5 * Math.min(rect.width, rect.height) * settings.inactiveZone;

      if (distanceFromCenter < inactiveRadius) {
        card.style.setProperty("--card-glow-active", "0");
        return;
      }

      const targetAngle = (Math.atan2(pointerY - centerY, pointerX - centerX) * 180) / Math.PI + 90;
      const currentAngle = Number(card.dataset.glowAngle || "0");
      const angleDelta = ((targetAngle - currentAngle + 540) % 360) - 180;
      const nextAngle = currentAngle + angleDelta * settings.easing;

      card.dataset.glowAngle = String(nextAngle);
      card.style.setProperty("--card-glow-angle", `${nextAngle}deg`);
      card.style.setProperty("--card-glow-active", "1");
    });
  };

  const queueGlowUpdate = () => {
    if (frameId) return;
    frameId = window.requestAnimationFrame(updateGlow);
  };

  document.addEventListener(
    "pointermove",
    (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      hasPointer = true;
      queueGlowUpdate();
    },
    { passive: true }
  );

  window.addEventListener("scroll", queueGlowUpdate, { passive: true });
  window.addEventListener("resize", queueGlowUpdate);
  document.addEventListener("mouseout", (event) => {
    if (event.relatedTarget) return;
    hasPointer = false;
    queueGlowUpdate();
  });

  queueGlowUpdate();
}

function setHeaderMenuOpen(isOpen) {
  if (!siteHeader || !headerMenuToggle) return;
  siteHeader.classList.toggle("is-menu-open", isOpen);
  headerMenuToggle.setAttribute("aria-expanded", String(isOpen));
  headerMenuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
}

function initHeaderMenu() {
  if (!siteHeader || !headerMenuToggle) return;

  headerMenuToggle.addEventListener("click", () => {
    const isOpen = siteHeader.classList.contains("is-menu-open");
    setHeaderMenuOpen(!isOpen);
  });

  headerNavLinks.forEach((link) => {
    link.addEventListener("click", () => {
      setHeaderMenuOpen(false);
    });
  });

  batcommandOpeners.forEach((triggerButton) => {
    triggerButton.addEventListener("click", () => {
      setHeaderMenuOpen(false);
      openBatcommand();
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) {
      setHeaderMenuOpen(false);
    }
  });
}

function isEditableElement(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable=""], [contenteditable="true"]'
    )
  );
}

function getVisibleBatcommandItems() {
  return batcommandItems.filter((item) => !item.hidden);
}

function setBatcommandSelection(index) {
  const visibleItems = getVisibleBatcommandItems();
  visibleItems.forEach((item) => item.classList.remove("is-selected"));

  if (!visibleItems.length) {
    batcommandSelection = -1;
    return;
  }

  const clampedIndex = Math.max(0, Math.min(index, visibleItems.length - 1));
  batcommandSelection = clampedIndex;
  visibleItems[clampedIndex].classList.add("is-selected");
}

function filterBatcommand(queryText = "") {
  const normalizedQuery = queryText.trim().toLowerCase();

  batcommandItems.forEach((item) => {
    const searchText = (item.dataset.search || item.textContent || "").toLowerCase();
    item.hidden = normalizedQuery ? !searchText.includes(normalizedQuery) : false;
  });

  setBatcommandSelection(0);
}

function closeBatcommand({ restoreFocus = true, immediate = false } = {}) {
  if (!batcommandBackdrop || batcommandBackdrop.hidden) return;
  batcommandBackdrop.classList.remove("is-open");
  document.body.classList.remove("command-open");
  if (immediate) {
    batcommandBackdrop.hidden = true;
  } else {
    window.setTimeout(() => {
      if (batcommandBackdrop) {
        batcommandBackdrop.hidden = true;
      }
    }, 180);
  }

  if (restoreFocus && lastBatcommandTrigger && typeof lastBatcommandTrigger.focus === "function") {
    lastBatcommandTrigger.focus();
  }
}

function jumpToSection(targetId) {
  const targetSection = document.getElementById(targetId);
  if (!targetSection) return;
  targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(null, "", `#${targetId}`);
}

function runNightfallEffect() {
  if (quoteElement) {
    quoteElement.classList.add("is-glitch");
    window.setTimeout(() => {
      quoteElement.classList.remove("is-glitch");
    }, 320);
  }

  body.classList.add("is-lightning");
  window.setTimeout(() => {
    body.classList.remove("is-lightning");
  }, 560);
}

function executeSecretBatcommand(queryText) {
  const normalized = queryText.toLowerCase().replace(/[\s_-]+/g, "");
  if (!normalized) return false;

  if (normalized === "batcave" || normalized === "waynemanor") {
    closeBatcommand();
    jumpToSection("about");
    return true;
  }

  if (normalized === "oracle") {
    closeBatcommand({ restoreFocus: false, immediate: true });
    const caseId = "case-study-2";
    const trigger = document.querySelector(
      `.case-study-trigger[data-case-study="${caseId}"]`
    );
    openCaseModal(caseId, trigger);
    return true;
  }

  if (
    normalized === "nightfall" ||
    normalized === "vengeance" ||
    normalized === "iamvengeance"
  ) {
    closeBatcommand();
    runNightfallEffect();
    return true;
  }

  return false;
}

function executeBatcommand(item) {
  if (!item) return;

  if (item.hasAttribute("data-command-download")) {
    closeBatcommand();
    if (downloadResumeBtn) {
      downloadResumeBtn.click();
    }
    return;
  }

  const targetId =
    item.getAttribute("data-command-target") ||
    (item.hasAttribute("data-command-contact") ? "contact" : "");
  if (targetId) {
    closeBatcommand();
    jumpToSection(targetId);
    return;
  }

  const caseId = item.getAttribute("data-command-case");
  if (caseId) {
    closeBatcommand({ restoreFocus: false, immediate: true });
    const trigger = document.querySelector(
      `.case-study-trigger[data-case-study="${caseId}"]`
    );
    openCaseModal(caseId, trigger);
  }
}

function openBatcommand() {
  if (!batcommandBackdrop || !batcommandInput || !batcommandItems.length) return;
  if (!batcommandBackdrop.hidden) return;

  lastBatcommandTrigger = document.activeElement;
  batcommandBackdrop.hidden = false;
  document.body.classList.add("command-open");
  window.requestAnimationFrame(() => {
    if (batcommandBackdrop) {
      batcommandBackdrop.classList.add("is-open");
    }
  });

  batcommandInput.value = "";
  filterBatcommand("");
  batcommandInput.focus();
}

function initBatcommand() {
  if (!batcommandBackdrop || !batcommandInput || !batcommandItems.length) return;

  batcommandBackdrop.addEventListener("click", (event) => {
    if (event.target === batcommandBackdrop) {
      closeBatcommand();
    }
  });

  batcommandInput.addEventListener("input", () => {
    filterBatcommand(batcommandInput.value);
  });

  batcommandInput.addEventListener("keydown", (event) => {
    const visibleItems = getVisibleBatcommandItems();

    if (event.key === "ArrowDown") {
      if (!visibleItems.length) return;
      event.preventDefault();
      setBatcommandSelection(batcommandSelection + 1);
      return;
    }

    if (event.key === "ArrowUp") {
      if (!visibleItems.length) return;
      event.preventDefault();
      setBatcommandSelection(batcommandSelection - 1);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (executeSecretBatcommand(batcommandInput.value)) {
        return;
      }
      if (!visibleItems.length) return;
      const selectedItem =
        visibleItems[batcommandSelection] || visibleItems[0];
      executeBatcommand(selectedItem);
    }
  });

  batcommandItems.forEach((item) => {
    item.addEventListener("mouseenter", () => {
      const visibleItems = getVisibleBatcommandItems();
      const nextIndex = visibleItems.indexOf(item);
      if (nextIndex >= 0) {
        setBatcommandSelection(nextIndex);
      }
    });

    item.addEventListener("click", () => {
      executeBatcommand(item);
    });
  });
}

function initQuoteRotation() {
  if (!quoteElement) return;

  quoteElement.innerHTML =
    '<span class="quote-text"></span><span class="quote-dot" aria-hidden="true">.</span>';

  const quoteText = quoteElement.querySelector(".quote-text");
  if (!quoteText) return;

  let activeQuote = pickRandomQuote("");
  let currentText = "";
  let isCancelled = false;

  const renderQuote = (text) => {
    currentText = text;
    quoteText.textContent = text;
    quoteElement.dataset.text = `${text}.`;
  };

  if (prefersReducedMotion()) {
    renderQuote(normalizeQuoteText(activeQuote));
    return;
  }

  const typeIn = async (nextText) => {
    for (let i = 1; i <= nextText.length; i += 1) {
      if (isCancelled) return;
      renderQuote(nextText.slice(0, i));
      await sleep(randomInt(32, 52));
    }
  };

  const backspace = async () => {
    for (let i = currentText.length; i >= 0; i -= 1) {
      if (isCancelled) return;
      renderQuote(currentText.slice(0, i));
      await sleep(randomInt(20, 36));
    }
  };

  const runQuoteLoop = async () => {
    await typeIn(normalizeQuoteText(activeQuote));

    while (!isCancelled) {
      await sleep(2300);
      await backspace();
      await sleep(320);

      activeQuote = pickRandomQuote(activeQuote);
      quoteElement.classList.add("is-glitch");
      await sleep(130);
      quoteElement.classList.remove("is-glitch");
      await typeIn(normalizeQuoteText(activeQuote));
    }
  };

  runQuoteLoop();

  window.addEventListener(
    "beforeunload",
    () => {
      isCancelled = true;
    },
    { once: true }
  );
}

function resetCaseModalScroll() {
  if (!caseModalBody) return;
  caseModalBody.scrollTop = 0;
  caseModalBody.scrollTo({ top: 0, left: 0, behavior: "auto" });
  window.requestAnimationFrame(() => {
    caseModalBody.scrollTop = 0;
  });
}

function updateCaseModalTitle(panel) {
  if (!caseModalTitle || !panel) return;
  const caseId = panel.querySelector(".case-id-modal")?.textContent?.trim();
  const projectTitle = panel.querySelector("h3")?.textContent?.trim();

  if (caseId && projectTitle) {
    caseModalTitle.textContent = `${caseId} - ${projectTitle}`;
    return;
  }

  caseModalTitle.textContent = "Case Study";
}

function clearCaseModalAnimationTimers() {
  if (caseModalOpenTimer) {
    window.clearTimeout(caseModalOpenTimer);
    caseModalOpenTimer = 0;
  }
  if (caseModalCloseTimer) {
    window.clearTimeout(caseModalCloseTimer);
    caseModalCloseTimer = 0;
  }
}

function finalizeCaseModalClose() {
  if (!caseModalBackdrop) return;
  caseModalBackdrop.classList.remove("is-visible", "is-opening", "is-closing");
  caseModalBackdrop.hidden = true;
  caseModalContents.forEach((panel) => {
    panel.classList.remove("is-active");
    panel.setAttribute("aria-hidden", "true");
  });
  document.body.style.overflow = "";
  resetCaseModalScroll();
  if (lastCaseStudyTrigger) {
    lastCaseStudyTrigger.focus();
  }
}

function closeCaseModal() {
  if (!caseModalBackdrop || caseModalBackdrop.hidden) return;
  clearCaseModalAnimationTimers();

  if (prefersReducedMotion()) {
    finalizeCaseModalClose();
    return;
  }

  caseModalBackdrop.classList.remove("is-opening", "is-visible");
  caseModalBackdrop.classList.add("is-closing");
  document.body.style.overflow = "";

  caseModalCloseTimer = window.setTimeout(() => {
    finalizeCaseModalClose();
  }, CASE_MODAL_HIDE_MS);
}

function openCaseModal(panelId, triggerElement) {
  if (!caseModalBackdrop) return;
  const targetPanel = document.getElementById(panelId);
  if (!targetPanel) return;

  clearCaseModalAnimationTimers();
  caseModalBackdrop.classList.remove("is-closing");

  caseModalContents.forEach((panel) => {
    const isTarget = panel === targetPanel;
    panel.classList.toggle("is-active", isTarget);
    panel.setAttribute("aria-hidden", String(!isTarget));
  });

  updateCaseModalTitle(targetPanel);
  caseModalBackdrop.hidden = false;
  caseModalBackdrop.classList.add("is-opening");
  window.requestAnimationFrame(() => {
    if (!caseModalBackdrop || caseModalBackdrop.hidden) return;
    caseModalBackdrop.classList.add("is-visible");
  });

  caseModalOpenTimer = window.setTimeout(() => {
    if (!caseModalBackdrop || caseModalBackdrop.hidden) return;
    caseModalBackdrop.classList.remove("is-opening");
  }, CASE_MODAL_REVEAL_MS);

  document.body.style.overflow = "hidden";
  resetCaseModalScroll();
  window.setTimeout(resetCaseModalScroll, 10);
  lastCaseStudyTrigger = triggerElement;
  if (caseModalClose) {
    caseModalClose.focus();
  }
}

caseStudyTriggers.forEach((triggerLink) => {
  triggerLink.addEventListener("click", (event) => {
    event.preventDefault();
    const panelId = triggerLink.dataset.caseStudy;
    openCaseModal(panelId, triggerLink);
  });
});

if (caseModalClose) {
  caseModalClose.addEventListener("click", closeCaseModal);
}

if (caseModalBackdrop) {
  caseModalBackdrop.addEventListener("click", (event) => {
    if (event.target === caseModalBackdrop) {
      closeCaseModal();
    }
  });
}

const experienceToggles = document.querySelectorAll(".experience-toggle");
experienceToggles.forEach((toggleButton) => {
  toggleButton.addEventListener("click", () => {
    const detailsId = toggleButton.getAttribute("aria-controls");
    const detailsPanel = document.getElementById(detailsId);
    const experienceCard = toggleButton.closest(".experience-item");
    const isExpanded = toggleButton.getAttribute("aria-expanded") === "true";
    const nextExpanded = !isExpanded;

    toggleButton.setAttribute("aria-expanded", String(nextExpanded));
    toggleButton.textContent = nextExpanded ? "View less" : "View more";

    if (detailsPanel) {
      detailsPanel.setAttribute("aria-hidden", String(!nextExpanded));
    }

    if (experienceCard) {
      experienceCard.classList.toggle("is-open", nextExpanded);
    }
  });
});

const downloadResumeBtn = document.getElementById("download-resume-btn");
if (downloadResumeBtn) {
  downloadResumeBtn.addEventListener("click", async () => {
    const resumePath = downloadResumeBtn.dataset.resumeUrl;
    const filename = "BorhanRahmaniResume.pdf";

    const triggerDownload = (href) => {
      const tempLink = document.createElement("a");
      tempLink.href = href;
      tempLink.download = filename;
      tempLink.style.display = "none";
      document.body.appendChild(tempLink);
      tempLink.click();
      tempLink.remove();
    };

    try {
      const response = await fetch(resumePath, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Resume download request failed.");
      }

      const resumeBlob = await response.blob();
      const forcedDownloadBlob = new Blob([resumeBlob], {
        type: "application/octet-stream",
      });
      const blobUrl = URL.createObjectURL(forcedDownloadBlob);
      triggerDownload(blobUrl);
      window.setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch (error) {
      console.error("[Resume Download] fetch path failed", {
        resumePath,
        error,
      });
      alert(
        "Resume download failed in this environment. Try reloading the page and clicking Download PDF again."
      );
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (
    event.key === "/" &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey &&
    !event.repeat &&
    !isEditableElement(event.target)
  ) {
    if (caseModalBackdrop && !caseModalBackdrop.hidden) return;
    event.preventDefault();
    openBatcommand();
    return;
  }

  if (event.key === "Escape") {
    if (batcommandBackdrop && !batcommandBackdrop.hidden) {
      closeBatcommand();
      return;
    }
    setHeaderMenuOpen(false);
  }

  if (!caseModalBackdrop || caseModalBackdrop.hidden) return;
  if (event.key === "Escape") {
    closeCaseModal();
  }
});

initPrelude();
initAtmosphereBackground();
initRevealTransitions();
initHeaderMenu();
initBatcommand();
initProjectCardGlow();
initQuoteRotation();
