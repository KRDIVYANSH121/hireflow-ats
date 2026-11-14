/**
 * HIREFLOW + OMNITALENT: MILESTONE M1 AUTH GATEWAY & ROLE ROUTING TEST SUITE
 * 
 * Verifies:
 * - Upfront Sign-In Gateway DOM elements (#authGateway, 3 role cards, 1-click presets)
 * - Header User Session Capsule (#userSessionCapsule, avatar, name, role badge, actions)
 * - Navigation tab role filtering via data-roles
 * - window.hireflowAuth helper API (loginAs, logout, switchRole, getCurrentUser, getDemoPersonas)
 * - 1-Click demo persona quick login & routing (Aarav, Vikram, Admin)
 * - Custom credentials login form
 * - Session state synchronization & persistence
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
    const matchNode = (node) => {
      let isMatch = true;
      if (selector.startsWith('#')) {
        isMatch = node.id === selector.slice(1);
      } else if (selector.startsWith('.')) {
        isMatch = node.classList.contains(selector.slice(1));
      } else if (selector.includes('[')) {
        const attrMatch = selector.match(/\[([a-zA-Z0-9_-]+)(?:=['"]?([^'"\]]+)['"]?)?\]/);
        if (attrMatch) {
          const attr = attrMatch[1];
          const val = attrMatch[2];
          isMatch = val !== undefined ? node.getAttribute(attr) === val : node.getAttribute(attr) !== null;
        }
      } else {
        isMatch = node.tagName.toLowerCase() === selector.toLowerCase();
      }
      if (isMatch) results.push(node);
      for (const child of node.children) {
        matchNode(child);
      }
    };
    for (const child of this.children) {
      matchNode(child);
    }
    return results;
  }
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

  const docListeners = {};
  const mockDocument = {
    addEventListener: (type, fn) => {
      if (!docListeners[type]) docListeners[type] = [];
      docListeners[type].push(fn);
    },
    dispatchEvent: (type) => {
      if (docListeners[type]) docListeners[type].forEach(fn => fn({ type }));
    },
    getElementById: (id) => elementsById.get(id) || null,
    querySelectorAll: (sel) => root.querySelectorAll(sel),
    querySelector: (sel) => root.querySelector(sel),
    createElement: (tag) => new MockDOMElement(tag),
    body: root
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
    Date: Date,
    Math: Math,
    parseInt: parseInt,
    parseFloat: parseFloat,
    console: console
  };

  const instrumented = appJsContent.replace('const state = {', 'const state = window.__state = {');
  vm.createContext(sandbox);
  vm.runInContext(instrumented, sandbox);
  mockDocument.dispatchEvent('DOMContentLoaded');

  return {
    window: mockWindow,
    document: mockDocument,
    sessionStorage: mockSessionStorage,
    get: (id) => elementsById.get(id),
    query: (sel) => root.querySelector(sel),
    queryAll: (sel) => root.querySelectorAll(sel),
    getState: () => mockWindow.__state,
    hireflowAuth: mockWindow.hireflowAuth
  };
}

describe('Milestone M1: Upfront Sign-In Gateway & Role Routing', () => {

  describe('1. Upfront Gateway DOM Structure', () => {
    let env;
    beforeEach(() => { env = setupTestEnv(); });

    it('M1-DOM-01: #authGateway exists with active backdrop on fresh load', () => {
      const gw = env.get('authGateway');
      assert.ok(gw, '#authGateway container must exist');
      assert.ok(gw.classList.contains('auth-gateway-backdrop'), 'Must have .auth-gateway-backdrop class');
      assert.ok(gw.classList.contains('active'), 'Must be active on fresh load with no session');
    });

    it('M1-DOM-02: 3 Role selection cards are rendered with data-role attributes', () => {
      const candCard = env.get('roleCardCandidate');
      const recCard = env.get('roleCardRecruiter');
      const adminCard = env.get('roleCardAdmin');

      assert.ok(candCard, 'Candidate role card must exist');
      assert.strictEqual(candCard.getAttribute('data-role'), 'CANDIDATE');

      assert.ok(recCard, 'Recruiter HR role card must exist');
      assert.strictEqual(recCard.getAttribute('data-role'), 'RECRUITER_HR');

      assert.ok(adminCard, 'Recruiter Admin role card must exist');
      assert.strictEqual(adminCard.getAttribute('data-role'), 'RECRUITER_ADMIN');
    });

    it('M1-DOM-03: 1-Click quick login presets exist for Aarav, Vikram, and Admin', () => {
      const aaravBtn = env.get('loginPresetAarav');
      const vikramBtn = env.get('loginPresetVikram');
      const adminBtn = env.get('loginPresetAdmin');

      assert.ok(aaravBtn, '#loginPresetAarav must exist');
      assert.strictEqual(aaravBtn.getAttribute('data-preset'), 'aarav');
      assert.strictEqual(aaravBtn.getAttribute('data-role'), 'CANDIDATE');

      assert.ok(vikramBtn, '#loginPresetVikram must exist');
      assert.strictEqual(vikramBtn.getAttribute('data-preset'), 'vikram');
      assert.strictEqual(vikramBtn.getAttribute('data-role'), 'RECRUITER_HR');

      assert.ok(adminBtn, '#loginPresetAdmin must exist');
      assert.strictEqual(adminBtn.getAttribute('data-preset'), 'admin');
      assert.strictEqual(adminBtn.getAttribute('data-role'), 'RECRUITER_ADMIN');
    });

    it('M1-DOM-04: Custom credentials login form exists with required inputs', () => {
      const form = env.get('customLoginForm');
      const toggleBtn = env.get('toggleCustomLoginBtn');
      const nameInput = env.get('customAuthName');
      const emailInput = env.get('customAuthEmail');
      const roleSelect = env.get('customAuthRole');

      assert.ok(form, '#customLoginForm must exist');
      assert.ok(toggleBtn, '#toggleCustomLoginBtn must exist');
      assert.ok(nameInput, '#customAuthName must exist');
      assert.ok(emailInput, '#customAuthEmail must exist');
      assert.ok(roleSelect, '#customAuthRole must exist');
    });

    it('M1-DOM-05: Header User Session Capsule exists with avatar, name, badge, and actions', () => {
      const capsule = env.get('userSessionCapsule');
      const avatar = env.get('headerUserAvatar');
      const name = env.get('headerUserName');
      const badge = env.get('headerUserRoleBadge');
      const switchBtn = env.get('switchRoleBtn');
      const logoutBtn = env.get('logoutBtn');

      assert.ok(capsule, '#userSessionCapsule must exist in header');
      assert.ok(avatar, '#headerUserAvatar must exist');
      assert.ok(name, '#headerUserName must exist');
      assert.ok(badge, '#headerUserRoleBadge must exist');
      assert.ok(switchBtn, '#switchRoleBtn must exist');
      assert.ok(logoutBtn, '#logoutBtn must exist');
    });

    it('M1-DOM-06: Navigation tabs are tagged with appropriate data-roles attributes', () => {
      const tabs = env.queryAll('.nav-tab');
      assert.ok(tabs.length >= 5, 'Should have navigation tabs');

      const workflowTab = tabs.find(t => t.getAttribute('data-tab') === 'workflow-view');
      const kanbanTab = tabs.find(t => t.getAttribute('data-tab') === 'kanban-view');
      const graphTab = tabs.find(t => t.getAttribute('data-tab') === 'graph-view');
      const equityTab = tabs.find(t => t.getAttribute('data-tab') === 'equity-view');
      const auditTab = tabs.find(t => t.getAttribute('data-tab') === 'audit-view');

      assert.ok(workflowTab?.getAttribute('data-roles')?.includes('RECRUITER_HR'));
      assert.ok(kanbanTab?.getAttribute('data-roles')?.includes('RECRUITER_HR'));
      assert.ok(graphTab?.getAttribute('data-roles')?.includes('RECRUITER_HR'));
      assert.strictEqual(equityTab?.getAttribute('data-roles'), 'ALL');
      assert.ok(auditTab?.getAttribute('data-roles')?.includes('RECRUITER_ADMIN'));
    });
  });

  describe('2. Authentication State, Presets & window.hireflowAuth API', () => {
    let env;
    beforeEach(() => { env = setupTestEnv(); });

    it('M1-AUTH-01: window.hireflowAuth exposes complete automation interface', () => {
      const auth = env.hireflowAuth;
      assert.ok(auth, 'window.hireflowAuth must be defined');
      assert.strictEqual(typeof auth.loginAs, 'function');
      assert.strictEqual(typeof auth.logout, 'function');
      assert.strictEqual(typeof auth.switchRole, 'function');
      assert.strictEqual(typeof auth.getCurrentUser, 'function');
      assert.strictEqual(typeof auth.getDemoPersonas, 'function');

      const personas = auth.getDemoPersonas();
      assert.ok(personas.aarav, 'Demo persona aarav must exist');
      assert.ok(personas.vikram, 'Demo persona vikram must exist');
      assert.ok(personas.admin, 'Demo persona admin must exist');
      assert.ok(personas.diya, 'Demo persona diya must exist');
    });

    it('M1-AUTH-02: 1-Click login as Aarav (Candidate) routes to candidate workspace & filters tabs', () => {
      const auth = env.hireflowAuth;
      const user = auth.loginAs('CANDIDATE', 'aarav');

      assert.strictEqual(user.name, 'Aarav Sharma');
      assert.strictEqual(user.role, 'CANDIDATE');
      assert.strictEqual(user.isAuthenticated, true);
      assert.strictEqual(env.getState().currentUser.role, 'CANDIDATE');

      // Check header session capsule
      const capsule = env.get('userSessionCapsule');
      assert.strictEqual(capsule.style.display, 'flex');
      assert.strictEqual(env.get('headerUserName').textContent, 'Aarav Sharma');
      assert.strictEqual(env.get('headerUserRoleBadge').textContent, 'Candidate');

      // Check tab routing
      assert.strictEqual(env.getState().currentTab, 'candidate-jobs-view');

      // Check gateway is hidden
      assert.strictEqual(env.get('authGateway').classList.contains('active'), false);

      // Check sessionStorage sync
      const stored = JSON.parse(env.sessionStorage.getItem('hireflow_auth_user'));
      assert.strictEqual(stored.name, 'Aarav Sharma');
      assert.strictEqual(stored.role, 'CANDIDATE');
    });

    it('M1-AUTH-03: 1-Click login as Vikram (Recruiter HR) routes to Kanban & updates capsule', () => {
      const auth = env.hireflowAuth;
      const user = auth.loginAs('RECRUITER_HR', 'vikram');

      assert.strictEqual(user.name, 'Vikram Seth');
      assert.strictEqual(user.role, 'RECRUITER_HR');
      assert.strictEqual(env.getState().currentTab, 'kanban-view');

      assert.strictEqual(env.get('headerUserName').textContent, 'Vikram Seth');
      assert.strictEqual(env.get('headerUserRoleBadge').textContent, 'Recruiter (HR)');

      // Verify recruiter tabs are accessible and candidate tabs hidden
      const kanbanTab = env.queryAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'kanban-view');
      const candJobTab = env.queryAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'candidate-jobs-view');
      assert.strictEqual(kanbanTab.style.display, '');
      assert.strictEqual(candJobTab.style.display, 'none');
    });

    it('M1-AUTH-04: 1-Click login as Org Admin (Recruiter Admin) routes to admin view & unlocks governance tabs', () => {
      const auth = env.hireflowAuth;
      const user = auth.loginAs('RECRUITER_ADMIN', 'admin');

      assert.strictEqual(user.name, 'Org Admin');
      assert.strictEqual(user.role, 'RECRUITER_ADMIN');
      assert.strictEqual(env.getState().currentTab, 'admin-view');

      assert.strictEqual(env.get('headerUserName').textContent, 'Org Admin');
      assert.strictEqual(env.get('headerUserRoleBadge').textContent, 'Recruiter (Admin)');

      // Verify admin and audit tabs are accessible
      const adminTab = env.queryAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'admin-view');
      const auditTab = env.queryAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'audit-view');
      assert.strictEqual(adminTab.style.display, '');
      assert.strictEqual(auditTab.style.display, '');
    });

    it('M1-AUTH-05: Logout clears session, hides capsule, and re-displays #authGateway', () => {
      const auth = env.hireflowAuth;
      auth.loginAs('CANDIDATE', 'aarav');
      assert.ok(env.getState().currentUser !== null);

      auth.logout();
      assert.strictEqual(env.getState().currentUser, null);
      assert.strictEqual(env.sessionStorage.getItem('hireflow_auth_user'), null);
      assert.strictEqual(env.get('userSessionCapsule').style.display, 'none');
      assert.strictEqual(env.get('authGateway').classList.contains('active'), true);
    });

    it('M1-AUTH-06: switchRole opens gateway or switches to requested role preset directly', () => {
      const auth = env.hireflowAuth;
      auth.loginAs('CANDIDATE', 'aarav');

      auth.switchRole('RECRUITER_HR');
      assert.strictEqual(env.getState().currentUser.name, 'Vikram Seth');
      assert.strictEqual(env.getState().currentUser.role, 'RECRUITER_HR');
      assert.strictEqual(env.getState().currentTab, 'kanban-view');
    });
  });

  describe('3. Interactive DOM Events & Presets', () => {
    let env;
    beforeEach(() => { env = setupTestEnv(); });

    it('M1-DOM-EVT-01: Clicking #loginPresetAarav logs in Aarav Sharma', () => {
      const btn = env.get('loginPresetAarav');
      btn.dispatchEvent('click');

      assert.strictEqual(env.getState().currentUser.name, 'Aarav Sharma');
      assert.strictEqual(env.getState().currentUser.role, 'CANDIDATE');
      assert.strictEqual(env.get('authGateway').classList.contains('active'), false);
    });

    it('M1-DOM-EVT-02: Clicking #loginPresetVikram logs in Vikram Seth', () => {
      const btn = env.get('loginPresetVikram');
      btn.dispatchEvent('click');

      assert.strictEqual(env.getState().currentUser.name, 'Vikram Seth');
      assert.strictEqual(env.getState().currentUser.role, 'RECRUITER_HR');
    });

    it('M1-DOM-EVT-03: Clicking #loginPresetAdmin logs in Org Admin', () => {
      const btn = env.get('loginPresetAdmin');
      btn.dispatchEvent('click');

      assert.strictEqual(env.getState().currentUser.name, 'Org Admin');
      assert.strictEqual(env.getState().currentUser.role, 'RECRUITER_ADMIN');
    });

    it('M1-DOM-EVT-04: Submitting #customLoginForm authenticates custom user', () => {
      env.get('customAuthName').value = 'Rhea Chakraborty';
      env.get('customAuthEmail').value = 'rhea@nexa.io';
      env.get('customAuthRole').value = 'RECRUITER_HR';

      env.get('customLoginForm').dispatchEvent('submit');

      assert.strictEqual(env.getState().currentUser.name, 'Rhea Chakraborty');
      assert.strictEqual(env.getState().currentUser.email, 'rhea@nexa.io');
      assert.strictEqual(env.getState().currentUser.role, 'RECRUITER_HR');
      assert.strictEqual(env.get('headerUserName').textContent, 'Rhea Chakraborty');
    });

    it('M1-DOM-EVT-05: Clicking #switchRoleBtn in header opens gateway', () => {
      env.hireflowAuth.loginAs('CANDIDATE', 'aarav');
      assert.strictEqual(env.get('authGateway').classList.contains('active'), false);

      env.get('switchRoleBtn').dispatchEvent('click');
      assert.strictEqual(env.get('authGateway').classList.contains('active'), true);
    });

    it('M1-DOM-EVT-06: Clicking #logoutBtn in header logs out user and shows gateway', () => {
      env.hireflowAuth.loginAs('CANDIDATE', 'aarav');
      assert.ok(env.getState().currentUser !== null);

      env.get('logoutBtn').dispatchEvent('click');
      assert.strictEqual(env.getState().currentUser, null);
      assert.strictEqual(env.get('authGateway').classList.contains('active'), true);
    });
  });
});
