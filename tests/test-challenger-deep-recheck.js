/**
 * =============================================================================
 * HIREFLOW: INDEPENDENT CHALLENGER EMPIRICAL RE-VERIFICATION HARNESS
 * 
 * Deep stress-testing for the 3 remediated defects:
 * 1. Candidate Privilege Escalation blocked on recruiter/admin views and forms
 * 2. Tampered session roles (non-string, numeric, boolean, array, prototype) safely handled
 * 3. Non-string subdomain in PUT /organizations/:id safely sanitized without crashing
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

// Lightweight Mock DOM
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
    console: { log: () => {}, warn: () => {}, error: () => {} }
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
    hireflowAuth: mockWindow.hireflowAuth,
    vmSandbox: sandbox
  };
}

// In-Memory Server Capture
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

require(SERVER_JS_PATH);

if (capturedServer && typeof capturedServer.close === 'function') {
  capturedServer.close();
}

function apiRequest(urlPath, options = {}) {
  const { method = 'GET', headers = {}, body = null } = options;
  return new Promise((resolve, reject) => {
    if (!capturedServer) return reject(new Error('Server instance not captured.'));
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
      write(chunk, encoding, callback) { responseData += chunk.toString(); callback(); }
    });
    res.writeHead = (code, headHeaders = {}) => { statusCode = code; Object.assign(responseHeaders, headHeaders); };
    res.setHeader = (k, v) => { responseHeaders[k.toLowerCase()] = v; };
    res.getHeader = (k) => responseHeaders[k.toLowerCase()];
    res.on('finish', () => {
      let parsed = null;
      try { parsed = JSON.parse(responseData); } catch (e) { parsed = responseData; }
      resolve({ status: statusCode, headers: responseHeaders, body: parsed, rawBody: responseData });
    });
    capturedServer.emit('request', req, res);
  });
}

// =============================================================================
// EMPIRICAL CHALLENGER TEST SUITES
// =============================================================================

describe('Challenger Recheck Suite: Remediation 1 (Privilege Escalation on Recruiter Views)', () => {

  it('1.1: Candidate attempting switchMainTab to all recruiter & admin views is strictly blocked and redirected', () => {
    const env = createClientEnv();
    env.hireflowAuth.loginAs('CANDIDATE', 'aarav');
    const state = env.getState();
    assert.strictEqual(state.currentUser.role, 'CANDIDATE');

    const restrictedViews = [
      'recruiter-studio-view',
      'recruiter-pipeline-view',
      'workflow-view',
      'audit-view',
      'admin-view',
      'admin-settings-view'
    ];

    for (const viewId of restrictedViews) {
      const tab = env.query(`[data-tab="${viewId}"]`);
      if (tab) {
        tab.click();
      }
      const panel = env.get(viewId);
      if (panel) {
        assert.strictEqual(panel.classList.contains('active'), false,
          `Candidate MUST NOT be able to activate view "${viewId}"`);
      }
      const candidateView = env.get('candidate-jobs-view');
      assert.ok(candidateView && candidateView.classList.contains('active'),
        `Candidate MUST be redirected to candidate-jobs-view when attempting "${viewId}"`);
      assert.strictEqual(state.currentTab, 'candidate-jobs-view',
        `state.currentTab must remain candidate-jobs-view instead of "${viewId}"`);
    }
  });

  it('1.2: Candidate attempting to submit jobStudioForm cannot mutate or create requisitions', () => {
    const env = createClientEnv();
    env.hireflowAuth.loginAs('CANDIDATE', 'aarav');
    const state = env.getState();
    const initialJobs = JSON.stringify(state.jobs);

    // Fill form fields
    const titleInput = env.get('jobStudioTitle');
    if (titleInput) titleInput.value = 'Malicious Requisition by Candidate';
    const minSalInput = env.get('jobStudioMinSalary');
    if (minSalInput) minSalInput.value = '50';

    const studioForm = env.get('jobStudioForm');
    assert.ok(studioForm, 'jobStudioForm element exists');
    studioForm.dispatchEvent('submit');

    // Verify jobs catalog was NOT modified
    assert.strictEqual(JSON.stringify(state.jobs), initialJobs,
      'Jobs catalog must remain strictly unmodified when candidate submits studio form');
  });

  it('1.3: Candidate attempting to submit scorecard or modify kanban stage is blocked', () => {
    const env = createClientEnv();
    env.hireflowAuth.loginAs('CANDIDATE', 'aarav');
    const state = env.getState();
    const targetApp = state.applications[0];
    const originalStage = targetApp.kanbanStage;
    const originalDecisionsCount = (state.decisions || []).length;

    const appIdInput = env.get('scorecardAppId');
    if (appIdInput) appIdInput.value = targetApp.applicationId;

    // Trigger offer, hold, reject buttons
    const offerBtn = env.get('scorecardOfferBtn');
    if (offerBtn) offerBtn.click();
    const holdBtn = env.get('scorecardHoldBtn');
    if (holdBtn) holdBtn.click();
    const rejectBtn = env.get('scorecardRejectBtn');
    if (rejectBtn) rejectBtn.click();

    assert.strictEqual(targetApp.kanbanStage, originalStage,
      'Application kanban stage must not be modified by candidate');
    assert.strictEqual((state.decisions || []).length, originalDecisionsCount,
      'No decision record may be appended by candidate');
  });

  it('1.4: Recruiter HR and Admin users CAN access recruiter views, publish jobs, and submit scorecards', () => {
    const env = createClientEnv();
    env.hireflowAuth.loginAs('RECRUITER_HR', 'vikram');
    const state = env.getState();
    assert.strictEqual(state.currentUser.role, 'RECRUITER_HR');

    // Recruiter can navigate to recruiter-studio-view
    const studioTab = env.query('[data-tab="recruiter-studio-view"]');
    assert.ok(studioTab, 'recruiter-studio-view tab exists');
    studioTab.click();

    const studioPanel = env.get('recruiter-studio-view');
    assert.ok(studioPanel && studioPanel.classList.contains('active'),
      'Recruiter HR must be able to activate recruiter-studio-view');

    // Recruiter can click createNewJobBtn to create a new job
    const createNewBtn = env.get('createNewJobBtn');
    assert.ok(createNewBtn, 'createNewJobBtn exists');
    createNewBtn.click();

    // Recruiter can submit a new job
    const initialJobsCount = state.jobs.length;
    const titleInput = env.get('jobStudioTitle');
    if (titleInput) titleInput.value = 'Authorized Recruiter Job';
    const studioForm = env.get('jobStudioForm');
    if (studioForm) studioForm.dispatchEvent('submit');

    assert.strictEqual(state.jobs.length, initialJobsCount + 1,
      'Recruiter HR must be able to create job opening after clicking createNewJobBtn');
    assert.ok(state.jobs.some(j => j.title === 'Authorized Recruiter Job'),
      'Newly created job must exist in state.jobs');
  });

  it('1.5: Unauthenticated visitor (null currentUser) is blocked from mutating jobs and scorecards', () => {
    const env = createClientEnv();
    const state = env.getState();
    assert.strictEqual(state.currentUser, null);

    const initialJobsCount = state.jobs.length;
    const titleInput = env.get('jobStudioTitle');
    if (titleInput) titleInput.value = 'Anonymous Hacker Job';
    const studioForm = env.get('jobStudioForm');
    if (studioForm) studioForm.dispatchEvent('submit');

    assert.strictEqual(state.jobs.length, initialJobsCount,
      'Unauthenticated visitor must not be able to publish job');

    const targetApp = state.applications[0];
    const originalStage = targetApp.kanbanStage;
    const offerBtn = env.get('scorecardOfferBtn');
    if (offerBtn) offerBtn.click();

    assert.strictEqual(targetApp.kanbanStage, originalStage,
      'Unauthenticated visitor must not be able to modify stages');
  });
});

describe('Challenger Recheck Suite: Remediation 2 (Tampered Session Role Robustness)', () => {

  it('2.1: Non-string and numeric roles in sessionStorage do NOT throw unhandled exceptions and reset session safely', () => {
    const adversarialRoles = [
      1337,
      0,
      -1,
      3.14159,
      NaN,
      Infinity,
      true,
      false,
      ['RECRUITER_ADMIN'],
      [],
      { role: 'RECRUITER_ADMIN' },
      {},
      null,
      undefined
    ];

    for (const badRole of adversarialRoles) {
      assert.doesNotThrow(() => {
        const env = createClientEnv({ name: 'TamperedUser', role: badRole });
        const user = env.getState().currentUser;
        assert.strictEqual(user, null, `Role ${JSON.stringify(badRole)} must result in null user`);
        const gw = env.get('authGateway');
        assert.ok(gw && gw.classList.contains('active'), 'Gateway must be active');
        const capsule = env.get('userSessionCapsule');
        assert.strictEqual(capsule.style.display, 'none', 'Capsule must be hidden');
      }, `Failed on badRole: ${JSON.stringify(badRole)}`);
    }
  });

  it('2.2: Spoofed string roles and prototype attacks in sessionStorage are strictly rejected', () => {
    const maliciousStrings = [
      'SUPER_ADMIN',
      'ADMINISTRATOR',
      'ROOT',
      'HACKER',
      '__proto__',
      'constructor',
      'toString',
      'CANDIDATE ',   // trailing space
      'candidate',    // lowercase
      'Recruiter_hr', // mixed case
      ''              // empty
    ];

    for (const badString of maliciousStrings) {
      const env = createClientEnv({ name: 'Spoofer', role: badString });
      const user = env.getState().currentUser;
      assert.strictEqual(user, null, `Spoofed string role "${badString}" must be rejected`);
      const gw = env.get('authGateway');
      assert.ok(gw && gw.classList.contains('active'), 'Gateway must remain active');
    }
  });

  it('2.3: updateHeaderUserCapsule defensively handles malformed user objects without crash', () => {
    const env = createClientEnv();

    // Test calling loginAs with malformed roles, which executes updateHeaderUserCapsule internally
    const malformedRoles = [
      1337,
      0,
      false,
      true,
      ['ADMIN'],
      { nested: 1 },
      null,
      undefined,
      ''
    ];

    for (const badRole of malformedRoles) {
      assert.doesNotThrow(() => {
        env.hireflowAuth.loginAs(badRole);
        const state = env.getState();
        assert.ok(state.currentUser, 'Current user was assigned');
        const badgeEl = env.get('headerUserRoleBadge');
        assert.ok(badgeEl, 'Role badge element exists');
        assert.ok(typeof badgeEl.textContent === 'string', 'Badge textContent is a string');
      }, `loginAs crashed on role: ${JSON.stringify(badRole)}`);
    }
  });
});

describe('Challenger Recheck Suite: Remediation 3 (Subdomain Input Type Sanitization)', () => {

  it('3.1: PUT /api/v1/organizations/:id coerces various non-string subdomains without 500 error', async () => {
    const testCases = [
      { input: { subdomain: 99999 }, expected: '99999.hireflow.ai' },
      { input: { subdomain: 0 }, expected: '0.hireflow.ai' },
      { input: { subdomain: -42 }, expected: '-42.hireflow.ai' },
      { input: { subdomain: true }, expected: 'true.hireflow.ai' },
      { input: { subdomain: false }, expected: 'false.hireflow.ai' },
      { input: { subdomain: 123.456 }, expected: '123.456' }, // contains '.' so no suffix
      { input: { subdomain: 'alpha-beta' }, expected: 'alpha-beta.hireflow.ai' },
      { input: { subdomain: 'portal.company.com' }, expected: 'portal.company.com' },
      { input: { customSubdomain: 77777 }, expected: '77777' },
      { input: { customSubdomain: true }, expected: 'true' }
    ];

    for (const tc of testCases) {
      const res = await apiRequest('/api/v1/organizations/ORG-APEX88', {
        method: 'PUT',
        body: tc.input
      });

      assert.strictEqual(res.status, 200,
        `Expected status 200 for payload ${JSON.stringify(tc.input)}, got ${res.status}`);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.customSubdomain, tc.expected,
        `Expected customSubdomain "${tc.expected}", got "${res.body.data.customSubdomain}"`);
    }
  });

  it('3.2: Server health remains intact and responds 200 after extensive subdomain fuzzing', async () => {
    const healthRes = await apiRequest('/api/v1/health');
    assert.strictEqual(healthRes.status, 200);
    assert.strictEqual(healthRes.body.status, 'UP');
  });
});
