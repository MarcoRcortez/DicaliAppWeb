package com.mahmudalam.jobportal.spring_boot_job_portal_app.service;

import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.CandidateModel;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.JobPostModel;
import org.springframework.stereotype.Service;

@Service
public class MatchingService {

    public double calculateMatchScore(CandidateModel candidate, JobPostModel job) {
        if (job == null || candidate == null) return 0;
        
        double score = 0;
        int totalCriteria = 0;

        if (candidate.getExperienceYears() >= job.getExp()) {
            score += 100;
        }
        totalCriteria++;

        if (job.getTechs() != null && candidate.getSkills() != null) {
            long matches = 0;
            for (String tech : job.getTechs()) {
                for (String skill : candidate.getSkills()) {
                    if (skill.equalsIgnoreCase(tech)) {
                        matches++;
                        break;
                    }
                }
            }
            score += (matches / (double) job.getTechs().length) * 100;
            totalCriteria++;
        }

        return totalCriteria > 0 ? score / totalCriteria : 0;
    }
}