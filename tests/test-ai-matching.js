/**
 * HIREFLOW + OMNITALENT TEST SUITE
 * Milestone M3: AI Matching & Scoring Formula Validation
 * File: tests/test-ai-matching.js
 *
 * Verifies:
 * 1. HireFlow 70/20/10 Deterministic Scoring Formula
 * 2. OmniTalent 40/30/15/15 Hybrid Fusion Engine
 * 3. NLP Skill Extraction & Taxonomy Matching
 * 4. Experience Regex Parsing & Edge Cases (including fractional year defect)
 * 5. Wellfound Compensation & ESOP Mathematical Model
 * 6. Equivalence & Alignment with Java Domain Specifications (HireFlowEngine.java & OmniTalentDomainSpec.java)
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

// =============================================================================
// HELPER: IN-MEMORY SERVER MODULE LOADER
// Dynamically compiles server.js without binding TCP port to test production code
// =============================================================================

function loadServerProductionModule() {
  const serverPath = path.resolve(__dirname, '../server.js');
  const content = fs.readFileSync(serverPath, 'utf8');
  const cutIdx = content.indexOf('server.listen(');
  if (cutIdx === -1) {
    throw new Error('Could not locate server.listen() in server.js');
  }
  let code = content.substring(0, cutIdx);
  code += '\nmodule.exports = { state, calculateShortlistScores, parseResumeNLP, generatePseudoEmbedding, KNOWN_SKILL_TAXONOMY };\n';

  const m = new module.constructor();
  m.paths = module.paths;
  m._compile(code, serverPath);
  return m.exports;
}

// Canonical formula implementations mirroring Java and Node domain engines
function computeHireFlowScore(mandatoryReqs, preferredReqs, requiredExp, candidateSkills, candExp) {
  const cSkillsUpper = new Set(candidateSkills.map(s => s.toUpperCase()));

  // 1. Mandatory Skills (70% weight)
  let mandatoryMatched = 0;
  mandatoryReqs.forEach(req => {
    if (cSkillsUpper.has(req.toUpperCase())) {
      mandatoryMatched++;
    }
  });
  const mandatoryScore = mandatoryReqs.length === 0
    ? 70.0
    : (mandatoryMatched / mandatoryReqs.length) * 70.0;

  // 2. Preferred Skills (20% weight)
  let preferredMatched = 0;
  preferredReqs.forEach(pref => {
    if (cSkillsUpper.has(pref.toUpperCase())) {
      preferredMatched++;
    }
  });
  const preferredScore = preferredReqs.length === 0
    ? 20.0
    : (preferredMatched / preferredReqs.length) * 20.0;

  // 3. Experience Alignment (10% weight)
  let expScore;
  if (candExp >= requiredExp) {
    expScore = Math.min(10.0, 6.0 + (candExp - requiredExp) * 2.0);
  } else {
    expScore = (candExp / Math.max(1, requiredExp)) * 6.0;
  }

  const totalScore = Math.round(mandatoryScore + preferredScore + expScore);
  return {
    mandatoryMatched,
    mandatoryScore,
    preferredMatched,
    preferredScore,
    expScore,
    totalScore
  };
}

function computeCompositeMatch(vectorCosineSimilarity, bm25KeywordScore, graphProximityScore, candidateIntentScore) {
  // OmniTalent Weighted Fusion Formula: 40% Semantic, 30% Hard Skills, 15% Network Graph, 15% Intent
  return (0.40 * vectorCosineSimilarity)
       + (0.30 * bm25KeywordScore)
       + (0.15 * graphProximityScore)
       + (0.15 * candidateIntentScore);
}

function computeWellfoundComp(baseLPA, bonusPct, equityPct, valuationCr) {
  const annualBonus = (baseLPA * bonusPct) / 100;
  const totalEsopGrantCr = (valuationCr * equityPct) / 100;
  const totalEsopGrantLakhs = totalEsopGrantCr * 100;
  const annualizedEsopLakhs = totalEsopGrantLakhs / 4;
  const totalYear1Comp = baseLPA + annualBonus + annualizedEsopLakhs;
  return {
    annualBonus,
    totalEsopGrantCr,
    totalEsopGrantLakhs,
    annualizedEsopLakhs,
    totalYear1Comp: parseFloat(totalYear1Comp.toFixed(2))
  };
}

// =============================================================================
// TEST SUITE 1: HIREFLOW 70/20/10 DETERMINISTIC SCORING FORMULA
// =============================================================================

describe('1. HireFlow 70/20/10 Deterministic Scoring Formula', () => {

  describe('1.1 Mandatory Skills Weighting (70% Max)', () => {
    const preferred = [];
    const reqExp = 2;
    const candExp = 2; // expScore = 6.0

    it('should award full 70.0 points when all mandatory skills match (5/5)', () => {
      const mandatory = ['JAVA', 'SPRING BOOT', 'MICROSERVICES', 'DOCKER', 'SQL'];
      const candidateSkills = ['JAVA', 'SPRING BOOT', 'MICROSERVICES', 'DOCKER', 'SQL'];
      const result = computeHireFlowScore(mandatory, preferred, reqExp, candidateSkills, candExp);
      assert.equal(result.mandatoryMatched, 5);
      assert.equal(result.mandatoryScore, 70.0);
    });

    it('should award proportional points for partial mandatory matches (4/5 = 56.0, 3/5 = 42.0, 2/5 = 28.0, 1/5 = 14.0, 0/5 = 0.0)', () => {
      const mandatory = ['JAVA', 'SPRING BOOT', 'MICROSERVICES', 'DOCKER', 'SQL'];

      const res4 = computeHireFlowScore(mandatory, preferred, reqExp, ['JAVA', 'SPRING BOOT', 'MICROSERVICES', 'DOCKER'], candExp);
      assert.equal(res4.mandatoryScore, 56.0);

      const res3 = computeHireFlowScore(mandatory, preferred, reqExp, ['JAVA', 'SPRING BOOT', 'MICROSERVICES'], candExp);
      assert.equal(res3.mandatoryScore, 42.0);

      const res2 = computeHireFlowScore(mandatory, preferred, reqExp, ['JAVA', 'SQL'], candExp);
      assert.equal(res2.mandatoryScore, 28.0);

      const res1 = computeHireFlowScore(mandatory, preferred, reqExp, ['JAVA'], candExp);
      assert.equal(res1.mandatoryScore, 14.0);

      const res0 = computeHireFlowScore(mandatory, preferred, reqExp, ['PYTHON', 'C++'], candExp);
      assert.equal(res0.mandatoryScore, 0.0);
    });

    it('should default to full 70.0 points when mandatory skills requirement is empty', () => {
      const result = computeHireFlowScore([], preferred, reqExp, ['ANY_SKILL'], candExp);
      assert.equal(result.mandatoryScore, 70.0);
    });
  });

  describe('1.2 Preferred Skills Weighting (20% Max)', () => {
    const mandatory = [];
    const reqExp = 2;
    const candExp = 2;

    it('should award full 20.0 points when all preferred skills match (2/2)', () => {
      const preferred = ['KUBERNETES', 'KAFKA'];
      const candidateSkills = ['KUBERNETES', 'KAFKA'];
      const result = computeHireFlowScore(mandatory, preferred, reqExp, candidateSkills, candExp);
      assert.equal(result.preferredMatched, 2);
      assert.equal(result.preferredScore, 20.0);
    });

    it('should award proportional points for partial preferred matches (1/2 = 10.0, 0/2 = 0.0)', () => {
      const preferred = ['KUBERNETES', 'KAFKA'];

      const res1 = computeHireFlowScore(mandatory, preferred, reqExp, ['KUBERNETES'], candExp);
      assert.equal(res1.preferredScore, 10.0);

      const res0 = computeHireFlowScore(mandatory, preferred, reqExp, ['AWS'], candExp);
      assert.equal(res0.preferredScore, 0.0);
    });

    it('should calculate fractional preferred points with 3 skills (3/3=20, 2/3=13.33, 1/3=6.67, 0/3=0)', () => {
      const preferred = ['AWS', 'KUBERNETES', 'KAFKA'];

      const res3 = computeHireFlowScore(mandatory, preferred, reqExp, ['AWS', 'KUBERNETES', 'KAFKA'], candExp);
      assert.equal(res3.preferredScore, 20.0);

      const res2 = computeHireFlowScore(mandatory, preferred, reqExp, ['AWS', 'KAFKA'], candExp);
      assert.ok(Math.abs(res2.preferredScore - 13.333333333333334) < 1e-9);

      const res1 = computeHireFlowScore(mandatory, preferred, reqExp, ['AWS'], candExp);
      assert.ok(Math.abs(res1.preferredScore - 6.666666666666667) < 1e-9);
    });

    it('should default to full 20.0 points when preferred skills requirement is empty', () => {
      const result = computeHireFlowScore(mandatory, [], reqExp, [], candExp);
      assert.equal(result.preferredScore, 20.0);
    });
  });

  describe('1.3 Experience Alignment Weighting (10% Max)', () => {
    const mandatory = ['JAVA'];
    const preferred = [];

    it('should award baseline 6.0 points when candidate experience exactly equals required experience', () => {
      const res2 = computeHireFlowScore(mandatory, preferred, 2, ['JAVA'], 2);
      assert.equal(res2.expScore, 6.0);

      const res5 = computeHireFlowScore(mandatory, preferred, 5, ['JAVA'], 5);
      assert.equal(res5.expScore, 6.0);
    });

    it('should award +2.0 points for each year above required experience up to a 10.0 cap', () => {
      const reqExp = 3;

      // 1 year above required (4 yrs) -> 6.0 + (4 - 3) * 2.0 = 8.0
      const res4 = computeHireFlowScore(mandatory, preferred, reqExp, ['JAVA'], 4);
      assert.equal(res4.expScore, 8.0);

      // 2 years above required (5 yrs) -> 6.0 + (5 - 3) * 2.0 = 10.0
      const res5 = computeHireFlowScore(mandatory, preferred, reqExp, ['JAVA'], 5);
      assert.equal(res5.expScore, 10.0);

      // 5 years above required (8 yrs) -> capped at 10.0
      const res8 = computeHireFlowScore(mandatory, preferred, reqExp, ['JAVA'], 8);
      assert.equal(res8.expScore, 10.0);

      // Extreme overqualification (25 yrs) -> capped at 10.0
      const res25 = computeHireFlowScore(mandatory, preferred, reqExp, ['JAVA'], 25);
      assert.equal(res25.expScore, 10.0);
    });

    it('should scale down proportionally when candidate experience is below target ((exp / reqExp) * 6.0)', () => {
      const reqExp = 4;

      // 0 years -> 0.0
      assert.equal(computeHireFlowScore(mandatory, preferred, reqExp, ['JAVA'], 0).expScore, 0.0);

      // 1 year out of 4 -> 1.5
      assert.equal(computeHireFlowScore(mandatory, preferred, reqExp, ['JAVA'], 1).expScore, 1.5);

      // 2 years out of 4 (half) -> 3.0
      assert.equal(computeHireFlowScore(mandatory, preferred, reqExp, ['JAVA'], 2).expScore, 3.0);

      // 3 years out of 4 -> 4.5
      assert.equal(computeHireFlowScore(mandatory, preferred, reqExp, ['JAVA'], 3).expScore, 4.5);
    });

    it('should safely handle 0 required experience (fresher roles) without division by zero', () => {
      // 0 req exp, 0 cand exp -> 6.0
      const res0 = computeHireFlowScore(mandatory, preferred, 0, ['JAVA'], 0);
      assert.equal(res0.expScore, 6.0);

      // 0 req exp, 1 cand exp -> 8.0
      const res1 = computeHireFlowScore(mandatory, preferred, 0, ['JAVA'], 1);
      assert.equal(res1.expScore, 8.0);

      // 0 req exp, 2 cand exp -> 10.0 (cap)
      const res2 = computeHireFlowScore(mandatory, preferred, 0, ['JAVA'], 2);
      assert.equal(res2.expScore, 10.0);
    });
  });

  describe('1.4 Total Score Calculation and Rounding', () => {
    it('should calculate 100% for a perfect candidate with all mandatory, all preferred, and surplus experience', () => {
      const res = computeHireFlowScore(
        ['JAVA', 'SPRING BOOT'],
        ['KAFKA'],
        2,
        ['JAVA', 'SPRING BOOT', 'KAFKA'],
        4 // 4 yrs on 2 yrs req -> 10.0
      );
      assert.equal(res.mandatoryScore, 70.0);
      assert.equal(res.preferredScore, 20.0);
      assert.equal(res.expScore, 10.0);
      assert.equal(res.totalScore, 100);
    });

    it('should round fractional intermediate scores properly using Math.round', () => {
      // 56.0 + 13.333 + 6.0 = 75.333 -> rounds to 75
      const res75 = computeHireFlowScore(
        ['A', 'B', 'C', 'D', 'E'],
        ['X', 'Y', 'Z'],
        2,
        ['A', 'B', 'C', 'D', 'X', 'Y'], // 4/5 mandatory = 56, 2/3 preferred = 13.333
        2 // 2 yrs on 2 yrs req = 6.0
      );
      assert.equal(res75.totalScore, 75);

      // 56.0 + 13.333 + 8.0 = 77.333 -> rounds to 77
      const res77 = computeHireFlowScore(
        ['A', 'B', 'C', 'D', 'E'],
        ['X', 'Y', 'Z'],
        2,
        ['A', 'B', 'C', 'D', 'X', 'Y'],
        3 // 3 yrs on 2 yrs req = 8.0
      );
      assert.equal(res77.totalScore, 77);
    });

    it('should accurately determine qualification against cutoff threshold (75% minimum)', () => {
      const cutoff = 75;
      const isQualified = score => score >= cutoff;

      assert.equal(isQualified(74), false, 'Score 74% must be disqualified');
      assert.equal(isQualified(75), true, 'Score 75% must be qualified');
      assert.equal(isQualified(76), true, 'Score 76% must be qualified');
    });
  });

  describe('1.5 Baseline Candidates Deterministic Validation (Apex Cloud Systems Requisition)', () => {
    const apexJobMandatory = ['JAVA', 'SPRING BOOT', 'MICROSERVICES', 'DOCKER', 'SQL'];
    const apexJobPreferred = ['KUBERNETES', 'KAFKA'];
    const apexReqExp = 2;
    const cutoffScore = 75;

    it('should score Aarav Sharma at exactly 96% Match (Qualified)', () => {
      // Aarav: 5/5 Mandatory (70), 2/2 Preferred (20), 2 Yrs Exp (6) -> 96%
      const aaravSkills = ['JAVA', 'SPRING BOOT', 'MICROSERVICES', 'DOCKER', 'SQL', 'KUBERNETES', 'KAFKA', 'REACT', 'REDIS'];
      const res = computeHireFlowScore(apexJobMandatory, apexJobPreferred, apexReqExp, aaravSkills, 2);

      assert.equal(res.mandatoryMatched, 5);
      assert.equal(res.mandatoryScore, 70.0);
      assert.equal(res.preferredMatched, 2);
      assert.equal(res.preferredScore, 20.0);
      assert.equal(res.expScore, 6.0);
      assert.equal(res.totalScore, 96);
      assert.equal(res.totalScore >= cutoffScore, true);
    });

    it('should score Diya Nair at exactly 88% Match (Qualified)', () => {
      // Diya: 5/5 Mandatory (70), 1/2 Preferred (10, missing Kafka), 3 Yrs Exp (8) -> 88%
      const diyaSkills = ['JAVA', 'SPRING BOOT', 'MICROSERVICES', 'DOCKER', 'SQL', 'KUBERNETES', 'REST API', 'CI/CD'];
      const res = computeHireFlowScore(apexJobMandatory, apexJobPreferred, apexReqExp, diyaSkills, 3);

      assert.equal(res.mandatoryMatched, 5);
      assert.equal(res.mandatoryScore, 70.0);
      assert.equal(res.preferredMatched, 1);
      assert.equal(res.preferredScore, 10.0);
      assert.equal(res.expScore, 8.0);
      assert.equal(res.totalScore, 88);
      assert.equal(res.totalScore >= cutoffScore, true);
    });

    it('should score Priya Soni at exactly 90% Match (Qualified)', () => {
      // Priya: 5/5 Mandatory (70), 1/2 Preferred (10, Kafka matched, missing Kubernetes), 4 Yrs Exp (10) -> 90%
      const priyaSkills = ['JAVA', 'SPRING BOOT', 'MICROSERVICES', 'SQL', 'DOCKER', 'KAFKA', 'AWS', 'POSTGRESQL'];
      const res = computeHireFlowScore(apexJobMandatory, apexJobPreferred, apexReqExp, priyaSkills, 4);

      assert.equal(res.mandatoryMatched, 5);
      assert.equal(res.mandatoryScore, 70.0);
      assert.equal(res.preferredMatched, 1);
      assert.equal(res.preferredScore, 10.0);
      assert.equal(res.expScore, 10.0);
      assert.equal(res.totalScore, 90);
      assert.equal(res.totalScore >= cutoffScore, true);
    });

    it('should score Rohan Verma at 31% in Java Spec vs 45% in Node.js Seed (Both Disqualified)', () => {
      // Java Spec: Java, SQL, Python, 1 yr exp
      // Mandatory: 2/5 (28.0), Preferred: 0/2 (0.0), Exp: 1 yr (3.0) -> 31%
      const rohanJavaSkills = ['JAVA', 'SQL', 'PYTHON'];
      const javaRes = computeHireFlowScore(apexJobMandatory, apexJobPreferred, apexReqExp, rohanJavaSkills, 1);
      assert.equal(javaRes.mandatoryScore, 28.0);
      assert.equal(javaRes.preferredScore, 0.0);
      assert.equal(javaRes.expScore, 3.0);
      assert.equal(javaRes.totalScore, 31);
      assert.equal(javaRes.totalScore >= cutoffScore, false);

      // Node.js Seed: Inadvertent "learning modern microservices architectures" matches MICROSERVICES
      // Mandatory: 3/5 (42.0), Preferred: 0/2 (0.0), Exp: 1 yr (3.0) -> 45%
      const rohanNodeSkills = ['JAVA', 'SQL', 'PYTHON', 'MICROSERVICES'];
      const nodeRes = computeHireFlowScore(apexJobMandatory, apexJobPreferred, apexReqExp, rohanNodeSkills, 1);
      assert.equal(nodeRes.mandatoryScore, 42.0);
      assert.equal(nodeRes.preferredScore, 0.0);
      assert.equal(nodeRes.expScore, 3.0);
      assert.equal(nodeRes.totalScore, 45);
      assert.equal(nodeRes.totalScore >= cutoffScore, false);
    });
  });
});

// =============================================================================
// TEST SUITE 2: OMNITALENT 40/30/15/15 HYBRID FUSION ENGINE
// =============================================================================

describe('2. OmniTalent 40/30/15/15 Hybrid Fusion Engine', () => {

  describe('2.1 Mathematical Weight Invariant', () => {
    it('should have weights that sum to exactly 1.00 (100%)', () => {
      const wSemantic = 0.40;
      const wHardSkills = 0.30;
      const wGraph = 0.15;
      const wIntent = 0.15;
      const totalWeight = wSemantic + wHardSkills + wGraph + wIntent;
      assert.equal(totalWeight, 1.00);
    });

    it('should produce 1.00 (100%) for a candidate with perfect 1.0 scores in all dimensions', () => {
      const composite = computeCompositeMatch(1.0, 1.0, 1.0, 1.0);
      assert.equal(composite, 1.00);
      assert.equal(Math.round(composite * 100), 100);
    });

    it('should produce 0.00 (0%) for a candidate with 0.0 in all dimensions', () => {
      const composite = computeCompositeMatch(0.0, 0.0, 0.0, 0.0);
      assert.equal(composite, 0.00);
      assert.equal(Math.round(composite * 100), 0);
    });

    it('should verify isolated contribution of each dimension', () => {
      // 40% Semantic only
      assert.equal(computeCompositeMatch(1.0, 0.0, 0.0, 0.0), 0.40);
      // 30% Hard skills only
      assert.equal(computeCompositeMatch(0.0, 1.0, 0.0, 0.0), 0.30);
      // 15% Graph trust only
      assert.equal(computeCompositeMatch(0.0, 0.0, 1.0, 0.0), 0.15);
      // 15% Candidate intent only
      assert.equal(computeCompositeMatch(0.0, 0.0, 0.0, 1.0), 0.15);
    });

    it('should exhibit strict monotonicity across all four dimensions', () => {
      const base = computeCompositeMatch(0.5, 0.5, 0.5, 0.5);
      assert.ok(computeCompositeMatch(0.6, 0.5, 0.5, 0.5) > base, 'Semantic increase must increase total');
      assert.ok(computeCompositeMatch(0.5, 0.6, 0.5, 0.5) > base, 'Hard skills increase must increase total');
      assert.ok(computeCompositeMatch(0.5, 0.5, 0.6, 0.5) > base, 'Graph trust increase must increase total');
      assert.ok(computeCompositeMatch(0.5, 0.5, 0.5, 0.6) > base, 'Intent increase must increase total');
    });
  });

  describe('2.2 Node.js Server Implementation Fusion Breakdown', () => {
    it('should calculate exact composite scores matching server.js baseline candidates', () => {
      // Aarav Sharma
      const aaravSemantic = 1.0;
      const aaravBm25 = 1.0;
      const aaravGraph = 0.94;
      const aaravIntent = 0.92;
      const aaravComposite = Math.round(computeCompositeMatch(aaravSemantic, aaravBm25, aaravGraph, aaravIntent) * 100);
      // 0.40*1.0 + 0.30*1.0 + 0.15*0.94 + 0.15*0.92 = 0.40 + 0.30 + 0.141 + 0.138 = 0.979 -> 98%
      assert.equal(aaravComposite, 98);

      // Priya Soni
      const priyaSemantic = 1.0;
      const priyaBm25 = (5 + 1 * 0.5) / (5 + 2 * 0.5); // 5.5 / 6.0 = 0.9166667
      const priyaGraph = 0.89;
      const priyaIntent = 0.88;
      const priyaComposite = Math.round(computeCompositeMatch(priyaSemantic, priyaBm25, priyaGraph, priyaIntent) * 100);
      // 0.40*1.0 + 0.30*(5.5/6) + 0.15*0.89 + 0.15*0.88 = 0.40 + 0.275 + 0.1335 + 0.132 = 0.9405 -> 94%
      assert.equal(priyaComposite, 94);

      // Diya Nair
      const diyaSemantic = 1.0;
      const diyaBm25 = (5 + 1 * 0.5) / (5 + 2 * 0.5); // 5.5 / 6.0 = 0.9166667
      const diyaGraph = 0.78;
      const diyaIntent = 0.85;
      const diyaComposite = Math.round(computeCompositeMatch(diyaSemantic, diyaBm25, diyaGraph, diyaIntent) * 100);
      // 0.40*1.0 + 0.30*(5.5/6) + 0.15*0.78 + 0.15*0.85 = 0.40 + 0.275 + 0.117 + 0.1275 = 0.9195 -> 92%
      assert.equal(diyaComposite, 92);

      // Rohan Verma (with microservices matched)
      const rohanSemantic = 0.45 + (3 / 5) * 0.55; // 0.45 + 0.33 = 0.78
      const rohanBm25 = (3 + 0) / (5 + 1); // 3 / 6 = 0.50
      const rohanGraph = 0.40;
      const rohanIntent = 0.95;
      const rohanComposite = Math.round(computeCompositeMatch(rohanSemantic, rohanBm25, rohanGraph, rohanIntent) * 100);
      // 0.40*0.78 + 0.30*0.50 + 0.15*0.40 + 0.15*0.95 = 0.312 + 0.150 + 0.060 + 0.1425 = 0.6645 -> 66%
      assert.equal(rohanComposite, 66);
    });
  });

  describe('2.3 Pseudo-Embedding Generation Verification', () => {
    const serverModule = loadServerProductionModule();

    it('should generate a 768-dimensional normalized embedding vector', () => {
      const vector = serverModule.generatePseudoEmbedding(['JAVA', 'DOCKER'], 3);
      assert.ok(Array.isArray(vector));
      assert.equal(vector.length, 768);
    });

    it('should produce values bounded strictly in range [0.0, 1.0]', () => {
      const vector = serverModule.generatePseudoEmbedding(['KUBERNETES', 'KAFKA', 'AWS'], 5);
      for (let i = 0; i < vector.length; i++) {
        assert.ok(vector[i] >= 0.0 && vector[i] <= 1.0, `Vector element ${i} out of bounds: ${vector[i]}`);
      }
    });

    it('should be 100% deterministic given identical skills and experience', () => {
      const v1 = serverModule.generatePseudoEmbedding(['JAVA', 'SPRING BOOT'], 2);
      const v2 = serverModule.generatePseudoEmbedding(['JAVA', 'SPRING BOOT'], 2);
      assert.deepEqual(v1, v2);
    });

    it('should produce divergent embeddings when skills or experience change', () => {
      const v1 = serverModule.generatePseudoEmbedding(['JAVA'], 2);
      const v2 = serverModule.generatePseudoEmbedding(['PYTHON'], 2);
      const v3 = serverModule.generatePseudoEmbedding(['JAVA'], 5);
      assert.notDeepEqual(v1, v2);
      assert.notDeepEqual(v1, v3);
    });
  });
});

// =============================================================================
// TEST SUITE 3: NLP SKILL EXTRACTION & TAXONOMY MATCHING
// =============================================================================

describe('3. NLP Skill Extraction & Taxonomy Matching', () => {
  const serverModule = loadServerProductionModule();

  const JAVA_TAXONOMY_17 = [
    'JAVA', 'SPRING BOOT', 'MICROSERVICES', 'DOCKER', 'SQL',
    'KUBERNETES', 'KAFKA', 'AWS', 'PYTHON', 'REACT', 'GIT', 'REST API',
    'POSTGRESQL', 'REDIS', 'GRAPHQL', 'TYPESCRIPT', 'DISTRIBUTED SYSTEMS'
  ];

  const NODE_TAXONOMY_21 = serverModule.KNOWN_SKILL_TAXONOMY;

  describe('3.1 Taxonomy Inventory & Divergence Audit', () => {
    it('should confirm Java domain specification contains exactly 17 skills', () => {
      assert.equal(JAVA_TAXONOMY_17.length, 17);
    });

    it('should confirm Node.js server contains exactly 21 skills', () => {
      assert.equal(NODE_TAXONOMY_21.length, 21);
    });

    it('should identify the 4 differential skills added to Node.js server taxonomy', () => {
      const extraInNode = NODE_TAXONOMY_21.filter(s => !JAVA_TAXONOMY_17.includes(s));
      assert.deepEqual(extraInNode, ['GCP', 'TERRAFORM', 'CI/CD', 'SYSTEM DESIGN']);
    });

    it('should verify all 17 Java skills are fully present in the Node.js server taxonomy', () => {
      for (const skill of JAVA_TAXONOMY_17) {
        assert.ok(NODE_TAXONOMY_21.includes(skill), `Missing skill from Node taxonomy: ${skill}`);
      }
    });
  });

  describe('3.2 Case-Insensitive Skill Extraction', () => {
    it('should extract lowercase, mixed-case, and uppercase skill mentions identically', () => {
      const testCases = [
        { text: 'Proficient in java, docker, and sql.', expected: ['JAVA', 'DOCKER', 'SQL'] },
        { text: 'Extensive hands-on SpRiNg BoOt and KuBeRnEtEs experience.', expected: ['SPRING BOOT', 'KUBERNETES'] },
        { text: 'Built robust REST API with POSTGRESQL and REDIS caching.', expected: ['REST API', 'POSTGRESQL', 'REDIS'] },
        { text: 'Experienced in TyPeScRiPt and GrApHqL querying.', expected: ['GRAPHQL', 'TYPESCRIPT'] }
      ];

      for (const tc of testCases) {
        const parsed = serverModule.parseResumeNLP(tc.text, 'APP-TEST');
        for (const expSkill of tc.expected) {
          assert.ok(parsed.extractedSkills.includes(expSkill), `Failed to extract ${expSkill} from "${tc.text}"`);
        }
      }
    });
  });

  describe('3.3 Adversarial Substring Collisions & False Positives', () => {
    it('should verify documented false-positive: "reactive" triggers "REACT"', () => {
      const text = 'Built high-throughput reactive Spring WebFlux microservices';
      const parsed = serverModule.parseResumeNLP(text, 'APP-COLLISION-1');
      assert.ok(parsed.extractedSkills.includes('REACT'), 'Documented defect: substring "REACT" inside "reactive" extracted');
    });

    it('should verify documented false-positive: "JavaScript" triggers "JAVA"', () => {
      const text = 'Full-stack software engineer specialized in JavaScript and Vue.js';
      const parsed = serverModule.parseResumeNLP(text, 'APP-COLLISION-2');
      assert.ok(parsed.extractedSkills.includes('JAVA'), 'Documented defect: substring "JAVA" inside "JavaScript" extracted');
    });

    it('should verify documented false-positive: "digital" triggers "GIT"', () => {
      const text = 'Led enterprise digital transformation for global logistics';
      const parsed = serverModule.parseResumeNLP(text, 'APP-COLLISION-3');
      assert.ok(parsed.extractedSkills.includes('GIT'), 'Documented defect: substring "GIT" inside "digital" extracted');
    });

    it('should verify documented false-positive: "flaws" triggers "AWS"', () => {
      const text = 'Fixed critical flaws in internal web portals';
      const parsed = serverModule.parseResumeNLP(text, 'APP-COLLISION-4');
      assert.ok(parsed.extractedSkills.includes('AWS'), 'Documented defect: substring "AWS" inside "flaws" extracted');
    });

    it('should verify documented false-positive: "NoSQL" triggers "SQL"', () => {
      const text = 'Architected NoSQL document databases with MongoDB';
      const parsed = serverModule.parseResumeNLP(text, 'APP-COLLISION-5');
      assert.ok(parsed.extractedSkills.includes('SQL'), 'Documented defect: substring "SQL" inside "NoSQL" extracted');
    });

    it('should verify Rohan Verma inadvertent "MICROSERVICES" match from "learning modern microservices architectures"', () => {
      const text = 'Junior developer with 1 year experience working on Java, SQL, and Python scripts. Excited about backend development and learning modern microservices architectures.';
      const parsed = serverModule.parseResumeNLP(text, 'APP-ROHAN');
      assert.ok(parsed.extractedSkills.includes('MICROSERVICES'), 'Rohan resume matches MICROSERVICES due to substring containment');
      assert.ok(parsed.extractedSkills.includes('JAVA'));
      assert.ok(parsed.extractedSkills.includes('SQL'));
      assert.ok(parsed.extractedSkills.includes('PYTHON'));
      assert.equal(parsed.extractedSkills.length, 4);
    });
  });

  describe('3.4 Boundary and Stress Edge Cases in Text Parsing', () => {
    it('should return empty extractedSkills array for empty resume string', () => {
      const parsed = serverModule.parseResumeNLP('', 'APP-EMPTY');
      assert.deepEqual(parsed.extractedSkills, []);
      assert.equal(parsed.detectedExperienceYears, 0);
    });

    it('should return empty extractedSkills array for non-technical text', () => {
      const text = 'Professional chef with expertise in culinary arts, menu design, and kitchen leadership.';
      const parsed = serverModule.parseResumeNLP(text, 'APP-CHEF');
      assert.deepEqual(parsed.extractedSkills, []);
    });

    it('should extract all 21 skills when all are present in resume', () => {
      const allText = NODE_TAXONOMY_21.join(' ') + ' with 5 years experience';
      const parsed = serverModule.parseResumeNLP(allText, 'APP-ALL');
      assert.equal(parsed.extractedSkills.length, 21);
    });
  });
});

// =============================================================================
// TEST SUITE 4: EXPERIENCE REGEX PARSING & EDGE CASES
// =============================================================================

describe('4. Experience Regex Parsing & Edge Cases', () => {
  const EXP_PATTERN = /(\d+)\+?\s*years?/i;

  function parseExp(text) {
    const match = text.match(EXP_PATTERN);
    return match ? parseInt(match[1], 10) : 0;
  }

  describe('4.1 Standard Regex Pattern Matching', () => {
    it('should correctly parse standard single-digit and double-digit years', () => {
      assert.equal(parseExp('5 years of backend engineering'), 5);
      assert.equal(parseExp('12 years of industry experience'), 12);
      assert.equal(parseExp('25 years architecting enterprise applications'), 25);
    });

    it('should parse singular "year"', () => {
      assert.equal(parseExp('Junior developer with 1 year experience'), 1);
    });

    it('should parse "+" notation properly ("5+ years", "10+ years")', () => {
      assert.equal(parseExp('5+ years of software development'), 5);
      assert.equal(parseExp('10+ years hands-on experience'), 10);
      assert.equal(parseExp('3+years of testing'), 3);
    });

    it('should handle variable whitespace and tabs ("3   years")', () => {
      assert.equal(parseExp('Developer with 3    years experience'), 3);
      assert.equal(parseExp('Architect with 8 \t years experience'), 8);
    });

    it('should be case-insensitive ("YEARS", "Years", "yEaR")', () => {
      assert.equal(parseExp('4 YEARS OF JAVA'), 4);
      assert.equal(parseExp('6 Years of cloud operations'), 6);
      assert.equal(parseExp('1 yEaR of startup experience'), 1);
    });

    it('should parse 0 years correctly', () => {
      assert.equal(parseExp('Recent graduate with 0 years formal experience'), 0);
    });
  });

  describe('4.2 Missing and Malformed Formats', () => {
    it('should return default 0 when no years of experience are mentioned', () => {
      assert.equal(parseExp('Experienced software developer with strong Java fundamentals'), 0);
      assert.equal(parseExp(''), 0);
    });

    it('should return default 0 for written English number words ("five years")', () => {
      // Documenting engine limitation: word-based numbers are not parsed by \d+
      assert.equal(parseExp('Five years of building scalable systems'), 0);
      assert.equal(parseExp('Two years in software engineering'), 0);
    });
  });

  describe('4.3 First-Match Precedence Defect', () => {
    it('should demonstrate that first match takes precedence over actual relevant experience', () => {
      const text = 'Graduated from college 10 years ago, have 2 years of Java development experience';
      // Regex captures the first (\d+)\s*years? which is "10 years"
      assert.equal(parseExp(text), 10, 'First match precedence captures graduation timeline instead of relevant experience');
    });
  });

  describe('4.4 Critical Decimal / Fractional Year Inflation Defect', () => {
    it('should verify critical defect: "0.5 years" is parsed as 5 years (1000% inflation)', () => {
      const text = 'Intern with 0.5 years of experience in Java';
      // In "0.5 years", the regex /(\d+)\+?\s*years?/i fails on "0." because "." is not \+ or \s
      // The regex engine advances to "5", which matches (\d+) followed by " years"
      // Therefore, parseInt("5", 10) returns 5!
      const parsedYears = parseExp(text);
      assert.equal(parsedYears, 5, 'Critical defect: "0.5 years" parses as 5 years instead of 0 or 0.5');
    });

    it('should verify critical defect: "1.5 years" is parsed as 5 years', () => {
      const text = 'Associate with 1.5 years of experience in Spring Boot';
      const parsedYears = parseExp(text);
      assert.equal(parsedYears, 5, 'Critical defect: "1.5 years" parses as 5 years instead of 1 or 1.5');
    });

    it('should verify critical defect: "3.2 years" is parsed as 2 years', () => {
      const text = 'Engineer with 3.2 years of cloud infrastructure experience';
      const parsedYears = parseExp(text);
      assert.equal(parsedYears, 2, 'Critical defect: "3.2 years" parses as 2 years instead of 3');
    });
  });
});

// =============================================================================
// TEST SUITE 5: WELLFOUND COMPENSATION & ESOP MATHEMATICAL MODEL
// =============================================================================

describe('5. Wellfound Compensation & ESOP Mathematical Model', () => {

  describe('5.1 Core Mathematical Formula Equations', () => {
    it('should compute annual bonus as (base * bonusPct) / 100', () => {
      const base = 20.0;
      const bonusPct = 10.0;
      assert.equal((base * bonusPct) / 100, 2.0);
    });

    it('should compute total ESOP grant in Cr as (valuationCr * equityPct) / 100 and Lakhs as Cr * 100', () => {
      const valuationCr = 50.0;
      const equityPct = 0.25;
      const grantCr = (valuationCr * equityPct) / 100; // 0.125 Cr
      const grantLakhs = grantCr * 100; // 12.5 Lakhs
      assert.equal(grantCr, 0.125);
      assert.equal(grantLakhs, 12.5);
    });

    it('should compute annualized ESOP based on standard 4-year linear vesting schedule (grantLakhs / 4)', () => {
      const grantLakhs = 12.5;
      const annualized = grantLakhs / 4;
      assert.equal(annualized, 3.125);
    });

    it('should compute Total Year 1 comp as base + annualBonus + annualizedEsop', () => {
      const base = 24.0;
      const bonus = 3.6;
      const annualizedEsop = 3.125;
      const totalYear1 = base + bonus + annualizedEsop;
      assert.equal(parseFloat(totalYear1.toFixed(2)), 30.73);
    });
  });

  describe('5.2 Baseline Offer Scenario Validation (Aarav Sharma Digital Offer Letter)', () => {
    it('should match Aarav Sharma baseline offer: ₹24 LPA base, 15% bonus, 0.25% equity @ ₹50 Cr', () => {
      const comp = computeWellfoundComp(24.0, 15.0, 0.25, 50.0);

      // Base: ₹24.00 Lakhs
      // Bonus: ₹3.60 Lakhs (15% of 24)
      assert.equal(comp.annualBonus, 3.6);

      // ESOP Grant: ₹0.125 Cr = ₹12.50 Lakhs
      assert.equal(comp.totalEsopGrantCr, 0.125);
      assert.equal(comp.totalEsopGrantLakhs, 12.5);

      // Annualized ESOP (4 years): ₹3.125 Lakhs / yr
      assert.equal(comp.annualizedEsopLakhs, 3.125);

      // Total Year 1 Compensation: 24 + 3.6 + 3.125 = 30.725 Lakhs -> ₹30.73 LPA
      assert.equal(comp.totalYear1Comp, 30.73);
    });
  });

  describe('5.3 Boundary & Stress Compensation Scenarios', () => {
    it('should handle zero bonus (0%) correctly', () => {
      const comp = computeWellfoundComp(20.0, 0.0, 0.20, 50.0);
      assert.equal(comp.annualBonus, 0.0);
      assert.equal(comp.totalEsopGrantLakhs, 10.0);
      assert.equal(comp.annualizedEsopLakhs, 2.5);
      assert.equal(comp.totalYear1Comp, 22.5);
    });

    it('should handle zero equity (0%) correctly', () => {
      const comp = computeWellfoundComp(30.0, 20.0, 0.0, 50.0);
      assert.equal(comp.annualBonus, 6.0);
      assert.equal(comp.totalEsopGrantLakhs, 0.0);
      assert.equal(comp.annualizedEsopLakhs, 0.0);
      assert.equal(comp.totalYear1Comp, 36.0);
    });

    it('should handle high-growth unicorn valuation (₹1,000 Cr valuation, 0.1% equity)', () => {
      const comp = computeWellfoundComp(50.0, 25.0, 0.1, 1000.0);
      assert.equal(comp.annualBonus, 12.5);
      assert.equal(comp.totalEsopGrantCr, 1.0); // 1 Cr
      assert.equal(comp.totalEsopGrantLakhs, 100.0); // 100 Lakhs
      assert.equal(comp.annualizedEsopLakhs, 25.0); // 25 Lakhs / yr
      assert.equal(comp.totalYear1Comp, 87.5); // 50 + 12.5 + 25 = 87.5 LPA
    });
  });

  describe('5.4 4-Year Linear Vesting Schedule with 1-Year Cliff Verification', () => {
    it('should enforce 1-year cliff (0% vested in months 0-11) and linear progression thereafter', () => {
      const totalGrant = 12.5; // Lakhs

      function calculateVestedLakhs(totalGrantLakhs, month) {
        if (month < 12) return 0.0; // 1-year cliff
        if (month >= 48) return totalGrantLakhs; // fully vested
        // Linear vesting from month 12 to 48
        return (month / 48) * totalGrantLakhs;
      }

      // Pre-cliff
      assert.equal(calculateVestedLakhs(totalGrant, 0), 0.0);
      assert.equal(calculateVestedLakhs(totalGrant, 6), 0.0);
      assert.equal(calculateVestedLakhs(totalGrant, 11), 0.0);

      // Month 12: 1-Year Cliff reached -> 25% vests
      assert.equal(calculateVestedLakhs(totalGrant, 12), 3.125);

      // Month 24: Year 2 -> 50% vests
      assert.equal(calculateVestedLakhs(totalGrant, 24), 6.25);

      // Month 36: Year 3 -> 75% vests
      assert.equal(calculateVestedLakhs(totalGrant, 36), 9.375);

      // Month 48: Year 4 -> 100% vests
      assert.equal(calculateVestedLakhs(totalGrant, 48), 12.5);

      // Month 60: Post-vesting -> capped at 100%
      assert.equal(calculateVestedLakhs(totalGrant, 60), 12.5);
    });
  });
});

// =============================================================================
// TEST SUITE 6: EQUIVALENCE & ALIGNMENT WITH JAVA DOMAIN SPECIFICATIONS
// =============================================================================

describe('6. Equivalence & Alignment with Java Domain Specifications', () => {
  const serverModule = loadServerProductionModule();

  describe('6.1 Production Server.js Live State Calculation Equivalence', () => {
    it('should verify calculateShortlistScores on live server state matches Java domain specifications', () => {
      const job = serverModule.state.jobs[0];
      const portal = serverModule.state.organizations[0];
      const applications = serverModule.state.applications;
      const aiProfiles = serverModule.state.aiProfiles;

      const scoredList = serverModule.calculateShortlistScores(job, applications, aiProfiles, portal);

      assert.equal(scoredList.length, 4);

      // Check sorting: highest match score first
      for (let i = 0; i < scoredList.length - 1; i++) {
        assert.ok(
          scoredList[i].matchScorePercentage >= scoredList[i + 1].matchScorePercentage,
          'Leaderboard must be sorted in descending order of matchScorePercentage'
        );
      }

      // Candidate 1: Aarav Sharma (96% Match, autoShortlisted: true)
      const aarav = scoredList.find(s => s.application.candidateName === 'Aarav Sharma');
      assert.ok(aarav);
      assert.equal(aarav.matchScorePercentage, 96);
      assert.equal(aarav.compositeFormulaScore, 98);
      assert.equal(aarav.autoShortlisted, true);
      assert.ok(aarav.strengths.includes('JAVA (Core)'));
      assert.ok(aarav.strengths.includes('SPRING BOOT (Core)'));
      assert.ok(aarav.strengths.includes('MICROSERVICES (Core)'));
      assert.ok(aarav.strengths.includes('DOCKER (Core)'));
      assert.ok(aarav.strengths.includes('SQL (Core)'));
      assert.ok(aarav.strengths.includes('KUBERNETES (Bonus)'));
      assert.ok(aarav.strengths.includes('KAFKA (Bonus)'));

      // Candidate 2: Priya Soni (90% Match, autoShortlisted: true)
      const priya = scoredList.find(s => s.application.candidateName === 'Priya Soni');
      assert.ok(priya);
      assert.equal(priya.matchScorePercentage, 90);
      assert.equal(priya.compositeFormulaScore, 94);
      assert.equal(priya.autoShortlisted, true);
      assert.ok(priya.skillGaps.includes('Missing Preferred: KUBERNETES'));

      // Candidate 3: Diya Nair (88% Match, autoShortlisted: true)
      const diya = scoredList.find(s => s.application.candidateName === 'Diya Nair');
      assert.ok(diya);
      assert.equal(diya.matchScorePercentage, 88);
      assert.equal(diya.compositeFormulaScore, 92);
      assert.equal(diya.autoShortlisted, true);
      assert.ok(diya.skillGaps.includes('Missing Preferred: KAFKA'));

      // Candidate 4: Rohan Verma (45% Match in Node.js, autoShortlisted: false)
      const rohan = scoredList.find(s => s.application.candidateName === 'Rohan Verma');
      assert.ok(rohan);
      assert.equal(rohan.matchScorePercentage, 45);
      assert.equal(rohan.compositeFormulaScore, 66);
      assert.equal(rohan.autoShortlisted, false);
      assert.ok(rohan.skillGaps.includes('Missing Core: SPRING BOOT'));
      assert.ok(rohan.skillGaps.includes('Missing Core: DOCKER'));
      assert.ok(rohan.skillGaps.includes('Experience below 2 yrs target'));
    });
  });

  describe('6.2 OmniTalentDomainSpec.java Hybrid Matching Specification Equivalence', () => {
    it('should assert computeCompositeMatch weights match OmniTalentDomainSpec.java line 97-100', () => {
      // In OmniTalentDomainSpec.java:
      // return (0.40 * vectorCosineSimilarity)
      //      + (0.30 * bm25KeywordScore)
      //      + (0.15 * graphProximityScore)
      //      + (0.15 * candidateIntentScore);
      const specPath = path.resolve(__dirname, '../OmniTalentDomainSpec.java');
      assert.ok(fs.existsSync(specPath), 'OmniTalentDomainSpec.java must exist');
      const specContent = fs.readFileSync(specPath, 'utf8');

      assert.ok(specContent.includes('0.40 * vectorCosineSimilarity'), 'Spec must contain 0.40 vector weight');
      assert.ok(specContent.includes('0.30 * bm25KeywordScore'), 'Spec must contain 0.30 BM25 weight');
      assert.ok(specContent.includes('0.15 * graphProximityScore'), 'Spec must contain 0.15 graph weight');
      assert.ok(specContent.includes('0.15 * candidateIntentScore'), 'Spec must contain 0.15 intent weight');
    });

    it('should verify pipeline stages match OmniTalentDomainSpec sealed interface', () => {
      const specPath = path.resolve(__dirname, '../OmniTalentDomainSpec.java');
      const specContent = fs.readFileSync(specPath, 'utf8');

      const expectedStages = ['Sourced', 'Applied', 'AssessmentPending', 'Interviewing', 'OfferExtended', 'Closed'];
      for (const stage of expectedStages) {
        assert.ok(specContent.includes(`record ${stage}`), `OmniTalentDomainSpec must permit ${stage}`);
      }
    });
  });

  describe('6.3 Catalog of 5 Subtle Domain Divergences Audit', () => {
    it('Divergence 1: Rohan Verma score divergence (31% in Java vs 45% in Node.js)', () => {
      // In HireFlowEngine.java, Rohan's resume lacks "microservices" -> 31%
      // In server.js, Rohan's resume includes "learning modern microservices architectures" -> 45%
      const javaEnginePath = path.resolve(__dirname, '../HireFlowEngine.java');
      const javaContent = fs.readFileSync(javaEnginePath, 'utf8');
      assert.ok(javaContent.includes('Junior developer with 1 year experience working on Java, SQL, and Python scripts.'));
      assert.ok(!javaContent.includes('learning modern microservices architectures'));

      const serverPath = path.resolve(__dirname, '../server.js');
      const serverContent = fs.readFileSync(serverPath, 'utf8');
      assert.ok(serverContent.includes('learning modern microservices architectures'));
    });

    it('Divergence 2: Priya Soni documentation divergence (90% in formula vs 92% in README)', () => {
      const readmePath = path.resolve(__dirname, '../README.md');
      const readmeContent = fs.readFileSync(readmePath, 'utf8');
      assert.ok(readmeContent.includes('Priya Soni 92%'), 'README documents 92% for Priya Soni');

      // But mathematical calculation yields 90% (70 + 10 + 10)
      const res = computeHireFlowScore(
        ['JAVA', 'SPRING BOOT', 'MICROSERVICES', 'DOCKER', 'SQL'],
        ['KUBERNETES', 'KAFKA'],
        2,
        ['JAVA', 'SPRING BOOT', 'MICROSERVICES', 'SQL', 'DOCKER', 'KAFKA', 'AWS', 'POSTGRESQL'],
        4
      );
      assert.equal(res.totalScore, 90);
    });

    it('Divergence 3: Skill Taxonomy count divergence (17 in Java vs 21 in Node.js server.js vs 17 in app.js)', () => {
      const javaEnginePath = path.resolve(__dirname, '../HireFlowEngine.java');
      const javaContent = fs.readFileSync(javaEnginePath, 'utf8');

      const appJsPath = path.resolve(__dirname, '../app.js');
      const appJsContent = fs.readFileSync(appJsPath, 'utf8');

      // Java has 17 skills
      const javaTaxonomyMatch = javaContent.match(/KNOWN_SKILL_TAXONOMY\s*=\s*Set\.of\(([\s\S]*?)\);/);
      assert.ok(javaTaxonomyMatch);
      const javaSkills = javaTaxonomyMatch[1].match(/"([^"]+)"/g);
      assert.equal(javaSkills.length, 17);

      // server.js has 21 skills
      assert.equal(serverModule.KNOWN_SKILL_TAXONOMY.length, 21);

      // app.js has 17 skills in array but logs 21 in UI telemetry
      assert.ok(appJsContent.includes('Active Taxonomy: 21 Canonical Technologies'));
    });

    it('Divergence 4: Substring false-positive matches documented', () => {
      // Substring matching without word boundaries causes false positives
      const nlp = serverModule.parseResumeNLP('Expert in reactive JavaScript systems with NoSQL and fixed flaws in digital logistics', 'APP-DIV4');
      assert.ok(nlp.extractedSkills.includes('REACT'));
      assert.ok(nlp.extractedSkills.includes('JAVA'));
      assert.ok(nlp.extractedSkills.includes('SQL'));
      assert.ok(nlp.extractedSkills.includes('AWS'));
      assert.ok(nlp.extractedSkills.includes('GIT'));
    });

    it('Divergence 5: Fractional experience regex parsing defect documented', () => {
      // (\d+)\+?\s*years? parses 0.5 years as 5
      const nlp = serverModule.parseResumeNLP('Intern with 0.5 years of experience', 'APP-DIV5');
      assert.equal(nlp.detectedExperienceYears, 5);
    });
  });
});
