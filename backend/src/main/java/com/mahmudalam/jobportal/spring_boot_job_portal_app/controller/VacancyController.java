package com.mahmudalam.jobportal.spring_boot_job_portal_app.controller;

import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.*;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.repository.*;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.service.MatchingEngine;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vacancies")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class VacancyController {

    private final VacancyRepository vacancyRepository;
    private final CompanyProfileRepository companyProfileRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final MatchingEngine matchingEngine;

    /** Vacantes públicas (EMPLEOS page - candidatos) */
    @GetMapping("/public/open")
    public List<VacancyModel> getOpenVacancies() {
        return vacancyRepository.findByStatus("Abierta");
    }

    /** Todas las vacantes de un reclutador */
    @GetMapping("/my/{recruiterId}")
    public List<VacancyModel> getMyVacancies(@PathVariable String recruiterId) {
        return vacancyRepository.findByRecruiterId(recruiterId);
    }

    /** Detalle de una vacante */
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        return vacancyRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** GUARDA Y RECLUTAR: crea vacante y lanza matching automático */
    @PostMapping
    public ResponseEntity<?> createVacancy(@RequestBody VacancyModel vacancy) {
        try {
            // Validar que la empresa existe
            if (!companyProfileRepository.existsByUserId(vacancy.getRecruiterId())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "EMPRESA NO REGISTRADA, Por favor ingrese primero a Mi EMPRESA para registrar sus datos."));
            }

            vacancy.setCreatedAt(LocalDateTime.now());
            if (vacancy.getStatus() == null) vacancy.setStatus("Abierta");

            VacancyModel saved = vacancyRepository.save(vacancy);

            // Matching automático contra todos los candidatos completos
            List<CandidateProfileModel> candidates = candidateProfileRepository.findByProfileCompleteTrue();
            matchingEngine.runForVacancy(saved, candidates);

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** GUARDAR Y SALIR: guarda sin publicar todavía */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateVacancy(@PathVariable String id, @RequestBody VacancyModel vacancy) {
        return vacancyRepository.findById(id)
                .map(existing -> {
                    vacancy.setId(id);
                    return ResponseEntity.ok(vacancyRepository.save(vacancy));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /** BORRAR vacante */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVacancy(@PathVariable String id) {
        vacancyRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Vacante eliminada."));
    }

    /** Verificar si empresa tiene perfil completo (para botón RECLUTAR) */
    @GetMapping("/company-check/{recruiterId}")
    public ResponseEntity<?> checkCompanyProfile(@PathVariable String recruiterId) {
        boolean exists = companyProfileRepository.existsByUserId(recruiterId);
        return ResponseEntity.ok(Map.of("registered", exists));
    }

    /** Revisar vacantes vencidas y eliminarlas automáticamente */
    @PostMapping("/cleanup")
    public ResponseEntity<?> cleanupExpired() {
        List<VacancyModel> all = vacancyRepository.findByStatusNot("ELIMINADA");
        int removed = 0;
        for (VacancyModel v : all) {
            if (v.getClosingDate() != null && !v.getClosingDate().isAfter(LocalDate.now())) {
                vacancyRepository.deleteById(v.getId());
                removed++;
            }
        }
        return ResponseEntity.ok(Map.of("removed", removed));
    }
}
