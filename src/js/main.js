import '../scss/main.scss';

document.documentElement.classList.add('js');

const navToggle = document.getElementById('site-nav-toggle');
const siteNav = document.getElementById('site-nav');

if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

document.querySelectorAll('.has-dropdown > .site-nav-dropdown-trigger').forEach((trigger) => {
  trigger.addEventListener('click', (event) => {
    if (trigger.getAttribute('href') === '#') {
      event.preventDefault();
    }
    const item = trigger.closest('.has-dropdown');
    const isOpen = item.classList.toggle('is-open');
    trigger.setAttribute('aria-expanded', String(isOpen));
  });
});

// Error page: 重新載入 button just reloads the current document.
document.querySelectorAll('[data-error-reload]').forEach((button) => {
  button.addEventListener('click', () => {
    window.location.reload();
  });
});

// Back-to-top: smooth scroll via JS so we do not rely on html scroll-behavior
// (which also smooth-scrolls to #top on page refresh when the hash remains).
document.querySelectorAll('a[href="#top"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    if (window.history.replaceState) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
  });
});

// Homepage hero: background fade carousel.
// Slide 1 image already includes the van; slides 2–3 are scenery only.
const HOME_HERO_AUTOPLAY_MS = 5000;

function initHomeHeroCarousel() {
  const root = document.querySelector('[data-home-hero-carousel]');
  if (!root) return;

  const slides = Array.prototype.slice.call(root.querySelectorAll('[data-home-hero-slide]'));
  const dots = Array.prototype.slice.call(root.querySelectorAll('[data-home-hero-dot]'));
  if (slides.length < 2) return;

  let index = slides.findIndex((slide) => slide.classList.contains('is-active'));
  if (index < 0) index = 0;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let timer = null;

  function goTo(nextIndex) {
    const target = ((nextIndex % slides.length) + slides.length) % slides.length;
    if (target === index) return;

    slides[index].classList.remove('is-active');
    slides[target].classList.add('is-active');

    if (dots[index]) {
      dots[index].classList.remove('is-active');
      dots[index].setAttribute('aria-selected', 'false');
    }
    if (dots[target]) {
      dots[target].classList.add('is-active');
      dots[target].setAttribute('aria-selected', 'true');
    }

    index = target;
  }

  function stopAutoplay() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function startAutoplay() {
    stopAutoplay();
    if (reducedMotion.matches) return;
    timer = setInterval(() => {
      goTo(index + 1);
    }, HOME_HERO_AUTOPLAY_MS);
  }

  dots.forEach((dot, dotIndex) => {
    dot.addEventListener('click', () => {
      goTo(dotIndex);
      startAutoplay();
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoplay();
    else startAutoplay();
  });

  if (typeof reducedMotion.addEventListener === 'function') {
    reducedMotion.addEventListener('change', startAutoplay);
  } else if (typeof reducedMotion.addListener === 'function') {
    reducedMotion.addListener(startAutoplay);
  }

  startAutoplay();
}

initHomeHeroCarousel();

const TRIP_ACCORDION_DURATION = 220;

// Height slide used by the outer trip-select panel and nested region/county
// accordions. Ending in `auto` (expand) or `0` (collapse) keeps nested
// panels from clipping when a child opens/closes afterward.
function animateHeightPanel(panel, expand, onToggleClass) {
  if (panel._tripAccordionCleanup) {
    panel._tripAccordionCleanup();
  }

  panel.style.transition = 'none';
  if (expand) {
    panel.style.height = '0px';
    onToggleClass(true);
  } else {
    panel.style.height = `${panel.scrollHeight}px`;
    onToggleClass(false);
  }

  void panel.offsetHeight;

  const targetHeight = expand ? panel.scrollHeight : 0;
  panel.style.transition = `height ${TRIP_ACCORDION_DURATION}ms ease`;
  panel.style.height = `${targetHeight}px`;

  const cleanup = () => {
    panel.style.transition = '';
    panel.style.height = '';
    panel.removeEventListener('transitionend', onTransitionEnd);
    panel._tripAccordionCleanup = null;
  };
  const onTransitionEnd = (event) => {
    if (event.target === panel && event.propertyName === 'height') cleanup();
  };

  panel._tripAccordionCleanup = cleanup;
  panel.addEventListener('transitionend', onTransitionEnd);
}

function animateTripAccordion(node, panel, expand) {
  animateHeightPanel(panel, expand, (isExpand) => {
    node.classList.toggle('is-expanded', isExpand);
  });
}

const tripSelect = document.getElementById('trip-select');
const tripSelectTrigger = document.getElementById('trip-select-trigger');
const tripSelectPanel = document.getElementById('trip-select-panel');

if (tripSelect && tripSelectTrigger && tripSelectPanel) {
  tripSelectTrigger.addEventListener('click', () => {
    const willOpen = !tripSelect.classList.contains('is-open');
    tripSelectTrigger.setAttribute('aria-expanded', String(willOpen));
    animateHeightPanel(tripSelectPanel, willOpen, (isOpen) => {
      tripSelect.classList.toggle('is-open', isOpen);
    });
  });
}

function collapseTripAccordion(node) {
  const trigger = node.querySelector(':scope > [data-trip-accordion-trigger]');
  const panel = node.querySelector(':scope > [data-trip-accordion-panel]');
  if (!trigger || !panel) return;
  if (trigger.getAttribute('aria-expanded') !== 'true') return;

  trigger.setAttribute('aria-expanded', 'false');
  animateTripAccordion(node, panel, false);
}

document.querySelectorAll('[data-trip-accordion-trigger]').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));
    const node = trigger.closest('.trip-tree-node');
    if (!panel || !node) return;

    const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
    const willExpand = !isExpanded;

    // Region level (北中南東): single-open — closing siblings before opening.
    if (willExpand && node.classList.contains('trip-tree-node--1')) {
      const parentList = node.parentElement;
      if (parentList) {
        parentList.querySelectorAll(':scope > .trip-tree-node--1.is-expanded').forEach((sibling) => {
          if (sibling !== node) collapseTripAccordion(sibling);
        });
      }
    }

    trigger.setAttribute('aria-expanded', String(willExpand));
    animateTripAccordion(node, panel, willExpand);
  });
});

