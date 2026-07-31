package bo.edu.dicali.recruitment.controller;

import bo.edu.dicali.recruitment.dto.AuthRequest;
import bo.edu.dicali.recruitment.dto.RegisterRequest;
import bo.edu.dicali.recruitment.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        try {
            return ResponseEntity.ok(authService.register(req));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest req) {
        try {
            return ResponseEntity.ok(authService.login(req));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/security-question")
    public ResponseEntity<?> configureSecurityQuestion(@RequestBody Map<String, String> body) {
        try {
            authService.configureSecurityQuestion(
                    body.get("userId"),
                    body.get("question"),
                    body.get("answer")
            );
            return ResponseEntity.ok(Map.of("message", "Pregunta secreta configurada correctamente."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/security-question/{email}")
    public ResponseEntity<?> getSecurityQuestion(@PathVariable String email) {
        try {
            return ResponseEntity.ok(Map.of("question", authService.getSecurityQuestion(email)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/verify-answer")
    public ResponseEntity<?> verifyAnswer(@RequestBody Map<String, String> body) {
        boolean valid = authService.verifySecurityAnswer(body.get("email"), body.get("answer"));
        return ResponseEntity.ok(Map.of("valid", valid));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        try {
            authService.resetPassword(body.get("email"), body.get("newPassword"));
            return ResponseEntity.ok(Map.of("message", "Contraseña actualizada correctamente."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/me/{userId}")
    public ResponseEntity<?> getMe(@PathVariable String userId) {
        try {
            return ResponseEntity.ok(authService.getUserInfo(userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
