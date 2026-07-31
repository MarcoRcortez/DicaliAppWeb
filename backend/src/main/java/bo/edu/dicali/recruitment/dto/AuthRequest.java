package bo.edu.dicali.recruitment.dto;

import lombok.Data;

@Data
public class AuthRequest {
    private String email;
    private String password;
}
