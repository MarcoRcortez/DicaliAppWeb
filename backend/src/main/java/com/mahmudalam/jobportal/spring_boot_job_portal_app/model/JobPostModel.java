package com.mahmudalam.jobportal.spring_boot_job_portal_app.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Arrays;

/**
 * Modelo que representa una vacante de empleo en la plataforma DICALI.
 * Mapeado a la colección 'JobPosts' en MongoDB.
 *
 * Soporta dos flujos de creación usados por el frontend:
 *  - Publicación simple (PostJob.jsx): title/companyName/city/salary/category/description.
 *  - Publicación auditada con NIT verificado (CreatePost.jsx): profile/desc/exp/techs/whatsappLink/nit.
 * Ambos conjuntos de campos conviven en el mismo documento (todos opcionales) para no perder
 * ninguno de los dos flujos ya implementados en el frontend.
 */
@Document(collection = "JobPosts")
public class JobPostModel {

    @Id
    private String id;

    // Campos del flujo simple (PostJob.jsx / Feed.jsx / JobBoard.jsx / AdminJobs.jsx)
    private String title;        // Título del puesto (ej: Desarrollador Flutter)
    private String companyName;  // Nombre de la empresa que publica
    private String city;         // Ciudad de la vacante
    private double salary;       // Sueldo ofrecido
    private String description;  // Descripción de la vacante

    // Campos del flujo auditado (CreatePost.jsx / MatchingService)
    private String profile;      // Cargo (ej: Auditor Junior)
    private String desc;         // Descripción detallada
    private int exp;             // Años de experiencia mínima
    private String[] techs;      // Tecnologías/Habilidades (ej: Java, Contabilidad)
    private String whatsappLink; // Enlace directo para contacto
    private String nit;          // NIT de la empresa que publica (para auditoría)

    // Campo compartido por ambos flujos
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public double getSalary() {
        return salary;
    }

    public void setSalary(double salary) {
        this.salary = salary;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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
                ", title='" + title + '\'' +
                ", companyName='" + companyName + '\'' +
                ", profile='" + profile + '\'' +
                ", category='" + category + '\'' +
                ", nit='" + nit + '\'' +
                ", techs=" + Arrays.toString(techs) +
                '}';
    }
}
