import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * HireFlow: End-to-End Intelligent Hiring Workflow Implementation
 * Implements Steps 1 through 6: Organization -> Job Creation -> Candidate Application
 * -> AI Processing -> Intelligent Shortlisting -> Human Decision
 */
public class HireFlowEngine {

    // =========================================================================
    // DOMAIN MODELS (RECORDS & SEALED INTERFACES)
    // =========================================================================

    public enum TenantType { COMPANY, UNIVERSITY }

    // STEP 1 MODEL: Organization Branded Portal
    public record OrganizationPortal(
        String orgId,
        String name,
        TenantType type,
        String customSubdomain,
        int minimumShortlistScore
    ) {}

    // STEP 2 MODEL: Job Creation & Requirements
    public record JobPosting(
        String jobId,
        String orgId,
        String title,
        Set<String> mandatorySkills,
        Set<String> preferredSkills,
        int requiredExperienceYears
    ) {}

    // STEP 3 MODEL: Candidate Profile & Raw Application
    public record CandidateApplication(
        String applicationId,
        String candidateName,
        String email,
        String jobId,
        String rawResumeText,
        Instant appliedAt
    ) {}

    // STEP 4 MODEL: AI Extracted Resume Data
    public record AIExtractedProfile(
        String applicationId,
        Set<String> extractedSkills,
        int detectedExperienceYears
    ) {}

    // STEP 5 MODEL: Intelligent Shortlisting Card
    public record ShortlistedCandidate(
        CandidateApplication application,
        int matchScorePercentage,
        List<String> strengths,
        List<String> skillGaps,
        boolean autoShortlisted
    ) implements Comparable<ShortlistedCandidate> {
        @Override
        public int compareTo(ShortlistedCandidate other) {
            return Integer.compare(other.matchScorePercentage, this.matchScorePercentage); // Descending
        }
    }

    // STEP 6 MODEL: Human Decision State Machine
    public sealed interface HiringDecision permits
        HiringDecision.SelectedForOffer,
        HiringDecision.HoldWaitlist,
        HiringDecision.Rejected {

        record SelectedForOffer(String reviewer, String interviewNotes, double offeredCTC) implements HiringDecision {}
        record HoldWaitlist(String reviewer, String reason) implements HiringDecision {}
        record Rejected(String reviewer, String feedback) implements HiringDecision {}
    }

    public record FinalHiringRecord(
        ShortlistedCandidate shortlistedCandidate,
        HiringDecision decision,
        Instant decidedAt
    ) {}

    // =========================================================================
    // WORKFLOW ENGINE SERVICES (STEPS 1 TO 6)
    // =========================================================================

    // --- STEP 1: ORGANIZATION DEPLOYMENT ---
    static class OrganizationService {
        public OrganizationPortal deployPortal(String name, TenantType type, String subdomain, int minScore) {
            String orgId = "ORG-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            OrganizationPortal portal = new OrganizationPortal(orgId, name, type, subdomain + ".hireflow.ai", minScore);
            System.out.printf("[STEP 1: ORGANIZATION] Deployed branded portal for '%s' (%s) at https://%s%n",
                    portal.name(), portal.type(), portal.customSubdomain());
            return portal;
        }
    }

    // --- STEP 2: JOB CREATION ---
    static class JobCreationService {
        public JobPosting publishJob(OrganizationPortal portal, String title,
                                     Set<String> mandatorySkills, Set<String> preferredSkills, int minExpYears) {
            String jobId = "JOB-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            JobPosting job = new JobPosting(jobId, portal.orgId(), title, mandatorySkills, preferredSkills, minExpYears);
            System.out.printf("[STEP 2: JOB CREATION] Published Role: '%s' [%s] | Mandatory: %s | Preferred: %s%n",
                    job.title(), job.jobId(), job.mandatorySkills(), job.preferredSkills());
            return job;
        }
    }

    // --- STEP 3: CANDIDATE APPLICATION ---
    static class CandidatePortalService {
        public CandidateApplication submitApplication(String name, String email, JobPosting job, String resumeText) {
            String appId = "APP-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            CandidateApplication app = new CandidateApplication(appId, name, email, job.jobId(), resumeText, Instant.now());
            System.out.printf("[STEP 3: APPLICATION]  Candidate '%s' uploaded resume & applied for %s (%s)%n",
                    app.candidateName(), job.title(), app.applicationId());
            return app;
        }
    }

    // --- STEP 4: AI PROCESSING (NLP RESUME PARSER & SKILL EXTRACTOR) ---
    static class AIProcessingEngine {
        private static final Set<String> KNOWN_SKILL_TAXONOMY = Set.of(
            "JAVA", "SPRING BOOT", "MICROSERVICES", "DOCKER", "SQL",
            "KUBERNETES", "KAFKA", "AWS", "PYTHON", "REACT", "GIT", "REST API",
            "POSTGRESQL", "REDIS", "GRAPHQL", "TYPESCRIPT", "DISTRIBUTED SYSTEMS"
        );