// FAQ accordion: isolated from trip accordion. Height slide via measured
// scrollHeight; [hidden] only after collapse finishes. Icons CSS-driven via
// aria-expanded.
const FAQ_ACCORDION_DURATION = 250;
const faqAccordionReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)',
);

function getFaqAccordionDuration() {
  return faqAccordionReducedMotion.matches ? 0 : FAQ_ACCORDION_DURATION;
}

function animateFaqAccordion(panel, expand) {
  if (panel._faqAccordionCleanup) {
    panel._faqAccordionCleanup();
  }

  const duration = getFaqAccordionDuration();

  if (duration === 0) {
    panel.style.transition = '';
    panel.style.height = '';
    panel.style.overflow = '';
    if (expand) {
      panel.removeAttribute('hidden');
    } else {
      panel.setAttribute('hidden', '');
    }
    panel._faqAccordionCleanup = null;
    return;
  }

  const wasHidden = panel.hasAttribute('hidden');
  const currentHeight = wasHidden ? 0 : panel.getBoundingClientRect().height;

  panel.style.overflow = 'hidden';
  panel.style.transition = 'none';

  if (expand) {
    panel.removeAttribute('hidden');
    panel.style.height = `${currentHeight}px`;
  } else {
    panel.removeAttribute('hidden');
    // Prefer measured content height; fall back to current if mid-animation.
    panel.style.height = `${Math.max(panel.scrollHeight, currentHeight)}px`;
  }

  void panel.offsetHeight;

  const targetHeight = expand ? panel.scrollHeight : 0;
  panel.style.transition = `height ${duration}ms ease-out`;
  panel.style.height = `${targetHeight}px`;

  const cleanup = (finished) => {
    panel.removeEventListener('transitionend', onTransitionEnd);
    if (panel._faqAccordionCleanupTimer) {
      clearTimeout(panel._faqAccordionCleanupTimer);
      panel._faqAccordionCleanupTimer = null;
    }
    panel.style.transition = '';
    if (finished) {
      if (expand) {
        panel.style.height = '';
        panel.style.overflow = '';
      } else {
        panel.setAttribute('hidden', '');
        panel.style.height = '';
        panel.style.overflow = '';
      }
    }
    panel._faqAccordionCleanup = null;
  };

  const onTransitionEnd = (event) => {
    if (event.target !== panel || event.propertyName !== 'height') return;
    cleanup(true);
  };

  panel._faqAccordionCleanup = () => cleanup(false);
  panel.addEventListener('transitionend', onTransitionEnd);
  // Fallback if transitionend is skipped (rapid reflow / interrupted).
  panel._faqAccordionCleanupTimer = setTimeout(() => cleanup(true), duration + 50);
}

