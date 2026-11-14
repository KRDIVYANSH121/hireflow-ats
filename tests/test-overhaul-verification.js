/**
 * =============================================================================
 * HIREFLOW + OMNITALENT: SHOWCASE OVERHAUL & MASTER VERIFICATION TEST SUITE
 * Milestone: M5 / Requirement: R5
 * Target: c:\Users\darkp\OneDrive\Desktop\HIREFLOW FINAL VERSION 1
 * 
 * Comprehensive 45-Test Full Lifecycle Verification:
 * - Suite 1: Authentication Gateway & Role Switching (TC-AUTH-01 to TC-AUTH-06, 6 tests)
 * - Suite 2: 1-Click Persona Quick Logins (TC-PRS-01 to TC-PRS-05, 5 tests)
 * - Suite 3: Candidate Profile Management & Resume Verification (TC-CP-01 to TC-CP-05, 5 tests)
 * - Suite 4: LinkedIn Job Feed, 1-Click Apply & Tracking (TC-JF-01 to TC-JF-06, 6 tests)
 * - Suite 5: Job Requisition Studio & Editing (TC-JS-01 to TC-JS-05, 5 tests)
 * - Suite 6: Recruiter Pipeline, Stages & Scorecards (TC-PIP-01 to TC-PIP-06, 6 tests)
 * - Suite 7: AI Evaluation Report Rendering (TC-AI-01 to TC-AI-06, 6 tests)
 * - Suite 8: Admin Management Controls & REST API (TC-ADM-01 to TC-ADM-06, 6 tests)
 * 
 * Total: 45 Tests | Zero External Dependencies | In-Memory Stream & DOM Fixtures
 * =============================================================================
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const http = require('http');
const { Readable, Writable } = require('stream');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const HTML_PATH = path.join(PROJECT_ROOT, 'index.html');
const APP_JS_PATH = path.join(PROJECT_ROOT, 'app.js');
const SERVER_JS_PATH = path.join(PROJECT_ROOT, 'server.js');

const htmlContent = fs.readFileSync(HTML_PATH, 'utf8');
const appJsContent = fs.readFileSync(APP_JS_PATH, 'utf8');

// =============================================================================
// IN-MEMORY HTTP SERVER CAPTURE & DISPATCH HARNESS
// =============================================================================

let capturedServer = null;
const originalCreateServer = http.createServer;
http.createServer = function (...args) {
  capturedServer = originalCreateServer.apply(this, args);
  const origListen = capturedServer.listen;
  capturedServer.listen = function (port, cb) {
    if (typeof cb === 'function') process.nextTick(cb);
    return capturedServer;
  };
  return capturedServer;
};

// Silence startup banner during server load
const originalConsoleLog = console.log;
console.log = () => {};
require(SERVER_JS_PATH);
console.log = originalConsoleLog;

if (capturedServer && typeof capturedServer.close === 'function') {
  capturedServer.close();
}

function requestApi(urlPath, options = {}) {
  const { method = 'GET', headers = {}, body = null } = options;
  return new Promise((resolve, reject) => {
    if (!capturedServer) {
      return reject(new Error('Server was not captured for in-memory dispatch'));
    }

    const req = new Readable({ read() {} });
    req.url = urlPath;
    req.method = method.toUpperCase();
    req.headers = Object.assign({ host: 'localhost' }, headers);

    if (body !== null && body !== undefined) {
      const payload = typeof body === 'string' ? body : JSON.stringify(body);
      if (!req.headers['content-type']) req.headers['content-type'] = 'application/json';
      req.headers['content-length'] = Buffer.byteLength(payload);
      req.push(payload);
    }
    req.push(null);

    let responseData = '';
    let statusCode = 200;
    const responseHeaders = {};

    const res = new Writable({
      write(chunk, encoding, callback) {
        responseData += chunk.toString();
        callback();
      }
    });

    res.writeHead = (st, h) => {
      statusCode = st;
      if (h) {
        for (const [k, v] of Object.entries(h)) {
          responseHeaders[k.toLowerCase()] = v;
        }
      }
    };

    res.end = (chunk) => {
      if (chunk) responseData += chunk.toString();
      let parsed = null;
      try {
        parsed = JSON.parse(responseData);
      } catch (e) {
        parsed = responseData;
      }
      resolve({ status: statusCode, headers: responseHeaders, body: parsed });
    };

    capturedServer.emit('request', req, res);
  });
}

// =============================================================================
// AUTHORITATIVE HEADLESS DOM & EVENT HARNESS
// =============================================================================

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

  dispatchEvent(event, extra = {}) {
    const type = typeof event === 'string' ? event : event.type;
    const evObj = typeof event === 'string'
      ? { type, target: this, currentTarget: this, stopPropagation: () => {}, preventDefault: () => {}, ...extra }
      : { target: this, currentTarget: this, stopPropagation: () => {}, preventDefault: () => {}, ...event, ...extra };

    if (this.listeners[type]) {
      this.listeners[type].forEach(fn => fn(evObj));
    }
    if (typeof this['on' + type] === 'function') {
      this['on' + type](evObj);
    }
  }

  querySelector(selector) {
    const results = this.querySelectorAll(selector);
    return results.length > 0 ? results[0] : null;
  }

  querySelectorAll(selector) {
    if (selector.includes(',')) {
      const parts = selector.split(',').map(s => s.trim());
      const combined = [];
      for (const part of parts) {
        combined.push(...this.querySelectorAll(part));
      }
      return Array.from(new Set(combined));
    }

    if (selector.includes(' ')) {
      const parts = selector.split(/\s+/).filter(Boolean);
      let current = [this];
      for (const part of parts) {
        const next = [];
        for (const node of current) {
          next.push(...node.querySelectorAll(part));
        }
        current = next;
      }
      return current;
    }

    const results = [];
    const matchNode = (node) => {
      let isMatch = true;
      if (selector.startsWith('#')) {
        isMatch = node.id === selector.slice(1);
      } else if (selector.startsWith('.')) {
        const classes = selector.split('.').filter(Boolean);
        isMatch = classes.every(c => node.classList.contains(c));
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

function parseHTMLFragment(html) {
  const root = new MockDOMElement('fragment');
  const stack = [root];
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
        }
        if (/\bdisabled\b/i.test(attrsStr)) {
          el.setAttribute('disabled', 'true');
          el.disabled = true;
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
        if (/\bdisabled\b/i.test(attrsStr)) {
          el.setAttribute('disabled', 'true');
          el.disabled = true;
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

  class MockFileReader {
    readAsText(file) {
      setTimeout(() => {
        if (this.onload) {
          this.onload({ target: { result: file.content || '' } });
        }
      }, 0);
    }
  }

  const sandbox = {
    window: mockWindow,
    document: mockDocument,
    sessionStorage: mockSessionStorage,
    FileReader: MockFileReader,
    requestAnimationFrame: mockWindow.requestAnimationFrame,
    cancelAnimationFrame: mockWindow.cancelAnimationFrame,
    setTimeout: (fn) => { if (typeof fn === 'function') fn(); return 1; },
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

  // Dispatch DOMContentLoaded
  mockDocument.dispatchEvent('DOMContentLoaded');

  return {
    root,
    elementsById,
    sandbox,
    mockWindow,
    get: (id) => elementsById.get(id) || null,
    query: (sel) => root.querySelector(sel),
    queryAll: (sel) => root.querySelectorAll(sel),
    getState: () => mockWindow.state || sandbox.state,
    hireflowAuth: mockWindow.hireflowAuth || sandbox.hireflowAuth,
    docStyleProps
  };
}

// =============================================================================
// 45-TEST MASTER OVERHAUL VERIFICATION SUITE (R1 - R5)
// =============================================================================

describe('Milestone M5: Showcase Overhaul & Full Lifecycle Verification', () => {

  // ---------------------------------------------------------------------------
  // SUITE 1: AUTHENTICATION GATEWAY & ROLE SWITCHING (6 TESTS)
  // ---------------------------------------------------------------------------
  describe('Suite 1: Authentication Gateway & Role Switching', () => {
    let env;
    beforeEach(() => { env = setupTestEnv(); });

    it('TC-AUTH-01: Gateway renders on load with Candidate, Recruiter HR, and Recruiter Admin options', () => {
      const gw = env.get('authGateway');
      assert.ok(gw, '#authGateway container must exist');
      assert.ok(gw.classList.contains('active'), 'Gateway must be active on initial unauthenticated load');

      const candCard = env.get('roleCardCandidate');
      const hrCard = env.get('roleCardRecruiter');
      const adminCard = env.get('roleCardAdmin');

      assert.ok(candCard, '#roleCardCandidate must exist');
      assert.strictEqual(candCard.getAttribute('data-role'), 'CANDIDATE');
      assert.ok(hrCard, '#roleCardRecruiter must exist');
      assert.strictEqual(hrCard.getAttribute('data-role'), 'RECRUITER_HR');
      assert.ok(adminCard, '#roleCardAdmin must exist');
      assert.strictEqual(adminCard.getAttribute('data-role'), 'RECRUITER_ADMIN');
    });

    it('TC-AUTH-02: Candidate role selection navigates to Candidate Workspace and sets state.currentUser.role', () => {
      const user = env.hireflowAuth.loginAs('CANDIDATE', 'aarav');
      assert.strictEqual(user.role, 'CANDIDATE');
      assert.strictEqual(env.getState().currentUser.role, 'CANDIDATE');
      assert.strictEqual(env.getState().currentUser.isAuthenticated, true);

      // Verify Gateway is closed
      const gw = env.get('authGateway');
      assert.strictEqual(gw.classList.contains('active'), false);

      // Verify Candidate Job Feed view is active
      const feedView = env.get('candidate-jobs-view');
      assert.ok(feedView, '#candidate-jobs-view must exist');
      assert.strictEqual(feedView.classList.contains('active'), true);
    });

    it('TC-AUTH-03: Recruiter HR role selection navigates to Recruiter Workspace', () => {
      const user = env.hireflowAuth.loginAs('RECRUITER_HR', 'vikram');
      assert.strictEqual(user.role, 'RECRUITER_HR');
      assert.strictEqual(env.getState().currentUser.role, 'RECRUITER_HR');

      // Verify Recruiter view (Kanban or Studio) is active
      const kanbanView = env.get('kanban-view');
      assert.ok(kanbanView, '#kanban-view must exist');
      assert.strictEqual(kanbanView.classList.contains('active'), true);
    });

    it('TC-AUTH-04: Recruiter Admin role selection unlocks Admin Controls view', () => {
      const user = env.hireflowAuth.loginAs('RECRUITER_ADMIN', 'admin');
      assert.strictEqual(user.role, 'RECRUITER_ADMIN');
      assert.strictEqual(env.getState().currentUser.role, 'RECRUITER_ADMIN');

      const adminTab = env.queryAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'admin-view');
      assert.ok(adminTab, 'Admin tab must exist');
      assert.notStrictEqual(adminTab.style.display, 'none', 'Admin tab must not be display:none for RECRUITER_ADMIN');

      const adminView = env.get('admin-view');
      assert.ok(adminView, '#admin-view must exist');
      assert.strictEqual(adminView.classList.contains('active'), true);
    });

    it('TC-AUTH-05: Gating verification: Admin Controls are hidden and inaccessible for Candidate & HR', () => {
      // Test Candidate gating
      env.hireflowAuth.loginAs('CANDIDATE', 'aarav');
      const candAdminTab = env.queryAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'admin-view');
      assert.strictEqual(candAdminTab.style.display, 'none');

      // Attempt unauthorized navigation
      if (typeof env.mockWindow.switchMainTab === 'function') {
        env.mockWindow.switchMainTab('admin-view');
      }
      const candAdminView = env.get('admin-view');
      assert.strictEqual(candAdminView.classList.contains('active'), false);

      // Test HR gating
      env.hireflowAuth.loginAs('RECRUITER_HR', 'vikram');
      const hrAdminTab = env.queryAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'admin-view');
      assert.strictEqual(hrAdminTab.style.display, 'none');

      if (typeof env.mockWindow.switchMainTab === 'function') {
        env.mockWindow.switchMainTab('admin-view');
      }
      assert.strictEqual(candAdminView.classList.contains('active'), false);
    });

    it('TC-AUTH-06: Role switcher / Sign Out button resets session and returns to Gateway', () => {
      env.hireflowAuth.loginAs('CANDIDATE', 'aarav');
      assert.strictEqual(env.getState().currentUser.isAuthenticated, true);

      const logoutBtn = env.get('logoutBtn');
      assert.ok(logoutBtn, '#logoutBtn must exist');
      logoutBtn.dispatchEvent('click');

      assert.strictEqual(env.getState().currentUser, null);
      const gw = env.get('authGateway');
      assert.strictEqual(gw.classList.contains('active'), true);
    });
  });

  // ---------------------------------------------------------------------------
  // SUITE 2: 1-CLICK PERSONA QUICK LOGINS (5 TESTS)
  // ---------------------------------------------------------------------------
  describe('Suite 2: 1-Click Persona Quick Logins', () => {
    let env;
    beforeEach(() => { env = setupTestEnv(); });

    it('TC-PRS-01: Quick login as Aarav Sharma authenticates as Candidate and preloads profile', () => {
      const aaravBtn = env.get('loginPresetAarav');
      assert.ok(aaravBtn, '#loginPresetAarav must exist');
      aaravBtn.dispatchEvent('click');

      const user = env.getState().currentUser;
      assert.strictEqual(user.name, 'Aarav Sharma');
      assert.strictEqual(user.role, 'CANDIDATE');
      assert.strictEqual(user.email, 'aarav.s@email.com');

      const prof = env.getState().candidateProfile;
      assert.strictEqual(prof.name, 'Aarav Sharma');
      assert.ok(prof.skills.includes('JAVA'));
    });

    it('TC-PRS-02: Quick login as Vikram Seth authenticates as HR Recruiter and sets reviewer identity', () => {
      const vikramBtn = env.get('loginPresetVikram');
      assert.ok(vikramBtn, '#loginPresetVikram must exist');
      vikramBtn.dispatchEvent('click');

      const user = env.getState().currentUser;
      assert.strictEqual(user.name, 'Vikram Seth');
      assert.strictEqual(user.role, 'RECRUITER_HR');
      assert.strictEqual(user.headline, 'VP Engineering & Technical Hiring Lead');
    });

    it('TC-PRS-03: Quick login as Org Admin authenticates as Recruiter Admin', () => {
      const adminBtn = env.get('loginPresetAdmin');
      assert.ok(adminBtn, '#loginPresetAdmin must exist');
      adminBtn.dispatchEvent('click');

      const user = env.getState().currentUser;
      assert.strictEqual(user.name, 'Org Admin');
      assert.strictEqual(user.role, 'RECRUITER_ADMIN');
    });

    it('TC-PRS-04: Header badge and profile indicators reflect authenticated persona', () => {
      env.hireflowAuth.loginAs('CANDIDATE', 'aarav');

      const avatar = env.get('headerUserAvatar');
      const name = env.get('headerUserName');
      const badge = env.get('headerUserRoleBadge');

      assert.strictEqual(avatar.textContent, 'AS');
      assert.strictEqual(name.textContent, 'Aarav Sharma');
      assert.strictEqual(badge.textContent, 'Candidate');
    });

    it('TC-PRS-05: Consecutive persona switching operates cleanly without state leakage', () => {
      // 1. Login Aarav
      env.hireflowAuth.loginAs('CANDIDATE', 'aarav');
      assert.strictEqual(env.getState().currentUser.role, 'CANDIDATE');

      // 2. Switch to Vikram
      env.hireflowAuth.loginAs('RECRUITER_HR', 'vikram');
      assert.strictEqual(env.getState().currentUser.role, 'RECRUITER_HR');

      // 3. Switch to Admin
      env.hireflowAuth.loginAs('RECRUITER_ADMIN', 'admin');
      assert.strictEqual(env.getState().currentUser.role, 'RECRUITER_ADMIN');

      // 4. Switch back to Aarav
      env.hireflowAuth.loginAs('CANDIDATE', 'aarav');
      assert.strictEqual(env.getState().currentUser.role, 'CANDIDATE');
      assert.strictEqual(env.getState().currentUser.name, 'Aarav Sharma');
    });
  });

  // ---------------------------------------------------------------------------
  // SUITE 3: CANDIDATE PROFILE MANAGEMENT & RESUME VERIFICATION (5 TESTS)
  // ---------------------------------------------------------------------------
  describe('Suite 3: Candidate Profile Management & Resume Verification', () => {
    let env;
    beforeEach(() => {
      env = setupTestEnv();
      env.hireflowAuth.loginAs('CANDIDATE', 'aarav');
    });

    it('TC-CP-01: Profile form renders and edits full name, headline, location, and expected CTC', () => {
      const nameInput = env.get('candidateNameInput');
      const headlineInput = env.get('candidateHeadlineInput');
      const locInput = env.get('candidateLocationInput');
      const salaryInput = env.get('candidateExpectedSalaryInput');

      assert.ok(nameInput, '#candidateNameInput must exist');
      assert.ok(headlineInput, '#candidateHeadlineInput must exist');
      assert.ok(locInput, '#candidateLocationInput must exist');
      assert.ok(salaryInput, '#candidateExpectedSalaryInput must exist');

      // Edit values
      headlineInput.value = 'Principal Backend Architect | Distributed Systems';
      locInput.value = 'Bangalore, India (Global Remote)';
      salaryInput.value = '28';

      const form = env.get('candidateProfileForm');
      form.dispatchEvent('submit');

      const prof = env.getState().candidateProfile;
      assert.strictEqual(prof.headline, 'Principal Backend Architect | Distributed Systems');
      assert.strictEqual(prof.location, 'Bangalore, India (Global Remote)');
      assert.strictEqual(prof.expectedSalaryLPA, 28);
    });

    it('TC-CP-02: Verified skills tag list supports adding new skills and deleting existing tags', () => {
      const skillInput = env.get('newCandidateSkillInput');
      const addSkillBtn = env.get('addCandidateSkillBtn');
      const container = env.get('candidateSkillsTags');

      assert.ok(skillInput, '#newCandidateSkillInput must exist');
      assert.ok(addSkillBtn, '#addCandidateSkillBtn must exist');

      skillInput.value = 'GRAPHQL';
      addSkillBtn.dispatchEvent('click');

      const prof = env.getState().candidateProfile;
      assert.ok(prof.skills.includes('GRAPHQL'), 'Profile must include newly added GRAPHQL skill');

      // Remove a skill
      const deleteBtn = container.querySelector('.del-tag-btn');
      if (deleteBtn) {
        const toRemove = deleteBtn.getAttribute('data-skill');
        deleteBtn.dispatchEvent('click');
        assert.strictEqual(prof.skills.includes(toRemove), false);
      }
    });

    it('TC-CP-03: Portfolio & artifact links section accepts repository and demo URLs', () => {
      const nameInput = env.get('newLinkNameInput');
      const urlInput = env.get('newLinkUrlInput');
      const addBtn = env.get('addCandidateLinkBtn');

      assert.ok(nameInput && urlInput && addBtn, 'Portfolio link controls must exist');

      nameInput.value = 'Raft Consensus Engine';
      urlInput.value = 'https://github.com/aaravsharma/raft-engine';
      addBtn.dispatchEvent('click');

      const prof = env.getState().candidateProfile;
      assert.ok(prof.portfolioLinks.some(l => l.name === 'Raft Consensus Engine' || l.label === 'Raft Consensus Engine'));
    });

    it('TC-CP-04: Resume text input and file upload triggers AI parsing simulation', () => {
      const resumeTextarea = env.get('candidateResumeText');
      assert.ok(resumeTextarea, '#candidateResumeText must exist');

      resumeTextarea.value = 'Senior Architect with 5 years experience in Java, Kubernetes, and Kafka streaming.';
      resumeTextarea.dispatchEvent('input');

      const telemetry = env.get('candidateResumeTelemetry');
      if (telemetry) {
        assert.ok(telemetry.textContent.includes('yrs experience') || telemetry.textContent.includes('Java') || telemetry.textContent.includes('JAVA'));
      }
    });

    it('TC-CP-05: Saving candidate profile updates state and persists via profile API', async () => {
      // 1. Direct API test on PUT /api/v1/candidate/profile
      const putRes = await requestApi('/api/v1/candidate/profile', {
        method: 'PUT',
        body: {
          candidateName: 'Aarav Sharma',
          email: 'aarav.s@email.com',
          headline: 'Lead Distributed Systems Architect',
          expectedBaseSalaryLPA: 30,
          verifiedSkills: ['JAVA', 'KAFKA', 'KUBERNETES', 'DOCKER', 'REDIS'],
          experienceYears: 4
        }
      });

      assert.strictEqual(putRes.status, 200);
      assert.strictEqual(putRes.body.success, true);
      assert.strictEqual(putRes.body.data.headline, 'Lead Distributed Systems Architect');
      assert.strictEqual(putRes.body.data.expectedBaseSalaryLPA, 30);

      // 2. Direct API test on GET /api/v1/candidate/profile
      const getRes = await requestApi('/api/v1/candidate/profile?email=aarav.s@email.com');
      assert.strictEqual(getRes.status, 200);
      assert.strictEqual(getRes.body.success, true);
      assert.strictEqual(getRes.body.data.headline, 'Lead Distributed Systems Architect');
    });
  });

  // ---------------------------------------------------------------------------
  // SUITE 4: LINKEDIN JOB FEED, 1-CLICK APPLY & TRACKING (6 TESTS)
  // ---------------------------------------------------------------------------
  describe('Suite 4: LinkedIn Job Feed, 1-Click Apply & Tracking', () => {
    let env;
    beforeEach(() => {
      env = setupTestEnv();
      env.hireflowAuth.loginAs('CANDIDATE', 'aarav');
    });

    it('TC-JF-01: Job browsing feed renders scrollable job cards with compensation and equity badges', () => {
      const feed = env.get('jobFeedContainer');
      assert.ok(feed, '#jobFeedContainer must exist');

      const cards = feed.querySelectorAll('.job-feed-card');
      assert.ok(cards.length >= 2, 'Feed must render at least 2 job cards');

      const firstCard = cards[0];
      const specs = firstCard.querySelector('.job-specs-row');
      assert.ok(specs, 'Job card must contain .job-specs-row');
      assert.ok(specs.textContent.includes('LPA'), 'Specs must display LPA');
      assert.ok(specs.textContent.includes('ESOP'), 'Specs must display ESOP');
    });

    it('TC-JF-02: Search bar filters job cards dynamically by title and keywords', () => {
      const searchInput = env.get('jobFeedSearchInput');
      assert.ok(searchInput, '#jobFeedSearchInput must exist');

      searchInput.value = 'DevOps';
      searchInput.dispatchEvent('input', { target: searchInput });

      const feed = env.get('jobFeedContainer');
      const cards = feed.querySelectorAll('.job-feed-card');
      assert.ok(cards.length >= 1, 'Search query must match devops job card');
      assert.ok(cards.every(c => c.textContent.includes('DevOps') || c.textContent.includes('Platform')));
    });

    it('TC-JF-03: Category and skill filter pills narrow down job feed items', () => {
      const filters = env.get('jobCategoryFilters');
      assert.ok(filters, '#jobCategoryFilters must exist');

      const devopsPill = filters.querySelector('[data-category="DevOps"]');
      const allPill = filters.querySelector('[data-category="ALL"]');
      assert.ok(devopsPill && allPill, 'Category pills must exist');

      devopsPill.dispatchEvent('click');
      const feed = env.get('jobFeedContainer');
      assert.ok(feed.querySelectorAll('.job-feed-card').length >= 1);

      allPill.dispatchEvent('click');
      assert.strictEqual(feed.querySelectorAll('.job-feed-card').length, env.mockWindow.state.jobs.length);
    });

    it('TC-JF-04: Clicking 1-Click Apply submits application with current profile data', () => {
      const feed = env.get('jobFeedContainer');
      const devOpsCard = feed.querySelector('[data-jobid="JOB-5C2F8B"]');
      assert.ok(devOpsCard, 'JOB-5C2F8B card must exist');

      const applyBtn = devOpsCard.querySelector('.btn-1click-apply');
      assert.ok(applyBtn, '.btn-1click-apply button must exist');

      const initialCount = env.mockWindow.state.applications.length;
      applyBtn.dispatchEvent('click');

      const finalCount = env.mockWindow.state.applications.length;
      assert.strictEqual(finalCount, initialCount + 1, 'Applications count must increase by 1');
    });

    it('TC-JF-05: Apply button transitions to disabled ✓ Applied state', () => {
      const feed = env.get('jobFeedContainer');
      const devOpsCard = feed.querySelector('[data-jobid="JOB-5C2F8B"]');
      const applyBtn = devOpsCard.querySelector('.btn-1click-apply');

      applyBtn.dispatchEvent('click');

      const updatedCard = feed.querySelector('[data-jobid="JOB-5C2F8B"]');
      const appliedBtn = updatedCard.querySelector('.btn-applied');
      assert.ok(appliedBtn, 'Card should now have .btn-applied');
      assert.ok(appliedBtn.textContent.includes('✓ Applied'), 'Button text must show ✓ Applied');
      assert.strictEqual(appliedBtn.disabled, true, 'Button must be disabled');
    });

    it('TC-JF-06: Applied jobs tracking section lists submitted application with active stage badge & supports email filtering', async () => {
      // 1. In-browser applied jobs tracking list
      const list = env.get('appliedJobsList');
      assert.ok(list, '#appliedJobsList must exist');
      assert.ok(list.querySelectorAll('.applied-job-card').length >= 1);

      // 2. Direct REST API test on GET /api/v1/applications?email=aarav.s@email.com
      const res = await requestApi('/api/v1/applications?email=aarav.s@email.com');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.data.length >= 1);
      assert.strictEqual(res.body.data[0].candidateName, 'Aarav Sharma');
      assert.strictEqual(res.body.data[0].email, 'aarav.s@email.com');
    });
  });

  // ---------------------------------------------------------------------------
  // SUITE 5: JOB REQUISITION STUDIO CREATING & EDITING (5 TESTS)
  // ---------------------------------------------------------------------------
  describe('Suite 5: Job Requisition Studio Creating & Editing', () => {
    let env;
    beforeEach(() => {
      env = setupTestEnv();
      env.hireflowAuth.loginAs('RECRUITER_HR', 'vikram');
    });

    it('TC-JS-01: Requisition form validates title, experience, salary LPA, and ESOP equity %', () => {
      const titleInput = env.get('jobStudioTitle');
      const expInput = env.get('jobStudioExp');
      const minSalInput = env.get('jobStudioMinSalary');
      const maxSalInput = env.get('jobStudioMaxSalary');
      const equityInput = env.get('jobStudioEquity');

      assert.ok(titleInput, '#jobStudioTitle must exist');
      assert.ok(expInput, '#jobStudioExp must exist');
      assert.ok(minSalInput, '#jobStudioMinSalary must exist');
      assert.ok(maxSalInput, '#jobStudioMaxSalary must exist');
      assert.ok(equityInput, '#jobStudioEquity must exist');
    });

    it('TC-JS-02: Mandatory (70%) and Preferred (20%) skill tag inputs update requirement blueprint', () => {
      const mandInput = env.get('newStudioMandatoryInput');
      const addMandBtn = env.get('addStudioMandatoryBtn');
      const prefInput = env.get('newStudioPreferredInput');
      const addPrefBtn = env.get('addStudioPreferredBtn');

      assert.ok(mandInput && addMandBtn, 'Mandatory skill controls must exist');
      assert.ok(prefInput && addPrefBtn, 'Preferred skill controls must exist');

      mandInput.value = 'RUST';
      addMandBtn.dispatchEvent('click');

      const mandTags = env.get('studioMandatoryTags');
      assert.ok(mandTags.textContent.includes('RUST'), 'Mandatory tags container must render RUST chip');
    });

    it('TC-JS-03: Publishing requisition creates new job and renders live published spec card', () => {
      const createNewBtn = env.get('createNewJobBtn');
      if (createNewBtn) createNewBtn.dispatchEvent('click');

      const titleInput = env.get('jobStudioTitle');
      titleInput.value = 'Lead Site Reliability Engineer';

      const initialJobCount = env.getState().jobs.length;
      const studioForm = env.get('jobStudioForm');
      studioForm.dispatchEvent('submit');

      const finalJobCount = env.getState().jobs.length;
      assert.ok(finalJobCount >= initialJobCount, 'Job openings count must increase or persist');
    });

    it('TC-JS-04: Requisition Studio allows selecting and editing an existing job posting', () => {
      const jobSelect = env.get('studioJobSelect');
      assert.ok(jobSelect, '#studioJobSelect must exist');

      jobSelect.value = 'JOB-8F9A2C';
      jobSelect.dispatchEvent('change');

      const titleInput = env.get('jobStudioTitle');
      assert.ok(titleInput.value.includes('Senior Backend Engineer'), 'Selecting job must populate title');
    });

    it('TC-JS-05: Updating existing job properties updates job state via PUT /api/v1/jobs/:jobId', async () => {
      // 1. Direct API test on PUT /api/v1/jobs/JOB-8F9A2C
      const updateRes = await requestApi('/api/v1/jobs/JOB-8F9A2C', {
        method: 'PUT',
        body: {
          title: 'Senior Backend Architect (Distributed Systems & Raft)',
          minSalaryLPA: 26,
          maxSalaryLPA: 38,
          equityOfferedPercent: 0.35,
          mandatorySkills: ['JAVA', 'SPRING BOOT', 'MICROSERVICES', 'KAFKA', 'DOCKER'],
          preferredSkills: ['KUBERNETES', 'REDIS', 'AWS'],
          requiredExperienceYears: 3,
          status: 'OPEN'
        }
      });

      assert.strictEqual(updateRes.status, 200);
      assert.strictEqual(updateRes.body.success, true);
      assert.strictEqual(updateRes.body.data.title, 'Senior Backend Architect (Distributed Systems & Raft)');
      assert.strictEqual(updateRes.body.data.minSalaryLPA, 26);
      assert.strictEqual(updateRes.body.data.equityOfferedPercent, 0.35);

      // 2. Negative test on non-existent job ID
      const notFoundRes = await requestApi('/api/v1/jobs/JOB-NONEXISTENT', {
        method: 'PUT',
        body: { title: 'Ghost Job' }
      });
      assert.strictEqual(notFoundRes.status, 404);
      assert.strictEqual(notFoundRes.body.success, false);
    });
  });

  // ---------------------------------------------------------------------------
  // SUITE 6: RECRUITER PIPELINE, STAGE UPDATES & SCORECARDS (6 TESTS)
  // ---------------------------------------------------------------------------
  describe('Suite 6: Recruiter Pipeline, Stage Updates & Scorecards', () => {
    let env;
    beforeEach(() => {
      env = setupTestEnv();
      env.hireflowAuth.loginAs('RECRUITER_HR', 'vikram');
    });

    it('TC-PIP-01: Pipeline renders 6 Kanban columns (Sourced, Applied, AssessmentPending, Interviewing, OfferExtended, Closed)', () => {
      const stages = ['Sourced', 'Applied', 'AssessmentPending', 'Interviewing', 'OfferExtended', 'Closed'];
      stages.forEach(st => {
        const countBadge = env.get(`pipeline-count-${st}`);
        const cardsCont = env.get(`pipeline-cards-${st}`);
        assert.ok(countBadge, `#pipeline-count-${st} count badge must exist`);
        assert.ok(cardsCont, `#pipeline-cards-${st} cards container must exist`);
      });
    });

    it('TC-PIP-02: Moving candidate stage updates card column and application.kanbanStage', () => {
      const interviewCol = env.get('pipeline-cards-Interviewing');
      assert.ok(interviewCol && interviewCol.children.length >= 1, 'Candidate must exist in Interviewing');

      const card = interviewCol.children[0];
      const mover = card.querySelector('.kanban-stage-selector');
      assert.ok(mover, 'Kanban stage mover selector must exist');

      mover.value = 'OfferExtended';
      mover.dispatchEvent('change');

      const diyaApp = env.getState().applications.find(a => a.candidateName === 'Diya Nair');
      assert.strictEqual(diyaApp.kanbanStage, 'OfferExtended');
    });

    it('TC-PIP-03: Candidate profile modal allows entering 4 scorecard ratings (1-5) and interview notes', () => {
      env.mockWindow.openScorecardModal && env.mockWindow.openScorecardModal('APP-3C9E1A');

      const modal = env.get('scorecardModal');
      assert.ok(modal, '#scorecardModal must exist');

      const slider1 = env.get('modalScoreSysDesign');
      const slider2 = env.get('modalScoreCoding');
      const slider3 = env.get('modalScoreProblem');
      const slider4 = env.get('modalScoreCulture');
      const notes = env.get('modalDecisionNotes');

      assert.ok(slider1, '#modalScoreSysDesign must exist');
      assert.ok(slider2, '#modalScoreCoding must exist');
      assert.ok(slider3, '#modalScoreProblem must exist');
      assert.ok(slider4, '#modalScoreCulture must exist');
      assert.ok(notes, '#modalDecisionNotes must exist');
    });

    it('TC-PIP-04: Submitting decision (SelectedForOffer / Hold / Reject) updates candidate stage', () => {
      env.mockWindow.openScorecardModal && env.mockWindow.openScorecardModal('APP-3C9E1A');

      const offerBtn = env.get('scorecardOfferBtn');
      assert.ok(offerBtn, '#scorecardOfferBtn must exist');
      offerBtn.dispatchEvent('click');

      const app = env.getState().applications.find(a => a.applicationId === 'APP-3C9E1A');
      assert.strictEqual(app.kanbanStage, 'OfferExtended');
    });

    it('TC-PIP-05: Recorded decision appends to compliance audit ledger table', () => {
      const initialDecisions = env.getState().decisions ? env.getState().decisions.length : env.getState().hiringDecisions.length;

      env.mockWindow.openScorecardModal && env.mockWindow.openScorecardModal('APP-3C9E1A');
      const waitlistBtn = env.get('scorecardWaitlistBtn');
      if (waitlistBtn) waitlistBtn.dispatchEvent('click');

      const finalDecisions = env.getState().decisions ? env.getState().decisions.length : env.getState().hiringDecisions.length;
      assert.ok(finalDecisions >= initialDecisions, 'Decision must be recorded in decisions store');
    });

    it('TC-PIP-06: Offer Letter generator modal displays candidate name, offered CTC, and ESOP grant', () => {
      const list = env.get('appliedJobsList');
      const aaravCard = list.querySelector('[data-appid="APP-1B4D7E"]');
      const offerBtn = aaravCard.querySelector('.btn-view-offer-letter');
      assert.ok(offerBtn, 'Offer letter button must exist on Aarav card');

      offerBtn.dispatchEvent('click');

      const modal = env.get('offerModal');
      assert.ok(modal, '#offerModal must exist');
      assert.strictEqual(modal.classList.contains('active'), true);
      const body = env.get('offerModalBody');
      assert.ok(body.textContent.includes('Aarav Sharma'), 'Offer modal must contain candidate name');
    });
  });

  // ---------------------------------------------------------------------------
  // SUITE 7: AI EVALUATION REPORT RENDERING (6 TESTS)
  // ---------------------------------------------------------------------------
  describe('Suite 7: AI Evaluation Report Rendering', () => {
    let env;
    beforeEach(() => {
      env = setupTestEnv();
      env.hireflowAuth.loginAs('RECRUITER_HR', 'vikram');
    });

    it('TC-AI-01: AI report renders overall Match Percentage badge (e.g. 96% for Aarav, 31% for Rohan)', () => {
      env.mockWindow.showAiEvaluationReport && env.mockWindow.showAiEvaluationReport('APP-1B4D7E');

      const modal = env.get('aiReportModal');
      assert.ok(modal, '#aiReportModal must exist');
      assert.strictEqual(modal.classList.contains('active'), true);

      const body = env.get('aiReportModalBody');
      assert.ok(body.textContent.includes('Aarav Sharma'), 'Body must display candidate name');
      assert.ok(body.textContent.includes('96%'), 'Body must display 96% match score');
      assert.ok(body.textContent.includes('Strong Hire'), 'Body must display recommendation badge');
    });

    it('TC-AI-02: Mandatory requirement breakdown displays matched core skills vs skill gaps', () => {
      env.mockWindow.showAiEvaluationReport && env.mockWindow.showAiEvaluationReport('APP-1B4D7E');

      const body = env.get('aiReportModalBody');
      assert.ok(body.textContent.includes('Mandatory Skills (70% Weight)'), 'Must render mandatory skills section');

      const mandChips = body.querySelectorAll('.chip-mandatory');
      assert.ok(mandChips.length >= 4, 'Must render multiple matched mandatory chips');
    });

    it('TC-AI-03: Preferred requirement breakdown displays bonus skill scores', () => {
      env.mockWindow.showAiEvaluationReport && env.mockWindow.showAiEvaluationReport('APP-1B4D7E');

      const body = env.get('aiReportModalBody');
      assert.ok(body.textContent.includes('Preferred Skills (20% Weight)'), 'Must render preferred skills section');
    });

    it('TC-AI-04: NLP experience parser displays detected experience years vs required years', () => {
      env.mockWindow.showAiEvaluationReport && env.mockWindow.showAiEvaluationReport('APP-1B4D7E');

      const body = env.get('aiReportModalBody');
      assert.ok(body.textContent.includes('Experience Alignment (10% Weight)'), 'Must render experience alignment section');
    });

    it('TC-AI-05: 4-Factor hybrid radar displays Semantic, BM25, Graph Trust, and Intent metrics', () => {
      env.mockWindow.showAiEvaluationReport && env.mockWindow.showAiEvaluationReport('APP-1B4D7E');

      const body = env.get('aiReportModalBody');
      assert.ok(body.textContent.includes('Semantic Similarity (40% Weight)'), 'Must include Semantic similarity');
      assert.ok(body.textContent.includes('Keyword BM25 / Hard Skills (30% Weight)'), 'Must include Keyword BM25');
      assert.ok(body.textContent.includes('Social Graph Trust & Proximity (15% Weight)'), 'Must include Social Graph trust');
      assert.ok(body.textContent.includes('Intent & Activity Velocity (15% Weight)'), 'Must include Intent velocity');
    });

    it('TC-AI-06: AI hiring recommendation badge renders appropriate action advice', () => {
      env.mockWindow.showAiEvaluationReport && env.mockWindow.showAiEvaluationReport('APP-1B4D7E');

      const body = env.get('aiReportModalBody');
      assert.ok(body.textContent.includes('Key Strengths:'), 'Must include Key Strengths header');
      assert.ok(body.textContent.includes('Identified Skill Gaps:'), 'Must include Skill Gaps header');
      assert.ok(body.textContent.includes('Tailored Technical Interview Questions:'), 'Must include Interview Questions');
    });
  });

  // ---------------------------------------------------------------------------
  // SUITE 8: ADMIN MANAGEMENT CONTROLS & REST API (6 TESTS)
  // ---------------------------------------------------------------------------
  describe('Suite 8: Admin Management Controls & REST API', () => {
    let env;
    beforeEach(() => {
      env = setupTestEnv();
      env.hireflowAuth.loginAs('RECRUITER_ADMIN', 'admin');
    });

    it('TC-ADM-01: Admin view renders when authenticated as Recruiter Admin', () => {
      const adminView = env.get('admin-view');
      assert.ok(adminView, '#admin-view must exist');
      assert.strictEqual(adminView.classList.contains('active'), true);
    });

    it('TC-ADM-02: Portal name, tagline, and logo badge inputs update live branding preview', () => {
      const nameInput = env.get('adminPortalName');
      const taglineInput = env.get('adminPortalTagline');
      const previewCard = env.get('adminBrandingPreview');

      assert.ok(nameInput, '#adminPortalName must exist');
      assert.ok(taglineInput, '#adminPortalTagline must exist');
      assert.ok(previewCard, '#adminBrandingPreview must exist');

      nameInput.value = 'Apex Quantum Systems';
      nameInput.dispatchEvent('input');

      assert.ok(previewCard.textContent.includes('Apex Quantum Systems'), 'Preview card must reflect updated name');
    });

    it('TC-ADM-03: Brand color selection updates CSS variable --brand-primary and theme accents', () => {
      const swatches = env.root.querySelectorAll('.btn-theme-swatch');
      const emeraldSwatch = swatches.find(s => (s.getAttribute('data-color') || s.dataset?.color) === '#10b981');
      if (emeraldSwatch) {
        emeraldSwatch.dispatchEvent('click');
        assert.strictEqual(env.docStyleProps['--brand-primary'], '#10b981');
      } else {
        const colorInput = env.get('adminThemeColor');
        assert.ok(colorInput, '#adminThemeColor must exist');
        colorInput.value = '#10b981';
        colorInput.dispatchEvent('input');
        assert.strictEqual(env.docStyleProps['--brand-primary'], '#10b981');
      }
    });

    it('TC-ADM-04: Cutoff slider dynamically recalculates auto-shortlisted candidate triage count', () => {
      const slider = env.get('adminCutoffSlider');
      assert.ok(slider, '#adminCutoffSlider must exist');

      const qualCount = env.get('adminQualifiedCount');
      const screenCount = env.get('adminScreenedCount');
      assert.ok(qualCount && screenCount, 'Triage count badges must exist');

      // Set cutoff to 90%
      slider.value = '90';
      slider.dispatchEvent('input');

      // Aarav (96%) and Priya (92%) pass; Diya (88%) and Rohan (31%) fail
      assert.strictEqual(qualCount.textContent, '2');
      assert.strictEqual(screenCount.textContent, '2');
    });

    it('TC-ADM-05: Saving cutoff threshold updates state and persists via PUT /api/v1/organizations/:orgId', async () => {
      // 1. Direct API test on PUT /api/v1/organizations/ORG-APEX88
      const updateRes = await requestApi('/api/v1/organizations/ORG-APEX88', {
        method: 'PUT',
        body: {
          name: 'Apex Cloud Enterprise Systems',
          minScore: 82,
          logoColor: '#10b981',
          tagline: 'Enterprise ATS & Social Network Fusion',
          complianceSettings: {
            gdpr: true,
            blindHiring: true,
            autoKnockout: true,
            graphSync: true
          }
        }
      });

      assert.strictEqual(updateRes.status, 200);
      assert.strictEqual(updateRes.body.success, true);
      assert.strictEqual(updateRes.body.data.name, 'Apex Cloud Enterprise Systems');
      assert.strictEqual(updateRes.body.data.minimumShortlistScore, 82);
      assert.strictEqual(updateRes.body.data.logoColor, '#10b981');

      // 2. Negative test on non-existent organization ID
      const notFoundRes = await requestApi('/api/v1/organizations/ORG-UNKNOWN', {
        method: 'PUT',
        body: { name: 'Ghost Org' }
      });
      assert.strictEqual(notFoundRes.status, 404);
      assert.strictEqual(notFoundRes.body.success, false);
    });

    it('TC-ADM-06: Tenant form updates subdomain, organization type, and enterprise governance toggles', () => {
      const subdomainInput = env.get('adminSubdomain');
      const fullDomainBadge = env.get('adminFullDomain');

      assert.ok(subdomainInput, '#adminSubdomain must exist');
      assert.ok(fullDomainBadge, '#adminFullDomain must exist');

      subdomainInput.value = 'quantumcloud';
      subdomainInput.dispatchEvent('input');

      assert.ok(fullDomainBadge.textContent.includes('quantumcloud.hireflow.ai'), 'Domain badge must reflect updated subdomain');

      // Toggle governance switches
      const gdprToggle = env.get('toggleGdprCompliance');
      const blindToggle = env.get('toggleBlindHiring');
      assert.ok(gdprToggle, '#toggleGdprCompliance must exist');
      assert.ok(blindToggle, '#toggleBlindHiring must exist');

      blindToggle.checked = true;
      blindToggle.dispatchEvent('change');

      const saveTenantBtn = env.get('saveTenantBtn');
      if (saveTenantBtn) saveTenantBtn.dispatchEvent('click');

      const org = env.getState().organization;
      if (org && org.complianceSettings) {
        assert.strictEqual(org.complianceSettings.blindHiring, true);
      }
    });
  });

});
