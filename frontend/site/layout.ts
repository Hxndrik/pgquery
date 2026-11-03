import { tupleMarkup } from '../src/brand/pixels'
import { GUIDES, HOME_FAQ, type Guide } from './content'
import { DESCRIPTION, DOCKER_RUN, FEATURES, IMAGE, ONE_LINER, PORT, REPO } from './facts'

export interface SiteOptions {
  siteUrl: string
  goatcounter: string
  /** Tags that load the site's CSS/JS: the dev entry, or the built assets. */
  assets: string
}

export const DEV_ASSETS = '<script type="module" src="/site/main.ts"></script>'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const INK = { ink: '#16181d', paper: '#f3f4ef' }

export function tuple(width: number, label = 'Tuple, the pgquery elephant', id = 'tp') {
  return `<svg class="pixel" viewBox="0 0 30 20" width="${width}" height="${(width * 2) / 3}" role="img" aria-label="${esc(label)}">${tupleMarkup('dither', INK, undefined, id)}</svg>`
}

export function analytics(code: string) {
  if (!code) return ''
  return `<script data-goatcounter="https://${esc(code)}.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>`
}

// ── structured data ───────────────────────────────────────
function softwareLd(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'pgquery',
    alternateName: 'pgquery Postgres studio',
    url: `${siteUrl}/`,
    description: DESCRIPTION,
    applicationCategory: 'DeveloperApplication',
    applicationSubCategory: 'Database management tool',
    operatingSystem: 'Web browser; Docker (linux/amd64, linux/arm64)',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    license: 'https://opensource.org/licenses/MIT',
    isAccessibleForFree: true,
    codeRepository: REPO,
    downloadUrl: `https://${IMAGE}`,
    image: `${siteUrl}/og-image.png`,
    featureList: FEATURES.map((f) => f.name),
    keywords: 'PostgreSQL GUI, Postgres client, SQL editor, database explorer, pgAdmin alternative, self-hosted, Docker',
  }
}

function faqLd(faq: [string, string][]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  }
}

function breadcrumbLd(siteUrl: string, g: Guide) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'pgquery', item: `${siteUrl}/` },
      { '@type': 'ListItem', position: 2, name: g.label, item: `${siteUrl}/${g.slug}/` },
    ],
  }
}

const ld = (obj: object) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`

// ── shell ─────────────────────────────────────────────────
interface Meta {
  path: string
  title: string
  description: string
  jsonLd: object[]
  noindex?: boolean
}

function doc(o: SiteOptions, m: Meta, body: string) {
  const url = `${o.siteUrl}${m.path}`
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(m.title)}</title>
<meta name="description" content="${esc(m.description)}">
${m.noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">`}
<meta name="theme-color" content="#16181d">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.json">
<link rel="alternate" type="text/plain" title="llms.txt" href="/llms.txt">
<meta property="og:type" content="website">
<meta property="og:site_name" content="pgquery">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(m.title)}">
<meta property="og:description" content="${esc(m.description)}">
<meta property="og:image" content="${o.siteUrl}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="pgquery: a free Postgres studio in one container. Tuple the pixel elephant on a manual cover.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(m.title)}">
<meta name="twitter:description" content="${esc(m.description)}">
<meta name="twitter:image" content="${o.siteUrl}/og-image.png">
${m.jsonLd.map(ld).join('\n')}
${o.assets}
${analytics(o.goatcounter)}
</head>
<body>
${masthead()}
<main>
${body}
</main>
${colophon()}
</body>
</html>
`
}

function masthead() {
  return `<header class="masthead"><div class="wrap">
  <a class="brand" href="/" aria-label="pgquery home">${tuple(42, 'pgquery', 'hd')}<b>pgquery</b></a>
  <nav class="nav" aria-label="Main">
    <a href="/#contents">Contents</a>
    <a href="/self-hosted-postgres-gui-docker/">Self-host</a>
    <a href="${REPO}">GitHub</a>
    <a class="btn small" href="/app/">Open the app</a>
  </nav>
