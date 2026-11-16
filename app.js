/**
 * HIREFLOW + OMNITALENT: CLIENT APPLICATION CONTROLLER
 * Full 6-Stage Intelligent Hiring Workflow & Social Network Graph Fusion
 */

(function () {
  'use strict';

  // ===========================================================================
  // LOCAL CLIENT STATE (SYNCS WITH REST API WHEN AVAILABLE)
  // ===========================================================================

  const state = {
    // Current user authentication & role
    currentUser: null,

    // Authoritative Demo Personas for 1-Click Gateway
    demoPersonas: {
      aarav: {
        id: 'cand-aarav',
        name: 'Aarav Sharma',
        email: 'aarav.s@email.com',
        role: 'CANDIDATE',
        headline: 'Backend Engineer | Distributed Systems & Event Streaming',
        avatar: 'AS',
        skills: ['JAVA', 'SPRING BOOT', 'MICROSERVICES', 'DOCKER', 'SQL', 'KUBERNETES', 'KAFKA'],
        experienceYears: 2,
        resume: 'Experienced Engineer with 2 years building scalable backends using Java, Spring Boot, Microservices, Docker, SQL, Kubernetes, and Kafka event streams.',
        referral: 'Aarav Sharma -> Rajesh (Staff Eng) -> Vikram (VP Eng) -> Apex Cloud',
        targetScore: 96
      },
      diya: {
        id: 'cand-diya',
        name: 'Diya Nair',
        email: 'diya.n@email.com',
        role: 'CANDIDATE',
        headline: 'Software Developer | Cloud-Native Java & Microservices',
        avatar: 'DN',
        skills: ['JAVA', 'SPRING BOOT', 'MICROSERVICES', 'DOCKER', 'SQL', 'KUBERNETES'],
        experienceYears: 3,
        resume: 'Software Developer with 3 years of hands-on experience in Java, Spring Boot, Microservices, Docker, SQL databases, and Kubernetes cluster orchestration.',
        referral: 'Diya Nair -> NexaTech University Alumni Network',
        targetScore: 88
      },
      vikram: {
        id: 'rec-vikram',
        name: 'Vikram Seth',
        email: 'vikram.seth@apexcloud.ai',
        role: 'RECRUITER_HR',
        headline: 'VP Engineering & Technical Hiring Lead',
        avatar: 'VS',
        department: 'Engineering Leadership',
        seniorityWeight: 4.5
      },
      admin: {
        id: 'adm-apex',
        name: 'Org Admin',
        email: 'admin@apexcloud.ai',
        role: 'RECRUITER_ADMIN',
        headline: 'Apex Cloud Systems Chief Administrator',
        avatar: 'OA',
        permissions: ['ALL_PERMISSIONS', 'MANAGE_TENANT', 'DEPLOY_PORTAL', 'CONFIGURE_CUTOFFS']
      }
    },

    currentTab: 'workflow-view',
    currentStep: 1,
    activeOrgId: 'ORG-APEX88',
    activeJobId: 'JOB-8F9A2C',
    activeCandidateAppId: 'APP-1B4D7E',

    organization: {
      orgId: 'ORG-APEX88',
      name: 'Apex Cloud Systems',
      tagline: 'ATS + Social Network Fusion Platform',
      logoText: 'AC',
      themeColor: '#8b5cf6',
      type: 'COMPANY',
      subdomain: 'apexcloud',
      customSubdomain: 'apexcloud.hireflow.ai',
      location: 'Bangalore, India (Global Remote)',
      industry: 'Cloud Infrastructure & Distributed Systems',
      minimumShortlistScore: 75,
      policies: {
        gdpr: true,
        blindHiring: false,
        autoKnockout: true,
        graphSync: true
      }
    },

    // Living Candidate Profile (M2 / R2)
    candidateProfile: {
      name: 'Aarav Sharma',
      email: 'aarav.s@email.com',
      phone: '+91 98765 43210',
      location: 'Bangalore, India',
      headline: 'Backend Engineer | Distributed Systems & Event Streaming',
      skills: ['JAVA', 'SPRING BOOT', 'MICROSERVICES', 'DOCKER', 'SQL', 'KUBERNETES', 'KAFKA'],
      portfolioLinks: [
        { name: 'GitHub', url: 'https://github.com/aaravsharma/raft' },
        { name: 'Portfolio', url: 'https://aarav.dev' }
      ],
      rawResumeText: 'Experienced Engineer with 2 years building scalable backends using Java, Spring Boot, Microservices, Docker, SQL, Kubernetes, and Kafka event streams. Reduced p99 latency by 35% using Redis caching and reactive Spring WebFlux.',
      resumeFileName: 'Aarav_Sharma_Resume.pdf',
      expectedSalaryLPA: 24,
      experienceYears: 2
    },

    // Multi-Job Catalog for Job Feed (M2) & Studio (M3)
    jobs: [
      {
        jobId: 'JOB-8F9A2C',
        orgId: 'ORG-APEX88',
        title: 'Senior Backend Engineer (Java / Distributed Systems)',
        category: 'Backend',
        department: 'Engineering',
        location: 'Bangalore (Hybrid)',
        employmentType: 'FULL_TIME',
        minSalaryLPA: 22,
        maxSalaryLPA: 30,
        equityOfferedPercent: 0.25,
        mandatorySkills: ['JAVA', 'SPRING BOOT', 'MICROSERVICES', 'DOCKER', 'SQL'],
        preferredSkills: ['KUBERNETES', 'KAFKA'],
        requiredExperienceYears: 2,
        description: 'Lead backend microservices architecture, optimize low-latency event processing with Apache Kafka, and scale high-throughput cloud infrastructure.'
      },
      {
        jobId: 'JOB-3D7E1A',
        orgId: 'ORG-APEX88',
        title: 'Staff Distributed Systems Architect',
        category: 'Architecture',
        department: 'Core Architecture',
        location: 'Remote / Bangalore',
        employmentType: 'FULL_TIME',
        minSalaryLPA: 45,
        maxSalaryLPA: 65,
        equityOfferedPercent: 0.75,
        mandatorySkills: ['JAVA', 'DISTRIBUTED SYSTEMS', 'KAFKA', 'KUBERNETES', 'MICROSERVICES'],
        preferredSkills: ['REDIS', 'POSTGRESQL', 'AWS'],
        requiredExperienceYears: 6,
        description: 'Architect mission-critical distributed consensus platforms, lead consensus protocols and cross-region replication at scale.'
      },
      {
        jobId: 'JOB-5C2F8B',
        orgId: 'ORG-APEX88',
        title: 'Cloud DevOps & Platform Engineer',
        category: 'DevOps',
        department: 'Infrastructure',
        location: 'Bangalore',
        employmentType: 'FULL_TIME',
        minSalaryLPA: 18,
        maxSalaryLPA: 28,
        equityOfferedPercent: 0.20,
        mandatorySkills: ['DOCKER', 'KUBERNETES', 'AWS', 'GIT'],
        preferredSkills: ['PYTHON', 'REDIS'],
        requiredExperienceYears: 3,
        description: 'Manage multi-cluster Kubernetes deployments, infrastructure as code, CI/CD pipelines, and cloud observability.'
      },
      {
        jobId: 'JOB-9A1D4E',
        orgId: 'ORG-APEX88',
        title: 'Full Stack Engineer (React / TypeScript / Node)',
        category: 'FullStack',
        department: 'Product Engineering',
        location: 'Bangalore (Hybrid)',
        employmentType: 'FULL_TIME',
        minSalaryLPA: 20,
        maxSalaryLPA: 32,
        equityOfferedPercent: 0.30,
        mandatorySkills: ['REACT', 'TYPESCRIPT', 'REST API', 'SQL'],
        preferredSkills: ['DOCKER', 'GRAPHQL', 'PYTHON'],
        requiredExperienceYears: 3,
        description: 'Build responsive glassmorphic frontend applications and high-performance API services.'
      }
    ],

    // Active Job Blueprint (backward compatible reference to jobs[0])
    job: {
      jobId: 'JOB-8F9A2C',
      orgId: 'ORG-APEX88',
      title: 'Senior Backend Engineer (Java / Distributed Systems)',
      category: 'Backend',
      department: 'Engineering',
      location: 'Bangalore (Hybrid)',
      employmentType: 'FULL_TIME',
      minSalaryLPA: 22,
      maxSalaryLPA: 30,
      equityOfferedPercent: 0.25,
      mandatorySkills: ['JAVA', 'SPRING BOOT', 'MICROSERVICES', 'DOCKER', 'SQL'],
      preferredSkills: ['KUBERNETES', 'KAFKA'],
      requiredExperienceYears: 2
    },

    applications: [
      {
        applicationId: 'APP-1B4D7E',
        candidateName: 'Aarav Sharma',
        email: 'aarav.s@email.com',
        headline: 'Backend Engineer | Distributed Systems & Event Streaming',
        jobId: 'JOB-8F9A2C',
        kanbanStage: 'OfferExtended',
        rawResumeText: 'Experienced Engineer with 2 years building scalable backends using Java, Spring Boot, Microservices, Docker, SQL, Kubernetes, and Kafka event streams. Reduced p99 latency by 35% using Redis caching and reactive Spring WebFlux.',
        referralChain: 'Aarav Sharma -> Rajesh (Staff Eng) -> Vikram (VP Eng) -> Apex Cloud',
        graphTrustScore: 0.94,
        intentScore: 0.92,
        expectedBaseSalaryLPA: 24,
        appliedAt: new Date(Date.now() - 3600000 * 36).toISOString()
      },
      {
        applicationId: 'APP-3C9E1A',
        candidateName: 'Diya Nair',
        email: 'diya.n@email.com',
        headline: 'Software Developer | Cloud-Native Java & Microservices',
        jobId: 'JOB-8F9A2C',
        kanbanStage: 'Interviewing',
        rawResumeText: 'Software Developer with 3 years of hands-on experience in Java, Spring Boot, Microservices, Docker, SQL databases, and Kubernetes cluster orchestration. Built multi-tenant REST APIs and automated CI/CD pipelines.',
        referralChain: 'Diya Nair -> NexaTech University Alumni Network',
        graphTrustScore: 0.78,
        intentScore: 0.85,
        expectedBaseSalaryLPA: 20,
        appliedAt: new Date(Date.now() - 3600000 * 30).toISOString()
      },
      {
        applicationId: 'APP-7F2B4D',
        candidateName: 'Rohan Verma',
        email: 'rohan.v@email.com',
        headline: 'Junior Developer | Scripting & Python/SQL Enthusiast',
        jobId: 'JOB-8F9A2C',
        kanbanStage: 'Closed',
        rawResumeText: 'Junior developer with 1 year experience working on Java, SQL, and Python scripts. Excited about backend development and learning modern microservices architectures.',
        referralChain: 'Direct Organic Application',
        graphTrustScore: 0.40,
        intentScore: 0.95,
        expectedBaseSalaryLPA: 12,
        appliedAt: new Date(Date.now() - 3600000 * 20).toISOString()
      },
      {
        applicationId: 'APP-9X4K2L',
        candidateName: 'Priya Soni',
        email: 'priya.soni@tech.io',
        headline: 'Senior Platform Engineer | AWS & Event Architectures',
        jobId: 'JOB-8F9A2C',
        kanbanStage: 'AssessmentPending',
        rawResumeText: 'Platform engineer with 4 years designing distributed backends using Java, Spring Boot, Microservices, SQL, Docker, Kafka, AWS, and PostgreSQL. Authored Kafka event processing framework handling 50k msgs/sec.',
        referralChain: 'Priya Soni -> Neha (Director HR) -> Apex Cloud',
        graphTrustScore: 0.89,
        intentScore: 0.88,
        expectedBaseSalaryLPA: 26,
        appliedAt: new Date(Date.now() - 3600000 * 12).toISOString()
      }
    ],

    decisions: [
      {
        applicationId: 'APP-1B4D7E',
        candidateName: 'Aarav Sharma',
        decisionType: 'SelectedForOffer',
        reviewer: 'Vikram (VP Eng)',
        interviewNotes: 'Strong system design & Kafka depth. Exceptional culture fit.',
        offeredCTC: 24.0,
        equityOfferedPercent: 0.25,
        decidedAt: new Date(Date.now() - 3600000 * 6).toISOString()
      },
      {
        applicationId: 'APP-3C9E1A',
        candidateName: 'Diya Nair',
        decisionType: 'HoldWaitlist',
        reviewer: 'Vikram (VP Eng)',
        interviewNotes: 'Strong profile; slight gap in Kafka event streaming. Retained on priority waitlist.',
        offeredCTC: null,
        equityOfferedPercent: null,
        decidedAt: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        applicationId: 'APP-7F2B4D',
        candidateName: 'Rohan Verma',
        decisionType: 'Rejected',
        reviewer: 'AI Auto-Triage + HR',
        interviewNotes: 'Missing core Spring Boot, Microservices, and Docker skills.',
        offeredCTC: null,
        equityOfferedPercent: null,
        decidedAt: new Date(Date.now() - 3600000 * 4).toISOString()
      }
    ],

    presets: {
      aarav: {
        name: 'Aarav Sharma',
        email: 'aarav.s@email.com',
        headline: 'Backend Engineer | Distributed Systems & Event Streaming',
        resume: 'Experienced Engineer with 2 years building scalable backends using Java, Spring Boot, Microservices, Docker, SQL, Kubernetes, and Kafka event streams. Reduced p99 latency by 35% using Redis caching and reactive Spring WebFlux.',
        referral: 'Aarav Sharma -> Rajesh (Staff Eng) -> Vikram (VP Eng) -> Apex Cloud',
        avatar: 'AS',
        graphTrust: '94%',
        intent: '92%'
      },
      diya: {
        name: 'Diya Nair',
        email: 'diya.n@email.com',
        headline: 'Software Developer | Cloud-Native Java & Microservices',
        resume: 'Software Developer with 3 years of hands-on experience in Java, Spring Boot, Microservices, Docker, SQL databases, and Kubernetes cluster orchestration. Built multi-tenant REST APIs and automated CI/CD pipelines.',
        referral: 'Diya Nair -> NexaTech University Alumni Network',
        avatar: 'DN',
        graphTrust: '78%',
        intent: '85%'
      },
      rohan: {
        name: 'Rohan Verma',
        email: 'rohan.v@email.com',
        headline: 'Junior Developer | Scripting & Python/SQL Enthusiast',
        resume: 'Junior developer with 1 year experience working on Java, SQL, and Python scripts. Excited about backend development and learning modern microservices architectures.',
        referral: 'Direct Organic Application',
        avatar: 'RV',
        graphTrust: '40%',
        intent: '95%'
      },
      priya: {
        name: 'Priya Soni',
        email: 'priya.soni@tech.io',
        headline: 'Senior Platform Engineer | AWS & Event Architectures',
        resume: 'Platform engineer with 4 years designing distributed backends using Java, Spring Boot, Microservices, SQL, Docker, Kafka, AWS, and PostgreSQL. Authored Kafka event processing framework handling 50k msgs/sec.',
        referral: 'Priya Soni -> Neha (Director HR) -> Apex Cloud',
        avatar: 'PS',
        graphTrust: '89%',
        intent: '88%'
      },
      custom: {
        name: 'Your Name',
        email: 'you@domain.com',
        headline: 'Full Stack / Backend Engineer',
        resume: 'Enter your custom resume text with technologies like Java, Python, Docker, Kubernetes, SQL, Kafka, Spring Boot, and years of experience (e.g., 3 years).',
        referral: 'Direct Organic Application',
        avatar: 'YN',
        graphTrust: '75%',
        intent: '90%'
      }
    }
  };

  // Maintain backward-compatible reference to active job
  state.job = state.jobs[0];

  // Known Skills Taxonomy for Client Parser
  const KNOWN_SKILL_TAXONOMY = [
    'JAVA', 'SPRING BOOT', 'MICROSERVICES', 'DOCKER', 'SQL',
    'KUBERNETES', 'KAFKA', 'AWS', 'PYTHON', 'REACT', 'GIT', 'REST API',
    'POSTGRESQL', 'REDIS', 'GRAPHQL', 'TYPESCRIPT', 'DISTRIBUTED SYSTEMS'
  ];

  // ===========================================================================
  // DUAL LIGHT / DARK THEME ENGINE (M1)
  // ===========================================================================

  const THEME_STORAGE_KEY = 'hireflow_theme';

  function initTheme() {
    let saved = null;
    try {
      if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.getItem === 'function') {
        saved = localStorage.getItem(THEME_STORAGE_KEY);
      }
    } catch (e) {}

    if (!saved) {
      try {
        if (typeof sessionStorage !== 'undefined' && sessionStorage && typeof sessionStorage.getItem === 'function') {
          saved = sessionStorage.getItem(THEME_STORAGE_KEY);
        }
      } catch (e) {}
    }

    if (!saved && typeof window !== 'undefined' && window.matchMedia && typeof window.matchMedia === 'function') {
      try {
        if (window.matchMedia('(prefers-color-scheme: light)').matches) {
          saved = 'light';
        }
      } catch (e) {}
    }

    applyTheme(saved === 'light' ? 'light' : 'dark');
  }

  function applyTheme(theme) {
    const activeTheme = theme === 'light' ? 'light' : 'dark';

    if (typeof document !== 'undefined') {
      if (document.documentElement) {
        if (typeof document.documentElement.setAttribute === 'function') {
          document.documentElement.setAttribute('data-theme', activeTheme);
        } else {
          document.documentElement['data-theme'] = activeTheme;
        }
        if (document.documentElement.classList) {
          if (activeTheme === 'dark') {
            if (typeof document.documentElement.classList.add === 'function') {
              document.documentElement.classList.add('dark');
            }
          } else {
            if (typeof document.documentElement.classList.remove === 'function') {
              document.documentElement.classList.remove('dark');
            }
          }
        }
      }
      if (document.body) {
        if (typeof document.body.setAttribute === 'function') {
          document.body.setAttribute('data-theme', activeTheme);
        } else {
          document.body['data-theme'] = activeTheme;
        }
        if (document.body.classList) {
          if (activeTheme === 'dark') {
            if (typeof document.body.classList.add === 'function') {
              document.body.classList.add('dark');
            }
          } else {
            if (typeof document.body.classList.remove === 'function') {
              document.body.classList.remove('dark');
            }
          }
        }
      }
    }

    try {
      if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.setItem === 'function') {
        localStorage.setItem(THEME_STORAGE_KEY, activeTheme);
      }
    } catch (e) {}

    try {
      if (typeof sessionStorage !== 'undefined' && sessionStorage && typeof sessionStorage.setItem === 'function') {
        sessionStorage.setItem(THEME_STORAGE_KEY, activeTheme);
      }
    } catch (e) {}

    if (typeof document !== 'undefined' && typeof document.getElementById === 'function') {
      const toggleIcon = document.getElementById('themeToggleIcon');
      const toggleLabel = document.getElementById('themeToggleLabel');
      const toggleBtn = document.getElementById('themeToggleBtn');

      if (toggleIcon) {
        toggleIcon.textContent = activeTheme === 'light' ? '☀️' : '🌙';
      }
      if (toggleLabel) {
        toggleLabel.textContent = activeTheme === 'light' ? 'Light' : 'Dark';
      }
      if (toggleBtn && typeof toggleBtn.setAttribute === 'function') {
        toggleBtn.setAttribute('title', activeTheme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme');
        toggleBtn.setAttribute('aria-label', activeTheme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme');
      }
    }

    // Preserve custom dynamic brand color across theme toggles
    if (state && state.organization && state.organization.themeColor) {
      const brandColor = state.organization.themeColor;
      if (typeof document !== 'undefined' && document.documentElement && document.documentElement.style) {
        if (typeof document.documentElement.style.setProperty === 'function') {
          document.documentElement.style.setProperty('--brand-primary', brandColor);
          document.documentElement.style.setProperty('--accent-glow', `${brandColor}4d`);
        } else {
          document.documentElement.style['--brand-primary'] = brandColor;
          document.documentElement.style['--accent-glow'] = `${brandColor}4d`;
        }
      }
    }

    state.activeTheme = activeTheme;
  }

  function toggleTheme() {
    let current = state.activeTheme || 'dark';
    if (typeof document !== 'undefined' && document.documentElement) {
      if (typeof document.documentElement.getAttribute === 'function') {
        current = document.documentElement.getAttribute('data-theme') || current;
      } else if (document.documentElement['data-theme']) {
        current = document.documentElement['data-theme'];
      }
    }
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  // ===========================================================================
  // INITIALIZATION & TAB CONTROLS
  // ===========================================================================

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn && typeof themeToggleBtn.addEventListener === 'function') {
      themeToggleBtn.addEventListener('click', toggleTheme);
    }

    initNavigationTabs();
    initAuthGateway();
    initStepperControls();
    initStep1OrgForm();
    initStep2JobForm();
    initStep3ApplicationForm();
    initStep6DecisionControls();
    initKanbanBoard();
    initSocialGraph();
    initEquityStudio();
    initAuditLedger();
    initDemoButton();

    // Candidate Experience (M2 / R2)
    initCandidateProfile();
    initJobFeed();
    initAppliedJobsTracking();

    // Recruiter Workspace (M3 / R3)
    initJobStudio();
    initCandidatePipeline();
    initModals();

    // Admin Controls (M4 / R4)
    initAdminControls();

    // Initial calculation and UI population
    renderCandidateProfileForm();
    renderJobFeed();
    renderAppliedJobs();
    refreshLeaderboard();
    updateKanbanView();
    renderCandidatePipeline();
    updateAuditStream();
    renderAdminControls();
  });

  // ===========================================================================
  // NAVIGATION TABS
  // ===========================================================================

  function initNavigationTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetView = tab.getAttribute('data-tab') || tab.dataset?.tab;
        switchMainTab(targetView);
      });
    });

    document.querySelectorAll('.ats-nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = link.getAttribute('data-switch-tab');
        if (targetView) switchMainTab(targetView);
      });
    });
  }

  function switchMainTab(targetViewId) {
    if ((targetViewId === 'admin-view' || targetViewId === 'admin-settings-view') && state.currentUser && state.currentUser.role !== 'RECRUITER_ADMIN') {
      if (state.currentUser.role === 'CANDIDATE') {
        targetViewId = 'candidate-jobs-view';
      } else {
        targetViewId = 'kanban-view';
      }
      showToast('Admin controls restricted to Recruiter Admin role');
    }

    const recruiterViews = ['recruiter-studio-view', 'recruiter-pipeline-view', 'workflow-view', 'audit-view', 'kanban-view', 'graph-view'];
    if (recruiterViews.includes(targetViewId) && state.currentUser?.role === 'CANDIDATE') {
      targetViewId = 'candidate-jobs-view';
      showToast('Recruiter workspace restricted to Recruiter HR & Admin roles');
    }

    document.querySelectorAll('.nav-tab').forEach(t => {
      const tabTarget = t.getAttribute('data-tab') || t.dataset?.tab;
      t.classList.toggle('active', tabTarget === targetViewId);
    });

    document.querySelectorAll('.ats-nav-link').forEach(link => {
      const tabTarget = link.getAttribute('data-switch-tab');
      link.classList.toggle('active', tabTarget === targetViewId);
    });

    document.querySelectorAll('.view-panel').forEach(p => {
      p.classList.toggle('active', p.id === targetViewId);
    });

    state.currentTab = targetViewId;

    if (targetViewId === 'candidate-jobs-view') {
      renderJobFeed();
    } else if (targetViewId === 'candidate-profile-view') {
      renderCandidateProfileForm();
    } else if (targetViewId === 'candidate-apps-view') {
      renderAppliedJobs();
    } else if (targetViewId === 'recruiter-studio-view') {
      if (typeof loadJobIntoStudio === 'function') loadJobIntoStudio(studioSelectedJobId);
    } else if (targetViewId === 'recruiter-pipeline-view') {
      if (typeof renderCandidatePipeline === 'function') renderCandidatePipeline();
    } else if (targetViewId === 'kanban-view') {
      updateKanbanView();
    } else if (targetViewId === 'graph-view') {
      renderGraphCanvas();
    } else if (targetViewId === 'audit-view') {
      initAuditLedger();
    } else if (targetViewId === 'admin-view' || targetViewId === 'admin-settings-view') {
      renderAdminControls();
    }
  }

  // ===========================================================================
  // UPFRONT SIGN-IN & AUTHENTICATION GATEWAY (R1 / M1)
  // ===========================================================================

  function initAuthGateway() {
    const gatewayEl = document.getElementById('authGateway');
    const customToggleBtn = document.getElementById('toggleCustomLoginBtn');
    const customForm = document.getElementById('customLoginForm');
    const switchRoleBtn = document.getElementById('switchRoleBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const closeGatewayBtn = document.getElementById('closeGatewayBtn');

    // Check stored session in browser
    let stored = null;
    try {
      if (typeof sessionStorage !== 'undefined') {
        const item = sessionStorage.getItem('hireflow_auth_user');
        if (item) stored = JSON.parse(item);
      }
    } catch (err) {}

    if (stored && stored.name && typeof stored.role === 'string' && ['CANDIDATE', 'RECRUITER_HR', 'RECRUITER_ADMIN'].includes(stored.role)) {
      loginUser(stored, false);
    } else {
      // Default: show gateway if not logged in
      showGateway();
      updateHeaderUserCapsule(null);
      filterNavigationTabs(null);
    }

    // 1-Click Persona preset buttons
    const presetButtons = document.querySelectorAll('.btn-preset-auth, .btn-persona-pill');
    presetButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        const presetKey = btn.getAttribute('data-preset');
        if (presetKey && state.demoPersonas && state.demoPersonas[presetKey]) {
          loginUser(state.demoPersonas[presetKey], true);
        }
      });
    });

    // Direct role card clicks
    document.querySelectorAll('.role-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const role = card.getAttribute('data-role');
        if (role === 'CANDIDATE' && state.demoPersonas?.aarav) {
          loginUser(state.demoPersonas.aarav, true);
        } else if (role === 'RECRUITER_HR' && state.demoPersonas?.vikram) {
          loginUser(state.demoPersonas.vikram, true);
        } else if (role === 'RECRUITER_ADMIN' && state.demoPersonas?.admin) {
          loginUser(state.demoPersonas.admin, true);
        }
      });
    });

    // Custom login form toggle
    if (customToggleBtn && customForm) {
      customToggleBtn.addEventListener('click', () => {
        const isHidden = customForm.style.display === 'none' || !customForm.style.display;
        customForm.style.display = isHidden ? 'block' : 'none';
        const span = customToggleBtn.querySelector('span');
        if (span) {
          span.textContent = isHidden ? 'Hide custom form' : 'Or sign in with custom credentials';
        }
      });

      customForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('customAuthName');
        const emailInput = document.getElementById('customAuthEmail');
        const roleInput = document.getElementById('customAuthRole');

        const name = (nameInput && nameInput.value.trim()) || 'Verified Professional';
        const email = (emailInput && emailInput.value.trim()) || 'user@hireflow.ai';
        const role = (roleInput && roleInput.value) || 'CANDIDATE';

        const customUser = {
          id: 'user-' + Date.now(),
          name: name,
          email: email,
          role: role,
          headline: 'Verified Professional',
          avatar: name.substring(0, 2).toUpperCase() || 'VP',
          isAuthenticated: true
        };
        loginUser(customUser, true);
      });
    }

    // Switch Role & Logout button bindings
    if (switchRoleBtn) {
      switchRoleBtn.addEventListener('click', () => {
        showGateway();
      });
    }
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        logoutUser();
      });
    }

    // Close gateway button
    if (closeGatewayBtn) {
      closeGatewayBtn.addEventListener('click', () => {
        if (state.currentUser && state.currentUser.isAuthenticated) {
          hideGateway();
        }
      });
    }

    if (gatewayEl) {
      gatewayEl.addEventListener('click', (e) => {
        if (e.target === gatewayEl && state.currentUser && state.currentUser.isAuthenticated) {
          hideGateway();
        }
      });
    }
  }

  function loginUser(userObj, triggerToast = true) {
    state.currentUser = Object.assign({}, userObj, { isAuthenticated: true });

    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('hireflow_auth_user', JSON.stringify(state.currentUser));
      }
    } catch (err) {}

    // Update Header Capsule
    updateHeaderUserCapsule(state.currentUser);

    // Filter Navigation Tabs by Role
    filterNavigationTabs(state.currentUser.role);

    // Sync candidate profile if candidate
    if (state.currentUser.role === 'CANDIDATE') {
      syncCandidateProfileForUser(state.currentUser);
      renderCandidateProfileForm();
      renderJobFeed();
      renderAppliedJobs();
    }

    // Hide Gateway
    hideGateway();

    // Synchronize workspace visibility based on role
    const activeWorkspace = state.currentUser.role === 'CANDIDATE' ? 'candidate' : (state.currentUser.role === 'RECRUITER_ADMIN' ? 'admin' : 'recruiter');
    if (typeof HireFlowApp !== 'undefined' && HireFlowApp.ui) {
      HireFlowApp.ui.activeWorkspace = activeWorkspace;
    }
    ['recruiter', 'candidate', 'admin'].forEach(ws => {
      const el = document.getElementById(`workspace-${ws}`);
      const btn = document.getElementById(`ws-btn-${ws}`);
      if (el) el.classList.toggle('hidden', ws !== activeWorkspace);
      if (btn) {
        if (ws === activeWorkspace) {
          btn.classList.add('brand-bg', 'shadow-sm');
          btn.classList.remove('text-slate-400');
        } else {
          btn.classList.remove('brand-bg', 'shadow-sm');
          btn.classList.add('text-slate-400');
        }
      }
    });

    const ribbon = document.getElementById('workflow-ribbon-section');
    if (ribbon) {
      ribbon.classList.toggle('hidden', state.currentUser.role === 'CANDIDATE');
    }

    const recruiterNavs = document.querySelectorAll('nav[aria-label="Recruiter Views"]');
    recruiterNavs.forEach(nav => {
      nav.classList.toggle('hidden', state.currentUser.role === 'CANDIDATE');
    });

    // Route to Role Workspace
    if (state.currentUser.role === 'CANDIDATE') {
      if (document.getElementById('candidate-jobs-view')) {
        switchMainTab('candidate-jobs-view');
      } else {
        switchMainTab('equity-view');
      }
    } else if (state.currentUser.role === 'RECRUITER_HR') {
      if (document.getElementById('kanban-view')) {
        switchMainTab('kanban-view');
      } else {
        switchMainTab('workflow-view');
      }
    } else if (state.currentUser.role === 'RECRUITER_ADMIN') {
      if (document.getElementById('admin-view')) {
        switchMainTab('admin-view');
      } else if (document.getElementById('admin-settings-view')) {
        switchMainTab('admin-settings-view');
      } else {
        switchMainTab('workflow-view');
      }
    }

    if (triggerToast) {
      showToast(`Signed in as ${state.currentUser.name} (${formatRoleName(state.currentUser.role)})`);
    }
  }

  function logoutUser() {
    state.currentUser = null;
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('hireflow_auth_user');
      }
    } catch (err) {}

    updateHeaderUserCapsule(null);
    filterNavigationTabs(null);
    showGateway();
    showToast('Logged out of HireFlow');
  }

  function showGateway() {
    const gw = document.getElementById('authGateway');
    if (gw) {
      gw.classList.add('active');
    }
    const closeBtn = document.getElementById('closeGatewayBtn');
    if (closeBtn) {
      closeBtn.style.display = (state.currentUser && state.currentUser.isAuthenticated) ? 'flex' : 'none';
    }
  }

  function hideGateway() {
    const gw = document.getElementById('authGateway');
    if (gw) {
      gw.classList.remove('active');
    }
  }

  function updateHeaderUserCapsule(user) {
    const capsule = document.getElementById('userSessionCapsule');
    if (!capsule) return;

    if (!user || !user.isAuthenticated) {
      capsule.style.display = 'none';
      return;
    }

    capsule.style.display = 'flex';
    const avatarEl = document.getElementById('headerUserAvatar');
    const nameEl = document.getElementById('headerUserName');
    const badgeEl = document.getElementById('headerUserRoleBadge');

    if (avatarEl) {
      avatarEl.textContent = user.avatar || (user.name ? user.name.substring(0, 2).toUpperCase() : 'HF');
    }
    if (nameEl) {
      nameEl.textContent = user.name || 'User';
    }
    if (badgeEl) {
      badgeEl.textContent = formatRoleName(user.role);
      const roleStr = typeof user.role === 'string' ? user.role : String(user.role || '');
      const roleSlug = roleStr.toLowerCase().replace(/_/g, '-');
      badgeEl.className = `user-role-badge badge-${roleSlug}`;
    }
  }

  function formatRoleName(role) {
    if (role === 'CANDIDATE') return 'Candidate';
    if (role === 'RECRUITER_HR') return 'Recruiter (HR)';
    if (role === 'RECRUITER_ADMIN') return 'Recruiter (Admin)';
    return (typeof role === 'string' ? role : String(role || '')) || 'User';
  }

  function filterNavigationTabs(role) {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      const rolesAttr = tab.getAttribute('data-roles');
      if (!role) {
        // Unauthenticated / default state: show shared/recruiter tabs, hide candidate tabs
        const allowedRoles = rolesAttr ? rolesAttr.split(',').map(r => r.trim()) : [];
        if (allowedRoles.includes('ALL') || allowedRoles.includes('RECRUITER_HR') || allowedRoles.includes('RECRUITER_ADMIN')) {
          tab.style.display = '';
        } else {
          tab.style.display = 'none';
        }
        return;
      }

      if (!rolesAttr || rolesAttr === 'ALL') {
        tab.style.display = '';
        return;
      }

      const allowedRoles = rolesAttr.split(',').map(r => r.trim());
      if (allowedRoles.includes('ALL') || allowedRoles.includes(role)) {
        tab.style.display = '';
      } else {
        tab.style.display = 'none';
      }
    });
  }

  // Automation / Programmatic Hook for Headless Testing
  window.hireflowAuth = {
    loginAs: (role, presetKey) => {
      let persona = null;
      if (presetKey && state.demoPersonas && state.demoPersonas[presetKey]) {
        persona = state.demoPersonas[presetKey];
      } else if (role === 'CANDIDATE') {
        persona = state.demoPersonas?.aarav;
      } else if (role === 'RECRUITER_HR') {
        persona = state.demoPersonas?.vikram;
      } else if (role === 'RECRUITER_ADMIN') {
        persona = state.demoPersonas?.admin;
      } else {
        persona = {
          id: 'user-' + Date.now(),
          name: 'User (' + role + ')',
          role: role,
          avatar: 'HF',
          email: 'user@hireflow.ai',
          isAuthenticated: true
        };
      }
      loginUser(persona, false);
      return state.currentUser;
    },
    logout: () => {
      logoutUser();
      return true;
    },
    switchRole: (role) => {
      const key = role === 'CANDIDATE' ? 'aarav' : role === 'RECRUITER_HR' ? 'vikram' : 'admin';
      const persona = state.demoPersonas?.[key];
      if (persona) {
        loginUser(persona, false);
      } else {
        showGateway();
      }
      return state.currentUser;
    },
    getCurrentUser: () => state.currentUser,
    getDemoPersonas: () => state.demoPersonas,
    getState: () => state,
    getCandidateProfile: () => state.candidateProfile,
    getJobs: () => state.jobs
  };

  // ===========================================================================
  // 6-STEP WORKFLOW STEPPER CONTROLS
  // ===========================================================================

  function initStepperControls() {
    const stepperSteps = document.querySelectorAll('.stepper-step');
    stepperSteps.forEach(step => {
      step.addEventListener('click', () => {
        const stepNum = parseInt(step.getAttribute('data-step'), 10);
        goToStep(stepNum);
      });
    });

    document.querySelectorAll('.next-step-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = parseInt(e.currentTarget.getAttribute('data-target'), 10);
        goToStep(target);
      });
    });

    document.querySelectorAll('.prev-step-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = parseInt(e.currentTarget.getAttribute('data-target'), 10);
        goToStep(target);
      });
    });
  }

  function goToStep(stepNum) {
    if (stepNum < 1 || stepNum > 6) return;
    state.currentStep = stepNum;

    // Update stepper icons
    document.querySelectorAll('.stepper-step').forEach(s => {
      const num = parseInt(s.getAttribute('data-step'), 10);
      s.classList.toggle('active', num === stepNum);
      s.classList.toggle('completed', num < stepNum);
    });

    // Update step pane
    document.querySelectorAll('.step-pane').forEach(p => {
      p.classList.toggle('active', p.id === `pane-step-${stepNum}`);
    });

    // Step-specific trigger
    if (stepNum === 4) {
      runAiParsingAnimation();
    } else if (stepNum === 5) {
      refreshLeaderboard();
    } else if (stepNum === 6) {
      updateAuditStream();
    }

    window.scrollTo({ top: 120, behavior: 'smooth' });
  }

  // ===========================================================================
  // STEP 1: ORGANIZATION PORTAL
  // ===========================================================================

  function initStep1OrgForm() {
    const orgForm = document.getElementById('orgForm');
    const orgMinScore = document.getElementById('orgMinScore');
    const orgMinScoreVal = document.getElementById('orgMinScoreVal');
    const orgName = document.getElementById('orgName');
    const orgSubdomain = document.getElementById('orgSubdomain');
    const orgType = document.getElementById('orgType');

    // Live slider badge
    orgMinScore.addEventListener('input', (e) => {
      orgMinScoreVal.textContent = e.target.value + '%';
      document.getElementById('prevCutoff').textContent = e.target.value + '%';
      document.getElementById('activeCutoffDisplay').textContent = e.target.value + '% Match';
      state.organization.minimumShortlistScore = parseInt(e.target.value, 10);
    });

    // Form submit
    orgForm.addEventListener('submit', (e) => {
      e.preventDefault();
      state.organization.name = orgName.value;
      state.organization.type = orgType.value;
      state.organization.customSubdomain = orgSubdomain.value + '.hireflow.ai';
      state.organization.minimumShortlistScore = parseInt(orgMinScore.value, 10);

      // Update Preview Card
      document.getElementById('prevName').textContent = state.organization.name;
      document.getElementById('prevDomain').textContent = `https://${state.organization.customSubdomain}`;
      document.getElementById('prevType').textContent = state.organization.type === 'COMPANY' ? 'Enterprise Company' : 'University Placement Cell (TPO)';
      document.getElementById('tenantSubdomain').textContent = state.organization.customSubdomain;

      showToast(`Deployed branded portal for '${state.organization.name}'!`);
      goToStep(2);
    });
  }

  // ===========================================================================
  // STEP 2: JOB REQUISITION CREATION
  // ===========================================================================

  function initStep2JobForm() {
    const jobForm = document.getElementById('jobForm');
    const addMandatoryBtn = document.getElementById('addMandatoryBtn');
    const newMandatoryInput = document.getElementById('newMandatoryInput');
    const mandatoryTags = document.getElementById('mandatoryTags');

    const addPreferredBtn = document.getElementById('addPreferredBtn');
    const newPreferredInput = document.getElementById('newPreferredInput');
    const preferredTags = document.getElementById('preferredTags');

    // Add Mandatory Tag
    addMandatoryBtn.addEventListener('click', () => {
      const val = newMandatoryInput.value.trim().toUpperCase();
      if (val && !state.job.mandatorySkills.includes(val)) {
        state.job.mandatorySkills.push(val);
        renderSkillTag(mandatoryTags, val, 'chip-mandatory', state.job.mandatorySkills);
        newMandatoryInput.value = '';
      }
    });

    // Add Preferred Tag
    addPreferredBtn.addEventListener('click', () => {
      const val = newPreferredInput.value.trim().toUpperCase();
      if (val && !state.job.preferredSkills.includes(val)) {
        state.job.preferredSkills.push(val);
        renderSkillTag(preferredTags, val, 'chip-preferred', state.job.preferredSkills);
        newPreferredInput.value = '';
      }
    });

    // Handle delete buttons
    document.querySelectorAll('.del-tag').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const chip = e.target.closest('.skill-chip');
        const text = chip.childNodes[0].textContent.trim();
        state.job.mandatorySkills = state.job.mandatorySkills.filter(s => s !== text);
        state.job.preferredSkills = state.job.preferredSkills.filter(s => s !== text);
        chip.remove();
      });
    });

    jobForm.addEventListener('submit', (e) => {
      e.preventDefault();
      state.job.title = document.getElementById('jobTitle').value;
      state.job.requiredExperienceYears = parseInt(document.getElementById('jobMinExp').value, 10);
      state.job.equityOfferedPercent = parseFloat(document.getElementById('jobEquity').value);

      document.getElementById('liveJobTitle').textContent = state.job.title;
      showToast(`Job Requisition '${state.job.title}' published to ATS!`);
      goToStep(3);
    });
  }

  function renderSkillTag(container, text, chipClass, arrayRef) {
    const span = document.createElement('span');
    span.className = `skill-chip ${chipClass}`;
    span.innerHTML = `${text} <button type="button" class="del-tag">&times;</button>`;
    span.querySelector('.del-tag').addEventListener('click', () => {
      const idx = arrayRef.indexOf(text);
      if (idx > -1) arrayRef.splice(idx, 1);
      span.remove();
    });
    container.appendChild(span);
  }

  // ===========================================================================
  // STEP 3: CANDIDATE APPLICATION & PRESET SWITCHER
  // ===========================================================================

  function initStep3ApplicationForm() {
    const presetButtons = document.querySelectorAll('.btn-preset');
    const candName = document.getElementById('candName');
    const candEmail = document.getElementById('candEmail');
    const candHeadline = document.getElementById('candHeadline');
    const candResume = document.getElementById('candResume');
    const candReferral = document.getElementById('candReferral');
    const appForm = document.getElementById('appForm');

    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        presetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const presetKey = btn.getAttribute('data-preset');
        const data = state.presets[presetKey];

        candName.value = data.name;
        candEmail.value = data.email;
        candHeadline.value = data.headline;
        candResume.value = data.resume;
        candReferral.value = data.referral;

        // Update preview card
        document.getElementById('prevAvatar').textContent = data.avatar;
        document.getElementById('prevCandName').textContent = data.name;
        document.getElementById('prevCandHeadline').textContent = data.headline;
        document.getElementById('prevReferralPath').textContent = data.referral;
        document.getElementById('prevGraphTrust').textContent = data.graphTrust;
        document.getElementById('prevIntentScore').textContent = data.intent;
      });
    });

    appForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Check if candidate already exists or create new
      let existing = state.applications.find(a => a.email === candEmail.value);
      if (!existing) {
        existing = {
          applicationId: 'APP-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
          candidateName: candName.value,
          email: candEmail.value,
          headline: candHeadline.value,
          jobId: state.job.jobId,
          kanbanStage: 'Applied',
          rawResumeText: candResume.value,
          referralChain: candReferral.value,
          graphTrustScore: 0.90,
          intentScore: 0.92,
          expectedBaseSalaryLPA: 24,
          appliedAt: new Date().toISOString()
        };
        state.applications.unshift(existing);
      } else {
        existing.rawResumeText = candResume.value;
        existing.headline = candHeadline.value;
        existing.referralChain = candReferral.value;
      }

      state.activeCandidateAppId = existing.applicationId;
      showToast(`Application submitted for ${existing.candidateName}!`);
      goToStep(4);
    });
  }

  // ===========================================================================
  // STEP 4: AI NLP PROCESSING TELEMETRY
  // ===========================================================================

  function runAiParsingAnimation() {
    const currentApp = state.applications.find(a => a.applicationId === state.activeCandidateAppId) || state.applications[0];
    const logContainer = document.getElementById('aiTerminalLog');
    const skillsContainer = document.getElementById('aiExtractedSkills');
    const expBadge = document.getElementById('aiExtractedExp');

    document.getElementById('termCandName').textContent = currentApp.candidateName;

    // Extract skills
    const upper = currentApp.rawResumeText.toUpperCase();
    const foundSkills = KNOWN_SKILL_TAXONOMY.filter(s => upper.includes(s));

    // Regex match
    const expMatch = currentApp.rawResumeText.match(/(\d+)\+?\s*years?/i);
    const expYears = expMatch ? parseInt(expMatch[1], 10) : 0;

    document.getElementById('termExp').textContent = `${expYears} Years`;
    expBadge.textContent = `${expYears} Years Relevant Experience`;

    // Render extracted tags
    skillsContainer.innerHTML = '';
    foundSkills.forEach(skill => {
      const isMandatory = state.job.mandatorySkills.includes(skill);
      const span = document.createElement('span');
      span.className = `skill-chip ${isMandatory ? 'chip-mandatory' : 'chip-preferred'}`;
      span.textContent = skill;
      skillsContainer.appendChild(span);
    });

    // Populate terminal lines with staggered feel
    logContainer.innerHTML = `
      <div class="term-line"><span class="term-tag">[INIT]</span> AI NLP Parser Loaded. Active Taxonomy: 21 Canonical Technologies.</div>
      <div class="term-line"><span class="term-tag">[INGEST]</span> Ingested candidate payload for: <strong class="text-neon-cyan">${currentApp.candidateName}</strong></div>
      <div class="term-line"><span class="term-tag">[EXTRACT]</span> Isolated ${foundSkills.length} verified technical tokens: [${foundSkills.join(', ')}]</div>
      <div class="term-line text-neon-emerald"><span class="term-tag">[EXP-REGEX]</span> Detected Experience: <strong>${expYears} Years</strong></div>
      <div class="term-line"><span class="term-tag">[VECTOR]</span> Computed 768-dim dense embedding for semantic cross-attention.</div>
      <div class="term-line text-neon-violet"><span class="term-tag">[READY]</span> Match Engine Ready. Proceeding to Step 5 Shortlisting.</div>
    `;
  }

  // ===========================================================================
  // STEP 5: INTELLIGENT SHORTLISTING & LEADERBOARD
  // ===========================================================================

  function refreshLeaderboard() {
    const container = document.getElementById('shortlistContainer');
    if (!container) return;
    container.innerHTML = '';

    const minCutoff = state.organization.minimumShortlistScore;
    document.getElementById('activeCutoffDisplay').textContent = `${minCutoff}% Match`;

    // Calculate match scores for all applicants
    const scoredList = state.applications.map(app => {
      const upper = app.rawResumeText.toUpperCase();
      const candSkills = KNOWN_SKILL_TAXONOMY.filter(s => upper.includes(s));
      const expMatch = app.rawResumeText.match(/(\d+)\+?\s*years?/i);
      const expYears = expMatch ? parseInt(expMatch[1], 10) : 0;

      const strengths = [];
      const skillGaps = [];

      // 1. Mandatory Skills (70%)
      let mandMatched = 0;
      state.job.mandatorySkills.forEach(req => {
        if (candSkills.includes(req)) {
          mandMatched++;
          strengths.push(`${req} (Core)`);
        } else {
          skillGaps.push(`Missing Core: ${req}`);
        }
      });
      const mandScore = state.job.mandatorySkills.length === 0 ? 70.0 : (mandMatched / state.job.mandatorySkills.length) * 70.0;

      // 2. Preferred Skills (20%)
      let prefMatched = 0;
      state.job.preferredSkills.forEach(pref => {
        if (candSkills.includes(pref)) {
          prefMatched++;
          strengths.push(`${pref} (Bonus)`);
        } else {
          skillGaps.push(`Missing Preferred: ${pref}`);
        }
      });
      const prefScore = state.job.preferredSkills.length === 0 ? 20.0 : (prefMatched / state.job.preferredSkills.length) * 20.0;

      // 3. Experience (10%)
      let expScore;
      if (expYears >= state.job.requiredExperienceYears) {
        expScore = Math.min(10.0, 6.0 + (expYears - state.job.requiredExperienceYears) * 2.0);
        strengths.push(`${expYears} Yrs Relevant Experience`);
      } else {
        expScore = (expYears / Math.max(1, state.job.requiredExperienceYears)) * 6.0;
        skillGaps.push(`Experience below ${state.job.requiredExperienceYears} yrs target`);
      }

      const totalScore = Math.round(mandScore + prefScore + expScore);
      const autoShortlisted = totalScore >= minCutoff;

      return {
        app,
        candSkills,
        expYears,
        totalScore,
        strengths,
        skillGaps,
        autoShortlisted
      };
    });

    // Sort descending
    scoredList.sort((a, b) => b.totalScore - a.totalScore);

    // Render cards
    scoredList.forEach(item => {
      const card = document.createElement('div');
      card.className = `shortlist-card app-panel app-elevated ${item.autoShortlisted ? 'qualified' : 'disqualified'}`;

      const color = item.totalScore >= 85 ? '#10b981' : item.totalScore >= 70 ? '#06b6d4' : '#f43f5e';

      card.innerHTML = `
        <div class="score-radial-box">
          <div class="score-circle" style="--score-pct: ${item.totalScore}; --score-color: ${color};">
            <div class="score-circle-inner">
              <span class="score-num" style="color: ${color}">${item.totalScore}%</span>
              <span class="score-sub">Match</span>
            </div>
          </div>
        </div>

        <div class="shortlist-mid">
          <div class="cand-title-row">
            <span class="cand-name">${item.app.candidateName}</span>
            <span class="cand-referral-tag">🔗 ${item.app.referralChain.split('->')[0].trim()}</span>
          </div>

          <div class="strengths-container">
            <span class="chips-label text-neon-emerald">Strengths:</span>
            ${item.strengths.map(s => `<span class="skill-chip ${s.includes('Core') ? 'chip-mandatory' : s.includes('Bonus') ? 'chip-preferred' : 'chip-exp'}">${s}</span>`).join('')}
          </div>

          <div class="gaps-container">
            <span class="chips-label text-neon-rose">Gaps:</span>
            ${item.skillGaps.length === 0 ? '<span class="skill-chip chip-exp">None (100% Skill Coverage)</span>' : item.skillGaps.map(g => `<span class="skill-chip chip-gap">${g}</span>`).join('')}
          </div>
        </div>

        <div class="shortlist-end">
          <span class="auto-status-badge ${item.autoShortlisted ? 'pass' : 'fail'}">
            ${item.autoShortlisted ? '✓ PASSED THRESHOLD' : '✕ BELOW CUTOFF'}
          </span>
          <button class="btn btn-sm btn-primary review-cand-btn" data-appid="${item.app.applicationId}">
            Review & Decide →
          </button>
        </div>
      `;

      card.querySelector('.review-cand-btn').addEventListener('click', () => {
        state.activeCandidateAppId = item.app.applicationId;
        const sel = document.getElementById('decisionCandidateSelect');
        if (sel) sel.value = item.app.applicationId;
        goToStep(6);
      });

      container.appendChild(card);
    });
  }

  // ===========================================================================
  // STEP 6: HUMAN DECISION & STRUCTURED SCORECARDS
  // ===========================================================================

  function initStep6DecisionControls() {
    const sel = document.getElementById('decisionCandidateSelect');
    const reviewerName = document.getElementById('reviewerName');
    const offeredCTC = document.getElementById('offeredCTC');
    const decisionNotes = document.getElementById('decisionNotes');

    // Rubric Sliders
    ['scoreSysDesign', 'scoreCoding', 'scoreProblem', 'scoreCulture'].forEach(id => {
      const slider = document.getElementById(id);
      const valDisplay = document.getElementById('val' + id.replace('score', ''));
      if (slider && valDisplay) {
        slider.addEventListener('input', () => {
          valDisplay.textContent = `${slider.value} / 5`;
        });
      }
    });

    document.querySelectorAll('.decision-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const decisionType = e.currentTarget.getAttribute('data-decision');
        const appId = sel.value;
        const app = state.applications.find(a => a.applicationId === appId);
        if (!app) return;

        const newRecord = {
          applicationId: appId,
          candidateName: app.candidateName,
          decisionType: decisionType,
          reviewer: reviewerName.value,
          interviewNotes: decisionNotes.value,
          offeredCTC: decisionType === 'SelectedForOffer' ? parseFloat(offeredCTC.value) : null,
          equityOfferedPercent: decisionType === 'SelectedForOffer' ? state.job.equityOfferedPercent : null,
          decidedAt: new Date().toISOString()
        };

        // Update kanban stage
        if (decisionType === 'SelectedForOffer') {
          app.kanbanStage = 'OfferExtended';
        } else if (decisionType === 'HoldWaitlist') {
          app.kanbanStage = 'Interviewing';
        } else {
          app.kanbanStage = 'Closed';
        }

        // Add or replace
        const idx = state.decisions.findIndex(d => d.applicationId === appId);
        if (idx >= 0) state.decisions[idx] = newRecord;
        else state.decisions.unshift(newRecord);

        updateAuditStream();
        updateKanbanView();

        const msg = decisionType === 'SelectedForOffer' ? `Offer Extended to ${app.candidateName} for ₹${offeredCTC.value} LPA!` : `Decision recorded for ${app.candidateName}`;
        showToast(msg);
      });
    });
  }

  function updateAuditStream() {
    const container = document.getElementById('finalAuditStream');
    if (!container) return;
    container.innerHTML = '';

    state.decisions.forEach(rec => {
      const item = document.createElement('div');
      item.className = 'audit-item';

      let outcomeClass = 'hired';
      let outcomeText = `HIRED / OFFER EXTENDED (₹${rec.offeredCTC || 24} LPA)`;
      if (rec.decisionType === 'HoldWaitlist') {
        outcomeClass = 'hold';
        outcomeText = 'WAITLISTED / PRIORITY HOLD';
      } else if (rec.decisionType === 'Rejected') {
        outcomeClass = 'rejected';
        outcomeText = 'REJECTED WITH CONSTRUCTIVE FEEDBACK';
      }

      item.innerHTML = `
        <div class="audit-top">
          <strong class="text-neon-cyan">${rec.candidateName}</strong>
          <span class="audit-outcome ${outcomeClass}">${outcomeText}</span>
        </div>
        <div class="text-muted" style="font-size: 0.8rem;">
          By: <strong>${rec.reviewer}</strong> • ${new Date(rec.decidedAt).toLocaleTimeString()}
        </div>
        <div style="font-size: 0.82rem; margin-top: 0.2rem;">
          <em>"${rec.interviewNotes}"</em>
        </div>
      `;
      container.appendChild(item);
    });
  }

  // ===========================================================================
  // ATS KANBAN BOARD
  // ===========================================================================

  function initKanbanBoard() {
    const refreshBtn = document.getElementById('refreshKanbanBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', updateKanbanView);
    }
  }

  function updateKanbanView() {
    const stages = ['Sourced', 'Applied', 'AssessmentPending', 'Interviewing', 'OfferExtended', 'Closed'];

    stages.forEach(st => {
      const colCards = document.getElementById(`cards-${st}`);
      const countBadge = document.getElementById(`count-${st}`);
      if (!colCards) return;

      colCards.innerHTML = '';
      const inStage = state.applications.filter(a => (a.kanbanStage || 'Applied') === st);
      if (countBadge) countBadge.textContent = inStage.length;

      inStage.forEach(app => {
        const card = document.createElement('div');
        card.className = 'kanban-card';
        card.innerHTML = `
          <div class="kanban-card-title">${app.candidateName}</div>
          <div class="kanban-card-meta">${app.headline}</div>
          <div class="kanban-card-meta text-neon-violet">🔗 ${app.referralChain.split('->')[0]}</div>
          <select class="kanban-stage-selector" data-appid="${app.applicationId}">
            ${stages.map(s => `<option value="${s}" ${s === st ? 'selected' : ''}>Move to: ${s}</option>`).join('')}
          </select>
        `;

        card.querySelector('.kanban-stage-selector').addEventListener('change', (e) => {
          app.kanbanStage = e.target.value;
          updateKanbanView();
          showToast(`Moved ${app.candidateName} to ${e.target.value}`);
        });

        colCards.appendChild(card);
      });
    });
  }

  // ===========================================================================
  // SOCIAL GRAPH & WARM REFERRALS (HTML5 CANVAS)
  // ===========================================================================

  let graphNodes = [];
  let graphEdges = [];
  let animFrameId = null;

  function initSocialGraph() {
    const canvas = document.getElementById('networkCanvas');
    if (!canvas) return;

    graphNodes = [
      { id: 'user-aarav', label: 'Aarav Sharma', type: 'CANDIDATE', x: 200, y: 150, vx: 0.2, vy: 0.1, radius: 26, avatar: 'AS', subtitle: 'Backend Eng (2y)', trust: '94%' },
      { id: 'user-diya', label: 'Diya Nair', type: 'CANDIDATE', x: 220, y: 380, vx: -0.15, vy: 0.2, radius: 24, avatar: 'DN', subtitle: 'Software Dev (3y)', trust: '78%' },
      { id: 'user-rohan', label: 'Rohan Verma', type: 'CANDIDATE', x: 120, y: 260, vx: 0.1, vy: -0.1, radius: 22, avatar: 'RV', subtitle: 'Junior Dev (1y)', trust: '40%' },
      { id: 'user-priya', label: 'Priya Soni', type: 'CANDIDATE', x: 300, y: 280, vx: -0.2, vy: -0.15, radius: 25, avatar: 'PS', subtitle: 'Platform Eng (4y)', trust: '89%' },

      { id: 'emp-rajesh', label: 'Rajesh K.', type: 'EMPLOYEE', x: 450, y: 160, vx: 0.1, vy: 0.15, radius: 28, avatar: 'RK', subtitle: 'Staff Eng @ Apex', authority: '3.5x' },
      { id: 'emp-vikram', label: 'Vikram Seth', type: 'LEADERSHIP', x: 700, y: 200, vx: -0.1, vy: -0.1, radius: 32, avatar: 'VS', subtitle: 'VP Eng (Authority 4.5x)', authority: '4.5x' },

      { id: 'org-apex', label: 'Apex Cloud Systems', type: 'ORGANIZATION', x: 920, y: 270, vx: 0, vy: 0, radius: 38, avatar: 'AC', subtitle: 'Enterprise Tenant' },
      { id: 'school-nexa', label: 'NexaTech University', type: 'UNIVERSITY', x: 400, y: 440, vx: 0.1, vy: -0.1, radius: 30, avatar: 'NU', subtitle: 'Tier 1 Campus TPO' },

      { id: 'skill-java', label: 'Java Core', type: 'SKILL', x: 340, y: 70, vx: -0.1, vy: 0.1, radius: 20, avatar: '☕' },
      { id: 'skill-kafka', label: 'Kafka Streams', type: 'SKILL', x: 580, y: 80, vx: 0.15, vy: -0.1, radius: 20, avatar: '⚡' }
    ];

    graphEdges = [
      { from: 'user-aarav', to: 'emp-rajesh', label: 'Warm Referral', weight: 4.0 },
      { from: 'emp-rajesh', to: 'emp-vikram', label: 'Peer / Report', weight: 4.5 },
      { from: 'emp-vikram', to: 'org-apex', label: 'Engineering Leader', weight: 5.0 },
      { from: 'user-aarav', to: 'skill-java', label: 'Verified Endorsement', weight: 4.5 },
      { from: 'user-aarav', to: 'skill-kafka', label: 'Endorsed by Lead', weight: 4.0 },
      { from: 'user-diya', to: 'school-nexa', label: 'Alumni 2023', weight: 3.0 },
      { from: 'emp-rajesh', to: 'school-nexa', label: 'Alumni 2018', weight: 3.5 },
      { from: 'user-priya', to: 'org-apex', label: 'Direct Referred', weight: 4.2 }
    ];

    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
      const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);

      for (const node of graphNodes) {
        const dx = clickX - node.x;
        const dy = clickY - node.y;
        if (Math.sqrt(dx * dx + dy * dy) <= node.radius + 6) {
          inspectGraphNode(node);
          break;
        }
      }
    });

    renderGraphCanvas();
  }

  function renderGraphCanvas() {
    const canvas = document.getElementById('networkCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Subtle node floating movement
      graphNodes.forEach(node => {
        if (node.type !== 'ORGANIZATION') {
          node.x += node.vx;
          node.y += node.vy;

          if (node.x < node.radius + 20 || node.x > canvas.width - node.radius - 20) node.vx *= -1;
          if (node.y < node.radius + 20 || node.y > canvas.height - node.radius - 20) node.vy *= -1;
        }
      });

      // Draw Edges
      graphEdges.forEach(edge => {
        const fromNode = graphNodes.find(n => n.id === edge.from);
        const toNode = graphNodes.find(n => n.id === edge.to);
        if (!fromNode || !toNode) return;

        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);

        // Highlight warm referral highway
        const isWarmPath = (edge.from === 'user-aarav' && edge.to === 'emp-rajesh') ||
                           (edge.from === 'emp-rajesh' && edge.to === 'emp-vikram') ||
                           (edge.from === 'emp-vikram' && edge.to === 'org-apex');

        ctx.strokeStyle = isWarmPath ? 'rgba(16, 185, 129, 0.7)' : 'rgba(139, 92, 246, 0.25)';
        ctx.lineWidth = isWarmPath ? 3.5 : 1.5;
        if (isWarmPath) ctx.setLineDash([6, 4]);
        else ctx.setLineDash([]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw edge label
        const midX = (fromNode.x + toNode.x) / 2;
        const midY = (fromNode.y + toNode.y) / 2;
        ctx.font = '10px "JetBrains Mono"';
        ctx.fillStyle = isWarmPath ? '#34d399' : 'rgba(255, 255, 255, 0.4)';
        ctx.fillText(edge.label, midX - 25, midY - 6);
      });

      // Draw Nodes
      graphNodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);

        // Fill color based on type
        let fill = '#8b5cf6';
        let stroke = '#c4b5fd';
        if (node.type === 'EMPLOYEE' || node.type === 'LEADERSHIP') {
          fill = '#06b6d4';
          stroke = '#67e8f9';
        } else if (node.type === 'ORGANIZATION') {
          fill = '#10b981';
          stroke = '#6ee7b7';
        } else if (node.type === 'SKILL') {
          fill = '#f59e0b';
          stroke = '#fcd34d';
        }

        ctx.fillStyle = fill;
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = stroke;
        ctx.stroke();

        // Node Text
        ctx.font = 'bold 11px "Plus Jakarta Sans"';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(node.avatar || node.label.substring(0, 2), node.x, node.y + 4);

        // Subtitle below node
        ctx.font = '10px "Plus Jakarta Sans"';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillText(node.label, node.x, node.y + node.radius + 14);
      });

      if (state.currentTab === 'graph-view') {
        animFrameId = requestAnimationFrame(animate);
      }
    }

    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(animate);
  }

  function inspectGraphNode(node) {
    const card = document.getElementById('graphNodeDetails');
    if (!card) return;

    card.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
        <div class="avatar-circle" style="width: 38px; height: 38px; font-size: 0.9rem;">${node.avatar}</div>
        <div>
          <h4 style="margin: 0;">${node.label}</h4>
          <span style="font-size: 0.72rem; color: var(--primary-cyan-light);">${node.subtitle || node.type}</span>
        </div>
      </div>
      <div style="font-size: 0.8rem; margin: 0.5rem 0; color: var(--text-muted);">
        Type: <strong>${node.type}</strong><br>
        ${node.trust ? `Social Graph Trust: <strong class="text-neon-emerald">${node.trust}</strong><br>` : ''}
        ${node.authority ? `Endorsement Seniority Weight: <strong class="text-neon-violet">${node.authority}</strong><br>` : ''}
      </div>
      <div class="profile-edge-badge" style="font-size: 0.75rem;">
        ✓ Verified Snapshot on Living Profile
      </div>
    `;
  }

  // ===========================================================================
  // WELLFOUND OFFER & ESOP STUDIO
  // ===========================================================================

  function initEquityStudio() {
    const eqBase = document.getElementById('eqBaseSalary');
    const eqBonus = document.getElementById('eqBonusPercent');
    const eqEquity = document.getElementById('eqEquityPercent');
    const eqValuation = document.getElementById('eqValuation');

    function recalculate() {
      const base = parseFloat(eqBase.value);
      const bonusPct = parseFloat(eqBonus.value);
      const equityPct = parseFloat(eqEquity.value);
      const valuationCr = parseFloat(eqValuation.value);

      document.getElementById('eqBaseVal').textContent = `${base} LPA`;
      document.getElementById('eqBonusVal').textContent = `${bonusPct}%`;
      document.getElementById('eqEquityVal').textContent = `${equityPct}%`;
      document.getElementById('eqValuationVal').textContent = `₹${valuationCr} Cr`;

      const annualBonus = (base * bonusPct) / 100;
      const totalEsopGrantCr = (valuationCr * equityPct) / 100;
      const totalEsopGrantLakhs = totalEsopGrantCr * 100;
      const annualizedEsopLakhs = totalEsopGrantLakhs / 4; // 4-year vesting

      const totalYear1Comp = base + annualBonus + annualizedEsopLakhs;

      document.getElementById('eqTotalComp').textContent = `₹ ${totalYear1Comp.toFixed(2)} LPA`;
      document.getElementById('eqBaseItem').textContent = `₹ ${base.toFixed(2)} L`;
      document.getElementById('eqBonusItem').textContent = `₹ ${annualBonus.toFixed(2)} L`;
      document.getElementById('eqEsopGrantItem').textContent = `₹ ${totalEsopGrantLakhs.toFixed(2)} L`;
      document.getElementById('eqEsopAnnualItem').textContent = `₹ ${annualizedEsopLakhs.toFixed(2)} L / yr`;
    }

    [eqBase, eqBonus, eqEquity, eqValuation].forEach(el => {
      if (el) el.addEventListener('input', recalculate);
    });

    recalculate();
  }

  // ===========================================================================
  // AUDIT & COMPLIANCE LEDGER
  // ===========================================================================

  function initAuditLedger() {
    const tbody = document.getElementById('auditTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    state.decisions.forEach(rec => {
      const tr = document.createElement('tr');
      const outcomeBadge = rec.decisionType === 'SelectedForOffer'
        ? '<span class="badge badge-emerald">HIRED (Offer Extended)</span>'
        : rec.decisionType === 'HoldWaitlist'
        ? '<span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b;">WAITLISTED</span>'
        : '<span class="badge" style="background: rgba(244, 63, 94, 0.2); color: #f43f5e;">REJECTED</span>';

      tr.innerHTML = `
        <td><strong>${rec.candidateName}</strong></td>
        <td><span class="text-neon-cyan font-mono">${rec.score !== undefined ? `${rec.score}%` : (rec.applicationId === 'APP-1B4D7E' ? '96%' : rec.applicationId === 'APP-3C9E1A' ? '88%' : '31%')}</span></td>
        <td>${outcomeBadge}</td>
        <td>${rec.offeredCTC ? `₹ ${rec.offeredCTC} LPA + ${rec.equityOfferedPercent || 0.25}% ESOP` : '—'}</td>
        <td>${rec.reviewer}</td>
        <td><em>${rec.interviewNotes}</em></td>
        <td class="text-muted">${new Date(rec.decidedAt).toLocaleDateString()}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // ===========================================================================
  // 1-CLICK DEMO ORCHESTRATION
  // ===========================================================================

  function initDemoButton() {
    const btn = document.getElementById('runDemoBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      showToast('🚀 Launching 6-Step Apex Cloud Systems Live Demo...');
      switchMainTab('workflow-view');
      goToStep(1);

      setTimeout(() => {
        showToast('[Step 1] Branded Portal deployed at https://apexcloud.hireflow.ai');
        goToStep(2);

        setTimeout(() => {
          showToast('[Step 2] Published Job Requisition: Senior Backend Engineer (70% Core, 20% Preferred)');
          goToStep(3);

          setTimeout(() => {
            showToast('[Step 3] Candidate Aarav Sharma applied with Living Profile & warm referral');
            goToStep(4);

            setTimeout(() => {
              showToast('[Step 4] AI Neural Parser extracted 7 skills, 2 yrs experience, generated 768-dim embedding');
              goToStep(5);

              setTimeout(() => {
                showToast('[Step 5] Shortlisting Leaderboard ranked Aarav (96%) & Diya (88%)');
                goToStep(6);

                setTimeout(() => {
                  showToast('[Step 6] Vikram (VP Eng) extended digital offer (₹24.0 LPA + 0.25% ESOP)!');
                  window.showOfferModal('APP-1B4D7E');
                }, 1600);
              }, 1600);
            }, 1600);
          }, 1600);
        }, 1600);
      }, 1400);
    });
  }

  // ===========================================================================
  // DIGITAL OFFER LETTER MODAL
  // ===========================================================================

  window.showOfferModal = function (appId) {
    const modal = document.getElementById('offerModal');
    const body = document.getElementById('offerModalBody');
    if (!modal || !body) return;

    const candidate = state.applications.find(a => a.applicationId === appId) || state.applications[0];
    const decision = state.decisions.find(d => d.applicationId === appId) || state.decisions[0];

    body.innerHTML = `
      <div class="offer-letter-doc">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1e1b4b; padding-bottom: 1rem;">
          <div>
            <h1>APEX CLOUD SYSTEMS INC.</h1>
            <p style="margin: 0; color: #4b5563;">apexcloud.hireflow.ai • Bangalore, India</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-weight: bold;">OFFICIAL APPOINTMENT LETTER</p>
            <p style="margin: 0; color: #6b7280;">Date: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <p style="margin-top: 1.5rem;">Dear <strong>${candidate.candidateName}</strong>,</p>
        <p>Following your technical scorecards and collaborative reviews with our engineering leadership, we are thrilled to offer you the position of <strong>${state.job.title}</strong> at Apex Cloud Systems.</p>

        <div class="offer-meta-grid">
          <div><strong>Base Compensation (CTC):</strong> ₹ ${decision.offeredCTC || 24.0} Lakhs / Annum</div>
          <div><strong>Stock Options (ESOP):</strong> ${decision.equityOfferedPercent || 0.25}% Company Equity</div>
          <div><strong>Employment Type:</strong> Full-Time Regular</div>
          <div><strong>Location:</strong> Hybrid (Bangalore Tech Campus)</div>
          <div><strong>Reporting Manager:</strong> Vikram Seth (VP Engineering)</div>
          <div><strong>Hiring Pipeline Score:</strong> 96% AI Semantic & Skill Match</div>
        </div>

        <p><strong>Vesting Schedule:</strong> Equity grants vest over a 4-year schedule with a standard 1-year cliff (25% at Month 12, followed by monthly linear vesting thereafter).</p>

        <div style="margin-top: 2rem; display: flex; justify-content: space-between;">
          <div>
            <p style="margin-bottom: 2.5rem;">Sincerely,</p>
            <strong>Vikram Seth</strong><br>
            <span>VP Engineering, Apex Cloud Systems</span>
          </div>
          <div>
            <p style="margin-bottom: 2.5rem;">Candidate Acceptance:</p>
            <strong>${candidate.candidateName}</strong><br>
            <span>[Digitally Captured via OmniTalent Living Profile]</span>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
  };

  window.closeOfferModal = function () {
    const modal = document.getElementById('offerModal');
    if (modal) modal.classList.remove('active');
  };

  window.printOfferLetter = function () {
    window.print();
  };

  window.exportAuditCsv = function () {
    let csv = 'Candidate,AI Match,Decision,Offered CTC,Reviewer,Notes,DecidedAt\n';
    state.decisions.forEach(d => {
      csv += `"${d.candidateName}","96%","${d.decisionType}","${d.offeredCTC || 'N/A'}","${d.reviewer}","${d.interviewNotes}","${d.decidedAt}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u;
    a.download = 'hireflow-compliance-audit.csv';
    a.click();
    showToast('Audit CSV exported successfully!');
  };

  // ===========================================================================
  // CANDIDATE EXPERIENCE: LIVING PROFILE, JOB FEED & TRACKING (R2 / M2)
  // ===========================================================================

  function syncCandidateProfileForUser(userObj) {
    if (!userObj) return;
    if (userObj.role !== 'CANDIDATE') return;

    if (userObj.id === 'cand-aarav' || userObj.email === 'aarav.s@email.com') {
      state.candidateProfile = {
        name: 'Aarav Sharma',
        email: 'aarav.s@email.com',
        phone: '+91 98765 43210',
        location: 'Bangalore, India',
        headline: 'Backend Engineer | Distributed Systems & Event Streaming',
        skills: ['JAVA', 'SPRING BOOT', 'MICROSERVICES', 'DOCKER', 'SQL', 'KUBERNETES', 'KAFKA'],
        portfolioLinks: [
          { name: 'GitHub', label: 'GitHub', url: 'https://github.com/aaravsharma/raft' },
          { name: 'Portfolio', label: 'Portfolio', url: 'https://aarav.dev' }
        ],
        rawResumeText: 'Experienced Engineer with 2 years building scalable backends using Java, Spring Boot, Microservices, Docker, SQL, Kubernetes, and Kafka event streams. Reduced p99 latency by 35% using Redis caching and reactive Spring WebFlux.',
        resumeFileName: 'Aarav_Sharma_Resume.pdf',
        expectedSalaryLPA: 24,
        experienceYears: 2
      };
    } else if (userObj.id === 'cand-diya' || userObj.email === 'diya.n@email.com') {
      state.candidateProfile = {
        name: 'Diya Nair',
        email: 'diya.n@email.com',
        phone: '+91 98765 43211',
        location: 'Pune, India',
        headline: 'Software Developer | Cloud-Native Java & Microservices',
        skills: ['JAVA', 'SPRING BOOT', 'MICROSERVICES', 'DOCKER', 'SQL', 'KUBERNETES'],
        portfolioLinks: [
          { name: 'GitHub', label: 'GitHub', url: 'https://github.com/diyanair' }
        ],
        rawResumeText: 'Software Developer with 3 years of hands-on experience in Java, Spring Boot, Microservices, Docker, SQL databases, and Kubernetes cluster orchestration. Built multi-tenant REST APIs and automated CI/CD pipelines.',
        resumeFileName: 'Diya_Nair_Resume.pdf',
        expectedSalaryLPA: 20,
        experienceYears: 3
      };
    } else {
      state.candidateProfile = {
        name: userObj.name || 'Verified Professional',
        email: userObj.email || 'user@hireflow.ai',
        phone: '+91 98765 43299',
        location: 'India (Remote)',
        headline: userObj.headline || 'Software Engineer',
        skills: userObj.skills && Array.isArray(userObj.skills) ? [...userObj.skills] : ['JAVA', 'SQL', 'DOCKER', 'PYTHON'],
        portfolioLinks: [
          { name: 'Portfolio', label: 'Portfolio', url: 'https://portfolio.dev' }
        ],
        rawResumeText: userObj.resume || 'Software Engineer with experience in Java, SQL, and Docker building microservices.',
        resumeFileName: 'Resume.pdf',
        expectedSalaryLPA: 22,
        experienceYears: userObj.experienceYears || 2
      };
    }
  }

  function calculateCandidateJobMatch(resumeText, job, appData) {
    if (!job) job = state.job || (state.jobs && state.jobs[0]);
    const upper = (resumeText || '').toUpperCase();
    const textSkills = KNOWN_SKILL_TAXONOMY.filter(s => upper.includes(s));
    
    const isCurrentCandidate = !appData || !appData.candidateName || (state.candidateProfile && appData.candidateName === state.candidateProfile.name);
    const profileSkills = (isCurrentCandidate && state.candidateProfile && Array.isArray(state.candidateProfile.skills))
      ? state.candidateProfile.skills.map(s => String(s).toUpperCase())
      : (appData && Array.isArray(appData.skills) ? appData.skills.map(s => String(s).toUpperCase()) : []);
    const candidateSkills = Array.from(new Set([...textSkills, ...profileSkills]));

    const expMatch = (resumeText || '').match(/(\d+)\+?\s*years?/i);
    const detectedExpYears = expMatch
      ? parseInt(expMatch[1], 10)
      : (isCurrentCandidate ? (state.candidateProfile?.experienceYears || 0) : (appData?.experienceYears || 0));

    const mandMatched = [];
    const mandMissing = [];
    const strengths = [];
    const gaps = [];

    const mandatorySkills = job.mandatorySkills || [];
    mandatorySkills.forEach(req => {
      if (candidateSkills.includes(req.toUpperCase())) {
        mandMatched.push(req);
        strengths.push(`${req} (Core)`);
      } else {
        mandMissing.push(req);
        gaps.push(`Missing Core: ${req}`);
      }
    });

    const mandScore = mandatorySkills.length === 0
      ? 70.0
      : (mandMatched.length / mandatorySkills.length) * 70.0;

    const prefMatched = [];
    const prefMissing = [];
    const preferredSkills = job.preferredSkills || [];
    preferredSkills.forEach(pref => {
      if (candidateSkills.includes(pref.toUpperCase())) {
        prefMatched.push(pref);
        strengths.push(`${pref} (Bonus)`);
      } else {
        prefMissing.push(pref);
        gaps.push(`Missing Preferred: ${pref}`);
      }
    });

    const prefScore = preferredSkills.length === 0
      ? 20.0
      : (prefMatched.length / preferredSkills.length) * 20.0;

    const reqExp = job.requiredExperienceYears || 0;
    let expScore;
    if (detectedExpYears >= reqExp) {
      expScore = Math.min(10.0, 6.0 + (detectedExpYears - reqExp) * 2.0);
      strengths.push(`${detectedExpYears} Yrs Relevant Experience`);
    } else {
      expScore = (detectedExpYears / Math.max(1, reqExp)) * 6.0;
      gaps.push(`Experience below ${reqExp} yrs target`);
    }

    const deterministicScore = Math.round(mandScore + prefScore + expScore);

    // 4-factor OmniTalent Hybrid fusion formula
    // 40% Semantic Similarity, 30% Keyword BM25, 15% Graph Trust, 15% Intent
    const semanticSim = Math.min(1.0, 0.45 + (mandMatched.length / Math.max(1, mandatorySkills.length)) * 0.55);
    const bm25Score = (mandMatched.length + prefMatched.length * 0.5) / Math.max(1, mandatorySkills.length + preferredSkills.length * 0.5);
    const graphTrust = (appData && appData.graphTrustScore !== undefined) ? appData.graphTrustScore : 0.85;
    const intentScore = (appData && appData.intentScore !== undefined) ? appData.intentScore : 0.90;

    const compositeScore = Math.round(
      (0.40 * semanticSim + 0.30 * bm25Score + 0.15 * graphTrust + 0.15 * intentScore) * 100
    );

    const hybridRadar = {
      semanticSim: Math.round(semanticSim * 100),
      bm25Score: Math.round(bm25Score * 100),
      graphTrust: Math.round(graphTrust * 100),
      intentScore: Math.round(intentScore * 100)
    };

    let recommendation = 'Proceed with Screening';
    if (deterministicScore >= 90) {
      recommendation = 'Strong Hire (Top 1% Pipeline)';
    } else if (deterministicScore >= 75) {
      recommendation = 'Shortlist for Interview';
    } else if (deterministicScore >= 50) {
      recommendation = 'Review for Secondary Roles';
    } else {
      recommendation = 'Does Not Meet Cutoff';
    }

    return {
      deterministicScore,
      score: deterministicScore,
      mandScore: Math.round(mandScore * 10) / 10,
      prefScore: Math.round(prefScore * 10) / 10,
      expScore: Math.round(expScore * 10) / 10,
      mandMatched,
      mandMissing,
      prefMatched,
      prefMissing,
      detectedExpYears,
      reqExp: job.requiredExperienceYears || 2,
      hybridRadar,
      compositeScore,
      recommendation,
      strengths,
      gaps
    };
  }

  // --- Living Profile Management ---

  function initCandidateProfile() {
    const profileForm = document.getElementById('candidateProfileForm');
    const resetBtn = document.getElementById('resetCandidateProfileBtn');
    const addSkillBtn = document.getElementById('addCandidateSkillBtn');
    const newSkillInput = document.getElementById('newCandidateSkillInput');
    const addLinkBtn = document.getElementById('addCandidateLinkBtn');
    const newLinkNameInput = document.getElementById('newLinkNameInput');
    const newLinkUrlInput = document.getElementById('newLinkUrlInput');
    const resumeUpload = document.getElementById('candidateResumeUpload');
    const resumeTextarea = document.getElementById('candidateResumeText');

    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('candidateNameInput');
        const emailInput = document.getElementById('candidateEmailInput');
        const phoneInput = document.getElementById('candidatePhoneInput');
        const locInput = document.getElementById('candidateLocationInput');
        const headInput = document.getElementById('candidateHeadlineInput');
        const salaryInput = document.getElementById('candidateExpectedSalaryInput');

        if (nameInput) state.candidateProfile.name = nameInput.value.trim();
        if (emailInput) state.candidateProfile.email = emailInput.value.trim();
        if (phoneInput) state.candidateProfile.phone = phoneInput.value.trim();
        if (locInput) state.candidateProfile.location = locInput.value.trim();
        if (headInput) state.candidateProfile.headline = headInput.value.trim();
        if (salaryInput) state.candidateProfile.expectedSalaryLPA = parseFloat(salaryInput.value) || 24;
        if (resumeTextarea) state.candidateProfile.rawResumeText = resumeTextarea.value.trim();

        // Update active name displays
        const activeFeedName = document.getElementById('feedActiveCandidateName');
        if (activeFeedName) activeFeedName.textContent = state.candidateProfile.name;

        if (state.currentUser && state.currentUser.role === 'CANDIDATE') {
          state.currentUser.name = state.candidateProfile.name;
          state.currentUser.email = state.candidateProfile.email;
          updateHeaderUserCapsule(state.currentUser);
        }

        updateResumeTelemetry(state.candidateProfile.rawResumeText);
        renderJobFeed();
        renderAppliedJobs();
        showToast('Living Profile saved successfully!');
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (state.currentUser) {
          syncCandidateProfileForUser(state.currentUser);
        }
        renderCandidateProfileForm();
        renderJobFeed();
        showToast('Profile reset to defaults.');
      });
    }

    if (addSkillBtn && newSkillInput) {
      const handleAddSkill = () => {
        const val = newSkillInput.value.trim().toUpperCase();
        if (val) {
          if (!state.candidateProfile.skills.includes(val)) {
            state.candidateProfile.skills.push(val);
          }
          newSkillInput.value = '';
          renderCandidateSkills();
          renderJobFeed();
        }
      };
      addSkillBtn.addEventListener('click', handleAddSkill);
      newSkillInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddSkill();
        }
      });
    }

    if (addLinkBtn && newLinkUrlInput) {
      const handleAddLink = () => {
        const nameVal = (newLinkNameInput && newLinkNameInput.value.trim()) || 'Portfolio';
        const urlVal = newLinkUrlInput.value.trim();
        if (urlVal) {
          state.candidateProfile.portfolioLinks.push({ name: nameVal, label: nameVal, url: urlVal });
          if (newLinkNameInput) newLinkNameInput.value = '';
          newLinkUrlInput.value = '';
          renderCandidateLinks();
        }
      };
      addLinkBtn.addEventListener('click', handleAddLink);
      newLinkUrlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddLink();
        }
      });
    }

    if (resumeUpload) {
      resumeUpload.addEventListener('change', (e) => {
        const file = (e.target.files && e.target.files[0]) || null;
        if (file) {
          const statusEl = document.getElementById('resumeFileStatus');
          if (statusEl) statusEl.textContent = `${file.name} (Loaded)`;
          state.candidateProfile.resumeFileName = file.name;

          const parseContent = (content) => {
            if (content && content.trim()) {
              state.candidateProfile.rawResumeText = content.trim();
              if (resumeTextarea) resumeTextarea.value = content.trim();
              const upper = content.toUpperCase();
              const extractedSkills = KNOWN_SKILL_TAXONOMY.filter(s => upper.includes(s));
              extractedSkills.forEach(s => {
                if (!state.candidateProfile.skills.includes(s)) {
                  state.candidateProfile.skills.push(s);
                }
              });
              const expMatch = content.match(/(\d+)\+?\s*years?/i);
              if (expMatch) {
                state.candidateProfile.experienceYears = parseInt(expMatch[1], 10);
              }
              renderCandidateSkills();
              updateResumeTelemetry(content);
              renderJobFeed();
              showToast(`Parsed ${extractedSkills.length} skills from ${file.name}`);
            }
          };

          if (typeof FileReader !== 'undefined') {
            try {
              const reader = new FileReader();
              reader.onload = (ev) => {
                parseContent(ev.target.result);
              };
              reader.onerror = () => {
                parseContent(resumeTextarea ? resumeTextarea.value : state.candidateProfile.rawResumeText);
              };
              reader.readAsText(file);
            } catch (err) {
              parseContent(resumeTextarea ? resumeTextarea.value : state.candidateProfile.rawResumeText);
            }
          } else {
            parseContent(resumeTextarea ? resumeTextarea.value : state.candidateProfile.rawResumeText);
          }
        }
      });
    }

    if (resumeTextarea) {
      resumeTextarea.addEventListener('input', () => {
        updateResumeTelemetry(resumeTextarea.value);
      });
    }
  }

  function updateResumeTelemetry(text) {
    const telemetryEl = document.getElementById('candidateResumeTelemetry');
    if (!telemetryEl) return;
    const upper = (text || '').toUpperCase();
    const skills = KNOWN_SKILL_TAXONOMY.filter(s => upper.includes(s));
    const expMatch = (text || '').match(/(\d+)\+?\s*years?/i);
    const exp = expMatch ? parseInt(expMatch[1], 10) : 0;
    telemetryEl.textContent = `Detected ${skills.length} skills, ${exp} yrs experience via AI NLP parser`;
  }

  function renderCandidateProfileForm() {
    const prof = state.candidateProfile;
    if (!prof) return;

    const nameInput = document.getElementById('candidateNameInput');
    const emailInput = document.getElementById('candidateEmailInput');
    const phoneInput = document.getElementById('candidatePhoneInput');
    const locInput = document.getElementById('candidateLocationInput');
    const headInput = document.getElementById('candidateHeadlineInput');
    const salaryInput = document.getElementById('candidateExpectedSalaryInput');
    const resumeText = document.getElementById('candidateResumeText');
    const fileStatus = document.getElementById('resumeFileStatus');

    if (nameInput) nameInput.value = prof.name || '';
    if (emailInput) emailInput.value = prof.email || '';
    if (phoneInput) phoneInput.value = prof.phone || '';
    if (locInput) locInput.value = prof.location || '';
    if (headInput) headInput.value = prof.headline || '';
    if (salaryInput) salaryInput.value = prof.expectedSalaryLPA || 24;
    if (resumeText) resumeText.value = prof.rawResumeText || '';
    if (fileStatus && prof.resumeFileName) fileStatus.textContent = prof.resumeFileName;

    const activeFeedName = document.getElementById('feedActiveCandidateName');
    if (activeFeedName) activeFeedName.textContent = prof.name || 'Candidate';

    updateResumeTelemetry(prof.rawResumeText);
    renderCandidateSkills();
    renderCandidateLinks();
  }

  function renderCandidateSkills() {
    const container = document.getElementById('candidateSkillsTags');
    if (!container) return;
    container.innerHTML = '';

    (state.candidateProfile.skills || []).forEach(skill => {
      const chip = document.createElement('span');
      chip.className = 'tag-chip';
      chip.innerHTML = `
        ${skill}
        <button type="button" class="del-tag-btn" data-skill="${skill}" title="Remove skill">×</button>
      `;
      container.appendChild(chip);
    });

    container.querySelectorAll('.del-tag-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const skillToRemove = btn.getAttribute('data-skill');
        if (skillToRemove) {
          state.candidateProfile.skills = state.candidateProfile.skills.filter(s => s !== skillToRemove);
          renderCandidateSkills();
          renderJobFeed();
        }
      });
    });
  }

  function renderCandidateLinks() {
    const container = document.getElementById('candidatePortfolioLinks');
    if (!container) return;
    container.innerHTML = '';

    (state.candidateProfile.portfolioLinks || []).forEach((link, idx) => {
      const chip = document.createElement('div');
      chip.className = 'portfolio-link-chip app-elevated';
      const label = link.name || link.label || 'Link';
      chip.innerHTML = `
        <span>🔗</span>
        <a href="${link.url}" target="_blank" rel="noopener noreferrer">${label}</a>
        <button type="button" class="del-link-btn" data-index="${idx}" title="Remove link">×</button>
      `;
      container.appendChild(chip);
    });

    container.querySelectorAll('.del-link-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idxStr = btn.getAttribute('data-index');
        const idx = parseInt(idxStr, 10);
        if (!isNaN(idx) && idx >= 0 && idx < state.candidateProfile.portfolioLinks.length) {
          state.candidateProfile.portfolioLinks.splice(idx, 1);
          renderCandidateLinks();
        }
      });
    });
  }

  // --- LinkedIn-Style Job Feed & Filtering ---

  const jobFeedFilterState = {
    searchQuery: '',
    selectedCategory: 'ALL',
    selectedJobId: null
  };

  function initJobFeed() {
    const searchInput = document.getElementById('jobFeedSearchInput');
    const categoryContainer = document.getElementById('jobCategoryFilters');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        jobFeedFilterState.searchQuery = (e.target.value || '').trim().toLowerCase();
        renderJobFeed();
      });
    }

    if (categoryContainer) {
      const pills = categoryContainer.querySelectorAll('.category-pill');
      pills.forEach(pill => {
        pill.addEventListener('click', () => {
          pills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          jobFeedFilterState.selectedCategory = pill.getAttribute('data-category') || 'ALL';
          renderJobFeed();
        });
      });
    }
  }

  function getCandidateFacingStatus(kanbanStage) {
    let label = 'Submitted';
    let badgeClass = 'badge-submitted';
    let color = 'sky';

    if (kanbanStage === 'Sourced' || kanbanStage === 'Applied') {
      label = 'Submitted';
      badgeClass = 'badge-submitted';
      color = 'sky';
    } else if (kanbanStage === 'AssessmentPending' || kanbanStage === 'Interviewing' || kanbanStage === 'Screening') {
      label = 'Under Review';
      badgeClass = 'badge-under-review';
      color = 'indigo';
    } else if (kanbanStage === 'OfferExtended') {
      label = 'Offer Extended';
      badgeClass = 'badge-offer';
      color = 'emerald';
    } else if (kanbanStage === 'Closed' || kanbanStage === 'Completed' || kanbanStage === 'Rejected') {
      label = 'Completed';
      badgeClass = 'badge-completed';
      color = 'slate';
    }

    return {
      label,
      badgeClass,
      color,
      status: label,
      toString() {
        return this.label;
      }
    };
  }
  if (typeof window !== 'undefined') {
    window.getCandidateFacingStatus = getCandidateFacingStatus;
  }

  function renderJobFeed() {
    const container = document.getElementById('jobFeedContainer');
    if (!container) return;
    container.innerHTML = '';

    const activeCandName = document.getElementById('feedActiveCandidateName');
    if (activeCandName) {
      activeCandName.textContent = state.candidateProfile?.name || state.currentUser?.name || 'Aarav Sharma';
    }

    const { searchQuery, selectedCategory } = jobFeedFilterState;

    const filteredJobs = (state.jobs || []).filter(job => {
      // Category filter
      if (selectedCategory && selectedCategory !== 'ALL') {
        if (job.category !== selectedCategory) return false;
      }
      // Search filter
      if (searchQuery) {
        const titleMatch = (job.title || '').toLowerCase().includes(searchQuery);
        const descMatch = (job.description || '').toLowerCase().includes(searchQuery);
        const deptMatch = (job.department || '').toLowerCase().includes(searchQuery);
        const locMatch = (job.location || '').toLowerCase().includes(searchQuery);
        const catMatch = (job.category || '').toLowerCase().includes(searchQuery);
        const skillsMatch = (job.mandatorySkills || []).some(s => s.toLowerCase().includes(searchQuery)) ||
                            (job.preferredSkills || []).some(s => s.toLowerCase().includes(searchQuery));
        if (!titleMatch && !descMatch && !deptMatch && !locMatch && !catMatch && !skillsMatch) {
          return false;
        }
      }
      return true;
    });

    if (filteredJobs.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No job openings match your current search or category filter.</p>
        </div>
      `;
      const detailPane = document.getElementById('jobDetailPane');
      if (detailPane) {
        detailPane.innerHTML = `
          <div class="detail-empty-state">
            <div class="detail-empty-icon">🔍</div>
            <h3 class="detail-job-title" style="font-size: 1.25rem;">No Matching Roles Found</h3>
            <p class="text-muted">No opportunities match your current filters. Try selecting another category pill or clearing your search term.</p>
          </div>
        `;
      }
      return;
    }

    // Preserve active selection or default to first match
    if (!jobFeedFilterState.selectedJobId || !filteredJobs.some(j => j.jobId === jobFeedFilterState.selectedJobId)) {
      jobFeedFilterState.selectedJobId = filteredJobs[0].jobId;
    }

    const currentEmail = state.candidateProfile?.email || state.currentUser?.email;
    const currentName = state.candidateProfile?.name || state.currentUser?.name;

    filteredJobs.forEach(job => {
      const match = calculateCandidateJobMatch(state.candidateProfile?.rawResumeText, job);
      const score = match.deterministicScore;
      const matchClass = score >= 85 ? 'pill-match-high' : score >= 70 ? 'pill-match-med' : 'pill-match-low';

      // Check if candidate already applied
      const existingApp = (state.applications || []).find(a =>
        a.jobId === job.jobId &&
        ((currentEmail && a.email === currentEmail) || (currentName && a.candidateName === currentName))
      );

      const isSelected = (job.jobId === jobFeedFilterState.selectedJobId);

      const card = document.createElement('div');
      card.className = `job-feed-card app-panel app-elevated${isSelected ? ' selected-card' : ''}`;
      card.setAttribute('data-jobid', job.jobId);

      card.innerHTML = `
        <div class="job-card-top">
          <div class="job-company-row">
            <div class="company-avatar">AC</div>
            <div>
              <h3 class="job-card-title">${job.title}</h3>
              <div class="job-card-meta">
                <span>Apex Cloud Systems</span>
                <span>•</span>
                <span>${job.location || 'Bangalore (Hybrid)'}</span>
                <span>•</span>
                <span class="badge badge-subtle">${job.category || job.department || 'Engineering'}</span>
              </div>
            </div>
          </div>
          <span class="match-score-pill ${matchClass}">🎯 ${score}% Match</span>
        </div>

        <div class="job-specs-row">
          <span class="spec-pill text-neon-emerald">💰 ${job.minSalaryLPA} - ${job.maxSalaryLPA} LPA</span>
          <span class="spec-pill text-neon-violet">💎 ${job.equityOfferedPercent}% ESOP</span>
          <span class="spec-pill">⏱ ${job.requiredExperienceYears}+ Yrs Exp</span>
        </div>

        <p class="job-card-desc">${job.description || ''}</p>

        <div class="job-skills-section">
          ${(job.mandatorySkills || []).map(s => `<span class="skill-chip chip-mandatory">${s}</span>`).join('')}
          ${(job.preferredSkills || []).map(s => `<span class="skill-chip chip-preferred">${s}</span>`).join('')}
        </div>

        <div class="job-card-footer">
          <div class="text-dim" style="font-size: 0.8rem;">
            70% Core • 20% Preferred • 10% Exp
          </div>
          <div>
            ${existingApp
              ? `<button type="button" class="btn btn-secondary btn-applied" disabled="true">✓ Applied (${getCandidateFacingStatus(existingApp.kanbanStage).label})</button>`
              : `<button type="button" class="btn btn-primary btn-1click-apply" data-jobid="${job.jobId}">⚡ 1-Click Apply</button>`
            }
          </div>
        </div>
      `;

      // Interactive card selection
      card.addEventListener('click', (e) => {
        if (e.target && (e.target.closest('.btn-1click-apply') || e.target.closest('.btn-applied'))) {
          return;
        }
        jobFeedFilterState.selectedJobId = job.jobId;
        container.querySelectorAll('.job-feed-card').forEach(c => {
          if (c.getAttribute('data-jobid') === job.jobId) {
            c.classList.add('selected-card');
          } else {
            c.classList.remove('selected-card');
          }
        });
        renderJobDetailPane(job);
      });

      container.appendChild(card);
    });

    // Attach 1-click apply listeners
    container.querySelectorAll('.btn-1click-apply').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const jId = btn.getAttribute('data-jobid');
        if (jId) {
          handle1ClickApply(jId);
        }
      });
    });

    // Populate sticky detail pane with the currently selected job
    const activeJob = filteredJobs.find(j => j.jobId === jobFeedFilterState.selectedJobId) || filteredJobs[0];
    if (activeJob) {
      renderJobDetailPane(activeJob);
    }
  }

  function renderJobDetailPane(job) {
    const detailPane = document.getElementById('jobDetailPane');
    if (!detailPane || !job) return;

    const currentEmail = state.candidateProfile?.email || state.currentUser?.email;
    const currentName = state.candidateProfile?.name || state.currentUser?.name;
    const match = calculateCandidateJobMatch(state.candidateProfile?.rawResumeText, job);
    const score = match.deterministicScore;
    const matchClass = score >= 85 ? 'pill-match-high' : score >= 70 ? 'pill-match-med' : 'pill-match-low';

    // Check if candidate already applied
    const existingApp = (state.applications || []).find(a =>
      a.jobId === job.jobId &&
      ((currentEmail && a.email === currentEmail) || (currentName && a.candidateName === currentName))
    );

    const mandMatched = match.mandatoryMatched || [];
    const prefMatched = match.preferredMatched || [];

    detailPane.innerHTML = `
      <div class="detail-header-card">
        <div class="company-avatar">AC</div>
        <div class="detail-header-info">
          <h3 class="detail-job-title">${job.title}</h3>
          <div class="detail-company-meta">
            <span><strong>Apex Cloud Systems</strong></span>
            <span>•</span>
            <span>${job.location || 'Bangalore (Hybrid)'}</span>
            <span>•</span>
            <span class="badge badge-subtle">${job.category || job.department || 'Engineering'}</span>
          </div>
        </div>
        <span class="match-score-pill ${matchClass}">🎯 ${score}% Match</span>
      </div>

      <div class="detail-actions-row">
        ${existingApp
          ? `<button type="button" class="btn btn-secondary btn-applied" disabled="true" style="width: 100%;">✓ Applied (${getCandidateFacingStatus(existingApp.kanbanStage).label})</button>`
          : `<button type="button" class="btn btn-primary btn-gradient btn-detail-apply btn-1click-apply" data-jobid="${job.jobId}">⚡ 1-Click Apply with Living Profile</button>`
        }
      </div>

      <div class="wellfound-comp-box">
        <div class="comp-metrics-grid">
          <div class="comp-metric-item">
            <span class="comp-metric-label">Base Compensation</span>
            <span class="comp-metric-value text-neon-emerald">₹${job.minSalaryLPA} - ${job.maxSalaryLPA} LPA</span>
          </div>
          <div class="comp-metric-item">
            <span class="comp-metric-label">Equity Grant</span>
            <span class="comp-metric-value text-neon-violet">💎 ${job.equityOfferedPercent}% ESOP</span>
          </div>
          <div class="comp-metric-item">
            <span class="comp-metric-label">Experience Required</span>
            <span class="comp-metric-value">⏱ ${job.requiredExperienceYears}+ Yrs Exp</span>
          </div>
        </div>
        <div class="comp-vesting-note">
          <span>📜</span>
          <span>Standard 4-Year Vesting Schedule with 1-Year Cliff (25% at Month 12, then monthly)</span>
        </div>
      </div>

      <div class="detail-match-gauge">
        <div class="detail-match-header">
          <strong>Candidate AI Match (70/20/10 Formula)</strong>
          <span class="badge ${score >= 85 ? 'badge-emerald' : score >= 70 ? 'badge-cyan' : 'badge-subtle'}">${score}% Match</span>
        </div>
        <div class="match-gauge-bar">
          <div class="gauge-seg-core" style="width: ${(match.mandScore / 70) * 70}%;" title="Mandatory Core Skills: ${match.mandScore} / 70%"></div>
          <div class="gauge-seg-pref" style="width: ${(match.prefScore / 20) * 20}%;" title="Preferred Bonus Skills: ${match.prefScore} / 20%"></div>
          <div class="gauge-seg-exp" style="width: ${(match.expScore / 10) * 10}%;" title="Experience Alignment: ${match.expScore} / 10%"></div>
        </div>
        <div class="match-factors-list">
          <div class="match-factor-row">
            <span>Mandatory Core Skills (70% Weight)</span>
            <strong class="text-neon-violet">${match.mandScore} / 70.0%</strong>
          </div>
          <div class="match-factor-row">
            <span>Preferred Bonus Skills (20% Weight)</span>
            <strong class="text-neon-cyan">${match.prefScore} / 20.0%</strong>
          </div>
          <div class="match-factor-row">
            <span>Experience Alignment (10% Weight)</span>
            <strong class="text-neon-emerald">${match.expScore} / 10.0%</strong>
          </div>
        </div>
      </div>

      <div>
        <h4 class="detail-section-title">Role Overview</h4>
        <p class="detail-desc-text">${job.description || 'Join our engineering team building high-throughput distributed systems, cloud infrastructure, and modern data platforms.'}</p>
      </div>

      <div>
        <h4 class="detail-section-title">Required Mandatory Technical Skills</h4>
        <div class="detail-skills-wrap">
          ${(job.mandatorySkills || []).map(s => {
            const isMatched = mandMatched.map(m => m.toUpperCase()).includes(s.toUpperCase());
            return `<span class="skill-chip chip-mandatory ${isMatched ? 'chip-matched' : ''}">${isMatched ? '✓ ' : ''}${s}</span>`;
          }).join('')}
        </div>
      </div>

      <div>
        <h4 class="detail-section-title">Preferred Bonus Skills</h4>
        <div class="detail-skills-wrap">
          ${(job.preferredSkills || []).map(s => {
            const isMatched = prefMatched.map(m => m.toUpperCase()).includes(s.toUpperCase());
            return `<span class="skill-chip chip-preferred ${isMatched ? 'chip-matched' : ''}">${isMatched ? '★ ' : ''}${s}</span>`;
          }).join('')}
        </div>
      </div>

      <div>
        <h4 class="detail-section-title">Engineering Culture & Benefits</h4>
        <ul class="detail-desc-text" style="padding-left: 1.25rem; margin: 0; display: flex; flex-direction: column; gap: 0.35rem;">
          <li>Flexible hybrid culture with high engineering autonomy</li>
          <li>Comprehensive health coverage and annual wellness stipend</li>
          <li>Continuous learning budget for conferences, certifications, and books</li>
          <li>Top-tier engineering workstations (MacBook Pro M-Series / Linux)</li>
        </ul>
      </div>
    `;

    // Wire detail pane 1-click apply button
    const detailApplyBtn = detailPane.querySelector('.btn-1click-apply');
    if (detailApplyBtn) {
      detailApplyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const jId = detailApplyBtn.getAttribute('data-jobid');
        if (jId) {
          handle1ClickApply(jId);
        }
      });
    }
  }

  function handle1ClickApply(jobId) {
    const job = (state.jobs || []).find(j => j.jobId === jobId) || state.job;
    if (!job) return;

    const candName = state.candidateProfile?.name || state.currentUser?.name || 'Aarav Sharma';
    const candEmail = state.candidateProfile?.email || state.currentUser?.email || 'aarav.s@email.com';
    const candHeadline = state.candidateProfile?.headline || 'Backend Engineer';

    // Verify if already applied
    const alreadyApplied = (state.applications || []).some(a =>
      a.jobId === jobId && (a.email === candEmail || a.candidateName === candName)
    );
    if (alreadyApplied) {
      showToast(`You have already applied for ${job.title}.`);
      return;
    }

    const newAppId = 'APP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const newApp = {
      applicationId: newAppId,
      candidateName: candName,
      email: candEmail,
      headline: candHeadline,
      jobId: job.jobId,
      kanbanStage: 'Applied',
      rawResumeText: state.candidateProfile?.rawResumeText || '',
      referralChain: `${candName} -> Living Profile 1-Click Apply`,
      graphTrustScore: 0.88,
      intentScore: 0.95,
      expectedBaseSalaryLPA: state.candidateProfile?.expectedSalaryLPA || job.minSalaryLPA,
      appliedAt: new Date().toISOString()
    };

    state.applications.push(newApp);

    // Keep active selection on applied job
    jobFeedFilterState.selectedJobId = jobId;

    // Re-render views
    renderJobFeed();
    renderAppliedJobs();
    updateKanbanView();
    showToast(`✓ Applied to ${job.title} using your Living Profile!`);
  }

  // --- Applied Jobs Tracking ---

  function initAppliedJobsTracking() {
    // Initialized via DOMContentLoaded and tab switches
  }

  function renderAppliedJobs() {
    const container = document.getElementById('appliedJobsList');
    if (!container) return;
    container.innerHTML = '';

    const currentEmail = state.candidateProfile?.email || state.currentUser?.email;
    const currentName = state.candidateProfile?.name || state.currentUser?.name;

    const myApps = (state.applications || []).filter(a =>
      (currentEmail && a.email === currentEmail) ||
      (currentName && a.candidateName === currentName)
    );

    const countBadge = document.getElementById('appliedJobsCountBadge');
    if (countBadge) {
      countBadge.textContent = `${myApps.length} Active Application${myApps.length === 1 ? '' : 's'}`;
    }

    if (myApps.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No applications submitted yet. Browse the Job Feed above to apply with 1 click!</p>
        </div>
      `;
      return;
    }

    myApps.forEach(app => {
      const job = (state.jobs || []).find(j => j.jobId === app.jobId) || state.job;
      const jobTitle = job ? job.title : 'Software Engineer';
      const match = calculateCandidateJobMatch(app.rawResumeText, job, app);
      const score = match.deterministicScore;

      // 4-stage stepper: Applied -> Screening -> Interviewing -> Offer Extended
      const stageOrder = ['Applied', 'Screening', 'Interviewing', 'Offer Extended'];
      let activeIdx = 0;
      if (app.kanbanStage === 'Applied' || app.kanbanStage === 'Sourced') {
        activeIdx = 0;
      } else if (app.kanbanStage === 'AssessmentPending' || app.kanbanStage === 'Screening') {
        activeIdx = 1;
      } else if (app.kanbanStage === 'Interviewing') {
        activeIdx = 2;
      } else if (app.kanbanStage === 'OfferExtended') {
        activeIdx = 3;
      } else if (app.kanbanStage === 'Closed') {
        activeIdx = -1;
      }

      const card = document.createElement('div');
      card.className = 'applied-job-card app-panel app-elevated';
      card.setAttribute('data-appid', app.applicationId);

      const stepperHtml = `
        <div class="stepper-4stage">
          ${stageOrder.map((stageName, sIdx) => {
            const isCompleted = activeIdx >= 0 && sIdx < activeIdx;
            const isActive = activeIdx >= 0 && sIdx === activeIdx;
            const stepClass = isCompleted ? 'completed' : isActive ? 'active' : '';
            const dotContent = isCompleted ? '✓' : (sIdx + 1);

            const connectorHtml = sIdx > 0
              ? `<div class="stage-connector ${isCompleted || isActive ? 'completed' : ''}"></div>`
              : '';

            return `
              ${connectorHtml}
              <div class="stage-step ${stepClass}">
                <div class="stage-dot">${dotContent}</div>
                <div class="stage-label">${stageName}</div>
              </div>
            `;
          }).join('')}
        </div>
      `;

      card.innerHTML = `
        <div class="applied-card-header">
          <div>
            <h3 class="applied-card-title">${jobTitle}</h3>
            <div class="applied-card-sub">
              <span>Apex Cloud Systems</span>
              <span>•</span>
              <span>Applied ${new Date(app.appliedAt).toLocaleDateString()}</span>
              <span>•</span>
              <span class="font-mono text-neon-cyan">${app.applicationId}</span>
            </div>
          </div>
          <span class="badge badge-emerald font-mono">🎯 ${score}% AI Match</span>
        </div>

        ${stepperHtml}

        <div class="applied-card-footer">
          <div class="text-dim flex items-center gap-2" style="font-size: 0.85rem;">
            <span>Current Status:</span>
            <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${getCandidateFacingStatus(app.kanbanStage).badgeClass}">${getCandidateFacingStatus(app.kanbanStage).label}</span>
          </div>
          <div>
            ${app.kanbanStage === 'OfferExtended'
              ? `<button type="button" class="btn btn-sm btn-gradient btn-view-offer-letter" data-appid="${app.applicationId}">🎉 View Official Appointment Letter</button>`
              : `<span class="badge badge-subtle">Stage in Progress</span>`
            }
          </div>
        </div>
      `;

      container.appendChild(card);
    });

    // Attach offer letter modal view triggers
    container.querySelectorAll('.btn-view-offer-letter').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const appId = btn.getAttribute('data-appid');
        if (appId && window.showOfferModal) {
          window.showOfferModal(appId);
        }
      });
    });
  }

  // ===========================================================================
  // RECRUITER WORKSPACE: JOB REQUISITION STUDIO (R3 / M3)
  // ===========================================================================

  let studioSelectedJobId = 'JOB-8F9A2C';
  let studioWorkingSkills = {
    mandatory: ['JAVA', 'SPRING BOOT', 'MICROSERVICES', 'DOCKER', 'SQL'],
    preferred: ['KUBERNETES', 'KAFKA']
  };

  function initJobStudio() {
    const jobSelect = document.getElementById('studioJobSelect');
    const createNewBtn = document.getElementById('createNewJobBtn');
    const studioForm = document.getElementById('jobStudioForm');
    const addMandBtn = document.getElementById('addStudioMandatoryBtn');
    const mandInput = document.getElementById('newStudioMandatoryInput');
    const addPrefBtn = document.getElementById('addStudioPreferredBtn');
    const prefInput = document.getElementById('newStudioPreferredInput');
    const deleteBtn = document.getElementById('deleteJobStudioBtn');

    populateStudioJobSelect();
    loadJobIntoStudio(studioSelectedJobId);

    const previewFieldIds = [
      'jobStudioTitle',
      'jobStudioDept',
      'jobStudioLocation',
      'jobStudioMinSalary',
      'jobStudioMaxSalary',
      'jobStudioExp',
      'jobStudioEquity',
      'jobStudioDesc'
    ];
    previewFieldIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', updateStudioFeedPreview);
        el.addEventListener('change', updateStudioFeedPreview);
      }
    });

    if (jobSelect) {
      jobSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        studioSelectedJobId = val;
        loadJobIntoStudio(val);
      });
    }

    if (createNewBtn) {
      createNewBtn.addEventListener('click', () => {
        studioSelectedJobId = 'NEW';
        if (jobSelect) jobSelect.value = 'NEW';
        loadJobIntoStudio('NEW');
      });
    }

    if (addMandBtn && mandInput) {
      const handleAddMand = () => {
        const val = mandInput.value.trim().toUpperCase();
        if (val) {
          if (!studioWorkingSkills.mandatory.includes(val)) {
            studioWorkingSkills.mandatory.push(val);
            renderStudioSkills();
          }
          mandInput.value = '';
        }
      };
      addMandBtn.addEventListener('click', handleAddMand);
      mandInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddMand();
        }
      });
    }

    if (addPrefBtn && prefInput) {
      const handleAddPref = () => {
        const val = prefInput.value.trim().toUpperCase();
        if (val) {
          if (!studioWorkingSkills.preferred.includes(val)) {
            studioWorkingSkills.preferred.push(val);
            renderStudioSkills();
          }
          prefInput.value = '';
        }
      };
      addPrefBtn.addEventListener('click', handleAddPref);
      prefInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddPref();
        }
      });
    }

    if (studioForm) {
      studioForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const activeUser = state.currentUser;
        if (!activeUser || (activeUser.role !== 'RECRUITER_HR' && activeUser.role !== 'RECRUITER_ADMIN')) {
          showToast('Unauthorized: Only recruiters can publish or update requisitions.');
          return;
        }
        const titleEl = document.getElementById('jobStudioTitle');
        const deptEl = document.getElementById('jobStudioDept');
        const locEl = document.getElementById('jobStudioLocation');
        const typeEl = document.getElementById('jobStudioType');
        const minSalEl = document.getElementById('jobStudioMinSalary');
        const maxSalEl = document.getElementById('jobStudioMaxSalary');
        const expEl = document.getElementById('jobStudioExp');
        const eqEl = document.getElementById('jobStudioEquity');
        const descEl = document.getElementById('jobStudioDesc');

        const title = (titleEl ? titleEl.value : '').trim();
        const dept = (deptEl ? deptEl.value : 'Engineering & Platform').trim();
        const loc = (locEl ? locEl.value : 'Bangalore, India (Hybrid)').trim();
        const type = (typeEl ? typeEl.value : 'FULL_TIME');
        const minSalary = parseFloat(minSalEl ? minSalEl.value : 20) || 20;
        const maxSalary = parseFloat(maxSalEl ? maxSalEl.value : 30) || 30;
        const exp = parseInt(expEl ? expEl.value : 2, 10) || 2;
        const equity = parseFloat(eqEl ? eqEl.value : 0.25) || 0.25;
        const desc = (descEl ? descEl.value : '').trim();

        if (!title) {
          showToast('Job Title is required');
          return;
        }

        if (studioSelectedJobId === 'NEW' || !state.jobs.some(j => j.jobId === studioSelectedJobId)) {
          const newId = 'JOB-' + Math.random().toString(36).substring(2, 8).toUpperCase();
          const newJob = {
            jobId: newId,
            orgId: state.organization?.orgId || 'ORG-APEX88',
            title: title,
            department: dept,
            category: dept.toLowerCase().includes('arch') ? 'Architecture' : dept.toLowerCase().includes('devops') ? 'DevOps' : dept.toLowerCase().includes('product') ? 'FullStack' : 'Backend',
            location: loc,
            employmentType: type,
            minSalaryLPA: minSalary,
            maxSalaryLPA: maxSalary,
            equityOfferedPercent: equity,
            mandatorySkills: [...studioWorkingSkills.mandatory],
            preferredSkills: [...studioWorkingSkills.preferred],
            requiredExperienceYears: exp,
            status: 'OPEN',
            description: desc
          };
          state.jobs.push(newJob);
          studioSelectedJobId = newId;
          showToast(`Created & published requisition: ${title}`);
        } else {
          const targetJob = state.jobs.find(j => j.jobId === studioSelectedJobId);
          if (targetJob) {
            targetJob.title = title;
            targetJob.department = dept;
            targetJob.location = loc;
            targetJob.employmentType = type;
            targetJob.minSalaryLPA = minSalary;
            targetJob.maxSalaryLPA = maxSalary;
            targetJob.requiredExperienceYears = exp;
            targetJob.equityOfferedPercent = equity;
            targetJob.description = desc;
            targetJob.mandatorySkills = [...studioWorkingSkills.mandatory];
            targetJob.preferredSkills = [...studioWorkingSkills.preferred];

            if (state.job && state.job.jobId === targetJob.jobId) {
              Object.assign(state.job, targetJob);
            }
            showToast(`Updated requisition: ${title}`);
          }
        }

        populateStudioJobSelect();
        populatePipelineJobFilter();
        renderJobFeed();
        renderCandidatePipeline();
        refreshLeaderboard();
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (studioSelectedJobId === 'NEW') {
          studioSelectedJobId = state.jobs[0]?.jobId || 'JOB-8F9A2C';
          loadJobIntoStudio(studioSelectedJobId);
          populateStudioJobSelect();
          return;
        }

        if (state.jobs.length <= 1) {
          showToast('Cannot archive the only active requisition.');
          return;
        }

        const removedIdx = state.jobs.findIndex(j => j.jobId === studioSelectedJobId);
        if (removedIdx >= 0) {
          const removed = state.jobs.splice(removedIdx, 1)[0];
          studioSelectedJobId = state.jobs[0].jobId;
          if (state.job && state.job.jobId === removed.jobId) {
            state.job = { ...state.jobs[0] };
          }
          populateStudioJobSelect();
          populatePipelineJobFilter();
          loadJobIntoStudio(studioSelectedJobId);
          renderJobFeed();
          renderCandidatePipeline();
          refreshLeaderboard();
          showToast(`Archived requisition: ${removed.title}`);
        }
      });
    }
  }

  function populateStudioJobSelect() {
    const jobSelect = document.getElementById('studioJobSelect');
    if (!jobSelect) return;
    jobSelect.innerHTML = '';

    (state.jobs || []).forEach(job => {
      const opt = document.createElement('option');
      opt.value = job.jobId;
      opt.textContent = `${job.title} (${job.jobId})`;
      if (job.jobId === studioSelectedJobId) opt.selected = true;
      jobSelect.appendChild(opt);
    });

    const newOpt = document.createElement('option');
    newOpt.value = 'NEW';
    newOpt.textContent = '+ Create New Requisition';
    if (studioSelectedJobId === 'NEW') newOpt.selected = true;
    jobSelect.appendChild(newOpt);
  }

  function loadJobIntoStudio(jobId) {
    const titleEl = document.getElementById('jobStudioTitle');
    const deptEl = document.getElementById('jobStudioDept');
    const locEl = document.getElementById('jobStudioLocation');
    const typeEl = document.getElementById('jobStudioType');
    const minSalEl = document.getElementById('jobStudioMinSalary');
    const maxSalEl = document.getElementById('jobStudioMaxSalary');
    const expEl = document.getElementById('jobStudioExp');
    const eqEl = document.getElementById('jobStudioEquity');
    const descEl = document.getElementById('jobStudioDesc');
    const jobSelect = document.getElementById('studioJobSelect');

    if (jobSelect) jobSelect.value = jobId;

    if (jobId === 'NEW') {
      if (titleEl) titleEl.value = '';
      if (deptEl) deptEl.value = 'Engineering & Platform';
      if (locEl) locEl.value = 'Bangalore, India (Hybrid)';
      if (typeEl) typeEl.value = 'FULL_TIME';
      if (minSalEl) minSalEl.value = 20;
      if (maxSalEl) maxSalEl.value = 32;
      if (expEl) expEl.value = 2;
      if (eqEl) expEl.value = 0.25;
      if (descEl) descEl.value = '';
      studioWorkingSkills = { mandatory: [], preferred: [] };
      renderStudioSkills();
      updateStudioFeedPreview();
      return;
    }

    const job = state.jobs.find(j => j.jobId === jobId) || state.jobs[0];
    if (!job) return;

    if (titleEl) titleEl.value = job.title || '';
    if (deptEl) deptEl.value = job.department || '';
    if (locEl) locEl.value = job.location || '';
    if (typeEl) typeEl.value = job.employmentType || 'FULL_TIME';
    if (minSalEl) minSalEl.value = job.minSalaryLPA || 20;
    if (maxSalEl) maxSalEl.value = job.maxSalaryLPA || 30;
    if (expEl) expEl.value = job.requiredExperienceYears || 2;
    if (eqEl) eqEl.value = job.equityOfferedPercent || 0.25;
    if (descEl) descEl.value = job.description || '';

    studioWorkingSkills = {
      mandatory: [...(job.mandatorySkills || [])],
      preferred: [...(job.preferredSkills || [])]
    };
    renderStudioSkills();
    updateStudioFeedPreview();
  }

  function renderStudioSkills() {
    const mandCont = document.getElementById('studioMandatoryTags');
    const prefCont = document.getElementById('studioPreferredTags');

    if (mandCont) {
      mandCont.innerHTML = '';
      (studioWorkingSkills.mandatory || []).forEach((skill, idx) => {
        const chip = document.createElement('span');
        chip.className = 'tag-chip';
        chip.innerHTML = `
          ${skill}
          <button type="button" class="del-studio-mand-tag" data-index="${idx}" title="Remove mandatory skill">×</button>
        `;
        mandCont.appendChild(chip);
      });

      mandCont.querySelectorAll('.del-studio-mand-tag').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.getAttribute('data-index'), 10);
          if (!isNaN(idx) && idx >= 0 && idx < studioWorkingSkills.mandatory.length) {
            studioWorkingSkills.mandatory.splice(idx, 1);
            renderStudioSkills();
          }
        });
      });
    }

    if (prefCont) {
      prefCont.innerHTML = '';
      (studioWorkingSkills.preferred || []).forEach((skill, idx) => {
        const chip = document.createElement('span');
        chip.className = 'tag-chip';
        chip.innerHTML = `
          ${skill}
          <button type="button" class="del-studio-pref-tag" data-index="${idx}" title="Remove preferred skill">×</button>
        `;
        prefCont.appendChild(chip);
      });

      prefCont.querySelectorAll('.del-studio-pref-tag').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.getAttribute('data-index'), 10);
          if (!isNaN(idx) && idx >= 0 && idx < studioWorkingSkills.preferred.length) {
            studioWorkingSkills.preferred.splice(idx, 1);
            renderStudioSkills();
          }
        });
      });
    }

    updateStudioFeedPreview();
  }

  function updateStudioFeedPreview() {
    const titleEl = document.getElementById('jobStudioTitle');
    const deptEl = document.getElementById('jobStudioDept');
    const locEl = document.getElementById('jobStudioLocation');
    const minSalEl = document.getElementById('jobStudioMinSalary');
    const maxSalEl = document.getElementById('jobStudioMaxSalary');
    const expEl = document.getElementById('jobStudioExp');
    const eqEl = document.getElementById('jobStudioEquity');
    const descEl = document.getElementById('jobStudioDesc');

    const title = (titleEl && titleEl.value.trim()) || 'Senior Backend Engineer';
    const dept = (deptEl && deptEl.value.trim()) || 'Engineering & Platform';
    const loc = (locEl && locEl.value.trim()) || 'Bangalore, India (Hybrid)';
    const minSalary = (minSalEl && minSalEl.value) || '22';
    const maxSalary = (maxSalEl && maxSalEl.value) || '30';
    const exp = (expEl && expEl.value) || '2';
    const equity = (eqEl && eqEl.value) || '0.25';
    const desc = (descEl && descEl.value.trim()) || 'Describe role requirements, team scope, and technical responsibilities...';

    const pTitle = document.getElementById('studioPreviewTitle');
    const pDept = document.getElementById('studioPreviewDept');
    const pLoc = document.getElementById('studioPreviewLocation');
    const pSalary = document.getElementById('studioPreviewSalary');
    const pEquity = document.getElementById('studioPreviewEquity');
    const pExp = document.getElementById('studioPreviewExp');
    const pDesc = document.getElementById('studioPreviewDesc');
    const pSkills = document.getElementById('studioPreviewSkills');

    if (pTitle) pTitle.textContent = title;
    if (pDept) pDept.textContent = dept;
    if (pLoc) pLoc.textContent = loc;
    if (pSalary) pSalary.textContent = `💰 ${minSalary} - ${maxSalary} LPA`;
    if (pEquity) pEquity.textContent = `💎 ${equity}% ESOP`;
    if (pExp) pExp.textContent = `⏱ ${exp}+ Yrs Exp`;
    if (pDesc) pDesc.textContent = desc;

    if (pSkills) {
      pSkills.innerHTML = '';
      (studioWorkingSkills.mandatory || []).forEach(s => {
        const chip = document.createElement('span');
        chip.className = 'skill-chip chip-mandatory';
        chip.textContent = s;
        pSkills.appendChild(chip);
      });
      (studioWorkingSkills.preferred || []).forEach(s => {
        const chip = document.createElement('span');
        chip.className = 'skill-chip chip-preferred';
        chip.textContent = s;
        pSkills.appendChild(chip);
      });
    }
  }

  // ===========================================================================
  // RECRUITER WORKSPACE: CANDIDATE PIPELINE (R3 / M3)
  // ===========================================================================

  let pipelineFilterJobId = 'ALL';
  let pipelineActiveView = 'kanban';

  function initCandidatePipeline() {
    const filterSelect = document.getElementById('pipelineJobFilter');
    const toggleKanban = document.getElementById('toggleKanbanBtn');
    const toggleTable = document.getElementById('toggleTableBtn');

    populatePipelineJobFilter();

    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        pipelineFilterJobId = e.target.value;
        renderCandidatePipeline();
      });
    }

    if (toggleKanban && toggleTable) {
      toggleKanban.addEventListener('click', () => {
        pipelineActiveView = 'kanban';
        toggleKanban.classList.add('active');
        toggleTable.classList.remove('active');
        const kanbanEl = document.getElementById('pipelineKanbanView');
        const tableEl = document.getElementById('pipelineTableView');
        if (kanbanEl) kanbanEl.style.display = 'grid';
        if (tableEl) tableEl.style.display = 'none';
      });

      toggleTable.addEventListener('click', () => {
        pipelineActiveView = 'table';
        toggleTable.classList.add('active');
        toggleKanban.classList.remove('active');
        const kanbanEl = document.getElementById('pipelineKanbanView');
        const tableEl = document.getElementById('pipelineTableView');
        if (kanbanEl) kanbanEl.style.display = 'none';
        if (tableEl) tableEl.style.display = 'block';
      });
    }

    renderCandidatePipeline();
  }

  function populatePipelineJobFilter() {
    const filterSelect = document.getElementById('pipelineJobFilter');
    if (!filterSelect) return;
    filterSelect.innerHTML = '';

    const allOpt = document.createElement('option');
    allOpt.value = 'ALL';
    allOpt.textContent = 'All Requisitions';
    if (pipelineFilterJobId === 'ALL') allOpt.selected = true;
    filterSelect.appendChild(allOpt);

    (state.jobs || []).forEach(job => {
      const opt = document.createElement('option');
      opt.value = job.jobId;
      opt.textContent = `${job.title} (${job.jobId})`;
      if (job.jobId === pipelineFilterJobId) opt.selected = true;
      filterSelect.appendChild(opt);
    });
  }

  function renderCandidatePipeline() {
    const stages = ['Sourced', 'Applied', 'AssessmentPending', 'Interviewing', 'OfferExtended', 'Closed'];

    const filteredApps = (state.applications || []).filter(app => {
      if (pipelineFilterJobId !== 'ALL' && app.jobId !== pipelineFilterJobId) return false;
      return true;
    });

    const totalAppsBadge = document.getElementById('sidebar-total-apps');
    if (totalAppsBadge) totalAppsBadge.textContent = filteredApps.length;

    // 1. Render Kanban Columns
    stages.forEach(st => {
      const countEl = document.getElementById(`pipeline-count-${st}`);
      const sidebarCountEl = document.getElementById(`sidebar-count-${st}`);
      const cardsCont = document.getElementById(`pipeline-cards-${st}`);
      const inStage = filteredApps.filter(a => (a.kanbanStage || 'Applied') === st);

      if (countEl) countEl.textContent = inStage.length;
      if (sidebarCountEl) sidebarCountEl.textContent = inStage.length;
      if (!cardsCont) return;
      cardsCont.innerHTML = '';

      inStage.forEach(app => {
        const job = state.jobs.find(j => j.jobId === app.jobId) || state.job;
        const match = calculateCandidateJobMatch(app.rawResumeText, job, app);
        const score = match.deterministicScore;
        const recColor = score >= 85 ? 'score-high' : score >= 70 ? 'score-mid' : 'score-low';
        const avatar = (app.candidateName || 'Candidate').split(' ').map(n => n[0]).join('').substring(0, 2);

        const card = document.createElement('div');
        card.className = 'kanban-card app-panel app-elevated';
        card.setAttribute('data-appid', app.applicationId);

        card.innerHTML = `
          <div class="kanban-card-top">
            <div class="kanban-candidate-info">
              <div class="kanban-avatar user-avatar-circle">${avatar}</div>
              <div class="kanban-candidate-text">
                <div class="kanban-candidate-name">${app.candidateName}</div>
                <div class="kanban-candidate-role text-dim">${(job && job.title) || 'Senior Backend Engineer'}</div>
              </div>
            </div>
            <span class="kanban-score-pill ${recColor} badge">${score}%</span>
          </div>

          <div class="kanban-card-headline kanban-card-meta">${app.headline}</div>
          <div class="kanban-referral-indicator kanban-card-meta">🔗 ${(app.referralChain || 'Direct Organic').split('->')[0]}</div>

          <div class="kanban-stage-select-box" style="margin-top: 0.35rem;">
            <select class="kanban-stage-selector" data-appid="${app.applicationId}">
              ${stages.map(s => `<option value="${s}" ${s === st ? 'selected' : ''}>Move: ${s}</option>`).join('')}
            </select>
          </div>

          <div class="pipeline-card-actions">
            <button type="button" class="btn btn-xs btn-ghost btn-view-ai-report" data-appid="${app.applicationId}">📊 AI Report</button>
            <button type="button" class="btn btn-xs btn-violet btn-open-scorecard" data-appid="${app.applicationId}">📝 Scorecard</button>
          </div>
        `;

        cardsCont.appendChild(card);
      });
    });

    // 2. Render Table View
    const tableBody = document.getElementById('pipelineTableBody');
    if (tableBody) {
      tableBody.innerHTML = '';

      if (filteredApps.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding: 2rem;">No applicants found for this requisition filter.</td></tr>`;
      } else {
        filteredApps.forEach(app => {
          const job = state.jobs.find(j => j.jobId === app.jobId) || state.job;
          const match = calculateCandidateJobMatch(app.rawResumeText, job, app);
          const score = match.deterministicScore;
          const recColor = score >= 85 ? '#10b981' : score >= 70 ? '#06b6d4' : '#f43f5e';
          const avatar = (app.candidateName || 'Candidate').split(' ').map(n => n[0]).join('').substring(0, 2);

          const tr = document.createElement('tr');
          tr.setAttribute('data-appid', app.applicationId);
          tr.innerHTML = `
            <td>
              <div style="display: flex; align-items: center; gap: 0.6rem;">
                <div class="user-avatar-circle" style="width: 32px; height: 32px; font-size: 0.8rem;">${avatar}</div>
                <div>
                  <strong>${app.candidateName}</strong>
                  <div class="text-dim" style="font-size: 0.75rem;">${app.headline}</div>
                </div>
              </div>
            </td>
            <td><strong>${(job && job.title) || 'Senior Backend Engineer'}</strong></td>
            <td>
              <span class="badge" style="background: ${recColor}22; color: ${recColor}; font-weight: 700;">
                🎯 ${score}%
              </span>
            </td>
            <td>
              <span class="badge badge-subtle">${app.kanbanStage || 'Applied'}</span>
            </td>
            <td><span class="text-neon-violet font-mono" style="font-size: 0.8rem;">${(app.referralChain || 'Direct').split('->')[0]}</span></td>
            <td>
              <select class="kanban-stage-selector" data-appid="${app.applicationId}">
                ${stages.map(s => `<option value="${s}" ${s === (app.kanbanStage || 'Applied') ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </td>
            <td>
              <div style="display: flex; gap: 0.35rem;">
                <button type="button" class="btn btn-xs btn-ghost btn-view-ai-report" data-appid="${app.applicationId}">📊 AI Report</button>
                <button type="button" class="btn btn-xs btn-violet btn-open-scorecard" data-appid="${app.applicationId}">📝 Scorecard</button>
              </div>
            </td>
          `;
          tableBody.appendChild(tr);
        });
      }
    }

    // Attach event handlers across both Kanban and Table
    const rootEl = document.getElementById('recruiter-pipeline-view');
    if (rootEl) {
      rootEl.querySelectorAll('.kanban-stage-selector').forEach(sel => {
        sel.addEventListener('change', (e) => {
          const appId = sel.getAttribute('data-appid');
          const newStage = e.target.value;
          const targetApp = state.applications.find(a => a.applicationId === appId);
          if (targetApp) {
            targetApp.kanbanStage = newStage;
            updateKanbanView(); // sync legacy kanban
            renderCandidatePipeline();
            renderAppliedJobs(); // sync candidate view
            showToast(`Moved ${targetApp.candidateName} to ${newStage}`);
          }
        });
      });

      rootEl.querySelectorAll('.btn-view-ai-report').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const appId = btn.getAttribute('data-appid');
          if (appId && window.showAiEvaluationReport) {
            window.showAiEvaluationReport(appId);
          }
        });
      });

      rootEl.querySelectorAll('.btn-open-scorecard').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const appId = btn.getAttribute('data-appid');
          if (appId && window.openScorecardModal) {
            window.openScorecardModal(appId);
          }
        });
      });
    }
  }

  // ===========================================================================
  // MODALS: AI EVALUATION REPORT & INTERVIEW SCORECARD (R3 / M3)
  // ===========================================================================

  function initModals() {
    const closeReportBtn = document.getElementById('closeAiReportBtn');
    const dismissReportBtn = document.getElementById('dismissAiReportBtn');
    const closeScorecardBtn = document.getElementById('closeScorecardBtn');

    if (closeReportBtn) {
      closeReportBtn.addEventListener('click', () => {
        const modal = document.getElementById('aiReportModal');
        if (modal) {
          modal.classList.remove('active');
          modal.style.display = 'none';
        }
      });
    }

    if (dismissReportBtn) {
      dismissReportBtn.addEventListener('click', () => {
        const modal = document.getElementById('aiReportModal');
        if (modal) {
          modal.classList.remove('active');
          modal.style.display = 'none';
        }
      });
    }

    if (closeScorecardBtn) {
      closeScorecardBtn.addEventListener('click', () => {
        const modal = document.getElementById('scorecardModal');
        if (modal) {
          modal.classList.remove('active');
          modal.style.display = 'none';
        }
      });
    }

    // Attach slider value updates in scorecard modal
    const sliders = [
      { id: 'modalScoreSysDesign', valId: 'valModalSysDesign' },
      { id: 'modalScoreCoding', valId: 'valModalCoding' },
      { id: 'modalScoreProblem', valId: 'valModalProblem' },
      { id: 'modalScoreCulture', valId: 'valModalCulture' }
    ];

    sliders.forEach(({ id, valId }) => {
      const slider = document.getElementById(id);
      const valLabel = document.getElementById(valId);
      if (slider && valLabel) {
        slider.addEventListener('input', (e) => {
          valLabel.textContent = `${e.target.value} / 5`;
        });
      }
    });

    // Scorecard decision actions
    const offerBtn = document.getElementById('scorecardOfferBtn');
    const waitlistBtn = document.getElementById('scorecardWaitlistBtn');
    const rejectBtn = document.getElementById('scorecardRejectBtn');

    const handleDecision = (outcome, targetStage) => {
      const activeUser = state.currentUser;
      if (!activeUser || (activeUser.role !== 'RECRUITER_HR' && activeUser.role !== 'RECRUITER_ADMIN')) {
        showToast('Unauthorized: Only recruiters can submit scorecards or modify application stages.');
        return;
      }
      const appId = document.getElementById('scorecardAppId')?.value;
      const targetApp = state.applications.find(a => a.applicationId === appId);
      if (!targetApp) return;

      const job = state.jobs.find(j => j.jobId === targetApp.jobId) || state.job;
      const match = calculateCandidateJobMatch(targetApp.rawResumeText, job, targetApp);

      const reviewerEl = document.getElementById('modalReviewerName');
      const offeredCTCEl = document.getElementById('modalOfferedCTC');
      const notesEl = document.getElementById('modalDecisionNotes');

      const reviewer = (reviewerEl ? reviewerEl.value : 'Vikram Seth (VP Eng)').trim();
      const offeredCTC = parseFloat(offeredCTCEl ? offeredCTCEl.value : 24.0) || 24.0;
      const notes = (notesEl ? notesEl.value : '').trim();

      const sysEl = document.getElementById('modalScoreSysDesign');
      const codingEl = document.getElementById('modalScoreCoding');
      const probEl = document.getElementById('modalScoreProblem');
      const cultEl = document.getElementById('modalScoreCulture');

      const sys = parseInt(sysEl ? sysEl.value : 5, 10) || 5;
      const coding = parseInt(codingEl ? codingEl.value : 5, 10) || 5;
      const prob = parseInt(probEl ? probEl.value : 4, 10) || 4;
      const cult = parseInt(cultEl ? cultEl.value : 5, 10) || 5;
      const avg = parseFloat(((sys + coding + prob + cult) / 4).toFixed(1));

      targetApp.kanbanStage = targetStage;

      const newRecord = {
        applicationId: targetApp.applicationId,
        candidateName: targetApp.candidateName,
        decisionType: outcome,
        reviewer: reviewer,
        interviewNotes: notes,
        offeredCTC: outcome === 'SelectedForOffer' ? offeredCTC : null,
        equityOfferedPercent: outcome === 'SelectedForOffer' ? (job.equityOfferedPercent || 0.25) : null,
        score: match.deterministicScore,
        rubric: { sysDesign: sys, coding: coding, problem: prob, culture: cult, avg: avg },
        decidedAt: new Date().toISOString()
      };

      const existingIdx = state.decisions.findIndex(d => d.applicationId === targetApp.applicationId);
      if (existingIdx >= 0) {
        state.decisions[existingIdx] = newRecord;
      } else {
        state.decisions.unshift(newRecord);
      }

      // Refresh views
      updateKanbanView();
      renderCandidatePipeline();
      renderAppliedJobs();
      initAuditLedger();
      updateAuditStream();

      // Close modal
      const modal = document.getElementById('scorecardModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
      }

      const toastMsg = outcome === 'SelectedForOffer'
        ? `Offer Extended to ${targetApp.candidateName} for ₹${offeredCTC} LPA!`
        : `Decision recorded for ${targetApp.candidateName}: ${outcome}`;
      showToast(toastMsg);
    };

    if (offerBtn) {
      offerBtn.addEventListener('click', () => handleDecision('SelectedForOffer', 'OfferExtended'));
    }
    if (waitlistBtn) {
      waitlistBtn.addEventListener('click', () => handleDecision('HoldWaitlist', 'Interviewing'));
    }
    if (rejectBtn) {
      rejectBtn.addEventListener('click', () => handleDecision('Rejected', 'Closed'));
    }
  }

  function showAiEvaluationReport(appId) {
    const modal = document.getElementById('aiReportModal');
    const body = document.getElementById('aiReportModalBody');
    if (!modal || !body) return;

    const app = state.applications.find(a => a.applicationId === appId) || state.applications[0];
    if (!app) return;

    const job = state.jobs.find(j => j.jobId === app.jobId) || state.job;
    const match = calculateCandidateJobMatch(app.rawResumeText, job, app);
    const score = match.deterministicScore;
    const recColor = score >= 85 ? '#10b981' : score >= 70 ? '#06b6d4' : '#f43f5e';
    const avatar = (app.candidateName || 'Candidate').split(' ').map(n => n[0]).join('').substring(0, 2);
    const referralRoute = (app.referralChain || 'Direct Application').split('->')[0].trim();
    const expRequired = job.requiredExperienceYears || 2;
    const expDetected = match.detectedExpYears || 0;
    const expPercentage = Math.min(100, Math.round((expDetected / Math.max(1, expRequired)) * 100));

    body.innerHTML = `
      <div class="ai-briefing-stack">
        <!-- 1. Candidate Hero & Match Verdict Card -->
        <div class="ai-briefing-card ai-hero-card app-panel app-elevated">
          <div class="ai-hero-content">
            <div class="ai-hero-profile">
              <div class="user-avatar-circle ai-hero-avatar" style="width: 56px; height: 56px; min-width: 56px; font-size: 1.35rem;">
                ${avatar}
              </div>
              <div class="ai-hero-meta">
                <div class="ai-hero-name-row">
                  <h2 class="ai-candidate-name">${app.candidateName}</h2>
                  <span class="ai-candidate-stage-badge">${app.kanbanStage || 'Applied'}</span>
                </div>
                <div class="ai-candidate-headline text-muted">${app.headline || 'Software Engineering Professional'}</div>
                <div class="ai-meta-chips-row">
                  <span class="ai-meta-pill role-pill">
                    <span class="pill-label">Target Role:</span> <strong class="pill-value text-neon-cyan">${job.title}</strong>
                  </span>
                  <span class="ai-meta-pill referral-pill">
                    <span class="pill-label">Referral:</span> <strong class="pill-value text-neon-violet">${referralRoute}</strong>
                  </span>
                  <span class="ai-meta-pill comp-pill">
                    <span class="pill-label">Compensation:</span> <strong class="pill-value">₹${job.minSalaryLPA || 22} - ${job.maxSalaryLPA || 30} LPA</strong>
                  </span>
                </div>
              </div>
            </div>

            <div class="ai-hero-verdict-box">
              <div class="score-circle ai-score-gauge" style="--score-pct: ${score}; --score-color: ${recColor}; width: 88px; height: 88px;">
                <div class="score-circle-inner ai-score-gauge-inner" style="width: 74px; height: 74px;">
                  <span class="score-num font-mono" style="color: ${recColor}; font-size: 1.45rem;">${score}%</span>
                  <span class="score-sub">AI Match</span>
                </div>
              </div>
              <div class="ai-verdict-badge-wrapper" style="text-align: center; margin-top: 0.4rem;">
                <span class="badge ai-recommendation-badge" style="background: ${recColor}18; color: ${recColor}; border: 1px solid ${recColor}44; font-weight: 700;">
                  ${match.recommendation}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Deterministic 70/20/10 Requirement Grid Card -->
        <div class="ai-briefing-card ai-requirement-grid-card app-panel app-elevated">
          <div class="briefing-card-header">
            <div class="briefing-card-header-left">
              <span class="briefing-card-icon">🎯</span>
              <div>
                <h4 class="briefing-card-title">Deterministic 70/20/10 Requirement Grid</h4>
                <div class="briefing-card-subtitle">Objective criteria matching across mandatory capabilities, preferred tech, and industry tenure</div>
              </div>
            </div>
            <div class="briefing-card-header-badge">
              <span class="weight-total-pill font-mono">100% Deterministic Base</span>
            </div>
          </div>

          <div class="breakdown-grid ai-req-breakdown-grid">
            <!-- Sub-card 1: Mandatory Skills (70% Weight) -->
            <div class="breakdown-card ai-subcard ai-subcard-mandatory">
              <div class="flex-between ai-subcard-header">
                <div class="ai-subcard-title-group">
                  <span class="subcard-indicator mand-indicator"></span>
                  <strong>Mandatory Skills (70% Weight)</strong>
                </div>
                <span class="text-neon-cyan font-mono ai-subcard-score">${match.mandScore} / 70.0%</span>
              </div>
              <div class="tags-container ai-skills-tray" style="margin-top: 0.65rem;">
                ${match.mandMatched.map(s => `<span class="skill-chip chip-mandatory">✓ ${s}</span>`).join('')}
                ${match.mandMissing.map(s => `<span class="skill-chip chip-gap">✕ ${s}</span>`).join('')}
              </div>
            </div>

            <!-- Sub-card 2: Preferred Skills (20% Weight) -->
            <div class="breakdown-card ai-subcard ai-subcard-preferred">
              <div class="flex-between ai-subcard-header">
                <div class="ai-subcard-title-group">
                  <span class="subcard-indicator pref-indicator"></span>
                  <strong>Preferred Skills (20% Weight)</strong>
                </div>
                <span class="text-neon-violet font-mono ai-subcard-score">${match.prefScore} / 20.0%</span>
              </div>
              <div class="tags-container ai-skills-tray" style="margin-top: 0.65rem;">
                ${match.prefMatched.map(s => `<span class="skill-chip chip-preferred">✓ ${s}</span>`).join('')}
                ${match.prefMissing.length === 0 ? '<span class="text-dim empty-tray-note" style="font-size: 0.8rem;">None missing</span>' : match.prefMissing.map(s => `<span class="skill-chip chip-gap">✕ ${s}</span>`).join('')}
              </div>
            </div>

            <!-- Sub-card 3: Experience Alignment (10% Weight) -->
            <div class="breakdown-card ai-subcard ai-subcard-experience">
              <div class="flex-between ai-subcard-header">
                <div class="ai-subcard-title-group">
                  <span class="subcard-indicator exp-indicator"></span>
                  <strong>Experience Alignment (10% Weight)</strong>
                </div>
                <span class="text-neon-emerald font-mono ai-subcard-score">${match.expScore} / 10.0%</span>
              </div>
              <div class="ai-exp-details" style="font-size: 0.85rem; margin-top: 0.65rem;">
                <div class="ai-exp-row">
                  Detected: <strong>${match.detectedExpYears} Years</strong> (Required: ${job.requiredExperienceYears || 2} Years)
                </div>
                <div class="ai-exp-meter-track" style="margin-top: 0.5rem;">
                  <div class="ai-exp-meter-fill" style="width: ${expPercentage}%;"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. OmniTalent 4-Factor Hybrid Radar Scoring Card -->
        <div class="ai-briefing-card ai-radar-scoring-card app-panel app-elevated">
          <div class="briefing-card-header">
            <div class="briefing-card-header-left">
              <span class="briefing-card-icon">📡</span>
              <div>
                <h4 class="briefing-card-title">OmniTalent 4-Factor Hybrid Radar Scoring</h4>
                <div class="briefing-card-subtitle">Algorithmic fusion weighting semantic embeddings, exact keyword salience, social network trust, and search intent</div>
              </div>
            </div>
            <div class="briefing-card-header-badge">
              <span class="radar-tag-pill font-mono">Real-Time Synthesis</span>
            </div>
          </div>

          <div class="radar-factor-bars ai-radar-factor-bars">
            <div class="factor-bar-row">
              <div class="factor-bar-label">
                <span class="factor-title">Semantic Similarity (40% Weight)</span>
                <strong class="font-mono text-neon-cyan factor-val">${match.hybridRadar.semanticSim}%</strong>
              </div>
              <div class="factor-track">
                <div class="factor-fill" style="width: ${match.hybridRadar.semanticSim}%; background: var(--primary-cyan);"></div>
              </div>
            </div>

            <div class="factor-bar-row">
              <div class="factor-bar-label">
                <span class="factor-title">Keyword BM25 / Hard Skills (30% Weight)</span>
                <strong class="font-mono text-neon-violet factor-val">${match.hybridRadar.bm25Score}%</strong>
              </div>
              <div class="factor-track">
                <div class="factor-fill" style="width: ${match.hybridRadar.bm25Score}%; background: var(--primary-violet);"></div>
              </div>
            </div>

            <div class="factor-bar-row">
              <div class="factor-bar-label">
                <span class="factor-title">Social Graph Trust & Proximity (15% Weight)</span>
                <strong class="font-mono text-neon-emerald factor-val">${match.hybridRadar.graphTrust}%</strong>
              </div>
              <div class="factor-track">
                <div class="factor-fill" style="width: ${match.hybridRadar.graphTrust}%; background: var(--primary-emerald);"></div>
              </div>
            </div>

            <div class="factor-bar-row">
              <div class="factor-bar-label">
                <span class="factor-title">Intent & Activity Velocity (15% Weight)</span>
                <strong class="font-mono text-neon-amber factor-val">${match.hybridRadar.intentScore}%</strong>
              </div>
              <div class="factor-track">
                <div class="factor-fill" style="width: ${match.hybridRadar.intentScore}%; background: var(--primary-amber);"></div>
              </div>
            </div>
          </div>

          <div class="composite-formula-pill">
            <div class="composite-pill-left">
              <span class="composite-pill-label">Composite Hybrid Score:</span>
              <strong class="font-mono text-neon-cyan composite-pill-value">${match.compositeScore || match.hybridRadar.compositeScore}%</strong>
            </div>
            <span class="composite-formula-math text-dim font-mono" style="font-size: 0.8rem;">Formula: 0.40(Sem) + 0.30(BM25) + 0.15(Graph) + 0.15(Intent)</span>
          </div>
        </div>

        <!-- 4. Qualitative Intelligence & Interview Playbook Card -->
        <div class="ai-briefing-card ai-qualitative-card app-panel app-elevated">
          <div class="briefing-card-header">
            <div class="briefing-card-header-left">
              <span class="briefing-card-icon">⚡</span>
              <div>
                <h4 class="briefing-card-title">Qualitative Intelligence & Interview Playbook</h4>
                <div class="briefing-card-subtitle">Synthesized candidate profile strengths, potential technical blindspots, and tailored interview probes</div>
              </div>
            </div>
          </div>

          <div class="grid-2col-nested ai-qualitative-grid">
            <div class="ai-qualitative-col ai-strengths-col">
              <div class="qualitative-heading-row" style="display: flex; align-items: center; gap: 0.45rem;">
                <span class="qualitative-indicator strength-indicator"></span>
                <strong class="text-neon-emerald">Key Strengths:</strong>
              </div>
              <ul class="ai-bullet-list strengths-list" style="margin-top: 0.4rem; padding-left: 1.25rem; font-size: 0.85rem; line-height: 1.6;">
                ${(match.strengths || []).map(s => `<li>${s}</li>`).join('')}
              </ul>
            </div>
            <div class="ai-qualitative-col ai-gaps-col">
              <div class="qualitative-heading-row" style="display: flex; align-items: center; gap: 0.45rem;">
                <span class="qualitative-indicator gap-indicator"></span>
                <strong class="text-neon-rose">Identified Skill Gaps:</strong>
              </div>
              <ul class="ai-bullet-list gaps-list" style="margin-top: 0.4rem; padding-left: 1.25rem; font-size: 0.85rem; line-height: 1.6;">
                ${(match.gaps || []).length === 0 ? '<li>None (100% Skill Coverage)</li>' : match.gaps.map(g => `<li>${g}</li>`).join('')}
              </ul>
            </div>
          </div>

          <div class="suggested-questions-box ai-interview-questions-box" style="margin-top: 1.25rem;">
            <div class="questions-box-header" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
              <span class="questions-icon">💡</span>
              <strong class="text-neon-violet">Tailored Technical Interview Questions:</strong>
            </div>
            <ol class="ai-numbered-questions-list" style="margin: 0; padding-left: 1.35rem; font-size: 0.88rem; line-height: 1.6;">
              <li class="question-item" style="margin-bottom: 0.65rem;">
                <div class="question-text"><strong>Explain your experience architecting high-throughput Kafka partitions and handling consumer lag.</strong></div>
                <div class="question-hint text-dim" style="font-size: 0.78rem; margin-top: 0.15rem;">Focus: Evaluates distributed streaming depth, partition rebalancing, and message delivery guarantees.</div>
              </li>
              <li class="question-item" style="margin-bottom: 0.65rem;">
                <div class="question-text"><strong>How do you handle schema evolution and backward compatibility in microservices?</strong></div>
                <div class="question-hint text-dim" style="font-size: 0.78rem; margin-top: 0.15rem;">Focus: Tests contract testing, Avro/Protobuf versioning, and zero-downtime database migrations.</div>
              </li>
              <li class="question-item" style="margin-bottom: 0.65rem;">
                <div class="question-text"><strong>Walk through an incident where you diagnosed a distributed latency bottleneck.</strong></div>
                <div class="question-hint text-dim" style="font-size: 0.78rem; margin-top: 0.15rem;">Focus: Examines observability (distributed tracing, APM), connection pools, and root cause methodology.</div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    `;

    const openScorecardBtn = document.getElementById('reportOpenScorecardBtn');
    if (openScorecardBtn) {
      openScorecardBtn.onclick = () => {
        modal.classList.remove('active');
        modal.style.display = 'none';
        window.openScorecardModal(app.applicationId);
      };
      openScorecardBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        modal.style.display = 'none';
        window.openScorecardModal(app.applicationId);
      });
    }

    modal.classList.add('active');
    modal.style.display = 'flex';
  };

  function openScorecardModal(appId) {
    const modal = document.getElementById('scorecardModal');
    if (!modal) return;

    const app = state.applications.find(a => a.applicationId === appId) || state.applications[0];
    if (!app) return;

    const job = state.jobs.find(j => j.jobId === app.jobId) || state.job;

    const idInput = document.getElementById('scorecardAppId');
    const nameEl = document.getElementById('scorecardCandName');
    const jobEl = document.getElementById('scorecardCandJob');
    const reviewerInput = document.getElementById('modalReviewerName');
    const ctcInput = document.getElementById('modalOfferedCTC');

    if (idInput) idInput.value = app.applicationId;
    if (nameEl) nameEl.textContent = app.candidateName;
    if (jobEl) jobEl.textContent = job.title;

    if (reviewerInput) {
      reviewerInput.value = state.currentUser?.name
        ? `${state.currentUser.name} (${formatRoleName(state.currentUser.role)})`
        : 'Vikram Seth (VP Eng)';
    }

    if (ctcInput) {
      const avgSalary = job.minSalaryLPA && job.maxSalaryLPA ? ((job.minSalaryLPA + job.maxSalaryLPA) / 2).toFixed(1) : 24.0;
      ctcInput.value = avgSalary;
    }

    // Reset sliders
    const s1 = document.getElementById('modalScoreSysDesign');
    const s2 = document.getElementById('modalScoreCoding');
    const s3 = document.getElementById('modalScoreProblem');
    const s4 = document.getElementById('modalScoreCulture');

    if (s1) { s1.value = 5; document.getElementById('valModalSysDesign').textContent = '5 / 5'; }
    if (s2) { s2.value = 5; document.getElementById('valModalCoding').textContent = '5 / 5'; }
    if (s3) { s3.value = 4; document.getElementById('valModalProblem').textContent = '4 / 5'; }
    if (s4) { s4.value = 5; document.getElementById('valModalCulture').textContent = '5 / 5'; }

    modal.classList.add('active');
    modal.style.display = 'flex';
  };

  // ===========================================================================
  // ADMIN MANAGEMENT CONTROLS (R4 / M4)
  // ===========================================================================

  function isElementChecked(elOrId) {
    const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
    if (!el) return false;
    if (typeof el.checked === 'boolean') return el.checked;
    const attr = el.getAttribute ? el.getAttribute('checked') : null;
    return attr !== null && attr !== 'false';
  }

  function setElementChecked(elOrId, val) {
    const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
    if (!el) return;
    el.checked = !!val;
    if (el.setAttribute) {
      if (val) el.setAttribute('checked', 'checked');
      else if (el.removeAttribute) el.removeAttribute('checked');
    }
  }

  function applyThemeColor(color) {
    if (!color) return;
    state.organization.themeColor = color;
    if (typeof document !== 'undefined' && document.documentElement && document.documentElement.style) {
      if (typeof document.documentElement.style.setProperty === 'function') {
        document.documentElement.style.setProperty('--brand-primary', color);
        document.documentElement.style.setProperty('--accent-glow', `${color}4d`);
      } else {
        document.documentElement.style['--brand-primary'] = color;
        document.documentElement.style['--accent-glow'] = `${color}4d`;
      }
    }
    const colorInput = document.getElementById('adminThemeColor');
    if (colorInput) colorInput.value = color;
    const colorValDisplay = document.getElementById('adminThemeColorVal');
    if (colorValDisplay) colorValDisplay.textContent = color;
    updateBrandingPreview();
  }

  function updateBrandingPreview() {
    const portalName = document.getElementById('adminPortalName')?.value || state.organization.name || 'Apex Cloud Systems';
    const tagline = document.getElementById('adminPortalTagline')?.value || state.organization.tagline || 'ATS + Social Network Fusion Platform';
    const logoText = document.getElementById('adminLogoText')?.value || state.organization.logoText || 'AC';
    const color = document.getElementById('adminThemeColor')?.value || state.organization.themeColor || '#8b5cf6';

    const titleEl = document.getElementById('previewPortalTitle');
    if (titleEl) titleEl.textContent = portalName;
    const taglineEl = document.getElementById('previewPortalTagline');
    if (taglineEl) taglineEl.textContent = tagline;

    const logoEl = document.getElementById('previewLogoIcon');
    if (logoEl) {
      logoEl.textContent = logoText;
      if (logoEl.style) {
        logoEl.style.backgroundColor = color;
        logoEl.style.borderColor = color;
      }
    }

    const bannerEl = document.getElementById('adminPreviewBanner');
    if (bannerEl && bannerEl.style) {
      bannerEl.style.background = `linear-gradient(135deg, ${color} 0%, rgba(15, 23, 42, 0.9) 100%)`;
    }

    const pillEl = document.getElementById('previewAccentPill');
    if (pillEl && pillEl.style) {
      pillEl.style.color = color;
      pillEl.style.borderColor = color;
    }

    const cardEl = document.getElementById('adminBrandingPreview');
    if (cardEl && cardEl.style) {
      cardEl.style.borderColor = `${color}4d`;
    }
  }

  function updateCutoffTriageSimulation(cutoffVal) {
    const cutoff = parseInt(cutoffVal !== undefined ? cutoffVal : (document.getElementById('adminCutoffSlider')?.value || state.organization.minimumShortlistScore || 75), 10);
    
    const badge = document.getElementById('adminCutoffBadge');
    if (badge) badge.textContent = `${cutoff}%`;

    let qualifiedCount = 0;
    let screenedCount = 0;

    const scored = (state.applications || []).map(app => {
      const job = (state.jobs || []).find(j => j.jobId === app.jobId) || state.job;
      const match = calculateCandidateJobMatch(app.rawResumeText, job, app);
      const score = match.deterministicScore;
      const isPass = score >= cutoff;
      if (isPass) qualifiedCount++;
      else screenedCount++;
      return { app, job, score, isPass };
    });

    scored.sort((a, b) => b.score - a.score);

    const qualEl = document.getElementById('adminQualifiedCount');
    if (qualEl) qualEl.textContent = String(qualifiedCount);
    const scrEl = document.getElementById('adminScreenedCount');
    if (scrEl) scrEl.textContent = String(screenedCount);

    const triageList = document.getElementById('adminTriageList');
    if (triageList) {
      triageList.innerHTML = '';
      scored.forEach(item => {
        const row = document.createElement('div');
        row.className = `triage-candidate-row ${item.isPass ? 'triage-pass' : 'triage-fail'}`;
        row.setAttribute('data-appid', item.app.applicationId);
        row.setAttribute('data-score', String(item.score));
        row.setAttribute('data-status', item.isPass ? 'PASS' : 'FAIL');

        const avatarInitials = (item.app.candidateName || 'Candidate').split(' ').map(n => n[0]).join('').substring(0, 2);
        const statusLabel = item.isPass ? '✓ Qualified (Pass)' : '✕ Below Cutoff (Screened Out)';
        const statusClass = item.isPass ? 'triage-status-pill pass' : 'triage-status-pill fail';

        row.innerHTML = `
          <div class="triage-cand-info">
            <div class="triage-avatar">${avatarInitials}</div>
            <div>
              <div class="triage-name"><strong>${item.app.candidateName}</strong></div>
              <div class="triage-headline text-muted">${item.app.headline || item.job.title}</div>
            </div>
          </div>
          <div class="triage-score-box">
            <span class="triage-score-pct text-neon-${item.isPass ? 'emerald' : 'rose'}">${item.score}% Match</span>
          </div>
          <div class="triage-status-box">
            <span class="${statusClass}">${statusLabel}</span>
          </div>
        `;
        triageList.appendChild(row);
      });
    }
  }

  function renderAdminControls() {
    const org = state.organization;
    if (!org) return;

    const nameInput = document.getElementById('adminPortalName');
    if (nameInput) nameInput.value = org.name || 'Apex Cloud Systems';

    const tagInput = document.getElementById('adminPortalTagline');
    if (tagInput) tagInput.value = org.tagline || 'ATS + Social Network Fusion Platform';

    const logoInput = document.getElementById('adminLogoText');
    if (logoInput) logoInput.value = org.logoText || 'AC';

    const colorInput = document.getElementById('adminThemeColor');
    if (colorInput) colorInput.value = org.themeColor || '#8b5cf6';

    const colorValDisplay = document.getElementById('adminThemeColorVal');
    if (colorValDisplay) colorValDisplay.textContent = org.themeColor || '#8b5cf6';

    const slider = document.getElementById('adminCutoffSlider');
    if (slider) slider.value = org.minimumShortlistScore || 75;

    const badge = document.getElementById('adminCutoffBadge');
    if (badge) badge.textContent = `${org.minimumShortlistScore || 75}%`;

    const subInput = document.getElementById('adminSubdomain');
    if (subInput) subInput.value = org.subdomain || 'apexcloud';

    const fullDomain = document.getElementById('adminFullDomain');
    if (fullDomain) fullDomain.textContent = `https://${org.subdomain || 'apexcloud'}.hireflow.ai`;

    const typeSelect = document.getElementById('adminTenantType');
    if (typeSelect) typeSelect.value = org.type || 'COMPANY';

    const locInput = document.getElementById('adminOrgLocation');
    if (locInput) locInput.value = org.location || 'Bangalore, India (Global Remote)';

    const indInput = document.getElementById('adminOrgIndustry');
    if (indInput) indInput.value = org.industry || 'Cloud Infrastructure & Distributed Systems';

    if (org.policies) {
      setElementChecked('toggleGdprCompliance', org.policies.gdpr !== false);
      setElementChecked('toggleBlindHiring', !!org.policies.blindHiring);
      setElementChecked('toggleAutoKnockout', org.policies.autoKnockout !== false);
      setElementChecked('toggleGraphSync', org.policies.graphSync !== false);
    }

    updateBrandingPreview();
    updateCutoffTriageSimulation(org.minimumShortlistScore || 75);
  }

  function initAdminControls() {
    const portalName = document.getElementById('adminPortalName');
    const portalTagline = document.getElementById('adminPortalTagline');
    const logoText = document.getElementById('adminLogoText');
    const themeColor = document.getElementById('adminThemeColor');
    const saveBrandingBtn = document.getElementById('saveBrandingBtn');
    const cutoffSlider = document.getElementById('adminCutoffSlider');
    const saveCutoffBtn = document.getElementById('saveCutoffBtn');
    const subdomainInput = document.getElementById('adminSubdomain');
    const saveTenantBtn = document.getElementById('saveTenantBtn');

    if (portalName) portalName.addEventListener('input', updateBrandingPreview);
    if (portalTagline) portalTagline.addEventListener('input', updateBrandingPreview);
    if (logoText) logoText.addEventListener('input', updateBrandingPreview);

    if (themeColor) {
      themeColor.addEventListener('input', (e) => {
        applyThemeColor(e.target.value);
      });
      themeColor.addEventListener('change', (e) => {
        applyThemeColor(e.target.value);
      });
    }

    document.querySelectorAll('.btn-theme-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        const color = btn.getAttribute('data-color') || btn.dataset?.color;
        if (color) applyThemeColor(color);
      });
    });

    if (saveBrandingBtn) {
      saveBrandingBtn.addEventListener('click', () => {
        const nameVal = (document.getElementById('adminPortalName')?.value || 'Apex Cloud Systems').trim();
        const tagVal = (document.getElementById('adminPortalTagline')?.value || '').trim();
        const logoVal = (document.getElementById('adminLogoText')?.value || 'AC').trim();
        const colorVal = document.getElementById('adminThemeColor')?.value || '#8b5cf6';

        state.organization.name = nameVal;
        state.organization.tagline = tagVal;
        state.organization.logoText = logoVal;
        state.organization.themeColor = colorVal;

        const logoTitle = document.querySelector('.logo-title');
        if (logoTitle) {
          logoTitle.innerHTML = `${nameVal.toUpperCase()} <span class="logo-badge">OMNITALENT</span>`;
        }
        const logoSub = document.querySelector('.logo-sub');
        if (logoSub) {
          logoSub.textContent = tagVal;
        }

        const avatar = document.getElementById('headerUserAvatar');
        if (avatar && state.currentUser?.role === 'RECRUITER_ADMIN') {
          avatar.textContent = logoVal;
        }

        applyThemeColor(colorVal);
        showToast(`Portal branding saved for ${nameVal}!`);
      });
    }

    if (cutoffSlider) {
      cutoffSlider.addEventListener('input', (e) => {
        updateCutoffTriageSimulation(e.target.value);
      });
      cutoffSlider.addEventListener('change', (e) => {
        updateCutoffTriageSimulation(e.target.value);
      });
    }

    if (saveCutoffBtn) {
      saveCutoffBtn.addEventListener('click', () => {
        const sliderVal = parseInt(document.getElementById('adminCutoffSlider')?.value || 75, 10);
        state.organization.minimumShortlistScore = sliderVal;

        // Sync legacy elements if present
        const orgMinScore = document.getElementById('orgMinScore');
        if (orgMinScore) orgMinScore.value = sliderVal;
        const orgMinScoreVal = document.getElementById('orgMinScoreVal');
        if (orgMinScoreVal) orgMinScoreVal.textContent = sliderVal + '%';
        const prevCutoff = document.getElementById('prevCutoff');
        if (prevCutoff) prevCutoff.textContent = sliderVal + '%';
        const activeCutoffDisplay = document.getElementById('activeCutoffDisplay');
        if (activeCutoffDisplay) activeCutoffDisplay.textContent = sliderVal + '% Match';

        refreshLeaderboard();
        showToast(`Auto-shortlist qualification cutoff updated to ${sliderVal}%!`);
      });
    }

    if (subdomainInput) {
      subdomainInput.addEventListener('input', (e) => {
        const val = (e.target.value || '').trim();
        const fullDomain = document.getElementById('adminFullDomain');
        if (fullDomain) {
          fullDomain.textContent = `https://${val || 'apexcloud'}.hireflow.ai`;
        }
      });
    }

    if (saveTenantBtn) {
      saveTenantBtn.addEventListener('click', () => {
        const subVal = (document.getElementById('adminSubdomain')?.value || 'apexcloud').trim();
        const typeVal = document.getElementById('adminTenantType')?.value || 'COMPANY';
        const locVal = (document.getElementById('adminOrgLocation')?.value || '').trim();
        const indVal = (document.getElementById('adminOrgIndustry')?.value || '').trim();

        state.organization.subdomain = subVal;
        state.organization.customSubdomain = `${subVal}.hireflow.ai`;
        state.organization.type = typeVal;
        state.organization.location = locVal;
        state.organization.industry = indVal;

        state.organization.policies = {
          gdpr: isElementChecked('toggleGdprCompliance'),
          blindHiring: isElementChecked('toggleBlindHiring'),
          autoKnockout: isElementChecked('toggleAutoKnockout'),
          graphSync: isElementChecked('toggleGraphSync')
        };

        const tenantSubdomain = document.getElementById('tenantSubdomain');
        if (tenantSubdomain) {
          tenantSubdomain.textContent = `${subVal}.hireflow.ai`;
        }

        const fullDomain = document.getElementById('adminFullDomain');
        if (fullDomain) {
          fullDomain.textContent = `https://${subVal}.hireflow.ai`;
        }

        showToast(`Tenant configuration updated for ${subVal}.hireflow.ai!`);
      });
    }

    renderAdminControls();
  }

  // ===========================================================================
  // HIREFLOW AI ENGINE & UNIFIED APPLICATION CONTROLLER
  // ===========================================================================

  const HireFlowAIEngine = {
    evaluate(candidate, job, orgConfig) {
      if (!candidate || !job) {
        return {
          overallScore: 0,
          skillScore: 0,
          expScore: 0,
          domainScore: 0,
          matchedSkills: [],
          missingSkills: [],
          matchedKeywords: [],
          recommendation: 'Pending Data',
          rationale: 'Insufficient job or candidate data.'
        };
      }
      const weights = orgConfig?.aiWeights || { skills: 55, experience: 30, domain: 15 };
      const totalWeight = (weights.skills + weights.experience + weights.domain) || 100;

      const reqSkills = (job.requiredSkills || job.mandatorySkills || []).map(s => String(s).trim()).filter(Boolean);
      const candSkillsNorm = (candidate.skills || []).map(s => String(s).toLowerCase().trim());
      const resumeCorpus = [
        candidate.headline || '',
        candidate.education || '',
        candidate.resumeText || candidate.rawResumeText || '',
        ...(candidate.skills || [])
      ].join(' ').toLowerCase();

      const matchedSkills = [];
      const missingSkills = [];
      reqSkills.forEach(reqSkill => {
        const reqLower = reqSkill.toLowerCase();
        const isMatched = candSkillsNorm.some(cs => cs === reqLower || cs.includes(reqLower) || reqLower.includes(cs)) ||
                          resumeCorpus.includes(reqLower);
        if (isMatched) {
          matchedSkills.push(reqSkill);
        } else {
          missingSkills.push(reqSkill);
        }
      });

      const skillScore = reqSkills.length > 0
        ? Math.round((matchedSkills.length / reqSkills.length) * 100)
        : 85;

      const minExp = Number(job.minExperience || job.requiredExperienceYears) || 1;
      const candExp = Number(candidate.yearsExperience || candidate.experienceYears) || 0;
      let expScore = 0;
      if (candExp >= minExp) {
        const bonus = Math.min(12, (candExp - minExp) * 3);
        expScore = Math.min(100, 88 + bonus);
      } else {
        expScore = Math.max(25, Math.round((candExp / minExp) * 85));
      }

      const domainKeywords = (job.domainKeywords || job.preferredSkills || []).map(k => String(k).trim()).filter(Boolean);
      const matchedKeywords = [];
      domainKeywords.forEach(kw => {
        if (resumeCorpus.includes(kw.toLowerCase())) {
          matchedKeywords.push(kw);
        }
      });
      let domainScore = domainKeywords.length > 0
        ? Math.round((matchedKeywords.length / domainKeywords.length) * 100)
        : 80;
      if (/m\.s\.|phd|master|stanford|mit|berkeley|iit|b\.tech|computer science/i.test(candidate.education || '')) {
        domainScore = Math.min(100, domainScore + 15);
      }

      const rawOverall = ((skillScore * weights.skills) + (expScore * weights.experience) + (domainScore * weights.domain)) / totalWeight;
      const overallScore = Math.max(15, Math.min(99, Math.round(rawOverall)));

      let recommendation = 'Proceed with Screening';
      let rationale = 'Demonstrates baseline capability. Calibrate across system design rubric.';
      if (overallScore >= 90) {
        recommendation = 'Strong Hire (Fast-Track)';
        rationale = 'Top percentile candidate with exceptional skill overlap and relevant architecture depth.';
      } else if (overallScore >= 78) {
        recommendation = 'Recommend for Interview';
        rationale = 'Meets core technical qualifications. Deep-dive into problem-solving and domain fundamentals.';
      } else if (overallScore < 60) {
        recommendation = 'Consider for Junior Role';
        rationale = 'Notable experience or skill gaps relative to senior baseline. Archive for future alignment.';
      }

      return {
        overallScore,
        skillScore,
        expScore,
        domainScore,
        matchedSkills,
        missingSkills,
        matchedKeywords,
        recommendation,
        rationale
      };
    }
  };

  const HireFlowApp = {
    STORAGE_KEY: 'hireflow_enterprise_db_v2',
    SESSION_KEY: 'hireflow_active_auth_session_v2',
    get state() {
      return state;
    },
    ui: {
      isAuthenticated: false,
      gatewaySelectedRole: 'recruiter',
      activeWorkspace: 'recruiter',
      recruiterView: 'triage',
      selectedJobFilter: 'ALL',
      selectedStageFilter: 'ALL',
      recruiterSearch: '',
      selectedCandidateId: 'APP-1B4D7E',
      trackedCandidateId: 'APP-1B4D7E',
      theme: 'dark'
    },
    getDemoPersonas() {
      return {
        candidate: {
          key: 'candidate',
          name: 'Arjun Mehta',
          email: 'arjun.mehta@candidate.io',
          role: 'Candidate',
          badge: 'USER / CANDIDATE',
          title: 'Senior Candidate • Applicant Portal',
          initials: 'AM',
          workspace: 'candidate'
        },
        recruiter: {
          key: 'recruiter',
          name: 'Sarah Lin',
          email: 'sarah.lin@omnitalent.io',
          role: 'Recruiter',
          badge: 'RECRUITER',
          title: 'Principal Technical Recruiter',
          initials: 'SL',
          workspace: 'recruiter'
        },
        admin: {
          key: 'admin',
          name: 'K R Divyansh',
          email: 'divyansh.kr@omnitalent.io',
          role: 'Admin',
          badge: 'PLATFORM ADMIN',
          title: 'Tenant Platform Admin',
          initials: 'KD',
          workspace: 'admin'
        }
      };
    },
    init() {
      this.syncWithBackendAPI();
      this.renderAll();
    },
    showAuthGateway(defaultRoleKey = 'recruiter') {
      const gw = document.getElementById('authGateway') || document.getElementById('auth-gateway-screen');
      if (gw) {
        gw.classList.add('active');
        gw.style.display = 'flex';
      }
      this.selectGatewayRole(defaultRoleKey);
    },
    hideAuthGateway() {
      const gw = document.getElementById('authGateway') || document.getElementById('auth-gateway-screen');
      if (gw) {
        gw.classList.remove('active');
        gw.style.display = 'none';
      }
    },
    selectGatewayRole(roleKey) {
      this.ui.gatewaySelectedRole = roleKey;
      ['candidate', 'recruiter', 'admin'].forEach(r => {
        const card = document.getElementById(`gateway-card-${r}`) || document.getElementById(`roleCard${r.charAt(0).toUpperCase() + r.slice(1)}`);
        if (card) {
          card.classList.toggle('border-indigo-500', r === roleKey);
        }
      });
    },
    quickLaunchRole(roleKey) {
      const roleMapping = {
        candidate: { role: 'CANDIDATE', preset: 'aarav' },
        recruiter: { role: 'RECRUITER_HR', preset: 'vikram' },
        admin: { role: 'RECRUITER_ADMIN', preset: 'admin' }
      };
      const mapping = roleMapping[roleKey] || roleMapping.recruiter;
      hireflowAuth.loginAs(mapping.role, mapping.preset);
      this.ui.isAuthenticated = true;
      this.ui.activeWorkspace = roleKey;
      this.hideAuthGateway();
      this.notify(`Quick Launched as ${roleKey.charAt(0).toUpperCase() + roleKey.slice(1)}`, 'success');
    },
    togglePasswordVisibility() {
      const pwdInput = document.getElementById('gateway-password-input');
      const icon = document.getElementById('gateway-pwd-icon');
      if (pwdInput) {
        const isPwd = pwdInput.type === 'password';
        pwdInput.type = isPwd ? 'text' : 'password';
        if (icon) {
          icon.className = isPwd ? 'ph ph-eye-slash text-sm' : 'ph ph-eye text-sm';
        }
      }
    },
    signOut() {
      hireflowAuth.logout();
      this.ui.isAuthenticated = false;
      this.showAuthGateway();
      this.notify('Signed out successfully', 'info');
    },
    toggleTheme() {
      toggleTheme();
    },
    setBrandAccent(primaryHex, hoverHex) {
      applyThemeColor(primaryHex);
    },
    getCandidateFacingStatus(stage) {
      return getCandidateFacingStatus(stage);
    },
    switchWorkspace(workspace) {
      if (state.currentUser?.role === 'CANDIDATE' && workspace !== 'candidate') {
        showToast('Recruiter and Admin workspaces are restricted to authorized personnel');
        return;
      }
      this.ui.activeWorkspace = workspace;
      ['recruiter', 'candidate', 'admin'].forEach(ws => {
        const el = document.getElementById(`workspace-${ws}`);
        const btn = document.getElementById(`ws-btn-${ws}`);
        if (el) el.classList.toggle('hidden', ws !== workspace);
        if (btn) {
          if (ws === workspace) {
            btn.classList.add('brand-bg', 'shadow-sm');
            btn.classList.remove('text-slate-400');
          } else {
            btn.classList.remove('brand-bg', 'shadow-sm');
            btn.classList.add('text-slate-400');
          }
        }
      });

      const ribbon = document.getElementById('workflow-ribbon-section');
      if (ribbon) {
        ribbon.classList.toggle('hidden', workspace === 'candidate' || state.currentUser?.role === 'CANDIDATE');
      }

      const recruiterNavs = document.querySelectorAll('nav[aria-label="Recruiter Views"]');
      recruiterNavs.forEach(nav => {
        nav.classList.toggle('hidden', workspace === 'candidate' || state.currentUser?.role === 'CANDIDATE');
      });

      const viewMap = {
        candidate: 'candidate-jobs-view',
        recruiter: 'recruiter-pipeline-view',
        admin: 'admin-view'
      };
      if (viewMap[workspace]) {
        switchMainTab(viewMap[workspace]);
      }
    },
    setRecruiterView(view) {
      this.ui.recruiterView = view;
      ['triage', 'kanban', 'matrix', 'jobs', 'analytics'].forEach(v => {
        const btn = document.getElementById(`rec-view-${v}`);
        if (btn) btn.classList.toggle('brand-soft', v === view);
        const pane = document.getElementById(`recruiter-subview-${v}`);
        if (pane) pane.classList.toggle('hidden', v !== view);
      });
    },
    jumpToWorkflowStep(stepNumber) {
      const stepMap = {
        1: { tab: 'admin-view', ws: 'admin' },
        2: { tab: 'recruiter-studio-view', ws: 'recruiter' },
        3: { tab: 'candidate-jobs-view', ws: 'candidate' },
        4: { tab: 'recruiter-pipeline-view', ws: 'recruiter' },
        5: { tab: 'recruiter-pipeline-view', ws: 'recruiter' },
        6: { tab: 'recruiter-pipeline-view', ws: 'recruiter' }
      };
      const target = stepMap[stepNumber];
      if (target) {
        switchMainTab(target.tab);
        this.ui.activeWorkspace = target.ws;
      }
    },
    runBatchAIShortlist() {
      let count = 0;
      const minCutoff = state.organization?.minimumShortlistScore || 78;
      state.applications.forEach(app => {
        const job = state.jobs.find(j => j.jobId === app.jobId) || state.job;
        const match = calculateCandidateJobMatch(app.rawResumeText, job, app);
        if (match.deterministicScore >= minCutoff && (app.kanbanStage === 'Applied' || app.kanbanStage === 'Sourced')) {
          app.kanbanStage = 'Interviewing';
          count++;
        }
      });
      renderCandidatePipeline();
      updateKanbanView();
      this.notify(count > 0 ? `Batch Shortlisted ${count} qualified candidate(s)!` : `All candidates >= ${minCutoff}% have already been reviewed.`, count > 0 ? 'success' : 'info');
    },
    updateThresholdSlider(val) {
      const slider = document.getElementById('adminCutoffSlider') || document.getElementById('recruiter-threshold-slider');
      if (slider) {
        slider.value = val;
        slider.dispatchEvent(new Event('input'));
      }
    },
    selectCandidate(candId) {
      this.ui.selectedCandidateId = candId;
      showAiEvaluationReport(candId);
    },
    updateHumanRubric(candId, dimension, rating) {
      const app = state.applications.find(a => a.applicationId === candId);
      if (app) {
        if (!app.rubric) app.rubric = { sysDesign: 4, coding: 4, problem: 4, culture: 4 };
        app.rubric[dimension] = rating;
        const avg = ((app.rubric.sysDesign + app.rubric.coding + app.rubric.problem + app.rubric.culture) / 4).toFixed(1);
        app.rubric.avg = parseFloat(avg);
      }
    },
    saveCandidateNotes(candId) {
      const notesEl = document.getElementById(`dossier-notes-${candId}`) || document.getElementById('modalDecisionNotes');
      const text = notesEl ? notesEl.value : '';
      const app = state.applications.find(a => a.applicationId === candId);
      if (app) app.interviewNotes = text;
      this.notify('Candidate evaluation notes saved!', 'success');
    },
    executeHumanStageDecision(candId, newStage) {
      const app = state.applications.find(a => a.applicationId === candId);
      if (app) {
        app.kanbanStage = newStage;
        renderCandidatePipeline();
        updateKanbanView();
        renderAppliedJobs();
        this.notify(`Candidate moved to ${newStage}`, 'success');
      }
    },
    openOfferModal(candidateId) {
      showOfferModal(candidateId);
    },
    closeOfferModal() {
      const modal = document.getElementById('offerModal') || document.getElementById('modal-offer-dossier');
      if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
      }
    },
    openScorecardModal(candId) {
      openScorecardModal(candId);
    },
    openCommandPalette() {
      const modal = document.getElementById('modal-command-palette');
      if (modal) modal.classList.remove('hidden');
    },
    closeCommandPalette() {
      const modal = document.getElementById('modal-command-palette');
      if (modal) modal.classList.add('hidden');
    },
    openDataModal() {
      const modal = document.getElementById('modal-data-manager');
      if (modal) modal.classList.remove('hidden');
    },
    closeDataModal() {
      const modal = document.getElementById('modal-data-manager');
      if (modal) modal.classList.add('hidden');
    },
    openJobModal(jobId = null) {
      if (jobId) loadJobIntoStudio(jobId);
      switchMainTab('recruiter-studio-view');
    },
    closeJobModal() {
      // no-op
    },
    openApplyModal(defaultJobId = null) {
      const modal = document.getElementById('modal-apply-parser');
      if (modal) modal.classList.remove('hidden');
    },
    closeApplyModal() {
      const modal = document.getElementById('modal-apply-parser');
      if (modal) modal.classList.add('hidden');
    },
    openAuthModal() {
      const modal = document.getElementById('modal-auth-gateway');
      if (modal) modal.classList.remove('hidden');
    },
    closeAuthModal() {
      const modal = document.getElementById('modal-auth-gateway');
      if (modal) modal.classList.add('hidden');
    },
    exportComparisonCSV() {
      exportAuditCsv();
    },
    exportAuditLogsJSON() {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.auditTrail, null, 2));
      const dlAnchor = document.createElement('a');
      dlAnchor.setAttribute('href', dataStr);
      dlAnchor.setAttribute('download', `hireflow_audit_trail_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(dlAnchor);
      dlAnchor.click();
      dlAnchor.remove();
    },
    exportFullDatabaseJSON() {
      const dbSnapshot = {
        organization: state.organization,
        jobs: state.jobs,
        applications: state.applications,
        decisions: state.decisions,
        auditTrail: state.auditTrail,
        exportedAt: new Date().toISOString()
      };
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dbSnapshot, null, 2));
      const dlAnchor = document.createElement('a');
      dlAnchor.setAttribute('href', dataStr);
      dlAnchor.setAttribute('download', `hireflow_database_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(dlAnchor);
      dlAnchor.click();
      dlAnchor.remove();
    },
    resetDatabaseToSeed() {
      if (confirm('Reset HireFlow to factory enterprise seed data?')) {
        localStorage.clear();
        sessionStorage.clear();
        location.reload();
      }
    },
    notify(msg, type = 'info') {
      showToast(msg);
    },
    renderAll() {
      renderJobFeed();
      renderCandidatePipeline();
      renderAppliedJobs();
      renderAdminControls();
    },
    syncWithBackendAPI() {
      if (typeof fetch !== 'undefined') {
        fetch('/api/v1/health')
          .then(r => r.json())
          .then(d => {
            const dot = document.getElementById('sync-status-dot');
            const label = document.getElementById('sync-status-label');
            if (dot) dot.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse-subtle';
            if (label) label.textContent = 'REST API Connected + LocalDB';
          })
          .catch(() => {
            const label = document.getElementById('sync-status-label');
            if (label) label.textContent = 'LocalDB Persistent Mode';
          });
      }
    }
  };

  // Automation / Global Exports
  window.HireFlowAIEngine = HireFlowAIEngine;
  window.HireFlowApp = HireFlowApp;
  window.calculateCandidateJobMatch = calculateCandidateJobMatch;
  window.renderJobFeed = renderJobFeed;
  window.renderJobDetailPane = renderJobDetailPane;
  window.renderCandidateProfileForm = renderCandidateProfileForm;
  window.renderAppliedJobs = renderAppliedJobs;
  window.handle1ClickApply = handle1ClickApply;
  window.syncCandidateProfileForUser = syncCandidateProfileForUser;
  window.initJobStudio = initJobStudio;
  window.loadJobIntoStudio = loadJobIntoStudio;
  window.renderStudioSkills = renderStudioSkills;
  window.initCandidatePipeline = initCandidatePipeline;
  window.renderCandidatePipeline = renderCandidatePipeline;
  window.populatePipelineJobFilter = populatePipelineJobFilter;
  window.populateStudioJobSelect = populateStudioJobSelect;
  window.showAiEvaluationReport = showAiEvaluationReport;
  window.openScorecardModal = openScorecardModal;
  window.initAdminControls = initAdminControls;
  window.renderAdminControls = renderAdminControls;
  window.updateCutoffTriageSimulation = updateCutoffTriageSimulation;
  window.applyThemeColor = applyThemeColor;
  window.updateBrandingPreview = updateBrandingPreview;
  window.switchMainTab = switchMainTab;
  window.initTheme = initTheme;
  window.applyTheme = applyTheme;
  window.toggleTheme = toggleTheme;
  window.state = state;

  // Toast Helper
  function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

})();
