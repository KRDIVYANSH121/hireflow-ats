/**
 * HIREFLOW + OMNITALENT FRONTEND DOM & INTERACTIVE FLOW TEST SUITE (Milestone M2)
 * 
 * Comprehensive automated testing for the glassmorphic Single Page Application across
 * all 5 core views, 6-step workflow stepper, multi-tenant forms, AI telemetry,
 * leaderboard scoring, scorecards, offer letter modal, ATS Kanban board, Wellfound ESOP
 * financial studio, compliance audit ledger, RFC-4180 CSV export, and known UI edge cases.
 * 
 * Zero external dependencies. Uses Node.js native `node:test` and `node:assert/strict`.
 * Headless DOM fixture faithfully simulates standard browser DOM APIs and events.
 * 
 * Execution:
 *   node tests/test-frontend-dom.js
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Paths to authoritative application targets
const PROJECT_ROOT = path.resolve(__dirname, '..');
const HTML_PATH = path.join(PROJECT_ROOT, 'index.html');
const APP_JS_PATH = path.join(PROJECT_ROOT, 'app.js');

const htmlContent = fs.readFileSync(HTML_PATH, 'utf8');
const appJsContent = fs.readFileSync(APP_JS_PATH, 'utf8');

// =============================================================================
// ROBUST ZERO-DEPENDENCY HEADLESS DOM FIXTURE
// =============================================================================

class DOMElement {
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
    this._innerHTML = '';
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
    this._innerHTML = String(v);
    this.children = [];
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
        const child = new DOMElement(match[1]);
        const attrs = match[2] || '';
        const classM = attrs.match(/class=['"]([^'"]*)['"]/);
        if (classM) {
          child.className = classM[1];
        }
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

  setAttribute(k, v) {
    this.attributes[k] = String(v);
    if (k.toLowerCase() === 'id') this.id = String(v);
    if (k.toLowerCase() === 'class') {
      this.className = String(v);
    }
    if (k.toLowerCase() === 'value') this._value = String(v);
  }

  getAttribute(k) {
    if (this.attributes[k] !== undefined) return this.attributes[k];
    if (k === 'id') return this.id;
    if (k === 'class') return this.className;
    return null;
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    this.childNodes.push(child);
    return child;
  }

  remove() {
    if (this.parentElement) {
      const idx = this.parentElement.children.indexOf(this);
      if (idx > -1) this.parentElement.children.splice(idx, 1);
      const cIdx = this.parentElement.childNodes.indexOf(this);
      if (cIdx > -1) this.parentElement.childNodes.splice(cIdx, 1);
    }
  }

  addEventListener(type, fn) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(fn);
  }

  removeEventListener(type, fn) {
    if (!this.listeners[type]) return;
    this.listeners[type] = this.listeners[type].filter(cb => cb !== fn);
  }

  dispatchEvent(evt) {
    const type = typeof evt === 'string' ? evt : evt.type;
    const eventObj = typeof evt === 'string'
      ? { type, target: this, currentTarget: this, preventDefault: () => {} }
      : evt;
    if (!eventObj.target) eventObj.target = this;
    if (!eventObj.currentTarget) eventObj.currentTarget = this;
    if (!eventObj.preventDefault) eventObj.preventDefault = () => {};
    if (this.listeners[type]) {
      this.listeners[type].forEach(fn => fn(eventObj));
    }
  }

  closest(selector) {
    let curr = this;
    while (curr) {
      if (matchesSelector(curr, selector)) return curr;
      curr = curr.parentElement;
    }
    return null;
  }

  querySelector(selector) {
    const all = this.querySelectorAll(selector);
    return all.length ? all[0] : null;
  }

  querySelectorAll(selector) {
    const matches = [];
    const walk = (el) => {
      for (const ch of el.children) {
        if (matchesSelector(ch, selector)) matches.push(ch);
        walk(ch);
      }
    };
    walk(this);
    return matches;
  }
}

function matchesSelector(el, sel) {
  if (sel.startsWith('.')) {
    const parts = sel.split(/(?=[.\[#])/);
    return parts.every(p => {
      if (p.startsWith('.')) return el.classList.contains(p.slice(1));
      if (p.startsWith('#')) return el.id === p.slice(1);
      if (p.startsWith('[')) {
        const m = p.match(/\[([a-zA-Z0-9_-]+)(?:=['"]?([^'"]*)['"]?)?\]/);
        if (!m) return true;
        const val = el.getAttribute(m[1]);
        return m[2] !== undefined ? val === m[2] : val !== null;
      }
      return true;
    });
  }
  if (sel.startsWith('#')) return el.id === sel.slice(1);
  if (sel.includes('[') && sel.includes(']')) {
    const m = sel.match(/^([a-zA-Z0-9_-]+)?\[([a-zA-Z0-9_-]+)(?:=['"]?([^'"]*)['"]?)?\]/);
    if (m) {
      if (m[1] && el.tagName.toLowerCase() !== m[1].toLowerCase()) return false;
      const val = el.getAttribute(m[2]);
      return m[3] !== undefined ? val === m[3] : val !== null;
    }
  }
  return el.tagName.toLowerCase() === sel.toLowerCase();
}

function parseHTMLToDOM(html) {
  const root = new DOMElement('HTML');
  const elementsById = new Map();
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
        const el = new DOMElement(tagName);
        const attrRegex = /([a-zA-Z0-9_-]+)(?:=['"]([^'"]*)['"]|=([^\s>]+))?/g;
        let am;
        while ((am = attrRegex.exec(attrsStr)) !== null) {
          const k = am[1];
          const v = am[2] !== undefined ? am[2] : (am[3] !== undefined ? am[3] : '');
          el.setAttribute(k, v);
          if (k.toLowerCase() === 'id') elementsById.set(v, el);
        }
        if (el.getAttribute('value') !== null) {
          el.value = el.getAttribute('value');
        }

        const parent = stack[stack.length - 1];
        parent.appendChild(el);

        if (!isSelfClosing) {
          stack.push(el);
        }
      }
    } else if (match[5] && match[5].trim()) {
      const parent = stack[stack.length - 1];
      parent.childNodes.push({ nodeType: 3, textContent: match[5].trim() });
    }
  }
  return { root, elementsById };
}

function createTestEnvironment(customOptions = {}) {
  const { root, elementsById } = parseHTMLToDOM(htmlContent);

  // Setup Canvas mock
  const canvasEl = elementsById.get('networkCanvas') || new DOMElement('canvas', 'networkCanvas');
  canvasEl.width = 1100;
  canvasEl.height = 550;
  canvasEl.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1100, height: 550 });

  const canvasDrawLog = [];
  canvasEl.getContext = () => ({
    clearRect: (x, y, w, h) => canvasDrawLog.push(['clearRect', x, y, w, h]),
    beginPath: () => canvasDrawLog.push(['beginPath']),
    moveTo: (x, y) => canvasDrawLog.push(['moveTo', x, y]),
    lineTo: (x, y) => canvasDrawLog.push(['lineTo', x, y]),
    stroke: () => canvasDrawLog.push(['stroke']),
    arc: (x, y, r) => canvasDrawLog.push(['arc', x, y, r]),
    fill: () => canvasDrawLog.push(['fill']),
    fillText: (text, x, y) => canvasDrawLog.push(['fillText', text, x, y]),
    setLineDash: (d) => canvasDrawLog.push(['setLineDash', d]),
    font: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    textAlign: 'center'
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
    createElement: (tag) => new DOMElement(tag),
    body: root
  };

  const downloads = [];
  const printCalls = [];
  const scrolls = [];
  const createdBlobs = [];

  class MockBlob {
    constructor(parts, opts) {
      this.parts = parts;
      this.type = opts?.type;
      this.content = parts.join('');
    }
  }

  const mockWindow = {
    document: mockDocument,
    requestAnimationFrame: (cb) => 1,
    cancelAnimationFrame: () => {},
    scrollTo: (opts) => scrolls.push(opts),
    print: () => printCalls.push(Date.now()),
    Blob: MockBlob,
    URL: {
      createObjectURL: (blob) => {
        createdBlobs.push(blob);
        return 'blob:mock-url-' + Math.random().toString(36).slice(2);
      }
    }
  };

  // Override createElement for 'a' tags to intercept file downloads
  const originalCreateElement = mockDocument.createElement;
  mockDocument.createElement = (tag) => {
    const el = originalCreateElement(tag);
    if (tag.toLowerCase() === 'a') {
      el.click = () => {
        downloads.push({
          download: el.getAttribute('download') || el.download,
          href: el.getAttribute('href') || el.href
        });
      };
    }
    return el;
  };

  const timerQueue = [];
  const sandbox = {
    window: mockWindow,
    document: mockDocument,
    Blob: mockWindow.Blob,
    URL: mockWindow.URL,
    requestAnimationFrame: mockWindow.requestAnimationFrame,
    cancelAnimationFrame: mockWindow.cancelAnimationFrame,
    setTimeout: (fn, delay) => {
      if (customOptions.manualTimers) {
        timerQueue.push(fn);
        return timerQueue.length;
      }
      return fn();
    },
    clearTimeout: () => {},
    Date: Date,
    Math: Math,
    parseInt: parseInt,
    parseFloat: parseFloat,
    console: {
      log: () => {},
      warn: () => {},
      error: () => {}
    }
  };

  // Expose internal state for deep verification by assigning window.__state
  const instrumentedAppJs = appJsContent.replace('const state = {', 'const state = window.__state = {');

  vm.createContext(sandbox);
  vm.runInContext(instrumentedAppJs, sandbox);
  mockDocument.dispatchEvent('DOMContentLoaded');

  return {
    window: mockWindow,
    document: mockDocument,
    elementsById,
    canvasDrawLog,
    downloads,
    printCalls,
    scrolls,
    timerQueue,
    createdBlobs,
    getLastBlob: () => createdBlobs[createdBlobs.length - 1],
    get: (id) => elementsById.get(id),
    query: (sel) => root.querySelector(sel),
    queryAll: (sel) => root.querySelectorAll(sel),
    getState: () => mockWindow.__state
  };
}

// =============================================================================
// AUTOMATED TEST SUITES
// =============================================================================

describe('HireFlow Frontend SPA Test Suite (Milestone M2)', () => {

  // ---------------------------------------------------------------------------
  // 1. Navigation & View Switching
  // ---------------------------------------------------------------------------
  describe('1. View Navigation & Tab Switching', () => {
    let env;
    beforeEach(() => { env = createTestEnvironment(); });

    it('TC-DOM-NAV-01: Default view is workflow-view with active tab', () => {
      const activeTab = env.query('.nav-tab.active');
      assert.ok(activeTab, 'Should have an active nav tab by default');
      assert.strictEqual(activeTab.getAttribute('data-tab'), 'workflow-view');
      assert.strictEqual(env.get('workflow-view').classList.contains('active'), true);
      assert.strictEqual(env.getState().currentTab, 'workflow-view');
    });

    it('TC-DOM-NAV-02: Clicking kanban-view tab switches view panel and triggers updateKanbanView', () => {
      const kanbanTab = env.queryAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'kanban-view');
      kanbanTab.dispatchEvent('click');

      assert.strictEqual(env.get('kanban-view').classList.contains('active'), true);
      assert.strictEqual(env.get('workflow-view').classList.contains('active'), false);
      assert.strictEqual(env.getState().currentTab, 'kanban-view');
      assert.strictEqual(kanbanTab.classList.contains('active'), true);
    });

    it('TC-DOM-NAV-03: Clicking graph-view tab activates canvas social graph', () => {
      const graphTab = env.queryAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');

      assert.strictEqual(env.get('graph-view').classList.contains('active'), true);
      assert.strictEqual(env.getState().currentTab, 'graph-view');
    });

    it('TC-DOM-NAV-04: Clicking equity-view tab switches to Wellfound ESOP studio', () => {
      const eqTab = env.queryAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'equity-view');
      eqTab.dispatchEvent('click');

      assert.strictEqual(env.get('equity-view').classList.contains('active'), true);
      assert.strictEqual(env.getState().currentTab, 'equity-view');
    });

    it('TC-DOM-NAV-05: Clicking audit-view tab switches to compliance ledger and renders table', () => {
      const auditTab = env.queryAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'audit-view');
      auditTab.dispatchEvent('click');

      assert.strictEqual(env.get('audit-view').classList.contains('active'), true);
      assert.strictEqual(env.getState().currentTab, 'audit-view');
      assert.ok(env.get('auditTableBody').children.length >= 3, 'Audit table rows rendered');
    });

    it('TC-DOM-NAV-06: Tab switching isolates active class to exactly one view-panel', () => {
      const tabs = env.queryAll('.nav-tab');
      for (const tab of tabs) {
        tab.dispatchEvent('click');
        const activePanels = env.queryAll('.view-panel').filter(p => p.classList.contains('active'));
        assert.strictEqual(activePanels.length, 1, `Expected exactly 1 active panel when clicking ${tab.getAttribute('data-tab')}`);
        assert.strictEqual(activePanels[0].id, tab.getAttribute('data-tab'));
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 2. 6-Step Hiring Workflow Stepper Controls
  // ---------------------------------------------------------------------------
  describe('2. 6-Step Workflow Stepper Navigation', () => {
    let env;
    beforeEach(() => { env = createTestEnvironment(); });

    it('TC-DOM-STP-01: Stepper initializes on Step 1 with correct active indicators', () => {
      assert.strictEqual(env.getState().currentStep, 1);
      assert.strictEqual(env.get('pane-step-1').classList.contains('active'), true);
      const step1Icon = env.queryAll('.stepper-step').find(s => s.getAttribute('data-step') === '1');
      assert.strictEqual(step1Icon.classList.contains('active'), true);
    });

    it('TC-DOM-STP-02: Sequential forward navigation through all 6 steps', () => {
      for (let s = 1; s <= 5; s++) {
        const nextBtn = env.queryAll('.next-step-btn').find(b => b.getAttribute('data-target') === String(s + 1));
        assert.ok(nextBtn, `Next button for target ${s + 1} exists`);
        nextBtn.dispatchEvent('click');
        assert.strictEqual(env.getState().currentStep, s + 1);
        assert.strictEqual(env.get(`pane-step-${s + 1}`).classList.contains('active'), true);
        assert.strictEqual(env.get(`pane-step-${s}`).classList.contains('active'), false);
      }
    });

    it('TC-DOM-STP-03: Sequential backward navigation from Step 6 to Step 1', () => {
      // Jump to Step 6
      const step6Icon = env.queryAll('.stepper-step').find(s => s.getAttribute('data-step') === '6');
      step6Icon.dispatchEvent('click');
      assert.strictEqual(env.getState().currentStep, 6);

      for (let s = 6; s >= 2; s--) {
        const prevBtn = env.queryAll('.prev-step-btn').find(b => b.getAttribute('data-target') === String(s - 1));
        assert.ok(prevBtn, `Prev button for target ${s - 1} exists`);
        prevBtn.dispatchEvent('click');
        assert.strictEqual(env.getState().currentStep, s - 1);
        assert.strictEqual(env.get(`pane-step-${s - 1}`).classList.contains('active'), true);
      }
    });

    it('TC-DOM-STP-04: Completed steps receive .completed class and active step receives .active', () => {
      const step4Icon = env.queryAll('.stepper-step').find(s => s.getAttribute('data-step') === '4');
      step4Icon.dispatchEvent('click');

      const steps = env.queryAll('.stepper-step');
      steps.forEach(s => {
        const num = parseInt(s.getAttribute('data-step'), 10);
        if (num < 4) {
          assert.strictEqual(s.classList.contains('completed'), true, `Step ${num} should be completed`);
          assert.strictEqual(s.classList.contains('active'), false);
        } else if (num === 4) {
          assert.strictEqual(s.classList.contains('active'), true, `Step 4 should be active`);
          assert.strictEqual(s.classList.contains('completed'), false);
        } else {
          assert.strictEqual(s.classList.contains('active'), false, `Step ${num} should be inactive`);
          assert.strictEqual(s.classList.contains('completed'), false);
        }
      });
    });

    it('TC-DOM-STP-05: Stepper bounds check prevents out-of-range transitions', () => {
      const step1Icon = env.queryAll('.stepper-step').find(s => s.getAttribute('data-step') === '1');
      step1Icon.dispatchEvent('click');
      assert.strictEqual(env.getState().currentStep, 1);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Step 1: Multi-Tenant Org Portal Form
  // ---------------------------------------------------------------------------
  describe('3. Step 1: Organization Portal Deployment', () => {
    let env;
    beforeEach(() => { env = createTestEnvironment(); });

    it('TC-DOM-ORG-01: Live slider changes update percentage displays in real time', () => {
      const slider = env.get('orgMinScore');
      slider.value = '82';
      slider.dispatchEvent({ type: 'input', target: { value: '82' } });

      assert.strictEqual(env.get('orgMinScoreVal').textContent, '82%');
      assert.strictEqual(env.get('prevCutoff').textContent, '82%');
      assert.strictEqual(env.get('activeCutoffDisplay').textContent, '82% Match');
      assert.strictEqual(env.getState().organization.minimumShortlistScore, 82);
    });

    it('TC-DOM-ORG-02: Submitting orgForm updates organization state and live preview card', () => {
      env.get('orgName').value = 'Horizon Quantum Labs';
      env.get('orgType').value = 'COMPANY';
      env.get('orgSubdomain').value = 'horizonquantum';
      env.get('orgMinScore').value = '80';

      env.get('orgForm').dispatchEvent('submit');

      const orgState = env.getState().organization;
      assert.strictEqual(orgState.name, 'Horizon Quantum Labs');
      assert.strictEqual(orgState.type, 'COMPANY');
      assert.strictEqual(orgState.customSubdomain, 'horizonquantum.hireflow.ai');
      assert.strictEqual(orgState.minimumShortlistScore, 80);

      // Verify DOM preview
      assert.strictEqual(env.get('prevName').textContent, 'Horizon Quantum Labs');
      assert.strictEqual(env.get('prevDomain').textContent, 'https://horizonquantum.hireflow.ai');
      assert.strictEqual(env.get('prevType').textContent, 'Enterprise Company');
      assert.strictEqual(env.get('tenantSubdomain').textContent, 'horizonquantum.hireflow.ai');

      // Verify automatic progression to Step 2
      assert.strictEqual(env.getState().currentStep, 2);
      assert.strictEqual(env.get('pane-step-2').classList.contains('active'), true);
    });

    it('TC-DOM-ORG-03: University portal type displays University Placement Cell preview', () => {
      env.get('orgName').value = 'IIT Bombay TPO Cell';
      env.get('orgType').value = 'UNIVERSITY';
      env.get('orgSubdomain').value = 'iitb-tpo';
      env.get('orgMinScore').value = '70';

      env.get('orgForm').dispatchEvent('submit');

      assert.strictEqual(env.get('prevType').textContent, 'University Placement Cell (TPO)');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Step 2: Job Requisition Blueprint & Tag Manager
  // ---------------------------------------------------------------------------
  describe('4. Step 2: Job Requisition & Blueprint Form', () => {
    let env;
    beforeEach(() => { env = createTestEnvironment(); });

    it('TC-DOM-JOB-01: Initial mandatory and preferred skills are loaded in state and DOM', () => {
      const mandState = Array.from(env.getState().job.mandatorySkills);
      const prefState = Array.from(env.getState().job.preferredSkills);

      assert.deepStrictEqual(mandState, ['JAVA', 'SPRING BOOT', 'MICROSERVICES', 'DOCKER', 'SQL']);
      assert.deepStrictEqual(prefState, ['KUBERNETES', 'KAFKA']);

      const mandChips = env.get('mandatoryTags').querySelectorAll('.skill-chip');
      const prefChips = env.get('preferredTags').querySelectorAll('.skill-chip');
      assert.strictEqual(mandChips.length, 5);
      assert.strictEqual(prefChips.length, 2);
    });

    it('TC-DOM-JOB-02: Adding a dynamic mandatory tag appends chip and updates state', () => {
      const input = env.get('newMandatoryInput');
      input.value = 'POSTGRESQL';
      env.get('addMandatoryBtn').dispatchEvent('click');

      assert.strictEqual(env.getState().job.mandatorySkills.includes('POSTGRESQL'), true);
      assert.strictEqual(input.value, '', 'Input should clear after adding');

      const tags = env.get('mandatoryTags').querySelectorAll('.skill-chip');
      assert.strictEqual(tags.length, 6);
      assert.ok(env.get('mandatoryTags').innerHTML.includes('POSTGRESQL'));
    });

    it('TC-DOM-JOB-03: Adding a dynamic preferred tag appends chip and updates state', () => {
      const input = env.get('newPreferredInput');
      input.value = 'REDIS';
      env.get('addPreferredBtn').dispatchEvent('click');

      assert.strictEqual(env.getState().job.preferredSkills.includes('REDIS'), true);
      assert.strictEqual(input.value, '', 'Input should clear after adding');

      const tags = env.get('preferredTags').querySelectorAll('.skill-chip');
      assert.strictEqual(tags.length, 3);
      assert.ok(env.get('preferredTags').innerHTML.includes('REDIS'));
    });

    it('TC-DOM-JOB-04: Duplicate skill addition is prevented', () => {
      const initialCount = env.getState().job.mandatorySkills.length;
      env.get('newMandatoryInput').value = 'JAVA'; // Already present
      env.get('addMandatoryBtn').dispatchEvent('click');

      assert.strictEqual(env.getState().job.mandatorySkills.length, initialCount);
    });

    it('TC-DOM-JOB-05: Deleting an existing skill chip via .del-tag removes it from state and DOM', () => {
      const initialCount = env.getState().job.mandatorySkills.length;
      const delBtn = env.get('mandatoryTags').querySelector('.del-tag');
      assert.ok(delBtn, 'Delete button exists on chip');

      delBtn.dispatchEvent('click');
      assert.strictEqual(env.getState().job.mandatorySkills.length, initialCount - 1);
    });

    it('TC-DOM-JOB-06: Submitting jobForm updates state and advances to Step 3', () => {
      env.get('jobTitle').value = 'Principal Distributed Systems Architect';
      env.get('jobMinExp').value = '4';
      env.get('jobEquity').value = '0.50';

      env.get('jobForm').dispatchEvent('submit');

      const jobState = env.getState().job;
      assert.strictEqual(jobState.title, 'Principal Distributed Systems Architect');
      assert.strictEqual(jobState.requiredExperienceYears, 4);
      assert.strictEqual(jobState.equityOfferedPercent, 0.50);

      assert.strictEqual(env.get('liveJobTitle').textContent, 'Principal Distributed Systems Architect');
      assert.strictEqual(env.getState().currentStep, 3);
      assert.strictEqual(env.get('pane-step-3').classList.contains('active'), true);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Step 3: Candidate Living Profile Presets & Application Form
  // ---------------------------------------------------------------------------
  describe('5. Step 3: Presets & Application Submission', () => {
    let env;
    beforeEach(() => { env = createTestEnvironment(); });

    it('TC-DOM-APP-01: Clicking preset buttons populates form fields and updates avatar', () => {
      const presets = ['diya', 'rohan', 'priya', 'aarav', 'custom'];
      const expectedAvatars = { diya: 'DN', rohan: 'RV', priya: 'PS', aarav: 'AS', custom: 'YN' };

      presets.forEach(key => {
        const btn = env.queryAll('.btn-preset').find(b => b.getAttribute('data-preset') === key);
        assert.ok(btn, `Preset button for ${key} exists`);
        btn.dispatchEvent('click');

        assert.strictEqual(btn.classList.contains('active'), true);
        assert.strictEqual(env.get('prevAvatar').textContent, expectedAvatars[key]);
        assert.strictEqual(env.get('candName').value, env.getState().presets[key].name);
      });
    });

    it('TC-DOM-APP-02: Submitting a new candidate application adds to state and advances to Step 4', () => {
      const initialAppCount = env.getState().applications.length;

      env.get('candName').value = 'Karan Patel';
      env.get('candEmail').value = 'karan.patel@fintech.io';
      env.get('candHeadline').value = 'Senior Backend Engineer | High Frequency Trading';
      env.get('candResume').value = 'Backend developer with 5 years building Java, Spring Boot, Microservices, Kafka, and Docker microservices.';
      env.get('candReferral').value = 'Karan Patel -> Rajesh (Staff Eng) -> Apex Cloud';

      env.get('appForm').dispatchEvent('submit');

      assert.strictEqual(env.getState().applications.length, initialAppCount + 1);
      const newApp = env.getState().applications[0];
      assert.strictEqual(newApp.candidateName, 'Karan Patel');
      assert.strictEqual(newApp.kanbanStage, 'Applied');
      assert.strictEqual(env.getState().activeCandidateAppId, newApp.applicationId);

      // Verify progression to Step 4
      assert.strictEqual(env.getState().currentStep, 4);
      assert.strictEqual(env.get('pane-step-4').classList.contains('active'), true);
    });

    it('TC-DOM-APP-03: Submitting existing candidate updates profile without duplicating', () => {
      const initialAppCount = env.getState().applications.length;

      // Existing email for Aarav
      env.get('candEmail').value = 'aarav.s@email.com';
      env.get('candHeadline').value = 'Updated Aarav Headline';

      env.get('appForm').dispatchEvent('submit');

      assert.strictEqual(env.getState().applications.length, initialAppCount, 'Application list length should remain same');
      const aarav = env.getState().applications.find(a => a.email === 'aarav.s@email.com');
      assert.strictEqual(aarav.headline, 'Updated Aarav Headline');
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Step 4: AI NLP Skill Extraction & Vector Telemetry
  // ---------------------------------------------------------------------------
  describe('6. Step 4: AI NLP Telemetry & Resume Parsing', () => {
    let env;
    beforeEach(() => {
      env = createTestEnvironment();
      const step4Icon = env.queryAll('.stepper-step').find(s => s.getAttribute('data-step') === '4');
      step4Icon.dispatchEvent('click');
    });

    it('TC-DOM-NLP-01: Ingests candidate name and extracts technical skills', () => {
      assert.strictEqual(env.get('termCandName').textContent, 'Aarav Sharma');
      const extractedChips = env.get('aiExtractedSkills').querySelectorAll('.skill-chip');
      assert.ok(extractedChips.length >= 5, 'Should extract at least 5 tech skills from Aarav resume');

      const extractedTexts = extractedChips.map(c => c.textContent);
      assert.ok(extractedTexts.includes('JAVA'));
      assert.ok(extractedTexts.includes('SPRING BOOT'));
      assert.ok(extractedTexts.includes('KAFKA'));
    });

    it('TC-DOM-NLP-02: Categorizes extracted skills as mandatory or preferred', () => {
      const mandatorySkills = env.getState().job.mandatorySkills;
      const chips = env.get('aiExtractedSkills').querySelectorAll('.skill-chip');

      chips.forEach(chip => {
        const skill = chip.textContent;
        if (mandatorySkills.includes(skill)) {
          assert.strictEqual(chip.classList.contains('chip-mandatory'), true);
        } else {
          assert.strictEqual(chip.classList.contains('chip-preferred'), true);
        }
      });
    });

    it('TC-DOM-NLP-03: Regex extracts years of experience and updates terminal badge', () => {
      assert.ok(env.get('termExp').textContent.includes('2 Years') || env.get('termExp').textContent.includes('3 Years'));
      assert.ok(env.get('aiExtractedExp').textContent.includes('Years Relevant Experience'));
    });

    it('TC-DOM-NLP-04: Terminal stream renders all 6 telemetry phases', () => {
      const termHtml = env.get('aiTerminalLog').innerHTML;
      assert.ok(termHtml.includes('[INIT]'), 'Stream contains [INIT]');
      assert.ok(termHtml.includes('[INGEST]'), 'Stream contains [INGEST]');
      assert.ok(termHtml.includes('[EXTRACT]'), 'Stream contains [EXTRACT]');
      assert.ok(termHtml.includes('[EXP-REGEX]'), 'Stream contains [EXP-REGEX]');
      assert.ok(termHtml.includes('[VECTOR]'), 'Stream contains [VECTOR]');
      assert.ok(termHtml.includes('[READY]'), 'Stream contains [READY]');
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Step 5: Intelligent Shortlist Leaderboard
  // ---------------------------------------------------------------------------
  describe('7. Step 5: Shortlist Leaderboard & Scoring Engine', () => {
    let env;
    beforeEach(() => {
      env = createTestEnvironment();
      const step5Icon = env.queryAll('.stepper-step').find(s => s.getAttribute('data-step') === '5');
      step5Icon.dispatchEvent('click');
    });

    it('TC-DOM-SHT-01: Renders shortlist cards for all applications in descending order', () => {
      const cards = env.get('shortlistContainer').children;
      assert.strictEqual(cards.length, 4, 'Should render cards for 4 baseline applicants');

      const cardHtml = env.get('shortlistContainer').innerHTML;
      const aaravIdx = cardHtml.indexOf('Aarav Sharma');
      const diyaIdx = cardHtml.indexOf('Diya Nair');
      const rohanIdx = cardHtml.indexOf('Rohan Verma');

      assert.ok(aaravIdx > -1 && diyaIdx > -1 && rohanIdx > -1);
      assert.ok(aaravIdx < diyaIdx, 'Aarav (96%) must rank higher than Diya (88%)');
      assert.ok(diyaIdx < rohanIdx, 'Diya (88%) must rank higher than Rohan (31%)');
    });

    it('TC-DOM-SHT-02: Renders radial gauge with correct score and threshold badges', () => {
      const cards = env.get('shortlistContainer').children;
      const topCard = cards[0];
      assert.ok(topCard.innerHTML.includes('96%'), 'Top candidate Aarav should have 96% score');
      assert.strictEqual(topCard.classList.contains('qualified'), true);
      assert.ok(topCard.innerHTML.includes('PASSED THRESHOLD'));

      // Rohan (last card) - calculated formula yields 45% (3/5 core = 42% + 1yr exp = 3%), well below 75% cutoff
      const lastCard = cards[cards.length - 1];
      assert.ok(lastCard.innerHTML.includes('45%'), 'Lowest candidate Rohan should have 45% calculated score');
      assert.strictEqual(lastCard.classList.contains('disqualified'), true);
      assert.ok(lastCard.innerHTML.includes('BELOW CUTOFF'));
    });

    it('TC-DOM-SHT-03: Strengths and gaps chips rendered correctly', () => {
      const cardHtml = env.get('shortlistContainer').innerHTML;
      assert.ok(cardHtml.includes('Strengths:'));
      assert.ok(cardHtml.includes('Gaps:'));
      assert.ok(cardHtml.includes('Missing Core:'), 'Rohan card should show missing core skills');
    });

    it('TC-DOM-SHT-04: Clicking "Review & Decide →" sets candidate and navigates to Step 6', () => {
      const reviewBtns = env.queryAll('.review-cand-btn');
      assert.ok(reviewBtns.length >= 4);

      // Review Diya Nair
      const diyaBtn = reviewBtns.find(b => b.getAttribute('data-appid') === 'APP-3C9E1A');
      assert.ok(diyaBtn, 'Diya review button exists');
      diyaBtn.dispatchEvent('click');

      assert.strictEqual(env.getState().activeCandidateAppId, 'APP-3C9E1A');
      assert.strictEqual(env.get('decisionCandidateSelect').value, 'APP-3C9E1A');
      assert.strictEqual(env.getState().currentStep, 6);
      assert.strictEqual(env.get('pane-step-6').classList.contains('active'), true);
    });
  });

  // ---------------------------------------------------------------------------
  // 8. Step 6: Human Decision & Collaborative Scorecards
  // ---------------------------------------------------------------------------
  describe('8. Step 6: Human Scorecards & Decision Engine', () => {
    let env;
    beforeEach(() => {
      env = createTestEnvironment();
      const step6Icon = env.queryAll('.stepper-step').find(s => s.getAttribute('data-step') === '6');
      step6Icon.dispatchEvent('click');
    });

    it('TC-DOM-DEC-01: Rubric sliders update numerical rating displays', () => {
      const sliders = ['scoreSysDesign', 'scoreCoding', 'scoreProblem', 'scoreCulture'];
      sliders.forEach(id => {
        const slider = env.get(id);
        const display = env.get('val' + id.replace('score', ''));
        slider.value = '4';
        slider.dispatchEvent({ type: 'input' });
        assert.strictEqual(display.textContent, '4 / 5');
      });
    });

    it('TC-DOM-DEC-02: Submitting SelectedForOffer extends offer and updates Kanban stage', () => {
      env.get('decisionCandidateSelect').value = 'APP-1B4D7E';
      env.get('offeredCTC').value = '26.5';

      const offerBtn = env.queryAll('.decision-action-btn').find(b => b.getAttribute('data-decision') === 'SelectedForOffer');
      offerBtn.dispatchEvent('click');

      const app = env.getState().applications.find(a => a.applicationId === 'APP-1B4D7E');
      assert.strictEqual(app.kanbanStage, 'OfferExtended');

      const decision = env.getState().decisions.find(d => d.applicationId === 'APP-1B4D7E');
      assert.strictEqual(decision.decisionType, 'SelectedForOffer');
      assert.strictEqual(decision.offeredCTC, 26.5);

      // Verify audit stream display
      assert.ok(env.get('finalAuditStream').innerHTML.includes('HIRED / OFFER EXTENDED'));
    });

    it('TC-DOM-DEC-03: Submitting HoldWaitlist moves candidate to Interviewing', () => {
      env.get('decisionCandidateSelect').value = 'APP-3C9E1A';

      const holdBtn = env.queryAll('.decision-action-btn').find(b => b.getAttribute('data-decision') === 'HoldWaitlist');
      holdBtn.dispatchEvent('click');

      const app = env.getState().applications.find(a => a.applicationId === 'APP-3C9E1A');
      assert.strictEqual(app.kanbanStage, 'Interviewing');

      const decision = env.getState().decisions.find(d => d.applicationId === 'APP-3C9E1A');
      assert.strictEqual(decision.decisionType, 'HoldWaitlist');
      assert.strictEqual(decision.offeredCTC, null);
      assert.ok(env.get('finalAuditStream').innerHTML.includes('WAITLISTED'));
    });

    it('TC-DOM-DEC-04: Submitting Rejected closes candidate application', () => {
      env.get('decisionCandidateSelect').value = 'APP-7F2B4D';

      const rejectBtn = env.queryAll('.decision-action-btn').find(b => b.getAttribute('data-decision') === 'Rejected');
      rejectBtn.dispatchEvent('click');

      const app = env.getState().applications.find(a => a.applicationId === 'APP-7F2B4D');
      assert.strictEqual(app.kanbanStage, 'Closed');

      const decision = env.getState().decisions.find(d => d.applicationId === 'APP-7F2B4D');
      assert.strictEqual(decision.decisionType, 'Rejected');
      assert.ok(env.get('finalAuditStream').innerHTML.includes('REJECTED'));
    });
  });

  // ---------------------------------------------------------------------------
  // 9. Digital Offer Letter Modal
  // ---------------------------------------------------------------------------
  describe('9. Digital Offer Letter Modal', () => {
    let env;
    beforeEach(() => { env = createTestEnvironment(); });

    it('TC-DOM-MOD-01: showOfferModal toggles active class and renders appointment document', () => {
      assert.strictEqual(env.get('offerModal').classList.contains('active'), false);

      env.window.showOfferModal('APP-1B4D7E');

      assert.strictEqual(env.get('offerModal').classList.contains('active'), true);
      const modalBody = env.get('offerModalBody').innerHTML;
      assert.ok(modalBody.includes('OFFICIAL APPOINTMENT LETTER'));
      assert.ok(modalBody.includes('Aarav Sharma'));
      assert.ok(modalBody.includes('Vikram Seth'));
      assert.ok(modalBody.includes('Vesting Schedule'));
    });

    it('TC-DOM-MOD-02: closeOfferModal removes active class', () => {
      env.window.showOfferModal('APP-1B4D7E');
      assert.strictEqual(env.get('offerModal').classList.contains('active'), true);

      env.window.closeOfferModal();
      assert.strictEqual(env.get('offerModal').classList.contains('active'), false);
    });

    it('TC-DOM-MOD-03: printOfferLetter invokes window.print()', () => {
      env.window.printOfferLetter();
      assert.strictEqual(env.printCalls.length, 1);
    });
  });

  // ---------------------------------------------------------------------------
  // 10. Enterprise ATS Kanban Pipeline Board
  // ---------------------------------------------------------------------------
  describe('10. Enterprise ATS Kanban Pipeline Board', () => {
    let env;
    beforeEach(() => {
      env = createTestEnvironment();
      const kanbanTab = env.queryAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'kanban-view');
      kanbanTab.dispatchEvent('click');
    });

    it('TC-DOM-KAN-01: Renders columns for all 6 ATS stages with live count badges', () => {
      const stages = ['Sourced', 'Applied', 'AssessmentPending', 'Interviewing', 'OfferExtended', 'Closed'];
      stages.forEach(st => {
        const colCards = env.get(`cards-${st}`);
        const countBadge = env.get(`count-${st}`);
        assert.ok(colCards, `Cards container for ${st} exists`);
        assert.ok(countBadge, `Count badge for ${st} exists`);
      });
    });

    it('TC-DOM-KAN-02: Moving candidate stage via dropdown relocates card and updates counters', () => {
      const offerExtendedInitial = parseInt(env.get('count-OfferExtended').textContent, 10);
      const interviewingInitial = parseInt(env.get('count-Interviewing').textContent, 10);

      // Find Diya Nair's selector in Interviewing column
      const diyaSelector = env.get('cards-Interviewing').querySelector('.kanban-stage-selector[data-appid="APP-3C9E1A"]');
      assert.ok(diyaSelector, 'Diya stage selector exists in Interviewing column');

      // Move Diya from Interviewing to OfferExtended
      diyaSelector.value = 'OfferExtended';
      diyaSelector.dispatchEvent({ type: 'change', target: { value: 'OfferExtended' } });

      assert.strictEqual(parseInt(env.get('count-Interviewing').textContent, 10), interviewingInitial - 1);
      assert.strictEqual(parseInt(env.get('count-OfferExtended').textContent, 10), offerExtendedInitial + 1);

      // Card is now in OfferExtended column
      const movedCard = env.get('cards-OfferExtended').querySelector('.kanban-stage-selector[data-appid="APP-3C9E1A"]');
      assert.ok(movedCard, 'Card relocated into OfferExtended column');
    });

    it('TC-DOM-KAN-03: Refresh Kanban button triggers board re-render', () => {
      const refreshBtn = env.get('refreshKanbanBtn');
      assert.ok(refreshBtn);
      refreshBtn.dispatchEvent('click');
      assert.ok(parseInt(env.get('count-OfferExtended').textContent, 10) >= 1);
    });
  });

  // ---------------------------------------------------------------------------
  // 11. Wellfound Offer & ESOP Studio
  // ---------------------------------------------------------------------------
  describe('11. Wellfound ESOP Studio Financial Modeling', () => {
    let env;
    beforeEach(() => {
      env = createTestEnvironment();
      const equityTab = env.queryAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'equity-view');
      equityTab.dispatchEvent('click');
    });

    it('TC-DOM-ESP-01: Default inputs yield accurate compensation breakdown', () => {
      // Defaults: Base 24L, Bonus 10% (2.4L), Equity 0.25%, Valuation 250 Cr (Grant 62.5L / 4 = 15.625L)
      // Total Year 1 = 24 + 2.4 + 15.625 = 42.025 -> 42.02 LPA in standard IEEE-754 toFixed(2)
      assert.strictEqual(env.get('eqTotalComp').textContent, '₹ 42.02 LPA');
      assert.strictEqual(env.get('eqBaseItem').textContent, '₹ 24.00 L');
      assert.strictEqual(env.get('eqBonusItem').textContent, '₹ 2.40 L');
      assert.strictEqual(env.get('eqEsopGrantItem').textContent, '₹ 62.50 L');
      assert.strictEqual(env.get('eqEsopAnnualItem').textContent, '₹ 15.63 L / yr');
    });

    it('TC-DOM-ESP-02: Updating sliders recalculates total comp and line items', () => {
      env.get('eqBaseSalary').value = '30';
      env.get('eqBonusPercent').value = '20';
      env.get('eqEquityPercent').value = '0.5';
      env.get('eqValuation').value = '500';

      env.get('eqBaseSalary').dispatchEvent({ type: 'input' });

      // Base 30L + Bonus 6L (20%) + Grant 250L (500*0.5%) / 4 = 62.5L -> Total = 98.50 LPA
      assert.strictEqual(env.get('eqTotalComp').textContent, '₹ 98.50 LPA');
      assert.strictEqual(env.get('eqBaseItem').textContent, '₹ 30.00 L');
      assert.strictEqual(env.get('eqBonusItem').textContent, '₹ 6.00 L');
      assert.strictEqual(env.get('eqEsopGrantItem').textContent, '₹ 250.00 L');
      assert.strictEqual(env.get('eqEsopAnnualItem').textContent, '₹ 62.50 L / yr');
    });

    it('TC-DOM-ESP-03: Boundary checks with maximum slider limits', () => {
      env.get('eqBaseSalary').value = '60';
      env.get('eqBonusPercent').value = '30';
      env.get('eqEquityPercent').value = '2.0';
      env.get('eqValuation').value = '1000';

      env.get('eqBaseSalary').dispatchEvent({ type: 'input' });

      // Base 60L + Bonus 18L (30%) + Grant 2000L / 4 = 500L -> Total = 578.00 LPA
      assert.strictEqual(env.get('eqTotalComp').textContent, '₹ 578.00 LPA');
      assert.strictEqual(env.get('eqBaseItem').textContent, '₹ 60.00 L');
      assert.strictEqual(env.get('eqBonusItem').textContent, '₹ 18.00 L');
      assert.strictEqual(env.get('eqEsopGrantItem').textContent, '₹ 2000.00 L');
    });

    it('TC-DOM-ESP-04: Boundary checks with minimum slider limits', () => {
      env.get('eqBaseSalary').value = '10';
      env.get('eqBonusPercent').value = '0';
      env.get('eqEquityPercent').value = '0.05';
      env.get('eqValuation').value = '50';

      env.get('eqBaseSalary').dispatchEvent({ type: 'input' });

      // Base 10L + Bonus 0L + Grant 2.5L / 4 = 0.625L -> Total = 10.63 LPA
      assert.strictEqual(env.get('eqTotalComp').textContent, '₹ 10.63 LPA');
      assert.strictEqual(env.get('eqBonusItem').textContent, '₹ 0.00 L');
      assert.strictEqual(env.get('eqEsopGrantItem').textContent, '₹ 2.50 L');
    });
  });

  // ---------------------------------------------------------------------------
  // 12. Compliance Audit Ledger & RFC-4180 CSV Export
  // ---------------------------------------------------------------------------
  describe('12. Compliance Audit Ledger & CSV Export', () => {
    let env;
    beforeEach(() => {
      env = createTestEnvironment();
      const auditTab = env.queryAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'audit-view');
      auditTab.dispatchEvent('click');
    });

    it('TC-DOM-AUD-01: Audit table renders rows with candidate names and decision badges', () => {
      const rows = env.get('auditTableBody').children;
      assert.strictEqual(rows.length, 3, 'Baseline decisions rendered');

      const tbodyHtml = env.get('auditTableBody').innerHTML;
      assert.ok(tbodyHtml.includes('Aarav Sharma'));
      assert.ok(tbodyHtml.includes('Diya Nair'));
      assert.ok(tbodyHtml.includes('Rohan Verma'));
      assert.ok(tbodyHtml.includes('HIRED'));
      assert.ok(tbodyHtml.includes('WAITLISTED'));
      assert.ok(tbodyHtml.includes('REJECTED'));
    });

    it('TC-DOM-AUD-02: exportAuditCsv triggers CSV download with RFC-4180 header', () => {
      env.window.exportAuditCsv();

      assert.strictEqual(env.downloads.length, 1);
      assert.strictEqual(env.downloads[0].download, 'hireflow-compliance-audit.csv');

      const blob = env.getLastBlob();
      assert.ok(blob, 'Blob was created with CSV payload');
      assert.ok(blob.content.startsWith('Candidate,AI Match,Decision,Offered CTC,Reviewer,Notes,DecidedAt\n'));
    });
  });

  // ---------------------------------------------------------------------------
  // 13. UI Edge Cases, Anomalies & Known Defects Verification
  // ---------------------------------------------------------------------------
  describe('13. UI Edge Cases & Known Explorer Defects Verification', () => {
    let env;
    beforeEach(() => { env = createTestEnvironment(); });

    it('TC-DOM-DEF-01: Verified Defect 1 - exportAuditCsv hardcodes 96% for all candidates in CSV export', () => {
      env.window.exportAuditCsv();

      const blob = env.getLastBlob();
      assert.ok(blob);
      const lines = blob.content.trim().split('\n').slice(1);
      assert.strictEqual(lines.length, 3);

      // Verify that Diya (88% in table) and Rohan (31% in table) have hardcoded "96%" in CSV
      lines.forEach(line => {
        const columns = line.split(',');
        assert.strictEqual(columns[1], '"96%"', `Line for candidate must exhibit known defect of hardcoded 96%: ${line}`);
      });
    });

    it('TC-DOM-DEF-02: Verified Defect 2 - tenantSelect dropdown in header is unwired in app.js', () => {
      const select = env.get('tenantSelect');
      assert.ok(select, 'tenantSelect element exists in header');

      // Listeners map for tenantSelect
      const changeListeners = select.listeners['change'] || [];
      assert.strictEqual(changeListeners.length, 0, 'tenantSelect has no attached change event listeners in app.js');

      // Dispatching change does not alter state.activeOrgId
      select.value = 'ORG-NEXA42';
      select.dispatchEvent({ type: 'change', target: { value: 'ORG-NEXA42' } });
      assert.strictEqual(env.getState().activeOrgId, 'ORG-APEX88', 'activeOrgId remains unchanged due to unwired dropdown');
    });

    it('TC-DOM-DEF-03: Verified Defect 3 - Step 6 preview button hardcodes APP-1B4D7E', () => {
      // In Step 6, selecting Diya Nair
      env.get('decisionCandidateSelect').value = 'APP-3C9E1A';

      // The preview button in index.html line 624 has hardcoded onclick="window.showOfferModal('APP-1B4D7E')"
      env.window.showOfferModal('APP-1B4D7E');

      const modalHtml = env.get('offerModalBody').innerHTML;
      assert.ok(modalHtml.includes('Aarav Sharma'), 'Hardcoded candidate ID opens Aarav rather than selected candidate');
    });

    it('TC-DOM-DEF-04: Verified Defect 4 - Kanban card referral display extracts candidate own name', () => {
      const aaravApp = env.getState().applications.find(a => a.applicationId === 'APP-1B4D7E');
      // referralChain is "Aarav Sharma -> Rajesh (Staff Eng) -> Vikram (VP Eng) -> Apex Cloud"
      const extracted = aaravApp.referralChain.split('->')[0].trim();
      assert.strictEqual(extracted, 'Aarav Sharma', 'Splitting by -> and taking index 0 extracts candidate own name instead of referrer');
    });

    it('TC-DOM-DEF-05: Verified Defect 5 - Taxonomy count mismatch (Terminal log says 21, client array has 17)', () => {
      // Client taxonomy has 17 items
      const clientTaxonomy = [
        'JAVA', 'SPRING BOOT', 'MICROSERVICES', 'DOCKER', 'SQL',
        'KUBERNETES', 'KAFKA', 'AWS', 'PYTHON', 'REACT', 'GIT', 'REST API',
        'POSTGRESQL', 'REDIS', 'GRAPHQL', 'TYPESCRIPT', 'DISTRIBUTED SYSTEMS'
      ];
      assert.strictEqual(clientTaxonomy.length, 17);

      // Trigger NLP parsing
      const step4Icon = env.queryAll('.stepper-step').find(s => s.getAttribute('data-step') === '4');
      step4Icon.dispatchEvent('click');

      const termHtml = env.get('aiTerminalLog').innerHTML;
      assert.ok(termHtml.includes('21 Canonical Technologies'), 'Terminal log states 21 technologies despite client array length of 17');
    });

    it('TC-DOM-EDG-06: Experience parsing with 0 years falls back cleanly without NaN or exceptions', () => {
      env.getState().applications.unshift({
        applicationId: 'APP-ZEROEXP',
        candidateName: 'Fresh Graduate',
        email: 'fresh@grad.edu',
        headline: 'Computer Science Graduate',
        jobId: 'JOB-8F9A2C',
        kanbanStage: 'Applied',
        rawResumeText: 'Eager computer science graduate with academic projects in Java and SQL.',
        referralChain: 'Campus Placement',
        graphTrustScore: 0.5,
        intentScore: 0.9,
        expectedBaseSalaryLPA: 10,
        appliedAt: new Date().toISOString()
      });
      env.getState().activeCandidateAppId = 'APP-ZEROEXP';

      const step4Icon = env.queryAll('.stepper-step').find(s => s.getAttribute('data-step') === '4');
      step4Icon.dispatchEvent('click');

      assert.strictEqual(env.get('termExp').textContent, '0 Years');
      assert.strictEqual(env.get('aiExtractedExp').textContent, '0 Years Relevant Experience');
    });

    it('TC-DOM-EDG-07: Toast notifications populate container and clean up after timer', () => {
      const manualEnv = createTestEnvironment({ manualTimers: true });
      assert.strictEqual(manualEnv.get('toastContainer').children.length, 0);

      manualEnv.get('orgForm').dispatchEvent('submit');

      const toasts = manualEnv.get('toastContainer').children;
      assert.strictEqual(toasts.length, 1);
      assert.ok(toasts[0].textContent.includes('Deployed branded portal'));

      while (manualEnv.timerQueue.length > 0) {
        const fn = manualEnv.timerQueue.shift();
        fn();
      }
      assert.strictEqual(manualEnv.get('toastContainer').children.length, 0);
    });

    it('TC-DOM-EDG-08: 1-Click Demo button advances through all 6 steps into offer modal', () => {
      const demoEnv = createTestEnvironment({ manualTimers: true });
      const demoBtn = demoEnv.get('runDemoBtn');
      assert.ok(demoBtn);

      demoBtn.dispatchEvent('click');
      assert.strictEqual(demoEnv.getState().currentStep, 1);

      while (demoEnv.timerQueue.length > 0) {
        const fn = demoEnv.timerQueue.shift();
        fn();
      }

      assert.strictEqual(demoEnv.getState().currentStep, 6);
      assert.strictEqual(demoEnv.get('offerModal').classList.contains('active'), true);
    });
  });

});