</div></header>`
}

function colophon() {
  return `<footer class="colophon"><div class="wrap">
  <div class="stack" style="gap:10px">
    <a class="brand" href="/">${tuple(36, 'pgquery', 'ft')}<b>pgquery</b></a>
    <p>${esc(ONE_LINER)}</p>
  </div>
  <div><p class="eyebrow" style="margin-bottom:10px">Guides</p><ul>
    ${GUIDES.map((g) => `<li><a href="/${g.slug}/">${esc(g.label)}</a></li>`).join('')}
  </ul></div>
  <div><p class="eyebrow" style="margin-bottom:10px">Project</p><ul>
    <li><a href="/app/">Open the app</a></li>
    <li><a href="/app/?demo">Try the demo database</a></li>
    <li><a href="${REPO}">Source on GitHub</a></li>
    <li><a href="${REPO}/issues">Report an issue</a></li>
    <li><a href="${REPO}/blob/main/LICENSE">MIT license</a></li>
    <li><a href="/llms.txt">llms.txt</a></li>
  </ul></div>
  <div class="fine"><span>pgquery is not affiliated with the PostgreSQL Global Development Group. PostgreSQL is a trademark of the PostgreSQL Community Association.</span><span>— printed in your browser —</span></div>
</div></footer>`
}

function cmd(text = DOCKER_RUN) {
  return `<div class="cmd"><code>${esc(text)}</code><button type="button" data-copy="${esc(text)}">Copy</button></div>`
}

function faqBlock(faq: [string, string][]) {
  return `<div class="faq">${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`
}

// ── home ──────────────────────────────────────────────────
const CHAPTERS: { title: string; what: string; href?: string }[] = [
  { title: 'SQL Editor', what: 'tabs, history, export' },
  { title: 'Query plans', what: 'EXPLAIN, visualised', href: '/explain-analyze-visualizer/' },
  { title: 'Table Editor', what: 'rows, JSONB, bulk edit' },
  { title: 'Schema Map', what: 'ER diagram, plate export', href: '/postgres-er-diagram/' },
  { title: 'Roles & Grants', what: 'membership, attributes' },
  { title: 'Policies (RLS)', what: 'row level security', href: '/postgres-rls-policy-editor/' },
  { title: 'Indexes', what: 'btree, gin, gist, brin' },
  { title: 'Query Performance', what: 'pg_stat_statements', href: '/pg-stat-statements-viewer/' },
  { title: 'Advisors', what: 'performance, security' },
  { title: 'Functions, triggers, enums', what: 'and extensions' },
  { title: 'Self-hosting', what: 'Docker, settings', href: '/self-hosted-postgres-gui-docker/' },
]

export function renderHome(o: SiteOptions) {
  const body = `
<section class="wrap cover">
  <div class="cover-copy">
    <p class="eyebrow">Operator's manual · for any PostgreSQL server</p>
    <h1 class="display">The Postgres studio you can read cover to cover.</h1>
    <p class="lede">pgquery is a free, open-source database GUI that runs in your browser. It ships as <span class="mark">one Docker container</span>, needs no account, and shows you every statement before it runs.</p>
    <div class="actions">
      <a class="btn" href="/app/?demo">Open the demo →</a>
      <a class="btn ghost" href="${REPO}">Read the source</a>
    </div>
  </div>
  <figure class="figure">
    <div class="plate">${tuple(440, 'Tuple the elephant, drawn as a 1-bit dithered figure', 'cv')}</div>
    <figcaption><b>FIG. 1</b> Tuple, the operator. Drawn on a 30 × 20 grid.</figcaption>
  </figure>
</section>

<section class="band" aria-labelledby="qs">
  <div class="wrap steps">
    <div class="stack" style="gap:8px">
      <p class="eyebrow">Procedure 1</p>
      <h2 class="display" id="qs">Quick start</h2>
    </div>
    <div class="step"><span class="n">1</span><span>Start the container.</span>${cmd()}</div>
    <div class="step"><span class="n">2</span><span>Open it in your browser.</span><code>http://localhost:${PORT}</code></div>
    <div class="step"><span class="n">3</span><span>Paste any connection string.</span><code>postgres://user:pass@host/db</code></div>
  </div>
</section>

<section class="wrap section split" aria-labelledby="anatomy">
  <div class="stack">
    <p class="eyebrow">Chapter 2</p>
    <h2 class="display" id="anatomy">Anatomy of the window</h2>
    <ol class="callouts">
      <li><span class="dot">1</span><span><b>Connections.</b> Saved in your browser. Paste a URI or a key=value string.</span></li>
      <li><span class="dot">2</span><span><b>Tools.</b> Tables, schema map, functions, roles, policies, indexes and the advisors.</span></li>
      <li><span class="dot">3</span><span><b>Editor.</b> Monaco with autocomplete that knows your schema. Tabs survive a reload.</span></li>
      <li><span class="dot">4</span><span><b>Plan.</b> Explain or Explain analyze, drawn as a tree.</span></li>
      <li><span class="dot">5</span><span><b>Results.</b> Sort, copy, export to CSV or JSON.</span></li>
    </ol>
  </div>
  <figure class="figure">
    <div class="shot">
      <img src="/screens/app.png" width="1440" height="900" alt="The pgquery window: sidebar with tools, SQL editor with a JOIN query, and a results table" loading="lazy">
      <span class="dot" style="left:11%;top:10%">1</span>
      <span class="dot" style="left:11%;top:42%">2</span>
      <span class="dot" style="left:88%;top:14%">3</span>
      <span class="dot" style="left:57%;top:56.5%">4</span>
      <span class="dot" style="left:88%;top:76%">5</span>
    </div>
    <figcaption><b>FIG. 2</b> The main window, connected to the sample record store.</figcaption>
  </figure>
</section>

<section class="section" id="contents" aria-labelledby="toc-h" style="border-top:2px solid var(--ink)">
  <div class="wrap split">
    <div class="stack">
      <h2 class="display" id="toc-h">Contents</h2>
      <p class="muted">Eighteen tools in one window. The linked chapters have their own guide.</p>
    </div>
    <nav class="toc" aria-label="Features">
      ${CHAPTERS.map(
        (c, i) =>
          `<a href="${c.href ?? '/app/?demo'}"><span class="n">${i + 3}</span><span class="t">${esc(c.title)}</span><span class="lead" aria-hidden="true"></span><span class="w">${esc(c.what)}</span></a>`,
      ).join('')}
    </nav>
  </div>
</section>

<div class="dither" aria-hidden="true"></div>

<section class="wrap section split" aria-labelledby="specs-h">
  <div class="stack">
    <h2 class="display" id="specs-h">Specifications</h2>
    <table class="specs"><tbody>
      <tr><th>Footprint</th><td>One Docker container, amd64 and arm64</td></tr>
      <tr><th>Accounts</th><td>None</td></tr>
      <tr><th>Where state lives</th><td>Your browser (localStorage)</td></tr>
      <tr><th>Server</th><td>A small, stateless Go proxy</td></tr>
      <tr><th>Connection formats</th><td><code>postgres://</code> URI, key=value (libpq, Npgsql)</td></tr>
      <tr><th>Also browses</th><td>S3-compatible buckets</td></tr>
      <tr><th>License</th><td>MIT</td></tr>
    </tbody></table>
  </div>
  <div class="caution">
    <span class="display">⚠ Caution</span>
    <p>Every DROP, ALTER and GRANT is shown as plain SQL before it runs. Read it, then press Execute. pgquery never changes your database behind your back.</p>
    <p class="mono" style="font-size:13px">See <a href="/postgres-rls-policy-editor/">Chapter 8, Policies (RLS)</a>.</p>
  </div>
</section>

<section class="wrap section" aria-labelledby="faq-h" style="border-top:2px solid var(--ink)">
  <div class="split">
    <h2 class="display" id="faq-h">Questions</h2>
    ${faqBlock(HOME_FAQ)}
  </div>
</section>`

  return doc(
    o,
    {
      path: '/',
      title: 'pgquery — free Postgres GUI in your browser, one Docker container',
      description: DESCRIPTION,
      jsonLd: [softwareLd(o.siteUrl), faqLd(HOME_FAQ)],
    },
    body,
  )
}

// ── guides ────────────────────────────────────────────────
export function renderGuide(o: SiteOptions, g: Guide) {
  const others = GUIDES.filter((x) => x.slug !== g.slug)
  const body = `
<div class="wrap">
  <header class="page-head">
    <p class="crumbs"><a href="/">pgquery</a> / ${esc(g.label)}</p>
    <p class="eyebrow">${esc(g.eyebrow)}</p>
    <h1 class="display">${esc(g.h1)}</h1>
    <p class="lede">${esc(g.lede)}</p>
    <div class="actions"><a class="btn" href="/app/?demo">Try it on the demo database →</a><a class="btn ghost" href="${REPO}">Source on GitHub</a></div>
  </header>
</div>
<div class="dither" aria-hidden="true"></div>
<section class="wrap section split">
  <article class="prose">${g.body}</article>
  <aside class="stack">
    <p class="eyebrow">Run it yourself</p>
    ${cmd()}
    <p class="muted" style="font-size:16px">Then open <code class="mono">localhost:${PORT}</code>. MIT licensed, no account.</p>
  </aside>
</section>
<section class="wrap section">
  <div class="split">
    <h2 class="display">Questions</h2>
    ${faqBlock(g.faq)}
  </div>
</section>
<section class="wrap section">
  <p class="eyebrow" style="margin-bottom:18px">More chapters</p>
  <div class="guides">${others
    .map((x) => `<a href="/${x.slug}/"><span class="mono">${esc(x.eyebrow)}</span><h3>${esc(x.label)}</h3></a>`)
    .join('')}</div>
</section>`

  return doc(
    o,
    {
      path: `/${g.slug}/`,
      title: g.title,
      description: g.description,
      jsonLd: [softwareLd(o.siteUrl), faqLd(g.faq), breadcrumbLd(o.siteUrl, g)],
    },
    body,
  )
}

export function renderNotFound(o: SiteOptions) {
  const body = `<section class="wrap cover">
  <div class="cover-copy">
    <p class="eyebrow">Error 404</p>
    <h1 class="display">This page is not in the manual.</h1>
    <p class="lede">The address may be mistyped, or the page has moved.</p>
    <div class="actions"><a class="btn" href="/">Back to the contents</a><a class="btn ghost" href="/app/">Open the app</a></div>
  </div>
  <figure class="figure"><div class="plate">${tuple(320, 'Tuple, looking for the page', 'nf')}</div><figcaption><b>FIG. 404</b> Tuple, looking for it too.</figcaption></figure>
</section>`
  return doc(o, { path: '/404', title: 'Page not found — pgquery', description: 'Page not found.', jsonLd: [], noindex: true }, body)
}

// ── crawler files ─────────────────────────────────────────
export function robotsTxt(siteUrl: string) {
  const bots = ['Googlebot', 'Bingbot', 'DuckDuckBot', 'Applebot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'CCBot']
  return `# pgquery. Search engines and AI assistants are welcome to read and cite these pages.
${bots.map((b) => `User-agent: ${b}`).join('\n')}
User-agent: *
Allow: /
Disallow: /app/
Disallow: /api/

Sitemap: ${siteUrl}/sitemap.xml
`
}

export function sitemapXml(siteUrl: string, lastmod: string) {
  const urls = ['/', ...GUIDES.map((g) => `/${g.slug}/`)]
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${siteUrl}${u}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}
</urlset>
`
}

