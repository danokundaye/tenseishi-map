export function initNav(activePage) {
  const nav = document.getElementById('site-nav');
  if (!nav) return;

  const links = [
    { href: '/', label: 'Map', id: 'map' },
    { href: '/pages/sector-zero.html', label: 'Sector Zero', id: 'sector-zero' },
    { href: '/pages/sector-one.html', label: 'Sector I', id: 'sector-one' },
    { href: '/pages/sector-two.html', label: 'Sector II', id: 'sector-two' },
    { href: '/pages/sector-three.html', label: 'Sector III', id: 'sector-three' },
  ];

  nav.innerHTML = `
    <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      <a href="/" class="flex items-center gap-3 group">
        <img src="/favicon.svg" alt="Tenseishi seal" class="w-7 h-7 opacity-80 group-hover:opacity-100 transition-opacity">
        <span class="font-[var(--font-display)] text-lg tracking-[0.12em] uppercase text-[var(--color-text-primary)]" style="font-family:var(--font-display)">Tenseishi</span>
      </a>
      <nav class="hidden md:flex items-center gap-8">
        ${links.map(l => `<a href="${l.href}" class="nav-link ${activePage === l.id ? 'active' : ''}">${l.label}</a>`).join('')}
      </nav>
      <button id="mobile-toggle" class="md:hidden text-[var(--color-text-secondary)]">
        <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
    <div id="mobile-menu" class="hidden md:hidden border-t border-[var(--color-border)] px-6 py-4 flex flex-col gap-4">
      ${links.map(l => `<a href="${l.href}" class="nav-link ${activePage === l.id ? 'active' : ''}">${l.label}</a>`).join('')}
    </div>
  `;

  document.getElementById('mobile-toggle')?.addEventListener('click', () => {
    document.getElementById('mobile-menu')?.classList.toggle('hidden');
  });
}

export function initFooter() {
  const footer = document.getElementById('site-footer');
  if (!footer) return;
  footer.innerHTML = `
    <div class="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <p class="text-sm" style="color:var(--color-text-muted)">Tenseishi — Humanity's last bastion</p>
      <p class="text-sm" style="color:var(--color-text-muted)">Shinobi World RPG</p>
    </div>
  `;
}
