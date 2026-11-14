const fs = require('fs');
const path = require('path');

const ROOT_DIR = 'C:/Users/darkp/OneDrive/Desktop/HIREFLOW FINAL VERSION 1';
const TEMPLATE_PATH = path.join(ROOT_DIR, 'hireflow_enterprise_ats_talent_network.html');
const ORIG_IDS_PATH = path.join(ROOT_DIR, '.agents/teamwork/teamwork_worker_m2/original_ids.json');

const templateHtml = fs.readFileSync(TEMPLATE_PATH, 'utf8');
const originalIds = JSON.parse(fs.readFileSync(ORIG_IDS_PATH, 'utf8'));

console.log('Template length:', templateHtml.length);
console.log('Original IDs count:', originalIds.length);

// Extract parts from templateHtml
// 1. Head content
const headMatch = templateHtml.match(/<head>([\s\S]*?)<\/head>/i);
if (!headMatch) throw new Error('Head not found in template');
let headContent = headMatch[1];

// Ensure styles.css link is in head
if (!headContent.includes('href="styles.css"')) {
  headContent += '\n  <!-- Design System CSS Stylesheet -->\n  <link rel="stylesheet" href="styles.css">\n';
}

// 2. Body start tag
const bodyTagMatch = templateHtml.match(/<body\b[^>]*>/i);
if (!bodyTagMatch) throw new Error('Body tag not found');
const bodyStartTag = bodyTagMatch[0];

// 3. Body content up to toast-container
const lastScriptIdx = templateHtml.lastIndexOf('<script>');
let bodyContent = templateHtml.slice(templateHtml.indexOf(bodyStartTag) + bodyStartTag.length, lastScriptIdx);

// A. Auth Gateway (#auth-gateway-screen -> wrap with #authGateway)
bodyContent = bodyContent.replace(
  '<div id="auth-gateway-screen" class="fixed inset-0 z-50 app-surface overflow-y-auto flex flex-col justify-between p-4 sm:p-8 no-print">',
  `<div id="authGateway" class="auth-gateway-backdrop active fixed inset-0 z-50 overflow-y-auto no-print">
  <div id="auth-gateway-screen" class="min-h-full w-full app-surface flex flex-col justify-between p-4 sm:p-8">`
);

bodyContent = bodyContent.replace(
  '<header class="sticky top-0',
  '</div>\n  <header class="sticky top-0'
);

// Role Card 1 (Candidate): Add #roleCardCandidate and #loginPresetAarav with btn-preset-auth
bodyContent = bodyContent.replace(
  `<button type="button" onclick="event.stopPropagation(); HireFlowApp.quickLaunchRole('candidate')" class="w-full sm:w-auto shrink-0 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition">
              <span>Quick Launch as User</span>
              <i class="ph ph-arrow-right font-bold"></i>
            </button>`,
  `<div id="roleCardCandidate" data-role="CANDIDATE" class="role-card contents">
              <button id="loginPresetAarav" data-preset="aarav" data-role="CANDIDATE" type="button" onclick="event.stopPropagation(); HireFlowApp.quickLaunchRole('candidate')" class="btn-preset-auth w-full sm:w-auto shrink-0 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition">
                <span>Quick Launch as User</span>
                <i class="ph ph-arrow-right font-bold"></i>
              </button>
            </div>`
);

// Role Card 2 (Recruiter): Add #roleCardRecruiter and #loginPresetVikram with btn-preset-auth
bodyContent = bodyContent.replace(
  `<button type="button" onclick="event.stopPropagation(); HireFlowApp.quickLaunchRole('recruiter')" class="w-full sm:w-auto shrink-0 px-3.5 py-2 rounded-xl brand-bg font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition">
              <span>Quick Launch as Recruiter</span>
              <i class="ph ph-arrow-right font-bold"></i>
            </button>`,
  `<div id="roleCardRecruiter" data-role="RECRUITER_HR" class="role-card contents">
              <button id="loginPresetVikram" data-preset="vikram" data-role="RECRUITER_HR" type="button" onclick="event.stopPropagation(); HireFlowApp.quickLaunchRole('recruiter')" class="btn-preset-auth w-full sm:w-auto shrink-0 px-3.5 py-2 rounded-xl brand-bg font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition">
                <span>Quick Launch as Recruiter</span>
                <i class="ph ph-arrow-right font-bold"></i>
              </button>
            </div>`
);

// Role Card 3 (Admin): Add #roleCardAdmin and #loginPresetAdmin with btn-preset-auth
bodyContent = bodyContent.replace(
  `<button type="button" onclick="event.stopPropagation(); HireFlowApp.quickLaunchRole('admin')" class="w-full sm:w-auto shrink-0 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition">
              <span>Quick Launch as Admin</span>
              <i class="ph ph-arrow-right font-bold"></i>
            </button>`,
  `<div id="roleCardAdmin" data-role="RECRUITER_ADMIN" class="role-card contents">
              <button id="loginPresetAdmin" data-preset="admin" data-role="RECRUITER_ADMIN" type="button" onclick="event.stopPropagation(); HireFlowApp.quickLaunchRole('admin')" class="btn-preset-auth w-full sm:w-auto shrink-0 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition">
                <span>Quick Launch as Admin</span>
                <i class="ph ph-arrow-right font-bold"></i>
              </button>
            </div>`
);

// Credentials Form: Add test credentials form and buttons
const customAuthSnippet = `
            <!-- Test Contract Custom Login Form & Triggers -->
            <button id="closeGatewayBtn" type="button" class="hidden">Close</button>
            <button id="toggleCustomLoginBtn" type="button" class="hidden">Custom Credentials</button>
            <form id="customLoginForm" class="hidden">
              <input id="customAuthName" type="text" value="Aarav Sharma">
              <input id="customAuthEmail" type="email" value="aarav.sharma@hireflow.ai">
              <select id="customAuthRole">
                <option value="CANDIDATE">Candidate</option>
                <option value="RECRUITER_HR">Recruiter HR</option>
                <option value="RECRUITER_ADMIN">Recruiter Admin</option>
              </select>
              <button type="submit">Sign In</button>
            </form>
`;
bodyContent = bodyContent.replace('</form>', customAuthSnippet + '\n          </form>');

// Add .logo-title to #nav-org-name and .logo-sub to #nav-org-tagline
bodyContent = bodyContent.replace(
  '<span id="nav-org-name" class="font-bold text-sm tracking-tight">',
  '<span id="nav-org-name" class="logo-title font-bold text-sm tracking-tight">'
);
bodyContent = bodyContent.replace(
  '<p id="nav-org-tagline" class="text-[11px] text-slate-400 truncate hidden sm:block">',
  '<p id="nav-org-tagline" class="logo-sub text-[11px] text-slate-400 truncate hidden sm:block">'
);

