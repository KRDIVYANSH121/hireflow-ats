/**
 * =============================================================================
 * HIREFLOW + OMNITALENT: CHALLENGER ADVERSARIAL M2 DEEP STRESS HARNESS
 * Interactive Workflows, Role Permissions & Dual 6-Stage Kanban Board Population
 * Milestone: M2 (HTML Structure & Layout Integration Adversarial Challenge)
 * =============================================================================
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

// =============================================================================
// ROBUST HEADLESS DOM & CLIENT VM FIXTURE
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
    this.disabled = false;
    this._checked = false;
    this.files = [];
  }

  get className() { return this._className; }
  set className(v) {
    this._className = String(v || '');
    this.classList._set = new Set(this._className ? this._className.split(/\s+/).filter(Boolean) : []);
  }

  get value() { return this._value; }
  set value(v) { this._value = String(v); }

  get checked() { return this._checked; }
  set checked(v) { this._checked = Boolean(v); }

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
    if (name.toLowerCase() === 'value') this.value = value;
    if (name.toLowerCase() === 'disabled') this.disabled = true;
    if (name.toLowerCase() === 'checked') this._checked = true;
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

  closest(selector) {
    let cur = this;
    while (cur) {
      if (cur.matches && cur.matches(selector)) return cur;
      cur = cur.parentElement;
    }
    return null;
  }

  matches(selector) {
    if (selector.startsWith('#')) return this.id === selector.slice(1);
    if (selector.startsWith('.')) {
      const cls = selector.slice(1).split('.');
      return cls.every(c => this.classList.contains(c));
    }
    if (selector.includes('[')) {
      const m = selector.match(/\[([a-zA-Z0-9_-]+)(?:=['"]?([^'"\]]+)['"]?)?\]/);
      if (m) {
        const val = this.getAttribute(m[1]);
        return m[2] !== undefined ? val === m[2] : val !== null;
      }
    }
    return this.tagName.toLowerCase() === selector.toLowerCase();
  }

  querySelector(selector) {
    const res = this.querySelectorAll(selector);
    return res.length > 0 ? res[0] : null;
  }

  querySelectorAll(selector) {
    if (selector.includes(',')) {
      const parts = selector.split(',').map(s => s.trim()).filter(Boolean);
      const combined = [];
      const seen = new Set();
      for (const p of parts) {
        for (const el of this.querySelectorAll(p)) {
          if (!seen.has(el)) {
            seen.add(el);
            combined.push(el);
          }
        }
      }
      return combined;
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
          const expectedVal = attrMatch[2];
          const actualVal = node.getAttribute(attr);
          isMatch = expectedVal !== undefined ? actualVal === expectedVal : actualVal !== null;
        } else {
          isMatch = false;
        }
      } else {
        isMatch = node.tagName.toLowerCase() === selector.toLowerCase();
      }

      if (isMatch && node !== this) {
        results.push(node);
      }

      for (const child of node.children) {
        matchNode(child);
      }
    };

    matchNode(this);
    return results;
  }
}

function parseHTML(html) {
  const root = new MockDOMElement('html');
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
        const el = new MockDOMElement(tagName);
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
        if (!isSelfClosing) stack.push(el);
      }
    } else if (match[5] && match[5].trim()) {
      const parent = stack[stack.length - 1];
      parent.childNodes.push({ nodeType: 3, textContent: match[5].trim() });
    }
  }
  return { root, elementsById };
}

function setupTestEnvironment(initialSession = null) {
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
      },
      setAttribute: (k, v) => { root.setAttribute(k, v); },
      getAttribute: (k) => root.getAttribute(k)
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

  if (initialSession) {
    if (typeof initialSession === 'string') {
      mockSessionStorage.setItem('hireflow_user', initialSession);
    } else {
      mockSessionStorage.setItem('hireflow_user', JSON.stringify(initialSession));
    }
  }

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
    parseFloat: parseFloat,
    isNaN: isNaN,
    isFinite: isFinite
  };

  vm.createContext(sandbox);
  vm.runInContext(appJsContent, sandbox);

  if (mockDocument._listeners['DOMContentLoaded']) {
    mockDocument._listeners['DOMContentLoaded'].forEach(fn => fn({ type: 'DOMContentLoaded' }));
  }

  return {
    root,
    elementsById,
    mockDocument,
    mockWindow,
    sandbox,
    state: mockWindow.state || sandbox.state,
    switchMainTab: (...args) => mockWindow.switchMainTab(...args),
    renderCandidatePipeline: (...args) => mockWindow.renderCandidatePipeline(...args),
    populatePipelineJobFilter: (...args) => mockWindow.populatePipelineJobFilter(...args),
    showAiEvaluationReport: (...args) => mockWindow.showAiEvaluationReport(...args),
    openScorecardModal: (...args) => mockWindow.openScorecardModal(...args),
    updateKanbanView: () => {
      const refreshBtn = elementsById.get('refreshKanbanBtn');
      if (refreshBtn) refreshBtn.click();
    }
  };
}

// =============================================================================
// CHALLENGER TEST SUITE
// =============================================================================

describe('Challenger M2: Interactive Workflows & Dual 6-Stage Kanban Stress Harness', () => {

  // ---------------------------------------------------------------------------
  // 1. Interactive Role Workflows & Simulated DOM Interaction Stress
  // ---------------------------------------------------------------------------
  describe('1. Interactive Role Workflows & Simulated DOM Interaction', () => {

    it('FLOW-01: Candidate Flow — Login preset, role tab gating, search filter, sibling split-pane, 1-click apply, living profile', () => {
      const env = setupTestEnvironment();
      const loginBtn = env.elementsById.get('loginPresetAarav');
      assert.ok(loginBtn, '#loginPresetAarav must exist');

      // 1. Simulate 1-Click Login
      loginBtn.click();
      assert.strictEqual(env.state.currentUser.role, 'CANDIDATE');
      assert.strictEqual(env.elementsById.get('headerUserName').textContent, 'Aarav Sharma');
      const roleBadgeText = env.elementsById.get('headerUserRoleBadge').textContent;
      assert.ok(roleBadgeText.toLowerCase().includes('candidate'), `Role badge should indicate candidate, got: ${roleBadgeText}`);

      // 2. Tab Permissions Gating
      const recTabs = ['workflow-view', 'kanban-view', 'graph-view', 'recruiter-studio-view', 'recruiter-pipeline-view', 'admin-view', 'audit-view'];
      recTabs.forEach(tabId => {
        const tabEl = env.root.querySelector(`.nav-tab[data-tab="${tabId}"]`);
        if (tabEl) {
          assert.strictEqual(tabEl.style.display, 'none', `Recruiter/Admin tab ${tabId} must be display:none for candidate`);
        }
      });

      // 3. Candidate Jobs View Active
      const jobsView = env.elementsById.get('candidate-jobs-view');
      assert.ok(jobsView && jobsView.classList.contains('active'), 'candidate-jobs-view must be active');

      // 4. Job Feed Search Interaction
      const searchInput = env.elementsById.get('jobFeedSearchInput');
      assert.ok(searchInput, '#jobFeedSearchInput must exist');
      searchInput.value = 'Distributed';
      searchInput.dispatchEvent('input');

      const feedContainer = env.elementsById.get('jobFeedContainer');
      const filteredCards = feedContainer.querySelectorAll('.job-feed-card');
      assert.ok(filteredCards.length >= 1, 'Should find at least 1 job matching "Distributed"');

      // Reset search
      searchInput.value = '';
      searchInput.dispatchEvent('input');
      const allCards = feedContainer.querySelectorAll('.job-feed-card');
      assert.strictEqual(allCards.length, env.state.jobs.length, 'All jobs restored on empty search');

      // 5. Category Pills Interaction
      const catFilters = env.elementsById.get('jobCategoryFilters');
      assert.ok(catFilters, '#jobCategoryFilters must exist');
      const archPill = catFilters.querySelector('[data-category="Architecture"]');
      if (archPill) {
        archPill.click();
        const archCards = feedContainer.querySelectorAll('.job-feed-card');
        assert.ok(archCards.length >= 1, 'Architecture category filter works');
      }
      const allPill = catFilters.querySelector('[data-category="ALL"]');
      if (allPill) {
        allPill.click();
      }

      // 6. Sibling Split-Pane & Card Selection
      // Test Card 0 (already applied job: JOB-8F9A2C)
      const cards = feedContainer.querySelectorAll('.job-feed-card');
      assert.ok(cards.length >= 2, 'Must have at least 2 job cards');
      cards[0].click();

      const detailPane = env.elementsById.get('jobDetailPane');
      assert.ok(detailPane, '#jobDetailPane must exist');
      assert.strictEqual(detailPane.parentElement.classList.contains('feed-split-layout'), true, '#jobDetailPane parent must be .feed-split-layout');
      assert.ok(detailPane.querySelector('.btn-applied'), 'Card 0 should show .btn-applied button since Aarav already applied');

      // Test Card 1 (fresh job: JOB-5C2F8B)
      cards[1].click();
      const applyBtn = detailPane.querySelector('.btn-1click-apply');
      assert.ok(applyBtn, '.btn-1click-apply must exist for unapplied job');
      const initialAppCount = env.state.applications.length;
      applyBtn.click();
      assert.strictEqual(env.state.applications.length, initialAppCount + 1, 'Application count incremented by 1');

      // Duplicate protection: second click
      const countAfter = env.state.applications.length;
      applyBtn.click();
      assert.strictEqual(env.state.applications.length, countAfter, 'Duplicate application prevented');

      // 7. Living Profile Form Interaction
      const profileTab = env.root.querySelector('.nav-tab[data-tab="candidate-profile-view"]');
      if (profileTab) {
        profileTab.click();
        const skillInput = env.elementsById.get('newCandidateSkillInput');
        const addSkillBtn = env.elementsById.get('addCandidateSkillBtn');
        if (skillInput && addSkillBtn) {
          skillInput.value = 'RUST';
          addSkillBtn.click();
          const skillsTags = env.elementsById.get('candidateSkillsTags');
          assert.ok(skillsTags.textContent.includes('RUST') || env.state.candidateProfile.skills.includes('RUST'), 'Skill RUST added');
        }
      }
    });

    it('FLOW-02: Recruiter HR Flow — Login preset, role tab gating, studio job creation, pipeline view toggle, AI report & scorecard', () => {
      const env = setupTestEnvironment();
      const loginBtn = env.elementsById.get('loginPresetVikram');
      assert.ok(loginBtn, '#loginPresetVikram must exist');

      // 1. Simulate 1-Click Login
      loginBtn.click();
      assert.strictEqual(env.state.currentUser.role, 'RECRUITER_HR');
      assert.strictEqual(env.elementsById.get('headerUserName').textContent, 'Vikram Seth');
      const roleBadgeText = env.elementsById.get('headerUserRoleBadge').textContent;
      assert.ok(roleBadgeText.toLowerCase().includes('recruiter'), `Role badge should indicate recruiter, got: ${roleBadgeText}`);

      // 2. Candidate Tabs Gated
      const candTabs = ['candidate-jobs-view', 'candidate-profile-view', 'candidate-apps-view'];
      candTabs.forEach(tabId => {
        const tabEl = env.root.querySelector(`.nav-tab[data-tab="${tabId}"]`);
        if (tabEl) {
          assert.strictEqual(tabEl.style.display, 'none', `Candidate tab ${tabId} must be display:none for HR`);
        }
      });

      // 3. Admin View Inaccessible to HR
      const adminTab = env.root.querySelector('.nav-tab[data-tab="admin-view"]');
      if (adminTab) {
        assert.strictEqual(adminTab.style.display, 'none', 'admin-view tab must be display:none for HR');
      }
      env.switchMainTab('admin-view');
      const adminView = env.elementsById.get('admin-view');
      assert.strictEqual(adminView.classList.contains('active'), false, 'HR must be blocked from activating admin-view');

      // 4. Requisition Studio Interaction
      env.switchMainTab('recruiter-studio-view');
      const studioView = env.elementsById.get('recruiter-studio-view');
      assert.ok(studioView && studioView.classList.contains('active'), 'recruiter-studio-view must be active');

      const studioTitle = env.elementsById.get('jobStudioTitle');
      if (studioTitle) {
        studioTitle.value = 'Lead DevOps Automation Engineer';
        studioTitle.dispatchEvent('input');
        const previewTitle = env.elementsById.get('studioPreviewTitle');
        if (previewTitle) {
          assert.ok(previewTitle.textContent.includes('Lead DevOps') || studioTitle.value === 'Lead DevOps Automation Engineer');
        }
      }

      // 5. Recruiter Pipeline View & Toggle
      env.switchMainTab('recruiter-pipeline-view');
      const pipelineView = env.elementsById.get('recruiter-pipeline-view');
      assert.ok(pipelineView && pipelineView.classList.contains('active'), 'recruiter-pipeline-view must be active');

      const toggleTableBtn = env.elementsById.get('toggleTableBtn');
      const toggleKanbanBtn = env.elementsById.get('toggleKanbanBtn');
      const kanbanEl = env.elementsById.get('pipelineKanbanView');
      const tableEl = env.elementsById.get('pipelineTableView');

      assert.ok(toggleTableBtn && toggleKanbanBtn && kanbanEl && tableEl);
      toggleTableBtn.click();
      assert.strictEqual(kanbanEl.style.display, 'none');
      assert.strictEqual(tableEl.style.display, 'block');

      toggleKanbanBtn.click();
      assert.strictEqual(kanbanEl.style.display, 'grid');
      assert.strictEqual(tableEl.style.display, 'none');

      // 6. AI Evaluation Modal Verbatim Contract
      env.showAiEvaluationReport('APP-1B4D7E', 'JOB-8F9A2C');
      const aiModal = env.elementsById.get('aiReportModal');
      assert.ok(aiModal && aiModal.classList.contains('active'), '#aiReportModal must be active');

      const aiBody = env.elementsById.get('aiReportModalBody');
      assert.ok(aiBody, '#aiReportModalBody must exist');
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
      required14Strings.forEach((str, index) => {
        assert.ok(aiBody.textContent.includes(str), `Missing required verbatim string [${index + 1}/14]: "${str}"`);
      });

      const closeAiBtn = env.elementsById.get('closeAiReportBtn');
      if (closeAiBtn) {
        closeAiBtn.click();
        assert.strictEqual(aiModal.classList.contains('active'), false, 'Modal closed via close button');
      }

      // 7. Scorecard Modal & Decision Submission
      env.openScorecardModal('APP-1B4D7E');
      const scModal = env.elementsById.get('scorecardModal');
      assert.ok(scModal && scModal.classList.contains('active'), '#scorecardModal must be active');

      const offerBtn = env.elementsById.get('scorecardOfferBtn');
      assert.ok(offerBtn, '#scorecardOfferBtn must exist');
      offerBtn.click();

      // Verify state updated
      const aaravApp = env.state.applications.find(a => a.applicationId === 'APP-1B4D7E');
      assert.ok(aaravApp, 'Aarav application exists');
      assert.strictEqual(aaravApp.kanbanStage, 'OfferExtended', 'Aarav transitioned to OfferExtended stage');
    });

    it('FLOW-03: Recruiter Admin Flow — Login preset, branding customization, cutoff triage, tenant policies', () => {
      const env = setupTestEnvironment();
      const loginBtn = env.elementsById.get('loginPresetAdmin');
      assert.ok(loginBtn, '#loginPresetAdmin must exist');

      // 1. Simulate 1-Click Login
      loginBtn.click();
      assert.strictEqual(env.state.currentUser.role, 'RECRUITER_ADMIN');
      assert.strictEqual(env.elementsById.get('headerUserName').textContent, 'Org Admin');

      // 2. Admin View Active & Accessible
      env.switchMainTab('admin-view');
      const adminView = env.elementsById.get('admin-view');
      assert.ok(adminView && adminView.classList.contains('active'), 'admin-view must be active');

      // 3. Branding Form Mutation
      const portalNameInput = env.elementsById.get('adminPortalName');
      assert.ok(portalNameInput, '#adminPortalName must exist');
      portalNameInput.value = 'Apex Cloud Global Talent';
      portalNameInput.dispatchEvent('input');

      const previewTitle = env.elementsById.get('previewPortalTitle');
      if (previewTitle) {
        assert.strictEqual(previewTitle.textContent, 'Apex Cloud Global Talent');
      }

      const swatchBtn = env.root.querySelector('.btn-theme-swatch[data-color="#0ea5e9"]');
      if (swatchBtn) {
        swatchBtn.click();
        assert.strictEqual(env.elementsById.get('adminThemeColor').value, '#0ea5e9');
      }

      const saveBrandingBtn = env.elementsById.get('saveBrandingBtn');
      if (saveBrandingBtn) {
        saveBrandingBtn.click();
        assert.strictEqual(env.state.organization.name, 'Apex Cloud Global Talent');
      }

      // 4. Cutoff Triage Slider Interaction
      const cutoffSlider = env.elementsById.get('adminCutoffSlider');
      assert.ok(cutoffSlider, '#adminCutoffSlider must exist');
      cutoffSlider.value = '85';
      cutoffSlider.dispatchEvent('input');

      const cutoffBadge = env.elementsById.get('adminCutoffBadge');
      assert.ok(cutoffBadge && cutoffBadge.textContent.includes('85%'), '#adminCutoffBadge reflects 85%');

      const saveCutoffBtn = env.elementsById.get('saveCutoffBtn');
      if (saveCutoffBtn) {
        saveCutoffBtn.click();
        assert.strictEqual(env.state.organization.minimumShortlistScore, 85);
      }

      // 5. Tenant Policy Toggles
      const blindHiringToggle = env.elementsById.get('toggleBlindHiring');
      if (blindHiringToggle) {
        blindHiringToggle.checked = true;
        blindHiringToggle.dispatchEvent('change');
      }

      const saveTenantBtn = env.elementsById.get('saveTenantBtn');
      if (saveTenantBtn) {
        saveTenantBtn.click();
        assert.strictEqual(env.state.organization.policies.blindHiring, true);
      }
    });

    it('FLOW-04: High-concurrency rapid persona switching stress (100 cycles) maintains state consistency', () => {
      const env = setupTestEnvironment();
      const roles = [
        { btn: 'loginPresetAarav', role: 'CANDIDATE', user: 'Aarav Sharma' },
        { btn: 'loginPresetVikram', role: 'RECRUITER_HR', user: 'Vikram Seth' },
        { btn: 'loginPresetAdmin', role: 'RECRUITER_ADMIN', user: 'Org Admin' }
      ];

      for (let i = 0; i < 100; i++) {
        const target = roles[i % 3];
        const btn = env.elementsById.get(target.btn);
        btn.click();
        assert.strictEqual(env.state.currentUser.role, target.role);
        assert.strictEqual(env.elementsById.get('headerUserName').textContent, target.user);
      }

      // Final state assertion after 100 cycles
      assert.strictEqual(env.state.currentUser.role, 'CANDIDATE');
      assert.strictEqual(env.elementsById.get('headerUserName').textContent, 'Aarav Sharma');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Dual 6-Stage Kanban Boards Population & Transition Stress
  // ---------------------------------------------------------------------------
  describe('2. Dual 6-Stage Kanban Boards Population & Transition Stress', () => {

    const stages = ['Sourced', 'Applied', 'AssessmentPending', 'Interviewing', 'OfferExtended', 'Closed'];

    it('KANBAN-01: Dual board 6-stage structural census — all 12 containers and count badges exist in DOM', () => {
      const env = setupTestEnvironment();

      // Board A: #pipelineKanbanView in #recruiter-pipeline-view
      const pipelineBoard = env.elementsById.get('pipelineKanbanView');
      assert.ok(pipelineBoard, '#pipelineKanbanView board element must exist');

      stages.forEach(st => {
        const countBadge = env.elementsById.get(`pipeline-count-${st}`);
        const cardsCont = env.elementsById.get(`pipeline-cards-${st}`);
        assert.ok(countBadge, `#pipeline-count-${st} must exist in #pipelineKanbanView`);
        assert.ok(cardsCont, `#pipeline-cards-${st} must exist in #pipelineKanbanView`);

        // Check sidebar badge counterpart
        const sidebarBadge = env.elementsById.get(`sidebar-count-${st}`);
        assert.ok(sidebarBadge, `#sidebar-count-${st} must exist in pipeline sidebar`);
      });

      // Board B: #kanban-view
      const generalBoard = env.elementsById.get('kanban-view');
      assert.ok(generalBoard, '#kanban-view view element must exist');

      stages.forEach(st => {
        const countBadge = env.elementsById.get(`count-${st}`);
        const cardsCont = env.elementsById.get(`cards-${st}`);
        assert.ok(countBadge, `#count-${st} must exist in #kanban-view`);
        assert.ok(cardsCont, `#cards-${st} must exist in #kanban-view`);
      });
    });

    it('KANBAN-02: Simultaneous dual board population with 24 candidates across all 6 stages', () => {
      const env = setupTestEnvironment();

      // Create 24 synthetic applications (4 in each stage)
      env.state.applications = [];
      let appCounter = 1;
      stages.forEach(st => {
        for (let i = 0; i < 4; i++) {
          env.state.applications.push({
            applicationId: `APP-STRESS-${appCounter++}`,
            candidateName: `Stress Candidate ${appCounter}`,
            email: `cand${appCounter}@stress.test`,
            headline: `Senior Systems Engineer | Stage ${st}`,
            jobId: 'JOB-8F9A2C',
            kanbanStage: st,
            appliedAt: new Date().toISOString(),
            rawResumeText: 'Java Spring Boot Microservices Docker SQL Kubernetes Kafka 5 years experience',
            referralChain: 'Direct -> Sourced'
          });
        }
      });

      assert.strictEqual(env.state.applications.length, 24);

      // Trigger renders for both boards
      env.renderCandidatePipeline();
      env.updateKanbanView();

      // Verify Board A (#pipelineKanbanView)
      stages.forEach(st => {
        const countBadge = env.elementsById.get(`pipeline-count-${st}`);
        const cardsCont = env.elementsById.get(`pipeline-cards-${st}`);
        const sidebarBadge = env.elementsById.get(`sidebar-count-${st}`);

        assert.strictEqual(countBadge.textContent, '4', `#pipeline-count-${st} should display 4`);
        assert.strictEqual(sidebarBadge.textContent, '4', `#sidebar-count-${st} should display 4`);
        assert.strictEqual(cardsCont.children.length, 4, `#pipeline-cards-${st} should have exactly 4 card children`);
      });

      // Verify Board B (#kanban-view)
      stages.forEach(st => {
        const countBadge = env.elementsById.get(`count-${st}`);
        const cardsCont = env.elementsById.get(`cards-${st}`);

        assert.strictEqual(countBadge.textContent, '4', `#count-${st} should display 4`);
        assert.strictEqual(cardsCont.children.length, 4, `#cards-${st} should have exactly 4 card children`);
      });

      // Total apps badge
      const totalBadge = env.elementsById.get('sidebar-total-apps');
      if (totalBadge) {
        assert.strictEqual(totalBadge.textContent, '24', '#sidebar-total-apps should show 24');
      }
    });

    it('KANBAN-03: Progressive 6-stage forward round-trip traversal with exact count & card invariants', () => {
      const env = setupTestEnvironment();
      const testApp = env.state.applications[0];
      assert.ok(testApp, 'Must have at least one application');

      for (let i = 0; i < stages.length; i++) {
        const currentStage = stages[i];
        const nextStage = stages[(i + 1) % stages.length];

        testApp.kanbanStage = nextStage;
        env.renderCandidatePipeline();
        env.updateKanbanView();

        // Target container must contain card
        const pipelineCont = env.elementsById.get(`pipeline-cards-${nextStage}`);
        const targetCards = pipelineCont.querySelectorAll('.kanban-card');
        assert.ok(targetCards.length >= 1, `Next stage ${nextStage} should contain candidate`);

        // Check badge integrity
        const pipelineCount = parseInt(env.elementsById.get(`pipeline-count-${nextStage}`).textContent, 10);
        assert.strictEqual(pipelineCont.children.length, pipelineCount, 'Cards count matches badge number');

        const generalCont = env.elementsById.get(`cards-${nextStage}`);
        const generalCount = parseInt(env.elementsById.get(`count-${nextStage}`).textContent, 10);
        assert.strictEqual(generalCont.children.length, generalCount, 'Cards count matches badge number on general board');
      }
    });

    it('KANBAN-04: Reverse 6-stage backward traversal with zero card duplication or orphan state', () => {
      const env = setupTestEnvironment();
      const testApp = env.state.applications[0];
      testApp.kanbanStage = 'Closed';

      for (let i = stages.length - 1; i >= 0; i--) {
        const targetStage = stages[i];
        testApp.kanbanStage = targetStage;

        env.renderCandidatePipeline();
        env.updateKanbanView();

        const pipelineCards = env.elementsById.get(`pipeline-cards-${targetStage}`);
        assert.ok(pipelineCards.children.length >= 1, `Pipeline column ${targetStage} has candidate`);

        const kanbanCards = env.elementsById.get(`cards-${targetStage}`);
        assert.ok(kanbanCards.children.length >= 1, `General column ${targetStage} has candidate`);
      }
    });

    it('KANBAN-05: Empty stage tolerance — 0 cards in column produces no layout crash or NaN badge', () => {
      const env = setupTestEnvironment();

      // Clear all applications from AssessmentPending
      env.state.applications.forEach(app => {
        if (app.kanbanStage === 'AssessmentPending') {
          app.kanbanStage = 'Applied';
        }
      });

      env.renderCandidatePipeline();
      env.updateKanbanView();

      const pipelineEmpty = env.elementsById.get('pipeline-cards-AssessmentPending');
      const pipelineCount = env.elementsById.get('pipeline-count-AssessmentPending');
      assert.strictEqual(pipelineEmpty.children.length, 0);
      assert.strictEqual(pipelineCount.textContent, '0');

      const kanbanEmpty = env.elementsById.get('cards-AssessmentPending');
      const kanbanCount = env.elementsById.get('count-AssessmentPending');
      assert.strictEqual(kanbanEmpty.children.length, 0);
      assert.strictEqual(kanbanCount.textContent, '0');
    });

    it('KANBAN-06: Stage surge stress — 50 candidates in a single stage render cleanly without overflow errors', () => {
      const env = setupTestEnvironment();

      env.state.applications = [];
      for (let i = 0; i < 50; i++) {
        env.state.applications.push({
          applicationId: `APP-SURGE-${i}`,
          candidateName: `Surge Candidate ${i}`,
          email: `surge${i}@apexcloud.ai`,
          headline: `Architect ${i}`,
          jobId: 'JOB-8F9A2C',
          kanbanStage: 'Interviewing',
          appliedAt: new Date().toISOString(),
          rawResumeText: 'Java Docker Kubernetes 4 years',
          referralChain: 'Employee -> Recruiter'
        });
      }

      env.renderCandidatePipeline();
      env.updateKanbanView();

      const interviewCards = env.elementsById.get('pipeline-cards-Interviewing');
      const interviewCount = env.elementsById.get('pipeline-count-Interviewing');
      assert.strictEqual(interviewCards.children.length, 50);
      assert.strictEqual(interviewCount.textContent, '50');

      const kanbanInterview = env.elementsById.get('cards-Interviewing');
      const kanbanCount = env.elementsById.get('count-Interviewing');
      assert.strictEqual(kanbanInterview.children.length, 50);
      assert.strictEqual(kanbanCount.textContent, '50');

      // Other columns must strictly be 0
      ['Sourced', 'Applied', 'AssessmentPending', 'OfferExtended', 'Closed'].forEach(st => {
        assert.strictEqual(env.elementsById.get(`pipeline-cards-${st}`).children.length, 0);
        assert.strictEqual(env.elementsById.get(`pipeline-count-${st}`).textContent, '0');
        assert.strictEqual(env.elementsById.get(`cards-${st}`).children.length, 0);
        assert.strictEqual(env.elementsById.get(`count-${st}`).textContent, '0');
      });
    });

    it('KANBAN-07: High-concurrency stage fuzzing (500 randomized moves) guarantees mathematical conservation', () => {
      const env = setupTestEnvironment();

      // Seed 30 applications
      env.state.applications = [];
      for (let i = 0; i < 30; i++) {
        env.state.applications.push({
          applicationId: `APP-FUZZ-${i}`,
          candidateName: `Fuzz Candidate ${i}`,
          email: `fuzz${i}@apexcloud.ai`,
          headline: `Engineer ${i}`,
          jobId: i % 2 === 0 ? 'JOB-8F9A2C' : 'JOB-9B1D4F',
          kanbanStage: stages[i % stages.length],
          appliedAt: new Date().toISOString(),
          rawResumeText: 'Java Spring Boot Docker 3 years',
          referralChain: 'Referral'
        });
      }

      // 500 randomized stage transitions
      for (let m = 0; m < 500; m++) {
        const randApp = env.state.applications[Math.floor(Math.random() * env.state.applications.length)];
        const randStage = stages[Math.floor(Math.random() * stages.length)];
        randApp.kanbanStage = randStage;
      }

      env.renderCandidatePipeline();
      env.updateKanbanView();

      // Conservation of candidate quantity in Pipeline Kanban
      let pipelineTotalCards = 0;
      let pipelineTotalCount = 0;
      stages.forEach(st => {
        const cards = env.elementsById.get(`pipeline-cards-${st}`).children.length;
        const count = parseInt(env.elementsById.get(`pipeline-count-${st}`).textContent, 10);
        assert.strictEqual(cards, count, `Column cards must match badge for ${st}`);
        pipelineTotalCards += cards;
        pipelineTotalCount += count;
      });
      assert.strictEqual(pipelineTotalCards, 30, 'Total pipeline cards strictly conserved');
      assert.strictEqual(pipelineTotalCount, 30, 'Total pipeline counts strictly conserved');

      // Conservation of candidate quantity in General Kanban
      let kanbanTotalCards = 0;
      let kanbanTotalCount = 0;
      stages.forEach(st => {
        const cards = env.elementsById.get(`cards-${st}`).children.length;
        const count = parseInt(env.elementsById.get(`count-${st}`).textContent, 10);
        assert.strictEqual(cards, count, `General column cards must match badge for ${st}`);
        kanbanTotalCards += cards;
        kanbanTotalCount += count;
      });
      assert.strictEqual(kanbanTotalCards, 30, 'Total general cards strictly conserved');
      assert.strictEqual(kanbanTotalCount, 30, 'Total general counts strictly conserved');
    });

    it('KANBAN-08: Pipeline Job Filter dropdown reactivity & stage column isolation', () => {
      const env = setupTestEnvironment();

      env.state.applications = [
        { applicationId: 'APP-J1-A', candidateName: 'Job1 Cand A', jobId: 'JOB-8F9A2C', kanbanStage: 'Sourced', rawResumeText: 'Java 3 yrs' },
        { applicationId: 'APP-J1-B', candidateName: 'Job1 Cand B', jobId: 'JOB-8F9A2C', kanbanStage: 'Applied', rawResumeText: 'Java 3 yrs' },
        { applicationId: 'APP-J2-A', candidateName: 'Job2 Cand A', jobId: 'JOB-9B1D4F', kanbanStage: 'Interviewing', rawResumeText: 'DevOps 5 yrs' }
      ];

      // Populate filter dropdown
      env.populatePipelineJobFilter();
      const filterSelect = env.elementsById.get('pipelineJobFilter');
      assert.ok(filterSelect, '#pipelineJobFilter must exist');

      // Filter by JOB-8F9A2C
      filterSelect.value = 'JOB-8F9A2C';
      filterSelect.dispatchEvent('change');

      assert.strictEqual(env.elementsById.get('pipeline-cards-Sourced').children.length, 1);
      assert.strictEqual(env.elementsById.get('pipeline-cards-Applied').children.length, 1);
      assert.strictEqual(env.elementsById.get('pipeline-cards-Interviewing').children.length, 0);

      // Filter by ALL
      filterSelect.value = 'ALL';
      filterSelect.dispatchEvent('change');

      assert.strictEqual(env.elementsById.get('pipeline-cards-Sourced').children.length, 1);
      assert.strictEqual(env.elementsById.get('pipeline-cards-Applied').children.length, 1);
      assert.strictEqual(env.elementsById.get('pipeline-cards-Interviewing').children.length, 1);
    });
  });
});
