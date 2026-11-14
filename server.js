
/**
 * HireFlow + OmniTalent: Unified Enterprise ATS + Professional Social Network Engine
 * Zero-dependency Node.js HTTP Server & Full REST API
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Ensure public directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// =============================================================================
// IN-MEMORY DATA STORE (INITIALIZED WITH SEED DATA)
// =============================================================================

const KNOWN_SKILL_TAXONOMY = [
  'JAVA', 'SPRING BOOT', 'MICROSERVICES', 'DOCKER', 'SQL',
  'KUBERNETES', 'KAFKA', 'AWS', 'PYTHON', 'REACT', 'GIT', 'REST API',
  'POSTGRESQL', 'REDIS', 'GRAPHQL', 'TYPESCRIPT', 'DISTRIBUTED SYSTEMS',
  'GCP', 'TERRAFORM', 'CI/CD', 'SYSTEM DESIGN'
];

const state = {
  organizations: [
    {
      orgId: 'ORG-APEX88',
      name: 'Apex Cloud Systems',
      type: 'COMPANY',
      customSubdomain: 'apexcloud.hireflow.ai',
      minimumShortlistScore: 75,
      logoColor: '#8b5cf6',
      tagline: 'ATS + Social Network Fusion Platform',
      complianceSettings: {
        gdpr: true,
        blindHiring: false,
        autoKnockout: true,
        graphSync: true
      },
      createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString()
    },
    {
      orgId: 'ORG-NEXA42',
      name: 'NexaTech University TPO',
      type: 'UNIVERSITY',
      customSubdomain: 'nexatech.hireflow.ai',
      minimumShortlistScore: 80,
      logoColor: '#06b6d4',
      tagline: 'Campus Placement & Talent Network',
      complianceSettings: {
        gdpr: true,
        blindHiring: false,
        autoKnockout: false,
        graphSync: true
      },
      createdAt: new Date(Date.now() - 3600000 * 24 * 14).toISOString()
    }
  ],

  jobs: [
    {
      jobId: 'JOB-8F9A2C',
      orgId: 'ORG-APEX88',
      title: 'Senior Backend Engineer (Java / Distributed Systems)',
      employmentType: 'FULL_TIME',
      minSalaryLPA: 22,
      maxSalaryLPA: 30,
      equityOfferedPercent: 0.25,
      mandatorySkills: ['JAVA', 'SPRING BOOT', 'MICROSERVICES', 'DOCKER', 'SQL'],
      preferredSkills: ['KUBERNETES', 'KAFKA'],
      requiredExperienceYears: 2,
      location: 'Bangalore, India (Hybrid)',
      status: 'OPEN',
      createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
    },
    {
      jobId: 'JOB-3D7E1A',
      orgId: 'ORG-APEX88',
      title: 'Staff Distributed Systems Architect',
      employmentType: 'FULL_TIME',
      minSalaryLPA: 45,
      maxSalaryLPA: 65,
      equityOfferedPercent: 0.75,
      mandatorySkills: ['JAVA', 'DISTRIBUTED SYSTEMS', 'KAFKA', 'KUBERNETES', 'SYSTEM DESIGN'],
      preferredSkills: ['AWS', 'REDIS', 'TERRAFORM'],
      requiredExperienceYears: 6,
      location: 'Remote / Bangalore',
      status: 'OPEN',
      createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
    }
  ],

  applications: [
    {
      applicationId: 'APP-1B4D7E',
      candidateName: 'Aarav Sharma',
      email: 'aarav.s@email.com',
      headline: 'Backend Engineer | Distributed Systems & Event Streaming',
      jobId: 'JOB-8F9A2C',
      kanbanStage: 'OfferExtended', // Sourced, Applied, AssessmentPending, Interviewing, OfferExtended, Closed
      rawResumeText: 'Experienced Engineer with 2 years building scalable backends using Java, Spring Boot, Microservices, Docker, SQL, Kubernetes, and Kafka event streams. Reduced p99 latency by 35% using Redis caching and reactive Spring WebFlux.',
      portfolioArtifactUrls: ['https://github.com/aaravsharma/distributed-raft', 'https://aarav.dev'],
      referralChain: ['Aarav Sharma -> Rajesh (Staff Eng) -> Vikram (VP Eng) -> Apex Cloud'],
      graphTrustScore: 0.94,
      intentScore: 0.92,
      openToOpportunities: true,
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
      portfolioArtifactUrls: ['https://github.com/diyanair/k8s-operator', 'https://diya.io'],
      referralChain: ['Direct Application (University Alumni Network)'],
      graphTrustScore: 0.78,
      intentScore: 0.85,
      openToOpportunities: true,
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
      portfolioArtifactUrls: ['https://github.com/rohanv/py-scraper'],
      referralChain: ['Organic Social Feed'],
      graphTrustScore: 0.40,
      intentScore: 0.95,
      openToOpportunities: true,
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
      portfolioArtifactUrls: ['https://github.com/priyasoni/event-broker'],
      referralChain: ['Priya Soni -> Neha (Director HR) -> Apex Cloud'],
      graphTrustScore: 0.89,
      intentScore: 0.88,
      openToOpportunities: true,
      expectedBaseSalaryLPA: 26,
      appliedAt: new Date(Date.now() - 3600000 * 12).toISOString()
    }
  ],

  aiProfiles: {}, // appId -> { extractedSkills, detectedExperienceYears, embedding }

  candidateProfiles: {
    'aarav.s@email.com': {
      candidateName: 'Aarav Sharma',
      email: 'aarav.s@email.com',
      headline: 'Backend Engineer | Distributed Systems & Event Streaming',
      location: 'Bangalore, India (Hybrid)',
      expectedBaseSalaryLPA: 24,
      verifiedSkills: ['JAVA', 'SPRING BOOT', 'MICROSERVICES', 'DOCKER', 'SQL', 'KUBERNETES', 'KAFKA'],
      portfolioArtifactUrls: ['https://github.com/aaravsharma/distributed-raft', 'https://aarav.dev'],
      rawResumeText: 'Experienced Engineer with 2 years building scalable backends using Java, Spring Boot, Microservices, Docker, SQL, Kubernetes, and Kafka event streams.',
      experienceYears: 2
    }
  },

  hiringDecisions: [
    {
      applicationId: 'APP-1B4D7E',
      candidateName: 'Aarav Sharma',
      decisionType: 'SelectedForOffer',
      reviewer: 'Vikram (VP Eng)',
      interviewNotes: 'Exceptional system design depth, mastered Kafka partitions & distributed consistency. Culture fit 5/5.',
      offeredCTC: 24.0,
      equityOfferedPercent: 0.25,
      scorecardRatings: { systemDesign: 5, coding: 5, problemSolving: 4, culture: 5 },
      decidedAt: new Date(Date.now() - 3600000 * 6).toISOString()
    },
    {
      applicationId: 'APP-3C9E1A',
      candidateName: 'Diya Nair',
      decisionType: 'HoldWaitlist',
      reviewer: 'Vikram (VP Eng)',
      interviewNotes: 'Strong core Java profile; slight gap in Kafka event streaming architecture. Retained on priority waitlist.',
      offeredCTC: null,
      equityOfferedPercent: null,
      scorecardRatings: { systemDesign: 4, coding: 4, problemSolving: 4, culture: 4 },
      decidedAt: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      applicationId: 'APP-7F2B4D',
      candidateName: 'Rohan Verma',
      decisionType: 'Rejected',
      reviewer: 'AI Auto-Triage + HR',
      interviewNotes: 'Missing mandatory requirements: Spring Boot, Microservices, Docker, and experience below threshold. Auto-archived with feedback.',
      offeredCTC: null,
      equityOfferedPercent: null,
      scorecardRatings: { systemDesign: 2, coding: 2, problemSolving: 2, culture: 3 },
      decidedAt: new Date(Date.now() - 3600000 * 4).toISOString()
    }
  ],

  // Graph DB Nodes and Edges for OmniTalent Social Network
  socialGraph: {
    nodes: [
      { id: 'user-aarav', label: 'Aarav Sharma', type: 'CANDIDATE', title: 'Backend Eng (2y)', trustScore: 0.94, avatar: 'AS' },
      { id: 'user-diya', label: 'Diya Nair', type: 'CANDIDATE', title: 'Software Dev (3y)', trustScore: 0.78, avatar: 'DN' },
      { id: 'user-rohan', label: 'Rohan Verma', type: 'CANDIDATE', title: 'Junior Dev (1y)', trustScore: 0.40, avatar: 'RV' },
      { id: 'user-priya', label: 'Priya Soni', type: 'CANDIDATE', title: 'Senior Platform Eng (4y)', trustScore: 0.89, avatar: 'PS' },
      { id: 'emp-rajesh', label: 'Rajesh K.', type: 'EMPLOYEE', title: 'Staff Eng @ Apex Cloud', authorityWeight: 3.5, avatar: 'RK' },
      { id: 'emp-vikram', label: 'Vikram Seth', type: 'LEADERSHIP', title: 'VP Engineering @ Apex Cloud', authorityWeight: 4.5, avatar: 'VS' },
      { id: 'org-apex', label: 'Apex Cloud Systems', type: 'ORGANIZATION', title: 'Enterprise Cloud SaaS', avatar: 'AC' },
      { id: 'school-nexa', label: 'NexaTech University', type: 'UNIVERSITY', title: 'Tier 1 Engineering School', avatar: 'NU' },
      { id: 'skill-java', label: 'Java', type: 'SKILL', category: 'Core' },
      { id: 'skill-kafka', label: 'Kafka', type: 'SKILL', category: 'Distributed' },
      { id: 'skill-spring', label: 'Spring Boot', type: 'SKILL', category: 'Framework' }
    ],
    edges: [
      { from: 'user-aarav', to: 'emp-rajesh', label: 'Former Colleague', weight: 4.0 },
      { from: 'emp-rajesh', to: 'emp-vikram', label: 'Direct Report / Peer', weight: 4.5 },
      { from: 'emp-vikram', to: 'org-apex', label: 'Engineering Leader', weight: 5.0 },
      { from: 'user-aarav', to: 'skill-java', label: 'Verified Endorsement (4.5x by Vikram)', weight: 4.5 },
      { from: 'user-aarav', to: 'skill-kafka', label: 'Verified Endorsement', weight: 4.0 },
      { from: 'user-diya', to: 'school-nexa', label: 'Alumni 2023', weight: 3.0 },
      { from: 'emp-rajesh', to: 'school-nexa', label: 'Alumni 2018', weight: 3.5 },
      { from: 'user-priya', to: 'org-apex', label: 'Warm Referral by HR Director', weight: 4.2 }
    ]
  }
};

// Initialize AI parsed profiles for seed applications
function initSeedProfiles() {
  state.applications.forEach(app => {
    state.aiProfiles[app.applicationId] = parseResumeNLP(app.rawResumeText, app.applicationId);
  });
}

// =============================================================================
// AI RESUME NLP & SKILL EXTRACTION ENGINE
// =============================================================================

function parseResumeNLP(rawText, applicationId) {
  const upper = rawText.toUpperCase();
  const extractedSkills = [];

  KNOWN_SKILL_TAXONOMY.forEach(skill => {
    if (upper.includes(skill)) {
      extractedSkills.push(skill);
    }
  });

  // Regex pattern for experience: 'X+? years?'
  const expMatch = rawText.match(/(\d+)\+?\s*years?/i);
  const detectedExperienceYears = expMatch ? parseInt(expMatch[1], 10) : 0;

  // Generate pseudo 768-dimensional normalized embedding representation
  const embedding = generatePseudoEmbedding(extractedSkills, detectedExperienceYears);

  return {
    applicationId,
    extractedSkills,
    detectedExperienceYears,
    embeddingPreview: embedding.slice(0, 8),
    parsedAt: new Date().toISOString()
  };
}

function generatePseudoEmbedding(skills, exp) {
  // Deterministic 768-vector generator for semantic similarity simulation
  const vector = new Array(768);
  const hashSeed = skills.join('|') + '::' + exp;
  let hash = 0;
  for (let i = 0; i < hashSeed.length; i++) {
    hash = (hash << 5) - hash + hashSeed.charCodeAt(i);
    hash |= 0;
  }
  for (let i = 0; i < 768; i++) {
    vector[i] = Math.sin((hash + i) * 0.123) * 0.5 + 0.5;
  }
  return vector;
}

// =============================================================================
// INTELLIGENT SHORTLISTING & HYBRID MATCHING SCORER
// =============================================================================

function calculateShortlistScores(job, applications, aiProfiles, portal) {
  const minScore = portal ? portal.minimumShortlistScore : 75;

  return applications
    .filter(app => app.jobId === job.jobId)
    .map(app => {
      const profile = aiProfiles[app.applicationId] || parseResumeNLP(app.rawResumeText, app.applicationId);
      const candidateSkills = profile.extractedSkills.map(s => s.toUpperCase());
      const expYears = profile.detectedExperienceYears;

      const strengths = [];
      const skillGaps = [];

      // 1. Mandatory Skills (70% weight)
      let mandatoryMatched = 0;
      job.mandatorySkills.forEach(req => {
        if (candidateSkills.includes(req.toUpperCase())) {
          mandatoryMatched++;
          strengths.push(`${req} (Core)`);
        } else {
          skillGaps.push(`Missing Core: ${req}`);
        }
      });
      const mandatoryScore = job.mandatorySkills.length === 0
        ? 70.0
        : (mandatoryMatched / job.mandatorySkills.length) * 70.0;

      // 2. Preferred Skills (20% weight)
      let preferredMatched = 0;
      job.preferredSkills.forEach(pref => {
        if (candidateSkills.includes(pref.toUpperCase())) {
          preferredMatched++;
          strengths.push(`${pref} (Bonus)`);
        } else {
          skillGaps.push(`Missing Preferred: ${pref}`);
        }
      });
      const preferredScore = job.preferredSkills.length === 0
        ? 20.0
        : (preferredMatched / job.preferredSkills.length) * 20.0;

      // 3. Experience Alignment (10% weight)
      let expScore;
      if (expYears >= job.requiredExperienceYears) {
        expScore = Math.min(10.0, 6.0 + (expYears - job.requiredExperienceYears) * 2.0);
        strengths.push(`${expYears} Yrs Relevant Experience`);
      } else {
        expScore = (expYears / Math.max(1, job.requiredExperienceYears)) * 6.0;
        skillGaps.push(`Experience below ${job.requiredExperienceYears} yrs target`);
      }

      const totalScore = Math.round(mandatoryScore + preferredScore + expScore);
      const autoShortlisted = totalScore >= minScore;

      // Part 1 Composite Hybrid Match Formula calculation:
      // S = 40% Semantic + 30% Hard skills + 15% Graph Trust + 15% Intent
      const semanticSim = Math.min(1.0, 0.45 + (mandatoryMatched / Math.max(1, job.mandatorySkills.length)) * 0.55);
      const bm25Score = (mandatoryMatched + preferredMatched * 0.5) / Math.max(1, job.mandatorySkills.length + job.preferredSkills.length * 0.5);
      const graphTrust = app.graphTrustScore || 0.65;
      const intentScore = app.intentScore || 0.85;

      const compositeScore = Math.round(
        (0.40 * semanticSim + 0.30 * bm25Score + 0.15 * graphTrust + 0.15 * intentScore) * 100
      );

      return {
        application: app,
        aiProfile: profile,
        matchScorePercentage: totalScore,
        compositeFormulaScore: compositeScore,
        formulaBreakdown: {
          semanticSim: Math.round(semanticSim * 100),
          bm25Score: Math.round(bm25Score * 100),
          graphTrust: Math.round(graphTrust * 100),
          intentScore: Math.round(intentScore * 100)
        },
        strengths,
        skillGaps,
        autoShortlisted,
        minScoreRequired: minScore
      };
    })
    .sort((a, b) => b.matchScorePercentage - a.matchScorePercentage);
}

// =============================================================================
// HTTP REQUEST ROUTER & CONTROLLER
// =============================================================================

initSeedProfiles();

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data, null, 2));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        resolve({ raw: body });
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS Pre-flight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // ---------------------------------------------------------------------------
  // API ROUTES (STEPS 1 - 6 & OMNITALENT FEATURES)
  // ---------------------------------------------------------------------------

  if (pathname.startsWith('/api/')) {
    try {
      // Health Check
      if (pathname === '/api/v1/health' && method === 'GET') {
        return sendJson(res, 200, {
          status: 'UP',
          service: 'HireFlow + OmniTalent Fusion Engine',
          version: '2.0.0',
          activeOrganizations: state.organizations.length,
          activeJobs: state.jobs.length,
          totalApplications: state.applications.length
        });
      }

      // STEP 1: Organizations
      if (pathname === '/api/v1/organizations') {
        if (method === 'GET') {
          return sendJson(res, 200, { success: true, data: state.organizations });
        }
        if (method === 'POST') {
          const body = await parseBody(req);
          const orgId = 'ORG-' + crypto.randomUUID().substring(0, 6).toUpperCase();
          const newOrg = {
            orgId,
            name: body.name || 'New Organization',
            type: body.type === 'UNIVERSITY' ? 'UNIVERSITY' : 'COMPANY',
            customSubdomain: (body.subdomain || 'org') + '.hireflow.ai',
            minimumShortlistScore: Number(body.minScore) || 75,
            logoColor: body.logoColor || '#8b5cf6',
            tagline: body.tagline || 'ATS + Social Network Fusion Platform',
            complianceSettings: body.complianceSettings || { gdpr: true, blindHiring: false, autoKnockout: true, graphSync: true },
            createdAt: new Date().toISOString()
          };
          state.organizations.unshift(newOrg);
          return sendJson(res, 201, { success: true, data: newOrg });
        }
      }

      // STEP 1 EXTENSION: PUT / PATCH /api/v1/organizations/:orgId
      const orgParamMatch = pathname.match(/^\/api\/v1\/organizations\/([^\/]+)$/);
      if (orgParamMatch && (method === 'PUT' || method === 'PATCH')) {
        const orgId = orgParamMatch[1];
        const org = state.organizations.find(o => o.orgId === orgId);
        if (!org) {
          return sendJson(res, 404, { success: false, error: 'Organization not found' });
        }
        const body = await parseBody(req);
        if (body.name !== undefined) org.name = body.name;
        if (body.type !== undefined) org.type = body.type;
        if (body.subdomain !== undefined) {
          const sub = String(body.subdomain).trim();
          org.customSubdomain = sub.includes('.') ? sub : sub + '.hireflow.ai';
        }
        if (body.customSubdomain !== undefined) {
          org.customSubdomain = String(body.customSubdomain).trim();
        }
        if (body.minScore !== undefined) org.minimumShortlistScore = Number(body.minScore);
        if (body.minimumShortlistScore !== undefined) org.minimumShortlistScore = Number(body.minimumShortlistScore);
        if (body.logoColor !== undefined) org.logoColor = body.logoColor;
        if (body.tagline !== undefined) org.tagline = body.tagline;
        if (body.complianceSettings !== undefined) {
          org.complianceSettings = Object.assign(org.complianceSettings || {}, body.complianceSettings);
        }
        org.updatedAt = new Date().toISOString();
        return sendJson(res, 200, { success: true, data: org });
      }

      // STEP 2: Job Requisitions
      if (pathname === '/api/v1/jobs') {
        if (method === 'GET') {
          return sendJson(res, 200, { success: true, data: state.jobs });
        }
        if (method === 'POST') {
          const body = await parseBody(req);
          const jobId = 'JOB-' + crypto.randomUUID().substring(0, 6).toUpperCase();
          const newJob = {
            jobId,
            orgId: body.orgId || state.organizations[0].orgId,
            title: body.title || 'Software Engineer',
            employmentType: body.employmentType || 'FULL_TIME',
            minSalaryLPA: Number(body.minSalaryLPA) || 15,
            maxSalaryLPA: Number(body.maxSalaryLPA) || 25,
            equityOfferedPercent: Number(body.equityOfferedPercent) || 0.1,
            mandatorySkills: Array.isArray(body.mandatorySkills) ? body.mandatorySkills.map(s => s.toUpperCase().trim()) : ['JAVA'],
            preferredSkills: Array.isArray(body.preferredSkills) ? body.preferredSkills.map(s => s.toUpperCase().trim()) : ['KAFKA'],
            requiredExperienceYears: Number(body.requiredExperienceYears) || 2,
            location: body.location || 'Bangalore, India',
            status: 'OPEN',
            createdAt: new Date().toISOString()
          };
          state.jobs.unshift(newJob);
          return sendJson(res, 201, { success: true, data: newJob });
        }
      }

      // STEP 2 EXTENSION: PUT / PATCH /api/v1/jobs/:jobId
      const jobParamMatch = pathname.match(/^\/api\/v1\/jobs\/([^\/]+)$/);
      if (jobParamMatch && (method === 'PUT' || method === 'PATCH')) {
        const jobId = jobParamMatch[1];
        const job = state.jobs.find(j => j.jobId === jobId);
        if (!job) {
          return sendJson(res, 404, { success: false, error: 'Job not found' });
        }
        const body = await parseBody(req);
        if (body.title !== undefined) job.title = body.title;
        if (body.employmentType !== undefined) job.employmentType = body.employmentType;
        if (body.minSalaryLPA !== undefined) job.minSalaryLPA = Number(body.minSalaryLPA);
        if (body.maxSalaryLPA !== undefined) job.maxSalaryLPA = Number(body.maxSalaryLPA);
        if (body.equityOfferedPercent !== undefined) job.equityOfferedPercent = Number(body.equityOfferedPercent);
        if (body.mandatorySkills !== undefined && Array.isArray(body.mandatorySkills)) {
          job.mandatorySkills = body.mandatorySkills.map(s => String(s).toUpperCase().trim());
        }
        if (body.preferredSkills !== undefined && Array.isArray(body.preferredSkills)) {
          job.preferredSkills = body.preferredSkills.map(s => String(s).toUpperCase().trim());
        }
        if (body.requiredExperienceYears !== undefined) job.requiredExperienceYears = Number(body.requiredExperienceYears);
        if (body.location !== undefined) job.location = body.location;
        if (body.status !== undefined) job.status = body.status;
        job.updatedAt = new Date().toISOString();
        return sendJson(res, 200, { success: true, data: job });
      }

      // STEP 3: Applications & Living Profiles
      if (pathname === '/api/v1/applications') {
        if (method === 'GET') {
          const emailQuery = parsedUrl.query && parsedUrl.query.email;
          if (emailQuery) {
            const normalizedQuery = String(emailQuery).trim().toLowerCase();
            const filtered = state.applications.filter(a => a.email && a.email.toLowerCase() === normalizedQuery);
            return sendJson(res, 200, { success: true, data: filtered });
          }
          return sendJson(res, 200, { success: true, data: state.applications });
        }
        if (method === 'POST') {
          const body = await parseBody(req);
          const applicationId = 'APP-' + crypto.randomUUID().substring(0, 6).toUpperCase();
          const newApp = {
            applicationId,
            candidateName: body.candidateName || 'Anonymous Candidate',
            email: body.email || 'candidate@example.com',
            headline: body.headline || 'Software Engineer',
            jobId: body.jobId || (state.jobs[0] ? state.jobs[0].jobId : 'JOB-DEFAULT'),
            kanbanStage: 'Applied',
            rawResumeText: body.rawResumeText || '',
            portfolioArtifactUrls: Array.isArray(body.portfolioArtifactUrls) ? body.portfolioArtifactUrls : [],
            referralChain: body.referralChain ? [body.referralChain] : ['Direct Applicant'],
            graphTrustScore: 0.85,
            intentScore: 0.90,
            openToOpportunities: true,
            expectedBaseSalaryLPA: Number(body.expectedBaseSalaryLPA) || 20,
            appliedAt: new Date().toISOString()
          };

          state.applications.unshift(newApp);

          // Auto-trigger Step 4: AI NLP Parsing
          const profile = parseResumeNLP(newApp.rawResumeText, newApp.applicationId);
          state.aiProfiles[newApp.applicationId] = profile;

          return sendJson(res, 201, {
            success: true,
            data: newApp,
            aiProfile: profile
          });
        }
      }

      // STEP 3 EXTENSION: Candidate Profile GET & PUT
      if (pathname === '/api/v1/candidate/profile') {
        const emailQuery = (parsedUrl.query && parsedUrl.query.email) ? String(parsedUrl.query.email).trim().toLowerCase() : null;
        const defaultEmail = 'aarav.s@email.com';
        const targetEmail = emailQuery || defaultEmail;

        if (method === 'GET') {
          let profile = state.candidateProfiles[targetEmail];
          if (!profile) {
            const matchedApp = state.applications.find(a => a.email && a.email.toLowerCase() === targetEmail);
            if (matchedApp) {
              profile = {
                candidateName: matchedApp.candidateName,
                email: matchedApp.email,
                headline: matchedApp.headline,
                location: 'Bangalore, India (Hybrid)',
                expectedBaseSalaryLPA: matchedApp.expectedBaseSalaryLPA || 20,
                verifiedSkills: ['JAVA', 'SPRING BOOT', 'MICROSERVICES', 'SQL'],
                portfolioArtifactUrls: matchedApp.portfolioArtifactUrls || [],
                rawResumeText: matchedApp.rawResumeText || '',
                experienceYears: 2
              };
              state.candidateProfiles[targetEmail] = profile;
            } else {
              profile = state.candidateProfiles[defaultEmail] || {
                candidateName: 'Aarav Sharma',
                email: defaultEmail,
                headline: 'Backend Engineer | Distributed Systems & Event Streaming',
                location: 'Bangalore, India (Hybrid)',
                expectedBaseSalaryLPA: 24,
                verifiedSkills: ['JAVA', 'SPRING BOOT', 'MICROSERVICES', 'DOCKER', 'SQL', 'KUBERNETES', 'KAFKA'],
                portfolioArtifactUrls: ['https://github.com/aaravsharma/distributed-raft', 'https://aarav.dev'],
                rawResumeText: 'Experienced Engineer with 2 years building scalable backends using Java, Spring Boot, Microservices, Docker, SQL, Kubernetes, and Kafka event streams.',
                experienceYears: 2
              };
            }
          }
          return sendJson(res, 200, { success: true, data: profile });
        }

        if (method === 'PUT' || method === 'PATCH') {
          const body = await parseBody(req);
          const candidateEmail = (body.email || targetEmail || defaultEmail).toLowerCase();
          const existing = state.candidateProfiles[candidateEmail] || state.candidateProfiles[defaultEmail] || {};

          const updatedProfile = {
            ...existing,
            ...body,
            candidateName: body.candidateName || body.name || existing.candidateName || 'Candidate',
            email: candidateEmail,
            headline: body.headline !== undefined ? body.headline : existing.headline,
            location: body.location !== undefined ? body.location : existing.location,
            expectedBaseSalaryLPA: body.expectedBaseSalaryLPA !== undefined ? Number(body.expectedBaseSalaryLPA) : existing.expectedBaseSalaryLPA,
            rawResumeText: body.rawResumeText !== undefined ? body.rawResumeText : existing.rawResumeText,
            experienceYears: body.experienceYears !== undefined ? Number(body.experienceYears) : existing.experienceYears,
            updatedAt: new Date().toISOString()
          };

          if (Array.isArray(body.verifiedSkills)) {
            updatedProfile.verifiedSkills = body.verifiedSkills.map(s => String(s).toUpperCase().trim());
          } else if (body.skills && Array.isArray(body.skills)) {
            updatedProfile.verifiedSkills = body.skills.map(s => String(s).toUpperCase().trim());
          }

          if (Array.isArray(body.portfolioArtifactUrls)) {
            updatedProfile.portfolioArtifactUrls = body.portfolioArtifactUrls;
          } else if (body.portfolioLinks && Array.isArray(body.portfolioLinks)) {
            updatedProfile.portfolioArtifactUrls = body.portfolioLinks;
          }

          state.candidateProfiles[candidateEmail] = updatedProfile;
          return sendJson(res, 200, { success: true, data: updatedProfile });
        }
      }

      // STEP 4: AI Parsing On-Demand
      if (pathname.startsWith('/api/v1/ai/parse')) {
        const body = await parseBody(req);
        const text = body.rawResumeText || '';
        const appId = body.applicationId || 'APP-TEMP-' + Date.now();
        const profile = parseResumeNLP(text, appId);
        state.aiProfiles[appId] = profile;
        return sendJson(res, 200, { success: true, data: profile });
      }

      // STEP 5: Intelligent Shortlisting Leaderboard
      if (pathname.startsWith('/api/v1/jobs/') && pathname.endsWith('/shortlist')) {
        const parts = pathname.split('/');
        const jobId = parts[4];
        const job = state.jobs.find(j => j.jobId === jobId) || state.jobs[0];
        const portal = state.organizations.find(o => o.orgId === job.orgId) || state.organizations[0];

        const shortlist = calculateShortlistScores(job, state.applications, state.aiProfiles, portal);
        return sendJson(res, 200, {
          success: true,
          job,
          portal,
          leaderboard: shortlist
        });
      }

      // STEP 6: Human Decision & Offer Commit
      if (pathname.startsWith('/api/v1/applications/') && pathname.endsWith('/decision')) {
        const parts = pathname.split('/');
        const appId = parts[4];
        const body = await parseBody(req);

        const application = state.applications.find(a => a.applicationId === appId);
        if (!application) {
          return sendJson(res, 404, { success: false, error: 'Application not found' });
        }

        const decisionRecord = {
          applicationId: appId,
          candidateName: application.candidateName,
          decisionType: body.decisionType || 'SelectedForOffer', // SelectedForOffer, HoldWaitlist, Rejected
          reviewer: body.reviewer || 'Engineering Hiring Team',
          interviewNotes: body.interviewNotes || '',
          offeredCTC: body.offeredCTC ? Number(body.offeredCTC) : null,
          equityOfferedPercent: body.equityOfferedPercent ? Number(body.equityOfferedPercent) : null,
          scorecardRatings: body.scorecardRatings || { systemDesign: 4, coding: 4, problemSolving: 4, culture: 4 },
          decidedAt: new Date().toISOString()
        };

        // Update application kanban stage based on decision
        if (decisionRecord.decisionType === 'SelectedForOffer') {
          application.kanbanStage = 'OfferExtended';
        } else if (decisionRecord.decisionType === 'HoldWaitlist') {
          application.kanbanStage = 'Interviewing';
        } else {
          application.kanbanStage = 'Closed';
        }

        // Replace or add decision in audit list
        const existingIdx = state.hiringDecisions.findIndex(d => d.applicationId === appId);
        if (existingIdx >= 0) {
          state.hiringDecisions[existingIdx] = decisionRecord;
        } else {
          state.hiringDecisions.unshift(decisionRecord);
        }

        return sendJson(res, 200, {
          success: true,
          message: `Decision successfully recorded for ${application.candidateName}`,
          decision: decisionRecord,
          application
        });
      }

      // KANBAN Pipeline State Management
      if (pathname === '/api/v1/kanban' && method === 'GET') {
        const stages = ['Sourced', 'Applied', 'AssessmentPending', 'Interviewing', 'OfferExtended', 'Closed'];
        const board = {};
        stages.forEach(st => { board[st] = []; });

        state.applications.forEach(app => {
          const st = app.kanbanStage || 'Applied';
          if (!board[st]) board[st] = [];
          board[st].push(app);
        });

        return sendJson(res, 200, { success: true, board });
      }

      if (pathname === '/api/v1/kanban/move' && method === 'POST') {
        const body = await parseBody(req);
        const app = state.applications.find(a => a.applicationId === body.applicationId);
        if (app) {
          app.kanbanStage = body.newStage;
          return sendJson(res, 200, { success: true, app });
        }
        return sendJson(res, 404, { success: false, error: 'Application not found' });
      }

      // SOCIAL GRAPH & NETWORK EXPLORER
      if (pathname === '/api/v1/network/graph') {
        return sendJson(res, 200, { success: true, data: state.socialGraph });
      }

      // AUDIT & COMPLIANCE TIMELINE
      if (pathname === '/api/v1/audit') {
        return sendJson(res, 200, {
          success: true,
          hiringDecisions: state.hiringDecisions,
          auditTimestamp: new Date().toISOString()
        });
      }

      // RESET / RE-RUN APEX CLOUD 6-STEP DEMO
      if (pathname === '/api/v1/simulate/run-apex-demo' && method === 'POST') {
        initSeedProfiles();
        return sendJson(res, 200, {
          success: true,
          message: '6-Step HireFlow Demo Pipeline recalculated successfully',
          data: {
            portal: state.organizations[0],
            job: state.jobs[0],
            applications: state.applications,
            shortlist: calculateShortlistScores(state.jobs[0], state.applications, state.aiProfiles, state.organizations[0]),
            decisions: state.hiringDecisions
          }
        });
      }

      return sendJson(res, 404, { error: 'Route not found' });
    } catch (apiErr) {
      console.error('API Error:', apiErr);
      return sendJson(res, 500, { error: 'Internal server error', details: apiErr.message });
    }
  }

  // ---------------------------------------------------------------------------
  // STATIC ASSET SERVING
  // ---------------------------------------------------------------------------

  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  // If not found in public/, check root directory
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Fallback to index.html for SPA client-side routing
        const spaIndex = path.join(PUBLIC_DIR, 'index.html');
        if (fs.existsSync(spaIndex)) {
          fs.readFile(spaIndex, (e, c) => {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(c, 'utf-8');
          });
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        }
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Only listen when executed directly via CLI (not when required by tests or serverless runtimes like Vercel)
if (process.env.VERCEL !== '1' && require.main === module) {
  server.listen(PORT, () => {
    console.log(`======================================================================`);
    console.log(`   HIREFLOW + OMNITALENT: LIVE ENTERPRISE ATS & SOCIAL PLATFORM`);
    console.log(`======================================================================`);
    console.log(`Server running at: http://localhost:${PORT}`);
    console.log(`REST API active on: http://localhost:${PORT}/api/v1/health`);
    console.log(`Serving UI from  : ${PUBLIC_DIR}`);
    console.log(`======================================================================\n`);
  });
}

if (typeof module !== 'undefined') {
  // Support both direct Node.js require and Vercel serverless function export
  module.exports = server;
  module.exports.server = server;
  module.exports.state = state;
  module.exports.calculateShortlistScores = calculateShortlistScores;
  module.exports.parseResumeNLP = parseResumeNLP;
}


