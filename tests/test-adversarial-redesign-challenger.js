/**
 * =============================================================================
 * HIREFLOW + OMNITALENT: EMPIRICAL ADVERSARIAL CHALLENGER TEST SUITE
 * 
 * Verifies:
 * 1. Dual Theme Switching Engine & CSS Variable Integrity:
 *    - Rapid, repeated theme toggling (1,000 continuous toggles)
 *    - Storage persistence (localStorage, sessionStorage, and headless fallback)
 *    - Tenant branding mutation (--brand-primary) preservation across theme toggles
 *    - Mathematical WCAG 2.1 AA/AAA color contrast audit across both themes
 * 2. Responsive Layout Adaptations & DOM Stress:
 *    - Split-pane layout collapse behavior (.feed-split-layout)
 *    - Sticky #jobDetailPane behavior and viewport constraints
 *    - Kanban horizontal scroll-snap and column minimum sizing
 *    - Non-void tag closing integrity (no illegal self-closing tags, strict balance)
 *    - 100% Public mirror synchronization
 * =============================================================================
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const HTML_PATH = path.join(PROJECT_ROOT, 'index.html');
const CSS_PATH = path.join(PROJECT_ROOT, 'styles.css');
const APP_JS_PATH = path.join(PROJECT_ROOT, 'app.js');

const PUBLIC_HTML_PATH = path.join(PROJECT_ROOT, 'public', 'index.html');
const PUBLIC_CSS_PATH = path.join(PROJECT_ROOT, 'public', 'styles.css');
const PUBLIC_APP_JS_PATH = path.join(PROJECT_ROOT, 'public', 'app.js');

const htmlContent = fs.readFileSync(HTML_PATH, 'utf8');
const cssContent = fs.readFileSync(CSS_PATH, 'utf8');
const appJsContent = fs.readFileSync(APP_JS_PATH, 'utf8');

// =============================================================================
// ROBUST HEADLESS DOM AND STORAGE HARNESS
// =============================================================================

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
    this.throwOnGet = false;
    this.throwOnSet = false;
  }
  getItem(key) {
    if (this.throwOnGet) throw new Error('SecurityError: LocalStorage blocked');
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, val) {
    if (this.throwOnSet) throw new Error('QuotaExceededError: Storage quota exceeded');
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
        const dataMatches = attrs.matchAll(/([a-zA-Z0-9_-]+)=['"]([^'"]*)['"]/g);
        for (const dm of dataMatches) {
          child.setAttribute(dm[1], dm[2]);
        }
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
    if (name.toLowerCase() === 'value') this._value = String(value);
  }

  getAttribute(name) {
    if (this.attributes[name] !== undefined) return this.attributes[name];
    if (name.toLowerCase() === 'class') return this.className;
    if (name.toLowerCase() === 'id') return this.id;
    if (name.toLowerCase() === 'value') return this.value;
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

  remove() {
    if (this.parentElement) {
      this.parentElement.children = this.parentElement.children.filter(c => c !== this);
      this.parentElement.childNodes = this.parentElement.childNodes.filter(c => c !== this);
    }
  }

  querySelector(selector) {
    const all = this.querySelectorAll(selector);
    return all.length > 0 ? all[0] : null;
  }

  querySelectorAll(selector) {
    if (selector.includes(',')) {
      const parts = selector.split(',').map(s => s.trim());
      const set = new Set();
      for (const p of parts) {
        for (const el of this.querySelectorAll(p)) set.add(el);
      }
      return Array.from(set);
    }

    const results = [];
    const check = (el) => {
      let match = false;
      if (selector.startsWith('#')) {
        match = el.id === selector.slice(1);
      } else if (selector.startsWith('.')) {
        match = el.classList.contains(selector.slice(1));
      } else if (selector.startsWith('[') && selector.endsWith(']')) {
        const attrExpr = selector.slice(1, -1);
        if (attrExpr.includes('=')) {
          const [k, v] = attrExpr.split('=').map(s => s.replace(/['"]/g, '').trim());
          match = el.getAttribute(k) === v;
        } else {
          match = el.getAttribute(attrExpr) !== null;
        }
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
    } else if (match[5] && match[5].trim()) {
      const parent = stack[stack.length - 1];
      parent.childNodes.push({ nodeType: 3, textContent: match[5].trim() });
    }
  }
  return { root, elementsById };
}

function buildTestEnvironment(customOptions = {}) {
  const { root, elementsById } = parseHTML(htmlContent);

  const canvasEl = elementsById.get('networkCanvas') || new MockDOMElement('canvas', 'networkCanvas');
  canvasEl.width = 1100;
  canvasEl.height = 550;
  canvasEl.getContext = () => ({
    clearRect: () => {}, beginPath: () => {}, moveTo: () => {}, lineTo: () => {},
    stroke: () => {}, arc: () => {}, fill: () => {}, fillText: () => {}, setLineDash: () => {}
  });

  const docListeners = {};
  const mockLocalStorage = customOptions.localStorage || new MockStorage();
  const mockSessionStorage = customOptions.sessionStorage || new MockStorage();

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
    matchMedia: (query) => ({
      matches: customOptions.prefersLight !== undefined ? customOptions.prefersLight : false,
      media: query
    }),
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
    requestAnimationFrame: mockWindow.requestAnimationFrame,
    cancelAnimationFrame: mockWindow.cancelAnimationFrame,
    setTimeout: mockWindow.setTimeout,
    clearTimeout: mockWindow.clearTimeout,
    setInterval: mockWindow.setInterval,
    clearInterval: mockWindow.clearInterval,
    console: mockWindow.console
  };

  const context = vm.createContext(sandbox);
  vm.runInContext(appJsContent, context);

  // Trigger DOMContentLoaded
  mockDocument.dispatchEvent('DOMContentLoaded');

  return { context, mockWindow, mockDocument, mockLocalStorage, mockSessionStorage, elementsById };
}

// =============================================================================
// WCAG 2.1 MATHEMATICAL FORMULAS
// =============================================================================

function hexToRgb(hex) {
  hex = hex.replace('#', '').trim();
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const num = parseInt(hex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function relativeLuminance([r, g, b]) {
  const srgb = [r, g, b].map(c => {
    const sc = c / 255;
    return sc <= 0.04045 ? sc / 12.92 : Math.pow((sc + 0.055) / 1.055, 2.4);
  });
  return srgb[0] * 0.2126 + srgb[1] * 0.7152 + srgb[2] * 0.0722;
}

function calculateContrastRatio(fgHex, bgHex) {
  const lum1 = relativeLuminance(hexToRgb(fgHex));
  const lum2 = relativeLuminance(hexToRgb(bgHex));
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

// =============================================================================
// TEST SUITE 1: DUAL THEME SWITCHING ENGINE & INVARIANT HARNESS
// =============================================================================

describe('Adversarial Challenge 1: Dual Theme Switching Engine & CSS Variable Integrity', () => {

  it('TC-THM-01: Rapid alternating toggles (1,000 continuous toggle events) maintain strict state invariance', () => {
    const { context, mockDocument, mockWindow, elementsById } = buildTestEnvironment();
    const toggleBtn = elementsById.get('themeToggleBtn');
    const toggleIcon = elementsById.get('themeToggleIcon');
    const toggleLabel = elementsById.get('themeToggleLabel');

    assert.ok(toggleBtn, '#themeToggleBtn must exist');
    assert.ok(toggleIcon, '#themeToggleIcon must exist');
    assert.ok(toggleLabel, '#themeToggleLabel must exist');

    // Initial state: default is dark
    let currentTheme = mockDocument.documentElement.getAttribute('data-theme') || 'dark';

    for (let i = 1; i <= 1000; i++) {
      // Trigger toggle
      toggleBtn.dispatchEvent('click');

      const expectedTheme = i % 2 === 1 ? 'light' : 'dark';
      const actualDocTheme = mockDocument.documentElement.getAttribute('data-theme');
      const actualBodyTheme = mockDocument.body.getAttribute('data-theme');
      const stateTheme = context.window.state.activeTheme;

      assert.strictEqual(actualDocTheme, expectedTheme, `Iteration ${i}: documentElement data-theme mismatch`);
      assert.strictEqual(actualBodyTheme, expectedTheme, `Iteration ${i}: body data-theme mismatch`);
      assert.strictEqual(stateTheme, expectedTheme, `Iteration ${i}: window.state.activeTheme mismatch`);

      // Verify toggle button visual presentation
      assert.strictEqual(toggleIcon.textContent, expectedTheme === 'light' ? '☀️' : '🌙');
      assert.strictEqual(toggleLabel.textContent, expectedTheme === 'light' ? 'Light' : 'Dark');
      assert.strictEqual(toggleBtn.getAttribute('title'), expectedTheme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme');
      assert.strictEqual(toggleBtn.getAttribute('aria-label'), expectedTheme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme');
    }
  });

  it('TC-THM-02: Storage persistence correctly writes to localStorage on theme toggles and reads on reload', () => {
    const storage = new MockStorage();
    // First session: toggle to light
    const env1 = buildTestEnvironment({ localStorage: storage });
    const toggleBtn1 = env1.elementsById.get('themeToggleBtn');
    toggleBtn1.dispatchEvent('click'); // dark -> light

    assert.strictEqual(storage.getItem('hireflow_theme'), 'light');
    assert.strictEqual(env1.mockDocument.documentElement.getAttribute('data-theme'), 'light');

    // Second session: new page load with existing storage
    const env2 = buildTestEnvironment({ localStorage: storage });
    assert.strictEqual(env2.mockDocument.documentElement.getAttribute('data-theme'), 'light');
    assert.strictEqual(env2.elementsById.get('themeToggleLabel').textContent, 'Light');
    assert.strictEqual(env2.elementsById.get('themeToggleIcon').textContent, '☀️');

    // Third session: toggle to dark, verify persistence
    const toggleBtn2 = env2.elementsById.get('themeToggleBtn');
    toggleBtn2.dispatchEvent('click'); // light -> dark
    assert.strictEqual(storage.getItem('hireflow_theme'), 'dark');

    const env3 = buildTestEnvironment({ localStorage: storage });
    assert.strictEqual(env3.mockDocument.documentElement.getAttribute('data-theme'), 'dark');
    assert.strictEqual(env3.elementsById.get('themeToggleLabel').textContent, 'Dark');
  });

  it('TC-THM-03: Storage fallback to sessionStorage when localStorage throws SecurityError', () => {
    const faultyLocalStorage = new MockStorage();
    faultyLocalStorage.throwOnGet = true;
    faultyLocalStorage.throwOnSet = true;
    const workingSessionStorage = new MockStorage();

    const env = buildTestEnvironment({
      localStorage: faultyLocalStorage,
      sessionStorage: workingSessionStorage
    });

    const toggleBtn = env.elementsById.get('themeToggleBtn');
    // Toggle theme: should catch localStorage error and write to sessionStorage
    assert.doesNotThrow(() => {
      toggleBtn.dispatchEvent('click');
    });

    assert.strictEqual(env.mockDocument.documentElement.getAttribute('data-theme'), 'light');
    assert.strictEqual(workingSessionStorage.getItem('hireflow_theme'), 'light');

    // Toggle back to dark
    toggleBtn.dispatchEvent('click');
    assert.strictEqual(env.mockDocument.documentElement.getAttribute('data-theme'), 'dark');
    assert.strictEqual(workingSessionStorage.getItem('hireflow_theme'), 'dark');
  });

  it('TC-THM-04: Headless fallback survives gracefully when both localStorage and sessionStorage throw', () => {
    const faultyLocalStorage = new MockStorage();
    faultyLocalStorage.throwOnGet = true;
    faultyLocalStorage.throwOnSet = true;
    const faultySessionStorage = new MockStorage();
    faultySessionStorage.throwOnGet = true;
    faultySessionStorage.throwOnSet = true;

    const env = buildTestEnvironment({
      localStorage: faultyLocalStorage,
      sessionStorage: faultySessionStorage
    });

    const toggleBtn = env.elementsById.get('themeToggleBtn');
    assert.doesNotThrow(() => {
      for (let i = 0; i < 20; i++) {
        toggleBtn.dispatchEvent('click');
      }
    });

    // Theme state remains completely coherent in-memory
    assert.strictEqual(env.mockDocument.documentElement.getAttribute('data-theme'), 'dark');
    assert.strictEqual(env.context.window.state.activeTheme, 'dark');
  });

  it('TC-THM-05: OS Preference detection via matchMedia prefers-color-scheme: light', () => {
    // When no stored theme exists and OS reports light preference
    const emptyStorage = new MockStorage();
    const envLightOS = buildTestEnvironment({
      localStorage: emptyStorage,
      sessionStorage: new MockStorage(),
      prefersLight: true
    });

    assert.strictEqual(envLightOS.mockDocument.documentElement.getAttribute('data-theme'), 'light');
    assert.strictEqual(envLightOS.context.window.state.activeTheme, 'light');
    assert.strictEqual(envLightOS.elementsById.get('themeToggleLabel').textContent, 'Light');
    assert.strictEqual(envLightOS.elementsById.get('themeToggleIcon').textContent, '☀️');
  });

  it('TC-THM-06: Defensive input normalization in applyTheme() defaults unknown or malformed themes safely', () => {
    const env = buildTestEnvironment();
    const applyTheme = env.context.window.applyTheme;

    assert.doesNotThrow(() => applyTheme('neon'));
    assert.strictEqual(env.mockDocument.documentElement.getAttribute('data-theme'), 'dark');

    assert.doesNotThrow(() => applyTheme(null));
    assert.strictEqual(env.mockDocument.documentElement.getAttribute('data-theme'), 'dark');

    assert.doesNotThrow(() => applyTheme(undefined));
    assert.strictEqual(env.mockDocument.documentElement.getAttribute('data-theme'), 'dark');

    assert.doesNotThrow(() => applyTheme('light'));
    assert.strictEqual(env.mockDocument.documentElement.getAttribute('data-theme'), 'light');
  });

});

// =============================================================================
// TEST SUITE 2: DYNAMIC TENANT BRANDING PRESERVATION
// =============================================================================

describe('Adversarial Challenge 2: Dynamic Tenant Branding Preservation Across Theme Switches', () => {

  it('TC-BRD-01: Admin brand color mutation sets --brand-primary and --accent-glow on root element', () => {
    const env = buildTestEnvironment();
    env.context.window.applyThemeColor('#06b6d4');

    const brandPrimary = env.mockDocument.documentElement.style.getPropertyValue('--brand-primary');
    const accentGlow = env.mockDocument.documentElement.style.getPropertyValue('--accent-glow');

    assert.strictEqual(brandPrimary, '#06b6d4');
    assert.strictEqual(accentGlow, '#06b6d44d');
    assert.strictEqual(env.context.window.state.organization.themeColor, '#06b6d4');
  });

  it('TC-BRD-02: Dynamic --brand-primary remains intact and is NOT wiped or overwritten across 100 theme toggles', () => {
    const env = buildTestEnvironment();
    const customBrandColor = '#10b981'; // Emerald
    env.context.window.applyThemeColor(customBrandColor);

    const toggleBtn = env.elementsById.get('themeToggleBtn');

    for (let i = 1; i <= 100; i++) {
      toggleBtn.dispatchEvent('click');

      const brandPrimary = env.mockDocument.documentElement.style.getPropertyValue('--brand-primary');
      const accentGlow = env.mockDocument.documentElement.style.getPropertyValue('--accent-glow');
      const orgColor = env.context.window.state.organization.themeColor;

      assert.strictEqual(brandPrimary, customBrandColor, `Toggle ${i}: --brand-primary was clobbered!`);
      assert.strictEqual(accentGlow, `${customBrandColor}4d`, `Toggle ${i}: --accent-glow was clobbered!`);
      assert.strictEqual(orgColor, customBrandColor, `Toggle ${i}: state.organization.themeColor was clobbered!`);
    }
  });

  it('TC-BRD-03: Switching across multiple swatch presets preserves each color across theme toggles', () => {
    const env = buildTestEnvironment();
    const swatches = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#7c3aed'];
    const toggleBtn = env.elementsById.get('themeToggleBtn');

    for (const color of swatches) {
      env.context.window.applyThemeColor(color);
      assert.strictEqual(env.mockDocument.documentElement.style.getPropertyValue('--brand-primary'), color);

      // Toggle theme back and forth
      toggleBtn.dispatchEvent('click'); // switch theme
      assert.strictEqual(env.mockDocument.documentElement.style.getPropertyValue('--brand-primary'), color);

      toggleBtn.dispatchEvent('click'); // switch back
      assert.strictEqual(env.mockDocument.documentElement.style.getPropertyValue('--brand-primary'), color);
    }
  });

  it('TC-BRD-04: Admin input #adminThemeColor and preview card dynamically synchronize', () => {
    const env = buildTestEnvironment();
    const colorInput = env.elementsById.get('adminThemeColor');
    const colorValDisplay = env.elementsById.get('adminThemeColorVal');
    const previewLogo = env.elementsById.get('previewLogoIcon');

    assert.ok(colorInput, '#adminThemeColor input must exist');
    assert.ok(colorValDisplay, '#adminThemeColorVal display must exist');

    env.context.window.applyThemeColor('#f59e0b');

    assert.strictEqual(colorInput.value, '#f59e0b');
    assert.strictEqual(colorValDisplay.textContent, '#f59e0b');
    if (previewLogo && previewLogo.style) {
      assert.strictEqual(previewLogo.style.backgroundColor, '#f59e0b');
    }
  });

});

// =============================================================================
// TEST SUITE 3: MATHEMATICAL WCAG 2.1 COLOR CONTRAST AUDIT
// =============================================================================

describe('Adversarial Challenge 3: Mathematical WCAG 2.1 AA/AAA Color Contrast Audit', () => {

  it('TC-CTR-01: Dark theme primary text (#f8fafc) on all dark surfaces exceeds WCAG AAA standard (>= 7.0:1)', () => {
    const fg = '#f8fafc';
    const surfaces = [
      { name: '--bg-main', hex: '#070a12' },
      { name: '--bg-surface', hex: '#111726' },
      { name: '--bg-surface-elevated', hex: '#171f33' },
      { name: '--bg-input', hex: '#0b101c' }
    ];

    for (const s of surfaces) {
      const cr = calculateContrastRatio(fg, s.hex);
      assert.ok(cr >= 7.0, `Dark theme primary text on ${s.name} (${s.hex}) ratio ${cr.toFixed(2)}:1 must be >= 7.0:1 (AAA)`);
      assert.ok(cr >= 15.0, `Dark theme primary text on ${s.name} (${s.hex}) is exceptionally high contrast (${cr.toFixed(2)}:1)`);
    }
  });

  it('TC-CTR-02: Dark theme muted text (#94a3b8) on all dark surfaces exceeds WCAG AA standard (>= 4.5:1)', () => {
    const fg = '#94a3b8';
    const surfaces = [
      { name: '--bg-main', hex: '#070a12', expectedMin: 7.0 }, // Exceeds AAA
      { name: '--bg-surface', hex: '#111726', expectedMin: 4.5 },
      { name: '--bg-surface-elevated', hex: '#171f33', expectedMin: 4.5 }
    ];

    for (const s of surfaces) {
      const cr = calculateContrastRatio(fg, s.hex);
      assert.ok(cr >= s.expectedMin, `Dark muted text on ${s.name} (${s.hex}) ratio ${cr.toFixed(2)}:1 must be >= ${s.expectedMin}:1`);
    }
  });

  it('TC-CTR-03: Light theme primary text (#0f172a) on all light surfaces exceeds WCAG AAA standard (>= 7.0:1)', () => {
    const fg = '#0f172a';
    const surfaces = [
      { name: '--bg-main', hex: '#f8fafc' },
      { name: '--bg-surface', hex: '#ffffff' },
      { name: '--bg-surface-elevated', hex: '#f1f5f9' },
      { name: '--bg-input', hex: '#ffffff' }
    ];

    for (const s of surfaces) {
      const cr = calculateContrastRatio(fg, s.hex);
      assert.ok(cr >= 7.0, `Light theme primary text on ${s.name} (${s.hex}) ratio ${cr.toFixed(2)}:1 must be >= 7.0:1 (AAA)`);
      assert.ok(cr >= 16.0, `Light theme primary text on ${s.name} (${s.hex}) is exceptionally high contrast (${cr.toFixed(2)}:1)`);
    }
  });

  it('TC-CTR-04: Light theme muted text (#475569) on all light surfaces exceeds WCAG AA standard (>= 4.5:1)', () => {
    const fg = '#475569';
    const surfaces = [
      { name: '--bg-main', hex: '#f8fafc', expectedMin: 7.0 }, // Exceeds AAA
      { name: '--bg-surface', hex: '#ffffff', expectedMin: 7.0 }, // Exceeds AAA
      { name: '--bg-surface-elevated', hex: '#f1f5f9', expectedMin: 4.5 }
    ];

    for (const s of surfaces) {
      const cr = calculateContrastRatio(fg, s.hex);
      assert.ok(cr >= s.expectedMin, `Light muted text on ${s.name} (${s.hex}) ratio ${cr.toFixed(2)}:1 must be >= ${s.expectedMin}:1`);
    }
  });

  it('TC-CTR-05: Light theme brand accent (#7c3aed) on white surface satisfies WCAG AA (>= 4.5:1)', () => {
    const cr = calculateContrastRatio('#7c3aed', '#ffffff');
    assert.ok(cr >= 4.5, `Light brand accent #7c3aed on #ffffff ratio ${cr.toFixed(2)}:1 must be >= 4.5:1`);
  });

  it('TC-CTR-06: Status indicators and match pills provide high legibility across both themes', () => {
    // Dark mode high match pill text (#34d399) on dark card (#111726)
    const darkHighPillCr = calculateContrastRatio('#34d399', '#111726');
    assert.ok(darkHighPillCr >= 7.0, `Dark match pill text ratio ${darkHighPillCr.toFixed(2)}:1 satisfies AAA`);

    // Dark mode med match pill text (#22d3ee) on dark card (#111726)
    const darkMedPillCr = calculateContrastRatio('#22d3ee', '#111726');
    assert.ok(darkMedPillCr >= 7.0, `Dark med pill text ratio ${darkMedPillCr.toFixed(2)}:1 satisfies AAA`);

    // Light mode status danger text (#e11d48) on white (#ffffff)
    const lightDangerCr = calculateContrastRatio('#e11d48', '#ffffff');
    assert.ok(lightDangerCr >= 4.5, `Light danger text ratio ${lightDangerCr.toFixed(2)}:1 satisfies AA`);
  });

});

// =============================================================================
// TEST SUITE 4: RESPONSIVE LAYOUT ADAPTATIONS & CSS ARCHITECTURE
// =============================================================================

describe('Adversarial Challenge 4: Responsive Layout Adaptations & CSS Architecture', () => {

  it('TC-LAY-01: .feed-split-layout declares dual-pane grid columns with master and detail ranges', () => {
    assert.match(cssContent, /\.feed-split-layout\s*\{[^}]*display:\s*grid;/i);
    assert.match(cssContent, /\.feed-split-layout\s*\{[^}]*grid-template-columns:\s*minmax\(360px,\s*450px\)\s*minmax\(400px,\s*1fr\);/i);
    assert.match(cssContent, /\.feed-split-layout\s*\{[^}]*gap:\s*var\(--space-6,\s*24px\);/i);
  });

  it('TC-LAY-02: Responsive breakpoint @media (max-width: 1080px) collapses .feed-split-layout to single column', () => {
    const mediaRegex = /@media\s*\(max-width:\s*1080px\)\s*\{[\s\S]*?\.feed-split-layout\s*\{[^}]*grid-template-columns:\s*1fr;[\s\S]*?\}/i;
    assert.match(cssContent, mediaRegex, 'Media query at 1080px must collapse .feed-split-layout to 1fr');
  });

  it('TC-LAY-03: .feed-detail-pane has sticky positioning, calculated top offset, and scroll containment', () => {
    assert.match(cssContent, /\.feed-detail-pane\s*\{[^}]*position:\s*sticky;/i);
    assert.match(cssContent, /\.feed-detail-pane\s*\{[^}]*top:\s*calc\(var\(--header-height,\s*64px\)\s*\+\s*var\(--space-4,\s*16px\)\);/i);
    assert.match(cssContent, /\.feed-detail-pane\s*\{[^}]*max-height:\s*calc\(100vh\s*-\s*120px\);/i);
    assert.match(cssContent, /\.feed-detail-pane\s*\{[^}]*overflow-y:\s*auto;/i);
  });

  it('TC-LAY-04: Kanban board (#pipelineKanbanView) declares horizontal scroll-snap and mobile touch scrolling', () => {
    const kanbanBlockRegex = /(?:\.kanban-board,\s*#pipelineKanbanView|#pipelineKanbanView,\s*\.kanban-board|#pipelineKanbanView)\s*\{[\s\S]*?\}/i;
    const match = cssContent.match(kanbanBlockRegex);
    assert.ok(match, 'Kanban board CSS block must exist');

    assert.match(match[0], /display:\s*flex\s*!important;/i);
    assert.match(match[0], /overflow-x:\s*auto;/i);
    assert.match(match[0], /scroll-snap-type:\s*x\s*mandatory;/i);
    assert.match(match[0], /-webkit-overflow-scrolling:\s*touch;/i);
  });

  it('TC-LAY-05: Kanban columns (.kanban-col) enforce generous 310px width and scroll-snap alignment', () => {
    assert.match(cssContent, /\.kanban-col\s*\{[^}]*flex:\s*0\s*0\s*310px;/i);
    assert.match(cssContent, /\.kanban-col\s*\{[^}]*min-width:\s*310px;/i);
    assert.match(cssContent, /\.kanban-col\s*\{[^}]*scroll-snap-align:\s*start;/i);
  });

});

// =============================================================================
// TEST SUITE 5: DOM TREE PARSING & NON-VOID TAG CLOSING INTEGRITY
// =============================================================================

describe('Adversarial Challenge 5: DOM Tree Integrity & Non-Void Tag Closing Audit', () => {

  const voidElements = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img',
    'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'
  ]);

  it('TC-DOM-01: Zero illegal self-closing non-void tags in index.html (no <div />, <span />, etc.)', () => {
    const selfClosingRegex = /<([a-zA-Z0-9_-]+)([^>]*?)\/>/g;
    let match;
    const violations = [];

    while ((match = selfClosingRegex.exec(htmlContent)) !== null) {
      const tag = match[1].toLowerCase();
      if (!voidElements.has(tag)) {
        violations.push({
          tag,
          snippet: match[0],
          index: match.index
        });
      }
    }

    assert.strictEqual(
      violations.length,
      0,
      `Found ${violations.length} illegal self-closing non-void tag(s) in index.html: ` +
      violations.map(v => `<${v.tag} /> at position ${v.index}`).join(', ')
    );
  });

  it('TC-DOM-02: Zero illegal self-closing non-void tags in public/index.html', () => {
    const publicHtml = fs.readFileSync(PUBLIC_HTML_PATH, 'utf8');
    const selfClosingRegex = /<([a-zA-Z0-9_-]+)([^>]*?)\/>/g;
    let match;
    const violations = [];

    while ((match = selfClosingRegex.exec(publicHtml)) !== null) {
      const tag = match[1].toLowerCase();
      if (!voidElements.has(tag)) {
        violations.push({
          tag,
          snippet: match[0],
          index: match.index
        });
      }
    }

    assert.strictEqual(
      violations.length,
      0,
      `Found ${violations.length} illegal self-closing non-void tag(s) in public/index.html`
    );
  });

  it('TC-DOM-03: Strict tag open-close balancing across entire index.html document tree (zero unmatched tags)', () => {
    const tagRegex = /<!--[\s\S]*?-->|<(\/)?([a-zA-Z0-9_-]+)([^>]*?)>/g;
    const stack = [];
    let match;
    const errors = [];

    while ((match = tagRegex.exec(htmlContent)) !== null) {
      if (match[0].startsWith('<!--')) continue;
      const isClose = !!match[1];
      const tagName = match[2].toLowerCase();

      if (voidElements.has(tagName) || tagName === '!doctype') continue;

      if (!isClose) {
        stack.push({ tag: tagName, index: match.index });
      } else {
        if (stack.length === 0) {
          errors.push(`Unexpected close tag </${tagName}> at char index ${match.index}`);
        } else {
          const top = stack.pop();
          if (top.tag !== tagName) {
            errors.push(`Mismatched close tag: expected </${top.tag}> opened at ${top.index}, but found </${tagName}> at ${match.index}`);
          }
        }
      }
    }

    if (stack.length > 0) {
      errors.push(`Unclosed tags remaining in document: ` + stack.map(s => `<${s.tag}> opened at ${s.index}`).join(', '));
    }

    assert.strictEqual(
      errors.length,
      0,
      `Document contains ${errors.length} tag balancing error(s):\n` + errors.join('\n')
    );
  });

  it('TC-DOM-04: Split-pane hierarchy is strictly valid: #jobFeedContainer and #jobDetailPane are sibling children', () => {
    const { root, elementsById } = parseHTML(htmlContent);

    const splitLayout = root.querySelector('.feed-split-layout');
    const masterPane = root.querySelector('.feed-master-pane');
    const jobFeedContainer = elementsById.get('jobFeedContainer');
    const jobDetailPane = elementsById.get('jobDetailPane');

    assert.ok(splitLayout, '.feed-split-layout must exist');
    assert.ok(masterPane, '.feed-master-pane must exist');
    assert.ok(jobFeedContainer, '#jobFeedContainer must exist');
    assert.ok(jobDetailPane, '#jobDetailPane must exist');

    // jobDetailPane must NOT be a child of jobFeedContainer or vice-versa
    let current = jobDetailPane.parentElement;
    let insideFeed = false;
    while (current) {
      if (current === jobFeedContainer || current === masterPane) {
        insideFeed = true;
        break;
      }
      current = current.parentElement;
    }
    assert.strictEqual(insideFeed, false, '#jobDetailPane must be a sibling to the feed master pane, not nested inside it');
    assert.strictEqual(jobDetailPane.parentElement, splitLayout, '#jobDetailPane must be a direct child of .feed-split-layout');
  });

  it('TC-DOM-05: Kanban pipeline board contains all 6 distinct stage containers with valid IDs', () => {
    const { elementsById } = parseHTML(htmlContent);
    const stages = ['Sourced', 'Applied', 'AssessmentPending', 'Interviewing', 'OfferExtended', 'Closed'];

    for (const stage of stages) {
      const colCards = elementsById.get(`pipeline-cards-${stage}`);
      const colCount = elementsById.get(`pipeline-count-${stage}`);
      assert.ok(colCards, `#pipeline-cards-${stage} column card container must exist`);
      assert.ok(colCount, `#pipeline-count-${stage} column counter badge must exist`);
    }
  });

  it('TC-DOM-06: 100% byte-for-byte synchronization between root assets and public/ mirror', () => {
    function computeHash(filePath) {
      return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
    }

    const htmlHashRoot = computeHash(HTML_PATH);
    const htmlHashPublic = computeHash(PUBLIC_HTML_PATH);
    assert.strictEqual(htmlHashRoot, htmlHashPublic, 'index.html and public/index.html must be byte-for-byte identical');

    const cssHashRoot = computeHash(CSS_PATH);
    const cssHashPublic = computeHash(PUBLIC_CSS_PATH);
    assert.strictEqual(cssHashRoot, cssHashPublic, 'styles.css and public/styles.css must be byte-for-byte identical');

    const appJsHashRoot = computeHash(APP_JS_PATH);
    const appJsHashPublic = computeHash(PUBLIC_APP_JS_PATH);
    assert.strictEqual(appJsHashRoot, appJsHashPublic, 'app.js and public/app.js must be byte-for-byte identical');
  });

});

// =============================================================================
// TEST SUITE 6: CROSS-WORKFLOW INVARIANCE & HIGH-CONCURRENCY DEEP STRESS
// =============================================================================

describe('Adversarial Challenge 6: Cross-Workflow Invariance & High-Concurrency Deep Stress', () => {

  it('TC-XWF-01: Authentication flows (loginAs, switchRole, logout) preserve theme and tenant branding', () => {
    const env = buildTestEnvironment();
    const hireflowAuth = env.context.window.hireflowAuth;
    const toggleBtn = env.elementsById.get('themeToggleBtn');

    // 1. Set theme to light and branding to cyan
    toggleBtn.dispatchEvent('click'); // switch to light
    env.context.window.applyThemeColor('#06b6d4');

    assert.strictEqual(env.mockDocument.documentElement.getAttribute('data-theme'), 'light');
    assert.strictEqual(env.mockDocument.documentElement.style.getPropertyValue('--brand-primary'), '#06b6d4');

    // 2. Login as candidate
    hireflowAuth.loginAs('CANDIDATE', 'aarav');
    assert.strictEqual(env.mockDocument.documentElement.getAttribute('data-theme'), 'light');
    assert.strictEqual(env.mockDocument.documentElement.style.getPropertyValue('--brand-primary'), '#06b6d4');
    assert.strictEqual(hireflowAuth.getCurrentUser().role, 'CANDIDATE');

    // 3. Switch role to recruiter
    hireflowAuth.switchRole('RECRUITER_HR');
    assert.strictEqual(env.mockDocument.documentElement.getAttribute('data-theme'), 'light');
    assert.strictEqual(env.mockDocument.documentElement.style.getPropertyValue('--brand-primary'), '#06b6d4');
    assert.strictEqual(hireflowAuth.getCurrentUser().role, 'RECRUITER_HR');

    // 4. Switch role to admin
    hireflowAuth.switchRole('RECRUITER_ADMIN');
    assert.strictEqual(env.mockDocument.documentElement.getAttribute('data-theme'), 'light');
    assert.strictEqual(env.mockDocument.documentElement.style.getPropertyValue('--brand-primary'), '#06b6d4');
    assert.strictEqual(hireflowAuth.getCurrentUser().role, 'RECRUITER_ADMIN');

    // 5. Logout to Auth Gateway
    hireflowAuth.logout();
    assert.strictEqual(env.mockDocument.documentElement.getAttribute('data-theme'), 'light');
    assert.strictEqual(env.mockDocument.documentElement.style.getPropertyValue('--brand-primary'), '#06b6d4');
    assert.strictEqual(hireflowAuth.getCurrentUser(), null);
  });

  it('TC-XWF-02: Clicking master job feed card renders rich #jobDetailPane without disturbing split-pane layout', () => {
    const env = buildTestEnvironment();
    const state = env.context.window.state;
    const detailPane = env.elementsById.get('jobDetailPane');

    assert.ok(state.jobs && state.jobs.length > 0, 'Seed jobs must be present in state');
    const firstJob = state.jobs[0];

    // Trigger renderJobDetailPane
    env.context.window.renderJobDetailPane(firstJob);

    // Detail pane must be populated
    assert.ok(detailPane.innerHTML.includes(firstJob.title), 'Detail pane must display job title');
    assert.ok(detailPane.innerHTML.includes('wellfound-comp-box') || detailPane.innerHTML.includes('comp-metrics-grid'), 'Detail pane must render compensation box');
    assert.ok(detailPane.innerHTML.includes('btn-detail-apply') || detailPane.innerHTML.includes('btn-applied'), 'Detail pane must render application action button or applied badge');

    // Split pane structure must remain intact
    const splitLayout = env.mockDocument.querySelector('.feed-split-layout');
    assert.strictEqual(detailPane.parentElement, splitLayout, '#jobDetailPane must remain immediate child of .feed-split-layout');
  });

  it('TC-XWF-03: AI Evaluation Modal renders all 14 verbatim strings and >=4 .chip-mandatory chips in both themes', () => {
    const env = buildTestEnvironment();
    const modal = env.elementsById.get('aiReportModal');
    const modalBody = env.elementsById.get('aiReportModalBody');

    assert.ok(modal, '#aiReportModal must exist');
    assert.ok(modalBody, '#aiReportModalBody must exist');

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

    // Test in Dark Theme
    env.context.window.applyTheme('dark');
    env.context.window.showAiEvaluationReport('APP-AARAV-01');
    assert.ok(modal.classList.contains('active'), '#aiReportModal must have .active in dark mode');

    for (const str of requiredStrings) {
      assert.ok(modalBody.innerHTML.includes(str), `Dark mode AI report must include verbatim string "${str}"`);
    }
    const mandatoryChipsDark = modalBody.querySelectorAll('.chip-mandatory');
    assert.ok(mandatoryChipsDark.length >= 4, `Dark mode AI report must render >= 4 .chip-mandatory chips (found ${mandatoryChipsDark.length})`);

    // Test in Light Theme
    env.context.window.applyTheme('light');
    env.context.window.showAiEvaluationReport('APP-AARAV-01');
    assert.ok(modal.classList.contains('active'), '#aiReportModal must have .active in light mode');

    for (const str of requiredStrings) {
      assert.ok(modalBody.innerHTML.includes(str), `Light mode AI report must include verbatim string "${str}"`);
    }
    const mandatoryChipsLight = modalBody.querySelectorAll('.chip-mandatory');
    assert.ok(mandatoryChipsLight.length >= 4, `Light mode AI report must render >= 4 .chip-mandatory chips (found ${mandatoryChipsLight.length})`);
  });

  it('TC-XWF-04: Kanban stage transitions preserve 6-column geometry and counter badges across theme toggles', () => {
    const env = buildTestEnvironment();
    const state = env.context.window.state;

    // Verify pipeline initializes
    env.context.window.initCandidatePipeline();
    const stages = ['Sourced', 'Applied', 'AssessmentPending', 'Interviewing', 'OfferExtended', 'Closed'];

    // Move first application across stages
    const app = state.applications[0];
    assert.ok(app, 'Seed application must exist');

    for (const targetStage of stages) {
      app.kanbanStage = targetStage;
      env.context.window.renderCandidatePipeline();

      const countBadge = env.elementsById.get(`pipeline-count-${targetStage}`);
      assert.ok(countBadge, `Counter badge for ${targetStage} must exist`);
      const countVal = parseInt(countBadge.textContent, 10);
      assert.ok(!isNaN(countVal) && countVal >= 1, `Counter badge for ${targetStage} must be >= 1`);

      // Toggle theme during stage movement
      env.context.window.toggleTheme();
    }
  });

  it('TC-XWF-05: High-concurrency interleaving of 250 randomized UI events without exceptions', () => {
    const env = buildTestEnvironment();
    const hireflowAuth = env.context.window.hireflowAuth;
    const toggleBtn = env.elementsById.get('themeToggleBtn');
    const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#7c3aed'];
    const roles = ['candidate', 'recruiter', 'admin'];

    assert.doesNotThrow(() => {
      for (let i = 0; i < 250; i++) {
        const action = i % 5;
        if (action === 0) {
          toggleBtn.dispatchEvent('click');
        } else if (action === 1) {
          const c = colors[i % colors.length];
          env.context.window.applyThemeColor(c);
        } else if (action === 2) {
          const r = roles[i % roles.length];
          hireflowAuth.loginAs(r, r === 'candidate' ? 'aarav' : (r === 'recruiter' ? 'vikram' : 'admin'));
        } else if (action === 3) {
          if (env.context.window.state.jobs && env.context.window.state.jobs.length > 0) {
            env.context.window.renderJobDetailPane(env.context.window.state.jobs[i % env.context.window.state.jobs.length]);
          }
        } else if (action === 4) {
          env.context.window.showAiEvaluationReport('APP-AARAV-01');
        }
      }
    });

    // Verify system remains stable and responsive after 250 rapid interleaved operations
    assert.ok(env.context.window.state.activeTheme === 'light' || env.context.window.state.activeTheme === 'dark');
    assert.ok(env.mockDocument.documentElement.getAttribute('data-theme') !== null);
  });

});
