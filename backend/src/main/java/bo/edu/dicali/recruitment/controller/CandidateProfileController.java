package bo.edu.dicali.recruitment.controller;

import bo.edu.dicali.recruitment.model.CandidateProfileModel;
import bo.edu.dicali.recruitment.model.VacancyModel;
import bo.edu.dicali.recruitment.repository.CandidateProfileRepository;
import bo.edu.dicali.recruitment.repository.VacancyRepository;
import bo.edu.dicali.recruitment.service.MatchingEngine;
import bo.edu.dicali.recruitment.service.NormalizationService;
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
    private final NormalizationService normalizationService;

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
        normalizationService.normalize(profile);
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
