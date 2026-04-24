package com.mahmudalam.jobportal.spring_boot_job_portal_app.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Arrays;

/**
 * Modelo que representa a un Candidato/Talento dentro del sistema DICALI.
 * Incluye validaciones a nivel de base de datos para la integridad de la información.
 */
@Document(collection = "Candidates")
public class CandidateModel {

    @Id
    private String id;

    private String name;

    // La anotación @Indexed asegura que no existan dos candidatos con el mismo correo.
    // Muy importante para la seguridad y el acceso al perfil único.
    @Indexed(unique = true)
    private String email;

    private String education;

    private int experienceYears;

    private String[] skills;

    private String whatsappNumber;

    // Constructor vacío requerido por Spring/MongoDB
    public CandidateModel() {
    }

    // Constructor con parámetros para facilitar pruebas o instanciación rápida
    public CandidateModel(String name, String email, String education, int experienceYears, String[] skills, String whatsappNumber) {
        this.name = name;
        this.email = email;
        this.education = education;
        this.experienceYears = experienceYears;
        this.skills = skills;
        this.whatsappNumber = whatsappNumber;
    }

    // Getters y Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getEducation() {
        return education;
    }

    public void setEducation(String education) {
        this.education = education;
    }

    public int getExperienceYears() {
        return experienceYears;
    }

    public void setExperienceYears(int experienceYears) {
        this.experienceYears = experienceYears;
    }

    public String[] getSkills() {
        return skills;
    }

    public void setSkills(String[] skills) {
        this.skills = skills;
    }

    public String getWhatsappNumber() {
        return whatsappNumber;
    }

    public void setWhatsappNumber(String whatsappNumber) {
        this.whatsappNumber = whatsappNumber;
    }

    // Método toString útil para depuración en consola (Logs)
    @Override
    public String toString() {
        return "CandidateModel{" +
                "id='" + id + '\'' +
                ", name='" + name + '\'' +
                ", email='" + email + '\'' +
                ", skills=" + Arrays.toString(skills) +
                '}';
    }
}