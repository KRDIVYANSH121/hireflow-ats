/**
 * HIREFLOW + OMNITALENT: MILESTONE M4 ADMIN CONTROLS TEST SUITE
 * 
 * Verifies:
 * - Admin view navigation gating (data-roles="RECRUITER_ADMIN", role permission enforcement, redirecting unauthorized roles)
 * - Portal branding controls DOM structure (#adminPortalName, #adminPortalTagline, #adminLogoText, #adminThemeColor, #saveBrandingBtn)
 * - 5 Preset theme color swatches (#8b5cf6, #06b6d4, #10b981, #f59e0b, #ec4899)
 * - Real-time CSS custom property theming (--brand-primary, --accent-glow)
 * - Live branding preview card dynamic synchronization (#adminBrandingPreview)
 * - Candidate qualification cutoff threshold slider & badge (#adminCutoffSlider, #adminCutoffBadge)
 * - Real-time candidate triage simulation (qualified count, screened count, dynamic triage list status pills)
 * - Cutoff threshold persistence in state.organization.minimumShortlistScore
 * - Tenant settings form, subdomain validation, and enterprise governance policy toggles (GDPR, Blind Hiring, Knockout, Graph Sync)
 * - Headless test compatibility (.dataset, .getAttribute, .checked, .setAttribute)
 * - Backward compatibility with legacy DOM elements (#adminPortalSettings, #orgForm, #prevCutoff)
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const HTML_PATH = path.join(PROJECT_ROOT, 'index.html');
const APP_JS_PATH = path.join(PROJECT_ROOT, 'app.js');

const htmlContent = fs.readFileSync(HTML_PATH, 'utf8');
const appJsContent = fs.readFileSync(APP_JS_PATH, 'utf8');

// Lightweight Headless DOM Fixture
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
    this.style = {};
    this._value = '';
    this._textContent = '';
    this._checked = undefined;
    this.disabled = false;
  }

  get className() { return this._className; }
  set className(v) {
    this._className = String(v || '');
    this.classList._set = new Set(this._className ? this._className.split(/\s+/).filter(Boolean) : []);
  }

  get value() { return this._value; }
  set value(v) { this._value = String(v); }

  get checked() {
    if (this._checked !== undefined) return this._checked;
    const attr = this.getAttribute('checked');
    return attr !== null && attr !== 'false';
  }
  set checked(val) {
    this._checked = Boolean(val);
    if (val) this.setAttribute('checked', 'checked');
    else this.removeAttribute('checked');
  }

  get textContent() {
    if (this._textContent) return this._textContent;
    return this.childNodes.map(n => n.textContent || '').join(' ').trim();
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
    const parsed = parseHTMLFragment(v);
    this.children = parsed.children;
    this.childNodes = parsed.childNodes;
    this.children.forEach(c => { c.parentElement = this; });
  }

  get dataset() {
    const ds = {};
    for (const [k, v] of Object.entries(this.attributes)) {
      if (k.startsWith('data-')) {
        const camel = k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        ds[camel] = v;
      }
    }
    return ds;
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name.toLowerCase() === 'class') this.className = value;
    if (name.toLowerCase() === 'id') this.id = value;
    if (name.toLowerCase() === 'value') this._value = String(value);
    if (name.toLowerCase() === 'disabled') this.disabled = true;
    if (name.toLowerCase() === 'checked') this._checked = value !== 'false';
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
    if (name.toLowerCase() === 'disabled') this.disabled = false;
    if (name.toLowerCase() === 'checked') this._checked = false;
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    this.childNodes.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) this.children.splice(idx, 1);
    const nIdx = this.childNodes.indexOf(child);
    if (nIdx !== -1) this.childNodes.splice(nIdx, 1);
    child.parentElement = null;
    return child;
  }

  remove() {
    if (this.parentElement) {
      this.parentElement.removeChild(this);
    }
  }

  addEventListener(type, handler) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(handler);
  }

  dispatchEvent(event) {
    const type = typeof event === 'string' ? event : event.type;
    const evObj = typeof event === 'string' ? { type, target: this, currentTarget: this, stopPropagation: () => {}, preventDefault: () => {} } : event;
    if (!evObj.target) evObj.target = this;
    if (!evObj.currentTarget) evObj.currentTarget = this;
    if (!evObj.stopPropagation) evObj.stopPropagation = () => {};
    if (!evObj.preventDefault) evObj.preventDefault = () => {};

    if (this.listeners[type]) {
      this.listeners[type].forEach(fn => fn(evObj));
    }
    if (typeof this['on' + type] === 'function') {
      this['on' + type](evObj);
    }
  }

  querySelector(selector) {
    return querySelectorSingle(this, selector);
  }

  querySelectorAll(selector) {
    const results = [];
    querySelectorAllRecursive(this, selector, results);
    return results;
  }
}

function matchesSelector(el, selector) {
  if (!el || el.tagName === 'ROOT') return false;
  selector = selector.trim();

  if (selector.startsWith('#')) {
    return el.id === selector.substring(1);
  }
  if (selector.startsWith('.')) {
    const className = selector.substring(1);
    return el.classList && el.classList.contains(className);
  }
  if (selector.startsWith('[') && selector.endsWith(']')) {
    const inner = selector.substring(1, selector.length - 1);
    const eqIdx = inner.indexOf('=');
    if (eqIdx !== -1) {
      const attr = inner.substring(0, eqIdx).trim();
      let val = inner.substring(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      return el.getAttribute(attr) === val;
    }
    return el.getAttribute(inner) !== null;
  }
  return el.tagName.toLowerCase() === selector.toLowerCase();
}

function querySelectorSingle(root, selector) {
  if (selector.includes(' ')) {
    const parts = selector.split(/\s+/).filter(Boolean);
    let current = [root];
    for (const part of parts) {
      const next = [];
      for (const node of current) {
        querySelectorAllRecursive(node, part, next);
      }
      current = next;
      if (current.length === 0) return null;
    }
    return current[0] || null;
  }

  for (const child of root.children) {
    if (matchesSelector(child, selector)) return child;
    const found = querySelectorSingle(child, selector);
    if (found) return found;
  }
  return null;
}

function querySelectorAllRecursive(root, selector, results) {
  if (selector.includes(',')) {
    const parts = selector.split(',').map(s => s.trim());
    for (const part of parts) {
      querySelectorAllRecursive(root, part, results);
    }
    return;
  }

  for (const child of root.children) {
    if (matchesSelector(child, selector)) {
      if (!results.includes(child)) results.push(child);
    }
    querySelectorAllRecursive(child, selector, results);
  }
}

function parseHTMLFragment(fragmentStr) {
  const root = new MockDOMElement('fragment');
  const voidTags = new Set(['INPUT', 'IMG', 'META', 'LINK', 'BR', 'HR']);
  const stack = [root];

  const tagRegex = /<!--[\s\S]*?-->|<(\/)?([a-zA-Z0-9_-]+)([^>]*?)(\/)?>|([^<]+)/g;
  let match;
  while ((match = tagRegex.exec(fragmentStr)) !== null) {
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
  return { children: root.children, childNodes: root.childNodes };
}

function parseHTML(html) {
  const root = new MockDOMElement('root');
  const stack = [root];
  const elementsById = new Map();
  const voidTags = new Set(['INPUT', 'IMG', 'META', 'LINK', 'BR', 'HR']);

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

function setupTestEnv() {
  const { root, elementsById } = parseHTML(htmlContent);

  const canvasEl = elementsById.get('networkCanvas') || new MockDOMElement('canvas', 'networkCanvas');
  canvasEl.width = 1100;
  canvasEl.height = 550;
  canvasEl.getContext = () => ({
    clearRect: () => {}, beginPath: () => {}, moveTo: () => {}, lineTo: () => {},
    stroke: () => {}, arc: () => {}, fill: () => {}, fillText: () => {}, setLineDash: () => {}
  });

  const docStyleProps = {};
  const mockDocument = {
    addEventListener: (type, fn) => {
      if (!mockDocument._listeners[type]) mockDocument._listeners[type] = [];
      mockDocument._listeners[type].push(fn);
    },
    dispatchEvent: (type) => {
      if (mockDocument._listeners[type]) {
        mockDocument._listeners[type].forEach(fn => fn({ type }));
      }
    },
    getElementById: (id) => elementsById.get(id) || null,
    querySelectorAll: (sel) => root.querySelectorAll(sel),
    querySelector: (sel) => root.querySelector(sel),
    createElement: (tag) => new MockDOMElement(tag),
    body: root,
    documentElement: {
      style: {
        setProperty: (k, v) => { docStyleProps[k] = String(v); },
        getPropertyValue: (k) => docStyleProps[k] || ''
      }
    },
    _listeners: {}
  };

  const mockWindow = {
    document: mockDocument,
    requestAnimationFrame: (cb) => 1,
    cancelAnimationFrame: () => {},
    scrollTo: () => {},
    print: () => {},
    Blob: class { constructor(parts, opts) { this.parts = parts; this.type = opts?.type; } },
    URL: { createObjectURL: () => 'blob:mock-url' }
  };

  const mockSessionStorage = {
    _data: {},
    getItem: function (k) { return this._data[k] || null; },
    setItem: function (k, v) { this._data[k] = String(v); },
    removeItem: function (k) { delete this._data[k]; },
    clear: function () { this._data = {}; }
  };

  const sandbox = {
    window: mockWindow,
    document: mockDocument,
    sessionStorage: mockSessionStorage,
    requestAnimationFrame: mockWindow.requestAnimationFrame,
    cancelAnimationFrame: mockWindow.cancelAnimationFrame,
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    console: console,
    Math: Math,
    Date: Date,
    JSON: JSON,
    Array: Array,
    Object: Object,
    String: String,
    Number: Number,
    Boolean: Boolean,
    RegExp: RegExp,
    Set: Set,
    Map: Map,
    parseInt: parseInt,
    parseFloat: parseFloat
  };

  vm.createContext(sandbox);
  vm.runInContext(appJsContent, sandbox);

  // Expose window globals directly onto sandbox for test ergonomics
  sandbox.hireflowAuth = mockWindow.hireflowAuth;
  sandbox.state = mockWindow.state;
  sandbox.switchMainTab = mockWindow.switchMainTab;
  sandbox.applyThemeColor = mockWindow.applyThemeColor;
  sandbox.updateBrandingPreview = mockWindow.updateBrandingPreview;
  sandbox.updateCutoffTriageSimulation = mockWindow.updateCutoffTriageSimulation;
  sandbox.initAdminControls = mockWindow.initAdminControls;
  sandbox.renderAdminControls = mockWindow.renderAdminControls;

  // Dispatch DOMContentLoaded
  mockDocument.dispatchEvent('DOMContentLoaded');

  return { root, elementsById, sandbox, mockWindow, docStyleProps };
}

describe('Milestone M4: Admin Management Controls (Branding, Cutoff Triage & Tenant Settings)', () => {

  // ===========================================================================
  // 1. Admin Management Navigation & Role Gating
  // ===========================================================================
  describe('1. Admin Management Navigation & Role Gating', () => {
    let env;
    beforeEach(() => { env = setupTestEnv(); });

    it('M4-ROLE-01: #admin-view navigation tab exists with data-roles="RECRUITER_ADMIN"', () => {
      const tabs = env.root.querySelectorAll('.nav-tab');
      const adminTab = Array.from(tabs).find(t => (t.getAttribute('data-tab') || t.dataset?.tab) === 'admin-view');
      assert.ok(adminTab, 'Navigation tab targeting admin-view must exist');
      const roles = adminTab.getAttribute('data-roles') || adminTab.dataset?.roles;
      assert.ok(roles && roles.includes('RECRUITER_ADMIN'), 'Tab must be gated for RECRUITER_ADMIN role');
    });

    it('M4-ROLE-02: Switching to admin-view succeeds when user role is RECRUITER_ADMIN', () => {
      env.sandbox.hireflowAuth.loginAs('RECRUITER_ADMIN', 'admin');
      assert.equal(env.sandbox.state.currentUser.role, 'RECRUITER_ADMIN');

      env.sandbox.switchMainTab('admin-view');

      const adminView = env.elementsById.get('admin-view');
      assert.ok(adminView, '#admin-view must exist');
      assert.ok(adminView.classList.contains('active'), '#admin-view should have .active class');
      assert.equal(env.sandbox.state.currentTab, 'admin-view');
    });

    it('M4-ROLE-03: Switching to admin-view redirects CANDIDATE to candidate-jobs-view', () => {
      env.sandbox.hireflowAuth.loginAs('CANDIDATE', 'aarav');
      assert.equal(env.sandbox.state.currentUser.role, 'CANDIDATE');

      env.sandbox.switchMainTab('admin-view');

      const adminView = env.elementsById.get('admin-view');
      assert.ok(!adminView.classList.contains('active'), '#admin-view must NOT be active for candidate');

      const candidateView = env.elementsById.get('candidate-jobs-view');
      assert.ok(candidateView && candidateView.classList.contains('active'), 'Candidate should be redirected to candidate-jobs-view');
      assert.equal(env.sandbox.state.currentTab, 'candidate-jobs-view');
    });

    it('M4-ROLE-04: Switching to admin-view redirects RECRUITER_HR to kanban-view', () => {
      env.sandbox.hireflowAuth.loginAs('RECRUITER_HR', 'vikram');
      assert.equal(env.sandbox.state.currentUser.role, 'RECRUITER_HR');

      env.sandbox.switchMainTab('admin-view');

      const adminView = env.elementsById.get('admin-view');
      assert.ok(!adminView.classList.contains('active'), '#admin-view must NOT be active for HR');

      const kanbanView = env.elementsById.get('kanban-view');
      assert.ok(kanbanView && kanbanView.classList.contains('active'), 'HR should be redirected to kanban-view');
      assert.equal(env.sandbox.state.currentTab, 'kanban-view');
    });

    it('M4-ROLE-05: Navigation tab filtering shows admin tab only for RECRUITER_ADMIN', () => {
      const tabs = env.root.querySelectorAll('.nav-tab');
      const adminTab = Array.from(tabs).find(t => (t.getAttribute('data-tab') || t.dataset?.tab) === 'admin-view');
      assert.ok(adminTab, 'Admin nav tab must exist');

      // Candidate logged in -> admin tab hidden
      env.sandbox.hireflowAuth.loginAs('CANDIDATE', 'aarav');
      assert.equal(adminTab.style.display, 'none', 'Admin tab should be hidden for CANDIDATE');

      // Recruiter Admin logged in -> admin tab visible
      env.sandbox.hireflowAuth.loginAs('RECRUITER_ADMIN', 'admin');
      assert.notEqual(adminTab.style.display, 'none', 'Admin tab should be visible for RECRUITER_ADMIN');
    });
  });

  // ===========================================================================
  // 2. Portal Branding Controls DOM Structure
  // ===========================================================================
  describe('2. Portal Branding Controls DOM Structure', () => {
    let env;
    beforeEach(() => { env = setupTestEnv(); });

    it('M4-BRAND-DOM-01: All branding control inputs and save button exist', () => {
      const portalName = env.elementsById.get('adminPortalName');
      assert.ok(portalName, '#adminPortalName input must exist');

      const portalTagline = env.elementsById.get('adminPortalTagline');
      assert.ok(portalTagline, '#adminPortalTagline input must exist');

      const logoText = env.elementsById.get('adminLogoText');
      assert.ok(logoText, '#adminLogoText input must exist');

      const themeColor = env.elementsById.get('adminThemeColor');
      assert.ok(themeColor, '#adminThemeColor color picker must exist');

      const saveBtn = env.elementsById.get('saveBrandingBtn');
      assert.ok(saveBtn, '#saveBrandingBtn must exist');
    });

    it('M4-BRAND-DOM-02: 5 theme preset color swatches exist with expected hex codes', () => {
      const swatches = env.root.querySelectorAll('.btn-theme-swatch');
      assert.ok(swatches.length >= 5, 'Must provide at least 5 theme color swatch buttons');

      const colors = swatches.map(s => s.getAttribute('data-color') || s.dataset?.color);
      assert.ok(colors.includes('#8b5cf6'), 'Violet preset #8b5cf6 must be present');
      assert.ok(colors.includes('#06b6d4'), 'Cyan preset #06b6d4 must be present');
      assert.ok(colors.includes('#10b981'), 'Emerald preset #10b981 must be present');
      assert.ok(colors.includes('#f59e0b'), 'Amber preset #f59e0b must be present');
      assert.ok(colors.includes('#ec4899'), 'Rose preset #ec4899 must be present');
    });

    it('M4-BRAND-DOM-03: Live branding preview card and child components exist', () => {
      const previewCard = env.elementsById.get('adminBrandingPreview');
      assert.ok(previewCard, '#adminBrandingPreview live preview card must exist');

      const previewBanner = env.elementsById.get('adminPreviewBanner');
      assert.ok(previewBanner, '#adminPreviewBanner must exist');

      const previewLogo = env.elementsById.get('previewLogoIcon');
      assert.ok(previewLogo, '#previewLogoIcon must exist');

      const previewTitle = env.elementsById.get('previewPortalTitle');
      assert.ok(previewTitle, '#previewPortalTitle must exist');

      const previewTagline = env.elementsById.get('previewPortalTagline');
      assert.ok(previewTagline, '#previewPortalTagline must exist');
    });
  });

  // ===========================================================================
  // 3. Real-Time CSS Theming & Live Branding Preview Mutations
  // ===========================================================================
  describe('3. Real-Time CSS Theming & Live Branding Preview Mutations', () => {
    let env;
    beforeEach(() => {
      env = setupTestEnv();
      env.sandbox.hireflowAuth.loginAs('RECRUITER_ADMIN', 'admin');
    });

    it('M4-THEME-01: applyThemeColor updates document root CSS custom properties', () => {
      env.sandbox.applyThemeColor('#06b6d4');

      assert.equal(env.docStyleProps['--brand-primary'], '#06b6d4');
      assert.ok(env.docStyleProps['--accent-glow'].startsWith('#06b6d4'));
      assert.equal(env.sandbox.state.organization.themeColor, '#06b6d4');
    });

    it('M4-THEME-02: Clicking preset color swatches updates theme and applies styling', () => {
      const swatches = env.root.querySelectorAll('.btn-theme-swatch');
      const emeraldSwatch = swatches.find(s => (s.getAttribute('data-color') || s.dataset?.color) === '#10b981');
      assert.ok(emeraldSwatch, 'Emerald swatch must exist');

      emeraldSwatch.dispatchEvent('click');

      assert.equal(env.docStyleProps['--brand-primary'], '#10b981');
      assert.equal(env.sandbox.state.organization.themeColor, '#10b981');

      const themeInput = env.elementsById.get('adminThemeColor');
      assert.equal(themeInput.value, '#10b981');
    });

    it('M4-THEME-03: Changing portal text inputs updates #adminBrandingPreview live', () => {
      const nameInput = env.elementsById.get('adminPortalName');
      const taglineInput = env.elementsById.get('adminPortalTagline');
      const logoInput = env.elementsById.get('adminLogoText');

      nameInput.value = 'Quantum Talent Labs';
      nameInput.dispatchEvent('input');

      taglineInput.value = 'Next-Gen AI Recruiting Engine';
      taglineInput.dispatchEvent('input');

      logoInput.value = 'QT';
      logoInput.dispatchEvent('input');

      const previewTitle = env.elementsById.get('previewPortalTitle');
      const previewTagline = env.elementsById.get('previewPortalTagline');
      const previewLogo = env.elementsById.get('previewLogoIcon');

      assert.equal(previewTitle.textContent, 'Quantum Talent Labs');
      assert.equal(previewTagline.textContent, 'Next-Gen AI Recruiting Engine');
      assert.equal(previewLogo.textContent, 'QT');
    });

    it('M4-THEME-04: Clicking #saveBrandingBtn persists branding and updates header logo', () => {
      const nameInput = env.elementsById.get('adminPortalName');
      const taglineInput = env.elementsById.get('adminPortalTagline');
      const logoInput = env.elementsById.get('adminLogoText');
      const colorInput = env.elementsById.get('adminThemeColor');
      const saveBtn = env.elementsById.get('saveBrandingBtn');

      nameInput.value = 'Zephyr Cloud Networks';
      taglineInput.value = 'Autonomous Talent Ecosystem';
      logoInput.value = 'ZC';
      colorInput.value = '#ec4899';

      saveBtn.dispatchEvent('click');

      // Check state persistence
      assert.equal(env.sandbox.state.organization.name, 'Zephyr Cloud Networks');
      assert.equal(env.sandbox.state.organization.tagline, 'Autonomous Talent Ecosystem');
      assert.equal(env.sandbox.state.organization.logoText, 'ZC');
      assert.equal(env.sandbox.state.organization.themeColor, '#ec4899');

      // Check header update
      const logoTitle = env.root.querySelector('.logo-title');
      assert.ok(logoTitle && logoTitle.textContent.includes('ZEPHYR CLOUD NETWORKS'));

      const logoSub = env.root.querySelector('.logo-sub');
      assert.ok(logoSub && logoSub.textContent.includes('Autonomous Talent Ecosystem'));
    });

    it('M4-THEME-05: Clicking all 5 preset swatches sequentially updates theme dynamically', () => {
      const swatches = env.root.querySelectorAll('.btn-theme-swatch');
      const expectedColors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

      expectedColors.forEach(hex => {
        const swatch = swatches.find(s => (s.getAttribute('data-color') || s.dataset?.color) === hex);
        assert.ok(swatch, `Swatch for ${hex} must exist`);
        swatch.dispatchEvent('click');

        assert.equal(env.docStyleProps['--brand-primary'], hex);
        assert.equal(env.sandbox.state.organization.themeColor, hex);
        assert.equal(env.elementsById.get('adminThemeColor').value, hex);
      });
    });
  });

  // ===========================================================================
  // 4. Candidate Qualification Cutoff Thresholds DOM Structure
  // ===========================================================================
  describe('4. Candidate Qualification Cutoff Thresholds DOM Structure', () => {
    let env;
    beforeEach(() => { env = setupTestEnv(); });

    it('M4-CUTOFF-DOM-01: Slider, badge, triage counts, and save button exist', () => {
      const slider = env.elementsById.get('adminCutoffSlider');
      assert.ok(slider, '#adminCutoffSlider must exist');

      const badge = env.elementsById.get('adminCutoffBadge');
      assert.ok(badge, '#adminCutoffBadge must exist');

      const qualCount = env.elementsById.get('adminQualifiedCount');
      assert.ok(qualCount, '#adminQualifiedCount must exist');

      const scrCount = env.elementsById.get('adminScreenedCount');
      assert.ok(scrCount, '#adminScreenedCount must exist');

      const triageList = env.elementsById.get('adminTriageList');
      assert.ok(triageList, '#adminTriageList must exist');

      const saveBtn = env.elementsById.get('saveCutoffBtn');
      assert.ok(saveBtn, '#saveCutoffBtn must exist');
    });

    it('M4-CUTOFF-DOM-02: Slider has valid min, max, and step attributes', () => {
      const slider = env.elementsById.get('adminCutoffSlider');
      assert.equal(slider.getAttribute('min'), '50');
      assert.equal(slider.getAttribute('max'), '95');
      assert.equal(slider.getAttribute('step'), '1');
    });
  });

  // ===========================================================================
  // 5. Dynamic Cutoff Triage Simulation & Persistence
  // ===========================================================================
  describe('5. Dynamic Cutoff Triage Simulation & Persistence', () => {
    let env;
    beforeEach(() => {
      env = setupTestEnv();
      env.sandbox.hireflowAuth.loginAs('RECRUITER_ADMIN', 'admin');
    });

    it('M4-TRIAGE-01: Initial load with default 75% cutoff calculates 3 Qualified and 1 Screened', () => {
      const qualCount = env.elementsById.get('adminQualifiedCount');
      const scrCount = env.elementsById.get('adminScreenedCount');
      const badge = env.elementsById.get('adminCutoffBadge');

      assert.equal(badge.textContent, '75%');
      assert.equal(qualCount.textContent, '3');
      assert.equal(scrCount.textContent, '1');
    });

    it('M4-TRIAGE-02: Setting cutoff to 90% updates Qualified to 2 and Screened to 2', () => {
      const slider = env.elementsById.get('adminCutoffSlider');
      slider.value = '90';
      slider.dispatchEvent('input');

      const qualCount = env.elementsById.get('adminQualifiedCount');
      const scrCount = env.elementsById.get('adminScreenedCount');
      const badge = env.elementsById.get('adminCutoffBadge');

      assert.equal(badge.textContent, '90%');
      assert.equal(qualCount.textContent, '2', 'Aarav (96%) and Priya (92%) pass at 90%');
      assert.equal(scrCount.textContent, '2', 'Diya (88%) and Rohan (31%) are screened out at 90%');
    });

    it('M4-TRIAGE-03: Setting cutoff to 95% leaves only 1 Qualified (Aarav 96%)', () => {
      const slider = env.elementsById.get('adminCutoffSlider');
      slider.value = '95';
      slider.dispatchEvent('input');

      const qualCount = env.elementsById.get('adminQualifiedCount');
      const scrCount = env.elementsById.get('adminScreenedCount');

      assert.equal(qualCount.textContent, '1', 'Only Aarav (96%) passes cutoff of 95%');
      assert.equal(scrCount.textContent, '3', 'Priya, Diya, and Rohan are below 95%');
    });

    it('M4-TRIAGE-04: Setting cutoff to 50% qualifies all candidates except low-match Rohan', () => {
      const slider = env.elementsById.get('adminCutoffSlider');
      slider.value = '50';
      slider.dispatchEvent('input');

      const qualCount = env.elementsById.get('adminQualifiedCount');
      const scrCount = env.elementsById.get('adminScreenedCount');

      assert.equal(qualCount.textContent, '3');
      assert.equal(scrCount.textContent, '1');
    });

    it('M4-TRIAGE-05: Triage list renders candidate rows with correct pass/fail status pills', () => {
      const slider = env.elementsById.get('adminCutoffSlider');
      slider.value = '90';
      slider.dispatchEvent('input');

      const triageList = env.elementsById.get('adminTriageList');
      assert.ok(triageList, '#adminTriageList must exist');

      const rows = triageList.querySelectorAll('.triage-candidate-row');
      assert.equal(rows.length, 4, 'Must render rows for all 4 demo applications');

      // Sort order should be highest match first
      const topRow = rows[0];
      assert.ok(topRow.textContent.includes('Aarav Sharma'));
      assert.ok(topRow.textContent.includes('96%'));
      assert.ok(topRow.classList.contains('triage-pass'));

      // Diya at 88% is screened out when cutoff is 90%
      const diyaRow = rows.find(r => r.textContent.includes('Diya Nair'));
      assert.ok(diyaRow, 'Diya Nair row must exist');
      assert.ok(diyaRow.textContent.includes('88%'));
      assert.ok(diyaRow.classList.contains('triage-fail'));
      assert.ok(diyaRow.textContent.includes('Below Cutoff'));
    });

    it('M4-TRIAGE-06: Clicking #saveCutoffBtn persists cutoff in state.organization.minimumShortlistScore', () => {
      const slider = env.elementsById.get('adminCutoffSlider');
      slider.value = '82';
      slider.dispatchEvent('input');

      const saveBtn = env.elementsById.get('saveCutoffBtn');
      saveBtn.dispatchEvent('click');

      assert.equal(env.sandbox.state.organization.minimumShortlistScore, 82);

      // Verify legacy elements synchronized
      const orgMinScoreVal = env.elementsById.get('orgMinScoreVal');
      if (orgMinScoreVal) assert.equal(orgMinScoreVal.textContent, '82%');
      const prevCutoff = env.elementsById.get('prevCutoff');
      if (prevCutoff) assert.equal(prevCutoff.textContent, '82%');
    });
  });

  // ===========================================================================
  // 6. Tenant Settings & Enterprise Governance Policies
  // ===========================================================================
  describe('6. Tenant Settings & Enterprise Governance Policies', () => {
    let env;
    beforeEach(() => {
      env = setupTestEnv();
      env.sandbox.hireflowAuth.loginAs('RECRUITER_ADMIN', 'admin');
    });

    it('M4-TENANT-DOM-01: Tenant configuration inputs exist with default values', () => {
      const subdomain = env.elementsById.get('adminSubdomain');
      assert.ok(subdomain, '#adminSubdomain must exist');
      assert.equal(subdomain.value, 'apexcloud');

      const fullDomain = env.elementsById.get('adminFullDomain');
      assert.ok(fullDomain, '#adminFullDomain must exist');
      assert.ok(fullDomain.textContent.includes('apexcloud.hireflow.ai'));

      const tenantType = env.elementsById.get('adminTenantType');
      assert.ok(tenantType, '#adminTenantType must exist');

      const location = env.elementsById.get('adminOrgLocation');
      assert.ok(location, '#adminOrgLocation must exist');

      const industry = env.elementsById.get('adminOrgIndustry');
      assert.ok(industry, '#adminOrgIndustry must exist');
    });

    it('M4-TENANT-DOM-02: All 4 enterprise policy toggle switches exist', () => {
      const gdpr = env.elementsById.get('toggleGdprCompliance');
      assert.ok(gdpr, '#toggleGdprCompliance must exist');

      const blind = env.elementsById.get('toggleBlindHiring');
      assert.ok(blind, '#toggleBlindHiring must exist');

      const knockout = env.elementsById.get('toggleAutoKnockout');
      assert.ok(knockout, '#toggleAutoKnockout must exist');

      const sync = env.elementsById.get('toggleGraphSync');
      assert.ok(sync, '#toggleGraphSync must exist');
    });

    it('M4-TENANT-03: Typing into #adminSubdomain updates #adminFullDomain display text in real-time', () => {
      const subInput = env.elementsById.get('adminSubdomain');
      subInput.value = 'hypercloud';
      subInput.dispatchEvent('input');

      const fullDomain = env.elementsById.get('adminFullDomain');
      assert.equal(fullDomain.textContent, 'https://hypercloud.hireflow.ai');
    });

    it('M4-TENANT-04: Toggling enterprise policy switches persists new policy settings', () => {
      const blindToggle = env.elementsById.get('toggleBlindHiring');
      blindToggle.checked = true;

      const knockoutToggle = env.elementsById.get('toggleAutoKnockout');
      knockoutToggle.checked = false;

      const saveBtn = env.elementsById.get('saveTenantBtn');
      saveBtn.dispatchEvent('click');

      const policies = env.sandbox.state.organization.policies;
      assert.ok(policies, 'policies object must exist in state.organization');
      assert.equal(policies.blindHiring, true, 'Blind hiring should be enabled');
      assert.equal(policies.autoKnockout, false, 'Auto knockout should be disabled');
    });

    it('M4-TENANT-05: Clicking #saveTenantBtn serializes full tenant configuration', () => {
      const subInput = env.elementsById.get('adminSubdomain');
      const typeSelect = env.elementsById.get('adminTenantType');
      const locInput = env.elementsById.get('adminOrgLocation');
      const indInput = env.elementsById.get('adminOrgIndustry');
      const saveBtn = env.elementsById.get('saveTenantBtn');

      subInput.value = 'stratos-systems';
      typeSelect.value = 'ENTERPRISE';
      locInput.value = 'Hyderabad, India';
      indInput.value = 'Autonomous Cloud Architecture';

      saveBtn.dispatchEvent('click');

      const org = env.sandbox.state.organization;
      assert.equal(org.subdomain, 'stratos-systems');
      assert.equal(org.customSubdomain, 'stratos-systems.hireflow.ai');
      assert.equal(org.type, 'ENTERPRISE');
      assert.equal(org.location, 'Hyderabad, India');
      assert.equal(org.industry, 'Autonomous Cloud Architecture');

      const fullDomain = env.elementsById.get('adminFullDomain');
      assert.equal(fullDomain.textContent, 'https://stratos-systems.hireflow.ai');
    });

    it('M4-TENANT-06: Supports all tenant archetypes (Company, University, Agency)', () => {
      const typeSelect = env.elementsById.get('adminTenantType');
      const saveBtn = env.elementsById.get('saveTenantBtn');

      ['COMPANY', 'UNIVERSITY', 'AGENCY'].forEach(t => {
        typeSelect.value = t;
        saveBtn.dispatchEvent('click');
        assert.equal(env.sandbox.state.organization.type, t);
      });
    });

    it('M4-TENANT-07: All 4 enterprise policies can be enabled or disabled simultaneously', () => {
      const saveBtn = env.elementsById.get('saveTenantBtn');

      // Enable all 4
      ['toggleGdprCompliance', 'toggleBlindHiring', 'toggleAutoKnockout', 'toggleGraphSync'].forEach(id => {
        env.elementsById.get(id).checked = true;
      });
      saveBtn.dispatchEvent('click');
      let p = env.sandbox.state.organization.policies;
      assert.equal(p.gdpr, true);
      assert.equal(p.blindHiring, true);
      assert.equal(p.autoKnockout, true);
      assert.equal(p.graphSync, true);

      // Disable all 4
      ['toggleGdprCompliance', 'toggleBlindHiring', 'toggleAutoKnockout', 'toggleGraphSync'].forEach(id => {
        env.elementsById.get(id).checked = false;
      });
      saveBtn.dispatchEvent('click');
      p = env.sandbox.state.organization.policies;
      assert.equal(p.gdpr, false);
      assert.equal(p.blindHiring, false);
      assert.equal(p.autoKnockout, false);
      assert.equal(p.graphSync, false);
    });
  });

  // ===========================================================================
  // 7. Cross-Role Security & Headless Compatibility
  // ===========================================================================
  describe('7. Cross-Role Security & Headless Compatibility', () => {
    let env;
    beforeEach(() => { env = setupTestEnv(); });

    it('M4-COMPAT-01: Supports both dataset and getAttribute for theme preset swatches', () => {
      const swatches = env.root.querySelectorAll('.btn-theme-swatch');
      assert.ok(swatches.length > 0);
      swatches.forEach(swatch => {
        const attrVal = swatch.getAttribute('data-color');
        const dataVal = swatch.dataset?.color;
        assert.ok(attrVal || dataVal, 'Preset swatch must supply color via attribute or dataset');
      });
    });

    it('M4-COMPAT-02: Supports both .checked and setAttribute("checked") for policy toggles', () => {
      const gdprToggle = env.elementsById.get('toggleGdprCompliance');
      assert.ok(gdprToggle);

      // Property assignment
      gdprToggle.checked = false;
      assert.equal(gdprToggle.checked, false);

      // Attribute assignment
      gdprToggle.setAttribute('checked', 'checked');
      assert.equal(gdprToggle.checked, true);
    });

    it('M4-COMPAT-03: Preserves legacy DOM elements for backward compatibility', () => {
      const legacyAdmin = env.elementsById.get('adminPortalSettings');
      assert.ok(legacyAdmin, 'Legacy #adminPortalSettings container must be preserved');

      const legacyOrgForm = env.elementsById.get('orgForm');
      assert.ok(legacyOrgForm, 'Legacy #orgForm must be preserved');

      const legacyPrevCutoff = env.elementsById.get('prevCutoff');
      assert.ok(legacyPrevCutoff, 'Legacy #prevCutoff element must be preserved');
    });

    it('M4-COMPAT-04: Direct tab switching respects unauthenticated user state', () => {
      env.sandbox.hireflowAuth.logout();
      assert.equal(env.sandbox.state.currentUser, null);

      // Default state allows shared recruiter views or defaults
      env.sandbox.switchMainTab('kanban-view');
      const kanban = env.elementsById.get('kanban-view');
      assert.ok(kanban && kanban.classList.contains('active'));
    });
  });

});