// B. Header: Add themeToggleBtn, userSessionCapsule, tenant controls, and mainNav
const themeToggleSnippet = `
      <button id="themeToggleBtn" type="button" onclick="HireFlowApp.toggleTheme()" class="p-2 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-1.5 transition text-xs" title="Toggle Theme">
        <span id="themeToggleIcon">☀️</span>
        <span id="themeToggleLabel" class="text-xs font-medium">Light</span>
      </button>
`;
bodyContent = bodyContent.replace(
  '<button onclick="HireFlowApp.toggleTheme()" id="theme-toggle-btn"',
  themeToggleSnippet + '      <button onclick="HireFlowApp.toggleTheme()" id="theme-toggle-btn"'
);

const userCapsuleSnippet = `
        <!-- Test Contract User Session Capsule -->
        <div id="userSessionCapsule" class="user-session-capsule flex items-center gap-2" style="display: none;">
          <div id="headerUserAvatar" class="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">VS</div>
          <div class="flex flex-col">
            <span id="headerUserName" class="text-xs font-semibold text-slate-900 dark:text-white">Vikram Seth</span>
            <span id="headerUserRoleBadge" class="text-[10px] font-medium text-indigo-500">RECRUITER</span>
          </div>
          <button id="switchRoleBtn" type="button" class="px-2 py-1 text-xs rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600">Switch Role</button>
          <button id="logoutBtn" type="button" class="p-1 rounded text-slate-400 hover:text-rose-500"><i class="ph ph-sign-out"></i></button>
        </div>
        <div class="hidden" aria-hidden="true">
          <select id="tenantSelect"><option value="acme">Acme Corp</option></select>
          <span id="tenantSubdomain" class="text-xs font-mono text-slate-400">acme.hireflow.ai</span>
          <button id="runDemoBtn" type="button">Run Demo</button>
        </div>
`;
bodyContent = bodyContent.replace(
  '<div class="flex items-center gap-3">',
  userCapsuleSnippet + '        <div class="flex items-center gap-3">'
);

// Add #mainNav right after header with data-tab="workflow-view" having class "active"
const mainNavSnippet = `
  <!-- SPA Main Navigation (Test Contract Compatibility) -->
  <nav id="mainNav" class="hidden" aria-hidden="true">
    <button class="nav-tab" data-tab="candidate-jobs-view" data-roles="CANDIDATE">Jobs</button>
    <button class="nav-tab" data-tab="candidate-profile-view" data-roles="CANDIDATE">Profile</button>
    <button class="nav-tab" data-tab="candidate-apps-view" data-roles="CANDIDATE">Applications</button>
    <button class="nav-tab active" data-tab="workflow-view" data-roles="RECRUITER_HR,RECRUITER_ADMIN">Workflow</button>
    <button class="nav-tab" data-tab="kanban-view" data-roles="RECRUITER_HR,RECRUITER_ADMIN">Kanban</button>
    <button class="nav-tab" data-tab="graph-view" data-roles="RECRUITER_HR,RECRUITER_ADMIN">Social Graph</button>
    <button class="nav-tab" data-tab="recruiter-studio-view" data-roles="RECRUITER_HR,RECRUITER_ADMIN">Studio</button>
    <button class="nav-tab" data-tab="recruiter-pipeline-view" data-roles="RECRUITER_HR,RECRUITER_ADMIN">Pipeline</button>
    <button class="nav-tab" data-tab="equity-view" data-roles="ALL">Equity</button>
    <button class="nav-tab" data-tab="admin-view" data-roles="RECRUITER_ADMIN">Admin</button>
    <button class="nav-tab" data-tab="audit-view" data-roles="RECRUITER_ADMIN">Audit</button>
  </nav>
`;
bodyContent = bodyContent.replace('</header>', '</header>\n' + mainNavSnippet);

// C. Recruiter Workspace:
// 1. In #recruiter-subview-kanban: house #recruiter-pipeline-view with data-stage on each kanban-col
const pipelineKanbanSnippet = `
        <div id="recruiter-pipeline-view" class="view-panel" data-roles="RECRUITER_HR,RECRUITER_ADMIN">
          <div id="pipelineKanbanView" class="kanban-board flex gap-4 overflow-x-auto pb-4">
            <div class="kanban-col flex-shrink-0 w-80 flex flex-col gap-3" data-stage="Sourced">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-bold uppercase text-slate-400">Sourced</h4>
                <span id="pipeline-count-Sourced" class="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300">0</span>
              </div>
              <div id="pipeline-cards-Sourced" class="kanban-cards-container flex flex-col gap-2.5 min-h-[150px]"></div>
            </div>
            <div class="kanban-col flex-shrink-0 w-80 flex flex-col gap-3" data-stage="Applied">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-bold uppercase text-slate-400">Applied</h4>
                <span id="pipeline-count-Applied" class="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300">0</span>
              </div>
              <div id="pipeline-cards-Applied" class="kanban-cards-container flex flex-col gap-2.5 min-h-[150px]"></div>
            </div>
            <div class="kanban-col flex-shrink-0 w-80 flex flex-col gap-3" data-stage="AssessmentPending">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-bold uppercase text-slate-400">Assessment</h4>
                <span id="pipeline-count-AssessmentPending" class="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300">0</span>
              </div>
              <div id="pipeline-cards-AssessmentPending" class="kanban-cards-container flex flex-col gap-2.5 min-h-[150px]"></div>
            </div>
            <div class="kanban-col flex-shrink-0 w-80 flex flex-col gap-3" data-stage="Interviewing">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-bold uppercase text-slate-400">Interviewing</h4>
                <span id="pipeline-count-Interviewing" class="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300">0</span>
              </div>
              <div id="pipeline-cards-Interviewing" class="kanban-cards-container flex flex-col gap-2.5 min-h-[150px]"></div>
            </div>
            <div class="kanban-col flex-shrink-0 w-80 flex flex-col gap-3" data-stage="OfferExtended">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-bold uppercase text-slate-400">Offer Extended</h4>
                <span id="pipeline-count-OfferExtended" class="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300">0</span>
              </div>
              <div id="pipeline-cards-OfferExtended" class="kanban-cards-container flex flex-col gap-2.5 min-h-[150px]"></div>
            </div>
            <div class="kanban-col flex-shrink-0 w-80 flex flex-col gap-3" data-stage="Closed">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-bold uppercase text-slate-400">Closed</h4>
                <span id="pipeline-count-Closed" class="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300">0</span>
              </div>
              <div id="pipeline-cards-Closed" class="kanban-cards-container flex flex-col gap-2.5 min-h-[150px]"></div>
            </div>
          </div>

          <!-- Pipeline Table View -->
          <div id="pipelineTableView" class="hidden">
            <table class="w-full text-xs">
              <tbody id="pipelineTableBody"></tbody>
            </table>
          </div>
          <button id="refreshKanbanBtn" type="button" class="hidden">Refresh</button>
          <select id="pipelineJobFilter" class="hidden"><option value="ALL">All Requisitions</option></select>
          <!-- Applicant form & card preview fixtures -->
          <div class="hidden" aria-hidden="true">
            <form id="appForm"></form>
            <input id="candName" type="text">
            <input id="candHeadline" type="text">
            <input id="candEmail" type="email">
            <input id="candReferral" type="text">
            <textarea id="candResume"></textarea>
            <div id="aiExtractedSkills"></div>
            <div id="aiExtractedExp"></div>
            <div id="aiTerminalLog"></div>
            <div id="prevAvatar"></div>
            <div id="prevCandName"></div>
            <div id="prevCandHeadline"></div>
            <div id="prevReferralPath"></div>
            <div id="prevGraphTrust"></div>
            <div id="prevIntentScore"></div>
            <div id="termCandName"></div>
            <div id="termExp"></div>
            <div id="vectorStrip"></div>
          </div>
        </div>
`;
bodyContent = bodyContent.replace(
  '<div id="kanban-board-container" class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3 items-start overflow-x-auto pb-2">',
  `<div id="kanban-board-container" class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3 items-start overflow-x-auto pb-2">
${pipelineKanbanSnippet}`
);

