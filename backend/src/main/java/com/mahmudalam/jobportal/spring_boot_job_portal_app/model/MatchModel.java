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

    private LocalDateTime calculatedAt;
    private LocalDateTime actionAt;

    // Snapshot de la vacante para mostrar al candidato en SECTOR MATCHES
    private String jobTitle;
    private String department;
    private String description;
    private String experienceLevel;
    private String workAvailability;
    private double salaryMin;
    private double salaryMax;
}
