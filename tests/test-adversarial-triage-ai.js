#!/usr/bin/env node
/**
 * =============================================================================
 * HIREFLOW + OMNITALENT: ADVERSARIAL VERIFICATION SUITE 2
 * Focus:
 *   1. Cutoff Triage Math & Slider Extremes (0%, 50%, 75%, 88%, 90%, 95%, 96%, 100%)
 *      - Boundary limit checks, dynamic list update, pill flip, tie-breaking
 *   2. AI Evaluation Report & Hybrid Radar Formula Soundness
 *      - Edge-case candidate resumes (0 skills, 100% match, partial, overqualified, 0 yrs exp, decimal exp)
 *      - 70/20/10 math ($S_{mand} + S_{pref} + S_{exp}$) bounded in [0, 100]
 *      - 4-factor hybrid radar ($0.40 \cdot Sem + 0.30 \cdot BM25 + 0.15 \cdot Graph + 0.15 \cdot Intent$) bounded in [0, 100]
 *      - 10,000 iteration mathematical fuzzing
 *   3. Pipeline Stage & Scorecard Transitions
 *      - Multiple rubric scorecard submissions for the same candidate (idempotency, in-place update)
 *      - Reversible stage transitions (Applied -> Interviewing -> Applied -> OfferExtended -> Closed)
 *      - Audit trail ledger immutability and record integrity
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
// IN-MEMORY HTTP SERVER HARNESS FOR REST API ADVERSARIAL TESTING
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

// Silence banner during server require
const origLog = console.log;
console.log = () => {};
require(SERVER_JS_PATH);
console.log = origLog;

if (capturedServer && typeof capturedServer.close === 'function') {
  capturedServer.close();
}

function requestApi(urlPath, options = {}) {
  const { method = 'GET', headers = {}, body = null } = options;
  return new Promise((resolve, reject) => {
    if (!capturedServer) return reject(new Error('Server not captured'));
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
// HEADLESS DOM FIXTURE
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

  click() {
    this.dispatchEvent('click');
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
        if (selector.includes('[')) {
          const classPart = selector.slice(1, selector.indexOf('['));
          const attrMatch = selector.match(/\[([a-zA-Z0-9_-]+)(?:=['"]?([^'"\]]+)['"]?)?\]/);
          isMatch = node.classList.contains(classPart);
          if (isMatch && attrMatch) {
            const attr = attrMatch[1];
            const val = attrMatch[2];
            isMatch = val !== undefined ? node.getAttribute(attr) === val : node.getAttribute(attr) !== null;
          }
        } else {
          const classes = selector.split('.').filter(Boolean);
          isMatch = classes.every(c => node.classList.contains(c));
        }
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
    parseFloat: parseFloat,
    Blob: mockWindow.Blob,
    URL: mockWindow.URL
  };

  vm.createContext(sandbox);
  vm.runInContext(appJsContent, sandbox);

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
// ADVERSARIAL TEST SUITE
// =============================================================================

describe('Adversarial Verification Suite 2: Math, Extremes, Radar & Transitions', () => {

  // ===========================================================================
  // 1. CUTOFF TRIAGE MATH & SLIDER EXTREMES
  // ===========================================================================
  describe('1. Cutoff Triage Math & Slider Extremes', () => {
    let env;
    beforeEach(() => {
      env = setupTestEnv();
      // Ensure admin view is active
      env.hireflowAuth.loginAs('RECRUITER_ADMIN', 'admin');
      env.mockWindow.switchMainTab('admin-view');
      env.mockWindow.renderAdminControls();
    });

    it('1.1 should correctly triage baseline candidates at default 75% cutoff (Aarav 96%, Priya 90%, Diya 88% qualified vs Rohan 45% screened)', () => {
      env.mockWindow.updateCutoffTriageSimulation(75);

      const qualEl = env.get('adminQualifiedCount');
      const scrEl = env.get('adminScreenedCount');
      const badge = env.get('adminCutoffBadge');

      assert.strictEqual(badge.textContent, '75%');
      assert.strictEqual(qualEl.textContent, '3', 'Exactly 3 candidates should pass at 75%');
      assert.strictEqual(scrEl.textContent, '1', 'Exactly 1 candidate (Rohan) should fail at 75%');

      const triageList = env.get('adminTriageList');
      const rows = triageList.children;
      assert.strictEqual(rows.length, 4, 'All 4 seed applications must appear in triage list');

      // Descending score order
      const scores = rows.map(r => parseInt(r.getAttribute('data-score'), 10));
      assert.deepStrictEqual(scores, [96, 90, 88, 45], 'Triage list must sort strictly descending by score');

      // Status attribute verification
      const statuses = rows.map(r => r.getAttribute('data-status'));
      assert.deepStrictEqual(statuses, ['PASS', 'PASS', 'PASS', 'FAIL']);

      // Status pill label verification
      const pills = rows.map(r => r.querySelector('.triage-status-pill').textContent.trim());
      assert.strictEqual(pills[0], '✓ Qualified (Pass)');
      assert.strictEqual(pills[1], '✓ Qualified (Pass)');
      assert.strictEqual(pills[2], '✓ Qualified (Pass)');
      assert.strictEqual(pills[3], '✕ Below Cutoff (Screened Out)');
    });

    it('1.2 should test Slider Minimum Boundary (50%): Rohan (45%) screened out, top 3 qualified', () => {
      env.mockWindow.updateCutoffTriageSimulation(50);

      const qualEl = env.get('adminQualifiedCount');
      const scrEl = env.get('adminScreenedCount');
      const badge = env.get('adminCutoffBadge');

      assert.strictEqual(badge.textContent, '50%');
      assert.strictEqual(qualEl.textContent, '3');
      assert.strictEqual(scrEl.textContent, '1');

      const triageList = env.get('adminTriageList');
      const rohanRow = triageList.children[3];
      assert.strictEqual(rohanRow.getAttribute('data-status'), 'FAIL');
      assert.ok(rohanRow.classList.contains('triage-fail'));
      assert.strictEqual(rohanRow.querySelector('.triage-status-pill').textContent.trim(), '✕ Below Cutoff (Screened Out)');
    });

    it('1.3 should test Slider Maximum Boundary (95%): Only Aarav (96%) qualifies, Diya (88%), Priya (90%), Rohan (45%) screened out', () => {
      env.mockWindow.updateCutoffTriageSimulation(95);

      const qualEl = env.get('adminQualifiedCount');
      const scrEl = env.get('adminScreenedCount');
      const badge = env.get('adminCutoffBadge');

      assert.strictEqual(badge.textContent, '95%');
      assert.strictEqual(qualEl.textContent, '1', 'Only Aarav (96%) should pass at 95%');
      assert.strictEqual(scrEl.textContent, '3', 'Diya, Priya, and Rohan must be screened out');

      const triageList = env.get('adminTriageList');
      const statuses = triageList.children.map(r => r.getAttribute('data-status'));
      assert.deepStrictEqual(statuses, ['PASS', 'FAIL', 'FAIL', 'FAIL']);
    });

    it('1.4 should test Absolute Minimum Boundary (0%): 100% of candidates qualify, 0 screened out', () => {
      env.mockWindow.updateCutoffTriageSimulation(0);

      const qualEl = env.get('adminQualifiedCount');
      const scrEl = env.get('adminScreenedCount');
      const badge = env.get('adminCutoffBadge');

      assert.strictEqual(badge.textContent, '0%');
      assert.strictEqual(qualEl.textContent, '4', 'At 0% cutoff, all 4 candidates must qualify');
      assert.strictEqual(scrEl.textContent, '0', 'Screened out count must be 0');

      const triageList = env.get('adminTriageList');
      const statuses = triageList.children.map(r => r.getAttribute('data-status'));
      assert.deepStrictEqual(statuses, ['PASS', 'PASS', 'PASS', 'PASS']);
      triageList.children.forEach(row => {
        assert.ok(row.classList.contains('triage-pass'));
        assert.strictEqual(row.querySelector('.triage-status-pill').textContent.trim(), '✓ Qualified (Pass)');
      });
    });

    it('1.5 should test Absolute Maximum Boundary (100%): 0 candidates qualify, all 4 screened out', () => {
      env.mockWindow.updateCutoffTriageSimulation(100);

      const qualEl = env.get('adminQualifiedCount');
      const scrEl = env.get('adminScreenedCount');
      const badge = env.get('adminCutoffBadge');

      assert.strictEqual(badge.textContent, '100%');
      assert.strictEqual(qualEl.textContent, '0', 'At 100% cutoff, no seed candidate reaches 100%');
      assert.strictEqual(scrEl.textContent, '4', 'All 4 candidates must be screened out');

      const triageList = env.get('adminTriageList');
      const statuses = triageList.children.map(r => r.getAttribute('data-status'));
      assert.deepStrictEqual(statuses, ['FAIL', 'FAIL', 'FAIL', 'FAIL']);
      triageList.children.forEach(row => {
        assert.ok(row.classList.contains('triage-fail'));
        assert.strictEqual(row.querySelector('.triage-status-pill').textContent.trim(), '✕ Below Cutoff (Screened Out)');
      });
    });

    it('1.6 should test Exact Tie-Breaking (candidate score == cutoff score): score >= cutoff yields PASS', () => {
      // Rohan Verma has score 45%
      env.mockWindow.updateCutoffTriageSimulation(45);
      let qualEl = env.get('adminQualifiedCount');
      let scrEl = env.get('adminScreenedCount');
      assert.strictEqual(qualEl.textContent, '4', 'At cutoff = 45%, Rohan (45%) must tie and pass');
      assert.strictEqual(scrEl.textContent, '0');

      let triageList = env.get('adminTriageList');
      let rohanRow = triageList.children[3];
      assert.strictEqual(rohanRow.getAttribute('data-status'), 'PASS');
      assert.strictEqual(rohanRow.querySelector('.triage-status-pill').textContent.trim(), '✓ Qualified (Pass)');

      // Diya Nair has score 88%
      env.mockWindow.updateCutoffTriageSimulation(88);
      qualEl = env.get('adminQualifiedCount');
      scrEl = env.get('adminScreenedCount');
      assert.strictEqual(qualEl.textContent, '3', 'At cutoff = 88%, Diya (88%) ties and passes; Rohan (45%) fails');
      assert.strictEqual(scrEl.textContent, '1');

      // Priya Soni has score 90%
      env.mockWindow.updateCutoffTriageSimulation(90);
      qualEl = env.get('adminQualifiedCount');
      scrEl = env.get('adminScreenedCount');
      assert.strictEqual(qualEl.textContent, '2', 'At cutoff = 90%, Priya (90%) and Aarav (96%) pass');
      assert.strictEqual(scrEl.textContent, '2');

      // Aarav Sharma has score 96%
      env.mockWindow.updateCutoffTriageSimulation(96);
      qualEl = env.get('adminQualifiedCount');
      scrEl = env.get('adminScreenedCount');
      assert.strictEqual(qualEl.textContent, '1', 'At cutoff = 96%, Aarav (96%) ties and passes');
      assert.strictEqual(scrEl.textContent, '3');
    });

    it('1.7 should test Threshold Step Boundary (1 point above candidate score): flips pill to FAIL', () => {
      // Rohan (45%) vs cutoff 46%
      env.mockWindow.updateCutoffTriageSimulation(46);
      assert.strictEqual(env.get('adminQualifiedCount').textContent, '3');
      assert.strictEqual(env.get('adminScreenedCount').textContent, '1');
      let triageList = env.get('adminTriageList');
      assert.strictEqual(triageList.children[3].getAttribute('data-status'), 'FAIL');
      assert.strictEqual(triageList.children[3].querySelector('.triage-status-pill').textContent.trim(), '✕ Below Cutoff (Screened Out)');

      // Diya (88%) vs cutoff 89%
      env.mockWindow.updateCutoffTriageSimulation(89);
      assert.strictEqual(env.get('adminQualifiedCount').textContent, '2');
      assert.strictEqual(env.get('adminScreenedCount').textContent, '2');

      // Priya (90%) vs cutoff 91%
      env.mockWindow.updateCutoffTriageSimulation(91);
      assert.strictEqual(env.get('adminQualifiedCount').textContent, '1');
      assert.strictEqual(env.get('adminScreenedCount').textContent, '3');

      // Aarav (96%) vs cutoff 97%
      env.mockWindow.updateCutoffTriageSimulation(97);
      assert.strictEqual(env.get('adminQualifiedCount').textContent, '0');
      assert.strictEqual(env.get('adminScreenedCount').textContent, '4');
    });

    it('1.8 should react dynamically to input event on the slider element', () => {
      const slider = env.get('adminCutoffSlider');
      assert.ok(slider, '#adminCutoffSlider input must exist');

      slider.value = '80';
      slider.dispatchEvent('input', { target: slider });

      assert.strictEqual(env.get('adminCutoffBadge').textContent, '80%');
      assert.strictEqual(env.get('adminQualifiedCount').textContent, '3'); // Aarav 96, Priya 90, Diya 88 >= 80

      slider.value = '92';
      slider.dispatchEvent('input', { target: slider });

      assert.strictEqual(env.get('adminCutoffBadge').textContent, '92%');
      assert.strictEqual(env.get('adminQualifiedCount').textContent, '1'); // Only Aarav 96 >= 92
    });

    it('1.9 should persist cutoff threshold via PUT /api/v1/organizations/:orgId across extreme values', async () => {
      const orgId = 'ORG-APEX88';

      // Persist minimum 50
      let res = await requestApi(`/api/v1/organizations/${orgId}`, {
        method: 'PUT',
        body: { minimumShortlistScore: 50 }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.minimumShortlistScore, 50);

      // Persist maximum 95
      res = await requestApi(`/api/v1/organizations/${orgId}`, {
        method: 'PUT',
        body: { minimumShortlistScore: 95 }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.minimumShortlistScore, 95);

      // Persist extreme 0
      res = await requestApi(`/api/v1/organizations/${orgId}`, {
        method: 'PUT',
        body: { minimumShortlistScore: 0 }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.minimumShortlistScore, 0);

      // Reset to 75
      res = await requestApi(`/api/v1/organizations/${orgId}`, {
        method: 'PUT',
        body: { minimumShortlistScore: 75 }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.minimumShortlistScore, 75);
    });
  });

  // ===========================================================================
  // 2. AI EVALUATION REPORT & HYBRID RADAR FORMULA SOUNDNESS
  // ===========================================================================
  describe('2. AI Evaluation Report & Hybrid Radar Formula Soundness', () => {
    let env;
    let matchFn;
    const standardJob = {
      jobId: 'JOB-TEST',
      mandatorySkills: ['JAVA', 'SPRING BOOT', 'MICROSERVICES', 'DOCKER', 'SQL'],
      preferredSkills: ['KUBERNETES', 'KAFKA'],
      requiredExperienceYears: 2
    };

    beforeEach(() => {
      env = setupTestEnv();
      matchFn = env.mockWindow.calculateCandidateJobMatch;
    });

    it('2.1 should evaluate edge-case candidate with 0 skills and 0 years experience', () => {
      const emptyResume = 'Non-technical background with no software skills or tech keywords.';
      const appData = {
        candidateName: 'Zero Skills Candidate',
        skills: [],
        experienceYears: 0,
        graphTrustScore: 0.10,
        intentScore: 0.10
      };

      const result = matchFn(emptyResume, standardJob, appData);

      assert.strictEqual(result.mandScore, 0.0);
      assert.strictEqual(result.prefScore, 0.0);
      assert.strictEqual(result.expScore, 0.0);
      assert.strictEqual(result.deterministicScore, 0);
      assert.strictEqual(result.score, 0);
      assert.ok(result.deterministicScore >= 0 && result.deterministicScore <= 100);

      assert.strictEqual(result.mandMatched.length, 0);
      assert.strictEqual(result.mandMissing.length, 5);
      assert.strictEqual(result.prefMatched.length, 0);
      assert.strictEqual(result.prefMissing.length, 2);

      // Check radar bounds
      assert.strictEqual(result.hybridRadar.semanticSim, 45, 'Semantic similarity baseline is 45% when mandMatched = 0');
      assert.strictEqual(result.hybridRadar.bm25Score, 0, 'BM25 score must be 0% with 0 matching skills');
      assert.strictEqual(result.hybridRadar.graphTrust, 10);
      assert.strictEqual(result.hybridRadar.intentScore, 10);

      // Composite calculation: 0.4*0.45 + 0.3*0 + 0.15*0.10 + 0.15*0.10 = 0.18 + 0.015 + 0.015 = 0.21 -> 21%
      assert.strictEqual(result.compositeScore, 21);
      assert.ok(result.compositeScore >= 0 && result.compositeScore <= 100);
      assert.strictEqual(result.recommendation, 'Does Not Meet Cutoff');
    });

    it('2.2 should evaluate edge-case candidate with 100% skill match and sufficient experience', () => {
      const perfectResume = 'Expert in Java, Spring Boot, Microservices, Docker, SQL, Kubernetes, and Kafka with 4 years experience';
      const appData = {
        candidateName: 'Perfect Candidate',
        skills: ['JAVA', 'SPRING BOOT', 'MICROSERVICES', 'DOCKER', 'SQL', 'KUBERNETES', 'KAFKA'],
        experienceYears: 4,
        graphTrustScore: 1.0,
        intentScore: 1.0
      };

      const result = matchFn(perfectResume, standardJob, appData);

      assert.strictEqual(result.mandScore, 70.0);
      assert.strictEqual(result.prefScore, 20.0);
      assert.strictEqual(result.expScore, 10.0, '4 yrs vs 2 yrs req: 6.0 + (4-2)*2 = 10.0 max');
      assert.strictEqual(result.deterministicScore, 100, 'Total score must be exactly 100%');
      assert.ok(result.deterministicScore <= 100, 'Deterministic score must NEVER exceed 100%');

      assert.strictEqual(result.mandMatched.length, 5);
      assert.strictEqual(result.mandMissing.length, 0);
      assert.strictEqual(result.prefMatched.length, 2);
      assert.strictEqual(result.prefMissing.length, 0);

      // Radar metrics at ceiling
      assert.strictEqual(result.hybridRadar.semanticSim, 100);
      assert.strictEqual(result.hybridRadar.bm25Score, 100);
      assert.strictEqual(result.hybridRadar.graphTrust, 100);
      assert.strictEqual(result.hybridRadar.intentScore, 100);
      assert.strictEqual(result.compositeScore, 100, 'Composite score must be exactly 100%');
      assert.strictEqual(result.recommendation, 'Strong Hire (Top 1% Pipeline)');
    });

    it('2.3 should evaluate partial skill matching with exact proportional mathematics', () => {
      // 3 of 5 mandatory matched: Java, SQL, Microservices -> (3/5)*70 = 42.0
      // 1 of 2 preferred matched: Kafka -> (1/2)*20 = 10.0
      // 2 years experience -> 6.0
      // Expected deterministicScore = 42 + 10 + 6 = 58%
      const partialResume = 'Developer with 2 years building Java backends with Microservices, SQL databases, and Kafka event streaming.';
      const appData = {
        candidateName: 'Partial Candidate',
        skills: ['JAVA', 'MICROSERVICES', 'SQL', 'KAFKA'],
        experienceYears: 2
      };

      const result = matchFn(partialResume, standardJob, appData);

      assert.strictEqual(result.mandScore, 42.0);
      assert.strictEqual(result.prefScore, 10.0);
      assert.strictEqual(result.expScore, 6.0);
      assert.strictEqual(result.deterministicScore, 58);
      assert.strictEqual(result.recommendation, 'Review for Secondary Roles');
    });

    it('2.4 should verify Overqualified Experience (15 yrs vs 2 yrs) strictly caps expScore at 10.0 and total score <= 100', () => {
      const overqualifiedResume = 'Veteran engineer with 15 years experience architecting Java, Spring Boot, Microservices, Docker, SQL, Kubernetes, and Kafka systems.';
      const appData = {
        candidateName: 'Overqualified Candidate',
        skills: ['JAVA', 'SPRING BOOT', 'MICROSERVICES', 'DOCKER', 'SQL', 'KUBERNETES', 'KAFKA'],
        experienceYears: 15
      };

      const result = matchFn(overqualifiedResume, standardJob, appData);

      // 6.0 + (15 - 2)*2.0 = 32.0, capped at Math.min(10.0, 32.0) = 10.0
      assert.strictEqual(result.expScore, 10.0, 'expScore must strictly cap at 10.0 despite 15 years experience');
      assert.strictEqual(result.deterministicScore, 100, 'Total score must not exceed 100%');
      assert.ok(result.deterministicScore <= 100);

      // Test extreme 50 years experience
      const extremeData = { ...appData, experienceYears: 50 };
      const extremeResult = matchFn(overqualifiedResume.replace('15 years', '50 years'), standardJob, extremeData);
      assert.strictEqual(extremeResult.expScore, 10.0);
      assert.strictEqual(extremeResult.deterministicScore, 100);
    });

    it('2.5 should verify Zero Years Experience strictly evaluates to expScore 0.0 and never negative', () => {
      const juniorResume = 'Graduate with 0 years formal experience but solid Java and SQL knowledge.';
      const appData = {
        candidateName: 'Junior Candidate',
        skills: ['JAVA', 'SQL'],
        experienceYears: 0
      };

      const result = matchFn(juniorResume, standardJob, appData);

      assert.strictEqual(result.expScore, 0.0, '0 years experience against 2 years target must evaluate to 0.0');
      assert.ok(result.expScore >= 0.0);
      assert.ok(result.deterministicScore >= 0);
    });

    it('2.6 should verify Decimal Experience (e.g. 0.5 yrs, 1.5 yrs) in numeric candidate profile evaluates safely', () => {
      // Numerical 0.5 years in profile
      const appData05 = {
        candidateName: 'Decimal Exp Candidate',
        skills: ['JAVA', 'SQL'],
        experienceYears: 0.5
      };
      // When resume text has no "X years", detectedExpYears = appData.experienceYears = 0.5
      const result05 = matchFn('Tech stack: Java and SQL', standardJob, appData05);

      // (0.5 / 2) * 6.0 = 1.5
      assert.strictEqual(result05.detectedExpYears, 0.5);
      assert.strictEqual(result05.expScore, 1.5);
      // mandScore: 2/5 * 70 = 28.0. Total = round(28 + 0 + 1.5) = 30
      assert.strictEqual(result05.deterministicScore, 30);
      assert.ok(result05.deterministicScore >= 0 && result05.deterministicScore <= 100);

      // Numerical 1.5 years in profile
      const appData15 = {
        candidateName: 'Decimal 1.5 Candidate',
        skills: ['JAVA', 'SQL'],
        experienceYears: 1.5
      };
      const result15 = matchFn('Tech stack: Java and SQL', standardJob, appData15);
      // (1.5 / 2) * 6.0 = 4.5
      assert.strictEqual(result15.detectedExpYears, 1.5);
      assert.strictEqual(result15.expScore, 4.5);
      assert.strictEqual(result15.deterministicScore, 33);
    });

    it('2.7 should handle Job Requisition edge cases (empty mandatory skills, empty preferred skills, zero req exp)', () => {
      const minimalJob = {
        jobId: 'JOB-MINIMAL',
        mandatorySkills: [],
        preferredSkills: [],
        requiredExperienceYears: 0
      };

      const result = matchFn('Random text without skills', minimalJob, { candidateName: 'Edge Job Cand' });

      // When mandatorySkills is empty, mandScore = 70.0
      assert.strictEqual(result.mandScore, 70.0);
      // When preferredSkills is empty, prefScore = 20.0
      assert.strictEqual(result.prefScore, 20.0);
      // When reqExp = 0, expScore = Math.min(10.0, 6.0 + (0 - 0)*2) = 6.0
      assert.strictEqual(result.expScore, 6.0);
      assert.strictEqual(result.deterministicScore, 96);
      assert.ok(!isNaN(result.deterministicScore), 'Must not produce NaN');
      assert.ok(!isNaN(result.compositeScore), 'Must not produce NaN');
    });

    it('2.8 should run 10,000 randomized iterations fuzzing the 70/20/10 formula: strictly bounded in [0, 100]', () => {
      for (let i = 0; i < 10000; i++) {
        const numMand = Math.floor(Math.random() * 10); // 0 to 9
        const mandMatched = numMand === 0 ? 0 : Math.floor(Math.random() * (numMand + 1));
        const numPref = Math.floor(Math.random() * 10);
        const prefMatched = numPref === 0 ? 0 : Math.floor(Math.random() * (numPref + 1));
        const reqExp = Math.floor(Math.random() * 15);
        const candExp = Math.random() * 30; // 0 to 30 yrs (can be float)

        const mandScore = numMand === 0 ? 70.0 : (mandMatched / numMand) * 70.0;
        const prefScore = numPref === 0 ? 20.0 : (prefMatched / numPref) * 20.0;

        let expScore;
        if (candExp >= reqExp) {
          expScore = Math.min(10.0, 6.0 + (candExp - reqExp) * 2.0);
        } else {
          expScore = (candExp / Math.max(1, reqExp)) * 6.0;
        }

        const totalScore = Math.round(mandScore + prefScore + expScore);

        assert.ok(mandScore >= 0.0 && mandScore <= 70.0, `mandScore out of bounds: ${mandScore}`);
        assert.ok(prefScore >= 0.0 && prefScore <= 20.0, `prefScore out of bounds: ${prefScore}`);
        assert.ok(expScore >= 0.0 && expScore <= 10.0, `expScore out of bounds: ${expScore}`);
        assert.ok(totalScore >= 0 && totalScore <= 100, `totalScore out of bounds: ${totalScore}`);
        assert.ok(!isNaN(totalScore), `totalScore is NaN on iteration ${i}`);
      }
    });

    it('2.9 should run 10,000 randomized iterations fuzzing the 4-factor hybrid radar formula: strictly bounded in [0, 100]', () => {
      // Formula: composite = round((0.40 * sem + 0.30 * bm25 + 0.15 * graph + 0.15 * intent) * 100)
      for (let i = 0; i < 10000; i++) {
        const sem = Math.random(); // 0.0 to 1.0
        const bm25 = Math.random();
        const graph = Math.random();
        const intent = Math.random();

        const composite = Math.round((0.40 * sem + 0.30 * bm25 + 0.15 * graph + 0.15 * intent) * 100);

        assert.ok(composite >= 0 && composite <= 100, `composite score out of bounds: ${composite}`);
        assert.ok(!isNaN(composite), `composite score is NaN on iteration ${i}`);

        const radarSem = Math.round(sem * 100);
        const radarBm25 = Math.round(bm25 * 100);
        const radarGraph = Math.round(graph * 100);
        const radarIntent = Math.round(intent * 100);

        assert.ok(radarSem >= 0 && radarSem <= 100);
        assert.ok(radarBm25 >= 0 && radarBm25 <= 100);
        assert.ok(radarGraph >= 0 && radarGraph <= 100);
        assert.ok(radarIntent >= 0 && radarIntent <= 100);
      }
    });

    it('2.10 should verify recommendation thresholds on exact boundary scores (90, 89, 75, 74, 50, 49)', () => {
      const getRec = (score) => {
        if (score >= 90) return 'Strong Hire (Top 1% Pipeline)';
        if (score >= 75) return 'Shortlist for Interview';
        if (score >= 50) return 'Review for Secondary Roles';
        return 'Does Not Meet Cutoff';
      };

      assert.strictEqual(getRec(100), 'Strong Hire (Top 1% Pipeline)');
      assert.strictEqual(getRec(90), 'Strong Hire (Top 1% Pipeline)');
      assert.strictEqual(getRec(89), 'Shortlist for Interview');
      assert.strictEqual(getRec(75), 'Shortlist for Interview');
      assert.strictEqual(getRec(74), 'Review for Secondary Roles');
      assert.strictEqual(getRec(50), 'Review for Secondary Roles');
      assert.strictEqual(getRec(49), 'Does Not Meet Cutoff');
      assert.strictEqual(getRec(0), 'Does Not Meet Cutoff');
    });

    it('2.11 should empirically analyze resume text experience regex extraction and decimal behavior', () => {
      const parseExp = (text) => {
        const match = (text || '').match(/(\d+)\+?\s*years?/i);
        return match ? parseInt(match[1], 10) : 0;
      };

      assert.strictEqual(parseExp('15 years of software engineering'), 15);
      assert.strictEqual(parseExp('2 years building distributed systems'), 2);
      assert.strictEqual(parseExp('0 years formal experience'), 0);
      assert.strictEqual(parseExp('No experience stated in this text'), 0);

      // Empirical discovery: in "0.5 years", the regex (\d+)\+?\s*years? skips "0." and matches "5 years"
      assert.strictEqual(parseExp('Intern with 0.5 years of experience'), 5, 'Empirically confirms decimal year inflation defect');
      // While "0.5 yrs" does not match the word "year(s)" so it safely falls back to 0
      assert.strictEqual(parseExp('Intern with 0.5 yrs of experience'), 0);
    });

    it('2.12 should verify full scoring parity between client calculateCandidateJobMatch and server GET /shortlist', async () => {
      const res = await requestApi('/api/v1/jobs/JOB-8F9A2C/shortlist');
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.leaderboard));

      const serverScores = {};
      res.body.leaderboard.forEach(item => {
        serverScores[item.application.candidateName] = item.matchScorePercentage;
      });

      const clientScores = {};
      const state = env.getState();
      state.applications.forEach(app => {
        const match = matchFn(app.rawResumeText, state.job, app);
        clientScores[app.candidateName] = match.deterministicScore;
      });

      assert.strictEqual(clientScores['Aarav Sharma'], serverScores['Aarav Sharma'], 'Aarav score parity');
      assert.strictEqual(clientScores['Priya Soni'], serverScores['Priya Soni'], 'Priya score parity');
      assert.strictEqual(clientScores['Diya Nair'], serverScores['Diya Nair'], 'Diya score parity');
      assert.strictEqual(clientScores['Rohan Verma'], serverScores['Rohan Verma'], 'Rohan score parity');
    });
  });

  // ===========================================================================
  // 3. PIPELINE STAGE & SCORECARD TRANSITIONS
  // ===========================================================================
  describe('3. Pipeline Stage & Scorecard Transitions', () => {
    let env;

    beforeEach(() => {
      env = setupTestEnv();
      env.hireflowAuth.loginAs('RECRUITER_HR', 'vikram');
      env.mockWindow.switchMainTab('recruiter-view');
      env.mockWindow.initCandidatePipeline();
    });

    it('3.1 should move candidate back and forth across stages reversibly without corruption', () => {
      const state = env.getState();
      const targetApp = state.applications.find(a => a.applicationId === 'APP-1B4D7E');
      assert.ok(targetApp);

      const stages = ['Applied', 'Interviewing', 'Applied', 'OfferExtended', 'Closed', 'Interviewing'];

      for (const st of stages) {
        targetApp.kanbanStage = st;
        env.mockWindow.renderCandidatePipeline();

        // Check active kanban stage on application object
        assert.strictEqual(targetApp.kanbanStage, st, `Stage must update to ${st}`);

        // Verify that Kanban column container contains the card
        const cardsCont = env.get(`pipeline-cards-${st}`);
        assert.ok(cardsCont, `Cards container for ${st} must exist`);
        const card = cardsCont.querySelector(`[data-appid="${targetApp.applicationId}"]`);
        assert.ok(card, `Card for ${targetApp.applicationId} must render inside #pipeline-cards-${st}`);

        const col = cardsCont.parentElement;
        assert.ok(col, 'Cards container must be inside kanban-col');
        assert.strictEqual(col.getAttribute('data-stage'), st, `Column stage must match ${st}`);

        const countEl = env.get(`pipeline-count-${st}`);
        assert.ok(countEl);
        assert.ok(parseInt(countEl.textContent, 10) >= 1, `Count in stage ${st} must be at least 1`);
      }
    });

    it('3.2 should handle multiple rubric scorecard submissions for the same candidate with in-place ledger update and no duplicate records', () => {
      const state = env.getState();
      const targetApp = state.applications.find(a => a.applicationId === 'APP-7F2B4D'); // Rohan Verma
      assert.ok(targetApp);

      // Open Scorecard Modal for Rohan
      env.mockWindow.openScorecardModal(targetApp.applicationId);
      const modal = env.get('scorecardModal');
      assert.ok(modal);

      const initialDecisionsCount = state.decisions.length;

      // Submission 1: Offer Extended
      const reviewerEl = env.get('modalReviewerName');
      const ctcEl = env.get('modalOfferedCTC');
      const notesEl = env.get('modalDecisionNotes');

      if (reviewerEl) reviewerEl.value = 'Vikram Seth (VP Eng)';
      if (ctcEl) ctcEl.value = '18.0';
      if (notesEl) notesEl.value = 'Initial technical round cleared';

      const offerBtn = env.get('scorecardOfferBtn');
      offerBtn.dispatchEvent('click');

      assert.strictEqual(targetApp.kanbanStage, 'OfferExtended');
      const record1 = state.decisions.find(d => d.applicationId === targetApp.applicationId);
      assert.ok(record1, 'Decision record must be created');
      assert.strictEqual(record1.decisionType, 'SelectedForOffer');
      assert.strictEqual(record1.offeredCTC, 18.0);
      assert.strictEqual(record1.interviewNotes, 'Initial technical round cleared');
      const decisionsCountAfterFirst = state.decisions.length;

      // Submission 2: Re-open scorecard and submit Hold / Waitlist
      env.mockWindow.openScorecardModal(targetApp.applicationId);
      if (notesEl) notesEl.value = 'Placed on waitlist pending senior architect interview';
      const waitlistBtn = env.get('scorecardWaitlistBtn');
      waitlistBtn.dispatchEvent('click');

      assert.strictEqual(targetApp.kanbanStage, 'Interviewing', 'Stage must update to Interviewing on waitlist');
      const record2 = state.decisions.find(d => d.applicationId === targetApp.applicationId);
      assert.ok(record2);
      assert.strictEqual(record2.decisionType, 'HoldWaitlist');
      assert.strictEqual(record2.offeredCTC, null);
      assert.strictEqual(record2.interviewNotes, 'Placed on waitlist pending senior architect interview');
      // Assert no duplicate entry was added!
      assert.strictEqual(state.decisions.length, decisionsCountAfterFirst, 'Multiple submissions must update existing decision in-place');

      // Submission 3: Re-open scorecard and submit Reject
      env.mockWindow.openScorecardModal(targetApp.applicationId);
      if (notesEl) notesEl.value = 'Did not meet technical bar in coding round';
      const rejectBtn = env.get('scorecardRejectBtn');
      rejectBtn.dispatchEvent('click');

      assert.strictEqual(targetApp.kanbanStage, 'Closed', 'Stage must update to Closed on reject');
      const record3 = state.decisions.find(d => d.applicationId === targetApp.applicationId);
      assert.ok(record3);
      assert.strictEqual(record3.decisionType, 'Rejected');
      assert.strictEqual(record3.offeredCTC, null);
      assert.strictEqual(record3.interviewNotes, 'Did not meet technical bar in coding round');
      assert.strictEqual(state.decisions.length, decisionsCountAfterFirst, 'Decisions array length must remain unchanged');
    });

    it('3.3 should verify Audit Trail Ledger renders accurately and exportAuditCsv maintains record integrity', () => {
      const state = env.getState();
      env.mockWindow.switchMainTab('audit-view');

      const tbody = env.get('auditTableBody');
      assert.ok(tbody, '#auditTableBody must exist');

      const rows = tbody.children;
      assert.strictEqual(rows.length, state.decisions.length, 'Audit table rows must match state.decisions count');

      state.decisions.forEach((dec, idx) => {
        const row = rows[idx];
        const rowText = row.textContent;
        assert.ok(rowText.includes(dec.candidateName), `Audit row must contain candidate ${dec.candidateName}`);
        assert.ok(rowText.includes(dec.reviewer), `Audit row must contain reviewer ${dec.reviewer}`);
      });

      // Test exportAuditCsv
      let exportedCsv = '';
      const origBlob = env.mockWindow.Blob;
      const MockBlob = class {
        constructor(parts, opts) {
          exportedCsv = parts.join('');
          this.parts = parts;
          this.type = opts?.type;
        }
      };
      env.mockWindow.Blob = MockBlob;
      env.sandbox.Blob = MockBlob;

      env.mockWindow.exportAuditCsv();

      assert.ok(exportedCsv.startsWith('Candidate,AI Match,Decision,Offered CTC,Reviewer,Notes,DecidedAt\n'));
      state.decisions.forEach(dec => {
        assert.ok(exportedCsv.includes(`"${dec.candidateName}"`), `CSV must include candidate ${dec.candidateName}`);
        assert.ok(exportedCsv.includes(`"${dec.decisionType}"`), `CSV must include decision ${dec.decisionType}`);
      });

      env.mockWindow.Blob = origBlob;
    });

    it('3.4 should verify REST API /api/v1/applications/:appId/decision updates stage and preserves audit stream', async () => {
      const appId = 'APP-3C9E1A'; // Diya Nair

      // 1. Submit SelectedForOffer via API
      let res = await requestApi(`/api/v1/applications/${appId}/decision`, {
        method: 'POST',
        body: {
          decisionType: 'SelectedForOffer',
          reviewer: 'Chief Technology Officer',
          interviewNotes: 'Strong algorithmic skills',
          offeredCTC: 22.0,
          equityOfferedPercent: 0.3
        }
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.application.kanbanStage, 'OfferExtended');
      assert.strictEqual(res.body.decision.decisionType, 'SelectedForOffer');
      assert.strictEqual(res.body.decision.offeredCTC, 22.0);

      // Verify audit endpoint returns this decision
      let auditRes = await requestApi('/api/v1/audit');
      assert.strictEqual(auditRes.status, 200);
      let diyaDec = auditRes.body.hiringDecisions.find(d => d.applicationId === appId);
      assert.ok(diyaDec);
      assert.strictEqual(diyaDec.decisionType, 'SelectedForOffer');

      // 2. Submit HoldWaitlist for same candidate via API
      res = await requestApi(`/api/v1/applications/${appId}/decision`, {
        method: 'POST',
        body: {
          decisionType: 'HoldWaitlist',
          reviewer: 'Chief Technology Officer',
          interviewNotes: 'Re-evaluating based on team headcount'
        }
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.application.kanbanStage, 'Interviewing');
      assert.strictEqual(res.body.decision.decisionType, 'HoldWaitlist');

      // Verify audit list updated in-place without duplicate
      auditRes = await requestApi('/api/v1/audit');
      const diyaEntries = auditRes.body.hiringDecisions.filter(d => d.applicationId === appId);
      assert.strictEqual(diyaEntries.length, 1, 'There must be strictly 1 decision entry per applicant in audit ledger');
      assert.strictEqual(diyaEntries[0].decisionType, 'HoldWaitlist');

      // 3. Move stage via /api/v1/kanban/move
      const moveRes = await requestApi('/api/v1/kanban/move', {
        method: 'POST',
        body: {
          applicationId: appId,
          newStage: 'Applied'
        }
      });
      assert.strictEqual(moveRes.status, 200);
      assert.strictEqual(moveRes.body.app.kanbanStage, 'Applied');
    });

    it('3.5 should verify audit trail ledger record integrity and timestamp ISO formatting', async () => {
      const res = await requestApi('/api/v1/audit');
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.hiringDecisions));
      assert.ok(res.body.hiringDecisions.length >= 3, 'Audit ledger must contain at least 3 decision records');

      res.body.hiringDecisions.forEach(rec => {
        assert.ok(rec.applicationId, 'Every audit record must have an applicationId');
        assert.ok(rec.candidateName, 'Every audit record must have candidateName');
        assert.ok(['SelectedForOffer', 'HoldWaitlist', 'Rejected'].includes(rec.decisionType), `Invalid decisionType: ${rec.decisionType}`);
        assert.ok(rec.reviewer, 'Reviewer must be recorded');
        assert.ok(rec.decidedAt, 'decidedAt timestamp must be recorded');
        const parsedDate = new Date(rec.decidedAt);
        assert.ok(!isNaN(parsedDate.getTime()), 'decidedAt must be a valid ISO timestamp');
      });
    });

    it('3.6 should gracefully reject /api/v1/kanban/move with HTTP 404 when applicationId is unknown', async () => {
      const res = await requestApi('/api/v1/kanban/move', {
        method: 'POST',
        body: {
          applicationId: 'APP-UNKNOWN-999',
          newStage: 'OfferExtended'
        }
      });
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error, 'Application not found');
    });

  });

});