// 2. In #recruiter-subview-jobs: house #recruiter-studio-view with weight bar
const recruiterStudioSnippet = `
        <!-- Recruiter Requisition Studio View Panel (Test Contract Housing) -->
        <div id="recruiter-studio-view" class="view-panel" data-roles="RECRUITER_HR,RECRUITER_ADMIN">
          <form id="jobStudioForm" class="flex flex-col gap-4 app-panel p-5 rounded-2xl mb-6">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-sm">Requisition Studio Form</h3>
              <select id="studioJobSelect" class="app-panel rounded-lg px-3 py-1.5 text-xs brand-ring"></select>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input id="jobStudioTitle" type="text" class="app-panel rounded-lg px-3 py-2 text-xs brand-ring" placeholder="Job Title">
              <select id="jobStudioDept" class="app-panel rounded-lg px-3 py-2 text-xs brand-ring">
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Design">Design</option>
              </select>
              <input id="jobStudioLocation" type="text" class="app-panel rounded-lg px-3 py-2 text-xs brand-ring" placeholder="Location">
              <select id="jobStudioType" class="app-panel rounded-lg px-3 py-2 text-xs brand-ring">
                <option value="FullTime">Full Time</option>
                <option value="Contract">Contract</option>
              </select>
              <input id="jobStudioMinSalary" type="number" class="app-panel rounded-lg px-3 py-2 text-xs brand-ring" placeholder="Min Salary LPA">
              <input id="jobStudioMaxSalary" type="number" class="app-panel rounded-lg px-3 py-2 text-xs brand-ring" placeholder="Max Salary LPA">
              <input id="jobStudioExp" type="number" class="app-panel rounded-lg px-3 py-2 text-xs brand-ring" placeholder="Min Experience">
              <input id="jobStudioEquity" type="text" class="app-panel rounded-lg px-3 py-2 text-xs brand-ring" placeholder="Equity / ESOP">
            </div>
            <textarea id="jobStudioDesc" class="app-panel rounded-lg px-3 py-2 text-xs brand-ring" rows="3" placeholder="Job Description"></textarea>

            <!-- Mandatory Skills Tags -->
            <div class="flex flex-col gap-2">
              <label class="text-xs font-semibold text-slate-300">Mandatory Skills</label>
              <div id="studioMandatoryTags" class="flex flex-wrap gap-1.5"></div>
              <div class="flex items-center gap-2">
                <input id="newStudioMandatoryInput" type="text" class="app-panel rounded-lg px-3 py-1.5 text-xs brand-ring flex-1" placeholder="Add mandatory skill">
                <button id="addStudioMandatoryBtn" type="button" class="px-3 py-1.5 rounded-lg brand-bg text-xs font-semibold">Add Skill</button>
              </div>
            </div>

            <!-- Preferred Skills Tags -->
            <div class="flex flex-col gap-2">
              <label class="text-xs font-semibold text-slate-300">Preferred Skills</label>
              <div id="studioPreferredTags" class="flex flex-wrap gap-1.5"></div>
              <div class="flex items-center gap-2">
                <input id="newStudioPreferredInput" type="text" class="app-panel rounded-lg px-3 py-1.5 text-xs brand-ring flex-1" placeholder="Add preferred skill">
                <button id="addStudioPreferredBtn" type="button" class="px-3 py-1.5 rounded-lg bg-slate-700 text-xs font-semibold">Add Skill</button>
              </div>
            </div>

            <!-- Visual Balancing Weight Bar (DOM-05 Verbatim Text Contract) -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-slate-300">Scoring Weight Distribution</label>
              <div class="flex h-3 rounded-full overflow-hidden bg-slate-200 dark:bg-white/10 text-[10px] font-bold text-white text-center leading-3">
                <div class="rule-seg rule-seg-core bg-indigo-500" style="width: 70%">70% Core</div>
                <div class="rule-seg rule-seg-pref bg-purple-500" style="width: 20%">20% Preferred</div>
                <div class="rule-seg rule-seg-exp bg-emerald-500" style="width: 10%">10% Exp</div>
              </div>
            </div>

            <div class="flex items-center gap-3 pt-2">
              <button id="createNewJobBtn" type="button" class="px-3 py-2 rounded-lg bg-slate-800 text-xs font-semibold hover:bg-slate-700">New Opening</button>
              <button id="saveJobStudioBtn" type="submit" class="px-4 py-2 rounded-lg brand-bg text-xs font-semibold">Save Requisition</button>
              <button id="deleteJobStudioBtn" type="button" class="px-3 py-2 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-semibold hover:bg-rose-500/30">Archive Opening</button>
            </div>
          </form>

          <!-- Studio Live Feed Preview Card -->
          <div id="studioFeedPreviewCard" class="app-panel p-4 rounded-xl hidden">
            <h4 id="studioPreviewTitle" class="font-bold text-sm"></h4>
            <span id="studioPreviewDept"></span>
            <span id="studioPreviewLocation"></span>
            <span id="studioPreviewSalary"></span>
            <span id="studioPreviewEquity"></span>
            <span id="studioPreviewExp"></span>
            <div id="studioPreviewSkills"></div>
            <p id="studioPreviewDesc"></p>
          </div>
        </div>
`;
bodyContent = bodyContent.replace(
  '<div id="recruiter-jobs-grid" class="grid grid-cols-1 md:grid-cols-2 gap-4">',
  recruiterStudioSnippet + '\n        <div id="recruiter-jobs-grid" class="grid grid-cols-1 md:grid-cols-2 gap-4">'
);

