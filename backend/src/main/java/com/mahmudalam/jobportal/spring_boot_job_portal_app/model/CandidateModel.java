package com.mahmudalam.jobportal.spring_boot_job_portal_app.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "Candidates")
public class CandidateModel {

    @Id
    private String id;

    private String fullName; // Sincronizado con frontend

    @Indexed(unique = true)
    private String email;

    private String education;

    private int experienceYears;

    private String[] skills;

    private String whatsapp; // Sincronizado con frontend

    public CandidateModel() {}

    // Getters y Setters corregidos
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getEducation() { return education; }
    public void setEducation(String education) { this.education = education; }

    public int getExperienceYears() { return experienceYears; }
    public void setExperienceYears(int experienceYears) { this.experienceYears = experienceYears; }

    public String[] getSkills() { return skills; }
    public void setSkills(String[] skills) { this.skills = skills; }

    public String getWhatsapp() { return whatsapp; }
    public void setWhatsapp(String whatsapp) { this.whatsapp = whatsapp; }
}