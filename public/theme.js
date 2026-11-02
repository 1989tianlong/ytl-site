(() => {
  const key = 'ytl-theme';
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = null;

  try {
    const saved = localStorage.getItem(key);
    if (saved === 'light' || saved === 'dark') preference = saved;
  } catch {
    /* Storage is optional. */
  }

  function current() {
    return preference ?? (system.matches ? 'dark' : 'light');
  }

  function apply(theme) {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#08090b' : '#fbfbfb');
    document.querySelectorAll('[data-theme-option]').forEach((button) => {
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.themeOption === theme),
      );
    });
  }

  apply(current());

  document.addEventListener('astro:before-swap', (event) => {
    const next = event.newDocument;
    next.documentElement.dataset.theme = current();
    next
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', current() === 'dark' ? '#08090b' : '#fbfbfb');
  });
  document.addEventListener('astro:page-load', () => apply(current()));
  document.addEventListener('DOMContentLoaded', () => apply(current()));

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest('[data-theme-option]');
    if (!button) return;
    const next = button.dataset.themeOption;
    if (next !== 'light' && next !== 'dark') return;
    preference = next;
    apply(preference);
    try {
      localStorage.setItem(key, preference);
    } catch {
      /* Storage is optional. */
    }
  });

  system.addEventListener('change', () => {
    if (!preference) apply(current());
  });
})();
