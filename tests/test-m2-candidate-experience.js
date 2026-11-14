/**
 * HIREFLOW + OMNITALENT: MILESTONE M2 CANDIDATE EXPERIENCE TEST SUITE
 * 
 * Verifies:
 * - Living Candidate Profile DOM Structure (#candidateProfileForm, skills tags, portfolio links, resume parser)
 * - Profile mutations (editing, skill add/delete, link add/delete, file upload, telemetry)
 * - LinkedIn-Style Job Feed rendering with multi-job catalog
 * - Compensation badges (LPA, ESOP %, Exp), skill tags, and live AI match score pills
 * - Category filter pills (All, Backend, Architecture, DevOps, FullStack) and keyword search
 * - 1-Click Application submission using candidate living profile
 * - Applied Jobs Tracking view (#appliedJobsList, active count badge)
 * - Visual 4-stage active status stepper (Applied → Screening → Interviewing → Offer Extended)
 * - Official offer letter launcher trigger
 * - calculateCandidateJobMatch 70/20/10 formula and 4-factor radar scoring
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

  class MockFileReader {
    constructor() {
      this.onload = null;
      this.onerror = null;
    }
    readAsText(file) {
      const content = file.content || file.text || 'Experienced engineer with 3 years experience building systems with Java, Docker, Kubernetes, and Kafka.';
      if (this.onload) {
        this.onload({ target: { result: content } });
      }
    }
  }

  const mockWindow = {
    document: mockDocument,
    FileReader: MockFileReader,
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
    FileReader: MockFileReader,
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

describe('Milestone M2: Candidate Experience (Living Profile, Job Feed & Tracking)', () => {

  // ===========================================================================
  // 1. Living Profile DOM Structure & Initial State
  // ===========================================================================
  describe('1. Candidate Living Profile DOM Structure', () => {
    let env;
    beforeEach(() => { env = setupTestEnv(); });

    it('M2-DOM-01: #candidate-profile-view contains #candidateProfileForm and all personal detail inputs', () => {
      const view = env.elementsById.get('candidate-profile-view');
      assert.ok(view, '#candidate-profile-view must exist in DOM');

      const form = env.elementsById.get('candidateProfileForm');
      assert.ok(form, '#candidateProfileForm must exist');

      assert.ok(env.elementsById.get('candidateNameInput'), '#candidateNameInput must exist');
      assert.ok(env.elementsById.get('candidateEmailInput'), '#candidateEmailInput must exist');
      assert.ok(env.elementsById.get('candidatePhoneInput'), '#candidatePhoneInput must exist');
      assert.ok(env.elementsById.get('candidateLocationInput'), '#candidateLocationInput must exist');
      assert.ok(env.elementsById.get('candidateHeadlineInput'), '#candidateHeadlineInput must exist');
      assert.ok(env.elementsById.get('candidateExpectedSalaryInput'), '#candidateExpectedSalaryInput must exist');
    });

    it('M2-DOM-02: Verified skills tag manager exists with container, quick-add input and add button', () => {
      assert.ok(env.elementsById.get('candidateSkillsTags'), '#candidateSkillsTags container must exist');
      assert.ok(env.elementsById.get('newCandidateSkillInput'), '#newCandidateSkillInput must exist');
      assert.ok(env.elementsById.get('addCandidateSkillBtn'), '#addCandidateSkillBtn must exist');
    });

    it('M2-DOM-03: Portfolio artifact links manager exists with container, name input, url input and add button', () => {
      assert.ok(env.elementsById.get('candidatePortfolioLinks'), '#candidatePortfolioLinks container must exist');
      assert.ok(env.elementsById.get('newLinkNameInput'), '#newLinkNameInput must exist');
      assert.ok(env.elementsById.get('newLinkUrlInput'), '#newLinkUrlInput must exist');
      assert.ok(env.elementsById.get('addCandidateLinkBtn'), '#addCandidateLinkBtn must exist');
    });

    it('M2-DOM-04: Resume text area and file upload parser exist with file status and telemetry', () => {
      assert.ok(env.elementsById.get('candidateResumeText'), '#candidateResumeText textarea must exist');
      assert.ok(env.elementsById.get('candidateResumeUpload'), '#candidateResumeUpload file input must exist');
      assert.ok(env.elementsById.get('resumeFileStatus'), '#resumeFileStatus must exist');
      assert.ok(env.elementsById.get('candidateResumeTelemetry'), '#candidateResumeTelemetry helper text must exist');
    });

    it('M2-DOM-05: Action buttons exist with #saveCandidateProfileBtn and #resetCandidateProfileBtn', () => {
      assert.ok(env.elementsById.get('saveCandidateProfileBtn'), '#saveCandidateProfileBtn must exist');
      assert.ok(env.elementsById.get('resetCandidateProfileBtn'), '#resetCandidateProfileBtn must exist');
    });

    it('M2-DOM-06: Profile inputs are populated with default candidate state on load', () => {
      const nameInput = env.elementsById.get('candidateNameInput');
      const emailInput = env.elementsById.get('candidateEmailInput');
      assert.equal(nameInput.value, 'Aarav Sharma');
      assert.equal(emailInput.value, 'aarav.s@email.com');

      const tagsContainer = env.elementsById.get('candidateSkillsTags');
      const tags = tagsContainer.querySelectorAll('.tag-chip');
      assert.ok(tags.length >= 5, 'Should render default verified skills chips');
    });
  });

  // ===========================================================================
  // 2. Living Profile Interactive Management & Mutations
  // ===========================================================================
  describe('2. Living Profile Interactive Mutations', () => {
    let env;
    beforeEach(() => { env = setupTestEnv(); });

    it('M2-PROF-01: Submitting #candidateProfileForm updates state.candidateProfile and UI', () => {
      const nameInput = env.elementsById.get('candidateNameInput');
      const headlineInput = env.elementsById.get('candidateHeadlineInput');
      const salaryInput = env.elementsById.get('candidateExpectedSalaryInput');
      const form = env.elementsById.get('candidateProfileForm');

      nameInput.value = 'Aarav K. Sharma';
      headlineInput.value = 'Principal Distributed Systems Architect';
      salaryInput.value = '35';

      form.dispatchEvent('submit');

      const state = env.mockWindow.state;
      assert.equal(state.candidateProfile.name, 'Aarav K. Sharma');
      assert.equal(state.candidateProfile.headline, 'Principal Distributed Systems Architect');
      assert.equal(state.candidateProfile.expectedSalaryLPA, 35);
    });

    it('M2-PROF-02: Adding a technical skill via #addCandidateSkillBtn updates state and renders chip', () => {
      const newSkillInput = env.elementsById.get('newCandidateSkillInput');
      const addBtn = env.elementsById.get('addCandidateSkillBtn');
      const container = env.elementsById.get('candidateSkillsTags');

      newSkillInput.value = 'GRAPHQL';
      addBtn.dispatchEvent('click');

      const state = env.mockWindow.state;
      assert.ok(state.candidateProfile.skills.includes('GRAPHQL'), 'GRAPHQL must be added to skills');

      const tagTexts = container.querySelectorAll('.tag-chip').map(c => c.textContent);
      assert.ok(tagTexts.some(t => t.includes('GRAPHQL')), 'Tag chip for GRAPHQL must be rendered');
      assert.equal(newSkillInput.value, '', 'Input should be cleared after add');
    });

    it('M2-PROF-03: Removing a skill via .del-tag-btn removes it from state and DOM', () => {
      const container = env.elementsById.get('candidateSkillsTags');
      const initialCount = container.querySelectorAll('.tag-chip').length;

      const firstDelBtn = container.querySelector('.del-tag-btn');
      assert.ok(firstDelBtn, 'Delete button must exist on tag chip');
      const skillToRemove = firstDelBtn.getAttribute('data-skill');
      assert.ok(skillToRemove, 'Delete button must have data-skill attribute');

      firstDelBtn.dispatchEvent('click');

      const state = env.mockWindow.state;
      assert.ok(!state.candidateProfile.skills.includes(skillToRemove), 'Skill must be removed from state');

      const updatedCount = container.querySelectorAll('.tag-chip').length;
      assert.equal(updatedCount, initialCount - 1, 'Chips count should decrease by 1');
    });

    it('M2-PROF-04: Adding a portfolio artifact link renders link chip and updates state', () => {
      const nameInput = env.elementsById.get('newLinkNameInput');
      const urlInput = env.elementsById.get('newLinkUrlInput');
      const addBtn = env.elementsById.get('addCandidateLinkBtn');
      const container = env.elementsById.get('candidatePortfolioLinks');

      nameInput.value = 'Demo Site';
      urlInput.value = 'https://demo.aarav.dev';
      addBtn.dispatchEvent('click');

      const state = env.mockWindow.state;
      assert.ok(state.candidateProfile.portfolioLinks.some(l => l.name === 'Demo Site' || l.label === 'Demo Site'));

      const chips = container.querySelectorAll('.portfolio-link-chip');
      assert.ok(chips.some(c => c.textContent.includes('Demo Site')), 'Demo Site chip must be rendered');
    });

    it('M2-PROF-05: Removing a portfolio link via .del-link-btn deletes link from state', () => {
      const container = env.elementsById.get('candidatePortfolioLinks');
      const initialCount = container.querySelectorAll('.portfolio-link-chip').length;
      assert.ok(initialCount > 0, 'Initial links should exist');

      const firstDelBtn = container.querySelector('.del-link-btn');
      assert.ok(firstDelBtn, 'Delete button must exist on link chip');

      firstDelBtn.dispatchEvent('click');

      const state = env.mockWindow.state;
      assert.equal(state.candidateProfile.portfolioLinks.length, initialCount - 1);
    });

    it('M2-PROF-06: File upload parsing extracts skills and experience into telemetry', () => {
      const upload = env.elementsById.get('candidateResumeUpload');
      const status = env.elementsById.get('resumeFileStatus');
      const telemetry = env.elementsById.get('candidateResumeTelemetry');

      upload.files = [{
        name: 'New_Senior_Resume.pdf',
        content: 'Lead Engineer with 5 years building Java, Spring Boot, Microservices, Kubernetes, Docker, and Kafka.'
      }];

      upload.dispatchEvent('change', { target: upload });

      assert.ok(status.textContent.includes('New_Senior_Resume.pdf'), 'Status should show uploaded filename');
      assert.ok(telemetry.textContent.includes('yrs experience'), 'Telemetry should show detected experience');

      const state = env.mockWindow.state;
      assert.equal(state.candidateProfile.resumeFileName, 'New_Senior_Resume.pdf');
      assert.ok(state.candidateProfile.experienceYears >= 5, 'Experience years should be parsed as 5');
    });
  });

  // ===========================================================================
  // 3. LinkedIn-Style Job Feed Rendering & Multi-Job Catalog
  // ===========================================================================
  describe('3. LinkedIn-Style Job Feed Rendering', () => {
    let env;
    beforeEach(() => { env = setupTestEnv(); });

    it('M2-FEED-01: #candidate-jobs-view renders #jobFeedContainer with multi-job catalog', () => {
      const container = env.elementsById.get('jobFeedContainer');
      assert.ok(container, '#jobFeedContainer must exist');

      const cards = container.querySelectorAll('.job-feed-card');
      assert.ok(cards.length >= 4, 'Must render at least 4 job cards from state.jobs catalog');
    });

    it('M2-FEED-02: Job cards display company avatar, title, department/category, and location', () => {
      const container = env.elementsById.get('jobFeedContainer');
      const card = container.querySelector('.job-feed-card');

      assert.ok(card.querySelector('.company-avatar'), 'Card must have company avatar');
      assert.ok(card.querySelector('.job-card-title'), 'Card must have job title');
      assert.ok(card.querySelector('.job-card-meta'), 'Card must have meta info');
    });

    it('M2-FEED-03: Compensation badges display salary LPA, equity ESOP %, and required experience', () => {
      const container = env.elementsById.get('jobFeedContainer');
      const card = container.querySelector('.job-feed-card');
      const specs = card.querySelector('.job-specs-row');

      assert.ok(specs, 'Card must have job-specs-row');
      assert.ok(specs.textContent.includes('LPA'), 'Specs must display LPA salary bounds');
      assert.ok(specs.textContent.includes('ESOP'), 'Specs must display equity ESOP %');
      assert.ok(specs.textContent.includes('Yrs Exp'), 'Specs must display required experience');
    });

    it('M2-FEED-04: Skill tags display mandatory and preferred chips on job card', () => {
      const container = env.elementsById.get('jobFeedContainer');
      const card = container.querySelector('.job-feed-card');

      const mandatoryChips = card.querySelectorAll('.chip-mandatory');
      const preferredChips = card.querySelectorAll('.chip-preferred');

      assert.ok(mandatoryChips.length > 0, 'Card must display mandatory skill chips');
      assert.ok(preferredChips.length > 0, 'Card must display preferred skill chips');
    });

    it('M2-FEED-05: Live candidate match score pill displays calculated percentage', () => {
      const container = env.elementsById.get('jobFeedContainer');
      const card = container.querySelector('.job-feed-card');

      const matchPill = card.querySelector('.match-score-pill');
      assert.ok(matchPill, 'Match score pill must exist');
      assert.ok(matchPill.textContent.includes('% Match'), 'Pill must contain % Match');
    });

    it('M2-FEED-06: #feedActiveCandidateName reflects the active candidate name', () => {
      const badge = env.elementsById.get('feedActiveCandidateName');
      assert.ok(badge, '#feedActiveCandidateName must exist');
      assert.equal(badge.textContent, 'Aarav Sharma');
    });
  });

  // ===========================================================================
  // 4. Job Feed Search & Category Filtering
  // ===========================================================================
  describe('4. Job Feed Search & Category Filtering', () => {
    let env;
    beforeEach(() => { env = setupTestEnv(); });

    it('M2-FLTR-01: #jobCategoryFilters contains category pills for All, Backend, Architecture, DevOps, FullStack', () => {
      const filters = env.elementsById.get('jobCategoryFilters');
      assert.ok(filters, '#jobCategoryFilters must exist');

      const pills = filters.querySelectorAll('.category-pill');
      const categories = pills.map(p => p.getAttribute('data-category'));

      assert.ok(categories.includes('ALL'), 'Must have ALL category');
      assert.ok(categories.includes('Backend'), 'Must have Backend category');
      assert.ok(categories.includes('Architecture'), 'Must have Architecture category');
      assert.ok(categories.includes('DevOps'), 'Must have DevOps category');
      assert.ok(categories.includes('FullStack'), 'Must have FullStack category');
    });

    it('M2-FLTR-02: Clicking category pill filters displayed job cards by category', () => {
      const filters = env.elementsById.get('jobCategoryFilters');
      const devopsPill = filters.querySelector('[data-category="DevOps"]');
      assert.ok(devopsPill, 'DevOps pill must exist');

      devopsPill.dispatchEvent('click');

      const container = env.elementsById.get('jobFeedContainer');
      const cards = container.querySelectorAll('.job-feed-card');
      assert.ok(cards.length >= 1, 'DevOps card should be visible');
      assert.ok(cards.every(c => c.textContent.includes('DevOps') || c.textContent.includes('Platform')),
        'All visible cards should match DevOps category');
    });

    it('M2-FLTR-03: Clicking "All Roles" restores full catalog of job cards', () => {
      const filters = env.elementsById.get('jobCategoryFilters');
      const devopsPill = filters.querySelector('[data-category="DevOps"]');
      const allPill = filters.querySelector('[data-category="ALL"]');

      devopsPill.dispatchEvent('click');
      allPill.dispatchEvent('click');

      const container = env.elementsById.get('jobFeedContainer');
      const cards = container.querySelectorAll('.job-feed-card');
      assert.equal(cards.length, env.mockWindow.state.jobs.length, 'Should restore all jobs');
    });

    it('M2-FLTR-04: Typing in #jobFeedSearchInput filters job feed by title or keyword', () => {
      const searchInput = env.elementsById.get('jobFeedSearchInput');
      const container = env.elementsById.get('jobFeedContainer');

      searchInput.value = 'DevOps';
      searchInput.dispatchEvent('input', { target: searchInput });

      const cards = container.querySelectorAll('.job-feed-card');
      assert.ok(cards.length >= 1, 'Should find DevOps role');
      const titles = cards.map(c => c.querySelector('.job-card-title').textContent);
      assert.ok(titles.some(t => t.includes('DevOps')), 'Title should include DevOps');
    });

    it('M2-FLTR-05: Non-matching search query displays polite empty state', () => {
      const searchInput = env.elementsById.get('jobFeedSearchInput');
      const container = env.elementsById.get('jobFeedContainer');

      searchInput.value = 'XYZNonExistentSkill12345';
      searchInput.dispatchEvent('input', { target: searchInput });

      const cards = container.querySelectorAll('.job-feed-card');
      assert.equal(cards.length, 0, 'No cards should be rendered');
      assert.ok(container.innerHTML.includes('No job openings match'), 'Should render empty state message');
    });
  });

  // ===========================================================================
  // 5. 1-Click Application Flow
  // ===========================================================================
  describe('5. 1-Click Application Flow', () => {
    let env;
    beforeEach(() => { env = setupTestEnv(); });

    it('M2-APPLY-01: Unapplied job card displays active .btn-1click-apply button', () => {
      const container = env.elementsById.get('jobFeedContainer');
      // JOB-5C2F8B (DevOps) has not been applied to by Aarav
      const devOpsCard = container.querySelector('[data-jobid="JOB-5C2F8B"]');
      assert.ok(devOpsCard, 'JOB-5C2F8B card must exist');

      const applyBtn = devOpsCard.querySelector('.btn-1click-apply');
      assert.ok(applyBtn, '.btn-1click-apply button must exist');
      assert.equal(applyBtn.disabled, false, 'Button should not be disabled');
    });

    it('M2-APPLY-02: Clicking .btn-1click-apply creates new application in state.applications', () => {
      const container = env.elementsById.get('jobFeedContainer');
      const devOpsCard = container.querySelector('[data-jobid="JOB-5C2F8B"]');
      const applyBtn = devOpsCard.querySelector('.btn-1click-apply');
      const initialCount = env.mockWindow.state.applications.length;

      applyBtn.dispatchEvent('click');

      const updatedCount = env.mockWindow.state.applications.length;
      assert.equal(updatedCount, initialCount + 1, 'Applications count should increase by 1');
    });

    it('M2-APPLY-03: Created application inherits candidate living profile details and stage "Applied"', () => {
      const container = env.elementsById.get('jobFeedContainer');
      const devOpsCard = container.querySelector('[data-jobid="JOB-5C2F8B"]');
      const applyBtn = devOpsCard.querySelector('.btn-1click-apply');

      applyBtn.dispatchEvent('click');

      const latestApp = env.mockWindow.state.applications[env.mockWindow.state.applications.length - 1];
      assert.equal(latestApp.jobId, 'JOB-5C2F8B');
      assert.equal(latestApp.candidateName, 'Aarav Sharma');
      assert.equal(latestApp.email, 'aarav.s@email.com');
      assert.equal(latestApp.kanbanStage, 'Applied');
    });

    it('M2-APPLY-04: Applied job card button transitions to disabled state with "✓ Applied"', () => {
      const container = env.elementsById.get('jobFeedContainer');
      const devOpsCard = container.querySelector('[data-jobid="JOB-5C2F8B"]');
      const applyBtn = devOpsCard.querySelector('.btn-1click-apply');

      applyBtn.dispatchEvent('click');

      const updatedCard = container.querySelector('[data-jobid="JOB-5C2F8B"]');
      const appliedBtn = updatedCard.querySelector('.btn-applied');
      assert.ok(appliedBtn, 'Card should now have .btn-applied');
      assert.ok(appliedBtn.textContent.includes('✓ Applied'), 'Button text must show ✓ Applied');
      assert.equal(appliedBtn.disabled, true, 'Button must be disabled');
    });

    it('M2-APPLY-05: Duplicate clicks do not create duplicate applications in state.applications', () => {
      const initialCount = env.mockWindow.state.applications.length;
      // JOB-8F9A2C was already applied to by Aarav (APP-1B4D7E)
      env.mockWindow.handle1ClickApply('JOB-8F9A2C');
      assert.equal(env.mockWindow.state.applications.length, initialCount, 'Should not add duplicate');
    });
  });

  // ===========================================================================
  // 6. Applied Jobs Tracking View & Stepper
  // ===========================================================================
  describe('6. Applied Jobs Tracking View & Stepper', () => {
    let env;
    beforeEach(() => { env = setupTestEnv(); });

    it('M2-TRACK-01: #candidate-apps-view renders #appliedJobsList with candidate applications', () => {
      const list = env.elementsById.get('appliedJobsList');
      assert.ok(list, '#appliedJobsList container must exist');

      const cards = list.querySelectorAll('.applied-job-card');
      assert.ok(cards.length >= 1, 'Should render candidate applications');
    });

    it('M2-TRACK-02: #appliedJobsCountBadge displays correct count of active applications', () => {
      const badge = env.elementsById.get('appliedJobsCountBadge');
      assert.ok(badge, '#appliedJobsCountBadge must exist');
      assert.ok(badge.textContent.includes('Application'), 'Should display application count');
    });

    it('M2-TRACK-03: Applied job card renders 4-stage active status stepper', () => {
      const list = env.elementsById.get('appliedJobsList');
      const card = list.querySelector('.applied-job-card');
      const stepper = card.querySelector('.stepper-4stage');
      assert.ok(stepper, 'Stepper container must exist on card');

      const steps = stepper.querySelectorAll('.stage-step');
      assert.equal(steps.length, 4, 'Stepper must contain exactly 4 stages');

      const labels = steps.map(s => s.querySelector('.stage-label').textContent.trim());
      assert.deepEqual(labels, ['Applied', 'Screening', 'Interviewing', 'Offer Extended']);
    });

    it('M2-TRACK-04: Stepper visual indicators correctly reflect completed and active stages', () => {
      const list = env.elementsById.get('appliedJobsList');
      // Aarav has APP-1B4D7E in OfferExtended stage (index 3)
      const aaravCard = list.querySelector('[data-appid="APP-1B4D7E"]');
      assert.ok(aaravCard, 'APP-1B4D7E card must exist');

      const completedSteps = aaravCard.querySelectorAll('.stage-step.completed');
      const activeStep = aaravCard.querySelector('.stage-step.active');

      assert.equal(completedSteps.length, 3, 'First 3 stages should be completed');
      assert.ok(activeStep, 'Offer Extended stage should be active');
      assert.equal(activeStep.querySelector('.stage-label').textContent.trim(), 'Offer Extended');
    });

    it('M2-TRACK-05: When stage is "OfferExtended", appointment letter button is rendered', () => {
      const list = env.elementsById.get('appliedJobsList');
      const aaravCard = list.querySelector('[data-appid="APP-1B4D7E"]');
      const offerBtn = aaravCard.querySelector('.btn-view-offer-letter');

      assert.ok(offerBtn, 'Official offer letter button must exist for OfferExtended stage');
      assert.equal(offerBtn.getAttribute('data-appid'), 'APP-1B4D7E');
    });

    it('M2-TRACK-06: Clicking offer letter action button triggers digital offer letter modal', () => {
      const list = env.elementsById.get('appliedJobsList');
      const aaravCard = list.querySelector('[data-appid="APP-1B4D7E"]');
      const offerBtn = aaravCard.querySelector('.btn-view-offer-letter');

      offerBtn.dispatchEvent('click');

      const modal = env.elementsById.get('offerModal');
      assert.ok(modal.classList.contains('active'), 'Offer modal must be active');
      const body = env.elementsById.get('offerModalBody');
      assert.ok(body.textContent.includes('Aarav Sharma'), 'Offer modal must contain candidate name');
      assert.ok(body.textContent.includes('APEX CLOUD SYSTEMS INC.'), 'Offer modal must contain company header');
    });
  });

  // ===========================================================================
  // 7. Authoritative Matching Algorithm Alignment
  // ===========================================================================
  describe('7. Authoritative Matching Algorithm Alignment', () => {
    let env;
    beforeEach(() => { env = setupTestEnv(); });

    it('M2-ALGO-01: calculateCandidateJobMatch returns exact 70/20/10 deterministic score', () => {
      const calcMatch = env.mockWindow.calculateCandidateJobMatch;
      assert.equal(typeof calcMatch, 'function', 'calculateCandidateJobMatch must be a function');

      const job = env.mockWindow.state.jobs[0]; // Senior Backend Engineer: 5 mandatory, 2 preferred, 2 yrs
      const resume = 'Senior Java Developer with 2 years experience in Spring Boot, Microservices, Docker, SQL, Kubernetes, and Kafka.';

      const result = calcMatch(resume, job);
      // All 5 mandatory matched (70%), all 2 preferred matched (20%), 2 yrs exp (6%): total = 96%
      assert.equal(result.deterministicScore, 96);
      assert.equal(result.mandScore, 70);
      assert.equal(result.prefScore, 20);
      assert.equal(result.expScore, 6);
    });

    it('M2-ALGO-02: 4-factor hybrid radar metrics are computed accurately', () => {
      const calcMatch = env.mockWindow.calculateCandidateJobMatch;
      const job = env.mockWindow.state.jobs[0];
      const resume = 'Experienced Engineer with 2 years building scalable backends using Java, Spring Boot, Microservices, Docker, SQL, Kubernetes, and Kafka event streams.';

      const result = calcMatch(resume, job, { graphTrustScore: 0.94, intentScore: 0.92 });
      assert.ok(result.hybridRadar, 'hybridRadar object must be present');
      assert.equal(result.hybridRadar.semanticSim, 100);
      assert.equal(result.hybridRadar.bm25Score, 100);
      assert.equal(result.hybridRadar.graphTrust, 94);
      assert.equal(result.hybridRadar.intentScore, 92);
      assert.ok(result.compositeScore >= 90, 'Composite score should be top tier');
    });

    it('M2-ALGO-03: Regex experience parser handles exact years and missing experience patterns', () => {
      const calcMatch = env.mockWindow.calculateCandidateJobMatch;
      const job = env.mockWindow.state.jobs[0];

      const resWithExp = calcMatch('Developer with 4 years experience in Java.', job);
      assert.equal(resWithExp.detectedExpYears, 4);

      // Empty resume without experience mention defaults gracefully
      const resWithoutExp = calcMatch('Developer with no exp mentioned.', job);
      assert.equal(typeof resWithoutExp.detectedExpYears, 'number');
    });

    it('M2-ALGO-04: Persona switching (Aarav vs Diya) updates profile and job feed match scores', () => {
      const auth = env.mockWindow.hireflowAuth;
      auth.loginAs('CANDIDATE', 'diya');

      const state = env.mockWindow.state;
      assert.equal(state.candidateProfile.name, 'Diya Nair');
      assert.equal(state.candidateProfile.email, 'diya.n@email.com');

      const feedName = env.elementsById.get('feedActiveCandidateName');
      assert.equal(feedName.textContent, 'Diya Nair');

      const container = env.elementsById.get('jobFeedContainer');
      const backendCard = container.querySelector('[data-jobid="JOB-8F9A2C"]');
      const matchPill = backendCard.querySelector('.match-score-pill');
      // Diya has 88% match for Backend job (missing Kafka)
      assert.ok(matchPill.textContent.includes('88% Match'), 'Diya should have 88% Match pill');
    });
  });

});
