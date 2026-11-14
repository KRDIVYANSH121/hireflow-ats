/**
 * =============================================================================
 * HIREFLOW + OMNITALENT: ADVERSARIAL VERIFICATION SUITE 1
 * 
 * Adversarial Stress-Testing Scope:
 * 1. Authentication & Role Gateway:
 *    - Rapid consecutive persona switching (Aarav -> Vikram -> Org Admin -> Diya -> Logout)
 *    - Privilege escalation attacks: Candidate attempting to view or manipulate #admin-view or #recruiter-studio-view
 *    - Tampered session state in sessionStorage (malformed JSON, invalid/arbitrary roles, non-string roles)
 * 2. 1-Click Application Pipeline:
 *    - Repeated double-clicks / multi-clicks on .btn-1click-apply (concurrency & duplicate prevention)
 *    - Applying with empty profile, null skills, or special Unicode/emoji/RTL characters in resume text
 * 3. Backend REST API Robustness:
 *    - PUT /api/v1/organizations/:id with non-existent IDs, invalid payloads, missing fields, type coercion
 *    - PUT /api/v1/jobs/:id with non-existent IDs, negative salaries, empty skill arrays
 *    - GET /api/v1/applications?email=... with SQL injection and ReDoS regex injection strings
 * 
 * Execution:
 *   node tests/test-adversarial-auth-api.js
 * =============================================================================
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Readable, Writable } = require('stream');
const vm = require('vm');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const HTML_PATH = path.join(PROJECT_ROOT, 'index.html');
const APP_JS_PATH = path.join(PROJECT_ROOT, 'app.js');
const SERVER_JS_PATH = path.join(PROJECT_ROOT, 'server.js');

const htmlContent = fs.readFileSync(HTML_PATH, 'utf8');
const appJsContent = fs.readFileSync(APP_JS_PATH, 'utf8');

// =============================================================================
// SECTION A: HEADLESS DOM & CLIENT VM FIXTURE
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

  click() {
    this.dispatchEvent('click');
  }

  remove() {
    if (this.parentElement) {
      this.parentElement.children = this.parentElement.children.filter(c => c !== this);
      this.parentElement.childNodes = this.parentElement.childNodes.filter(c => c !== this);
    }
  }

  closest(selector) {
    let curr = this;
    while (curr) {
      if (curr.matches && curr.matches(selector)) return curr;
      curr = curr.parentElement;
    }
    return null;
  }

  matches(selector) {
    if (selector.startsWith('#')) return this.id === selector.slice(1);
    if (selector.startsWith('.')) return this.classList.contains(selector.slice(1));
    return this.tagName.toLowerCase() === selector.toLowerCase();
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
        // Support multi-class selectors like .view-panel.active
        const classes = selector.split('.').filter(Boolean);
        isMatch = classes.every(c => node.classList.contains(c));
      } else if (selector.startsWith('[')) {
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

function createClientEnv(initialSession = null) {
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

  const mockSessionStorage = {
    _data: {},
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(this._data, k) ? this._data[k] : null; },
    setItem: function (k, v) { this._data[k] = String(v); },
    removeItem: function (k) { delete this._data[k]; },
    clear: function () { this._data = {}; }
  };

  if (initialSession !== null) {
    mockSessionStorage._data['hireflow_auth_user'] = typeof initialSession === 'string'
      ? initialSession
      : JSON.stringify(initialSession);
  }

  const mockWindow = {
    document: mockDocument,
    requestAnimationFrame: (cb) => 1,
    cancelAnimationFrame: () => {},
    scrollTo: () => {},
    print: () => {},
    Blob: class { constructor(parts, opts) { this.parts = parts; this.type = opts?.type; } },
    URL: { createObjectURL: () => 'blob:mock-url' }
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

// =============================================================================
// SECTION B: IN-MEMORY SERVER STREAM HARNESS
// =============================================================================

let capturedServer = null;
const originalCreateServer = http.createServer;

http.createServer = function (...args) {
  capturedServer = originalCreateServer.apply(this, args);
  capturedServer.listen = function (port, cb) {
    if (typeof cb === 'function') process.nextTick(cb);
    return capturedServer;
  };
  return capturedServer;
};

const originalConsoleLog = console.log;
console.log = () => {};
require(SERVER_JS_PATH);
console.log = originalConsoleLog;

if (capturedServer && typeof capturedServer.close === 'function') {
  capturedServer.close();
}

function apiRequest(urlPath, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body = null
  } = options;

  return new Promise((resolve, reject) => {
    if (!capturedServer) {
      return reject(new Error('Server instance was not captured.'));
    }

    const req = new Readable({ read() {} });
    req.url = urlPath;
    req.method = method.toUpperCase();
    req.headers = Object.assign({ host: 'localhost' }, headers);

    if (body !== null && body !== undefined) {
      let payload;
      if (typeof body === 'string') {
        payload = body;
      } else {
        payload = JSON.stringify(body);
        if (!req.headers['content-type']) {
          req.headers['content-type'] = 'application/json';
        }
      }
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

    res.writeHead = function (code, headHeaders = {}) {
      statusCode = code;
      Object.assign(responseHeaders, headHeaders);
    };

    res.setHeader = function (k, v) {
      responseHeaders[k.toLowerCase()] = v;
    };

    res.getHeader = function (k) {
      return responseHeaders[k.toLowerCase()];
    };

    res.on('finish', () => {
      let parsed = null;
      try {
        parsed = JSON.parse(responseData);
      } catch (e) {
        parsed = responseData;
      }
      resolve({
        status: statusCode,
        headers: responseHeaders,
        body: parsed,
        rawBody: responseData
      });
    });

    capturedServer.emit('request', req, res);
  });
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('Adversarial Verification Suite 1: Authentication & Role Gateway', () => {

  it('ADV-AUTH-01: Rapid consecutive persona switching maintains consistent state and DOM', () => {
    const env = createClientEnv();
    const transitions = [
      { role: 'CANDIDATE', preset: 'aarav', expectedName: 'Aarav Sharma', expectedBadge: 'Candidate' },
      { role: 'RECRUITER_HR', preset: 'vikram', expectedName: 'Vikram Seth', expectedBadge: 'Recruiter (HR)' },
      { role: 'RECRUITER_ADMIN', preset: 'admin', expectedName: 'Org Admin', expectedBadge: 'Recruiter (Admin)' },
      { role: 'CANDIDATE', preset: 'diya', expectedName: 'Diya Nair', expectedBadge: 'Candidate' },
      { logout: true }
    ];

    // Execute 10 consecutive cycles (50 rapid switches)
    for (let cycle = 0; cycle < 10; cycle++) {
      for (const t of transitions) {
        if (t.logout) {
          env.hireflowAuth.logout();
          assert.strictEqual(env.getState().currentUser, null, `Cycle ${cycle}: currentUser must be null after logout`);
          assert.strictEqual(env.sessionStorage.getItem('hireflow_auth_user'), null, `Cycle ${cycle}: sessionStorage cleared on logout`);
          const capsule = env.get('userSessionCapsule');
          assert.strictEqual(capsule.style.display, 'none', `Cycle ${cycle}: Capsule hidden on logout`);
          const gw = env.get('authGateway');
          assert.ok(gw.classList.contains('active'), `Cycle ${cycle}: Gateway active on logout`);
        } else {
          env.hireflowAuth.loginAs(t.role, t.preset);
          const user = env.getState().currentUser;
          assert.ok(user, `Cycle ${cycle}: User must be logged in`);
          assert.strictEqual(user.name, t.expectedName, `Cycle ${cycle}: Correct user name`);
          assert.strictEqual(user.role, t.role, `Cycle ${cycle}: Correct user role`);

          // Capsule DOM check
          const nameEl = env.get('headerUserName');
          const badgeEl = env.get('headerUserRoleBadge');
          assert.strictEqual(nameEl.textContent, t.expectedName);
          assert.strictEqual(badgeEl.textContent, t.expectedBadge);

          // SessionStorage check
          const stored = JSON.parse(env.sessionStorage.getItem('hireflow_auth_user'));
          assert.strictEqual(stored.name, t.expectedName);
          assert.strictEqual(stored.role, t.role);
        }
      }
    }
  });

  it('ADV-AUTH-02: Privilege Escalation - Candidate cannot view #admin-view (redirects to candidate workspace)', () => {
    const env = createClientEnv();
    env.hireflowAuth.loginAs('CANDIDATE', 'aarav');

    // Simulate Candidate attempting to click admin nav tab or trigger tab switch to #admin-view
    const adminTab = env.query('[data-tab="admin-view"]');
    assert.ok(adminTab, 'Admin tab exists');
    assert.strictEqual(adminTab.style.display, 'none', 'Admin nav tab must be hidden from Candidate');

    // Adversarial action: Candidate forces click on admin tab
    adminTab.click();

    const adminPanel = env.get('admin-view');
    assert.strictEqual(adminPanel.classList.contains('active'), false, 'Candidate must NOT be able to activate #admin-view');

    const candidatePanel = env.get('candidate-jobs-view');
    assert.ok(candidatePanel.classList.contains('active'), 'Candidate must remain redirected to candidate-jobs-view');
  });

  it('ADV-AUTH-03: Privilege Escalation - Candidate attempting to view and manipulate #recruiter-studio-view', () => {
    const env = createClientEnv();
    env.hireflowAuth.loginAs('CANDIDATE', 'aarav');

    // 1. Candidate nav tab visibility check
    const studioTab = env.query('[data-tab="recruiter-studio-view"]');
    assert.ok(studioTab, 'recruiter-studio-view nav tab exists');
    assert.strictEqual(studioTab.style.display, 'none', 'Nav tab for recruiter studio is hidden via CSS display:none');

    // 2. Adversarial action: Candidate triggers click programmatically
    studioTab.click();

    const studioPanel = env.get('recruiter-studio-view');
    const isStudioActive = studioPanel.classList.contains('active');
    assert.strictEqual(isStudioActive, false, 'Candidate must NOT be able to activate #recruiter-studio-view');
    const candidateView = env.get('candidate-jobs-view');
    assert.ok(candidateView && candidateView.classList.contains('active'), 'Candidate must remain on candidate-jobs-view');

    const state = env.getState();
    const initialJobsCount = state.jobs.length;

    // 3. Candidate attempts to manipulate job requisitions via #jobStudioForm
    const titleInput = env.get('jobStudioTitle');
    if (titleInput) titleInput.value = 'Adversarial Candidate Job';
    const studioForm = env.get('jobStudioForm');
    if (studioForm) {
      studioForm.dispatchEvent('submit');
    }

    const modifiedOrCreated = state.jobs.some(j => j.title === 'Adversarial Candidate Job');
    assert.strictEqual(modifiedOrCreated, false, 'Candidate must NOT be able to create or mutate job requisitions');
    assert.strictEqual(state.jobs.length, initialJobsCount, 'Requisitions catalog must not be modified by candidate');

    // 4. Candidate attempts to submit scorecard or modify applicant stage
    const targetApp = state.applications[0];
    const originalStage = targetApp.kanbanStage;
    const appIdInput = env.get('scorecardAppId');
    if (appIdInput) appIdInput.value = targetApp.applicationId;
    const offerBtn = env.get('scorecardOfferBtn');
    if (offerBtn) offerBtn.click();
    assert.strictEqual(targetApp.kanbanStage, originalStage, 'Candidate must NOT be able to modify applicant stage or extend offers');
  });

  it('ADV-AUTH-04: Tampered session state - Malformed JSON strings in sessionStorage', () => {
    const malformedPayloads = [
      '{broken json',
      'undefined',
      'null',
      '{"role": "CANDIDATE"',
      '<<<NOT_JSON>>>',
      'NaN',
      '[1, 2, 3]'
    ];

    for (const badPayload of malformedPayloads) {
      // Must not throw uncaught SyntaxError; must fallback gracefully to login gateway
      assert.doesNotThrow(() => {
        const env = createClientEnv(badPayload);
        const user = env.getState().currentUser;
        assert.strictEqual(user, null, `Malformed payload "${badPayload}" must result in null user`);
        const gw = env.get('authGateway');
        assert.ok(gw.classList.contains('active'), `Gateway must be active on malformed payload "${badPayload}"`);
        const capsule = env.get('userSessionCapsule');
        assert.strictEqual(capsule.style.display, 'none', 'User capsule must be hidden');
      }, `Failed on payload: ${badPayload}`);
    }
  });

  it('ADV-AUTH-05: Tampered session state - Invalid / arbitrary roles in sessionStorage', () => {
    // 1. String invalid roles (e.g. SUPER_ADMIN_HACKER)
    const spoofedRoles = [
      { name: 'Attacker', role: 'SUPER_ADMIN_HACKER' },
      { name: 'Attacker', role: '<script>alert(1)</script>' },
      { name: 'Attacker', role: 'ROOT' }
    ];

    for (const spoof of spoofedRoles) {
      const env = createClientEnv(spoof);
      const user = env.getState().currentUser;
      // Arbitrary/spoofed roles must be rejected by initAuthGateway
      assert.strictEqual(user, null, `Spoofed role ${spoof.role} must be rejected by auth gateway`);
      const gw = env.get('authGateway');
      assert.ok(gw && gw.classList.contains('active'), `Gateway must remain active for spoofed role ${spoof.role}`);
      const capsule = env.get('userSessionCapsule');
      assert.strictEqual(capsule.style.display, 'none', `User capsule must remain hidden for spoofed role ${spoof.role}`);
    }

    // 2. Non-string role tampering (e.g. numeric role: 1337)
    // Non-string roles must be safely rejected during bootstrap without uncaught TypeErrors
    assert.doesNotThrow(() => {
      const env = createClientEnv({ name: 'NumericAttacker', role: 1337 });
      const user = env.getState().currentUser;
      assert.strictEqual(user, null, 'Tampered numeric role must be rejected by auth gateway');
      const gw = env.get('authGateway');
      assert.ok(gw && gw.classList.contains('active'), 'Gateway must remain active on invalid role');
      const capsule = env.get('userSessionCapsule');
      assert.strictEqual(capsule.style.display, 'none', 'Capsule must remain hidden');
    }, 'Non-string role in session storage must not crash application bootstrap');
  });

  it('ADV-AUTH-06: Tampered session state - Incomplete user objects (missing name or role)', () => {
    const incompleteObjects = [
      { email: 'test@example.com' }, // missing name and role
      { name: 'Only Name' },         // missing role
      { role: 'CANDIDATE' },         // missing name
      {}                             // empty
    ];

    for (const inc of incompleteObjects) {
      const env = createClientEnv(inc);
      const user = env.getState().currentUser;
      assert.strictEqual(user, null, 'Incomplete session object must be rejected');
      const gw = env.get('authGateway');
      assert.ok(gw.classList.contains('active'), 'Gateway must remain active');
    }
  });
});

describe('Adversarial Verification Suite 2: 1-Click Application Pipeline', () => {

  it('ADV-APP-01: Rapid repeated clicks on .btn-1click-apply prevents duplicate applications', () => {
    const env = createClientEnv();
    env.hireflowAuth.loginAs('CANDIDATE', 'aarav');

    const state = env.getState();
    const container = env.get('jobFeedContainer');
    assert.ok(container, 'jobFeedContainer exists');

    // Find job card that Aarav has NOT applied to yet (e.g. JOB-5C2F8B DevOps or JOB-3D7E1A)
    const unappliedCard = container.querySelector('[data-jobid="JOB-5C2F8B"]') || container.querySelector('[data-jobid="JOB-3D7E1A"]');
    assert.ok(unappliedCard, 'Unapplied job card must exist in feed');
    const targetJobId = unappliedCard.getAttribute('data-jobid');

    // Verify candidate has not applied yet to this job
    const initialAppsForJob = state.applications.filter(a => a.jobId === targetJobId && a.email === 'aarav.s@email.com');
    assert.strictEqual(initialAppsForJob.length, 0, 'Candidate should not have pre-existing application');

    // Find the 1-click apply button on the card
    const applyBtn = unappliedCard.querySelector('.btn-1click-apply');
    assert.ok(applyBtn, `1-Click apply button must exist on card for job ${targetJobId}`);

    // Simulate 5 rapid double-clicks / repeated spam clicks
    for (let i = 0; i < 5; i++) {
      applyBtn.click();
    }

    // Verify applications state
    const afterApps = state.applications.filter(a => a.jobId === targetJobId && a.email === 'aarav.s@email.com');
    assert.strictEqual(afterApps.length, 1, 'Must create EXACTLY 1 application record, preventing duplicate submissions');

    // Verify UI reflects applied status
    const refreshedCard = container.querySelector(`[data-jobid="${targetJobId}"]`);
    assert.ok(refreshedCard, 'Card must exist in refreshed feed');
    const appliedBtn = refreshedCard.querySelector('.btn-applied');
    assert.ok(appliedBtn, 'Card button must transition to .btn-applied');
    assert.strictEqual(appliedBtn.getAttribute('disabled'), 'true', 'Button must be disabled');
  });

  it('ADV-APP-02: 1-Click Apply with empty profile uses safe fallbacks without throwing', () => {
    const env = createClientEnv();
    env.hireflowAuth.loginAs('CANDIDATE', 'aarav');

    const state = env.getState();
    // Wipe profile fields to empty strings
    state.candidateProfile.name = '';
    state.candidateProfile.email = '';
    state.candidateProfile.headline = '';
    state.candidateProfile.rawResumeText = '';

    // Re-render feed with empty profile
    if (typeof env.window.renderJobFeed === 'function') {
      env.window.renderJobFeed();
    }

    const container = env.get('jobFeedContainer');
    const card = container.querySelector('[data-jobid="JOB-9A1D4E"]') || container.querySelector('[data-jobid="JOB-5C2F8B"]');
    assert.ok(card, 'Job card exists');
    const applyBtn = card.querySelector('.btn-1click-apply');
    assert.ok(applyBtn, 'Apply button exists');

    assert.doesNotThrow(() => {
      applyBtn.click();
    }, '1-Click apply must not throw even with empty profile');

    // Check newly created application has non-empty fallback metadata
    const created = state.applications.find(a => a.jobId === card.getAttribute('data-jobid'));
    assert.ok(created, 'Application must be created');
    assert.ok(created.candidateName && created.candidateName.length > 0, 'Candidate name fallback present');
    assert.ok(created.email && created.email.length > 0, 'Email fallback present');
  });

  it('ADV-APP-03: Applying with null skills array does not crash matching or rendering', () => {
    const env = createClientEnv();
    env.hireflowAuth.loginAs('CANDIDATE', 'aarav');

    const state = env.getState();
    state.candidateProfile.skills = null; // simulate null skills

    assert.doesNotThrow(() => {
      if (typeof env.window.renderCandidateProfileForm === 'function') {
        env.window.renderCandidateProfileForm();
      }
      if (typeof env.window.renderJobFeed === 'function') {
        env.window.renderJobFeed();
      }
    }, 'Rendering with null skills must handle safely without TypeError');
  });

  it('ADV-APP-04: Resume text with Unicode emojis, Asian characters, RTL, control chars, and large text', () => {
    const env = createClientEnv();
    env.hireflowAuth.loginAs('CANDIDATE', 'aarav');

    const adversarialResume = `
      🔥 Senior Architect 🚀 软件工程师 (Software Engineer)
      تجربة في تطوير البرمجيات والأنظمة الموزعة
      Special characters: \u0000\u001f\ufffd & <script>alert('XSS')</script>
      Core Skills: JAVA, SPRING BOOT, MICROSERVICES, DOCKER, SQL, KUBERNETES, KAFKA.
      Experience: 4 years designing distributed event-driven systems.
      ` + ' EXTRA_PADDING_TEXT_'.repeat(1000); // ~20KB string

    const state = env.getState();
    state.candidateProfile.rawResumeText = adversarialResume;

    assert.doesNotThrow(() => {
      if (typeof env.window.renderCandidateProfileForm === 'function') {
        env.window.renderCandidateProfileForm();
      }
    }, 'Profile telemetry and NLP parsing must handle complex Unicode and large text');

    // Verify telemetry updated
    const telemetry = env.get('candidateResumeTelemetry');
    assert.ok(telemetry.textContent.includes('skills'), 'Telemetry detected skills');
    assert.ok(telemetry.textContent.includes('4 yrs experience'), 'Telemetry detected experience correctly');
  });
});

describe('Adversarial Verification Suite 3: Backend REST API Robustness', () => {

  it('ADV-API-01: PUT /api/v1/organizations/:id returns HTTP 404 for non-existent org ID', async () => {
    const res = await apiRequest('/api/v1/organizations/ORG-NONEXISTENT-999', {
      method: 'PUT',
      body: { name: 'Fake Org', minScore: 80 }
    });

    assert.strictEqual(res.status, 404, 'Must return HTTP 404');
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'Organization not found');
  });

  it('ADV-API-02: PUT /api/v1/organizations/:id handles empty payload and missing fields without crashing', async () => {
    const res = await apiRequest('/api/v1/organizations/ORG-APEX88', {
      method: 'PUT',
      body: {}
    });

    assert.strictEqual(res.status, 200, 'Empty payload should be handled gracefully');
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.orgId, 'ORG-APEX88');
  });

  it('ADV-API-03: PUT /api/v1/organizations/:id with non-string subdomain does not crash server process', async () => {
    // Adversarial: body.subdomain is a number (checks if body.subdomain is safely coerced)
    const res = await apiRequest('/api/v1/organizations/ORG-APEX88', {
      method: 'PUT',
      body: { subdomain: 99999 }
    });

    // Server safely coerces subdomain to string and responds with HTTP 200
    assert.strictEqual(res.status, 200, 'Server should return HTTP 200 after safely coercing numeric subdomain');
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.customSubdomain, '99999.hireflow.ai', 'Subdomain properly sanitized to 99999.hireflow.ai');

    // Verify server remains responsive
    const health = await apiRequest('/api/v1/health');
    assert.strictEqual(health.status, 200, 'Server must remain responsive after malformed payload');
  });

  it('ADV-API-04: PUT /api/v1/jobs/:id returns HTTP 404 for non-existent job ID', async () => {
    const res = await apiRequest('/api/v1/jobs/JOB-DOESNOTEXIST-404', {
      method: 'PUT',
      body: { title: 'Ghost Job' }
    });

    assert.strictEqual(res.status, 404, 'Must return HTTP 404 for non-existent job');
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'Job not found');
  });

  it('ADV-API-05: PUT /api/v1/jobs/:id handles negative salaries without server crash', async () => {
    const res = await apiRequest('/api/v1/jobs/JOB-8F9A2C', {
      method: 'PUT',
      body: { minSalaryLPA: -10, maxSalaryLPA: -5 }
    });

    assert.strictEqual(res.status, 200, 'Should accept or handle without crash');
    assert.strictEqual(res.body.data.minSalaryLPA, -10);

    // Reset back to normal values
    await apiRequest('/api/v1/jobs/JOB-8F9A2C', {
      method: 'PUT',
      body: { minSalaryLPA: 22, maxSalaryLPA: 30 }
    });
  });

  it('ADV-API-06: PUT /api/v1/jobs/:id with empty skill arrays does not cause NaN or division by zero in shortlisting', async () => {
    // 1. Update job to have empty skills
    const updateRes = await apiRequest('/api/v1/jobs/JOB-8F9A2C', {
      method: 'PUT',
      body: { mandatorySkills: [], preferredSkills: [] }
    });
    assert.strictEqual(updateRes.status, 200);

    // 2. Request shortlist leaderboard
    const shortlistRes = await apiRequest('/api/v1/jobs/JOB-8F9A2C/shortlist');
    assert.strictEqual(shortlistRes.status, 200);
    assert.ok(Array.isArray(shortlistRes.body.leaderboard));

    // Verify every candidate score is a valid finite number, not NaN or Infinity
    for (const entry of shortlistRes.body.leaderboard) {
      assert.ok(Number.isFinite(entry.matchScorePercentage), 'matchScorePercentage must be finite');
      assert.ok(!Number.isNaN(entry.matchScorePercentage), 'matchScorePercentage must not be NaN');
      assert.ok(Number.isFinite(entry.compositeFormulaScore), 'compositeFormulaScore must be finite');
      assert.ok(!Number.isNaN(entry.compositeFormulaScore), 'compositeFormulaScore must not be NaN');
    }

    // Reset skills
    await apiRequest('/api/v1/jobs/JOB-8F9A2C', {
      method: 'PUT',
      body: {
        mandatorySkills: ['JAVA', 'SPRING BOOT', 'MICROSERVICES', 'DOCKER', 'SQL'],
        preferredSkills: ['KUBERNETES', 'KAFKA']
      }
    });
  });

  it('ADV-API-07: GET /api/v1/applications?email=... handles SQL injection strings gracefully', async () => {
    const sqliStrings = [
      "' OR '1'='1",
      "admin'--",
      "'; DROP TABLE applications; --",
      "' UNION SELECT * FROM users --",
      "\" OR \"\"=\"",
      "' OR 1=1#"
    ];

    for (const sqli of sqliStrings) {
      const res = await apiRequest(`/api/v1/applications?email=${encodeURIComponent(sqli)}`);
      assert.strictEqual(res.status, 200, `SQLi query "${sqli}" must return HTTP 200`);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data), 'Returns data array');
      assert.strictEqual(res.body.data.length, 0, `SQLi query "${sqli}" must not match any application`);
    }
  });

  it('ADV-API-08: GET /api/v1/applications?email=... immune to ReDoS and regex meta-characters', async () => {
    const redosStrings = [
      "(a+)+$",
      "([a-zA-Z0-9]+)*@([a-zA-Z0-9]+)*",
      ".*",
      "^.*$",
      "\\d{100}",
      "%00",
      ""
    ];

    for (const pattern of redosStrings) {
      const start = Date.now();
      const res = await apiRequest(`/api/v1/applications?email=${encodeURIComponent(pattern)}`);
      const duration = Date.now() - start;

      assert.strictEqual(res.status, 200, `ReDoS pattern "${pattern}" must return HTTP 200`);
      assert.strictEqual(res.body.success, true);
      assert.ok(duration < 200, `Execution time must be sub-200ms (actual: ${duration}ms, immune to ReDoS)`);
    }
  });

  it('ADV-API-09: POST /api/v1/applications with extreme Unicode payload and null values', async () => {
    const res = await apiRequest('/api/v1/applications', {
      method: 'POST',
      body: {
        candidateName: '🚀 Emoji Candidate 🌟',
        email: 'emoji.cand@tech.io',
        headline: 'حاسوب / 开发者',
        rawResumeText: 'Experienced in JAVA, SQL, and KAFKA with 3 years experience. 🚀 💻',
        expectedBaseSalaryLPA: -10 // edge case negative
      }
    });

    assert.strictEqual(res.status, 201, 'Must accept application with Unicode');
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.candidateName, '🚀 Emoji Candidate 🌟');
    assert.ok(res.body.aiProfile, 'AI profile generated for application');
    assert.ok(res.body.aiProfile.extractedSkills.includes('JAVA'));
    assert.strictEqual(res.body.aiProfile.detectedExperienceYears, 3);
  });
});

console.log('======================================================================');
console.log('✔ ADVERSARIAL VERIFICATION SUITE 1 DEFINED SUCCESSFULLY');
console.log('======================================================================');
