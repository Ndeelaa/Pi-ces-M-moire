/* =========================================================
   ARCHIVAL — SIMPLE IMMERSIVE SCROLLYTELLING V6
   Continuous one-page flow, scroll-progress text, chapter doors,
   video-background scene, casino year roll, visible-only motion.
========================================================= */

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let lenisInstance = null;

if (window.Lenis && !prefersReducedMotion) {
  lenisInstance = new Lenis({
    lerp: 0.076,
    wheelMultiplier: 0.7,
    touchMultiplier: 1,
    smoothWheel: true,
    smoothTouch: false,
    normalizeWheel: true,
  });

  function raf(time) {
    lenisInstance.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function scrollToTarget(target) {
  if (!target) return;

  if (lenisInstance) {
    lenisInstance.scrollTo(target, { offset: 0, duration: 1.18 });
    return;
  }

  target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
}

/* Curtain intro */
function initCurtainIntro() {
  const introCurtain = document.querySelector(".intro-curtain");
  if (!introCurtain) return;
  if (introCurtain.dataset.curtainInitialized === "true") return;
  introCurtain.dataset.curtainInitialized = "true";

  const curtainStorageKey = "piecesMemoireEamesCurtainPlayed";
  const referrerPath = document.referrer ? new URL(document.referrer).pathname : "";
  const isFromHome = referrerPath.endsWith("/") || referrerPath.endsWith("/index.html");
  const hasPlayedCurtain = window.sessionStorage.getItem(curtainStorageKey) === "true";

  if (hasPlayedCurtain && !isFromHome) {
    introCurtain.classList.add("is-hidden");
    return;
  }

  if (prefersReducedMotion) {
    introCurtain.classList.add("is-hidden");
    window.sessionStorage.setItem(curtainStorageKey, "true");
    return;
  }

  introCurtain.classList.add("is-playing");
  window.sessionStorage.setItem(curtainStorageKey, "true");

  window.setTimeout(() => {
    introCurtain.classList.add("is-hidden");
  }, 8350);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCurtainIntro, { once: true });
} else {
  initCurtainIntro();
}

window.setTimeout(initCurtainIntro, 300);
window.addEventListener("pageshow", initCurtainIntro, { once: true });

/* Scroll-progress word reveal — from “Mais avant...” onward */
const textRevealElements = [];

function createProgressWord(word, index) {
  const wrapper = document.createElement("span");
  wrapper.className = "progress-word";
  wrapper.dataset.wordIndex = String(index);
  wrapper.style.setProperty("--word-fill", "100%");
  wrapper.style.setProperty("--word-opacity", "0");

  const base = document.createElement("span");
  base.className = "progress-word__base";
  base.textContent = word;

  const fill = document.createElement("span");
  fill.className = "progress-word__fill";
  fill.textContent = word;

  wrapper.append(base, fill);
  return wrapper;
}

function splitTextNodeIntoProgressWords(textNode, counter) {
  const fragment = document.createDocumentFragment();
  const parts = textNode.textContent.split(/(\s+)/);

  parts.forEach((part) => {
    if (!part) return;

    if (/^\s+$/.test(part)) {
      fragment.appendChild(document.createTextNode(part));
      return;
    }

    counter.value += 1;
    fragment.appendChild(createProgressWord(part, counter.value - 1));
  });

  textNode.replaceWith(fragment);
}

function wrapSpecialInlineElement(element, counter) {
  if (element.dataset.progressWrapped === "true") return;

  const wrapper = document.createElement("span");
  wrapper.className = "progress-word progress-word--special";
  wrapper.dataset.wordIndex = String(counter.value);
  wrapper.style.setProperty("--word-fill", "100%");
  wrapper.style.setProperty("--word-opacity", "0");

  counter.value += 1;
  element.dataset.progressWrapped = "true";
  element.parentNode.insertBefore(wrapper, element);
  wrapper.appendChild(element);
}

function splitElementForScrollProgress(element) {
  if (element.dataset.progressText === "true") return;

  const counter = { value: 0 };
  const specialSelectors = ".rolling-year, .sketch-circle-mark";

  function walk(node) {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        if (child.textContent.trim()) {
          splitTextNodeIntoProgressWords(child, counter);
        }
        return;
      }

      if (child.nodeType !== Node.ELEMENT_NODE) return;

      if (child.matches(specialSelectors)) {
        wrapSpecialInlineElement(child, counter);
        return;
      }

      walk(child);
    });
  }

  element.dataset.progressText = "true";
  element.classList.add("scroll-progress-text");
  element.setAttribute("aria-label", element.textContent.trim().replace(/\s+/g, " "));
  walk(element);
  textRevealElements.push(element);
}

