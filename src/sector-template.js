import { navHTML, footerHTML } from './main.js'

export function sectorPage({ id, navId, title, subtitle, color, colorBg, sections }) {
  return `
    ${navHTML(navId)}
    <main class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <a href="/" class="back-link mb-6 inline-flex">&larr; Back to map</a>
      <header class="mb-10 pb-6 border-b border-ink-faint/20">
        <div class="flex items-center gap-3 mb-2">
          <span class="w-3 h-3 rounded-full" style="background:${color}"></span>
          <span class="info-tag" style="border-color:${color};color:${color}">${id}</span>
        </div>
        <h1 class="font-display text-3xl text-accent-amber tracking-wide mb-2">${title}</h1>
        <p class="text-ink-muted text-sm max-w-2xl">${subtitle}</p>
      </header>
      ${sections.map(sec => `
        <section class="mb-10">
          <h2 class="section-title">${sec.title}</h2>
          ${sec.content}
        </section>
      `).join('')}
    </main>
    ${footerHTML()}
  `
}

export function locationCard(name, description, tags = []) {
  return `
    <div class="p-4 rounded-lg bg-parchment-light border border-ink-faint/20 mb-3">
      <div class="flex items-center gap-2 mb-2">
        <h4 class="subsection-title mb-0">${name}</h4>
        ${tags.map(t => `<span class="info-tag" style="border-color:var(--color-ink-faint);color:var(--color-ink-muted)">${t}</span>`).join('')}
      </div>
      <p class="text-sm text-ink-muted leading-relaxed">${description}</p>
    </div>
  `
}

export function statRow(label, value) {
  return `<div class="detail-row"><span class="text-sm text-ink-muted">${label}</span><span class="text-sm text-ink">${value}</span></div>`
}
