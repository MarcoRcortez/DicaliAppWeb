package com.mahmudalam.jobportal.spring_boot_job_portal_app.controller;

import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.CandidateMatchDTO;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.CandidateModel;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.repository.CandidateRepository;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.repository.JobRepository;
import com.mahmudalam.jobportal.spring_boot_job_portal_app.service.MatchingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/candidates")
@CrossOrigin(origins = "http://localhost:5173") // Permite la conexión desde tu frontend React
public class CandidateController {

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private MatchingService matchingService;

    // 1. REGISTRAR TALENTO (POST)
    @PostMapping("/register")
    public ResponseEntity<?> registerCandidate(@RequestBody CandidateModel candidate) {
        try {
            // Verificamos si el correo ya existe en MongoDB
            if (candidateRepository.findByEmail(candidate.getEmail()).isPresent()) {
                return ResponseEntity.badRequest().body("Error: El correo electrónico ya está registrado.");
            }
            
            // Guardamos el nuevo candidato
            CandidateModel savedCandidate = candidateRepository.save(candidate);
            return ResponseEntity.ok(savedCandidate);
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error en el servidor: " + e.getMessage());
        }
    }

    // 2. OBTENER TODOS LOS CANDIDATOS (GET)
    // Esto es lo que verás en http://localhost:8080/api/candidates/all
    @GetMapping("/all")
    public List<CandidateModel> getAllCandidates() {
        return candidateRepository.findAll();
    }

    // 3. BUSCAR POR EMAIL (GET)
    @GetMapping("/profile/{email}")
    public ResponseEntity<?> getCandidateByEmail(@PathVariable String email) {
        return candidateRepository.findByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 4. COMPATIBILIDAD CANDIDATO-VACANTE (GET)
    // Usado por CandidateMatching.jsx: compara a todos los candidatos contra una vacante.
    @GetMapping("/match/{jobId}")
    public ResponseEntity<?> matchCandidates(@PathVariable @NonNull String jobId) {
        return jobRepository.findById(jobId)
                .map(job -> {
                    List<CandidateMatchDTO> matches = candidateRepository.findAll().stream()
                            .map(candidate -> new CandidateMatchDTO(candidate, matchingService.calculateMatchScore(candidate, job)))
                            .sorted(Comparator.comparingDouble(CandidateMatchDTO::getMatchPercentage).reversed())
                            .toList();
                    return ResponseEntity.ok(matches);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}