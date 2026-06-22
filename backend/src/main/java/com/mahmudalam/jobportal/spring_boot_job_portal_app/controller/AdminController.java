package com.mahmudalam.jobportal.spring_boot_job_portal_app.controller;

import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.*;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final CompanyProfileRepository companyProfileRepository;
    private final VacancyRepository vacancyRepository;
    private final MatchRepository matchRepository;

    // ─── ESTADÍSTICAS PARA DASHBOARD ───────────────────────────────────────────

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        long totalUsers      = userRepository.count();
        long candidates      = userRepository.countByRole("CANDIDATE");
        long recruiters      = userRepository.countByRole("RECRUITER");
        long admins          = userRepository.countByRole("ADMIN");
        long openVacancies   = vacancyRepository.findByStatus("Abierta").size();
        long closedVacancies = vacancyRepository.findByStatus("Cerrada").size();
        long totalMatches    = matchRepository.count();
        long confirmedMatches= matchRepository.countByStatus("MATCHED");

        return ResponseEntity.ok(Map.of(
            "totalUsers",       totalUsers,
            "candidates",       candidates,
            "recruiters",       recruiters,
            "admins",           admins,
            "openVacancies",    openVacancies,
            "closedVacancies",  closedVacancies,
            "totalMatches",     totalMatches,
            "confirmedMatches", confirmedMatches
        ));
    }

    // ─── GESTIÓN DE USUARIOS ────────────────────────────────────────────────────

    @GetMapping("/users")
    public List<UserModel> getAllUsers() {
        return userRepository.findAll();
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody UserModel user) {
        return userRepository.findById(id)
                .map(existing -> {
                    user.setId(id);
                    user.setPassword(existing.getPassword()); // no sobrescribir contraseña
                    return ResponseEntity.ok(userRepository.save(user));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Usuario eliminado."));
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody UserModel user) {
        return ResponseEntity.ok(userRepository.save(user));
    }

    // ─── GESTIÓN DE VACANTES ────────────────────────────────────────────────────

    @GetMapping("/vacancies")
    public List<VacancyModel> getAllVacancies() {
        return vacancyRepository.findAll();
    }

    @PutMapping("/vacancies/{id}")
    public ResponseEntity<?> updateVacancy(@PathVariable String id, @RequestBody VacancyModel vacancy) {
        vacancy.setId(id);
        return ResponseEntity.ok(vacancyRepository.save(vacancy));
    }

    @DeleteMapping("/vacancies/{id}")
    public ResponseEntity<?> deleteVacancy(@PathVariable String id) {
        vacancyRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Vacante eliminada."));
    }

    // ─── GESTIÓN DE CURRÍCULOS ──────────────────────────────────────────────────

    @GetMapping("/profiles")
    public List<CandidateProfileModel> getAllProfiles() {
        return candidateProfileRepository.findAll();
    }

    @PutMapping("/profiles/{id}")
    public ResponseEntity<?> updateProfile(@PathVariable String id, @RequestBody CandidateProfileModel profile) {
        profile.setId(id);
        return ResponseEntity.ok(candidateProfileRepository.save(profile));
    }

    @DeleteMapping("/profiles/{id}")
    public ResponseEntity<?> deleteProfile(@PathVariable String id) {
        candidateProfileRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Currículo eliminado."));
    }

    // ─── GESTIÓN DE EMPRESAS ────────────────────────────────────────────────────

    @GetMapping("/companies")
    public List<CompanyProfileModel> getAllCompanies() {
        return companyProfileRepository.findAll();
    }

    @DeleteMapping("/companies/{id}")
    public ResponseEntity<?> deleteCompany(@PathVariable String id) {
        companyProfileRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Empresa eliminada."));
    }
}