function initScrollProgressTexts() {
  const start = document.querySelector(".prelude-zoom");
  const candidates = Array.from(
    document.querySelectorAll(
      "main .text-interlude p, main .story-frame__copy p, main .story-frame__copy h3, main .chapter-gate__content p, main .final-scene h2, main .final-scene p, main .eames-assembly-callout__label",
    ),
  );

  candidates.forEach((element) => {
    if (element.classList.contains("no-progress-text")) return;
    if (start && element.compareDocumentPosition(start) & Node.DOCUMENT_POSITION_FOLLOWING) return;
    splitElementForScrollProgress(element);
  });
}

initScrollProgressTexts();

document.querySelectorAll(".sketch-circle-mark path").forEach((path) => {
  path.setAttribute("pathLength", "1");
});

function updateScrollProgressTexts() {
  if (!textRevealElements.length) return;

  const viewportHeight = window.innerHeight || 1;

  textRevealElements.forEach((element) => {
    if (element.classList.contains("eames-assembly-callout__label")) return;

    const rect = element.getBoundingClientRect();
    const words = Array.from(element.querySelectorAll(":scope .progress-word"));
    if (!words.length) return;

    const start = viewportHeight * 0.84;
    const end = viewportHeight * 0.38;
    const raw = (start - rect.top) / (start - end || 1);
    const progress = clamp(raw, 0, 1);
    const preludeSection = element.closest(".prelude-zoom");
    if (preludeSection) {
      preludeSection.style.setProperty("--prelude-progress", progress.toFixed(4));
    }
    const circleProgress = clamp((progress - 0.84) / 0.16, 0, 1);
    element.querySelectorAll(".sketch-circle-mark").forEach((circle) => {
      circle.style.setProperty("--circle-progress", circleProgress.toFixed(4));
    });
    const spread = 0.72;
    const activeWidth = Math.max(0.18, 1 - spread);

    words.forEach((word, index) => {
      const startOffset = words.length <= 1 ? 0 : (index / Math.max(1, words.length - 1)) * spread;
      const local = clamp((progress - startOffset) / activeWidth, 0, 1);
      const eased = 1 - Math.pow(1 - local, 2.2);
      word.style.setProperty("--word-fill", `${(1 - eased) * 100}%`);
      word.style.setProperty("--word-opacity", String(eased));
    });
  });
}

/* Standard visibility reveal for visual blocks */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  {
    threshold: 0.12,
    rootMargin: "0px 0px -8% 0px",
  },
);

document.querySelectorAll(".reveal-on-scroll").forEach((element) => {
  revealObserver.observe(element);
});

/* Chapter nav */
const chapterLinks = Array.from(document.querySelectorAll("[data-chapter-link]"));
const chapterSections = Array.from(document.querySelectorAll("[data-chapter-section]"));

function setActiveChapter(id) {
  chapterLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
  });
}

chapterLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const target = document.querySelector(link.getAttribute("href"));
    scrollToTarget(target);
    if (target?.id) setActiveChapter(target.id);
  });
});

const chapterObserver = new IntersectionObserver(
  (entries) => {
    const visibleEntries = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

    if (visibleEntries[0]?.target?.id) {
      setActiveChapter(visibleEntries[0].target.id);
    }
  },
  {
    threshold: [0.2, 0.38, 0.55],
    rootMargin: "-16% 0px -42% 0px",
  },
);

chapterSections.forEach((section) => chapterObserver.observe(section));

/* Chapter entrance — doors open progressively with scroll */
const chapterGates = Array.from(document.querySelectorAll(".chapter-gate"));

function updateChapterGates() {
  const viewportHeight = window.innerHeight || 1;

  chapterGates.forEach((gate) => {
    const rect = gate.getBoundingClientRect();
    const progress = clamp((viewportHeight * 0.82 - rect.top) / (viewportHeight * 0.62), 0, 1);
    const doorProgress = clamp(progress / 0.68, 0, 1);
    const zoomProgress = clamp((progress - 0.34) / 0.66, 0, 1);
    gate.style.setProperty("--gate-progress", progress.toFixed(4));
    gate.style.setProperty("--door-progress", doorProgress.toFixed(4));
    gate.style.setProperty("--zoom-progress", zoomProgress.toFixed(4));
    gate.classList.toggle("is-door-open", progress > 0.12);
  });
}

/* Video play/pause only when useful */
const videos = Array.from(document.querySelectorAll("video"));

const videoObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const video = entry.target;

      if (entry.isIntersecting && !prefersReducedMotion) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  },
  {
    threshold: 0.2,
    rootMargin: "18% 0px 18% 0px",
  },
);

videos.forEach((video) => {
  if (
    video.closest(".opening-scene__chair") ||
    video.classList.contains("opening-scene__background-video")
  ) {
    video.play().catch(() => {});
    return;
  }

  videoObserver.observe(video);

  video.addEventListener("error", () => {
    const visual = video.closest(".story-frame__visual") || video.closest(".chapter-gate") || video.closest(".california-background");
    visual?.classList.add("has-missing-video");
  });
});

