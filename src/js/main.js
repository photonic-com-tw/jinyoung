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
