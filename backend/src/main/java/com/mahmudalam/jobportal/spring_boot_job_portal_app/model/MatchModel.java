package com.mahmudalam.jobportal.spring_boot_job_portal_app.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "matches")
public class MatchModel {

    @Id
    private String id;

    private String candidateId;
    private String vacancyId;
    private String recruiterId;
    private String companyName;

    private double score;

    /**
     * PENDING  - match calculado, empresa no actuó
     * MATCHED  - empresa hizo match con el candidato
     * REJECTED - empresa rechazó al candidato
     */
    private String status = "PENDING";

    /** Si el candidato ya fue notificado del MATCHED */
    private boolean candidateNotified = false;

    /**
     * El candidato se postuló activamente a esta vacante.
     * Es independiente de `status`: expresa interés, pero la empresa sigue siendo
     * quien confirma el match.
     */
    private boolean candidateApplied = false;
    private LocalDateTime appliedAt;

    private LocalDateTime calculatedAt;
    private LocalDateTime actionAt;

    /** Explicación del match en lenguaje natural (generada por LLM, on-demand). Nullable. */
    private String explanation;

    /** Momento en que se generó la explicación. Se considera vigente si >= calculatedAt. */
    private LocalDateTime explanationGeneratedAt;

    // Snapshot de la vacante para mostrar al candidato en SECTOR MATCHES
    private String jobTitle;
    private String department;
    private String description;
    private String experienceLevel;
    private String workAvailability;
    private double salaryMin;
    private double salaryMax;
}