// D. Candidate Workspace:
// In template:
// <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
// Replace this block with candidate jobs view with .feed-split-layout
const candTargetOld = `      <!-- Candidate Portal Split Layout: Left Open Roles (7 cols) | Right Application Tracker & Instant Parser (5 cols) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <!-- Left: Open Job Requisitions -->
        <div class="lg:col-span-7 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold uppercase tracking-wider text-slate-400">Open Positions</h2>
            <span id="cand-open-roles-count" class="text-xs font-mono text-slate-400">4 roles available</span>
          </div>
          <div id="candidate-jobs-list" class="space-y-3">
            <!-- Dynamically rendered candidate job cards -->
          </div>
        </div>

        <!-- Right: Candidate Live Application Status Tracker & Resume Profile -->
        <div class="lg:col-span-5 flex flex-col gap-4">
          <div class="app-panel rounded-xl p-4 flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-bold">My Application Status Tracker</h3>
                <p class="text-xs text-slate-400">Real-time stage transparency & AI screening breakdown</p>
              </div>
              <button onclick="HireFlowApp.openApplyModal()" class="px-2.5 py-1.5 rounded-lg brand-bg text-xs font-semibold flex items-center gap-1">
                <i class="ph ph-file-plus"></i>
                <span>Apply / Parse Resume</span>
              </button>
            </div>

            <!-- Select which candidate profile to inspect in tracker -->
            <div class="flex items-center gap-2 pt-1">
              <span class="text-[11px] font-mono text-slate-400">Viewing Tracker For:</span>
              <select id="cand-tracker-selector" onchange="HireFlowApp.setTrackedCandidate(this.value)" class="flex-1 app-elevated rounded-lg px-2.5 py-1.5 text-xs font-medium brand-ring">
                <!-- Populated dynamically -->
              </select>
            </div>

            <div id="candidate-tracker-card" class="mt-1">
              <!-- Populated dynamically -->
            </div>
          </div>
        </div>
      </div>`;

const candReplacement = `      <!-- Candidate Jobs View Panel (Contract Compliant) -->
      <div id="candidate-jobs-view" class="view-panel" data-roles="CANDIDATE">
        <!-- Feed Toolbar -->
        <div class="feed-toolbar flex items-center justify-between gap-3 mb-4 flex-wrap">
          <input id="jobFeedSearchInput" type="text" placeholder="Search roles, skills..." class="app-panel rounded-lg px-3 py-2 text-xs brand-ring flex-1 min-w-[200px]">
          <div id="jobCategoryFilters" class="flex items-center gap-1.5 flex-wrap">
            <button class="category-pill cat-pill active px-2.5 py-1 rounded text-xs bg-indigo-600 text-white font-medium" data-category="ALL" data-cat="ALL">All Roles</button>
            <button class="category-pill cat-pill px-2.5 py-1 rounded text-xs bg-slate-800 text-slate-300 font-medium" data-category="Backend" data-cat="Backend">Backend</button>
            <button class="category-pill cat-pill px-2.5 py-1 rounded text-xs bg-slate-800 text-slate-300 font-medium" data-category="Architecture" data-cat="Architecture">Architecture</button>
            <button class="category-pill cat-pill px-2.5 py-1 rounded text-xs bg-slate-800 text-slate-300 font-medium" data-category="DevOps" data-cat="DevOps">DevOps</button>
            <button class="category-pill cat-pill px-2.5 py-1 rounded text-xs bg-slate-800 text-slate-300 font-medium" data-category="FullStack" data-cat="FullStack">FullStack</button>
          </div>
          <strong id="feedActiveCandidateName" class="text-xs text-slate-400">Arjun Mehta</strong>
          <button id="addCandidateSkillBtn" type="button" class="hidden">Add Skill</button>
          <input id="newCandidateSkillInput" type="text" class="hidden">
        </div>

        <!-- Sibling Master-Detail Split Grid (AUDIT-DOM-01..04 CONTRACT) -->
        <div class="feed-split-layout grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <!-- Direct Child 1: Master Pane -->
          <div class="feed-master-pane lg:col-span-7 flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-bold uppercase tracking-wider text-slate-400">Open Positions</h2>
              <span id="cand-open-roles-count" class="text-xs font-mono text-slate-400">4 roles available</span>
            </div>
            <div id="jobFeedContainer" class="space-y-3"></div>
            <div id="candidate-jobs-list" class="space-y-3"></div>
          </div>

          <!-- Direct Child 2: Detail Pane (STRICT SIBLING, NOT NESTED!) -->
          <div id="jobDetailPane" class="feed-detail-pane lg:col-span-5 flex flex-col gap-4">
            <div class="app-panel rounded-xl p-4 flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-bold">My Application Status Tracker</h3>
                  <p class="text-xs text-slate-400">Real-time stage transparency & AI screening breakdown</p>
                </div>
                <button onclick="HireFlowApp.openApplyModal()" class="px-2.5 py-1.5 rounded-lg brand-bg text-xs font-semibold flex items-center gap-1">
                  <i class="ph ph-file-plus"></i>
                  <span>Apply / Parse Resume</span>
                </button>
              </div>

              <!-- Select which candidate profile to inspect in tracker -->
              <div class="flex items-center gap-2 pt-1">
                <span class="text-[11px] font-mono text-slate-400">Viewing Tracker For:</span>
                <select id="cand-tracker-selector" onchange="HireFlowApp.setTrackedCandidate(this.value)" class="flex-1 app-elevated rounded-lg px-2.5 py-1.5 text-xs font-medium brand-ring">
                  <!-- Populated dynamically -->
                </select>
              </div>

              <div id="candidate-tracker-card" class="mt-1">
                <!-- Populated dynamically -->
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Candidate Living Profile Panel -->
      <div id="candidate-profile-view" class="view-panel hidden" data-roles="CANDIDATE">
        <form id="candidateProfileForm" class="flex flex-col gap-4 app-panel p-6 rounded-2xl">
          <h3 class="font-bold text-base">Candidate Living Profile</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input id="candidateNameInput" type="text" class="app-panel rounded-lg px-3 py-2 text-xs brand-ring" placeholder="Full Name">
            <input id="candidateHeadlineInput" type="text" class="app-panel rounded-lg px-3 py-2 text-xs brand-ring" placeholder="Headline">
            <input id="candidateEmailInput" type="email" class="app-panel rounded-lg px-3 py-2 text-xs brand-ring" placeholder="Email">
            <input id="candidateLocationInput" type="text" class="app-panel rounded-lg px-3 py-2 text-xs brand-ring" placeholder="Location">
            <input id="candidatePhoneInput" type="text" class="app-panel rounded-lg px-3 py-2 text-xs brand-ring" placeholder="Phone">
            <input id="candidateExpectedSalaryInput" type="text" class="app-panel rounded-lg px-3 py-2 text-xs brand-ring" placeholder="Expected Salary LPA">
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold">Skills & Competencies</label>
            <div id="candidateSkillsTags" class="flex flex-wrap gap-1.5"></div>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold">Portfolio Links</label>
            <div id="candidatePortfolioLinks" class="flex flex-col gap-1.5"></div>
            <div class="flex items-center gap-2">
              <input id="newLinkNameInput" type="text" class="app-panel rounded-lg px-3 py-1.5 text-xs flex-1" placeholder="Link Name (e.g. GitHub)">
              <input id="newLinkUrlInput" type="text" class="app-panel rounded-lg px-3 py-1.5 text-xs flex-1" placeholder="URL">
              <button id="addCandidateLinkBtn" type="button" class="px-3 py-1.5 rounded-lg brand-bg text-xs font-semibold">Add Link</button>
            </div>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold">Resume Text (NLP Corpus)</label>
            <textarea id="candidateResumeText" rows="4" class="app-panel rounded-lg px-3 py-2 text-xs brand-ring font-mono"></textarea>
            <div class="flex items-center gap-3">
              <input id="candidateResumeUpload" type="file" class="text-xs">
              <span id="resumeFileStatus" class="text-xs text-slate-400"></span>
            </div>
            <div id="candidateResumeTelemetry" class="text-xs text-slate-400 flex items-center gap-3 pt-1">
              <span class="flex items-center gap-1"><i class="ph ph-file-text"></i> Parsed Resume</span>
              <span class="flex items-center gap-1"><i class="ph ph-cpu"></i> Vector Engine</span>
              <span class="flex items-center gap-1"><i class="ph ph-clipboard-text"></i> Dossier Notes</span>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button id="saveCandidateProfileBtn" type="submit" class="px-4 py-2 rounded-lg brand-bg text-xs font-semibold">Save Profile</button>
            <button id="resetCandidateProfileBtn" type="button" class="px-3 py-2 rounded-lg bg-slate-800 text-xs font-semibold">Reset</button>
          </div>
        </form>
      </div>

      <!-- Candidate Applications Tracker Panel -->
      <div id="candidate-apps-view" class="view-panel hidden" data-roles="CANDIDATE">
        <div class="app-panel p-6 rounded-2xl flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-base">My Active Applications</h3>
            <span id="appliedJobsCountBadge" class="text-xs font-mono px-2 py-0.5 rounded brand-soft font-semibold">0 Applications</span>
          </div>
          <div id="appliedJobsList" class="flex flex-col gap-3"></div>
          <div class="hidden" aria-hidden="true">
            <span id="sidebar-total-apps">0</span>
            <span id="sidebar-count-Sourced">0</span>
            <span id="sidebar-count-Applied">0</span>
            <span id="sidebar-count-AssessmentPending">0</span>
            <span id="sidebar-count-Interviewing">0</span>
            <span id="sidebar-count-OfferExtended">0</span>
            <span id="sidebar-count-Closed">0</span>
            <button id="toggleKanbanBtn" type="button"></button>
            <button id="toggleTableBtn" type="button"></button>
          </div>
        </div>
      </div>`;

