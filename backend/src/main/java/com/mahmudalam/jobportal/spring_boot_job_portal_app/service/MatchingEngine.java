package com.mahmudalam.jobportal.spring_boot_job_portal_app.service;

import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.*;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.repository.MatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Motor de matching ponderado:
 *   60% habilidades técnicas
 *   20% habilidades blandas
 *   10% experiencia
 *    5% expectativa salarial
 *    5% disponibilidad/tipo de trabajo
 */
@Service
@RequiredArgsConstructor
public class MatchingEngine {

    private final MatchRepository matchRepository;

    /** Recalcula matches de un candidato contra todas las vacantes abiertas */
    public void runForCandidate(CandidateProfileModel candidate, List<VacancyModel> openVacancies) {
        for (VacancyModel vacancy : openVacancies) {
            upsertMatch(candidate, vacancy);
        }
    }

    /** Recalcula matches de una vacante nueva contra todos los candidatos completos */
    public void runForVacancy(VacancyModel vacancy, List<CandidateProfileModel> candidates) {
        for (CandidateProfileModel candidate : candidates) {
            upsertMatch(candidate, vacancy);
        }
    }

    private void upsertMatch(CandidateProfileModel candidate, VacancyModel vacancy) {
        double score = calculateScore(candidate, vacancy);

        MatchModel match = matchRepository
                .findByCandidateIdAndVacancyId(candidate.getId(), vacancy.getId())
                .orElse(new MatchModel());

        match.setCandidateId(candidate.getId());
        match.setVacancyId(vacancy.getId());
        match.setRecruiterId(vacancy.getRecruiterId());
        match.setCompanyName(vacancy.getCompanyName());
        match.setScore(score);
        match.setCalculatedAt(LocalDateTime.now());

        // Solo actualizar snapshot si es nuevo
        if (match.getId() == null) {
            match.setStatus("PENDING");
            match.setCandidateNotified(false);
        }

        match.setJobTitle(vacancy.getJobTitle());
        match.setDepartment(vacancy.getDepartment());
        match.setDescription(vacancy.getDescription());
        match.setExperienceLevel(vacancy.getExperienceLevel());
        match.setWorkAvailability(vacancy.getWorkAvailability());
        if (vacancy.getSalaryRange() != null) {
            match.setSalaryMin(vacancy.getSalaryRange().getMin());
            match.setSalaryMax(vacancy.getSalaryRange().getMax());
        }

        matchRepository.save(match);
    }

    public double calculateScore(CandidateProfileModel candidate, VacancyModel vacancy) {
        double technical  = matchTechnicalSkills(candidate, vacancy)  * 0.60;
        double soft       = matchSoftSkills(candidate, vacancy)        * 0.20;
        double experience = matchExperience(candidate, vacancy)        * 0.10;
        double salary     = matchSalary(candidate, vacancy)            * 0.05;
        double location   = matchWorkType(candidate, vacancy)          * 0.05;

        return Math.min(100.0, (technical + soft + experience + salary + location) * 100);
    }

    private double matchTechnicalSkills(CandidateProfileModel c, VacancyModel v) {
        if (v.getRequiredTechnicalSkills() == null || v.getRequiredTechnicalSkills().isEmpty()) return 1.0;
        if (c.getTechnicalSkills() == null || c.getTechnicalSkills().isEmpty()) return 0.0;

        int levelScore = 0;
        int total = v.getRequiredTechnicalSkills().size();

        for (VacancyModel.SkillTag required : v.getRequiredTechnicalSkills()) {
            for (CandidateProfileModel.SkillTag candidateSkill : c.getTechnicalSkills()) {
                if (candidateSkill.getName().equalsIgnoreCase(required.getName())) {
                    // Coincidencia exacta de nivel: 2pts, nivel inferior: 1pt
                    if (sameOrHigherLevel(candidateSkill.getLevel(), required.getLevel())) {
                        levelScore += 2;
                    } else {
                        levelScore += 1;
                    }
                    break;
                }
            }
        }
        return (double) levelScore / (total * 2);
    }

    private double matchSoftSkills(CandidateProfileModel c, VacancyModel v) {
        if (v.getDesiredSoftSkills() == null || v.getDesiredSoftSkills().isEmpty()) return 1.0;
        if (c.getSoftSkills() == null || c.getSoftSkills().isEmpty()) return 0.0;

        long matches = v.getDesiredSoftSkills().stream()
                .filter(vs -> c.getSoftSkills().stream()
                        .anyMatch(cs -> cs.equalsIgnoreCase(vs)))
                .count();
        return (double) matches / v.getDesiredSoftSkills().size();
    }

    private double matchExperience(CandidateProfileModel c, VacancyModel v) {
        if (v.getExperienceLevel() == null) return 1.0;

        int years = c.getWorkExperience() == null ? 0 : c.getWorkExperience().size();

        if ("sin experiencia".equalsIgnoreCase(v.getExperienceLevel())) {
            return 1.0;
        }
        // "con experiencia" → al menos 1 entrada de trabajo
        return years >= 1 ? 1.0 : 0.3;
    }

    private double matchSalary(CandidateProfileModel c, VacancyModel v) {
        if (c.getExpectedSalary() == null || v.getSalaryRange() == null) return 0.5;

        double cMin = c.getExpectedSalary().getMin();
        double cMax = c.getExpectedSalary().getMax();
        double vMin = v.getSalaryRange().getMin();
        double vMax = v.getSalaryRange().getMax();

        // Hay solapamiento entre rangos
        if (cMin <= vMax && vMin <= cMax) return 1.0;

        // Candidato pide más de lo ofrecido
        if (cMin > vMax) return Math.max(0, 1 - (cMin - vMax) / vMax);

        return 0.5;
    }

    private double matchWorkType(CandidateProfileModel c, VacancyModel v) {
        if (c.getWorkType() == null || v.getWorkAvailability() == null) return 0.5;

        boolean remoteMatch = "remoto".equalsIgnoreCase(c.getWorkType()) ||
                              "presencial La Paz".equalsIgnoreCase(c.getWorkType());
        return remoteMatch ? 1.0 : 0.5;
    }

    private boolean sameOrHigherLevel(String candidateLevel, String requiredLevel) {
        List<String> order = List.of("BASICO", "INTERMEDIO", "AVANZADO", "EXPERTO");
        int cIdx = order.indexOf(candidateLevel != null ? candidateLevel.toUpperCase() : "");
        int rIdx = order.indexOf(requiredLevel  != null ? requiredLevel.toUpperCase()  : "");
        return cIdx >= rIdx && cIdx >= 0;
    }
}
