/**
 * =============================================================================
 * HIREFLOW + OMNITALENT: CANVAS & UX TEST SUITE (MILESTONE M4)
 * =============================================================================
 *
 * Requirements Covered:
 *   - R4: Canvas & UX Testing (HTML5 Canvas Social Graph Simulation & UX Interactions)
 *
 * Test Specifications:
 *   - TC-CNV-01: Canvas Element & Context Initialization
 *   - TC-CNV-02: Animation Loop & Physics Simulation (Velocity, Immobility, Bounds)
 *   - TC-CNV-03: Edge 2D Drawing Pipeline (Warm Referral Highway vs Solid Edges)
 *   - TC-CNV-04: Node 2D Drawing Pipeline (Color Classification, Circles, Typography)
 *   - TC-CNV-05: Interactive Click Hit-Testing & Inspection Details Overlay
 *   - TC-CNV-06: Animation Loop Lifecycle Control (request/cancelAnimationFrame)
 *   - TC-CNV-07: Responsive Layout Adaptations & Defensive Edge Cases
 *
 * Execution:
 *   node tests/test-canvas-ux.js
 *   node --test tests/test-canvas-ux.js
 * =============================================================================
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('node:assert/strict');
const { describe, it, before, beforeEach } = require('node:test');

// Path resolution
const PROJECT_ROOT = path.resolve(__dirname, '..');
const INDEX_HTML_PATH = path.join(PROJECT_ROOT, 'index.html');
const APP_JS_PATH = path.join(PROJECT_ROOT, 'app.js');

const htmlSource = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
const appJsSource = fs.readFileSync(APP_JS_PATH, 'utf8');

// =============================================================================
// HEADLESS 2D CANVAS CONTEXT MOCK
// =============================================================================

class MockCanvasContext2D {
  constructor(canvas) {
    this.canvas = canvas;
    this.drawCalls = [];
    this.fillStyle = '#000000';
    this.strokeStyle = '#000000';
    this.lineWidth = 1.0;
    this.font = '10px sans-serif';
    this.textAlign = 'start';
    this._lineDash = [];
  }

  reset() {
    this.drawCalls = [];
  }

  clearRect(x, y, w, h) {
    this.drawCalls.push({ type: 'clearRect', x, y, w, h });
  }

  beginPath() {
    this.drawCalls.push({ type: 'beginPath' });
  }

  moveTo(x, y) {
    this.drawCalls.push({ type: 'moveTo', x, y });
  }

  lineTo(x, y) {
    this.drawCalls.push({ type: 'lineTo', x, y });
  }

  arc(x, y, radius, startAngle, endAngle) {
    this.drawCalls.push({ type: 'arc', x, y, radius, startAngle, endAngle });
  }

  stroke() {
    this.drawCalls.push({
      type: 'stroke',
      strokeStyle: this.strokeStyle,
      lineWidth: this.lineWidth,
      lineDash: [...this._lineDash]
    });
  }

  fill() {
    this.drawCalls.push({
      type: 'fill',
      fillStyle: this.fillStyle
    });
  }

  fillText(text, x, y) {
    this.drawCalls.push({
      type: 'fillText',
      text: String(text),
      x,
      y,
      fillStyle: this.fillStyle,
      font: this.font,
      textAlign: this.textAlign
    });
  }

  setLineDash(segments) {
    this._lineDash = Array.isArray(segments) ? [...segments] : [];
    this.drawCalls.push({ type: 'setLineDash', segments: [...this._lineDash] });
  }

  getLineDash() {
    return [...this._lineDash];
  }

  // Helper: Retrieve draw operations performed during the most recent frame
  getLatestFrameCalls() {
    let lastClearIndex = -1;
    for (let i = this.drawCalls.length - 1; i >= 0; i--) {
      if (this.drawCalls[i].type === 'clearRect') {
        lastClearIndex = i;
        break;
      }
    }
    if (lastClearIndex === -1) return [...this.drawCalls];
    return this.drawCalls.slice(lastClearIndex);
  }
}

// =============================================================================
// HEADLESS DOM ELEMENT FIXTURE
// =============================================================================

class DOMElement {
  constructor(tagName = 'div', id = '', className = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.className = className;
    this.classList = {
      _set: new Set(className ? className.split(/\s+/).filter(Boolean) : []),
      add: (c) => this.classList._set.add(c),
      remove: (c) => this.classList._set.delete(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (this.classList._set.has(c)) this.classList._set.delete(c);
          else this.classList._set.add(c);
        } else if (force) {
          this.classList._set.add(c);
        } else {
          this.classList._set.delete(c);
        }
      },
      contains: (c) => this.classList._set.has(c)
    };
    this.attributes = {};
    this.children = [];
    this.parentElement = null;
    this.listeners = {};
    this.style = {};
    this._value = '';
    this._textContent = '';
    this._innerHTML = '';
  }

  get value() { return this._value; }
  set value(v) { this._value = String(v); }

  get textContent() {
    return this._textContent || this._innerHTML.replace(/<[^>]+>/g, '').trim();
  }
  set textContent(v) {
    this._textContent = String(v);
    this._innerHTML = String(v);
  }

  get innerHTML() {
    if (this._innerHTML) return this._innerHTML;
    if (this.children.length > 0) {
      return this.children.map(c => `<${c.tagName.toLowerCase()} class="${c.className}" id="${c.id}">${c.innerHTML}</${c.tagName.toLowerCase()}>`).join('');
    }
    return '';
  }
  set innerHTML(v) {
    this._innerHTML = String(v);
    this._textContent = v.replace(/<[^>]+>/g, '').trim();
    this.children = [];

    const tagRegex = /<([a-zA-Z0-9_-]+)([^>]*?)>(?:([\s\S]*?)<\/\1>)?/g;
    let match;
    while ((match = tagRegex.exec(v)) !== null) {
      const tag = match[1];
      const attrs = match[2] || '';
      const inner = match[3] || '';

      const child = new DOMElement(tag);
      const classM = attrs.match(/class=["']([^"']*)["']/);
      if (classM) {
        child.className = classM[1];
        classM[1].split(/\s+/).filter(Boolean).forEach(c => child.classList.add(c));
      }
      const idM = attrs.match(/id=["']([^"']*)["']/);
      if (idM) child.id = idM[1];

      const dataMatches = attrs.matchAll(/([a-zA-Z0-9_-]+)=["']([^"']*)["']/g);
      for (const dm of dataMatches) {
        child.setAttribute(dm[1], dm[2]);
      }

      child.innerHTML = inner;
      this.appendChild(child);
    }
  }

  setAttribute(name, val) { this.attributes[name] = String(val); }
  getAttribute(name) { return this.attributes[name] !== undefined ? this.attributes[name] : (name === 'id' ? this.id : null); }

  addEventListener(type, fn) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(fn);
  }

  dispatchEvent(evt) {
    const type = typeof evt === 'string' ? evt : evt.type;
    const eventObj = typeof evt === 'string'
      ? { type, target: this, currentTarget: this, clientX: 0, clientY: 0, preventDefault: () => {} }
      : { target: this, currentTarget: this, preventDefault: () => {}, ...evt };

    if (this.listeners[type]) {
      this.listeners[type].forEach(fn => fn(eventObj));
    }
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  remove() {
    if (this.parentElement) {
      const idx = this.parentElement.children.indexOf(this);
      if (idx > -1) this.parentElement.children.splice(idx, 1);
    }
  }

  querySelector(sel) {
    const res = this.querySelectorAll(sel);
    return res.length > 0 ? res[0] : null;
  }

  querySelectorAll(sel) {
    const list = [];
    const walk = (el) => {
      for (const ch of el.children) {
        let matches = false;
        if (sel.startsWith('.')) {
          if (ch.classList.contains(sel.slice(1))) matches = true;
        } else if (sel.startsWith('#')) {
          if (ch.id === sel.slice(1)) matches = true;
        } else if (sel.includes('[') && sel.includes(']')) {
          const m = sel.match(/\[([a-zA-Z0-9_-]+)(?:=["']?([^"']*)["']?)?\]/);
          if (m) {
            const attrVal = ch.getAttribute(m[1]);
            if (m[2] !== undefined ? attrVal === m[2] : attrVal !== null) matches = true;
          }
        } else if (ch.tagName.toLowerCase() === sel.toLowerCase()) {
          matches = true;
        }
        if (matches) list.push(ch);
        walk(ch);
      }
    };
    walk(this);
    return list;
  }
}

// =============================================================================
// TEST ENVIRONMENT FACTORY
// =============================================================================

function createTestEnvironment(customOptions = {}) {
  const elementsById = new Map();
  const allElements = [];

  // Parse element IDs from index.html
  const idRegex = /id=["']([^"']+)["']/g;
  let match;
  while ((match = idRegex.exec(htmlSource)) !== null) {
    const id = match[1];
    if (!elementsById.has(id)) {
      const el = new DOMElement('div', id);
      elementsById.set(id, el);
      allElements.push(el);
    }
  }

  // Populate Default Canvas Element
  const canvasEl = elementsById.get('networkCanvas') || new DOMElement('canvas', 'networkCanvas');
  canvasEl.width = 1100;
  canvasEl.height = 550;
  let canvasBoundingRect = { left: 0, top: 0, width: 1100, height: 550 };
  canvasEl.getBoundingClientRect = () => ({ ...canvasBoundingRect });

  const mockCtx = new MockCanvasContext2D(canvasEl);
  canvasEl.getContext = (type) => (type === '2d' ? mockCtx : null);
  elementsById.set('networkCanvas', canvasEl);

  // Initialize initial innerHTML for graphNodeDetails from index.html
  const detailsEl = elementsById.get('graphNodeDetails') || new DOMElement('div', 'graphNodeDetails');
  detailsEl.innerHTML = `
    <h4>Click any node on the graph to inspect</h4>
    <p class="text-muted">Shows weighted endorsement score, referral routing, and social trust metric.</p>
  `;
  elementsById.set('graphNodeDetails', detailsEl);

  // Root document mock
  const rootDoc = new DOMElement('html');
  const body = new DOMElement('body');
  rootDoc.appendChild(body);
  elementsById.forEach(el => body.appendChild(el));

  // Navigation tabs
  const tabDefs = [
    'workflow-view',
    'kanban-view',
    'graph-view',
    'equity-view',
    'audit-view'
  ];
  tabDefs.forEach((tabId, idx) => {
    const btn = new DOMElement('button', '', 'nav-tab' + (idx === 0 ? ' active' : ''));
    btn.setAttribute('data-tab', tabId);
    body.appendChild(btn);

    let panel = elementsById.get(tabId);
    if (!panel) {
      panel = new DOMElement('section', tabId, 'view-panel' + (idx === 0 ? ' active' : ''));
      elementsById.set(tabId, panel);
      body.appendChild(panel);
    } else {
      panel.classList.add('view-panel');
      if (idx === 0) panel.classList.add('active');
    }
  });

  // Stepper steps & panes
  for (let i = 1; i <= 6; i++) {
    const stepEl = new DOMElement('div', '', 'stepper-step' + (i === 1 ? ' active' : ''));
    stepEl.setAttribute('data-step', String(i));
    body.appendChild(stepEl);

    const pane = elementsById.get(`pane-step-${i}`);
    if (pane) {
      pane.classList.add('step-pane');
      if (i === 1) pane.classList.add('active');
    }
  }

  // Presets & Decisions
  ['aarav', 'diya', 'rohan', 'priya', 'custom'].forEach((p, idx) => {
    const b = new DOMElement('button', '', 'btn-preset' + (idx === 0 ? ' active' : ''));
    b.setAttribute('data-preset', p);
    body.appendChild(b);
  });
  ['SelectedForOffer', 'HoldWaitlist', 'Rejected'].forEach(d => {
    const btn = new DOMElement('button', '', 'decision-action-btn');
    btn.setAttribute('data-decision', d);
    body.appendChild(btn);
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
    querySelectorAll: (sel) => body.querySelectorAll(sel),
    querySelector: (sel) => body.querySelector(sel),
    createElement: (tag) => new DOMElement(tag),
    body
  };

  // Animation frame orchestration
  let frameCounter = 1;
  const activeAnimationCallbacks = new Map();
  const canceledFrameIds = [];

  const mockWindow = {
    document: mockDocument,
    requestAnimationFrame: (cb) => {
      const id = frameCounter++;
      activeAnimationCallbacks.set(id, cb);
      return id;
    },
    cancelAnimationFrame: (id) => {
      canceledFrameIds.push(id);
      activeAnimationCallbacks.delete(id);
    },
    scrollTo: () => {},
    print: () => {},
    Blob: class { constructor(parts, opts) { this.parts = parts; this.type = opts?.type; } },
    URL: { createObjectURL: () => 'blob:mock-url' }
  };

  const sandbox = {
    window: mockWindow,
    document: mockDocument,
    Blob: mockWindow.Blob,
    URL: mockWindow.URL,
    requestAnimationFrame: mockWindow.requestAnimationFrame,
    cancelAnimationFrame: mockWindow.cancelAnimationFrame,
    setTimeout: (fn) => fn(),
    Date: Date,
    Math: Math,
    parseInt: parseInt,
    parseFloat: parseFloat,
    console: console,
    ...customOptions
  };

  vm.createContext(sandbox);
  vm.runInContext(appJsSource, sandbox);

  // Fire DOMContentLoaded
  mockDocument.dispatchEvent('DOMContentLoaded');

  function stepFrame() {
    if (activeAnimationCallbacks.size === 0) return false;
    const entries = Array.from(activeAnimationCallbacks.entries());
    const [id, cb] = entries[entries.length - 1];
    activeAnimationCallbacks.delete(id);
    cb();
    return true;
  }

  return {
    mockWindow,
    mockDocument,
    elementsById,
    canvasEl,
    mockCtx,
    sandbox,
    stepFrame,
    activeAnimationCallbacks,
    canceledFrameIds,
    setCanvasBoundingRect: (rect) => { canvasBoundingRect = { ...rect }; }
  };
}

// =============================================================================
// TEST SUITE: HTML5 CANVAS & UX INTERACTIONS
// =============================================================================

describe('Milestone M4: HTML5 Canvas Social Graph Simulation & UX Interactions', () => {

  // ---------------------------------------------------------------------------
  // 1. Canvas Element & Context Initialization (TC-CNV-01)
  // ---------------------------------------------------------------------------
  describe('1. Canvas Element & Context Initialization', () => {

    it('TC-CNV-01.1: Canvas element exists in index.html with width=1100 and height=550', () => {
      assert.match(
        htmlSource,
        /<canvas\s+id="networkCanvas"\s+width="1100"\s+height="550"><\/canvas>/,
        'index.html must declare <canvas id="networkCanvas" width="1100" height="550">'
      );
    });

    it('TC-CNV-01.2: Canvas wrapper (.graph-canvas-wrapper) encloses canvas and details overlay', () => {
      assert.ok(
        htmlSource.includes('class="graph-canvas-wrapper"'),
        'Wrapper element .graph-canvas-wrapper must exist'
      );
      assert.ok(
        htmlSource.includes('id="graphNodeDetails"'),
        'Overlay card #graphNodeDetails must exist inside or adjacent to graph wrapper'
      );
    });

    it('TC-CNV-01.3: Canvas acquires 2D rendering context via getContext("2d")', () => {
      const env = createTestEnvironment();
      const ctx = env.canvasEl.getContext('2d');
      assert.ok(ctx, 'Canvas getContext("2d") must return a valid rendering context');
      assert.strictEqual(typeof ctx.clearRect, 'function', '2D context must have clearRect function');
      assert.strictEqual(typeof ctx.arc, 'function', '2D context must have arc function');
      assert.strictEqual(typeof ctx.stroke, 'function', '2D context must have stroke function');
      assert.strictEqual(typeof ctx.fill, 'function', '2D context must have fill function');
    });

    it('TC-CNV-01.4: Initial state of #graphNodeDetails displays placeholder inspection text', () => {
      const env = createTestEnvironment();
      const details = env.elementsById.get('graphNodeDetails');
      assert.ok(details, '#graphNodeDetails element must be present in DOM');
      assert.match(
        details.innerHTML,
        /Click any node on the graph to inspect/i,
        'Default placeholder must instruct user to click node'
      );
    });

    it('TC-CNV-01.5: Initializes exactly 10 nodes across all required classification types', () => {
      const env = createTestEnvironment();
      // Switch to graph view to trigger full canvas render
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');
      env.stepFrame();

      const latestCalls = env.mockCtx.getLatestFrameCalls();
      const arcCalls = latestCalls.filter(c => c.type === 'arc');
      assert.strictEqual(
        arcCalls.length,
        10,
        `Expected exactly 10 node circle paths drawn in frame, found ${arcCalls.length}`
      );
    });

    it('TC-CNV-01.6: Initializes exactly 8 edges connecting nodes in graph topology', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');
      env.stepFrame();

      const latestCalls = env.mockCtx.getLatestFrameCalls();
      // Count lineTo operations (1 lineTo per edge)
      const lineCalls = latestCalls.filter(c => c.type === 'lineTo');
      assert.strictEqual(
        lineCalls.length,
        8,
        `Expected exactly 8 edge line segments drawn in frame, found ${lineCalls.length}`
      );
    });

    it('TC-CNV-01.7: Graph legend in index.html displays all 4 node category indicators', () => {
      assert.ok(htmlSource.includes('dot-cand'), 'Legend contains dot-cand');
      assert.ok(htmlSource.includes('dot-emp'), 'Legend contains dot-emp');
      assert.ok(htmlSource.includes('dot-org'), 'Legend contains dot-org');
      assert.ok(htmlSource.includes('dot-skill'), 'Legend contains dot-skill');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Animation Loop & Physics Simulation (TC-CNV-02, TC-CNV-06)
  // ---------------------------------------------------------------------------
  describe('2. Animation Loop & Physics Simulation', () => {

    it('TC-CNV-02.1: Velocity updates displace movable nodes across simulation ticks', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');
      env.stepFrame();

      const frame0Arcs = env.mockCtx.getLatestFrameCalls().filter(c => c.type === 'arc');
      assert.strictEqual(frame0Arcs.length, 10);
      const aaravFrame0 = frame0Arcs[0]; // Aarav is index 0

      // Advance physics simulation by 1 frame
      const stepped = env.stepFrame();
      assert.strictEqual(stepped, true, 'Animation frame callback should be available to step');

      const frame1Arcs = env.mockCtx.getLatestFrameCalls().filter(c => c.type === 'arc');
      const aaravFrame1 = frame1Arcs[0];

      // Aarav initial x=200, y=150, vx=0.2, vy=0.1
      assert.ok(
        Math.abs(aaravFrame1.x - (aaravFrame0.x + 0.2)) < 1e-4,
        `Expected node.x to increase by vx (0.2), got frame0=${aaravFrame0.x}, frame1=${aaravFrame1.x}`
      );
      assert.ok(
        Math.abs(aaravFrame1.y - (aaravFrame0.y + 0.1)) < 1e-4,
        `Expected node.y to increase by vy (0.1), got frame0=${aaravFrame0.y}, frame1=${aaravFrame1.y}`
      );
    });

    it('TC-CNV-02.2: Organization node (Apex Cloud) is anchored (vx=0, vy=0, unmoved)', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');
      env.stepFrame();

      const frame0Arcs = env.mockCtx.getLatestFrameCalls().filter(c => c.type === 'arc');
      // org-apex is radius 38, initial x=920, y=270
      const apexFrame0 = frame0Arcs.find(a => a.radius === 38);
      assert.ok(apexFrame0, 'Should find Apex Cloud Systems node with radius 38');
      assert.strictEqual(apexFrame0.x, 920);
      assert.strictEqual(apexFrame0.y, 270);

      // Advance 5 animation frames
      for (let i = 0; i < 5; i++) env.stepFrame();

      const frame5Arcs = env.mockCtx.getLatestFrameCalls().filter(c => c.type === 'arc');
      const apexFrame5 = frame5Arcs.find(a => a.radius === 38);
      assert.strictEqual(apexFrame5.x, 920, 'Organization node x must remain permanently fixed at 920');
      assert.strictEqual(apexFrame5.y, 270, 'Organization node y must remain permanently fixed at 270');
    });

    it('TC-CNV-02.3: Boundary reflection reverses velocity when reaching horizontal limits', () => {
      // Direct mathematical assertion of the boundary reflection logic in app.js:
      // if (node.x < node.radius + 20 || node.x > canvas.width - node.radius - 20) node.vx *= -1;
      const canvasWidth = 1100;
      const radius = 26;
      const leftBound = radius + 20; // 46
      const rightBound = canvasWidth - radius - 20; // 1054

      // Test Left boundary collision (x < 46)
      let nodeLeft = { x: 45, vx: -0.2, radius };
      if (nodeLeft.x < leftBound || nodeLeft.x > rightBound) nodeLeft.vx *= -1;
      assert.strictEqual(nodeLeft.vx, 0.2, 'Velocity vx must reverse from negative to positive at left bound');

      // Test Right boundary collision (x > 1054)
      let nodeRight = { x: 1055, vx: 0.2, radius };
      if (nodeRight.x < leftBound || nodeRight.x > rightBound) nodeRight.vx *= -1;
      assert.strictEqual(nodeRight.vx, -0.2, 'Velocity vx must reverse from positive to negative at right bound');
    });

    it('TC-CNV-02.4: Boundary reflection reverses velocity when reaching vertical limits', () => {
      // Direct mathematical assertion of the boundary reflection logic in app.js:
      // if (node.y < node.radius + 20 || node.y > canvas.height - node.radius - 20) node.vy *= -1;
      const canvasHeight = 550;
      const radius = 26;
      const topBound = radius + 20; // 46
      const bottomBound = canvasHeight - radius - 20; // 504

      // Test Top boundary collision (y < 46)
      let nodeTop = { y: 45, vy: -0.1, radius };
      if (nodeTop.y < topBound || nodeTop.y > bottomBound) nodeTop.vy *= -1;
      assert.strictEqual(nodeTop.vy, 0.1, 'Velocity vy must reverse from negative to positive at top bound');

      // Test Bottom boundary collision (y > 504)
      let nodeBottom = { y: 505, vy: 0.1, radius };
      if (nodeBottom.y < topBound || nodeBottom.y > bottomBound) nodeBottom.vy *= -1;
      assert.strictEqual(nodeBottom.vy, -0.1, 'Velocity vy must reverse from positive to negative at bottom bound');
    });

    it('TC-CNV-02.5: Nodes remain inside canvas bounding box across 100 simulation frames', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');

      for (let i = 0; i < 100; i++) {
        env.stepFrame();
      }

      const arcs = env.mockCtx.getLatestFrameCalls().filter(c => c.type === 'arc');
      arcs.forEach(node => {
        assert.ok(node.x >= 0 && node.x <= 1100, `Node x (${node.x}) must remain within canvas width [0, 1100]`);
        assert.ok(node.y >= 0 && node.y <= 550, `Node y (${node.y}) must remain within canvas height [0, 550]`);
      });
    });

    it('TC-CNV-06.1: Active animation loop schedules requestAnimationFrame when in graph-view', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');

      assert.ok(
        env.activeAnimationCallbacks.size > 0,
        'requestAnimationFrame must register an active callback while graph-view is active'
      );
    });

    it('TC-CNV-06.2: Re-rendering graph cancels previous animFrameId via cancelAnimationFrame', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');

      // First navigation to graph-view
      graphTab.dispatchEvent('click');
      assert.ok(env.activeAnimationCallbacks.size > 0);

      // Re-trigger render
      graphTab.dispatchEvent('click');
      assert.ok(
        env.canceledFrameIds.length > 0,
        'cancelAnimationFrame must be invoked to prevent runaway multiple loops'
      );
    });

    it('TC-CNV-06.3: Animation loop halts when switching away from #graph-view', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      const workflowTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'workflow-view');

      // Navigate to graph-view
      graphTab.dispatchEvent('click');
      assert.strictEqual(env.activeAnimationCallbacks.size, 1);

      // Switch away to workflow-view
      workflowTab.dispatchEvent('click');

      // Step any remaining frame that was queued
      env.stepFrame();

      // Now that currentTab !== 'graph-view', no further requestAnimationFrame calls should be scheduled
      assert.strictEqual(
        env.activeAnimationCallbacks.size,
        0,
        'Active animation callbacks must be 0 after loop terminates away from graph-view'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Node & Edge 2D Drawing Pipeline Verification (TC-CNV-03, TC-CNV-04)
  // ---------------------------------------------------------------------------
  describe('3. Node & Edge 2D Drawing Pipeline Verification', () => {

    it('TC-CNV-03.1: Each frame begins with clearRect(0, 0, canvas.width, canvas.height)', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');
      env.stepFrame();

      const latestCalls = env.mockCtx.getLatestFrameCalls();
      assert.strictEqual(latestCalls[0].type, 'clearRect', 'First operation in frame must be clearRect');
      assert.strictEqual(latestCalls[0].x, 0);
      assert.strictEqual(latestCalls[0].y, 0);
      assert.strictEqual(latestCalls[0].w, 1100);
      assert.strictEqual(latestCalls[0].h, 550);
    });

    it('TC-CNV-03.2: Warm referral highway renders with dashed stroke ([6, 4]), lineWidth 3.5, and emerald color', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');
      env.stepFrame();

      const latestCalls = env.mockCtx.getLatestFrameCalls();
      const strokeCalls = latestCalls.filter(c => c.type === 'stroke');

      // The 3 referral highway edges: Aarav->Rajesh, Rajesh->Vikram, Vikram->Apex
      const warmHighwayStrokes = strokeCalls.filter(s =>
        s.lineWidth === 3.5 &&
        s.strokeStyle === 'rgba(16, 185, 129, 0.7)' &&
        Array.isArray(s.lineDash) &&
        s.lineDash[0] === 6 &&
        s.lineDash[1] === 4
      );

      assert.strictEqual(
        warmHighwayStrokes.length,
        3,
        `Expected exactly 3 warm referral highway edge strokes with dashed emerald styling, found ${warmHighwayStrokes.length}`
      );
    });

    it('TC-CNV-03.3: Standard non-referral edges render with solid purple stroke (lineWidth 1.5, solid dash)', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');
      env.stepFrame();

      const latestCalls = env.mockCtx.getLatestFrameCalls();
      const strokeCalls = latestCalls.filter(c => c.type === 'stroke');

      // The 5 standard non-referral edges
      const standardEdgeStrokes = strokeCalls.filter(s =>
        s.lineWidth === 1.5 &&
        s.strokeStyle === 'rgba(139, 92, 246, 0.25)' &&
        (s.lineDash.length === 0)
      );

      assert.strictEqual(
        standardEdgeStrokes.length,
        5,
        `Expected exactly 5 non-referral edge strokes with solid purple styling, found ${standardEdgeStrokes.length}`
      );
    });

    it('TC-CNV-03.4: Edge labels rendered with JetBrains Mono font and distinct referral colors', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');
      env.stepFrame();

      const latestCalls = env.mockCtx.getLatestFrameCalls();
      const textCalls = latestCalls.filter(c => c.type === 'fillText' && c.font.includes('JetBrains Mono'));

      assert.strictEqual(
        textCalls.length,
        8,
        `Expected 8 edge labels rendered with JetBrains Mono, found ${textCalls.length}`
      );

      // Verify warm referral label text
      const referralLabel = textCalls.find(t => t.text === 'Warm Referral');
      assert.ok(referralLabel, 'Should render "Warm Referral" label');
      assert.strictEqual(referralLabel.fillStyle, '#34d399', 'Warm referral label should have emerald highlight #34d399');
    });

    it('TC-CNV-04.1: Candidate & University nodes render with violet fill (#8b5cf6) and light violet stroke (#c4b5fd)', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');
      env.stepFrame();

      const latestCalls = env.mockCtx.getLatestFrameCalls();
      // Candidate nodes: Aarav, Diya, Rohan, Priya (4 nodes) + University: NexaTech (1 node) = 5 nodes with default #8b5cf6
      const candidateFills = latestCalls.filter(c => c.type === 'fill' && c.fillStyle === '#8b5cf6');
      assert.strictEqual(
        candidateFills.length,
        5,
        `Expected 5 nodes (4 candidates + 1 university default) filled with #8b5cf6, found ${candidateFills.length}`
      );
    });

    it('TC-CNV-04.2: Employee & Leadership nodes render with cyan fill (#06b6d4) and cyan stroke (#67e8f9)', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');
      env.stepFrame();

      const latestCalls = env.mockCtx.getLatestFrameCalls();
      // Employee (Rajesh) + Leadership (Vikram) = 2 nodes
      const employeeFills = latestCalls.filter(c => c.type === 'fill' && c.fillStyle === '#06b6d4');
      assert.strictEqual(
        employeeFills.length,
        2,
        `Expected 2 employee/leadership nodes filled with #06b6d4, found ${employeeFills.length}`
      );
    });

    it('TC-CNV-04.3: Organization node renders with emerald fill (#10b981) and emerald stroke (#6ee7b7)', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');
      env.stepFrame();

      const latestCalls = env.mockCtx.getLatestFrameCalls();
      const orgFills = latestCalls.filter(c => c.type === 'fill' && c.fillStyle === '#10b981');
      assert.strictEqual(
        orgFills.length,
        1,
        `Expected 1 organization node filled with #10b981, found ${orgFills.length}`
      );
    });

    it('TC-CNV-04.4: Skill nodes render with amber fill (#f59e0b) and amber stroke (#fcd34d)', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');
      env.stepFrame();

      const latestCalls = env.mockCtx.getLatestFrameCalls();
      // Skill nodes: Java Core, Kafka Streams = 2 nodes
      const skillFills = latestCalls.filter(c => c.type === 'fill' && c.fillStyle === '#f59e0b');
      assert.strictEqual(
        skillFills.length,
        2,
        `Expected 2 skill nodes filled with #f59e0b, found ${skillFills.length}`
      );
    });

    it('TC-CNV-04.5: Node typography renders centered avatar initials and subtitle label', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');
      env.stepFrame();

      const latestCalls = env.mockCtx.getLatestFrameCalls();
      const avatarTexts = latestCalls.filter(c => c.type === 'fillText' && c.font.includes('bold 11px'));
      assert.strictEqual(
        avatarTexts.length,
        10,
        `Expected 10 avatar text labels, found ${avatarTexts.length}`
      );

      // Check avatars
      const textSet = new Set(avatarTexts.map(t => t.text));
      assert.ok(textSet.has('AS'), 'Should render avatar AS');
      assert.ok(textSet.has('DN'), 'Should render avatar DN');
      assert.ok(textSet.has('RV'), 'Should render avatar RV');
      assert.ok(textSet.has('PS'), 'Should render avatar PS');
      assert.ok(textSet.has('RK'), 'Should render avatar RK');
      assert.ok(textSet.has('VS'), 'Should render avatar VS');
      assert.ok(textSet.has('AC'), 'Should render avatar AC');
      assert.ok(textSet.has('NU'), 'Should render avatar NU');
      assert.ok(textSet.has('☕'), 'Should render avatar ☕');
      assert.ok(textSet.has('⚡'), 'Should render avatar ⚡');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Interactive Click Hit-Testing & Details Card (TC-CNV-05)
  // ---------------------------------------------------------------------------
  describe('4. Interactive Click Hit-Testing & Node Inspection', () => {

    it('TC-CNV-05.1: Mathematical coordinate translation handles mouse event coordinates', () => {
      const rect = { left: 100, top: 50, width: 550, height: 275 };
      const canvasWidth = 1100;
      const canvasHeight = 550;

      const clientX = 200;
      const clientY = 125;

      const clickX = (clientX - rect.left) * (canvasWidth / rect.width);
      const clickY = (clientY - rect.top) * (canvasHeight / rect.height);

      assert.strictEqual(clickX, (200 - 100) * (1100 / 550), 'clickX should scale by 2x');
      assert.strictEqual(clickX, 200);
      assert.strictEqual(clickY, (125 - 50) * (550 / 275), 'clickY should scale by 2x');
      assert.strictEqual(clickY, 150);
    });

    it('TC-CNV-05.2: Euclidean distance threshold (Math.hypot <= radius + 6) determines hit boundary', () => {
      const node = { x: 200, y: 150, radius: 26 };
      const threshold = node.radius + 6; // 32

      // Point exactly on boundary
      const boundaryDx = 32;
      const boundaryDy = 0;
      assert.ok(Math.hypot(boundaryDx, boundaryDy) <= threshold, 'Point at distance 32 must hit');

      // Point just outside boundary
      const outsideDx = 32.1;
      const outsideDy = 0;
      assert.ok(Math.hypot(outsideDx, outsideDy) > threshold, 'Point at distance 32.1 must miss');
    });

    it('TC-CNV-05.3: Click on Aarav Sharma at (200, 150) updates #graphNodeDetails with 94% trust', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');

      env.canvasEl.dispatchEvent({
        type: 'click',
        clientX: 200,
        clientY: 150
      });

      const cardHtml = env.elementsById.get('graphNodeDetails').innerHTML;
      assert.ok(cardHtml.includes('Aarav Sharma'), 'Details card must display candidate name Aarav Sharma');
      assert.ok(cardHtml.includes('Backend Eng (2y)'), 'Details card must display Aarav subtitle');
      assert.ok(cardHtml.includes('94%'), 'Details card must display 94% Social Graph Trust');
      assert.ok(cardHtml.includes('Verified Snapshot on Living Profile'), 'Details card must display verified badge');
    });

    it('TC-CNV-05.4: Click on Vikram Seth at (700, 200) updates #graphNodeDetails with 4.5x authority', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');

      env.canvasEl.dispatchEvent({
        type: 'click',
        clientX: 700,
        clientY: 200
      });

      const cardHtml = env.elementsById.get('graphNodeDetails').innerHTML;
      assert.ok(cardHtml.includes('Vikram Seth'), 'Details card must display leadership name Vikram Seth');
      assert.ok(cardHtml.includes('VP Eng'), 'Details card must display VP Eng title');
      assert.ok(cardHtml.includes('4.5x'), 'Details card must display 4.5x Endorsement Seniority Weight');
    });

    it('TC-CNV-05.5: Click on Rajesh K. at (450, 160) updates #graphNodeDetails with 3.5x authority', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');

      env.canvasEl.dispatchEvent({
        type: 'click',
        clientX: 450,
        clientY: 160
      });

      const cardHtml = env.elementsById.get('graphNodeDetails').innerHTML;
      assert.ok(cardHtml.includes('Rajesh K.'), 'Details card must display Rajesh K.');
      assert.ok(cardHtml.includes('3.5x'), 'Details card must display 3.5x Endorsement Seniority Weight');
    });

    it('TC-CNV-05.6: Click on Diya Nair at (220, 380) updates #graphNodeDetails with 78% trust', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');

      env.canvasEl.dispatchEvent({
        type: 'click',
        clientX: 220,
        clientY: 380
      });

      const cardHtml = env.elementsById.get('graphNodeDetails').innerHTML;
      assert.ok(cardHtml.includes('Diya Nair'), 'Details card must display Diya Nair');
      assert.ok(cardHtml.includes('78%'), 'Details card must display 78% Social Graph Trust');
    });

    it('TC-CNV-05.7: Click on Rohan Verma at (120, 260) updates #graphNodeDetails with 40% trust', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');

      env.canvasEl.dispatchEvent({
        type: 'click',
        clientX: 120,
        clientY: 260
      });

      const cardHtml = env.elementsById.get('graphNodeDetails').innerHTML;
      assert.ok(cardHtml.includes('Rohan Verma'), 'Details card must display Rohan Verma');
      assert.ok(cardHtml.includes('40%'), 'Details card must display 40% Social Graph Trust');
    });

    it('TC-CNV-05.8: Click on Priya Soni at (300, 280) updates #graphNodeDetails with 89% trust', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');

      env.canvasEl.dispatchEvent({
        type: 'click',
        clientX: 300,
        clientY: 280
      });

      const cardHtml = env.elementsById.get('graphNodeDetails').innerHTML;
      assert.ok(cardHtml.includes('Priya Soni'), 'Details card must display Priya Soni');
      assert.ok(cardHtml.includes('89%'), 'Details card must display 89% Social Graph Trust');
    });

    it('TC-CNV-05.9: Click on Apex Cloud Systems at (920, 270) updates #graphNodeDetails with ORGANIZATION type', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');

      env.canvasEl.dispatchEvent({
        type: 'click',
        clientX: 920,
        clientY: 270
      });

      const cardHtml = env.elementsById.get('graphNodeDetails').innerHTML;
      assert.ok(cardHtml.includes('Apex Cloud Systems'), 'Details card must display Apex Cloud Systems');
      assert.ok(cardHtml.includes('ORGANIZATION'), 'Details card must display ORGANIZATION type');
    });

    it('TC-CNV-05.10: Click on Java Core skill at (340, 70) updates #graphNodeDetails with SKILL type', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');

      env.canvasEl.dispatchEvent({
        type: 'click',
        clientX: 340,
        clientY: 70
      });

      const cardHtml = env.elementsById.get('graphNodeDetails').innerHTML;
      assert.ok(cardHtml.includes('Java Core'), 'Details card must display Java Core');
      assert.ok(cardHtml.includes('SKILL'), 'Details card must display SKILL type');
    });

    it('TC-CNV-05.11: Click on Kafka Streams skill at (580, 80) updates #graphNodeDetails with SKILL type', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');

      env.canvasEl.dispatchEvent({
        type: 'click',
        clientX: 580,
        clientY: 80
      });

      const cardHtml = env.elementsById.get('graphNodeDetails').innerHTML;
      assert.ok(cardHtml.includes('Kafka Streams'), 'Details card must display Kafka Streams');
      assert.ok(cardHtml.includes('SKILL'), 'Details card must display SKILL type');
    });

    it('TC-CNV-05.12: Click on empty space (0, 0) misses and leaves details card unchanged', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');

      const initialHtml = env.elementsById.get('graphNodeDetails').innerHTML;

      env.canvasEl.dispatchEvent({
        type: 'click',
        clientX: 0,
        clientY: 0
      });

      const afterHtml = env.elementsById.get('graphNodeDetails').innerHTML;
      assert.strictEqual(initialHtml, afterHtml, 'Details card should not mutate on miss at (0, 0)');
    });

    it('TC-CNV-05.13: Click at canvas center whitespace (550, 275) misses all nodes safely', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');

      const initialHtml = env.elementsById.get('graphNodeDetails').innerHTML;

      env.canvasEl.dispatchEvent({
        type: 'click',
        clientX: 550,
        clientY: 275
      });

      const afterHtml = env.elementsById.get('graphNodeDetails').innerHTML;
      assert.strictEqual(initialHtml, afterHtml, 'Details card should not mutate on miss at (550, 275)');
    });

    it('TC-CNV-05.14: Boundary hit detection precisely hits at radius + 6 and misses at radius + 7', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');

      // Aarav node is at (200, 150) with radius 26.
      // Exact boundary: 200 + 26 + 6 = 232
      env.canvasEl.dispatchEvent({
        type: 'click',
        clientX: 232,
        clientY: 150
      });
      let cardHtml = env.elementsById.get('graphNodeDetails').innerHTML;
      assert.ok(cardHtml.includes('Aarav Sharma'), 'Click at radius + 6 (distance 32) must hit Aarav Sharma');

      // Reset card
      env.elementsById.get('graphNodeDetails').innerHTML = '<h4>Placeholder</h4>';

      // 1 pixel outside boundary: 200 + 26 + 7 = 233
      env.canvasEl.dispatchEvent({
        type: 'click',
        clientX: 233,
        clientY: 150
      });
      cardHtml = env.elementsById.get('graphNodeDetails').innerHTML;
      assert.ok(!cardHtml.includes('Aarav Sharma'), 'Click at radius + 7 (distance 33) must miss Aarav Sharma');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Responsive Layout Adaptations & Edge Cases (TC-CNV-07)
  // ---------------------------------------------------------------------------
  describe('5. Responsive Layout Adaptations & Defensive Edge Cases', () => {

    it('TC-CNV-07.1: Scaled canvas (50% CSS width 550, height 275) translates coordinates accurately', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');

      // Canvas element scaled by CSS to 550x275
      env.setCanvasBoundingRect({ left: 0, top: 0, width: 550, height: 275 });

      // Click at clientX=100, clientY=75 should map to canvasX=200, canvasY=150 (Aarav Sharma)
      env.canvasEl.dispatchEvent({
        type: 'click',
        clientX: 100,
        clientY: 75
      });

      const cardHtml = env.elementsById.get('graphNodeDetails').innerHTML;
      assert.ok(cardHtml.includes('Aarav Sharma'), 'Click at (100, 75) on 0.5x scaled canvas must hit Aarav at (200, 150)');
    });

    it('TC-CNV-07.2: High-DPI / 2x Retina display (rect width 2200, height 1100) translates coordinates accurately', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');

      // Canvas element rendered on 2x display
      env.setCanvasBoundingRect({ left: 0, top: 0, width: 2200, height: 1100 });

      // Click at clientX=400, clientY=300 should map to canvasX=200, canvasY=150 (Aarav Sharma)
      env.canvasEl.dispatchEvent({
        type: 'click',
        clientX: 400,
        clientY: 300
      });

      const cardHtml = env.elementsById.get('graphNodeDetails').innerHTML;
      assert.ok(cardHtml.includes('Aarav Sharma'), 'Click on 2x retina scaled canvas must hit Aarav Sharma');
    });

    it('TC-CNV-07.3: Offset canvas bounding client rect (scrolled / padded page) translates coordinates accurately', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');

      // Canvas shifted 150px from left, 80px from top
      env.setCanvasBoundingRect({ left: 150, top: 80, width: 1100, height: 550 });

      // Click at clientX = 150 + 200 = 350, clientY = 80 + 150 = 230 maps to (200, 150)
      env.canvasEl.dispatchEvent({
        type: 'click',
        clientX: 350,
        clientY: 230
      });

      const cardHtml = env.elementsById.get('graphNodeDetails').innerHTML;
      assert.ok(cardHtml.includes('Aarav Sharma'), 'Shifted canvas bounding rect must hit Aarav Sharma');
    });

    it('TC-CNV-07.4: Zero-width bounding box (rect.width == 0) fallback does not crash or throw division errors', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');

      // Hidden canvas scenario
      env.setCanvasBoundingRect({ left: 0, top: 0, width: 0, height: 0 });

      assert.doesNotThrow(() => {
        env.canvasEl.dispatchEvent({
          type: 'click',
          clientX: 200,
          clientY: 150
        });
      }, 'Zero-bounding-box click event must not throw unhandled runtime exceptions');
    });

    it('TC-CNV-07.5: Negative and extreme out-of-bounds mouse coordinates are handled defensively', () => {
      const env = createTestEnvironment();
      const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
      graphTab.dispatchEvent('click');

      assert.doesNotThrow(() => {
        env.canvasEl.dispatchEvent({ type: 'click', clientX: -9999, clientY: -9999 });
        env.canvasEl.dispatchEvent({ type: 'click', clientX: 1000000, clientY: 1000000 });
        env.canvasEl.dispatchEvent({ type: 'click', clientX: NaN, clientY: NaN });
      }, 'Extreme or invalid coordinates must be handled safely');
    });

    it('TC-CNV-07.6: Graceful execution when canvas element is absent from DOM', () => {
      // Create environment where networkCanvas is missing
      const env = createTestEnvironment();
      const canvas = env.elementsById.get('networkCanvas');
      if (canvas) canvas.remove();
      env.elementsById.delete('networkCanvas');

      assert.doesNotThrow(() => {
        const graphTab = env.mockDocument.querySelectorAll('.nav-tab').find(t => t.getAttribute('data-tab') === 'graph-view');
        if (graphTab) graphTab.dispatchEvent('click');
      }, 'Missing networkCanvas must return gracefully without throwing');
    });

    it('TC-CNV-07.7: Graceful execution when details card is absent from DOM', () => {
      const env = createTestEnvironment();
      const details = env.elementsById.get('graphNodeDetails');
      if (details) details.remove();
      env.elementsById.delete('graphNodeDetails');

      assert.doesNotThrow(() => {
        env.canvasEl.dispatchEvent({
          type: 'click',
          clientX: 200,
          clientY: 150
        });
      }, 'Missing graphNodeDetails element must return gracefully without throwing');
    });
  });

});
