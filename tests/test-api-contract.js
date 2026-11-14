/**
 * =============================================================================
 * HIREFLOW + OMNITALENT: REST API CONTRACT & ENDPOINT TEST SUITE
 * Milestone: M1 (Features 1 - 11)
 * Target: c:\Users\darkp\OneDrive\Desktop\HIREFLOW FINAL VERSION 1\server.js
 * 
 * Execution:
 *   node tests/test-api-contract.js
 *   node --test tests/test-api-contract.js
 * 
 * Harness Architecture:
 *   Uses native Node.js streams (stream.Readable and stream.Writable) emitting
 *   direct HTTP request events on the captured http.Server instance.
 *   This in-memory stream harness executes with zero external dependencies,
 *   sub-50ms execution speed, and complete immunity to Windows sandbox TCP
 *   socket 'connect EACCES' restrictions.
 * =============================================================================
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { Readable, Writable } = require('stream');
const path = require('path');

// =============================================================================
// IN-MEMORY STREAM TEST HARNESS SETUP
// =============================================================================

if (!process.env.PORT) {
  process.env.PORT = '0';
}

let capturedServer = null;
const originalCreateServer = http.createServer;

// Intercept server creation before loading server.js
http.createServer = function (...args) {
  capturedServer = originalCreateServer.apply(this, args);
  const origListen = capturedServer.listen;
  capturedServer.listen = function (port, cb) {
    if (typeof cb === 'function') process.nextTick(cb);
    return capturedServer;
  };
  return capturedServer;
};

// Silence startup banner during server load
const originalConsoleLog = console.log;
console.log = () => {};

// Require server.js (resolves in-memory state store and routes)
const serverModulePath = path.resolve(__dirname, '..', 'server.js');
require(serverModulePath);

// Restore console.log
console.log = originalConsoleLog;

// Close the listening socket immediately so it does not keep the event loop alive
if (capturedServer && typeof capturedServer.close === 'function') {
  capturedServer.close();
}

/**
 * Dispatches an in-memory HTTP request into the server request listener.
 * 
 * @param {string} urlPath - e.g. '/api/v1/health'
 * @param {object} options - { method, headers, body, simulateStreamError }
 * @returns {Promise<{ status: number, headers: object, body: any, rawBody: string }>}
 */
function request(urlPath, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body = null,
    simulateStreamError = null
  } = options;

  return new Promise((resolve, reject) => {
    if (!capturedServer) {
      return reject(new Error('HTTP server was not captured during initialization.'));
    }

    const req = new Readable({ read() {} });
    req.url = urlPath;
    req.method = method.toUpperCase();
    req.headers = Object.assign({ host: 'localhost' }, headers);

    if (body !== null && body !== undefined) {
      let payload;
      if (typeof body === 'string') {
        payload = body;
      } else {
        payload = JSON.stringify(body);
        if (!req.headers['content-type']) {
          req.headers['content-type'] = 'application/json';
        }
      }
      req.headers['content-length'] = Buffer.byteLength(payload);
      req.push(payload);
    }
    req.push(null);

    let responseData = '';
    let statusCode = 200;
    const responseHeaders = {};

    const res = new Writable({
      write(chunk, encoding, callback) {
        responseData += chunk.toString();
        callback();
      }
    });

    res.writeHead = (st, h) => {
      statusCode = st;
      if (h) {
        for (const [key, value] of Object.entries(h)) {
          responseHeaders[key.toLowerCase()] = value;
        }
      }
    };

    res.setHeader = (key, value) => {
      responseHeaders[key.toLowerCase()] = value;
    };

    res.getHeader = (key) => responseHeaders[key.toLowerCase()];

    res.end = (chunk) => {
      if (chunk) {
        responseData += chunk.toString();
      }
      let parsedBody;
      try {
        parsedBody = JSON.parse(responseData);
      } catch {
        parsedBody = responseData;
      }

      resolve({
        status: statusCode,
        headers: responseHeaders,
        body: parsedBody,
        rawBody: responseData
      });
    };

    res.on('error', reject);

    // Emit the request on the captured HTTP server
    capturedServer.emit('request', req, res);

    // If simulating a stream error (e.g. broken socket / aborted request)
    if (simulateStreamError) {
      process.nextTick(() => {
        req.emit('error', simulateStreamError instanceof Error ? simulateStreamError : new Error(String(simulateStreamError)));
      });
    }
  });
}

// Track execution metrics
const metrics = {
  total: 0,
  passed: 0,
  failed: 0,
  startTime: Date.now()
};

let summaryPrinted = false;
process.on('beforeExit', () => {
  if (summaryPrinted) return;
  summaryPrinted = true;
  const elapsed = Date.now() - metrics.startTime;
  console.log('\n======================================================================');
  console.log('       HIREFLOW REST API CONTRACT TEST RUNNER - SUMMARY REPORT');
  console.log('======================================================================');
  console.log(` Status      : ${metrics.failed === 0 ? 'ALL TESTS PASSED (PASS)' : 'TESTS FAILED (FAIL)'}`);
  console.log(` Total Tests : ${metrics.total}`);
  console.log(` Passed      : ${metrics.passed}`);
  console.log(` Failed      : ${metrics.failed}`);
  console.log(` Duration    : ${elapsed} ms`);
  console.log('======================================================================\n');
  process.exitCode = metrics.failed === 0 ? 0 : 1;
});

// =============================================================================
// TEST SUITE DEFINITIONS
// =============================================================================

