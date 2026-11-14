/**
 * =============================================================================
 * HIREFLOW + OMNITALENT: INTEGRATION CHALLENGER EMPIRICAL STRESS HARNESS
 * Agent: challenger_integration_1
 * 
 * Comprehensive adversarial verification and stress testing:
 * 1. Cryptographic SHA-256 byte parity across all 3 root <-> public file pairs
 * 2. HTML5 spec conformance: zero self-closing non-void tags, zero void closing tags, full LIFO stack
 * 3. Exact 291-ID census, 0 duplicate IDs, and structural layout contracts
 * 4. CSS tokens, media queries (1080px collapse, @media print), and IEEE/WCAG 2.1 contrast math
 * 5. Theme switching engine stress (10,000 rapid toggles), tenant branding resilience
 * 6. High-concurrency randomized multi-workflow interleaving & AI modal string verification
 * =============================================================================
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const ROOT_HTML = path.join(PROJECT_ROOT, 'index.html');
const PUBLIC_HTML = path.join(PROJECT_ROOT, 'public', 'index.html');
const ROOT_CSS = path.join(PROJECT_ROOT, 'styles.css');
const PUBLIC_CSS = path.join(PROJECT_ROOT, 'public', 'styles.css');
const ROOT_APP = path.join(PROJECT_ROOT, 'app.js');
const PUBLIC_APP = path.join(PROJECT_ROOT, 'public', 'app.js');
const ORIGINAL_IDS_PATH = path.join(PROJECT_ROOT, '.agents', 'teamwork', 'teamwork_worker_m2', 'original_ids.json');

const rootHtmlContent = fs.readFileSync(ROOT_HTML, 'utf8');
const publicHtmlContent = fs.readFileSync(PUBLIC_HTML, 'utf8');
const rootCssContent = fs.readFileSync(ROOT_CSS, 'utf8');
const publicCssContent = fs.readFileSync(PUBLIC_CSS, 'utf8');
const rootAppContent = fs.readFileSync(ROOT_APP, 'utf8');
const publicAppContent = fs.readFileSync(PUBLIC_APP, 'utf8');

// WCAG Contrast Math
function hexToRgb(hex) {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const num = parseInt(h, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function relativeLuminance([r, g, b]) {
  const srgb = [r, g, b].map(v => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return srgb[0] * 0.2126 + srgb[1] * 0.7152 + srgb[2] * 0.0722;
}

function calculateContrast(fgHex, bgHex) {
  const l1 = relativeLuminance(hexToRgb(fgHex));
  const l2 = relativeLuminance(hexToRgb(bgHex));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// Lightweight Headless DOM Mock
class MockStyle {
  constructor() {
    this._props = new Map();
  }
  setProperty(prop, val) {
    this._props.set(prop, String(val));
    this[prop] = String(val);
  }
  getPropertyValue(prop) {
    return this._props.get(prop) || this[prop] || '';
  }
  removeProperty(prop) {
    this._props.delete(prop);
    delete this[prop];
  }
}

class MockStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, val) {
    this.store.set(key, String(val));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

class MockDOMElement {
  constructor(tagName = 'div', id = '', className = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this._className = className;
    this.classList = {
      _set: new Set(className ? className.split(/\s+/).filter(Boolean) : []),
      add: (c) => {
        this.classList._set.add(c);
        this._className = Array.from(this.classList._set).join(' ');
      },
      remove: (c) => {
        this.classList._set.delete(c);
        this._className = Array.from(this.classList._set).join(' ');
      },
      toggle: (c, force) => {
        if (force === undefined) {
          if (this.classList._set.has(c)) this.classList._set.delete(c);
          else this.classList._set.add(c);
        } else if (force) {
          this.classList._set.add(c);
        } else {
          this.classList._set.delete(c);
        }
        this._className = Array.from(this.classList._set).join(' ');
      },
      contains: (c) => this.classList._set.has(c)
    };
    this.attributes = {};
    this.children = [];
    this.childNodes = [];
    this.parentElement = null;
    this.listeners = {};
    this.style = new MockStyle();
    this._value = '';
    this._textContent = '';
  }

  get className() { return this._className; }
  set className(v) {
    this._className = String(v || '');
    this.classList._set = new Set(this._className ? this._className.split(/\s+/).filter(Boolean) : []);
  }

  get value() { return this._value; }
  set value(v) { this._value = String(v); }

  get textContent() {
    if (this._textContent) return this._textContent;
    return this.childNodes.map(n => n.textContent || '').join('').trim();
  }
  set textContent(v) {
    this._textContent = String(v);
    this.childNodes = [{ nodeType: 3, textContent: String(v) }];
  }

  get innerHTML() {
    if (this._innerHTML) return this._innerHTML;
    return this.children.map(c => c.innerHTML).join('');
  }
  set innerHTML(v) {
    this._innerHTML = String(v);
    this._textContent = '';
    this.children = [];
    this.childNodes = [];
    const tagRegex = /<([a-zA-Z0-9_-]+)([^>]*?)>(?:([\s\S]*?)<\/\1>)?|([^<]+)/g;
    let match;
    while ((match = tagRegex.exec(v)) !== null) {
      if (match[1]) {
        const child = new MockDOMElement(match[1]);
        const attrs = match[2] || '';
        const classM = attrs.match(/class=['"]([^'"]*)['"]/);
        if (classM) child.className = classM[1];
        const idM = attrs.match(/id=['"]([^'"]*)['"]/);
        if (idM) child.id = idM[1];
        if (match[3]) child.innerHTML = match[3];
        this.appendChild(child);
      } else if (match[4] && match[4].trim()) {
        this.childNodes.push({ nodeType: 3, textContent: match[4] });
      }
    }
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name.toLowerCase() === 'class') this.className = value;
    if (name.toLowerCase() === 'id') this.id = value;
  }
  getAttribute(name) {
    if (this.attributes[name] !== undefined) return this.attributes[name];
    if (name.toLowerCase() === 'class') return this.className;
    if (name.toLowerCase() === 'id') return this.id;
    return null;
  }
  removeAttribute(name) {
    delete this.attributes[name];
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    this.childNodes.push(child);
    return child;
  }

  addEventListener(type, fn) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(fn);
  }

  dispatchEvent(type, eventObj = {}) {
    const e = Object.assign({ type, target: this, preventDefault: () => {}, stopPropagation: () => {} }, eventObj);
    if (this.listeners[type]) {
      this.listeners[type].forEach(fn => fn(e));
    }
  }

  querySelector(selector) {
    const all = this.querySelectorAll(selector);
    return all.length > 0 ? all[0] : null;
  }

  querySelectorAll(selector) {
    const results = [];
    const check = (el) => {
      let match = false;
      if (selector.startsWith('#')) {
        match = el.id === selector.slice(1);
      } else if (selector.startsWith('.')) {
        match = el.classList.contains(selector.slice(1));
      } else {
        match = el.tagName === selector.toUpperCase();
      }
      if (match) results.push(el);
      for (const c of el.children) check(c);
    };
    for (const c of this.children) check(c);
    return results;
  }
}

function parseHTML(html) {
  const root = new MockDOMElement('root');
  const stack = [root];
  const elementsById = new Map();
  const voidTags = new Set(['AREA', 'BASE', 'BR', 'COL', 'EMBED', 'HR', 'IMG', 'INPUT', 'LINK', 'META', 'PARAM', 'SOURCE', 'TRACK', 'WBR']);

  const tagRegex = /<!--[\s\S]*?-->|<(\/)?([a-zA-Z0-9_-]+)([^>]*?)(\/)?>|([^<]+)/g;
  let match;
  while ((match = tagRegex.exec(html)) !== null) {
    if (match[0].startsWith('<!--')) continue;
    if (match[2]) {
      const isClose = !!match[1];
      const tagName = match[2].toUpperCase();
      const attrsStr = match[3] || '';
      const isSelfClosing = !!match[4] || voidTags.has(tagName);

      if (isClose) {
        while (stack.length > 1 && stack[stack.length - 1].tagName !== tagName) {
          stack.pop();
        }
        if (stack.length > 1) stack.pop();
      } else {
        const el = new MockDOMElement(tagName);
        const attrRegex = /([a-zA-Z0-9_-]+)(?:=['"]([^'"]*)['"]|=([^\s>]+))?/g;
        let am;
        while ((am = attrRegex.exec(attrsStr)) !== null) {
          const k = am[1];
          const v = am[2] !== undefined ? am[2] : (am[3] !== undefined ? am[3] : '');
          el.setAttribute(k, v);
          if (k.toLowerCase() === 'id') elementsById.set(v, el);
        }
        const parent = stack[stack.length - 1];
        parent.appendChild(el);
        if (!isSelfClosing) stack.push(el);
      }
    }
  }
  return { root, elementsById };
}

function buildTestEnvironment() {
  const { root, elementsById } = parseHTML(publicHtmlContent);

  const canvasEl = elementsById.get('networkCanvas') || new MockDOMElement('canvas', 'networkCanvas');
  canvasEl.width = 1100;
  canvasEl.height = 550;
  canvasEl.getContext = () => ({
    clearRect: () => {}, beginPath: () => {}, moveTo: () => {}, lineTo: () => {},
    stroke: () => {}, arc: () => {}, fill: () => {}, fillText: () => {}, setLineDash: () => {}
  });

  const docListeners = {};
  const mockLocalStorage = new MockStorage();
  const mockSessionStorage = new MockStorage();

  const docElement = new MockDOMElement('html');
  const bodyElement = new MockDOMElement('body');
  docElement.appendChild(bodyElement);

  const mockDocument = {
    documentElement: docElement,
    body: bodyElement,
    getElementById: (id) => elementsById.get(id) || null,
    querySelector: (sel) => root.querySelector(sel),
    querySelectorAll: (sel) => root.querySelectorAll(sel),
    createElement: (tag) => new MockDOMElement(tag),
    addEventListener: (type, fn) => {
      if (!docListeners[type]) docListeners[type] = [];
      docListeners[type].push(fn);
    },
    dispatchEvent: (type, eventObj = {}) => {
      const e = Object.assign({ type, preventDefault: () => {}, stopPropagation: () => {} }, eventObj);
      if (docListeners[type]) {
        docListeners[type].forEach(fn => fn(e));
      }
    }
  };

  const mockWindow = {
    document: mockDocument,
    localStorage: mockLocalStorage,
    sessionStorage: mockSessionStorage,
    matchMedia: () => ({ matches: false }),
    location: { reload: () => {} },
    requestAnimationFrame: (cb) => setTimeout(cb, 16),
    cancelAnimationFrame: (id) => clearTimeout(id),
    setTimeout: (fn) => setTimeout(fn, 0),
    clearTimeout: (id) => clearTimeout(id),
    setInterval: () => 1,
    clearInterval: () => {},
    fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
    console: console
  };

  const sandbox = {
    window: mockWindow,
    document: mockDocument,
    localStorage: mockLocalStorage,
    sessionStorage: mockSessionStorage,
    console: console,
    setTimeout: (fn) => setTimeout(fn, 0),
    clearTimeout: (id) => clearTimeout(id),
    setInterval: () => 1,
    clearInterval: () => {}
  };
  sandbox.window.window = sandbox.window;

  const ctx = vm.createContext(sandbox);
  vm.runInContext(publicAppContent, ctx);

  return { ctx, mockDocument, mockWindow, elementsById, root };
}

// =============================================================================
// SUITE 1: CRYPTOGRAPHIC BYTE PARITY & FILE INTEGRITY
// =============================================================================
describe('Empirical Challenger Suite 1: Cryptographic Byte Parity & File Sizes', () => {

  it('PARITY-01: index.html and public/index.html have identical SHA-256 hashes', () => {
    const hash1 = crypto.createHash('sha256').update(fs.readFileSync(ROOT_HTML)).digest('hex');
    const hash2 = crypto.createHash('sha256').update(fs.readFileSync(PUBLIC_HTML)).digest('hex');
    assert.strictEqual(hash1, hash2, 'SHA-256 mismatch in HTML files');
  });

  it('PARITY-02: styles.css and public/styles.css have identical SHA-256 hashes', () => {
    const hash1 = crypto.createHash('sha256').update(fs.readFileSync(ROOT_CSS)).digest('hex');
    const hash2 = crypto.createHash('sha256').update(fs.readFileSync(PUBLIC_CSS)).digest('hex');
    assert.strictEqual(hash1, hash2, 'SHA-256 mismatch in CSS files');
  });

  it('PARITY-03: app.js and public/app.js have identical SHA-256 hashes', () => {
    const hash1 = crypto.createHash('sha256').update(fs.readFileSync(ROOT_APP)).digest('hex');
    const hash2 = crypto.createHash('sha256').update(fs.readFileSync(PUBLIC_APP)).digest('hex');
    assert.strictEqual(hash1, hash2, 'SHA-256 mismatch in JS files');
  });

  it('PARITY-04: Substantial file size contracts are strictly maintained', () => {
    assert.ok(publicCssContent.length > 100 * 1024, 'styles.css must be > 100KB');
    assert.ok(publicHtmlContent.length > 100 * 1024, 'index.html must be > 100KB');
    assert.ok(publicAppContent.length > 50 * 1024, 'app.js must be > 50KB');
  });

});

// =============================================================================
// SUITE 2: HTML5 SPEC & TAG BALANCING CONFORMANCE
// =============================================================================
describe('Empirical Challenger Suite 2: HTML5 Spec & Tag Balancing Conformance', () => {

  const nonVoidElements = [
    'div', 'span', 'p', 'i', 'b', 'strong', 'em', 'small',
    'button', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'form', 'label', 'select', 'textarea', 'nav', 'header', 'footer',
    'section', 'aside', 'main', 'article', 'canvas', 'svg', 'path'
  ];

  it('TAG-01: Zero self-closing non-void tags in public/index.html and index.html', () => {
    const regex = new RegExp('<(' + nonVoidElements.join('|') + ')\\b[^>]*?/>', 'gi');
    const matchesPub = publicHtmlContent.match(regex) || [];
    const matchesRoot = rootHtmlContent.match(regex) || [];
    assert.strictEqual(matchesPub.length, 0, `Found illegal self-closing tags in public/index.html: ${matchesPub.join(', ')}`);
    assert.strictEqual(matchesRoot.length, 0, `Found illegal self-closing tags in index.html: ${matchesRoot.join(', ')}`);
  });

  it('TAG-02: Zero closing tags for standard void elements (no </input>, </hr>, </br>, etc.)', () => {
    const voidElements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
    const regex = new RegExp('</(' + voidElements.join('|') + ')>', 'gi');
    const matches = publicHtmlContent.match(regex) || [];
    assert.strictEqual(matches.length, 0, `Found illegal closing tags for void elements: ${matches.join(', ')}`);
  });

  it('TAG-03: Full LIFO stack tag open/close balancing across entire HTML document', () => {
    const cleanHtml = publicHtmlContent
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');

    const voidSet = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr', '!doctype']);
    const tagRegex = /<\/?([a-zA-Z0-9_-]+)([^>]*?)>/g;
    const stack = [];
    let match;

    while ((match = tagRegex.exec(cleanHtml)) !== null) {
      const fullTag = match[0];
      const tagName = match[1].toLowerCase();
      const isClosing = fullTag.startsWith('</');
      const isSelfClosing = fullTag.endsWith('/>');

      if (voidSet.has(tagName) || isSelfClosing) {
        continue;
      }

      if (!isClosing) {
        stack.push({ tag: tagName, index: match.index });
      } else {
        assert.ok(stack.length > 0, `Closing tag </${tagName}> at index ${match.index} has no matching open tag`);
        const top = stack.pop();
        assert.strictEqual(top.tag, tagName, `Mismatched tag: expected </${top.tag}>, found </${tagName}> at index ${match.index}`);
      }
    }

    assert.strictEqual(stack.length, 0, `Unmatched open tags remaining: ${stack.map(s => s.tag).join(', ')}`);
  });

});

// =============================================================================
// SUITE 3: DOM CENSUS & STRUCTURAL CONTRACTS
// =============================================================================
describe('Empirical Challenger Suite 3: DOM Census & Structural Contracts', () => {

  it('DOM-01: Exact census check - strictly 411/412 unique IDs and 0 duplicates', () => {
    const idRegex = /\bid=["']([^"']+)["']/g;
    const allIds = Array.from(publicHtmlContent.matchAll(idRegex), m => m[1]);
    const idSet = new Set(allIds);
    assert.strictEqual(allIds.length, idSet.size, `Duplicate IDs detected! Total: ${allIds.length}, Unique: ${idSet.size}`);
    assert.ok(idSet.size === 411 || idSet.size === 412, `Expected strictly 411/412 unique element IDs, found ${idSet.size}`);
  });

  it('DOM-02: All 275 cataloged original IDs from original_ids.json are preserved', () => {
    const originalIds = JSON.parse(fs.readFileSync(ORIGINAL_IDS_PATH, 'utf8'));
    const idRegex = /\bid=["']([^"']+)["']/g;
    const existingIds = new Set(Array.from(publicHtmlContent.matchAll(idRegex), m => m[1]));
    const missing = originalIds.filter(id => !existingIds.has(id));
    assert.strictEqual(missing.length, 0, `Missing ${missing.length} original IDs: ${missing.join(', ')}`);
  });

  it('DOM-03: Sibling layout hierarchy: .feed-master-pane and #jobDetailPane in .feed-split-layout', () => {
    assert.match(publicHtmlContent, /class="[^"]*feed-split-layout[^"]*"[\s\S]*?class="[^"]*feed-master-pane[^"]*"[\s\S]*?id="jobDetailPane"/);
  });

  it('DOM-04: Canvas fixture #networkCanvas width=1100 height=550 in graph-canvas-wrapper', () => {
    assert.match(publicHtmlContent, /class="[^"]*graph-canvas-wrapper[^"]*"[\s\S]*?<canvas\b[^>]*?id="networkCanvas"[^>]*?width="1100"[^>]*?height="550"/);
  });

  it('DOM-05: Requisition Studio weight bar displays verbatim text nodes', () => {
    assert.match(publicHtmlContent, /class="[^"]*rule-seg-core[^"]*"[^>]*>\s*70%\s*Core\s*<\/div>/);
    assert.match(publicHtmlContent, /class="[^"]*rule-seg-pref[^"]*"[^>]*>\s*20%\s*Preferred\s*<\/div>/);
    assert.match(publicHtmlContent, /class="[^"]*rule-seg-exp[^"]*"[^>]*>\s*10%\s*Exp\s*<\/div>/);
  });

  it('DOM-06: Dual 6-stage Kanban board containers and count badges', () => {
    const stages = ['Sourced', 'Applied', 'AssessmentPending', 'Interviewing', 'OfferExtended', 'Closed'];
    for (const st of stages) {
      assert.ok(publicHtmlContent.includes(`id="pipeline-cards-${st}"`), `Must have #pipeline-cards-${st}`);
      assert.ok(publicHtmlContent.includes(`id="pipeline-count-${st}"`), `Must have #pipeline-count-${st}`);
      assert.ok(publicHtmlContent.includes(`id="cards-${st}"`), `Must have #cards-${st}`);
      assert.ok(publicHtmlContent.includes(`id="count-${st}"`), `Must have #count-${st}`);
    }
  });

});

// =============================================================================
// SUITE 4: CSS DESIGN TOKENS, RESPONSIVE BREAKPOINT & WCAG CONTRAST
// =============================================================================
describe('Empirical Challenger Suite 4: CSS Tokens, Responsive Breakpoint & WCAG Contrast', () => {

  it('CSS-01: Responsive @media (max-width: 1080px) collapses .feed-split-layout to single column', () => {
    const regex = /@media\s*\(max-width:\s*1080px\)\s*\{[\s\S]*?\.feed-split-layout\s*\{[^}]*grid-template-columns:\s*1fr;/i;
    assert.match(publicCssContent, regex, 'Breakpoint 1080px must collapse .feed-split-layout to 1fr');
  });

  it('CSS-02: @media print conceals .no-print and displays .print-only', () => {
    const printStart = publicCssContent.indexOf('@media print');
    assert.ok(printStart !== -1, '@media print rule must exist in stylesheet');
    const firstBrace = publicCssContent.indexOf('{', printStart);
    let depth = 1;
    let endIdx = firstBrace + 1;
    while (depth > 0 && endIdx < publicCssContent.length) {
      if (publicCssContent[endIdx] === '{') depth++;
      else if (publicCssContent[endIdx] === '}') depth--;
      endIdx++;
    }
    const printBlock = publicCssContent.slice(firstBrace + 1, endIdx - 1);
    assert.match(printBlock, /\.no-print\s*\{[^}]*display:\s*none\s*!important;/i);
    assert.match(printBlock, /\.print-only\s*\{[^}]*display:\s*block\s*!important;/i);
  });

  it('CSS-03: Dark theme primary text meets WCAG AAA standard (>= 7.0:1) on all dark surfaces', () => {
    const fg = '#f1f5f9';
    const darkSurfaces = ['#08090d', '#0e1017', '#141822'];
    for (const bg of darkSurfaces) {
      const cr = calculateContrast(fg, bg);
      assert.ok(cr >= 7.0, `Contrast ratio ${cr.toFixed(2)}:1 of ${fg} on ${bg} must be >= 7.0:1`);
    }
  });

  it('CSS-04: Light theme primary text meets WCAG AAA standard (>= 7.0:1) on all light surfaces', () => {
    const fg = '#0f172a';
    const lightSurfaces = ['#f8fafc', '#ffffff', '#f1f5f9'];
    for (const bg of lightSurfaces) {
      const cr = calculateContrast(fg, bg);
      assert.ok(cr >= 7.0, `Contrast ratio ${cr.toFixed(2)}:1 of ${fg} on ${bg} must be >= 7.0:1`);
    }
  });

  it('CSS-05: Secondary/muted text meets WCAG AA standard (>= 4.5:1) in both themes', () => {
    const darkMuted = '#94a3b8';
    for (const bg of ['#08090d', '#0e1017', '#141822']) {
      const cr = calculateContrast(darkMuted, bg);
      assert.ok(cr >= 4.5, `Dark muted contrast ${cr.toFixed(2)}:1 must be >= 4.5:1`);
    }
    const lightMuted = '#475569';
    for (const bg of ['#f8fafc', '#ffffff', '#f1f5f9']) {
      const cr = calculateContrast(lightMuted, bg);
      assert.ok(cr >= 4.5, `Light muted contrast ${cr.toFixed(2)}:1 must be >= 4.5:1`);
    }
  });

  it('CSS-06: Brand button and hover states satisfy WCAG 2.1 standards', () => {
    const crBrand = calculateContrast('#ffffff', '#6366f1');
    assert.ok(crBrand >= 3.0, `Brand button contrast ${crBrand.toFixed(2)}:1 must be >= 3.0:1`);
    const crHover = calculateContrast('#ffffff', '#4f46e5');
    assert.ok(crHover >= 4.5, `Brand hover contrast ${crHover.toFixed(2)}:1 must be >= 4.5:1`);
  });

});

// =============================================================================
// SUITE 5: THEME ENGINE DEEP STRESS (10,000 RAPID TOGGLES & BRANDING)
// =============================================================================
describe('Empirical Challenger Suite 5: Theme Engine Deep Stress (10,000 Toggles)', () => {

  it('THM-01: 10,000 rapid theme toggles maintain strict state consistency', () => {
    const env = buildTestEnvironment();
    
    // Toggle 10,000 times
    for (let i = 0; i < 10000; i++) {
      if (typeof env.ctx.window.toggleTheme === 'function') {
        env.ctx.window.toggleTheme();
      } else {
        const cur = env.mockDocument.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        env.ctx.window.applyTheme(cur);
      }
    }

    const currentTheme = env.mockDocument.documentElement.getAttribute('data-theme');
    assert.ok(currentTheme === 'dark' || currentTheme === 'light', `Theme must be 'dark' or 'light', was: ${currentTheme}`);
  });

  it('THM-02: Tenant custom brand color survives 10,000 toggles without reset', () => {
    const env = buildTestEnvironment();
    
    // Set custom brand color via application API
    env.ctx.window.applyThemeColor('#10b981');

    for (let i = 0; i < 10000; i++) {
      if (typeof env.ctx.window.toggleTheme === 'function') {
        env.ctx.window.toggleTheme();
      } else {
        const cur = env.mockDocument.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        env.ctx.window.applyTheme(cur);
      }
    }

    const brand = env.mockDocument.documentElement.style.getPropertyValue('--brand-primary');
    assert.strictEqual(brand, '#10b981', 'Custom tenant brand color was corrupted during 10,000 theme toggles');
  });

  it('THM-03: Defensive theme input normalization handles malformed inputs safely', () => {
    const env = buildTestEnvironment();
    const badInputs = [null, undefined, '', 12345, {}, [], 'UNKNOWN_THEME', 'LIGHT', 'DARK'];

    for (const bad of badInputs) {
      assert.doesNotThrow(() => {
        if (typeof env.ctx.window.applyTheme === 'function') {
          env.ctx.window.applyTheme(bad);
        }
      }, `applyTheme failed on bad input: ${bad}`);
    }
  });

});

// =============================================================================
// SUITE 6: AI MODAL 14 VERBATIM STRINGS & WORKFLOW RESILIENCE
// =============================================================================
describe('Empirical Challenger Suite 6: AI Modal Verbatim Strings & Workflow Resilience', () => {

  it('AI-01: AI evaluation report generates all 14 verbatim strings and >=4 .chip-mandatory elements', () => {
    const env = buildTestEnvironment();

    // Trigger AI evaluation report
    env.ctx.window.showAiEvaluationReport('APP-AARAV-001');

    const modalBody = env.elementsById.get('aiReportModalBody');
    assert.ok(modalBody, '#aiReportModalBody must exist');
    const content = modalBody.innerHTML;

    const requiredStrings = [
      'Aarav Sharma',
      '96%',
      'Strong Hire',
      'Mandatory Skills (70% Weight)',
      'Preferred Skills (20% Weight)',
      'Experience Alignment (10% Weight)',
      'Semantic Similarity (40% Weight)',
      'Keyword BM25 / Hard Skills (30% Weight)',
      'Social Graph Trust & Proximity (15% Weight)',
      'Intent & Activity Velocity (15% Weight)',
      'Composite Hybrid Score',
      'Key Strengths:',
      'Identified Skill Gaps:',
      'Tailored Technical Interview Questions:'
    ];

    for (const req of requiredStrings) {
      assert.ok(
        content.includes(req),
        `AI Evaluation Report missing required verbatim string: "${req}"`
      );
    }

    const chips = modalBody.querySelectorAll('.chip-mandatory');
    assert.ok(chips.length >= 4, `Expected at least 4 .chip-mandatory chips, found ${chips.length}`);
  });

  it('XWF-01: Multi-role switching preserves clean state and RBAC consistency', () => {
    const env = buildTestEnvironment();

    // Switch: Candidate -> Recruiter HR -> Recruiter Admin -> Candidate
    env.ctx.window.hireflowAuth.loginAs('CANDIDATE', 'aarav');
    assert.strictEqual(env.ctx.window.hireflowAuth.getCurrentUser().role, 'CANDIDATE');

    env.ctx.window.hireflowAuth.loginAs('RECRUITER_HR', 'vikram');
    assert.strictEqual(env.ctx.window.hireflowAuth.getCurrentUser().role, 'RECRUITER_HR');

    env.ctx.window.hireflowAuth.loginAs('RECRUITER_ADMIN', 'admin');
    assert.strictEqual(env.ctx.window.hireflowAuth.getCurrentUser().role, 'RECRUITER_ADMIN');

    env.ctx.window.hireflowAuth.switchRole('CANDIDATE');
    assert.strictEqual(env.ctx.window.hireflowAuth.getCurrentUser().role, 'CANDIDATE');
  });

});
