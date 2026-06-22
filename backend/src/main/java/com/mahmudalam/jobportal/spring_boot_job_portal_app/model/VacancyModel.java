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

    /** "con experiencia" | "sin experiencia" */
    private String experienceLevel;

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
    public static class SalaryRange {
        private double min;
        private double max;
    }
}
