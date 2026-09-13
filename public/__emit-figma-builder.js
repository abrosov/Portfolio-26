/*
  Runs inside the live page (via the browser pane's javascript_tool) and returns
  the source of a Figma Plugin API script that rebuilds the page as one frame.

  The point of generating rather than hand-writing the builder: every coordinate,
  size, colour and line-break comes straight from the browser's own layout, so the
  Figma frame cannot drift from what the site actually renders. Nothing is retyped.

  Usage: paste this file's contents into javascript_tool, then
         emitFigmaBuilder({ width: 490 })
  and pass the returned string to use_figma as `code`.
*/

window.emitFigmaBuilder = ({
  width = 490,
  frameName = 'Climate Tech Viewer — Mobile 490',
  pageId = '0:1',
} = {}) => {
  const R = (n) => Math.round(n * 100) / 100;

  /* ---- colour ---------------------------------------------------------- */
  // Figma wants 0–1 channels and carries alpha on the paint, not the colour.
  const parseColor = (css) => {
    const m = css.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(',').map((v) => parseFloat(v));
    return { color: { r: r / 255, g: g / 255, b: b / 255 }, opacity: a };
  };

  /* ---- type ------------------------------------------------------------ */
  // The site ships exactly two Helvetica Now Display weights plus the Playfair
  // italic used for the accent word. Map CSS weights onto Figma style names.
  const fontFor = (family, weight, style) => {
    if (/Playfair/i.test(family)) return { family: 'Playfair Display', style: 'Medium Italic' };
    const w = parseInt(weight, 10) >= 700 ? 'Bold' : 'Medium';
    return { family: 'Helvetica Now Display', style: w };
  };

  /* ---- collection ------------------------------------------------------ */
  const nodes = [];
  const seenGridLines = [];

  const collect = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return;

    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) return;

    const tag = el.tagName.toLowerCase();
    const box = [R(r.left + scrollX), R(r.top + scrollY), R(r.width), R(r.height)];

    // The decorative column rules are position:fixed, so their boxes are
    // viewport-relative. Record their x positions and redraw them full-height.
    // Note the host div is matched by closest() too, hence the explicit tag test:
    // returning on the container would skip the <i> children that carry the rules.
    const gridHost = el.closest('.grid-lines');
    if (gridHost) {
      if (el !== gridHost) {
        const o = +getComputedStyle(gridHost).opacity;
        const bl = parseFloat(cs.borderLeftWidth);
        const br = parseFloat(cs.borderRightWidth);
        if (bl > 0) seenGridLines.push({ x: R(r.left + scrollX), c: cs.borderLeftColor, o });
        if (br > 0) seenGridLines.push({ x: R(r.right + scrollX - br), c: cs.borderRightColor, o });
        return;
      }
      for (const c of el.children) collect(c);
      return;
    }

    if (tag === 'img') {
      nodes.push({ t: 'img', box, src: el.getAttribute('src'), rad: cs.borderRadius, fit: cs.objectFit });
      return;
    }

    // The frame's own fill stands in for the page ground. Emitting it as a rect
    // too would bury the column rules, which are drawn before anything else.
    const isPageGround = el === document.body || el === document.documentElement;
    const bg = isPageGround ? null : parseColor(cs.backgroundColor);
    if (bg && bg.opacity > 0) {
      nodes.push({ t: 'rect', box, fill: bg, rad: cs.borderRadius, name: (el.className || tag).toString().split(' ')[0] || tag });
    }

    // Borders become thin rects — one per visible edge.
    for (const [side, w, col] of [
      ['top', cs.borderTopWidth, cs.borderTopColor],
      ['bottom', cs.borderBottomWidth, cs.borderBottomColor],
      ['left', cs.borderLeftWidth, cs.borderLeftColor],
      ['right', cs.borderRightWidth, cs.borderRightColor],
    ]) {
      const bw = parseFloat(w);
      if (!(bw > 0)) continue;
      const c = parseColor(col);
      if (!c || !c.opacity) continue;
      const b =
        side === 'top' ? [box[0], box[1], box[2], bw]
        : side === 'bottom' ? [box[0], R(box[1] + box[3] - bw), box[2], bw]
        : side === 'left' ? [box[0], box[1], bw, box[3]]
        : [R(box[0] + box[2] - bw), box[1], bw, box[3]];
      nodes.push({ t: 'rect', box: b, fill: c, rad: '0px', name: 'rule' });
    }

    // Emit one run per direct TEXT NODE, then walk the element children.
    //
    // Splitting on text nodes rather than on elements is what keeps mixed
    // content intact: <h1>Climate Tech<br><em>Viewer</em></h1> has both a text
    // node and element children, and an element-level test drops the "Climate
    // Tech" half outright. The same applies to every <br>-separated list on the
    // page (Services, Responsibilities), where each line is its own text node.
    const ownText = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim());

    for (const tn of ownText) {
      const range = document.createRange();
      range.selectNodeContents(tn);
      const rects = [...range.getClientRects()].filter((q) => q.width > 0 && q.height > 0);
      if (!rects.length) continue;

      const lh = R(parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2);
      let s = tn.textContent.replace(/\s+/g, ' ').trim();
      if (cs.textTransform === 'uppercase') s = s.toUpperCase();

      // A client rect is the glyph box, which is taller than the line box and
      // sits centred inside it. Figma places the first line box at the node's
      // top edge, so undo that centring to line the two up.
      const first = rects[0];
      const y = R(first.top + scrollY + (first.height - lh) / 2);

      // One rect means one line: let it hug, anchored at the glyph's own left.
      // Several rects mean it wrapped, so the column width is what reproduces
      // the break points — take it from the element's content box.
      const wrap = rects.length > 1;
      const padL = parseFloat(cs.paddingLeft) || 0;
      const bordL = parseFloat(cs.borderLeftWidth) || 0;
      const contentLeft = R(r.left + scrollX + bordL + padL);
      const contentWidth = R(el.clientWidth - padL - (parseFloat(cs.paddingRight) || 0));

      nodes.push({
        t: 'text',
        box: wrap
          ? [contentLeft, y, contentWidth, R(rects[rects.length - 1].bottom - first.top)]
          : [R(first.left + scrollX), y, R(first.width), R(first.height)],
        wrap,
        s,
        font: fontFor(cs.fontFamily, cs.fontWeight, cs.fontStyle),
        fs: R(parseFloat(cs.fontSize)),
        lh,
        ls: cs.letterSpacing === 'normal' ? 0 : R(parseFloat(cs.letterSpacing)),
        fill: parseColor(cs.color),
      });
    }

    for (const c of el.children) collect(c);
  };

  collect(document.body);

  const lines = [...new Map(seenGridLines.map((g) => [g.x, g])).values()].sort((a, b) => a.x - b.x);
  const pageH = R(document.documentElement.scrollHeight);
  const pageBg = parseColor(getComputedStyle(document.body).backgroundColor);

  /* ---- emit ------------------------------------------------------------ */
  const spec = { width, height: pageH, frameName, pageId, bg: pageBg, lines, nodes };

  return `
const SPEC = ${JSON.stringify(spec)};

const page = await figma.getNodeByIdAsync(SPEC.pageId);
await figma.setCurrentPageAsync(page);

// The site's licensed face may not exist in this runtime. Walk a fallback chain
// of neo-grotesques and use the first one actually present, reporting the
// choice so the substitution is never silent.
const available = await figma.listAvailableFontsAsync();
const styles = {};
for (const f of available) {
  (styles[f.fontName.family] = styles[f.fontName.family] || new Set()).add(f.fontName.style);
}
const CHAIN = {
  'Helvetica Now Display': ['Helvetica Now Display', 'Helvetica Neue', 'Helvetica', 'Inter', 'Archivo', 'Roboto', 'Arial'],
  'Playfair Display': ['Playfair Display'],
};
// Style names differ between families ("Medium" vs "Regular", "Medium Italic" vs "Italic").
const STYLE_ALIASES = {
  'Medium': ['Medium', 'Regular', 'Book'],
  'Bold': ['Bold', 'SemiBold', 'Semi Bold'],
  'Medium Italic': ['Medium Italic', 'Italic', 'Regular Italic'],
};
const resolved = {};
const resolve = (want) => {
  const key = want.family + '/' + want.style;
  if (resolved[key]) return resolved[key];
  for (const family of (CHAIN[want.family] || [want.family])) {
    const have = styles[family];
    if (!have) continue;
    for (const style of (STYLE_ALIASES[want.style] || [want.style])) {
      if (have.has(style)) return (resolved[key] = { family, style });
    }
  }
  return (resolved[key] = { family: 'Inter', style: want.style === 'Bold' ? 'Bold' : 'Regular' });
};

const wanted = [...new Map(SPEC.nodes.filter(n => n.t === 'text')
  .map(n => [n.font.family + '/' + n.font.style, n.font])).values()];
const fontMap = {};
for (const w of wanted) {
  const got = resolve(w);
  fontMap[w.family + ' ' + w.style] = got.family + ' ' + got.style;
  await figma.loadFontAsync(got);
}

// Park the frame clear of the existing artboards on this page.
const right = page.children.length
  ? Math.max(...page.children.map(n => n.x + n.width)) + 200
  : 0;

const frame = figma.createFrame();
frame.name = SPEC.frameName;
frame.resize(SPEC.width, SPEC.height);
frame.x = right;
frame.y = 0;
frame.clipsContent = true;
frame.fills = [{ type: 'SOLID', color: SPEC.bg.color }];
page.appendChild(frame);

const solid = (f) => [{ type: 'SOLID', color: f.color, opacity: f.opacity }];
const radii = (rad) => {
  const p = String(rad).split(' ').map(v => parseFloat(v) || 0);
  return p.length === 1 ? [p[0], p[0], p[0], p[0]]
       : p.length === 2 ? [p[0], p[1], p[0], p[1]]
       : p.length === 3 ? [p[0], p[1], p[2], p[1]]
       : p;
};

const created = [];
const imageTargets = [];

// Column rules first, so every other element sits above them.
for (const g of SPEC.lines) {
  const r = figma.createRectangle();
  r.name = 'grid rule';
  r.resize(1, SPEC.height);
  r.x = g.x; r.y = 0;
  const c = (g.c.match(/rgba?\\(([^)]+)\\)/)[1].split(',').map(Number));
  r.fills = [{ type: 'SOLID', color: { r: c[0]/255, g: c[1]/255, b: c[2]/255 }, opacity: g.o }];
  frame.appendChild(r);
  created.push(r.id);
}

for (const n of SPEC.nodes) {
  const [x, y, w, h] = n.box;

  if (n.t === 'rect') {
    const r = figma.createRectangle();
    r.name = n.name || 'rect';
    r.resize(Math.max(w, 0.01), Math.max(h, 0.01));
    r.x = x; r.y = y;
    r.fills = solid(n.fill);
    const rr = radii(n.rad);
    if (rr.some(v => v > 0)) {
      r.topLeftRadius = rr[0]; r.topRightRadius = rr[1];
      r.bottomRightRadius = rr[2]; r.bottomLeftRadius = rr[3];
    }
    frame.appendChild(r);
    created.push(r.id);
    continue;
  }

  if (n.t === 'img') {
    // Placeholder now; the real bytes land via upload_assets targeting this id.
    const r = figma.createRectangle();
    r.name = n.src;
    r.resize(Math.max(w, 0.01), Math.max(h, 0.01));
    r.x = x; r.y = y;
    r.fills = [{ type: 'SOLID', color: { r: 0.85, g: 0.85, b: 0.85 } }];
    const rr = radii(n.rad);
    if (rr.some(v => v > 0)) {
      r.topLeftRadius = rr[0]; r.topRightRadius = rr[1];
      r.bottomRightRadius = rr[2]; r.bottomLeftRadius = rr[3];
    }
    frame.appendChild(r);
    created.push(r.id);
    imageTargets.push({ id: r.id, src: n.src });
    continue;
  }

  if (n.t === 'text') {
    const t = figma.createText();
    t.fontName = resolve(n.font);
    t.characters = n.s;
    t.fontSize = n.fs;
    t.lineHeight = { unit: 'PIXELS', value: n.lh };
    if (n.ls) t.letterSpacing = { unit: 'PIXELS', value: n.ls };
    t.fills = solid(n.fill);
    // A run that held one line in the browser is measured at its own glyph
    // width, so pinning that width risks a stray wrap if Figma sets the text a
    // hair wider. Those hug. Runs that already wrapped get the column width,
    // where the width is exactly what reproduces the break points.
    if (n.wrap) {
      t.textAutoResize = 'HEIGHT';
      t.resize(Math.max(w, 1), t.height);
    } else {
      t.textAutoResize = 'WIDTH_AND_HEIGHT';
    }
    t.x = x; t.y = y;
    frame.appendChild(t);
    created.push(t.id);
  }
}

return {
  createdNodeIds: created,
  frameId: frame.id,
  frameName: frame.name,
  size: [SPEC.width, SPEC.height],
  fontMap,
  imageTargets,
  counts: {
    total: created.length,
    text: SPEC.nodes.filter(n => n.t === 'text').length,
    rect: SPEC.nodes.filter(n => n.t === 'rect').length,
    img: SPEC.nodes.filter(n => n.t === 'img').length,
  },
};
`.trim();
};

'emitFigmaBuilder ready';
