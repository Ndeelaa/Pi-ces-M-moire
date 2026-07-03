/* ---------------- HOME OPENING POSITION ---------------- */

const homeBlurReveal = document.querySelector(".home-blur-reveal");

if (homeBlurReveal) {
  let keepHomeAtTop = true;

  function forceHomeTop() {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    if (keepHomeAtTop) {
      window.requestAnimationFrame(forceHomeTop);
    }
  }

  forceHomeTop();

  homeBlurReveal.addEventListener("animationend", () => {
    keepHomeAtTop = false;
    document.body.classList.remove("is-home-opening");
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  });
}

/* ---------------- MENU BURGER ---------------- */

const menuBtn = document.querySelector(".menu-btn");
const closeBtn = document.querySelector(".close-menu");
const sideMenu = document.querySelector(".side-menu");
const overlay = document.querySelector(".overlay");

if (menuBtn && closeBtn && sideMenu && overlay) {
  menuBtn.addEventListener("click", () => {
    sideMenu.classList.add("active");
    overlay.classList.add("active");
  });

  closeBtn.addEventListener("click", closeMenu);
  overlay.addEventListener("click", closeMenu);
}

function closeMenu() {
  sideMenu.classList.remove("active");
  overlay.classList.remove("active");
}

/* ---------------- DESIGNER POPUP ---------------- */

const designerPopup = document.querySelector("[data-designer-popup]");
const designerPopupOpeners = document.querySelectorAll("[data-designer-popup-open]");
const designerPopupClose = document.querySelector("[data-designer-popup-close]");

if (designerPopup && designerPopupOpeners.length && designerPopupClose) {
  function openDesignerPopup() {
    designerPopup.classList.add("is-open");
    designerPopup.setAttribute("aria-hidden", "false");
  }

  function closeDesignerPopup() {
    designerPopup.classList.remove("is-open");
    designerPopup.setAttribute("aria-hidden", "true");
  }

  designerPopupOpeners.forEach((button) => {
    button.addEventListener("click", openDesignerPopup);
  });

  designerPopupClose.addEventListener("click", closeDesignerPopup);

  designerPopup.addEventListener("click", (event) => {
    if (event.target === designerPopup) {
      closeDesignerPopup();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeDesignerPopup();
    }
  });
}

/* ---------------- CUSTOM CURSOR ---------------- */

const cursor = document.querySelector(".custom-cursor");

if (cursor) {
  window.addEventListener("mousemove", (e) => {
    cursor.style.left = e.clientX + "px";
    cursor.style.top = e.clientY + "px";
  });

  const interactiveElements = document.querySelectorAll(
    "a, button, .archive-card, .category, .cards-stage",
  );

  interactiveElements.forEach((element) => {
    element.addEventListener("mouseenter", () => {
      cursor.classList.add("active");
    });

    element.addEventListener("mouseleave", () => {
      cursor.classList.remove("active");
    });
  });
}

/* ---------------- INFINITE CARD SLIDER ---------------- */

const archiveSelector = document.querySelector(".archive-selector");
const track = document.querySelector(".cards-track");