/* Year reveal — digits drop in one by one. */
function buildRollingYears() {
  document.querySelectorAll(".rolling-year").forEach((yearElement) => {
    const finalYear = (yearElement.dataset.year || yearElement.textContent.trim()).trim();
    yearElement.setAttribute("aria-label", finalYear);
    yearElement.dataset.played = "false";

    yearElement.innerHTML = finalYear
      .split("")
      .map(
        (digit, index) =>
          `<span class="year-deposit-digit" style="--digit-index:${index}" aria-hidden="true">${digit}</span>`,
      )
      .join("");
  });
}

function lockRollingYear(yearElement) {
  yearElement.querySelectorAll(".year-deposit-digit").forEach((digit) => {
    digit.classList.add("is-dropped");
  });
}

function playRollingYear(yearElement) {
  if (!yearElement || yearElement.dataset.played === "true") return;

  yearElement.dataset.played = "true";
  yearElement.classList.add("is-depositing");

  const digits = Array.from(yearElement.querySelectorAll(".year-deposit-digit"));
  digits.forEach((digit, index) => {
    window.setTimeout(() => {
      digit.classList.add("is-dropped");
    }, 140 + index * 170);
  });

  window.setTimeout(() => {
    lockRollingYear(yearElement);
    yearElement.classList.add("is-settled");
  }, 140 + digits.length * 170 + 520);
}

buildRollingYears();

const rollingObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !document.hidden) {
        const years = entry.target.matches(".rolling-year")
          ? [entry.target]
          : Array.from(entry.target.querySelectorAll(".rolling-year"));
        years.forEach(playRollingYear);
      }
    });
  },
  { threshold: 0.5, rootMargin: "0px" },
);

document.querySelectorAll(".rolling-year").forEach((yearElement) => {
  rollingObserver.observe(yearElement.closest(".story-frame") || yearElement);
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) return;

  document.querySelectorAll(".rolling-year").forEach((yearElement) => {
    const rect = yearElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight || 1;

    if (rect.top >= 0 && rect.bottom <= viewportHeight) {
      playRollingYear(yearElement);
    }
  });
});

/* Timeline year roll — loops from the launch year to today. */
function playTimelineYearRoll(yearElement) {
  if (!yearElement || yearElement.dataset.played === "true") return;

  const startYear = Number(yearElement.dataset.yearStart || yearElement.textContent.trim());
  const endYear = Number(yearElement.dataset.yearEnd || startYear);
  if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) return;

  yearElement.dataset.played = "true";

  const duration = 8200;
  const pause = 900;
  let cycleStartedAt = performance.now();

  function tick(now) {
    const elapsed = now - cycleStartedAt;
    const raw = clamp(elapsed / duration, 0, 1);
    const eased = 1 - Math.pow(1 - raw, 2.2);
    const value = Math.round(startYear + (endYear - startYear) * eased);

    yearElement.textContent = String(value);

    if (elapsed >= duration + pause) {
      cycleStartedAt = now;
      yearElement.textContent = String(startYear);
    }

    window.requestAnimationFrame(tick);
  }

  window.requestAnimationFrame(tick);
}

const timelineYearRollObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !document.hidden) {
        playTimelineYearRoll(entry.target);
      }
    });
  },
  { threshold: 0.45 },
);

document.querySelectorAll("[data-year-roll]").forEach((yearElement) => {
  timelineYearRollObserver.observe(yearElement);
});

/* Continuous subtle parallax — no snapping, no pinning */
const parallaxElements = Array.from(document.querySelectorAll(".parallax-visual"));
let parallaxTicking = false;

function updateOpeningChairReveal() {
  const chair = document.querySelector(".opening-scene__chair");
  if (!chair) return;

  if (prefersReducedMotion) {
    chair.style.setProperty("--chair-opacity", "1");
    chair.style.setProperty("--chair-reveal-y", "0px");
    chair.style.setProperty("--chair-video-scale", "1");
    chair.style.setProperty("--chair-blur", "0px");
    return;
  }

  const viewportHeight = window.innerHeight || 1;
  const scene = chair.closest(".opening-scene");
  const rect = scene?.getBoundingClientRect();
  const raw = rect ? -rect.top / Math.max(1, rect.height - viewportHeight) : window.scrollY / (viewportHeight * 0.92);
  const progress = clamp(raw, 0, 1);
  const eased = 0.5 - Math.cos(progress * Math.PI) / 2;
  const videoScale = 1.18 - eased * 0.18;
  const fadeIn = clamp(progress / 0.18, 0, 1);
  const fadeOut = clamp((1 - progress) / 0.18, 0, 1);
  const videoOpacity = Math.min(fadeIn, fadeOut);

  chair.style.setProperty("--chair-opacity", String(videoOpacity));
  chair.style.setProperty("--chair-reveal-y", `${(1 - fadeIn) * 42}px`);
  chair.style.setProperty("--chair-video-scale", String(videoScale));
  chair.style.setProperty("--chair-blur", `${(1 - eased) * 5}px`);

  const video = chair.querySelector("video");
  video?.play?.().catch(() => {});
}