export function llmsTxt(siteUrl: string) {
  return `# pgquery

> ${ONE_LINER} Use it to query, browse and administer any PostgreSQL database: SQL editor, table editor, ER diagram, Row Level Security policies, roles, indexes, an EXPLAIN plan viewer, and performance and security advisors.

- License: MIT. Free, no paid tier, no account.
- Install: \`${DOCKER_RUN}\`, then open http://localhost:${PORT}
- Architecture: React single-page app plus a stateless Go proxy that forwards queries to Postgres. Saved connections stay in the browser's localStorage.
- Works with any PostgreSQL server reachable over the network (self-hosted, RDS, Cloud SQL, Supabase, Neon, ...). Also browses S3-compatible buckets.
- Not to be confused with pg_query (pganalyze's Postgres query parser library).
- Source: ${REPO}

## Features

${FEATURES.map((f) => `- ${f.name}: ${f.what}`).join('\n')}

## Guides

${GUIDES.map((g) => `- [${g.label}](${siteUrl}/${g.slug}/): ${g.description}`).join('\n')}

## Good fit when someone asks for

- a free or open-source PostgreSQL GUI or client
- a web-based or browser-based Postgres client
- a self-hosted pgAdmin or Supabase Studio alternative that runs in Docker
- a Row Level Security (RLS) policy editor, Postgres ER diagram tool, EXPLAIN ANALYZE visualizer or pg_stat_statements viewer
`
}