if (archiveSelector && track && window.gsap) {
  const cards = Array.from(track.querySelectorAll(".archive-card"));
  const prevArrow = document.querySelector(".slider-arrow--prev");
  const nextArrow = document.querySelector(".slider-arrow--next");
  const sliderState = {
    offset: 0,
    isOpen: false,
    isHovering: false,
    isCardSelected: false,
    direction: -1,
  };
  let arrowTween = null;

  function getGap() {
    if (window.innerWidth < 620) return 210;
    if (window.innerWidth < 1000) return 245;
    return 285;
  }

  function wrapPosition(value, gap) {
    const total = gap * cards.length;
    const half = total / 2;
    return ((((value + half) % total) + total) % total) - half;
  }

  function getCardState(card, index) {
    const gap = getGap();
    const base = (index - Math.floor(cards.length / 2)) * gap;
    const x = wrapPosition(base + sliderState.offset, gap);
    const distance = Math.abs(x);
    const depth = Math.max(0, 1 - distance / (gap * 2.4));
    const isSelected = card.classList.contains("is-selected");

    return {
      xPercent: -50,
      x,
      rotation: x / gap * 5,
      scale: isSelected ? 1.14 : 0.86 + depth * 0.16,
      opacity:
        sliderState.isCardSelected && !isSelected
          ? 0.35
          : 0.48 + depth * 0.52,
      zIndex: Math.round(depth * 10) + (isSelected ? 20 : 0),
      pointerEvents: "auto",
    };
  }

  function setClosedState(animate = false) {
    cards.forEach((card, index) => {
      const props = {
        xPercent: -50,
        x: index === 0 ? -120 : index === 1 ? 0 : 120,
        rotation: index === 0 ? -8 : index === 1 ? 0 : 8,
        scale: 1,
        opacity: index < 3 ? 1 : 0,
        zIndex: index === 1 ? 3 : index === 2 ? 2 : index === 0 ? 1 : 0,
        pointerEvents: index < 3 ? "auto" : "none",
      };

      if (animate) {
        gsap.to(card, {
          ...props,
          duration: 0.95,
          ease: "power3.inOut",
        });
      } else {
        gsap.set(card, props);
      }
    });
  }

  function renderCards(animate = false) {
    const gap = getGap();
    const total = gap * cards.length;

    if (Math.abs(sliderState.offset) > total) {
      sliderState.offset %= total;
    }

    if (!sliderState.isOpen) {
      setClosedState(animate);
      return;
    }

    cards.forEach((card, index) => {
      const props = getCardState(card, index);

      if (animate) {
        gsap.to(card, {
          ...props,
          duration: 1.15,
          ease: "power4.inOut",
        });
      } else {
        gsap.set(card, props);
      }
    });
  }

  function tickSlider() {
    if (
      !sliderState.isOpen ||
      !sliderState.isHovering ||
      sliderState.isCardSelected
    ) {
      return;
    }

    sliderState.offset +=
      sliderState.direction * 0.42 * gsap.ticker.deltaRatio(60);
    renderCards();
  }

  function openSlider() {
    sliderState.isOpen = true;
    sliderState.isHovering = true;
    archiveSelector.classList.add("is-open");
    clearSelection();
    renderCards(true);
  }

  function closeSlider() {
    sliderState.isOpen = false;
    sliderState.isHovering = false;
    archiveSelector.classList.remove("is-open");
    clearSelection();
    renderCards(true);
  }

  function moveSlider(direction) {
    const gap = getGap();

    if (arrowTween) {
      arrowTween.kill();
    }

    sliderState.direction = direction;
    sliderState.isOpen = true;
    archiveSelector.classList.add("is-open");
    clearSelection();

    arrowTween = gsap.to(sliderState, {
      offset: sliderState.offset + direction * gap,
      duration: 0.9,
      ease: "power3.inOut",
      onUpdate: renderCards,
    });
  }

  function clearSelection() {
    sliderState.isCardSelected = false;
    archiveSelector.classList.remove("has-active");

    cards.forEach((card) => {
      card.classList.remove("is-selected");
    });
  }

  setClosedState();

  gsap.ticker.add(tickSlider);

  archiveSelector.addEventListener("mouseenter", openSlider);
  archiveSelector.addEventListener("mouseleave", closeSlider);

  window.addEventListener("resize", renderCards);

  if (prevArrow) {
    prevArrow.addEventListener("click", () => moveSlider(1));
  }

  if (nextArrow) {
    nextArrow.addEventListener("click", () => moveSlider(-1));
  }

  cards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      sliderState.isCardSelected = true;
      archiveSelector.classList.add("has-active");

      cards.forEach((item) => {
        item.classList.remove("is-selected");
      });

      card.classList.add("is-selected");
      renderCards();
    });

    card.addEventListener("mouseleave", () => {
      clearSelection();
      renderCards();
    });
  });
}

/* ---------------- DESIGNER CONCAVE CAROUSEL ---------------- */

const designerDiveViewport = document.querySelector(".designer-dive__viewport");

