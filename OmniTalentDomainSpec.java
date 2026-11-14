package com.omnitalent.core.spec;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Unified Domain Specification for OmniTalent (Social Network + Enterprise ATS Fusion)
 */
public class OmniTalentDomainSpec {

    // --- 1. RBAC & IDENTITY LAYER ---
    public enum Role {
        CANDIDATE, RECRUITER, HIRING_MANAGER, UNIVERSITY_TPO, ORG_ADMIN
    }

    public record SkillNode(
        String skillName,
        int proficiencyLevel,          // 1 to 5
        double weightedEndorsementScore // Derived from Neo4j Graph authority
    ) {}

    public record CandidateProfile(
        UUID userId,
        String fullName,
        String headline,
        boolean openToOpportunities,
        int expectedBaseSalaryLPA,
        Set<SkillNode> verifiedSkills,
        List<String> portfolioArtifactUrls,
        float[] semanticEmbedding      // 768-dim vector for AI matching
    ) {}

    // --- 2. ATS PIPELINE STATE MACHINE (Sealed Hierarchy) ---
    public sealed interface PipelineStage permits 
        PipelineStage.Sourced, 
        PipelineStage.Applied, 
        PipelineStage.AssessmentPending, 
        PipelineStage.Interviewing, 
        PipelineStage.OfferExtended, 
        PipelineStage.Closed {

        record Sourced(UUID sourcedByRecruiterId, String outreachNote) implements PipelineStage {}
        record Applied(UUID referralUserId, double initialMatchScore) implements PipelineStage {}
        record AssessmentPending(UUID assessmentId, Instant deadline, Double scoreAchieved) implements PipelineStage {}
        record Interviewing(int roundNumber, List<UUID> interviewerIds, Map<UUID, Integer> scorecardRatings) implements PipelineStage {}
        record OfferExtended(int offeredBaseLPA, double equityPercentage, boolean accepted) implements PipelineStage {}
        record Closed(String reason, boolean archiveForFutureRoles) implements PipelineStage {}
    }

    // --- 3. JOB REQUISITION & APPLICATION SNAPSHOT ---
    public record JobRequisition(
        UUID jobId,
        UUID organizationId,
        String title,
        String employmentType,         // FULL_TIME, INTERNSHIP, CONTRACT
        int minSalaryLPA,
        int maxSalaryLPA,
        double equityOfferedPercent,
        Set<String> mandatorySkills,
        float[] jobEmbedding
    ) {}

    public record ATSApplicationCard(
        UUID applicationId,
        UUID jobId,
        CandidateProfile liveCandidateRef, // Live link to Social Profile (Not a static PDF!)
        PipelineStage currentStage,
        List<String> referralChain,        // e.g., ["Candidate -> Peer A -> Hiring Manager"]
        Instant lastUpdated
    ) {}

    // --- 4. HYBRID MATCHING ENGINE CONTRACT ---
    public interface HybridMatchingEngine {
        
        default double computeCompositeMatch(
                double vectorCosineSimilarity, 
                double bm25KeywordScore, 
                double graphProximityScore, 
                double candidateIntentScore) {
            
            // Weighted Fusion Formula: 40% Semantic, 30% Hard Skills, 15% Network Graph, 15% Intent
            return (0.40 * vectorCosineSimilarity) 
                 + (0.30 * bm25KeywordScore) 
                 + (0.15 * graphProximityScore) 
                 + (0.15 * candidateIntentScore);
        }

        List<ATSApplicationCard> rankCandidatesForRequisition(JobRequisition job, List<CandidateProfile> pool);
    }
}