function updateParallax() {
  parallaxTicking = false;
  if (prefersReducedMotion || !parallaxElements.length) return;

  const viewportHeight = window.innerHeight || 1;

  parallaxElements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > viewportHeight) return;

    const center = rect.top + rect.height / 2;
    const distance = (center - viewportHeight / 2) / viewportHeight;
    const y = Math.max(-22, Math.min(22, distance * -34));
    const rotate = Math.max(-1.2, Math.min(1.2, distance * -1.8));

    element.style.setProperty("--parallax-y", `${y}px`);
    element.style.setProperty("--parallax-rotate", `${rotate}deg`);
  });
}

/* Curved timeline drawing — follows scroll progress */
const timelineStory = document.querySelector(".timeline-story");
const timelineCurveSvg = document.querySelector(".timeline-curve");
const timelineGhostPath = document.querySelector(".timeline-curve__ghost");
const timelineDrawPath = document.querySelector(".timeline-curve__draw");
const timelineRevealPath = document.querySelector(".timeline-curve__reveal");
const timelineMarkers = Array.from(document.querySelectorAll(".timeline-frame .timeline-marker"));

function buildTimelineMarkerPath() {
  if (!timelineStory || !timelineCurveSvg || !timelineMarkers.length) return 0;

  const storyRect = timelineStory.getBoundingClientRect();
  const points = timelineMarkers.map((marker) => {
    const markerRect = marker.getBoundingClientRect();
    return {
      x: markerRect.left + markerRect.width * 0.5 - storyRect.left,
      y: markerRect.top + markerRect.height * 0.5 - storyRect.top,
    };
  });

  timelineCurveSvg.setAttribute("viewBox", `0 0 ${storyRect.width} ${timelineStory.offsetHeight}`);

  const revealMask = document.getElementById("timeline-stitch-reveal");
  revealMask?.setAttribute("width", String(storyRect.width));
  revealMask?.setAttribute("height", String(timelineStory.offsetHeight));

  if (!points.length) return 0;

  const curveOffset = Math.min(84, Math.max(42, storyRect.width * 0.06));
  let pathData = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  points.slice(1).forEach((point, index) => {
    const previous = points[index];
    const direction = index % 2 === 0 ? 1 : -1;
    const yDistance = point.y - previous.y;
    const controlOneX = previous.x + curveOffset * direction;
    const controlTwoX = point.x - curveOffset * direction;
    const controlOneY = previous.y + yDistance * 0.34;
    const controlTwoY = point.y - yDistance * 0.34;

    pathData += ` C ${controlOneX.toFixed(2)} ${controlOneY.toFixed(2)}, ${controlTwoX.toFixed(2)} ${controlTwoY.toFixed(2)}, ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  });

  timelineGhostPath?.setAttribute("d", pathData);
  timelineDrawPath?.setAttribute("d", pathData);
  timelineRevealPath?.setAttribute("d", pathData);

  const timelineRevealLength = timelineRevealPath?.getTotalLength() || 0;
  if (timelineRevealPath) {
    timelineRevealPath.style.strokeDasharray = String(timelineRevealLength);
  }

  return timelineRevealLength;
}

function updateTimelineCurve() {
  if (!timelineStory || !timelineDrawPath || !timelineRevealPath) return;

  const rect = timelineStory.getBoundingClientRect();
  const viewportHeight = window.innerHeight || 1;
  const start = viewportHeight * 0.72;
  const end = -rect.height + viewportHeight * 0.28;
  const rawProgress = (start - rect.top) / (start - end || 1);
  const progress = clamp(rawProgress, 0, 1);

  const timelineRevealLength = buildTimelineMarkerPath();
  timelineRevealPath.style.strokeDashoffset = String(timelineRevealLength * (1 - progress));
  timelineStory.style.setProperty("--timeline-draw", String(progress));

  const activeMarker = timelineMarkers
    .map((marker) => {
      const markerRect = marker.getBoundingClientRect();
      const markerCenter = markerRect.top + markerRect.height * 0.5;
      return {
        marker,
        isVisible: markerRect.top >= 0 && markerRect.bottom <= viewportHeight,
        distance: Math.abs(markerCenter - viewportHeight * 0.5),
      };
    })
    .filter((item) => item.isVisible)
    .sort((a, b) => a.distance - b.distance)[0]?.marker;

  timelineMarkers.forEach((marker) => {
    marker.classList.toggle("is-stitched", marker === activeMarker);
  });
}

const timelineAnecdotes = {
  "1956": {
    kicker: "1956",
    title: "Une apparition publique",
    text:
      "Le fauteuil est présenté en 1956, au moment où Herman Miller introduit cette version moderne du fauteuil club. L’objet arrive comme une pièce de confort luxueuse, très différente des premières recherches plus économiques des Eames.",
    source: "https://www.hermanmiller.com/products/seating/lounge-seating/eames-lounge-chair-and-ottoman/",
  },
  Patine: {
    kicker: "Patine",
    title: "Le cuir devait vivre",
    text:
      "Charles Eames cherchait une sensation chaleureuse, proche d’un vieux gant de baseball assoupli par l’usage. Le cuir et le bois n’étaient donc pas pensés comme des surfaces figées, mais comme des matières faites pour garder les traces du temps.",
    source: "https://www.architecturaldigest.com/story/eames-lounge-chair-review",
  },
  "Matière": {
    kicker: "Matière",
    title: "Le contreplaqué comme héritage",
    text:
      "Avant le Lounge Chair, les Eames avaient déjà poussé très loin le contreplaqué moulé, notamment pendant la Seconde Guerre mondiale avec des attelles produites pour la Marine américaine. Cette expérience technique nourrit ensuite leurs meubles courbes.",
    source: "https://www.wallpaper.com/design-interiors/charles-ray-eames-furniture-design-definitive-guide",
  },
  Temps: {
    kicker: "Temps",
    title: "Un objet encore fabriqué",
    text:
      "Herman Miller rappelle que le Lounge Chair and Ottoman est en production continue depuis son lancement en 1956. Cette durée explique pourquoi il fonctionne autant comme meuble que comme archive vivante du design américain.",
    source: "https://www.hermanmiller.com/products/seating/lounge-seating/eames-lounge-chair-and-ottoman/",
  },
  Classique: {
    kicker: "Classique",
    title: "Un fauteuil devenu signe",
    text:
      "Pensé comme une relecture moderne du fauteuil club du XIXe siècle, le Lounge Chair est devenu l’une des formes les plus reconnaissables du design du XXe siècle.",
    source: "https://www.hermanmiller.com/products/seating/lounge-seating/eames-lounge-chair-and-ottoman/",
  },
  Maison: {
    kicker: "Maison",
    title: "Du musée au salon",
    text:
      "L’objet a très vite dépassé le statut de prototype : les images de campagne le montraient dans des intérieurs variés, comme pour prouver qu’un fauteuil moderniste pouvait aussi devenir un meuble domestique.",
    source: "https://en.wikipedia.org/wiki/Eames_Lounge_Chair",
  },
  Bureau: {
    kicker: "Bureau",
    title: "Un confort professionnel",
    text:
      "La diffusion par Herman Miller a installé le fauteuil dans une culture du travail et des intérieurs modernes, entre espace domestique, bureau de direction et objet de représentation.",
    source: "https://www.hermanmiller.com/products/seating/lounge-seating/eames-lounge-chair-and-ottoman/",
  },
  "Cinéma": {
    kicker: "Cinéma",
    title: "Les Eames filmaient aussi",
    text:
      "Charles et Ray Eames ne se limitaient pas au mobilier : leur studio produisait aussi des films, des expositions et des objets pédagogiques. Leur manière de raconter le monde visuellement a accompagné la réception de leurs meubles.",
    source: "https://www.wallpaper.com/design-interiors/charles-ray-eames-furniture-design-definitive-guide",
  },
  Transmission: {
    kicker: "Transmission",
    title: "Une mémoire entretenue",
    text:
      "Le travail des Eames est aujourd’hui conservé, étudié et transmis par plusieurs institutions et archives. Le fauteuil continue ainsi d’exister comme objet, mais aussi comme récit de conception.",
    source: "https://www.wallpaper.com/design-interiors/charles-ray-eames-furniture-design-definitive-guide",
  },
};

const timelinePopup = document.querySelector("[data-timeline-popup]");
const timelinePopupClose = document.querySelector("[data-timeline-popup-close]");
const timelinePopupKicker = document.querySelector("[data-timeline-popup-kicker]");
const timelinePopupTitle = document.querySelector("[data-timeline-popup-title]");
const timelinePopupText = document.querySelector("[data-timeline-popup-text]");
const timelinePopupSource = document.querySelector("[data-timeline-popup-source]");

function closeTimelinePopup() {
  if (!timelinePopup) return;
  timelinePopup.classList.remove("is-open");
  timelinePopup.setAttribute("aria-hidden", "true");
}

function openTimelinePopup(marker) {
  if (!timelinePopup || !marker) return;

  const key = marker.textContent.trim();
  const anecdote = timelineAnecdotes[key];
  if (!anecdote) return;

  if (timelinePopupKicker) timelinePopupKicker.textContent = anecdote.kicker;
  if (timelinePopupTitle) timelinePopupTitle.textContent = anecdote.title;
  if (timelinePopupText) timelinePopupText.textContent = anecdote.text;
  if (timelinePopupSource) timelinePopupSource.href = anecdote.source;

  timelinePopup.classList.add("is-open");
  timelinePopup.setAttribute("aria-hidden", "false");
  timelinePopupClose?.focus({ preventScroll: true });
}

timelineMarkers.forEach((marker) => {
  marker.setAttribute("role", "button");
  marker.setAttribute("tabindex", "0");
  marker.setAttribute("aria-label", `Ouvrir l'anecdote ${marker.textContent.trim()}`);
  marker.addEventListener("click", () => openTimelinePopup(marker));
  marker.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openTimelinePopup(marker);
  });
});

