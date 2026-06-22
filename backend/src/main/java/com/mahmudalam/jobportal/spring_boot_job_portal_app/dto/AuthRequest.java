package com.mahmudalam.jobportal.spring_boot_job_portal_app.dto;

import lombok.Data;

@Data
public class AuthRequest {
    private String email;
    private String password;
}