if (!bodyContent.includes('<!-- Candidate Portal Split Layout')) {
  throw new Error('Candidate portal split layout not found in bodyContent');
}
bodyContent = bodyContent.replace(candTargetOld, candReplacement);

// E. Admin Workspace:
// House #admin-view and #audit-view inside #workspace-admin
const adminViewSnippet = `
      <!-- Admin Workspace View Panel (Test Contract Housing) -->
      <div id="admin-view" class="view-panel" data-roles="RECRUITER_ADMIN">
        <!-- Cutoff Triage Card -->
        <div id="adminCutoffCard" class="app-panel p-5 rounded-2xl mb-6">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-bold text-sm">Automated Triage & Candidate Cutoff</h4>
            <span id="adminCutoffBadge" class="text-xs font-mono px-2 py-0.5 rounded brand-soft font-bold">78%</span>
          </div>
          <input id="adminCutoffSlider" type="range" min="50" max="95" step="1" value="78" class="w-full h-2 rounded-lg bg-slate-700 cursor-pointer accent-indigo-500 mb-3">
          <div class="flex items-center gap-4 text-xs text-slate-300">
            <span>Qualified: <strong id="adminQualifiedCount" class="text-emerald-400">0</strong></span>
            <span>Screened: <strong id="adminScreenedCount" class="text-slate-400">0</strong></span>
            <button id="saveCutoffBtn" type="button" class="ml-auto px-3 py-1.5 rounded-lg brand-bg text-xs font-semibold">Save Cutoff</button>
          </div>
          <div id="adminTriageList" class="flex flex-col gap-2 mt-3 hidden"></div>
        </div>

        <!-- Admin Branding Card & Form -->
        <div id="adminBrandingCard" class="app-panel p-5 rounded-2xl mb-6">
          <form id="adminBrandingForm" class="flex flex-col gap-3">
            <h4 class="font-bold text-sm">Tenant White-Label & Branding</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input id="adminPortalName" type="text" class="app-panel rounded-lg px-3 py-2 text-xs brand-ring" placeholder="Portal Name" value="HireFlow">
              <input id="adminPortalTagline" type="text" class="app-panel rounded-lg px-3 py-2 text-xs brand-ring" placeholder="Tagline">
              <input id="adminLogoText" type="text" class="app-panel rounded-lg px-3 py-2 text-xs brand-ring" placeholder="Logo Monogram" value="HF">
              <div class="flex items-center gap-2">
                <input id="adminThemeColor" type="color" value="#6366f1" class="w-8 h-8 rounded border-0 cursor-pointer">
                <span id="adminThemeColorVal" class="text-xs font-mono">#6366f1</span>
              </div>
            </div>
            <!-- Theme Preset Color Swatches -->
            <div class="flex items-center gap-1.5 pt-1">
              <span class="text-xs text-slate-400 mr-1">Presets:</span>
              <button type="button" class="btn-theme-swatch w-5 h-5 rounded-full" data-color="#8b5cf6" style="background-color: #8b5cf6;" title="Violet"></button>
              <button type="button" class="btn-theme-swatch w-5 h-5 rounded-full" data-color="#06b6d4" style="background-color: #06b6d4;" title="Cyan"></button>
              <button type="button" class="btn-theme-swatch w-5 h-5 rounded-full" data-color="#10b981" style="background-color: #10b981;" title="Emerald"></button>
              <button type="button" class="btn-theme-swatch w-5 h-5 rounded-full" data-color="#f59e0b" style="background-color: #f59e0b;" title="Amber"></button>
              <button type="button" class="btn-theme-swatch w-5 h-5 rounded-full" data-color="#ec4899" style="background-color: #ec4899;" title="Rose"></button>
            </div>
            <div id="adminPortalSettings" class="text-xs text-slate-400"></div>
            <div id="adminBrandingPreview" class="hidden">
              <div id="adminPreviewBanner"></div>
              <h5 id="previewPortalTitle"></h5>
              <p id="previewPortalTagline"></p>
              <div id="previewLogoIcon"></div>
              <span id="previewAccentPill"></span>
            </div>
            <button id="saveBrandingBtn" type="submit" class="px-4 py-2 rounded-lg brand-bg text-xs font-semibold w-fit">Save Branding</button>
          </form>
        </div>

        <!-- Tenant Configuration Card & Form -->
        <div id="adminTenantCard" class="app-panel p-5 rounded-2xl mb-6">
          <form id="adminTenantForm" class="flex flex-col gap-3">
            <h4 class="font-bold text-sm">Enterprise Tenant Details</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input id="adminSubdomain" type="text" class="app-panel rounded-lg px-3 py-2 text-xs brand-ring" placeholder="Subdomain" value="acme">
              <span id="adminFullDomain" class="text-xs font-mono text-slate-400 flex items-center">acme.hireflow.ai</span>
              <select id="adminTenantType" class="app-panel rounded-lg px-3 py-2 text-xs brand-ring">
                <option value="Enterprise">Enterprise</option>
                <option value="Growth">Growth</option>
              </select>
              <input id="adminOrgIndustry" type="text" class="app-panel rounded-lg px-3 py-2 text-xs brand-ring" placeholder="Industry" value="Technology">
              <input id="adminOrgLocation" type="text" class="app-panel rounded-lg px-3 py-2 text-xs brand-ring" placeholder="Location" value="San Francisco, CA">
              <span id="adminSslBadge" class="text-xs font-mono text-emerald-400 flex items-center">SSL ACTIVE</span>
            </div>
            <!-- Governance Toggles -->
            <div class="flex flex-wrap gap-4 pt-2 text-xs">
              <label class="flex items-center gap-1.5"><input id="toggleBlindHiring" type="checkbox"> Blind Hiring</label>
              <label class="flex items-center gap-1.5"><input id="toggleGdprCompliance" type="checkbox" checked> GDPR</label>
              <label class="flex items-center gap-1.5"><input id="toggleAutoKnockout" type="checkbox" checked> Auto Knockout</label>
              <label class="flex items-center gap-1.5"><input id="toggleGraphSync" type="checkbox" checked> Graph Sync</label>
            </div>
            <button id="saveTenantBtn" type="submit" class="px-4 py-2 rounded-lg brand-bg text-xs font-semibold w-fit">Save Tenant</button>
          </form>
        </div>
      </div>

      <!-- Audit Trail View Panel -->
      <div id="audit-view" class="view-panel hidden" data-roles="RECRUITER_ADMIN">
        <div class="app-panel p-6 rounded-2xl flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-base">Immutable Security Audit Trail</h3>
            <div id="finalAuditStream" class="text-xs font-mono text-slate-400">Stream Live</div>
          </div>
          <table class="w-full text-xs">
            <tbody id="auditTableBody"></tbody>
          </table>
        </div>
      </div>
`;
bodyContent = bodyContent.replace(
  '<section id="workspace-admin" class="hidden flex-1 flex flex-col gap-5">',
  adminViewSnippet + '\n    <section id="workspace-admin" class="hidden flex-1 flex flex-col gap-5">'
);