timelinePopupClose?.addEventListener("click", closeTimelinePopup);
timelinePopup?.addEventListener("click", (event) => {
  if (event.target === timelinePopup) closeTimelinePopup();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeTimelinePopup();
});

const designerTransitionOverlay = document.querySelector(".designer-transition-overlay");
const designerFinalLink = document.querySelector('.final-actions a[href="designers.html"]');

designerFinalLink?.addEventListener("click", (event) => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  event.preventDefault();
  const targetHref = designerFinalLink.href;

  if (!prefersReducedMotion && designerTransitionOverlay) {
    designerTransitionOverlay.classList.add("is-active");
    window.setTimeout(() => {
      window.location.href = targetHref;
    }, 760);
    return;
  }

  window.location.href = targetHref;
});

const horizontalScrolls = Array.from(document.querySelectorAll("[data-horizontal-scroll]"));

function updateHorizontalScrolls() {
  if (!horizontalScrolls.length) return;

  const viewportHeight = window.innerHeight || 1;
  const viewportWidth = window.innerWidth || 1;

  horizontalScrolls.forEach((section) => {
    const track = section.querySelector(".horizontal-scroll__track");
    const panels = Array.from(section.querySelectorAll(".horizontal-scroll__panel"));
    if (!track || !panels.length) return;

    section.style.setProperty("--panel-count", panels.length);
    section.style.minHeight = `${Math.max(2, panels.length) * 100}vh`;

    const rect = section.getBoundingClientRect();
    const scrollRange = Math.max(1, rect.height - viewportHeight);
    const progress = clamp(-rect.top / scrollRange, 0, 1);
    const maxShift = Math.max(0, track.scrollWidth - viewportWidth);

    section.style.setProperty("--horizontal-progress", progress.toFixed(4));
    section.style.setProperty("--horizontal-shift", String(maxShift * progress));
  });
}

