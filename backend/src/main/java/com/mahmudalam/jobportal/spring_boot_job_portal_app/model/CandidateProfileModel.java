package com.mahmudalam.jobportal.spring_boot_job_portal_app.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Data
@NoArgsConstructor
@Document(collection = "candidate_profiles")
public class CandidateProfileModel {

    @Id
    private String id;

    private String userId;
    private String fullName;
    private String email;
    private String phone;

    /** "La Paz" | "El Alto" */
    private String location;

    /** Fecha de nacimiento (yyyy-MM-dd) — entre 18 y 54 años */
    private String birthDate;

    /** Base64 WebP */
    private String photoBase64;

    private List<WorkExperience> workExperience;
    private List<EducationEntry> educations;
    private List<SkillTag> technicalSkills;
    private List<String> softSkills;
    private List<LanguageEntry> languages;
    private List<CertificationEntry> certifications;

    private SalaryRange expectedSalary;

    /** "inmediata" | "1 semana" | "15 días" | "1 mes" */
    private String availability;

    /** "tiempo completo" | "tiempo parcial" | "medio tiempo" */
    private String workSchedule;

    /** "presencial La Paz" | "remoto" */
    private String workType;

    private boolean profileComplete = false;

    // ---- Clases embebidas ----

    @Data
    @NoArgsConstructor
    public static class WorkExperience {
        private String title;
        private String company;
        private String startDate;
        private String endDate;
        private boolean current;
        private List<String> achievements;
    }

    @Data
    @NoArgsConstructor
    public static class EducationEntry {
        private String degree;
        private String institution;
        private String year;
    }

    @Data
    @NoArgsConstructor
    public static class SkillTag {
        private String name;
        /** BASICO | INTERMEDIO | AVANZADO | EXPERTO */
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
    public static class CertificationEntry {
        private String name;
        private String institution;
        private String year;
    }

    @Data
    @NoArgsConstructor
    public static class SalaryRange {
        private double min;
        private double max;
    }
}
