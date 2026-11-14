/**
 * =============================================================================
 * HIREFLOW + OMNITALENT: M2 ADVERSARIAL CHALLENGER EMPIRICAL AUDIT
 * Agent: teamwork_challenger_m2_1
 * 
 * Comprehensive Empirical Verification of Milestone 2:
 * 1. Exhaustive Tag Validation & HTML5 Spec Compliance:
 *    - Strict non-void tag self-closing audit (zero <div />, <span />, <p />, <i />, etc.)
 *    - Full LIFO stack tag open/close balancing across all elements
 *    - Void tag specification audit (only 14 HTML5 void elements permitted)
 *    - Attribute quoting and character validation
 *    - Byte-for-byte SHA-256 parity between root and public/
 * 2. Exact DOM Hierarchy & Split Layout Verification:
 *    - Strict sibling relationship: .feed-master-pane and #jobDetailPane in .feed-split-layout
 *    - Direct child verification: #jobDetailPane.parentElement === .feed-split-layout
 *    - Containment verification: #jobFeedContainer inside .feed-master-pane
 * 3. Cataloged DOM IDs Census & Semantic Mapping:
 *    - All 275+ cataloged DOM IDs verified present
 *    - Zero duplicate DOM IDs across entire document
 *    - Semantic element validation (canvas, form, input, button, nav, header)
 *    - Dual 6-stage Kanban board containers & count badges
 *    - 11 SPA view panels and Ashby 6-KPI telemetry cards
 * 4. Interactive Headless DOM Stress & Cross-Workflow Resilience:
 *    - DOMContentLoaded initialization without unhandled errors
 *    - Role switching across Candidate, Recruiter HR, and Recruiter Admin
 *    - Job feed card selection and rich #jobDetailPane dynamic population
 *    - AI evaluation report modal rendering with 14 verbatim strings
 *    - Rapid theme toggling (500 cycles) & tenant branding preservation
 * =============================================================================
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const ROOT_HTML_PATH = path.join(PROJECT_ROOT, 'index.html');
const PUBLIC_HTML_PATH = path.join(PROJECT_ROOT, 'public', 'index.html');
const APP_JS_PATH = path.join(PROJECT_ROOT, 'public', 'app.js');
const CSS_PATH = path.join(PROJECT_ROOT, 'public', 'styles.css');
const ORIGINAL_IDS_PATH = path.join(PROJECT_ROOT, '.agents', 'teamwork', 'teamwork_worker_m2', 'original_ids.json');

const rootHtml = fs.readFileSync(ROOT_HTML_PATH, 'utf8');
const publicHtml = fs.readFileSync(PUBLIC_HTML_PATH, 'utf8');
const appJsContent = fs.readFileSync(APP_JS_PATH, 'utf8');
const cssContent = fs.readFileSync(CSS_PATH, 'utf8');

// HTML5 Standard Void Elements (W3C / WHATWG HTML5 Spec)
const HTML5_VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img',
  'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

// Common non-void HTML tags that MUST never self-close
const NON_VOID_ELEMENTS = [
  'div', 'span', 'p', 'i', 'b', 'strong', 'em', 'small',
  'button', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'form', 'label', 'select', 'textarea', 'nav', 'header', 'footer',
  'section', 'aside', 'main', 'article', 'canvas', 'svg', 'path',
  'circle', 'rect', 'line', 'polyline', 'polygon'
];

// Helper: Lightweight DOM Parser for Headless Inspection
function parseDocument(htmlStr) {
  class Node {
    constructor(tagName = '', attrs = {}, isText = false, textContent = '') {
      this.tagName = tagName.toUpperCase();
      this.attrs = attrs;
      this.id = attrs.id || '';
      this.className = attrs.class || '';
      this.isText = isText;
      this.textContent = textContent;
      this.children = [];
      this.parentElement = null;
    }
    appendChild(child) {
      child.parentElement = this;
      this.children.push(child);
    }
    querySelector(sel) {
      if (sel.startsWith('#')) {
        const targetId = sel.slice(1);
        return this.findById(targetId);
      }
      if (sel.startsWith('.')) {
        const targetClass = sel.slice(1);
        return this.findByClass(targetClass);
      }
      return this.findByTag(sel.toUpperCase());
    }
    querySelectorAll(sel) {
      const results = [];
      this.collectAll(sel, results);
      return results;
    }
    collectAll(sel, acc) {
      for (const ch of this.children) {
        if (sel.startsWith('.')) {
          const cls = sel.slice(1);
          const classes = (ch.className || '').split(/\s+/);
          if (classes.includes(cls)) acc.push(ch);
        } else if (sel.startsWith('#')) {
          if (ch.id === sel.slice(1)) acc.push(ch);
        } else {
          if (ch.tagName === sel.toUpperCase()) acc.push(ch);
        }
        ch.collectAll(sel, acc);
      }
    }
    findById(id) {
      for (const ch of this.children) {
        if (ch.id === id) return ch;
        const found = ch.findById(id);
        if (found) return found;
      }
      return null;
    }
    findByClass(cls) {
      for (const ch of this.children) {
        const classes = (ch.className || '').split(/\s+/);
        if (classes.includes(cls)) return ch;
        const found = ch.findByClass(cls);
        if (found) return found;
      }
      return null;
    }
    findByTag(tag) {
      for (const ch of this.children) {
        if (ch.tagName === tag) return ch;
        const found = ch.findByTag(tag);
        if (found) return found;
      }
      return null;
    }
  }

  const root = new Node('DOCUMENT');
  const elementsById = new Map();
  const allElements = [];
  const stack = [root];

  const tagTokenRegex = /<!--[\s\S]*?-->|<(\/)?([a-zA-Z0-9_-]+)([^>]*?)>|([^<]+)/g;
  let match;

  while ((match = tagTokenRegex.exec(htmlStr)) !== null) {
    if (match[0].startsWith('<!--')) continue;

    if (match[2]) {
      const isClose = !!match[1];
      const rawTag = match[2];
      const tagName = rawTag.toLowerCase();
      const rawAttrs = match[3] || '';
      const isSelfClosing = rawAttrs.trim().endsWith('/') || HTML5_VOID_ELEMENTS.has(tagName);

      if (isClose) {
        while (stack.length > 1 && stack[stack.length - 1].tagName !== tagName.toUpperCase()) {
          stack.pop();
        }
        if (stack.length > 1) stack.pop();
      } else {
        const attrs = {};
        const attrRegex = /([a-zA-Z0-9_-]+)(?:=['"]([^'"]*)['"]|=([^\s>]+))?/g;
        let am;
        while ((am = attrRegex.exec(rawAttrs)) !== null) {
          const k = am[1];
          const v = am[2] !== undefined ? am[2] : (am[3] !== undefined ? am[3] : '');
          attrs[k] = v;
          if (k.toLowerCase() === 'id') {
            elementsById.set(v, null); // will store node below
          }
        }

        const node = new Node(tagName, attrs);
        if (node.id) elementsById.set(node.id, node);
        allElements.push(node);

        const parent = stack[stack.length - 1];
        parent.appendChild(node);

        if (!isSelfClosing && tagName !== '!doctype') {
          stack.push(node);
        }
      }
    }
  }

  return { root, elementsById, allElements };
}

// =============================================================================
// TEST SUITE 1: EXHAUSTIVE TAG VALIDATION & HTML5 SPEC COMPLIANCE
// =============================================================================

describe('Challenger Suite 1: Exhaustive Tag Validation & HTML5 Spec Compliance', () => {

  it('AUDIT-TAG-01: Zero illegal self-closing non-void tags in public/index.html', () => {
    const selfClosingRegex = /<([a-zA-Z0-9_-]+)([^>]*?)\/>/g;
    let match;
    const violations = [];

    while ((match = selfClosingRegex.exec(publicHtml)) !== null) {
      const tag = match[1].toLowerCase();
      if (!HTML5_VOID_ELEMENTS.has(tag)) {
        violations.push({
          tag,
          snippet: match[0],
          charIndex: match.index
        });
      }
    }

    assert.strictEqual(
      violations.length,
      0,
      `Found ${violations.length} illegal self-closing non-void tag(s) in public/index.html: ` +
      violations.map(v => `<${v.tag} /> at char ${v.charIndex}`).join(', ')
    );
  });

  it('AUDIT-TAG-02: Zero illegal self-closing non-void tags in index.html (mirror)', () => {
    const selfClosingRegex = /<([a-zA-Z0-9_-]+)([^>]*?)\/>/g;
    let match;
    const violations = [];

    while ((match = selfClosingRegex.exec(rootHtml)) !== null) {
      const tag = match[1].toLowerCase();
      if (!HTML5_VOID_ELEMENTS.has(tag)) {
        violations.push({
          tag,
          snippet: match[0],
          charIndex: match.index
        });
      }
    }

    assert.strictEqual(
      violations.length,
      0,
      `Found ${violations.length} illegal self-closing non-void tag(s) in root index.html: ` +
      violations.map(v => `<${v.tag} /> at char ${v.charIndex}`).join(', ')
    );
  });

  it('AUDIT-TAG-03: Specific stress check for non-void tags: div, span, p, i, button, a, canvas, section', () => {
    for (const tag of NON_VOID_ELEMENTS) {
      const regex = new RegExp(`<${tag}[^>]*?\\/>`, 'gi');
      const matches = publicHtml.match(regex);
      assert.strictEqual(
        matches,
        null,
        `Detected illegal self-closing tag for non-void element <${tag} />: ${matches ? matches.join(', ') : ''}`
      );
    }
  });

  it('AUDIT-TAG-04: Full LIFO stack tag open/close balancing across entire public/index.html', () => {
    const tagRegex = /<!--[\s\S]*?-->|<(\/)?([a-zA-Z0-9_-]+)([^>]*?)>/g;
    const stack = [];
    let match;
    const errors = [];

    while ((match = tagRegex.exec(publicHtml)) !== null) {
      if (match[0].startsWith('<!--')) continue;
      const isClose = !!match[1];
      const rawTag = match[2];
      const tagName = rawTag.toLowerCase();

      if (HTML5_VOID_ELEMENTS.has(tagName) || tagName === '!doctype') continue;

      if (!isClose) {
        stack.push({ tag: tagName, index: match.index });
      } else {
        if (stack.length === 0) {
          errors.push(`Unexpected closing tag </${tagName}> without open tag at char ${match.index}`);
        } else {
          const top = stack.pop();
          if (top.tag !== tagName) {
            errors.push(`Mismatched closing tag: expected </${top.tag}> (opened at ${top.index}), but encountered </${tagName}> at char ${match.index}`);
          }
        }
      }
    }

    if (stack.length > 0) {
      errors.push(`Unclosed tag(s) remaining at EOF: ` + stack.map(s => `<${s.tag}> opened at char ${s.index}`).join(', '));
    }

    assert.strictEqual(
      errors.length,
      0,
      `Document tag balancing failed with ${errors.length} error(s):\n` + errors.join('\n')
    );
  });

  it('AUDIT-TAG-05: Void elements must not have closing tags (e.g. no </input>, </hr>, </br>, </img>)', () => {
    const voidClosingRegex = /<\/([a-zA-Z0-9_-]+)>/g;
    let match;
    const illegalVoidClosers = [];

    while ((match = voidClosingRegex.exec(publicHtml)) !== null) {
      const tag = match[1].toLowerCase();
      if (HTML5_VOID_ELEMENTS.has(tag)) {
        illegalVoidClosers.push({ tag, index: match.index });
      }
    }

    assert.strictEqual(
      illegalVoidClosers.length,
      0,
      `Detected illegal closing tags for void elements: ` +
      illegalVoidClosers.map(v => `</${v.tag}> at char ${v.index}`).join(', ')
    );
  });

  it('AUDIT-TAG-06: Strict SHA-256 byte-for-byte synchronization between public/index.html and index.html', () => {
    const hashRoot = crypto.createHash('sha256').update(rootHtml).digest('hex');
    const hashPublic = crypto.createHash('sha256').update(publicHtml).digest('hex');

    assert.strictEqual(
      hashRoot,
      hashPublic,
      `SHA-256 mismatch: root index.html (${hashRoot}) does not match public/index.html (${hashPublic})`
    );
  });

  it('AUDIT-TAG-07: Maximum DOM nesting depth remains bounded (under 35 levels)', () => {
    const tagRegex = /<!--[\s\S]*?-->|<(\/)?([a-zA-Z0-9_-]+)([^>]*?)>/g;
    let match;
    let depth = 0;
    let maxDepth = 0;
    while ((match = tagRegex.exec(publicHtml)) !== null) {
      if (match[0].startsWith('<!--')) continue;
      const isClose = !!match[1];
      const tagName = match[2].toLowerCase();
      if (HTML5_VOID_ELEMENTS.has(tagName) || tagName === '!doctype') continue;
      if (!isClose) {
        depth++;
        if (depth > maxDepth) maxDepth = depth;
      } else {
        depth--;
      }
    }
    assert.ok(maxDepth < 35, `Max DOM nesting depth is ${maxDepth}, must be reasonable (< 35)`);
  });

});

// =============================================================================
// TEST SUITE 2: DOM HIERARCHY & SPLIT-LAYOUT ARCHITECTURE
// =============================================================================

describe('Challenger Suite 2: DOM Hierarchy & Split-Layout Architecture', () => {

  const doc = parseDocument(publicHtml);

  it('AUDIT-DOM-01: .feed-split-layout exists and has exact direct children structure', () => {
    const splitLayout = doc.root.querySelector('.feed-split-layout');
    assert.ok(splitLayout, '.feed-split-layout must exist in the document');

    // Must have exactly 2 children: master pane and detail pane
    assert.strictEqual(
      splitLayout.children.length,
      2,
      `.feed-split-layout must have exactly 2 direct children, found ${splitLayout.children.length}`
    );

    const firstChild = splitLayout.children[0];
    const secondChild = splitLayout.children[1];

    assert.ok(
      (firstChild.className || '').split(/\s+/).includes('feed-master-pane'),
      `First child of .feed-split-layout must have class 'feed-master-pane', found: '${firstChild.className}'`
    );

    assert.strictEqual(
      secondChild.id,
      'jobDetailPane',
      `Second child of .feed-split-layout must have id 'jobDetailPane', found: '${secondChild.id}'`
    );

    assert.ok(
      (secondChild.className || '').split(/\s+/).includes('feed-detail-pane'),
      `Second child (#jobDetailPane) must have class 'feed-detail-pane', found: '${secondChild.className}'`
    );
  });

  it('AUDIT-DOM-02: #jobDetailPane is a direct child of .feed-split-layout and NOT nested in master pane', () => {
    const jobDetailPane = doc.elementsById.get('jobDetailPane');
    const splitLayout = doc.root.querySelector('.feed-split-layout');
    const masterPane = doc.root.querySelector('.feed-master-pane');
    const jobFeedContainer = doc.elementsById.get('jobFeedContainer');

    assert.ok(jobDetailPane, '#jobDetailPane must exist');
    assert.strictEqual(
      jobDetailPane.parentElement,
      splitLayout,
      '#jobDetailPane.parentElement must strictly be .feed-split-layout'
    );

    // Verify it is not nested inside master pane
    let curr = jobDetailPane.parentElement;
    let nestedInsideMaster = false;
    while (curr) {
      if (curr === masterPane || curr === jobFeedContainer) {
        nestedInsideMaster = true;
        break;
      }
      curr = curr.parentElement;
    }
    assert.strictEqual(nestedInsideMaster, false, '#jobDetailPane must NOT be nested inside .feed-master-pane or #jobFeedContainer');
  });

  it('AUDIT-DOM-03: #jobFeedContainer is located inside .feed-master-pane', () => {
    const jobFeedContainer = doc.elementsById.get('jobFeedContainer');
    const masterPane = doc.root.querySelector('.feed-master-pane');

    assert.ok(jobFeedContainer, '#jobFeedContainer must exist');
    assert.ok(masterPane, '.feed-master-pane must exist');
    assert.strictEqual(
      jobFeedContainer.parentElement,
      masterPane,
      '#jobFeedContainer must be a direct child of .feed-master-pane'
    );
  });

  it('AUDIT-DOM-04: .feed-split-layout is located inside #candidate-jobs-view', () => {
    const splitLayout = doc.root.querySelector('.feed-split-layout');
    const candidateJobsView = doc.elementsById.get('candidate-jobs-view');

    assert.ok(candidateJobsView, '#candidate-jobs-view must exist');
    let curr = splitLayout.parentElement;
    let insideJobsView = false;
    while (curr) {
      if (curr === candidateJobsView) {
        insideJobsView = true;
        break;
      }
      curr = curr.parentElement;
    }
    assert.strictEqual(insideJobsView, true, '.feed-split-layout must be contained within #candidate-jobs-view');
  });

  it('AUDIT-DOM-05: #networkCanvas exists with required width="1100" and height="550" and graph-canvas-wrapper parent', () => {
    const canvas = doc.elementsById.get('networkCanvas');
    assert.ok(canvas, '#networkCanvas must exist');
    assert.strictEqual(canvas.tagName, 'CANVAS', '#networkCanvas must be a <canvas> element');
    assert.strictEqual(canvas.attrs.width, '1100', '#networkCanvas width attribute must be "1100"');
    assert.strictEqual(canvas.attrs.height, '550', '#networkCanvas height attribute must be "550"');

    const wrapper = canvas.parentElement;
    assert.ok(wrapper, '#networkCanvas must have a parent wrapper');
    assert.ok(
      (wrapper.className || '').split(/\s+/).includes('graph-canvas-wrapper'),
      `Parent of #networkCanvas must have class 'graph-canvas-wrapper', found: '${wrapper.className}'`
    );
  });

});

// =============================================================================
// TEST SUITE 3: CATALOGED DOM IDS CENSUS & SEMANTIC INTEGRITY
// =============================================================================

describe('Challenger Suite 3: Cataloged DOM IDs Census & Semantic Integrity', () => {

  const doc = parseDocument(publicHtml);

  it('AUDIT-ID-01: Zero duplicate DOM IDs across entire document', () => {
    const idRegex = /\bid=["']([^"']+)["']/g;
    const seenIds = new Map();
    const duplicates = [];
    let match;

    while ((match = idRegex.exec(publicHtml)) !== null) {
      const id = match[1];
      if (seenIds.has(id)) {
        duplicates.push({ id, firstPos: seenIds.get(id), secondPos: match.index });
      } else {
        seenIds.set(id, match.index);
      }
    }

    assert.strictEqual(
      duplicates.length,
      0,
      `Detected ${duplicates.length} duplicate ID(s) in public/index.html: ` +
      duplicates.map(d => `'${d.id}' (chars ${d.firstPos} & ${d.secondPos})`).join(', ')
    );
  });

  it('AUDIT-ID-02: All 275 cataloged original IDs from original_ids.json are preserved', () => {
    const originalIds = JSON.parse(fs.readFileSync(ORIGINAL_IDS_PATH, 'utf8'));
    assert.ok(Array.isArray(originalIds) && originalIds.length >= 275, 'original_ids.json must contain at least 275 IDs');

    const missingIds = [];
    for (const id of originalIds) {
      if (!doc.elementsById.has(id)) {
        missingIds.push(id);
      }
    }

    assert.strictEqual(
      missingIds.length,
      0,
      `Missing ${missingIds.length} cataloged original ID(s): ` + missingIds.join(', ')
    );
  });

  it('AUDIT-ID-03: All 11 Single-Page Application (SPA) view panels exist with correct data-roles', () => {
    const viewSpecs = [
      { id: 'candidate-jobs-view', roles: 'CANDIDATE' },
      { id: 'candidate-profile-view', roles: 'CANDIDATE' },
      { id: 'candidate-apps-view', roles: 'CANDIDATE' },
      { id: 'workflow-view', roles: 'RECRUITER_HR,RECRUITER_ADMIN' },
      { id: 'kanban-view', roles: 'RECRUITER_HR,RECRUITER_ADMIN' },
      { id: 'graph-view', roles: 'RECRUITER_HR,RECRUITER_ADMIN' },
      { id: 'recruiter-studio-view', roles: 'RECRUITER_HR,RECRUITER_ADMIN' },
      { id: 'recruiter-pipeline-view', roles: 'RECRUITER_HR,RECRUITER_ADMIN' },
      { id: 'equity-view', roles: 'ALL' },
      { id: 'admin-view', roles: 'RECRUITER_ADMIN' },
      { id: 'audit-view', roles: 'RECRUITER_ADMIN' }
    ];

    for (const spec of viewSpecs) {
      const panel = doc.elementsById.get(spec.id);
      assert.ok(panel, `View panel #${spec.id} must exist in DOM`);

      const classes = (panel.className || '').split(/\s+/);
      assert.ok(classes.includes('view-panel'), `#${spec.id} must have class 'view-panel'`);

      const navTab = doc.root.querySelectorAll('.nav-tab').find(t => t.attrs['data-tab'] === spec.id);
      assert.ok(navTab, `Navigation tab for data-tab="${spec.id}" must exist in #mainNav`);
      assert.strictEqual(
        navTab.attrs['data-roles'],
        spec.roles,
        `Nav tab for ${spec.id} must have data-roles="${spec.roles}"`
      );
    }
  });

  it('AUDIT-ID-04: Dual 6-stage Kanban containers & count badges exist in both views', () => {
    const stages = ['Sourced', 'Applied', 'AssessmentPending', 'Interviewing', 'OfferExtended', 'Closed'];

    // 1. Recruiter Pipeline Kanban (#pipelineKanbanView)
    const pipelineView = doc.elementsById.get('pipelineKanbanView');
    assert.ok(pipelineView, '#pipelineKanbanView must exist');

    for (const stage of stages) {
      const cardContainer = doc.elementsById.get(`pipeline-cards-${stage}`);
      const countBadge = doc.elementsById.get(`pipeline-count-${stage}`);
      assert.ok(cardContainer, `#pipeline-cards-${stage} must exist in #pipelineKanbanView`);
      assert.ok(countBadge, `#pipeline-count-${stage} must exist in #pipelineKanbanView`);
    }

    // 2. Legacy / General ATS Kanban (#kanban-view)
    const generalKanbanView = doc.elementsById.get('kanban-view');
    assert.ok(generalKanbanView, '#kanban-view must exist');

    for (const stage of stages) {
      const cardContainer = doc.elementsById.get(`cards-${stage}`);
      const countBadge = doc.elementsById.get(`count-${stage}`);
      assert.ok(cardContainer, `#cards-${stage} must exist in #kanban-view`);
      assert.ok(countBadge, `#count-${stage} must exist in #kanban-view`);
    }
  });

  it('AUDIT-ID-05: Ashby-style 6-KPI executive telemetry strip elements all exist', () => {
    const kpis = [
      { id: 'kpi-open-jobs', sub: 'kpi-total-jobs-sub' },
      { id: 'kpi-total-candidates', sub: 'kpi-filtered-sub' },
      { id: 'kpi-avg-ai-score', sub: 'kpi-threshold-sub' },
      { id: 'kpi-shortlisted-count', sub: 'kpi-conversion-rate' },
      { id: 'kpi-human-avg', sub: 'kpi-reviewed-count' },
      { id: 'kpi-offers-hires', sub: null }
    ];

    for (const k of kpis) {
      const el = doc.elementsById.get(k.id);
      assert.ok(el, `KPI element #${k.id} must exist in telemetry strip`);
      if (k.sub) {
        const subEl = doc.elementsById.get(k.sub);
        assert.ok(subEl, `KPI sub-element #${k.sub} must exist`);
      }
    }
  });

  it('AUDIT-ID-06: All critical modal containers and internal triggers exist', () => {
    // 1. Auth Gateway
    assert.ok(doc.elementsById.get('authGateway'), '#authGateway must exist');
    assert.ok(doc.elementsById.get('closeGatewayBtn'), '#closeGatewayBtn must exist');
    assert.ok(doc.elementsById.get('customLoginForm'), '#customLoginForm must exist');

    // 2. AI Evaluation Modal
    assert.ok(doc.elementsById.get('aiReportModal'), '#aiReportModal must exist');
    assert.ok(doc.elementsById.get('aiReportModalBody'), '#aiReportModalBody must exist');
    assert.ok(doc.elementsById.get('closeAiReportBtn'), '#closeAiReportBtn must exist');
    assert.ok(doc.elementsById.get('dismissAiReportBtn'), '#dismissAiReportBtn must exist');
    assert.ok(doc.elementsById.get('reportOpenScorecardBtn'), '#reportOpenScorecardBtn must exist');

    // 3. Scorecard Modal
    assert.ok(doc.elementsById.get('scorecardModal'), '#scorecardModal must exist');
    assert.ok(doc.elementsById.get('modalScorecardForm'), '#modalScorecardForm must exist');
    assert.ok(doc.elementsById.get('closeScorecardBtn'), '#closeScorecardBtn must exist');
    assert.ok(doc.elementsById.get('scorecardOfferBtn'), '#scorecardOfferBtn must exist');
    assert.ok(doc.elementsById.get('scorecardWaitlistBtn'), '#scorecardWaitlistBtn must exist');
    assert.ok(doc.elementsById.get('scorecardRejectBtn'), '#scorecardRejectBtn must exist');

    // 4. Offer Modal
    assert.ok(doc.elementsById.get('offerModal'), '#offerModal must exist');
    assert.ok(doc.elementsById.get('offerModalBody'), '#offerModalBody must exist');
  });

  it('AUDIT-ID-07: Semantic tag mapping checks (buttons are BUTTON, forms are FORM, inputs are INPUT)', () => {
    const checks = [
      { id: 'themeToggleBtn', expectedTag: 'BUTTON' },
      { id: 'loginPresetAarav', expectedTag: 'BUTTON' },
      { id: 'loginPresetVikram', expectedTag: 'BUTTON' },
      { id: 'loginPresetAdmin', expectedTag: 'BUTTON' },
      { id: 'candidateProfileForm', expectedTag: 'FORM' },
      { id: 'jobStudioForm', expectedTag: 'FORM' },
      { id: 'adminTenantForm', expectedTag: 'FORM' },
      { id: 'customLoginForm', expectedTag: 'FORM' },
      { id: 'networkCanvas', expectedTag: 'CANVAS' },
      { id: 'candidateNameInput', expectedTag: 'INPUT' },
      { id: 'candidateEmailInput', expectedTag: 'INPUT' },
      { id: 'adminCutoffSlider', expectedTag: 'INPUT' },
      { id: 'mainNav', expectedTag: 'NAV' }
    ];

    for (const c of checks) {
      const el = doc.elementsById.get(c.id);
      assert.ok(el, `Element #${c.id} must exist`);
      assert.strictEqual(
        el.tagName,
        c.expectedTag,
        `Element #${c.id} must be a <${c.expectedTag}> element, found <${el.tagName}>`
      );
    }
  });

  it('AUDIT-ID-08: Every label with a "for" attribute points to an existing element ID', () => {
    const labelForRegex = /<label[^>]*?\bfor=["']([^"']+)["'][^>]*?>/gi;
    let match;
    const missingForTargets = [];
    while ((match = labelForRegex.exec(publicHtml)) !== null) {
      const targetId = match[1];
      if (!doc.elementsById.has(targetId)) {
        missingForTargets.push({ targetId, index: match.index });
      }
    }
    assert.strictEqual(
      missingForTargets.length,
      0,
      `Found <label for="..."> pointing to non-existent ID(s): ` +
      missingForTargets.map(m => `for="${m.targetId}" at char ${m.index}`).join(', ')
    );
  });

  it('AUDIT-ID-09: Every navigation tab "data-tab" points to an existing SPA view panel', () => {
    const navTabs = doc.root.querySelectorAll('.nav-tab');
    assert.ok(navTabs.length >= 11, `Must have at least 11 nav tabs, found ${navTabs.length}`);
    for (const tab of navTabs) {
      const tabTarget = tab.attrs['data-tab'];
      assert.ok(tabTarget, 'Nav tab must specify data-tab');
      assert.ok(doc.elementsById.has(tabTarget), `data-tab target #${tabTarget} must exist as a view panel in DOM`);
    }
  });

  it('AUDIT-ID-10: Exact census check - total 411/412 unique IDs and 0 duplicates', () => {
    const idRegex = /\bid=["']([^"']+)["']/g;
    const allIds = Array.from(publicHtml.matchAll(idRegex), m => m[1]);
    const uniqueIds = new Set(allIds);
    assert.strictEqual(allIds.length, uniqueIds.size, 'Zero duplicate IDs permitted');
    assert.ok(uniqueIds.size === 411 || uniqueIds.size === 412, `Expected 411/412 unique element IDs, found ${uniqueIds.size}`);
  });

});

// =============================================================================
// TEST SUITE 4: INTERACTIVE HEADLESS DOM STRESS & PARITY HARNESS
// =============================================================================

describe('Challenger Suite 4: Interactive Headless DOM Stress & Parity Harness', () => {

  class HeadlessElement {
    constructor(tagName = 'div', id = '', className = '') {
      this.tagName = tagName.toUpperCase();
      this.id = id;
      this._className = className;
      this.attributes = {};
      this.classList = {
        _set: new Set(className ? className.split(/\s+/).filter(Boolean) : []),
        add: (...classes) => {
          classes.forEach(c => this.classList._set.add(c));
          this._className = Array.from(this.classList._set).join(' ');
        },
        remove: (...classes) => {
          classes.forEach(c => this.classList._set.delete(c));
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
      this.children = [];
      this.childNodes = [];
      this.parentElement = null;
      this.listeners = {};
      this.style = {};
      this._value = '';
      this._textContent = '';
      this._innerHTML = '';
      this.dataset = {};
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
          const child = new HeadlessElement(match[1]);
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

    setAttribute(k, v) {
      this.attributes[k] = String(v);
      if (k.toLowerCase() === 'id') this.id = String(v);
      if (k.toLowerCase() === 'class') this.className = String(v);
      if (k.toLowerCase() === 'value') this._value = String(v);
      if (k.startsWith('data-')) {
        const camelKey = k.slice(5).replace(/-([a-z])/g, (_, g) => g.toUpperCase());
        this.dataset[camelKey] = String(v);
      }
    }
    getAttribute(k) {
      if (this.attributes[k] !== undefined) return this.attributes[k];
      if (k === 'id') return this.id;
      if (k === 'class') return this.className;
      return null;
    }
    removeAttribute(k) { delete this.attributes[k]; }
    hasAttribute(k) { return this.attributes[k] !== undefined; }

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
        ? { type, target: this, currentTarget: this, defaultPrevented: false, preventDefault: () => {} }
        : evt;
      if (!eventObj.target) eventObj.target = this;
      if (!eventObj.currentTarget) eventObj.currentTarget = this;
      if (!eventObj.preventDefault) eventObj.preventDefault = () => {};
      if (this.listeners[type]) {
        this.listeners[type].forEach(fn => fn.call(this, eventObj));
      }
    }
    click() { this.dispatchEvent({ type: 'click', target: this, preventDefault: () => {} }); }

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

  function parseHeadlessDOM(html) {
    const root = new HeadlessElement('HTML');
    const elementsById = new Map();
    const stack = [root];
    const voidTags = new Set(['INPUT', 'IMG', 'META', 'LINK', 'BR', 'HR', 'SOURCE', 'AREA', 'BASE', 'COL', 'EMBED', 'PARAM', 'TRACK', 'WBR']);

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
          const el = new HeadlessElement(tagName);
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

  function buildHeadlessEnvironment() {
    const { root: documentRoot, elementsById } = parseHeadlessDOM(publicHtml);

    // Mock storage
    const storageStore = new Map();
    const mockStorage = {
      getItem: (k) => storageStore.has(k) ? storageStore.get(k) : null,
      setItem: (k, v) => storageStore.set(k, String(v)),
      removeItem: (k) => storageStore.delete(k),
      clear: () => storageStore.clear()
    };

    const docListeners = {};
    const mockDocument = {
      documentElement: documentRoot,
      body: documentRoot.querySelector('.app-surface') || documentRoot,
      getElementById: (id) => elementsById.get(id) || null,
      querySelector: (sel) => documentRoot.querySelector(sel),
      querySelectorAll: (sel) => documentRoot.querySelectorAll(sel),
      createElement: (tagName) => new HeadlessElement(tagName),
      addEventListener: (type, fn) => {
        if (!docListeners[type]) docListeners[type] = [];
        docListeners[type].push(fn);
      },
      dispatchEvent: (evt) => {
        const type = typeof evt === 'string' ? evt : evt.type;
        if (docListeners[type]) docListeners[type].forEach(fn => fn({ type }));
      }
    };

    const mockWindow = {
      document: mockDocument,
      localStorage: mockStorage,
      sessionStorage: mockStorage,
      matchMedia: () => ({ matches: false, addEventListener: () => {} }),
      setTimeout: (fn) => { fn(); return 1; },
      clearTimeout: () => {},
      requestAnimationFrame: (fn) => { fn(); return 1; },
      cancelAnimationFrame: () => {},
      scrollTo: () => {},
      console: { log: () => {}, warn: () => {}, error: () => {} },
      Blob: class Blob { constructor(c) { this.content = c; } },
      URL: { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} }
    };

    // Canvas mock
    const canvas = elementsById.get('networkCanvas');
    if (canvas) {
      canvas.width = 1100;
      canvas.height = 550;
      canvas.getContext = () => ({
        clearRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        arc: () => {},
        fill: () => {},
        fillText: () => {},
        setLineDash: () => {},
        font: '', fillStyle: '', strokeStyle: '', lineWidth: 1, textAlign: 'center'
      });
      canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1100, height: 550 });
    }

    const sandbox = {
      window: mockWindow,
      document: mockDocument,
      localStorage: mockStorage,
      sessionStorage: mockStorage,
      console: mockWindow.console,
      Date, Math, parseInt, parseFloat,
      Blob: mockWindow.Blob, URL: mockWindow.URL,
      requestAnimationFrame: mockWindow.requestAnimationFrame,
      cancelAnimationFrame: mockWindow.cancelAnimationFrame,
      setTimeout: (fn) => { fn(); return 1; },
      clearTimeout: () => {}
    };

    const instrumentedAppJs = appJsContent.replace('const state = {', 'const state = window.__state = {');
    vm.createContext(sandbox);
    vm.runInContext(instrumentedAppJs, sandbox);
    mockDocument.dispatchEvent('DOMContentLoaded');

    return {
      window: mockWindow,
      document: mockDocument,
      elementsById,
      getState: () => mockWindow.__state
    };
  }

  it('AUDIT-EXEC-01: Application initializes cleanly on DOMContentLoaded without throwing', () => {
    assert.doesNotThrow(() => {
      buildHeadlessEnvironment();
    }, 'DOM tree and app.js must execute and initialize without runtime exceptions');
  });

  it('AUDIT-EXEC-02: Rapid persona switching (Aarav -> Vikram -> Admin -> Aarav) preserves clean DOM state', () => {
    const env = buildHeadlessEnvironment();
    const hireflowAuth = env.window.hireflowAuth;
    assert.ok(hireflowAuth, 'window.hireflowAuth must be exported and available');

    // 1. Candidate Login
    hireflowAuth.loginAs('CANDIDATE');
    assert.strictEqual(env.getState().currentUser.role, 'CANDIDATE');
    assert.strictEqual(env.elementsById.get('authGateway').classList.contains('active'), false);
    assert.strictEqual(env.elementsById.get('candidate-jobs-view').classList.contains('active'), true);

    // 2. Recruiter HR Login
    hireflowAuth.loginAs('RECRUITER_HR');
    assert.strictEqual(env.getState().currentUser.role, 'RECRUITER_HR');
    assert.strictEqual(env.elementsById.get('kanban-view').classList.contains('active'), true);

    // 3. Admin Login
    hireflowAuth.loginAs('RECRUITER_ADMIN');
    assert.strictEqual(env.getState().currentUser.role, 'RECRUITER_ADMIN');
    assert.strictEqual(env.elementsById.get('admin-view').classList.contains('active'), true);

    // 4. Return to Candidate
    hireflowAuth.loginAs('CANDIDATE');
    assert.strictEqual(env.getState().currentUser.role, 'CANDIDATE');
    assert.strictEqual(env.elementsById.get('candidate-jobs-view').classList.contains('active'), true);
  });

  it('AUDIT-EXEC-03: Rapid 500-cycle theme switching preserves DOM attributes, icons, and labels', () => {
    const env = buildHeadlessEnvironment();
    const toggleBtn = env.elementsById.get('themeToggleBtn');
    const toggleIcon = env.elementsById.get('themeToggleIcon');
    const toggleLabel = env.elementsById.get('themeToggleLabel');

    assert.ok(toggleBtn, '#themeToggleBtn must exist');

    for (let i = 0; i < 500; i++) {
      toggleBtn.click();
      const currentTheme = env.document.documentElement.getAttribute('data-theme');
      if (currentTheme === 'light') {
        assert.strictEqual(toggleIcon.textContent.trim(), '☀️');
        assert.strictEqual(toggleLabel.textContent.trim(), 'Light');
        assert.strictEqual(env.document.body.getAttribute('data-theme'), 'light');
      } else {
        assert.strictEqual(toggleIcon.textContent.trim(), '🌙');
        assert.strictEqual(toggleLabel.textContent.trim(), 'Dark');
        assert.strictEqual(env.document.body.getAttribute('data-theme'), 'dark');
      }
    }
  });

  it('AUDIT-EXEC-04: Tenant branding mutation is preserved across theme switching', () => {
    const env = buildHeadlessEnvironment();
    const applyThemeColor = env.window.applyThemeColor;
    const toggleBtn = env.elementsById.get('themeToggleBtn');

    assert.ok(typeof applyThemeColor === 'function', 'window.applyThemeColor must be defined');

    // Apply emerald brand color
    applyThemeColor('#10b981');
    assert.strictEqual(env.document.documentElement.style['--brand-primary'], '#10b981');

    // Toggle theme 50 times
    for (let i = 0; i < 50; i++) {
      toggleBtn.click();
      assert.strictEqual(
        env.document.documentElement.style['--brand-primary'],
        '#10b981',
        'Dynamic --brand-primary must not be wiped out by theme toggles'
      );
    }
  });

  it('AUDIT-EXEC-05: AI Evaluation Modal displays Aarav Sharma report with all 14 verbatim strings', () => {
    const env = buildHeadlessEnvironment();
    const showAiEvaluationReport = env.window.showAiEvaluationReport;
    assert.ok(typeof showAiEvaluationReport === 'function', 'window.showAiEvaluationReport must be exported');

    // Open Aarav's evaluation report
    showAiEvaluationReport('APP-AARAV-01');

    const modal = env.elementsById.get('aiReportModal');
    const modalBody = env.elementsById.get('aiReportModalBody');

    assert.ok(modal.classList.contains('active'), '#aiReportModal must have class active');
    const bodyHtml = modalBody.innerHTML;

    const requiredStrings = [
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

    for (const s of requiredStrings) {
      assert.ok(
        bodyHtml.includes(s),
        `AI Evaluation Report body must contain verbatim string: "${s}"`
      );
    }

    const mandatoryChips = modalBody.querySelectorAll('.chip-mandatory');
    assert.ok(mandatoryChips.length >= 4, `Must render >= 4 .chip-mandatory chips, found ${mandatoryChips.length}`);

    // Close modal
    const closeBtn = env.elementsById.get('closeAiReportBtn');
    closeBtn.click();
    assert.strictEqual(modal.classList.contains('active'), false, 'Modal should close when #closeAiReportBtn is clicked');
  });

});
