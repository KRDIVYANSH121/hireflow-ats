# HireFlow + OmniTalent: ATS & Social Network Fusion Platform

> **Full-Lifecycle Applicant Tracking System (ATS) + Professional Social Network Fusion** featuring an interactive 6-step AI recruitment engine, live social graph, transparent compensation modeling, and collaborative hiring scorecards.

---

## 🚀 How to Run the Site

### Option 1: Instant Browser Launch (No Server Needed)
Simply double-click or open `index.html` in any browser:
```bash
# Double-click:
c:\Users\darkp\OneDrive\Desktop\HIREFLOW FINAL VERSION 1\index.html
```
The site features a **Dual-Mode Engine** that works 100% offline with zero dependencies!

### Option 2: Run with Live Node.js REST API Server
To start the REST API backend and serve the application locally:
```bash
# In this directory:
node server.js
```
Then visit: **`http://localhost:3000`** in your browser.

---

## 🌟 Core Modules & Architecture

### 1. ⚡ 6-Step Hiring Workflow Studio
- **Step 1: Multi-Tenant Organization Deployment**: Branded portal builder (Enterprise Company vs. University TPO) with custom subdomains (`.hireflow.ai`) and configurable auto-shortlist score thresholds.
- **Step 2: Job Requisition Studio**: Role publishing with mandatory skills (70% weight), preferred skills (20% weight), and experience requirements (10% weight).
- **Step 3: Candidate Living Profile Application**: Verifiable profile ingestion with GitHub/portfolio links, DigiLocker verified badges, and warm referral path routing.
- **Step 4: AI NLP Resume Parser**: Skill extraction against a 20+ canonical taxonomy, regex experience detection (`X years`), and 768-dimensional dense vector embeddings for semantic cross-attention.
- **Step 5: Intelligent Shortlisting Leaderboard**: Real-time ranking with circular progress gauges (**Aarav Sharma 96%**, **Diya Nair 88%**, **Priya Soni 92%**, **Rohan Verma 31%**), explicit Strengths tags, and Skill Gaps isolation.
- **Step 6: Human Decision & Collaborative Scorecards**: Structured 1–5 rubrics (System Design, Coding, Problem Solving, Culture) to eliminate bias, decision states (`SelectedForOffer`, `HoldWaitlist`, `Rejected`), and digital offer letter generation.

### 2. 📋 Enterprise Multi-Tenant ATS Kanban
- Multi-stage pipeline: **Sourced → Applied → Assessment Pending → Interviewing → Offer Extended → Closed**.
- Live card counts, quick stage advancement dropdowns, and referral tags.

### 3. 🕸️ Social Graph & Warm Referrals (Canvas Simulation)
- Interactive HTML5 canvas graph visualizer.
- Endorsement authority weighting (**4.5x multiplier** for VP/Principal Engineer seniority).
- 1-click verified warm referral paths connecting candidates to leadership.

### 4. 💎 Wellfound-Inspired Compensation & ESOP Studio
- Interactive financial modeling for Base Salary (CTC), Target Bonus %, Equity/ESOP %, and Company Valuation.
- 4-Year linear vesting trajectory with a 1-year cliff.

### 5. 📜 Compliance & Hiring Audit Ledger
- Immutable decision audit stream with timestamps and reviewer remarks.
- One-click CSV export (`hireflow-compliance-audit.csv`).
- GDPR/DPDP candidate data ownership and consent tracking.

---

## 📁 Project Structure

```
HIREFLOW FINAL VERSION 1/
├── index.html               # Main Glassmorphic SPA application
├── styles.css               # Obsidian dark glassmorphism styling
├── app.js                   # Client-side reactivity, canvas graph & state engine
├── server.js                # Node.js REST API server & static asset handler
├── package.json             # NPM metadata and startup script
├── HireFlowEngine.java      # Java 21+ executable 6-stage domain engine
├── OmniTalentDomainSpec.java# Java 21+ records & sealed interfaces specification
├── public/                  # Static assets mirrored for server serving
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── README.md                # Documentation and quickstart guide
```

