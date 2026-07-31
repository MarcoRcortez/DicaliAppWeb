package bo.edu.dicali.recruitment.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String password;
    /** CANDIDATE | RECRUITER | ADMIN */
    private String role;
}
