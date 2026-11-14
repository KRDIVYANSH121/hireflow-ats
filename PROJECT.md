# Project: HireFlow + OmniTalent Enterprise ATS Frontend Redesign

## Architecture
The platform is an enterprise-grade Applicant Tracking System (ATS) and AI talent network with a single-page architecture (SPA) serving three user roles: Candidate, Recruiter HR, and Recruiter Admin.
- **Frontend Core**: Vanilla HTML5, CSS3, and JavaScript (ES2022) with zero runtime build dependencies. Runs directly in browser and headless Node.js test environments.
- **Design System Reference**: `hireflow_enterprise_ats_talent_network.html` providing an obsidian dark theme (`#08090d`), crisp light theme (`#f8fafc`), Inter + JetBrains Mono typography, 56px sticky enterprise header, Ashby-style 6-KPI telemetry strip, split-pane AI triage & job feed, and modern non-clumpy component surfaces.
- **File Mirroring Contract**: Strict byte-for-byte SHA-256 parity between root (`index.html`, `styles.css`, `app.js`) and `public/` (`public/index.html`, `public/styles.css`, `public/app.js`).
- **Backend Contract**: Node.js HTTP REST API (`server.js`) providing organizations, jobs, applications, AI resume parsing, candidate scoring, and audit trails.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Obsidian & Crisp Light Design Tokens | CSS custom properties for surfaces, borders, text, brand accents, typography, and spacing scale | M1 | Survey (Explorer 1) |
| 2 | Component Surface & Utility Classes | `.app-panel`, `.app-elevated`, `.brand-bg`, `.brand-soft`, `.brand-text`, `.brand-ring`, `.kbd-badge`, `.score-ring` | M1 | Survey (Explorer 1) |
| 3 | Exact CSS Layout Regex Preservation | `.feed-split-layout`, `.feed-detail-pane`, `#pipelineKanbanView`, `.kanban-col` preserving exact CSS rules for tests | M1 | Survey (Explorer 3) |
| 4 | Mathematical WCAG Contrast Compliance | >= 7.0:1 (AAA) for primary text, >= 4.5:1 (AA) for muted text in both dark and light modes | M1 | Survey (Explorer 1 & 3) |
| 5 | Enterprise Header & Navigation | 56px sticky top bar, HF monogram, PaaS tenant badge, live API sync dot, session capsule, theme switcher | M2 | Survey (Explorer 1) |
| 6 | Ashby-Style 6-KPI Telemetry Strip | Executive metrics strip (Open Requisitions, Active Candidates, AI Match Index, Shortlisted, Rubric Avg, Offers) | M2 | Survey (Explorer 1) |
| 7 | Auth Gateway Layout Modernization | Upfront 7:5 split identity gateway preserving `#authGateway`, role cards, 1-click presets, and custom login form | M2 | Survey (Explorer 2) |
| 8 | 11 SPA View Panels & 276 DOM IDs | Preserving all 11 view panels, all 276 critical DOM IDs, and tag hierarchy with zero illegal self-closing tags | M2 | Survey (Explorer 2 & 3) |
| 9 | Dual 6-Stage Kanban Board Markup | Retaining `#pipelineKanbanView` (`#pipeline-cards-<stage>`) and `#kanban-view` (`#cards-<stage>`) across all 6 stages | M2 | Survey (Explorer 2) |
| 10 | Modals Structural Modernization | Modern dialog structures for AI report (`#aiReportModal`), Scorecard (`#scorecardModal`), and Offer letter | M2 | Survey (Explorer 1 & 2) |
| 11 | Theme Engine Synchronization | Synchronize `#themeToggleBtn`, `#themeToggleIcon` (☀️/🌙), `#themeToggleLabel` (Light/Dark), `data-theme`, and `.dark` class | M3 | Survey (Explorer 2 & 3) |
| 12 | Brand Color Preservation Engine | `applyThemeColor(hex)` sets `--brand-primary` and `--accent-glow` without being overwritten by theme toggles | M3 | Survey (Explorer 3) |
| 13 | AI Evaluation Modal Verbatim Contract | Render all 14 required verbatim strings, >=4 `.chip-mandatory` chips, and radial score gauge `--score-pct` | M3 | Survey (Explorer 2 & 3) |
| 14 | Dynamic Component Template Modernization | Modernized card templates for job feed, pipeline cards, triage list, living profile, and rubric sliders | M3 | Survey (Explorer 1 & 2) |
| 15 | Role-Based Access Control Interceptions | Client-side tab filtering (`data-roles`) and redirection preventing privilege escalation | M3 | Survey (Explorer 2 & 3) |
| 16 | Root & Public File Parity Synchronization | Guarantee SHA-256 byte-for-byte identity between `public/` files and root files | M4 | Survey (Explorer 2 & 3) |
| 17 | Master & Challenger Test Suite 100% Pass | 266/266 master tests (`node tests/run-all-tests.js`) and 115/115 challenger tests passing with 0 failures | M4 | Survey (Explorer 3) |
| 18 | Clean Server Startup & Delivery | `server.js` starts cleanly on `http://localhost:3000` delivering modernized, responsive interface | M4 | User Request |
| 19 | Opaque-Box E2E Regression Verification | End-to-end verification across candidate, recruiter HR, and recruiter admin workflows | M4 | Project Pattern |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | CSS Architecture & Design System Tokens | Modernize `public/styles.css` with template tokens, obsidian/light surfaces, utility classes, and WCAG contrast while preserving exact tested layout regexes | none | DONE |
| M2 | HTML Structure & Layout Integration | Modernize `public/index.html` with clean enterprise ATS header, workflow ribbon, telemetry strip, view panels, and modals while strictly preserving all 276 DOM IDs and zero self-closing non-void tags | M1 | DONE |
| M3 | Dynamic UI Templates & Component Polish | Update `public/app.js` dynamic render functions, theme engine synchronization (`.dark` + `data-theme`), brand color persistence, and 14-string AI evaluation modal contract | M1, M2 | PLANNED |
| M4 | Final Integration, Test Pass & Challenger Hardening | Mirror `public/*` to root files, achieve 100% test pass rate (266 master tests + all challenger suites), verify `localhost:3000` delivery, and complete forensic audit | M1, M2, M3 | PLANNED |