const shutterSections = Array.from(document.querySelectorAll("[data-shutter]"));

function updateShutters() {
  if (!shutterSections.length) return;

  const viewportHeight = window.innerHeight || 1;

  shutterSections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    const progress = clamp((viewportHeight * 0.82 - rect.top) / (viewportHeight * 0.62), 0, 1);
    section.style.setProperty("--shutter-progress", progress.toFixed(4));
  });
}

let motionTicking = false;

function updateAllMotion() {
  motionTicking = false;
  updateOpeningChairReveal();
  updateScrollProgressTexts();
  updateChapterGates();
  updateHorizontalScrolls();
  updateShutters();
  updateParallax();
  updateTimelineCurve();
}

function requestMotionUpdate() {
  if (motionTicking) return;
  motionTicking = true;
  requestAnimationFrame(updateAllMotion);
}

window.addEventListener("scroll", requestMotionUpdate, { passive: true });
if (lenisInstance) {
  lenisInstance.on("scroll", requestMotionUpdate);
}
window.addEventListener("resize", requestMotionUpdate);
requestMotionUpdate();

/* Floating objects — restored, but paused when the scene is not visible */
function initFloatingObjects() {
  const scene = document.querySelector("[data-floating-scene]");
  if (!scene || prefersReducedMotion) return;

  const elements = Array.from(scene.querySelectorAll(".floating-object"));
  if (!elements.length) return;

  let isActive = false;
  let frameId = null;
  let draggedItem = null;

  const items = elements.map((element, index) => {
    const state = {
      element,
      index,
      pointerX: 0,
      pointerY: 0,
      targetPointerX: 0,
      targetPointerY: 0,
      dragX: 0,
      dragY: 0,
      lastClientX: 0,
      lastClientY: 0,
      isDragging: false,
      depth: Number(element.dataset.depth || 30),
      ampX: Number(element.dataset.floatX || 28),
      ampY: Number(element.dataset.floatY || 22),
      speed: Number(element.dataset.speed || 0.75),
      rotation: Number(element.dataset.rotation || 0),
      phase: index * 1.57,
    };

    element.style.setProperty("--base-rotation", `${state.rotation}deg`);
    element.addEventListener("pointerdown", (event) => {
      draggedItem = state;
      state.isDragging = true;
      state.lastClientX = event.clientX;
      state.lastClientY = event.clientY;
      element.classList.add("is-dragging");
      element.setPointerCapture?.(event.pointerId);
      event.preventDefault();
      event.stopPropagation();
    });
    return state;
  });

  window.addEventListener("pointermove", (event) => {
    if (!draggedItem) return;

    draggedItem.dragX += event.clientX - draggedItem.lastClientX;
    draggedItem.dragY += event.clientY - draggedItem.lastClientY;
    draggedItem.lastClientX = event.clientX;
    draggedItem.lastClientY = event.clientY;
  });

  window.addEventListener("pointerup", () => {
    if (!draggedItem) return;

    draggedItem.isDragging = false;
    draggedItem.element.classList.remove("is-dragging");
    draggedItem = null;
  });

  scene.addEventListener("pointermove", (event) => {
    const bounds = scene.getBoundingClientRect();
    const relX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const relY = (event.clientY - bounds.top) / bounds.height - 0.5;

    items.forEach((item) => {
      const direction = item.index % 2 === 0 ? 1 : -1;
      item.targetPointerX = relX * item.depth * direction;
      item.targetPointerY = relY * item.depth * -0.62;
    });
  });

  scene.addEventListener("pointerleave", () => {
    items.forEach((item) => {
      item.targetPointerX = 0;
      item.targetPointerY = 0;
    });
  });

  function render(time) {
    if (!isActive) {
      frameId = null;
      return;
    }

    const t = time / 1000;

    items.forEach((item) => {
      item.pointerX += (item.targetPointerX - item.pointerX) * 0.075;
      item.pointerY += (item.targetPointerY - item.pointerY) * 0.075;

      const dragDamping = item.isDragging ? 0.12 : 1;
      const driftX = Math.sin(t * item.speed + item.phase) * item.ampX * dragDamping;
      const driftY = Math.cos(t * item.speed * 0.82 + item.phase) * item.ampY * dragDamping;
      const driftRotation = Math.sin(t * item.speed * 0.58 + item.phase) * 2.8 * dragDamping;

      item.element.style.transform = `translate3d(${item.dragX + item.pointerX + driftX}px, ${item.dragY + item.pointerY + driftY}px, 0) rotate(${item.rotation + driftRotation}deg)`;
    });

    frameId = requestAnimationFrame(render);
  }

  function start() {
    if (isActive) return;
    isActive = true;
    scene.classList.add("is-floating-active");
    frameId = requestAnimationFrame(render);
  }

  function stop() {
    isActive = false;
    scene.classList.remove("is-floating-active");
    if (frameId) cancelAnimationFrame(frameId);
    frameId = null;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) start();
        else stop();
      });
    },
    { threshold: 0.12, rootMargin: "12% 0px 12% 0px" },
  );

  observer.observe(scene);
}