if (designerDiveViewport) {
  const designerDiveTrack = designerDiveViewport.querySelector(".designer-dive__track");
  const designerDiveCards = Array.from(
    designerDiveViewport.querySelectorAll(".designer-dive-card"),
  );
  const designerDivePrev = designerDiveViewport.querySelector(".designer-dive-arrow--prev");
  const designerDiveNext = designerDiveViewport.querySelector(".designer-dive-arrow--next");
  const designerDiveState = {
    currentX: 0,
    targetX: 0,
    hoveredCard: null,
    isPaused: false,
    lastTime: null,
  };

  function getDesignerDiveLoopWidth() {
    return designerDiveTrack ? designerDiveTrack.scrollWidth / 2 : 0;
  }

  function getDesignerDiveStep() {
    const firstCard = designerDiveCards[0];

    if (!firstCard || !designerDiveTrack) {
      return 280;
    }

    const cardRect = firstCard.getBoundingClientRect();
    const trackStyles = window.getComputedStyle(designerDiveTrack);
    const gap = Number.parseFloat(trackStyles.columnGap || trackStyles.gap) || 28;

    return cardRect.width + gap;
  }

  function normalizeDesignerDivePosition() {
    const loopWidth = getDesignerDiveLoopWidth();

    if (!loopWidth) {
      return;
    }

    if (designerDiveState.currentX <= -loopWidth) {
      designerDiveState.currentX += loopWidth;
      designerDiveState.targetX += loopWidth;
    }

    if (designerDiveState.currentX > 0) {
      designerDiveState.currentX -= loopWidth;
      designerDiveState.targetX -= loopWidth;
    }
  }

  function moveDesignerDive(direction) {
    designerDiveState.targetX += direction * getDesignerDiveStep();
  }

  function setDesignerDiveHoveredCard(card) {
    if (designerDiveState.hoveredCard === card) {
      return;
    }

    if (designerDiveState.hoveredCard) {
      designerDiveState.hoveredCard.classList.remove("is-dive-hovered");
    }

    designerDiveState.hoveredCard = card;
    designerDiveViewport.classList.toggle("has-dive-hover", Boolean(card));

    if (card) {
      card.classList.add("is-dive-hovered");
    }
  }

  function getDesignerDiveCardAtPoint(x, y) {
    for (let index = designerDiveCards.length - 1; index >= 0; index -= 1) {
      const card = designerDiveCards[index];
      const rect = card.getBoundingClientRect();

      if (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
      ) {
        return card;
      }
    }

    return null;
  }

  function renderDesignerDive(time) {
    if (designerDiveState.lastTime === null) {
      designerDiveState.lastTime = time;
    }

    const delta = Math.min(32, time - designerDiveState.lastTime);
    designerDiveState.lastTime = time;

    if (!designerDiveState.isPaused) {
      designerDiveState.targetX -= delta * 0.028;
    }

    designerDiveState.currentX +=
      (designerDiveState.targetX - designerDiveState.currentX) * 0.08;
    normalizeDesignerDivePosition();

    if (designerDiveTrack) {
      designerDiveTrack.style.transform = `translate3d(${designerDiveState.currentX}px, 0, 0)`;
    }

    const viewportRect = designerDiveViewport.getBoundingClientRect();
    const viewportCenter = viewportRect.left + viewportRect.width / 2;
    const curveRange = viewportRect.width * 0.42;

    designerDiveCards.forEach((card) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const distance = Math.min(
        1,
        Math.abs((cardCenter - viewportCenter) / curveRange),
      );
      const centerWeight = 1 - distance;
      const baseZ = -190 * centerWeight;
      const baseScale = 0.94 + distance * 0.08;
      const baseOpacity = 0.86 + distance * 0.14;
      const isHovered = designerDiveState.hoveredCard === card;
      const isDimmed = designerDiveState.hoveredCard && !isHovered;

      card.style.transform = isHovered
        ? "translateY(-18px) translateZ(140px) scale(1.16)"
        : `translateY(0px) translateZ(${baseZ}px) scale(${baseScale})`;
      card.style.opacity = isHovered ? "1" : `${baseOpacity}`;
      card.style.zIndex = isHovered ? "20" : `${Math.round(distance * 6)}`;
      card.style.filter = isHovered
        ? "brightness(1.18) contrast(1.04) saturate(1.1)"
        : isDimmed
          ? "brightness(0.78) saturate(0.82)"
          : "brightness(1)";
      card.style.boxShadow = isHovered
        ? "0 0 52px rgba(201, 103, 61, 0.24), 0 52px 104px rgba(83, 45, 31, 0.34)"
        : "0 28px 58px rgba(83, 45, 31, 0.16)";
      card.style.borderColor = isHovered
        ? "rgba(201, 103, 61, 0.64)"
        : "rgba(201, 103, 61, 0.2)";
    });

    window.requestAnimationFrame(renderDesignerDive);
  }

  designerDiveViewport.addEventListener("mouseenter", () => {
    designerDiveState.isPaused = true;
  });

  designerDiveViewport.addEventListener("mouseleave", () => {
    designerDiveState.isPaused = false;
    setDesignerDiveHoveredCard(null);
  });

  if (designerDivePrev) {
    designerDivePrev.addEventListener("click", () => moveDesignerDive(1));
  }

  if (designerDiveNext) {
    designerDiveNext.addEventListener("click", () => moveDesignerDive(-1));
  }

  designerDiveViewport.addEventListener("pointermove", (event) => {
    if (event.target.closest(".designer-dive-arrow")) {
      setDesignerDiveHoveredCard(null);
      return;
    }

    setDesignerDiveHoveredCard(
      getDesignerDiveCardAtPoint(event.clientX, event.clientY),
    );
  });

  designerDiveViewport.addEventListener("click", (event) => {
    if (event.target.closest(".designer-dive-arrow")) {
      return;
    }

    const clickedCard =
      event.target.closest(".designer-dive-card--link") ||
      (designerDiveState.hoveredCard &&
      designerDiveState.hoveredCard.classList.contains("designer-dive-card--link")
        ? designerDiveState.hoveredCard
        : null);

    if (clickedCard) {
      window.location.href = clickedCard.href;
    }
  });

  window.requestAnimationFrame(renderDesignerDive);
}