document.querySelectorAll('[data-faq-accordion-trigger]').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const panelId = trigger.getAttribute('aria-controls');
    const panel = panelId ? document.getElementById(panelId) : null;
    if (!panel || !panel.hasAttribute('data-faq-accordion-panel')) return;

    const willExpand = trigger.getAttribute('aria-expanded') !== 'true';
    trigger.setAttribute('aria-expanded', String(willExpand));
    animateFaqAccordion(panel, willExpand);
  });
});

// Homepage FAQ: Figma shows Q1 pre-opened only on the mobile (<=768px)
// layout; desktop/pad start fully closed. Reuses the same accordion markup
// and CSS as the trigger click handler above — this just sets the initial
// state to match the breakpoint on load.
const homeFaqDefaultTrigger = document.querySelector('[data-faq-default-open]');

if (homeFaqDefaultTrigger && window.matchMedia('(max-width: 768px)').matches) {
  const panelId = homeFaqDefaultTrigger.getAttribute('aria-controls');
  const panel = panelId ? document.getElementById(panelId) : null;

  if (panel) {
    homeFaqDefaultTrigger.setAttribute('aria-expanded', 'true');
    panel.removeAttribute('hidden');
  }
}

const NEWS_PAGE_TRANSITION_DURATION = 380;
const newsReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Phase-1 static slicing: the two page panels already exist in the HTML
// (see news.html) — this only toggles which one is visible and animates
// the handoff. No card markup is generated or fetched here.
function initNewsPagination() {
  const viewport = document.querySelector('[data-news-viewport]');
  const pagination = document.querySelector('[data-news-pagination]');
  if (!viewport || !pagination) return;

  const panels = Array.prototype.slice.call(viewport.querySelectorAll('[data-news-panel]'));
  if (panels.length < 2) return;

  function getPanel(page) {
    return panels.filter((panel) => panel.getAttribute('data-news-panel') === String(page))[0];
  }

  const initialPanel = panels.filter((panel) => !panel.hidden)[0] || panels[0];
  let currentPage = Number.parseInt(initialPanel.getAttribute('data-news-panel'), 10);
  let isAnimating = false;

  // Measures a panel's natural height even while it's [hidden], so the
  // viewport can reserve space for the tallest panel up front. Without
  // this, switching to a page with fewer cards (e.g. page 2's 2 cards vs
  // page 1's 6) would collapse the viewport once the animation finished
  // and yank the pagination/CTA band upward.
  function measureNaturalHeight(panel) {
    if (!panel.hidden) return panel.getBoundingClientRect().height;

    panel.hidden = false;
    panel.style.visibility = 'hidden';
    panel.style.position = 'absolute';
    const height = panel.getBoundingClientRect().height;
    panel.style.visibility = '';
    panel.style.position = '';
    panel.hidden = true;
    return height;
  }

  function syncReservedHeight() {
    const tallest = Math.max.apply(null, panels.map(measureNaturalHeight));
    viewport.style.minHeight = `${tallest}px`;
  }

  syncReservedHeight();

  // Row/column counts change at each breakpoint, so the tallest panel's
  // height must be re-measured after a resize rather than computed once.
  let reservedHeightResizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(reservedHeightResizeTimer);
    reservedHeightResizeTimer = setTimeout(syncReservedHeight, 150);
  });

  function setPaginationState() {
    pagination.querySelectorAll('[data-news-page]').forEach((button) => {
      const isCurrent = button.getAttribute('data-news-page') === String(currentPage);
      button.classList.toggle('is-active', isCurrent);
      if (isCurrent) {
        button.setAttribute('aria-current', 'page');
      } else {
        button.removeAttribute('aria-current');
      }
    });

    const prevButton = pagination.querySelector('[data-news-page-prev]');
    const nextButton = pagination.querySelector('[data-news-page-next]');
    if (prevButton) prevButton.classList.toggle('is-disabled', currentPage <= 1);
    if (nextButton) nextButton.classList.toggle('is-disabled', currentPage >= panels.length);
  }

  function goToPage(targetPage) {
    if (isAnimating) return;

    const clampedPage = Math.min(Math.max(targetPage, 1), panels.length);
    if (clampedPage === currentPage) return;

    const outgoing = getPanel(currentPage);
    const incoming = getPanel(clampedPage);
    if (!outgoing || !incoming) return;

    const direction = clampedPage > currentPage ? 'forward' : 'backward';

    if (newsReducedMotion.matches) {
      outgoing.hidden = true;
      incoming.hidden = false;
      currentPage = clampedPage;
      setPaginationState();
      return;
    }

    isAnimating = true;

    const viewportHeight = outgoing.offsetHeight;
    viewport.style.height = `${viewportHeight}px`;
    viewport.classList.add('is-animating');

    incoming.hidden = false;
    incoming.classList.add(direction === 'forward' ? 'news-grid--pos-right' : 'news-grid--pos-left');
    outgoing.classList.add('news-grid--pos-center');

    viewport.style.height = `${Math.max(viewportHeight, incoming.offsetHeight)}px`;

    // Force a reflow so the entering panel's off-screen position is
    // committed before switching to the target transforms — otherwise both
    // changes would be batched into a single paint and no transition would
    // play.
    void incoming.offsetWidth;

    requestAnimationFrame(() => {
      outgoing.classList.remove('news-grid--pos-center');
      outgoing.classList.add(direction === 'forward' ? 'news-grid--pos-left' : 'news-grid--pos-right');
      incoming.classList.remove('news-grid--pos-right', 'news-grid--pos-left');
      incoming.classList.add('news-grid--pos-center');
    });

    const finishTransition = () => {
      outgoing.removeEventListener('transitionend', onTransitionEnd);
      clearTimeout(fallbackTimer);
      outgoing.hidden = true;
      outgoing.classList.remove('news-grid--pos-left', 'news-grid--pos-right', 'news-grid--pos-center');
      incoming.classList.remove('news-grid--pos-center');
      viewport.classList.remove('is-animating');
      viewport.style.height = '';
      currentPage = clampedPage;
      isAnimating = false;
      setPaginationState();
    };

    const onTransitionEnd = (event) => {
      if (event.target === outgoing && event.propertyName === 'transform') {
        finishTransition();
      }
    };

    outgoing.addEventListener('transitionend', onTransitionEnd);
    // Safety net in case transitionend never fires (e.g. tab backgrounded).
    const fallbackTimer = setTimeout(finishTransition, NEWS_PAGE_TRANSITION_DURATION + 100);
  }

  pagination.addEventListener('click', (event) => {
    const target = event.target.closest('[data-news-page], [data-news-page-prev], [data-news-page-next]');
    if (!target || target.classList.contains('is-disabled')) return;

    event.preventDefault();

    if (target.hasAttribute('data-news-page-prev')) {
      goToPage(currentPage - 1);
    } else if (target.hasAttribute('data-news-page-next')) {
      goToPage(currentPage + 1);
    } else {
      goToPage(Number.parseInt(target.getAttribute('data-news-page'), 10));
    }
  });

  setPaginationState();
}

