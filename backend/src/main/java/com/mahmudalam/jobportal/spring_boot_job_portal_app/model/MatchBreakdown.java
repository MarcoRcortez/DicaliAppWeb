package com.mahmudalam.jobportal.spring_boot_job_portal_app.model;

import java.util.List;

/**
 * Desglose del cálculo de un match. No se persiste como colección propia;
 * se usa para construir el prompt de la explicación en lenguaje natural.
 */
public record MatchBreakdown(
        double totalScore,
        double affinityScore, List<String> matchedRoleKeywords, List<String> missingRoleKeywords,
        double technicalScore, List<String> matchedTechnicalSkills, List<String> missingTechnicalSkills,
        double softScore, List<String> matchedSoftSkills, List<String> missingSoftSkills,
        double experienceScore, double candidateYearsExperience, Integer minYearsRequired,
        double salaryScore,
        double workTypeScore,
        double languageScore, List<String> matchedLanguages, List<String> missingLanguages
) {}
