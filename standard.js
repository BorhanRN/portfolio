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

const caseStudyTriggers = document.querySelectorAll(".case-study-trigger");
const caseModalBackdrop = document.getElementById("case-modal-backdrop");
const caseModalClose = document.getElementById("case-modal-close");
const caseModalContents = document.querySelectorAll(".case-modal-content");
const caseModalBody = document.querySelector(".case-modal-body");
const siteHeader = document.querySelector(".site-header");
const headerMenuToggle = document.querySelector(".header-menu-toggle");
const headerNavLinks = document.querySelectorAll(".site-nav a");
let lastCaseStudyTrigger = null;

function setHeaderMenuOpen(isOpen) {
  if (!siteHeader || !headerMenuToggle) return;
  siteHeader.classList.toggle("is-menu-open", isOpen);
  headerMenuToggle.setAttribute("aria-expanded", String(isOpen));
  headerMenuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
}

if (siteHeader && headerMenuToggle) {
  headerMenuToggle.addEventListener("click", () => {
    const isOpen = siteHeader.classList.contains("is-menu-open");
    setHeaderMenuOpen(!isOpen);
  });

  headerNavLinks.forEach((link) => {
    link.addEventListener("click", () => {
      setHeaderMenuOpen(false);
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) {
      setHeaderMenuOpen(false);
    }
  });
}

function resetCaseModalScroll() {
  if (!caseModalBody) return;
  caseModalBody.scrollTop = 0;
  caseModalBody.scrollTo({ top: 0, left: 0, behavior: "auto" });
  window.requestAnimationFrame(() => {
    caseModalBody.scrollTop = 0;
  });
}

function closeCaseModal() {
  if (!caseModalBackdrop) return;
  resetCaseModalScroll();
  caseModalBackdrop.hidden = true;
  document.body.style.overflow = "";
  caseModalContents.forEach((panel) => {
    panel.classList.remove("is-active");
    panel.setAttribute("aria-hidden", "true");
  });
  if (lastCaseStudyTrigger) {
    lastCaseStudyTrigger.focus();
  }
}

function openCaseModal(panelId, triggerElement) {
  if (!caseModalBackdrop) return;
  const targetPanel = document.getElementById(panelId);
  if (!targetPanel) return;

  caseModalContents.forEach((panel) => {
    const isTarget = panel === targetPanel;
    panel.classList.toggle("is-active", isTarget);
    panel.setAttribute("aria-hidden", String(!isTarget));
  });

  caseModalBackdrop.hidden = false;
  document.body.style.overflow = "hidden";
  resetCaseModalScroll();
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
    console.log("[Resume Download] Clicked", {
      resumePath,
      filename,
      locationHref: window.location.href,
    });

    const triggerDownload = (href) => {
      console.log("[Resume Download] triggerDownload()", { href, filename });
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
      console.log("[Resume Download] fetch response", {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        contentType: response.headers.get("content-type"),
        contentDisposition: response.headers.get("content-disposition"),
      });

      if (!response.ok) {
        throw new Error("Resume download request failed.");
      }

      const resumeBlob = await response.blob();
      console.log("[Resume Download] blob", {
        size: resumeBlob.size,
        type: resumeBlob.type,
      });
      const forcedDownloadBlob = new Blob([resumeBlob], {
        type: "application/octet-stream",
      });
      console.log("[Resume Download] forced blob", {
        size: forcedDownloadBlob.size,
        type: forcedDownloadBlob.type,
      });
      const blobUrl = URL.createObjectURL(forcedDownloadBlob);
      console.log("[Resume Download] blob URL created", { blobUrl });
      triggerDownload(blobUrl);
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
        console.log("[Resume Download] blob URL revoked", { blobUrl });
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
  if (event.key === "Escape") {
    setHeaderMenuOpen(false);
  }
  if (!caseModalBackdrop || caseModalBackdrop.hidden) return;
  if (event.key === "Escape") {
    closeCaseModal();
  }
});
