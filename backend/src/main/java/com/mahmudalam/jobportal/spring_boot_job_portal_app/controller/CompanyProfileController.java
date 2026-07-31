package com.mahmudalam.jobportal.spring_boot_job_portal_app.controller;

import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.CompanyProfileModel;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.repository.CompanyProfileRepository;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.service.NormalizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/company-profiles")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class CompanyProfileController {

    private final CompanyProfileRepository profileRepository;
    private final NormalizationService normalizationService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getByUserId(@PathVariable String userId) {
        return profileRepository.findByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/all")
    public List<CompanyProfileModel> getAll() {
        return profileRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> save(@RequestBody CompanyProfileModel profile) {
        profileRepository.findByUserId(profile.getUserId()).ifPresent(e -> {
            if (e.getId() != null) profile.setId(e.getId());
        });
        normalizationService.normalize(profile);
        return ResponseEntity.ok(profileRepository.save(profile));
    }

    @DeleteMapping("/user/{userId}")
    public ResponseEntity<?> deleteByUserId(@PathVariable String userId) {
        profileRepository.findByUserId(userId).ifPresent(p -> {
            if (p.getId() != null) profileRepository.deleteById(p.getId());
        });
        return ResponseEntity.ok(Map.of("message", "Perfil de empresa eliminado."));
    }
}
