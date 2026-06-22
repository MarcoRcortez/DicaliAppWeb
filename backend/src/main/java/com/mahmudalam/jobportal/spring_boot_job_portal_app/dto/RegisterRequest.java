package com.mahmudalam.jobportal.spring_boot_job_portal_app.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String password;
    /** CANDIDATE | RECRUITER | ADMIN */
    private String role;
}
