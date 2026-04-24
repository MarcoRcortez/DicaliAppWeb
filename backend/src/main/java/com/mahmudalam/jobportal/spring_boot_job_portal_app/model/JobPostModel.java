package com.mahmudalam.jobportal.spring_boot_job_portal_app.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Arrays;

/**
 * Modelo que representa una vacante de empleo en la plataforma DICALI.
 * Mapeado a la colección 'JobPosts' en MongoDB.
 */
@Document(collection = "JobPosts")
public class JobPostModel {

    @Id
    private String id;
    private String profile;      // Cargo (ej: Auditor Junior)
    private String desc;         // Descripción detallada
    private int exp;             // Años de experiencia mínima
    private String[] techs;      // Tecnologías/Habilidades (ej: Java, Contabilidad)
    private String whatsappLink; // Enlace directo para contacto
    private String nit;          // NIT de la empresa que publica (para auditoría)
    private String category;     // Categoría del empleo (Sistemas, Auditoría, etc.)

    // Constructor vacío requerido por Spring/MongoDB
    public JobPostModel() {
    }

    // Getters y Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getProfile() {
        return profile;
    }

    public void setProfile(String profile) {
        this.profile = profile;
    }

    public String getDesc() {
        return desc;
    }

    public void setDesc(String desc) {
        this.desc = desc;
    }

    public int getExp() {
        return exp;
    }

    public void setExp(int exp) {
        this.exp = exp;
    }

    public String[] getTechs() {
        return techs;
    }

    public void setTechs(String[] techs) {
        this.techs = techs;
    }

    public String getWhatsappLink() {
        return whatsappLink;
    }

    public void setWhatsappLink(String whatsappLink) {
        this.whatsappLink = whatsappLink;
    }

    public String getNit() {
        return nit;
    }

    public void setNit(String nit) {
        this.nit = nit;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    @Override
    public String toString() {
        return "JobPostModel{" +
                "id='" + id + '\'' +
                ", profile='" + profile + '\'' +
                ", category='" + category + '\'' +
                ", nit='" + nit + '\'' +
                ", techs=" + Arrays.toString(techs) +
                '}';
    }
}