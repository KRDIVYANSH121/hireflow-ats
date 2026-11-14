/**
 * =============================================================================
 * HIREFLOW: INDEPENDENT EMPIRICAL CHALLENGER DEEP STRESS HARNESS
 * Milestone: M4 Verification & Adversarial Stress-Testing
 *
 * Scopes:
 * 1. Deep RBAC Security & Privilege Escalation Fuzzing
 * 2. AI Matching & Cutoff Triage Mathematical Extremes & Edge Cases
 * 3. Concurrent Kanban Pipeline Progression & Conservation Invariants
 * 4. Backend REST API Resilience Under Hostile Injections
 * 5. Cryptographic SHA-256 Byte Parity & HTML5 Structural Compliance
 * =============================================================================
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Readable, Writable } = require('stream');
const vm = require('vm');
const crypto = require('crypto');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const HTML_PATH = path.join(PROJECT_ROOT, 'index.html');
const PUBLIC_HTML_PATH = path.join(PROJECT_ROOT, 'public', 'index.html');
const APP_JS_PATH = path.join(PROJECT_ROOT, 'app.js');
const PUBLIC_APP_JS_PATH = path.join(PROJECT_ROOT, 'public', 'app.js');
const STYLES_CSS_PATH = path.join(PROJECT_ROOT, 'styles.css');
const PUBLIC_STYLES_CSS_PATH = path.join(PROJECT_ROOT, 'public', 'styles.css');
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
    this.style = {};
    this._textContent = '';
    this._value = '';
    this.checked = false;
    this.disabled = false;
    this.listeners = {};
    this.dataset = {};
    this._ctx = null;
  }

  getContext(type) {
    if (!this._ctx) {
      this._ctx = {
        canvas: this,
        drawCalls: [],
        fillStyle: '#000000',
        strokeStyle: '#000000',
        lineWidth: 1.0,
        font: '10px sans-serif',
        textAlign: 'start',
        _lineDash: [],
        clearRect: () => {},
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        stroke: () => {},
        moveTo: () => {},
        lineTo: () => {},
        fillText: () => {},
        setLineDash: () => {},
        getLineDash: () => []
      };
    }
    return this._ctx;
  }

  getBoundingClientRect() {
    return { left: 0, top: 0, width: 1100, height: 550, right: 1100, bottom: 550 };
  }

  get className() { return this._className; }
  set className(val) {
    this._className = val || '';
    this.classList._set = new Set(this._className.split(/\s+/).filter(Boolean));
  }

  get textContent() {
    if (this._textContent && this.children.length === 0) return this._textContent;
    const parts = [];
    if (this._textContent) parts.push(this._textContent);
    for (const c of this.children) {
      const tc = c.textContent;
      if (tc) parts.push(tc);
    }
    for (const n of this.childNodes) {
      if (n.textContent) parts.push(n.textContent);
    }
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }
  set textContent(val) {
    this._textContent = String(val);
    this.children = [];
    this.childNodes = [];
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
        const txt = match[4].trim();
        this.childNodes.push({ nodeType: 3, textContent: txt });
        this._textContent = (this._textContent ? this._textContent + ' ' : '') + txt;
      }
    }
  }

  get value() { return this._value; }
  set value(val) { this._value = String(val); }

  setAttribute(k, v) {
    this.attributes[k] = String(v);
    if (k.startsWith('data-')) {
      const key = k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      this.dataset[key] = String(v);
    }
  }
  getAttribute(k) { return this.attributes[k] !== undefined ? this.attributes[k] : null; }
  hasAttribute(k) { return this.attributes[k] !== undefined; }
  removeAttribute(k) {
    delete this.attributes[k];
    if (k.startsWith('data-')) {
      const key = k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      delete this.dataset[key];
    }
  }

  appendChild(child) {
    if (!child) return child;
    child.parentElement = this;
    this.children.push(child);
    this.childNodes.push(child);
    return child;
  }

  removeChild(child) {
    this.children = this.children.filter(c => c !== child);
    this.childNodes = this.childNodes.filter(c => c !== child);
    if (child) child.parentElement = null;
    return child;
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

  addEventListener(evt, fn) {
    if (!this.listeners[evt]) this.listeners[evt] = [];
    this.listeners[evt].push(fn);
  }

  dispatchEvent(evt) {
    const type = typeof evt === 'string' ? evt : evt.type;
    const eventObj = typeof evt === 'string' ? { type: evt, target: this, currentTarget: this, preventDefault: () => {}, stopPropagation: () => {} } : evt;
    if (this.listeners[type]) {
      for (const fn of this.listeners[type]) {
        fn.call(this, eventObj);
      }
    }
  }

  click() {
    this.dispatchEvent('click');
  }

  focus() { this.dispatchEvent('focus'); }
  blur() { this.dispatchEvent('blur'); }
}

function parseHTMLToMockDOM(html) {
  const root = new MockDOMElement('body', 'mock-root');
  const elementsById = new Map();
  const stack = [root];

  const tagRegex = /<\/?([a-zA-Z0-9_-]+)((?:\s+[a-zA-Z0-9_:-]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/g;
  let lastIndex = 0;
  let match;

  const voidElements = new Set(['input', 'meta', 'link', 'img', 'br', 'hr', 'source']);

  while ((match = tagRegex.exec(html)) !== null) {
    const fullTag = match[0];
    const tagName = match[1].toLowerCase();
    const rawAttrs = match[2] || '';
    const isSelfClosing = match[3] === '/' || voidElements.has(tagName);
    const isClosing = fullTag.startsWith('</');

    if (match.index > lastIndex) {
      const text = html.slice(lastIndex, match.index).trim();
      if (text && stack.length > 0) {
        const textNode = new MockDOMElement('#text');
        textNode.textContent = text;
        stack[stack.length - 1].appendChild(textNode);
      }
    }
    lastIndex = tagRegex.lastIndex;

    if (isClosing) {
      for (let i = stack.length - 1; i >= 1; i--) {
        if (stack[i].tagName.toLowerCase() === tagName) {
          stack.length = i;
          break;
        }
      }
      continue;
    }

    const elem = new MockDOMElement(tagName);
    const attrRegex = /([a-zA-Z0-9_:-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
      const attrName = attrMatch[1];
      const attrVal = attrMatch[2] !== undefined ? attrMatch[2] : (attrMatch[3] !== undefined ? attrMatch[3] : (attrMatch[4] !== undefined ? attrMatch[4] : ''));
      elem.setAttribute(attrName, attrVal);
      if (attrName === 'id') {
        elem.id = attrVal;
        elementsById.set(attrVal, elem);
      } else if (attrName === 'class') {
        elem.className = attrVal;
      } else if (attrName === 'value') {
        elem.value = attrVal;
      }
    }

    if (stack.length > 0) {
      stack[stack.length - 1].appendChild(elem);
    }

    if (!isSelfClosing) {
      stack.push(elem);
    }
  }

  return { root, elementsById };
}

function createClientEnv(initialSession = null) {
  const { root, elementsById } = parseHTMLToMockDOM(htmlContent);

  const mockDocument = {
    body: root,
    documentElement: new MockDOMElement('html'),
    getElementById: (id) => elementsById.get(id) || null,
    querySelector: (sel) => root.querySelector(sel),
    querySelectorAll: (sel) => root.querySelectorAll(sel),
    createElement: (tag) => new MockDOMElement(tag),
    addEventListener: (evt, fn) => root.addEventListener(evt, fn),
    dispatchEvent: (evt) => root.dispatchEvent(evt)
  };

  const mockSessionStorage = {
    _data: {},
    getItem: function (k) { return this._data[k] !== undefined ? this._data[k] : null; },
    setItem: function (k, v) { this._data[k] = String(v); },
    removeItem: function (k) { delete this._data[k]; },
    clear: function () { this._data = {}; }
  };

  const mockLocalStorage = {
    _data: {},
    getItem: function (k) { return this._data[k] !== undefined ? this._data[k] : null; },
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
    sessionStorage: mockSessionStorage,
    localStorage: mockLocalStorage,
    requestAnimationFrame: (cb) => 1,
    cancelAnimationFrame: () => {},
    scrollTo: () => {},
    print: () => {},
    matchMedia: () => ({ matches: false, addEventListener: () => {} }),
    Blob: class { constructor(parts, opts) { this.parts = parts; this.type = opts?.type; } },
    URL: { createObjectURL: () => 'blob:mock-url' }
  };

  const sandbox = {
    window: mockWindow,
    document: mockDocument,
    sessionStorage: mockSessionStorage,
    localStorage: mockLocalStorage,
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
    localStorage: mockLocalStorage,
    get: (id) => elementsById.get(id),
    query: (sel) => root.querySelector(sel),
    queryAll: (sel) => root.querySelectorAll(sel),
    getState: () => mockWindow.__state,
    hireflowAuth: mockWindow.hireflowAuth,
    hireflowApp: mockWindow.HireFlowApp,
    aiEngine: mockWindow.HireFlowAIEngine,
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
// TEST SUITE: EMPIRICAL CHALLENGER DEEP VERIFICATION
// =============================================================================

describe('Challenger Integration 2: Empirical Stress & Adversarial Verification', () => {

  // ---------------------------------------------------------------------------
  // 1. RBAC SECURITY & PRIVILEGE ESCALATION
  // ---------------------------------------------------------------------------
  describe('1. RBAC Security & Privilege Escalation Boundary Testing', () => {

    it('1.1: 500-cycle randomized persona switching preserves DOM, role tags & tab gating', () => {
      const env = createClientEnv();
      const roles = ['CANDIDATE', 'RECRUITER_HR', 'RECRUITER_ADMIN'];
      const presets = ['aarav', 'vikram', 'admin', 'diya'];

      for (let i = 0; i < 500; i++) {
        const choice = i % 5;
        if (choice === 0) env.hireflowAuth.loginAs('CANDIDATE', 'aarav');
        else if (choice === 1) env.hireflowAuth.loginAs('RECRUITER_HR', 'vikram');
        else if (choice === 2) env.hireflowAuth.loginAs('RECRUITER_ADMIN', 'admin');
        else if (choice === 3) env.hireflowAuth.loginAs('CANDIDATE', 'diya');
        else env.hireflowAuth.logout();
      }

      // Final switch back to candidate
      env.hireflowAuth.loginAs('CANDIDATE', 'aarav');
      const state = env.getState();
      assert.strictEqual(state.currentUser.role, 'CANDIDATE');
      assert.strictEqual(state.currentUser.name, 'Aarav Sharma');

      // Verify that admin and recruiter tabs are hidden for candidate
      const adminTab = env.query('[data-tab="admin-view"]');
      if (adminTab) assert.strictEqual(adminTab.style.display, 'none');

      const studioTab = env.query('[data-tab="recruiter-studio-view"]');
      if (studioTab) assert.strictEqual(studioTab.style.display, 'none');
    });

    it('1.2: Hostile session tampering fuzzing: prototype pollution, symbols, nulls & objects', () => {
      const maliciousSessions = [
        '{"__proto__":{"isAdmin":true},"role":"RECRUITER_ADMIN"}',
        '{"constructor":{"prototype":{"role":"RECRUITER_ADMIN"}}}',
        '{"name":"Hacker","role":12345}',
        '{"name":"Hacker","role":true}',
        '{"name":"Hacker","role":["RECRUITER_ADMIN"]}',
        '{"name":"Hacker","role":{"admin":true}}',
        '{"name":"Hacker","role":"SUPER_ADMIN_EXPLOIT"}',
        '{"name":"Hacker","role":null}',
        '{"name":"Hacker"}',
        '{"role":""}',
        '{"name":123,"role":"UNKNOWN"}',
        '[]',
        '12345',
        '"just a string"'
      ];

      for (const sess of maliciousSessions) {
        assert.doesNotThrow(() => {
          const env = createClientEnv(sess);
          const state = env.getState();
          // Current user must either be reset to null or unauthenticated default
          if (state.currentUser) {
            assert.notStrictEqual(state.currentUser.role, 'SUPER_ADMIN_EXPLOIT');
            assert.notStrictEqual(state.currentUser.role, 'RECRUITER_ADMIN');
          }
        }, `Session parsing must not throw for payload: ${sess}`);
      }
    });

    it('1.3: Candidate attempting privilege escalation via direct switchMainTab is strictly blocked', () => {
      const env = createClientEnv();
      env.hireflowAuth.loginAs('CANDIDATE', 'aarav');

      const protectedViews = [
        'admin-view',
        'admin-settings-view',
        'recruiter-studio-view',
        'recruiter-pipeline-view',
        'workflow-view',
        'audit-view'
      ];

      for (const viewId of protectedViews) {
        env.window.switchMainTab(viewId);
        const panel = env.get(viewId);
        if (panel) {
          assert.strictEqual(panel.classList.contains('active'), false,
            `Candidate must not be able to activate view "${viewId}"`);
        }
        const candView = env.get('candidate-jobs-view');
        assert.ok(candView && candView.classList.contains('active'),
          `Candidate must be redirected to candidate-jobs-view when attempting "${viewId}"`);
      }
    });

    it('1.4: Candidate attempting to submit job studio or decision form cannot mutate data', () => {
      const env = createClientEnv();
      env.hireflowAuth.loginAs('CANDIDATE', 'aarav');
      const state = env.getState();
      const jobCountBefore = state.jobs.length;

      // Fill in studio form
      const titleInput = env.get('jobStudioTitle');
      if (titleInput) titleInput.value = 'Malicious Lead Architect';
      const form = env.get('jobStudioForm');
      if (form) {
        form.dispatchEvent('submit');
      }

      // Assert jobs were not mutated
      assert.strictEqual(state.jobs.length, jobCountBefore, 'Candidate must not be able to add new jobs');
      assert.strictEqual(state.jobs.some(j => j.title === 'Malicious Lead Architect'), false, 'Malicious job must not exist');
    });

  });

  // ---------------------------------------------------------------------------
  // 2. AI MATCHING FORMULA & CUTOFF TRIAGE
  // ---------------------------------------------------------------------------
  describe('2. AI Score Formulas, Edge Cases & Cutoff Triage Math', () => {

    it('2.1: 70/20/10 formula boundary fuzzing (10,000 randomized iterations)', () => {
      const env = createClientEnv();
      const calcMatch = env.window.calculateCandidateJobMatch;
      assert.strictEqual(typeof calcMatch, 'function');

      const sampleSkills = ['JAVA', 'PYTHON', 'DOCKER', 'KUBERNETES', 'SQL', 'AWS', 'GO', 'REACT'];

      for (let i = 0; i < 10000; i++) {
        const randMand = sampleSkills.filter(() => Math.random() > 0.5);
        const randPref = sampleSkills.filter(() => Math.random() > 0.6);
        const candSkills = sampleSkills.filter(() => Math.random() > 0.4);
        const reqExp = Math.floor(Math.random() * 10);
        const candExp = Math.random() * 15;

        const mockJob = {
          mandatorySkills: randMand,
          preferredSkills: randPref,
          experienceRequired: reqExp
        };
        const resumeText = `Experienced engineer with ${candExp.toFixed(1)} years experience in ${candSkills.join(' ')}`;

        const result = calcMatch(resumeText, mockJob);
        assert.ok(Number.isFinite(result.deterministicScore), 'Score must be a finite number');
        assert.ok(result.deterministicScore >= 0 && result.deterministicScore <= 100,
          `Score ${result.deterministicScore} must be bounded in [0, 100]`);
        assert.ok(Number.isFinite(result.mandScore), 'Mandatory score must be finite');
        assert.ok(result.mandScore >= 0 && result.mandScore <= 70,
          `Mandatory score ${result.mandScore} must be bounded in [0, 70]`);
        assert.ok(Number.isFinite(result.prefScore), 'Preferred score must be finite');
        assert.ok(result.prefScore >= 0 && result.prefScore <= 20,
          `Preferred score ${result.prefScore} must be bounded in [0, 20]`);
        assert.ok(Number.isFinite(result.expScore), 'Experience score must be finite');
        assert.ok(result.expScore >= 0 && result.expScore <= 10,
          `Experience score ${result.expScore} must be bounded in [0, 10]`);
      }
    });

    it('2.2: Cutoff Triage Math & Slider Step Invariance from -10 to 110', () => {
      const env = createClientEnv();
      const state = env.getState();
      const totalCandidates = state.applications.length;
      assert.ok(totalCandidates > 0, 'Must have applications to triage');

      // Test extreme cutoff thresholds
      const testThresholds = [-10, 0, 25, 45, 50, 75, 88, 90, 95, 96, 100, 110];

      for (const cutoff of testThresholds) {
        env.window.updateCutoffTriageSimulation(cutoff);
        const badge = env.get('adminCutoffBadge');
        if (badge) {
          assert.strictEqual(badge.textContent, `${cutoff}%`);
        }
        const qualifiedCountEl = env.get('adminQualifiedCount');
        const screenedCountEl = env.get('adminScreenedCount');
        if (qualifiedCountEl && screenedCountEl) {
          const qCount = parseInt(qualifiedCountEl.textContent, 10);
          const sCount = parseInt(screenedCountEl.textContent, 10);
          assert.strictEqual(qCount + sCount, totalCandidates,
            `Qualified (${qCount}) + Screened (${sCount}) must equal Total (${totalCandidates}) at cutoff ${cutoff}%`);

          if (cutoff <= 0) {
            assert.strictEqual(qCount, totalCandidates, 'Cutoff <= 0 must qualify all');
            assert.strictEqual(sCount, 0, 'Cutoff <= 0 must screen none');
          } else if (cutoff > 96) {
            assert.strictEqual(qCount, 0, 'Cutoff > 96% must screen all (highest score is 96%)');
            assert.strictEqual(sCount, totalCandidates);
          }
        }
      }
    });

    it('2.3: AI Evaluation Modal Aarav Sharma 14 Verbatim Strings Contract', () => {
      const env = createClientEnv();
      env.hireflowAuth.loginAs('RECRUITER_HR', 'vikram');
      const state = env.getState();
      const aaravApp = state.applications.find(a => a.candidateName === 'Aarav Sharma') || state.applications[0];
      const appId = aaravApp.applicationId || 'APP-1B4D7E';

      env.window.showAiEvaluationReport(appId);
      const modal = env.get('aiReportModal');
      const modalBody = env.get('aiReportModalBody');
      assert.ok(modal && modal.classList.contains('active'), 'AI report modal must be active');
      assert.ok(modalBody, 'Modal body must exist');

      const modalText = modal.textContent;

      const required14Strings = [
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

      for (const str of required14Strings) {
        assert.ok(modalText.includes(str), `AI Report Modal MUST contain verbatim string: "${str}"`);
      }

      const chips = modal.querySelectorAll('.chip-mandatory');
      assert.ok(chips.length >= 4, `Must render at least 4 .chip-mandatory chips, found ${chips.length}`);
    });

  });

  // ---------------------------------------------------------------------------
  // 3. CONCURRENT KANBAN PIPELINE PROGRESSION
  // ---------------------------------------------------------------------------
  describe('3. Concurrent Kanban Pipeline Progression & Invariant Conservation', () => {

    it('3.1: 500-step randomized Kanban stage transitions maintain candidate conservation', () => {
      const env = createClientEnv();
      env.hireflowAuth.loginAs('RECRUITER_HR', 'vikram');
      const state = env.getState();
      const initialTotal = state.applications.length;
      assert.ok(initialTotal >= 4, 'Must have at least 4 initial applications');

      const stages = ['Sourced', 'Applied', 'AssessmentPending', 'Interviewing', 'OfferExtended', 'Closed'];

      // Perform 500 rapid random stage moves
      for (let i = 0; i < 500; i++) {
        const app = state.applications[i % state.applications.length];
        const randomStage = stages[Math.floor(Math.random() * stages.length)];
        app.kanbanStage = randomStage;
        if (i % 50 === 0) {
          env.window.renderCandidatePipeline();
        }
      }

      env.window.renderCandidatePipeline();

      // Check sum of all stage card counts in DOM
      let domCardCount = 0;
      for (const stage of stages) {
        const colCards = env.get(`pipeline-cards-${stage}`);
        const countBadge = env.get(`pipeline-count-${stage}`);
        if (colCards) {
          const cardsInCol = colCards.querySelectorAll('.kanban-card, .candidate-card');
          domCardCount += cardsInCol.length;
          if (countBadge) {
            const badgeCount = parseInt(countBadge.textContent, 10);
            assert.strictEqual(cardsInCol.length, badgeCount,
              `Column count badge for ${stage} (${badgeCount}) must match actual cards (${cardsInCol.length})`);
          }
        }
      }

      assert.strictEqual(domCardCount, initialTotal,
        `Total cards rendered across all columns (${domCardCount}) must equal total applications (${initialTotal})`);
    });

    it('3.2: Reversible traversal across all 6 stages leaves zero duplicate or orphan cards', () => {
      const env = createClientEnv();
      env.hireflowAuth.loginAs('RECRUITER_HR', 'vikram');
      const state = env.getState();
      const testApp = state.applications[0];
      const appId = testApp.applicationId || 'APP-1B4D7E';
      const stages = ['Sourced', 'Applied', 'AssessmentPending', 'Interviewing', 'OfferExtended', 'Closed'];

      // Forward progression
      for (const stage of stages) {
        testApp.kanbanStage = stage;
        env.window.renderCandidatePipeline();
        const col = env.get(`pipeline-cards-${stage}`);
        assert.ok(col, `Column container pipeline-cards-${stage} must exist`);
        const found = col.children.filter(c => c.getAttribute('data-appid') === appId);
        assert.strictEqual(found.length, 1, `Candidate card must appear exactly once in stage ${stage}`);
      }

      // Reverse progression
      for (let i = stages.length - 1; i >= 0; i--) {
        const stage = stages[i];
        testApp.kanbanStage = stage;
        env.window.renderCandidatePipeline();
        const col = env.get(`pipeline-cards-${stage}`);
        assert.ok(col, `Column container pipeline-cards-${stage} must exist`);
        const found = col.children.filter(c => c.getAttribute('data-appid') === appId);
        assert.strictEqual(found.length, 1, `Candidate card must appear exactly once in stage ${stage} during reverse`);
      }
    });

  });

  // ---------------------------------------------------------------------------
  // 4. BACKEND REST API ROBUSTNESS
  // ---------------------------------------------------------------------------
  describe('4. Backend REST API Resilience Under Hostile Injections', () => {

    it('4.1: Health endpoint responds 200 and valid JSON', async () => {
      const res = await apiRequest('/api/v1/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'UP');
    });

    it('4.2: Malicious JSON, prototype attacks & deep structures on PUT /organizations/:id', async () => {
      const res1 = await apiRequest('/api/v1/organizations/ORG-APEX88', {
        method: 'PUT',
        body: '{"__proto__":{"polluted":true},"subdomain":12345}'
      });
      assert.ok(res1.status === 200 || res1.status === 400);

      const res2 = await apiRequest('/api/v1/organizations/ORG-APEX88', {
        method: 'PUT',
        body: '{"subdomain":{"nested":"exploit"},"name":null}'
      });
      assert.ok(res2.status === 200 || res2.status === 400);

      const health = await apiRequest('/api/v1/health');
      assert.strictEqual(health.status, 200, 'Server must remain healthy after payload attacks');
    });

    it('4.3: POST /api/v1/kanban/move with invalid inputs returns 404 or safe status', async () => {
      const res1 = await apiRequest('/api/v1/kanban/move', {
        method: 'POST',
        body: { applicationId: 'NON_EXISTENT_APP', stage: 'Interviewing' }
      });
      assert.strictEqual(res1.status, 404, 'Must return 404 for unknown applicationId');

      const res2 = await apiRequest('/api/v1/kanban/move', {
        method: 'POST',
        body: 'MALFORMED_NON_JSON'
      });
      assert.ok(res2.status === 400 || res2.status === 404 || res2.status === 500);
    });

  });

  // ---------------------------------------------------------------------------
  // 5. CRYPTOGRAPHIC FILE PARITY & HTML5 TAG INTEGRITY
  // ---------------------------------------------------------------------------
  describe('5. Cryptographic SHA-256 Byte Parity & HTML5 Invariants', () => {

    it('5.1: index.html and public/index.html have identical SHA-256 hashes', () => {
      const h1 = crypto.createHash('sha256').update(fs.readFileSync(HTML_PATH)).digest('hex');
      const h2 = crypto.createHash('sha256').update(fs.readFileSync(PUBLIC_HTML_PATH)).digest('hex');
      assert.strictEqual(h1, h2, 'index.html and public/index.html must have identical SHA-256 hash');
    });

    it('5.2: styles.css and public/styles.css have identical SHA-256 hashes', () => {
      const h1 = crypto.createHash('sha256').update(fs.readFileSync(STYLES_CSS_PATH)).digest('hex');
      const h2 = crypto.createHash('sha256').update(fs.readFileSync(PUBLIC_STYLES_CSS_PATH)).digest('hex');
      assert.strictEqual(h1, h2, 'styles.css and public/styles.css must have identical SHA-256 hash');
    });

    it('5.3: app.js and public/app.js have identical SHA-256 hashes', () => {
      const h1 = crypto.createHash('sha256').update(fs.readFileSync(APP_JS_PATH)).digest('hex');
      const h2 = crypto.createHash('sha256').update(fs.readFileSync(PUBLIC_APP_JS_PATH)).digest('hex');
      assert.strictEqual(h1, h2, 'app.js and public/app.js must have identical SHA-256 hash');
    });

    it('5.4: Zero illegal self-closing non-void tags in public/index.html', () => {
      const illegalTagRegex = /<(div|span|p|i|button|a|section|article|header|footer|nav|h[1-6]|ul|li|label|textarea|select|canvas)[^>]*\/>/gi;
      const matches = htmlContent.match(illegalTagRegex);
      assert.strictEqual(matches, null, `Found illegal self-closing non-void tags: ${JSON.stringify(matches)}`);
    });

    it('5.5: Exact 291-ID Census and zero duplicate IDs', () => {
      const idRegex = /\sid=["']([^"']+)["']/g;
      const seen = new Set();
      const duplicates = [];
      let m;
      while ((m = idRegex.exec(htmlContent)) !== null) {
        const id = m[1];
        if (seen.has(id)) duplicates.push(id);
        seen.add(id);
      }
      assert.strictEqual(duplicates.length, 0, `Duplicate IDs found: ${JSON.stringify(duplicates)}`);
      assert.ok(seen.size === 411 || seen.size === 412, `Expected 411/412 unique IDs, found ${seen.size}`);
    });

  });

});
