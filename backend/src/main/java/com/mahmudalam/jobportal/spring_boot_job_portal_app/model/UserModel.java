package com.mahmudalam.jobportal.spring_boot_job_portal_app.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class UserModel {

    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    private String password;

    /** CANDIDATE | RECRUITER | ADMIN */
    private String role;

    private String securityQuestion;

    /** Guardado con BCrypt */
    private String securityAnswer;

    /** Si ya configuró su pregunta secreta */
    private boolean securityConfigured = false;

    private boolean active = true;
}
