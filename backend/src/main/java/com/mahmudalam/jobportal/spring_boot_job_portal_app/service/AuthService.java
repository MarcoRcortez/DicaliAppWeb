package com.mahmudalam.jobportal.spring_boot_job_portal_app.service;

import com.mahmudalam.jobportal.spring_boot_job_portal_app.dto.AuthRequest;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.dto.AuthResponse;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.dto.RegisterRequest;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.UserModel;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.repository.UserRepository;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("El correo ya está registrado.");
        }
        UserModel user = new UserModel();
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole(req.getRole());
        user.setSecurityConfigured(false);
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole(), user.getId());
        return new AuthResponse(token, user.getRole(), user.getId(), user.getEmail(), false);
    }

    public AuthResponse login(AuthRequest req) {
        UserModel user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Contraseña incorrecta.");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole(), user.getId());
        return new AuthResponse(token, user.getRole(), user.getId(), user.getEmail(), user.isSecurityConfigured());
    }

    public void configureSecurityQuestion(String userId, String question, String answer) {
        UserModel user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));
        user.setSecurityQuestion(question);
        user.setSecurityAnswer(passwordEncoder.encode(answer.toLowerCase().trim()));
        user.setSecurityConfigured(true);
        userRepository.save(user);
    }

    public String getSecurityQuestion(String email) {
        return userRepository.findByEmail(email)
                .map(UserModel::getSecurityQuestion)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));
    }

    public boolean verifySecurityAnswer(String email, String answer) {
        UserModel user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));
        return passwordEncoder.matches(answer.toLowerCase().trim(), user.getSecurityAnswer());
    }

    public void resetPassword(String email, String newPassword) {
        UserModel user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public Map<String, Object> getUserInfo(String userId) {
        UserModel user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));
        return Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "role", user.getRole(),
                "securityConfigured", user.isSecurityConfigured()
        );
    }
}