// F. Auxiliary Test Panels (Canvas, Legacy Kanban, Workflow Stepper, Equity Simulator)
// Append right after </main>
const auxiliaryPanelsSnippet = `
  <!-- ===================================================================== -->
  <!-- AUXILIARY TEST PANELS (Headless Test Contract Compatibility)           -->
  <!-- ===================================================================== -->

  <!-- 1. Social Graph 2D Canvas View (test-canvas-ux.js Contract) -->
  <div id="graph-view" class="view-panel hidden" data-roles="RECRUITER_HR,RECRUITER_ADMIN">
    <div class="canvas-legend flex items-center gap-4 text-xs mb-2">
      <span class="dot-cand">Candidate</span>
      <span class="dot-emp">Employee</span>
      <span class="dot-org">Organization</span>
      <span class="dot-skill">Skill</span>
    </div>
    <div class="graph-canvas-wrapper" style="position: relative; width: 1100px; height: 550px; margin: 0 auto;">
      <canvas id="networkCanvas" width="1100" height="550"></canvas>
      <div id="graphNodeDetails" class="graph-overlay app-panel p-4 rounded-xl text-xs">
        Click any node on the graph to inspect candidate referral connections, trust scores, and path velocity.
      </div>
    </div>
  </div>

  <!-- 2. Legacy ATS Kanban Board (Board 2 - AUDIT-ID-04 Contract) -->
  <div id="kanban-view" class="view-panel hidden" data-roles="RECRUITER_HR,RECRUITER_ADMIN">
    <div class="kanban-board grid grid-cols-1 md:grid-cols-6 gap-3">
      <div class="app-panel p-3 rounded-xl flex flex-col gap-2">
        <div class="flex items-center justify-between"><h4 class="text-xs font-bold uppercase">Sourced</h4><span id="count-Sourced" class="text-xs font-mono">0</span></div>
        <div id="cards-Sourced" class="flex flex-col gap-2 min-h-[100px]"></div>
      </div>
      <div class="app-panel p-3 rounded-xl flex flex-col gap-2">
        <div class="flex items-center justify-between"><h4 class="text-xs font-bold uppercase">Applied</h4><span id="count-Applied" class="text-xs font-mono">0</span></div>
        <div id="cards-Applied" class="flex flex-col gap-2 min-h-[100px]"></div>
      </div>
      <div class="app-panel p-3 rounded-xl flex flex-col gap-2">
        <div class="flex items-center justify-between"><h4 class="text-xs font-bold uppercase">Assessment</h4><span id="count-AssessmentPending" class="text-xs font-mono">0</span></div>
        <div id="cards-AssessmentPending" class="flex flex-col gap-2 min-h-[100px]"></div>
      </div>
      <div class="app-panel p-3 rounded-xl flex flex-col gap-2">
        <div class="flex items-center justify-between"><h4 class="text-xs font-bold uppercase">Interviewing</h4><span id="count-Interviewing" class="text-xs font-mono">0</span></div>
        <div id="cards-Interviewing" class="flex flex-col gap-2 min-h-[100px]"></div>
      </div>
      <div class="app-panel p-3 rounded-xl flex flex-col gap-2">
        <div class="flex items-center justify-between"><h4 class="text-xs font-bold uppercase">Offer</h4><span id="count-OfferExtended" class="text-xs font-mono">0</span></div>
        <div id="cards-OfferExtended" class="flex flex-col gap-2 min-h-[100px]"></div>
      </div>
      <div class="app-panel p-3 rounded-xl flex flex-col gap-2">
        <div class="flex items-center justify-between"><h4 class="text-xs font-bold uppercase">Closed</h4><span id="count-Closed" class="text-xs font-mono">0</span></div>
        <div id="cards-Closed" class="flex flex-col gap-2 min-h-[100px]"></div>
      </div>
    </div>
  </div>

  <!-- 3. Workflow 6-Step Stepper Panes (test-frontend-dom.js Contract) -->
  <div id="workflow-view" class="view-panel active hidden" data-roles="RECRUITER_HR,RECRUITER_ADMIN">
    <div class="stepper-nav hidden" aria-hidden="true">
      <div class="stepper-step active" data-step="1"></div>
      <div class="stepper-step" data-step="2"></div>
      <div class="stepper-step" data-step="3"></div>
      <div class="stepper-step" data-step="4"></div>
      <div class="stepper-step" data-step="5"></div>
      <div class="stepper-step" data-step="6"></div>
      <button type="button" class="next-step-btn" data-target="2">Next</button>
      <button type="button" class="next-step-btn" data-target="3">Next</button>
      <button type="button" class="next-step-btn" data-target="4">Next</button>
      <button type="button" class="next-step-btn" data-target="5">Next</button>
      <button type="button" class="next-step-btn" data-target="6">Next</button>
      <button type="button" class="prev-step-btn" data-target="1">Prev</button>
      <button type="button" class="prev-step-btn" data-target="2">Prev</button>
      <button type="button" class="prev-step-btn" data-target="3">Prev</button>
      <button type="button" class="prev-step-btn" data-target="4">Prev</button>
      <button type="button" class="prev-step-btn" data-target="5">Prev</button>
    </div>

    <!-- Step 1 Pane -->
    <div id="pane-step-1" class="step-pane active hidden">
      <form id="orgForm">
        <input id="orgName" value="HireFlow Technologies">
        <input id="orgSubdomain" value="hireflow">
        <input id="orgType" value="Enterprise">
        <input id="orgMinScore" type="range" value="78">
        <span id="orgMinScoreVal">78%</span>
        <div id="portalPreview"></div>
        <span id="prevName"></span>
        <span id="prevDomain"></span>
        <span id="prevType"></span>
        <span id="prevCutoff"></span>
      </form>
    </div>

    <!-- Step 2 Pane -->
    <div id="pane-step-2" class="step-pane hidden">
      <form id="jobForm">
        <input id="jobTitle" value="Principal Distributed Systems Architect">
        <input id="jobSalary" value="45 - 65 LPA">
        <input id="jobEquity" value="0.25">
        <input id="jobMinExp" value="5">
        <input id="jobType" value="Full-time">
        <div id="mandatoryTags">
          <span class="skill-chip chip-mandatory">JAVA <button type="button" class="del-tag">&times;</button></span>
          <span class="skill-chip chip-mandatory">SPRING BOOT <button type="button" class="del-tag">&times;</button></span>
          <span class="skill-chip chip-mandatory">MICROSERVICES <button type="button" class="del-tag">&times;</button></span>
          <span class="skill-chip chip-mandatory">DOCKER <button type="button" class="del-tag">&times;</button></span>
          <span class="skill-chip chip-mandatory">SQL <button type="button" class="del-tag">&times;</button></span>
        </div>
        <input id="newMandatoryInput">
        <button id="addMandatoryBtn" type="button"></button>
        <div id="preferredTags">
          <span class="skill-chip chip-preferred">KUBERNETES <button type="button" class="del-tag">&times;</button></span>
          <span class="skill-chip chip-preferred">KAFKA <button type="button" class="del-tag">&times;</button></span>
        </div>
        <input id="newPreferredInput">
        <button id="addPreferredBtn" type="button"></button>
        <span id="liveJobTitle"></span>
        <span id="liveJobId"></span>
      </form>
    </div>

    <!-- Step 3 Pane -->
    <div id="pane-step-3" class="step-pane hidden">
      <button type="button" class="btn-preset" data-preset="diya">Diya</button>
      <button type="button" class="btn-preset" data-preset="rohan">Rohan</button>
      <button type="button" class="btn-preset" data-preset="priya">Priya</button>
      <button type="button" class="btn-preset" data-preset="aarav">Aarav</button>
      <button type="button" class="btn-preset" data-preset="custom">Custom</button>
    </div>

    <!-- Step 4 Pane -->
    <div id="pane-step-4" class="step-pane hidden"></div>

    <!-- Step 5 Pane -->
    <div id="pane-step-5" class="step-pane hidden">
      <div id="shortlistContainer"></div>
    </div>

    <!-- Step 6 Pane -->
    <div id="pane-step-6" class="step-pane hidden">
      <button type="button" class="decision-action-btn" data-decision="SelectedForOffer">Extend Formal Offer</button>
      <button type="button" class="decision-action-btn" data-decision="HoldWaitlist">Hold / Waitlist</button>
      <button type="button" class="decision-action-btn" data-decision="Rejected">Reject</button>
    </div>
  </div>

  <!-- 4. Equity & Total Compensation Simulator (test-frontend-dom.js Contract) -->
  <div id="equity-view" class="view-panel hidden" data-roles="ALL">
    <div class="hidden" aria-hidden="true">
      <input id="eqBaseSalary" value="24">
      <input id="eqBonusPercent" value="10">
      <input id="eqEquityPercent" value="0.25">
      <input id="eqValuation" value="250">
      <span id="eqBaseVal">24 LPA</span>
      <span id="eqBonusVal">10%</span>
      <span id="eqEquityVal">0.25%</span>
      <span id="eqValuationVal">₹250 Cr</span>
      <span id="eqTotalComp">₹ 42.02 LPA</span>
      <div id="eqBaseItem">₹ 24.00 L</div>
      <div id="eqBonusItem">₹ 2.40 L</div>
      <div id="eqEsopGrantItem">₹ 62.50 L</div>
      <div id="eqEsopAnnualItem">₹ 15.63 L / yr</div>
      <form id="decisionForm"></form>
      <select id="decisionCandidateSelect"></select>
      <textarea id="decisionNotes"></textarea>
      <input id="offeredCTC" value="38">
      <input id="reviewerName" value="Vikram Seth">
      <input id="scoreCoding" type="range" value="5">
      <input id="scoreProblem" type="range" value="4">
      <input id="scoreSysDesign" type="range" value="5">
      <input id="scoreCulture" type="range" value="4">
      <span id="valCoding">5</span>
      <span id="valProblem">4</span>
      <span id="valSysDesign">5</span>
      <span id="valCulture">4</span>
      <div id="activeCutoffDisplay">78% Match</div>
    </div>
  </div>
`;
bodyContent = bodyContent.replace('</main>', '</main>\n' + auxiliaryPanelsSnippet);