initNewsPagination();

const TRIP_LIST_PAGE_SIZE = 9;
const TRIP_HEADING_BY_REGION = {
  all: '全部景點推薦',
  north: '北部景點推薦',
  central: '中部景點推薦',
  south: '南部景點推薦',
  east: '東部景點推薦',
};

// Recommended trips list: filter existing static cards by region tab and
// paginate「全部」at 9 items / page. No card markup is generated here.
function initRecommendedTrips() {
  const tabsRoot = document.querySelector('[data-trip-tabs]');
  if (!tabsRoot) return;

  const grid = document.querySelector('[data-trip-grid]');
  const pagination = document.querySelector('[data-trip-pagination]');
  const heading = document.querySelector('[data-trip-heading]');
  if (!grid || !pagination) return;

  const cards = Array.prototype.slice.call(grid.querySelectorAll('[data-trip-region]'));
  const tabs = Array.prototype.slice.call(tabsRoot.querySelectorAll('[data-trip-tab]'));
  if (!cards.length || !tabs.length) return;

  let currentRegion = 'all';
  let currentPage = 1;

  const activeTab = tabs.filter((tab) => tab.classList.contains('is-active'))[0];
  if (activeTab) {
    currentRegion = activeTab.getAttribute('data-trip-tab') || 'all';
  }

  function getMatchingCards() {
    if (currentRegion === 'all') return cards;
    return cards.filter((card) => card.getAttribute('data-trip-region') === currentRegion);
  }

  function setTabState() {
    tabs.forEach((tab) => {
      const isActive = tab.getAttribute('data-trip-tab') === currentRegion;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    });
  }

  function setPaginationState(totalPages, needsPagination) {
    if (!needsPagination) {
      pagination.setAttribute('hidden', '');
      return;
    }

    pagination.removeAttribute('hidden');

    pagination.querySelectorAll('[data-trip-page]').forEach((button) => {
      const page = Number.parseInt(button.getAttribute('data-trip-page'), 10);
      if (!Number.isFinite(page)) return;

      if (page > totalPages) {
        button.setAttribute('hidden', '');
        button.classList.remove('is-active');
        button.removeAttribute('aria-current');
        return;
      }

      button.removeAttribute('hidden');
      const isCurrent = page === currentPage;
      button.classList.toggle('is-active', isCurrent);
      if (isCurrent) {
        button.setAttribute('aria-current', 'page');
      } else {
        button.removeAttribute('aria-current');
      }
    });

    const prevButton = pagination.querySelector('[data-trip-page-prev]');
    const nextButton = pagination.querySelector('[data-trip-page-next]');
    if (prevButton) prevButton.classList.toggle('is-disabled', currentPage <= 1);
    if (nextButton) nextButton.classList.toggle('is-disabled', currentPage >= totalPages);
  }

  function render() {
    const matching = getMatchingCards();
    const needsPagination = currentRegion === 'all' && matching.length > TRIP_LIST_PAGE_SIZE;
    const totalPages = needsPagination
      ? Math.ceil(matching.length / TRIP_LIST_PAGE_SIZE)
      : 1;

    if (currentPage > totalPages) currentPage = 1;

    const start = needsPagination ? (currentPage - 1) * TRIP_LIST_PAGE_SIZE : 0;
    const end = needsPagination ? start + TRIP_LIST_PAGE_SIZE : matching.length;
    const visible = matching.slice(start, end);

    cards.forEach((card) => {
      if (visible.indexOf(card) !== -1) {
        card.removeAttribute('hidden');
      } else {
        card.setAttribute('hidden', '');
      }
    });

    if (heading && TRIP_HEADING_BY_REGION[currentRegion]) {
      heading.textContent = TRIP_HEADING_BY_REGION[currentRegion];
    }

    setTabState();
    setPaginationState(totalPages, needsPagination);
  }

  tabsRoot.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-trip-tab]');
    if (!tab || !tabsRoot.contains(tab)) return;

    const region = tab.getAttribute('data-trip-tab');
    if (!region || region === currentRegion) return;

    currentRegion = region;
    currentPage = 1;
    render();
  });

  pagination.addEventListener('click', (event) => {
    const target = event.target.closest(
      '[data-trip-page], [data-trip-page-prev], [data-trip-page-next]',
    );
    if (!target || target.classList.contains('is-disabled') || target.hasAttribute('hidden')) {
      return;
    }

    event.preventDefault();

    const matching = getMatchingCards();
    const totalPages = Math.max(1, Math.ceil(matching.length / TRIP_LIST_PAGE_SIZE));
    let nextPage = currentPage;

    if (target.hasAttribute('data-trip-page-prev')) {
      nextPage = currentPage - 1;
    } else if (target.hasAttribute('data-trip-page-next')) {
      nextPage = currentPage + 1;
    } else {
      nextPage = Number.parseInt(target.getAttribute('data-trip-page'), 10);
    }

    if (!Number.isFinite(nextPage)) return;
    nextPage = Math.min(Math.max(nextPage, 1), totalPages);
    if (nextPage === currentPage) return;

    currentPage = nextPage;
    render();
  });

  render();
}

initRecommendedTrips();

// Booking Details: reuse rental-detail native Constraint Validation (required /
// type=email / type=tel). On valid submit, continue to booking-confirmation.
// Future source toggling should hide via [hidden]/display:none and disable
// those controls so checkValidity skips them.
const bookingDetailsForm = document.getElementById('booking-details-form');

if (bookingDetailsForm) {
  bookingDetailsForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!bookingDetailsForm.checkValidity()) {
      bookingDetailsForm.reportValidity();
      return;
    }

    window.location.href = '/pages/booking-confirmation.html';
  });
}

// Booking Confirmation: native required validation for payment, invoice, and
// agreement. On valid submit, continue to booking-success (no payment gateway).
const bookingConfirmationForm = document.getElementById('booking-confirmation-form');

if (bookingConfirmationForm) {
  bookingConfirmationForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!bookingConfirmationForm.checkValidity()) {
      bookingConfirmationForm.reportValidity();
      return;
    }

    window.location.href = '/pages/booking-success.html';
  });
}