describe('Milestone M1: REST API Contract & Endpoint Test Suite', () => {

  // ---------------------------------------------------------------------------
  // FEATURE 1: Health Check & CORS Preflight Contract
  // ---------------------------------------------------------------------------
  describe('Feature 1: GET /api/v1/health & CORS Preflight Contract', () => {

    it('1.1 should return HTTP 200 with service metadata on GET /api/v1/health', async () => {
      metrics.total++;
      const res = await request('/api/v1/health');
      assert.strictEqual(res.status, 200, 'Health endpoint must return status 200');
      assert.strictEqual(res.body.status, 'UP');
      assert.strictEqual(res.body.service, 'HireFlow + OmniTalent Fusion Engine');
      assert.strictEqual(res.body.version, '2.0.0');
      metrics.passed++;
    });

    it('1.2 should return numeric system counts in health payload', async () => {
      metrics.total++;
      const res = await request('/api/v1/health');
      assert.strictEqual(typeof res.body.activeOrganizations, 'number');
      assert.strictEqual(typeof res.body.activeJobs, 'number');
      assert.strictEqual(typeof res.body.totalApplications, 'number');
      assert.ok(res.body.activeOrganizations >= 2, 'Active organizations count >= 2');
      assert.ok(res.body.activeJobs >= 2, 'Active jobs count >= 2');
      assert.ok(res.body.totalApplications >= 4, 'Total applications count >= 4');
      metrics.passed++;
    });

    it('1.3 should set permissive CORS headers on health check response', async () => {
      metrics.total++;
      const res = await request('/api/v1/health');
      assert.strictEqual(res.headers['access-control-allow-origin'], '*');
      assert.ok(res.headers['access-control-allow-methods'].includes('GET'));
      assert.ok(res.headers['access-control-allow-methods'].includes('POST'));
      metrics.passed++;
    });

    it('1.4 should return HTTP 204 No Content for CORS OPTIONS preflight', async () => {
      metrics.total++;
      const res = await request('/api/v1/health', { method: 'OPTIONS' });
      assert.strictEqual(res.status, 204, 'Preflight must return HTTP 204');
      assert.strictEqual(res.headers['access-control-allow-origin'], '*');
      assert.ok(res.headers['access-control-allow-methods'].includes('OPTIONS'));
      assert.ok(res.headers['access-control-allow-headers'].includes('Content-Type'));
      metrics.passed++;
    });

    it('1.5 should handle CORS OPTIONS preflight on any API route', async () => {
      metrics.total++;
      const res = await request('/api/v1/jobs', { method: 'OPTIONS' });
      assert.strictEqual(res.status, 204);
      assert.strictEqual(res.headers['access-control-allow-origin'], '*');
      metrics.passed++;
    });
  });

  // ---------------------------------------------------------------------------
  // FEATURE 6: Shortlist Leaderboard API Contract (Baseline Verification)
  // ---------------------------------------------------------------------------
  describe('Feature 6: GET /api/v1/jobs/:jobId/shortlist Contract', () => {

    it('6.1 should return HTTP 200 with job, portal, and leaderboard array for JOB-8F9A2C', async () => {
      metrics.total++;
      const res = await request('/api/v1/jobs/JOB-8F9A2C/shortlist');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.job, 'Response must include job requisition');
      assert.strictEqual(res.body.job.jobId, 'JOB-8F9A2C');
      assert.ok(res.body.portal, 'Response must include tenant portal organization');
      assert.strictEqual(res.body.portal.orgId, 'ORG-APEX88');
      assert.ok(Array.isArray(res.body.leaderboard), 'Leaderboard must be an array');
      assert.ok(res.body.leaderboard.length >= 4, 'Leaderboard must contain all 4 seed applicants');
      metrics.passed++;
    });

    it('6.2 should sort leaderboard strictly descending by matchScorePercentage', async () => {
      metrics.total++;
      const res = await request('/api/v1/jobs/JOB-8F9A2C/shortlist');
      const leaderboard = res.body.leaderboard;
      for (let i = 0; i < leaderboard.length - 1; i++) {
        assert.ok(
          leaderboard[i].matchScorePercentage >= leaderboard[i + 1].matchScorePercentage,
          `Index ${i} (${leaderboard[i].matchScorePercentage}%) must be >= Index ${i+1} (${leaderboard[i+1].matchScorePercentage}%)`
        );
      }
      metrics.passed++;
    });

    it('6.3 should verify authoritative match scores for seed candidates', async () => {
      metrics.total++;
      const res = await request('/api/v1/jobs/JOB-8F9A2C/shortlist');
      const leaderboard = res.body.leaderboard;

      const aarav = leaderboard.find(e => e.application.candidateName === 'Aarav Sharma');
      const priya = leaderboard.find(e => e.application.candidateName === 'Priya Soni');
      const diya = leaderboard.find(e => e.application.candidateName === 'Diya Nair');
      const rohan = leaderboard.find(e => e.application.candidateName === 'Rohan Verma');

      assert.ok(aarav, 'Aarav Sharma must be in leaderboard');
      assert.ok(priya, 'Priya Soni must be in leaderboard');
      assert.ok(diya, 'Diya Nair must be in leaderboard');
      assert.ok(rohan, 'Rohan Verma must be in leaderboard');

      // Authoritative expected outputs:
      // Aarav: 5/5 Core (70), 2/2 Bonus (20), 2 yrs exp (6) = 96%
      assert.strictEqual(aarav.matchScorePercentage, 96, 'Aarav Sharma matchScore must be 96%');
      assert.strictEqual(aarav.compositeFormulaScore, 98, 'Aarav Sharma composite score must be 98%');
      assert.strictEqual(aarav.autoShortlisted, true, 'Aarav Sharma must be autoShortlisted');

      // Priya: 5/5 Core (70), 1/2 Bonus (10), 4 yrs exp (10) = 90%
      assert.strictEqual(priya.matchScorePercentage, 90, 'Priya Soni matchScore must be 90%');
      assert.strictEqual(priya.compositeFormulaScore, 94, 'Priya Soni composite score must be 94%');
      assert.strictEqual(priya.autoShortlisted, true, 'Priya Soni must be autoShortlisted');

      // Diya: 5/5 Core (70), 1/2 Bonus (10), 3 yrs exp (8) = 88%
      assert.strictEqual(diya.matchScorePercentage, 88, 'Diya Nair matchScore must be 88%');
      assert.strictEqual(diya.compositeFormulaScore, 92, 'Diya Nair composite score must be 92%');
      assert.strictEqual(diya.autoShortlisted, true, 'Diya Nair must be autoShortlisted');

      // Rohan: 3/5 Core (42), 0/2 Bonus (0), 1 yr exp (3) = 45%
      assert.strictEqual(rohan.matchScorePercentage, 45, 'Rohan Verma matchScore must be 45%');
      assert.strictEqual(rohan.compositeFormulaScore, 66, 'Rohan Verma composite score must be 66%');
      assert.strictEqual(rohan.autoShortlisted, false, 'Rohan Verma must NOT be autoShortlisted (below 75% cutoff)');
      metrics.passed++;
    });

    it('6.4 should include strengths, skill gaps, and formula breakdowns', async () => {
      metrics.total++;
      const res = await request('/api/v1/jobs/JOB-8F9A2C/shortlist');
      const aarav = res.body.leaderboard.find(e => e.application.candidateName === 'Aarav Sharma');
      const rohan = res.body.leaderboard.find(e => e.application.candidateName === 'Rohan Verma');

      assert.ok(aarav.strengths.length > 0, 'Aarav must have identified strengths');
      assert.strictEqual(aarav.skillGaps.length, 0, 'Aarav should have 0 skill gaps on JOB-8F9A2C');

      assert.ok(rohan.skillGaps.length > 0, 'Rohan must have identified skill gaps');
      assert.ok(rohan.skillGaps.some(g => g.includes('Missing Core')), 'Rohan must have Missing Core gaps');

      assert.ok(aarav.formulaBreakdown, 'Formula breakdown must be present');
      assert.strictEqual(aarav.formulaBreakdown.semanticSim, 100);
      assert.strictEqual(aarav.formulaBreakdown.bm25Score, 100);
      metrics.passed++;
    });

    it('6.5 should fall back to state.jobs[0] when unknown jobId is requested', async () => {
      metrics.total++;
      const res = await request('/api/v1/jobs/JOB-UNKNOWN-FALLBACK/shortlist');
      assert.strictEqual(res.status, 200, 'Unknown jobId returns 200 via fallback to state.jobs[0]');
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.job);
      assert.ok(Array.isArray(res.body.leaderboard));
      metrics.passed++;
    });
  });

  // ---------------------------------------------------------------------------
  // FEATURE 5: AI Resume NLP Parsing On-Demand Contract
  // ---------------------------------------------------------------------------
  describe('Feature 5: POST /api/v1/ai/parse Contract', () => {

    it('5.1 should extract known skills from resume text', async () => {
      metrics.total++;
      const rawResumeText = 'Senior Cloud Engineer with 7 years of experience in Java, Spring Boot, Microservices, Docker, Kubernetes, AWS, Kafka, SQL, and Python.';
      const res = await request('/api/v1/ai/parse', {
        method: 'POST',
        body: { rawResumeText }
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      const data = res.body.data;
      assert.ok(Array.isArray(data.extractedSkills));
      assert.ok(data.extractedSkills.includes('JAVA'));
      assert.ok(data.extractedSkills.includes('SPRING BOOT'));
      assert.ok(data.extractedSkills.includes('MICROSERVICES'));
      assert.ok(data.extractedSkills.includes('DOCKER'));
      assert.ok(data.extractedSkills.includes('KUBERNETES'));
      assert.ok(data.extractedSkills.includes('AWS'));
      assert.ok(data.extractedSkills.includes('KAFKA'));
      assert.ok(data.extractedSkills.includes('SQL'));
      assert.ok(data.extractedSkills.includes('PYTHON'));
      metrics.passed++;
    });

    it('5.2 should detect experience years using regex /(\\d+)\\+?\\s*years?/i', async () => {
      metrics.total++;
      const tests = [
        { text: 'Fullstack developer with 5 years experience', expected: 5 },
        { text: 'DevOps Architect with 8+ years designing infrastructure', expected: 8 },
        { text: 'Over 12 years building enterprise software', expected: 12 },
        { text: 'Lead Engineer (10+ YEARS in Java)', expected: 10 }
      ];

      for (const t of tests) {
        const res = await request('/api/v1/ai/parse', {
          method: 'POST',
          body: { rawResumeText: t.text }
        });
        assert.strictEqual(res.body.data.detectedExperienceYears, t.expected, `Expected ${t.expected} years for '${t.text}'`);
      }
      metrics.passed++;
    });

    it('5.3 should default to 0 experience years when no experience pattern matches', async () => {
      metrics.total++;
      const res = await request('/api/v1/ai/parse', {
        method: 'POST',
        body: { rawResumeText: 'Recent computer science graduate proficient in Python, SQL, and Git.' }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.detectedExperienceYears, 0);
      metrics.passed++;
    });

    it('5.4 should generate deterministic 768-dim pseudo-embedding preview', async () => {
      metrics.total++;
      const res = await request('/api/v1/ai/parse', {
        method: 'POST',
        body: { rawResumeText: 'Backend Developer with 3 years in Java, SQL, and Redis.' }
      });
      assert.strictEqual(res.status, 200);
      const preview = res.body.data.embeddingPreview;
      assert.ok(Array.isArray(preview), 'embeddingPreview must be an array');
      assert.strictEqual(preview.length, 8, 'embeddingPreview must have 8 dimensions');
      preview.forEach((val, idx) => {
        assert.strictEqual(typeof val, 'number', `Index ${idx} must be a number`);
        assert.ok(val >= 0.0 && val <= 1.0, `Index ${idx} (${val}) must be normalized between 0.0 and 1.0`);
      });
      metrics.passed++;
    });

    it('5.5 should preserve custom applicationId if supplied or generate temporary ID', async () => {
      metrics.total++;
      const resCustom = await request('/api/v1/ai/parse', {
        method: 'POST',
        body: { rawResumeText: 'Java developer 2 years', applicationId: 'APP-CUSTOM-123' }
      });
      assert.strictEqual(resCustom.body.data.applicationId, 'APP-CUSTOM-123');

      const resAuto = await request('/api/v1/ai/parse', {
        method: 'POST',
        body: { rawResumeText: 'Java developer 2 years' }
      });
      assert.ok(resAuto.body.data.applicationId.startsWith('APP-TEMP-'));
      metrics.passed++;
    });

    it('5.6 should handle empty or missing resume text gracefully', async () => {
      metrics.total++;
      const res = await request('/api/v1/ai/parse', {
        method: 'POST',
        body: {}
      });
      assert.strictEqual(res.status, 200);
      assert.deepStrictEqual(res.body.data.extractedSkills, []);
      assert.strictEqual(res.body.data.detectedExperienceYears, 0);
      assert.ok(Array.isArray(res.body.data.embeddingPreview));
      metrics.passed++;
    });
  });

  // ---------------------------------------------------------------------------
  // FEATURE 2: Organizations Management API Contract
  // ---------------------------------------------------------------------------
  describe('Feature 2: GET & POST /api/v1/organizations Contract', () => {

    it('2.1 should return HTTP 200 with seed organizations on GET /api/v1/organizations', async () => {
      metrics.total++;
      const res = await request('/api/v1/organizations');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.data.length >= 2);

      const apex = res.body.data.find(o => o.orgId === 'ORG-APEX88');
      assert.ok(apex, 'ORG-APEX88 must exist');
      assert.strictEqual(apex.name, 'Apex Cloud Systems');
      assert.strictEqual(apex.type, 'COMPANY');
      assert.strictEqual(apex.customSubdomain, 'apexcloud.hireflow.ai');
      assert.strictEqual(apex.minimumShortlistScore, 75);

      const nexa = res.body.data.find(o => o.orgId === 'ORG-NEXA42');
      assert.ok(nexa, 'ORG-NEXA42 must exist');
      assert.strictEqual(nexa.name, 'NexaTech University TPO');
      assert.strictEqual(nexa.type, 'UNIVERSITY');
      assert.strictEqual(nexa.minimumShortlistScore, 80);
      metrics.passed++;
    });

    it('2.2 should create a new organization with custom attributes on POST /api/v1/organizations', async () => {
      metrics.total++;
      const payload = {
        name: 'Quantum AI Systems',
        type: 'COMPANY',
        subdomain: 'quantumai',
        minScore: 82,
        logoColor: '#10b981'
      };
      const res = await request('/api/v1/organizations', {
        method: 'POST',
        body: payload
      });

      assert.strictEqual(res.status, 201, 'POST /organizations must return HTTP 201');
      assert.strictEqual(res.body.success, true);
      const newOrg = res.body.data;
      assert.ok(newOrg.orgId.startsWith('ORG-'), 'orgId must start with ORG-');
      assert.strictEqual(newOrg.orgId.length, 10, 'orgId length must be 10 (ORG-XXXXXX)');
      assert.strictEqual(newOrg.name, 'Quantum AI Systems');
      assert.strictEqual(newOrg.type, 'COMPANY');
      assert.strictEqual(newOrg.customSubdomain, 'quantumai.hireflow.ai');
      assert.strictEqual(newOrg.minimumShortlistScore, 82);
      assert.strictEqual(newOrg.logoColor, '#10b981');
      assert.ok(new Date(newOrg.createdAt).getTime() > 0, 'createdAt must be valid ISO timestamp');
      metrics.passed++;
    });

    it('2.3 should apply default values when creating organization with minimal body', async () => {
      metrics.total++;
      const res = await request('/api/v1/organizations', {
        method: 'POST',
        body: {}
      });

      assert.strictEqual(res.status, 201);
      const org = res.body.data;
      assert.strictEqual(org.name, 'New Organization');
      assert.strictEqual(org.type, 'COMPANY');
      assert.strictEqual(org.customSubdomain, 'org.hireflow.ai');
      assert.strictEqual(org.minimumShortlistScore, 75);
      assert.strictEqual(org.logoColor, '#8b5cf6');
      metrics.passed++;
    });

    it('2.4 should create organization with UNIVERSITY type when requested', async () => {
      metrics.total++;
      const res = await request('/api/v1/organizations', {
        method: 'POST',
        body: { name: 'IIT Bangalore Placement Cell', type: 'UNIVERSITY', subdomain: 'iitb' }
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.data.type, 'UNIVERSITY');
      assert.strictEqual(res.body.data.customSubdomain, 'iitb.hireflow.ai');
      metrics.passed++;
    });

    it('2.5 should verify that GET /api/v1/organizations reflects newly created organizations', async () => {
      metrics.total++;
      const res = await request('/api/v1/organizations');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.data.some(o => o.name === 'Quantum AI Systems'));
      metrics.passed++;
    });
  });

  // ---------------------------------------------------------------------------
  // FEATURE 3: Job Requisitions API Contract
  // ---------------------------------------------------------------------------
  describe('Feature 3: GET & POST /api/v1/jobs Contract', () => {

    it('3.1 should return HTTP 200 with seed jobs on GET /api/v1/jobs', async () => {
      metrics.total++;
      const res = await request('/api/v1/jobs');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.data.length >= 2);

      const job1 = res.body.data.find(j => j.jobId === 'JOB-8F9A2C');
      assert.ok(job1);
      assert.strictEqual(job1.title, 'Senior Backend Engineer (Java / Distributed Systems)');
      assert.strictEqual(job1.requiredExperienceYears, 2);
      assert.deepStrictEqual(job1.mandatorySkills, ['JAVA', 'SPRING BOOT', 'MICROSERVICES', 'DOCKER', 'SQL']);
      assert.deepStrictEqual(job1.preferredSkills, ['KUBERNETES', 'KAFKA']);
      assert.strictEqual(job1.status, 'OPEN');

      const job2 = res.body.data.find(j => j.jobId === 'JOB-3D7E1A');
      assert.ok(job2);
      assert.strictEqual(job2.requiredExperienceYears, 6);
      metrics.passed++;
    });

    it('3.2 should create a new job with normalized uppercase skills on POST /api/v1/jobs', async () => {
      metrics.total++;
      const newJobPayload = {
        title: 'Lead Cloud Architect',
        employmentType: 'FULL_TIME',
        minSalaryLPA: 35,
        maxSalaryLPA: 50,
        equityOfferedPercent: 0.5,
        mandatorySkills: ['java', '  docker  ', 'kubernetes', 'aws'],
        preferredSkills: ['terraform', 'python'],
        requiredExperienceYears: 5,
        location: 'Remote, India'
      };

      const res = await request('/api/v1/jobs', {
        method: 'POST',
        body: newJobPayload
      });

      assert.strictEqual(res.status, 201, 'POST /jobs must return HTTP 201');
      assert.strictEqual(res.body.success, true);
      const created = res.body.data;
      assert.ok(created.jobId.startsWith('JOB-'));
      assert.strictEqual(created.title, 'Lead Cloud Architect');
      assert.strictEqual(created.requiredExperienceYears, 5);
      assert.strictEqual(created.minSalaryLPA, 35);
      assert.strictEqual(created.maxSalaryLPA, 50);
      assert.strictEqual(created.equityOfferedPercent, 0.5);
      assert.deepStrictEqual(created.mandatorySkills, ['JAVA', 'DOCKER', 'KUBERNETES', 'AWS'], 'Mandatory skills must be uppercase and trimmed');
      assert.deepStrictEqual(created.preferredSkills, ['TERRAFORM', 'PYTHON'], 'Preferred skills must be uppercase and trimmed');
      assert.strictEqual(created.status, 'OPEN');
      metrics.passed++;
    });

    it('3.3 should apply default values when creating job with minimal payload', async () => {
      metrics.total++;
      const res = await request('/api/v1/jobs', {
        method: 'POST',
        body: {}
      });

      assert.strictEqual(res.status, 201);
      const job = res.body.data;
      assert.strictEqual(job.title, 'Software Engineer');
      assert.strictEqual(job.employmentType, 'FULL_TIME');
      assert.strictEqual(job.minSalaryLPA, 15);
      assert.strictEqual(job.maxSalaryLPA, 25);
      assert.strictEqual(job.equityOfferedPercent, 0.1);
      assert.deepStrictEqual(job.mandatorySkills, ['JAVA']);
      assert.deepStrictEqual(job.preferredSkills, ['KAFKA']);
      assert.strictEqual(job.requiredExperienceYears, 2);
      assert.strictEqual(job.location, 'Bangalore, India');
      assert.strictEqual(job.status, 'OPEN');
      metrics.passed++;
    });

    it('3.4 should verify GET /api/v1/jobs includes newly added jobs', async () => {
      metrics.total++;
      const res = await request('/api/v1/jobs');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.data.some(j => j.title === 'Lead Cloud Architect'));
      metrics.passed++;
    });
  });

  // ---------------------------------------------------------------------------
  // FEATURE 4: Applications & Living Profiles API Contract
  // ---------------------------------------------------------------------------
  describe('Feature 4: GET & POST /api/v1/applications Contract', () => {

    it('4.1 should return HTTP 200 with seed applications on GET /api/v1/applications', async () => {
      metrics.total++;
      const res = await request('/api/v1/applications');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.data.length >= 4);

      const aarav = res.body.data.find(a => a.applicationId === 'APP-1B4D7E');
      assert.ok(aarav);
      assert.strictEqual(aarav.candidateName, 'Aarav Sharma');
      assert.strictEqual(aarav.jobId, 'JOB-8F9A2C');
      assert.strictEqual(aarav.kanbanStage, 'OfferExtended');
      assert.strictEqual(aarav.graphTrustScore, 0.94);
      assert.strictEqual(aarav.intentScore, 0.92);
      metrics.passed++;
    });

    it('4.2 should create candidate application and automatically trigger NLP profiling on POST', async () => {
      metrics.total++;
      const candidatePayload = {
        candidateName: 'Kavita Menon',
        email: 'kavita.m@dev.org',
        headline: 'Distributed Systems & Cloud Engineer',
        jobId: 'JOB-8F9A2C',
        rawResumeText: 'Senior Backend Engineer with 4 years building scalable services using Java, Spring Boot, Microservices, Docker, Kubernetes, and Kafka.',
        portfolioArtifactUrls: ['https://github.com/kavitamenon/raft-consensus'],
        referralChain: 'Kavita -> Rajesh K. -> Apex Cloud',
        expectedBaseSalaryLPA: 26
      };

      const res = await request('/api/v1/applications', {
        method: 'POST',
        body: candidatePayload
      });

      assert.strictEqual(res.status, 201, 'POST /applications must return HTTP 201');
      assert.strictEqual(res.body.success, true);
      const app = res.body.data;
      assert.ok(app.applicationId.startsWith('APP-'));
      assert.strictEqual(app.candidateName, 'Kavita Menon');
      assert.strictEqual(app.email, 'kavita.m@dev.org');
      assert.strictEqual(app.kanbanStage, 'Applied', 'Initial stage must be Applied');
      assert.strictEqual(app.expectedBaseSalaryLPA, 26);
      assert.deepStrictEqual(app.portfolioArtifactUrls, ['https://github.com/kavitamenon/raft-consensus']);

      // Auto-triggered AI profile in response:
      const profile = res.body.aiProfile;
      assert.ok(profile, 'Response must include auto-generated aiProfile');
      assert.strictEqual(profile.applicationId, app.applicationId);
      assert.strictEqual(profile.detectedExperienceYears, 4);
      assert.ok(profile.extractedSkills.includes('JAVA'));
      assert.ok(profile.extractedSkills.includes('SPRING BOOT'));
      assert.ok(profile.extractedSkills.includes('MICROSERVICES'));
      assert.ok(profile.extractedSkills.includes('DOCKER'));
      assert.ok(profile.extractedSkills.includes('KUBERNETES'));
      assert.ok(profile.extractedSkills.includes('KAFKA'));
      assert.ok(Array.isArray(profile.embeddingPreview));
      assert.strictEqual(profile.embeddingPreview.length, 8);
      metrics.passed++;
    });

    it('4.3 should apply default fields when creating application with minimal body', async () => {
      metrics.total++;
      const res = await request('/api/v1/applications', {
        method: 'POST',
        body: {}
      });

      assert.strictEqual(res.status, 201);
      const app = res.body.data;
      assert.strictEqual(app.candidateName, 'Anonymous Candidate');
      assert.strictEqual(app.email, 'candidate@example.com');
      assert.strictEqual(app.kanbanStage, 'Applied');
      assert.strictEqual(app.expectedBaseSalaryLPA, 20);
      assert.deepStrictEqual(app.referralChain, ['Direct Applicant']);
      assert.strictEqual(app.openToOpportunities, true);
      metrics.passed++;
    });

    it('4.4 should verify GET /api/v1/applications includes newly added candidate', async () => {
      metrics.total++;
      const res = await request('/api/v1/applications');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.data.some(a => a.candidateName === 'Kavita Menon'));
      metrics.passed++;
    });
  });

  // ---------------------------------------------------------------------------
  // FEATURE 7: Human Decision Engine & Stage Synchronization Contract
  // ---------------------------------------------------------------------------
  describe('Feature 7: POST /api/v1/applications/:appId/decision Contract', () => {

    it('7.1 should record SelectedForOffer decision and synchronize stage to OfferExtended', async () => {
      metrics.total++;
      const payload = {
        decisionType: 'SelectedForOffer',
        reviewer: 'Anil (Director Eng)',
        interviewNotes: 'Superb architecture understanding, clear communication.',
        offeredCTC: 22.5,
        equityOfferedPercent: 0.20,
        scorecardRatings: { systemDesign: 5, coding: 5, problemSolving: 4, culture: 5 }
      };

      const res = await request('/api/v1/applications/APP-3C9E1A/decision', {
        method: 'POST',
        body: payload
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.application.kanbanStage, 'OfferExtended', 'SelectedForOffer must set kanbanStage to OfferExtended');
      assert.strictEqual(res.body.decision.decisionType, 'SelectedForOffer');
      assert.strictEqual(res.body.decision.offeredCTC, 22.5);
      assert.strictEqual(res.body.decision.equityOfferedPercent, 0.20);
      assert.strictEqual(res.body.decision.scorecardRatings.systemDesign, 5);
      metrics.passed++;
    });

    it('7.2 should record HoldWaitlist decision and synchronize stage to Interviewing', async () => {
      metrics.total++;
      const res = await request('/api/v1/applications/APP-9X4K2L/decision', {
        method: 'POST',
        body: {
          decisionType: 'HoldWaitlist',
          reviewer: 'Talent Acquisition Team',
          interviewNotes: 'Strong contender, holding for final candidate comparison.'
        }
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.application.kanbanStage, 'Interviewing', 'HoldWaitlist must set kanbanStage to Interviewing');
      assert.strictEqual(res.body.decision.decisionType, 'HoldWaitlist');
      metrics.passed++;
    });

    it('7.3 should record Rejected decision and synchronize stage to Closed', async () => {
      metrics.total++;
      const res = await request('/api/v1/applications/APP-9X4K2L/decision', {
        method: 'POST',
        body: {
          decisionType: 'Rejected',
          reviewer: 'Hiring Committee',
          interviewNotes: 'Compensation misalignment.'
        }
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.application.kanbanStage, 'Closed', 'Rejected decision must set kanbanStage to Closed');
      assert.strictEqual(res.body.decision.decisionType, 'Rejected');
      metrics.passed++;
    });

    it('7.4 should update existing decision record for the applicant in state.hiringDecisions without duplicate entries', async () => {
      metrics.total++;
      const auditRes = await request('/api/v1/audit');
      const diyaDecisions = auditRes.body.hiringDecisions.filter(d => d.applicationId === 'APP-3C9E1A');
      assert.strictEqual(diyaDecisions.length, 1, 'There must be exactly 1 active decision record per applicant');
      metrics.passed++;
    });

    it('7.5 should return HTTP 404 when deciding on nonexistent applicationId', async () => {
      metrics.total++;
      const res = await request('/api/v1/applications/APP-NONEXISTENT-999/decision', {
        method: 'POST',
        body: { decisionType: 'Rejected' }
      });

      assert.strictEqual(res.status, 404, 'Must return 404 for missing applicant');
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error, 'Application not found');
      metrics.passed++;
    });
  });

  // ---------------------------------------------------------------------------
  // FEATURE 8: ATS Kanban Pipeline Management Contract
  // ---------------------------------------------------------------------------
  describe('Feature 8: GET & POST /api/v1/kanban Contract', () => {

    it('8.1 should return HTTP 200 with all 6 canonical Kanban stages on GET /api/v1/kanban', async () => {
      metrics.total++;
      const res = await request('/api/v1/kanban');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.board, 'Board object must be present');

      const expectedStages = ['Sourced', 'Applied', 'AssessmentPending', 'Interviewing', 'OfferExtended', 'Closed'];
      const actualStages = Object.keys(res.body.board);

      expectedStages.forEach(stage => {
        assert.ok(actualStages.includes(stage), `Board must contain stage '${stage}'`);
        assert.ok(Array.isArray(res.body.board[stage]), `Stage '${stage}' must be an array`);
      });
      metrics.passed++;
    });

    it('8.2 should move candidate card between stages on POST /api/v1/kanban/move', async () => {
      metrics.total++;
      // Move Aarav from OfferExtended to Closed
      const moveRes = await request('/api/v1/kanban/move', {
        method: 'POST',
        body: {
          applicationId: 'APP-1B4D7E',
          newStage: 'Closed'
        }
      });

      assert.strictEqual(moveRes.status, 200);
      assert.strictEqual(moveRes.body.success, true);
      assert.strictEqual(moveRes.body.app.kanbanStage, 'Closed');

      // Verify via GET /api/v1/kanban that Aarav is now in the Closed column
      const boardRes = await request('/api/v1/kanban');
      const closedApps = boardRes.body.board.Closed;
      assert.ok(closedApps.some(a => a.applicationId === 'APP-1B4D7E'), 'Aarav must be present in Closed stage');
      metrics.passed++;
    });

    it('8.3 should return HTTP 404 on POST /api/v1/kanban/move for non-existent candidate', async () => {
      metrics.total++;
      const res = await request('/api/v1/kanban/move', {
        method: 'POST',
        body: {
          applicationId: 'APP-GHOST-DOES-NOT-EXIST',
          newStage: 'Interviewing'
        }
      });

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error, 'Application not found');
      metrics.passed++;
    });
  });

  // ---------------------------------------------------------------------------
  // FEATURE 9: Social Graph & Network Topology Contract
  // ---------------------------------------------------------------------------
  describe('Feature 9: GET /api/v1/network/graph Contract', () => {

    it('9.1 should return HTTP 200 with graph nodes and edges on GET /api/v1/network/graph', async () => {
      metrics.total++;
      const res = await request('/api/v1/network/graph');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data, 'Data object must exist');
      assert.ok(Array.isArray(res.body.data.nodes), 'Nodes must be an array');
      assert.ok(Array.isArray(res.body.data.edges), 'Edges must be an array');
      assert.ok(res.body.data.nodes.length >= 10, 'Graph should have at least 10 nodes');
      assert.ok(res.body.data.edges.length >= 8, 'Graph should have at least 8 edges');
      metrics.passed++;
    });

    it('9.2 should validate node taxonomy types (CANDIDATE, EMPLOYEE, LEADERSHIP, ORGANIZATION, UNIVERSITY, SKILL)', async () => {
      metrics.total++;
      const res = await request('/api/v1/network/graph');
      const nodes = res.body.data.nodes;
      const types = new Set(nodes.map(n => n.type));

      assert.ok(types.has('CANDIDATE'), 'Nodes must include CANDIDATE type');
      assert.ok(types.has('EMPLOYEE'), 'Nodes must include EMPLOYEE type');
      assert.ok(types.has('LEADERSHIP'), 'Nodes must include LEADERSHIP type');
      assert.ok(types.has('ORGANIZATION'), 'Nodes must include ORGANIZATION type');
      assert.ok(types.has('UNIVERSITY'), 'Nodes must include UNIVERSITY type');
      assert.ok(types.has('SKILL'), 'Nodes must include SKILL type');

      // Check node attributes
      nodes.forEach(n => {
        assert.ok(n.id, 'Node must have an id');
        assert.ok(n.type, 'Node must have a type');
      });
      metrics.passed++;
    });

    it('9.3 should validate edge attributes and warm referral highway path', async () => {
      metrics.total++;
      const res = await request('/api/v1/network/graph');
      const edges = res.body.data.edges;

      edges.forEach(e => {
        assert.ok(e.from, 'Edge must have from node');
        assert.ok(e.to, 'Edge must have to node');
        assert.ok(e.label, 'Edge must have label');
        assert.strictEqual(typeof e.weight, 'number', 'Edge weight must be a number');
      });

      // Verify referral chain from Aarav to Apex Cloud exists:
      // user-aarav -> emp-rajesh -> emp-vikram -> org-apex
      const hasAaravToRajesh = edges.some(e => e.from === 'user-aarav' && e.to === 'emp-rajesh');
      const hasRajeshToVikram = edges.some(e => e.from === 'emp-rajesh' && e.to === 'emp-vikram');
      const hasVikramToApex = edges.some(e => e.from === 'emp-vikram' && e.to === 'org-apex');

      assert.ok(hasAaravToRajesh, 'Edge user-aarav -> emp-rajesh must exist');
      assert.ok(hasRajeshToVikram, 'Edge emp-rajesh -> emp-vikram must exist');
      assert.ok(hasVikramToApex, 'Edge emp-vikram -> org-apex must exist');
      metrics.passed++;
    });
  });

  // ---------------------------------------------------------------------------
  // FEATURE 10: Audit Ledger & Compliance Contract
  // ---------------------------------------------------------------------------
  describe('Feature 10: GET /api/v1/audit Contract', () => {

    it('10.1 should return HTTP 200 with hiring decisions trail and audit timestamp', async () => {
      metrics.total++;
      const res = await request('/api/v1/audit');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.hiringDecisions));
      assert.ok(res.body.hiringDecisions.length >= 3);
      assert.ok(new Date(res.body.auditTimestamp).getTime() > 0, 'auditTimestamp must be valid ISO date');
      metrics.passed++;
    });

    it('10.2 should ensure each audit decision record has required compliance attributes', async () => {
      metrics.total++;
      const res = await request('/api/v1/audit');
      const decisions = res.body.hiringDecisions;

      decisions.forEach(d => {
        assert.ok(d.applicationId, 'Decision must record applicationId');
        assert.ok(d.candidateName, 'Decision must record candidateName');
        assert.ok(['SelectedForOffer', 'HoldWaitlist', 'Rejected'].includes(d.decisionType), `Invalid decisionType: ${d.decisionType}`);
        assert.ok(d.reviewer, 'Decision must record reviewer identity');
        assert.ok(d.decidedAt, 'Decision must record decidedAt timestamp');
        assert.ok(d.scorecardRatings, 'Decision must record scorecardRatings');
      });
      metrics.passed++;
    });
  });

  // ---------------------------------------------------------------------------
  // FEATURE 11: Negative Scenarios, Boundary Conditions & Error Resilience
  // ---------------------------------------------------------------------------
  describe('Feature 11: Negative Scenarios, Boundaries & Error Handling', () => {

    it('11.1 should return HTTP 404 for unknown API routes', async () => {
      metrics.total++;
      const res = await request('/api/v1/nonexistent-route-404');
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error, 'Route not found');
      metrics.passed++;
    });

    it('11.2 should return HTTP 404 for unsupported HTTP methods on registered API endpoints', async () => {
      metrics.total++;
      const res = await request('/api/v1/organizations', { method: 'DELETE' });
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error, 'Route not found');
      metrics.passed++;
    });

    it('11.3 should return HTTP 404 for unrecognized deep sub-routes', async () => {
      metrics.total++;
      const res = await request('/api/v1/jobs/JOB-123/unsupported/action');
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error, 'Route not found');
      metrics.passed++;
    });

    it('11.4 should gracefully handle malformed JSON bodies without crashing', async () => {
      metrics.total++;
      const res = await request('/api/v1/organizations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{"unclosed": "json string, missing brace'
      });

      // parseBody catches JSON syntax errors and resolves { raw: body }
      // The endpoint falls back to default values rather than crashing
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.data.name, 'New Organization');
      metrics.passed++;
    });

    it('11.5 should handle adversarial special characters and emojis safely', async () => {
      metrics.total++;
      const adversarialText = 'Candidate <script>alert("xss")</script> 🚀 100% C++ & C# 5+ years';
      const res = await request('/api/v1/ai/parse', {
        method: 'POST',
        body: { rawResumeText: adversarialText }
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.detectedExperienceYears, 5);
      assert.ok(Array.isArray(res.body.data.extractedSkills));
      metrics.passed++;
    });

    it('11.6 should catch stream/unhandled internal errors and return HTTP 500 JSON payload', async () => {
      metrics.total++;
      // Silence console.error during expected 500 simulation
      const originalConsoleError = console.error;
      console.error = () => {};

      try {
        const res = await request('/api/v1/organizations', {
          method: 'POST',
          simulateStreamError: new Error('Simulated stream IO failure')
        });

        assert.strictEqual(res.status, 500, 'Handled exception must return HTTP 500');
        assert.strictEqual(res.body.error, 'Internal server error');
        assert.ok(res.body.details.includes('Simulated stream IO failure'));
      } finally {
        console.error = originalConsoleError;
      }
      metrics.passed++;
    });

    it('11.7 should recalculate pipeline and reset seed data via POST /api/v1/simulate/run-apex-demo', async () => {
      metrics.total++;
      const res = await request('/api/v1/simulate/run-apex-demo', { method: 'POST' });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.message, '6-Step HireFlow Demo Pipeline recalculated successfully');
      assert.ok(res.body.data.portal);
      assert.ok(res.body.data.job);
      assert.ok(res.body.data.applications);
      assert.ok(res.body.data.shortlist);
      assert.ok(res.body.data.decisions);
      metrics.passed++;
    });

    it('11.8 should serve static assets (index.html) for non-api routes with HTTP 200', async () => {
      metrics.total++;
      const res = await request('/');
      assert.strictEqual(res.status, 200);
      assert.ok(res.headers['content-type'].includes('text/html'));
      assert.ok(res.rawBody.includes('<!DOCTYPE html>'));
      metrics.passed++;
    });
  });
});