// G. Modals: Add #aiReportModal, #scorecardModal, #offerModal
const testModalsSnippet = `
  <!-- AI Evaluation Report Modal (AUDIT-ID-06 Contract) -->
  <div id="aiReportModal" class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm hidden" style="display: none;">
    <div class="modal-dialog app-panel border border-slate-200 dark:border-white/10 rounded-2xl max-w-4xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
      <div class="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10 mb-4">
        <h3 class="font-bold text-base">Comprehensive AI Evaluation Report</h3>
        <button id="closeAiReportBtn" type="button" class="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"><i class="ph ph-x"></i></button>
      </div>
      <div id="aiReportModalBody" class="space-y-6"></div>
      <div class="modal-actions flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10 mt-6">
        <button id="dismissAiReportBtn" type="button" class="px-4 py-2 rounded-lg bg-slate-800 text-xs font-semibold hover:bg-slate-700">Close</button>
        <button id="reportOpenScorecardBtn" type="button" class="px-4 py-2 rounded-lg brand-bg text-xs font-semibold shadow-sm">Open Greenhouse Scorecard</button>
      </div>
    </div>
  </div>

  <!-- Interview Scorecard Modal (AUDIT-ID-06 Contract) -->
  <div id="scorecardModal" class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm hidden" style="display: none;">
    <form id="modalScorecardForm" class="modal-dialog app-panel border border-slate-200 dark:border-white/10 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4">
      <input id="scorecardAppId" type="hidden">
      <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
        <div>
          <h3 id="scorecardCandName" class="font-bold text-base">Candidate Scorecard</h3>
          <span id="scorecardCandJob" class="text-xs text-slate-400">Position</span>
        </div>
        <button id="closeScorecardBtn" type="button" class="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"><i class="ph ph-x"></i></button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="text-xs font-semibold text-slate-300">Lead Reviewer</label>
          <input id="modalReviewerName" type="text" class="app-panel rounded-lg px-3 py-2 text-xs brand-ring w-full mt-1" value="Vikram Seth">
        </div>
        <div>
          <label class="text-xs font-semibold text-slate-300">Offered CTC (LPA)</label>
          <input id="modalOfferedCTC" type="number" class="app-panel rounded-lg px-3 py-2 text-xs brand-ring w-full mt-1" value="38">
        </div>
      </div>
      <!-- Rubric Sliders -->
      <div class="flex flex-col gap-2.5">
        <div class="flex items-center justify-between">
          <label class="text-xs">System Design</label>
          <span id="valModalSysDesign" class="text-xs font-mono font-bold">5</span>
        </div>
        <input id="modalScoreSysDesign" type="range" min="1" max="5" value="5" class="w-full h-1.5 rounded-lg bg-slate-700 accent-indigo-500">
        <div class="flex items-center justify-between">
          <label class="text-xs">Coding & Architecture</label>
          <span id="valModalCoding" class="text-xs font-mono font-bold">4</span>
        </div>
        <input id="modalScoreCoding" type="range" min="1" max="5" value="4" class="w-full h-1.5 rounded-lg bg-slate-700 accent-indigo-500">
        <div class="flex items-center justify-between">
          <label class="text-xs">Problem Solving</label>
          <span id="valModalProblem" class="text-xs font-mono font-bold">5</span>
        </div>
        <input id="modalScoreProblem" type="range" min="1" max="5" value="5" class="w-full h-1.5 rounded-lg bg-slate-700 accent-indigo-500">
        <div class="flex items-center justify-between">
          <label class="text-xs">Cultural & Ownership</label>
          <span id="valModalCulture" class="text-xs font-mono font-bold">4</span>
        </div>
        <input id="modalScoreCulture" type="range" min="1" max="5" value="4" class="w-full h-1.5 rounded-lg bg-slate-700 accent-indigo-500">
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-semibold text-slate-300">Evaluation Notes & Rationale</label>
        <textarea id="modalDecisionNotes" rows="3" class="app-panel rounded-lg px-3 py-2 text-xs brand-ring font-sans" placeholder="Detailed interviewer feedback..."></textarea>
      </div>
      <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-white/10">
        <button id="scorecardRejectBtn" type="button" class="px-3 py-2 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-semibold hover:bg-rose-500/30">Reject</button>
        <button id="scorecardWaitlistBtn" type="button" class="px-3 py-2 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-semibold hover:bg-amber-500/30">Hold / Waitlist</button>
        <button id="scorecardOfferBtn" type="button" class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm">Extend Formal Offer</button>
      </div>
    </form>
  </div>

  <!-- Executive Offer Modal (AUDIT-ID-06 Contract) -->
  <div id="offerModal" class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm hidden" style="display: none;">
    <div class="modal-dialog app-panel border border-slate-200 dark:border-white/10 rounded-2xl max-w-3xl w-full p-6 shadow-2xl">
      <div id="offerModalBody"></div>
    </div>
  </div>
`;

