package com.mahmudalam.jobportal.spring_boot_job_portal_app.service;

import com.mahmudalam.jobportal.spring_boot_job_portal_app.config.MatchingWeightsProperties;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.*;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.repository.MatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Motor de matching ponderado. Los pesos de cada criterio son configurables
 * (ver {@code matching.weights.*} en application.properties):
 *   habilidades técnicas, habilidades blandas, experiencia, expectativa salarial,
 *   disponibilidad/tipo de trabajo e idiomas.
 */
@Service
@RequiredArgsConstructor
public class MatchingEngine {

    private final MatchRepository matchRepository;
    private final MatchingWeightsProperties weights;

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
        MatchBreakdown breakdown = calculateBreakdown(candidate, vacancy);

        MatchModel match = matchRepository
                .findByCandidateIdAndVacancyId(candidate.getId(), vacancy.getId())
                .orElse(new MatchModel());

        match.setCandidateId(candidate.getId());
        match.setVacancyId(vacancy.getId());
        match.setRecruiterId(vacancy.getRecruiterId());
        match.setCompanyName(vacancy.getCompanyName());
        match.setScore(breakdown.totalScore());
        match.setAffinityScore(breakdown.affinityScore());
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
        return calculateBreakdown(candidate, vacancy).totalScore();
    }

    /**
     * Calcula el score total y el desglose por criterio (con listas de coincidencias
     * y faltantes), usado tanto por el score persistido como por la explicación LLM.
     */
    public MatchBreakdown calculateBreakdown(CandidateProfileModel candidate, VacancyModel vacancy) {
        SkillMatchResult affinity  = matchRoleAffinityDetailed(candidate, vacancy);
        SkillMatchResult technical = matchTechnicalSkillsDetailed(candidate, vacancy);
        SkillMatchResult soft      = matchSoftSkillsDetailed(candidate, vacancy);
        SkillMatchResult language  = matchLanguagesDetailed(candidate, vacancy);

        double candidateYears = calculateTotalYearsExperience(candidate);
        double experienceScore = matchExperience(candidateYears, vacancy);
        double salaryScore = matchSalary(candidate, vacancy);
        double workTypeScore = matchWorkType(candidate, vacancy);

        // Renormalización: solo cuentan los criterios que APLICAN (la vacante especifica el requisito).
        // Un criterio ausente NO regala puntaje: se excluye del promedio ponderado.
        double weightedSum = 0, appliedWeight = 0;

        if (!roleKeywords(vacancy).isEmpty()) {
            weightedSum += affinity.score() * weights.getAffinity();   appliedWeight += weights.getAffinity();
        }
        if (notEmpty(vacancy.getRequiredTechnicalSkills())) {
            weightedSum += technical.score() * weights.getTechnical(); appliedWeight += weights.getTechnical();
        }
        if (notEmpty(vacancy.getDesiredSoftSkills())) {
            weightedSum += soft.score() * weights.getSoft();           appliedWeight += weights.getSoft();
        }
        if (notEmpty(vacancy.getRequiredLanguages())) {
            weightedSum += language.score() * weights.getLanguage();   appliedWeight += weights.getLanguage();
        }
        // La experiencia siempre aplica
        weightedSum += experienceScore * weights.getExperience();      appliedWeight += weights.getExperience();
        if (candidate.getExpectedSalary() != null && vacancy.getSalaryRange() != null) {
            weightedSum += salaryScore * weights.getSalary();          appliedWeight += weights.getSalary();
        }
        if (candidate.getWorkType() != null && vacancy.getWorkAvailability() != null) {
            weightedSum += workTypeScore * weights.getWorkType();      appliedWeight += weights.getWorkType();
        }

        double total = appliedWeight > 0 ? Math.min(100.0, (weightedSum / appliedWeight) * 100) : 0.0;

        return new MatchBreakdown(
                total,
                affinity.score(), affinity.matched(), affinity.missing(),
                technical.score(), technical.matched(), technical.missing(),
                soft.score(), soft.matched(), soft.missing(),
                experienceScore, candidateYears, vacancy.getMinExperienceYears(),
                salaryScore,
                workTypeScore,
                language.score(), language.matched(), language.missing()
        );
    }

    private static boolean notEmpty(List<?> list) {
        return list != null && !list.isEmpty();
    }

    // ---- Afinidad vocacional (rubro de la vacante vs. trayectoria del candidato) ----

    private static final Set<String> STOPWORDS = Set.of(
            "de", "la", "el", "y", "en", "para", "con", "del", "los", "las",
            "un", "una", "por", "a", "o", "al", "su", "sus", "e");

    private String stripAccents(String s) {
        return Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
    }

    /** Tokeniza uno o más textos: minúsculas, sin acentos, sin stopwords, tokens de >= 3 letras. */
    private Set<String> tokens(String... parts) {
        Set<String> set = new HashSet<>();
        for (String part : parts) {
            if (part == null) continue;
            for (String tok : stripAccents(part.toLowerCase()).split("[^a-z0-9]+")) {
                if (tok.length() >= 3 && !STOPWORDS.contains(tok)) set.add(tok);
            }
        }
        return set;
    }

    /** Palabras que describen el rol de la vacante (título + área). */
    private Set<String> roleKeywords(VacancyModel v) {
        return tokens(v.getJobTitle(), v.getDepartment());
    }

    /** Palabras de la trayectoria del candidato: cargos, educación, certificaciones, habilidades. */
    private Set<String> candidateKeywords(CandidateProfileModel c) {
        Set<String> set = new HashSet<>();
        if (c.getWorkExperience() != null)
            for (CandidateProfileModel.WorkExperience w : c.getWorkExperience()) set.addAll(tokens(w.getTitle()));
        if (c.getEducations() != null)
            for (CandidateProfileModel.EducationEntry e : c.getEducations()) set.addAll(tokens(e.getDegree()));
        if (c.getCertifications() != null)
            for (CandidateProfileModel.CertificationEntry ce : c.getCertifications()) set.addAll(tokens(ce.getName()));
        if (c.getTechnicalSkills() != null)
            for (CandidateProfileModel.SkillTag s : c.getTechnicalSkills()) set.addAll(tokens(s.getName()));
        if (c.getSoftSkills() != null)
            for (String ss : c.getSoftSkills()) set.addAll(tokens(ss));
        return set;
    }

    private SkillMatchResult matchRoleAffinityDetailed(CandidateProfileModel c, VacancyModel v) {
        Set<String> role = roleKeywords(v);
        if (role.isEmpty()) {
            return new SkillMatchResult(1.0, new ArrayList<>(), new ArrayList<>());
        }
        Set<String> cand = candidateKeywords(c);
        List<String> matched = new ArrayList<>();
        List<String> missing = new ArrayList<>();
        for (String r : role) {
            boolean hit = cand.contains(r) || cand.stream().anyMatch(k ->
                    (r.length() >= 4 && k.contains(r)) || (k.length() >= 4 && r.contains(k)));
            if (hit) matched.add(r); else missing.add(r);
        }
        double score = (double) matched.size() / role.size();
        return new SkillMatchResult(score, matched, missing);
    }

    // ---- Habilidades técnicas ----

    private SkillMatchResult matchTechnicalSkillsDetailed(CandidateProfileModel c, VacancyModel v) {
        if (v.getRequiredTechnicalSkills() == null || v.getRequiredTechnicalSkills().isEmpty()) {
            return new SkillMatchResult(1.0, new ArrayList<>(), new ArrayList<>());
        }
        List<String> matched = new ArrayList<>();
        List<String> missing = new ArrayList<>();
        int levelScore = 0;
        int total = v.getRequiredTechnicalSkills().size();

        for (VacancyModel.SkillTag required : v.getRequiredTechnicalSkills()) {
            boolean found = false;
            if (c.getTechnicalSkills() != null) {
                for (CandidateProfileModel.SkillTag candidateSkill : c.getTechnicalSkills()) {
                    if (candidateSkill.getName().equalsIgnoreCase(required.getName())) {
                        // Coincidencia exacta o superior de nivel: 2pts, nivel inferior: 1pt
                        levelScore += sameOrHigherLevel(candidateSkill.getLevel(), required.getLevel()) ? 2 : 1;
                        matched.add(required.getName());
                        found = true;
                        break;
                    }
                }
            }
            if (!found) missing.add(required.getName());
        }
        double score = (double) levelScore / (total * 2);
        return new SkillMatchResult(score, matched, missing);
    }

    // ---- Habilidades blandas ----

    private SkillMatchResult matchSoftSkillsDetailed(CandidateProfileModel c, VacancyModel v) {
        if (v.getDesiredSoftSkills() == null || v.getDesiredSoftSkills().isEmpty()) {
            return new SkillMatchResult(1.0, new ArrayList<>(), new ArrayList<>());
        }
        List<String> matched = new ArrayList<>();
        List<String> missing = new ArrayList<>();
        for (String desired : v.getDesiredSoftSkills()) {
            boolean has = c.getSoftSkills() != null && c.getSoftSkills().stream()
                    .anyMatch(cs -> cs.equalsIgnoreCase(desired));
            if (has) matched.add(desired);
            else missing.add(desired);
        }
        double score = (double) matched.size() / v.getDesiredSoftSkills().size();
        return new SkillMatchResult(score, matched, missing);
    }

    // ---- Idiomas ----

    private SkillMatchResult matchLanguagesDetailed(CandidateProfileModel c, VacancyModel v) {
        if (v.getRequiredLanguages() == null || v.getRequiredLanguages().isEmpty()) {
            return new SkillMatchResult(1.0, new ArrayList<>(), new ArrayList<>());
        }
        List<String> matched = new ArrayList<>();
        List<String> missing = new ArrayList<>();
        for (VacancyModel.LanguageEntry required : v.getRequiredLanguages()) {
            boolean found = false;
            if (c.getLanguages() != null) {
                for (CandidateProfileModel.LanguageEntry candidateLang : c.getLanguages()) {
                    if (candidateLang.getName().equalsIgnoreCase(required.getName())
                            && sameOrHigherLanguageLevel(candidateLang.getLevel(), required.getLevel())) {
                        matched.add(required.getName());
                        found = true;
                        break;
                    }
                }
            }
            if (!found) missing.add(required.getName());
        }
        double score = (double) matched.size() / v.getRequiredLanguages().size();
        return new SkillMatchResult(score, matched, missing);
    }

    // ---- Experiencia ----

    /**
     * Suma naïve de duraciones de todas las experiencias laborales (en años).
     * NO fusiona rangos solapados: para trabajos concurrentes el tiempo se cuenta
     * doble. Limitación aceptada (formulario manual pequeño), no es un bug.
     */
    private double calculateTotalYearsExperience(CandidateProfileModel c) {
        if (c.getWorkExperience() == null || c.getWorkExperience().isEmpty()) return 0.0;

        double totalDays = 0;
        LocalDate today = LocalDate.now();
        for (CandidateProfileModel.WorkExperience w : c.getWorkExperience()) {
            try {
                if (w.getStartDate() == null || w.getStartDate().isBlank()) continue;
                LocalDate start = LocalDate.parse(w.getStartDate());
                LocalDate end = w.isCurrent() || w.getEndDate() == null || w.getEndDate().isBlank()
                        ? today
                        : LocalDate.parse(w.getEndDate());
                if (end.isBefore(start)) continue; // dato inconsistente, se ignora
                totalDays += ChronoUnit.DAYS.between(start, end);
            } catch (DateTimeParseException ex) {
                // Fecha mal formada en un registro antiguo/manual: se ignora esa entrada.
            }
        }
        return totalDays / 365.25;
    }

    private double matchExperience(double candidateYears, VacancyModel v) {
        if (v.getMinExperienceYears() != null) {
            int required = v.getMinExperienceYears();
            if (required <= 0) return 1.0;
            return Math.min(1.0, candidateYears / required); // crédito parcial
        }

        // Compatibilidad con vacantes antiguas sin minExperienceYears: usar el campo string legado.
        if (v.getExperienceLevel() == null || "sin experiencia".equalsIgnoreCase(v.getExperienceLevel())) {
            return 1.0;
        }
        return candidateYears > 0 ? 1.0 : 0.3;
    }

    // ---- Salario ----

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

    // ---- Tipo de trabajo ----

    private double matchWorkType(CandidateProfileModel c, VacancyModel v) {
        if (c.getWorkType() == null || v.getWorkAvailability() == null) return 0.5;

        boolean remoteMatch = "remoto".equalsIgnoreCase(c.getWorkType()) ||
                              "presencial La Paz".equalsIgnoreCase(c.getWorkType());
        return remoteMatch ? 1.0 : 0.5;
    }

    // ---- Helpers de nivel ----

    private boolean sameOrHigherLevel(String candidateLevel, String requiredLevel) {
        List<String> order = List.of("BASICO", "INTERMEDIO", "AVANZADO", "EXPERTO");
        int cIdx = order.indexOf(candidateLevel != null ? candidateLevel.toUpperCase() : "");
        int rIdx = order.indexOf(requiredLevel  != null ? requiredLevel.toUpperCase()  : "");
        return cIdx >= rIdx && cIdx >= 0;
    }

    private boolean sameOrHigherLanguageLevel(String candidateLevel, String requiredLevel) {
        List<String> order = List.of("A1", "A2", "B1", "B2", "C1", "C2", "NATIVO");
        int cIdx = order.indexOf(candidateLevel != null ? candidateLevel.toUpperCase() : "");
        int rIdx = order.indexOf(requiredLevel  != null ? requiredLevel.toUpperCase()  : "");
        return cIdx >= rIdx && cIdx >= 0;
    }

    /** Resultado detallado de un criterio de coincidencia (score + nombres coincidentes/faltantes). */
    private record SkillMatchResult(double score, List<String> matched, List<String> missing) {}
}
