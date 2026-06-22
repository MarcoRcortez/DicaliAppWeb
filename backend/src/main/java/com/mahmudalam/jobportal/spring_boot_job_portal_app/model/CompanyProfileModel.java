package com.mahmudalam.jobportal.spring_boot_job_portal_app.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@Document(collection = "company_profiles")
public class CompanyProfileModel {

    @Id
    private String id;

    private String userId;
    private String companyName;

    /** Máximo 20 palabras */
    private String description;

    private String phone1;
    private String phone2;
    private String address;
    private String email;

    /** Coordenadas para el minimapa */
    private double latitude;
    private double longitude;

    private boolean profileComplete = false;
}