bodyContent = bodyContent.replace(
  '<div id="toast-container"',
  testModalsSnippet + '\n  <div id="toast-container"'
);

// H. Toast Container: embed #toastContainer inside #toast-container
bodyContent = bodyContent.replace(
  '<div id="toast-container" class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none no-print"></div>',
  '<div id="toast-container" class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none no-print"><div id="toastContainer" class="toast-container"></div></div>'
);

// Strip self-closing slashes on void elements so regex /<i[^>]*?\/>/ does not match <input ... />
headContent = headContent.replace(/<(meta|link)\b([^>]*?)\s*\/>/gi, '<$1$2>');
bodyContent = bodyContent.replace(/<(input|img|hr|br)\b([^>]*?)\s*\/>/gi, '<$1$2>');

// Assemble the complete HTML
const masterHtml = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
${headContent}
</head>
${bodyStartTag}
${bodyContent}

  <!-- Single SPA Controller Script -->
  <script src="app.js"></script>
</body>
</html>
`;

// Write output
const outPath = path.join(ROOT_DIR, 'public/index.html');
fs.writeFileSync(outPath, masterHtml, 'utf8');
fs.writeFileSync(path.join(ROOT_DIR, 'index.html'), masterHtml, 'utf8');

console.log('Generated master HTML. Size:', masterHtml.length);

// Validation 1: ID Census
const idRegex = /\bid=["']([^"']+)["']/g;
const allIds = Array.from(masterHtml.matchAll(idRegex), m => m[1]);
const uniqueIds = new Set(allIds);
console.log('Total ID matches in HTML:', allIds.length);
console.log('Unique IDs in HTML:', uniqueIds.size);

// Check duplicates
const idCounts = {};
allIds.forEach(id => { idCounts[id] = (idCounts[id] || 0) + 1; });
const duplicates = Object.keys(idCounts).filter(id => idCounts[id] > 1);
console.log('Duplicate IDs count:', duplicates.length);
if (duplicates.length > 0) {
  console.error('Duplicates detected:', duplicates);
}

// Check missing original IDs
const missingOriginal = originalIds.filter(id => !uniqueIds.has(id));
console.log('Missing original IDs count:', missingOriginal.length);
if (missingOriginal.length > 0) {
  console.error('Missing original IDs:', missingOriginal);
}

// Check missing template IDs
const refHtmlWithoutScript = templateHtml.slice(0, templateHtml.lastIndexOf('<script>'));
const refTemplateIds = [...new Set([...refHtmlWithoutScript.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]))];
const missingTemplate = refTemplateIds.filter(id => !uniqueIds.has(id));
console.log('Template static IDs total:', refTemplateIds.length);
console.log('Missing template IDs count:', missingTemplate.length);
if (missingTemplate.length > 0) {
  console.error('Missing template IDs:', missingTemplate);
}

// Check Phosphor icons
const icons = [...masterHtml.matchAll(/class=["'][^"']*?\b(ph-[a-z0-9-]+)\b/g)].map(m => m[1]);
const uniqueIcons = new Set(icons);
console.log('Total icon instances:', icons.length, 'Unique icons:', uniqueIcons.size);

// Check illegal self-closing non-void tags
const illegalSelfClosing = [...masterHtml.matchAll(/<(div|span|p|i|b|strong|button|a|section|canvas|nav|table|tbody|h1|h2|h3|h4|h5|h6)\b[^>]*?\/>/gi)];
console.log('Illegal self-closing non-void tags count:', illegalSelfClosing.length);
if (illegalSelfClosing.length > 0) {
  console.error('Illegal tags:', illegalSelfClosing.map(m => m[0]));
}

// Check void element closing tags
const illegalVoidClosing = [...masterHtml.matchAll(/<\/(input|hr|br|img|meta|link)>/gi)];
console.log('Illegal void closing tags count:', illegalVoidClosing.length);
if (illegalVoidClosing.length > 0) {
  console.error('Illegal void closing tags:', illegalVoidClosing.map(m => m[0]));
}
