# IPTV Portugal — static site

Static site for www.iptvportuguesse.com, built with a tiny dependency-free script (`node build.js`) and deployed on Vercel.

## Structure
- `content/posts/*.md` — the 41 blog articles as Markdown (file name = URL slug)
- `templates/article.html`, `templates/blog.html` — page templates for articles and the blog index
- `build.js` — renders Markdown to HTML, builds the blog index and `sitemap.xml` into `public/`
- Root `*.html` — hand-written pages: home, plans (`pack-*`), `canais`, `iptv-setup`, `contact-us`, legal pages, `404`
- `vercel.json` — build settings, clean URLs (no `.html`, no trailing slash) and redirects for old WordPress URLs

## Add or edit an article
Create `content/posts/my-slug.md`:

```
---
title: "Article title"
description: "One or two sentences for Google (max ~155 characters)"
date: "2026-09-26"
category: "Guia · IPTV Portugal"
---

## First heading

Paragraph with **bold**, *italic* and [a link](/other-slug).
```

Supported: `##`/`###`/`####` headings, paragraphs, `-` and `1.` lists, `>` quotes, pipe tables, links, bold, italic.
Link to other articles as `/slug`. Commit and push — Vercel rebuilds automatically.

## Local preview
```
node build.js
npx serve public   # or any static server
```
