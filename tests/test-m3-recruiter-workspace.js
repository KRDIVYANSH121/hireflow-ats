/**
 * HIREFLOW + OMNITALENT: MILESTONE M3 RECRUITER WORKSPACE TEST SUITE
 * 
 * Verifies:
 * - Job Requisition Studio DOM & Form Structure (#recruiter-studio-view, #jobStudioForm, tags, weights)
 * - Job Studio Mutations (load, edit, add/delete mandatory & preferred skill tags, save new/existing, archive)
 * - Candidate Pipeline DOM & Toolbar Dual-View (Kanban 6 stages, Table view, toggle buttons, filter)
 * - Candidate Pipeline Rendering, Filtering & Stage Moving (avatar, match badge, stage selector mutation)
 * - Comprehensive AI Evaluation Report Modal (#aiReportModal, 70/20/10 chips, 4-factor radar, questions)
 * - Interview Scorecard Modal & Decision Actions (#scorecardModal, rubric sliders, offer/hold/reject, audit ledger)
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
    this.disabled = false;
    this.files = [];
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

  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name.toLowerCase() === 'class') this.className = value;
    if (name.toLowerCase() === 'id') this.id = value;
    if (name.toLowerCase() === 'value') this._value = String(value);
    if (name.toLowerCase() === 'disabled') this.disabled = true;
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

  return { root, elementsById, sandbox, mockWindow };
}

describe('Milestone M3: Recruiter Workspace (Studio, Pipeline & AI Reports)', () => {

  // ===========================================================================
  // 1. Job Requisition Studio DOM & Form Structure
  // ===========================================================================
  describe('1. Job Requisition Studio DOM Structure', () => {
    let env;
    beforeEach(() => { env = setupTestEnv(); });

    it('M3-DOM-01: #recruiter-studio-view contains #jobStudioForm and selector dropdown', () => {
      const studioView = env.elementsById.get('recruiter-studio-view');
      assert.ok(studioView, '#recruiter-studio-view must exist');

      const studioForm = env.elementsById.get('jobStudioForm');
      assert.ok(studioForm, '#jobStudioForm must exist');

      const jobSelect = env.elementsById.get('studioJobSelect');
      assert.ok(jobSelect, '#studioJobSelect dropdown must exist');

      const createBtn = env.elementsById.get('createNewJobBtn');
      assert.ok(createBtn, '#createNewJobBtn button must exist');
    });

    it('M3-DOM-02: All job specification inputs exist in #jobStudioForm', () => {
      const expectedIds = [
        'jobStudioTitle',
        'jobStudioDept',
        'jobStudioLocation',
        'jobStudioType',
        'jobStudioMinSalary',
        'jobStudioMaxSalary',
        'jobStudioExp',
        'jobStudioEquity',
        'jobStudioDesc'
      ];
      expectedIds.forEach(id => {
        const el = env.elementsById.get(id);
        assert.ok(el, `#${id} input must exist in #jobStudioForm`);
      });
    });

    it('M3-DOM-03: Mandatory & Preferred skills tag managers exist with quick-add controls', () => {
      const mandTags = env.elementsById.get('studioMandatoryTags');
      const mandInput = env.elementsById.get('newStudioMandatoryInput');
      const mandBtn = env.elementsById.get('addStudioMandatoryBtn');
      assert.ok(mandTags, '#studioMandatoryTags must exist');
      assert.ok(mandInput, '#newStudioMandatoryInput must exist');
      assert.ok(mandBtn, '#addStudioMandatoryBtn must exist');

      const prefTags = env.elementsById.get('studioPreferredTags');
      const prefInput = env.elementsById.get('newStudioPreferredInput');
      const prefBtn = env.elementsById.get('addStudioPreferredBtn');
      assert.ok(prefTags, '#studioPreferredTags must exist');
      assert.ok(prefInput, '#newStudioPreferredInput must exist');
      assert.ok(prefBtn, '#addStudioPreferredBtn must exist');
    });

    it('M3-DOM-04: Visual balancing weight bar displays 70% Core, 20% Preferred, 10% Exp', () => {
      const studioView = env.elementsById.get('recruiter-studio-view');
      const ruleBar = studioView.querySelector('.rule-bar');
      assert.ok(ruleBar, '.rule-bar element must exist in studio');

      const coreSeg = studioView.querySelector('.rule-seg-core');
      const prefSeg = studioView.querySelector('.rule-seg-pref');
      const expSeg = studioView.querySelector('.rule-seg-exp');
      assert.ok(coreSeg, '.rule-seg-core must exist');
      assert.ok(prefSeg, '.rule-seg-pref must exist');
      assert.ok(expSeg, '.rule-seg-exp must exist');
      assert.ok(coreSeg.textContent.includes('70%'), 'Core segment must mention 70%');
      assert.ok(prefSeg.textContent.includes('20%'), 'Preferred segment must mention 20%');
      assert.ok(expSeg.textContent.includes('10%'), 'Experience segment must mention 10%');
    });

    it('M3-DOM-05: Save and Archive action buttons exist in studio', () => {
      const saveBtn = env.elementsById.get('saveJobStudioBtn');
      const deleteBtn = env.elementsById.get('deleteJobStudioBtn');
      assert.ok(saveBtn, '#saveJobStudioBtn must exist');
      assert.ok(deleteBtn, '#deleteJobStudioBtn must exist');
    });
  });

  // ===========================================================================
  // 2. Job Requisition Studio Interactive Mutations
  // ===========================================================================
  describe('2. Job Requisition Studio Interactive Mutations', () => {
    let env;
    beforeEach(() => {
      env = setupTestEnv();
      env.mockWindow.hireflowAuth.loginAs('RECRUITER_HR', 'vikram');
    });

    it('M3-STUDIO-01: Selecting existing job in #studioJobSelect populates inputs and skill tags', () => {
      const jobSelect = env.elementsById.get('studioJobSelect');
      jobSelect.value = 'JOB-3D7E1A'; // Staff Architect
      jobSelect.dispatchEvent('change');

      const titleInput = env.elementsById.get('jobStudioTitle');
      assert.ok(titleInput.value.includes('Staff Distributed Systems Architect'), 'Title should load Staff Architect');

      const mandContainer = env.elementsById.get('studioMandatoryTags');
      assert.ok(mandContainer.children.length >= 3, 'Mandatory skill tags should be rendered');
    });

    it('M3-STUDIO-02: Clicking #createNewJobBtn resets form for new requisition entry', () => {
      const createBtn = env.elementsById.get('createNewJobBtn');
      createBtn.dispatchEvent('click');

      const titleInput = env.elementsById.get('jobStudioTitle');
      assert.equal(titleInput.value, '', 'Job title input should be empty for new requisition');

      const mandContainer = env.elementsById.get('studioMandatoryTags');
      assert.equal(mandContainer.children.length, 0, 'Mandatory tags should be cleared');
    });

    it('M3-STUDIO-03: Adding a mandatory skill via #addStudioMandatoryBtn renders chip in container', () => {
      const mandInput = env.elementsById.get('newStudioMandatoryInput');
      const addBtn = env.elementsById.get('addStudioMandatoryBtn');
      const mandContainer = env.elementsById.get('studioMandatoryTags');

      const initialCount = mandContainer.children.length;
      mandInput.value = 'RUST';
      addBtn.dispatchEvent('click');

      assert.equal(mandContainer.children.length, initialCount + 1, 'Chip count should increase by 1');
      assert.ok(mandContainer.textContent.includes('RUST'), 'Rendered chips should include RUST');
    });

    it('M3-STUDIO-04: Adding a preferred skill via #addStudioPreferredBtn renders chip in container', () => {
      const prefInput = env.elementsById.get('newStudioPreferredInput');
      const addBtn = env.elementsById.get('addStudioPreferredBtn');
      const prefContainer = env.elementsById.get('studioPreferredTags');

      const initialCount = prefContainer.children.length;
      prefInput.value = 'GRAPHQL';
      addBtn.dispatchEvent('click');

      assert.equal(prefContainer.children.length, initialCount + 1, 'Chip count should increase by 1');
      assert.ok(prefContainer.textContent.includes('GRAPHQL'), 'Rendered chips should include GRAPHQL');
    });

    it('M3-STUDIO-05: Submitting #jobStudioForm updates target job in state.jobs and updates live job feed', () => {
      const form = env.elementsById.get('jobStudioForm');
      const titleInput = env.elementsById.get('jobStudioTitle');
      const minSal = env.elementsById.get('jobStudioMinSalary');

      titleInput.value = 'Principal Backend Architect (Java & Distributed Streams)';
      minSal.value = '35';

      form.dispatchEvent('submit');

      const updatedJob = env.mockWindow.state.jobs.find(j => j.jobId === 'JOB-8F9A2C');
      assert.equal(updatedJob.title, 'Principal Backend Architect (Java & Distributed Streams)');
      assert.equal(updatedJob.minSalaryLPA, 35);
    });

    it('M3-STUDIO-06: Creating and saving a new job requisition appends to state.jobs', () => {
      const createBtn = env.elementsById.get('createNewJobBtn');
      createBtn.dispatchEvent('click');

      const titleInput = env.elementsById.get('jobStudioTitle');
      const deptInput = env.elementsById.get('jobStudioDept');
      titleInput.value = 'AI / ML Infrastructure Engineer';
      deptInput.value = 'Machine Learning Platform';

      const mandInput = env.elementsById.get('newStudioMandatoryInput');
      mandInput.value = 'PYTHON';
      env.elementsById.get('addStudioMandatoryBtn').dispatchEvent('click');

      const initialLength = env.mockWindow.state.jobs.length;
      env.elementsById.get('jobStudioForm').dispatchEvent('submit');

      assert.equal(env.mockWindow.state.jobs.length, initialLength + 1, 'state.jobs should increase by 1');
      const newJob = env.mockWindow.state.jobs[env.mockWindow.state.jobs.length - 1];
      assert.equal(newJob.title, 'AI / ML Infrastructure Engineer');
      assert.ok(newJob.mandatorySkills.includes('PYTHON'));
    });

    it('M3-STUDIO-07: Archiving opening via #deleteJobStudioBtn removes job from state.jobs', () => {
      const initialCount = env.mockWindow.state.jobs.length;
      const deleteBtn = env.elementsById.get('deleteJobStudioBtn');
      deleteBtn.dispatchEvent('click');

      assert.equal(env.mockWindow.state.jobs.length, initialCount - 1, 'state.jobs length should decrease by 1');
    });
  });

  // ===========================================================================
  // 3. Candidate Pipeline DOM & Dual-View Toolbar
  // ===========================================================================
  describe('3. Candidate Pipeline DOM & Toolbar Structure', () => {
    let env;
    beforeEach(() => { env = setupTestEnv(); });

    it('M3-PIPE-01: #recruiter-pipeline-view contains toolbar with job filter and toggle buttons', () => {
      const pipeView = env.elementsById.get('recruiter-pipeline-view');
      assert.ok(pipeView, '#recruiter-pipeline-view must exist');

      const filterSelect = env.elementsById.get('pipelineJobFilter');
      const kanbanToggle = env.elementsById.get('toggleKanbanBtn');
      const tableToggle = env.elementsById.get('toggleTableBtn');

      assert.ok(filterSelect, '#pipelineJobFilter dropdown must exist');
      assert.ok(kanbanToggle, '#toggleKanbanBtn button must exist');
      assert.ok(tableToggle, '#toggleTableBtn button must exist');
    });

    it('M3-PIPE-02: Kanban view contains 6 stage columns with header titles and count badges', () => {
      const kanbanView = env.elementsById.get('pipelineKanbanView');
      assert.ok(kanbanView, '#pipelineKanbanView must exist');

      const stages = ['Sourced', 'Applied', 'AssessmentPending', 'Interviewing', 'OfferExtended', 'Closed'];
      stages.forEach(st => {
        const countBadge = env.elementsById.get(`pipeline-count-${st}`);
        const cardsCont = env.elementsById.get(`pipeline-cards-${st}`);
        assert.ok(countBadge, `#pipeline-count-${st} count badge must exist`);
        assert.ok(cardsCont, `#pipeline-cards-${st} cards container must exist`);
      });
    });

    it('M3-PIPE-03: Table view exists with #pipelineTableView and #pipelineTableBody', () => {
      const tableView = env.elementsById.get('pipelineTableView');
      const tableBody = env.elementsById.get('pipelineTableBody');
      assert.ok(tableView, '#pipelineTableView must exist');
      assert.ok(tableBody, '#pipelineTableBody must exist');
    });

    it('M3-PIPE-04: Toggling between Kanban and Table switches visibility cleanly', () => {
      const kanbanToggle = env.elementsById.get('toggleKanbanBtn');
      const tableToggle = env.elementsById.get('toggleTableBtn');
      const kanbanView = env.elementsById.get('pipelineKanbanView');
      const tableView = env.elementsById.get('pipelineTableView');

      // Click Table
      tableToggle.dispatchEvent('click');
      assert.equal(kanbanView.style.display, 'none', 'Kanban view should be hidden');
      assert.equal(tableView.style.display, 'block', 'Table view should be visible');
      assert.ok(tableToggle.classList.contains('active'), 'Table toggle button should be active');

      // Click Kanban
      kanbanToggle.dispatchEvent('click');
      assert.equal(kanbanView.style.display, 'grid', 'Kanban view should be visible');
      assert.equal(tableView.style.display, 'none', 'Table view should be hidden');
      assert.ok(kanbanToggle.classList.contains('active'), 'Kanban toggle button should be active');
    });
  });

  // ===========================================================================
  // 4. Candidate Pipeline Rendering, Filtering & Stage Moving
  // ===========================================================================
  describe('4. Candidate Pipeline Rendering & Stage Transitions', () => {
    let env;
    beforeEach(() => { env = setupTestEnv(); });

    it('M3-PIPE-05: Kanban columns render candidate cards with avatar, match badge, and stage mover', () => {
      const offerCol = env.elementsById.get('pipeline-cards-OfferExtended');
      assert.ok(offerCol, 'OfferExtended cards column must exist');
      assert.ok(offerCol.children.length >= 1, 'Aarav Sharma should be in OfferExtended column');

      const card = offerCol.children[0];
      assert.ok(card.textContent.includes('Aarav Sharma'), 'Card must render candidate name');
      assert.ok(card.textContent.includes('96%'), 'Card must render 96% AI match badge');

      const stageMover = card.querySelector('.kanban-stage-selector');
      assert.ok(stageMover, 'Card must have .kanban-stage-selector dropdown');

      const aiReportBtn = card.querySelector('.btn-view-ai-report');
      const scorecardBtn = card.querySelector('.btn-open-scorecard');
      assert.ok(aiReportBtn, 'Card must have .btn-view-ai-report button');
      assert.ok(scorecardBtn, 'Card must have .btn-open-scorecard button');
    });

    it('M3-PIPE-06: Moving candidate stage via .kanban-stage-selector mutates app.kanbanStage', () => {
      const interviewCol = env.elementsById.get('pipeline-cards-Interviewing');
      assert.ok(interviewCol.children.length >= 1, 'Diya Nair should be in Interviewing column');

      const diyaCard = interviewCol.children[0];
      const stageMover = diyaCard.querySelector('.kanban-stage-selector');
      stageMover.value = 'OfferExtended';
      stageMover.dispatchEvent('change');

      const diyaApp = env.mockWindow.state.applications.find(a => a.candidateName === 'Diya Nair');
      assert.equal(diyaApp.kanbanStage, 'OfferExtended', 'Diya kanbanStage should be mutated to OfferExtended');

      // Verify count updated
      const offerCount = env.elementsById.get('pipeline-count-OfferExtended');
      assert.ok(parseInt(offerCount.textContent, 10) >= 2, 'OfferExtended count should increment');
    });

    it('M3-PIPE-07: Table view renders candidate rows with stage mover and action triggers', () => {
      const tableBody = env.elementsById.get('pipelineTableBody');
      assert.ok(tableBody.children.length >= 3, 'Table body must render rows for seed candidates');

      const firstRow = tableBody.children[0];
      const mover = firstRow.querySelector('.kanban-stage-selector');
      assert.ok(mover, 'Table row must include .kanban-stage-selector');
      assert.ok(firstRow.querySelector('.btn-view-ai-report'), 'Table row must include .btn-view-ai-report');
      assert.ok(firstRow.querySelector('.btn-open-scorecard'), 'Table row must include .btn-open-scorecard');
    });

    it('M3-PIPE-08: Filtering by specific job requisition filters candidate cards in pipeline', () => {
      const filterSelect = env.elementsById.get('pipelineJobFilter');
      filterSelect.value = 'JOB-3D7E1A'; // Architect opening with 0 applicants initially
      filterSelect.dispatchEvent('change');

      const countApplied = env.elementsById.get('pipeline-count-Applied');
      assert.equal(countApplied.textContent, '0', 'Applied count should be 0 for job without applicants');

      // Reset to ALL
      filterSelect.value = 'ALL';
      filterSelect.dispatchEvent('change');
      const countOffer = env.elementsById.get('pipeline-count-OfferExtended');
      assert.ok(parseInt(countOffer.textContent, 10) >= 1, 'Resetting to ALL restores candidate cards');
    });
  });

  // ===========================================================================
  // 5. Comprehensive AI Evaluation Report Modal
  // ===========================================================================
  describe('5. Comprehensive AI Evaluation Report Modal', () => {
    let env;
    beforeEach(() => { env = setupTestEnv(); });

    it('M3-REP-01: #aiReportModal structure exists with header, body and action buttons', () => {
      const modal = env.elementsById.get('aiReportModal');
      const body = env.elementsById.get('aiReportModalBody');
      const closeBtn = env.elementsById.get('closeAiReportBtn');
      const dismissBtn = env.elementsById.get('dismissAiReportBtn');
      const openScorecardBtn = env.elementsById.get('reportOpenScorecardBtn');

      assert.ok(modal, '#aiReportModal must exist');
      assert.ok(body, '#aiReportModalBody must exist');
      assert.ok(closeBtn, '#closeAiReportBtn must exist');
      assert.ok(dismissBtn, '#dismissAiReportBtn must exist');
      assert.ok(openScorecardBtn, '#reportOpenScorecardBtn must exist');
    });

    it('M3-REP-02: window.showAiEvaluationReport populates candidate header and match radial gauge', () => {
      env.mockWindow.showAiEvaluationReport('APP-1B4D7E'); // Aarav Sharma

      const modal = env.elementsById.get('aiReportModal');
      assert.ok(modal.classList.contains('active'), 'Modal should have active class');

      const body = env.elementsById.get('aiReportModalBody');
      assert.ok(body.textContent.includes('Aarav Sharma'), 'Body must display candidate name');
      assert.ok(body.textContent.includes('96%'), 'Body must display 96% match score');
      assert.ok(body.textContent.includes('Strong Hire'), 'Body must display recommendation badge');
    });

    it('M3-REP-03: AI Report renders 70/20/10 itemized breakdown with matched and gap chips', () => {
      env.mockWindow.showAiEvaluationReport('APP-1B4D7E');
      const body = env.elementsById.get('aiReportModalBody');

      assert.ok(body.textContent.includes('Mandatory Skills (70% Weight)'), 'Must render mandatory skills section');
      assert.ok(body.textContent.includes('Preferred Skills (20% Weight)'), 'Must render preferred skills section');
      assert.ok(body.textContent.includes('Experience Alignment (10% Weight)'), 'Must render experience alignment section');

      const mandChips = body.querySelectorAll('.chip-mandatory');
      assert.ok(mandChips.length >= 4, 'Must render multiple matched mandatory chips');
    });

    it('M3-REP-04: AI Report renders 4-factor OmniTalent hybrid radar metrics and formula', () => {
      env.mockWindow.showAiEvaluationReport('APP-1B4D7E');
      const body = env.elementsById.get('aiReportModalBody');

      assert.ok(body.textContent.includes('Semantic Similarity (40% Weight)'), 'Must include Semantic similarity');
      assert.ok(body.textContent.includes('Keyword BM25 / Hard Skills (30% Weight)'), 'Must include Keyword BM25');
      assert.ok(body.textContent.includes('Social Graph Trust & Proximity (15% Weight)'), 'Must include Social Graph trust');
      assert.ok(body.textContent.includes('Intent & Activity Velocity (15% Weight)'), 'Must include Intent velocity');
      assert.ok(body.textContent.includes('Composite Hybrid Score'), 'Must display composite hybrid pill');
    });

    it('M3-REP-05: AI Report renders qualitative key strengths, gaps, and tailored questions', () => {
      env.mockWindow.showAiEvaluationReport('APP-1B4D7E');
      const body = env.elementsById.get('aiReportModalBody');

      assert.ok(body.textContent.includes('Key Strengths:'), 'Must include Key Strengths header');
      assert.ok(body.textContent.includes('Identified Skill Gaps:'), 'Must include Skill Gaps header');
      assert.ok(body.textContent.includes('Tailored Technical Interview Questions:'), 'Must include Interview Questions');
    });

    it('M3-REP-06: Clicking #reportOpenScorecardBtn closes report and opens scorecard modal', () => {
      env.mockWindow.showAiEvaluationReport('APP-1B4D7E');
      const openScorecardBtn = env.elementsById.get('reportOpenScorecardBtn');
      openScorecardBtn.dispatchEvent('click');

      const reportModal = env.elementsById.get('aiReportModal');
      assert.equal(reportModal.classList.contains('active'), false, 'Report modal should be closed');

      const scorecardModal = env.elementsById.get('scorecardModal');
      assert.equal(scorecardModal.classList.contains('active'), true, 'Scorecard modal should be active');
    });
  });

  // ===========================================================================
  // 6. Interview Scorecard Modal & Decision Actions
  // ===========================================================================
  describe('6. Interview Scorecard Modal & Decision Submission', () => {
    let env;
    beforeEach(() => {
      env = setupTestEnv();
      env.mockWindow.hireflowAuth.loginAs('RECRUITER_HR', 'vikram');
    });

    it('M3-SCORE-01: #scorecardModal structure exists with rubric sliders, reviewer input and buttons', () => {
      const modal = env.elementsById.get('scorecardModal');
      const form = env.elementsById.get('modalScorecardForm');
      assert.ok(modal, '#scorecardModal must exist');
      assert.ok(form, '#modalScorecardForm must exist');

      const sliders = ['modalScoreSysDesign', 'modalScoreCoding', 'modalScoreProblem', 'modalScoreCulture'];
      sliders.forEach(s => {
        assert.ok(env.elementsById.get(s), `#${s} slider must exist`);
      });

      assert.ok(env.elementsById.get('modalReviewerName'), '#modalReviewerName input must exist');
      assert.ok(env.elementsById.get('modalOfferedCTC'), '#modalOfferedCTC input must exist');
      assert.ok(env.elementsById.get('modalDecisionNotes'), '#modalDecisionNotes input must exist');
      assert.ok(env.elementsById.get('scorecardOfferBtn'), '#scorecardOfferBtn must exist');
      assert.ok(env.elementsById.get('scorecardWaitlistBtn'), '#scorecardWaitlistBtn must exist');
      assert.ok(env.elementsById.get('scorecardRejectBtn'), '#scorecardRejectBtn must exist');
    });

    it('M3-SCORE-02: window.openScorecardModal populates applicant header and salary defaults', () => {
      env.mockWindow.openScorecardModal('APP-3C9E1A'); // Diya Nair

      const nameEl = env.elementsById.get('scorecardCandName');
      const idInput = env.elementsById.get('scorecardAppId');
      assert.equal(nameEl.textContent, 'Diya Nair');
      assert.equal(idInput.value, 'APP-3C9E1A');

      const modal = env.elementsById.get('scorecardModal');
      assert.ok(modal.classList.contains('active'), 'Scorecard modal must be active');
    });

    it('M3-SCORE-03: Moving rubric slider updates numeric value display label', () => {
      env.mockWindow.openScorecardModal('APP-3C9E1A');
      const slider = env.elementsById.get('modalScoreCoding');
      slider.value = 4;
      slider.dispatchEvent('input');

      const label = env.elementsById.get('valModalCoding');
      assert.equal(label.textContent, '4 / 5', 'Value label must update to 4 / 5');
    });

    it('M3-SCORE-04: Submitting Offer extends offer, updates candidate stage to OfferExtended, and appends to audit ledger', () => {
      env.mockWindow.openScorecardModal('APP-3C9E1A'); // Diya Nair (originally in Interviewing)

      const ctcInput = env.elementsById.get('modalOfferedCTC');
      ctcInput.value = '26.5';
      const notesInput = env.elementsById.get('modalDecisionNotes');
      notesInput.value = 'Exceptional coding challenge performance. Immediate hiring recommendation.';

      const initialAuditCount = env.elementsById.get('auditTableBody').children.length;

      // Click Extend Offer
      const offerBtn = env.elementsById.get('scorecardOfferBtn');
      offerBtn.dispatchEvent('click');

      // Verify candidate stage updated
      const diyaApp = env.mockWindow.state.applications.find(a => a.applicationId === 'APP-3C9E1A');
      assert.equal(diyaApp.kanbanStage, 'OfferExtended', 'Candidate stage should be OfferExtended');

      // Verify decision record created
      const decision = env.mockWindow.state.decisions.find(d => d.applicationId === 'APP-3C9E1A');
      assert.ok(decision, 'Decision record should exist in state.decisions');
      assert.equal(decision.decisionType, 'SelectedForOffer');
      assert.equal(decision.offeredCTC, 26.5);

      // Verify audit table refreshed
      const auditTbody = env.elementsById.get('auditTableBody');
      assert.ok(auditTbody.children.length >= initialAuditCount, 'Audit table should reflect new decision');
      assert.ok(auditTbody.textContent.includes('Diya Nair'), 'Audit table must mention Diya Nair');

      // Verify modal closed
      const modal = env.elementsById.get('scorecardModal');
      assert.equal(modal.classList.contains('active'), false, 'Scorecard modal should be closed');
    });

    it('M3-SCORE-05: Submitting Waitlist records HoldWaitlist decision and retains candidate in Interviewing', () => {
      env.mockWindow.openScorecardModal('APP-1B4D7E'); // Aarav
      const waitlistBtn = env.elementsById.get('scorecardWaitlistBtn');
      waitlistBtn.dispatchEvent('click');

      const app = env.mockWindow.state.applications.find(a => a.applicationId === 'APP-1B4D7E');
      assert.equal(app.kanbanStage, 'Interviewing');

      const decision = env.mockWindow.state.decisions.find(d => d.applicationId === 'APP-1B4D7E');
      assert.equal(decision.decisionType, 'HoldWaitlist');
    });

    it('M3-SCORE-06: Submitting Reject records Rejected decision and moves candidate to Closed', () => {
      env.mockWindow.openScorecardModal('APP-3C9E1A'); // Diya
      const rejectBtn = env.elementsById.get('scorecardRejectBtn');
      rejectBtn.dispatchEvent('click');

      const app = env.mockWindow.state.applications.find(a => a.applicationId === 'APP-3C9E1A');
      assert.equal(app.kanbanStage, 'Closed');

      const decision = env.mockWindow.state.decisions.find(d => d.applicationId === 'APP-3C9E1A');
      assert.equal(decision.decisionType, 'Rejected');
    });
  });

});
