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
// agreement. Payment destination is not implemented yet — stay on this page.
const bookingConfirmationForm = document.getElementById('booking-confirmation-form');

if (bookingConfirmationForm) {
  bookingConfirmationForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!bookingConfirmationForm.checkValidity()) {
      bookingConfirmationForm.reportValidity();
      return;
    }
  });
}
