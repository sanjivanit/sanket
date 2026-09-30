// Builds ref.html: a self-contained page that renders design/Main.dc.html for a given state (URL params).
import fs from 'node:fs';
import * as _os from 'node:os';
import * as _path from 'node:path';
import * as _fs from 'node:fs';
const REPO = _path.resolve(import.meta.dirname, '../..');
// Output folder for screenshots and diffs. Override with QA_OUT=/some/dir
const OUT = process.env.QA_OUT || _path.join(_os.tmpdir(), 'sanket-qa');
for (const d of ['shots', 'ob']) _fs.mkdirSync(_path.join(OUT, d), { recursive: true });

const html = fs.readFileSync(_path.join(REPO, 'design/Main.dc.html'), 'utf8');
const style = /<style>([\s\S]*?)<\/style>/.exec(html)[1];
const tplStart = html.indexOf('<div class="pg-root"');
const tplEnd = html.indexOf('<script type="text/x-dc"');
const template = html.slice(tplStart, tplEnd).replace(/<\/x-dc>\s*$/, '');
const cls = html.slice(html.indexOf('class Component extends DCLogic'), html.lastIndexOf('</script>'));
const page = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+Devanagari:wght@400;600&display=swap" rel="stylesheet">
<style>${style}</style></head><body>
<template id="tpl">${template.replace(/<\/template>/g, '')}</template>
<div id="out"></div>
<script>
class DCLogic { constructor(props){ this.props = props || {}; } setState(s){ Object.assign(this.state, s); } }
${cls}
const q = new URLSearchParams(location.search);
const c = new Component({ startAt: 'dashboard', theme: q.get('theme') || 'light' });
Object.assign(c.state, {
  step: +(q.get('step') || 0), phase: q.get('phase') || 'watch', qty: +(q.get('qty') || 0), rejected: q.get('rejected') === '1',
  tab: q.get('tab') || 'forecast', view: q.get('view') || 'tiles', why: q.get('why') === '1', showB: q.get('showB') === '1', lang: q.get('lang') || 'mr', ob: 0, hint: false,
});
const vals = c.renderVals();
const get = (expr, scope) => {
  expr = expr.trim(); if (expr === 'true') return true; if (expr === 'false') return false;
  const parts = expr.split('.'); let cur = parts[0] in scope ? scope[parts[0]] : vals[parts[0]];
  for (let i = 1; i < parts.length && cur != null; i++) cur = cur[parts[i]];
  return cur;
};
const isSingle = (s) => /^\\{\\{[^}]+\\}\\}$/.test(s.trim());
const interp = (s, scope) => s.replace(/\\{\\{([^}]+)\\}\\}/g, (m, e) => { const v = get(e, scope); return v == null ? '' : String(v); });
function expand(node, scope, out) {
  if (node.nodeType === 3) { out.appendChild(document.createTextNode(interp(node.textContent, scope))); return; }
  if (node.nodeType !== 1) return;
  const tag = node.localName;
  if (tag === 'sc-if') { const raw = node.getAttribute('value'); const val = isSingle(raw) ? get(raw.trim().slice(2, -2), scope) : raw; if (val) node.childNodes.forEach((ch) => expand(ch, scope, out)); return; }
  if (tag === 'sc-for') { const list = get(node.getAttribute('list').trim().slice(2, -2), scope) || []; const as = node.getAttribute('as'); list.forEach((item) => { const s = Object.create(scope); s[as] = item; node.childNodes.forEach((ch) => expand(ch, s, out)); }); return; }
  const el = document.createElementNS(node.namespaceURI, node.localName);
  for (const a of node.attributes) {
    if (/^on/i.test(a.name) || a.name.startsWith('hint-')) continue;
    const val = interp(a.value, scope);
    if (a.name === 'disabled') { if (val === 'true') el.setAttribute('disabled', ''); continue; }
    el.setAttribute(a.name, val);
  }
  node.childNodes.forEach((ch) => expand(ch, scope, el));
  out.appendChild(el);
}
const tpl = document.getElementById('tpl').content;
tpl.childNodes.forEach((ch) => expand(ch, {}, document.getElementById('out')));
document.body.style.margin = '0';
document.title = 'ref-ready';
</script></body></html>`;
fs.writeFileSync(_path.join(OUT, 'ref.html'), page);
console.log('ref.html written', page.length);