## Interface Contracts
### Stylesheet ↔ HTML Document (`public/styles.css` ↔ `public/index.html`)
- Root CSS custom properties: `--surface-bg`, `--surface-panel`, `--surface-elevated`, `--surface-border`, `--text-primary`, `--text-secondary`, `--text-muted`, `--brand-primary`, `--brand-border`.
- Invariant Layout Selectors:
  * `.feed-split-layout`: `display: grid; grid-template-columns: minmax(360px, 450px) minmax(400px, 1fr); gap: var(--space-6, 24px);`
  * `@media (max-width: 1080px)`: `.feed-split-layout { grid-template-columns: 1fr; }`
  * `.feed-detail-pane`: `position: sticky; top: calc(var(--header-height, 64px) + var(--space-4, 16px)); max-height: calc(100vh - 120px); overflow-y: auto;`
  * `#pipelineKanbanView`: `display: flex !important; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;`
  * `.kanban-col`: `flex: 0 0 310px; min-width: 310px; scroll-snap-align: start;`

### HTML Document ↔ Application Script (`public/index.html` ↔ `public/app.js`)
- All 276 DOM IDs must exist with matching tag semantics.
- Sibling hierarchy: `#jobFeedContainer` and `#jobDetailPane` must be direct sibling children of `.feed-split-layout`.
- Tag balance: strictly zero `<div />`, `<span />`, `<p />`, or other self-closing non-void tags.
- Stage columns: `#pipeline-cards-<stage>` and `#cards-<stage>` must both exist for each of the 6 stages.

### Application Script ↔ Verification Suite (`public/app.js` ↔ `tests/*`)
- Global namespace: `window.state`, `window.hireflowAuth`, `window.applyTheme`, `window.applyThemeColor`.
- Theme attributes: `documentElement.getAttribute('data-theme')` is `'light'` or `'dark'`; `#themeToggleIcon` text is `☀️` or `🌙`; `#themeToggleLabel` is `Light` or `Dark`.
- AI Evaluation Modal: Aarav Sharma report body must render verbatim all 14 required strings and at least 4 `.chip-mandatory` elements.

## Code Layout
- `public/index.html` - Primary production HTML document
- `public/styles.css` - Primary production stylesheet
- `public/app.js` - Primary production client application logic
- `index.html` - Root mirror (byte-for-byte identical to `public/index.html`)
- `styles.css` - Root mirror (byte-for-byte identical to `public/styles.css`)
- `app.js` - Root mirror (byte-for-byte identical to `public/app.js`)
- `server.js` - Node.js HTTP server and REST API backend
- `tests/run-all-tests.js` - Unified master test runner (266 tests)
- `tests/test-adversarial-redesign-challenger.js` - Challenger test suite (32 tests)
- `tests/test-adversarial-auth-api.js` - Adversarial auth & API suite (19 tests)
- `tests/test-adversarial-triage-ai.js` - Adversarial AI & triage suite (27 tests)
- `tests/test-challenger-deep-recheck.js` - Challenger recheck suite (10 tests)
- `tests/test-challenger-workflow-stress.js` - Challenger workflow stress suite (27 tests)
