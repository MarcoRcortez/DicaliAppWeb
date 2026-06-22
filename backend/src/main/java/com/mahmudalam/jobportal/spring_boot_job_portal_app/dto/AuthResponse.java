package com.mahmudalam.jobportal.spring_boot_job_portal_app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String role;
    private String userId;
    private String email;
    private boolean securityConfigured;
}
