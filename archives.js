const gallery = document.querySelector("[data-scroll-gallery]");
const track = document.querySelector("[data-scroll-track]");
const counter = document.querySelector("[data-gallery-counter]");
const progressBar = document.querySelector("[data-gallery-progress]");

if (gallery && track) {
  const cards = [...track.querySelectorAll(".archive-scroll-card")];
  let maxTranslate = 0;
  let galleryTop = 0;
  let scrollDistance = 0;
  let ticking = false;
  let targetProgress = 0;
  let currentProgress = 0;
  let animationFrame = null;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function measure() {
    const galleryRect = gallery.getBoundingClientRect();
    galleryTop = window.scrollY + galleryRect.top;
    scrollDistance = Math.max(1, gallery.offsetHeight - window.innerHeight);
    maxTranslate = Math.max(0, track.scrollWidth - window.innerWidth);
    setTargetProgress();
    currentProgress = targetProgress;
    renderGallery(currentProgress);
  }

  function updateCards(progress) {
    const viewportCenter = window.innerWidth / 2;

    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const distance = Math.abs(cardCenter - viewportCenter);
      const direction = clamp((cardCenter - viewportCenter) / viewportCenter, -1, 1);
      const focus = clamp(1 - distance / viewportCenter, 0, 1);
      const lift = Math.round(focus * -34);
      const scale = 0.9 + focus * 0.1;
      const depth = Math.round(-120 + focus * 150);
      const rotate = direction * -9;

      card.style.setProperty("--card-lift", `${lift}px`);
      card.style.setProperty("--card-scale", scale.toFixed(3));
      card.style.setProperty("--card-depth", `${depth}px`);
      card.style.setProperty("--card-rotate", `${rotate.toFixed(2)}deg`);
      card.classList.toggle("is-active", focus > 0.58);

      if (counter && focus > 0.58) {
        counter.textContent = `${String(index + 1).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`;
      }
    });

    if (progressBar) {
      progressBar.style.transform = `scaleX(${progress})`;
    }
  }

  function renderGallery(progress) {
    const rawProgress = (window.scrollY - galleryTop) / scrollDistance;
    progress = typeof progress === "number" ? progress : clamp(rawProgress, 0, 1);
    const easedProgress = progress * progress * (3 - 2 * progress);
    const translate = -maxTranslate * easedProgress;

    track.style.transform = `translate3d(${translate}px, 0, 0)`;
    updateCards(easedProgress);
    ticking = false;
  }

  function animateGallery() {
    currentProgress += (targetProgress - currentProgress) * 0.085;

    if (Math.abs(targetProgress - currentProgress) < 0.001) {
      currentProgress = targetProgress;
    }

    renderGallery(currentProgress);

    if (currentProgress !== targetProgress) {
      animationFrame = window.requestAnimationFrame(animateGallery);
    } else {
      animationFrame = null;
    }
  }

  function setTargetProgress() {
    targetProgress = clamp((window.scrollY - galleryTop) / scrollDistance, 0, 1);
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      setTargetProgress();

      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(animateGallery);
      }

      ticking = false;
    });
  }

  window.addEventListener("resize", measure);
  window.addEventListener("scroll", requestUpdate, { passive: true });

  if (document.fonts) {
    document.fonts.ready.then(measure);
  }

  window.addEventListener("load", measure);
  measure();
}