        private static final Pattern EXP_PATTERN = Pattern.compile("(\\d+)\\+?\\s*years?", Pattern.CASE_INSENSITIVE);

        public AIExtractedProfile analyzeResume(CandidateApplication application) {
            String upperResume = application.rawResumeText().toUpperCase();

            // 1. Extract known technical skills from unstructured resume text
            Set<String> foundSkills = KNOWN_SKILL_TAXONOMY.stream()
                .filter(upperResume::contains)
                .collect(Collectors.toCollection(LinkedHashSet::new));

            // 2. Extract years of experience via regex pattern matching
            Matcher matcher = EXP_PATTERN.matcher(application.rawResumeText());
            int experienceYears = matcher.find() ? Integer.parseInt(matcher.group(1)) : 0;

            System.out.printf("[STEP 4: AI PROCESS]   Parsed '%s' -> Extracted Skills: %s | Experience: %d yrs%n",
                    application.candidateName(), foundSkills, experienceYears);

            return new AIExtractedProfile(application.applicationId(), foundSkills, experienceYears);
        }
    }

    // --- STEP 5: INTELLIGENT SHORTLISTING ---
    static class IntelligentShortlistingService {
        /**
         * Scoring Breakdown:
         * - Mandatory Skills: 70 points total
         * - Preferred Skills: 20 points total
         * - Experience Alignment: 10 points total
         */
        public List<ShortlistedCandidate> evaluateAndRank(
                OrganizationPortal portal,
                JobPosting job,
                List<CandidateApplication> applications,
                Map<String, AIExtractedProfile> aiProfiles) {

            List<ShortlistedCandidate> evaluatedList = new ArrayList<>();

            for (CandidateApplication app : applications) {
                AIExtractedProfile aiProfile = aiProfiles.get(app.applicationId());
                Set<String> candidateSkills = aiProfile != null ? aiProfile.extractedSkills() : Collections.emptySet();
                int expYears = aiProfile != null ? aiProfile.detectedExperienceYears() : 0;

                List<String> strengths = new ArrayList<>();
                List<String> skillGaps = new ArrayList<>();

                // 1. Evaluate Mandatory Skills (70% weight)
                int mandatoryMatched = 0;
                for (String reqSkill : job.mandatorySkills()) {
                    if (candidateSkills.contains(reqSkill.toUpperCase())) {
                        mandatoryMatched++;
                        strengths.add(reqSkill + " (Core)");
                    } else {
                        skillGaps.add("Missing Core: " + reqSkill);
                    }
                }
                double mandatoryScore = job.mandatorySkills().isEmpty() ? 70.0
                        : ((double) mandatoryMatched / job.mandatorySkills().size()) * 70.0;

                // 2. Evaluate Preferred Skills (20% weight)
                int preferredMatched = 0;
                for (String prefSkill : job.preferredSkills()) {
                    if (candidateSkills.contains(prefSkill.toUpperCase())) {
                        preferredMatched++;
                        strengths.add(prefSkill + " (Bonus)");
                    } else {
                        skillGaps.add("Missing Preferred: " + prefSkill);
                    }
                }
                double preferredScore = job.preferredSkills().isEmpty() ? 20.0
                        : ((double) preferredMatched / job.preferredSkills().size()) * 20.0;

                // 3. Evaluate Experience (10% weight)
                double expScore;
                if (expYears >= job.requiredExperienceYears()) {
                    expScore = Math.min(10.0, 6.0 + (expYears - job.requiredExperienceYears()) * 2.0);
                    strengths.add(expYears + " Yrs Relevant Experience");
                } else {
                    expScore = ((double) expYears / Math.max(1, job.requiredExperienceYears())) * 6.0;
                    skillGaps.add("Experience below " + job.requiredExperienceYears() + " yrs target");
                }

                int totalScore = (int) Math.round(mandatoryScore + preferredScore + expScore);
                boolean qualifies = totalScore >= portal.minimumShortlistScore();

                evaluatedList.add(new ShortlistedCandidate(app, totalScore, strengths, skillGaps, qualifies));
            }

            Collections.sort(evaluatedList); // Sort highest match score first
            return evaluatedList;
        }
    }

    // --- STEP 6: HUMAN DECISION ---
    static class HumanDecisionService {
        public FinalHiringRecord recordDecision(ShortlistedCandidate candidate, HiringDecision decision) {
            return new FinalHiringRecord(candidate, decision, Instant.now());
        }

        public void printFinalAuditReport(List<FinalHiringRecord> records) {
            System.out.println("\n================ [STEP 6: HUMAN DECISION FINAL AUDIT] ================");
            for (FinalHiringRecord rec : records) {
                String name = rec.shortlistedCandidate().application().candidateName();
                int score = rec.shortlistedCandidate().matchScorePercentage();

                String outcome = switch (rec.decision()) {
                    case HiringDecision.SelectedForOffer offer ->
                        String.format("HIRED / OFFER EXTENDED (%.1f LPA) by %s | Notes: %s",
                                offer.offeredCTC(), offer.reviewer(), offer.interviewNotes());
                    case HiringDecision.HoldWaitlist hold ->
                        String.format("WAITLISTED by %s | Reason: %s",
                                hold.reviewer(), hold.reason());
                    case HiringDecision.Rejected reject ->
                        String.format("REJECTED by %s | Feedback: %s",
                                reject.reviewer(), reject.feedback());
                };

                System.out.printf(" -> Candidate: %-18s | AI Match: %2d%% | Status: %s%n", name, score, outcome);
            }
            System.out.println("======================================================================");
        }
    }

