package com.mahmudalam.jobportal.spring_boot_job_portal_app.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@Document(collection = "vacancies")
public class VacancyModel {

    @Id
    private String id;

    private String recruiterId;
    private String companyProfileId;

    // Datos heredados de MI EMPRESA (solo lectura en RECLUTAR)
    private String companyName;
    private String companyDescription;
    private String companyPhone1;
    private String companyPhone2;

    private String jobTitle;
    private String department;

    /** Máximo 20 palabras */
    private String description;

    private List<SkillTag> requiredTechnicalSkills;
    private List<String> desiredSoftSkills;

    /** Idiomas requeridos (mismo formato que CandidateProfileModel.LanguageEntry) */
    private List<LanguageEntry> requiredLanguages;

    /** Certificaciones deseadas (informativas, no puntúan en el matching) */
    private List<String> desiredCertifications;

    /** "con experiencia" | "sin experiencia" (etiqueta gruesa, se mantiene para UI) */
    private String experienceLevel;

    /** Años mínimos de experiencia requeridos. Nullable: null = sin requisito numérico. */
    private Integer minExperienceYears;

    private SalaryRange salaryRange;

    /** "medio tiempo" | "tiempo completo" */
    private String workAvailability;

    private LocalDate closingDate;

    /** "Abierta" | "Cerrada" */
    private String status;

    private LocalDateTime createdAt;

    @Data
    @NoArgsConstructor
    public static class SkillTag {
        private String name;
        private String level;
    }

    @Data
    @NoArgsConstructor
    public static class LanguageEntry {
        private String name;
        /** A1 | A2 | B1 | B2 | C1 | C2 | Nativo */
        private String level;
    }

    @Data
    @NoArgsConstructor
    public static class SalaryRange {
        private double min;
        private double max;
    }
}
