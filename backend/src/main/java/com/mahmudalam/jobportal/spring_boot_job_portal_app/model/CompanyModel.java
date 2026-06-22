package com.mahmudalam.jobportal.spring_boot_job_portal_app.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "companies")
public class CompanyModel {

    @Id
    private String id; // ID de MongoDB
    private String companyName;
    private String nit;
    private String city;
    private String status;
    private String representativeName; // Añadido para el Dashboard
    private boolean verified; // Corregido para CompanyController

    public CompanyModel() {}

    // Getters y Setters Manuales (Sin Lombok para evitar errores)
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getNit() { return nit; }
    public void setNit(String nit) { this.nit = nit; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRepresentativeName() { return representativeName; }
    public void setRepresentativeName(String representativeName) { this.representativeName = representativeName; }

    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }
}