    // =========================================================================
    // MAIN EXECUTION PIPELINE (SIMULATING STEPS 1 TO 6)
    // =========================================================================
    public static void main(String[] args) {
        System.out.println("======================================================================");
        System.out.println("   HIREFLOW: END-TO-END INTELLIGENT HIRING WORKFLOW EXECUTION");
        System.out.println("======================================================================\n");

        OrganizationService orgService = new OrganizationService();
        JobCreationService jobService = new JobCreationService();
        CandidatePortalService appService = new CandidatePortalService();
        AIProcessingEngine aiEngine = new AIProcessingEngine();
        IntelligentShortlistingService shortlistService = new IntelligentShortlistingService();
        HumanDecisionService decisionService = new HumanDecisionService();

        // 1. Deploy Branded Portal
        OrganizationPortal portal = orgService.deployPortal(
            "Apex Cloud Systems", TenantType.COMPANY, "apexcloud", 75
        );
        System.out.println();

        // 2. Recruiter Publishes Job Requisition
        JobPosting backendJob = jobService.publishJob(
            portal,
            "Senior Backend Engineer (Java / Distributed Systems)",
            Set.of("JAVA", "SPRING BOOT", "MICROSERVICES", "DOCKER", "SQL"), // 5 Mandatory (70%)
            Set.of("KUBERNETES", "KAFKA"),                                   // 2 Preferred (20%)
            2                                                                // 2+ Years Exp (10%)
        );
        System.out.println();

        // 3. Candidates Upload Resumes & Apply
        List<CandidateApplication> applications = List.of(
            appService.submitApplication(
                "Aarav Sharma", "aarav.s@email.com", backendJob,
                "Experienced Engineer with 2 years building scalable backends using Java, Spring Boot, " +
                "Microservices, Docker, SQL, Kubernetes, and Kafka event streams."
            ),
            appService.submitApplication(
                "Diya Nair", "diya.n@email.com", backendJob,
                "Software Developer with 3 years of hands-on experience in Java, Spring Boot, " +
                "Microservices, Docker, SQL databases, and Kubernetes cluster orchestration."
            ),
            appService.submitApplication(
                "Rohan Verma", "rohan.v@email.com", backendJob,
                "Junior developer with 1 year experience working on Java, SQL, and Python scripts."
            )
        );
        System.out.println();

        // 4. AI Processing: Analyze Resumes & Extract Skills
        Map<String, AIExtractedProfile> aiProfiles = new HashMap<>();
        for (CandidateApplication app : applications) {
            aiProfiles.put(app.applicationId(), aiEngine.analyzeResume(app));
        }
        System.out.println();

        // 5. Intelligent Shortlisting: Rank & Generate Match Scores, Strengths, and Skill Gaps
        List<ShortlistedCandidate> rankedCandidates = shortlistService.evaluateAndRank(
            portal, backendJob, applications, aiProfiles
        );

        System.out.println("============= [STEP 5: INTELLIGENT SHORTLISTING LEADERBOARD] =============");
        for (ShortlistedCandidate sc : rankedCandidates) {
            System.out.printf(" Candidate: %-14s | Match Score: [%2d%%] | Shortlisted: %s%n",
                    sc.application().candidateName(),
                    sc.matchScorePercentage(),
                    sc.autoShortlisted() ? "YES (Passed Threshold)" : "NO (Below 75% Cutoff)");
            System.out.printf("   + Strengths : %s%n", sc.strengths());
            System.out.printf("   - Skill Gaps: %s%n", sc.skillGaps().isEmpty() ? "None (100% Skill Coverage)" : sc.skillGaps());
            System.out.println("--------------------------------------------------------------------------");
        }

        // 6. Human Decision: Review Ranked Candidates, Conduct Interviews, Decide
        List<FinalHiringRecord> finalDecisions = List.of(
            decisionService.recordDecision(
                rankedCandidates.get(0), // Aarav (96%)
                new HiringDecision.SelectedForOffer("Vikram (VP Eng)", "Strong system design & Kafka depth.", 24.0)
            ),
            decisionService.recordDecision(
                rankedCandidates.get(1), // Diya (88%)
                new HiringDecision.HoldWaitlist("Vikram (VP Eng)", "Strong profile; slight gap in Kafka event streaming.")
            ),
            decisionService.recordDecision(
                rankedCandidates.get(2), // Rohan (34%)
                new HiringDecision.Rejected("AI Auto-Triage + HR", "Missing core Spring Boot, Microservices, and Docker skills.")
            )
        );

        decisionService.printFinalAuditReport(finalDecisions);
    }
}

