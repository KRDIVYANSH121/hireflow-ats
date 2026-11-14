# E2E Test Infra: HireFlow + OmniTalent Enterprise ATS

## Test Philosophy
- Opaque-box, requirement-driven, zero external dependencies (Node.js native test runner and assertion framework).
- Master test runner: `node tests/run-all-tests.js` executing 266 unified master tests across 5 verification suites.
- Challenger & Adversarial harness: 5 adversarial suites (115 tests) testing theme state invariance under rapid stress, IEEE contrast calculations, exact CSS layout regex rules, DOM tree balance, RBAC privilege escalation, and AI evaluation report verbatim contracts.

## Feature Inventory & Test Mapping
| # | Feature | Source (Requirement) | Master Suite Tests | Challenger Tests |
|---|---------|---------------------|:------------------:|:----------------:|
| 1 | REST API Contract & Endpoints | R1 / M1 | 50 tests | 19 tests (`test-adversarial-auth-api.js`) |
| 2 | Frontend DOM & Interactive Flows | R2 / M2 | 55 tests | 32 tests (`test-adversarial-redesign-challenger.js`) |
| 3 | AI Matching & Scoring Engine | R3 / M3 | 71 tests | 27 tests (`test-adversarial-triage-ai.js`) |
| 4 | Canvas 2D & Social Graph UX | R4 / M4 | 45 tests | 10 tests (`test-challenger-deep-recheck.js`) |
| 5 | Showcase Overhaul & Full Lifecycle | R5 / M5 | 45 tests | 27 tests (`test-challenger-workflow-stress.js`) |
| **Total** | **Master + Challenger Verification** | | **266 tests** | **115 tests** |

## Test Architecture
- Test Runner: `tests/run-all-tests.js` invoked via `node tests/run-all-tests.js`.
- Exit code semantics: Exit code 0 if 100% of tests pass; exit code 1 if any failure occurs.
- Execution environment: Headless mock DOM and in-memory HTTP server; requires zero npm packages.
- Byte-for-byte SHA256 parity verification: `TC-DOM-06` asserts identical checksums between root and `public/` files.

## Acceptance Thresholds
- Master test pass rate: 100% (266 / 266 tests passed, 0 failures).
- Challenger test pass rate: 100% (115 / 115 tests passed, 0 failures).
- Non-void tag integrity: 0 self-closing non-void tags (`<div />`, `<span />`, etc.).
- File parity: SHA256 checksums of `index.html` == `public/index.html`, `styles.css` == `public/styles.css`, `app.js` == `public/app.js`.
- Live server: `node server.js` binds cleanly on port 3000 without runtime errors.
