// Static build: Markdown articles (content/posts/*.md) -> HTML pages in public/
// No dependencies. Run: node build.js
const fs = require('fs'), path = require('path');
const ROOT = __dirname, OUT = path.join(ROOT, 'public');
const BASE = 'https://www.iptvportuguesse.com';

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jsonStr = s => JSON.stringify(s);

// ---------- Markdown (subset used by the articles) ----------
function inline(src) {
  const stash = [];
  let s = src.replace(/\\([\\*\[\]#>\-.|])/g, (_, c) => { stash.push(c); return '\u0000' + (stash.length - 1) + '\u0000'; });
  s = esc(s);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => {
    const ext = /^https?:\/\//.test(u) && !u.startsWith(BASE);
    return `<a href="${u}"${ext ? ' rel="noopener"' : ''}>${t}</a>`;
  });
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  s = s.replace(/ {2}\n/g, '<br>\n');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => esc(stash[+i]));
}

function renderList(lines, i, indent) {
  const re = /^(\s*)([-*]|\d+\.)\s+(.*)$/;
  const first = re.exec(lines[i]);
  const ordered = /\d/.test(first[2]);
  let html = ordered ? '<ol>' : '<ul>';
  while (i < lines.length) {
    const m = re.exec(lines[i]);
    if (!m || m[1].length < indent) break;
    if (m[1].length > indent) {
      const [sub, next] = renderList(lines, i, m[1].length);
      html = html.replace(/<\/li>$/, sub + '</li>'); i = next; continue;
    }
    html += `<li>${inline(m[3])}</li>`; i++;
  }
  return [html + (ordered ? '</ol>' : '</ul>'), i];
}

function markdown(md) {
  const lines = md.replace(/\r/g, '').split('\n');
  const out = []; let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    let m;
    if ((m = /^(#{2,4})\s+(.*)$/.exec(l))) { out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); i++; continue; }
    if (/^\|/.test(l) && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1] || '')) {
      const cells = r => r.replace(/^\||\|\s*$/g, '').split(/(?<!\\)\|/).map(c => inline(c.trim().replace(/\\\|/g, '|')));
      const head = cells(l); i += 2; const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(cells(lines[i++]));
      out.push('<div class="tbl"><table><thead><tr>' + head.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>' +
        rows.map(r => '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>');
      continue;
    }
    if (/^>\s?/.test(l)) {
      const q = []; while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote>${inline(q.join(' '))}</blockquote>`); continue;
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(l)) { const [h, n] = renderList(lines, i, (/^(\s*)/.exec(l))[1].length); out.push(h); i = n; continue; }
    const p = [];
    while (i < lines.length && lines[i].trim() && !/^(#{2,4}\s|\||>|\s*([-*]|\d+\.)\s+)/.test(lines[i])) p.push(lines[i++]);
    if (!p.length) { p.push(lines[i++]); }
    out.push(`<p>${inline(p.join('\n'))}</p>`);
  }
  return out.join('\n    ');
}

function parsePost(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const m = /^---\n([\s\S]*?)\n---\n+([\s\S]*)$/.exec(raw);
  if (!m) throw new Error('Missing front matter: ' + file);
  const meta = {};
  m[1].split('\n').forEach(line => { const k = /^(\w+):\s*(.*)$/.exec(line); if (k) meta[k[1]] = JSON.parse(k[2]); });
  ['title', 'description', 'date', 'category'].forEach(k => { if (!meta[k]) throw new Error(`${file}: missing ${k}`); });
  meta.slug = path.basename(file, '.md'); meta.body = m[2];
  meta.words = m[2].split(/\s+/).length;
  return meta;
}

const fill = (tpl, vars) => tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => { if (!(k in vars)) throw new Error('template var ' + k); return vars[k]; });
const human = d => d.split('-').reverse().join('/');

// ---------- build ----------
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const staticPages = [];
for (const f of fs.readdirSync(ROOT)) {
  if (/\.(html|svg|webp|png|jpg|ico|json|txt)$/i.test(f) && !['vercel.json', 'package.json'].includes(f)) {
    fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f));
    if (f.endsWith('.html') && f !== '404.html') staticPages.push(f === 'index.html' ? '' : f.replace(/\.html$/, ''));
  }
}
const posts = fs.readdirSync(path.join(ROOT, 'content/posts')).filter(f => f.endsWith('.md'))
  .map(f => parsePost(path.join(ROOT, 'content/posts', f))).sort((a, b) => b.date.localeCompare(a.date));
const articleTpl = fs.readFileSync(path.join(ROOT, 'templates/article.html'), 'utf8');
for (const p of posts) {
  const html = fill(articleTpl, {
    title: esc(p.title), description: esc(p.description), slug: p.slug, date: p.date, dateHuman: human(p.date),
    category: esc(p.category), jsonTitle: jsonStr(p.title), jsonDescription: jsonStr(p.description), body: markdown(p.body),
  });
  fs.writeFileSync(path.join(OUT, p.slug + '.html'), html);
}
const cards = posts.map(p => `    <a class="card" href="/${p.slug}">
      <div class="cdate">${human(p.date)} · ${Math.max(1, Math.round(p.words / 200))} min de leitura</div>
      <div class="ctitle">${esc(p.title)}</div>
      <div class="cex">${esc(p.description.length > 170 ? p.description.slice(0, 167) + '…' : p.description)}</div>
    </a>`).join('\n');
fs.writeFileSync(path.join(OUT, 'blog.html'), fill(fs.readFileSync(path.join(ROOT, 'templates/blog.html'), 'utf8'), { cards, count: String(posts.length) }));
const urls = [...staticPages, 'blog', ...posts.map(p => p.slug)];
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(u => `  <url><loc>${BASE}/${u}</loc></url>`).join('\n') + '\n</urlset>\n');
console.log(`Built ${posts.length} articles, blog index, sitemap (${urls.length} URLs) -> public/`);
