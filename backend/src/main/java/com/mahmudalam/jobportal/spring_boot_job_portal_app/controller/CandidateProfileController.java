package com.mahmudalam.jobportal.spring_boot_job_portal_app.controller;

import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.CandidateProfileModel;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.VacancyModel;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.repository.CandidateProfileRepository;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.repository.VacancyRepository;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.service.MatchingEngine;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/candidate-profiles")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class CandidateProfileController {

    private final CandidateProfileRepository profileRepository;
    private final VacancyRepository vacancyRepository;
    private final MatchingEngine matchingEngine;

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getByUserId(@PathVariable String userId) {
        return profileRepository.findByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/all")
    public List<CandidateProfileModel> getAll() {
        return profileRepository.findAll();
    }

    /** GUARDAR Y POSTULAR o GUARDAR Y SALIR */
    @PostMapping
    public ResponseEntity<?> save(@RequestBody CandidateProfileModel profile) {
        CandidateProfileModel existing = profileRepository.findByUserId(profile.getUserId()).orElse(null);
        if (existing != null) {
            profile.setId(existing.getId());
        }
        CandidateProfileModel saved = profileRepository.save(profile);

        // Si el perfil está completo, lanzar matching automático
        if (Boolean.TRUE.equals(saved.isProfileComplete())) {
            List<VacancyModel> open = vacancyRepository.findByStatus("Abierta");
            matchingEngine.runForCandidate(saved, open);
        }
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/user/{userId}")
    public ResponseEntity<?> deleteByUserId(@PathVariable String userId) {
        profileRepository.findByUserId(userId).ifPresent(p -> {
            if (p.getId() != null) profileRepository.deleteById(p.getId());
        });
        return ResponseEntity.ok(Map.of("message", "Perfil eliminado."));
    }
}