initFloatingObjects();

/* Eames assembly exploded view */
const assemblySection = document.querySelector(".eames-assembly-section");
const assemblyObject = document.querySelector("[data-eames-assembly]");

if (
  assemblySection &&
  assemblyObject &&
  window.gsap &&
  window.ScrollTrigger &&
  !prefersReducedMotion
) {
  gsap.registerPlugin(ScrollTrigger);

  if (lenisInstance) {
    lenisInstance.on("scroll", ScrollTrigger.update);
  }

  const assemblyPieces = Array.from(
    assemblyObject.querySelectorAll(".eames-assembly-piece"),
  );
  const assemblyCallouts = Array.from(
    document.querySelectorAll("[data-assembly-callout]"),
  );

  const explodedPositions = [
    { x: -230, y: -110, z: 260, rotateX: 10, rotateY: -18, rotateZ: -8 },
    { x: 190, y: -160, z: 180, rotateX: -12, rotateY: 20, rotateZ: 9 },
    { x: -150, y: 145, z: 220, rotateX: 8, rotateY: 14, rotateZ: 12 },
    { x: 230, y: 110, z: 300, rotateX: -16, rotateY: -12, rotateZ: -10 },
    { x: -310, y: 35, z: -120, rotateX: 14, rotateY: -28, rotateZ: 7 },
    { x: 300, y: -20, z: -80, rotateX: -10, rotateY: 26, rotateZ: -12 },
    { x: -85, y: -230, z: 340, rotateX: 24, rotateY: -8, rotateZ: 16 },
    { x: 95, y: 235, z: 260, rotateX: -22, rotateY: 10, rotateZ: -14 },
    { x: -245, y: 210, z: 80, rotateX: 12, rotateY: 22, rotateZ: -6 },
    { x: 250, y: 205, z: 120, rotateX: -18, rotateY: -20, rotateZ: 10 },
    { x: -35, y: -310, z: -160, rotateX: 20, rotateY: 12, rotateZ: -18 },
    { x: 35, y: 300, z: -140, rotateX: -20, rotateY: -12, rotateZ: 18 },
    { x: 0, y: -70, z: 420, rotateX: 6, rotateY: 0, rotateZ: 0 },
  ];

  gsap.set(assemblyObject, {
    transformPerspective: 1500,
    transformStyle: "preserve-3d",
  });

  const orderedAssemblyCallouts = [
    ".eames-assembly-callout--seat",
    ".eames-assembly-callout--headrest",
    ".eames-assembly-callout--back",
    ".eames-assembly-callout--ottoman",
  ]
    .map((selector) => assemblyCallouts.find((callout) => callout.matches(selector)))
    .filter(Boolean);

  orderedAssemblyCallouts.forEach((assemblyCallout) => {
    const calloutLines = Array.from(
      assemblyCallout.querySelectorAll(".eames-assembly-callout__line"),
    );
    const calloutDot = assemblyCallout.querySelector(
      ".eames-assembly-callout__dot",
    );
    const calloutLabel = assemblyCallout.querySelector(
      ".eames-assembly-callout__label",
    );
    const calloutLabelWords = calloutLabel
      ? Array.from(calloutLabel.querySelectorAll(".progress-word"))
      : [];

    calloutLines.forEach((line) => {
      const length = line.getTotalLength();
      gsap.set(line, {
        strokeDasharray: length,
        strokeDashoffset: length,
      });
    });
    gsap.set(assemblyCallout, {
      opacity: 0,
      x: 18,
      y: 10,
    });
    gsap.set(calloutDot, {
      opacity: 0,
      scale: 0.62,
      transformOrigin: "50% 50%",
    });
    gsap.set(calloutLabel, { opacity: 1, x: 0 });
    gsap.set(calloutLabelWords, {
      "--word-fill": "100%",
      "--word-opacity": 0,
    });
  });

  assemblyPieces.forEach((piece, index) => {
    const start = explodedPositions[index % explodedPositions.length];

    gsap.set(piece, {
      ...start,
      scale: 0.96,
      opacity: 0.72,
      filter: "blur(3px) sepia(0.12) saturate(0.9) brightness(0.88)",
      transformOrigin: "50% 50%",
      force3D: true,
    });
  });

  gsap
    .timeline({
      defaults: {
        ease: "power2.out",
        duration: 1,
      },
      scrollTrigger: {
        trigger: assemblySection,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.2,
      },
    })
    .to(
      assemblyObject,
      {
        rotateX: 0,
        rotateY: 0,
        scale: 1,
      },
      0,
    )
    .to(
      assemblyPieces,
      {
        x: 0,
        y: 0,
        z: 0,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        scale: 1,
        opacity: 1,
        filter: "blur(0px) sepia(0.12) saturate(0.92) brightness(0.96)",
        stagger: {
          each: 0.018,
          from: "center",
        },
      },
      0,
    );

  const calloutRevealTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: assemblySection,
      start: "82% bottom",
      end: "bottom bottom",
      scrub: 1.2,
    },
  });
  let calloutRevealTime = 0;

  orderedAssemblyCallouts.forEach((assemblyCallout) => {
    const calloutLines = Array.from(
      assemblyCallout.querySelectorAll(".eames-assembly-callout__line"),
    );
    const calloutDot = assemblyCallout.querySelector(
      ".eames-assembly-callout__dot",
    );
    const calloutLabel = assemblyCallout.querySelector(
      ".eames-assembly-callout__label",
    );
    const calloutLabelWords = calloutLabel
      ? Array.from(calloutLabel.querySelectorAll(".progress-word"))
      : [];

    calloutRevealTimeline
      .to(assemblyCallout, {
        opacity: 1,
        x: 0,
        y: 0,
        duration: 0.72,
        ease: "power2.out",
      }, calloutRevealTime)
      .to(
        calloutDot,
        {
          opacity: 1,
          scale: 1,
          duration: 0.32,
          ease: "power2.out",
        },
        calloutRevealTime + 0.04,
      )
      .to(
        calloutLines[0],
        {
          strokeDashoffset: 0,
          duration: 0.48,
          ease: "power2.inOut",
        },
        calloutRevealTime + 0.14,
      )
      .to(
        calloutLines[1],
        {
          strokeDashoffset: 0,
          duration: 0.58,
          ease: "power2.inOut",
        },
        calloutRevealTime + 0.34,
      )
      .to(
        calloutLabelWords.length ? calloutLabelWords : calloutLabel,
        {
          "--word-fill": "0%",
          "--word-opacity": 1,
          duration: 0.68,
          ease: "power2.out",
          stagger: calloutLabelWords.length ? 0.08 : 0,
        },
        calloutRevealTime + 0.56,
      );

    const labelRevealDuration =
      0.68 + Math.max(0, calloutLabelWords.length - 1) * 0.08;
    calloutRevealTime += 0.56 + labelRevealDuration;
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
} else if (assemblyObject) {
  Array.from(assemblyObject.querySelectorAll(".eames-assembly-piece")).forEach(
    (piece) => {
      piece.style.transform = "translate3d(0, 0, 0)";
      piece.style.opacity = "1";
    },
  );
}
