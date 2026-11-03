import type { Plugin, ResolvedConfig } from 'vite'
import { loadEnv } from 'vite'
import { GUIDES } from './content'
import { DEV_ASSETS, analytics, llmsTxt, renderGuide, renderHome, renderNotFound, robotsTxt, sitemapXml, type SiteOptions } from './layout'

/**
 * Builds the public site as static HTML: index.html (the landing), one page
 * per guide, a 404 page, and robots.txt / sitemap.xml / llms.txt, all from
 * the templates in site/. The app at /app is a normal Vite entry.
 */
export function sitePlugin(): Plugin {
  let siteUrl = 'https://pgquery.dev'
  let goatcounter = ''
  const opts = (assets: string): SiteOptions => ({ siteUrl, goatcounter, assets })

  return {
    name: 'pgquery-site',

    configResolved(config: ResolvedConfig) {
      const env = loadEnv(config.mode, config.envDir || process.cwd(), 'VITE_')
      siteUrl = (env.VITE_SITE_URL || process.env.VITE_SITE_URL || siteUrl).replace(/\/+$/, '')
      goatcounter = env.VITE_GOATCOUNTER_CODE || process.env.VITE_GOATCOUNTER_CODE || ''
    },

    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        // The landing is rendered entirely from the template.
        if (ctx.path === '/index.html') return renderHome(opts(DEV_ASSETS))
        return html.replace('<!-- @analytics -->', analytics(goatcounter)).replaceAll('%VITE_SITE_URL%', siteUrl)
      },
    },

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url ?? '/').split('?')[0]
        const guide = GUIDES.find((g) => path === `/${g.slug}` || path === `/${g.slug}/`)
        const text: Record<string, () => string> = {
          '/robots.txt': () => robotsTxt(siteUrl),
          '/sitemap.xml': () => sitemapXml(siteUrl, new Date().toISOString().slice(0, 10)),
          '/llms.txt': () => llmsTxt(siteUrl),
        }
        if (text[path]) {
          res.setHeader('Content-Type', path.endsWith('.xml') ? 'application/xml' : 'text/plain; charset=utf-8')
          res.end(text[path]())
          return
        }
        if (!guide) return next()
        const html = await server.transformIndexHtml(path, renderGuide(opts(DEV_ASSETS), guide))
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end(html)
      })
    },

    generateBundle: {
      // After Vite has written the HTML entries into the bundle.
      order: 'post',
      handler(_, bundle) {
        // Reuse the landing's built CSS/JS tags for every generated page.
        const home = bundle['index.html']
        if (!home || home.type !== 'asset') this.error('index.html was not built')
        const homeHtml = String(home.source)
        const tags = homeHtml.match(/<(script type="module"[^>]*><\/script|link rel="(stylesheet|modulepreload)"[^>]*)>/g) ?? []
        const assets = tags.join('\n')

        const emit = (fileName: string, source: string) => this.emitFile({ type: 'asset', fileName, source })
        for (const g of GUIDES) emit(`${g.slug}/index.html`, renderGuide(opts(assets), g))
        emit('404.html', renderNotFound(opts(assets)))
        emit('robots.txt', robotsTxt(siteUrl))
        emit('sitemap.xml', sitemapXml(siteUrl, new Date().toISOString().slice(0, 10)))
        emit('llms.txt', llmsTxt(siteUrl))
      },
    },
  }
}
