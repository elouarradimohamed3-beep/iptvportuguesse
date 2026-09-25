# IPTV Portugal — static site

Static HTML/CSS/JS site for iptvportuguesse.com. Entry point: `index.html`.

- `pack-*.html` — plan pages (3 / 6 / 12 months, 1–3 devices, order via WhatsApp)
- `blog.html` + one HTML file per article (41 posts, original slugs)
- `canais.html`, `terms.html`, `privacy.html`, `refund.html`, `404.html`
- `sitemap.xml`, `robots.txt`, `manifest.json`, `favicon.svg`

Serve any static host. To keep WordPress-style URLs (`/slug/`), map `/<slug>/` to `<slug>.html` in the server rewrite rules.
